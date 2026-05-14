import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePostHog } from 'posthog-react-native'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import {
  groupChats,
  inboxThreads,
  SignInCallout,
  type GroupChatThread,
  type InboxThread,
} from '../../components/boards'
import {
  ConnectHeader,
  NativeChatHeader,
  MessagesWorkspace,
  ConversationThread,
  type Conversation,
} from '../../components/chat'

function dmToConversation(thread: InboxThread): Conversation {
  return {
    id: `dm-${thread.id}`,
    type: 'dm',
    title: thread.person.name,
    subtitle: thread.connectedSince,
    preview: thread.preview,
    lastActiveLabel: thread.lastActiveLabel,
    unread: thread.unread,
    avatarName: thread.person.name,
    avatarInitials: thread.person.initials,
    avatarColor: thread.person.accentColor,
    messages: thread.messages,
  }
}

function mockGroupChatToConversation(chat: GroupChatThread): Conversation {
  return {
    id: `groupchat-${chat.id}`,
    type: 'group',
    title: chat.title,
    subtitle: `${chat.kind === 'event' ? 'Event chat' : 'Center chat'} · ${chat.memberCount} members`,
    preview: chat.preview,
    lastActiveLabel: chat.lastActiveLabel,
    unread: chat.unreadCount > 0,
    groupKind: chat.kind,
    groupMembers: chat.members,
    messages: chat.messages.map((message) => ({
      id: message.id,
      sender: message.sender,
      timestamp: message.timestamp,
      body: message.body,
      authorName: message.authorName,
    })),
  }
}

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase().trim())
}

export default function ChatScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { user } = useUser()
  const colors = useColors()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const posthog = usePostHog()
  const detailTranslateX = useRef(new Animated.Value(width)).current

  const isDesktop = width >= 980
  const [query, setQuery] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState('')

  const canAccessBoards = !!user
  const conversations = useMemo(() => {
    const mockGroupConversations = canAccessBoards
      ? groupChats.map(mockGroupChatToConversation)
      : []
    const dmConversations = inboxThreads.map(dmToConversation)
    return [...mockGroupConversations, ...dmConversations]
  }, [canAccessBoards])

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    return conversations.filter(
      (conversation) =>
        matchesQuery(conversation.title, query) ||
        matchesQuery(conversation.preview, query) ||
        matchesQuery(conversation.subtitle, query)
    )
  }, [conversations, query])

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ??
    conversations[0]
  const mobileConversationOpen = !isDesktop && !!selectedConversationId
  const nativeDetailOpen = Platform.OS !== 'web' && mobileConversationOpen
  const listTopPadding = Platform.OS === 'web' ? 20 : 8
  const nativeTabBarStyle = {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 84,
    paddingTop: 8,
    paddingBottom: 18,
  }

  useEffect(() => {
    if (Platform.OS === 'web') return

    navigation.setOptions({
      tabBarStyle: nativeDetailOpen ? { display: 'none' } : nativeTabBarStyle,
    })

    return () => {
      navigation.setOptions({ tabBarStyle: nativeTabBarStyle })
    }
  }, [navigation, nativeDetailOpen, nativeTabBarStyle])

  useEffect(() => {
    if (Platform.OS === 'web') return

    if (!nativeDetailOpen) {
      detailTranslateX.setValue(width)
      return
    }

    Animated.timing(detailTranslateX, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [detailTranslateX, nativeDetailOpen, width])

  const primeNativeDetailTransition = () => {
    if (Platform.OS !== 'web' && !isDesktop) {
      detailTranslateX.stopAnimation()
      detailTranslateX.setValue(width)
    }
  }

  const clearDetailSelection = () => {
    setSelectedConversationId('')
  }

  const closeDetail = () => {
    if (Platform.OS !== 'web' && nativeDetailOpen) {
      detailTranslateX.stopAnimation()
      Animated.timing(detailTranslateX, {
        toValue: width,
        duration: 230,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          clearDetailSelection()
        }
      })
      return
    }

    clearDetailSelection()
  }

  const openConversation = (id: string) => {
    posthog?.capture('connect_conversation_selected', { conversationId: id })
    if (Platform.OS === 'web' && isDesktop) {
      primeNativeDetailTransition()
      setSelectedConversationId(id)
    } else {
      router.push(`/chat/${id}`)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: isDesktop ? 1180 : 640,
          alignSelf: 'center',
          paddingHorizontal: isDesktop ? 24 : 16,
          paddingTop: listTopPadding,
          paddingBottom: Platform.OS === 'web' ? 40 : 112,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ConnectHeader
          query={query}
          colors={colors}
          mobileInDetail={mobileConversationOpen && !nativeDetailOpen}
          onBack={closeDetail}
          onChangeQuery={setQuery}
        />

        {!user ? (
          <SignInCallout
            title="Sign in for Connect"
            subtitle="Your group chats, requests, and DMs live here."
            colors={colors}
            onPress={() => {
              posthog?.capture('connect_signin_pressed')
              router.push('/auth')
            }}
          />
        ) : null}

        <MessagesWorkspace
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          colors={colors}
          isDesktop={isDesktop}
          nativeDetailOpen={nativeDetailOpen}
          mobileConversationOpen={mobileConversationOpen}
          onSelectConversation={openConversation}
        />
      </ScrollView>

      {nativeDetailOpen ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: colors.surface,
            transform: [{ translateX: detailTranslateX }],
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, backgroundColor: colors.surface }}
          >
            <NativeChatHeader
              colors={colors}
              insetsTop={insets.top}
              title={selectedConversation ? selectedConversation.title : 'Chat'}
              subtitle={selectedConversation?.subtitle}
              avatarName={selectedConversation?.avatarName}
              avatarInitials={selectedConversation?.avatarInitials}
              avatarColor={selectedConversation?.avatarColor}
              groupMembers={selectedConversation?.groupMembers}
              groupKind={selectedConversation?.groupKind}
              hideAvatar={!mobileConversationOpen}
              onBack={closeDetail}
            />
            <View style={{ flex: 1 }}>
              {selectedConversation ? (
                <ConversationThread
                  conversation={selectedConversation}
                  colors={colors}
                  fullScreen
                  bottomInset={insets.bottom}
                />
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}
    </View>
  )
}

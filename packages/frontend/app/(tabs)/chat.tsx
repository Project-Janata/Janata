import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { Avatar } from '../../components/ui'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import type { AppColors } from '../../tokens'
import { useCenterDetail, useDiscoverData, useMyEvents } from '../../hooks/useApiData'
import { extractCityState } from '../../utils/addressParsing'
import {
  ThreadPanel,
  buildCenterBoard,
  buildEventBoard,
  centerBoards,
  connectionRequests,
  eventBoards,
  groupChats,
  inboxThreads,
  EmptyPanel,
  SignInCallout,
  type BoardMessage,
  type CenterBoard,
  type EventBoard,
  type GroupChatThread,
  type InboxThread,
  type PersonSummary,
  type ThreadPanelColors,
  type GroupKind,
} from '../../components/connect'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'

type ChatMessage = {
  id: string
  sender: 'them' | 'you'
  timestamp: string
  body: string
  authorName?: string
}

type Conversation = {
  id: string
  type: 'group' | 'dm'
  title: string
  subtitle: string
  preview: string
  lastActiveLabel: string
  unread: boolean
  groupKind?: GroupKind
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  messages: ChatMessage[]
}

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

function MessagesWorkspace({
  conversations,
  selectedConversation,
  colors,
  isDesktop,
  nativeDetailOpen,
  mobileConversationOpen,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversation?: Conversation
  colors: AppColors
  isDesktop: boolean
  nativeDetailOpen: boolean
  mobileConversationOpen: boolean
  onSelectConversation: (id: string) => void
}) {
  if (isDesktop) {
    return (
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ width: 360 }}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            colors={colors}
            onSelectConversation={onSelectConversation}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {selectedConversation ? (
            <ConversationThread conversation={selectedConversation} colors={colors} />
          ) : (
            <EmptyPanel
              title="No messages found"
              subtitle="Try a different search."
              colors={colors}
            />
          )}
        </View>
      </View>
    )
  }

  if (mobileConversationOpen && !nativeDetailOpen && selectedConversation) {
    return <ConversationThread conversation={selectedConversation} colors={colors} />
  }

  return (
    <View style={{ gap: 14 }}>
      <RequestsBanner colors={colors} />
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        colors={colors}
        onSelectConversation={onSelectConversation}
      />
    </View>
  )
}

function NativeChatHeader({
  colors,
  insetsTop,
  title,
  subtitle,
  avatarName,
  avatarInitials,
  avatarColor,
  groupMembers,
  groupKind,
  hideAvatar,
  onBack,
}: {
  colors: AppColors
  insetsTop: number
  title: string
  subtitle?: string
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  groupKind?: GroupKind
  hideAvatar?: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        paddingTop: insetsTop + 6,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{
            width: 82,
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowLeft size={21} color={colors.accent} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.accent }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {hideAvatar ? null : groupMembers && groupMembers.length > 0 ? (
            <GroupConversationAvatar members={groupMembers} size={36} colors={colors} />
          ) : groupKind ? (
            <GroupIcon kind={groupKind} colors={colors} active />
          ) : (
            <Avatar
              name={avatarName || title}
              initials={avatarInitials}
              size={34}
              backgroundColor={avatarColor}
            />
          )}
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textFaint }}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 82 }} />
      </View>
    </View>
  )
}

function ConnectHeader({
  query,
  colors,
  mobileInDetail,
  onBack,
  onChangeQuery,
}: {
  query: string
  colors: AppColors
  mobileInDetail: boolean
  onBack: () => void
  onChangeQuery: (query: string) => void
}) {
  if (mobileInDetail) {
    return (
      <Pressable
        onPress={onBack}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          paddingVertical: 4,
        }}
      >
        <ArrowLeft size={18} color={colors.textMuted} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.textMuted }}>
          Back
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <View
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 14,
            backgroundColor: colors.panel,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={17} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search messages"
            placeholderTextColor={colors.textFaint}
            style={{
              flex: 1,
              fontFamily: 'Inclusive Sans',
              fontSize: 15,
              color: colors.text,
              paddingVertical: 9,
            }}
          />
        </View>
      </View>
    </View>
  )
}

function ConversationList({
  conversations,
  selectedConversationId,
  colors,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversationId?: string
  colors: AppColors
  onSelectConversation: (id: string) => void
}) {
  return (
    <View style={{ gap: 2 }}>
      {conversations.length === 0 ? (
        <EmptyPanel title="No messages found" subtitle="Try a different search." colors={colors} />
      ) : null}
      {conversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          onPress={() => onSelectConversation(conversation.id)}
          style={{
            paddingHorizontal: 4,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor:
              conversation.id === selectedConversationId ? colors.cardActive : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            {conversation.type === 'group' && conversation.groupMembers ? (
              <GroupConversationAvatar
                members={conversation.groupMembers}
                size={44}
                colors={colors}
              />
            ) : (
              <Avatar
                name={conversation.avatarName || conversation.title}
                initials={conversation.avatarInitials}
                size={42}
                backgroundColor={conversation.avatarColor}
              />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    minWidth: 0,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Text
                    style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}
                    numberOfLines={1}
                  >
                    {conversation.title}
                  </Text>
                  {conversation.type === 'group' && conversation.groupMembers ? (
                    <Text
                      style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textFaint }}
                    >
                      - {conversation.groupMembers.length}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 12,
                    color: conversation.unread ? colors.accent : colors.textFaint,
                  }}
                >
                  {conversation.lastActiveLabel}
                </Text>
              </View>
              <Text
                style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textFaint }}
                numberOfLines={1}
              >
                {conversation.subtitle}
              </Text>
              <Text
                style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}
                numberOfLines={1}
              >
                {conversation.preview}
              </Text>
            </View>
            {conversation.unread ? (
              <View
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }}
              />
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  )
}

function ConversationThread({
  conversation,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  conversation: Conversation
  colors: AppColors
  fullScreen?: boolean
  bottomInset?: number
}) {
  const messages = conversation.messages.map((message, index) => {
    const previous = conversation.messages[index - 1]
    const next = conversation.messages[index + 1]

    return (
      <MessageBubble
        key={message.id}
        message={message}
        previousSender={previous?.sender}
        nextSender={next?.sender}
        colors={colors}
        showAuthor={conversation.type === 'group'}
      />
    )
  })

  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        backgroundColor: fullScreen ? colors.bg : 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: fullScreen ? 0 : 22,
        overflow: fullScreen ? 'visible' : 'hidden',
      }}
    >
      {!fullScreen ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {conversation.type === 'group' && conversation.groupMembers ? (
            <GroupConversationAvatar
              members={conversation.groupMembers}
              size={44}
              colors={colors}
            />
          ) : (
            <Avatar
              name={conversation.avatarName || conversation.title}
              initials={conversation.avatarInitials}
              size={44}
              backgroundColor={conversation.avatarColor}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, color: colors.text }}>
              {conversation.title}
            </Text>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
              {conversation.subtitle}
            </Text>
          </View>
        </View>
      ) : null}

      {fullScreen ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingTop: 16,
              paddingBottom: 18,
              gap: 6,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages}
          </ScrollView>
          <ChatComposer
            colors={colors}
            bottomInset={bottomInset}
            placeholder={
              conversation.type === 'group'
                ? 'Message group'
                : `Message ${conversation.title.split(' ')[0]}`
            }
          />
        </>
      ) : (
        <>
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 6 }}>
            {messages}
          </View>
          <ChatComposer
            colors={colors}
            bottomInset={0}
            placeholder={conversation.type === 'group' ? 'Message group' : 'Write a message...'}
            compact
          />
        </>
      )}
    </View>
  )
}

function MessageBubble({
  message,
  previousSender,
  nextSender,
  colors,
  showAuthor,
}: {
  message: ChatMessage
  previousSender?: 'them' | 'you'
  nextSender?: 'them' | 'you'
  colors: AppColors
  showAuthor?: boolean
}) {
  const isYou = message.sender === 'you'
  const isFirstInRun = previousSender !== message.sender
  const isLastInRun = nextSender !== message.sender
  const incomingBubble = colors.card

  return (
    <View style={{ gap: 4, marginTop: isFirstInRun ? 8 : 0 }}>
      {isFirstInRun ? (
        <Text
          style={{
            alignSelf: isYou ? 'flex-end' : 'flex-start',
            paddingHorizontal: 8,
            fontFamily: 'Inclusive Sans',
            fontSize: 11,
            color: colors.textFaint,
          }}
        >
          {showAuthor && !isYou && message.authorName
            ? `${message.authorName} · ${message.timestamp}`
            : message.timestamp}
        </Text>
      ) : null}
      <View
        style={{
          alignSelf: isYou ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isYou ? colors.accentSoft : incomingBubble,
          borderWidth: 1,
          borderColor: isYou ? colors.borderStrong : colors.border,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: isYou || !isLastInRun ? 20 : 6,
          borderBottomRightRadius: isYou && isLastInRun ? 6 : 20,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 15,
            lineHeight: 21,
            color: colors.text,
          }}
        >
          {message.body}
        </Text>
      </View>
    </View>
  )
}

function ChatComposer({
  colors,
  bottomInset,
  placeholder,
  compact = false,
}: {
  colors: AppColors
  bottomInset: number
  placeholder: string
  compact?: boolean
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: compact ? 9 : 10,
        paddingHorizontal: 12,
        paddingBottom: compact ? 12 : Math.max(bottomInset, 8) + 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Camera size={16} color={colors.textMuted} />
        </Pressable>
        <View
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 19,
            backgroundColor: colors.panel,
            paddingHorizontal: 14,
            justifyContent: 'center',
          }}
        >
          <TextInput
            editable={false}
            placeholder={placeholder}
            placeholderTextColor={colors.textFaint}
            style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}
          />
        </View>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={15} color="#FFFFFF" />
        </View>
      </View>
    </View>
  )
}

function RequestsBanner({ colors }: { colors: AppColors }) {
  if (connectionRequests.length === 0) return null
  const previewNames = connectionRequests
    .slice(0, 2)
    .map((request) => request.person.name.split(' ')[0])
    .join(', ')
  const subtitle = `${previewNames}${connectionRequests.length > 2 ? ' and others' : ''} · met at recent events`
  const stackPeople = connectionRequests.slice(0, 3).map((request) => request.person)

  return (
    <Pressable
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <RequestAvatarStack people={stackPeople} colors={colors} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
          numberOfLines={1}
        >
          {connectionRequests.length} message{' '}
          {connectionRequests.length === 1 ? 'request' : 'requests'}
        </Text>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: colors.textMuted }}
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  )
}

function RequestAvatarStack({ people, colors }: { people: PersonSummary[]; colors: AppColors }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((person, index) => (
        <View
          key={person.id}
          style={{
            marginLeft: index === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: colors.card,
            borderRadius: 16,
          }}
        >
          <Avatar
            name={person.name}
            initials={person.initials}
            size={32}
            backgroundColor={person.accentColor}
          />
        </View>
      ))}
    </View>
  )
}

function GroupConversationAvatar({
  members,
  size = 44,
  colors,
}: {
  members: PersonSummary[]
  size?: number
  colors: AppColors
}) {
  const fallbackMember: PersonSummary = { id: 'group', name: 'Group', initials: 'G' }
  const shown = members.length > 0 ? members.slice(0, 4) : [fallbackMember]
  const half = size / 2

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {shown.map((member, index) => (
        <View
          key={`${member.id}-${index}`}
          style={{
            position: 'absolute',
            left: (index % 2) * half,
            top: Math.floor(index / 2) * half,
            width: half,
            height: half,
            backgroundColor: member.accentColor || colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inclusive Sans',
              fontSize: Math.max(9, half * 0.42),
              color: '#FFFFFF',
            }}
          >
            {(member.initials || member.name || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  )
}

function GroupIcon({
  kind,
  colors,
  active,
}: {
  kind: GroupKind
  colors: AppColors
  active?: boolean
}) {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 15,
        backgroundColor: active ? colors.accent : colors.accentSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'center' ? (
        <Building2 size={19} color={active ? '#FFFFFF' : colors.accent} />
      ) : (
        <CalendarDays size={19} color={active ? '#FFFFFF' : colors.accent} />
      )}
    </View>
  )
}


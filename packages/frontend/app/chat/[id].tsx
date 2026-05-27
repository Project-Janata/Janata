import React, { useMemo } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'phosphor-react-native'
import { useTheme } from '../../components/contexts'
import { Avatar } from '../../components/ui'
import { groupChats, inboxThreads, type PersonSummary } from '../../components/boards'

type GroupKind = 'center' | 'event'

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

function getConversations(): Conversation[] {
  const groupConvos: Conversation[] = groupChats.map((chat) => ({
    id: chat.id,
    type: 'group' as const,
    title: chat.title,
    subtitle: `${chat.memberCount} members`,
    preview: chat.preview,
    lastActiveLabel: chat.lastActiveLabel,
    unread: chat.unreadCount > 0,
    groupKind: chat.kind,
    groupMembers: chat.members,
    messages: chat.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      timestamp: m.timestamp,
      body: m.body,
      authorName: m.sender === 'them' ? m.authorName : undefined,
    })),
  }))

  const dmConvos: Conversation[] = inboxThreads.map((thread) => ({
    id: thread.id,
    type: 'dm' as const,
    title: thread.person.name,
    subtitle: thread.person.verification === 'sevak' ? 'Sevak' : 'Member',
    preview: thread.messages[0]?.body || '',
    lastActiveLabel: thread.lastActiveLabel,
    unread: thread.unread,
    avatarName: thread.person.name,
    avatarInitials: thread.person.initials,
    avatarColor: thread.person.accentColor,
    messages: thread.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      timestamp: m.timestamp,
      body: m.body,
    })),
  }))

  return [...groupConvos, ...dmConvos]
}

export default function ChatConversationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { isDark } = useTheme()

  const colors = useMemo(
    () => ({
      page: isDark ? '#1A1A1A' : '#F5F5F4',
      surface: isDark ? '#171717' : '#FFFFFF',
      text: isDark ? '#FAFAF9' : '#1F1D1B',
      textMuted: isDark ? '#A8A29E' : '#78716C',
      textSecondary: isDark ? '#D6D3D1' : '#44403C',
      border: isDark ? '#262626' : '#E7E5E4',
      orange: '#E8862A',
      orangeSoft: isDark ? 'rgba(232,134,42,0.15)' : '#FFF7ED',
      panel: isDark ? '#1F1F1F' : '#F7F4EF',
      youBubble: '#E8862A',
      themBubble: isDark ? '#262626' : '#F5F5F4',
    }),
    [isDark]
  )

  const conversations = useMemo(() => getConversations(), [])
  const conversation = conversations.find((c) => c.id === id)

  if (!conversation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.textMuted }}>
            Conversation not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.orange }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#FFFFFF' }}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ArrowLeft size={22} color={colors.orange} />
        </Pressable>
        {conversation.type === 'dm' ? (
          <Avatar
            name={conversation.avatarName || conversation.title}
            initials={conversation.avatarInitials || conversation.title[0]}
            size={36}
            backgroundColor={conversation.avatarColor}
          />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.panel,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textMuted }}>
              {conversation.title[0]}
            </Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }} numberOfLines={1}>
            {conversation.title}
          </Text>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
            {conversation.subtitle}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {conversation.messages.map((message) => {
          const isYou = message.sender === 'you'
          return (
            <View
              key={message.id}
              style={{
                flexDirection: 'row',
                justifyContent: isYou ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  maxWidth: '80%',
                  backgroundColor: isYou ? colors.youBubble : colors.themBubble,
                  borderRadius: 16,
                  borderBottomRightRadius: isYou ? 4 : 16,
                  borderBottomLeftRadius: isYou ? 16 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                {!isYou && message.authorName ? (
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.orange, marginBottom: 4 }}>
                    {message.authorName}
                  </Text>
                ) : null}
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 14,
                    lineHeight: 20,
                    color: isYou ? '#FFFFFF' : colors.text,
                  }}
                >
                  {message.body}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inclusive Sans',
                    fontSize: 11,
                    color: isYou ? 'rgba(255,255,255,0.7)' : colors.textMuted,
                    marginTop: 4,
                    textAlign: isYou ? 'right' : 'left',
                  }}
                >
                  {message.timestamp}
                </Text>
              </View>
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

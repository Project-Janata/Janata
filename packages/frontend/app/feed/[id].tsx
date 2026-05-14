import React, { useMemo } from 'react'
import { View, Text, ScrollView, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Building2, CalendarDays, MessageCircle } from 'lucide-react-native'
import { useTheme, useUser } from '../../components/contexts'
import { useMyEvents, useCenterList } from '../../hooks/useApiData'
import { Avatar } from '../../components/ui'
import type { DiscoverCenter } from '../../utils/api'
import {
  buildCenterBoard,
  buildEventBoard,
  centerBoards,
  eventBoards,
  type BoardMessage,
  type PersonSummary,
} from '../../components/boards'

type GroupKind = 'center' | 'event'

type FeedPost = BoardMessage & {
  groupId: string
  groupKind: GroupKind
  sourceTitle: string
  sourceSubtitle: string
  sourceLabel: string
  replyMessages: BoardMessage[]
}

function findPostById(
  id: string,
  allCenters: DiscoverCenter[],
  myEvents: any[],
  user: any,
  isVerified: boolean
): FeedPost | null {
  // Build groups same as feed page
  const groups: any[] = []

  if (user && isVerified) {
    for (const center of allCenters) {
      groups.push({
        id: `center-${center.id}`,
        kind: 'center' as GroupKind,
        title: center.name,
        messages: centerBoards[0]?.messages || [],
      })
    }
    for (const event of myEvents) {
      groups.push({
        id: `event-${event.id}`,
        kind: 'event' as GroupKind,
        title: event.title,
        messages: eventBoards[0]?.messages || [],
      })
    }
  } else {
    groups.push({
      id: `center-${centerBoards[0]?.id || 'default'}`,
      kind: 'center' as GroupKind,
      title: centerBoards[0]?.centerName || 'Center',
      messages: centerBoards[0]?.messages || [],
    })
    groups.push(
      ...eventBoards.map((eb) => ({
        id: `event-${eb.id}`,
        kind: 'event' as GroupKind,
        title: eb.title,
        messages: eb.messages,
      }))
    )
  }

  for (const group of groups) {
    for (const message of group.messages) {
      const postId = `${group.id}-${message.id}`
      if (postId === id) {
        const replies = group.messages.filter((m: BoardMessage) => m.id !== message.id)
        return {
          ...message,
          id: postId,
          sourceLabel: group.title,
          sourceKind: group.kind,
          sourceTitle: group.title,
          sourceSubtitle: '',
          groupId: group.id,
          groupKind: group.kind,
          replyMessages: replies.slice(0, Math.max(message.replyCount ?? 2, 1)),
        }
      }
    }
  }

  return null
}

export default function FeedPostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const { isDark } = useTheme()
  const { centers: allCenters } = useCenterList()
  const { events: myEvents } = useMyEvents(user?.username)

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
    }),
    [isDark]
  )

  const post = useMemo(
    () => findPostById(id || '', allCenters, myEvents, user, user?.isVerified === true),
    [id, allCenters, myEvents, user]
  )

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.textMuted }}>
            Post not found
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{
              marginTop: 16,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: colors.orange,
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#FFFFFF' }}>
              Go back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const reactions = post.reactions ?? [{ emoji: '🙏', count: 2 }]
  const replies = post.replyMessages.slice(0, Math.max(post.replyCount ?? 2, 1))

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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ArrowLeft size={22} color={colors.orange} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.text }}>Post</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
            {post.sourceTitle}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                backgroundColor: post.sourceKind === 'event' ? colors.orangeSoft : colors.panel,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {post.sourceKind === 'event' ? (
                <CalendarDays size={10} color={colors.orange} strokeWidth={2.4} />
              ) : (
                <Building2 size={10} color={colors.textMuted} strokeWidth={2.3} />
              )}
            </View>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
              {post.sourceTitle}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Avatar
              name={post.author.name}
              initials={post.author.initials}
              size={42}
              backgroundColor={post.author.accentColor}
            />
            <View style={{ flex: 1, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, color: colors.text }}>{post.author.name}</Text>
                {post.author.verification === 'sevak' ? (
                  <View
                    style={{
                      backgroundColor: colors.orangeSoft,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ fontSize: 10, color: colors.orange }}>SEVAK</Text>
                  </View>
                ) : null}
                <Text style={{ fontSize: 12, color: colors.textMuted }}>· {post.timestamp}</Text>
              </View>

              <Text style={{ fontSize: 15, lineHeight: 22, color: colors.text }}>{post.body}</Text>

              {post.attachmentLabel ? (
                <View
                  style={{
                    marginTop: 4,
                    height: 80,
                    borderRadius: 14,
                    backgroundColor: colors.panel,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    {post.attachmentLabel}
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 }}>
                {reactions.map((reaction, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 14 }}>{reaction.emoji}</Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.textMuted,
                      }}
                    >
                      {reaction.count}
                    </Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessageCircle size={14} color={colors.textMuted} />
                  <Text style={{ fontSize: 13, color: colors.textMuted }}>
                    {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {replies.length > 0 ? (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 12,
                letterSpacing: 0.5,
                color: colors.textMuted,
                paddingHorizontal: 16,
                marginBottom: 12,
              }}
            >
              REPLIES
            </Text>
            {replies.map((reply) => (
              <View
                key={reply.id}
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Avatar
                  name={reply.author.name}
                  initials={reply.author.initials}
                  size={36}
                  backgroundColor={reply.author.accentColor}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, color: colors.text }}>{reply.author.name}</Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                      }}
                    >
                      · {reply.timestamp}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.textSecondary,
                    }}
                  >
                    {reply.body}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

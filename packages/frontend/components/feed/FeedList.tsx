import React, { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Building2, CalendarDays, ChevronRight, Globe2 } from 'lucide-react-native'
import type { ThreadPanelColors } from '../boards'
import type { AppColors } from '../../tokens'
import type { FeedPost, GroupBoard } from './types'
import { FeedPostCard } from './FeedPostCard'

export function FeedList({
  posts,
  groups,
  colors,
  feedColors,
  hasQuery = false,
  onOpenGroup,
  onSelectPost,
}: {
  posts: FeedPost[]
  groups: GroupBoard[]
  colors: ThreadPanelColors
  feedColors: AppColors
  hasQuery?: boolean
  onOpenGroup: (group: GroupBoard) => void
  onSelectPost: (id: string) => void
}) {
  const router = useRouter()
  const [visibleCount, setVisibleCount] = useState(25)
  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  useEffect(() => {
    setVisibleCount(25)
  }, [posts])

  if (posts.length === 0 && groups.length > 0 && !hasQuery) {
    // The "no posts yet" / compose prompt lives in the detail pane (desktop)
    // or below (mobile). Here we just list the boards the member can open —
    // no duplicated empty-state copy.
    return (
      <View style={{ paddingTop: 4, gap: 10 }}>
        <Text
          style={{
            fontSize: 11.5,
            letterSpacing: 0.9,
            textTransform: 'uppercase',
            color: colors.textMuted,
            paddingHorizontal: 2,
            paddingBottom: 2,
          }}
        >
          Your boards
        </Text>
        {groups.map((group) => (
          <BoardEmptyRow
            key={group.id}
            group={group}
            colors={feedColors}
            onPress={() => onOpenGroup(group)}
          />
        ))}
      </View>
    )
  }

  if (posts.length === 0) {
    return (
      <View style={{ paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 16, color: colors.text }}>
          {hasQuery ? 'No posts found' : 'Your community feed'}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 19, color: colors.textMuted, textAlign: 'center' }}>
          {hasQuery
            ? 'No board posts match that search.'
            : 'Posts from your center and the events you RSVP to show up here. Use the Explore tab to find your center or an event and join the conversation.'}
        </Text>
      </View>
    )
  }

  return (
    <View>
      {visiblePosts.map((post) => (
        <FeedPostCard
          key={post.id}
          post={post}
          colors={feedColors}
          onPress={() => onSelectPost(post.id)}
          onAuthorPress={
            post.author.username && post.author.id !== 'me'
              ? () => router.push(`/profile/${post.author.username}`)
              : undefined
          }
        />
      ))}
      {hasMore ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            Loading more...
          </Text>
        </View>
      ) : null}
    </View>
  )
}

function BoardEmptyRow({
  group,
  colors,
  onPress,
}: {
  group: GroupBoard
  colors: AppColors
  onPress: () => void
}) {
  const Icon = group.kind === 'public' ? Globe2 : group.kind === 'event' ? CalendarDays : Building2
  const isAccent = group.kind !== 'center'

  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        backgroundColor: colors.card,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: isAccent ? colors.accentSoft : colors.panel,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={18}
          color={isAccent ? colors.accent : colors.textMuted}
          strokeWidth={2.3}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }} numberOfLines={1}>
          {group.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
          {group.eyebrow}
        </Text>
        <Text style={{ fontSize: 13, lineHeight: 18, color: colors.textMuted }} numberOfLines={2}>
          {group.kind === 'public' ? 'Share with signed-in members' : 'Open to start the conversation'}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textFaint} />
    </Pressable>
  )
}

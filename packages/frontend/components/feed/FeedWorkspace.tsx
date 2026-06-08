import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { PencilLine } from 'lucide-react-native'
import { BoardPostCard, EmptyPanel, type ThreadPanelColors } from '../boards'
import { Avatar } from '../ui'
import { useUser } from '../contexts'
import type { AppColors } from '../../tokens'
import type { FeedPost, GroupBoard } from './types'
import { FeedList } from './FeedList'
import { PostThread } from './PostThread'
import { FeedContextRail } from './FeedContextRail'
import { authorFromUser } from './feedData'
import { DesktopColumns } from '../layout/DesktopColumns'

export function FeedWorkspace({
  posts,
  groups,
  selectedPost,
  colors,
  threadColors,
  isDesktop,
  hasQuery,
  query,
  nativeDetailOpen,
  mobilePostOpen,
  onOpenGroup,
  onSelectPost,
  onChangeQuery,
  onBack,
  onPostChanged,
  onPostDeleted,
  onCompose,
}: {
  posts: FeedPost[]
  groups: GroupBoard[]
  selectedPost?: FeedPost
  colors: AppColors
  threadColors: ThreadPanelColors
  isDesktop: boolean
  hasQuery: boolean
  query?: string
  nativeDetailOpen: boolean
  mobilePostOpen: boolean
  onOpenGroup: (group: GroupBoard) => void
  onSelectPost: (id: string) => void
  onChangeQuery?: (value: string) => void
  onBack?: () => void
  onPostChanged?: () => void
  onPostDeleted?: () => void
  onCompose?: () => void
}) {
  // Guests and empty no-query states are handled upstream by FeedEmptyState, so
  // FeedWorkspace only renders for signed-in members with posts or a search.
  if (isDesktop) {
    const centerName = groups.find((g) => g.kind === 'center')?.title
    const multiSource = new Set(posts.map((p) => p.sourceTitle)).size > 1
    // The primary column is a single social feed (Twitter-style). Selecting a
    // post swaps the column in place to the thread; the context rail stays put.
    // The no-query empty states (guest / join-a-center / first-post) are owned
    // upstream by FeedEmptyState, so here posts are only empty under an active
    // search.
    const column = posts.length === 0 ? (
      <EmptyPanel title="No posts found" subtitle="Try a different search." colors={colors} />
    ) : (
      <View style={{ gap: 14 }}>
        {groups.length > 0 ? (
          <ComposePrompt colors={colors} centerName={centerName} onPress={onCompose} />
        ) : null}
        {/* Single feed stream. Tapping a card expands it IN PLACE to reveal the
            thread (replies + composer) instead of navigating to a separate
            view; the rest of the feed stays put. One card expanded at a time. */}
        <View style={{ gap: 12 }}>
          {posts.map((post) =>
            post.id === selectedPost?.id ? (
              <PostThread
                key={post.id}
                post={post}
                colors={colors}
                hideSourceChip
                onCollapse={onBack}
                onPostChanged={onPostChanged}
                onPostDeleted={onPostDeleted}
              />
            ) : (
              <BoardPostCard
                key={post.id}
                message={post}
                colors={threadColors}
                asCard
                showSource={multiSource}
                onPress={() => onSelectPost(post.id)}
              />
            )
          )}
        </View>
      </View>
    )

    return (
      <DesktopColumns
        main={column}
        rail={
          <FeedContextRail
            groups={groups}
            colors={colors}
            query={query ?? ''}
            onChangeQuery={onChangeQuery}
            onOpenGroup={onOpenGroup}
          />
        }
      />
    )
  }

  if (mobilePostOpen && !nativeDetailOpen && selectedPost) {
    return (
      <PostThread
        post={selectedPost}
        colors={colors}
        onPostChanged={onPostChanged}
        onPostDeleted={onPostDeleted}
      />
    )
  }

  return (
    <FeedList
      posts={posts}
      groups={groups}
      colors={threadColors}
      feedColors={colors}
      hasQuery={hasQuery}
      onOpenGroup={onOpenGroup}
      onSelectPost={onSelectPost}
    />
  )
}

// Tap-to-compose row at the top of the feed — opens the create-post sheet.
function ComposePrompt({
  colors,
  centerName,
  onPress,
}: {
  colors: AppColors
  centerName?: string
  onPress?: () => void
}) {
  const { user } = useUser()
  const author = authorFromUser(user)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Write a post"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 18,
        backgroundColor: colors.card,
        padding: 14,
      }}
    >
      <Avatar name={author.name} initials={author.initials} size={38} backgroundColor={author.accentColor} />
      <View
        style={{
          flex: 1,
          height: 40,
          justifyContent: 'center',
          paddingHorizontal: 16,
          borderRadius: 999,
          backgroundColor: colors.panel,
        }}
      >
        <Text style={{ fontSize: 13.5, color: colors.textFaint }} numberOfLines={1}>
          {centerName ? `Share something with ${centerName}…` : 'Share something with your community…'}
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.accent,
          borderRadius: 999,
          paddingHorizontal: 15,
          paddingVertical: 9,
        }}
      >
        <PencilLine size={14} color={colors.textInverse} strokeWidth={2.4} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13.5, color: colors.textInverse }}>Post</Text>
      </View>
    </Pressable>
  )
}

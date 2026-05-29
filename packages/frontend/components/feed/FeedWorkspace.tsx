import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Building2, CalendarDays, ChevronLeft, PencilLine, Search } from 'lucide-react-native'
import { BoardPostCard, EmptyPanel, ThreadPanel, type ThreadPanelColors } from '../boards'
import { Avatar } from '../ui'
import { useUser } from '../contexts'
import type { AppColors } from '../../tokens'
import type { FeedPost, GroupBoard } from './types'
import { FeedList } from './FeedList'
import { PostThread } from './PostThread'
import { authorFromUser } from './feedData'

export function FeedWorkspace({
  posts,
  groups,
  selectedPost,
  colors,
  threadColors,
  isDesktop,
  hasQuery,
  query,
  canAccessBoards,
  isSignedIn,
  nativeDetailOpen,
  mobilePostOpen,
  onRequestAccess,
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
  canAccessBoards: boolean
  isSignedIn: boolean
  nativeDetailOpen: boolean
  mobilePostOpen: boolean
  onRequestAccess: () => void
  onOpenGroup: (group: GroupBoard) => void
  onSelectPost: (id: string) => void
  onChangeQuery?: (value: string) => void
  onBack?: () => void
  onPostChanged?: () => void
  onPostDeleted?: () => void
  onCompose?: () => void
}) {
  if (!canAccessBoards) {
    return (
      <ThreadPanel
        messages={[]}
        colors={threadColors}
        emptyTitle="No posts yet"
        emptySubtitle="Once your boards have posts, they will show up here."
        composerPlaceholder="Share something with the center..."
        composerState="locked"
        lockedTitle={isSignedIn ? 'No boards available yet' : 'Sign in for member boards'}
        lockedSubtitle={
          isSignedIn
            ? 'Join a center or register for an event to start seeing member conversations here.'
            : 'Sign in to see your center board, event boards, and member conversations.'
        }
        primaryActionLabel={isSignedIn ? 'Explore' : 'Sign in'}
        secondaryActionLabel={isSignedIn ? 'View events' : 'Learn more'}
        onPrimaryAction={onRequestAccess}
        onSecondaryAction={onRequestAccess}
      />
    )
  }

  if (isDesktop) {
    const centerName = groups.find((g) => g.kind === 'center')?.title
    const multiSource = new Set(posts.map((p) => p.sourceTitle)).size > 1
    // The primary column is a single social feed (Twitter-style). Selecting a
    // post swaps the column in place to the thread; the context rail stays put.
    const column = selectedPost ? (
      <View style={{ gap: 14 }}>
        <BackRow label={selectedPost.sourceLabel} colors={colors} onBack={onBack} />
        <PostThread
          post={selectedPost}
          colors={colors}
          hideSourceChip
          onPostChanged={onPostChanged}
          onPostDeleted={onPostDeleted}
        />
      </View>
    ) : posts.length === 0 ? (
      hasQuery ? (
        <EmptyPanel title="No posts found" subtitle="Try a different search." colors={colors} />
      ) : (
        <EmptyPanel
          title="Start the conversation"
          subtitle={
            groups.length > 0
              ? 'Share the first post with your community.'
              : 'Join a center or register for an event to start posting with your community.'
          }
          colors={colors}
          actionLabel={groups.length > 0 ? 'Write a post' : undefined}
          onAction={groups.length > 0 ? onCompose : undefined}
        />
      )
    ) : (
      <View style={{ gap: 14 }}>
        {groups.length > 0 ? (
          <ComposePrompt colors={colors} centerName={centerName} onPress={onCompose} />
        ) : null}
        {/* Individual post cards, same component as the Home feed peek, so the
            feed reads consistently with the rest of the app. The per-post board
            label only appears when the feed actually spans more than one board
            (otherwise the rail already names the single board). */}
        <View style={{ gap: 12 }}>
          {posts.map((post) => (
            <BoardPostCard
              key={post.id}
              message={post}
              colors={threadColors}
              asCard
              showSource={multiSource}
              onPress={() => onSelectPost(post.id)}
            />
          ))}
        </View>
      </View>
    )

    return (
      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'flex-start', justifyContent: 'center' }}>
        <View style={{ flexGrow: 0, flexShrink: 1, flexBasis: 600, maxWidth: 600, minWidth: 0 }}>{column}</View>
        <View style={{ flexGrow: 0, flexShrink: 0, flexBasis: 320, width: 320 }}>
          <FeedContextRail
            groups={groups}
            colors={colors}
            query={query ?? ''}
            onChangeQuery={onChangeQuery}
            onOpenGroup={onOpenGroup}
          />
        </View>
      </View>
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

// "← Feed" + the board chip, shown above the thread when a post is open.
function BackRow({
  label,
  colors,
  onBack,
}: {
  label?: string
  colors: AppColors
  onBack?: () => void
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to feed"
        hitSlop={8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
      >
        <ChevronLeft size={18} color={colors.textSecondary} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.textSecondary }}>Feed</Text>
      </Pressable>
      {label ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: colors.accentSoft,
            borderRadius: 8,
            paddingHorizontal: 9,
            paddingVertical: 4,
          }}
        >
          <Building2 size={12} color={colors.accent} strokeWidth={2.3} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accent }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
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

// Right context rail: search + the member's boards (center badged YOUR CENTER).
function FeedContextRail({
  groups,
  colors,
  query,
  onChangeQuery,
  onOpenGroup,
}: {
  groups: GroupBoard[]
  colors: AppColors
  query: string
  onChangeQuery?: (value: string) => void
  onOpenGroup: (group: GroupBoard) => void
}) {
  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 42,
          paddingHorizontal: 14,
          borderRadius: 999,
          backgroundColor: colors.surface,
        }}
      >
        <Search size={16} color={colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search posts, people, groups"
          placeholderTextColor={colors.textFaint}
          style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0, outlineStyle: 'none' } as any}
        />
      </View>

      {groups.length > 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 16,
            backgroundColor: colors.card,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 11,
              letterSpacing: 0.9,
              textTransform: 'uppercase',
              color: colors.textFaint,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Your boards
          </Text>
          {groups.map((group) => (
            <RailBoardRow key={group.id} group={group} colors={colors} onPress={() => onOpenGroup(group)} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function RailBoardRow({
  group,
  colors,
  onPress,
}: {
  group: GroupBoard
  colors: AppColors
  onPress: () => void
}) {
  const isCenter = group.kind === 'center'
  const Icon = isCenter ? Building2 : CalendarDays
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${group.title}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: isCenter ? colors.panel : colors.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} color={isCenter ? colors.textMuted : colors.accent} strokeWidth={2.3} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontSize: 13.5, color: colors.text }} numberOfLines={1}>
          {group.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {isCenter ? (
            <View
              style={{
                backgroundColor: colors.accentSoft,
                borderRadius: 4,
                paddingHorizontal: 5,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 0.3, color: colors.accent }}>
                YOUR CENTER
              </Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 12, color: colors.textFaint }} numberOfLines={1}>
            {group.eyebrow}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

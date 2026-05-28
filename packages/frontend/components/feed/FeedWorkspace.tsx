import React from 'react'
import { View } from 'react-native'
import { EmptyPanel, ThreadPanel, type ThreadPanelColors } from '../boards'
import type { AppColors } from '../../tokens'
import type { FeedPost, GroupBoard } from './types'
import { FeedList } from './FeedList'
import { PostThread } from './PostThread'

export function FeedWorkspace({
  posts,
  groups,
  selectedPost,
  colors,
  threadColors,
  isDesktop,
  hasQuery,
  canAccessBoards,
  isSignedIn,
  nativeDetailOpen,
  mobilePostOpen,
  onRequestAccess,
  onOpenGroup,
  onSelectPost,
  onPostChanged,
  onPostDeleted,
}: {
  posts: FeedPost[]
  groups: GroupBoard[]
  selectedPost?: FeedPost
  colors: AppColors
  threadColors: ThreadPanelColors
  isDesktop: boolean
  hasQuery: boolean
  canAccessBoards: boolean
  isSignedIn: boolean
  nativeDetailOpen: boolean
  mobilePostOpen: boolean
  onRequestAccess: () => void
  onOpenGroup: (group: GroupBoard) => void
  onSelectPost: (id: string) => void
  onPostChanged?: () => void
  onPostDeleted?: () => void
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
    return (
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ flex: 1.05, minWidth: 0 }}>
          <FeedList
            posts={posts}
            groups={groups}
            colors={threadColors}
            feedColors={colors}
            hasQuery={hasQuery}
            onOpenGroup={onOpenGroup}
            onSelectPost={onSelectPost}
          />
        </View>
        <View style={{ flex: 0.95, minWidth: 0 }}>
          {selectedPost ? (
            <PostThread
              post={selectedPost}
              colors={colors}
              onPostChanged={onPostChanged}
              onPostDeleted={onPostDeleted}
            />
          ) : groups.length > 0 && !hasQuery ? (
            <EmptyPanel
              title="Open a board"
              subtitle="Choose your center or event board to start the conversation."
              colors={colors}
            />
          ) : (
            <EmptyPanel
              title={hasQuery ? 'No posts found' : 'No posts yet'}
              subtitle={
                hasQuery
                  ? 'Try a different search.'
                  : 'No posts yet. Be the first to share something on your boards.'
              }
              colors={colors}
            />
          )}
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

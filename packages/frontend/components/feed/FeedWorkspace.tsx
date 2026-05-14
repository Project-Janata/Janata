import React from 'react'
import { View } from 'react-native'
import { EmptyPanel, ThreadPanel, type ThreadPanelColors } from '../boards'
import type { AppColors } from '../../tokens'
import type { FeedPost } from './types'
import { FeedList } from './FeedList'
import { PostThread } from './PostThread'

export function FeedWorkspace({
  posts,
  selectedPost,
  colors,
  threadColors,
  isDesktop,
  canAccessBoards,
  isSignedIn,
  nativeDetailOpen,
  mobilePostOpen,
  onRequestAccess,
  onSelectPost,
}: {
  posts: FeedPost[]
  selectedPost?: FeedPost
  colors: AppColors
  threadColors: ThreadPanelColors
  isDesktop: boolean
  canAccessBoards: boolean
  isSignedIn: boolean
  nativeDetailOpen: boolean
  mobilePostOpen: boolean
  onRequestAccess: () => void
  onSelectPost: (id: string) => void
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
        lockedTitle={isSignedIn ? 'For verified members' : 'Sign in for member boards'}
        lockedSubtitle={
          isSignedIn
            ? "Boards are conversations between verified CHYKs at a center. Get verified and you're in."
            : 'Sign in to see your center board, event boards, and member conversations.'
        }
        primaryActionLabel={isSignedIn ? 'Redeem invite' : 'Sign in'}
        secondaryActionLabel={isSignedIn ? 'Apply' : 'Learn more'}
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
            colors={threadColors}
            feedColors={colors}
            onSelectPost={onSelectPost}
          />
        </View>
        <View style={{ flex: 0.95, minWidth: 0 }}>
          {selectedPost ? (
            <PostThread post={selectedPost} colors={colors} />
          ) : (
            <EmptyPanel title="No posts found" subtitle="Try a different search." colors={colors} />
          )}
        </View>
      </View>
    )
  }

  if (mobilePostOpen && !nativeDetailOpen && selectedPost) {
    return <PostThread post={selectedPost} colors={colors} />
  }

  return (
    <FeedList posts={posts} colors={threadColors} feedColors={colors} onSelectPost={onSelectPost} />
  )
}

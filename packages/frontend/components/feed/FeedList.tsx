import React, { useCallback, useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import type { ThreadPanelColors } from '../connect'
import type { AppColors } from '../../tokens'
import type { FeedPost } from './types'
import { FeedPostCard } from './FeedPostCard'

export function FeedList({
  posts,
  colors,
  feedColors,
  onSelectPost,
}: {
  posts: FeedPost[]
  colors: ThreadPanelColors
  feedColors: AppColors
  onSelectPost: (id: string) => void
}) {
  const [visibleCount, setVisibleCount] = useState(25)
  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => Math.min(prev + 25, posts.length))
    }
  }, [hasMore, posts.length])

  useEffect(() => {
    setVisibleCount(25)
  }, [posts])

  if (posts.length === 0) {
    return (
      <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>
          No posts found
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
          Try a different search or check back after your next event.
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
        />
      ))}
      {hasMore ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>
            Loading more...
          </Text>
        </View>
      ) : null}
    </View>
  )
}

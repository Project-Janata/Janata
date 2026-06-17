import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { boardPostToMessage } from '../../components/boards'
import { NativeChatHeader, PostThread } from '../../components/feed'
import { buildFeedPostFromMessage } from '../../components/feed/feedData'
import type { FeedPost } from '../../components/feed'
import { fetchAggregatedFeed, type BoardPostData } from '../../utils/api'
import { useAnalytics } from '../../utils/analytics'

type LoadState = 'loading' | 'loaded' | 'error'

// The aggregated feed already scopes to every board the signed-in user can see
// (public + their center board + boards for events they've joined), so it is the
// real-data source the Feed tab and Home peek both read from. We pull the max
// page so a deep-linked / push-notification post (which arrives as a raw post id
// via /feed/:postId) is found even when it's a little older.
const FEED_PAGE = 100

// A post is matched either by its raw API id (deep links / push) or by the
// board-scoped compound key `${groupId}-${postId}` that the Feed tab uses for
// in-app selection.
function matchesId(post: BoardPostData, id: string): boolean {
  return post.id === id || id.endsWith(`-${post.id}`)
}

function buildPost(post: BoardPostData): FeedPost {
  const sourceKind = post.sourceKind ?? (post.boardId === null ? 'public' : 'center')
  const sourceLabel = post.sourceLabel ?? (sourceKind === 'public' ? 'Public' : 'Your center')
  return buildFeedPostFromMessage(boardPostToMessage(post), {
    groupId: post.boardId ? `${sourceKind}-${post.boardId}` : 'public',
    kind: sourceKind,
    parentId: post.boardId ?? 'public',
    title: sourceLabel,
    subtitle: '',
  })
}

export default function FeedPostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const { track } = useAnalytics()

  const [state, setState] = useState<LoadState>('loading')
  const [post, setPost] = useState<FeedPost | null>(null)

  const load = useCallback(async () => {
    if (!id) {
      setState('loaded')
      setPost(null)
      return
    }
    setState('loading')
    try {
      const posts = await fetchAggregatedFeed({ limit: FEED_PAGE })
      const match = posts.find((p) => matchesId(p, id))
      setPost(match ? buildPost(match) : null)
      setState('loaded')
    } catch {
      setPost(null)
      setState('error')
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleBack = useCallback(
    (reason?: string) => {
      track('feed_post_back_pressed', {
        post_id: id,
        source: 'feed_post_detail',
        ...(reason ? { reason } : {}),
        ...(post ? { group_id: post.groupId, group_kind: post.groupKind } : {}),
      })
      router.back()
    },
    [id, post, router, track]
  )

  const messageState = useMemo(() => {
    if (state === 'error') {
      return { label: 'Couldn’t load this post', action: 'Try again', onPress: load }
    }
    return { label: 'Post not found', action: 'Go back', onPress: () => handleBack('not_found') }
  }, [state, load, handleBack])

  if (state === 'loading') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
        <NativeChatHeader
          colors={colors}
          insetsTop={insets.top}
          title="Post"
          hideAvatar
          onBack={() => handleBack()}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
        <NativeChatHeader
          colors={colors}
          insetsTop={insets.top}
          title="Post"
          hideAvatar
          onBack={() => handleBack()}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.textFaint }}>
            {messageState.label}
          </Text>
          <Pressable
            onPress={messageState.onPress}
            accessibilityRole="button"
            style={{
              marginTop: 16,
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 12,
              backgroundColor: colors.accent,
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: '#FFFFFF' }}>
              {messageState.action}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const openAuthorProfile = (authorId: string) => {
    if (!authorId || authorId === user?.id) return
    track('feed_author_profile_pressed', { author_id: authorId, source: 'feed_post_detail' })
    router.push(`/members/${encodeURIComponent(authorId)}` as never)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }} edges={['top']}>
      <NativeChatHeader
        colors={colors}
        insetsTop={insets.top}
        title="Post"
        subtitle={post.sourceTitle}
        hideAvatar
        onBack={() => handleBack()}
      />
      <View style={{ flex: 1 }}>
        <PostThread
          post={post}
          colors={colors}
          fullScreen
          bottomInset={insets.bottom}
          onAuthorPress={openAuthorProfile}
          onPostChanged={load}
          onPostDeleted={() => handleBack('deleted')}
        />
      </View>
    </SafeAreaView>
  )
}

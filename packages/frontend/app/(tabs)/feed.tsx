import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useFocusEffect, useNavigation, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePostHog } from 'posthog-react-native'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { toThreadColors } from '../../tokens'
import { useHeaderAction } from '../../components/contexts/HeaderActionContext'
import { useCenterList, useMyEvents } from '../../hooks/useApiData'
import { extractCityState } from '../../utils/addressParsing'
import { SignInCallout, CreatePostSheet, boardPostToMessage, type BoardMessage } from '../../components/boards'
import { createBoardPost, fetchBoard } from '../../utils/api'
import {
  FeedHeader,
  NativeChatHeader,
  FeedWorkspace,
  PostThread,
  type GroupBoard,
} from '../../components/feed'
import { buildFeedPosts } from '../../components/feed/feedData'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'

function formatEventDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return 'EVENT'
  return parsed
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

function sortUpcomingEvents(events: EventDisplay[]) {
  const today = new Date().toISOString().split('T')[0]
  return [...events]
    .filter((event) => !event.date || event.date >= today)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
}

function haversineMiles(
  from?: { latitude?: number | null; longitude?: number | null } | null,
  to?: { latitude?: number | null; longitude?: number | null } | null
) {
  if (
    !from ||
    !to ||
    !Number.isFinite(from.latitude) ||
    !Number.isFinite(from.longitude) ||
    !Number.isFinite(to.latitude) ||
    !Number.isFinite(to.longitude)
  ) {
    return undefined
  }
  const toRad = (value: number) => (value * Math.PI) / 180
  const lat1 = toRad(from.latitude!)
  const lat2 = toRad(to.latitude!)
  const dLat = toRad(to.latitude! - from.latitude!)
  const dLng = toRad(to.longitude! - from.longitude!)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(distanceMi?: number) {
  if (distanceMi == null || !Number.isFinite(distanceMi)) return undefined
  if (distanceMi < 0.5) return 'Nearby'
  if (distanceMi < 10) return `${distanceMi.toFixed(1)} mi`
  return `${Math.round(distanceMi)} mi`
}

function centerToGroup(center: DiscoverCenter, distanceMi?: number): GroupBoard {
  const distanceLabel = formatDistance(distanceMi)
  const locationLabel = extractCityState(center.address) || center.address || 'Center board'
  return {
    id: `center-${center.id}`,
    kind: 'center',
    title: center.name,
    eyebrow: 'Center board',
    subtitle: [locationLabel, distanceLabel ? `${distanceLabel} away` : null].filter(Boolean).join(' - '),
    meta: 'No posts yet',
    preview: 'No posts yet. Be the first to share something on your boards.',
    unreadCount: 0,
    messages: [],
    parentId: center.id,
    distanceMi,
    routeHref: `/center/${center.id}`,
  }
}

function eventToGroup(event: EventDisplay, fallbackCenterName?: string, distanceMi?: number): GroupBoard {
  const distanceLabel = formatDistance(distanceMi)
  return {
    id: `event-${event.id}`,
    kind: 'event',
    title: event.title,
    eyebrow: formatEventDateLabel(event.date),
    subtitle: `${fallbackCenterName || event.location || 'Event board'} - ${event.attendees || 0} going`,
    meta: distanceLabel ? `${distanceLabel} away` : 'No posts yet',
    preview: 'No posts yet. Be the first to share something on your boards.',
    unreadCount: 0,
    messages: [],
    parentId: event.id,
    distanceMi,
    routeHref: `/events/${event.id}`,
  }
}

function sortGroupsByDistance(groups: GroupBoard[]) {
  return [...groups].sort((a, b) => {
    const aDistance = a.distanceMi ?? Number.POSITIVE_INFINITY
    const bDistance = b.distanceMi ?? Number.POSITIVE_INFINITY
    if (aDistance !== bDistance) return aDistance - bDistance
    if (a.kind !== b.kind) return a.kind === 'center' ? -1 : 1
    return a.title.localeCompare(b.title)
  })
}

function matchesQuery(value: string, query: string) {
  return value.toLowerCase().includes(query.toLowerCase().trim())
}

export default function FeedScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { user } = useUser()
  const colors = useColors()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const posthog = usePostHog()
  const detailTranslateX = useRef(new Animated.Value(width)).current
  const {
    events: myEvents,
    loading: myEventsLoading,
    refetch: refetchMyEvents,
  } = useMyEvents(user?.username)
  const { centers: allCenters, loading: centersLoading, refetch: refetchCenters } = useCenterList()

  const isDesktop = width >= 980
  const [query, setQuery] = useState('')
  const [selectedPostId, setSelectedPostId] = useState('')
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const [boardMessagesByGroup, setBoardMessagesByGroup] = useState<Record<string, BoardMessage[]>>({})
  const [boardsLoading, setBoardsLoading] = useState(false)
  const { setCreateHandler } = useHeaderAction()

  useFocusEffect(
    useCallback(() => {
      refetchMyEvents()
      refetchCenters()
    }, [refetchMyEvents, refetchCenters])
  )

  useEffect(() => {
    setCreateHandler(() => setCreatePostOpen(true))
    return () => setCreateHandler(null)
  }, [setCreateHandler])

  const threadColors = toThreadColors(colors)

  const canAccessBoards = !!user
  const userCenter = allCenters.find((item) => item.id === user?.centerID)
  const groups = useMemo<GroupBoard[]>(() => {
    const nextGroups: GroupBoard[] = []

    if (user && userCenter) {
      nextGroups.push(centerToGroup(userCenter, 0))
    }

    const registeredEvents = sortUpcomingEvents(myEvents)
    const liveEventGroups =
      user
        ? registeredEvents.map((event) => {
            const eventDistance = haversineMiles(userCenter, {
              latitude: event.latitude,
              longitude: event.longitude,
            })
            const centerName = allCenters.find((item) => item.id === event.centerId)?.name
            return eventToGroup(event, centerName, eventDistance)
          })
        : []

    nextGroups.push(...liveEventGroups)

    return sortGroupsByDistance(nextGroups)
  }, [allCenters, myEvents, user, userCenter])

  const groupBoardKey = useMemo(
    () => groups.map((group) => `${group.id}:${group.kind}:${group.parentId}`).join('|'),
    [groups]
  )

  const loadBoards = useCallback(async () => {
    if (!canAccessBoards || groups.length === 0) {
      setBoardMessagesByGroup({})
      setBoardsLoading(false)
      return
    }

    setBoardsLoading(true)
    try {
      const entries = await Promise.all(
        groups.map(async (group) => {
          const data = await fetchBoard(group.kind, group.parentId)
          return [group.id, data.posts.map(boardPostToMessage)] as const
        })
      )
      setBoardMessagesByGroup(Object.fromEntries(entries))
    } finally {
      setBoardsLoading(false)
    }
  }, [canAccessBoards, groupBoardKey])

  useEffect(() => {
    loadBoards()
  }, [loadBoards])

  const groupsWithMessages = useMemo<GroupBoard[]>(
    () =>
      groups.map((group) => ({
        ...group,
        messages: boardMessagesByGroup[group.id] ?? [],
      })),
    [boardMessagesByGroup, groups]
  )

  const feedPosts = useMemo(() => buildFeedPosts(groupsWithMessages), [groupsWithMessages])

  const filteredFeedPosts = useMemo(() => {
    if (!query.trim()) return feedPosts
    return feedPosts.filter(
      (post) =>
        matchesQuery(post.body, query) ||
        matchesQuery(post.author.name, query) ||
        matchesQuery(post.sourceTitle, query)
    )
  }, [feedPosts, query])

  const selectedPost = feedPosts.find((post) => post.id === selectedPostId) ?? feedPosts[0]
  const mobilePostOpen = !isDesktop && !!selectedPostId
  const nativeDetailOpen = Platform.OS !== 'web' && mobilePostOpen
  const listTopPadding = Platform.OS === 'web' ? 20 : 8
  const isLoading = user ? myEventsLoading || centersLoading || boardsLoading : false
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
    setSelectedPostId('')
  }

  const handleBoardAccessCta = () => {
    if (!user) {
      posthog?.capture('connect_signin_pressed', { source: 'feed_cta' })
      router.push('/auth')
      return
    }
    posthog?.capture('connect_explore_pressed', { source: 'feed_cta' })
    router.push('/explore' as never)
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

  const openPost = (id: string) => {
    posthog?.capture('connect_feed_post_selected', { postId: id })
    primeNativeDetailTransition()
    setSelectedPostId(id)
  }

  const openGroup = (group: GroupBoard) => {
    if (!group.routeHref) return
    posthog?.capture('connect_empty_board_opened', { groupId: group.id, kind: group.kind })
    router.push(group.routeHref as never)
  }

  const handleCreatePost = async (
    group: { kind: 'center' | 'event'; parentId: string },
    body: string
  ) => {
    await createBoardPost(group.kind, group.parentId, body)
    await loadBoards()
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
        }}
        showsVerticalScrollIndicator={false}
      >
        <FeedHeader
          query={query}
          colors={colors}
          mobileInDetail={mobilePostOpen && !nativeDetailOpen}
          onBack={closeDetail}
          onChangeQuery={setQuery}
        />

        {!user ? (
          <SignInCallout
            title="Sign in for Feed"
            subtitle="Your member feed, group boards, and announcements live here."
            colors={colors}
            onPress={() => {
              posthog?.capture('connect_signin_pressed')
              router.push('/auth')
            }}
          />
        ) : null}

        {isLoading ? (
          <View style={{ gap: 12, paddingTop: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: colors.panel,
                    }}
                  />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View
                      style={{
                        width: '50%',
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: colors.panel,
                      }}
                    />
                    <View
                      style={{
                        width: '30%',
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: colors.panel,
                      }}
                    />
                  </View>
                </View>
                <View
                  style={{
                    width: '80%',
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.panel,
                  }}
                />
                <View
                  style={{
                    width: '60%',
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: colors.panel,
                  }}
                />
              </View>
            ))}
          </View>
        ) : (
          <FeedWorkspace
            posts={filteredFeedPosts}
            selectedPost={selectedPost}
            colors={colors}
            threadColors={threadColors}
            isDesktop={isDesktop}
            hasQuery={query.trim().length > 0}
            canAccessBoards={canAccessBoards}
            isSignedIn={!!user}
            nativeDetailOpen={nativeDetailOpen}
            mobilePostOpen={mobilePostOpen}
            onRequestAccess={handleBoardAccessCta}
            onOpenGroup={openGroup}
            onSelectPost={openPost}
            onPostChanged={loadBoards}
            onPostDeleted={() => {
              closeDetail()
              loadBoards()
            }}
            groups={groupsWithMessages}
          />
        )}
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
              title="Post"
              subtitle={selectedPost?.sourceTitle}
              hideAvatar
              onBack={closeDetail}
            />
            <View style={{ flex: 1 }}>
              {selectedPost ? (
                <PostThread
                  post={selectedPost}
                  colors={colors}
                  fullScreen
                  bottomInset={insets.bottom}
                  onPostChanged={loadBoards}
                  onPostDeleted={() => {
                    closeDetail()
                    loadBoards()
                  }}
                />
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      <CreatePostSheet
        visible={createPostOpen}
        colors={colors}
        groups={groupsWithMessages}
        onClose={() => setCreatePostOpen(false)}
        onSubmit={handleCreatePost}
      />
    </View>
  )
}

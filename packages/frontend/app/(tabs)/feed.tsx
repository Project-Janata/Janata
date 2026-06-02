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
import { Building2, CalendarDays, Megaphone } from 'lucide-react-native'
import { useAnalytics } from '../../utils/analytics'
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
import {
  DESKTOP_MAX_WIDTH,
  DESKTOP_PAGE_BOTTOM,
  DESKTOP_PAGE_PADDING,
  DESKTOP_PAGE_TOP,
  useDesktopLayout,
} from '../../components/layout/DesktopColumns'
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

// "Nearby" already reads as a place, so it never takes " away" — only numeric
// distances do ("2.3 mi away"). Avoids the "Nearby away" subtitle bug.
function distancePhrase(distanceLabel?: string) {
  if (!distanceLabel) return null
  return distanceLabel === 'Nearby' ? 'Nearby' : `${distanceLabel} away`
}

function centerToGroup(center: DiscoverCenter, distanceMi?: number): GroupBoard {
  const distanceLabel = formatDistance(distanceMi)
  const locationLabel = extractCityState(center.address) || center.address || 'Center board'
  return {
    id: `center-${center.id}`,
    kind: 'center',
    title: center.name,
    eyebrow: 'Center board',
    subtitle: [locationLabel, distancePhrase(distanceLabel)].filter(Boolean).join(' · '),
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
    subtitle: `${fallbackCenterName || event.location || 'Event board'} · ${event.attendees || 0} going`,
    meta: distancePhrase(distanceLabel) || 'No posts yet',
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
  const { track } = useAnalytics()
  const detailTranslateX = useRef(new Animated.Value(width)).current
  const {
    events: myEvents,
    loading: myEventsLoading,
    refetch: refetchMyEvents,
  } = useMyEvents(user?.username)
  const { centers: allCenters, loading: centersLoading, refetch: refetchCenters } = useCenterList()

  const isDesktop = useDesktopLayout(width)
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

  // No implicit default: the desktop feed shows the post stream until the user
  // explicitly opens a post (in-place swap to the thread). Only resolve a
  // selected post when there is a real selection.
  const selectedPost = selectedPostId
    ? feedPosts.find((post) => post.id === selectedPostId)
    : undefined
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
      // Hide the "Feed" tab header while a post is open so the detail's own
      // back/title bar becomes the screen header — no gap, no doubled header.
      headerShown: !nativeDetailOpen,
    })

    return () => {
      navigation.setOptions({ tabBarStyle: nativeTabBarStyle, headerShown: true })
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

  // Track non-empty search queries with a short debounce so rapid keystrokes
  // are collapsed into a single event.
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    if (!query.trim()) return
    searchDebounceRef.current = setTimeout(() => {
      track('feed_searched', { query: query.trim(), source: 'feed' })
    }, 600)
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [query])

  const handleBoardAccessCta = () => {
    if (!user) {
      track('connect_signin_pressed', { source: 'feed_cta' })
      router.push('/auth')
      return
    }
    track('connect_explore_pressed', { source: 'feed_cta' })
    router.push('/explore' as never)
  }

  const closeDetail = () => {
    track('feed_post_detail_closed', { postId: selectedPostId, source: 'feed' })
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
    track('connect_feed_post_selected', { postId: id, source: 'feed' })
    primeNativeDetailTransition()
    setSelectedPostId(id)
  }

  const openGroup = (group: GroupBoard) => {
    if (!group.routeHref) return
    track('connect_empty_board_opened', { groupId: group.id, kind: group.kind, source: 'feed' })
    router.push(group.routeHref as never)
  }

  const handleCreatePost = async (
    group: { kind: 'center' | 'event'; parentId: string },
    body: string
  ) => {
    try {
      await createBoardPost(group.kind, group.parentId, body)
      track('feed_post_created', { kind: group.kind, parentId: group.parentId, source: 'feed' })
      await loadBoards()
    } catch (err) {
      track('feed_post_create_failed', { kind: group.kind, parentId: group.parentId, source: 'feed' })
      throw err
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          width: '100%',
          maxWidth: isDesktop ? DESKTOP_MAX_WIDTH : 640,
          alignSelf: 'center',
          paddingHorizontal: isDesktop ? DESKTOP_PAGE_PADDING : 16,
          paddingTop: isDesktop ? DESKTOP_PAGE_TOP : listTopPadding,
          paddingBottom: isDesktop ? DESKTOP_PAGE_BOTTOM : Platform.OS === 'web' ? 40 : 112,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Desktop moves search into the right context rail (Twitter-style),
            so only render the full-width search header on mobile/narrow web. */}
        {!isDesktop ? (
          <FeedHeader
            query={query}
            colors={colors}
            mobileInDetail={mobilePostOpen && !nativeDetailOpen}
            onBack={closeDetail}
            onChangeQuery={setQuery}
          />
        ) : null}

        {!user ? (
          <SignInCallout
            title="Your community feed"
            subtitle="One place for your center and the events you attend."
            features={[
              { icon: Building2, label: 'Your center board', hint: 'Stay in the loop with members at your home center.' },
              { icon: CalendarDays, label: 'Event boards', hint: 'Coordinate around every event you RSVP to.' },
              { icon: Megaphone, label: 'Announcements', hint: "What's new across Chinmaya Mission, as it happens." },
            ]}
            colors={colors}
            onPress={() => {
              track('connect_signin_pressed', { source: 'feed_banner' })
              router.push('/auth')
            }}
          />
        ) : isLoading ? (
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
            query={query}
            onChangeQuery={setQuery}
            onBack={closeDetail}
            canAccessBoards={canAccessBoards}
            isSignedIn={!!user}
            nativeDetailOpen={nativeDetailOpen}
            mobilePostOpen={mobilePostOpen}
            onRequestAccess={handleBoardAccessCta}
            onOpenGroup={openGroup}
            onSelectPost={openPost}
            onCompose={() => {
              track('feed_compose_pressed', { source: 'feed_empty_panel' })
              setCreatePostOpen(true)
            }}
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
        <>
          {/* Static opaque backdrop. Hiding the "Feed" tab header reflows the
              feed list below; without this, the horizontal slide would expose
              that upward shift on the way in and out. The panel slides over a
              uniform surface instead. */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: colors.surface,
            }}
          />
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
        </>
      ) : null}

      <CreatePostSheet
        visible={createPostOpen}
        colors={colors}
        groups={groupsWithMessages}
        onClose={() => {
          track('feed_create_post_dismissed', { source: 'feed' })
          setCreatePostOpen(false)
        }}
        onSubmit={handleCreatePost}
      />
    </View>
  )
}

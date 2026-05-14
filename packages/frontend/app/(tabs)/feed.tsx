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
import {
  buildCenterBoard,
  buildEventBoard,
  centerBoards,
  eventBoards,
  SignInCallout,
  CreatePostSheet,
  type BoardMessage,
  type CenterBoard,
  type EventBoard,
} from '../../components/boards'
import {
  FeedHeader,
  NativeChatHeader,
  FeedWorkspace,
  PostThread,
  type FeedPost,
  type GroupBoard,
} from '../../components/feed'
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

function eventToBoard(event: EventDisplay, fallbackCenterName?: string): EventBoard {
  return buildEventBoard({
    id: `event-${event.id}`,
    title: event.title,
    dateLabel: formatEventDateLabel(event.date),
    centerLabel: fallbackCenterName || event.location || 'Event group',
    attendeesLabel: `${event.attendees || 0} going`,
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

function centerToGroup(board: CenterBoard, distanceMi?: number): GroupBoard {
  const latest = board.messages[0]
  const distanceLabel = formatDistance(distanceMi)
  return {
    id: board.id,
    kind: 'center',
    title: board.centerName,
    eyebrow: 'Center board',
    subtitle: board.subtitle,
    meta: distanceLabel ? `${distanceLabel} away` : `${board.messages.length} posts`,
    preview: latest?.body || 'No posts yet.',
    unreadCount: 2,
    messages: board.messages,
    distanceMi,
  }
}

function eventToGroup(board: EventBoard, distanceMi?: number): GroupBoard {
  const distanceLabel = formatDistance(distanceMi)
  return {
    id: board.id,
    kind: 'event',
    title: board.title,
    eyebrow: board.dateLabel,
    subtitle: `${board.centerLabel} - ${board.attendeesLabel}`,
    meta: distanceLabel ? `${distanceLabel} away` : `${board.messages.length} posts`,
    preview: board.preview,
    unreadCount: board.messages.length > 2 ? 1 : 0,
    messages: board.messages,
    distanceMi,
  }
}

function centerToNearbyGroup(
  center: DiscoverCenter,
  anchor?: { latitude?: number | null; longitude?: number | null } | null
) {
  const distanceMi = haversineMiles(anchor, center)
  const locationLabel = extractCityState(center.address) || center.address || 'Center board'
  const distanceLabel = formatDistance(distanceMi)
  const subtitle = [locationLabel, distanceLabel ? `${distanceLabel} away` : null]
    .filter(Boolean)
    .join(' - ')

  return centerToGroup(
    buildCenterBoard({
      id: `center-${center.id}`,
      centerName: center.name,
      subtitle,
    }),
    distanceMi
  )
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

function buildFeedPosts(groups: GroupBoard[]): FeedPost[] {
  const posts = groups.flatMap((group) =>
    group.messages.map((message) => {
      const replies = group.messages.filter((candidate) => candidate.id !== message.id)
      return {
        ...message,
        id: `${group.id}-${message.id}`,
        sourceLabel: group.title,
        sourceKind: group.kind,
        sourceTitle: group.title,
        sourceSubtitle: group.subtitle,
        groupId: group.id,
        groupKind: group.kind,
        replyMessages: replies.slice(0, Math.max(message.replyCount ?? 2, 1)),
      }
    })
  )

  return posts.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return a.id < b.id ? 1 : -1
  })
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
  const [demoVerified, setDemoVerified] = useState(false)
  const [createPostOpen, setCreatePostOpen] = useState(false)
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

  const isVerifiedMember = user?.isVerified === true || demoVerified
  const canAccessBoards = !!user && isVerifiedMember
  const userCenter = allCenters.find((item) => item.id === user?.centerID)
  const groups = useMemo<GroupBoard[]>(() => {
    if (user && !isVerifiedMember) return []

    const nextGroups: GroupBoard[] = []

    if (user && isVerifiedMember) {
      const sorted = userCenter
        ? [...allCenters].sort((a, b) => {
            const da = haversineMiles(userCenter, a) ?? Infinity
            const db = haversineMiles(userCenter, b) ?? Infinity
            return da - db
          })
        : allCenters

      for (const item of sorted) {
        nextGroups.push(centerToNearbyGroup(item, userCenter))
      }
    } else if (!user) {
      for (const board of centerBoards) {
        nextGroups.push(centerToGroup(board))
      }
    }

    const registeredEvents = sortUpcomingEvents(myEvents)
    const liveEventGroups =
      user && isVerifiedMember
        ? registeredEvents.map((event) => {
            const eventDistance = haversineMiles(userCenter, {
              latitude: event.latitude,
              longitude: event.longitude,
            })
            return eventToGroup(eventToBoard(event), eventDistance)
          })
        : []

    if (liveEventGroups.length > 0) {
      nextGroups.push(...liveEventGroups)
    } else {
      nextGroups.push(...eventBoards.map(eventToGroup))
    }

    return sortGroupsByDistance(nextGroups)
  }, [allCenters, isVerifiedMember, myEvents, user, userCenter])

  const feedPosts = useMemo(() => buildFeedPosts(groups), [groups])

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
  const isLoading = user ? myEventsLoading || centersLoading : false
  const nativeTabBarStyle = {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 84,
    paddingTop: 8,
    paddingBottom: 18,
  }

  useEffect(() => {
    setDemoVerified(false)
  }, [user?.id])

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
    posthog?.capture('connect_demo_verified')
    setDemoVerified(true)
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
    if (Platform.OS === 'web' && isDesktop) {
      primeNativeDetailTransition()
      setSelectedPostId(id)
    } else {
      router.push(`/feed/${id}`)
    }
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
            canAccessBoards={canAccessBoards}
            isSignedIn={!!user}
            nativeDetailOpen={nativeDetailOpen}
            mobilePostOpen={mobilePostOpen}
            onRequestAccess={handleBoardAccessCta}
            onSelectPost={openPost}
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
                />
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      <CreatePostSheet
        visible={createPostOpen}
        colors={colors}
        groups={groups}
        onClose={() => setCreatePostOpen(false)}
      />
    </View>
  )
}

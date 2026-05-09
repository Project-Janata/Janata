import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useNavigation, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  ChevronDown,
  MessageCircle,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { Avatar } from '../../components/ui'
import { useTheme, useUser } from '../../components/contexts'
import { useHeaderAction } from '../../components/contexts/HeaderActionContext'
import { useCenterList, useMyEvents } from '../../hooks/useApiData'
import { extractCityState } from '../../utils/addressParsing'
import {
  ThreadPanel,
  buildCenterBoard,
  buildEventBoard,
  centerBoards,
  eventBoards,
  type BoardMessage,
  type CenterBoard,
  type EventBoard,
  type PersonSummary,
  type ThreadPanelColors,
} from '../../components/connect'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'

type GroupKind = 'center' | 'event'

type GroupBoard = {
  id: string
  kind: GroupKind
  title: string
  eyebrow: string
  subtitle: string
  meta: string
  preview: string
  unreadCount: number
  messages: BoardMessage[]
  distanceMi?: number
}

type FeedPost = BoardMessage & {
  groupId: string
  groupKind: GroupKind
  sourceTitle: string
  sourceSubtitle: string
  sourceLabel: string
  replyMessages: BoardMessage[]
}

type ColorSet = {
  page: string
  surface: string
  panel: string
  rail: string
  card: string
  cardActive: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  textSoft: string
  orange: string
  orangeSoft: string
  green: string
  greenSoft: string
}

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
  const subtitle = [
    locationLabel,
    distanceLabel ? `${distanceLabel} away` : null,
  ].filter(Boolean).join(' - ')

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
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const posthog = usePostHog()
  const detailTranslateX = useRef(new Animated.Value(width)).current
  const { events: myEvents, loading: myEventsLoading } = useMyEvents(user?.username)
  const { centers: allCenters, loading: centersLoading } = useCenterList()
  const loadMoreRef = useRef<(() => void) | null>(null)

  const isDesktop = width >= 980
  const [query, setQuery] = useState('')
  const [selectedPostId, setSelectedPostId] = useState('')
  const [demoVerified, setDemoVerified] = useState(false)
  const [createPostOpen, setCreatePostOpen] = useState(false)
  const { setCreateHandler } = useHeaderAction()

  useEffect(() => {
    setCreateHandler(() => setCreatePostOpen(true))
    return () => setCreateHandler(null)
  }, [setCreateHandler])

  const colors = useMemo<ColorSet>(
    () =>
      isDark
        ? {
            page: '#1A1A1A',
            surface: '#171717',
            panel: '#1F1F1F',
            rail: '#171717',
            card: '#171717',
            cardActive: '#271F18',
            border: '#2B2B2B',
            borderStrong: '#3A332D',
            text: '#FAFAF9',
            textMuted: '#C0BAB2',
            textSoft: '#8B847C',
            orange: '#F97316',
            orangeSoft: 'rgba(249,115,22,0.15)',
            green: '#10B981',
            greenSoft: 'rgba(16,185,129,0.14)',
          }
        : {
            page: '#F5F5F4',
            surface: '#FFFFFF',
            panel: '#F7F4EF',
            rail: '#FFFFFF',
            card: '#FFFFFF',
            cardActive: '#FFF7ED',
            border: '#E7E0D8',
            borderStrong: '#F2C79C',
            text: '#1F1D1B',
            textMuted: '#625B54',
            textSoft: '#A79F97',
            orange: '#E8862A',
            orangeSoft: '#FFF3E4',
            green: '#059669',
            greenSoft: '#ECFDF5',
          },
    [isDark]
  )
  const threadColors = useMemo<ThreadPanelColors>(
    () => ({
      panelBg: colors.page,
      text: colors.text,
      textSecondary: colors.textMuted,
      textMuted: colors.textSoft,
      border: colors.border,
      iconBoxBg: colors.panel,
      cardBg: colors.card,
      avatarBorder: colors.surface,
      iconHeader: colors.textMuted,
      accent: colors.orange,
      accentSoft: colors.orangeSoft,
    }),
    [colors]
  )

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
      nextGroups.push(centerToGroup(centerBoards[0]))
    }

    const registeredEvents = sortUpcomingEvents(myEvents)
    const liveEventGroups = user && isVerifiedMember
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
    } else if (!user) {
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
  const nativeTabBarStyle = useMemo(
    () => ({
      backgroundColor: isDark ? '#171717' : '#FFFFFF',
      borderTopColor: isDark ? '#262626' : '#E7E5E4',
      height: 84,
      paddingTop: 8,
      paddingBottom: 18,
    }),
    [isDark]
  )

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
    <View style={{ flex: 1, backgroundColor: colors.page }}>
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
        onScroll={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
          const paddingToBottom = 400
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreRef.current?.()
          }
        }}
        scrollEventThrottle={400}
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
                    <View style={{ width: '50%', height: 14, borderRadius: 7, backgroundColor: colors.panel }} />
                    <View style={{ width: '30%', height: 12, borderRadius: 6, backgroundColor: colors.panel }} />
                  </View>
                </View>
                <View style={{ width: '80%', height: 12, borderRadius: 6, backgroundColor: colors.panel }} />
                <View style={{ width: '60%', height: 12, borderRadius: 6, backgroundColor: colors.panel }} />
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
                <PostThread post={selectedPost} colors={colors} fullScreen bottomInset={insets.bottom} />
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

function FeedWorkspace({
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
  colors: ColorSet
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
          <FeedList posts={posts} colors={threadColors} feedColors={colors} onSelectPost={onSelectPost} />
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

  return <FeedList posts={posts} colors={threadColors} feedColors={colors} onSelectPost={onSelectPost} />
}

function FeedPostCard({
  post,
  colors,
  onPress,
}: {
  post: FeedPost
  colors: ColorSet
  onPress?: () => void
}) {
  const reactions = post.reactions ?? [{ emoji: '🙏', count: 2 }]
  const replies = post.replyCount ?? 2

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <View
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            backgroundColor: post.sourceKind === 'event' ? colors.orangeSoft : colors.panel,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {post.sourceKind === 'event' ? (
            <CalendarDays size={10} color={colors.orange} strokeWidth={2.4} />
          ) : (
            <Building2 size={10} color={colors.textMuted} strokeWidth={2.3} />
          )}
        </View>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }} numberOfLines={1}>
          {post.sourceTitle}
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }}>
          · {post.timestamp}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Avatar
          name={post.author.name}
          initials={post.author.initials}
          size={38}
          backgroundColor={post.author.accentColor}
        />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}>
              {post.author.name}
            </Text>
            {post.author.verification === 'sevak' ? (
              <View style={{ backgroundColor: colors.orangeSoft, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10, color: colors.orange }}>SEVAK</Text>
              </View>
            ) : null}
          </View>

          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.text }}>
            {post.body}
          </Text>

          {post.attachmentLabel ? (
            <View
              style={{
                marginTop: 4,
                height: 64,
                borderRadius: 12,
                backgroundColor: colors.panel,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>
                {post.attachmentLabel}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
            {reactions.map((reaction, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 13 }}>{reaction.emoji}</Text>
                <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
                  {reaction.count}
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MessageCircle size={13} color={colors.textMuted} />
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textMuted }}>
                {replies}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function FeedList({
  posts,
  colors,
  feedColors,
  onSelectPost,
  loadMoreRef,
}: {
  posts: FeedPost[]
  colors: ThreadPanelColors
  feedColors: ColorSet
  onSelectPost: (id: string) => void
  loadMoreRef?: React.MutableRefObject<(() => void) | null>
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

  useEffect(() => {
    if (loadMoreRef) {
      loadMoreRef.current = loadMore
    }
  }, [loadMore, loadMoreRef])

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

function PostThread({
  post,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  post: FeedPost
  colors: ColorSet
  fullScreen?: boolean
  bottomInset?: number
}) {
  const replies = post.replyMessages.slice(0, Math.max(post.replyCount ?? post.replyMessages.length, 1))
  const content = (
    <View style={{ paddingHorizontal: fullScreen ? 16 : 4, paddingTop: fullScreen ? 14 : 0, paddingBottom: 16 }}>
      <SourceBoardChip post={post} colors={colors} />
      <PostMessageBlock message={post} colors={colors} original />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 14 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, letterSpacing: 0.5, color: colors.textSoft }}>
          {replies.length} {replies.length === 1 ? 'REPLY' : 'REPLIES'}
        </Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>

      <View style={{ gap: 16 }}>
        {replies.map((reply) => (
          <PostMessageBlock key={reply.id} message={reply} colors={colors} />
        ))}
      </View>
    </View>
  )

  return (
    <View style={{ flex: fullScreen ? 1 : undefined, backgroundColor: colors.page }}>
      {!fullScreen ? (
        <View style={{ paddingHorizontal: 4, paddingTop: 6, paddingBottom: 14, gap: 8 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.orange }}>
            {post.sourceLabel}
          </Text>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 24, lineHeight: 29, color: colors.text }}>
            Post
          </Text>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
            {post.sourceSubtitle}
          </Text>
        </View>
      ) : null}
      {fullScreen ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
          <ThreadReplyComposer colors={colors} bottomInset={bottomInset} />
        </>
      ) : (
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            overflow: 'hidden',
          }}
        >
          {content}
          <ThreadReplyComposer colors={colors} bottomInset={0} compact />
        </View>
      )}
    </View>
  )
}

function SourceBoardChip({ post, colors }: { post: FeedPost; colors: ColorSet }) {
  const isEvent = post.groupKind === 'event'
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 999,
        backgroundColor: colors.orangeSoft,
        paddingHorizontal: 11,
        paddingVertical: 7,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {isEvent ? (
        <CalendarDays size={13} color={colors.orange} strokeWidth={2.3} />
      ) : (
        <Building2 size={13} color={colors.orange} strokeWidth={2.3} />
      )}
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.orange }}>
        {post.sourceTitle} - Board
      </Text>
    </View>
  )
}

function PostMessageBlock({
  message,
  colors,
  original = false,
}: {
  message: BoardMessage
  colors: ColorSet
  original?: boolean
}) {
  const reactions = message.reactions ?? []

  return (
    <View style={{ flexDirection: 'row', gap: original ? 12 : 10 }}>
      <Avatar
        name={message.author.name}
        initials={message.author.initials}
        size={original ? 42 : 34}
        backgroundColor={message.author.accentColor}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: original ? 15 : 13, color: colors.text }}>
            {message.author.name}
          </Text>
          {message.author.verification === 'sevak' ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: '#C2410C' }}>SEVAK</Text>
          ) : null}
          {message.pinned ? (
            <View style={{ borderRadius: 999, backgroundColor: colors.panel, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textMuted }}>Pinned</Text>
            </View>
          ) : null}
          <Text style={{ marginLeft: 'auto', fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }}>
            {message.timestamp}
          </Text>
        </View>

        <Text
          style={{
            marginTop: original ? 8 : 5,
            fontFamily: 'Inclusive Sans',
            fontSize: original ? 16 : 14,
            lineHeight: original ? 23 : 20,
            color: colors.textMuted,
          }}
        >
          {message.body}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 10 }}>
          {reactions.map((reaction, index) => (
            <ReactionChip
              key={`${reaction.emoji}-${index}`}
              emoji={reaction.emoji}
              count={reaction.count}
              colors={colors}
              active={index === 0}
            />
          ))}
          {original ? (
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }}>+ React</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

function ReactionChip({
  emoji,
  count,
  colors,
  active,
}: {
  emoji: string
  count: number
  colors: ColorSet
  active?: boolean
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.borderStrong : colors.border,
        backgroundColor: active ? colors.orangeSoft : colors.panel,
        paddingHorizontal: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.textMuted }}>{count}</Text>
    </View>
  )
}

function ThreadReplyComposer({
  colors,
  bottomInset,
  compact = false,
}: {
  colors: ColorSet
  bottomInset: number
  compact?: boolean
}) {
  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
        paddingTop: compact ? 9 : 10,
        paddingHorizontal: 12,
        paddingBottom: compact ? 12 : Math.max(bottomInset, 8) + 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Avatar name="Aditi Mehta" initials="AM" size={30} backgroundColor="#0478A5" />
        <View
          style={{
            flex: 1,
            minHeight: 38,
            borderRadius: 19,
            backgroundColor: colors.panel,
            paddingHorizontal: 14,
            justifyContent: 'center',
          }}
        >
          <TextInput
            editable={false}
            placeholder="Reply..."
            placeholderTextColor={colors.textSoft}
            style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.text }}
          />
        </View>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.orange,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Send size={15} color="#FFFFFF" />
        </View>
      </View>
    </View>
  )
}

function FeedHeader({
  query,
  colors,
  mobileInDetail,
  onBack,
  onChangeQuery,
}: {
  query: string
  colors: ColorSet
  mobileInDetail: boolean
  onBack: () => void
  onChangeQuery: (query: string) => void
}) {
  if (mobileInDetail) {
    return (
      <Pressable
        onPress={onBack}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          paddingVertical: 4,
        }}
      >
        <ArrowLeft size={18} color={colors.textMuted} />
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.textMuted }}>
          Back
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 10, marginBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <View
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 14,
            backgroundColor: colors.page === '#1A1A1A' ? '#262626' : '#E7E5E4',
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={17} color={colors.textSoft} />
          <TextInput
            value={query}
            onChangeText={onChangeQuery}
            placeholder="Search posts, people, groups"
            placeholderTextColor={colors.textSoft}
            style={{
              flex: 1,
              fontFamily: 'Inclusive Sans',
              fontSize: 15,
              color: colors.text,
              paddingVertical: 9,
            }}
           />
        </View>
      </View>
    </View>
  )
}

function NativeChatHeader({
  colors,
  insetsTop,
  title,
  subtitle,
  hideAvatar,
  onBack,
}: {
  colors: ColorSet
  insetsTop: number
  title: string
  subtitle?: string
  hideAvatar?: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        paddingTop: insetsTop + 6,
        paddingHorizontal: 14,
        paddingBottom: 10,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={onBack}
          hitSlop={10}
          style={{
            width: 82,
            minHeight: 42,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowLeft size={21} color={colors.orange} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {hideAvatar ? null : null}
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: colors.textSoft }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 82 }} />
      </View>
    </View>
  )
}

function CreatePostSheet({
  visible,
  colors,
  groups,
  onClose,
}: {
  visible: boolean
  colors: ColorSet
  groups: GroupBoard[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState<string | undefined>()
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'center' ? -1 : 1
      return a.title.localeCompare(b.title)
    })
  }, [groups])
  const selectedGroup = sortedGroups.find((group) => group.id === groupId) ?? sortedGroups[0]

  useEffect(() => {
    if (!visible) {
      setBody('')
      setGroupPickerOpen(false)
      return
    }
    if (!groupId && sortedGroups[0]) {
      setGroupId(sortedGroups[0].id)
    }
  }, [visible, groupId, sortedGroups])

  const canPost = body.trim().length > 0 && !!selectedGroup
  const handlePost = () => {
    if (!canPost) return
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'overFullScreen'}
      transparent={Platform.OS !== 'ios'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.page }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'ios' ? 14 : 18,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable onPress={onClose} hitSlop={8} style={{ minWidth: 64 }}>
            <X size={22} color={colors.textMuted} />
          </Pressable>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>
            New post
          </Text>
          <Pressable
            disabled={!canPost}
            onPress={handlePost}
            hitSlop={8}
            style={{
              minWidth: 64,
              alignItems: 'flex-end',
              opacity: canPost ? 1 : 0.4,
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, color: colors.orange }}>
              Post
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontFamily: 'Inclusive Sans',
                fontSize: 11,
                letterSpacing: 0.8,
                color: colors.textSoft,
                marginBottom: 8,
              }}
            >
              POST TO
            </Text>
            <Pressable
              onPress={() => setGroupPickerOpen((open) => !open)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 11,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: colors.orangeSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedGroup?.kind === 'event' ? (
                  <CalendarDays size={14} color={colors.orange} strokeWidth={2.4} />
                ) : (
                  <Building2 size={14} color={colors.orange} strokeWidth={2.4} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: colors.text }}
                  numberOfLines={1}
                >
                  {selectedGroup ? selectedGroup.title : 'Pick a group'}
                </Text>
                {selectedGroup ? (
                  <Text
                    style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: colors.textSoft }}
                    numberOfLines={1}
                  >
                    {selectedGroup.kind === 'event' ? 'Event board' : 'Center board'}
                  </Text>
                ) : null}
              </View>
              <ChevronDown size={16} color={colors.textSoft} />
            </Pressable>

            {groupPickerOpen ? (
              <View
                style={{
                  marginTop: 8,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  overflow: 'hidden',
                }}
              >
                {sortedGroups.map((group, index) => {
                  const active = group.id === selectedGroup?.id
                  return (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        setGroupId(group.id)
                        setGroupPickerOpen(false)
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 11,
                        backgroundColor: active ? colors.orangeSoft : colors.card,
                        borderBottomWidth: index < sortedGroups.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          backgroundColor: colors.panel,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {group.kind === 'event' ? (
                          <CalendarDays size={12} color={colors.textMuted} strokeWidth={2.3} />
                        ) : (
                          <Building2 size={12} color={colors.textMuted} strokeWidth={2.3} />
                        )}
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: active ? 'Inclusive Sans' : 'Inclusive Sans',
                          fontSize: 14,
                          color: colors.text,
                        }}
                        numberOfLines={1}
                      >
                        {group.title}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Avatar name="You" initials="YO" size={38} backgroundColor={colors.orange} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                autoFocus
                multiline
                value={body}
                onChangeText={setBody}
                placeholder={
                  selectedGroup?.kind === 'event'
                    ? `Share something with ${selectedGroup.title}...`
                    : 'Share something with your center...'
                }
                placeholderTextColor={colors.textSoft}
                style={{
                  minHeight: 160,
                  fontFamily: 'Inclusive Sans',
                  fontSize: 16,
                  lineHeight: 23,
                  color: colors.text,
                  textAlignVertical: 'top',
                  paddingTop: 6,
                }}
              />
            </View>
          </View>

          <Text
            style={{
              marginTop: 16,
              fontFamily: 'Inclusive Sans',
              fontSize: 12.5,
              color: colors.textSoft,
              lineHeight: 18,
            }}
          >
            Visible to verified members in {selectedGroup?.title || 'your group'}.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function EmptyPanel({ title, subtitle, colors }: { title: string; subtitle: string; colors: ColorSet }) {
  return (
    <View style={{ paddingVertical: 18, paddingHorizontal: 4, gap: 5 }}>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: colors.text }}>
        {title}
      </Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
        {subtitle}
      </Text>
    </View>
  )
}

function SignInCallout({ colors, onPress }: { colors: ColorSet; onPress: () => void }) {
  return (
    <View
      style={{
        backgroundColor: colors.orangeSoft,
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 15,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <UsersRound size={20} color={colors.orange} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: colors.text }}>
          Sign in for Feed
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, lineHeight: 19, color: colors.textMuted }}>
          Your member feed, group boards, and announcements live here.
        </Text>
      </View>
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: colors.text,
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: colors.surface }}>
          Sign in
        </Text>
      </Pressable>
    </View>
  )
}

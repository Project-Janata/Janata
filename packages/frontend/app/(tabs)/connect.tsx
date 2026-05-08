import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
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
  Camera,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Send,
  UsersRound,
  X,
} from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import { Avatar } from '../../components/ui'
import { useTheme, useUser } from '../../components/contexts'
import { useCenterDetail, useDiscoverData, useMyEvents } from '../../hooks/useApiData'
import { extractCityState } from '../../utils/addressParsing'
import {
  ThreadPanel,
  buildCenterBoard,
  buildEventBoard,
  centerBoards,
  connectionRequests,
  eventBoards,
  groupChats,
  inboxThreads,
  type BoardMessage,
  type CenterBoard,
  type EventBoard,
  type GroupChatThread,
  type InboxThread,
  type PersonSummary,
  type ThreadPanelColors,
} from '../../components/connect'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'

type ConnectMode = 'Feed' | 'Messages'
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

type ChatMessage = {
  id: string
  sender: 'them' | 'you'
  timestamp: string
  body: string
  authorName?: string
}

type Conversation = {
  id: string
  type: 'group' | 'dm'
  title: string
  subtitle: string
  preview: string
  lastActiveLabel: string
  unread: boolean
  groupKind?: GroupKind
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  messages: ChatMessage[]
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
  events: EventDisplay[],
  anchor?: { latitude?: number | null; longitude?: number | null } | null
) {
  const distanceMi = haversineMiles(anchor, center)
  const eventCount = events.filter((event) => event.centerId === center.id).length
  const locationLabel = extractCityState(center.address) || center.address || 'Center board'
  const distanceLabel = formatDistance(distanceMi)
  const subtitle = [
    locationLabel,
    distanceLabel ? `${distanceLabel} away` : null,
    eventCount > 0 ? `${eventCount} upcoming` : null,
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

function dmToConversation(thread: InboxThread): Conversation {
  return {
    id: `dm-${thread.id}`,
    type: 'dm',
    title: thread.person.name,
    subtitle: thread.connectedSince,
    preview: thread.preview,
    lastActiveLabel: thread.lastActiveLabel,
    unread: thread.unread,
    avatarName: thread.person.name,
    avatarInitials: thread.person.initials,
    avatarColor: thread.person.accentColor,
    messages: thread.messages,
  }
}

function mockGroupChatToConversation(chat: GroupChatThread): Conversation {
  return {
    id: `groupchat-${chat.id}`,
    type: 'group',
    title: chat.title,
    subtitle: `${chat.kind === 'event' ? 'Event chat' : 'Center chat'} · ${chat.memberCount} members`,
    preview: chat.preview,
    lastActiveLabel: chat.lastActiveLabel,
    unread: chat.unreadCount > 0,
    groupKind: chat.kind,
    groupMembers: chat.members,
    messages: chat.messages.map((message) => ({
      id: message.id,
      sender: message.sender,
      timestamp: message.timestamp,
      body: message.body,
      authorName: message.authorName,
    })),
  }
}

export default function ConnectScreen() {
  const router = useRouter()
  const navigation = useNavigation()
  const { user } = useUser()
  const { isDark } = useTheme()
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const posthog = usePostHog()
  const detailTranslateX = useRef(new Animated.Value(width)).current
  const { events: myEvents, loading: myEventsLoading } = useMyEvents(user?.username)
  const {
    center,
    events: centerEvents,
    loading: centerLoading,
  } = useCenterDetail(user?.centerID || '')
  const {
    allEvents,
    allCenters,
    loading: discoverLoading,
  } = useDiscoverData('Centers', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID)

  const isDesktop = width >= 980
  const [mode, setMode] = useState<ConnectMode>('Feed')
  const [query, setQuery] = useState('')
  const [selectedPostId, setSelectedPostId] = useState('')
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [demoVerified, setDemoVerified] = useState(false)
  const [createPostOpen, setCreatePostOpen] = useState(false)

  const colors = useMemo<ColorSet>(
    () =>
      isDark
        ? {
            page: '#171717',
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
            page: '#FFFFFF',
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
  const userCenter = center || allCenters.find((item) => item.id === user?.centerID)
  const groups = useMemo<GroupBoard[]>(() => {
    if (user && !isVerifiedMember) return []

    const nextGroups: GroupBoard[] = []

    if (user && isVerifiedMember) {
      const nearbyCenterGroups = allCenters.map((item) =>
        centerToNearbyGroup(item, allEvents, userCenter)
      )
      nextGroups.push(...nearbyCenterGroups)

      if (nearbyCenterGroups.length === 0 && center) {
        nextGroups.push(
          centerToGroup(
            buildCenterBoard({
              id: `center-${center.id}`,
              centerName: center.name,
              subtitle: `${center.memberCount || 0} members - ${centerEvents.length} upcoming events`,
            }),
            0
          )
        )
      }
    } else if (!user) {
      nextGroups.push(centerToGroup(centerBoards[0]))
    }

    const registeredEvents = sortUpcomingEvents(myEvents)
    const registeredFromDiscover = sortUpcomingEvents(allEvents.filter((event) => event.isRegistered))
    const eventSource = registeredFromDiscover.length > 0 ? registeredFromDiscover : registeredEvents
    const liveEventGroups = user && isVerifiedMember
      ? eventSource.map((event) => {
          const eventDistance = haversineMiles(userCenter, {
            latitude: event.latitude,
            longitude: event.longitude,
          })
          return eventToGroup(eventToBoard(event, center?.name), eventDistance)
        })
      : []

    if (liveEventGroups.length > 0) {
      nextGroups.push(...liveEventGroups)
    } else if (!user) {
      nextGroups.push(...eventBoards.map(eventToGroup))
    }

    return sortGroupsByDistance(nextGroups)
  }, [allCenters, allEvents, center, centerEvents.length, isVerifiedMember, myEvents, user, userCenter])

  const feedPosts = useMemo(() => buildFeedPosts(groups), [groups])
  const conversations = useMemo(() => {
    const mockGroupConversations = canAccessBoards ? groupChats.map(mockGroupChatToConversation) : []
    const dmConversations = inboxThreads.map(dmToConversation)
    return [...mockGroupConversations, ...dmConversations]
  }, [canAccessBoards])

  const filteredFeedPosts = useMemo(() => {
    if (!query.trim()) return feedPosts
    return feedPosts.filter(
      (post) =>
        matchesQuery(post.body, query) ||
        matchesQuery(post.author.name, query) ||
        matchesQuery(post.sourceTitle, query)
    )
  }, [feedPosts, query])

  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations
    return conversations.filter(
      (conversation) =>
        matchesQuery(conversation.title, query) ||
        matchesQuery(conversation.preview, query) ||
        matchesQuery(conversation.subtitle, query)
    )
  }, [conversations, query])

  const selectedPost = feedPosts.find((post) => post.id === selectedPostId) ?? feedPosts[0]
  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0]
  const mobilePostOpen = !isDesktop && mode === 'Feed' && !!selectedPostId
  const mobileConversationOpen = !isDesktop && mode === 'Messages' && !!selectedConversationId
  const nativeDetailOpen = Platform.OS !== 'web' && (mobilePostOpen || mobileConversationOpen)
  const listTopPadding = Platform.OS === 'web' ? 20 : Math.max(insets.top, 54) + 16
  const isLoading = user ? myEventsLoading || centerLoading || discoverLoading : false
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
    setSelectedConversationId('')
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
    primeNativeDetailTransition()
    setSelectedConversationId('')
    setSelectedPostId(id)
  }

  const openConversation = (id: string) => {
    posthog?.capture('connect_conversation_selected', { conversationId: id })
    primeNativeDetailTransition()
    setSelectedPostId('')
    setSelectedConversationId(id)
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.page }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    )
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
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          mode={mode}
          query={query}
          isDesktop={isDesktop}
          colors={colors}
          mobileInDetail={(mobilePostOpen || mobileConversationOpen) && !nativeDetailOpen}
          onBack={closeDetail}
          onChangeMode={setMode}
          onChangeQuery={setQuery}
          onCreatePost={() => {
            posthog?.capture('connect_create_post_pressed', { mode })
            setCreatePostOpen(true)
          }}
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

        {mode === 'Feed' ? (
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
        ) : (
          <MessagesWorkspace
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            colors={colors}
            isDesktop={isDesktop}
            nativeDetailOpen={nativeDetailOpen}
            mobileConversationOpen={mobileConversationOpen}
            onSelectConversation={openConversation}
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
              title={mobileConversationOpen && selectedConversation ? selectedConversation.title : 'Post'}
              subtitle={
                mobileConversationOpen && selectedConversation
                  ? selectedConversation.subtitle
                  : selectedPost?.sourceTitle
              }
              avatarName={mobileConversationOpen && selectedConversation ? selectedConversation.avatarName : undefined}
              avatarInitials={mobileConversationOpen && selectedConversation ? selectedConversation.avatarInitials : undefined}
              avatarColor={mobileConversationOpen && selectedConversation ? selectedConversation.avatarColor : undefined}
              groupMembers={mobileConversationOpen && selectedConversation ? selectedConversation.groupMembers : undefined}
              groupKind={
                mobileConversationOpen && selectedConversation
                  ? selectedConversation.groupKind
                  : selectedPost?.groupKind
              }
              hideAvatar={!mobileConversationOpen}
              onBack={closeDetail}
            />
            <View style={{ flex: 1 }}>
              {mobilePostOpen && selectedPost ? (
                <PostThread post={selectedPost} colors={colors} fullScreen bottomInset={insets.bottom} />
              ) : null}
              {mobileConversationOpen && selectedConversation ? (
                <ConversationThread conversation={selectedConversation} colors={colors} fullScreen bottomInset={insets.bottom} />
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}

      <CreatePostSheet
        visible={createPostOpen}
        mode={mode}
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
          <FeedList posts={posts} colors={threadColors} onSelectPost={onSelectPost} />
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

  return <FeedList posts={posts} colors={threadColors} onSelectPost={onSelectPost} />
}

function FeedList({
  posts,
  colors,
  onSelectPost,
}: {
  posts: FeedPost[]
  colors: ThreadPanelColors
  onSelectPost: (id: string) => void
}) {
  return (
    <ThreadPanel
      messages={posts}
      colors={colors}
      emptyTitle="No posts found"
      emptySubtitle="Try a different search or check back after your next event."
      composerPlaceholder="Share something with your center..."
      showComposer={false}
      showSource
      onMessagePress={(message) => onSelectPost(message.id)}
    />
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
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, letterSpacing: 0.5, color: colors.textSoft }}>
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
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.orange }}>
            {post.sourceLabel}
          </Text>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, lineHeight: 29, color: colors.text }}>
            Post
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
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
      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.orange }}>
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
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: original ? 15 : 13, color: colors.text }}>
            {message.author.name}
          </Text>
          {message.author.verification === 'sevak' ? (
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 12, color: '#C2410C' }}>SEVAK</Text>
          ) : null}
          {message.pinned ? (
            <View style={{ borderRadius: 999, backgroundColor: colors.panel, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.textMuted }}>Pinned</Text>
            </View>
          ) : null}
          <Text style={{ marginLeft: 'auto', fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textSoft }}>
            {message.timestamp}
          </Text>
        </View>

        <Text
          style={{
            marginTop: original ? 8 : 5,
            fontFamily: 'Inter-Regular',
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
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.textSoft }}>+ React</Text>
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
      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.textMuted }}>{count}</Text>
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
            style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.text }}
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

function MessagesWorkspace({
  conversations,
  selectedConversation,
  colors,
  isDesktop,
  nativeDetailOpen,
  mobileConversationOpen,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversation?: Conversation
  colors: ColorSet
  isDesktop: boolean
  nativeDetailOpen: boolean
  mobileConversationOpen: boolean
  onSelectConversation: (id: string) => void
}) {
  if (isDesktop) {
    return (
      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}>
        <View style={{ width: 360 }}>
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            colors={colors}
            onSelectConversation={onSelectConversation}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          {selectedConversation ? (
            <ConversationThread conversation={selectedConversation} colors={colors} />
          ) : (
            <EmptyPanel title="No messages found" subtitle="Try a different search." colors={colors} />
          )}
        </View>
      </View>
    )
  }

  if (mobileConversationOpen && !nativeDetailOpen && selectedConversation) {
    return <ConversationThread conversation={selectedConversation} colors={colors} />
  }

  return (
    <View style={{ gap: 14 }}>
      <RequestsBanner colors={colors} />
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        colors={colors}
        onSelectConversation={onSelectConversation}
      />
    </View>
  )
}

function NativeChatHeader({
  colors,
  insetsTop,
  title,
  subtitle,
  avatarName,
  avatarInitials,
  avatarColor,
  groupMembers,
  groupKind,
  hideAvatar,
  onBack,
}: {
  colors: ColorSet
  insetsTop: number
  title: string
  subtitle?: string
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupMembers?: PersonSummary[]
  groupKind?: GroupKind
  hideAvatar?: boolean
  onBack: () => void
}) {
  return (
    <View
      style={{
        paddingTop: Math.max(insetsTop, 48) + 6,
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
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.orange }}>
            Back
          </Text>
        </Pressable>

        <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {hideAvatar ? null : groupMembers && groupMembers.length > 0 ? (
            <GroupConversationAvatar members={groupMembers} size={36} colors={colors} />
          ) : groupKind ? (
            <GroupIcon kind={groupKind} colors={colors} active />
          ) : (
            <Avatar
              name={avatarName || title}
              initials={avatarInitials}
              size={34}
              backgroundColor={avatarColor}
            />
          )}
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.text }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.textSoft }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={{ width: 82 }} />
      </View>
    </View>
  )
}

function Header({
  mode,
  query,
  isDesktop,
  colors,
  mobileInDetail,
  onBack,
  onChangeMode,
  onChangeQuery,
  onCreatePost,
}: {
  mode: ConnectMode
  query: string
  isDesktop: boolean
  colors: ColorSet
  mobileInDetail: boolean
  onBack: () => void
  onChangeMode: (mode: ConnectMode) => void
  onChangeQuery: (query: string) => void
  onCreatePost: () => void
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
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.textMuted }}>
          Back
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 10 }}>
      <Text
        style={{
          fontFamily: 'Inter-Bold',
          fontSize: isDesktop ? 30 : 26,
          lineHeight: 32,
          letterSpacing: -0.4,
          color: colors.text,
          marginBottom: 2,
        }}
      >
        Connect
      </Text>

      <ModeSwitch mode={mode} colors={colors} onChangeMode={onChangeMode} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
        <View
          style={{
            flex: 1,
            minHeight: 42,
            borderRadius: 14,
            backgroundColor: colors.panel,
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
            placeholder={mode === 'Feed' ? 'Search posts, people, groups' : 'Search messages'}
            placeholderTextColor={colors.textSoft}
            style={{
              flex: 1,
              fontFamily: 'Inter-Regular',
              fontSize: 15,
              color: colors.text,
              paddingVertical: 9,
            }}
          />
        </View>
        <Pressable
          onPress={onCreatePost}
          accessibilityRole="button"
          accessibilityLabel={mode === 'Feed' ? 'New post' : 'New message'}
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            backgroundColor: colors.orange,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#C2410C',
            shadowOpacity: 0.18,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.6} />
        </Pressable>
      </View>
    </View>
  )
}

function ModeSwitch({
  mode,
  colors,
  onChangeMode,
}: {
  mode: ConnectMode
  colors: ColorSet
  onChangeMode: (mode: ConnectMode) => void
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 24, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {(['Feed', 'Messages'] as ConnectMode[]).map((item) => {
        const active = item === mode
        return (
          <Pressable
            key={item}
            onPress={() => onChangeMode(item)}
            style={{
              paddingTop: 4,
              paddingBottom: 10,
              borderBottomWidth: 2,
              borderBottomColor: active ? colors.orange : 'transparent',
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-Bold',
                fontSize: 18,
                color: active ? colors.orange : colors.textMuted,
              }}
            >
              {item}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function ConversationList({
  conversations,
  selectedConversationId,
  colors,
  onSelectConversation,
}: {
  conversations: Conversation[]
  selectedConversationId?: string
  colors: ColorSet
  onSelectConversation: (id: string) => void
}) {
  return (
    <View style={{ gap: 2 }}>
      {conversations.length === 0 ? (
        <EmptyPanel title="No messages found" subtitle="Try a different search." colors={colors} />
      ) : null}
      {conversations.map((conversation) => (
        <Pressable
          key={conversation.id}
          onPress={() => onSelectConversation(conversation.id)}
          style={{
            paddingHorizontal: 4,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: conversation.id === selectedConversationId ? colors.cardActive : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            {conversation.type === 'group' && conversation.groupMembers ? (
              <GroupConversationAvatar members={conversation.groupMembers} size={44} colors={colors} />
            ) : (
              <Avatar
                name={conversation.avatarName || conversation.title}
                initials={conversation.avatarInitials}
                size={42}
                backgroundColor={conversation.avatarColor}
              />
            )}
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.text }} numberOfLines={1}>
                    {conversation.title}
                  </Text>
                  {conversation.type === 'group' && conversation.groupMembers ? (
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.textSoft }}>
                      - {conversation.groupMembers.length}
                    </Text>
                  ) : null}
                </View>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: conversation.unread ? colors.orange : colors.textSoft }}>
                  {conversation.lastActiveLabel}
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textSoft }} numberOfLines={1}>
                {conversation.subtitle}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
                {conversation.preview}
              </Text>
            </View>
            {conversation.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} /> : null}
          </View>
        </Pressable>
      ))}
    </View>
  )
}

function ConversationThread({
  conversation,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  conversation: Conversation
  colors: ColorSet
  fullScreen?: boolean
  bottomInset?: number
}) {
  const messages = conversation.messages.map((message, index) => {
    const previous = conversation.messages[index - 1]
    const next = conversation.messages[index + 1]

    return (
      <MessageBubble
        key={message.id}
        message={message}
        previousSender={previous?.sender}
        nextSender={next?.sender}
        colors={colors}
        showAuthor={conversation.type === 'group'}
      />
    )
  })

  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        backgroundColor: fullScreen ? colors.page : 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: fullScreen ? 0 : 22,
        overflow: fullScreen ? 'visible' : 'hidden',
      }}
    >
      {!fullScreen ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {conversation.type === 'group' && conversation.groupMembers ? (
            <GroupConversationAvatar members={conversation.groupMembers} size={44} colors={colors} />
          ) : (
            <Avatar
              name={conversation.avatarName || conversation.title}
              initials={conversation.avatarInitials}
              size={44}
              backgroundColor={conversation.avatarColor}
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.text }}>
              {conversation.title}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textMuted }}>
              {conversation.subtitle}
            </Text>
          </View>
        </View>
      ) : null}

      {fullScreen ? (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 18, gap: 6 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages}
          </ScrollView>
          <ChatComposer
            colors={colors}
            bottomInset={bottomInset}
            placeholder={conversation.type === 'group' ? 'Message group' : `Message ${conversation.title.split(' ')[0]}`}
          />
        </>
      ) : (
        <>
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 6 }}>
            {messages}
          </View>
          <ChatComposer
            colors={colors}
            bottomInset={0}
            placeholder={conversation.type === 'group' ? 'Message group' : 'Write a message...'}
            compact
          />
        </>
      )}
    </View>
  )
}

function MessageBubble({
  message,
  previousSender,
  nextSender,
  colors,
  showAuthor,
}: {
  message: ChatMessage
  previousSender?: 'them' | 'you'
  nextSender?: 'them' | 'you'
  colors: ColorSet
  showAuthor?: boolean
}) {
  const isYou = message.sender === 'you'
  const isFirstInRun = previousSender !== message.sender
  const isLastInRun = nextSender !== message.sender
  const incomingBubble = colors.surface === '#171717' ? '#262626' : '#F5F0EB'

  return (
    <View style={{ gap: 4, marginTop: isFirstInRun ? 8 : 0 }}>
      {isFirstInRun ? (
        <Text
          style={{
            alignSelf: isYou ? 'flex-end' : 'flex-start',
            paddingHorizontal: 8,
            fontFamily: 'Inter-Regular',
            fontSize: 11,
            color: colors.textSoft,
          }}
        >
          {showAuthor && !isYou && message.authorName ? `${message.authorName} · ${message.timestamp}` : message.timestamp}
        </Text>
      ) : null}
      <View
        style={{
          alignSelf: isYou ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isYou ? colors.orangeSoft : incomingBubble,
          borderWidth: 1,
          borderColor: isYou ? colors.borderStrong : colors.border,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: isYou || !isLastInRun ? 20 : 6,
          borderBottomRightRadius: isYou && isLastInRun ? 6 : 20,
        }}
      >
        <Text
          style={{
            fontFamily: 'Inter-Regular',
            fontSize: 15,
            lineHeight: 21,
            color: colors.text,
          }}
        >
          {message.body}
        </Text>
      </View>
    </View>
  )
}

function ChatComposer({
  colors,
  bottomInset,
  placeholder,
  compact = false,
}: {
  colors: ColorSet
  bottomInset: number
  placeholder: string
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
        <Pressable
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.page,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Camera size={16} color={colors.textMuted} />
        </Pressable>
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
            placeholder={placeholder}
            placeholderTextColor={colors.textSoft}
            style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.text }}
          />
        </View>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
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

function RequestsBanner({ colors }: { colors: ColorSet }) {
  if (connectionRequests.length === 0) return null
  const previewNames = connectionRequests
    .slice(0, 2)
    .map((request) => request.person.name.split(' ')[0])
    .join(', ')
  const subtitle = `${previewNames}${connectionRequests.length > 2 ? ' and others' : ''} · met at recent events`
  const stackPeople = connectionRequests.slice(0, 3).map((request) => request.person)

  return (
    <Pressable
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <RequestAvatarStack people={stackPeople} colors={colors} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.text }} numberOfLines={1}>
          {connectionRequests.length} message {connectionRequests.length === 1 ? 'request' : 'requests'}
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12.5, color: colors.textMuted }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textSoft} />
    </Pressable>
  )
}

function RequestAvatarStack({ people, colors }: { people: PersonSummary[]; colors: ColorSet }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {people.map((person, index) => (
        <View
          key={person.id}
          style={{
            marginLeft: index === 0 ? 0 : -10,
            borderWidth: 2,
            borderColor: colors.card,
            borderRadius: 16,
          }}
        >
          <Avatar
            name={person.name}
            initials={person.initials}
            size={32}
            backgroundColor={person.accentColor}
          />
        </View>
      ))}
    </View>
  )
}

function GroupConversationAvatar({
  members,
  size = 44,
  colors,
}: {
  members: PersonSummary[]
  size?: number
  colors: ColorSet
}) {
  const fallbackMember: PersonSummary = { id: 'group', name: 'Group', initials: 'G' }
  const shown = members.length > 0 ? members.slice(0, 4) : [fallbackMember]
  const half = size / 2

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {shown.map((member, index) => (
        <View
          key={`${member.id}-${index}`}
          style={{
            position: 'absolute',
            left: (index % 2) * half,
            top: Math.floor(index / 2) * half,
            width: half,
            height: half,
            backgroundColor: member.accentColor || colors.orange,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: Math.max(9, half * 0.42), color: '#FFFFFF' }}>
            {(member.initials || member.name || '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
      ))}
    </View>
  )
}

function GroupIcon({
  kind,
  colors,
  active,
}: {
  kind: GroupKind
  colors: ColorSet
  active?: boolean
}) {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 15,
        backgroundColor: active ? colors.orange : colors.orangeSoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {kind === 'center' ? (
        <Building2 size={19} color={active ? '#FFFFFF' : colors.orange} />
      ) : (
        <CalendarDays size={19} color={active ? '#FFFFFF' : colors.orange} />
      )}
    </View>
  )
}

function CreatePostSheet({
  visible,
  mode,
  colors,
  groups,
  onClose,
}: {
  visible: boolean
  mode: ConnectMode
  colors: ColorSet
  groups: GroupBoard[]
  onClose: () => void
}) {
  const [body, setBody] = useState('')
  const [groupId, setGroupId] = useState<string | undefined>()
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)

  const isMessage = mode === 'Messages'
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
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.text }}>
            {isMessage ? 'New message' : 'New post'}
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
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.orange }}>
              {isMessage ? 'Send' : 'Post'}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {!isMessage ? (
            <View style={{ marginBottom: 14 }}>
              <Text
                style={{
                  fontFamily: 'Inter-SemiBold',
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
                    style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.text }}
                    numberOfLines={1}
                  >
                    {selectedGroup ? selectedGroup.title : 'Pick a group'}
                  </Text>
                  {selectedGroup ? (
                    <Text
                      style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textSoft }}
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
                            fontFamily: active ? 'Inter-SemiBold' : 'Inter-Regular',
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
          ) : null}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <Avatar name="You" initials="YO" size={38} backgroundColor={colors.orange} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <TextInput
                autoFocus
                multiline
                value={body}
                onChangeText={setBody}
                placeholder={
                  isMessage
                    ? 'Write a message...'
                    : selectedGroup?.kind === 'event'
                      ? `Share something with ${selectedGroup.title}...`
                      : 'Share something with your center...'
                }
                placeholderTextColor={colors.textSoft}
                style={{
                  minHeight: 160,
                  fontFamily: 'Inter-Regular',
                  fontSize: 16,
                  lineHeight: 23,
                  color: colors.text,
                  textAlignVertical: 'top',
                  paddingTop: 6,
                }}
              />
            </View>
          </View>

          {!isMessage ? (
            <Text
              style={{
                marginTop: 16,
                fontFamily: 'Inter-Regular',
                fontSize: 12.5,
                color: colors.textSoft,
                lineHeight: 18,
              }}
            >
              Visible to verified members in {selectedGroup?.title || 'your group'}.
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function EmptyPanel({ title, subtitle, colors }: { title: string; subtitle: string; colors: ColorSet }) {
  return (
    <View style={{ paddingVertical: 18, paddingHorizontal: 4, gap: 5 }}>
      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.text }}>
        {title}
      </Text>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
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
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 16, color: colors.text }}>
          Sign in for Connect
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 19, color: colors.textMuted }}>
          Your member feed, group chats, requests, and DMs live here.
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
        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.surface }}>
          Sign in
        </Text>
      </Pressable>
    </View>
  )
}

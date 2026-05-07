import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
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
  Bell,
  Building2,
  CalendarDays,
  Camera,
  ChevronRight,
  Hash,
  Inbox,
  MessageCircleMore,
  Search,
  Send,
  UsersRound,
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
  inboxThreads,
  unreadInboxCount,
  type BoardMessage,
  type CenterBoard,
  type EventBoard,
  type InboxThread,
  type ThreadPanelColors,
} from '../../components/connect'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'

type ConnectMode = 'Groups' | 'DMs'
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
    eyebrow: 'Center group',
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
    meta: distanceLabel ? `${distanceLabel} away` : `${board.messages.length} replies`,
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
  const locationLabel = extractCityState(center.address) || center.address || 'Center group'
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
  const [mode, setMode] = useState<ConnectMode>('Groups')
  const [query, setQuery] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedDmId, setSelectedDmId] = useState('')
  const [demoVerified, setDemoVerified] = useState(false)

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
  const canAccessGroups = !!user && isVerifiedMember
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

  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups
    return groups.filter(
      (group) =>
        matchesQuery(group.title, query) ||
        matchesQuery(group.subtitle, query) ||
        matchesQuery(group.preview, query)
    )
  }, [groups, query])

  const filteredDms = useMemo(() => {
    if (!query.trim()) return inboxThreads
    return inboxThreads.filter(
      (thread) =>
        matchesQuery(thread.person.name, query) ||
        matchesQuery(thread.preview, query) ||
        matchesQuery(thread.person.subtitle || '', query)
    )
  }, [query])

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0]
  const selectedDm = inboxThreads.find((thread) => thread.id === selectedDmId) ?? inboxThreads[0]
  const mobileGroupOpen = !isDesktop && mode === 'Groups' && !!selectedGroupId
  const mobileDmOpen = !isDesktop && mode === 'DMs' && !!selectedDmId
  const nativeDetailOpen = Platform.OS !== 'web' && (mobileGroupOpen || mobileDmOpen)
  const groupSummaryLabel = !user
    ? 'Sign in for groups'
    : canAccessGroups
      ? `${groups.length} groups`
      : 'Verify for groups'
  const groupAnchorLabel = userCenter?.name ? `Sorted from ${userCenter.name}` : 'Sorted by nearby centers'
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
    setSelectedGroupId('')
    setSelectedDmId('')
  }

  const handleGroupAccessCta = () => {
    if (!user) {
      posthog?.capture('connect_signin_pressed', { source: 'groups_cta' })
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

  const openGroup = (id: string) => {
    posthog?.capture('connect_group_selected', { groupId: id })
    primeNativeDetailTransition()
    setSelectedDmId('')
    setSelectedGroupId(id)
  }

  const openDm = (id: string) => {
    posthog?.capture('connect_dm_selected', { threadId: id })
    primeNativeDetailTransition()
    setSelectedGroupId('')
    setSelectedDmId(id)
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
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header
          mode={mode}
          query={query}
          isDesktop={isDesktop}
          colors={colors}
          groupLabel={groupSummaryLabel}
          unreadCount={unreadInboxCount}
          requestCount={connectionRequests.length}
          mobileInDetail={(mobileGroupOpen || mobileDmOpen) && !nativeDetailOpen}
          onBack={closeDetail}
          onChangeMode={setMode}
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

        {isDesktop ? (
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
            <View style={{ width: 328 }}>
              <GroupRail
                groups={filteredGroups}
                selectedGroupId={selectedGroup?.id}
                colors={colors}
                canAccessGroups={canAccessGroups}
                isSignedIn={!!user}
                anchorLabel={groupAnchorLabel}
                onRequestAccess={handleGroupAccessCta}
                onSelect={openGroup}
              />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {selectedGroup ? (
                <GroupThread group={selectedGroup} colors={colors} threadColors={threadColors} />
              ) : (
                <EmptyPanel title="No groups yet" subtitle="Join an event or choose a center to start seeing boards." colors={colors} />
              )}
            </View>
            <View style={{ width: 330, gap: 14 }}>
              <RequestsCard colors={colors} />
              <DmRail
                threads={filteredDms}
                selectedThreadId={selectedDm?.id}
                colors={colors}
                compact
                onSelect={openDm}
              />
            </View>
          </View>
        ) : (
          <View>
            {mode === 'Groups' && (!mobileGroupOpen || nativeDetailOpen) ? (
              <GroupRail
                groups={filteredGroups}
                selectedGroupId={selectedGroupId}
                colors={colors}
                canAccessGroups={canAccessGroups}
                isSignedIn={!!user}
                anchorLabel={groupAnchorLabel}
                onRequestAccess={handleGroupAccessCta}
                onSelect={openGroup}
              />
            ) : null}

            {mode === 'Groups' && mobileGroupOpen && !nativeDetailOpen && selectedGroup ? (
              <GroupThread group={selectedGroup} colors={colors} threadColors={threadColors} />
            ) : null}

            {mode === 'DMs' && (!mobileDmOpen || nativeDetailOpen) ? (
              <View style={{ gap: 12 }}>
                <RequestsCard colors={colors} />
                <DmRail
                  threads={filteredDms}
                  selectedThreadId={selectedDmId}
                  colors={colors}
                  onSelect={openDm}
                />
              </View>
            ) : null}

            {mode === 'DMs' && mobileDmOpen && !nativeDetailOpen && selectedDm ? (
              <DmThread thread={selectedDm} colors={colors} />
            ) : null}
          </View>
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
              title={mobileDmOpen && selectedDm ? selectedDm.person.name : selectedGroup?.title || 'Group'}
              subtitle={mobileDmOpen && selectedDm ? selectedDm.connectedSince : selectedGroup?.subtitle}
              avatarName={mobileDmOpen && selectedDm ? selectedDm.person.name : undefined}
              avatarInitials={mobileDmOpen && selectedDm ? selectedDm.person.initials : undefined}
              avatarColor={mobileDmOpen && selectedDm ? selectedDm.person.accentColor : undefined}
              groupKind={mobileGroupOpen && selectedGroup ? selectedGroup.kind : undefined}
              onBack={closeDetail}
            />
            <View style={{ flex: 1 }}>
              {mobileGroupOpen && selectedGroup ? (
                <GroupThread group={selectedGroup} colors={colors} threadColors={threadColors} fullScreen bottomInset={insets.bottom} />
              ) : null}
              {mobileDmOpen && selectedDm ? (
                <DmThread thread={selectedDm} colors={colors} fullScreen bottomInset={insets.bottom} />
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      ) : null}
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
  groupKind,
  onBack,
}: {
  colors: ColorSet
  insetsTop: number
  title: string
  subtitle?: string
  avatarName?: string
  avatarInitials?: string
  avatarColor?: string
  groupKind?: GroupKind
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
          {groupKind ? (
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
  groupLabel,
  unreadCount,
  requestCount,
  mobileInDetail,
  onBack,
  onChangeMode,
  onChangeQuery,
}: {
  mode: ConnectMode
  query: string
  isDesktop: boolean
  colors: ColorSet
  groupLabel: string
  unreadCount: number
  requestCount: number
  mobileInDetail: boolean
  onBack: () => void
  onChangeMode: (mode: ConnectMode) => void
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
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.textMuted }}>
          Back
        </Text>
      </Pressable>
    )
  }

  return (
    <View style={{ gap: 16 }}>
      <View
        style={{
          flexDirection: isDesktop ? 'row' : 'column',
          alignItems: isDesktop ? 'flex-end' : 'stretch',
          justifyContent: 'space-between',
          gap: 14,
        }}
      >
        <View style={{ gap: 6 }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, lineHeight: 34, color: colors.text }}>
            Connect
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatPill icon={<Hash size={13} color={colors.orange} />} label={groupLabel} colors={colors} />
            <StatPill icon={<Inbox size={13} color={colors.orange} />} label={`${unreadCount} unread`} colors={colors} />
            <StatPill icon={<Bell size={13} color={colors.orange} />} label={`${requestCount} requests`} colors={colors} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ModeSwitch mode={mode} colors={colors} onChangeMode={onChangeMode} />
        </View>
      </View>

      <View
        style={{
          minHeight: 44,
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
          placeholder="Search groups, posts, or people"
          placeholderTextColor={colors.textSoft}
          style={{
            flex: 1,
            fontFamily: 'Inter-Regular',
            fontSize: 15,
            color: colors.text,
            paddingVertical: 10,
          }}
        />
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
    <View
      style={{
        flexDirection: 'row',
        gap: 18,
      }}
    >
      {(['Groups', 'DMs'] as ConnectMode[]).map((item) => {
        const active = item === mode
        return (
          <Pressable
            key={item}
            onPress={() => onChangeMode(item)}
            style={{
              paddingVertical: 8,
              borderBottomWidth: 2,
              borderBottomColor: active ? colors.orange : 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter-SemiBold',
                fontSize: 15,
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

function GroupRail({
  groups,
  selectedGroupId,
  colors,
  canAccessGroups = true,
  isSignedIn = true,
  anchorLabel,
  onRequestAccess,
  onSelect,
}: {
  groups: GroupBoard[]
  selectedGroupId?: string
  colors: ColorSet
  canAccessGroups?: boolean
  isSignedIn?: boolean
  anchorLabel?: string
  onRequestAccess: () => void
  onSelect: (id: string) => void
}) {
  return (
    <View style={{ gap: 10 }}>
      <GroupAccessHeader
        canAccessGroups={canAccessGroups}
        isSignedIn={isSignedIn}
        groupCount={groups.length}
        anchorLabel={anchorLabel}
        colors={colors}
        onRequestAccess={onRequestAccess}
      />

      {!canAccessGroups ? null : groups.length === 0 ? (
        <EmptyPanel title="No groups yet" subtitle="Your center and joined events will appear here." colors={colors} />
      ) : (
        <View style={{ gap: 6 }}>
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              active={group.id === selectedGroupId}
              colors={colors}
              onPress={() => onSelect(group.id)}
            />
          ))}
        </View>
      )}
    </View>
  )
}

function GroupAccessHeader({
  canAccessGroups,
  isSignedIn,
  groupCount,
  anchorLabel,
  colors,
  onRequestAccess,
}: {
  canAccessGroups: boolean
  isSignedIn: boolean
  groupCount: number
  anchorLabel?: string
  colors: ColorSet
  onRequestAccess: () => void
}) {
  if (canAccessGroups) {
    return (
      <View style={{ gap: 3, paddingHorizontal: 4 }}>
        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 0.6, color: colors.textMuted }}>
          GROUPS NEAR YOU
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18, color: colors.textSoft }}>
          {groupCount > 0 ? `${groupCount} center and event groups. ${anchorLabel}.` : anchorLabel}
        </Text>
      </View>
    )
  }

  return (
    <View
      style={{
        borderRadius: 18,
        backgroundColor: colors.orangeSoft,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.text }}>
          {isSignedIn ? 'Verify to unlock groups' : 'Sign in to see groups'}
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
          {isSignedIn
            ? 'Verified members can browse center boards and joined event groups, starting with the ones closest to them.'
            : 'Your center boards, event groups, requests, and DMs will live here.'}
        </Text>
      </View>
      <Pressable
        onPress={onRequestAccess}
        style={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          backgroundColor: colors.orange,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#FFFFFF' }}>
          {isSignedIn ? 'Get verified' : 'Sign in'}
        </Text>
      </Pressable>
    </View>
  )
}

function GroupCard({
  group,
  active,
  colors,
  onPress,
}: {
  group: GroupBoard
  active: boolean
  colors: ColorSet
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? colors.cardActive : 'transparent',
        borderRadius: 16,
        paddingHorizontal: 4,
        paddingVertical: 10,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <GroupIcon kind={group.kind} colors={colors} active={active} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.orange }}>
              {group.eyebrow}
            </Text>
            {group.unreadCount > 0 ? <UnreadDot count={group.unreadCount} colors={colors} /> : null}
          </View>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, lineHeight: 22, color: colors.text }} numberOfLines={2}>
            {group.title}
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18, color: colors.textMuted }} numberOfLines={1}>
            {group.subtitle}
          </Text>
        </View>
      </View>

      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted }} numberOfLines={2}>
        {group.preview}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.textSoft }}>
          {group.meta}
        </Text>
        <ChevronRight size={16} color={colors.textSoft} />
      </View>
    </Pressable>
  )
}

function GroupThread({
  group,
  colors,
  threadColors,
  fullScreen = false,
  bottomInset = 0,
}: {
  group: GroupBoard
  colors: ColorSet
  threadColors: ThreadPanelColors
  fullScreen?: boolean
  bottomInset?: number
}) {
  return (
    <View
      style={{
        flex: fullScreen ? 1 : undefined,
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderColor: 'transparent',
        borderRadius: fullScreen ? 0 : 16,
        overflow: fullScreen ? 'visible' : 'hidden',
      }}
    >
      {!fullScreen ? (
        <View style={{ paddingHorizontal: 4, paddingTop: 6, paddingBottom: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
            <GroupIcon kind={group.kind} colors={colors} active />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.orange }}>
                {group.eyebrow}
              </Text>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24, lineHeight: 30, color: colors.text }}>
                {group.title}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: colors.textMuted }}>
                {group.subtitle}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatPill icon={<UsersRound size={13} color={colors.orange} />} label={group.meta} colors={colors} />
            <StatPill icon={<MessageCircleMore size={13} color={colors.orange} />} label="Thread" colors={colors} />
          </View>
        </View>
      ) : null}

      <ThreadPanel
        messages={group.messages}
        colors={threadColors}
        emptyTitle="Be the first to post"
        emptySubtitle={`Ask about rides, prep, seva, or anything for this ${group.kind === 'center' ? 'center' : 'event'} group.`}
        composerPlaceholder={`Post in ${group.kind === 'center' ? 'center group' : 'event group'}...`}
        composerState="open"
        scrollable={fullScreen}
        bottomInset={fullScreen ? bottomInset : 0}
      />
    </View>
  )
}

function RequestsCard({ colors }: { colors: ColorSet }) {
  const firstRequest = connectionRequests[0]

  return (
    <View
      style={{
        paddingVertical: 4,
        gap: 12,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.text }}>
          Requests
        </Text>
        <UnreadDot count={connectionRequests.length} colors={colors} />
      </View>
      {firstRequest ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
          <Avatar
            name={firstRequest.person.name}
            initials={firstRequest.person.initials}
            size={40}
            backgroundColor={firstRequest.person.accentColor}
          />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.text }}>
              {firstRequest.person.name}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 18, color: colors.textMuted }} numberOfLines={2}>
              {firstRequest.note}
            </Text>
          </View>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: colors.orange,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#FFFFFF' }}>
            Review
          </Text>
        </Pressable>
        <Pressable
          style={{
            flex: 1,
            borderRadius: 999,
            backgroundColor: colors.panel,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.textMuted }}>
            Later
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function DmRail({
  threads,
  selectedThreadId,
  colors,
  compact = false,
  onSelect,
}: {
  threads: InboxThread[]
  selectedThreadId?: string
  colors: ColorSet
  compact?: boolean
  onSelect: (id: string) => void
}) {
  return (
    <View
      style={{
        gap: 6,
      }}
    >
      <View style={{ paddingHorizontal: 4, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.text }}>
          DMs
        </Text>
        <MessageCircleMore size={17} color={colors.textMuted} />
      </View>
      {threads.length === 0 ? (
        <EmptyPanel title="No DMs found" subtitle="Try a different search." colors={colors} />
      ) : null}
      {threads.map((thread) => (
        <Pressable
          key={thread.id}
          onPress={() => onSelect(thread.id)}
          style={{
            paddingHorizontal: 4,
            paddingVertical: compact ? 10 : 12,
            borderRadius: 16,
            backgroundColor: thread.id === selectedThreadId ? colors.cardActive : 'transparent',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
            <Avatar
              name={thread.person.name}
              initials={thread.person.initials}
              size={42}
              backgroundColor={thread.person.accentColor}
            />
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.text }} numberOfLines={1}>
                  {thread.person.name}
                </Text>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: thread.unread ? colors.orange : colors.textSoft }}>
                  {thread.lastActiveLabel}
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
                {thread.preview}
              </Text>
            </View>
            {thread.unread ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} /> : null}
          </View>
        </Pressable>
      ))}
    </View>
  )
}

function DmThread({
  thread,
  colors,
  fullScreen = false,
  bottomInset = 0,
}: {
  thread: InboxThread
  colors: ColorSet
  fullScreen?: boolean
  bottomInset?: number
}) {
  const messages = thread.messages.map((message, index) => {
    const previous = thread.messages[index - 1]
    const next = thread.messages[index + 1]

    return (
      <DmMessageBubble
        key={message.id}
        message={message}
        previousSender={previous?.sender}
        nextSender={next?.sender}
        colors={colors}
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
          <Avatar name={thread.person.name} initials={thread.person.initials} size={44} backgroundColor={thread.person.accentColor} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.text }}>
              {thread.person.name}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textMuted }}>
              {thread.connectedSince}
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
          <ChatComposer colors={colors} bottomInset={bottomInset} placeholder={`Message ${thread.person.name.split(' ')[0]}`} />
        </>
      ) : (
        <>
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 6 }}>
            {messages}
          </View>
          <ChatComposer colors={colors} bottomInset={0} placeholder="Write a message..." compact />
        </>
      )}
    </View>
  )
}

function DmMessageBubble({
  message,
  previousSender,
  nextSender,
  colors,
}: {
  message: InboxThread['messages'][number]
  previousSender?: 'them' | 'you'
  nextSender?: 'them' | 'you'
  colors: ColorSet
}) {
  const isYou = message.sender === 'you'
  const isFirstInRun = previousSender !== message.sender
  const isLastInRun = nextSender !== message.sender
  const incomingBubble = colors.surface === '#171717' ? '#262626' : '#F0EFEC'

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
          {message.timestamp}
        </Text>
      ) : null}
      <View
        style={{
          alignSelf: isYou ? 'flex-end' : 'flex-start',
          maxWidth: '78%',
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: isYou ? '#0A84FF' : incomingBubble,
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
            color: isYou ? '#FFFFFF' : colors.text,
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
            backgroundColor: colors.page,
            borderWidth: 1,
            borderColor: colors.border,
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
            backgroundColor: '#0A84FF',
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

function StatPill({
  icon,
  label,
  colors,
}: {
  icon: React.ReactNode
  label: string
  colors: ColorSet
}) {
  return (
    <View
      style={{
        borderRadius: 999,
        paddingRight: 8,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {icon}
      <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.textMuted }}>
        {label}
      </Text>
    </View>
  )
}

function UnreadDot({ count, colors }: { count: number; colors: ColorSet }) {
  return (
    <View
      style={{
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.orange,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
      }}
    >
      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: '#FFFFFF' }}>
        {count}
      </Text>
    </View>
  )
}

function EmptyPanel({ title, subtitle, colors }: { title: string; subtitle: string; colors: ColorSet }) {
  return (
    <View
      style={{
        paddingVertical: 18,
        paddingHorizontal: 4,
        gap: 5,
      }}
    >
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
          Sign in for your real groups
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, lineHeight: 19, color: colors.textMuted }}>
          Your center, joined events, requests, and DMs live here.
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

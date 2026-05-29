import React, { useCallback, useMemo } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { ChevronRight, Compass, MapPin } from 'lucide-react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAnalytics } from '../../utils/analytics'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useDiscoverData, useMyEvents, useBoard } from '../../hooks/useApiData'
import type { DiscoverCenter, EventDisplay } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'
import { FeaturedEventCard, type FeaturedSource } from '../../components/home/FeaturedEventCard'
import { MiniEventRow, type WeekItem } from '../../components/home/MiniEventRow'
import { BoardPostCard, boardPostToMessage, type BoardMessage } from '../../components/boards'
import type { AppColors } from '../../tokens'

function formatDatePill(dateStr: string): { month: string; day: string } {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return { month: '', day: '' }
  return {
    month: parsed.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: String(parsed.getDate()),
  }
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

function sortUpcomingEvents(events: EventDisplay[]) {
  const today = new Date().toISOString().split('T')[0]
  return [...events]
    .filter((e) => !e.date || e.date >= today)
    .sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
}

function liveEventToWeekItem(event: EventDisplay, onPress: () => void): WeekItem {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }
  const today = event.date ? isToday(event.date) : false
  return {
    id: event.id,
    month,
    day,
    title: event.title,
    subtitle: [today ? 'Today' : event.time || 'TBD', event.location || event.address].filter(Boolean).join(' · '),
    highlight: today,
    onPress,
  }
}

export default function HomeScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { track } = useAnalytics()
  const { user } = useUser()
  const c = useColors()
  const detailColors = useDetailColors()
  const { events: myEvents, loading: myEventsLoading, refetch: refetchMyEvents } = useMyEvents(user?.username)
  const { allEvents, allCenters, loading: discoverLoading, refresh: refreshDiscover } = useDiscoverData(
    'Events', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID
  )

  // Boards peek (#199): surface the 1-2 latest posts from the user's center
  // board so Home reflects real activity instead of a permanent empty state.
  const { posts: centerBoardPosts } = useBoard('center', user?.centerID ?? undefined, !!user?.centerID)
  const userCenter = useMemo(
    () => allCenters.find((item) => item.id === user?.centerID),
    [allCenters, user?.centerID]
  )
  const centerName = userCenter?.name
  const boardPeek = useMemo(
    () =>
      centerBoardPosts.slice(0, 2).map((post) => ({
        ...boardPostToMessage(post),
        sourceKind: 'center' as const,
        sourceLabel: centerName ?? 'Your center',
      })),
    [centerBoardPosts, centerName]
  )

  useFocusEffect(
    useCallback(() => {
      refetchMyEvents()
      refreshDiscover()
    }, [refetchMyEvents, refreshDiscover])
  )

  // Desktop two-column composition is web-only and gated on a wide breakpoint.
  // Mobile web and native always render the original single centered column.
  const isWideDesktop = Platform.OS === 'web' && width >= 1024
  const isDesktop = width >= 860

  const signedUpEvents = useMemo(() => {
    const fromDiscover = sortUpcomingEvents(allEvents.filter((e) => e.isRegistered))
    if (fromDiscover.length > 0) return fromDiscover
    return sortUpcomingEvents(myEvents.map((e) => ({ ...e, isRegistered: true })))
  }, [allEvents, myEvents])

  const upcomingExploreEvents = useMemo(
    () => sortUpcomingEvents(allEvents.filter((e) => !e.isRegistered)),
    [allEvents]
  )

  const featured = useMemo<FeaturedSource | null>(() => {
    const source = signedUpEvents[0] || upcomingExploreEvents[0]
    if (source) {
      const centerName = allCenters.find((item) => item.id === source.centerId)?.name
      return { kind: 'live', event: source, centerName }
    }
    return null
  }, [allCenters, signedUpEvents, upcomingExploreEvents])

  const weekItems = useMemo<WeekItem[]>(() => {
    const featuredId = featured?.event.id ?? null
    const pool = (signedUpEvents.length > 0 ? signedUpEvents : upcomingExploreEvents).filter(
      (e) => e.id !== featuredId
    )
    if (pool.length === 0) return []
    return pool.slice(0, 4).map((event) =>
      liveEventToWeekItem(event, () => {
        track('home_event_pressed', { eventId: event.id, source: 'this_week' })
        router.push(`/events/${event.id}`)
      })
    )
  }, [featured, track, router, signedUpEvents, upcomingExploreEvents])

  const greetingName = user?.firstName || user?.username || 'friend'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // First run: a member still in discovery mode — hasn't joined an event yet.
  // Give them one tight welcome line, a card for their center, and a peek at
  // their board feed when there's activity. Real Up Next / Coming Up content
  // still renders below, so Home leads with useful content rather than a
  // redundant feature tour. Self-resolves once they RSVP.
  const isNewUser = !!user && signedUpEvents.length === 0

  if (discoverLoading || (user ? myEventsLoading : false)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    )
  }

  const greeting = (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12.5, color: c.textFaint, letterSpacing: 0.2 }}>{todayLabel}</Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: c.text }} numberOfLines={1}>
        {user ? `Namaste, ${greetingName}` : 'Namaste'}
      </Text>
    </View>
  )

  const welcomeBanner = isNewUser ? (
    <WelcomeBanner
      c={c}
      onExplore={() => {
        track('home_first_run_explore_pressed')
        router.push('/explore' as never)
      }}
    />
  ) : null

  const firstRunOverview = isNewUser ? (
    <FirstRunOverview
      c={c}
      detailColors={detailColors}
      center={userCenter}
      peek={boardPeek}
      onFeed={() => {
        track('home_first_run_feed_pressed')
        router.push('/feed' as never)
      }}
      onChooseCenter={() => {
        track('home_first_run_center_pressed')
        router.push('/center-picker' as never)
      }}
      onOpenCenter={(id) => {
        track('home_first_run_center_opened', { centerId: id })
        router.push(`/center/${id}`)
      }}
      onPeekPress={(id) => {
        track('home_board_peek_pressed', { postId: id, source: 'first_run_peek' })
        router.push('/feed' as never)
      }}
    />
  ) : null

  const upNextSection = !isNewUser || featured ? (
    <SectionHeader eyebrow="UP NEXT FOR YOU" trailing="See all" accentColor={c.accent} faintColor={c.textFaint} onTrailingPress={() => {
      track('home_see_all_pressed', { section: 'up_next' })
      router.push('/' as never)
    }}>
      {featured ? (
        <FeaturedEventCard
          featured={featured}
          onPress={() => {
            track('home_featured_event_pressed', { eventId: featured.event.id })
            router.push(`/events/${featured.event.id}`)
          }}
        />
      ) : (
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: c.text }}>No upcoming events at your center yet</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
              Explore other CHYK events while your center's calendar fills in.
            </Text>
          </View>
          <Pressable
            onPress={() => {
              track('home_explore_fallback_pressed', { source: 'up_next_empty' })
              router.push('/explore' as never)
            }}
            style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.accent }}>Explore</Text>
          </Pressable>
        </View>
      )}
    </SectionHeader>
  ) : null

  // Boards peek (#199): the 1-2 latest posts from the user's center board.
  // New users get their center + a feed peek inside the first-run overview,
  // so this section is for returning members only.
  const boardsSection = !isNewUser ? (
    <SectionHeader
      eyebrow="LATEST ON YOUR BOARDS"
      trailing="Open Feed"
      accentColor={c.accent}
      faintColor={c.textFaint}
      onTrailingPress={() => {
        track('home_open_feed_pressed', { source: 'boards_section_header' })
        router.push('/feed' as never)
      }}
    >
      {boardPeek.length > 0 ? (
        <View>
          {boardPeek.map((message) => (
            <BoardPostCard
              key={message.id}
              message={message}
              colors={detailColors}
              showSource
              onPress={() => {
                track('home_board_peek_pressed', { postId: message.id, source: 'boards_section' })
                router.push('/feed' as never)
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 6 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>
            No posts yet on your boards
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
            Conversations from your center and events you've joined will appear here. Head to the Feed to see what's new across the network.
          </Text>
        </View>
      )}
    </SectionHeader>
  ) : null

  const weekSection = !isNewUser || weekItems.length > 0 ? (
    <SectionHeader
      eyebrow={signedUpEvents.length > 0 ? 'THIS WEEK' : 'COMING UP'}
      trailing="See all"
      accentColor={c.accent}
      faintColor={c.textFaint}
      onTrailingPress={() => {
        track('home_see_all_pressed', { section: signedUpEvents.length > 0 ? 'this_week' : 'coming_up' })
        router.push('/' as never)
      }}
    >
      {weekItems.length > 0 ? (
        <View style={{ gap: 8 }}>
          {weekItems.map((item) => <MiniEventRow key={item.id} item={item} />)}
        </View>
      ) : (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 4 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>No events yet</Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
            Upcoming events from Explore will appear here as they are added.
          </Text>
        </View>
      )}
    </SectionHeader>
  ) : null

  // ── Wide desktop: a real two-column composition ─────────────────────────
  // A centered ~1040px container with the schedule (Up Next + This Week) as
  // the primary column and a ~320px right rail for the member's center, the
  // welcome tour, and board activity — so the page uses the width instead of
  // stranding a narrow column in empty gray. Reuses the exact same section
  // blocks as mobile; only their arrangement differs.
  if (isWideDesktop) {
    const rail = isNewUser ? firstRunOverview : (
      <View style={{ gap: 22 }}>{boardsSection}</View>
    )
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{ paddingHorizontal: 40, paddingTop: 28, paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center', gap: 28 }}>
          {greeting}
          {welcomeBanner}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 32 }}>
            <View style={{ flex: 1, minWidth: 0, gap: 28 }}>
              {upNextSection}
              {weekSection}
            </View>
            <View style={{ width: 320, gap: 22 }}>
              {rail}
            </View>
          </View>
        </View>
      </ScrollView>
    )
  }

  // ── Mobile web + native + narrow web: original single centered column ────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingHorizontal: isDesktop ? 24 : 16,
        paddingTop: Platform.OS === 'web' ? 20 : 8,
        paddingBottom: Platform.OS === 'web' ? 40 : 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 }}>
        {greeting}
        {welcomeBanner}
        {firstRunOverview}
        {upNextSection}
        {boardsSection}
        {weekSection}
      </View>
    </ScrollView>
  )
}

// One tight welcome line (orient + Explore) instead of a 3-row feature tour —
// the real content (Your Center, Up Next, Coming Up) already shows what the app
// does, so a single orienting sentence + Explore CTA is enough. Rendered as a
// full-width top row on desktop and inline at the top of the column on mobile.
function WelcomeBanner({ c, onExplore }: { c: AppColors; onExplore: () => void }) {
  const cardBase = { borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card } as const
  return (
    <View style={[cardBase, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}>
      <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Compass size={21} color={c.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>
          Welcome to Janata
        </Text>
        <Text style={{ fontSize: 13.5, lineHeight: 19, color: c.textMuted }}>
          Find satsangs, camps, and classes near you — and RSVP in a tap.
        </Text>
      </View>
      <Pressable
        onPress={onExplore}
        accessibilityRole="button"
        accessibilityLabel="Explore events"
        style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: c.accent }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13.5, color: c.textInverse }}>Explore</Text>
      </Pressable>
    </View>
  )
}

// First-run overview shown to members who haven't engaged yet: a card for their
// center (or a prompt to pick one) and a peek at their board feed when there's
// activity. The greeting, WelcomeBanner, and the real Up Next / Coming Up
// sections render around it, so Home leads with useful content.
function FirstRunOverview({
  c,
  detailColors,
  center,
  peek,
  onFeed,
  onChooseCenter,
  onOpenCenter,
  onPeekPress,
}: {
  c: AppColors
  detailColors: ReturnType<typeof useDetailColors>
  center?: DiscoverCenter
  peek: BoardMessage[]
  onFeed: () => void
  onChooseCenter: () => void
  onOpenCenter: (id: string) => void
  onPeekPress: (id: string) => void
}) {
  const eyebrow = { fontSize: 11, letterSpacing: 0.9, color: c.textFaint, paddingHorizontal: 4 } as const
  const cardBase = { borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card } as const
  const cityState = center?.address ? extractCityState(center.address) : undefined
  const centerMeta = [cityState, center?.memberCount ? `${center.memberCount} members` : null].filter(Boolean).join(' · ')

  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 10 }}>
        <Text style={eyebrow}>{center ? 'YOUR CENTER' : 'GET CONNECTED'}</Text>
        {center ? (
          <Pressable
            onPress={() => onOpenCenter(center.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${center.name}`}
            style={[cardBase, { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }]}
          >
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={21} color={c.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }} numberOfLines={1}>
                {center.name}
              </Text>
              {centerMeta ? (
                <Text style={{ fontSize: 13, color: c.textMuted }} numberOfLines={1}>
                  {centerMeta}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={c.textFaint} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onChooseCenter}
            accessibilityRole="button"
            accessibilityLabel="Choose your center"
            style={[cardBase, { padding: 16, gap: 8 }]}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>Choose your home center</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
              Pick your center to follow its board and see its upcoming events.
            </Text>
            <Text style={{ fontSize: 13.5, color: c.accent }}>Choose your center →</Text>
          </Pressable>
        )}
      </View>

      {peek.length > 0 ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint }}>LATEST ON YOUR BOARD</Text>
            <Pressable onPress={onFeed} hitSlop={8}>
              <Text style={{ fontWeight: '500', fontSize: 13, color: c.accent }}>Open Feed</Text>
            </Pressable>
          </View>
          <View>
            {peek.map((message) => (
              <BoardPostCard
                key={message.id}
                message={message}
                colors={detailColors}
                showSource
                onPress={() => onPeekPress(message.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

function SectionHeader({
  eyebrow,
  trailing,
  accentColor,
  faintColor,
  onTrailingPress,
  children,
}: {
  eyebrow: string
  trailing?: string
  accentColor: string
  faintColor: string
  onTrailingPress?: () => void
  children: React.ReactNode
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Text style={{ fontSize: 11, letterSpacing: 0.9, color: faintColor }}>{eyebrow}</Text>
        {trailing && (
          <Pressable onPress={onTrailingPress} hitSlop={8}>
            <Text style={{ fontWeight: '500', fontSize: 13, color: accentColor }}>{trailing}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  )
}

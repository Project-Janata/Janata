import React, { useCallback, useMemo } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { CalendarCheck, ChevronRight, Compass, MapPin, MessageCircle } from 'lucide-react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
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
  const posthog = usePostHog()
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
        posthog?.capture('home_event_pressed', { eventId: event.id, source: 'this_week' })
        router.push(`/events/${event.id}`)
      })
    )
  }, [featured, posthog, router, signedUpEvents, upcomingExploreEvents])

  const greetingName = user?.firstName || user?.username || 'friend'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  // First run: a member still in discovery mode — hasn't joined an event yet.
  // Rather than a sparse, hard-to-read home, give them a short tour of what
  // Janata does, a card for their center, and a peek at their board feed when
  // there's activity — so they grasp the whole app at a glance and have clear
  // next steps. Real events still render below. Self-resolves once they RSVP.
  const isNewUser = !!user && signedUpEvents.length === 0

  if (discoverLoading || (user ? myEventsLoading : false)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    )
  }

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
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12.5, color: c.textFaint, letterSpacing: 0.2 }}>{todayLabel}</Text>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: c.text }} numberOfLines={1}>
            {user ? `Namaste, ${greetingName}` : 'Namaste'}
          </Text>
        </View>

        {isNewUser ? (
          <FirstRunOverview
            c={c}
            detailColors={detailColors}
            center={userCenter}
            peek={boardPeek}
            onExplore={() => {
              posthog?.capture('home_first_run_explore_pressed')
              router.push('/explore' as never)
            }}
            onFeed={() => {
              posthog?.capture('home_first_run_feed_pressed')
              router.push('/feed' as never)
            }}
            onChooseCenter={() => {
              posthog?.capture('home_first_run_center_pressed')
              router.push('/center-picker' as never)
            }}
            onOpenCenter={(id) => {
              posthog?.capture('home_first_run_center_opened', { centerId: id })
              router.push(`/center/${id}`)
            }}
            onPeekPress={(id) => {
              posthog?.capture('home_board_peek_pressed', { postId: id })
              router.push('/feed' as never)
            }}
          />
        ) : null}

        {!isNewUser || featured ? (
          <SectionHeader eyebrow="UP NEXT FOR YOU" trailing="See all" accentColor={c.accent} faintColor={c.textFaint} onTrailingPress={() => router.push('/' as never)}>
            {featured ? (
              <FeaturedEventCard
                featured={featured}
                onPress={() => {
                  posthog?.capture('home_featured_event_pressed', { eventId: featured.event.id })
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
                  onPress={() => router.push('/explore' as never)}
                  style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft }}
                >
                  <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.accent }}>Explore</Text>
                </Pressable>
              </View>
            )}
          </SectionHeader>
        ) : null}

        {/*
          Boards peek (#199): the 1-2 latest posts from the user's center
          board. New users get their center + a feed peek inside the first-run
          overview above, so this section is for returning members only.
        */}
        {!isNewUser ? (
          <SectionHeader
            eyebrow="LATEST ON YOUR BOARDS"
            trailing="Open Feed"
            accentColor={c.accent}
            faintColor={c.textFaint}
            onTrailingPress={() => router.push('/feed' as never)}
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
                      posthog?.capture('home_board_peek_pressed', { postId: message.id })
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
        ) : null}

        {!isNewUser || weekItems.length > 0 ? (
          <SectionHeader
            eyebrow={signedUpEvents.length > 0 ? 'THIS WEEK' : 'COMING UP'}
            trailing="See all"
            accentColor={c.accent}
            faintColor={c.textFaint}
            onTrailingPress={() => router.push('/' as never)}
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
        ) : null}
      </View>
    </ScrollView>
  )
}

// One row of the first-run feature tour: icon tile, title + one-liner, chevron.
// Tapping routes to the matching tab so the tour doubles as navigation.
function FeatureRow({
  c,
  icon: Icon,
  title,
  subtitle,
  onPress,
  first = false,
}: {
  c: AppColors
  icon: typeof Compass
  title: string
  subtitle: string
  onPress: () => void
  first?: boolean
}) {
  return (
    <View>
      {!first ? <View style={{ height: 1, backgroundColor: c.border, marginLeft: 68 }} /> : null}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14 }}
      >
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={c.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15.5, color: c.text }}>{title}</Text>
          <Text style={{ fontSize: 13, lineHeight: 18, color: c.textMuted }}>{subtitle}</Text>
        </View>
        <ChevronRight size={18} color={c.textFaint} />
      </Pressable>
    </View>
  )
}

// First-run overview shown to members who haven't engaged yet. Three parts:
// a short feature tour, a card for their center (or a prompt to pick one), and
// a peek at their board feed when there's activity. Gives new users the whole
// app at a glance plus real, personal content.
function FirstRunOverview({
  c,
  detailColors,
  center,
  peek,
  onExplore,
  onFeed,
  onChooseCenter,
  onOpenCenter,
  onPeekPress,
}: {
  c: AppColors
  detailColors: ReturnType<typeof useDetailColors>
  center?: DiscoverCenter
  peek: BoardMessage[]
  onExplore: () => void
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
        <Text style={eyebrow}>WELCOME TO JANATA</Text>
        <View style={[cardBase, { overflow: 'hidden' }]}>
          <FeatureRow
            first
            c={c}
            icon={Compass}
            title="Discover events & centers"
            subtitle="Satsangs, camps, and classes near you"
            onPress={onExplore}
          />
          <FeatureRow
            c={c}
            icon={CalendarCheck}
            title="RSVP in a tap"
            subtitle="Save your spot and never miss a gathering"
            onPress={onExplore}
          />
          <FeatureRow
            c={c}
            icon={MessageCircle}
            title="Join the conversation"
            subtitle="Center and event boards keep CHYKs connected"
            onPress={onFeed}
          />
        </View>
      </View>

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

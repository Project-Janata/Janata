import React, { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { ChevronRight, MapPin } from 'lucide-react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useAnalytics } from '../../utils/analytics'
import { useUser } from '../../components/contexts'
import { useColors } from '../../hooks/useColors'
import { useDetailColors } from '../../hooks/useDetailColors'
import { useDiscoverData, useMyEvents, useBoard } from '../../hooks/useApiData'
import type { EventDisplay } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'
import { FeaturedEventCard, type FeaturedSource } from '../../components/home/FeaturedEventCard'
import { MiniEventRow, type WeekItem } from '../../components/home/MiniEventRow'
import { BoardPostCard, boardPostToMessage } from '../../components/boards'
import { DesktopColumns, desktopScrollContent, useDesktopLayout } from '../../components/layout/DesktopColumns'
import AuthPromptModal from '../../components/ui/AuthPromptModal'
import type { AppColors } from '../../tokens'

// 3D compass emoji for the guest welcome card — distinct from the feed's diya,
// matching the centered setup-card styling used on the Feed.
const welcomeArtwork = require('../../assets/images/onboarding/compass.png')

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

function liveEventToWeekItem(event: EventDisplay, onPress: () => void, isHosting = false): WeekItem {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }
  const today = event.date ? isToday(event.date) : false
  return {
    id: event.id,
    month,
    day,
    title: event.title,
    subtitle: [today ? 'Today' : event.time || 'TBD', event.location || event.address].filter(Boolean).join(' · '),
    highlight: today,
    hosting: isHosting,
    onPress,
  }
}

// The single source of truth for what Home shows. Every slot reads this one
// value and swaps its CONTENT — the slot set itself never changes.
//   guest      = no user
//   unverified = signed in but below the verification gate (vl < 45)
//   new        = verified member who hasn't joined any event yet
//   returning  = verified member with at least one personal event
type HomeState = 'guest' | 'unverified' | 'new' | 'returning'

export default function HomeScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const { track } = useAnalytics()
  const { user } = useUser()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const c = useColors()
  const detailColors = useDetailColors()
  const { events: myEvents, loading: myEventsLoading, refetch: refetchMyEvents } = useMyEvents(user?.username)
  const { allEvents, allCenters, loading: discoverLoading, refresh: refreshDiscover } = useDiscoverData(
    'Events', '', user?.id, false, false, false, user?.interests ?? undefined, user?.centerID
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
  // Mobile web and native use a single centered column.
  const isWideDesktop = useDesktopLayout(width)
  const isDesktop = width >= 860

  // "Up next for you" — the personal slate: events you're going to (RSVP'd,
  // upcoming) PLUS events you created (upcoming, or ended within the last 3
  // days so an organizer still sees a just-passed event). Deduped, soonest
  // first.
  const signedUpEvents = useMemo(() => {
    if (!user) return [] // guests have no personal events (avoids createdBy===undefined matches)
    const todayStr = new Date().toISOString().split('T')[0]
    const recentCutoff = new Date()
    recentCutoff.setDate(recentCutoff.getDate() - 3)
    const recentStr = recentCutoff.toISOString().split('T')[0]

    const byId = new Map<string, EventDisplay>()
    // Going to (upcoming only)
    allEvents
      .filter((e) => e.isRegistered && (!e.date || e.date >= todayStr))
      .forEach((e) => byId.set(e.id, e))
    // Created by me — from the discover window and the authoritative my-events
    // list; keep upcoming or up to 3 days past.
    ;[...allEvents.filter((e) => e.createdBy === user?.id), ...myEvents]
      .filter((e) => !e.date || e.date >= recentStr)
      .forEach((e) => {
        if (!byId.has(e.id)) byId.set(e.id, e)
      })

    return [...byId.values()].sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return a.date.localeCompare(b.date)
    })
  }, [allEvents, myEvents, user?.id])

  // "Coming up" — stays center-scoped: upcoming events at the member's OWN
  // center that they aren't already part of (not RSVP'd, not theirs). Members
  // with no home center yet (and guests) see the full upcoming list.
  const upcomingExploreEvents = useMemo(() => {
    // Guests: every upcoming event (nothing to scope by). Members: their center's
    // upcoming events they aren't already part of.
    if (!user) return sortUpcomingEvents(allEvents)
    return sortUpcomingEvents(
      allEvents.filter(
        (e) =>
          !e.isRegistered &&
          e.createdBy !== user.id &&
          (!user.centerID || e.centerId === user.centerID)
      )
    )
  }, [allEvents, user?.id, user?.centerID])

  const vl = user?.verificationLevel ?? 0
  const roleLabel =
    vl >= 1000008 ? 'Global Head'
      : vl >= 1008 ? 'Swami'
      : vl >= 108 ? 'Brahmachari'
      : vl >= 54 ? 'Sevak'
      : vl >= 45 ? 'Verified member'
      : null

  // One derived state drives every slot's content.
  const homeState: HomeState = !user
    ? 'guest'
    : vl < 45
      ? 'unverified'
      : signedUpEvents.length === 0
        ? 'new'
        : 'returning'

  const greetingName = user?.firstName || user?.username || 'friend'
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const greetingSubline = user ? [roleLabel, centerName].filter(Boolean).join('  ·  ') : ''

  // ── Slot 3 source: the personal featured event (members) — guests don't
  // see a "your events" featured card; their slot shows a sign-in nudge.
  const featured = useMemo<FeaturedSource | null>(() => {
    const source = signedUpEvents[0]
    if (source) {
      const fcName = allCenters.find((item) => item.id === source.centerId)?.name
      return { kind: 'live', event: source, centerName: fcName }
    }
    return null
  }, [allCenters, signedUpEvents])

  // ── Slot 4 rows: events near you (center-scoped for members, general list
  // for guests/no-center members).
  const weekItems = useMemo<WeekItem[]>(() => {
    const pool = upcomingExploreEvents
    if (pool.length === 0) return []
    return pool.slice(0, 4).map((event) =>
      liveEventToWeekItem(event, () => {
        track('home_event_pressed', { eventId: event.id, source: 'events_near_you' })
        router.push(`/events/${event.id}`)
      }, !!user && event.createdBy === user?.id)
    )
  }, [track, router, upcomingExploreEvents, user?.id])

  const shouldWaitForHomeData = user ? (discoverLoading || myEventsLoading) : false
  if (shouldWaitForHomeData) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    )
  }

  // ── Slot 1: Greeting ────────────────────────────────────────────────────
  const greeting = (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12.5, color: c.textFaint, letterSpacing: 0.2 }}>{todayLabel}</Text>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 30, lineHeight: 34, letterSpacing: -0.5, color: c.text }} numberOfLines={1}>
        {homeState === 'guest' ? 'Welcome to Janata' : `Namaste, ${greetingName}`}
      </Text>
      {greetingSubline ? (
        <Text style={{ fontSize: 13.5, color: c.textMuted, marginTop: 1 }} numberOfLines={1}>
          {greetingSubline}
        </Text>
      ) : null}
    </View>
  )

  const authPrompt = (
    <AuthPromptModal
      visible={showAuthPrompt}
      onClose={() => setShowAuthPrompt(false)}
      returnTo="/"
      title="Make Janata yours."
      subtitle="Janata is invite-only — members join through a friend's invite. Log in, or paste one to get in."
      bullets={[
        'Follow your local center and see what is coming up',
        'RSVP to events and keep details handy',
        'Join boards for your center and gatherings',
      ]}
    />
  )

  // ── Slot 2: AnchorCard ──────────────────────────────────────────────────
  const anchorCard = (
    <AnchorCard
      c={c}
      state={homeState}
      centerName={centerName || undefined}
      centerMeta={(userCenter?.address ? extractCityState(userCenter.address) : undefined) || undefined}
      onLogin={() => {
        track('home_signin_pressed', { source: 'home_anchor' })
        setShowAuthPrompt(true)
      }}
      onPasteInvite={() => {
        track('home_paste_invite_pressed', { source: 'home_anchor' })
        router.push('/auth?invite=1' as never)
      }}
      onChooseCenter={() => {
        track('home_first_run_center_pressed', { source: 'home_anchor' })
        router.push('/center-picker' as never)
      }}
      onOpenCenter={
        userCenter
          ? () => {
              track('home_first_run_center_opened', { centerId: userCenter.id })
              router.push(`/center/${userCenter.id}`)
            }
          : undefined
      }
      onExplore={() => {
        track('home_first_run_explore_pressed')
        router.push('/explore' as never)
      }}
    />
  )

  // ── Slot 3: Your events ("UP NEXT FOR YOU") ─────────────────────────────
  const yourEventsSlot = (
    <SectionHeader
      eyebrow="UP NEXT FOR YOU"
      trailing={featured ? 'See all' : undefined}
      accentColor={c.accent}
      faintColor={c.textFaint}
      onTrailingPress={() => {
        track('home_see_all_pressed', { section: 'up_next' })
        router.push('/explore?going=1' as never)
      }}
    >
      {featured ? (
        <FeaturedEventCard
          featured={featured}
          isHosting={!!user && featured.kind === 'live' && featured.event.createdBy === user?.id}
          onPress={() => {
            track('home_featured_event_pressed', { eventId: featured.event.id })
            router.push(`/events/${featured.event.id}`)
          }}
        />
      ) : (
        <View style={{ borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 10 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: c.text }}>
              {homeState === 'guest' ? 'Sign in to track events you’re going to' : 'Nothing on your calendar yet'}
            </Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
              {homeState === 'guest'
                ? 'RSVP to events and they’ll show up here so you never miss one.'
                : 'RSVP to your first event and it’ll show up here.'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (homeState === 'guest') {
                track('home_signin_pressed', { source: 'up_next_empty' })
                setShowAuthPrompt(true)
              } else {
                track('home_explore_fallback_pressed', { source: 'up_next_empty' })
                router.push('/explore' as never)
              }
            }}
            style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.accent }}>
              {homeState === 'guest' ? 'Sign in' : 'Explore events'}
            </Text>
          </Pressable>
        </View>
      )}
    </SectionHeader>
  )

  // ── Slot 4: Events near you ─────────────────────────────────────────────
  const eventsNearYouSlot = (
    <SectionHeader
      eyebrow={homeState === 'guest' ? 'EXPLORE EVENTS' : 'COMING UP'}
      trailing="See all"
      accentColor={c.accent}
      faintColor={c.textFaint}
      onTrailingPress={() => {
        track('home_see_all_pressed', { section: 'coming_up' })
        router.push('/explore' as never)
      }}
    >
      {weekItems.length > 0 ? (
        <View style={{ gap: 8 }}>
          {weekItems.map((item) => <MiniEventRow key={item.id} item={item} />)}
        </View>
      ) : (
        <Pressable
          onPress={() => {
            track('home_explore_fallback_pressed', { source: 'coming_up_empty' })
            router.push('/explore' as never)
          }}
          style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 10 }}
        >
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>Find events near you</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
              Browse satsangs, camps, and classes across CHYK centers.
            </Text>
          </View>
          <View style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.accentSoft }}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: c.accent }}>Explore events</Text>
          </View>
        </Pressable>
      )}
    </SectionHeader>
  )

  // ── Slot 5: Your community ("LATEST ON YOUR BOARD") ─────────────────────
  const gated = homeState === 'guest' || homeState === 'unverified'
  const yourCommunitySlot = (
    <SectionHeader
      eyebrow="LATEST ON YOUR BOARD"
      trailing="Open Feed"
      accentColor={c.accent}
      faintColor={c.textFaint}
      onTrailingPress={() => {
        if (gated) {
          track('home_signin_pressed', { source: 'community_header' })
          setShowAuthPrompt(true)
        } else {
          track('home_open_feed_pressed', { source: 'community_header' })
          router.push('/feed' as never)
        }
      }}
    >
      {gated ? (
        <Pressable
          onPress={() => {
            track('home_signin_pressed', { source: 'community_gated' })
            setShowAuthPrompt(true)
          }}
          style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 6 }}
        >
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>
            Sign in to see your center’s board
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
            Conversations from your center and the events you join show up here.
          </Text>
        </Pressable>
      ) : boardPeek.length > 0 ? (
        <View>
          {boardPeek.map((message) => (
            <BoardPostCard
              key={message.id}
              message={message}
              colors={detailColors}
              showSource
              onPress={() => {
                track('home_board_peek_pressed', { postId: message.id, source: 'community_slot' })
                router.push('/feed' as never)
              }}
            />
          ))}
        </View>
      ) : (
        <View style={{ borderRadius: 16, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, padding: 16, gap: 6 }}>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>
            Your board will fill in
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
            Conversations from your center and events you’ve joined will appear here. Head to the Feed to see what’s new across the network.
          </Text>
        </View>
      )}
    </SectionHeader>
  )

  // Guests have nothing personal to show: the home collapses to the focused
  // AnchorCard (log in / paste invite) + a plain Explore-events list. The
  // personalized "Up next" and "Your community" slots are members-only.
  const isGuest = homeState === 'guest'

  // ── Wide desktop: two-column composition reusing the SAME slots ──────────
  // Greeting anchors the full-width header; the AnchorCard sits at the TOP of
  // the right rail (so it's a focused card, not a wide banner); Your events +
  // Events near you fill the primary column.
  if (isWideDesktop) {
    return (
      <>
        <ScrollView
          style={{ flex: 1, backgroundColor: c.bg }}
          contentContainerStyle={desktopScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DesktopColumns
            header={greeting}
            main={
              <>
                {!isGuest && yourEventsSlot}
                {eventsNearYouSlot}
              </>
            }
            rail={
              <View style={{ gap: 22 }}>
                {anchorCard}
                {!isGuest && yourCommunitySlot}
              </View>
            }
          />
        </ScrollView>
        {authPrompt}
      </>
    )
  }

  // ── Mobile web + native + narrow web: one centered column, fixed slot order
  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: c.bg }}
        contentContainerStyle={{
          paddingHorizontal: isDesktop ? 24 : 16,
          paddingTop: Platform.OS === 'web' ? 20 : 24,
          paddingBottom: Platform.OS === 'web' ? 40 : 112,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 }}>
          {greeting}
          {anchorCard}
          {!isGuest && yourEventsSlot}
          {eventsNearYouSlot}
          {!isGuest && yourCommunitySlot}
        </View>
      </ScrollView>
      {authPrompt}
    </>
  )
}

// Slot 2 — the always-present anchor under the greeting. One component, four
// content variants keyed off homeState:
//   guest               → welcome + Log in + "Have an invite? Paste it"
//   unverified / no ctr → "Choose your home center" CTA
//   new (with center)   → combined center card + first-event nudge + Explore
//   returning           → a slim one-line center chip (tap to open)
function AnchorCard({
  c,
  state,
  centerName,
  centerMeta,
  onLogin,
  onPasteInvite,
  onChooseCenter,
  onOpenCenter,
  onExplore,
}: {
  c: AppColors
  state: HomeState
  centerName?: string
  centerMeta?: string
  onLogin: () => void
  onPasteInvite: () => void
  onChooseCenter: () => void
  onOpenCenter?: () => void
  onExplore: () => void
}) {
  const cardBase = { borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card } as const

  // Guest: centered welcome card matching the Feed's signed-out CTA — emoji on
  // top, centered title + subtitle, plain full-width Log in, "Paste it" link.
  if (state === 'guest') {
    return (
      <View style={[cardBase, { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20, gap: 20 }]}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Image
            source={welcomeArtwork}
            accessibilityIgnoresInvertColors
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 22, lineHeight: 28, color: c.text, textAlign: 'center' }}>
            Make Janata yours
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted, textAlign: 'center' }}>
            Your center, events, and community will show up here.
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Pressable
            onPress={onLogin}
            accessibilityRole="button"
            accessibilityLabel="Log in"
            style={{
              width: '100%',
              minHeight: 48,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.accent,
              backgroundColor: c.accent,
              paddingHorizontal: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 15, fontWeight: '600', color: c.textInverse }}>
              Log in
            </Text>
          </Pressable>

          <Pressable
            onPress={onPasteInvite}
            accessibilityRole="button"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 14, color: c.textMuted }}>
              Have an invite? <Text style={{ color: c.accent, fontWeight: '600' }}>Paste it</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // Unverified, or a member with no home center yet: choose-center CTA.
  if (state === 'unverified' || !centerName) {
    return (
      <Pressable
        onPress={onChooseCenter}
        accessibilityRole="button"
        accessibilityLabel="Choose your home center"
        style={[cardBase, { padding: 16, gap: 8 }]}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text }}>Choose your home center</Text>
        <Text style={{ fontSize: 14, lineHeight: 20, color: c.textMuted }}>
          Pick your center to follow its board and see its upcoming events.
        </Text>
        <Text style={{ fontSize: 13.5, color: c.accent }}>Choose your center →</Text>
      </Pressable>
    )
  }

  // Returning member with a center: slim one-line chip.
  if (state === 'returning') {
    return (
      <Pressable
        onPress={onOpenCenter}
        disabled={!onOpenCenter}
        accessibilityRole={onOpenCenter ? 'button' : undefined}
        accessibilityLabel={onOpenCenter ? `Open ${centerName}` : undefined}
        style={[cardBase, { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }]}
      >
        <MapPin size={17} color={c.accent} />
        <Text style={{ flex: 1, fontFamily: 'Inclusive Sans', fontSize: 15, color: c.text }} numberOfLines={1}>
          {centerName}
        </Text>
        {onOpenCenter ? <ChevronRight size={17} color={c.textFaint} /> : null}
      </Pressable>
    )
  }

  // New member WITH a center: the combined center card + first-event nudge.
  return (
    <View style={[cardBase, { padding: 16, gap: 14 }]}>
      <Pressable
        onPress={onOpenCenter}
        disabled={!onOpenCenter}
        accessibilityRole={onOpenCenter ? 'button' : undefined}
        accessibilityLabel={onOpenCenter ? `Open ${centerName}` : undefined}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <MapPin size={21} color={c.accent} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 11, letterSpacing: 0.9, color: c.textFaint }}>YOUR CENTER</Text>
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 17, color: c.text }} numberOfLines={1}>{centerName}</Text>
          {centerMeta ? (
            <Text style={{ fontSize: 13, color: c.textMuted }} numberOfLines={1}>{centerMeta}</Text>
          ) : null}
        </View>
        {onOpenCenter ? <ChevronRight size={18} color={c.textFaint} /> : null}
      </Pressable>
      <Text style={{ fontSize: 13.5, lineHeight: 19, color: c.textMuted }}>
        RSVP to your first event, then say hello on your center board.
      </Text>
      <Pressable
        onPress={onExplore}
        accessibilityRole="button"
        accessibilityLabel="Explore events"
        style={{ paddingVertical: 11, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center' }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: c.textInverse }}>Explore events</Text>
      </Pressable>
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

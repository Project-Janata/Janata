import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Bell, Clock3, MapPin, MessageCircle } from 'lucide-react-native'
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Line,
  Rect,
  Stop,
} from 'react-native-svg'
import { usePostHog } from 'posthog-react-native'
import { Avatar } from '../../components/ui'
import { useTheme, useUser } from '../../components/contexts'
import { useDiscoverData, useMyEvents } from '../../hooks/useApiData'
import type { EventDisplay } from '../../utils/api'
import {
  centerBoards,
  eventBoards,
  featuredHomeEvent,
  type BoardMessage,
  type FeaturedHomeEvent,
} from '../../components/connect'

type FeaturedSource =
  | { kind: 'live'; event: EventDisplay; centerName?: string }
  | { kind: 'mock'; event: FeaturedHomeEvent }

type HomeBoardPost = BoardMessage & {
  sourceTitle: string
  sourceKind: 'center' | 'event'
}

type WeekItem = {
  id: string
  month: string
  day: string
  title: string
  subtitle: string
  highlight: boolean
  onPress?: () => void
}

const FALLBACK_WEEK_ITEMS: WeekItem[] = [
  {
    id: 'mock-week-1',
    month: 'MAY',
    day: '8',
    title: 'Gurudev Jayanti, Annual Music',
    subtitle: '5:00 PM · Chinmaya-Saaket',
    highlight: false,
  },
  {
    id: 'mock-week-2',
    month: 'MAY',
    day: '9',
    title: 'Chinmaya Gita Samarpanam',
    subtitle: '9:00 AM · Online',
    highlight: true,
  },
  {
    id: 'mock-week-3',
    month: 'MAY',
    day: '10',
    title: "Mother's Day Celebration",
    subtitle: '9:20 AM · Chinmaya Mission',
    highlight: false,
  },
]

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

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

function countdownLabel(dateStr?: string): string | null {
  const days = daysUntil(dateStr)
  if (days == null) return null
  if (days < 0) return null
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 7) return `In ${days} days`
  if (days < 30) return `In ${Math.round(days / 7)} weeks`
  return `In ${days} days`
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

function liveEventToWeekItem(event: EventDisplay, onPress: () => void): WeekItem {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }
  const today = event.date ? isToday(event.date) : false
  const subtitleParts = [today ? 'Today' : event.time || 'TBD', event.location || event.address]
  return {
    id: event.id,
    month,
    day,
    title: event.title,
    subtitle: subtitleParts.filter(Boolean).join(' · '),
    highlight: today,
    onPress,
  }
}

export default function HomeScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const posthog = usePostHog()
  const { user } = useUser()
  const { isDark } = useTheme()
  const { events: myEvents, loading: myEventsLoading } = useMyEvents(user?.username)
  const {
    allEvents,
    allCenters,
    loading: discoverLoading,
  } = useDiscoverData('Events', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID)

  const isDesktop = width >= 860
  const pageBg = isDark ? '#1A1A1A' : '#F5F5F4'
  const cardBg = isDark ? '#262626' : '#FFFFFF'
  const surfaceBg = isDark ? '#262626' : '#F5F0EB'
  const borderColor = isDark ? '#262626' : '#ECE7DE'
  const dividerColor = isDark ? '#262626' : '#F1ECE3'
  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const bodyColor = isDark ? '#D6D3D1' : '#44403C'
  const mutedColor = isDark ? '#A8A29E' : '#78716C'
  const faintColor = isDark ? '#737373' : '#A8A29E'
  const accentColor = '#E8862A'

  const signedUpEvents = useMemo(() => {
    const fromDiscover = sortUpcomingEvents(allEvents.filter((event) => event.isRegistered))
    if (fromDiscover.length > 0) return fromDiscover
    return sortUpcomingEvents(myEvents.map((event) => ({ ...event, isRegistered: true })))
  }, [allEvents, myEvents])

  const upcomingExploreEvents = useMemo(
    () => sortUpcomingEvents(allEvents.filter((event) => !event.isRegistered)),
    [allEvents]
  )

  const featured = useMemo<FeaturedSource>(() => {
    const source = signedUpEvents[0] || upcomingExploreEvents[0]
    if (source) {
      const centerName = allCenters.find((item) => item.id === source.centerId)?.name
      return { kind: 'live', event: source, centerName }
    }
    return { kind: 'mock', event: featuredHomeEvent }
  }, [allCenters, signedUpEvents, upcomingExploreEvents])

  const weekItems = useMemo<WeekItem[]>(() => {
    const featuredId = featured.kind === 'live' ? featured.event.id : null
    const pool = (signedUpEvents.length > 0 ? signedUpEvents : upcomingExploreEvents).filter(
      (event) => event.id !== featuredId
    )
    if (pool.length === 0) return FALLBACK_WEEK_ITEMS
    return pool.slice(0, 4).map((event) =>
      liveEventToWeekItem(event, () => {
        posthog?.capture('home_event_pressed', {
          eventId: event.id,
          source: 'this_week',
        })
        router.push(`/events/${event.id}`)
      })
    )
  }, [featured, posthog, router, signedUpEvents, upcomingExploreEvents])

  const latestBoardPosts = useMemo<HomeBoardPost[]>(() => {
    const eventPosts = eventBoards.flatMap((board) =>
      board.messages.map((message) => ({
        ...message,
        sourceTitle: board.title,
        sourceKind: 'event' as const,
      }))
    )
    const centerPosts = centerBoards.flatMap((board) =>
      board.messages.map((message) => ({
        ...message,
        sourceTitle: board.centerName,
        sourceKind: 'center' as const,
      }))
    )
    const ordered = [eventPosts[0], centerPosts[0]].filter(Boolean) as HomeBoardPost[]
    return ordered.length > 0 ? ordered : [...eventPosts, ...centerPosts].slice(0, 2)
  }, [])

  const isLoading = discoverLoading || (user ? myEventsLoading : false)
  const greetingName = user?.firstName || user?.username || 'friend'
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: pageBg }}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pageBg }}
      contentContainerStyle={{
        paddingHorizontal: isDesktop ? 24 : 16,
        paddingTop: Platform.OS === 'web' ? 20 : 8,
        paddingBottom: Platform.OS === 'web' ? 40 : 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 22 }}>
        <Greeting
          dateLabel={todayLabel}
          name={user ? `Namaste, ${greetingName}` : 'Namaste'}
          textColor={textColor}
          mutedColor={mutedColor}
        />

        <Section eyebrow="UP NEXT FOR YOU" trailing="See all" mutedColor={faintColor} accentColor={accentColor} onTrailingPress={() => router.push('/' as never)}>
          <FeaturedEventCard
            featured={featured}
            cardBg={cardBg}
            borderColor={borderColor}
            dividerColor={dividerColor}
            textColor={textColor}
            bodyColor={bodyColor}
            mutedColor={mutedColor}
            faintColor={faintColor}
            isDark={isDark}
            onPress={() => {
              if (featured.kind === 'live') {
                posthog?.capture('home_featured_event_pressed', {
                  eventId: featured.event.id,
                })
                router.push(`/events/${featured.event.id}`)
              }
            }}
          />
        </Section>

        {latestBoardPosts.length > 0 ? (
          <Section
            eyebrow="LATEST ON YOUR BOARDS"
            trailing="Open Feed"
            mutedColor={faintColor}
            accentColor={accentColor}
            onTrailingPress={() => router.push('/(tabs)/connect' as never)}
          >
            <View
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor,
                backgroundColor: cardBg,
                overflow: 'hidden',
              }}
            >
              {latestBoardPosts.map((post, index) => (
                <BoardPeekRow
                  key={`${post.sourceTitle}-${post.id}`}
                  post={post}
                  showDivider={index < latestBoardPosts.length - 1}
                  textColor={textColor}
                  bodyColor={bodyColor}
                  mutedColor={mutedColor}
                  faintColor={faintColor}
                  dividerColor={dividerColor}
                  accentColor={accentColor}
                  onPress={() => {
                    posthog?.capture('home_board_peek_pressed', {
                      sourceTitle: post.sourceTitle,
                    })
                    router.push('/(tabs)/connect' as never)
                  }}
                />
              ))}
            </View>
          </Section>
        ) : null}

        <Section
          eyebrow={signedUpEvents.length > 0 ? 'THIS WEEK' : 'COMING UP'}
          trailing="See all"
          mutedColor={faintColor}
          accentColor={accentColor}
          onTrailingPress={() => router.push('/' as never)}
        >
          {weekItems.length > 0 ? (
            <View style={{ gap: 8 }}>
              {weekItems.map((item) => (
                <MiniEventRow
                  key={item.id}
                  item={item}
                  cardBg={cardBg}
                  surfaceBg={surfaceBg}
                  borderColor={borderColor}
                  textColor={textColor}
                  mutedColor={mutedColor}
                  accentColor={accentColor}
                  isDark={isDark}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor,
                backgroundColor: cardBg,
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 16, color: textColor }}>
                No events yet
              </Text>
              <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 14, lineHeight: 20, color: mutedColor }}>
                Upcoming events from Explore will appear here as they are added.
              </Text>
            </View>
          )}
        </Section>
      </View>
    </ScrollView>
  )
}

function Greeting({
  dateLabel,
  name,
  textColor,
  mutedColor,
}: {
  dateLabel: string
  name: string
  textColor: string
  mutedColor: string
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: mutedColor, letterSpacing: 0.2 }}>
        {dateLabel}
      </Text>
      <Text
        style={{
          fontFamily: 'Inclusive Sans',
          fontSize: 30,
          lineHeight: 34,
          letterSpacing: -0.5,
          color: textColor,
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  )
}

function Section({
  eyebrow,
  trailing,
  mutedColor,
  accentColor,
  onTrailingPress,
  children,
}: {
  eyebrow: string
  trailing?: string
  mutedColor: string
  accentColor: string
  onTrailingPress?: () => void
  children: React.ReactNode
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 11,
            letterSpacing: 0.9,
            color: mutedColor,
          }}
        >
          {eyebrow}
        </Text>
        {trailing ? (
          <Pressable onPress={onTrailingPress} hitSlop={8}>
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: accentColor }}>
              {trailing}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  )
}

function FeaturedEventCard({
  featured,
  cardBg,
  borderColor,
  dividerColor,
  textColor,
  bodyColor,
  mutedColor,
  faintColor,
  isDark,
  onPress,
}: {
  featured: FeaturedSource
  cardBg: string
  borderColor: string
  dividerColor: string
  textColor: string
  bodyColor: string
  mutedColor: string
  faintColor: string
  isDark: boolean
  onPress: () => void
}) {
  const event = featured.kind === 'live' ? featured.event : null
  const mock = featured.kind === 'mock' ? featured.event : null
  const title = event?.title ?? mock!.title
  const dateLabel = event
    ? event.date
      ? new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'TBD'
    : mock!.dateLabel
  const timeLabel = event?.time || mock?.timeLabel || 'TBD'
  const locationLabel = event ? event.location || event.address || 'Location TBA' : mock!.locationLabel
  const goingPill = event ? event.isRegistered : mock!.going
  const countdown = event ? countdownLabel(event.date) : mock?.countdownLabel ?? null
  const attendeesGoingLabel = event
    ? event.attendees > 0
      ? `${event.attendees} going`
      : null
    : mock!.attendeesGoingLabel
  const attendeesList = event?.attendeesList?.slice(0, 4)
  const fallbackAttendees = mock?.attendees ?? []
  const heroImage = event?.image
  const isLive = featured.kind === 'live'

  return (
    <Pressable
      onPress={onPress}
      disabled={!isLive}
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor,
        backgroundColor: cardBg,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 124, position: 'relative' }}>
        {heroImage ? (
          <Image source={{ uri: heroImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <GradientHero isDark={isDark} />
        )}
        <View style={{ position: 'absolute', top: 12, left: 12, flexDirection: 'row', gap: 6 }}>
          {countdown ? <InkPill label={countdown} /> : null}
          {goingPill ? <GoingPill label="You're going" /> : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 18,
            lineHeight: 23,
            letterSpacing: -0.2,
            color: textColor,
          }}
          numberOfLines={2}
        >
          {title}
        </Text>

        <View style={{ flexDirection: 'column', gap: 4, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock3 size={13} color={faintColor} />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: bodyColor }} numberOfLines={1}>
              {dateLabel} · {timeLabel}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color={faintColor} />
            <Text
              style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: bodyColor }}
              numberOfLines={1}
            >
              {locationLabel}
            </Text>
          </View>
        </View>

        {attendeesGoingLabel || fallbackAttendees.length > 0 ? (
          <View
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: dividerColor,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AttendeeStack
              attendees={attendeesList}
              fallback={fallbackAttendees}
            />
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12.5, color: mutedColor, lineHeight: 17 }} numberOfLines={1}>
              {attendeesGoingLabel}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

function GradientHero({ isDark }: { isDark: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Svg width="100%" height="100%" viewBox="0 0 300 124" preserveAspectRatio="none">
        <Defs>
          <SvgLinearGradient id="featGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? '#7C2D12' : '#FFF1E5'} />
            <Stop offset="0.6" stopColor={isDark ? '#C2410C' : '#FED7AA'} />
            <Stop offset="1" stopColor={isDark ? '#9A3412' : '#FB923C'} />
          </SvgLinearGradient>
        </Defs>
        <Rect x="0" y="0" width="300" height="124" fill="url(#featGrad)" />
        <Circle cx="248" cy="62" r="14" stroke="#7C2D12" strokeOpacity="0.18" strokeWidth="0.8" fill="none" />
        <Circle cx="248" cy="62" r="26" stroke="#7C2D12" strokeOpacity="0.16" strokeWidth="0.8" fill="none" />
        <Circle cx="248" cy="62" r="38" stroke="#7C2D12" strokeOpacity="0.14" strokeWidth="0.8" fill="none" />
        <Circle cx="248" cy="62" r="50" stroke="#7C2D12" strokeOpacity="0.12" strokeWidth="0.8" fill="none" />
        <Circle cx="248" cy="62" r="62" stroke="#7C2D12" strokeOpacity="0.10" strokeWidth="0.8" fill="none" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const x2 = 248 + 70 * Math.cos(rad)
          const y2 = 62 + 70 * Math.sin(rad)
          return (
            <Line
              key={deg}
              x1="248"
              y1="62"
              x2={x2}
              y2={y2}
              stroke="#7C2D12"
              strokeOpacity="0.11"
              strokeWidth="0.8"
            />
          )
        })}
      </Svg>
    </View>
  )
}

function InkPill({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#1C1917',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: '#FAFAF7', letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  )
}

function GoingPill({ label }: { label: string }) {
  return (
    <View
      style={{
        backgroundColor: '#DCFCE7',
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#15803D' }} />
      <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: '#15803D', letterSpacing: 0.2 }}>
        {label}
      </Text>
    </View>
  )
}

function AttendeeStack({
  attendees,
  fallback,
}: {
  attendees?: EventDisplay['attendeesList']
  fallback: { name: string; initials: string; accentColor?: string }[]
}) {
  const max = 4
  const items = attendees && attendees.length > 0
    ? attendees.slice(0, max).map((a) => ({ name: a.name, initials: a.initials, image: a.image }))
    : fallback.slice(0, max).map((p) => ({ name: p.name, initials: p.initials, accentColor: p.accentColor }))

  return (
    <View style={{ flexDirection: 'row' }}>
      {items.map((item, index) => (
        <View
          key={`${item.name}-${index}`}
          style={{
            marginLeft: index === 0 ? 0 : -7,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            borderRadius: 14,
          }}
        >
          <Avatar
            name={item.name}
            initials={item.initials}
            image={(item as any).image}
            backgroundColor={(item as any).accentColor}
            size={22}
          />
        </View>
      ))}
    </View>
  )
}

function BoardPeekRow({
  post,
  showDivider,
  textColor,
  bodyColor,
  mutedColor,
  faintColor,
  dividerColor,
  accentColor,
  onPress,
}: {
  post: HomeBoardPost
  showDivider: boolean
  textColor: string
  bodyColor: string
  mutedColor: string
  faintColor: string
  dividerColor: string
  accentColor: string
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: dividerColor,
      }}
    >
      <Avatar
        name={post.author.name}
        initials={post.author.initials}
        size={32}
        backgroundColor={post.author.accentColor}
      />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 13, color: textColor }}
            numberOfLines={1}
          >
            {post.author.name}
          </Text>
          {post.author.verification === 'sevak' ? (
            <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 10.5, color: '#C2410C', letterSpacing: 0.4 }}>
              SEVAK
            </Text>
          ) : null}
          <Text
            style={{ fontFamily: 'Inclusive Sans', fontSize: 11, color: mutedColor }}
            numberOfLines={1}
          >
            · in {post.sourceTitle}
          </Text>
          <Text style={{ marginLeft: 'auto', fontFamily: 'Inclusive Sans', fontSize: 11, color: faintColor }}>
            {post.timestamp}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: 'Inclusive Sans',
            fontSize: 13,
            lineHeight: 18,
            color: bodyColor,
          }}
          numberOfLines={2}
        >
          {post.body}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <MessageCircle size={12} color={accentColor} strokeWidth={2.3} />
          <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: accentColor }}>
            {post.replyCount ?? 1} {(post.replyCount ?? 1) === 1 ? 'reply' : 'replies'}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

function MiniEventRow({
  item,
  cardBg,
  surfaceBg,
  borderColor,
  textColor,
  mutedColor,
  accentColor,
  isDark,
}: {
  item: WeekItem
  cardBg: string
  surfaceBg: string
  borderColor: string
  textColor: string
  mutedColor: string
  accentColor: string
  isDark: boolean
}) {
  const highlightBg = isDark ? 'rgba(124,45,18,0.28)' : '#FFF7ED'
  const highlightBorder = isDark ? '#7C2D12' : '#FFE0C2'
  const pillBg = item.highlight ? (isDark ? '#1F1F1F' : '#FFFFFF') : surfaceBg

  return (
    <Pressable
      onPress={item.onPress}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: item.highlight ? highlightBorder : borderColor,
        backgroundColor: item.highlight ? highlightBg : cardBg,
      }}
    >
      <View
        style={{
          width: 44,
          height: 50,
          borderRadius: 10,
          backgroundColor: pillBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 9.5, color: accentColor, letterSpacing: 0.6 }}>
          {item.month}
        </Text>
        <Text style={{ fontFamily: 'Inclusive Sans', fontSize: 18, lineHeight: 20, color: textColor }}>
          {item.day}
        </Text>
      </View>
      <View style={{ flex: 1, minWidth: 0, justifyContent: 'center', gap: 2 }}>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 14, color: textColor }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          style={{ fontFamily: 'Inclusive Sans', fontSize: 12, color: mutedColor }}
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      </View>
    </Pressable>
  )
}

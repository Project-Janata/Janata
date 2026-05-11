import React, { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { useTheme, useUser } from '../../components/contexts'
import { useDiscoverData, useMyEvents } from '../../hooks/useApiData'
import type { EventDisplay } from '../../utils/api'
import { centerBoards, eventBoards, featuredHomeEvent } from '../../components/connect'
import { FeaturedEventCard, type FeaturedSource } from '../../components/home/FeaturedEventCard'
import { BoardPeekRow, type HomeBoardPost } from '../../components/home/BoardPeekRow'
import { MiniEventRow, type WeekItem } from '../../components/home/MiniEventRow'

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
  const { events: myEvents, loading: myEventsLoading, refetch: refetchMyEvents } = useMyEvents(user?.username)
  const {
    allEvents,
    allCenters,
    loading: discoverLoading,
    refresh: refreshDiscover,
  } = useDiscoverData('Events', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID)

  useFocusEffect(
    useCallback(() => {
      refetchMyEvents()
      refreshDiscover()
    }, [refetchMyEvents, refreshDiscover])
  )

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

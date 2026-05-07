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
import { Building2, Clock3, MapPin } from 'lucide-react-native'
import { usePostHog } from 'posthog-react-native'
import HomeMiniMap from '../../components/home/HomeMiniMap'
import { Avatar, Badge } from '../../components/ui'
import { useTheme, useUser } from '../../components/contexts'
import { useCenterDetail, useDiscoverData, useMyEvents } from '../../hooks/useApiData'
import { extractCityState } from '../../utils/addressParsing'
import type { EventDisplay, MapPoint } from '../../utils/api'

const AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1']

type HomeCenter = {
  id: string
  name: string
  address?: string
  image?: string | null
  eventCount?: number
  memberCount?: number
}

type TilePreview = {
  url: string
  markers: Array<{ id: string; type: 'center' | 'event'; x: number; y: number }>
}

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

function getEventLocation(event: EventDisplay) {
  return event.location || event.address || 'Location TBA'
}

function isValidMapPoint(point: MapPoint) {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  )
}

function longitudeToTileX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * 2 ** zoom
}

function latitudeToTileY(latitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * 2 ** zoom
}

function buildTilePreview(points: MapPoint[], userCenterID?: string | null): TilePreview {
  const valid = points.filter(isValidMapPoint)
  const homePoint = userCenterID
    ? valid.find((point) => point.id === userCenterID && point.type === 'center')
    : undefined
  const selected = [
    ...(homePoint ? [homePoint] : []),
    ...valid.filter((point) => point.id !== homePoint?.id).slice(0, 8),
  ]
  const centerSource = homePoint || selected[0]
  const latitude = centerSource?.latitude ?? 37.7749
  const longitude = centerSource?.longitude ?? -122.4194
  const zoom = 10
  const centerTileX = longitudeToTileX(longitude, zoom)
  const centerTileY = latitudeToTileY(latitude, zoom)
  const tileX = Math.floor(centerTileX)
  const tileY = Math.floor(centerTileY)
  const url = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${tileX}/${tileY}@2x.png`
  const markers = selected
    .map((point) => {
      const x = (longitudeToTileX(point.longitude, zoom) - tileX) * 100
      const y = (latitudeToTileY(point.latitude, zoom) - tileY) * 100
      return { id: point.id, type: point.type, x, y }
    })
    .filter((marker) => marker.x >= -10 && marker.x <= 110 && marker.y >= -10 && marker.y <= 110)

  return { url, markers }
}

export default function HomeScreen() {
  const router = useRouter()
  const { width } = useWindowDimensions()
  const posthog = usePostHog()
  const { user } = useUser()
  const { isDark } = useTheme()
  const { events: myEvents, loading: myEventsLoading } = useMyEvents(user?.username)
  const { center, loading: centerLoading } = useCenterDetail(user?.centerID || '')
  const {
    allEvents,
    allCenters,
    filteredPoints,
    loading: discoverLoading,
  } = useDiscoverData('Events', '', user?.id, false, false, user?.interests ?? undefined, user?.centerID)

  const isDesktop = width >= 860
  const pageBg = isDark ? '#171717' : '#FFFFFF'
  const rowBorder = isDark ? '#262626' : '#E7E5E4'
  const textColor = isDark ? '#FAFAFA' : '#1C1917'
  const mutedColor = isDark ? '#A8A29E' : '#78716C'
  const signedUpEvents = useMemo(() => {
    const registeredFromDiscover = sortUpcomingEvents(allEvents.filter((event) => event.isRegistered))
    if (registeredFromDiscover.length > 0) return registeredFromDiscover
    return sortUpcomingEvents(myEvents.map((event) => ({ ...event, isRegistered: true })))
  }, [allEvents, myEvents])
  const upcomingExploreEvents = useMemo(
    () => sortUpcomingEvents(allEvents.filter((event) => !event.isRegistered)),
    [allEvents]
  )
  const eventsToShow = (signedUpEvents.length > 0 ? signedUpEvents : upcomingExploreEvents).slice(0, 5)
  const isShowingSignedUp = signedUpEvents.length > 0
  const upcomingEventCount = sortUpcomingEvents(allEvents).length
  const tilePreview = useMemo(
    () => buildTilePreview(filteredPoints, user?.centerID),
    [filteredPoints, user?.centerID]
  )
  const discoverHomeCenter = allCenters.find((item) => item.id === user?.centerID)
  const homeCenter: HomeCenter | null = center
    ? {
        id: center.id,
        name: center.name,
        address: center.address,
        image: center.image,
        eventCount: center.upcomingEvents,
        memberCount: center.memberCount,
      }
    : discoverHomeCenter
      ? {
          id: discoverHomeCenter.id,
          name: discoverHomeCenter.name,
          address: discoverHomeCenter.address,
          image: discoverHomeCenter.image,
          eventCount: discoverHomeCenter.eventCount,
          memberCount: discoverHomeCenter.memberCount,
        }
      : null
  const isLoading = discoverLoading || (user ? myEventsLoading || centerLoading : false)

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: pageBg }}>
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: pageBg }}
      contentContainerStyle={{
        paddingHorizontal: isDesktop ? 24 : 16,
        paddingTop: Platform.OS === 'web' ? 20 : 14,
        paddingBottom: Platform.OS === 'web' ? 40 : 112,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ width: '100%', maxWidth: 640, alignSelf: 'center', gap: 16 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: mutedColor }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, lineHeight: 34, color: textColor }}>
            {user ? `Namaste, ${user.firstName || user.username}` : 'Namaste'}
          </Text>
        </View>

        <HomeMiniMap
          eventCount={upcomingEventCount}
          centerCount={allCenters.length}
          points={filteredPoints}
          userCenterID={user?.centerID}
          tilePreview={tilePreview}
          isDark={isDark}
          onPress={() => router.push('/')}
        />

        <View style={{ gap: 8 }}>
          <SectionLabel label="YOUR CENTER" color={mutedColor} />
          {homeCenter ? (
            <HomeCenterCard
              center={homeCenter}
              isDark={isDark}
              onPress={() => {
                posthog?.capture('home_center_pressed', { centerId: homeCenter.id })
                router.push(`/center/${homeCenter.id}`)
              }}
            />
          ) : (
            <FindCenterCard
              isDark={isDark}
              onPress={() => {
                posthog?.capture('home_find_center_pressed')
                router.push('/')
              }}
            />
          )}
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <SectionLabel
              label={isShowingSignedUp ? 'YOUR EVENTS' : 'COMING UP SOON'}
              color={mutedColor}
            />
            <Pressable onPress={() => router.push('/')}>
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#E8862A' }}>See all</Text>
            </Pressable>
          </View>

          {eventsToShow.length > 0 ? (
            <View style={{ gap: 6 }}>
              {eventsToShow.map((event) => (
                <HomeEventCard
                  key={event.id}
                  event={event}
                  centerName={allCenters.find((item) => item.id === event.centerId)?.name}
                  isDark={isDark}
                  onPress={() => {
                    posthog?.capture('home_event_pressed', {
                      eventId: event.id,
                      source: isShowingSignedUp ? 'registered' : 'upcoming',
                    })
                    router.push(`/events/${event.id}`)
                  }}
                />
              ))}
            </View>
          ) : (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: rowBorder,
                backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF',
                padding: 16,
                gap: 4,
              }}
            >
              <Text style={{ fontFamily: 'Inter-SemiBold', fontSize: 16, color: textColor }}>
                No events yet
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, lineHeight: 20, color: mutedColor }}>
                Upcoming events from Explore will appear here as they are added.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color,
        letterSpacing: 0.6,
      }}
    >
      {label}
    </Text>
  )
}

function HomeCenterCard({
  center,
  isDark,
  onPress,
}: {
  center: HomeCenter
  isDark: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 p-3 rounded-2xl active:opacity-70"
      style={{ backgroundColor: isDark ? 'rgba(124,45,18,0.2)' : '#FFF7ED' }}
    >
      <View className="w-12 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center overflow-hidden">
        {center.image ? (
          <Image source={{ uri: center.image }} style={{ width: 48, height: 56 }} resizeMode="cover" />
        ) : (
          <Building2 size={20} color="#9A3412" />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1"
            numberOfLines={1}
          >
            {center.name}
          </Text>
          <Badge label="My Center" variant="going" />
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm" numberOfLines={1}>
          {extractCityState(center.address) || center.address || 'Center'}
        </Text>
        <Text className="text-primary font-inter text-xs mt-0.5">
          {center.eventCount ?? 0} upcoming events
          {center.memberCount != null && center.memberCount > 0 ? ` - ${center.memberCount} members` : ''}
        </Text>
      </View>
    </Pressable>
  )
}

function FindCenterCard({ isDark, onPress }: { isDark: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 p-3 rounded-2xl active:opacity-70"
      style={{ backgroundColor: isDark ? '#1F1F1F' : '#FFFFFF' }}
    >
      <View className="w-12 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center">
        <Building2 size={20} color="#9A3412" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight">
          Find your center
        </Text>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm">
          Choose a home center from Explore.
        </Text>
      </View>
    </Pressable>
  )
}

function HomeEventCard({
  event,
  centerName,
  isDark,
  onPress,
}: {
  event: EventDisplay
  centerName?: string
  isDark: boolean
  onPress: () => void
}) {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }
  const todayLabel = event.date ? isToday(event.date) : false

  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 p-3 rounded-2xl active:opacity-70"
      style={{
        backgroundColor: event.isRegistered
          ? isDark
            ? 'rgba(124,45,18,0.2)'
            : '#FFF7ED'
          : isDark
            ? '#1F1F1F'
            : '#FFFFFF',
      }}
    >
      <View className="w-12 h-14 rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800">
        <Text className="text-[10px] font-inter-semibold" style={{ color: '#E8862A' }}>
          {month}
        </Text>
        <Text className="text-base font-inter-bold text-content dark:text-content-dark">
          {day}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text
            className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1"
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {event.isRegistered && <Badge label="Going" variant="going" />}
        </View>
        <View className="flex-row items-center gap-1">
          <Clock3 size={12} color="#78716C" />
          <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm" numberOfLines={1}>
            {todayLabel ? 'Today - ' : ''}{event.time || 'TBD'}
          </Text>
        </View>
        {centerName && (
          <Text className="text-stone-500 dark:text-stone-400 font-inter text-xs" numberOfLines={1}>
            By {centerName}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-0.5">
          <MapPin size={12} color="#E8862A" />
          <Text className="text-stone-500 dark:text-stone-400 font-inter text-xs flex-1" numberOfLines={1}>
            {getEventLocation(event)}
          </Text>
        </View>
        {event.attendees > 0 && (
          <AttendeeAvatars count={event.attendees} attendees={event.attendeesList} />
        )}
      </View>
      {event.image && (
        <Image
          source={{ uri: event.image }}
          style={{ width: 72, height: 72, borderRadius: 10 }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  )
}

function AttendeeAvatars({
  count,
  attendees,
}: {
  count: number
  attendees?: EventDisplay['attendeesList']
}) {
  if (count <= 0) return null
  const shown = Math.min(count, 4)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <View style={{ flexDirection: 'row' }}>
        {attendees && attendees.length > 0 ? (
          attendees.slice(0, shown).map((attendee, index) => (
            <Avatar
              key={`${attendee.name}-${index}`}
              image={attendee.image}
              initials={attendee.initials}
              name={attendee.name}
              size={18}
              style={{
                marginLeft: index === 0 ? 0 : -6,
                borderWidth: 1.5,
                borderColor: 'white',
              }}
            />
          ))
        ) : (
          Array.from({ length: shown }).map((_, index) => (
            <View
              key={index}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                marginLeft: index === 0 ? 0 : -6,
                borderWidth: 1.5,
                borderColor: 'white',
              }}
            />
          ))
        )}
      </View>
      <Text className="text-stone-400 dark:text-stone-500 font-inter text-xs">
        {count} going
      </Text>
    </View>
  )
}

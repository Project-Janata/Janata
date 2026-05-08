// Discover tab — web desktop layout
import { EmptyState } from '../../components/ui/EmptyState'
import { DiscoverListSkeleton } from '../../components/ui/Skeleton'
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  lazy,
  Suspense,
  use,
} from 'react'
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native'
import { MapPin, Search, Building2, Users, ChevronUp, ChevronDown } from 'lucide-react-native'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useTheme, useUser } from '../../components/contexts'
import { FilterChip, Badge, UnderlineTabBar, Avatar } from '../../components/ui'
import FilterPickerModal, { type FilterPickerOption } from '../../components/ui/FilterPickerModal'
const Map = lazy(() => import('../../components/Map'))
import MapPopover from '../../components/MapPopover'
import {
  useDiscoverData,
  useEventDetail,
  useCenterDetail,
  type DiscoverFilter,
} from '../../hooks/useApiData'
import EventDetailPanel from '../../components/web/EventDetailPanel'
import EventFormPanel from '../../components/web/EventFormPanel'
import CenterDetailPanel from '../../components/web/CenterDetailPanel'
import { useDetailColors } from '../../hooks/useDetailColors'
import AuthPromptModal from '../../components/ui/AuthPromptModal'
import type { MapPoint, EventDisplay, DiscoverCenter, AttendeeInfo } from '../../utils/api'
import { removeEvent } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'
import { WeekCalendar } from '../../components'
import { ADMIN_EMAIL, isLocal } from '../../utils/admin'

const FILTERS: { label: DiscoverFilter }[] = [
  { label: 'Events' },
  { label: 'Centers' },
  { label: 'Seva' },
]

function formatDatePill(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  return dateStr === today.toISOString().split('T')[0]
}

function isValidMapCoord(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/** Resolve lat/lng for the side panel selection so the map can fly there (list, marker, or URL). */
function findCoordsForSelection(
  selectedItem: { type: 'event' | 'center'; id: string },
  filteredPoints: MapPoint[],
  allEvents: EventDisplay[],
  allCenters: DiscoverCenter[]
): { latitude: number; longitude: number } | null {
  const targetType = selectedItem.type === 'center' ? 'center' : 'event'
  const pt = filteredPoints.find((p) => p.id === selectedItem.id && p.type === targetType)
  if (pt && isValidMapCoord(pt.latitude, pt.longitude)) {
    return { latitude: pt.latitude, longitude: pt.longitude }
  }
  if (selectedItem.type === 'event') {
    const e = allEvents.find((x) => x.id === selectedItem.id)
    if (
      e?.latitude != null &&
      e?.longitude != null &&
      isValidMapCoord(e.latitude, e.longitude)
    ) {
      return { latitude: e.latitude, longitude: e.longitude }
    }
  } else {
    const c = allCenters.find((x) => x.id === selectedItem.id)
    if (c && isValidMapCoord(c.latitude, c.longitude)) {
      return { latitude: c.latitude, longitude: c.longitude }
    }
  }
  return null
}

// ── Placeholder avatar dots for attendee count ──────────

const AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1']

function AttendeeAvatars({ count, attendees }: { count: number; attendees?: AttendeeInfo[] }) {
  if (count <= 0) return null
  const shown = Math.min(count, 4)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        {attendees && attendees.length > 0
          ? attendees.slice(0, shown).map((attendee, i) => (
              <Avatar
                key={i}
                image={attendee.image}
                initials={attendee.initials}
                name={attendee.name}
                size={18}
                style={{
                  marginLeft: i === 0 ? 0 : -6,
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}
              />
            ))
          : Array.from({ length: shown }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  marginLeft: i === 0 ? 0 : -6,
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}
              />
            ))}
      </View>
      <Text className="text-stone-400 dark:text-stone-500 font-inter text-xs">{count} going</Text>
    </View>
  )
}

// ─── Event Item (Desktop) ───────────────────────────────

function EventItem({
  event,
  onPress,
  centerName,
}: {
  event: EventDisplay
  onPress: () => void
  centerName?: string
}) {
  const { month, day } = event.date ? formatDatePill(event.date) : { month: '', day: '' }

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-4 p-4 rounded-2xl active:opacity-80 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 ${
        event.isRegistered
          ? 'bg-orange-50/80 dark:bg-orange-950/20'
          : 'bg-white dark:bg-neutral-900'
      }`}
      style={{ minHeight: 72 }}
    >
      {/* Date pill */}
      <View className="w-[52px] h-[60px] rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800">
        <Text className="text-[10px] font-inter-semibold" style={{ color: '#E8862A' }}>
          {month}
        </Text>
        <Text className="text-lg font-inter-bold text-content dark:text-content-dark">{day}</Text>
      </View>

      {/* Content */}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1"
            numberOfLines={2}
          >
            {event.title}
          </Text>
          {event.isRegistered && <Badge label="Going" variant="going" />}
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm">
          {event.date && isToday(event.date) ? 'Today · ' : ''}{event.time || ''}
        </Text>
        {centerName && (
          <Text
            className="text-stone-500 dark:text-stone-400 font-inter text-sm"
            numberOfLines={1}
          >
            By {centerName}
          </Text>
        )}
        <View className="flex-row items-center gap-1.5">
          <MapPin size={12} color="#E8862A" />
          <Text
            className="text-stone-500 dark:text-stone-400 font-inter text-sm flex-1"
            numberOfLines={1}
          >
            {event.location}
          </Text>
        </View>
        {event.attendees > 0 && (
          <View style={{ marginTop: 4 }}>
            <AttendeeAvatars count={event.attendees} attendees={event.attendeesList} />
          </View>
        )}
      </View>

      {/* Hero thumbnail */}
      {event.image && (
        <Image
          source={{ uri: event.image }}
          style={{ width: 84, height: 84, borderRadius: 12 }}
          resizeMode="cover"
        />
      )}
    </Pressable>
  )
}

// ─── Center Item (Desktop) ──────────────────────────────

function CenterItem({ center, onPress, isMyCenter }: { center: DiscoverCenter; onPress: () => void; isMyCenter?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-4 p-4 rounded-2xl active:opacity-80 border border-transparent hover:border-stone-200 dark:hover:border-neutral-700 ${
        center.isMember || isMyCenter ? 'bg-orange-50/80 dark:bg-orange-950/20' : 'bg-white dark:bg-neutral-900'
      }`}
      style={{ minHeight: 72 }}
    >
      {/* Icon pill */}
      <View className="w-[52px] h-[60px] rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center overflow-hidden">
        {center.image ? (
          <Image source={{ uri: center.image }} style={{ width: 52, height: 60 }} resizeMode="cover" />
        ) : (
          <Building2 size={22} color="#9A3412" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1"
            numberOfLines={1}
          >
            {center.name}
          </Text>
          {isMyCenter && <Badge label="My Center" variant="going" />}
          {!isMyCenter && center.isMember && <Badge label="Member" variant="member" />}
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm">
          {extractCityState(center.address) || 'Center'}{center.distanceMi != null ? ` · ${center.distanceMi} mi` : ''}
        </Text>
        {center.eventCount != null && center.eventCount > 0 && (
          <Text className="text-primary font-inter text-xs">
            {center.eventCount} events this week
          </Text>
        )}
      </View>
    </Pressable>
  )
}

// ─── Detail Panel Wrapper (for side panel) ──────────────

function DetailPanelWrapper({
  selectedItem,
  onClose,
  onEventPress,
  onEditEvent,
  onStatusChange,
}: {
  selectedItem: { type: 'event' | 'center'; id: string }
  onClose: () => void
  onEventPress: (id: string) => void
  onEditEvent?: (id: string) => void
  onStatusChange?: (
    id: string,
    registered: boolean,
    count: number,
    attendeesList: AttendeeInfo[]
  ) => void
}) {
  if (selectedItem.type === 'event') {
    return (
      <EventPanelInner
        eventId={selectedItem.id}
        onClose={onClose}
        onEdit={onEditEvent}
        onStatusChange={onStatusChange}
      />
    )
  }
  return (
    <CenterPanelInner centerId={selectedItem.id} onClose={onClose} onEventPress={onEventPress} />
  )
}

function EventPanelInner({
  eventId,
  onClose,
  onEdit,
  onStatusChange,
}: {
  eventId: string
  onClose: () => void
  onEdit?: (id: string) => void
  onStatusChange?: (
    id: string,
    registered: boolean,
    count: number,
    attendeesList: AttendeeInfo[]
  ) => void
}) {
  const { user } = useUser()
  const { event, attendees, loading, toggleRegistration, isToggling, isCreator } = useEventDetail(
    eventId,
    user?.username,
    user?.id
  )
  const colors = useDetailColors()
  const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107)
  const canEdit = isAdmin || isCreator

  // Propogate registration status change back to discover list
  const prevRegisteredRef = useRef<boolean | undefined>(undefined)

  useEffect(() => {
    if (!event) return
    if (prevRegisteredRef.current === undefined) {
      prevRegisteredRef.current = event.isRegistered
      return
    }
    if (event.isRegistered !== prevRegisteredRef.current) {
      const attendeesList = attendees.map(({ name, image, initials }) => ({
        name,
        image,
        initials,
      }))
      onStatusChange?.(event.id, event.isRegistered || false, event.attendees || 0, attendeesList)
      prevRegisteredRef.current = event.isRegistered
    }
  }, [event?.isRegistered, event?.attendees, attendees, onStatusChange])
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const handleToggleRegistration = async () => {
    if (!user) {
      setShowAuthPrompt(true)
      return
    }
    if (!user.username) return
    try {
      await toggleRegistration(user.username)
    } catch (err: any) {
      if (__DEV__) console.warn('[EventPanel] toggleRegistration failed:', err?.message || err)
    }
  }

  if (loading || !event) {
    return (
      <View
        style={{
          width: 440,
          height: '100%',
          backgroundColor: colors.panelBg,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  const isPast = event.date ? new Date(event.date + 'T23:59:59') < new Date() : false

  return (
    <>
      <EventDetailPanel
        event={event}
        attendees={attendees}
        isPast={isPast}
        isAdmin={isAdmin}
        onClose={onClose}
        onToggleRegistration={handleToggleRegistration}
        isToggling={isToggling}
        onEdit={canEdit && !isPast ? onEdit : undefined}
        onDelete={
          canEdit
            ? async (id) => {
                if (typeof window === 'undefined') return
                if (!window.confirm(`Delete "${event.title}"? This cannot be undone.`)) return
                try {
                  await removeEvent(id)
                  onClose()
                } catch (err: any) {
                  window.alert(err?.message || 'Failed to delete event')
                }
              }
            : undefined
        }
      />
      <AuthPromptModal
        visible={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        returnTo={`/?detail=event&id=${eventId}`}
        eventTitle={event.title}
      />
    </>
  )
}

function CenterPanelInner({
  centerId,
  onClose,
  onEventPress,
}: {
  centerId: string
  onClose: () => void
  onEventPress: (id: string) => void
}) {
  const { center, events, loading } = useCenterDetail(centerId)
  const colors = useDetailColors()

  if (loading || !center) {
    return (
      <View
        style={{
          width: 440,
          height: '100%',
          backgroundColor: colors.panelBg,
          borderLeftWidth: 1,
          borderLeftColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#E8862A" />
      </View>
    )
  }

  return (
    <CenterDetailPanel
      center={center}
      events={events}
      onClose={onClose}
      onEventPress={onEventPress}
    />
  )
}

// ─── Mobile Discover (map + CSS bottom sheet) ──────────

type SheetSnap = 'peek' | 'collapsed' | 'mid' | 'expanded'

function MobileDiscoverFallback() {
  const router = useRouter()
  const { isDark } = useTheme()
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('Events')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showGoingOnly, setShowGoingOnly] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [showCenterModal, setShowCenterModal] = useState(false)
  const { user } = useUser()
  const { items, filteredPoints, loading, allEvents, allCenters, refresh } = useDiscoverData(
    activeFilter,
    searchQuery,
    user?.id,
    showPastEvents,
    showGoingOnly,
    user?.interests ?? undefined,
    user?.centerID
  )

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  // Bottom sheet state
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('mid')
  const [sheetTranslateY, setSheetTranslateY] = useState<number | null>(null)
  const dragStartY = useRef(0)
  const dragStartTranslate = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sheet snap positions matching iOS native (4 stops):
  //   expanded  = 0          → 100% sheet visible (full)
  //   mid       = h * 0.2    → ~80% sheet visible
  //   collapsed = h * 0.6    → ~40% sheet visible
  //   peek      = h - 100    → 100px sheet visible (handle + search)
  const getSnapPositions = useCallback(() => {
    const h = containerRef.current?.clientHeight || window.innerHeight
    return {
      expanded: 0,
      mid: h * 0.2,
      collapsed: h * 0.6,
      peek: Math.max(0, h - 100),
    }
  }, [])

  const getSnapY = useCallback(
    (snap: SheetSnap) => {
      const positions = getSnapPositions()
      return positions[snap]
    },
    [getSnapPositions]
  )

  const currentTranslateY = sheetTranslateY ?? getSnapY(sheetSnap)

  // Touch handlers for bottom sheet drag
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dragStartY.current = e.touches[0].clientY
      dragStartTranslate.current = currentTranslateY
    },
    [currentTranslateY]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.touches[0].clientY - dragStartY.current
      const positions = getSnapPositions()
      const next = Math.max(
        positions.expanded,
        Math.min(positions.peek, dragStartTranslate.current + dy)
      )
      setSheetTranslateY(next)
    },
    [getSnapPositions]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (sheetTranslateY === null) return
      const positions = getSnapPositions()
      const dragDy = e.changedTouches[0].clientY - dragStartY.current

      // Snap to nearest of 4 positions, biased by velocity
      let snapTo: SheetSnap
      if (dragDy > 40) {
        // Fast swipe down — go one stop down from current
        if (sheetSnap === 'expanded') snapTo = 'mid'
        else if (sheetSnap === 'mid') snapTo = 'collapsed'
        else snapTo = 'peek'
      } else if (dragDy < -40) {
        // Fast swipe up — go one stop up from current
        if (sheetSnap === 'peek') snapTo = 'collapsed'
        else if (sheetSnap === 'collapsed') snapTo = 'mid'
        else snapTo = 'expanded'
      } else {
        // Position-based snap to nearest
        const dExp = Math.abs(sheetTranslateY - positions.expanded)
        const dMid = Math.abs(sheetTranslateY - positions.mid)
        const dCol = Math.abs(sheetTranslateY - positions.collapsed)
        const dPeek = Math.abs(sheetTranslateY - positions.peek)
        const minD = Math.min(dExp, dMid, dCol, dPeek)
        snapTo =
          minD === dExp ? 'expanded' : minD === dMid ? 'mid' : minD === dCol ? 'collapsed' : 'peek'
      }

      setSheetSnap(snapTo)
      setSheetTranslateY(null)
    },
    [sheetTranslateY, sheetSnap, getSnapPositions]
  )

  const handlePointPress = useCallback(
    (point: MapPoint) => {
      if (point.type === 'center') {
        router.push(`/center/${point.id}`)
      } else {
        router.push(`/events/${point.id}`)
      }
    },
    [router]
  )

  const handleFilterPress = useCallback((f: DiscoverFilter) => {
    setActiveFilter(f)
    setSelectedDate(null)
  }, [])

  const eventDates = useMemo(
    () => new Set(allEvents.filter((e) => e.date).map((e) => e.date)),
    [allEvents]
  )

  // "Coming up" hint shown when there's a real gap between today and the
  // next event. Bridges the dead air for users browsing an empty week.
  const comingUpHint = useMemo(() => {
    if (selectedDate || showPastEvents || activeFilter !== 'Events' || searchQuery.trim()) return null
    const todayStr = new Date().toISOString().split('T')[0]
    const upcoming = allEvents
      .filter((e) => e.date && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (upcoming.length === 0) return null
    const next = upcoming[0]
    const todayMs = Date.parse(todayStr + 'T00:00:00')
    const nextMs = Date.parse(next.date + 'T00:00:00')
    if (isNaN(todayMs) || isNaN(nextMs)) return null
    const days = Math.round((nextMs - todayMs) / 86400000)
    if (days < 7) return null  // only worth showing when there's a real gap
    return { days, title: next.title }
  }, [allEvents, selectedDate, showPastEvents, activeFilter, searchQuery])

  const displayItems = useMemo(() => {
    let result = items
    if (selectedDate) {
      result = result.filter(
        (item) => item.type === 'event' && (item.data as EventDisplay).date === selectedDate
      )
    }
    if (selectedCenter) {
      result = result.filter((item) => {
        if (item.type !== 'event') return true
        return (item.data as EventDisplay).centerId === selectedCenter
      })
    }
    return result
  }, [items, selectedDate, selectedCenter])

  const isExpanded = sheetSnap === 'expanded' && sheetTranslateY === null
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

  // Default the Centers list to fully collapsed on first visit. The list
  // is long (state groupings across 90+ centers) and an all-expanded view
  // is overwhelming. Re-initializes when user toggles back from another tab.
  const collapsedInitFor = useRef<DiscoverFilter | null>(null)
  useEffect(() => {
    if (activeFilter !== 'Centers') {
      collapsedInitFor.current = null
      return
    }
    if (collapsedInitFor.current === 'Centers') return
    if (items.length === 0) return
    const labels = new Set<string>()
    let isFirst = true
    for (const item of items) {
      if (item.type === 'section') {
        if (!isFirst) labels.add(item.data.label)
        isFirst = false
      }
    }
    setCollapsedSections(labels)
    collapsedInitFor.current = 'Centers'
  }, [activeFilter, items])

  const stickyHeaderIndices = useMemo(
    () =>
      displayItems.reduce<number[]>((acc, item, idx) => {
        if (item.type === 'section') acc.push(idx)
        return acc
      }, []),
    [displayItems]
  )

  // Filter chip helpers — counts are computed over upcoming events
  // (past events are hidden by default, so the counts should match
  // what the user would actually see when picking that option).
  const todayStr = new Date().toISOString().split('T')[0]
  const eventsForCounts = useMemo(
    () => (showPastEvents ? allEvents : allEvents.filter((e) => !e.date || e.date >= todayStr)),
    [allEvents, showPastEvents, todayStr]
  )
  const centerOptions = useMemo<FilterPickerOption<string>[]>(() => {
    const counts: Record<string, number> = {}
    for (const e of eventsForCounts) {
      if (e.centerId) counts[e.centerId] = (counts[e.centerId] ?? 0) + 1
    }
    return [...allCenters]
      .map((c) => ({ value: c.id, label: c.name, sublabel: c.address, count: counts[c.id] ?? 0 }))
      .filter((o) => (o.count ?? 0) > 0)
      .sort((a, b) => {
        if (user?.centerID && a.value === user.centerID) return -1
        if (user?.centerID && b.value === user.centerID) return 1
        return a.label.localeCompare(b.label)
      })
  }, [allCenters, eventsForCounts, user?.centerID])
  const centerChipLabel = selectedCenter
    ? centerOptions.find((o) => o.value === selectedCenter)?.label ?? 'Center'
    : 'Center'
  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Map — full bleed behind the sheet */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Suspense
          fallback={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#E8862A" />
            </View>
          }
        >
          <Map points={filteredPoints} onPointPress={handlePointPress} userCenterID={user?.centerID} />
        </Suspense>
      </View>

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          top: currentTranslateY,
          transition: sheetTranslateY !== null ? 'none' : 'top 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            backgroundColor: isDark ? '#171717' : '#FFFFFF',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Drag Handle Zone */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              touchAction: 'none',
              cursor: 'grab',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 10,
                paddingBottom: 8,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isDark ? '#525252' : '#D1D5DB',
                }}
              />
            </div>

            {/* Search */}
            <View
              className="flex-row items-center mx-3 mb-2 px-3 rounded-xl"
              style={{
                minHeight: 44,
                backgroundColor: isDark ? '#262626' : '#F3F4F6',
              }}
            >
              <Search size={16} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-sm font-inter"
                style={{
                  color: isDark ? '#E5E7EB' : '#1F2937',
                  paddingVertical: 10,
                  fontSize: 16,
                }}
                placeholder="Search events and centers..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSheetSnap('expanded')}
              />
            </View>

            {/* Filter tabs */}
            <View style={{ marginBottom: 4 }}>
              <UnderlineTabBar
                tabs={FILTERS.map((f) => f.label)}
                activeTab={selectedDate ? '' : activeFilter}
                onTabChange={(tab) => handleFilterPress(tab as DiscoverFilter)}
                counts={{ Events: allEvents.length, Centers: allCenters.length }}
              />
            </View>

            {/* Filter chips — Today / Type / Center / Going (max 4) */}
            {activeFilter === 'Events' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, gap: 8 }}>
                <FilterChip
                  label="Today"
                  variant="outline"
                  active={selectedDate === todayStr}
                  onPress={() => setSelectedDate((prev) => (prev === todayStr ? null : todayStr))}
                />
                <FilterChip
                  label={centerChipLabel}
                  variant="outline"
                  active={selectedCenter !== null}
                  onPress={() => setShowCenterModal(true)}
                />
                {user && (
                  <FilterChip
                    label="Going"
                    variant="outline"
                    active={showGoingOnly}
                    onPress={() => setShowGoingOnly((prev: boolean) => !prev)}
                  />
                )}
              </View>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <View style={{ paddingHorizontal: 12 }}>
              <DiscoverListSkeleton count={4} />
            </View>
          )}

          {/* Scrollable list */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 12, paddingBottom: 32, gap: 4 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={sheetSnap !== 'collapsed' && sheetTranslateY === null}
            stickyHeaderIndices={stickyHeaderIndices}
          >
            {!loading && comingUpHint && (
              <View
                className="border border-orange-100 dark:border-orange-900/40 rounded-2xl px-4 py-3 mb-3"
                style={{ backgroundColor: 'rgba(232, 134, 42, 0.06)' }}
              >
                <Text
                  className="text-[10px] font-inter-semibold text-stone-500 dark:text-stone-400 uppercase"
                  style={{ letterSpacing: 0.6 }}
                >
                  Coming up
                </Text>
                <Text className="text-sm font-inter-semibold text-content dark:text-content-dark mt-1">
                  Next event in {comingUpHint.days} days
                </Text>
                <Text
                  className="text-xs font-inter text-stone-500 dark:text-stone-400 mt-0.5"
                  numberOfLines={1}
                >
                  {comingUpHint.title}
                </Text>
              </View>
            )}
            {!loading && activeFilter === 'Seva' && (
              <EmptyState message="Seva — coming soon" subtitle="Service opportunities will be listed here." />
            )}
            {!loading && activeFilter !== 'Seva' && displayItems.length === 0 && (
              <EmptyState variant={selectedDate ? 'date' : searchQuery ? 'search' : 'events'} />
            )}
            {activeFilter !== 'Seva' && displayItems.map((item, idx) => {
              if (item.type === 'section') {
                const label = item.data.label
                const isCollapsed = collapsedSections.has(label)
                return (
                  <Pressable
                    key={`section-${idx}`}
                    onPress={() => toggleSection(label)}
                    className={`bg-white dark:bg-neutral-900 ${idx > 0 ? 'border-t border-stone-200 dark:border-neutral-800' : ''}`}
                  >
                    <View
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text className="text-xs font-inter-semibold text-stone-500 dark:text-stone-400 uppercase" style={{ letterSpacing: 0.6 }}>
                        {label}
                      </Text>
                      {isCollapsed ? <ChevronDown size={14} color="#a8a29e" /> : <ChevronUp size={14} color="#a8a29e" />}
                    </View>
                  </Pressable>
                )
              }
              if (item.type === 'event') {
                return (
                  <EventItem
                    key={`event-${item.data.id}`}
                    event={item.data as EventDisplay}
                    centerName={allCenters.find((c) => c.id === (item.data as EventDisplay).centerId)?.name}
                    onPress={() => router.push(`/events/${item.data.id}`)}
                  />
                )
              }
              const sectionLabel = displayItems.slice(0, idx).reverse().find((i) => i.type === 'section')?.data?.label
              if (sectionLabel && collapsedSections.has(sectionLabel)) return null
              return (
                <CenterItem
                  key={`center-${item.data.id}`}
                  center={item.data as DiscoverCenter}
                  isMyCenter={!!user?.centerID && item.data.id === user.centerID}
                  onPress={() => router.push(`/center/${item.data.id}`)}
                />
              )
            })}
          </ScrollView>
        </div>
      </div>

      <FilterPickerModal
        visible={showCenterModal}
        title="Center"
        options={centerOptions}
        selected={selectedCenter}
        onSelect={setSelectedCenter}
        onClear={() => setSelectedCenter(null)}
        onClose={() => setShowCenterModal(false)}
      />
    </div>
  )
}

// ─── Desktop Discover Screen ────────────────────────────

export default function DiscoverScreenWeb() {
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const panelWidth = isTablet ? 340 : 420

  const router = useRouter()
  const { isDark } = useTheme()
  const { user } = useUser()
  const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107)
  // Beta: any signed-in user can create events. Backend enforces auth-only;
  // post-beta this becomes a coordinator-tier gate (see issue tracker).
  const canCreate = !!user
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('Events')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showGoingOnly, setShowGoingOnly] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [selectedCenterDesktop, setSelectedCenterDesktop] = useState<string | null>(null)
  const [showCenterModalDesktop, setShowCenterModalDesktop] = useState(false)
  const [selectedItem, setSelectedItem] = useState<{ type: 'event' | 'center'; id: string } | null>(
    null
  )
  const [autoOpenPoint, setAutoOpenPoint] = useState<{ id: string; type: 'event' | 'center'; key: number } | null>(null)
  const [mapFlyTo, setMapFlyTo] = useState<{ latitude: number; longitude: number; key: number } | null>(
    null
  )
  const lastFlownSelectionRef = useRef<string | null>(null)
  // Event form panel: null = hidden, { id?: string } = open (id present = edit, absent = create)
  const [formPanel, setFormPanel] = useState<{ id?: string } | null>(null)
  const { items, filteredPoints, loading, allEvents, allCenters, refresh, updateEventStatus } =
    useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID)

  // Get user's center for map initial location
  const { center: userCenter } = useCenterDetail(user?.centerID || '')

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const params = useLocalSearchParams<{ detail?: string; id?: string; action?: string }>()

  // Clear query string without navigation
  const clearParams = useCallback(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  // Support direct URL navigation (e.g. ?detail=event&id=123)
  useEffect(() => {
    if (params.detail && params.id) {
      setSelectedItem({ type: params.detail as 'event' | 'center', id: params.id })
    }
  }, [params.detail, params.id])

  // Pan/zoom the map when the user opens a center or event (list, map marker, popover, or URL).
  useEffect(() => {
    if (!selectedItem) {
      lastFlownSelectionRef.current = null
      return
    }
    const coords = findCoordsForSelection(selectedItem, filteredPoints, allEvents, allCenters)
    if (!coords) return

    const sid = `${selectedItem.type}:${selectedItem.id}`
    if (lastFlownSelectionRef.current === sid) return

    lastFlownSelectionRef.current = sid
    setMapFlyTo((prev) => ({
      latitude: coords.latitude,
      longitude: coords.longitude,
      key: (prev?.key ?? 0) + 1,
    }))
    // Tell the map to auto-open the popover for THIS exact point after the
    // fly-to settles. Disambiguates overlapping markers (e.g. multiple events
    // at the same center's coordinates) and serves as the requested
    // "popup opens after the map moves" UX.
    setAutoOpenPoint((prev) => ({
      id: selectedItem.id,
      type: selectedItem.type,
      key: (prev?.key ?? 0) + 1,
    }))
  }, [selectedItem, filteredPoints, allEvents, allCenters])

  // Listen for create event from header nav button
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      setSelectedItem(null)
      setFormPanel({})
    }
    window.addEventListener('open-event-form', handler)
    return () => window.removeEventListener('open-event-form', handler)
  }, [])

  // Fixed 440px width for both list and detail panels — no shift on selection
  const rightPanelWidth = 440

  const eventDates = useMemo(
    () => new Set(allEvents.filter((e) => e.date).map((e) => e.date)),
    [allEvents]
  )

  // "Coming up" hint shown when there's a real gap between today and the
  // next event. Bridges the dead air for users browsing an empty week.
  const comingUpHint = useMemo(() => {
    if (selectedDate || showPastEvents || activeFilter !== 'Events' || searchQuery.trim()) return null
    const todayStr = new Date().toISOString().split('T')[0]
    const upcoming = allEvents
      .filter((e) => e.date && e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (upcoming.length === 0) return null
    const next = upcoming[0]
    const todayMs = Date.parse(todayStr + 'T00:00:00')
    const nextMs = Date.parse(next.date + 'T00:00:00')
    if (isNaN(todayMs) || isNaN(nextMs)) return null
    const days = Math.round((nextMs - todayMs) / 86400000)
    if (days < 7) return null  // only worth showing when there's a real gap
    return { days, title: next.title }
  }, [allEvents, selectedDate, showPastEvents, activeFilter, searchQuery])

  const displayItems = useMemo(() => {
    let result = items
    if (selectedDate) {
      result = result.filter(
        (item) => item.type === 'event' && (item.data as EventDisplay).date === selectedDate
      )
    }
    if (selectedCenterDesktop) {
      result = result.filter((item) => {
        if (item.type !== 'event') return true
        return (item.data as EventDisplay).centerId === selectedCenterDesktop
      })
    }
    return result
  }, [items, selectedDate, selectedCenterDesktop])

  // Filter chip helpers — counts over upcoming events
  const todayStrDesktop = new Date().toISOString().split('T')[0]
  const eventsForCountsDesktop = useMemo(
    () => (showPastEvents ? allEvents : allEvents.filter((e) => !e.date || e.date >= todayStrDesktop)),
    [allEvents, showPastEvents, todayStrDesktop]
  )
  const centerOptionsDesktop = useMemo<FilterPickerOption<string>[]>(() => {
    const counts: Record<string, number> = {}
    for (const e of eventsForCountsDesktop) {
      if (e.centerId) counts[e.centerId] = (counts[e.centerId] ?? 0) + 1
    }
    return [...allCenters]
      .map((c) => ({ value: c.id, label: c.name, sublabel: c.address, count: counts[c.id] ?? 0 }))
      .filter((o) => (o.count ?? 0) > 0)
      .sort((a, b) => {
        if (user?.centerID && a.value === user.centerID) return -1
        if (user?.centerID && b.value === user.centerID) return 1
        return a.label.localeCompare(b.label)
      })
  }, [allCenters, eventsForCountsDesktop, user?.centerID])
  const centerChipLabelDesktop = selectedCenterDesktop
    ? centerOptionsDesktop.find((o) => o.value === selectedCenterDesktop)?.label ?? 'Center'
    : 'Center'

  const handleFilterPress = useCallback((f: DiscoverFilter) => {
    setActiveFilter(f)
    setSelectedDate(null)
  }, [])

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  // Map popover state
  const mapPanelRef = useRef<View>(null)
  const [hoverPopover, setHoverPopover] = useState<{
    point: MapPoint
    x: number
    y: number
  } | null>(null)
  const [clickPopover, setClickPopover] = useState<{
    point: MapPoint
    x: number
    y: number
  } | null>(null)

  const viewportToContainer = useCallback((vx: number, vy: number) => {
    const el = mapPanelRef.current as any as HTMLElement | null
    if (el?.getBoundingClientRect) {
      const r = el.getBoundingClientRect()
      return { x: vx - r.left, y: vy - r.top }
    }
    return { x: vx, y: vy }
  }, [])

  const handlePointHover = useCallback(
    (point: MapPoint | null, x?: number, y?: number) => {
      if (point && x != null && y != null) {
        const pos = viewportToContainer(x, y)
        setHoverPopover({ point, x: pos.x, y: pos.y })
      } else {
        setHoverPopover(null)
      }
    },
    [viewportToContainer]
  )

  const handlePointClick = useCallback(
    (point: MapPoint, x?: number, y?: number) => {
      setHoverPopover(null)
      if (x != null && y != null) {
        const pos = viewportToContainer(x, y)
        setClickPopover({ point, x: pos.x, y: pos.y })
      }
    },
    [viewportToContainer]
  )

  const handlePopoverView = useCallback(() => {
    if (!clickPopover) return
    const { point } = clickPopover
    setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id })
    setClickPopover(null)
  }, [clickPopover])

  // Look up details for popover from hook data (not sample constants)
  const clickEventDetail = useMemo(() => {
    if (!clickPopover || clickPopover.point.type !== 'event') return undefined
    return allEvents.find((e) => e.id === clickPopover.point.id)
  }, [clickPopover, allEvents])

  const clickCenterDetail = useMemo(() => {
    if (!clickPopover || clickPopover.point.type !== 'center') return undefined
    return allCenters.find((c) => c.id === clickPopover.point.id)
  }, [clickPopover, allCenters])

  const handlePointPress = useCallback((point: MapPoint) => {
    setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id })
  }, [])

  const handleMapMove = useCallback(() => {
    setClickPopover(null)
    setHoverPopover(null)
  }, [])

  if (isMobile) {
    return <MobileDiscoverFallback />
  }

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <View className="flex-row flex-1">
        {/* Map Panel */}
        <View ref={mapPanelRef} className="flex-1 relative">
          <Suspense
            fallback={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#E8862A" />
              </View>
            }
          >
            <Map
              initialCenter={userCenter?.latitude && userCenter?.longitude ? [userCenter.latitude, userCenter.longitude] : undefined}
              points={filteredPoints}
              onPointPress={handlePointPress}
              onPointHover={handlePointHover}
              onPointClick={handlePointClick}
              onMapMove={handleMapMove}
              userCenterID={user?.centerID}
              flyTo={mapFlyTo}
              autoOpenPoint={autoOpenPoint}
            />
          </Suspense>

          {/* Hover popover */}
          {hoverPopover && !clickPopover && (
            <MapPopover
              point={hoverPopover.point}
              mode="hover"
              x={hoverPopover.x}
              y={hoverPopover.y}
            />
          )}

          {/* Click popover */}
          {clickPopover && (
            <MapPopover
              point={clickPopover.point}
              mode="click"
              eventDetail={clickEventDetail}
              centerDetail={clickCenterDetail}
              x={clickPopover.x}
              y={clickPopover.y}
              onViewPress={handlePopoverView}
              onClose={() => setClickPopover(null)}
            />
          )}
        </View>

        {/* Right Panel — form, detail view, or list */}
        {formPanel ? (
          <EventFormPanel
            eventId={formPanel.id}
            onSaved={(savedId) => {
              setFormPanel(null)
              setSelectedItem({ type: 'event', id: savedId })
            }}
            onClose={() => {
              const editId = formPanel.id
              setFormPanel(null)
              if (editId) {
                setSelectedItem({ type: 'event', id: editId })
              } else {
                clearParams()
              }
            }}
          />
        ) : selectedItem ? (
          <DetailPanelWrapper
            selectedItem={selectedItem}
            onClose={() => {
              setSelectedItem(null)
              clearParams()
            }}
            onEventPress={(id) => setSelectedItem({ type: 'event', id })}
            onEditEvent={(id) => {
              setSelectedItem(null)
              setFormPanel({ id })
            }}
            onStatusChange={updateEventStatus}
          />
        ) : (
          <View
            style={{ width: rightPanelWidth }}
            className="border-l border-stone-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
          >
            {/* Panel Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 }}>
              {/* Search + Create */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  className="flex-row items-center px-3 rounded-xl bg-stone-100 dark:bg-neutral-800"
                  style={{ minHeight: 40, flex: 1 }}
                >
                  <Search size={16} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-2 text-sm font-inter text-content dark:text-content-dark outline-none"
                    placeholder="Search events and centers..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={{ paddingVertical: 8 }}
                  />
                </View>
              </View>
            </View>

            {/* Filter tabs */}
            <View style={{ paddingTop: 8, marginBottom: 12 }}>
              <UnderlineTabBar
                tabs={FILTERS.map((f) => f.label)}
                activeTab={selectedDate ? '' : activeFilter}
                onTabChange={(tab) => handleFilterPress(tab as DiscoverFilter)}
                counts={{ Events: allEvents.length, Centers: allCenters.length }}
              />
            </View>

            {/* Filter chips — Today / Center / Going (max 4) */}
            {activeFilter === 'Events' && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6, gap: 8 }}>
                <FilterChip
                  label="Today"
                  variant="outline"
                  active={selectedDate === todayStrDesktop}
                  onPress={() =>
                    setSelectedDate((prev) => (prev === todayStrDesktop ? null : todayStrDesktop))
                  }
                />
                <FilterChip
                  label={centerChipLabelDesktop}
                  variant="outline"
                  active={selectedCenterDesktop !== null}
                  onPress={() => setShowCenterModalDesktop(true)}
                />
                {user && (
                  <FilterChip
                    label="Going"
                    variant="outline"
                    active={showGoingOnly}
                    onPress={() => setShowGoingOnly((prev: boolean) => !prev)}
                  />
                )}
              </View>
            )}

            {/* Loading skeleton */}
            {loading && (
              <View style={{ paddingHorizontal: 16 }}>
                <DiscoverListSkeleton count={5} />
              </View>
            )}

            {/* List */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 12, paddingBottom: 24, gap: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {!loading && activeFilter === 'Seva' && (
                <EmptyState message="Seva — coming soon" subtitle="Service opportunities will be listed here." />
              )}
              {!loading && activeFilter !== 'Seva' && displayItems.length === 0 && (
                <EmptyState variant={selectedDate ? 'date' : searchQuery ? 'search' : 'events'} />
              )}
              {activeFilter !== 'Seva' && displayItems.map((item, idx) => {
                if (item.type === 'section') {
                  const label = item.data.label
                  const isCollapsed = collapsedSections.has(label)
                  return (
                    <Pressable key={`section-${idx}`} onPress={() => toggleSection(label)} style={{ marginTop: idx > 0 ? 16 : 0, marginBottom: 4 }}>
                      <View className="flex-row items-center gap-2 px-1">
                        <Text className="text-xs font-inter-semibold text-stone-400 dark:text-stone-500 uppercase" style={{ letterSpacing: 0.5 }}>
                          {label}
                        </Text>
                        <View className="flex-1 h-px bg-stone-200 dark:bg-neutral-700" />
                        {isCollapsed ? <ChevronDown size={14} color="#a8a29e" /> : <ChevronUp size={14} color="#a8a29e" />}
                      </View>
                    </Pressable>
                  )
                }
                if (item.type === 'event') {
                  return (
                    <EventItem
                      key={`event-${item.data.id}`}
                      event={item.data as EventDisplay}
                      centerName={allCenters.find((c) => c.id === (item.data as EventDisplay).centerId)?.name}
                      onPress={() => setSelectedItem({ type: 'event', id: item.data.id })}
                    />
                  )
                }
                const sectionLabel = displayItems.slice(0, idx).reverse().find((i) => i.type === 'section')?.data?.label
                if (sectionLabel && collapsedSections.has(sectionLabel)) return null
                return (
                  <CenterItem
                    key={`center-${item.data.id}`}
                    center={item.data as DiscoverCenter}
                    isMyCenter={!!user?.centerID && item.data.id === user.centerID}
                    onPress={() => setSelectedItem({ type: 'center', id: item.data.id })}
                  />
                )
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <FilterPickerModal
        visible={showCenterModalDesktop}
        title="Center"
        options={centerOptionsDesktop}
        selected={selectedCenterDesktop}
        onSelect={setSelectedCenterDesktop}
        onClear={() => setSelectedCenterDesktop(null)}
        onClose={() => setShowCenterModalDesktop(false)}
      />
    </View>
  )
}

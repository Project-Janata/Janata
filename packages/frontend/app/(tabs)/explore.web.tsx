// Discover tab — web desktop layout
import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from 'react'
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { Search, Building2, ChevronDown, ChevronRight, Check, Globe, Plus } from 'lucide-react-native'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import { useAnalytics } from '../../utils/analytics'
import { useTheme, useUser } from '../../components/contexts'
import { FilterChip } from '../../components/ui'
import { type FilterPickerOption } from '../../components/ui/FilterPickerModal'
const Map = lazy(() => import('../../components/map/Map'))
import MapPopover from '../../components/map/MapPopover'
import {
  useDiscoverData,
  useEventDetail,
  useCenterDetail,
  type DiscoverFilter,
} from '../../hooks/useApiData'
import EventDetailPanel from '../../components/events/EventDetailPanel.web'
import EventFormPanel from '../../components/events/EventFormPanel.web'
import CenterDetailPanel from '../../components/center/CenterDetailPanel.web'
import { useDetailColors } from '../../hooks/useDetailColors'
import GuestRsvpSheet from '../../components/events/GuestRsvpSheet'
import type { MapPoint, EventDisplay, AttendeeInfo } from '../../utils/api'
import { removeEvent } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'
import { WeekCalendar } from '../../components'
import { ADMIN_EMAIL, isLocal } from '../../utils/admin'
import { EmptyState } from '../../components/ui/EmptyState'
import { DiscoverListSkeleton } from '../../components/ui/Skeleton'
import { ExploreEventItem } from '../../components/explore/ExploreEventItem.web'
import { MobileDiscoverFallback } from '../../components/explore/MobileDiscoverFallback.web'
import {
  findCoordsForSelection,
  milesBetween,
  type ExploreSelection,
} from '../../components/explore/exploreShared'

// ─── Detail Panel Wrapper (for side panel) ──────────────

function DetailPanelWrapper({
  selectedItem,
  onClose,
  onEventPress,
  onEditEvent,
  onStatusChange,
}: {
  selectedItem: ExploreSelection
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
  const [showGuestRsvp, setShowGuestRsvp] = useState(false)

  const handleToggleRegistration = async () => {
    if (!user) {
      setShowGuestRsvp(true)
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
      <GuestRsvpSheet
        visible={showGuestRsvp}
        onClose={() => setShowGuestRsvp(false)}
        eventId={eventId}
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

// ─── Desktop Discover Screen ────────────────────────────

export default function DiscoverScreenWeb() {
  const { width } = useWindowDimensions()
  const isMobile = width < 768
  const isTablet = width >= 768 && width < 1024
  const panelWidth = isTablet ? 340 : 420

  const router = useRouter()
  const { isDark } = useTheme()
  const { user } = useUser()
  const { track } = useAnalytics()
  const isAdmin = user?.email === ADMIN_EMAIL || (user?.verificationLevel !== undefined && user.verificationLevel >= 107)
  // Beta: any signed-in user can create events. Backend enforces auth-only;
  // post-beta this becomes a coordinator-tier gate (see issue tracker).
  const canCreate = !!user
  // Events-first: the desktop sidebar always shows the events list (the old
  // Events/Centers tab model was dropped to match native explore.tsx and the
  // mobile-web fallback).
  const activeFilter: DiscoverFilter = 'Events'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showGoingOnly, setShowGoingOnly] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  // Center dropdown — picks which center's *area* to show events for, mirroring
  // the mobile fallback. "__all__" = every center (no proximity scoping); null =
  // default to the member's home center; any id = that center's area.
  const [selectedCenterDesktop, setSelectedCenterDesktop] = useState<string | null>(null)
  // The in-panel center picker opens a list inline (not a modal).
  const [centerPickerOpenDesktop, setCenterPickerOpenDesktop] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ExploreSelection | null>(
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
    useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID, { fetchAttendees: true })

  // Get user's center for map initial location
  const { center: userCenter } = useCenterDetail(user?.centerID || '')

  // The center whose area we're showing events for (mirrors MobileDiscoverFallback).
  const isAllCentersDesktop = selectedCenterDesktop === '__all__'
  const areaCenterIdDesktop = isAllCentersDesktop
    ? null
    : selectedCenterDesktop ?? user?.centerID ?? null
  const userCenterFromList = useMemo(
    () => allCenters.find((c) => c.id === user?.centerID),
    [allCenters, user?.centerID]
  )
  const areaCenterDesktop = useMemo(
    () =>
      isAllCentersDesktop
        ? undefined
        : allCenters.find((c) => c.id === areaCenterIdDesktop) ?? userCenterFromList,
    [isAllCentersDesktop, allCenters, areaCenterIdDesktop, userCenterFromList]
  )
  const isHomeAreaDesktop = !!areaCenterDesktop && areaCenterDesktop.id === user?.centerID
  // Users without a home center (or none selected) get the "All centers" view
  // so the filter still renders and they can pick a center from the picker.
  const showAllCentersDesktop = isAllCentersDesktop || !areaCenterDesktop

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

  // Open the create-event form when navigated with ?action=create (from the
  // desktop "Create Event" button). Clear the param afterward so refresh/back
  // doesn't reopen it and repeat clicks re-trigger.
  useEffect(() => {
    if (params.action === 'create') {
      setSelectedItem(null)
      setFormPanel({})
      router.setParams({ action: undefined } as never)
    }
  }, [params.action])

  // Fixed 440px width for both list and detail panels — no shift on selection
  const rightPanelWidth = 440

  const eventDates = useMemo(
    () => new Set(allEvents.filter((e) => e.date).map((e) => e.date)),
    [allEvents]
  )

  const displayItems = useMemo(() => {
    let result = items
    if (selectedDate) {
      result = result.filter(
        (item) => item.type === 'event' && (item.data as EventDisplay).date === selectedDate
      )
    }
    // An explicit center pick filters events to that center + a ~100mi radius.
    // The default / home-center case below only sorts, so the list never starts empty.
    if (areaCenterDesktop && selectedCenterDesktop && !isAllCentersDesktop && result.every((i) => i.type === 'event')) {
      result = result.filter((item) => {
        const e = item.data as EventDisplay
        return e.centerId === areaCenterDesktop.id || milesBetween(areaCenterDesktop, e) <= 100
      })
    }
    // Order events by nearness to the selected area center so "what's on around
    // <center>" surfaces first. Sorting (not filtering) keeps the list from ever
    // going empty — same approach as MobileDiscoverFallback.
    if (areaCenterDesktop && result.length > 0 && result.every((i) => i.type === 'event')) {
      result = [...result].sort(
        (a, b) =>
          milesBetween(areaCenterDesktop, a.data as EventDisplay) -
          milesBetween(areaCenterDesktop, b.data as EventDisplay)
      )
    }
    return result
  }, [items, selectedDate, areaCenterDesktop, selectedCenterDesktop, isAllCentersDesktop])

  // Map markers honor the same explicit-center radius filter as the list.
  const mapPointsDesktop = useMemo(() => {
    if (!areaCenterDesktop || !selectedCenterDesktop || isAllCentersDesktop) return filteredPoints
    return filteredPoints.filter(
      (p) => p.id === areaCenterDesktop.id || milesBetween(areaCenterDesktop, p) <= 100
    )
  }, [filteredPoints, areaCenterDesktop, selectedCenterDesktop, isAllCentersDesktop])

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
      .map((c) => ({
        value: c.id,
        label: c.name,
        sublabel: extractCityState(c.address) || c.address,
        count: counts[c.id] ?? 0,
      }))
      .sort((a, b) => {
        if (user?.centerID && a.value === user.centerID) return -1
        if (user?.centerID && b.value === user.centerID) return 1
        return a.label.localeCompare(b.label)
      })
  }, [allCenters, eventsForCountsDesktop, user?.centerID])

  // One picker row. Centers WITH events are selectable (scope the list + fly the
  // map to that area); centers WITHOUT events are non-selectable and only offer
  // the "view page" chevron — they're grouped separately below.
  const renderCenterRowDesktop = (opt: FilterPickerOption<string>) => {
    const selectable = (opt.count ?? 0) > 0
    const openPage = () => {
      track('explore_center_page_opened', { centerId: opt.value })
      setCenterPickerOpenDesktop(false)
      setSelectedItem({ type: 'center', id: opt.value })
    }
    const scopeToCenter = () => {
      track('explore_area_center_selected', { centerId: opt.value })
      setSelectedCenterDesktop(opt.value)
      setCenterPickerOpenDesktop(false)
      setSearchQuery('')
      const c = allCenters.find((cc) => cc.id === opt.value)
      if (c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude)) {
        setMapFlyTo((prev) => ({
          latitude: c.latitude as number,
          longitude: c.longitude as number,
          zoom: 10, // area view — a little more zoomed out than a single-pin focus
          key: (prev?.key ?? 0) + 1,
        }))
      }
    }
    return (
      <View key={opt.value}>
        <View className="bg-stone-200/70 dark:bg-neutral-800" style={{ height: 1, marginHorizontal: 16 }} />
        <View className="flex-row items-center px-4" style={{ minHeight: 56, gap: 8 }}>
          <Pressable
            onPress={selectable ? scopeToCenter : openPage}
            accessibilityRole="button"
            accessibilityLabel={selectable ? `Show events near ${opt.label}` : `View ${opt.label} page`}
            className="flex-1 flex-row items-center active:opacity-60"
            style={{ gap: 12, minHeight: 56 }}
          >
            <View
              className="w-10 h-10 rounded-xl items-center justify-center"
              style={{ backgroundColor: isDark ? 'rgba(232,134,42,0.18)' : '#FDE8D0' }}
            >
              <Building2 size={18} color="#E8862A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-content dark:text-content-dark font-sans" style={{ fontSize: 15 }} numberOfLines={1}>
                {opt.label}
              </Text>
              <Text className="text-stone-500 dark:text-stone-400 font-sans" style={{ fontSize: 12.5 }} numberOfLines={1}>
                {opt.sublabel}
              </Text>
            </View>
          </Pressable>
          {selectable ? (
            <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: isDark ? 'rgba(232,134,42,0.18)' : '#FDE8D0' }}>
              <Text className="font-sans" style={{ fontSize: 12, fontWeight: '600', color: '#E8862A' }}>
                {opt.count} {opt.count === 1 ? 'event' : 'events'}
              </Text>
            </View>
          ) : null}
          {opt.value === areaCenterIdDesktop ? <Check size={18} color="#E8862A" /> : null}
          {/* Distinct "view this center's page in the panel" action. */}
          <Pressable
            onPress={() => {
              track('explore_center_page_opened', { centerId: opt.value })
              setCenterPickerOpenDesktop(false)
              setSelectedItem({ type: 'center', id: opt.value })
            }}
            accessibilityRole="button"
            accessibilityLabel={`View ${opt.label} page`}
            hitSlop={6}
            className="items-center justify-center active:opacity-60"
            style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: isDark ? '#262626' : '#F3F4F6' }}
          >
            <ChevronRight size={16} color={isDark ? '#A8A29E' : '#78716C'} />
          </Pressable>
        </View>
      </View>
    )
  }

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
    track('map_point_pressed', { type: point.type, id: point.id, source: 'discover_map_popover' })
    setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id })
    setClickPopover(null)
  }, [clickPopover, track])

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
    track('map_point_pressed', { type: point.type, id: point.id, source: 'discover' })
    setSelectedItem({ type: point.type === 'center' ? 'center' : 'event', id: point.id })
  }, [track])

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
              points={mapPointsDesktop}
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
            {/* Panel Header — search + center dropdown + filter chips */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4 }}>
              {/* Search */}
              <View
                className="flex-row items-center px-3 rounded-xl bg-stone-100 dark:bg-neutral-800"
                style={{ minHeight: 40 }}
              >
                <Search size={16} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-2 text-sm font-sans text-content dark:text-content-dark outline-none"
                  placeholder={centerPickerOpenDesktop ? 'Search centers...' : 'Search events...'}
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ paddingVertical: 8 }}
                  onEndEditing={() => {
                    if (searchQuery.trim()) {
                      track('discover_search', { query: searchQuery.trim(), source: 'discover' })
                    }
                  }}
                />
              </View>

              {/* Center dropdown — picks which center's area to show events for.
                  Defaults to the member's home center; clicking opens the in-panel
                  center list so they can see what's on around any center. */}
              {!centerPickerOpenDesktop && (isAllCentersDesktop || areaCenterDesktop || allCenters.length > 0) && (
                <Pressable
                  onPress={() => {
                    track('explore_area_center_opened', { centerId: areaCenterDesktop?.id ?? 'all' })
                    setCenterPickerOpenDesktop(true)
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showAllCentersDesktop
                      ? 'Showing events from all centers. Click to change.'
                      : `Showing events near ${areaCenterDesktop?.name}. Click to change center.`
                  }
                  className="flex-row items-center px-3 rounded-2xl active:opacity-70"
                  style={{
                    marginTop: 10,
                    minHeight: 58,
                    gap: 12,
                    backgroundColor: isDark ? 'rgba(232,134,42,0.12)' : '#FFF7ED',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(232,134,42,0.22)' : '#FDE8D0',
                  }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center"
                    style={{ backgroundColor: isDark ? 'rgba(232,134,42,0.18)' : '#FDE8D0' }}
                  >
                    {showAllCentersDesktop ? <Globe size={18} color="#E8862A" /> : <Building2 size={18} color="#E8862A" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-content dark:text-content-dark font-sans" style={{ fontSize: 15 }} numberOfLines={1}>
                      {showAllCentersDesktop ? 'All centers' : areaCenterDesktop?.name}
                    </Text>
                    <Text className="text-stone-500 dark:text-stone-400 font-sans" style={{ fontSize: 12.5 }} numberOfLines={1}>
                      {showAllCentersDesktop
                        ? 'Events everywhere · click to change'
                        : isHomeAreaDesktop
                          ? `Your center${areaCenterDesktop?.memberCount ? ` · ${areaCenterDesktop.memberCount} members` : ''}`
                          : 'Events near here · click to change'}
                    </Text>
                  </View>
                  <ChevronDown size={18} color="#a8a29e" />
                </Pressable>
              )}

              {/* In-panel center picker header — title + Close. The list itself
                  renders in the ScrollView below. */}
              {centerPickerOpenDesktop && (
                <View
                  className="flex-row items-center justify-between"
                  style={{ paddingHorizontal: 4, paddingTop: 14, paddingBottom: 4 }}
                >
                  <Text className="font-sans text-stone-500 dark:text-stone-400 uppercase" style={{ fontSize: 11.5, letterSpacing: 0.9 }}>
                    Show events near
                  </Text>
                  <Pressable onPress={() => setCenterPickerOpenDesktop(false)} hitSlop={8}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: '#E8862A' }}>Close</Text>
                  </Pressable>
                </View>
              )}

              {/* Filter chips — Today / Going + Create */}
              {!centerPickerOpenDesktop && (
                <View
                  className="flex-row items-center"
                  style={{ marginTop: 10, gap: 8 }}
                >
                  <View className="flex-1 flex-row flex-wrap items-center" style={{ gap: 8 }}>
                    <FilterChip
                      label="Today"
                      variant="outline"
                      active={selectedDate === todayStrDesktop}
                      onPress={() => {
                        setSelectedDate((prev) => {
                          const next = prev === todayStrDesktop ? null : todayStrDesktop
                          if (next) track('discover_date_selected', { date: next, source: 'discover' })
                          return next
                        })
                      }}
                    />
                    {user && (
                      <FilterChip
                        label="Going"
                        variant="outline"
                        active={showGoingOnly}
                        onPress={() => {
                          track('discover_going_filter_toggled', { enabled: !showGoingOnly, source: 'discover' })
                          setShowGoingOnly((prev: boolean) => !prev)
                        }}
                      />
                    )}
                  </View>
                  {canCreate && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Create event"
                      hitSlop={8}
                      onPress={() => {
                        track('nav_create_event', { source: 'discover' })
                        setSelectedItem(null)
                        setFormPanel({})
                      }}
                      className="flex-row items-center active:opacity-70"
                      style={{
                        flexShrink: 0,
                        gap: 4,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1.5,
                        borderColor: '#E8862A',
                      }}
                    >
                      <Plus size={16} color="#E8862A" strokeWidth={2.5} />
                      <Text style={{ fontWeight: '600', fontSize: 13, lineHeight: 18, color: '#E8862A' }}>
                        Create
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

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
              {/* In-panel center picker — "Show events near <center>". */}
              {centerPickerOpenDesktop && (
                <>
                  {/* All centers — show events from every center, no area scoping. */}
                  <Pressable
                    onPress={() => {
                      track('explore_area_all_selected')
                      setSelectedCenterDesktop('__all__')
                      setCenterPickerOpenDesktop(false)
                      setSearchQuery('')
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Show events from all centers"
                    className="flex-row items-center px-4 active:opacity-60"
                    style={{ minHeight: 56, gap: 12 }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: isDark ? 'rgba(232,134,42,0.18)' : '#FDE8D0' }}
                    >
                      <Globe size={18} color="#E8862A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text className="text-content dark:text-content-dark font-sans" style={{ fontSize: 15 }} numberOfLines={1}>
                        All centers
                      </Text>
                      <Text className="text-stone-500 dark:text-stone-400 font-sans" style={{ fontSize: 12.5 }} numberOfLines={1}>
                        Events from every center
                      </Text>
                    </View>
                    {isAllCentersDesktop ? <Check size={18} color="#E8862A" /> : null}
                  </Pressable>

                  {(() => {
                    const q = searchQuery.trim().toLowerCase()
                    const matches = q
                      ? centerOptionsDesktop.filter((o) => o.label.toLowerCase().includes(q) || (o.sublabel ?? '').toLowerCase().includes(q))
                      : centerOptionsDesktop
                    const withEvents = matches.filter((o) => (o.count ?? 0) > 0)
                    const withoutEvents = matches.filter((o) => (o.count ?? 0) === 0)
                    return (
                      <>
                        {withEvents.length > 0 && (
                          <Text className="font-sans text-stone-400 dark:text-stone-500 uppercase px-4 pt-3 pb-1" style={{ fontSize: 11, letterSpacing: 0.8 }}>
                            Centers with events
                          </Text>
                        )}
                        {withEvents.map(renderCenterRowDesktop)}
                        {withoutEvents.length > 0 && (
                          <Text className="font-sans text-stone-400 dark:text-stone-500 uppercase px-4 pt-5 pb-1" style={{ fontSize: 11, letterSpacing: 0.8 }}>
                            Other centers
                          </Text>
                        )}
                        {withoutEvents.map(renderCenterRowDesktop)}
                      </>
                    )
                  })()}
                </>
              )}

              {!centerPickerOpenDesktop && !loading && displayItems.length === 0 && (
                <EmptyState variant={selectedDate ? 'date' : searchQuery ? 'search' : 'events'} />
              )}

              {!centerPickerOpenDesktop && displayItems.map((item) => {
                if (item.type !== 'event') return null
                return (
                  <ExploreEventItem
                    key={`event-${item.data.id}`}
                    event={item.data as EventDisplay}
                    centerName={allCenters.find((c) => c.id === (item.data as EventDisplay).centerId)?.name}
                    onPress={() => {
                      track('event_list_item_pressed', { eventId: item.data.id, source: 'discover' })
                      setSelectedItem({ type: 'event', id: item.data.id })
                    }}
                  />
                )
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  )
}

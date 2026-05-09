// Discover tab — mobile / native layout
import React, { useState, Suspense, useRef, useCallback, useMemo } from 'react'
import { EmptyState } from '../../components/ui/EmptyState'
import { DiscoverListSkeleton } from '../../components/ui/Skeleton'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Animated,
  PanResponder,
  StyleSheet,
  Image,
} from 'react-native'
import {
  MapPin,
  Search,
  Building2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native'
import { useRouter, useFocusEffect, useNavigation } from 'expo-router'
import { usePostHog } from 'posthog-react-native'
import { useTheme } from '../../components/contexts'
import { Badge, UnderlineTabBar, Avatar, FilterChip } from '../../components/ui'
import FilterPickerModal, { type FilterPickerOption } from '../../components/ui/FilterPickerModal'
import { useUser } from '../../components/contexts/UserContext'
import { useDiscoverData, type DiscoverFilter } from '../../hooks/useApiData'
import type { EventDisplay, DiscoverCenter, AttendeeInfo } from '../../utils/api'
import { extractCityState } from '../../utils/addressParsing'


// Lazy load Map to avoid loading heavy web dependencies on mobile web
const Map = React.lazy(() => import('../../components/Map'))

const FILTERS: { label: DiscoverFilter }[] = [
  { label: 'Events' },
  { label: 'Centers' },
  { label: 'Seva' },
]

/**
 * Format a date string into a short display like "FEB 26"
 */
function formatDatePill(dateStr: string): { month: string; day: string } {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return { month: '', day: '' }
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const day = String(d.getDate())
  return { month, day }
}

function isToday(dateStr: string): boolean {
  const today = new Date()
  return dateStr === today.toISOString().split('T')[0]
}

// ── Placeholder avatar dots for attendee count ──────────

const AVATAR_COLORS = ['#E8862A', '#78716C', '#A8A29E', '#D6D3D1']

function AttendeeAvatars({ count, attendees }: { count: number; attendees?: AttendeeInfo[] }) {
  if (count <= 0) return null
  const shown = Math.min(count, 4)

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <View style={{ flexDirection: 'row' }}>
        {attendees && attendees.length > 0 ? (
          attendees.slice(0, shown).map((attendee, i) => (
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
        ) : (
          Array.from({ length: shown }).map((_, i) => (
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
          ))
        )}
      </View>
      <Text className="text-stone-400 dark:text-stone-500 font-inter text-xs">
        {count} going
      </Text>
    </View>
  )
}

// ─── Event Item ─────────────────────────────────────────

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
  const todayLabel = event.date ? isToday(event.date) : false

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-3 p-3 rounded-2xl active:opacity-70 ${
        event.isRegistered
          ? 'bg-orange-50 dark:bg-orange-950/20'
          : 'bg-white dark:bg-neutral-900'
      }`}
    >
      {/* Date pill */}
      <View className="w-12 h-14 rounded-xl items-center justify-center bg-stone-100 dark:bg-neutral-800">
        <Text className="text-[10px] font-inter-semibold" style={{ color: '#E8862A' }}>
          {month}
        </Text>
        <Text className="text-base font-inter-bold text-content dark:text-content-dark">
          {day}
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1" numberOfLines={2}>
            {event.title}
          </Text>
          {event.isRegistered && <Badge label="Going" variant="going" />}
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm">
          {todayLabel ? 'Today · ' : ''}{event.time || ''}
        </Text>
        {centerName && (
          <Text className="text-stone-500 dark:text-stone-400 font-inter text-xs" numberOfLines={1}>
            By {centerName}
          </Text>
        )}
        <View className="flex-row items-center gap-1 mt-0.5">
          <MapPin size={12} color="#E8862A" />
          <Text className="text-stone-500 dark:text-stone-400 font-inter text-xs flex-1" numberOfLines={1}>
            {event.location}
          </Text>
        </View>
        {event.attendees > 0 && <AttendeeAvatars count={event.attendees} attendees={event.attendeesList} />}
      </View>

      {/* Hero thumbnail */}
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

// ─── Center Item ────────────────────────────────────────

function CenterItem({ center, onPress, isMyCenter }: { center: DiscoverCenter; onPress: () => void; isMyCenter?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row gap-3 p-3 rounded-2xl active:opacity-70 ${
        center.isMember || isMyCenter
          ? 'bg-orange-50 dark:bg-orange-950/20'
          : 'bg-white dark:bg-neutral-900'
      }`}
    >
      {/* Icon pill */}
      <View className="w-12 h-14 rounded-xl bg-orange-100 dark:bg-orange-900/30 items-center justify-center overflow-hidden">
        {center.image ? (
          <Image source={{ uri: center.image }} style={{ width: 48, height: 56 }} resizeMode="cover" />
        ) : (
          <Building2 size={20} color="#9A3412" />
        )}
      </View>

      {/* Content */}
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center gap-1.5">
          <Text className="text-content dark:text-content-dark font-inter-semibold text-base leading-tight flex-1" numberOfLines={1}>
            {center.name}
          </Text>
          {isMyCenter && <Badge label="My Center" variant="going" />}
          {!isMyCenter && center.isMember && <Badge label="Member" variant="member" />}
        </View>
        <Text className="text-stone-500 dark:text-stone-400 font-inter text-sm">
          {extractCityState(center.address) || 'Center'}{center.distanceMi != null ? ` · ${center.distanceMi} mi` : ''}
        </Text>
        {center.eventCount != null && center.eventCount > 0 && (
          <Text className="text-primary font-inter text-xs mt-0.5">
            {center.eventCount} events this week
          </Text>
        )}
      </View>
    </Pressable>
  )
}

// ─── Discover Screen ────────────────────────────────────

export default function DiscoverScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const posthog = usePostHog()
  const [activeFilter, setActiveFilter] = useState<DiscoverFilter>('Events')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showGoingOnly, setShowGoingOnly] = useState(false)
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null)
  const [showCenterModal, setShowCenterModal] = useState(false)
    const { user } = useUser()
    const {
    items,
    filteredPoints,
    loading,
    allEvents,
    allCenters,
    refresh,
  } = useDiscoverData(activeFilter, searchQuery, user?.id, showPastEvents, showGoingOnly, user?.interests ?? undefined, user?.centerID)

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  // ── Sheet snap points ──────────────────────────────────
  // Four positions (as translateY values from the expanded state):
  //   expanded  = 0           → 100% sheet visible (full screen, header hidden)
  //   mid       = sheet * 0.2 → ~80% sheet visible (most content, map peeking)
  //   collapsed = sheet * 0.6 → ~40% sheet visible (peek + a few rows)
  //   peek      = sheet - 100 → just handle + search bar visible (100px)

  const EXPANDED_TOP = 60 // px from top of container when fully expanded

  const [containerHeight, setContainerHeight] = useState(0)
  const sheetHeight = containerHeight - EXPANDED_TOP // total sheet height

  const SNAP_EXPANDED = 0
  const SNAP_MID = Math.max(0, sheetHeight * 0.2)        // ~80% sheet visible
  const SNAP_COLLAPSED = Math.max(0, sheetHeight * 0.6)  // ~40% sheet visible
  const SNAP_PEEK = Math.max(0, sheetHeight - 100)       // 100px sheet visible (handle + search)

  const snapsRef = useRef({ expanded: SNAP_EXPANDED, mid: SNAP_MID, collapsed: SNAP_COLLAPSED, peek: SNAP_PEEK })
  snapsRef.current = { expanded: SNAP_EXPANDED, mid: SNAP_MID, collapsed: SNAP_COLLAPSED, peek: SNAP_PEEK }

  const sheetY = useRef(new Animated.Value(0)).current
  const offsetRef = useRef(0)
  const initializedRef = useRef(false)

  // Track expansion state for scroll behavior
  const [isSheetExpanded, setIsSheetExpanded] = useState(false)

  // Hide the nav header (with the profile-pic button) when the sheet is at
  // expanded snap so the sheet covers the full screen, including over where
  // the profile button sits. Restore when sheet leaves expanded.
  const navigation = useNavigation()
  React.useEffect(() => {
    navigation.setOptions({ headerShown: !isSheetExpanded })
  }, [navigation, isSheetExpanded])

  // Set initial sheet position to mid once we know the container height
  React.useEffect(() => {
    if (containerHeight > 0 && !initializedRef.current) {
      const mid = Math.max(0, (containerHeight - EXPANDED_TOP) * 0.2)
      sheetY.setValue(mid)
      offsetRef.current = mid
      initializedRef.current = true
    }
  }, [containerHeight, sheetY])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8,
      onPanResponderGrant: () => {},
      onPanResponderMove: (_, gs) => {
        const max = snapsRef.current.peek
        const next = Math.max(0, Math.min(max, offsetRef.current + gs.dy))
        sheetY.setValue(next)
      },
      onPanResponderRelease: (_, gs) => {
        const { expanded, mid, collapsed, peek } = snapsRef.current
        const current = Math.max(0, Math.min(peek, offsetRef.current + gs.dy))

        // Find nearest snap, biased by velocity
        let snapTo: number
        if (gs.vy > 1) {
          // Fast swipe down — jump one stop down from current
          if (offsetRef.current <= expanded + 10) snapTo = mid
          else if (offsetRef.current <= mid + 10) snapTo = collapsed
          else snapTo = peek
        } else if (gs.vy < -1) {
          // Fast swipe up — jump one stop up from current
          if (offsetRef.current >= peek - 10) snapTo = collapsed
          else if (offsetRef.current >= collapsed - 10) snapTo = mid
          else snapTo = expanded
        } else {
          // Position-based: snap to nearest of 4
          const dExp = Math.abs(current - expanded)
          const dMid = Math.abs(current - mid)
          const dCol = Math.abs(current - collapsed)
          const dPeek = Math.abs(current - peek)
          const minD = Math.min(dExp, dMid, dCol, dPeek)
          snapTo =
            minD === dExp ? expanded : minD === dMid ? mid : minD === dCol ? collapsed : peek
        }

        offsetRef.current = snapTo
        setIsSheetExpanded(snapTo === expanded)
        Animated.spring(sheetY, {
          toValue: snapTo,
          useNativeDriver: false,
          damping: 28,
          stiffness: 220,
          mass: 0.8,
        }).start()
      },
    })
  ).current

  // ── Data ──────────────────────────────────────────────
  const displayItems = React.useMemo(() => {
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

  // Filter chip helpers — counts over upcoming events
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

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const toggleSection = useCallback((label: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  // Default Centers list to fully collapsed on first visit (90+ centers,
  // an all-expanded view is overwhelming).
  const collapsedInitFor = useRef<DiscoverFilter | null>(null)
  React.useEffect(() => {
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

  const handleFilterPress = (f: DiscoverFilter) => {
    posthog?.capture('discover_filter_changed', { filter: f })
    setActiveFilter(f)
    setSelectedDate(null)
  }

  const handlePointPress = (point: { id: string; type: 'center' | 'event' }) => {
    posthog?.capture('map_point_pressed', { type: point.type, id: point.id })
    if (point.type === 'center') {
      router.push(`/center/${point.id}`)
    } else {
      router.push(`/events/${point.id}`)
    }
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {/* Map — full bleed behind the sheet */}
      <View style={StyleSheet.absoluteFill}>
        <Suspense
          fallback={
            <View className="flex-1 justify-center items-center bg-stone-100 dark:bg-neutral-800">
              <ActivityIndicator size="large" color="#9A3412" />
            </View>
          }
        >
          <Map points={filteredPoints} onPointPress={handlePointPress} userCenterID={user?.centerID} bottomPadding={90} />
        </Suspense>
      </View>

      {/* Bottom Sheet — hidden until we measure the container */}
      {containerHeight > 0 && (
      <Animated.View
        style={[
          styles.sheet,
          { top: EXPANDED_TOP, transform: [{ translateY: sheetY }] },
        ]}
      >
        <View
          style={[
            styles.sheetInner,
            {
              backgroundColor: isDark ? '#171717' : '#fff',
              borderTopColor: isDark ? '#262626' : '#E5E7EB',
            },
          ]}
        >
          {/* ─── Draggable Header Zone ─── */}
          <View {...panResponder.panHandlers}>
            {/* Drag Handle */}
            <View style={styles.handleRow}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? '#525252' : '#D1D5DB' },
                ]}
              />
            </View>

            {/* Search Input */}
            <View
              className="flex-row items-center mx-4 mb-3 px-3 rounded-xl"
              style={{
                minHeight: 44,
                backgroundColor: isDark ? '#262626' : '#F3F4F6',
              }}
            >
              <Search size={16} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-sm font-inter"
                style={{ color: isDark ? '#E5E7EB' : '#1F2937', paddingVertical: 8 }}
                placeholder="Search events and centers..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onEndEditing={() => {
                  if (searchQuery.trim()) {
                    posthog?.capture('discover_search', { query: searchQuery.trim() })
                  }
                }}
              />
            </View>

            {/* Filter tabs — underline style */}
            <View style={{ marginBottom: 4 }}>
              <UnderlineTabBar
                tabs={FILTERS.map((f) => f.label)}
                activeTab={selectedDate ? '' : activeFilter}
                onTabChange={(tab) => handleFilterPress(tab as DiscoverFilter)}
                counts={{ Events: allEvents.length, Centers: allCenters.length }}
              />
            </View>

            {/* Filter chips — Today / Center / Going (max 4) */}
            {activeFilter === 'Events' && (
              <View className="flex-row flex-wrap items-center px-4 py-2 gap-2">
                <FilterChip
                  label="Today"
                  variant="outline"
                  active={selectedDate === todayStr}
                  onPress={() => {
                    setSelectedDate((prev) => {
                      const next = prev === todayStr ? null : todayStr
                      if (next) posthog?.capture('discover_date_selected', { date: next })
                      return next
                    })
                  }}
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
                    onPress={() => setShowGoingOnly((prev) => !prev)}
                  />
                )}
              </View>
            )}
          </View>

          {/* Loading skeleton */}
          {loading && (
            <View style={{ paddingHorizontal: 16 }}>
              <DiscoverListSkeleton count={4} />
            </View>
          )}

          {/* Unified List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 4, paddingTop: 12, paddingBottom: 40, gap: 4 }}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            stickyHeaderIndices={stickyHeaderIndices}
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
                      {isCollapsed ? <ChevronDown size={16} color="#a8a29e" /> : <ChevronUp size={16} color="#a8a29e" />}
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
                    onPress={() => {
                      posthog?.capture('event_list_item_pressed', { eventId: item.data.id, source: 'discover' })
                      router.push(`/events/${item.data.id}`)
                    }}
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
                  onPress={() => {
                    posthog?.capture('center_list_item_pressed', { centerId: item.data.id, source: 'discover' })
                    router.push(`/center/${item.data.id}`)
                  }}
                />
              )
            })}
          </ScrollView>
        </View>
      </Animated.View>
      )}

      <FilterPickerModal
        visible={showCenterModal}
        title="Center"
        options={centerOptions}
        selected={selectedCenter}
        onSelect={setSelectedCenter}
        onClear={() => setSelectedCenter(null)}
        onClose={() => setShowCenterModal(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // top is set dynamically via style prop
  },
  sheetInner: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
    // Shadow for visibility over the map
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 16,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
})

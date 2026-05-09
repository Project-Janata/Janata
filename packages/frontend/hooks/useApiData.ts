import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { API_BASE_URL } from '../src/config/api'
import {
  fetchCenters,
  fetchCenter,
  fetchEvent,
  fetchEventsByCenter,
  fetchAllEvents,
  fetchEventUsers,
  attendEvent,
  unattendEvent,
  getUserEvents,
  centersToMapPoints,
  eventsToMapPoints,
  centersToDiscoverCenters,
  MapPoint,
  CenterData,
  EventData,
  EventDisplay,
  DiscoverCenter,
  DiscoverItem,
  DiscoverFilter,
  DISCOVER_SAMPLE_EVENTS,
  DISCOVER_SAMPLE_CENTERS,
  AttendeeInfo,
} from '../utils/api'
import { extractCountryAndState } from '../utils/addressParsing'

export type { DiscoverFilter }
export type { EventDisplay } from '../utils/api'

// ── Simple cache (module-level, persists across mounts) ──────────────

const CACHE_TTL = 60_000 // 60 seconds

type CacheEntry<T> = { data: T; ts: number }

const cache = new Map<string, CacheEntry<any>>()
const inflight = new Map<string, Promise<any>>()

function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function cacheSet<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() })
}

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheGet<T>(key)
  if (cached !== null) return cached

  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = fetcher().then(
    (data) => {
      cacheSet(key, data)
      inflight.delete(key)
      return data
    },
    (err) => {
      inflight.delete(key)
      throw err
    }
  )
  inflight.set(key, promise)
  return promise
}

// ── Sample data (empty since we fetch from API) ────────────

const SAMPLE_CENTERS: MapPoint[] = []

const SAMPLE_EVENTS: MapPoint[] = []

const SAMPLE_EVENT_LIST: EventDisplay[] = []

const SAMPLE_ATTENDEES: { name: string; subtitle: string; image: string }[] = []

const SAMPLE_MESSAGES: { author: string; timestamp: string; text: string; image: string }[] = []

// ── Helper: transform API EventData into EventDisplay ──────────────────

function apiEventToDisplay(e: EventData, _username?: string): EventDisplay {
  const parseDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? null : d
  }
  const parsedDate = parseDate(e.date)
  const dateStr = parsedDate ? parsedDate.toISOString().split('T')[0] : ''
  const timeStr = parsedDate
    ? parsedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : ''

  const display: EventDisplay = {
    id: e.eventID,
    title: e.title || e.description || 'Event',
    date: dateStr,
    time: timeStr,
    location: e.address || 'TBD',
    address: e.address ?? undefined,
    latitude: e.latitude,
    longitude: e.longitude,
    attendees: e.peopleAttending || 0,
    attendeesList: (e as any).attendeesList,
    likes: 0,
    comments: 0,
    description: e.description || undefined,
    pointOfContact: e.pointOfContact ?? undefined,
    image: e.image ?? undefined,
    isRegistered: false, // Determined per-user at call site if needed
    centerId: e.centerID ?? undefined,
    createdBy: e.createdBy ?? undefined,
    category: e.category,
    externalUrl: e.externalUrl ?? null,
    signupUrl: e.signupUrl ?? null,
    allowJanataSignup: e.allowJanataSignup ?? false,
  }

  // If we have an image URL for the event, ensure it's absolute
  if (display.image && display.image.startsWith('/')) {
    display.image = `${API_BASE_URL}${display.image}`
  }

  return display
}

// ── Helper: fetch all events across centers in parallel ────────────────

async function fetchAllEventsFromCenters(centers: CenterData[]): Promise<EventData[]> {
  const results = await Promise.all(
    centers.map((c) => fetchEventsByCenter(c.centerID).catch(() => [] as EventData[]))
  )
  return results.flat()
}

// ── Hooks ──────────────────────────────────────────────────────────────

export function useMapPoints() {
  const [points, setPoints] = useState<MapPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setError(null)
        const centers = await fetchCenters()
        if (!mounted) return

        const centerPoints = centersToMapPoints(centers)

        if (centerPoints.length > 0) {
          const allEvents = await fetchAllEvents()
          if (!mounted) return

          const eventPoints = eventsToMapPoints(allEvents)
          setPoints([...centerPoints, ...eventPoints])
          setIsLive(true)
        }
      } catch (err: any) {
        if (mounted) {
          const message = err?.message || 'Failed to load map data'
          setError(message)
          if (__DEV__) console.warn('[useMapPoints]', message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { points, loading, isLive, error }
}

export function useEventList() {
  const [events, setEvents] = useState<EventDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setError(null)
        const centers = await fetchCenters()
        if (!mounted) return

        const allApiEvents = await fetchAllEvents()
        if (!mounted) return

        const allEvents = allApiEvents.map((e) => apiEventToDisplay(e))

        if (allEvents.length > 0) {
          // Sort: registered first, then by date
          allEvents.sort((a, b) => {
            if (a.isRegistered !== b.isRegistered) return a.isRegistered ? -1 : 1
            return a.date.localeCompare(b.date)
          })
          setEvents(allEvents)
          setIsLive(true)
        }
      } catch (err: any) {
        if (mounted) {
          const message = err?.message || 'Failed to load events'
          setError(message)
          if (__DEV__) console.warn('[useEventList]', message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return { events, loading, isLive, error }
}

export function useEventDetail(eventId: string, username?: string, userId?: string) {
  const [event, setEvent] = useState<EventDisplay | null>(null)
  const [attendees, setAttendees] = useState<
    { name: string; subtitle: string; image?: string; initials: string }[]
  >([])
  const [messages, setMessages] = useState<
    { author: string; timestamp: string; text: string; image: string }[]
  >([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [isCreator, setIsCreator] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        setError(null)
        const apiEvent = await fetchEvent(eventId)
        if (!mounted) return

        if (apiEvent) {
          // Check if user is the creator
          const userIsCreator = !!(userId && apiEvent.createdBy === userId)

          const display = apiEventToDisplay(apiEvent)
          setEvent(display)
          setIsCreator(userIsCreator)
          setIsLive(true)

          // Fetch attendees and check if current user is registered
          const users = await fetchEventUsers(eventId)
          if (mounted) {
            setAttendees(
              users.map((u) => ({
                name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
                subtitle: '',
                image: u.profileImage ?? undefined,
                initials: u.firstName
                  ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                  : u.username.slice(0, 2).toUpperCase(),
              }))
            )
            // Check if current user is in attendees list
            const userIsRegistered = userId ? users.some((u) => u.id === userId) : false
            setIsRegistered(userIsRegistered)
            setEvent((prev) => (prev ? { ...prev, isRegistered: userIsRegistered } : null))
          }
        }
      } catch (err: any) {
        if (mounted) {
          const message = err?.message || 'Failed to load event details'
          setError(message)
          if (__DEV__) console.warn('[useEventDetail]', message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [eventId, userId])

  const toggleRegistration = useCallback(
    async (_username: string) => {
      if (!event) return
      setIsToggling(true)

      try {
        // Check current registration status directly from API
        const users = await fetchEventUsers(eventId)
        const currentUserInAttendees = users.some((u) => u.id === userId)

        if (currentUserInAttendees) {
          // Already registered - unattend
          await unattendEvent(eventId)
          setIsRegistered(false)
          // Re-fetch attendees after unregistering
          const updatedUsers = await fetchEventUsers(eventId)
          const newAttendeesList = updatedUsers.map((u) => ({
            name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
            image: u.profileImage || undefined,
            initials: u.firstName
              ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
              : u.username.slice(0, 2).toUpperCase(),
          }))
          setEvent((prev) =>
            prev
              ? {
                  ...prev,
                  isRegistered: false,
                  attendees: updatedUsers.length,
                  attendeesList: newAttendeesList.slice(0, 4),
                }
              : null
          )
          // Also update attendees state
          setAttendees(
            updatedUsers.map((u) => ({
              name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
              subtitle: '',
              image: u.profileImage ?? undefined,
              initials: u.firstName
                ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                : u.username.slice(0, 2).toUpperCase(),
            }))
          )
        } else {
          // Not registered - attend
          await attendEvent(eventId)
          setIsRegistered(true)
          // Re-fetch attendees after registering
          const updatedUsers = await fetchEventUsers(eventId)
          const newAttendeesList = updatedUsers.map((u) => ({
            name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
            image: u.profileImage || undefined,
            initials: u.firstName
              ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
              : u.username.slice(0, 2).toUpperCase(),
          }))
          setEvent((prev) =>
            prev
              ? {
                  ...prev,
                  isRegistered: true,
                  attendees: updatedUsers.length,
                  attendeesList: newAttendeesList.slice(0, 4),
                }
              : null
          )
          // Also update attendees state
          setAttendees(
            updatedUsers.map((u) => ({
              name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
              subtitle: '',
              image: u.profileImage ?? undefined,
              initials: u.firstName
                ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                : u.username.slice(0, 2).toUpperCase(),
            }))
          )
        }
      } catch (error: any) {
        // If error says already registered, update UI
        if (error?.message?.includes('Already registered')) {
          setIsRegistered(true)
          setEvent((prev) => (prev ? { ...prev, isRegistered: true } : null))
        }
        throw error
      } finally {
        setIsToggling(false)
      }
    },
    [event, eventId, userId]
  )

  return {
    event,
    attendees,
    messages,
    loading,
    isLive,
    toggleRegistration,
    isToggling,
    isCreator,
    error,
  }
}

export function useWeekCalendar() {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Sunday
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d.getDate()
  })
  const today = now.getDate()

  return { weekDays, weekDates, today }
}

// ── Center detail data ──────────────────────────────────────────────────

export interface CenterDisplay {
  id: string
  name: string
  image: string
  address: string
  website: string
  phone: string
  upcomingEvents: number
  pointOfContact: string
  acharya: string
  latitude?: number
  longitude?: number
  memberCount: number
  isVerified: boolean
}

const SAMPLE_CENTER_DETAILS: Record<string, CenterDisplay> = {}

const SAMPLE_CENTER_EVENTS: EventDisplay[] = []

export function useCenterDetail(centerId: string) {
  const [center, setCenter] = useState<CenterDisplay | null>(null)
  const [events, setEvents] = useState<EventDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!centerId) {
      setCenter(null)
      setEvents([])
      setLoading(false)
      return
    }

    let mounted = true

    const load = async () => {
      try {
        setError(null)
        const [apiCenter, apiEvents] = await Promise.all([
          fetchCenter(centerId),
          fetchEventsByCenter(centerId),
        ])
        if (!mounted) return

        if (apiCenter) {
          setCenter({
            id: centerId,
            name: apiCenter.name || 'Unknown Center',
            image: apiCenter.image || '',
            address: apiCenter.address || '',
            website: apiCenter.website || '',
            phone: apiCenter.phone || '',
            upcomingEvents: apiEvents.length,
            pointOfContact: apiCenter.pointOfContact || '',
            acharya: apiCenter.acharya || '',
            latitude: apiCenter.latitude,
            longitude: apiCenter.longitude,
            memberCount: apiCenter.memberCount ?? 0,
            isVerified: apiCenter.isVerified ?? false,
          })
          setIsLive(true)
        }

        if (apiEvents.length > 0) {
          setEvents(apiEvents.map((e) => apiEventToDisplay(e)))
        }
      } catch (err: any) {
        if (mounted) {
          const message = err?.message || 'Failed to load center details'
          setError(message)
          if (__DEV__) console.warn('[useCenterDetail]', message)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [centerId])

  return { center, events, loading, isLive, error }
}

// ── My Events hook ──────────────────────────────────────────────────

export function useMyEvents(username: string | undefined) {
  const [events, setEvents] = useState<EventDisplay[]>([])
  const [loading, setLoading] = useState(!!username)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!username) {
      setLoading(false)
      return
    }
    const key = `myEvents:${username}`

    try {
      setError(null)
      const apiEvents = await cachedFetch(key, () => getUserEvents(username))

      if (apiEvents.length > 0) {
        setEvents(
          apiEvents.map((e) => ({
            ...apiEventToDisplay(e, username),
            isRegistered: true,
          }))
        )
        setIsLive(true)
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load your events'
      setError(message)
      if (__DEV__) console.warn('[useMyEvents]', message)
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    load()
  }, [load])

  return { events, loading, isLive, error, refetch: load }
}

// ── Discover hooks ──────────────────────────────────────────────────

export function useCenterList() {
  const [centers, setCenters] = useState<DiscoverCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    cachedFetch('centers', fetchCenters)
      .then((apiCenters) => {
        if (!mounted) return
        const discoverCenters = centersToDiscoverCenters(apiCenters)
        if (discoverCenters.length > 0) {
          setCenters(discoverCenters)
          setIsLive(true)
        }
      })
      .catch((err: any) => {
        if (mounted) {
          const message = err?.message || 'Failed to load centers'
          setError(message)
          if (__DEV__) console.warn('[useCenterList]', message)
        }
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  return { centers, loading, isLive, error }
}

// Maps event category IDs to user interest strings
const CATEGORY_TO_INTEREST: Record<number, string> = {
  91: 'Satsangs',
  92: 'Bhiksha',
}

// ── Center grouping helpers ──────────────────────────────────
// extractCountryAndState: ../utils/addressParsing (US ST-ZIP, Canada vs CA ambiguity)

function groupCenterItems(centers: DiscoverCenter[], userCenterID?: string | null): DiscoverItem[] {
  const groups = new Map<string, DiscoverCenter[]>()

  for (const center of centers) {
    const { country, state } = extractCountryAndState(center.address)
    // Single key: "State" for US, "State, Country" for international, "Other" for unknown
    let key: string
    if (country === 'Other' || state === 'Unknown') {
      key = 'Other'
    } else if (country === 'United States') {
      key = state
    } else {
      key = `${state}, ${country}`
    }
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(center)
  }

  // Find which group the user's center belongs to
  let userGroupKey: string | null = null
  if (userCenterID) {
    const userCenter = centers.find((c) => c.id === userCenterID)
    if (userCenter) {
      const { country, state } = extractCountryAndState(userCenter.address)
      if (country === 'Other' || state === 'Unknown') {
        userGroupKey = 'Other'
      } else if (country === 'United States') {
        userGroupKey = state
      } else {
        userGroupKey = `${state}, ${country}`
      }
    }
  }

  // Sort: user's group first, then US states alphabetically, then international
  // (keys containing a comma, e.g. "Alberta, Canada"), then "Other" last.
  const sortedKeys = [...groups.keys()].sort((a, b) => {
    if (userGroupKey) {
      if (a === userGroupKey) return -1
      if (b === userGroupKey) return 1
    }
    if (a === 'Other') return 1
    if (b === 'Other') return -1
    const aIntl = a.includes(',')
    const bIntl = b.includes(',')
    if (aIntl !== bIntl) return aIntl ? 1 : -1
    return a.localeCompare(b)
  })

  const result: DiscoverItem[] = []
  for (const key of sortedKeys) {
    const sectionCenters = groups.get(key)!
    sectionCenters.sort((a, b) => {
      if (userCenterID) {
        if (a.id === userCenterID) return -1
        if (b.id === userCenterID) return 1
      }
      return a.name.localeCompare(b.name)
    })
    result.push({ type: 'section', data: { label: key } })
    for (const c of sectionCenters) {
      result.push({ type: 'center', data: c })
    }
  }

  return result
}

type UseDiscoverOptions = {
  fetchAttendees?: boolean
}

export function useDiscoverData(
  filter: DiscoverFilter,
  searchQuery: string,
  userId?: string,
  showPastEvents = false,
  showGoingOnly = false,
  userInterests?: string[],
  userCenterID?: string | null,
  options?: UseDiscoverOptions,
) {
  const fetchAttendees = options?.fetchAttendees ?? false
  const [allEvents, setAllEvents] = useState<EventDisplay[]>([])
  const [allCenters, setAllCenters] = useState<DiscoverCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    // Note: We don't set loading(true) here to avoid jarring UI flickers on focus
    try {
      const apiCenters = await cachedFetch('centers', fetchCenters)
      const discoverCenters = centersToDiscoverCenters(apiCenters)
      if (discoverCenters.length > 0) {
        setAllCenters(discoverCenters)
      }

      const allApiEvents = await cachedFetch('allEvents', fetchAllEvents)

      let fetchedEvents: EventDisplay[]

      if (fetchAttendees) {
        const eventsWithAttendees = await Promise.all(
          allApiEvents.map(async (e) => {
            const users = await fetchEventUsers(e.eventID)
            const attendeesList = users.map((u) => ({
              name: u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : u.username,
              image: u.profileImage || undefined,
              initials: u.firstName
                ? `${u.firstName[0]}${u.lastName?.[0] || ''}`.toUpperCase()
                : u.username.slice(0, 2).toUpperCase(),
            }))
            const userIsRegistered = userId ? users.some((u) => u.id === userId) : false
            return {
              ...e,
              attendeesList: attendeesList.slice(0, 4),
              isRegistered: userIsRegistered,
              peopleAttending: users.length,
            }
          })
        )

        fetchedEvents = eventsWithAttendees.map((e) => {
          const display = apiEventToDisplay(e)
          display.attendeesList = e.attendeesList
          display.isRegistered = e.isRegistered
          display.attendees = e.peopleAttending
          return display
        })
      } else {
        fetchedEvents = allApiEvents.map((e) => apiEventToDisplay(e))
      }

      if (fetchedEvents.length > 0) {
        setAllEvents(fetchedEvents)
        setIsLive(true)
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to refresh discover data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [userId, fetchAttendees])

  useEffect(() => {
    refresh()
  }, [refresh])

  const items = useMemo<DiscoverItem[]>(() => {
    const query = searchQuery.toLowerCase().trim()
    const todayStr = new Date().toISOString().split('T')[0]

    // Filter out past events unless showPastEvents is enabled
    const visibleEvents = showPastEvents
      ? allEvents
      : allEvents.filter((e) => !e.date || e.date >= todayStr)

    // Filter events by user interests if set
    const filteredEvents = userInterests && userInterests.length > 0
      ? visibleEvents.filter((e) => {
          if (e.category == null) return true
          const interestName = CATEGORY_TO_INTEREST[e.category]
          return !interestName || userInterests.includes(interestName)
        })
      : visibleEvents

    let result: DiscoverItem[] = []

    if (filter === 'Centers') {
      result = groupCenterItems(allCenters, userCenterID)
    } else {
      const eventsToShow = showGoingOnly
        ? filteredEvents.filter((e) => e.isRegistered)
        : filteredEvents
      const sortByDate = (a: EventDisplay, b: EventDisplay) =>
        b.date.localeCompare(a.date)
      const registered = eventsToShow.filter((e) => e.isRegistered).sort(sortByDate)
      const unregistered = eventsToShow.filter((e) => !e.isRegistered).sort(sortByDate)

      result = [
        ...registered.map((e) => ({ type: 'event' as const, data: e })),
        ...unregistered.map((e) => ({ type: 'event' as const, data: e })),
      ]
    }

    // Apply search query
    if (query) {
      if (filter === 'Centers') {
        const matchingCenters = allCenters.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            (c.address?.toLowerCase().includes(query) ?? false)
        )
        result = groupCenterItems(matchingCenters, userCenterID)
      } else {
        result = result.filter((item) => {
          if (item.type === 'event') {
            return (
              item.data.title.toLowerCase().includes(query) ||
              item.data.location.toLowerCase().includes(query)
            )
          }
          if (item.type === 'center') {
            return (
              item.data.name.toLowerCase().includes(query) ||
              (item.data.address?.toLowerCase().includes(query) ?? false)
            )
          }
          return false
        })
      }
    }

    return result
  }, [allEvents, allCenters, filter, searchQuery, showPastEvents, showGoingOnly, userInterests, userCenterID])

  // Map points from current data
  const filteredPoints = useMemo<MapPoint[]>(() => {
    const centerPoints: MapPoint[] = allCenters.map((c) => ({
      id: c.id,
      type: 'center' as const,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
    }))
    const eventPoints: MapPoint[] = allEvents
      .filter((e) => e.latitude != null && e.longitude != null)
      .map((e) => ({
        id: e.id,
        type: 'event' as const,
        name: e.title,
        latitude: e.latitude!,
        longitude: e.longitude!,
      }))

    const allPoints = [...centerPoints, ...eventPoints]

    if (filter === 'Centers') {
      return allPoints.filter((p) => p.type === 'center')
    }
    return allPoints
  }, [allCenters, allEvents, filter])

  const updateEventStatus = useCallback(
    (
      eventId: string,
      isRegistered: boolean,
      attendeesCount: number,
      attendeesList: AttendeeInfo[]
    ) => {
      setAllEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, isRegistered, attendees: attendeesCount, attendeesList } : e
        )
      )
    },
    []
  )

  return {
    items,
    filteredPoints,
    loading,
    isLive,
    error,
    allEvents,
    allCenters,
    refresh,
    updateEventStatus,
  }
}

export { SAMPLE_ATTENDEES, SAMPLE_MESSAGES }

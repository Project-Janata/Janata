import { getStoredToken } from '../src/storage/tokenStorage'
import { API_BASE_URL } from '../src/config/api'

export const API_URL = API_BASE_URL

// ── Types (flat, matching backend API response) ───────────────────────

export interface CenterData {
  centerID: string
  name: string
  latitude: number
  longitude: number
  address: string | null
  website: string | null
  phone: string | null
  image: string | null
  acharya: string | null
  pointOfContact: string | null
  memberCount: number
  isVerified: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EventData {
  eventID: string
  title: string
  description: string
  date: string
  endDate?: string | null
  isRecurring?: boolean
  latitude: number
  longitude: number
  address: string | null
  centerID: string | null
  tier: number
  peopleAttending: number
  pointOfContact: string | null
  image: string | null
  category: number | null
  createdBy: string | null
  externalUrl?: string | null
  signupUrl?: string | null
  allowJanataSignup?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UserData {
  id: string
  username: string
  email: string | null
  firstName: string
  lastName: string
  dateOfBirth: string | null
  phoneNumber: string | null
  profileImage: string | null
  centerID: string | null
  points: number
  isVerified: boolean
  verificationLevel: number
  isActive: boolean
  profileComplete: boolean
  interests: string[] | null
  createdAt?: string
  updatedAt?: string
}

export interface MapPoint {
  id: string
  type: 'center' | 'event'
  name: string
  latitude: number
  longitude: number
}

// ── Discover-specific types ─────────────────────────────────────────────

export interface AttendeeInfo {
  name: string
  image?: string
  initials?: string
}

export interface EventDisplay {
  id: string
  title: string
  date: string     // ISO date string e.g. "2025-03-15"
  time: string     // display string e.g. "10:30 AM - 11:30 AM"
  location: string
  address?: string
  latitude?: number
  longitude?: number
  attendees: number
  attendeesList?: AttendeeInfo[]
  likes: number
  comments: number
  description?: string
  pointOfContact?: string
  image?: string
  isRegistered?: boolean
  centerName?: string
  centerId?: string
  createdBy?: string
  category?: number | null
  externalUrl?: string | null
  signupUrl?: string | null
  allowJanataSignup?: boolean
}

export interface DiscoverCenter {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  memberCount?: number
  eventCount?: number
  isMember?: boolean
  distanceMi?: number
  image?: string | null
}

export type DiscoverItem =
  | { type: 'event'; data: EventDisplay }
  | { type: 'center'; data: DiscoverCenter }
  | { type: 'section'; data: { label: string } }

export type DiscoverFilter = 'Events' | 'Centers' | 'Seva'

// ── Fetch helpers ──────────────────────────────────────────────────────

async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<Response> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      lastError = error
      if (error.name === 'AbortError' && attempt === 0) {
        throw new Error('Request timeout')
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError || new Error('Network request failed')
}

async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getStoredToken()
  return apiFetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}

// ── Request deduplication cache for fetchCenters ───────────────────────

let _centersPromise: Promise<CenterData[]> | null = null
let _centersTimestamp = 0
const CENTERS_CACHE_TTL = 30_000 // 30 seconds

export async function fetchCenters(): Promise<CenterData[]> {
  const now = Date.now()

  // Return cached promise if still fresh
  if (_centersPromise && now - _centersTimestamp < CENTERS_CACHE_TTL) {
    return _centersPromise
  }

  _centersTimestamp = now
  _centersPromise = (async () => {
    try {
      const response = await apiFetch('/centers')
      if (!response.ok) {
        return []
      }
      const data = await response.json()
      return data.centers || []
    } catch (err: any) {
      if (__DEV__) console.warn('[fetchCenters]', err?.message || err)
      _centersPromise = null // Clear on error so next call retries
      return []
    }
  })()

  return _centersPromise
}

/** Invalidate the centers cache (e.g. after adding a center) */
export function invalidateCentersCache(): void {
  _centersPromise = null
  _centersTimestamp = 0
}

// ── API methods ────────────────────────────────────────────────────────

export async function fetchCenter(centerID: string): Promise<CenterData | null> {
  try {
    const response = await apiFetch('/fetchCenter', {
      method: 'POST',
      body: JSON.stringify({ centerID }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.center || null
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchCenter]', err?.message || err)
    return null
  }
}

export async function fetchEvent(eventID: string): Promise<EventData | null> {
  try {
    const response = await apiFetch('/fetchEvent', {
      method: 'POST',
      body: JSON.stringify({ id: eventID }),
    })
    if (!response.ok) return null
    const data = await response.json()
    const event = data.event as EventData | null
    if (event && event.image && event.image.startsWith('/')) {
      event.image = `${API_BASE_URL}${event.image}`
    }
    return event
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchEvent]', err?.message || err)
    return null
  }
}

export async function fetchEventsByCenter(centerID: string): Promise<EventData[]> {
  try {
    const response = await apiFetch('/fetchEventsByCenter', {
      method: 'POST',
      body: JSON.stringify({ centerID }),
    })
    if (!response.ok) return []
    const data = await response.json()
    return data.events || []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchEventsByCenter]', err?.message || err)
    return []
  }
}

export async function fetchAllEvents(): Promise<EventData[]> {
  try {
    const response = await apiFetch('/fetchAllEvents')
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    const events = (data.events || []) as EventData[]
    return events.map((e) => {
      if (e.image && e.image.startsWith('/')) {
        return { ...e, image: `${API_BASE_URL}${e.image}` }
      }
      return e
    })
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchAllEvents]', err?.message || err)
    return []
  }
}

export async function fetchEventUsers(eventID: string): Promise<UserData[]> {
  try {
    const response = await apiFetch('/getEventUsers', {
      method: 'POST',
      body: JSON.stringify({ id: eventID }),
    })
    if (!response.ok) return []
    const data = await response.json()
    const users = (data.users || []) as UserData[]

    // Normalize profile images
    return users.map((u) => {
      if (u.profileImage && u.profileImage.startsWith('/')) {
        return {
          ...u,
          profileImage: `${API_BASE_URL}${u.profileImage}`,
        }
      }
      return u
    })
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchEventUsers]', err?.message || err)
    return []
  }
}

export async function attendEvent(eventID: string): Promise<{ peopleAttending: number }> {
  const response = await authFetch('/attendEvent', {
    method: 'POST',
    body: JSON.stringify({ eventID }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to attend event' }))
    throw new Error(err.message || 'Failed to attend event')
  }
  return response.json()
}

export async function unattendEvent(eventID: string): Promise<{ peopleAttending: number }> {
  const response = await authFetch('/unattendEvent', {
    method: 'POST',
    body: JSON.stringify({ eventID }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to unattend event' }))
    throw new Error(err.message || 'Failed to unattend event')
  }
  return response.json()
}

export async function createEvent(data: {
  title: string
  description: string
  date: string
  latitude: number
  longitude: number
  address?: string
  centerID: string
  pointOfContact?: string
  image?: string
  category?: number
  externalUrl?: string | null
  signupUrl?: string | null
  allowJanataSignup?: boolean
}): Promise<{ id: string; tier: number }> {
  const response = await authFetch('/addEvent', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create event' }))
    throw new Error(err.message || 'Failed to create event')
  }
  return response.json()
}

export async function updateEvent(eventJSON: Record<string, any>): Promise<any> {
  const response = await authFetch('/updateEvent', {
    method: 'POST',
    body: JSON.stringify({ eventJSON }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update event' }))
    throw new Error(err.message || 'Failed to update event')
  }
  return response.json()
}

export async function removeEvent(id: string): Promise<void> {
  const response = await authFetch('/removeEvent', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete event' }))
    throw new Error(err.message || 'Failed to delete event')
  }
}

export async function getUserEvents(username: string): Promise<EventData[]> {
  try {
    const response = await authFetch('/getUserEvents', {
      method: 'POST',
      body: JSON.stringify({ username }),
    })
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.events || []
  } catch (err: any) {
    if (__DEV__) console.warn('[getUserEvents]', err?.message || err)
    return []
  }
}

// ── Profile endpoints ─────────────────────────────────────────────────

export async function fetchUserEvents(username: string): Promise<EventData[]> {
  try {
    const response = await authFetch(`/profile/${encodeURIComponent(username)}/events`)
    if (!response.ok) return []
    const data = await response.json()
    return data.events || []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchUserEvents]', err?.message || err)
    return []
  }
}

export async function fetchUserPosts(username: string): Promise<EventData[]> {
  try {
    const response = await authFetch(`/profile/${encodeURIComponent(username)}/posts`)
    if (!response.ok) return []
    const data = await response.json()
    return data.posts || []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchUserPosts]', err?.message || err)
    return []
  }
}

export async function fetchUserGroups(username: string): Promise<CenterData[]> {
  try {
    const response = await authFetch(`/profile/${encodeURIComponent(username)}/groups`)
    if (!response.ok) return []
    const data = await response.json()
    return data.groups || []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchUserGroups]', err?.message || err)
    return []
  }
}

export async function fetchUserMessages(username: string): Promise<[]> {
  try {
    const response = await authFetch(`/profile/${encodeURIComponent(username)}/messages`)
    if (!response.ok) return []
    const data = await response.json()
    return data.messages || []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchUserMessages]', err?.message || err)
    return []
  }
}

// ── Data normalization (flat fields) ──────────────────────────────────

export function centersToMapPoints(centers: CenterData[]): MapPoint[] {
  return centers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.centerID,
      type: 'center' as const,
      name: c.name || 'Unknown Center',
      latitude: c.latitude,
      longitude: c.longitude,
    }))
}

export function eventsToMapPoints(events: EventData[]): MapPoint[] {
  return events
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({
      id: e.eventID,
      type: 'event' as const,
      name: e.title || e.description || 'Event',
      latitude: e.latitude,
      longitude: e.longitude,
    }))
}

export function centersToDiscoverCenters(centers: CenterData[]): DiscoverCenter[] {
  return centers
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      id: c.centerID,
      name: c.name || 'Unknown Center',
      address: c.address ?? undefined,
      latitude: c.latitude,
      longitude: c.longitude,
      memberCount: c.memberCount,
      image: c.image && c.image.startsWith('/') ? `${API_BASE_URL}${c.image}` : c.image ?? null,
    }))
}

// ── Discover sample data (empty since we fetch from API) ──────────────────────────

export const DISCOVER_SAMPLE_EVENTS: EventDisplay[] = []

export const DISCOVER_SAMPLE_CENTERS: DiscoverCenter[] = []

// ── Admin API ─────────────────────────────────────────────────────────

export interface AdminPaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface AdminStats {
  users: number
  centers: number
  events: number
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const response = await authFetch('/admin/stats')
  if (!response.ok) throw new Error('Failed to fetch admin stats')
  return response.json()
}

export async function fetchAdminUsers(params?: {
  q?: string
  limit?: number
  offset?: number
}): Promise<AdminPaginatedResponse<UserData>> {
  const searchParams = new URLSearchParams()
  if (params?.q) searchParams.set('q', params.q)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/users${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch admin users')
  return response.json()
}

export async function fetchAdminCenters(params?: {
  q?: string
  limit?: number
  offset?: number
}): Promise<AdminPaginatedResponse<CenterData>> {
  const searchParams = new URLSearchParams()
  if (params?.q) searchParams.set('q', params.q)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/centers${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch admin centers')
  return response.json()
}

export async function fetchAdminEvents(params?: {
  q?: string
  limit?: number
  offset?: number
}): Promise<AdminPaginatedResponse<EventData>> {
  const searchParams = new URLSearchParams()
  if (params?.q) searchParams.set('q', params.q)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/events${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch admin events')
  return response.json()
}

export async function fetchAdminCenterMembers(centerId: string): Promise<UserData[]> {
  const response = await authFetch(`/admin/centers/${centerId}/members`)
  if (!response.ok) throw new Error('Failed to fetch center members')
  const data = await response.json()
  return data.data
}

export async function adminVerifyUser(
  userId: string,
  opts: { verificationLevel?: number; isVerified?: boolean }
): Promise<{ isVerified: boolean }> {
  const response = await authFetch(`/admin/users/${userId}/verify`, {
    method: 'POST',
    body: JSON.stringify(opts),
  })
  if (!response.ok) throw new Error('Failed to update user verification')
  return response.json()
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const response = await authFetch(`/admin/users/${userId}`, { method: 'DELETE' })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete user' }))
    throw new Error(err.message)
  }
}

export async function adminUpdateCenter(
  centerId: string,
  updates: Record<string, any>
): Promise<void> {
  const response = await authFetch(`/admin/centers/${centerId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error('Failed to update center')
}

export async function adminVerifyCenter(centerId: string): Promise<void> {
  const response = await authFetch(`/admin/centers/${centerId}/verify`, {
    method: 'POST',
    body: '{}',
  })
  if (!response.ok) throw new Error('Failed to toggle center verification')
}

export async function adminDeleteCenter(centerId: string): Promise<void> {
  const response = await authFetch(`/admin/centers/${centerId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete center')
}

export async function adminUpdateEvent(
  eventId: string,
  updates: Record<string, any>
): Promise<void> {
  const response = await authFetch(`/admin/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  if (!response.ok) throw new Error('Failed to update event')
}

export async function adminDeleteEvent(eventId: string): Promise<void> {
  const response = await authFetch(`/admin/events/${eventId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete event')
}

// ── Admin invite codes ────────────────────────────────────────────────

export interface InviteCodeData {
  code: string
  label: string
  verificationLevel: number
  isActive: boolean
  createdAt: string
  usageCount: number
}

export async function fetchAdminInviteCodes(): Promise<{ data: InviteCodeData[] }> {
  const response = await authFetch('/admin/invite-codes')
  if (!response.ok) throw new Error('Failed to fetch invite codes')
  return response.json()
}

export async function adminCreateInviteCode(params: {
  code: string
  label: string
  verificationLevel?: number
}): Promise<void> {
  const response = await authFetch('/admin/invite-codes', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create invite code' }))
    throw new Error(err.message)
  }
}

export async function adminToggleInviteCode(code: string): Promise<void> {
  const response = await authFetch(`/admin/invite-codes/${encodeURIComponent(code)}/toggle`, {
    method: 'POST',
    body: '{}',
  })
  if (!response.ok) throw new Error('Failed to toggle invite code')
}

export async function fetchAdminInviteCodeUsers(code: string): Promise<UserData[]> {
  const response = await authFetch(`/admin/invite-codes/${encodeURIComponent(code)}/users`)
  if (!response.ok) throw new Error('Failed to fetch invite code users')
  const data = await response.json()
  return data.data
}

// ── Admin Notifications API ──────────────────────────────────────────

export interface AdminNotification {
  id: string
  userId: string
  typeId: number
  title: string
  message: string
  data: any
  isRead: boolean
  isArchived: boolean
  readAt: string | null
  actionUrl: string | null
  relatedEventId: string | null
  relatedUserId: string | null
  createdAt: string
  updatedAt: string
  recipientName: string
  recipientUsername: string
}

export interface AdminNotificationStats {
  total: number
  unread: number
  last24h: number
  byType: { typeId: number; count: number }[]
}

export async function fetchAdminNotifications(params?: {
  limit?: number
  offset?: number
  userId?: string
  typeId?: number
}): Promise<AdminPaginatedResponse<AdminNotification>> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.userId) searchParams.set('userId', params.userId)
  if (params?.typeId) searchParams.set('typeId', String(params.typeId))
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/notifications${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch admin notifications')
  return response.json()
}

export async function fetchAdminNotificationStats(): Promise<AdminNotificationStats> {
  const response = await authFetch('/admin/notifications/stats')
  if (!response.ok) throw new Error('Failed to fetch notification stats')
  return response.json()
}

export async function adminSendNotification(params: {
  userId?: string
  typeId: number
  title: string
  message: string
  actionUrl?: string
  broadcast?: boolean
}): Promise<{ message: string; sent?: number }> {
  const response = await authFetch('/admin/notifications/send', {
    method: 'POST',
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to send notification')
  return response.json()
}

export async function adminDeleteNotification(notificationId: string): Promise<void> {
  const response = await authFetch(`/admin/notifications/${notificationId}`, { method: 'DELETE' })
  if (!response.ok) throw new Error('Failed to delete notification')
}

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
  description?: string | null
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
  // #192 — true when creator was at SEVAK level or higher at create time.
  isOfficial?: boolean
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
  // Minimal profile fields (#210)
  school?: string | null
  work?: string | null
  region?: string | null
  lookingFor?: string[] | null
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

export type BoardType = 'center' | 'event'
export type PostVisibility = 'board' | 'public_signed_in' | 'public_open'

export interface BoardData {
  id: string
  type: BoardType
  parentId: string
  createdAt: string
}

export interface BoardPostData {
  id: string
  boardId: string | null
  visibility: PostVisibility
  body: string
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  author: UserData
  reactions: Array<{ emoji: string; count: number }>
  replyCount: number
  // #205 boards enhancements — present once the post has been pinned (#249).
  pinnedAt?: string | null
  pinnedBy?: string | null
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
  // #192 — true when creator was at SEVAK level or higher at create time.
  isOfficial?: boolean
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

export type DiscoverFilter = 'Events' | 'Centers'

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

/**
 * Paginated centers result (#107). `total` is the count BEFORE the page slice,
 * useful for "showing N of M" and for knowing when to stop calling for more.
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}

/**
 * Paginated centers fetch (#107). Use for infinite scroll: start at offset=0
 * and call again with `offset += limit` until `data.length === 0` OR
 * `offset >= total`. Returns an empty page (not an error) on network failure
 * so the UI can fall back gracefully.
 */
export async function fetchCentersPage(
  limit: number,
  offset = 0,
): Promise<PaginatedResult<CenterData>> {
  const url = `/centers?limit=${Math.max(1, Math.floor(limit))}&offset=${Math.max(0, Math.floor(offset))}`
  try {
    const response = await apiFetch(url)
    if (!response.ok) return { data: [], total: 0, limit, offset }
    const data = await response.json()
    return {
      data: data.centers || [],
      total: typeof data.total === 'number' ? data.total : 0,
      limit: typeof data.limit === 'number' ? data.limit : limit,
      offset: typeof data.offset === 'number' ? data.offset : offset,
    }
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchCentersPage]', err?.message || err)
    return { data: [], total: 0, limit, offset }
  }
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

/**
 * Paginated events fetch (#107). Sort order is date DESC (matches the
 * unpaginated /fetchAllEvents). Image URLs are normalized to absolute,
 * same as the unpaginated path.
 */
export async function fetchEventsPage(
  limit: number,
  offset = 0,
): Promise<PaginatedResult<EventData>> {
  const url = `/fetchAllEvents?limit=${Math.max(1, Math.floor(limit))}&offset=${Math.max(0, Math.floor(offset))}`
  try {
    const response = await apiFetch(url)
    if (!response.ok) return { data: [], total: 0, limit, offset }
    const data = await response.json()
    const events = ((data.events || []) as EventData[]).map((e) =>
      e.image && e.image.startsWith('/') ? { ...e, image: `${API_BASE_URL}${e.image}` } : e,
    )
    return {
      data: events,
      total: typeof data.total === 'number' ? data.total : 0,
      limit: typeof data.limit === 'number' ? data.limit : limit,
      offset: typeof data.offset === 'number' ? data.offset : offset,
    }
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchEventsPage]', err?.message || err)
    return { data: [], total: 0, limit, offset }
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

/**
 * Account-less RSVP (new-11): name + email, no auth. Returns `alreadyRsvped`
 * so the sheet can show the dedupe state (new-11b). Throws with `.status` set
 * so callers can special-case 403 (event requires a verified account).
 */
export async function attendEventGuest(
  eventID: string,
  name: string,
  email: string,
): Promise<{ alreadyRsvped: boolean }> {
  const response = await apiFetch('/attendEventGuest', {
    method: 'POST',
    body: JSON.stringify({ eventID, name, email }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to RSVP' }))
    const e = new Error(err.message || 'Failed to RSVP') as Error & { status?: number }
    e.status = response.status
    throw e
  }
  const data = await response.json()
  return { alreadyRsvped: data.alreadyRsvped === true }
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

// ── Boards endpoints ──────────────────────────────────────────────────

export async function fetchBoard(
  type: BoardType,
  parentId: string
): Promise<{ board: BoardData | null; posts: BoardPostData[] }> {
  try {
    const response = await authFetch(`/boards/${type}/${encodeURIComponent(parentId)}`)
    if (!response.ok) return { board: null, posts: [] }
    const data = await response.json()
    return {
      board: data.board ?? null,
      posts: data.posts ?? [],
    }
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchBoard]', err?.message || err)
    return { board: null, posts: [] }
  }
}

export async function createBoardPost(
  type: BoardType,
  parentId: string,
  body: string,
  imageUrl?: string | null
): Promise<BoardPostData> {
  const response = await authFetch(`/boards/${type}/${encodeURIComponent(parentId)}/posts`, {
    method: 'POST',
    body: JSON.stringify({ body, imageUrl: imageUrl ?? null }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create board post' }))
    throw new Error(err.message || 'Failed to create board post')
  }
  const data = await response.json()
  return data.post
}

export async function createPublicPost(
  body: string,
  imageUrl?: string | null
): Promise<BoardPostData> {
  const response = await authFetch('/feed/public', {
    method: 'POST',
    body: JSON.stringify({ body, imageUrl: imageUrl ?? null }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to create public post' }))
    throw new Error(err.message || 'Failed to create public post')
  }
  const data = await response.json()
  return data.post
}

// Upload an image for a board post (#283) and return its hosted URL. Pass the
// URL to createBoardPost as `imageUrl`. Multipart, so it does not go through the
// JSON apiFetch wrapper.
export async function uploadBoardImage(
  file: File | Blob | { uri: string; name: string; type: string }
): Promise<string> {
  const token = await getStoredToken()
  const form = new FormData()
  // Web passes a File/Blob; native passes a { uri, name, type } descriptor,
  // which React Native's FormData accepts directly.
  form.append('file', file as any)
  const response = await fetch(`${API_BASE_URL}/board/uploadImage`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Upload failed' }))
    throw new Error(err.message || 'Upload failed')
  }
  const data = await response.json()
  return data.imageUrl as string
}

export async function toggleBoardPostReaction(
  postId: string,
  emoji: string
): Promise<{ active: boolean; reactions: Array<{ emoji: string; count: number }> }> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ emoji }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to update reaction' }))
    throw new Error(err.message || 'Failed to update reaction')
  }
  return response.json()
}

/**
 * Aggregated cross-board feed (#205 / GET /feed). Server-side aggregation of
 * every top-level post on a board the user can access, reverse-chronological.
 * Returns [] on failure so the Feed tab degrades gracefully.
 */
export async function fetchAggregatedFeed(
  opts: { limit?: number; offset?: number } = {}
): Promise<BoardPostData[]> {
  const limit = Math.max(1, Math.min(100, Math.floor(opts.limit ?? 50)))
  const offset = Math.max(0, Math.floor(opts.offset ?? 0))
  try {
    const response = await authFetch(`/feed?limit=${limit}&offset=${offset}`)
    if (!response.ok) return []
    const data = await response.json()
    return data.posts ?? []
  } catch (err: any) {
    if (__DEV__) console.warn('[fetchAggregatedFeed]', err?.message || err)
    return []
  }
}

/** Create a single-level reply to a board post (#205 / POST /replies). */
export async function createBoardPostReply(
  postId: string,
  body: string
): Promise<BoardPostData> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}/replies`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to post reply' }))
    throw new Error(err.message || 'Failed to post reply')
  }
  const data = await response.json()
  return data.reply
}

/**
 * List replies under a board post, oldest first (#205 / GET /replies).
 * Throws on failure so the post-detail thread can show a retryable error
 * state (rather than masking a network/auth failure as an empty thread).
 */
export async function fetchBoardPostReplies(postId: string): Promise<BoardPostData[]> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}/replies`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to load replies' }))
    throw new Error(err.message || 'Failed to load replies')
  }
  const data = await response.json()
  return data.replies ?? []
}

/** Edit a board post body — author only, within the edit window (#205 / PATCH). */
export async function editBoardPost(postId: string, body: string): Promise<BoardPostData> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to edit post' }))
    throw new Error(err.message || 'Failed to edit post')
  }
  const data = await response.json()
  return data.post
}

/** Soft-delete a board post — author or admin (#205 / DELETE). */
export async function deleteBoardPost(postId: string): Promise<void> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to delete post' }))
    throw new Error(err.message || 'Failed to delete post')
  }
}

/**
 * Pin / unpin a board post — sevak+ or admin only (#205 / POST pin|unpin).
 * Returns the new pinned state.
 */
export async function setBoardPostPinned(
  postId: string,
  pinned: boolean
): Promise<boolean> {
  const action = pinned ? 'pin' : 'unpin'
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}/${action}`, {
    method: 'POST',
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `Failed to ${action} post` }))
    throw new Error(err.message || `Failed to ${action} post`)
  }
  const data = await response.json()
  return data.pinned ?? pinned
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

// ── Discover sample data — scraped from Chinmaya chapter sites (2026-04-30) ──────
export const DISCOVER_SAMPLE_EVENTS: EventDisplay[] = [
  {
    id: 'sample-hanuman-havan',
    title: 'Hanuman Chalisa Havan',
    date: '2026-05-16',
    time: '8:30 AM',
    location: 'Hillsboro, OR',
    address: 'Chinmaya Haridwar, 3551 NE John Olsen Ave, Hillsboro, OR 97124',
    attendees: 18,
    likes: 0,
    comments: 0,
    description: 'Sacred Vedic fire offering opening with Shodasha Upachara Puja followed by chanting verses of the Hanuman Chalisa.',
    pointOfContact: 'contact@cmportland.org',
    image: 'https://cmportland.org/images/HanumanChalisaHavan.jpg',
    centerName: 'Chinmaya Portland',
    category: null,
    externalUrl: 'https://cmportland.org/havan/',
  },
  {
    id: 'sample-gcc-state-finals',
    title: 'GCC State Finals',
    date: '2026-05-16',
    time: 'TBD',
    location: 'Dallas, TX',
    address: 'Chinmaya Mangalam, Dallas, TX',
    attendees: 42,
    likes: 0,
    comments: 0,
    description: 'Texas state finals of the Gita Chanting Competition.',
    pointOfContact: '(972) 250-2470',
    centerName: 'Chinmaya Mission Dallas Fort-Worth',
    category: null,
    externalUrl: 'https://cmdfw.org/upcoming-cmdfw-events/',
  },
  {
    id: 'sample-chyk-memorial-day-camp',
    title: 'ChYK Memorial Day Camp',
    date: '2026-05-23',
    time: 'All day',
    location: 'Chicago area, IL',
    address: 'Abhyudaya Retreat Center',
    attendees: 31,
    likes: 0,
    comments: 0,
    description: 'West Central Zone retreat for Chinmaya Yuva Kendra (CHYK) members at Abhyudaya Retreat Center.',
    pointOfContact: '847-740-1215',
    centerName: 'ChYK West Central Zone',
    category: null,
  },
  {
    id: 'sample-summer-camp-give-me-five',
    title: 'Summer Camp 2026 – Give Me Five',
    date: '2026-06-15',
    time: '9:00 AM – 3:00 PM',
    location: 'Orlando, FL',
    attendees: 87,
    likes: 0,
    comments: 0,
    description: '34th annual summer camp for children ages 5-13, themed on the Gita Panchamrit.',
    image: 'https://res.cloudinary.com/chinmayaorlando/image/upload/q_auto/cmo/2026/summercamp.jpg',
    centerName: 'Chinmaya Mission Orlando',
    category: null,
    externalUrl: 'https://www.chinmayaorlando.org/index.php/upcoming-events/476-summer-camp-2026',
  },
  {
    id: 'sample-aradhana-camp',
    title: '33rd Mahasamadhi Aradhana Camp',
    date: '2026-07-30',
    time: '5:00 PM',
    location: 'Parsippany, NJ',
    attendees: 24,
    likes: 0,
    comments: 0,
    description: 'Annual Mahasamadhi Aradhana Camp celebrating Pujya Gurudev.',
    centerName: 'Chinmaya Mission Tri-State',
    category: null,
  },
]

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

// ── Moderation (#209) ─────────────────────────────────────────────────

/**
 * Report a board post for moderation. Any signed-in user may report; one
 * report per (post, reporter) — re-reporting updates the reason. Member-side
 * "report" button (Lane B) calls this.
 */
export async function reportBoardPost(postId: string, reason?: string): Promise<void> {
  const response = await authFetch(`/boards/posts/${encodeURIComponent(postId)}/report`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to submit report' }))
    throw new Error(err.message)
  }
}

export interface ModerationQueuePost {
  id: string
  boardId: string | null
  visibility?: PostVisibility
  body: string
  imageUrl: string | null
  createdAt: string
  deletedAt: string | null
  author: { id: string; username: string; firstName: string; lastName: string }
}

export interface ModerationQueueItem {
  post: ModerationQueuePost
  reportCount: number
  openReportCount: number
  latestReportAt: string
  latestReason: string | null
  status: 'open' | 'actioned'
}

export interface ModerationAuditEntry {
  id: string
  actorId: string | null
  action: string
  targetPostId: string | null
  targetUserId: string | null
  reason: string | null
  metadata: unknown
  createdAt: string
}

export async function fetchAdminModerationQueue(params?: {
  limit?: number
  offset?: number
  includeResolved?: boolean
}): Promise<AdminPaginatedResponse<ModerationQueueItem>> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  if (params?.includeResolved) searchParams.set('includeResolved', 'true')
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/moderation/queue${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch moderation queue')
  return response.json()
}

export async function adminDeleteReportedPost(
  postId: string,
): Promise<{ message: string; alreadyDeleted: boolean }> {
  const response = await authFetch(
    `/admin/moderation/posts/${encodeURIComponent(postId)}/delete`,
    { method: 'POST', body: '{}' },
  )
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to remove post' }))
    throw new Error(err.message)
  }
  return response.json()
}

export async function adminSuspendUser(
  userId: string,
  opts: { reason?: string; durationDays?: number } = {},
): Promise<void> {
  const response = await authFetch(
    `/admin/moderation/users/${encodeURIComponent(userId)}/suspend`,
    { method: 'POST', body: JSON.stringify(opts) },
  )
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to suspend user' }))
    throw new Error(err.message)
  }
}

export async function adminUnsuspendUser(userId: string): Promise<void> {
  const response = await authFetch(
    `/admin/moderation/users/${encodeURIComponent(userId)}/unsuspend`,
    { method: 'POST', body: '{}' },
  )
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Failed to lift suspension' }))
    throw new Error(err.message)
  }
}

export async function fetchAdminModerationAudit(params?: {
  limit?: number
  offset?: number
}): Promise<AdminPaginatedResponse<ModerationAuditEntry>> {
  const searchParams = new URLSearchParams()
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))
  const qs = searchParams.toString()
  const response = await authFetch(`/admin/moderation/audit${qs ? `?${qs}` : ''}`)
  if (!response.ok) throw new Error('Failed to fetch moderation audit log')
  return response.json()
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

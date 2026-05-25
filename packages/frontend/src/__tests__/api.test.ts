/**
 * Tests for utils/api.ts
 *
 * Covers API_URL generation, fetch helpers, caching, and data normalization.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { CenterData, EventData } from '../../utils/api'

// We need to be able to re-import the module with different Platform/DEV settings,
// so we'll use dynamic imports and resetModules where needed.

// ── Fixture builders ───────────────────────────────────────────────────
// Build full CenterData/EventData objects so tests stay type-correct as the
// types evolve. Tests pass only the fields they care about; defaults fill the
// rest with sensible nulls matching the wire shape from the backend.

function makeCenter(overrides: Partial<CenterData> = {}): CenterData {
  return {
    centerID: '',
    name: '',
    latitude: 0,
    longitude: 0,
    address: null,
    website: null,
    phone: null,
    image: null,
    acharya: null,
    pointOfContact: null,
    memberCount: 0,
    isVerified: false,
    ...overrides,
  }
}

function makeEvent(overrides: Partial<EventData> = {}): EventData {
  return {
    eventID: '',
    title: '',
    description: '',
    date: '2025-01-01',
    latitude: 0,
    longitude: 0,
    address: null,
    centerID: null,
    tier: 1,
    peopleAttending: 0,
    pointOfContact: null,
    image: null,
    category: null,
    createdBy: null,
    ...overrides,
  }
}

// ── Global fetch mock ──────────────────────────────────────────────────
const mockFetch = vi.fn()
;(globalThis as any).fetch = mockFetch

// Helper to build a mock Response
function mockResponse(body: any, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    bytes: vi.fn(),
  } as unknown as Response
}

// ── Tests ──────────────────────────────────────────────────────────────

describe('API_URL generation', () => {
  afterEach(() => {
    vi.resetModules()
  })

  it('returns localhost for web in dev mode', async () => {
    ;(globalThis as any).__DEV__ = true
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    const api = await import('../../utils/api')
    expect(api.API_URL).toBe('http://localhost:8787/api')
  })

  it('returns 10.0.2.2 for android in dev mode', async () => {
    ;(globalThis as any).__DEV__ = true
    vi.doMock('react-native', () => ({
      Platform: { OS: 'android', select: (obj: any) => obj.android ?? obj.default },
    }))
    const api = await import('../../utils/api')
    expect(api.API_URL).toBe('http://10.0.2.2:8787/api')
  })

  it('returns localhost for ios in dev mode', async () => {
    ;(globalThis as any).__DEV__ = true
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
    }))
    const api = await import('../../utils/api')
    expect(api.API_URL).toBe('http://localhost:8787/api')
  })

  it('returns backend Worker URL for web in production', async () => {
    ;(globalThis as any).__DEV__ = false
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    const api = await import('../../utils/api')
    expect(api.API_URL).toBe('https://api.chinmayajanata.org/api')
  })

  it('returns backend Worker URL for native in production', async () => {
    ;(globalThis as any).__DEV__ = false
    vi.doMock('react-native', () => ({
      Platform: { OS: 'ios', select: (obj: any) => obj.ios ?? obj.default },
    }))
    const api = await import('../../utils/api')
    expect(api.API_URL).toBe('https://api.chinmayajanata.org/api')
  })
})

describe('fetchCenters', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
    api.invalidateCentersCache()
  })

  it('returns centers on success', async () => {
    const centers = [
      { centerID: '1', name: 'Center A', latitude: 37.0, longitude: -122.0, address: null, memberCount: 10, isVerified: true },
    ]
    mockFetch.mockResolvedValue(mockResponse({ centers }))
    const result = await api.fetchCenters()
    expect(result).toEqual(centers)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('returns empty array on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 500))
    const result = await api.fetchCenters()
    expect(result).toEqual([])
  })

  it('returns empty array on fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'))
    const result = await api.fetchCenters()
    expect(result).toEqual([])
  })

  it('caches result within TTL', async () => {
    const centers = [{ centerID: '1', name: 'C', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }]
    mockFetch.mockResolvedValue(mockResponse({ centers }))

    const first = await api.fetchCenters()
    const second = await api.fetchCenters()
    expect(first).toEqual(centers)
    expect(second).toEqual(centers)
    // Only one fetch call because of caching
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('refetches after cache invalidation', async () => {
    const centers1 = [{ centerID: '1', name: 'C1', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }]
    const centers2 = [{ centerID: '2', name: 'C2', latitude: 3, longitude: 4, address: null, memberCount: 0, isVerified: false }]
    mockFetch.mockResolvedValueOnce(mockResponse({ centers: centers1 }))
    mockFetch.mockResolvedValueOnce(mockResponse({ centers: centers2 }))

    const first = await api.fetchCenters()
    expect(first).toEqual(centers1)

    api.invalidateCentersCache()

    const second = await api.fetchCenters()
    expect(second).toEqual(centers2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('clears cache on error so next call retries', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))
    const first = await api.fetchCenters()
    expect(first).toEqual([])

    const centers = [{ centerID: '1', name: 'C', latitude: 1, longitude: 2, address: null, memberCount: 0, isVerified: false }]
    mockFetch.mockResolvedValueOnce(mockResponse({ centers }))
    const second = await api.fetchCenters()
    expect(second).toEqual(centers)
  })
})

describe('fetchCenter', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns center on success', async () => {
    const center = { centerID: '1', name: 'Test', latitude: 1, longitude: 2, address: null, memberCount: 5, isVerified: true }
    mockFetch.mockResolvedValue(mockResponse({ center }))
    const result = await api.fetchCenter('1')
    expect(result).toEqual(center)
  })

  it('returns null on not found (non-ok)', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 404))
    const result = await api.fetchCenter('999')
    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))
    const result = await api.fetchCenter('1')
    expect(result).toBeNull()
  })
})

describe('fetchEvent', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns event on success', async () => {
    const event = { eventID: 'e1', title: 'Test', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null }
    mockFetch.mockResolvedValue(mockResponse({ event }))
    const result = await api.fetchEvent('e1')
    expect(result).toEqual(event)
  })

  it('returns null on not found', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 404))
    const result = await api.fetchEvent('e999')
    expect(result).toBeNull()
  })

  it('returns null on error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))
    const result = await api.fetchEvent('e1')
    expect(result).toBeNull()
  })
})

describe('fetchEventsByCenter', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns events on success', async () => {
    const events = [{ eventID: 'e1', title: 'A', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: 'c1', tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null }]
    mockFetch.mockResolvedValue(mockResponse({ events }))
    const result = await api.fetchEventsByCenter('c1')
    expect(result).toEqual(events)
  })

  it('returns empty array when no events', async () => {
    mockFetch.mockResolvedValue(mockResponse({ events: [] }))
    const result = await api.fetchEventsByCenter('c1')
    expect(result).toEqual([])
  })

  it('returns empty array on error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))
    const result = await api.fetchEventsByCenter('c1')
    expect(result).toEqual([])
  })
})

describe('fetchEventUsers', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns users on success', async () => {
    const users = [{ id: 'u1', username: 'testuser', email: null, firstName: 'Test', lastName: 'User', dateOfBirth: null, phoneNumber: null, profileImage: null, centerID: null, points: 0, isVerified: false, verificationLevel: 0, isActive: true, profileComplete: false, interests: null }]
    mockFetch.mockResolvedValue(mockResponse({ users }))
    const result = await api.fetchEventUsers('e1')
    expect(result).toEqual(users)
  })

  it('returns empty array when no users', async () => {
    mockFetch.mockResolvedValue(mockResponse({ users: [] }))
    const result = await api.fetchEventUsers('e1')
    expect(result).toEqual([])
  })

  it('returns empty array on error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))
    const result = await api.fetchEventUsers('e1')
    expect(result).toEqual([])
  })
})

describe('attendEvent', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns peopleAttending on success', async () => {
    mockFetch.mockResolvedValue(mockResponse({ peopleAttending: 5 }))
    const result = await api.attendEvent('e1')
    expect(result).toEqual({ peopleAttending: 5 })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Already attending' }, false, 400))
    await expect(api.attendEvent('e1')).rejects.toThrow('Already attending')
  })

  it('throws with default message when response body parse fails', async () => {
    const response = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('parse error')),
      headers: new Headers(),
      redirected: false,
      statusText: 'Error',
      type: 'basic' as ResponseType,
      url: '',
      clone: vi.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: vi.fn(),
      blob: vi.fn(),
      formData: vi.fn(),
      text: vi.fn(),
      bytes: vi.fn(),
    } as unknown as Response
    mockFetch.mockResolvedValue(response)
    await expect(api.attendEvent('e1')).rejects.toThrow('Failed to attend event')
  })
})

describe('unattendEvent', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns peopleAttending on success', async () => {
    mockFetch.mockResolvedValue(mockResponse({ peopleAttending: 3 }))
    const result = await api.unattendEvent('e1')
    expect(result).toEqual({ peopleAttending: 3 })
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Not attending' }, false, 400))
    await expect(api.unattendEvent('e1')).rejects.toThrow('Not attending')
  })
})

describe('updateEvent', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns data on success', async () => {
    const updated = { success: true }
    mockFetch.mockResolvedValue(mockResponse(updated))
    const result = await api.updateEvent({ title: 'Updated' })
    expect(result).toEqual(updated)
  })

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue(mockResponse({}, false, 500))
    await expect(api.updateEvent({ title: 'Fail' })).rejects.toThrow('Failed to update event')
  })
})

describe('getUserEvents', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    mockFetch.mockReset()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('returns events on success', async () => {
    const events = [{ eventID: 'e1', title: 'A', description: '', date: '2025-01-01', latitude: 1, longitude: 2, address: null, centerID: null, tier: 1, peopleAttending: 0, pointOfContact: null, image: null, category: null }]
    mockFetch.mockResolvedValue(mockResponse({ events }))
    const result = await api.getUserEvents('testuser')
    expect(result).toEqual(events)
  })

  it('returns empty array when no events', async () => {
    mockFetch.mockResolvedValue(mockResponse({ events: [] }))
    const result = await api.getUserEvents('testuser')
    expect(result).toEqual([])
  })

  it('returns empty array on error', async () => {
    mockFetch.mockRejectedValue(new Error('fail'))
    const result = await api.getUserEvents('testuser')
    expect(result).toEqual([])
  })
})

describe('centersToMapPoints', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('converts centers with lat/lng to map points', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0, memberCount: 10, isVerified: true }),
      makeCenter({ centerID: '2', name: 'B', latitude: 38.0, longitude: -121.0, address: 'Addr', memberCount: 5, isVerified: false }),
    ]
    const result = api.centersToMapPoints(centers)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: '1', type: 'center', name: 'A', latitude: 37.0, longitude: -122.0 })
  })

  it('keeps entries with latitude=0 (valid coordinate)', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 0, longitude: -122.0, memberCount: 10, isVerified: true }),
      makeCenter({ centerID: '2', name: 'B', latitude: 38.0, longitude: -121.0, memberCount: 5, isVerified: false }),
    ]
    const result = api.centersToMapPoints(centers)
    expect(result).toHaveLength(2)
  })

  it('keeps entries with longitude=0 (valid coordinate)', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 37.0, longitude: 0, memberCount: 10, isVerified: true }),
    ]
    const result = api.centersToMapPoints(centers)
    expect(result).toHaveLength(1)
  })

  it('uses "Unknown Center" when name is empty', () => {
    const centers = [
      makeCenter({ centerID: '1', name: '', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.centersToMapPoints(centers)
    expect(result[0].name).toBe('Unknown Center')
  })
})

describe('eventsToMapPoints', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('converts events with lat/lng to map points', () => {
    const events = [
      makeEvent({ eventID: 'e1', title: 'Ev1', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.eventsToMapPoints(events)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ id: 'e1', type: 'event', name: 'Ev1', latitude: 37.0, longitude: -122.0 })
  })

  it('keeps entries with lat/lng=0 (valid coordinates)', () => {
    const events = [
      makeEvent({ eventID: 'e1', title: 'Ev1', latitude: 0, longitude: -122.0 }),
      makeEvent({ eventID: 'e2', title: 'Ev2', latitude: 37.0, longitude: 0 }),
    ]
    const result = api.eventsToMapPoints(events)
    expect(result).toHaveLength(2)
  })

  it('uses description as fallback when title is empty', () => {
    const events = [
      makeEvent({ eventID: 'e1', description: 'Desc', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.eventsToMapPoints(events)
    expect(result[0].name).toBe('Desc')
  })

  it('uses "Event" when both title and description are empty', () => {
    const events = [
      makeEvent({ eventID: 'e1', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.eventsToMapPoints(events)
    expect(result[0].name).toBe('Event')
  })
})

describe('centersToDiscoverCenters', () => {
  let api: typeof import('../../utils/api')

  beforeEach(async () => {
    ;(globalThis as any).__DEV__ = true
    vi.resetModules()
    vi.doMock('react-native', () => ({
      Platform: { OS: 'web', select: (obj: any) => obj.web ?? obj.default },
    }))
    api = await import('../../utils/api')
  })

  it('transforms centers to DiscoverCenter format', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0, address: '123 St', memberCount: 10, isVerified: true }),
    ]
    const result = api.centersToDiscoverCenters(centers)
    expect(result).toEqual([
      { id: '1', name: 'A', address: '123 St', latitude: 37.0, longitude: -122.0, memberCount: 10, image: null },
    ])
  })

  it('keeps entries with lat/lng=0 (valid coordinates)', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 0, longitude: -122.0, memberCount: 10, isVerified: true }),
      makeCenter({ centerID: '2', name: 'B', latitude: 37.0, longitude: -122.0, memberCount: 5, isVerified: false }),
    ]
    const result = api.centersToDiscoverCenters(centers)
    expect(result).toHaveLength(2)
  })

  it('converts null address to undefined', () => {
    const centers = [
      makeCenter({ centerID: '1', name: 'A', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.centersToDiscoverCenters(centers)
    expect(result[0].address).toBeUndefined()
  })

  it('uses "Unknown Center" for empty name', () => {
    const centers = [
      makeCenter({ centerID: '1', name: '', latitude: 37.0, longitude: -122.0 }),
    ]
    const result = api.centersToDiscoverCenters(centers)
    expect(result[0].name).toBe('Unknown Center')
  })
})

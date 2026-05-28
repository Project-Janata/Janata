/**
 * types.test.ts — Unit tests for serialization helpers
 */
import { describe, it, expect } from 'vitest'
import {
  userRowToApi,
  centerRowToApi,
  eventRowToApi,
  sanitizeUser,
} from '../types'
import type { UserRow, CenterRow, EventRow } from '../types'

// ── Fixtures ──────────────────────────────────────────────────────────

const mockUserRow: UserRow = {
  id: 'u-1',
  username: 'testuser',
  password: 'hashed-password',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  date_of_birth: '2000-01-01',
  phone_number: '+1234567890',
  profile_image: 'https://img.example.com/pic.jpg',
  bio: null,
  center_id: 'c-1',
  points: 100,
  is_verified: 1,
  verification_level: 54,
  is_active: 1,
  profile_complete: 1,
  interests: '["yoga","vedanta"]',
  invite_code: null,
  email_verified_at: null,
  // Minimal profile fields (#210)
  school: 'UC Berkeley',
  work: 'Software Engineer',
  region: 'San Francisco Bay Area',
  looking_for: '["Mentorship","Study partner"]',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

const mockCenterRow: CenterRow = {
  id: 'c-1',
  name: 'Chinmaya Mission San Jose',
  latitude: 37.2431,
  longitude: -121.7831,
  address: '2485 Calle San Lorenzo, San Jose, CA',
  member_count: 320,
  is_verified: 1,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

const mockEventRow: EventRow = {
  id: 'e-1',
  title: 'Bhagavad Gita Study',
  description: 'Chapter 12 study circle',
  date: '2025-03-15T10:30:00Z',
  latitude: 37.2631,
  longitude: -121.8031,
  address: '10160 Clayton Rd, San Jose, CA',
  center_id: 'c-1',
  tier: 5,
  people_attending: 14,
  point_of_contact: 'Ramesh Ji',
  image: 'https://img.example.com/event.jpg',
  category: 91,
  is_official: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('userRowToApi', () => {
  it('converts snake_case UserRow to camelCase API response', () => {
    const api = userRowToApi(mockUserRow)

    expect(api.id).toBe('u-1')
    expect(api.username).toBe('testuser')
    expect(api.firstName).toBe('Test')
    expect(api.lastName).toBe('User')
    expect(api.email).toBe('test@example.com')
    expect(api.dateOfBirth).toBe('2000-01-01')
    expect(api.phoneNumber).toBe('+1234567890')
    expect(api.profileImage).toBe('https://img.example.com/pic.jpg')
    expect(api.centerID).toBe('c-1')
    expect(api.points).toBe(100)
    expect(api.verificationLevel).toBe(54)
    expect(api.createdAt).toBe('2025-01-01T00:00:00Z')
    expect(api.updatedAt).toBe('2025-06-01T00:00:00Z')
  })

  it('converts integer booleans to actual booleans', () => {
    const api = userRowToApi(mockUserRow)
    expect(api.isVerified).toBe(true)
    expect(api.isActive).toBe(true)
    expect(api.profileComplete).toBe(true)
  })

  it('converts integer booleans to false; derives isVerified from verification_level', () => {
    // isVerified is now derived from verification_level >= NORMAL_USER (45),
    // not the legacy is_verified column. Use UNVERIFIED_USER (30) here.
    const row = {
      ...mockUserRow,
      is_verified: 0,
      is_active: 0,
      profile_complete: 0,
      verification_level: 30,
    }
    const api = userRowToApi(row)
    expect(api.isVerified).toBe(false)
    expect(api.isActive).toBe(false)
    expect(api.profileComplete).toBe(false)
  })

  it('parses JSON interests string into array', () => {
    const api = userRowToApi(mockUserRow)
    expect(api.interests).toEqual(['yoga', 'vedanta'])
  })

  it('returns null for null interests', () => {
    const row = { ...mockUserRow, interests: null }
    const api = userRowToApi(row)
    expect(api.interests).toBeNull()
  })

  it('does NOT include the password field', () => {
    const api = userRowToApi(mockUserRow)
    expect('password' in api).toBe(false)
  })

  it('handles null optional fields', () => {
    const row: UserRow = {
      ...mockUserRow,
      email: null,
      date_of_birth: null,
      phone_number: null,
      profile_image: null,
      center_id: null,
    }
    const api = userRowToApi(row)
    expect(api.email).toBeNull()
    expect(api.dateOfBirth).toBeNull()
    expect(api.phoneNumber).toBeNull()
    expect(api.profileImage).toBeNull()
    expect(api.centerID).toBeNull()
  })

  it('surfaces minimal profile fields (#210)', () => {
    const api = userRowToApi(mockUserRow)
    expect(api.school).toBe('UC Berkeley')
    expect(api.work).toBe('Software Engineer')
    expect(api.region).toBe('San Francisco Bay Area')
    expect(api.lookingFor).toEqual(['Mentorship', 'Study partner'])
  })

  it('returns null for unset minimal profile fields', () => {
    const row: UserRow = {
      ...mockUserRow,
      school: null,
      work: null,
      region: null,
      looking_for: null,
    }
    const api = userRowToApi(row)
    expect(api.school).toBeNull()
    expect(api.work).toBeNull()
    expect(api.region).toBeNull()
    expect(api.lookingFor).toBeNull()
  })
})

describe('centerRowToApi', () => {
  it('converts snake_case CenterRow to camelCase API response', () => {
    const api = centerRowToApi(mockCenterRow)

    expect(api.centerID).toBe('c-1')
    expect(api.name).toBe('Chinmaya Mission San Jose')
    expect(api.latitude).toBe(37.2431)
    expect(api.longitude).toBe(-121.7831)
    expect(api.address).toBe('2485 Calle San Lorenzo, San Jose, CA')
    expect(api.memberCount).toBe(320)
    expect(api.isVerified).toBe(true)
    expect(api.createdAt).toBe('2025-01-01T00:00:00Z')
    expect(api.updatedAt).toBe('2025-06-01T00:00:00Z')
  })

  it('converts is_verified=0 to false', () => {
    const row = { ...mockCenterRow, is_verified: 0 }
    const api = centerRowToApi(row)
    expect(api.isVerified).toBe(false)
  })

  it('handles null address', () => {
    const row = { ...mockCenterRow, address: null }
    const api = centerRowToApi(row)
    expect(api.address).toBeNull()
  })
})

describe('eventRowToApi', () => {
  it('converts snake_case EventRow to camelCase API response', () => {
    const api = eventRowToApi(mockEventRow)

    expect(api.eventID).toBe('e-1')
    expect(api.title).toBe('Bhagavad Gita Study')
    expect(api.description).toBe('Chapter 12 study circle')
    expect(api.date).toBe('2025-03-15T10:30:00Z')
    expect(api.latitude).toBe(37.2631)
    expect(api.longitude).toBe(-121.8031)
    expect(api.address).toBe('10160 Clayton Rd, San Jose, CA')
    expect(api.centerID).toBe('c-1')
    expect(api.tier).toBe(5)
    expect(api.peopleAttending).toBe(14)
    expect(api.pointOfContact).toBe('Ramesh Ji')
    expect(api.image).toBe('https://img.example.com/event.jpg')
    expect(api.category).toBe(91)
  })

  it('handles null optional fields', () => {
    const row: EventRow = {
      ...mockEventRow,
      address: null,
      center_id: null,
      point_of_contact: null,
      image: null,
      category: null,
    }
    const api = eventRowToApi(row)
    expect(api.address).toBeNull()
    expect(api.centerID).toBeNull()
    expect(api.pointOfContact).toBeNull()
    expect(api.image).toBeNull()
    expect(api.category).toBeNull()
  })
})

describe('sanitizeUser', () => {
  it('removes the password field from UserRow', () => {
    const safe = sanitizeUser(mockUserRow)
    expect('password' in safe).toBe(false)
  })

  it('preserves all other fields', () => {
    const safe = sanitizeUser(mockUserRow)
    expect(safe.id).toBe('u-1')
    expect(safe.username).toBe('testuser')
    expect(safe.first_name).toBe('Test')
    expect(safe.last_name).toBe('User')
    expect(safe.email).toBe('test@example.com')
    expect(safe.points).toBe(100)
  })
})

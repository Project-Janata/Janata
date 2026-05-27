/**
 * db.test.ts — Integration tests for D1 database access layer
 *
 * Uses the Cloudflare Workers test pool with a local D1 instance.
 * Tests CRUD operations for users, centers, events, attendees, and endorsers.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { env } from 'cloudflare:test'
import { applyMigration, dropAllTables } from './setup'
import * as db from '../db'

// ── Reset the database before each test ──────────────────────────────

beforeEach(async () => {
  await dropAllTables()
  await applyMigration()
})

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════

describe('users', () => {
  const testUser = {
    id: 'u-1',
    username: 'testuser',
    password: 'hashedpassword123',
  }

  describe('createUser', () => {
    it('creates a user successfully', async () => {
      const result = await db.createUser(env.DB, testUser)
      expect(result.success).toBe(true)
      expect(result.id).toBe('u-1')
    })

    it('lowercases the username on insert', async () => {
      await db.createUser(env.DB, { ...testUser, username: 'TestUser' })
      const user = await db.getUserByUsername(env.DB, 'testuser')
      expect(user).not.toBeNull()
      expect(user!.username).toBe('testuser')
    })

    it('returns error for duplicate username', async () => {
      await db.createUser(env.DB, testUser)
      const result = await db.createUser(env.DB, {
        ...testUser,
        id: 'u-2',
      })
      expect(result.success).toBe(false)
      expect(result.error).toBe('User already exists')
    })

    it('sets default values for optional fields', async () => {
      await db.createUser(env.DB, testUser)
      const user = await db.getUserById(env.DB, 'u-1')
      expect(user).not.toBeNull()
      expect(user!.first_name).toBe('')
      expect(user!.last_name).toBe('')
      expect(user!.points).toBe(0)
      expect(user!.is_verified).toBe(0)
      expect(user!.verification_level).toBe(45)
      expect(user!.is_active).toBe(0)
      expect(user!.profile_complete).toBe(0)
      expect(user!.email).toBeNull()
      expect(user!.center_id).toBeNull()
    })
  })

  describe('getUserByUsername', () => {
    it('returns user when found', async () => {
      await db.createUser(env.DB, testUser)
      const user = await db.getUserByUsername(env.DB, 'testuser')
      expect(user).not.toBeNull()
      expect(user!.id).toBe('u-1')
    })

    it('is case-insensitive', async () => {
      await db.createUser(env.DB, testUser)
      const user = await db.getUserByUsername(env.DB, 'TESTUSER')
      expect(user).not.toBeNull()
    })

    it('returns null when user not found', async () => {
      const user = await db.getUserByUsername(env.DB, 'nonexistent')
      expect(user).toBeNull()
    })
  })

  describe('getUserById', () => {
    it('returns user when found', async () => {
      await db.createUser(env.DB, testUser)
      const user = await db.getUserById(env.DB, 'u-1')
      expect(user).not.toBeNull()
      expect(user!.username).toBe('testuser')
    })

    it('returns null when user not found', async () => {
      const user = await db.getUserById(env.DB, 'nonexistent')
      expect(user).toBeNull()
    })
  })

  describe('updateUser', () => {
    it('updates user fields', async () => {
      await db.createUser(env.DB, testUser)
      const result = await db.updateUser(env.DB, 'u-1', {
        first_name: 'Rama',
        last_name: 'Krishna',
        email: 'rama@example.com',
      })
      expect(result.success).toBe(true)

      const user = await db.getUserById(env.DB, 'u-1')
      expect(user!.first_name).toBe('Rama')
      expect(user!.last_name).toBe('Krishna')
      expect(user!.email).toBe('rama@example.com')
    })

    it('updates updated_at timestamp', async () => {
      await db.createUser(env.DB, testUser)
      const before = await db.getUserById(env.DB, 'u-1')

      // Small delay to ensure timestamp difference
      await new Promise((r) => setTimeout(r, 10))

      await db.updateUser(env.DB, 'u-1', { first_name: 'Updated' })
      const after = await db.getUserById(env.DB, 'u-1')

      expect(after!.updated_at).not.toBe(before!.updated_at)
    })

    it('returns success with no-op for empty updates', async () => {
      await db.createUser(env.DB, testUser)
      const result = await db.updateUser(env.DB, 'u-1', {})
      expect(result.success).toBe(true)
    })
  })

  describe('deleteUser', () => {
    it('deletes a user', async () => {
      await db.createUser(env.DB, testUser)
      const result = await db.deleteUser(env.DB, 'u-1')
      expect(result.success).toBe(true)

      const user = await db.getUserById(env.DB, 'u-1')
      expect(user).toBeNull()
    })

    it('succeeds even if user does not exist (no-op)', async () => {
      const result = await db.deleteUser(env.DB, 'nonexistent')
      expect(result.success).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// CENTERS
// ═══════════════════════════════════════════════════════════════════════

describe('centers', () => {
  const testCenter = {
    id: 'c-1',
    name: 'Chinmaya Mission San Jose',
    latitude: 37.2431,
    longitude: -121.7831,
  }

  describe('createCenter', () => {
    it('creates a center successfully', async () => {
      const result = await db.createCenter(env.DB, testCenter)
      expect(result.success).toBe(true)
      expect(result.centerID).toBe('c-1')
    })

    it('sets default values', async () => {
      await db.createCenter(env.DB, testCenter)
      const center = await db.getCenterById(env.DB, 'c-1')
      expect(center).not.toBeNull()
      expect(center!.member_count).toBe(0)
      expect(center!.is_verified).toBe(0)
      expect(center!.address).toBeNull()
    })
  })

  describe('getCenterById', () => {
    it('returns center when found', async () => {
      await db.createCenter(env.DB, testCenter)
      const center = await db.getCenterById(env.DB, 'c-1')
      expect(center).not.toBeNull()
      expect(center!.name).toBe('Chinmaya Mission San Jose')
    })

    it('returns null when not found', async () => {
      const center = await db.getCenterById(env.DB, 'nonexistent')
      expect(center).toBeNull()
    })
  })

  describe('getAllCenters', () => {
    it('returns empty array when no centers', async () => {
      const centers = await db.getAllCenters(env.DB)
      expect(centers).toEqual([])
    })

    it('returns all centers ordered by name', async () => {
      await db.createCenter(env.DB, { ...testCenter, id: 'c-1', name: 'Zebra Center' })
      await db.createCenter(env.DB, { ...testCenter, id: 'c-2', name: 'Alpha Center' })
      await db.createCenter(env.DB, { ...testCenter, id: 'c-3', name: 'Middle Center' })

      const centers = await db.getAllCenters(env.DB)
      expect(centers).toHaveLength(3)
      expect(centers[0].name).toBe('Alpha Center')
      expect(centers[1].name).toBe('Middle Center')
      expect(centers[2].name).toBe('Zebra Center')
    })
  })

  describe('getCentersPaginated (#107)', () => {
    beforeEach(async () => {
      // Seed 5 centers with predictable names so pagination is deterministic.
      for (let i = 0; i < 5; i++) {
        await db.createCenter(env.DB, {
          ...testCenter,
          id: `c-${i}`,
          name: `Center ${String.fromCharCode(65 + i)}`, // A..E
        })
      }
    })

    it('returns first page with total count', async () => {
      const { data, total } = await db.getCentersPaginated(env.DB, 2, 0)
      expect(total).toBe(5)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Center A')
      expect(data[1].name).toBe('Center B')
    })

    it('returns second page', async () => {
      const { data, total } = await db.getCentersPaginated(env.DB, 2, 2)
      expect(total).toBe(5)
      expect(data).toHaveLength(2)
      expect(data[0].name).toBe('Center C')
      expect(data[1].name).toBe('Center D')
    })

    it('returns partial last page', async () => {
      const { data, total } = await db.getCentersPaginated(env.DB, 2, 4)
      expect(total).toBe(5)
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe('Center E')
    })

    it('clamps limit to [1, 200]', async () => {
      const zero = await db.getCentersPaginated(env.DB, 0, 0)
      expect(zero.data).toHaveLength(1) // clamped to limit=1
      // Limit > total just returns whatever's there
      const big = await db.getCentersPaginated(env.DB, 9999, 0)
      expect(big.data).toHaveLength(5)
      expect(big.total).toBe(5)
    })

    it('clamps negative offset to 0', async () => {
      const { data } = await db.getCentersPaginated(env.DB, 3, -10)
      expect(data).toHaveLength(3)
      expect(data[0].name).toBe('Center A')
    })
  })

  describe('updateCenter', () => {
    it('updates center fields', async () => {
      await db.createCenter(env.DB, testCenter)
      const result = await db.updateCenter(env.DB, 'c-1', {
        is_verified: 1,
        member_count: 100,
      })
      expect(result.success).toBe(true)

      const center = await db.getCenterById(env.DB, 'c-1')
      expect(center!.is_verified).toBe(1)
      expect(center!.member_count).toBe(100)
    })
  })

  describe('deleteCenter', () => {
    it('deletes a center', async () => {
      await db.createCenter(env.DB, testCenter)
      const result = await db.deleteCenter(env.DB, 'c-1')
      expect(result.success).toBe(true)

      const center = await db.getCenterById(env.DB, 'c-1')
      expect(center).toBeNull()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════

describe('events', () => {
  const testCenter = {
    id: 'c-1',
    name: 'Test Center',
    latitude: 37.0,
    longitude: -121.0,
  }

  const testEvent = {
    id: 'e-1',
    title: 'Gita Study',
    date: '2025-03-15T10:00:00Z',
    latitude: 37.1,
    longitude: -121.1,
    center_id: 'c-1',
  }

  beforeEach(async () => {
    // Create center first (FK constraint)
    await db.createCenter(env.DB, testCenter)
  })

  describe('createEvent', () => {
    it('creates an event successfully', async () => {
      const result = await db.createEvent(env.DB, testEvent)
      expect(result.success).toBe(true)
      expect(result.eventID).toBe('e-1')
    })

    it('sets default values', async () => {
      await db.createEvent(env.DB, testEvent)
      const event = await db.getEventById(env.DB, 'e-1')
      expect(event).not.toBeNull()
      expect(event!.tier).toBe(0)
      expect(event!.people_attending).toBe(0)
      expect(event!.description).toBe('')
    })
  })

  describe('getEventById', () => {
    it('returns event when found', async () => {
      await db.createEvent(env.DB, testEvent)
      const event = await db.getEventById(env.DB, 'e-1')
      expect(event).not.toBeNull()
      expect(event!.title).toBe('Gita Study')
    })

    it('returns null when not found', async () => {
      const event = await db.getEventById(env.DB, 'nonexistent')
      expect(event).toBeNull()
    })
  })

  describe('getAllEvents', () => {
    it('returns all events ordered by date DESC', async () => {
      await db.createEvent(env.DB, { ...testEvent, id: 'e-1', date: '2025-01-01T00:00:00Z' })
      await db.createEvent(env.DB, { ...testEvent, id: 'e-2', date: '2025-06-01T00:00:00Z' })
      await db.createEvent(env.DB, { ...testEvent, id: 'e-3', date: '2025-03-01T00:00:00Z' })

      const events = await db.getAllEvents(env.DB)
      expect(events).toHaveLength(3)
      expect(events[0].date).toBe('2025-06-01T00:00:00Z')
      expect(events[1].date).toBe('2025-03-01T00:00:00Z')
      expect(events[2].date).toBe('2025-01-01T00:00:00Z')
    })
  })

  describe('getEventsPaginated (#107)', () => {
    beforeEach(async () => {
      // Seed 4 events with descending dates; date DESC means e-4 first.
      for (let i = 1; i <= 4; i++) {
        await db.createEvent(env.DB, {
          ...testEvent,
          id: `e-${i}`,
          date: `2025-0${i}-01T00:00:00Z`,
        })
      }
    })

    it('returns first page with total count, newest first', async () => {
      const { data, total } = await db.getEventsPaginated(env.DB, 2, 0)
      expect(total).toBe(4)
      expect(data).toHaveLength(2)
      expect(data[0].id).toBe('e-4')
      expect(data[1].id).toBe('e-3')
    })

    it('returns subsequent page', async () => {
      const { data, total } = await db.getEventsPaginated(env.DB, 2, 2)
      expect(total).toBe(4)
      expect(data).toHaveLength(2)
      expect(data[0].id).toBe('e-2')
      expect(data[1].id).toBe('e-1')
    })

    it('clamps limit and offset', async () => {
      const zero = await db.getEventsPaginated(env.DB, 0, 0)
      expect(zero.data.length).toBe(1)
      const neg = await db.getEventsPaginated(env.DB, 4, -5)
      expect(neg.data).toHaveLength(4)
    })
  })

  describe('getEventsByCenterId', () => {
    it('returns events for a specific center', async () => {
      await db.createCenter(env.DB, { ...testCenter, id: 'c-2', name: 'Other Center' })
      await db.createEvent(env.DB, { ...testEvent, id: 'e-1', center_id: 'c-1' })
      await db.createEvent(env.DB, { ...testEvent, id: 'e-2', center_id: 'c-2' })
      await db.createEvent(env.DB, { ...testEvent, id: 'e-3', center_id: 'c-1' })

      const events = await db.getEventsByCenterId(env.DB, 'c-1')
      expect(events).toHaveLength(2)
      expect(events.every((e) => e.center_id === 'c-1')).toBe(true)
    })

    it('returns empty array for center with no events', async () => {
      const events = await db.getEventsByCenterId(env.DB, 'c-1')
      expect(events).toEqual([])
    })
  })

  describe('updateEvent', () => {
    it('updates event fields', async () => {
      await db.createEvent(env.DB, testEvent)
      const result = await db.updateEvent(env.DB, 'e-1', {
        title: 'Updated Title',
        tier: 5,
      })
      expect(result.success).toBe(true)

      const event = await db.getEventById(env.DB, 'e-1')
      expect(event!.title).toBe('Updated Title')
      expect(event!.tier).toBe(5)
    })
  })

  describe('deleteEvent', () => {
    it('deletes an event', async () => {
      await db.createEvent(env.DB, testEvent)
      const result = await db.deleteEvent(env.DB, 'e-1')
      expect(result.success).toBe(true)

      const event = await db.getEventById(env.DB, 'e-1')
      expect(event).toBeNull()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// EVENT ATTENDEES
// ═══════════════════════════════════════════════════════════════════════

describe('event attendees', () => {
  beforeEach(async () => {
    await db.createCenter(env.DB, { id: 'c-1', name: 'Center', latitude: 0, longitude: 0 })
    await db.createUser(env.DB, { id: 'u-1', username: 'user1', password: 'pass' })
    await db.createUser(env.DB, { id: 'u-2', username: 'user2', password: 'pass' })
    await db.createEvent(env.DB, {
      id: 'e-1',
      title: 'Event',
      date: '2025-03-15T10:00:00Z',
      latitude: 0,
      longitude: 0,
      center_id: 'c-1',
    })
  })

  describe('addEventAttendee', () => {
    it('adds a user as an attendee', async () => {
      const result = await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      expect(result.success).toBe(true)
    })

    it('updates people_attending count on the event', async () => {
      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      const event = await db.getEventById(env.DB, 'e-1')
      expect(event!.people_attending).toBe(1)

      await db.addEventAttendee(env.DB, 'e-1', 'u-2')
      const event2 = await db.getEventById(env.DB, 'e-1')
      expect(event2!.people_attending).toBe(2)
    })

    it('does not duplicate attendee (INSERT OR IGNORE)', async () => {
      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      await db.addEventAttendee(env.DB, 'e-1', 'u-1') // duplicate
      const event = await db.getEventById(env.DB, 'e-1')
      expect(event!.people_attending).toBe(1)
    })
  })

  describe('removeEventAttendee', () => {
    it('removes an attendee and updates count', async () => {
      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      await db.addEventAttendee(env.DB, 'e-1', 'u-2')

      await db.removeEventAttendee(env.DB, 'e-1', 'u-1')
      const event = await db.getEventById(env.DB, 'e-1')
      expect(event!.people_attending).toBe(1)
    })
  })

  describe('isUserAttending', () => {
    it('returns true when user is attending', async () => {
      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      const result = await db.isUserAttending(env.DB, 'e-1', 'u-1')
      expect(result).toBe(true)
    })

    it('returns false when user is not attending', async () => {
      const result = await db.isUserAttending(env.DB, 'e-1', 'u-1')
      expect(result).toBe(false)
    })
  })

  describe('getEventAttendees', () => {
    it('returns list of attending users', async () => {
      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      await db.addEventAttendee(env.DB, 'e-1', 'u-2')

      const attendees = await db.getEventAttendees(env.DB, 'e-1')
      expect(attendees).toHaveLength(2)
      expect(attendees.map((a) => a.id).sort()).toEqual(['u-1', 'u-2'])
    })

    it('returns empty array for event with no attendees', async () => {
      const attendees = await db.getEventAttendees(env.DB, 'e-1')
      expect(attendees).toEqual([])
    })
  })

  describe('getUserEvents', () => {
    it('returns events a user is attending', async () => {
      await db.createEvent(env.DB, {
        id: 'e-2',
        title: 'Event 2',
        date: '2025-04-01T10:00:00Z',
        latitude: 0,
        longitude: 0,
        center_id: 'c-1',
      })

      await db.addEventAttendee(env.DB, 'e-1', 'u-1')
      await db.addEventAttendee(env.DB, 'e-2', 'u-1')

      const events = await db.getUserEvents(env.DB, 'u-1')
      expect(events).toHaveLength(2)
    })

    it('returns empty array when user attends no events', async () => {
      const events = await db.getUserEvents(env.DB, 'u-1')
      expect(events).toEqual([])
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// EVENT ENDORSERS
// ═══════════════════════════════════════════════════════════════════════

describe('event endorsers', () => {
  beforeEach(async () => {
    await db.createCenter(env.DB, { id: 'c-1', name: 'Center', latitude: 0, longitude: 0 })
    await db.createUser(env.DB, { id: 'u-1', username: 'sevak', password: 'pass' })
    await db.createEvent(env.DB, {
      id: 'e-1',
      title: 'Event',
      date: '2025-03-15T10:00:00Z',
      latitude: 0,
      longitude: 0,
      center_id: 'c-1',
    })
  })

  describe('addEventEndorser', () => {
    it('adds an endorser successfully', async () => {
      const result = await db.addEventEndorser(env.DB, 'e-1', 'u-1')
      expect(result.success).toBe(true)
    })

    it('does not duplicate endorser (INSERT OR IGNORE)', async () => {
      await db.addEventEndorser(env.DB, 'e-1', 'u-1')
      const result = await db.addEventEndorser(env.DB, 'e-1', 'u-1')
      expect(result.success).toBe(true)

      const endorsers = await db.getEventEndorsers(env.DB, 'e-1')
      expect(endorsers).toHaveLength(1)
    })
  })

  describe('getEventEndorsers', () => {
    it('returns endorser user rows', async () => {
      await db.addEventEndorser(env.DB, 'e-1', 'u-1')
      const endorsers = await db.getEventEndorsers(env.DB, 'e-1')
      expect(endorsers).toHaveLength(1)
      expect(endorsers[0].id).toBe('u-1')
    })

    it('returns empty array for event with no endorsers', async () => {
      const endorsers = await db.getEventEndorsers(env.DB, 'e-1')
      expect(endorsers).toEqual([])
    })
  })
})

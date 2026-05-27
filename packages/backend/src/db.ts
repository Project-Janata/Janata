/**
 * db.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * D1 database access layer with typed query helpers.
 * All functions take a D1Database instance so the module is stateless
 * and works naturally with CF Workers request-scoped bindings.
 */
import type {
  UserRow,
  CenterRow,
  EventRow,
  EventAttendeeRow,
  EventEndorserRow,
  BoardRow,
  BoardPostRow,
  BoardReactionCount,
  BoardType,
} from './types'

// ═══════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════

export async function createUser(
  db: D1Database,
  user: Pick<UserRow, 'id' | 'username' | 'password'> & Partial<UserRow>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date().toISOString()
    await db
      .prepare(
        `INSERT INTO users (id, username, password, email, first_name, last_name,
          date_of_birth, phone_number, profile_image, bio, center_id, points,
          is_verified, verification_level, is_active, profile_complete,
          interests, invite_code, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)`,
      )
      .bind(
        user.id,
        user.username.toLowerCase(),
        user.password,
        user.email ?? null,
        user.first_name ?? '',
        user.last_name ?? '',
        user.date_of_birth ?? null,
        user.phone_number ?? null,
        user.profile_image ?? null,
        user.bio ?? null,
        user.center_id ?? null,
        user.points ?? 0,
        user.is_verified ?? 0,
        user.verification_level ?? 45,
        user.is_active ?? 0,
        user.profile_complete ?? 0,
        user.interests ?? null,
        user.invite_code ?? null,
        now,
        now,
      )
      .run()
    return { success: true, id: user.id }
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'User already exists' }
    }
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getUserByUsername(
  db: D1Database,
  username: string,
): Promise<UserRow | null> {
  const normalized = username.trim().toLowerCase()
  const result = await db
    .prepare('SELECT * FROM users WHERE username = ?1')
    .bind(normalized)
    .first<UserRow>()
  return result ?? null
}

export async function getUserById(
  db: D1Database,
  userId: string,
): Promise<UserRow | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?1')
    .bind(userId)
    .first<UserRow>()
  return result ?? null
}

export async function updateUser(
  db: D1Database,
  userId: string,
  updates: Partial<Omit<UserRow, 'id' | 'created_at'>>,
): Promise<{ success: boolean; error?: string }> {
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at')
  if (fields.length === 0) return { success: true }

  // Always update updated_at
  const allFields = [...fields, 'updated_at']
  const setClauses = allFields.map((f, i) => `${f} = ?${i + 2}`).join(', ')
  const values = [
    ...fields.map((f) => (updates as Record<string, any>)[f]),
    new Date().toISOString(),
  ]

  try {
    await db
      .prepare(`UPDATE users SET ${setClauses} WHERE id = ?1`)
      .bind(userId, ...values)
      .run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function deleteUser(
  db: D1Database,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.prepare('DELETE FROM users WHERE id = ?1').bind(userId).run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function countUsers(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
  return result?.count ?? 0
}

export async function listUsers(
  db: D1Database,
  opts: { q?: string; limit: number; offset: number },
): Promise<{ data: UserRow[]; total: number }> {
  const { q, limit, offset } = opts
  if (q) {
    const pattern = `%${q}%`
    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM users WHERE username LIKE ?1 OR email LIKE ?1 OR first_name LIKE ?1 OR last_name LIKE ?1')
      .bind(pattern).first<{ count: number }>()
    const result = await db
      .prepare('SELECT * FROM users WHERE username LIKE ?1 OR email LIKE ?1 OR first_name LIKE ?1 OR last_name LIKE ?1 ORDER BY created_at DESC LIMIT ?2 OFFSET ?3')
      .bind(pattern, limit, offset).all<UserRow>()
    return { data: result.results ?? [], total: countResult?.count ?? 0 }
  }
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
  const result = await db.prepare('SELECT * FROM users ORDER BY created_at DESC LIMIT ?1 OFFSET ?2').bind(limit, offset).all<UserRow>()
  return { data: result.results ?? [], total: countResult?.count ?? 0 }
}

// ═══════════════════════════════════════════════════════════════════════
// CENTERS
// ═══════════════════════════════════════════════════════════════════════

export async function createCenter(
  db: D1Database,
  center: Pick<CenterRow, 'id' | 'name' | 'latitude' | 'longitude'> & Partial<CenterRow>,
): Promise<{ success: boolean; centerID?: string; error?: string }> {
  try {
    const now = new Date().toISOString()
    await db
      .prepare(
        `INSERT INTO centers (id, name, latitude, longitude, address, website, phone, image, acharya, point_of_contact, member_count, is_verified, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
      )
      .bind(
        center.id,
        center.name,
        center.latitude,
        center.longitude,
        center.address ?? null,
        center.website ?? null,
        center.phone ?? null,
        center.image ?? null,
        center.acharya ?? null,
        center.point_of_contact ?? null,
        center.member_count ?? 0,
        center.is_verified ?? 0,
        now,
        now,
      )
      .run()
    return { success: true, centerID: center.id }
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE constraint failed')) {
      return { success: false, error: 'Center already exists' }
    }
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getCenterById(
  db: D1Database,
  centerId: string,
): Promise<CenterRow | null> {
  const result = await db
    .prepare('SELECT * FROM centers WHERE id = ?1')
    .bind(centerId)
    .first<CenterRow>()
  return result ?? null
}

export async function getAllCenters(db: D1Database): Promise<CenterRow[]> {
  const result = await db.prepare('SELECT * FROM centers ORDER BY name').all<CenterRow>()
  return result.results ?? []
}

/**
 * Paginated centers fetch (#107). Returns the page of results plus the
 * grand total so the caller can render "showing N of M" + know when to
 * stop requesting more pages.
 *
 * `limit` is clamped to [1, 200] to bound worker CPU + response size.
 * `offset` is clamped to non-negative integers.
 */
export async function getCentersPaginated(
  db: D1Database,
  limit: number,
  offset: number,
): Promise<{ data: CenterRow[]; total: number }> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
  const safeOffset = Math.max(0, Math.floor(offset))
  const [page, countResult] = await Promise.all([
    db.prepare('SELECT * FROM centers ORDER BY name LIMIT ?1 OFFSET ?2')
      .bind(safeLimit, safeOffset)
      .all<CenterRow>(),
    db.prepare('SELECT COUNT(*) as count FROM centers').first<{ count: number }>(),
  ])
  return { data: page.results ?? [], total: countResult?.count ?? 0 }
}

export async function updateCenter(
  db: D1Database,
  centerId: string,
  updates: Partial<Omit<CenterRow, 'id' | 'created_at'>>,
): Promise<{ success: boolean; error?: string }> {
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at')
  if (fields.length === 0) return { success: true }

  const allFields = [...fields, 'updated_at']
  const setClauses = allFields.map((f, i) => `${f} = ?${i + 2}`).join(', ')
  const values = [
    ...fields.map((f) => (updates as Record<string, any>)[f]),
    new Date().toISOString(),
  ]

  try {
    await db
      .prepare(`UPDATE centers SET ${setClauses} WHERE id = ?1`)
      .bind(centerId, ...values)
      .run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function deleteCenter(
  db: D1Database,
  centerId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.prepare('DELETE FROM centers WHERE id = ?1').bind(centerId).run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getCenterMembers(
  db: D1Database,
  centerId: string,
): Promise<UserRow[]> {
  const result = await db
    .prepare('SELECT * FROM users WHERE center_id = ?1 ORDER BY created_at DESC')
    .bind(centerId)
    .all<UserRow>()
  return result.results ?? []
}

export async function countCenters(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM centers').first<{ count: number }>()
  return result?.count ?? 0
}

export async function listCenters(
  db: D1Database,
  opts: { q?: string; limit: number; offset: number },
): Promise<{ data: CenterRow[]; total: number }> {
  const { q, limit, offset } = opts
  if (q) {
    const pattern = `%${q}%`
    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM centers WHERE name LIKE ?1 OR address LIKE ?1 OR acharya LIKE ?1 OR point_of_contact LIKE ?1')
      .bind(pattern).first<{ count: number }>()
    const result = await db
      .prepare('SELECT * FROM centers WHERE name LIKE ?1 OR address LIKE ?1 OR acharya LIKE ?1 OR point_of_contact LIKE ?1 ORDER BY name ASC LIMIT ?2 OFFSET ?3')
      .bind(pattern, limit, offset).all<CenterRow>()
    return { data: result.results ?? [], total: countResult?.count ?? 0 }
  }
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM centers').first<{ count: number }>()
  const result = await db.prepare('SELECT * FROM centers ORDER BY name ASC LIMIT ?1 OFFSET ?2').bind(limit, offset).all<CenterRow>()
  return { data: result.results ?? [], total: countResult?.count ?? 0 }
}

// ═══════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════

export async function createEvent(
  db: D1Database,
  event: Pick<EventRow, 'id' | 'title' | 'date' | 'latitude' | 'longitude'> &
    Partial<EventRow>,
): Promise<{ success: boolean; eventID?: string; error?: string }> {
  try {
    const now = new Date().toISOString()
    await db
      .prepare(
        `INSERT INTO events (id, title, description, date, latitude, longitude, address,
          center_id, tier, people_attending, point_of_contact, image, category,
          external_url, signup_url, allow_janata_signup, is_official,
          created_by, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20)`,
      )
      .bind(
        event.id,
        event.title ?? '',
        event.description ?? '',
        event.date,
        event.latitude,
        event.longitude,
        event.address ?? null,
        event.center_id ?? null,
        event.tier ?? 0,
        event.people_attending ?? 0,
        event.point_of_contact ?? null,
        event.image ?? null,
        event.category ?? null,
        event.external_url ?? null,
        event.signup_url ?? null,
        event.allow_janata_signup ?? 0,
        event.is_official ?? 0,
        event.created_by ?? null,
        now,
        now,
      )
      .run()
    return { success: true, eventID: event.id }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getEventById(
  db: D1Database,
  eventId: string,
): Promise<EventRow | null> {
  const result = await db
    .prepare('SELECT * FROM events WHERE id = ?1')
    .bind(eventId)
    .first<EventRow>()
  return result ?? null
}

export async function getAllEvents(db: D1Database): Promise<EventRow[]> {
  const result = await db
    .prepare('SELECT * FROM events ORDER BY date DESC')
    .all<EventRow>()
  return result.results ?? []
}

/**
 * Paginated events fetch (#107). Mirrors getCentersPaginated. Sort order
 * is date DESC so the newest/upcoming events naturally land on page 1.
 */
export async function getEventsPaginated(
  db: D1Database,
  limit: number,
  offset: number,
): Promise<{ data: EventRow[]; total: number }> {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)))
  const safeOffset = Math.max(0, Math.floor(offset))
  const [page, countResult] = await Promise.all([
    db.prepare('SELECT * FROM events ORDER BY date DESC LIMIT ?1 OFFSET ?2')
      .bind(safeLimit, safeOffset)
      .all<EventRow>(),
    db.prepare('SELECT COUNT(*) as count FROM events').first<{ count: number }>(),
  ])
  return { data: page.results ?? [], total: countResult?.count ?? 0 }
}

export async function getEventsByCenterId(
  db: D1Database,
  centerId: string,
): Promise<EventRow[]> {
  const result = await db
    .prepare('SELECT * FROM events WHERE center_id = ?1 ORDER BY date DESC')
    .bind(centerId)
    .all<EventRow>()
  return result.results ?? []
}

export async function updateEvent(
  db: D1Database,
  eventId: string,
  updates: Partial<Omit<EventRow, 'id' | 'created_at'>>,
): Promise<{ success: boolean; error?: string }> {
  const fields = Object.keys(updates).filter((k) => k !== 'id' && k !== 'created_at')
  if (fields.length === 0) return { success: true }

  const allFields = [...fields, 'updated_at']
  const setClauses = allFields.map((f, i) => `${f} = ?${i + 2}`).join(', ')
  const values = [
    ...fields.map((f) => (updates as Record<string, any>)[f]),
    new Date().toISOString(),
  ]

  try {
    await db
      .prepare(`UPDATE events SET ${setClauses} WHERE id = ?1`)
      .bind(eventId, ...values)
      .run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function deleteEvent(
  db: D1Database,
  eventId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.prepare('DELETE FROM events WHERE id = ?1').bind(eventId).run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function countEvents(db: D1Database): Promise<number> {
  const result = await db.prepare('SELECT COUNT(*) as count FROM events').first<{ count: number }>()
  return result?.count ?? 0
}

export async function listEvents(
  db: D1Database,
  opts: { q?: string; limit: number; offset: number },
): Promise<{ data: EventRow[]; total: number }> {
  const { q, limit, offset } = opts
  if (q) {
    const pattern = `%${q}%`
    const countResult = await db
      .prepare('SELECT COUNT(*) as count FROM events WHERE title LIKE ?1 OR description LIKE ?1 OR address LIKE ?1')
      .bind(pattern).first<{ count: number }>()
    const result = await db
      .prepare('SELECT * FROM events WHERE title LIKE ?1 OR description LIKE ?1 OR address LIKE ?1 ORDER BY date DESC LIMIT ?2 OFFSET ?3')
      .bind(pattern, limit, offset).all<EventRow>()
    return { data: result.results ?? [], total: countResult?.count ?? 0 }
  }
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM events').first<{ count: number }>()
  const result = await db.prepare('SELECT * FROM events ORDER BY date DESC LIMIT ?1 OFFSET ?2').bind(limit, offset).all<EventRow>()
  return { data: result.results ?? [], total: countResult?.count ?? 0 }
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT ATTENDEES
// ═══════════════════════════════════════════════════════════════════════

/**
 * Create a guest RSVP (no account required) — #191.
 *
 * PRIMARY KEY (event_id, email) means re-RSVPing with the same email is
 * idempotent (INSERT OR IGNORE). Returns whether the row already existed.
 */
export async function createGuestRsvp(
  db: D1Database,
  eventId: string,
  email: string,
  name: string,
): Promise<{ success: boolean; alreadyRsvped?: boolean; error?: string }> {
  try {
    const result = await db
      .prepare(
        `INSERT OR IGNORE INTO event_guest_rsvps (event_id, email, name)
         VALUES (?1, ?2, ?3)`,
      )
      .bind(eventId, email.trim().toLowerCase(), name.trim())
      .run()
    return {
      success: true,
      alreadyRsvped: (result.meta?.changes ?? 0) === 0,
    }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

/**
 * Backfill guest RSVPs into the attendees table when a user's email is
 * verified for the first time — #191.
 *
 * For each guest RSVP matching the user's email that hasn't been upgraded,
 * (a) insert into event_attendees (idempotent via INSERT OR IGNORE),
 * (b) mark upgraded_user_id so we don't re-upgrade,
 * (c) refresh the people_attending count.
 *
 * Returns the count of upgraded RSVPs.
 */
export async function upgradeGuestRsvpsForUser(
  db: D1Database,
  userId: string,
  email: string,
): Promise<{ success: boolean; upgraded: number; error?: string }> {
  try {
    const normalized = email.trim().toLowerCase()
    const result = await db
      .prepare(
        `SELECT event_id FROM event_guest_rsvps
         WHERE email = ?1 AND upgraded_user_id IS NULL`,
      )
      .bind(normalized)
      .all<{ event_id: string }>()
    const eventIds = (result.results ?? []).map((r) => r.event_id)
    if (eventIds.length === 0) return { success: true, upgraded: 0 }

    const now = new Date().toISOString()
    for (const eventId of eventIds) {
      await db
        .prepare(
          'INSERT OR IGNORE INTO event_attendees (event_id, user_id, created_at) VALUES (?1, ?2, ?3)',
        )
        .bind(eventId, userId, now)
        .run()
      await db
        .prepare(
          'UPDATE event_guest_rsvps SET upgraded_user_id = ?1 WHERE event_id = ?2 AND email = ?3',
        )
        .bind(userId, eventId, normalized)
        .run()
      await db
        .prepare(
          `UPDATE events SET people_attending = (
            SELECT COUNT(*) FROM event_attendees WHERE event_id = ?1
          ), updated_at = ?2 WHERE id = ?1`,
        )
        .bind(eventId, now)
        .run()
    }
    return { success: true, upgraded: eventIds.length }
  } catch (err: any) {
    return { success: false, upgraded: 0, error: err?.message ?? 'Unknown error' }
  }
}

export async function addEventAttendee(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    // First ensure the record exists
    await db
      .prepare(
        'INSERT OR IGNORE INTO event_attendees (event_id, user_id, created_at) VALUES (?1, ?2, ?3)',
      )
      .bind(eventId, userId, now)
      .run()

    // Then update the count from the actual table
    await db
      .prepare(
        `UPDATE events SET people_attending = (
          SELECT COUNT(*) FROM event_attendees WHERE event_id = ?1
        ), updated_at = ?2 WHERE id = ?1`,
      )
      .bind(eventId, now)
      .run()

    // Wait briefly to ensure D1 consistency (optional, but safer in some environments)
    // Actually, in D1, consecutive await run() calls are sequential.

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function removeEventAttendee(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString()
    // First remove the record
    await db
      .prepare('DELETE FROM event_attendees WHERE event_id = ?1 AND user_id = ?2')
      .bind(eventId, userId)
      .run()

    // Then update the count from the actual table
    await db
      .prepare(
        `UPDATE events SET people_attending = (
          SELECT COUNT(*) FROM event_attendees WHERE event_id = ?1
        ), updated_at = ?2 WHERE id = ?1`,
      )
      .bind(eventId, now)
      .run()

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function isUserAttending(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      'SELECT 1 FROM event_attendees WHERE event_id = ?1 AND user_id = ?2',
    )
    .bind(eventId, userId)
    .first()
  return result !== null
}

export async function getEventAttendees(
  db: D1Database,
  eventId: string,
): Promise<UserRow[]> {
  const result = await db
    .prepare(
      `SELECT u.* FROM users u
       JOIN event_attendees ea ON ea.user_id = u.id
       WHERE ea.event_id = ?1
       ORDER BY ea.created_at DESC`,
    )
    .bind(eventId)
    .all<UserRow>()
  return result.results ?? []
}

export async function getUserEvents(
  db: D1Database,
  userId: string,
): Promise<EventRow[]> {
  const result = await db
    .prepare(
      `SELECT e.* FROM events e
       JOIN event_attendees ea ON ea.event_id = e.id
       WHERE ea.user_id = ?1
       ORDER BY e.date DESC`,
    )
    .bind(userId)
    .all<EventRow>()
  return result.results ?? []
}

export async function getUserCreatedEvents(
  db: D1Database,
  userId: string,
): Promise<EventRow[]> {
  const result = await db
    .prepare(
      `SELECT * FROM events WHERE created_by = ?1 ORDER BY created_at DESC`,
    )
    .bind(userId)
    .all<EventRow>()
  return result.results ?? []
}

// ═══════════════════════════════════════════════════════════════════════
// EVENT ENDORSERS
// ═══════════════════════════════════════════════════════════════════════

export async function addEventEndorser(
  db: D1Database,
  eventId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .prepare(
        'INSERT OR IGNORE INTO event_endorsers (event_id, user_id, created_at) VALUES (?1, ?2, ?3)',
      )
      .bind(eventId, userId, new Date().toISOString())
      .run()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getEventEndorsers(
  db: D1Database,
  eventId: string,
): Promise<UserRow[]> {
  const result = await db
    .prepare(
      `SELECT u.* FROM users u
       JOIN event_endorsers ee ON ee.user_id = u.id
       WHERE ee.event_id = ?1
       ORDER BY ee.created_at`,
    )
    .bind(eventId)
    .all<UserRow>()
  return result.results ?? []
}

// ═══════════════════════════════════════════════════════════════════════
// BOARDS
// ═══════════════════════════════════════════════════════════════════════

export type BoardPostWithAuthor = BoardPostRow & {
  author: UserRow
  reactions: BoardReactionCount[]
  reply_count: number
}

export async function getBoardByTypeAndParent(
  db: D1Database,
  type: BoardType,
  parentId: string,
): Promise<BoardRow | null> {
  const result = await db
    .prepare('SELECT * FROM boards WHERE type = ?1 AND parent_id = ?2')
    .bind(type, parentId)
    .first<BoardRow>()
  return result ?? null
}

export async function ensureBoard(
  db: D1Database,
  type: BoardType,
  parentId: string,
): Promise<BoardRow> {
  const existing = await getBoardByTypeAndParent(db, type, parentId)
  if (existing) return existing

  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT OR IGNORE INTO boards (id, type, parent_id, created_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(id, type, parentId, now)
    .run()

  const board = await getBoardByTypeAndParent(db, type, parentId)
  if (!board) {
    throw new Error('Failed to create board')
  }
  return board
}

export async function createBoardPost(
  db: D1Database,
  post: Pick<BoardPostRow, 'id' | 'board_id' | 'author_id' | 'body'> &
    Partial<Pick<BoardPostRow, 'image_url'>>,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const now = new Date().toISOString()
    await db
      .prepare(
        `INSERT INTO board_posts
          (id, board_id, author_id, body, image_url, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
      )
      .bind(
        post.id,
        post.board_id,
        post.author_id,
        post.body,
        post.image_url ?? null,
        now,
        now,
      )
      .run()
    return { success: true, id: post.id }
  } catch (err: any) {
    return { success: false, error: err?.message ?? 'Unknown error' }
  }
}

export async function getBoardPostById(
  db: D1Database,
  postId: string,
): Promise<BoardPostRow | null> {
  const result = await db
    .prepare('SELECT * FROM board_posts WHERE id = ?1 AND deleted_at IS NULL')
    .bind(postId)
    .first<BoardPostRow>()
  return result ?? null
}

/**
 * Like getBoardPostById but ALSO returns soft-deleted rows. Used by edit /
 * delete routes that need to distinguish "never existed" (404) from
 * "previously existed but is gone" (410 Gone).
 */
export async function getBoardPostByIdIncludingDeleted(
  db: D1Database,
  postId: string,
): Promise<BoardPostRow | null> {
  const result = await db
    .prepare('SELECT * FROM board_posts WHERE id = ?1')
    .bind(postId)
    .first<BoardPostRow>()
  return result ?? null
}

export async function getBoardById(
  db: D1Database,
  boardId: string,
): Promise<BoardRow | null> {
  const result = await db.prepare('SELECT * FROM boards WHERE id = ?1').bind(boardId).first<BoardRow>()
  return result ?? null
}

export async function getBoardPostReactionCounts(
  db: D1Database,
  postId: string,
): Promise<BoardReactionCount[]> {
  const result = await db
    .prepare(
      `SELECT emoji, COUNT(*) as count
       FROM board_post_reactions
       WHERE post_id = ?1
       GROUP BY emoji
       ORDER BY MIN(created_at) ASC`,
    )
    .bind(postId)
    .all<BoardReactionCount>()
  return result.results ?? []
}

export async function listBoardPosts(
  db: D1Database,
  boardId: string,
  opts: { limit?: number; offset?: number } = {},
): Promise<BoardPostWithAuthor[]> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100)
  const offset = Math.max(opts.offset ?? 0, 0)
  // Order: pinned first (most-recently pinned at top of pinned section),
  // then everything else reverse-chronological. The
  // `pinned_at IS NOT NULL` predicate evaluates to 1 for pinned posts and 0
  // for non-pinned; DESC puts the 1s first.
  // Exclude posts that are themselves replies (#205 threaded replies) — they
  // belong under their parent in the reply panel, not at the top level of the
  // board feed. Single-level threading is enforced in createBoardPostReply,
  // so the NOT IN subquery is bounded and trivially indexed.
  const result = await db
    .prepare(
      `SELECT * FROM board_posts
       WHERE board_id = ?1 AND deleted_at IS NULL
         AND id NOT IN (SELECT post_id FROM board_post_replies)
       ORDER BY (pinned_at IS NOT NULL) DESC, pinned_at DESC, created_at DESC
       LIMIT ?2 OFFSET ?3`,
    )
    .bind(boardId, limit, offset)
    .all<BoardPostRow>()

  const posts = result.results ?? []
  const hydrated = await Promise.all(
    posts.map(async (post) => {
      const author = await getUserById(db, post.author_id)
      const reactions = await getBoardPostReactionCounts(db, post.id)
      const replyCount = await db
        .prepare('SELECT COUNT(*) as count FROM board_post_replies WHERE parent_post_id = ?1')
        .bind(post.id)
        .first<{ count: number }>()
      return author
        ? {
            ...post,
            author,
            reactions,
            reply_count: replyCount?.count ?? 0,
          }
        : null
    }),
  )

  return hydrated.filter((post): post is BoardPostWithAuthor => post !== null)
}

export async function toggleBoardPostReaction(
  db: D1Database,
  postId: string,
  userId: string,
  emoji: string,
): Promise<{ active: boolean; reactions: BoardReactionCount[] }> {
  // Race-safe toggle. The previous SELECT-then-INSERT pattern threw 500 on
  // rapid duplicate clicks because the second INSERT collided with the
  // (post_id, user_id, emoji) primary key. We now:
  //   1. Optimistically DELETE — succeeds if the reaction existed, else no-op
  //   2. If something was deleted, the toggle is OFF
  //   3. Else INSERT OR IGNORE — if a concurrent click already inserted, this
  //      is a deterministic no-op and the reaction stays ON
  const del = await db
    .prepare(
      `DELETE FROM board_post_reactions
       WHERE post_id = ?1 AND user_id = ?2 AND emoji = ?3`,
    )
    .bind(postId, userId, emoji)
    .run()

  if ((del.meta?.changes ?? 0) > 0) {
    return { active: false, reactions: await getBoardPostReactionCounts(db, postId) }
  }

  await db
    .prepare(
      `INSERT OR IGNORE INTO board_post_reactions (post_id, user_id, emoji, created_at)
       VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(postId, userId, emoji, new Date().toISOString())
    .run()
  return { active: true, reactions: await getBoardPostReactionCounts(db, postId) }
}

// Window during which a post author can edit their own post (milliseconds).
// Per PRD §5.2 + #205 acceptance criteria — TBD with team; default 5 min.
export const BOARD_POST_EDIT_WINDOW_MS = 5 * 60 * 1000

export type BoardPostEditResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'deleted' | 'not_author' | 'window_expired' }

/**
 * Edit a board post body in place. Caller must be the author and the post
 * must be within the edit window. Soft-deleted posts are not editable.
 *
 * Returns a discriminated union so the route layer can map reasons to
 * appropriate HTTP statuses without inspecting raw DB state.
 */
export async function editBoardPost(
  db: D1Database,
  postId: string,
  authorId: string,
  body: string,
): Promise<BoardPostEditResult> {
  const post = await db
    .prepare(
      `SELECT author_id, deleted_at, created_at FROM board_posts WHERE id = ?1`,
    )
    .bind(postId)
    .first<{ author_id: string; deleted_at: string | null; created_at: string }>()

  if (!post) return { ok: false, reason: 'not_found' }
  if (post.deleted_at) return { ok: false, reason: 'deleted' }
  if (post.author_id !== authorId) return { ok: false, reason: 'not_author' }

  // SQLite's datetime('now') returns 'YYYY-MM-DD HH:MM:SS' (space separator,
  // UTC). Normalize to ISO 8601 before parsing so engines reliably treat it
  // as UTC. Plain `new Date('YYYY-MM-DD HH:MM:SS')` may parse as local time.
  const isoCreated = post.created_at.includes('T')
    ? post.created_at + (post.created_at.endsWith('Z') ? '' : 'Z')
    : post.created_at.replace(' ', 'T') + 'Z'
  const createdMs = new Date(isoCreated).getTime()
  if (!Number.isFinite(createdMs)) {
    // Fallback: if the timestamp can't be parsed, fail closed.
    return { ok: false, reason: 'window_expired' }
  }
  if (Date.now() - createdMs > BOARD_POST_EDIT_WINDOW_MS) {
    return { ok: false, reason: 'window_expired' }
  }

  await db
    .prepare(
      `UPDATE board_posts
       SET body = ?1, updated_at = datetime('now')
       WHERE id = ?2`,
    )
    .bind(body, postId)
    .run()

  return { ok: true }
}

export type BoardPostDeleteResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'already_deleted' | 'forbidden' }

/**
 * Soft-delete a board post. The author OR an admin may delete. The post
 * stays in the table (deleted_at set) so moderation can still inspect it
 * via the admin queue.
 */
export async function softDeleteBoardPost(
  db: D1Database,
  postId: string,
  actor: { id: string; isAdmin: boolean },
): Promise<BoardPostDeleteResult> {
  const post = await db
    .prepare(`SELECT author_id, deleted_at FROM board_posts WHERE id = ?1`)
    .bind(postId)
    .first<{ author_id: string; deleted_at: string | null }>()

  if (!post) return { ok: false, reason: 'not_found' }
  if (post.deleted_at) return { ok: false, reason: 'already_deleted' }
  if (post.author_id !== actor.id && !actor.isAdmin) {
    return { ok: false, reason: 'forbidden' }
  }

  await db
    .prepare(
      `UPDATE board_posts
       SET deleted_at = datetime('now')
       WHERE id = ?1`,
    )
    .bind(postId)
    .run()

  return { ok: true }
}

export type BoardPostPinResult =
  | { ok: true; pinned: boolean }
  | { ok: false; reason: 'not_found' | 'deleted' | 'already_pinned' | 'not_pinned' }

/**
 * Pin a post. Pinned posts sort first in `listBoardPosts`. Caller authority
 * (sevak / center admin / global admin) is enforced at the route level —
 * this helper does the DB work and idempotency check only.
 *
 * Soft-deleted posts can't be pinned (you'd be promoting a hidden post).
 */
export async function pinBoardPost(
  db: D1Database,
  postId: string,
  pinnedByUserId: string,
): Promise<BoardPostPinResult> {
  const post = await db
    .prepare(`SELECT pinned_at, deleted_at FROM board_posts WHERE id = ?1`)
    .bind(postId)
    .first<{ pinned_at: string | null; deleted_at: string | null }>()

  if (!post) return { ok: false, reason: 'not_found' }
  if (post.deleted_at) return { ok: false, reason: 'deleted' }
  if (post.pinned_at) return { ok: false, reason: 'already_pinned' }

  await db
    .prepare(
      `UPDATE board_posts
       SET pinned_at = datetime('now'), pinned_by = ?1
       WHERE id = ?2`,
    )
    .bind(pinnedByUserId, postId)
    .run()

  return { ok: true, pinned: true }
}

/** Unpin a previously pinned post. Idempotent failure: `not_pinned`. */
export async function unpinBoardPost(
  db: D1Database,
  postId: string,
): Promise<BoardPostPinResult> {
  const post = await db
    .prepare(`SELECT pinned_at, deleted_at FROM board_posts WHERE id = ?1`)
    .bind(postId)
    .first<{ pinned_at: string | null; deleted_at: string | null }>()

  if (!post) return { ok: false, reason: 'not_found' }
  if (post.deleted_at) return { ok: false, reason: 'deleted' }
  if (!post.pinned_at) return { ok: false, reason: 'not_pinned' }

  await db
    .prepare(
      `UPDATE board_posts
       SET pinned_at = NULL, pinned_by = NULL
       WHERE id = ?1`,
    )
    .bind(postId)
    .run()

  return { ok: true, pinned: false }
}

export type CreateBoardPostReplyResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | 'parent_not_found'
        | 'parent_deleted'
        | 'parent_is_reply'
        | 'insert_failed'
    }

/**
 * Create a single-level reply to a top-level board post. Enforced rules:
 *   - parent must exist (not deleted)
 *   - parent must itself be a top-level post — replies-to-replies are
 *     refused with `parent_is_reply` so threads can't deepen past one level
 *   - reply lands on the same board as the parent (caller passes board_id
 *     for the route's access gate, but we double-check here)
 *
 * Uses D1 batch() so the board_posts INSERT and the board_post_replies
 * INSERT are atomic — no orphan top-level posts if either fails.
 */
export async function createBoardPostReply(
  db: D1Database,
  args: {
    id: string
    parent_post_id: string
    board_id: string
    author_id: string
    body: string
  },
): Promise<CreateBoardPostReplyResult> {
  const parent = await db
    .prepare(`SELECT board_id, deleted_at FROM board_posts WHERE id = ?1`)
    .bind(args.parent_post_id)
    .first<{ board_id: string; deleted_at: string | null }>()
  if (!parent) return { ok: false, reason: 'parent_not_found' }
  if (parent.deleted_at) return { ok: false, reason: 'parent_deleted' }

  // Treat board mismatch as not_found rather than leak info about which
  // board the parent is on.
  if (parent.board_id !== args.board_id) {
    return { ok: false, reason: 'parent_not_found' }
  }

  // Single-level threading: parent can't itself be a reply.
  const parentIsReply = await db
    .prepare(`SELECT 1 FROM board_post_replies WHERE post_id = ?1`)
    .bind(args.parent_post_id)
    .first()
  if (parentIsReply) return { ok: false, reason: 'parent_is_reply' }

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO board_posts (id, board_id, author_id, body, image_url)
         VALUES (?1, ?2, ?3, ?4, NULL)`,
      )
      .bind(args.id, args.board_id, args.author_id, args.body),
    db
      .prepare(
        `INSERT INTO board_post_replies (post_id, parent_post_id) VALUES (?1, ?2)`,
      )
      .bind(args.id, args.parent_post_id),
  ])

  return results.every((r) => r.success) ? { ok: true } : { ok: false, reason: 'insert_failed' }
}

/**
 * List replies under a parent post in chronological order (oldest first —
 * threads read top-to-bottom). Returns hydrated `BoardPostWithAuthor`
 * shape so the route can pass them through `boardPostToApi` directly.
 * Reply rows don't carry their own reactions or reply_count yet (v2 doesn't
 * reply-to-reply, and reactions on replies are deferred per PRD).
 */
export async function listBoardPostReplies(
  db: D1Database,
  parentPostId: string,
): Promise<BoardPostWithAuthor[]> {
  const result = await db
    .prepare(
      `SELECT bp.* FROM board_posts bp
       JOIN board_post_replies bpr ON bpr.post_id = bp.id
       WHERE bpr.parent_post_id = ?1 AND bp.deleted_at IS NULL
       ORDER BY bp.created_at ASC`,
    )
    .bind(parentPostId)
    .all<BoardPostRow>()

  const replies = result.results ?? []
  const hydrated = await Promise.all(
    replies.map(async (post) => {
      const author = await getUserById(db, post.author_id)
      return author
        ? {
            ...post,
            author,
            reactions: [] as BoardReactionCount[],
            reply_count: 0,
          }
        : null
    }),
  )
  return hydrated.filter((p): p is BoardPostWithAuthor => p !== null)
}

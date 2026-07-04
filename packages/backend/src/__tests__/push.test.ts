/**
 * push.test.ts — unit + integration tests for push delivery (#102).
 *
 * Pure helpers (token shape, quiet hours, Expo send chunking/pruning) plus
 * dispatchNotification against the real test D1. dispatchNotification only
 * reads notification_preferences / push_tokens and writes notifications, so
 * we seed those three tables directly — no users rows needed (setup.ts
 * strips the FKs).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from 'cloudflare:test'
import { applyMigration, dropAllTables } from './setup'
import * as push from '../push'
import * as notifications from '../notifications'

const T = notifications.NOTIFICATION_TYPES

beforeEach(async () => {
  await dropAllTables()
  await applyMigration()
})

// ── helpers ──────────────────────────────────────────────────────────

async function seedPrefs(userId: string, overrides: Record<string, number | string> = {}) {
  const defaults: Record<string, number | string | null> = {
    in_app_enabled: 1,
    push_enabled: 1,
    email_enabled: 1,
    event_reminders: 1,
    event_created: 1,
    event_cancelled: 1,
    event_updated: 1,
    attendee_joined: 1,
    center_announcements: 1,
    board_posts: 1,
    board_replies: 1,
    board_reactions: 1,
    board_mentions: 1,
    quiet_hours_enabled: 0,
    quiet_hours_start: null,
    quiet_hours_end: null,
  }
  const row = { ...defaults, ...overrides }
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO notification_preferences
      (id, user_id, in_app_enabled, push_enabled, email_enabled, event_reminders,
       event_created, event_cancelled, event_updated, attendee_joined, center_announcements,
       board_posts, board_replies, board_reactions, board_mentions,
       quiet_hours_enabled, quiet_hours_start, quiet_hours_end, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
    .bind(
      crypto.randomUUID(), userId,
      row.in_app_enabled, row.push_enabled, row.email_enabled, row.event_reminders,
      row.event_created, row.event_cancelled, row.event_updated, row.attendee_joined,
      row.center_announcements, row.board_posts, row.board_replies, row.board_reactions,
      row.board_mentions, row.quiet_hours_enabled, row.quiet_hours_start, row.quiet_hours_end,
      now, now,
    )
    .run()
}

async function seedToken(userId: string, token: string) {
  await push.registerPushToken(env as any, userId, token, 'ios')
}

async function countNotifs(userId: string): Promise<number> {
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ?1')
    .bind(userId)
    .first<{ n: number }>()
  return r?.n ?? 0
}

function okFetch(perMessageStatus: (i: number) => any = () => ({ status: 'ok' })) {
  return vi.fn(async (_url: string, init: any) => {
    const body = JSON.parse(init.body) as Array<unknown>
    return new Response(
      JSON.stringify({ data: body.map((_, i) => perMessageStatus(i)) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  }) as unknown as typeof fetch
}

// ── isExpoPushToken ────────────────────────────────────────────────────

describe('isExpoPushToken', () => {
  it('accepts ExponentPushToken / ExpoPushToken shapes', () => {
    expect(push.isExpoPushToken('ExponentPushToken[abc123]')).toBe(true)
    expect(push.isExpoPushToken('ExpoPushToken[xyz]')).toBe(true)
  })
  it('rejects junk', () => {
    expect(push.isExpoPushToken('')).toBe(false)
    expect(push.isExpoPushToken('not-a-token')).toBe(false)
    expect(push.isExpoPushToken('ExponentPushToken[missing-bracket')).toBe(false)
    expect(push.isExpoPushToken(undefined)).toBe(false)
    expect(push.isExpoPushToken(42)).toBe(false)
  })
})

// ── isWithinQuietHours ─────────────────────────────────────────────────

describe('isWithinQuietHours', () => {
  const base = {
    id: 'p', user_id: 'u', in_app_enabled: 1, push_enabled: 1, email_enabled: 1,
    event_reminders: 1, event_created: 1, event_cancelled: 1, event_updated: 1,
    attendee_joined: 1, center_announcements: 1, board_posts: 1, board_replies: 1,
    board_reactions: 1, board_mentions: 1, created_at: '', updated_at: '',
  }
  it('returns false when disabled', () => {
    const p = { ...base, quiet_hours_enabled: 0, quiet_hours_start: '22:00', quiet_hours_end: '08:00' }
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T23:00:00Z'))).toBe(false)
  })
  it('handles a window that wraps past midnight', () => {
    const p = { ...base, quiet_hours_enabled: 1, quiet_hours_start: '22:00', quiet_hours_end: '08:00' }
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T23:30:00Z'))).toBe(true)  // inside
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T07:00:00Z'))).toBe(true)  // inside (early am)
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T12:00:00Z'))).toBe(false) // midday
  })
  it('handles a same-day window', () => {
    const p = { ...base, quiet_hours_enabled: 1, quiet_hours_start: '09:00', quiet_hours_end: '17:00' }
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T12:00:00Z'))).toBe(true)
    expect(push.isWithinQuietHours(p as any, new Date('2026-06-02T20:00:00Z'))).toBe(false)
  })
})

// ── sendExpoPush ───────────────────────────────────────────────────────

describe('sendExpoPush', () => {
  it('chunks into batches of 100', async () => {
    const messages = Array.from({ length: 250 }, (_, i) => ({
      to: `ExponentPushToken[${i}]`, title: 't', body: 'b',
    }))
    const fetchMock = okFetch()
    await push.sendExpoPush(messages, fetchMock)
    expect((fetchMock as any).mock.calls.length).toBe(3) // 100 + 100 + 50
  })

  it('reports DeviceNotRegistered tokens for pruning', async () => {
    const messages = [
      { to: 'ExponentPushToken[good]', title: 't', body: 'b' },
      { to: 'ExponentPushToken[dead]', title: 't', body: 'b' },
    ]
    const fetchMock = okFetch((i) =>
      i === 1
        ? { status: 'error', details: { error: 'DeviceNotRegistered' } }
        : { status: 'ok' },
    )
    const { invalidTokens } = await push.sendExpoPush(messages, fetchMock)
    expect(invalidTokens).toEqual(['ExponentPushToken[dead]'])
  })

  it('swallows network errors (never throws)', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    const { invalidTokens } = await push.sendExpoPush(
      [{ to: 'ExponentPushToken[x]', title: 't', body: 'b' }],
      fetchMock,
    )
    expect(invalidTokens).toEqual([])
  })

  it('no-ops on empty input', async () => {
    const fetchMock = okFetch()
    await push.sendExpoPush([], fetchMock)
    expect((fetchMock as any).mock.calls.length).toBe(0)
  })
})

// ── token registration ─────────────────────────────────────────────────

describe('registerPushToken', () => {
  it('upserts and reassigns a token to the latest user', async () => {
    await push.registerPushToken(env as any, 'user-a', 'ExponentPushToken[shared]', 'ios')
    await push.registerPushToken(env as any, 'user-b', 'ExponentPushToken[shared]', 'android')
    const rows = await push.getPushTokensForUsers(env as any, ['user-a', 'user-b'])
    expect(rows.length).toBe(1)
    expect(rows[0].user_id).toBe('user-b')
    expect(rows[0].platform).toBe('android')
  })

  it('removePushToken is idempotent', async () => {
    await push.registerPushToken(env as any, 'user-a', 'ExponentPushToken[t]', 'ios')
    await push.removePushToken(env as any, 'ExponentPushToken[t]')
    await push.removePushToken(env as any, 'ExponentPushToken[t]') // no throw
    const rows = await push.getPushTokensForUsers(env as any, ['user-a'])
    expect(rows.length).toBe(0)
  })

  it('prunes dead tokens', async () => {
    await push.registerPushToken(env as any, 'user-a', 'ExponentPushToken[dead]', 'ios')
    await push.pruneTokens(env as any, ['ExponentPushToken[dead]'])
    const rows = await push.getPushTokensForUsers(env as any, ['user-a'])
    expect(rows.length).toBe(0)
  })
})

// ── dispatchNotification ────────────────────────────────────────────────

describe('dispatchNotification', () => {
  it('writes in-app rows for recipients and excludes the actor', async () => {
    await seedPrefs('alice')
    await seedPrefs('bob')
    const fetchMock = okFetch()
    const res = await push.dispatchNotification(
      env as any,
      ['alice', 'bob', 'author'],
      T.BOARD_POST,
      'New post',
      'hello board',
      { excludeUserId: 'author', fetchImpl: fetchMock },
    )
    expect(res.inApp).toBe(2)
    expect(await countNotifs('alice')).toBe(1)
    expect(await countNotifs('bob')).toBe(1)
    expect(await countNotifs('author')).toBe(0)
  })

  it('respects the per-type in-app toggle', async () => {
    await seedPrefs('alice', { board_posts: 0 })
    const fetchMock = okFetch()
    await push.dispatchNotification(env as any, ['alice'], T.BOARD_POST, 't', 'm', {
      fetchImpl: fetchMock,
    })
    expect(await countNotifs('alice')).toBe(0)
  })

  it('users with no prefs row get defaults (notified)', async () => {
    const fetchMock = okFetch()
    await push.dispatchNotification(env as any, ['ghost'], T.BOARD_REPLY, 't', 'm', {
      fetchImpl: fetchMock,
    })
    expect(await countNotifs('ghost')).toBe(1)
  })

  it('pushes to a user with a token and an enabled push channel', async () => {
    await seedPrefs('alice')
    await seedToken('alice', 'ExponentPushToken[alice]')
    const fetchMock = okFetch()
    const res = await push.dispatchNotification(env as any, ['alice'], T.BOARD_POST, 't', 'm', {
      fetchImpl: fetchMock,
    })
    expect(res.push).toBe(1)
    expect((fetchMock as any).mock.calls.length).toBe(1)
    const sent = JSON.parse((fetchMock as any).mock.calls[0][1].body)
    expect(sent[0].to).toBe('ExponentPushToken[alice]')
  })

  it('suppresses push (but keeps in-app) when push_enabled is off', async () => {
    await seedPrefs('alice', { push_enabled: 0 })
    await seedToken('alice', 'ExponentPushToken[alice]')
    const fetchMock = okFetch()
    const res = await push.dispatchNotification(env as any, ['alice'], T.BOARD_POST, 't', 'm', {
      fetchImpl: fetchMock,
    })
    expect(res.inApp).toBe(1)
    expect(res.push).toBe(0)
    expect((fetchMock as any).mock.calls.length).toBe(0)
  })

  it('suppresses push during quiet hours but still records in-app', async () => {
    await seedPrefs('alice', {
      quiet_hours_enabled: 1,
      quiet_hours_start: '00:00',
      quiet_hours_end: '23:59',
    })
    await seedToken('alice', 'ExponentPushToken[alice]')
    const fetchMock = okFetch()
    const res = await push.dispatchNotification(env as any, ['alice'], T.BOARD_POST, 't', 'm', {
      fetchImpl: fetchMock,
      now: new Date('2026-06-02T12:00:00Z'),
    })
    expect(res.inApp).toBe(1)
    expect(res.push).toBe(0)
  })

  it('deduplicates recipient ids', async () => {
    await seedPrefs('alice')
    const fetchMock = okFetch()
    await push.dispatchNotification(env as any, ['alice', 'alice'], T.BOARD_POST, 't', 'm', {
      fetchImpl: fetchMock,
    })
    expect(await countNotifs('alice')).toBe(1)
  })
})

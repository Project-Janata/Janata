/**
 * push.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Push notification delivery for Chinmaya Janata (#102).
 *
 * Devices register an Expo push token (ExponentPushToken[...]) which we
 * store in push_tokens. When something happens that a user cares about we
 * fan out via dispatchNotification: write the in-app row(s) AND deliver to
 * the Expo Push API, which routes to APNs (iOS) / FCM (Android).
 *
 * Delivery rules are honoured centrally so every call site (board posts,
 * replies, reactions, event lifecycle) gets the same preference + quiet-hours
 * gating for free.
 */

import type { Env } from './types'
import * as notifications from './notifications'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
// Expo accepts up to 100 messages per request.
const EXPO_CHUNK = 100

export interface PushTokenRow {
  id: string
  user_id: string
  token: string
  platform: string | null
  device_id: string | null
  created_at: string
  updated_at: string
  last_used_at: string | null
}

export interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
  channelId?: string
}

/**
 * An Expo push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx].
 * We only do a shape check — Expo validates fully on send.
 */
export function isExpoPushToken(token: unknown): token is string {
  return (
    typeof token === 'string' &&
    (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[')) &&
    token.endsWith(']')
  )
}

/**
 * Register (or refresh) a device's push token. Tokens are globally unique;
 * if the same token was previously bound to another user (shared device,
 * re-login) we reassign it to the current user rather than erroring.
 */
export async function registerPushToken(
  env: Env,
  userId: string,
  token: string,
  platform?: string | null,
  deviceId?: string | null,
): Promise<void> {
  const now = new Date().toISOString()
  await env.DB.prepare(
    `INSERT INTO push_tokens (id, user_id, token, platform, device_id, created_at, updated_at, last_used_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)
     ON CONFLICT(token) DO UPDATE SET
       user_id = ?2,
       platform = ?4,
       device_id = ?5,
       updated_at = ?6,
       last_used_at = ?6`,
  )
    .bind(crypto.randomUUID(), userId, token, platform ?? null, deviceId ?? null, now)
    .run()
}

/** Remove a token (logout / device sign-out). Idempotent. */
export async function removePushToken(env: Env, token: string): Promise<void> {
  await env.DB.prepare('DELETE FROM push_tokens WHERE token = ?1').bind(token).run()
}

/** Fetch every push token for a set of user IDs. */
export async function getPushTokensForUsers(
  env: Env,
  userIds: string[],
): Promise<PushTokenRow[]> {
  if (userIds.length === 0) return []
  const placeholders = userIds.map((_, i) => `?${i + 1}`).join(', ')
  const result = await env.DB.prepare(
    `SELECT * FROM push_tokens WHERE user_id IN (${placeholders})`,
  )
    .bind(...userIds)
    .all<PushTokenRow>()
  return result.results ?? []
}

/** Delete tokens Expo told us are dead (DeviceNotRegistered). */
export async function pruneTokens(env: Env, tokens: string[]): Promise<void> {
  if (tokens.length === 0) return
  const placeholders = tokens.map((_, i) => `?${i + 1}`).join(', ')
  await env.DB.prepare(`DELETE FROM push_tokens WHERE token IN (${placeholders})`)
    .bind(...tokens)
    .run()
}

/**
 * Send a batch of messages to the Expo Push API. Chunks into groups of 100,
 * collects tickets, and returns the set of tokens that came back as
 * DeviceNotRegistered so the caller can prune them.
 *
 * Network/HTTP failures are swallowed (logged) — a push outage must never
 * break the originating write (creating a post, RSVPing, etc).
 */
export async function sendExpoPush(
  messages: ExpoPushMessage[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ invalidTokens: string[] }> {
  const invalidTokens: string[] = []
  if (messages.length === 0) return { invalidTokens }

  for (let i = 0; i < messages.length; i += EXPO_CHUNK) {
    const chunk = messages.slice(i, i + EXPO_CHUNK)
    try {
      const res = await fetchImpl(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(chunk),
      })
      if (!res.ok) {
        console.error(`[push] Expo push HTTP ${res.status}`)
        continue
      }
      const json = (await res.json()) as {
        data?: Array<{ status: string; message?: string; details?: { error?: string } }>
      }
      const tickets = json.data ?? []
      tickets.forEach((ticket, idx) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          const msg = chunk[idx]
          if (msg) invalidTokens.push(msg.to)
        }
      })
    } catch (err) {
      console.error('[push] Expo push send failed:', err)
    }
  }

  return { invalidTokens }
}

/**
 * Quiet hours: returns true if push should be SUPPRESSED right now for these
 * preferences. Compares the current UTC HH:MM against the stored window.
 * Handles windows that wrap past midnight (start > end). In-app delivery is
 * never suppressed — only push.
 */
export function isWithinQuietHours(
  prefs: notifications.NotificationPreferenceRow,
  now: Date,
): boolean {
  if (!prefs.quiet_hours_enabled || !prefs.quiet_hours_start || !prefs.quiet_hours_end) {
    return false
  }
  const cur = now.getUTCHours() * 60 + now.getUTCMinutes()
  const [sh, sm] = prefs.quiet_hours_start.split(':').map(Number)
  const [eh, em] = prefs.quiet_hours_end.split(':').map(Number)
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return false
  const start = sh * 60 + sm
  const end = eh * 60 + em
  if (start === end) return false
  return start < end ? cur >= start && cur < end : cur >= start || cur < end
}

/**
 * Bulk-load notification preferences for a set of users into a map. Users
 * with no row are absent from the map — callers treat absence as "all
 * defaults on" (which matches createDefaultNotificationPreferences).
 */
async function loadPreferences(
  env: Env,
  userIds: string[],
): Promise<Map<string, notifications.NotificationPreferenceRow>> {
  const map = new Map<string, notifications.NotificationPreferenceRow>()
  if (userIds.length === 0) return map
  const placeholders = userIds.map((_, i) => `?${i + 1}`).join(', ')
  const result = await env.DB.prepare(
    `SELECT * FROM notification_preferences WHERE user_id IN (${placeholders})`,
  )
    .bind(...userIds)
    .all<notifications.NotificationPreferenceRow>()
  for (const row of result.results ?? []) map.set(row.user_id, row)
  return map
}

export interface DispatchOptions {
  data?: Record<string, unknown>
  actionUrl?: string
  relatedEventId?: string
  relatedUserId?: string
  /** Never notify this user (typically the actor who triggered the event). */
  excludeUserId?: string
  /** Override the system clock (tests). */
  now?: Date
  /** Override fetch (tests). */
  fetchImpl?: typeof fetch
}

/**
 * The single fan-out entry point. Given a set of recipient user IDs and a
 * notification type:
 *   1. writes an in-app notification row for each user whose in-app channel
 *      and per-type toggle allow it (batch insert),
 *   2. delivers a push to each user whose push channel + per-type toggle
 *      allow it and who is not currently in quiet hours,
 *   3. prunes any tokens Expo reports as dead.
 *
 * Returns counts for logging / tests. Best-effort: a delivery failure is
 * logged but never thrown, so the caller's primary write is unaffected.
 */
export async function dispatchNotification(
  env: Env,
  recipientUserIds: string[],
  typeId: number,
  title: string,
  message: string,
  opts: DispatchOptions = {},
): Promise<{ inApp: number; push: number }> {
  const now = opts.now ?? new Date()
  const recipients = [...new Set(recipientUserIds)].filter(
    (id) => id && id !== opts.excludeUserId,
  )
  if (recipients.length === 0) return { inApp: 0, push: 0 }

  const prefs = await loadPreferences(env, recipients)

  const inAppUsers = recipients.filter((id) => {
    const p = prefs.get(id)
    return !p || notifications.isNotificationTypeEnabled(p, typeId)
  })
  const pushUsers = recipients.filter((id) => {
    const p = prefs.get(id)
    if (!p) return true // defaults: push on
    return (
      p.push_enabled === 1 &&
      notifications.isNotificationTypeAllowed(p, typeId) &&
      !isWithinQuietHours(p, now)
    )
  })

  // 1. In-app rows (batch insert, chunked like the broadcast route).
  const nowIso = now.toISOString()
  if (inAppUsers.length > 0) {
    const stmt = env.DB.prepare(
      `INSERT INTO notifications
        (id, user_id, type_id, title, message, data, action_url, related_event_id, related_user_id, is_read, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
    )
    const dataStr = opts.data ? JSON.stringify(opts.data) : null
    const CHUNK = 50
    for (let i = 0; i < inAppUsers.length; i += CHUNK) {
      const slice = inAppUsers.slice(i, i + CHUNK)
      const statements = slice.map((uid) =>
        stmt.bind(
          crypto.randomUUID(),
          uid,
          typeId,
          title,
          message,
          dataStr,
          opts.actionUrl ?? null,
          opts.relatedEventId ?? null,
          opts.relatedUserId ?? null,
          nowIso,
          nowIso,
        ),
      )
      await env.DB.batch(statements)
    }
  }

  // 2. Push delivery.
  let pushCount = 0
  if (pushUsers.length > 0) {
    const tokens = await getPushTokensForUsers(env, pushUsers)
    if (tokens.length > 0) {
      const messages: ExpoPushMessage[] = tokens.map((t) => ({
        to: t.token,
        title,
        body: message,
        sound: 'default',
        data: {
          ...(opts.data ?? {}),
          typeId,
          ...(opts.actionUrl ? { actionUrl: opts.actionUrl } : {}),
        },
        channelId: 'default',
      }))
      pushCount = messages.length
      const { invalidTokens } = await sendExpoPush(messages, opts.fetchImpl)
      if (invalidTokens.length > 0) await pruneTokens(env, invalidTokens)
    }
  }

  return { inApp: inAppUsers.length, push: pushCount }
}

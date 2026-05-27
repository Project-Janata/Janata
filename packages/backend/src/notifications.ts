/**
 * notifications.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Notification system for Chinmaya Janata backend.
 * Handles creating, reading, and managing user notifications.
 */

import type { Env, UserRow } from './types'
import * as db from './db'

export interface NotificationRow {
  id: string
  user_id: string
  type_id: number
  title: string
  message: string
  data: string | null
  is_read: number
  is_archived: number
  read_at: string | null
  action_url: string | null
  related_event_id: string | null
  related_user_id: string | null
  created_at: string
  updated_at: string
}

export interface NotificationPreferenceRow {
  id: string
  user_id: string
  in_app_enabled: number
  push_enabled: number
  email_enabled: number
  event_reminders: number
  event_created: number
  event_cancelled: number
  event_updated: number
  attendee_joined: number
  center_announcements: number
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  quiet_hours_enabled: number
  created_at: string
  updated_at: string
}

export interface NotificationTypeRow {
  id: number
  name: string
  description: string | null
  icon: string | null
  created_at: string
}

// Notification type IDs
export const NOTIFICATION_TYPES = {
  EVENT_REMINDER: 1,
  EVENT_CREATED: 2,
  EVENT_CANCELLED: 3,
  EVENT_UPDATED: 4,
  ATTENDEE_JOINED: 5,
  CENTER_ANNOUNCEMENT: 6,
  SYSTEM_NOTIFICATION: 7,
} as const

/**
 * Create a notification for a user
 */
export async function createNotification(
  env: Env,
  userId: string,
  typeId: number,
  title: string,
  message: string,
  options?: {
    data?: Record<string, any>
    actionUrl?: string
    relatedEventId?: string
    relatedUserId?: string
  }
): Promise<NotificationRow> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const stmt = env.DB.prepare(`
    INSERT INTO notifications (
      id,
      user_id,
      type_id,
      title,
      message,
      data,
      action_url,
      related_event_id,
      related_user_id,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  await stmt.bind(
    id,
    userId,
    typeId,
    title,
    message,
    options?.data ? JSON.stringify(options.data) : null,
    options?.actionUrl || null,
    options?.relatedEventId || null,
    options?.relatedUserId || null,
    now,
    now
  ).run()

  return {
    id,
    user_id: userId,
    type_id: typeId,
    title,
    message,
    data: options?.data ? JSON.stringify(options.data) : null,
    is_read: 0,
    is_archived: 0,
    read_at: null,
    action_url: options?.actionUrl || null,
    related_event_id: options?.relatedEventId || null,
    related_user_id: options?.relatedUserId || null,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  env: Env,
  userId: string,
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
    includeArchived?: boolean
  }
): Promise<NotificationRow[]> {
  const limit = options?.limit || 50
  const offset = options?.offset || 0
  const unreadOnly = options?.unreadOnly || false
  const includeArchived = options?.includeArchived || false

  let query = `
    SELECT * FROM notifications
    WHERE user_id = ?
  `

  if (unreadOnly) {
    query += ` AND is_read = 0`
  }

  if (!includeArchived) {
    query += ` AND is_archived = 0`
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`

  const stmt = env.DB.prepare(query)
  const result = await stmt.bind(userId, limit, offset).all<NotificationRow>()

  return result.results || []
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(env: Env, userId: string): Promise<number> {
  const stmt = env.DB.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE user_id = ? AND is_read = 0 AND is_archived = 0
  `)

  const result = await stmt.bind(userId).first<{ count: number }>()
  return result?.count || 0
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  env: Env,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const now = new Date().toISOString()

  const stmt = env.DB.prepare(`
    UPDATE notifications
    SET is_read = 1, read_at = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `)

  const result = await stmt.bind(now, now, notificationId, userId).run()
  // D1's `.success` is true even on 0-row updates. Check `meta.changes` so
  // the route can return 404 when the notification didn't exist or didn't
  // belong to this user (#127).
  return result.success === true && (result.meta?.changes ?? 0) > 0
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(env: Env, userId: string): Promise<boolean> {
  const now = new Date().toISOString()

  const stmt = env.DB.prepare(`
    UPDATE notifications
    SET is_read = 1, read_at = ?, updated_at = ?
    WHERE user_id = ? AND is_read = 0 AND is_archived = 0
  `)

  const result = await stmt.bind(now, now, userId).run()
  return result.success === true
}

/**
 * Archive notification
 */
export async function archiveNotification(
  env: Env,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const now = new Date().toISOString()

  const stmt = env.DB.prepare(`
    UPDATE notifications
    SET is_archived = 1, updated_at = ?
    WHERE id = ? AND user_id = ?
  `)

  const result = await stmt.bind(now, notificationId, userId).run()
  // Same meta.changes check as markNotificationAsRead (#127).
  return result.success === true && (result.meta?.changes ?? 0) > 0
}

/**
 * Delete notification
 */
export async function deleteNotification(
  env: Env,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const stmt = env.DB.prepare(`
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
  `)

  const result = await stmt.bind(notificationId, userId).run()
  // Same meta.changes check as the update paths (#127).
  return result.success === true && (result.meta?.changes ?? 0) > 0
}

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(
  env: Env,
  userId: string
): Promise<NotificationPreferenceRow | null> {
  const stmt = env.DB.prepare(`
    SELECT * FROM notification_preferences
    WHERE user_id = ?
  `)

  const result = await stmt.bind(userId).first<NotificationPreferenceRow>()
  return result || null
}

/**
 * Create default notification preferences for a new user
 */
export async function createDefaultNotificationPreferences(
  env: Env,
  userId: string
): Promise<NotificationPreferenceRow> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const stmt = env.DB.prepare(`
    INSERT INTO notification_preferences (
      id,
      user_id,
      in_app_enabled,
      push_enabled,
      email_enabled,
      event_reminders,
      event_created,
      event_cancelled,
      event_updated,
      attendee_joined,
      center_announcements,
      quiet_hours_enabled,
      created_at,
      updated_at
    ) VALUES (?, ?, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, ?, ?)
  `)

  await stmt.bind(id, userId, now, now).run()

  return {
    id,
    user_id: userId,
    in_app_enabled: 1,
    push_enabled: 1,
    email_enabled: 1,
    event_reminders: 1,
    event_created: 1,
    event_cancelled: 1,
    event_updated: 1,
    attendee_joined: 1,
    center_announcements: 1,
    quiet_hours_start: null,
    quiet_hours_end: null,
    quiet_hours_enabled: 0,
    created_at: now,
    updated_at: now,
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  env: Env,
  userId: string,
  updates: Partial<NotificationPreferenceRow>
): Promise<NotificationPreferenceRow | null> {
  const now = new Date().toISOString()

  // Build dynamic update query
  const fields: string[] = []
  const values: any[] = []

  if (updates.in_app_enabled !== undefined) {
    fields.push('in_app_enabled = ?')
    values.push(updates.in_app_enabled)
  }
  if (updates.push_enabled !== undefined) {
    fields.push('push_enabled = ?')
    values.push(updates.push_enabled)
  }
  if (updates.email_enabled !== undefined) {
    fields.push('email_enabled = ?')
    values.push(updates.email_enabled)
  }
  if (updates.event_reminders !== undefined) {
    fields.push('event_reminders = ?')
    values.push(updates.event_reminders)
  }
  if (updates.event_created !== undefined) {
    fields.push('event_created = ?')
    values.push(updates.event_created)
  }
  if (updates.event_cancelled !== undefined) {
    fields.push('event_cancelled = ?')
    values.push(updates.event_cancelled)
  }
  if (updates.event_updated !== undefined) {
    fields.push('event_updated = ?')
    values.push(updates.event_updated)
  }
  if (updates.attendee_joined !== undefined) {
    fields.push('attendee_joined = ?')
    values.push(updates.attendee_joined)
  }
  if (updates.center_announcements !== undefined) {
    fields.push('center_announcements = ?')
    values.push(updates.center_announcements)
  }
  if (updates.quiet_hours_start !== undefined) {
    fields.push('quiet_hours_start = ?')
    values.push(updates.quiet_hours_start)
  }
  if (updates.quiet_hours_end !== undefined) {
    fields.push('quiet_hours_end = ?')
    values.push(updates.quiet_hours_end)
  }
  if (updates.quiet_hours_enabled !== undefined) {
    fields.push('quiet_hours_enabled = ?')
    values.push(updates.quiet_hours_enabled)
  }

  if (fields.length === 0) {
    return getNotificationPreferences(env, userId)
  }

  fields.push('updated_at = ?')
  values.push(now)
  values.push(userId)

  const query = `UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?`
  const stmt = env.DB.prepare(query)

  await stmt.bind(...values).run()

  return getNotificationPreferences(env, userId)
}

/**
 * Check if notification type is enabled in preferences
 */
export function isNotificationTypeEnabled(
  preferences: NotificationPreferenceRow,
  typeId: number
): boolean {
  if (!preferences.in_app_enabled) return false

  switch (typeId) {
    case NOTIFICATION_TYPES.EVENT_REMINDER:
      return preferences.event_reminders === 1
    case NOTIFICATION_TYPES.EVENT_CREATED:
      return preferences.event_created === 1
    case NOTIFICATION_TYPES.EVENT_CANCELLED:
      return preferences.event_cancelled === 1
    case NOTIFICATION_TYPES.EVENT_UPDATED:
      return preferences.event_updated === 1
    case NOTIFICATION_TYPES.ATTENDEE_JOINED:
      return preferences.attendee_joined === 1
    case NOTIFICATION_TYPES.CENTER_ANNOUNCEMENT:
      return preferences.center_announcements === 1
    case NOTIFICATION_TYPES.SYSTEM_NOTIFICATION:
      return true
    default:
      return false
  }
}

/**
 * Convert notification row to API response format
 */
export function notificationRowToApi(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    typeId: row.type_id,
    title: row.title,
    message: row.message,
    data: row.data ? JSON.parse(row.data) : null,
    isRead: row.is_read === 1,
    isArchived: row.is_archived === 1,
    readAt: row.read_at,
    actionUrl: row.action_url,
    relatedEventId: row.related_event_id,
    relatedUserId: row.related_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Convert notification preference row to API response format
 */
export function preferencesRowToApi(row: NotificationPreferenceRow) {
  return {
    id: row.id,
    userId: row.user_id,
    inAppEnabled: row.in_app_enabled === 1,
    pushEnabled: row.push_enabled === 1,
    emailEnabled: row.email_enabled === 1,
    eventReminders: row.event_reminders === 1,
    eventCreated: row.event_created === 1,
    eventCancelled: row.event_cancelled === 1,
    eventUpdated: row.event_updated === 1,
    attendeeJoined: row.attendee_joined === 1,
    centerAnnouncements: row.center_announcements === 1,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    quietHoursEnabled: row.quiet_hours_enabled === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

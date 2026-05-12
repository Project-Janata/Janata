/**
 * notificationService.ts
 *
 * Frontend notification service for Chinmaya Janata
 * Handles fetching, caching, and managing user notifications
 */

import { API_URL } from './api'
import { getStoredToken } from '../src/storage/tokenStorage'

// Helper function for authenticated API calls
async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = await getStoredToken()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return response
}

export interface Notification {
  id: string
  userId: string
  typeId: number
  title: string
  message: string
  data: Record<string, any> | null
  isRead: boolean
  isArchived: boolean
  readAt: string | null
  actionUrl: string | null
  relatedEventId: string | null
  relatedUserId: string | null
  createdAt: string
  updatedAt: string
}

export interface NotificationPreferences {
  id: string
  userId: string
  inAppEnabled: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  eventReminders: boolean
  eventCreated: boolean
  eventCancelled: boolean
  eventUpdated: boolean
  attendeeJoined: boolean
  centerAnnouncements: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  quietHoursEnabled: boolean
  createdAt: string
  updatedAt: string
}

export const NotificationTypes = {
  EVENT_REMINDER: 1,
  EVENT_CREATED: 2,
  EVENT_CANCELLED: 3,
  EVENT_UPDATED: 4,
  ATTENDEE_JOINED: 5,
  CENTER_ANNOUNCEMENT: 6,
  SYSTEM_NOTIFICATION: 7,
} as const

/**
 * Get all notifications for the current user
 */
export async function getNotifications(options?: {
  limit?: number
  offset?: number
  unreadOnly?: boolean
}): Promise<{
  notifications: Notification[]
  count: number
}> {
  const params = new URLSearchParams()
  if (options?.limit) params.append('limit', options.limit.toString())
  if (options?.offset) params.append('offset', options.offset.toString())
  if (options?.unreadOnly) params.append('unreadOnly', 'true')

  const response = await authFetch(`/notifications?${params.toString()}`)
  return response.json()
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(): Promise<number> {
  const response = await authFetch('/notifications/unread-count')
  const data = await response.json()
  return data.unreadCount
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await authFetch(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  })
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await authFetch('/notifications/mark-all-read', {
    method: 'PUT',
  })
}

/**
 * Archive a notification
 */
export async function archiveNotification(notificationId: string): Promise<void> {
  await authFetch(`/notifications/${notificationId}/archive`, {
    method: 'PUT',
  })
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await authFetch(`/notifications/${notificationId}`, {
    method: 'DELETE',
  })
}

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await authFetch('/notifications/preferences')
  return response.json()
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await authFetch('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  })
  return response.json()
}

/**
 * Get notification type name from ID
 */
export function getNotificationTypeName(typeId: number): string {
  const typeMap: Record<number, string> = {
    1: 'Event Reminder',
    2: 'Event Created',
    3: 'Event Cancelled',
    4: 'Event Updated',
    5: 'Attendee Joined',
    6: 'Center Announcement',
    7: 'System Notification',
  }
  return typeMap[typeId] || 'Notification'
}

/**
 * Get notification type icon from ID
 */
export function getNotificationTypeIcon(typeId: number): string {
  const iconMap: Record<number, string> = {
    1: 'bell',
    2: 'calendar-plus',
    3: 'calendar-minus',
    4: 'calendar-edit',
    5: 'user-plus',
    6: 'megaphone',
    7: 'info',
  }
  return iconMap[typeId] || 'bell'
}

/**
 * Filter notifications by type
 */
export function filterNotificationsByType(
  notifications: Notification[],
  typeId: number
): Notification[] {
  return notifications.filter((n) => n.typeId === typeId)
}

/**
 * Get unread notifications
 */
export function getUnreadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => !n.isRead)
}

/**
 * Sort notifications by creation date (newest first)
 */
export function sortNotificationsByDate(notifications: Notification[]): Notification[] {
  return [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

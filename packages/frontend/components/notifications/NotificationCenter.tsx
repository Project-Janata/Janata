/**
 * NotificationCenter.tsx
 *
 * Notification center screen showing all notifications
 */

import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { Bell } from 'lucide-react-native'
import type { Notification } from '../../utils/notificationService'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  archiveNotification,
  deleteNotification,
} from '../../utils/notificationService'
import { NotificationItem } from './NotificationItem'
import { useColors } from '../../hooks/useColors'

interface NotificationCenterProps {
  onNotificationPress?: (notification: Notification) => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationPress }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const c = useColors()

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications({
        limit: 50,
        offset: 0,
        unreadOnly: filter === 'unread',
      })
      setNotifications(data.notifications)
      setOffset(0)
      setHasMore(data.count === 50)
    } catch (error) {
      console.error('Failed to load notifications:', error)
      Alert.alert('Error', 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loading) return

    try {
      const newOffset = offset + 50
      const data = await getNotifications({
        limit: 50,
        offset: newOffset,
        unreadOnly: filter === 'unread',
      })

      setNotifications((prev) => [...prev, ...data.notifications])
      setOffset(newOffset)
      setHasMore(data.count === 50)
    } catch (error) {
      console.error('Failed to load more notifications:', error)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      )
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      Alert.alert('Error', 'Failed to mark notification as read')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
      Alert.alert('Error', 'Failed to mark all as read')
    }
  }

  const handleArchive = async (notificationId: string) => {
    try {
      await archiveNotification(notificationId)
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      )
    } catch (error) {
      console.error('Failed to archive notification:', error)
      Alert.alert('Error', 'Failed to archive notification')
    }
  }

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      )
    } catch (error) {
      console.error('Failed to delete notification:', error)
      Alert.alert('Error', 'Failed to delete notification')
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <View style={{ flex: 1, backgroundColor: c.card }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: c.text }}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={{ backgroundColor: c.accent, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: c.border, alignItems: 'center' }}>
        <TouchableOpacity
          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: filter === 'all' ? c.accent : c.surface }}
          onPress={() => setFilter('all')}
        >
          <Text style={{ fontSize: 12, color: filter === 'all' ? '#fff' : c.textMuted, fontWeight: '500' }}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: filter === 'unread' ? c.accent : c.surface }}
          onPress={() => setFilter('unread')}
        >
          <Text style={{ fontSize: 12, color: filter === 'unread' ? '#fff' : c.textMuted, fontWeight: '500' }}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={{ marginLeft: 'auto' as any, paddingHorizontal: 12, paddingVertical: 6 }}
            onPress={handleMarkAllAsRead}
          >
            <Text style={{ fontSize: 12, color: c.accent, fontWeight: '500' }}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={{ marginTop: 12, fontSize: 14, color: c.textMuted }}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={26} color={c.accent} />
          </View>
          <Text style={{ marginTop: 16, fontFamily: 'Inclusive Sans', fontSize: 16, color: c.text, textAlign: 'center' }}>
            {filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          </Text>
          <Text style={{ marginTop: 6, fontSize: 13.5, lineHeight: 19, color: c.textMuted, textAlign: 'center', maxWidth: 300 }}>
            {filter === 'unread'
              ? 'New unread notifications will show up here.'
              : 'Replies, mentions, and updates from your center and the events you join will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => onNotificationPress?.(item)}
              onMarkAsRead={() => handleMarkAsRead(item.id)}
              onArchive={() => handleArchive(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore ? <ActivityIndicator size="small" color={c.accent} style={{ paddingVertical: 16 }} /> : null
          }
        />
      )}
    </View>
  )
}

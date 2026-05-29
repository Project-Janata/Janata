/**
 * NotificationCenter.tsx
 *
 * Notification center screen showing all notifications
 */

import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
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
  /**
   * Render the built-in "Notifications" title row. Defaults to true.
   * Pass false when the hosting screen already supplies a header
   * (e.g. the /notifications route uses StackHeader for the title + back).
   */
  showHeader?: boolean
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  onNotificationPress,
  showHeader = true,
}) => {
  const c = useColors()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

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
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      {showHeader && (
        <View style={[styles.header, { borderBottomColor: c.divider }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <Text style={[styles.badgeText, { color: c.textInverse }]}>{unreadCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Filters */}
      <View style={[styles.filterContainer, { borderBottomColor: c.divider }]}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filter === 'all' ? c.accent : c.surface },
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: filter === 'all' ? c.textInverse : c.textMuted }]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filter === 'unread' ? c.accent : c.surface },
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, { color: filter === 'unread' ? c.textInverse : c.textMuted }]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Text style={[styles.markAllText, { color: c.accent }]}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={c.accent} />
          <Text style={[styles.loadingText, { color: c.textMuted }]}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
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
            hasMore ? <ActivityIndicator size="small" color={c.accent} style={styles.footer} /> : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  markAllButton: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  emptyText: {
    fontSize: 16,
  },
  footer: {
    paddingVertical: 16,
  },
})

/**
 * NotificationItem.tsx
 *
 * Individual notification item component
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Notification } from '../../utils/notificationService'
import { getNotificationTypeName } from '../../utils/notificationService'
import { useColors } from '../../hooks/useColors'

interface NotificationItemProps {
  notification: Notification
  onPress?: () => void
  onMarkAsRead?: () => void
  onArchive?: () => void
  onDelete?: () => void
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onArchive,
  onDelete,
}) => {
  const c = useColors()
  const timestamp = new Date(notification.createdAt)
  const timeString = getTimeString(timestamp)

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { borderBottomColor: c.divider, backgroundColor: c.card },
        !notification.isRead && { backgroundColor: c.cardActive },
      ]}
      onPress={() => {
        if (!notification.isRead && onMarkAsRead) {
          onMarkAsRead()
        }
        onPress?.()
      }}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: c.text },
              !notification.isRead && styles.unreadTitle,
            ]}
          >
            {notification.title}
          </Text>
          <Text style={[styles.time, { color: c.textFaint }]}>{timeString}</Text>
        </View>
        <Text style={[styles.message, { color: c.textSecondary }]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={[styles.type, { color: c.textMuted }]}>
          {getNotificationTypeName(notification.typeId)}
        </Text>
      </View>

      {!notification.isRead && (
        <View style={[styles.unreadIndicator, { backgroundColor: c.accent }]} />
      )}

      <View style={styles.actions}>
        {!notification.isRead && onMarkAsRead && (
          <TouchableOpacity onPress={onMarkAsRead} style={[styles.actionButton, { backgroundColor: c.surface }]}>
            <Text style={[styles.actionText, { color: c.text }]}>✓</Text>
          </TouchableOpacity>
        )}
        {onArchive && (
          <TouchableOpacity onPress={onArchive} style={[styles.actionButton, { backgroundColor: c.surface }]}>
            <Text style={styles.actionText}>📥</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={[styles.actionButton, { backgroundColor: c.surface }]}>
            <Text style={[styles.actionText, { color: c.text }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

function getTimeString(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString()
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  type: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
  },
})

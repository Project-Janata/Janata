/**
 * NotificationItem.tsx
 *
 * Individual notification item component
 */

import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
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
  const timestamp = new Date(notification.createdAt)
  const timeString = getTimeString(timestamp)
  const c = useColors()

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        backgroundColor: notification.isRead ? c.card : c.surface,
        alignItems: 'center',
      }}
      onPress={() => {
        if (!notification.isRead && onMarkAsRead) {
          onMarkAsRead()
        }
        onPress?.()
      }}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: notification.isRead ? '500' : '700',
            color: c.text,
            flex: 1,
          }}>
            {notification.title}
          </Text>
          <Text style={{ fontSize: 12, color: c.textFaint, marginLeft: 8 }}>{timeString}</Text>
        </View>
        <Text style={{ fontSize: 14, color: c.textSecondary, marginBottom: 4, lineHeight: 20 }} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={{ fontSize: 12, color: c.textFaint, fontStyle: 'italic' }}>
          {getNotificationTypeName(notification.typeId)}
        </Text>
      </View>

      {!notification.isRead && (
        <View style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: c.accent,
          marginRight: 8,
        }} />
      )}

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {!notification.isRead && onMarkAsRead && (
          <TouchableOpacity onPress={onMarkAsRead} style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>✓</Text>
          </TouchableOpacity>
        )}
        {onArchive && (
          <TouchableOpacity onPress={onArchive} style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>📥</Text>
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16 }}>✕</Text>
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

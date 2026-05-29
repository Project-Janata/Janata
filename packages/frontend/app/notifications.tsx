import React from 'react'
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import StackHeader from '../components/ui/StackHeader'
import { NotificationCenter } from '../components/notifications/NotificationCenter'
import { useColors } from '../hooks/useColors'
import type { Notification } from '../utils/notificationService'

export default function NotificationsScreen() {
  const c = useColors()
  const router = useRouter()

  const handleNotificationPress = (notification: Notification) => {
    // Deep-link to the related resource when the notification carries one.
    if (notification.actionUrl) {
      router.push(notification.actionUrl as never)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StackHeader title="Notifications" />
      <NotificationCenter showHeader={false} onNotificationPress={handleNotificationPress} />
    </View>
  )
}

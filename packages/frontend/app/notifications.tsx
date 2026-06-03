import React, { useEffect } from 'react'
import { View, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import StackHeader from '../components/ui/StackHeader'
import { NotificationCenter } from '../components/notifications/NotificationCenter'
import { useColors } from '../hooks/useColors'
import { useUser } from '../components/contexts'
import type { Notification } from '../utils/notificationService'

export default function NotificationsScreen() {
  const c = useColors()
  const router = useRouter()
  const { user, loading } = useUser()

  // Account-only screen — bounce guests to sign-in.
  useEffect(() => {
    if (Platform.OS !== 'web' && !loading && !user) router.replace('/auth')
  }, [user, loading])

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

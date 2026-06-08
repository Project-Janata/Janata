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

  // Guests get redirected by the effect above; render nothing in the meantime so
  // NotificationCenter doesn't mount and fire an unauthenticated request.
  if (Platform.OS !== 'web' && !user) {
    return <View style={{ flex: 1, backgroundColor: c.bg }} />
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StackHeader title="Notifications" />
      <NotificationCenter showHeader={false} onNotificationPress={handleNotificationPress} />
    </View>
  )
}

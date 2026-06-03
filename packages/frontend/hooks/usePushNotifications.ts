/**
 * usePushNotifications.ts
 *
 * Registers the device for push once the user is authenticated and routes
 * notification taps to the right screen (#102). Platform-agnostic: the web
 * build resolves pushNotifications.web.ts (no-ops), native resolves
 * pushNotifications.native.ts.
 */
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { useUser } from '../components/contexts'
import {
  getExpoPushTokenAsync,
  addNotificationResponseListener,
} from '../utils/pushNotifications'
import { registerPushToken } from '../utils/notificationService'
import { setActivePushToken } from '../utils/pushTokenRef'

export function usePushNotifications(): void {
  const { user } = useUser()
  const router = useRouter()
  const registeredFor = useRef<string | null>(null)

  // Register this device's push token after login. Re-runs if the user
  // changes (e.g. logout then login as someone else).
  useEffect(() => {
    if (!user?.username) return
    if (registeredFor.current === user.username) return

    let cancelled = false
    ;(async () => {
      const token = await getExpoPushTokenAsync()
      if (!token || cancelled) return
      setActivePushToken(token)
      try {
        await registerPushToken(token, Platform.OS)
        registeredFor.current = user.username
      } catch (err) {
        console.warn('[push] register failed:', err)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.username])

  // Route notification taps. Mounted once; deep-links via the actionUrl that
  // the backend attached to each notification (e.g. /feed/:postId).
  useEffect(() => {
    const unsubscribe = addNotificationResponseListener(({ actionUrl }) => {
      if (actionUrl) {
        try {
          router.push(actionUrl as never)
        } catch (err) {
          console.warn('[push] failed to route notification tap:', err)
        }
      }
    })
    return unsubscribe
  }, [router])
}

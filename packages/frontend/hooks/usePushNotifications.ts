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
import { usePostHog } from 'posthog-react-native'
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
  // usePostHog() returns the stable client, so adding it to effect deps below
  // doesn't re-subscribe the listeners on every render.
  const posthog = usePostHog()
  const registeredFor = useRef<string | null>(null)

  // Register this device's push token after login. Re-runs if the user
  // changes (e.g. logout then login as someone else).
  useEffect(() => {
    if (!user?.username) return
    if (registeredFor.current === user.username) return

    let cancelled = false
    ;(async () => {
      const token = await getExpoPushTokenAsync()
      if (cancelled) return
      // A real device that grants permission yields a token; null means the
      // user declined, it's a simulator, or push isn't available here. Skip the
      // event on web, where push is never supported (avoids false "denied").
      if (!token) {
        if (Platform.OS !== 'web') {
          posthog?.capture('push_permission_denied', { platform: Platform.OS })
        }
        return
      }
      posthog?.capture('push_permission_granted', { platform: Platform.OS })
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
  }, [user?.username, posthog])

  // Route notification taps. Mounted once; deep-links via the actionUrl that
  // the backend attached to each notification (e.g. /feed/:postId).
  useEffect(() => {
    const unsubscribe = addNotificationResponseListener(({ actionUrl, data }) => {
      // Re-engagement signal: a push brought the user back into the app.
      posthog?.capture('notification_opened', {
        action_url: actionUrl ?? null,
        notification_type: typeof data?.type === 'string' ? data.type : null,
        source: 'push',
      })
      if (actionUrl) {
        try {
          router.push(actionUrl as never)
        } catch (err) {
          console.warn('[push] failed to route notification tap:', err)
        }
      }
    })
    return unsubscribe
  }, [router, posthog])
}

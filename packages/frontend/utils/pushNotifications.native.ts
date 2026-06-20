/**
 * pushNotifications.native.ts
 *
 * Native (iOS/Android) device-side push wiring for #102. Handles permission,
 * obtaining the Expo push token, the Android notification channel, and the
 * foreground presentation behaviour. The matching .web.ts file is a no-op so
 * the web bundle never imports expo-notifications.
 */
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

export interface PushTapPayload {
  actionUrl: string | null
  data: Record<string, unknown>
}

// Foreground behaviour: show a banner + play sound even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Ensure the Android "default" channel exists. iOS has no channels; no-op there.
 */
export async function configureNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8A3D',
    })
  }
}

/**
 * Request permission and return this device's Expo push token, or null if the
 * device can't receive push (simulator, denied permission, no projectId).
 */
export async function getExpoPushTokenAsync(): Promise<string | null> {
  // Push only works on physical devices.
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  await configureNotificationChannel()

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    return tokenResponse.data
  } catch (err) {
    console.warn('[push] failed to get Expo push token:', err)
    return null
  }
}

function extractTap(response: Notifications.NotificationResponse): PushTapPayload {
  const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>
  const actionUrl = typeof data.actionUrl === 'string' ? data.actionUrl : null
  return { actionUrl, data }
}

/**
 * Notification identifiers we've already routed this session. The launch tap
 * (#535) is surfaced on two channels — the live listener and
 * getLastNotificationResponseAsync — and the latter keeps returning the SAME
 * launch response for the whole session, re-delivered every time the routing
 * effect re-subscribes. Keying on the notification identifier ensures each tap
 * is handled exactly once, no matter how many channels report it or how often
 * the listener is re-created. Module-level so it survives re-subscription.
 */
const handledTapIds = new Set<string>()

/**
 * Subscribe to notification taps. Fires the handler when the user taps a push
 * (both cold-start and warm). Each distinct notification is routed at most once
 * per session. Returns an unsubscribe function.
 */
export function addNotificationResponseListener(
  handler: (payload: PushTapPayload) => void,
): () => void {
  const handleOnce = (response: Notifications.NotificationResponse) => {
    const id = response.notification.request.identifier
    if (id && handledTapIds.has(id)) return
    if (id) handledTapIds.add(id)
    handler(extractTap(response))
  }

  // Warm taps while the app is running.
  const sub = Notifications.addNotificationResponseReceivedListener(handleOnce)

  // Cold start: the app was launched by tapping a notification.
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handleOnce(response)
  })

  return () => sub.remove()
}

export const isPushSupported = true

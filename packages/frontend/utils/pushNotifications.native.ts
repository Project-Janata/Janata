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
 * Subscribe to notification taps. Fires the handler when the user taps a push
 * (both cold-start and warm). Returns an unsubscribe function.
 */
export function addNotificationResponseListener(
  handler: (payload: PushTapPayload) => void,
): () => void {
  // Warm taps while the app is running.
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    handler(extractTap(response))
  })

  // Cold start: the app was launched by tapping a notification.
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) handler(extractTap(response))
  })

  return () => sub.remove()
}

export const isPushSupported = true

/**
 * pushNotifications.web.ts
 *
 * Web no-op stubs. The web build does not deliver native push, so these keep
 * the shared hook importable without pulling expo-notifications into the web
 * bundle. Same shape as pushNotifications.native.ts.
 */
export interface PushTapPayload {
  actionUrl: string | null
  data: Record<string, unknown>
}

export async function configureNotificationChannel(): Promise<void> {}

export async function getExpoPushTokenAsync(): Promise<string | null> {
  return null
}

export function addNotificationResponseListener(
  _handler: (payload: PushTapPayload) => void,
): () => void {
  return () => {}
}

export const isPushSupported = false

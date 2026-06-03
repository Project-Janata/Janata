// Platform-split base. TypeScript and any non-native/non-web fallback resolve
// here; Metro overrides with pushNotifications.native.ts (iOS/Android) and
// pushNotifications.web.ts (web) at bundle time. Mirrors the Map / AuthInput
// convention used elsewhere in the app.
export {
  type PushTapPayload,
  configureNotificationChannel,
  getExpoPushTokenAsync,
  addNotificationResponseListener,
  isPushSupported,
} from './pushNotifications.web'

/**
 * analyticsEnv.ts
 *
 * Super properties registered once per session so every captured event carries
 * the environment it came from. The posthog-react-native SDK already auto-adds
 * device facts ($os, $os_version, $device_type, $device_name, $app_version,
 * $app_build, $locale), so this layer only adds what the SDK can't infer:
 *
 *  - environment        development vs production (so dev noise is filterable)
 *  - release_channel     development / preview / production (TestFlight vs store)
 *  - app_platform        ios | android | web
 *  - is_native           native app vs the web build
 *  - is_first_session    new vs returning on THIS device (engagement cut)
 *
 * Pair with the person-level traits in analyticsIdentity.ts (which add the
 * authenticated user's returning-ness once they identify).
 */

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const FIRST_SEEN_KEY = '@analytics_first_seen_at'

/** expo-updates is optional at runtime (absent in some web/dev contexts). */
function getReleaseChannel(): string {
  if (__DEV__) return 'development'
  try {
    // Lazy require so a missing/!native module can't crash the web bundle.
    const Updates = require('expo-updates') as { channel?: string | null }
    return Updates?.channel || 'production'
  } catch {
    return 'production'
  }
}

/**
 * Resolve whether this is the device's first ever session, and stamp the device
 * so subsequent launches read as returning. Best-effort: any storage failure
 * defaults to "not first" so we never inflate the new-user count.
 */
export async function resolveFirstSession(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return false
      const seen = localStorage.getItem(FIRST_SEEN_KEY)
      if (seen) return false
      localStorage.setItem(FIRST_SEEN_KEY, new Date().toISOString())
      return true
    }
    const seen = await AsyncStorage.getItem(FIRST_SEEN_KEY)
    if (seen) return false
    await AsyncStorage.setItem(FIRST_SEEN_KEY, new Date().toISOString())
    return true
  } catch {
    return false
  }
}

/** Super properties attached to every event captured after registration. */
export function buildSuperProperties(isFirstSession: boolean) {
  return {
    environment: __DEV__ ? 'development' : 'production',
    release_channel: getReleaseChannel(),
    app_platform: Platform.OS,
    is_native: Platform.OS !== 'web',
    is_first_session: isFirstSession,
  }
}

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
const ACQUISITION_KEY = '@analytics_acquisition_v1'

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

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

/**
 * Web acquisition attribution (#413). posthog-react-native doesn't auto-capture
 * utm_* / referrer the way posthog-js does, so read them from the first landing
 * URL + document.referrer and return:
 *   - superProps: utm_* + $referrer/$referring_domain → register() so this
 *     session's events (signup, content_created) are filterable by source.
 *   - setOnce: $initial_* variants → first-touch person properties that stick
 *     across sessions (PostHog's first-touch convention).
 *
 * Returns null off-web, after the first capture (localStorage-guarded so it's
 * truly first-touch and internal navigations never overwrite it), or when
 * there's nothing to attribute (no utm tags + same-origin/empty referrer).
 */
export function readWebAcquisition(): {
  superProps: Record<string, string>
  setOnce: Record<string, string>
} | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null
  try {
    if (localStorage.getItem(ACQUISITION_KEY)) return null

    const params = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const key of UTM_KEYS) {
      const v = params.get(key)
      if (v) utm[key] = v
    }

    const referrer = document.referrer || ''
    let referringDomain = ''
    try {
      referringDomain = referrer ? new URL(referrer).hostname : ''
    } catch {
      referringDomain = ''
    }
    const isExternalReferrer = !!referringDomain && referringDomain !== window.location.hostname

    // Stamp now either way so we only inspect the genuine first landing.
    localStorage.setItem(ACQUISITION_KEY, new Date().toISOString())

    // Nothing to attribute: no campaign tags and no external referrer.
    if (Object.keys(utm).length === 0 && !isExternalReferrer) return null

    const referrerValue = isExternalReferrer ? referrer : '$direct'
    const referringDomainValue = isExternalReferrer ? referringDomain : '$direct'

    const superProps: Record<string, string> = {
      ...utm,
      $referrer: referrerValue,
      $referring_domain: referringDomainValue,
    }
    const setOnce: Record<string, string> = {
      $initial_referrer: referrerValue,
      $initial_referring_domain: referringDomainValue,
    }
    for (const [k, v] of Object.entries(utm)) setOnce[`$initial_${k}`] = v

    return { superProps, setOnce }
  } catch {
    return null
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

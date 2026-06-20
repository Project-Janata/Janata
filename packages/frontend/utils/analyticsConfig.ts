/**
 * analyticsConfig.ts
 *
 * Pure host/key resolution for the PostHog client, extracted from `_layout.tsx`
 * so the live contract is testable (Janata #541).
 *
 * The web build used to point PostHog straight at `https://us.i.posthog.com`.
 * In a browser that is a cross-origin request — it triggers a CORS preflight
 * and is trivially dropped by ad-blockers, so web analytics never landed.
 *
 * The fix: web captures through the app's OWN origin via a reverse-proxy path
 * (`/ingest`, rewritten to PostHog at the edge). That keeps every request
 * same-origin (no CORS, ad-blocker resistant). Native (iOS/Android) has no CORS
 * and can't resolve a relative path, so it keeps talking to the direct
 * absolute ingestion host.
 */

/** Same-origin reverse-proxy path the web build sends events to. */
export const WEB_INGEST_PATH = '/ingest'

/** Direct ingestion host used by the native clients (no CORS, needs absolute URL). */
export const DEFAULT_NATIVE_POSTHOG_HOST = 'https://us.i.posthog.com'

type Platform = 'web' | 'ios' | 'android'

interface ResolvePostHogHostOptions {
  platform: Platform
  /** Process env, read for an EXPO_PUBLIC_POSTHOG_HOST override. */
  env?: Record<string, string | undefined>
  /** window.location.origin on web (unused for the relative default). */
  origin?: string
}

/**
 * Resolve the host the PostHog client should talk to.
 *
 *  - web    → a same-origin host (default: the `/ingest` reverse-proxy path) so
 *             the browser never makes a cross-origin request.
 *  - native → a direct absolute `https://…posthog.com` ingestion host.
 *  - An explicit EXPO_PUBLIC_POSTHOG_HOST override is honored on either.
 */
export function resolvePostHogHost(options: ResolvePostHogHostOptions): string {
  const { platform, env, origin } = options
  const override = env?.EXPO_PUBLIC_POSTHOG_HOST?.trim()

  if (platform === 'web') {
    // Honor an explicit override, else proxy through the local /ingest path.
    const path = override || WEB_INGEST_PATH
    // Absolutize a same-origin/relative path against the app's own origin so the
    // client always gets a well-formed URL — still same-origin, so no CORS.
    if (origin && path.startsWith('/')) {
      return origin.replace(/\/+$/, '') + path
    }
    return path
  }

  // Native: never a relative path — fetch needs an absolute URL.
  return override || DEFAULT_NATIVE_POSTHOG_HOST
}

/**
 * Whether a key is safe to ship in the client bundle.
 *
 * Only a public project key (`phc_…`) may reach the browser/app. Personal or
 * secret keys (`phx_…`, `phs_…`) and anything empty/unknown are rejected so a
 * secret can never be embedded in a public build.
 */
export function isSafeClientPostHogKey(key: string | null | undefined): boolean {
  if (typeof key !== 'string') return false
  return key.trim().startsWith('phc_')
}

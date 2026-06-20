/**
 * analyticsConfig.test.ts
 *
 * Independent tests for the PostHog client configuration introduced to fix the
 * live-web CORS / collection problem (Janata #541).
 *
 * Background: the web build currently points PostHog straight at the
 * third-party origin `https://us.i.posthog.com` (see `app/_layout.tsx`). In a
 * browser that is a cross-origin request, which is what throws the CORS /
 * "config" console errors and lets ad-blockers silently drop events — so web
 * analytics never reach PostHog.
 *
 * The fix these tests pin down extracts host/key resolution out of the
 * (untestable) `_layout.tsx` component into a small pure module,
 * `utils/analyticsConfig.ts`, with the SAME contract the live app must use:
 *
 *   resolvePostHogHost(options: {
 *     platform: 'web' | 'ios' | 'android'
 *     env?: Record<string, string | undefined>   // reads EXPO_PUBLIC_POSTHOG_HOST
 *     origin?: string                              // window.location.origin on web
 *   }): string
 *
 *     - WEB    → a SAME-ORIGIN host (the app's own reverse-proxy path/origin) so
 *               the browser never makes a cross-origin request → no CORS errors,
 *               no ad-blocker drops. Must NOT be a `*.posthog.com` host.
 *     - NATIVE → a direct, absolute `https://…posthog.com` ingestion host
 *               (native fetch has no CORS; a relative path would break it).
 *     - An explicit `EXPO_PUBLIC_POSTHOG_HOST` override is honored.
 *
 *   isSafeClientPostHogKey(key: string | null | undefined): boolean
 *
 *     - true ONLY for a public project key (`phc_…`, the value safe to ship in
 *       the client bundle). false for personal/secret keys (`phx_…`) and for
 *       anything empty/unknown — so a secret can never be shipped to the browser.
 *
 * These assert observable behaviour (the host the browser/native client will
 * actually talk to, and which keys are allowed client-side), not internals.
 */

import { describe, it, expect } from 'vitest'
import { resolvePostHogHost, isSafeClientPostHogKey } from '../../utils/analyticsConfig'

const PROD_ORIGIN = 'https://chinmayajanata.org'
const PREVIEW_ORIGIN = 'https://project-janatha.pages.dev'

/** Origin of a host as the browser would compute it, resolving relative paths. */
function originOf(host: string, base: string): string {
  return new URL(host, base).origin
}

describe('resolvePostHogHost — web is CORS-safe (same-origin)', () => {
  it('routes web capture through the app’s own origin (no cross-origin request)', () => {
    const host = resolvePostHogHost({ platform: 'web', env: {}, origin: PROD_ORIGIN })
    expect(host).toBeTruthy()
    expect(typeof host).toBe('string')
    // The browser must talk to the app's own origin, so the request is
    // same-origin and never triggers a CORS preflight/failure.
    expect(originOf(host, PROD_ORIGIN)).toBe(PROD_ORIGIN)
  })

  it('never sends web events directly to a *.posthog.com host', () => {
    const host = resolvePostHogHost({ platform: 'web', env: {}, origin: PROD_ORIGIN })
    const resolvedHostname = new URL(host, PROD_ORIGIN).hostname
    expect(resolvedHostname).not.toBe('us.i.posthog.com')
    expect(resolvedHostname.endsWith('posthog.com')).toBe(false)
    expect(resolvedHostname).toBe('chinmayajanata.org')
  })

  it('is origin-relative so preview deploys stay same-origin too', () => {
    const host = resolvePostHogHost({ platform: 'web', env: {}, origin: PREVIEW_ORIGIN })
    expect(originOf(host, PREVIEW_ORIGIN)).toBe(PREVIEW_ORIGIN)
    expect(new URL(host, PREVIEW_ORIGIN).hostname.endsWith('posthog.com')).toBe(false)
  })

  it('honors a same-origin / relative EXPO_PUBLIC_POSTHOG_HOST override on web', () => {
    const host = resolvePostHogHost({
      platform: 'web',
      env: { EXPO_PUBLIC_POSTHOG_HOST: '/ingest' },
      origin: PROD_ORIGIN,
    })
    expect(originOf(host, PROD_ORIGIN)).toBe(PROD_ORIGIN)
  })

  it('does not return the bare cross-origin PostHog default on web', () => {
    const host = resolvePostHogHost({ platform: 'web', env: {}, origin: PROD_ORIGIN })
    expect(host).not.toBe('https://us.i.posthog.com')
    expect(host).not.toBe('https://us.i.posthog.com/')
  })
})

describe('resolvePostHogHost — native uses a direct ingestion host', () => {
  it('ios resolves to an absolute https PostHog host by default', () => {
    const host = resolvePostHogHost({ platform: 'ios', env: {} })
    expect(host).toMatch(/^https:\/\//)
    expect(new URL(host).hostname.endsWith('posthog.com')).toBe(true)
  })

  it('android resolves to an absolute https PostHog host by default', () => {
    const host = resolvePostHogHost({ platform: 'android', env: {} })
    expect(host).toMatch(/^https:\/\//)
    expect(new URL(host).hostname.endsWith('posthog.com')).toBe(true)
  })

  it('never returns a relative path on native (relative breaks native fetch)', () => {
    const ios = resolvePostHogHost({ platform: 'ios', env: {} })
    const android = resolvePostHogHost({ platform: 'android', env: {} })
    expect(ios.startsWith('https://')).toBe(true)
    expect(android.startsWith('https://')).toBe(true)
  })

  it('honors an absolute EXPO_PUBLIC_POSTHOG_HOST override exactly on native', () => {
    const host = resolvePostHogHost({
      platform: 'ios',
      env: { EXPO_PUBLIC_POSTHOG_HOST: 'https://eu.i.posthog.com' },
    })
    expect(host).toBe('https://eu.i.posthog.com')
  })
})

describe('isSafeClientPostHogKey — only the public project key may ship', () => {
  it('accepts a public project key (phc_…)', () => {
    expect(isSafeClientPostHogKey('phc_AbC123dEf456GhI789jKl')).toBe(true)
  })

  it('accepts a public project key with surrounding whitespace (trimmed)', () => {
    expect(isSafeClientPostHogKey('  phc_AbC123dEf456GhI789jKl  ')).toBe(true)
  })

  it('rejects a personal API key (phx_…) so a secret never ships to the browser', () => {
    expect(isSafeClientPostHogKey('phx_AbC123dEf456GhI789jKl')).toBe(false)
  })

  it('rejects any non-public-key string', () => {
    expect(isSafeClientPostHogKey('phs_AbC123dEf456GhI789jKl')).toBe(false)
    expect(isSafeClientPostHogKey('not-a-posthog-key')).toBe(false)
    // A phc_ token that is NOT at the start must not slip through.
    expect(isSafeClientPostHogKey('xphc_AbC123dEf456')).toBe(false)
  })

  it('rejects empty / blank / missing keys', () => {
    expect(isSafeClientPostHogKey('')).toBe(false)
    expect(isSafeClientPostHogKey('   ')).toBe(false)
    expect(isSafeClientPostHogKey(undefined)).toBe(false)
    expect(isSafeClientPostHogKey(null)).toBe(false)
  })
})

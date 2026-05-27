/**
 * sentry.ts — opt-in error reporting via Sentry.
 *
 * RAILS-ONLY for #105. The actual @sentry/react-native dep is NOT yet a
 * dependency of this repo — Kish runs `npx expo install @sentry/react-native`
 * once a Sentry project exists and a DSN is in hand.
 *
 * This file is wired NOW so that:
 *   1. The integration points (init at root, capture in ErrorBoundary) are
 *      in place and won't need a follow-up PR to add.
 *   2. With EXPO_PUBLIC_SENTRY_DSN unset (current state), every call here
 *      is a cheap no-op. Nothing ships to Sentry, nothing crashes.
 *   3. The moment Kish sets EXPO_PUBLIC_SENTRY_DSN + installs the dep,
 *      Sentry just works.
 *
 * The dynamic `require` pattern mirrors how `edit-profile.tsx` handles
 * `expo-image-picker` — keeps the dep optional at the type-system level.
 */

let sentry: any = null
let initialized = false

function loadSentry(): any | null {
  if (sentry !== null) return sentry
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    sentry = require('@sentry/react-native')
    return sentry
  } catch {
    // Dep not installed yet. Stay silent — return null and let callers no-op.
    sentry = false // memoize the negative so we don't keep trying
    return null
  }
}

/**
 * Initialize Sentry. Idempotent — safe to call multiple times.
 *
 * - No DSN env var set → no-op (intended for dev + previews).
 * - DSN set but @sentry/react-native missing → no-op + a one-time warning.
 * - DSN set + dep present → Sentry initialized with the standard options.
 */
export function initSentry(): void {
  if (initialized) return
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim()
  if (!dsn) return

  const s = loadSentry()
  if (!s) {
    if (typeof console !== 'undefined' && (globalThis as any).__DEV__) {
      console.warn(
        '[sentry] EXPO_PUBLIC_SENTRY_DSN is set but @sentry/react-native is not installed. ' +
          'Run `npx expo install @sentry/react-native` to enable error reporting.',
      )
    }
    return
  }

  try {
    s.init({
      dsn,
      // Conservative defaults — we can tune once we see real traffic.
      tracesSampleRate: 0.1,        // 10% of transactions get performance traces
      profilesSampleRate: 0.1,
      // Per-environment tagging so prod / preview crashes don't blur together
      // in the Sentry dashboard.
      environment: process.env.EXPO_PUBLIC_SENTRY_ENV ?? 'production',
      // Don't ship breadcrumbs that include PII. Captured fields go through
      // beforeSend to scrub anything risky.
      beforeSend(event: any) {
        if (event?.request?.headers) delete event.request.headers
        if (event?.user) {
          // Keep an opaque id only; never email/name.
          delete event.user.email
          delete event.user.username
        }
        return event
      },
    })
    initialized = true
  } catch (e) {
    if (typeof console !== 'undefined') {
      console.warn('[sentry] init failed:', (e as Error).message)
    }
  }
}

/**
 * Forward an uncaught error to Sentry. Safe to call before init() — just no-ops.
 *
 * Use from ErrorBoundary.componentDidCatch (already wired) and from any
 * other catch site that wants to surface non-fatal errors.
 */
export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const s = loadSentry()
  if (!s || !initialized) return
  try {
    if (context) {
      s.withScope((scope: any) => {
        scope.setExtras(context)
        s.captureException(error)
      })
    } else {
      s.captureException(error)
    }
  } catch {
    // Don't let Sentry errors take down the app.
  }
}

/**
 * Identify the current user to Sentry. Pair with the PostHog identify call
 * in _layout.tsx so a single user shows up correctly in both dashboards.
 *
 * Pass a stable opaque id — NEVER pass email, username, or other PII.
 */
export function identifyUser(userId: string | null): void {
  const s = loadSentry()
  if (!s || !initialized) return
  try {
    if (userId) s.setUser({ id: userId })
    else s.setUser(null)
  } catch {
    /* swallow */
  }
}

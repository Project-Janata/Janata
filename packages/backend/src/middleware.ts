/**
 * middleware.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Shared Hono middleware: rate limiting, input validation, caching.
 */
import type { MiddlewareHandler } from 'hono'

// ── Rate Limiting ─────────────────────────────────────────────────────
//
// Simple in-memory sliding window per CF Workers isolate.
// Not globally consistent (each isolate has its own map), but sufficient
// for per-edge throttling of auth endpoints.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

/**
 * Clear all rate limit entries. Exported for testing only.
 */
export function clearRateLimits(): void {
  rateLimitMap.clear()
}

// Periodic cleanup to prevent memory leaks (runs at most every 60s).
// Plus a hard cap on map size (#125) — without it, sustained diverse-IP
// traffic between cleanups could let the map grow unbounded inside a
// long-lived isolate. 10K entries × ~80 bytes/entry ≈ 800KB worst case,
// well under the 128MB isolate limit but bounded.
const MAX_RATE_LIMIT_ENTRIES = 10_000
let lastCleanup = 0
function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key)
    }
  }
  // Safety valve: if the map is still large after cleanup (lots of live
  // windows in the last 60s), clear it. Cost is one window of allowing
  // requests that would have been blocked — acceptable tradeoff vs OOM.
  if (rateLimitMap.size > MAX_RATE_LIMIT_ENTRIES) {
    rateLimitMap.clear()
  }
}

/**
 * Rate limit middleware factory.
 * @param maxRequests Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  maxRequests: number,
  windowMs: number,
): MiddlewareHandler {
  return async (c, next) => {
    cleanupExpired()

    const ip =
      c.req.header('CF-Connecting-IP') ||
      new URL(c.req.url).host ||
      'unknown'

    const key = `${ip}:${c.req.path}`
    const now = Date.now()
    const entry = rateLimitMap.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
      c.header('X-RateLimit-Limit', String(maxRequests))
      c.header('X-RateLimit-Remaining', String(maxRequests - 1))
      await next()
      return
    }

    entry.count++

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      c.header('X-RateLimit-Limit', String(maxRequests))
      c.header('X-RateLimit-Remaining', '0')
      return c.json(
        { message: 'Too many requests. Please try again later.' },
        429,
      )
    }

    c.header('X-RateLimit-Limit', String(maxRequests))
    c.header('X-RateLimit-Remaining', String(maxRequests - entry.count))
    await next()
  }
}

// ── Input Validation Helpers ──────────────────────────────────────────

/** Max allowed length for common string fields */
const MAX_USERNAME = 64
const MAX_PASSWORD = 128
const MAX_NAME = 100
const MAX_EMAIL = 254
const MAX_PHONE = 20
const MAX_TITLE = 200
const MAX_DESCRIPTION = 5000
const MAX_ADDRESS = 500
const MAX_URL = 2048

/**
 * Validates that a string does not exceed a max length and is not empty.
 * Returns trimmed string or null if invalid.
 */
export function validateString(
  value: unknown,
  maxLen: number,
): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed.length > maxLen) return null
  return trimmed
}

/**
 * Validates an optional string (can be empty/null/undefined).
 * Returns trimmed string, null, or false if exceeds max length.
 */
export function validateOptionalString(
  value: unknown,
  maxLen: number,
): string | null | false {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (trimmed.length > maxLen) return false
  return trimmed || null
}

// Field-specific validators
export const validate = {
  username: (v: unknown) => validateString(v, MAX_USERNAME),
  password: (v: unknown) => validateString(v, MAX_PASSWORD),
  firstName: (v: unknown) => validateOptionalString(v, MAX_NAME),
  lastName: (v: unknown) => validateOptionalString(v, MAX_NAME),
  email: (v: unknown) => validateOptionalString(v, MAX_EMAIL),
  phone: (v: unknown) => validateOptionalString(v, MAX_PHONE),
  title: (v: unknown) => validateOptionalString(v, MAX_TITLE),
  description: (v: unknown) => validateOptionalString(v, MAX_DESCRIPTION),
  address: (v: unknown) => validateOptionalString(v, MAX_ADDRESS),
  url: (v: unknown) => validateOptionalString(v, MAX_URL),
  centerName: (v: unknown) => validateString(v, MAX_NAME),
  id: (v: unknown) => validateString(v, 64),
} as const

// ── Cache-Control Middleware ──────────────────────────────────────────

/**
 * Set Cache-Control header for public read endpoints.
 * Uses short max-age with stale-while-revalidate for freshness.
 */
export function cacheControl(maxAge: number, staleWhileRevalidate = 60): MiddlewareHandler {
  return async (c, next) => {
    await next()
    // Only cache successful GET responses
    if (c.req.method === 'GET' && c.res.status >= 200 && c.res.status < 300) {
      c.header(
        'Cache-Control',
        `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      )
    } else {
      // Ensure no caching for POST/authenticated requests if they happen to use this middleware
      c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      c.header('Pragma', 'no-cache')
      c.header('Expires', '0')
    }
  }
}

// ── Security Headers ──────────────────────────────────────────────────

export const securityHeaders: MiddlewareHandler = async (c, next) => {
  await next()
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
}

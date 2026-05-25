/**
 * constants.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Backend constants for Chinmaya Janata.
 * Workers-compatible (no Node.js APIs).
 */

// Admin
export const ADMIN_EMAIL = 'chinmayajanata@gmail.com'

// Developer emails that get elevated permissions on signup
export const DEVELOPER_EMAILS = [
  'kishparikh18@gmail.com',
  'ramachandran.abhiram@gmail.com',
  'p.vaish97@gmail.com',
  'sahanavasairamesh@gmail.com',
]

// Verification levels
// UNVERIFIED_USER is the v2 starting tier for self-signups before email
// verification or invite redemption. Promotion to NORMAL_USER happens on
// email-verify (with optional invite-code-driven level bump). See
// docs/plans/2026-05-05-v2-roles-invites-messaging.md §4.
export const UNVERIFIED_USER = 30
export const NORMAL_USER = 45
export const SEVAK = 54
export const SENIOR_SEVAK = 63
export const BRAHMACHARI = 108
export const SWAMI = 1008
export const GLOBAL_HEAD = 1000008
export const ADMIN_CUTOFF = 107

// Event categories
export const SATSANG = 91   // devotional gatherings, bhajans, chanting
export const BHIKSHA = 92   // food offerings, community meals
export const YAJNA = 93     // discourses, scriptural study, fire offerings, chanting competitions
export const CAMP = 94      // multi-day immersives — summer camps, retreats, residential programs
export const FESTIVAL = 95  // public celebrations — Holi, Diwali, Gurudev Jayanti, inaugurations
export const OTHER = 99     // catch-all for events that don't fit above (workshops, service trips, social)

// Tier calculation
export const TIER_DESCALE = 1081008

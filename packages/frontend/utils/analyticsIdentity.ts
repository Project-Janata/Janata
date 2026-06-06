/**
 * analyticsIdentity.ts
 *
 * Builds the PostHog person-property payload sent on every `identify()`, and
 * decides which accounts are internal/test so their activity can be filtered
 * out of product analytics. Centralised so every identify() call site (login,
 * signup, session restore) sets an identical, complete set of traits — a person
 * never ends up half-tagged depending on how they entered the session.
 *
 * Note: `email` / `firstName` / `lastName` are PERSON properties (attached to the
 * PostHog person profile via identify), not event properties. Event properties
 * stay PII-free per docs/analytics-events.md; person-level identity is expected.
 */

import type { User } from '../src/auth/types'

// Demo + staff accounts live on these domains — everything here is internal.
export const INTERNAL_EMAIL_DOMAINS = ['chinmayajanata.org', 'janata.app']

// One-off test emails that aren't on an internal domain.
export const INTERNAL_EMAILS = ['test@example.com', 'phone@test.com']

// Some test accounts identify by username (no email on the account).
export const INTERNAL_USERNAMES = ['qa-admin-local']

// Tell-tale tokens that appear in seeded/automation accounts' email or username
// (e.g. walkthrough.tester@…, qa-admin-…, demo-sevak). Substring match.
const INTERNAL_TOKENS = ['walkthrough', 'tester', 'qa-admin', 'demo-', 'e2e', 'smoke-test']

/**
 * True when the account is staff, a seeded demo persona, or an automation/QA
 * account. Matched on BOTH email and username, since identify() is keyed on
 * username and some test accounts have no email.
 */
export function isInternalUser(
  user: Pick<User, 'email' | 'username'> | null | undefined
): boolean {
  if (!user) return false
  const email = (user.email ?? '').trim().toLowerCase()
  const username = (user.username ?? '').trim().toLowerCase()

  if (email) {
    const domain = email.split('@')[1] ?? ''
    if (INTERNAL_EMAIL_DOMAINS.includes(domain)) return true
    if (INTERNAL_EMAILS.includes(email)) return true
  }
  if (username && INTERNAL_USERNAMES.includes(username)) return true

  const haystack = `${email} ${username}`
  return INTERNAL_TOKENS.some((token) => haystack.includes(token))
}

/**
 * Person properties to set on every `identify()`. Latest-wins (`$set`) for
 * everything except first-touch facts, which go under `$set_once` so a later
 * identify never overwrites them.
 *
 * PostHog's property type rejects `undefined`, so optional User fields are
 * coerced to null / boolean / number at the boundary.
 */
export function buildUserTraits(user: User) {
  const interestsCount = user.interests?.length ?? 0
  const lookingForCount = user.lookingFor?.length ?? 0

  return {
    // Identity (kept for back-compat with existing PostHog person views)
    email: user.email ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,

    // Segmentation — the cuts we actually slice engagement by
    $internal_or_test_user: isInternalUser(user),
    profileComplete: user.profileComplete ?? false,
    is_verified: user.isVerified ?? false,
    verification_level: user.verificationLevel ?? 0,
    center_id: user.centerID ?? null,
    has_center: !!user.centerID,
    has_photo: !!user.profileImage,
    has_bio: !!(user.bio && user.bio.trim()),
    interests_count: interestsCount,
    has_interests: interestsCount > 0,
    looking_for_count: lookingForCount,
    has_looking_for: lookingForCount > 0,
    region: user.region ?? null,
    points: user.points ?? 0,

    // First-touch facts — never overwritten on a later identify()
    $set_once: {
      first_identified_at: new Date().toISOString(),
      signup_at: user.createdAt ?? null,
    },
  }
}

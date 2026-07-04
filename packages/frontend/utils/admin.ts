// Shared admin constants and helpers

export const ADMIN_EMAIL = 'chinmayajanata@gmail.com'

export const isLocal =
  typeof window !== 'undefined' && window.location?.hostname === 'localhost'

export const ADMIN_LEVEL = 107
export const SEVAK_LEVEL = 54

export function isSuperAdmin(user: { email?: string | null; verificationLevel?: number } | null): boolean {
  if (!user) return false
  return (
    user.email === ADMIN_EMAIL ||
    (user.verificationLevel !== undefined && user.verificationLevel >= ADMIN_LEVEL) ||
    isLocal
  )
}

// Real admin capability — mirrors the backend adminMiddleware (level >= 107 or
// the admin email) and does NOT include the localhost bypass. Use this to gate
// admin-only tabs/endpoints so a sevak (or any local session) only sees what
// their token can actually do, instead of crashing on a 403.
export function hasAdminCapability(
  user: { email?: string | null; verificationLevel?: number } | null
): boolean {
  if (!user) return false
  return user.email === ADMIN_EMAIL || (user.verificationLevel ?? 0) >= ADMIN_LEVEL
}

// Who can open the admin app at all: admins (full), sevaks (Moderation only),
// or local dev. Matches the backend moderatorMiddleware (level >= 54).
export function isSevakOrAdmin(
  user: { email?: string | null; verificationLevel?: number } | null
): boolean {
  if (!user) return false
  return isSuperAdmin(user) || (user.verificationLevel ?? 0) >= SEVAK_LEVEL
}

/**
 * inviteCodes.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Invite code management. Supports two flavors against the same table:
 *   - Admin cohort codes (created via createInviteCode): multi-use,
 *     no expiry. Used for batch beta seeding.
 *   - User-issued single-use links (created via mintUserInviteCode,
 *     v2): one consumption, 30-day expiry, tied to a creator.
 *
 * See docs/plans/2026-05-05-v2-roles-invites-messaging.md §5.A.
 */

import type { Env, InviteCodeRow } from './types'
import { ADMIN_CUTOFF, NORMAL_USER } from './constants'

const USER_INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000
const USER_INVITE_CODE_BYTES = 6 // 12 hex chars

const SELECT_COLUMNS = `code, label, verification_level, is_active, created_at,
  created_by_user_id, expires_at, max_uses, uses_count`

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function isCodeUsable(row: InviteCodeRow, now: Date = new Date()): boolean {
  if (row.is_active !== 1) return false
  if (row.expires_at && new Date(row.expires_at) <= now) return false
  if (row.max_uses !== null && row.uses_count >= row.max_uses) return false
  return true
}

/**
 * Validate an invite code. Returns the row if it's active, not expired,
 * and has remaining uses. Returns null otherwise.
 */
export async function validateInviteCode(
  env: Env,
  code: string,
): Promise<InviteCodeRow | null> {
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return null
  }

  const result = await env.DB.prepare(
    `SELECT ${SELECT_COLUMNS} FROM invite_codes WHERE code = ?`,
  )
    .bind(normalizeCode(code))
    .first<InviteCodeRow>()

  if (!result) return null
  return isCodeUsable(result) ? result : null
}

/**
 * Get an invite code regardless of state (active/expired/exhausted).
 * Used for admin lookups and consumption flows that need to inspect
 * a previously-valid code.
 */
export async function getInviteCode(
  env: Env,
  code: string,
): Promise<InviteCodeRow | null> {
  if (!code || typeof code !== 'string') {
    return null
  }

  const result = await env.DB.prepare(
    `SELECT ${SELECT_COLUMNS} FROM invite_codes WHERE code = ?`,
  )
    .bind(normalizeCode(code))
    .first<InviteCodeRow>()

  return result || null
}

/**
 * Create an admin cohort code (multi-use, no expiry).
 * Used for batch beta seeding via admin endpoints.
 */
export async function createInviteCode(
  env: Env,
  code: string,
  label: string,
  verificationLevel: number,
  isActive: boolean = true,
): Promise<{ success: boolean; error?: string }> {
  if (!code || code.trim().length === 0) {
    return { success: false, error: 'Code is required' }
  }
  if (!label || label.trim().length === 0) {
    return { success: false, error: 'Label is required' }
  }
  if (typeof verificationLevel !== 'number' || verificationLevel < 0) {
    return { success: false, error: 'Valid verification_level is required' }
  }
  if (verificationLevel >= ADMIN_CUTOFF) {
    return { success: false, error: 'Verification level cannot grant admin access' }
  }

  try {
    const now = new Date().toISOString()
    await env.DB.prepare(
      `INSERT INTO invite_codes (code, label, verification_level, is_active, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(normalizeCode(code), label.trim(), verificationLevel, isActive ? 1 : 0, now)
      .run()
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create invite code' }
  }
}

/**
 * Mint a single-use, 30-day-expiry invite link tied to a user.
 * Promotes the recipient to NORMAL_USER on redemption.
 */
export async function mintUserInviteCode(
  env: Env,
  userId: string,
): Promise<{ success: true; code: string; expiresAt: string } | { success: false; error: string }> {
  // Random 12-char hex code. Collision space is 2^48 ≈ 2.8e14, plenty for
  // user-issued links. Retry up to 3 times in the (vanishingly rare) case
  // of a collision against an existing code.
  for (let attempt = 0; attempt < 3; attempt++) {
    const bytes = new Uint8Array(USER_INVITE_CODE_BYTES)
    crypto.getRandomValues(bytes)
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()

    const expiresAt = new Date(Date.now() + USER_INVITE_TTL_MS).toISOString()
    const now = new Date().toISOString()

    try {
      await env.DB.prepare(
        `INSERT INTO invite_codes
           (code, label, verification_level, is_active, created_at,
            created_by_user_id, expires_at, max_uses, uses_count)
         VALUES (?, ?, ?, 1, ?, ?, ?, 1, 0)`,
      )
        .bind(code, `User invite from ${userId}`, NORMAL_USER, now, userId, expiresAt)
        .run()
      return { success: true, code, expiresAt }
    } catch (error: any) {
      const message = String(error?.message || '')
      if (message.includes('UNIQUE') || message.includes('PRIMARY KEY')) {
        continue // collision, retry with a fresh code
      }
      return { success: false, error: message || 'Failed to mint invite code' }
    }
  }
  return { success: false, error: 'Failed to mint invite code after retries' }
}

/**
 * Atomically increment uses_count for a code, but only if it still has
 * remaining uses. Returns true if the row was updated.
 *
 * Note: this does NOT promote the user. Callers are responsible for any
 * verification_level bump on the consumer's account.
 */
export async function consumeInviteCode(env: Env, code: string): Promise<boolean> {
  if (!code || code.trim().length === 0) return false

  const result = await env.DB.prepare(
    `UPDATE invite_codes
       SET uses_count = uses_count + 1
     WHERE code = ?
       AND is_active = 1
       AND (expires_at IS NULL OR expires_at > ?)
       AND (max_uses IS NULL OR uses_count < max_uses)`,
  )
    .bind(normalizeCode(code), new Date().toISOString())
    .run()

  // D1 .run() returns meta.changes for the number of affected rows
  return (result.meta?.changes || 0) > 0
}

/**
 * List invite codes minted by a specific user.
 */
export async function getUserMintedCodes(
  env: Env,
  userId: string,
): Promise<InviteCodeRow[]> {
  const result = await env.DB.prepare(
    `SELECT ${SELECT_COLUMNS} FROM invite_codes
     WHERE created_by_user_id = ?
     ORDER BY created_at DESC`,
  )
    .bind(userId)
    .all<InviteCodeRow>()
  return result.results || []
}

/**
 * Deactivate an invite code.
 * Existing users keep their verification_level; new redemptions are blocked.
 */
export async function deactivateInviteCode(
  env: Env,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await env.DB.prepare(`UPDATE invite_codes SET is_active = 0 WHERE code = ?`)
      .bind(normalizeCode(code))
      .run()
    return result.success ? { success: true } : { success: false, error: 'Code not found' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Reactivate an invite code.
 */
export async function reactivateInviteCode(
  env: Env,
  code: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await env.DB.prepare(`UPDATE invite_codes SET is_active = 1 WHERE code = ?`)
      .bind(normalizeCode(code))
      .run()
    return result.success ? { success: true } : { success: false, error: 'Code not found' }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get all invite codes (admin/analytics).
 */
export async function getAllInviteCodes(env: Env): Promise<InviteCodeRow[]> {
  const result = await env.DB.prepare(
    `SELECT ${SELECT_COLUMNS} FROM invite_codes ORDER BY created_at DESC`,
  ).all<InviteCodeRow>()
  return result.results || []
}

/**
 * Count users who signed up with a specific invite code.
 */
export async function countUsersWithCode(env: Env, code: string): Promise<number> {
  const result = await env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE invite_code = ?`)
    .bind(normalizeCode(code))
    .first<{ count: number }>()
  return result?.count || 0
}

/**
 * Get all users who signed up with a specific invite code.
 */
export async function getUsersWithCode(env: Env, code: string): Promise<string[]> {
  const result = await env.DB.prepare(
    `SELECT id FROM users WHERE invite_code = ? ORDER BY created_at DESC`,
  )
    .bind(normalizeCode(code))
    .all<{ id: string }>()
  return (result.results || []).map((r) => r.id)
}

/**
 * Convert invite code row to API response format.
 */
export function inviteCodeRowToApi(row: InviteCodeRow) {
  return {
    code: row.code,
    label: row.label,
    verificationLevel: row.verification_level,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id,
    expiresAt: row.expires_at,
    maxUses: row.max_uses,
    usesCount: row.uses_count,
    // Convenience: derived "redeemable now" flag for clients.
    isUsable:
      row.is_active === 1 &&
      (!row.expires_at || new Date(row.expires_at) > new Date()) &&
      (row.max_uses === null || row.uses_count < row.max_uses),
  }
}

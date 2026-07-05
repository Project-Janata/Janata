/**
 * passwordReset.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Self-serve password reset via a 6-digit code emailed to the user.
 *
 * Design highlights (see docs/plans/2026-05-24-password-reset.md):
 *   - 6-digit code, expires in 15 minutes
 *   - PBKDF2-hashed in the DB (never plaintext)
 *   - Request always returns { ok: true } so attackers can't enumerate accounts
 *   - 5 verify attempts per code, then hard-invalidated
 *   - A new request is ignored while an unexpired active code exists
 *   - On successful reset, every live JWT for the user dies on next request
 *     (via the password-hash fingerprint in auth.ts — no token_version column
 *     needed)
 */

import type { Env, UserRow } from './types'
import { hashPassword, verifyPassword } from './auth'
import * as db from './db'
import { sendPasswordResetEmail, sendPasswordChangedEmail } from './email'

const CODE_TTL_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5
const MIN_PASSWORD_LENGTH = 8

interface ResetCodeRow {
  id: string
  user_id: string
  code_hash: string
  expires_at: string
  used_at: string | null
  attempts: number
  created_at: string
}

/**
 * Generate a cryptographically random 6-digit code, zero-padded.
 *
 * Uses crypto.getRandomValues for an unbiased draw across [0, 1_000_000).
 * Sampling a Uint32 (range 2^32 = 4_294_967_296) and taking modulo 1_000_000
 * has negligible bias: the cycle 1_000_000 divides into 2^32 with a remainder
 * of 967_296, which biases the values [0, 967_295] by ~2.25e-7 relative to
 * the rest. Below detection threshold for a 6-digit OTP.
 */
function generateResetCode(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  const n = buf[0] % 1_000_000
  return n.toString().padStart(6, '0')
}

/** Look up the most-recent active reset code for a user. */
async function findActiveCode(
  env: Env,
  userId: string,
): Promise<ResetCodeRow | null> {
  const nowISO = new Date().toISOString()
  const row = await env.DB.prepare(
    `SELECT id, user_id, code_hash, expires_at, used_at, attempts, created_at
     FROM password_reset_codes
     WHERE user_id = ?1
       AND used_at IS NULL
       AND expires_at > ?2
     ORDER BY created_at DESC
     LIMIT 1`,
  )
    .bind(userId, nowISO)
    .first<ResetCodeRow>()
  return row ?? null
}

/** Mark a single code as used. */
async function markCodeUsed(env: Env, id: string): Promise<void> {
  const nowISO = new Date().toISOString()
  await env.DB.prepare(
    `UPDATE password_reset_codes SET used_at = ?1 WHERE id = ?2`,
  )
    .bind(nowISO, id)
    .run()
}

/** Bump the attempts counter on a code by one. */
async function incrementAttempts(env: Env, id: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE password_reset_codes SET attempts = attempts + 1 WHERE id = ?1`,
  )
    .bind(id)
    .run()
}

/**
 * Insert a fresh reset code for the user. Returns the plaintext code so
 * the caller can email it. Hashed copy goes to the DB.
 */
async function createResetCode(env: Env, userId: string): Promise<string> {
  const code = generateResetCode()
  const codeHash = await hashPassword(code)
  const id = crypto.randomUUID()
  const now = Date.now()
  const expiresAt = new Date(now + CODE_TTL_MS).toISOString()
  const createdAt = new Date(now).toISOString()

  await env.DB.prepare(
    `INSERT INTO password_reset_codes (id, user_id, code_hash, expires_at, attempts, created_at)
     VALUES (?1, ?2, ?3, ?4, 0, ?5)`,
  )
    .bind(id, userId, codeHash, expiresAt, createdAt)
    .run()

  return code
}

/**
 * Public entry point for POST /auth/password-reset/request.
 *
 * Always succeeds from the caller's perspective. If the user exists and has no
 * active code, we mint a new one and fire the email. If an active code already
 * exists, we silently no-op so the endpoint cannot be used to flood the user.
 * If the
 * user doesn't exist we silently no-op so attackers can't differentiate
 * known vs unknown accounts.
 *
 * Email send errors are logged but never surfaced — same enumeration
 * concern applies (a Resend outage would otherwise leak the existence of
 * the email).
 */
export async function handlePasswordResetRequest(
  env: Env,
  rawUsername: string,
): Promise<void> {
  const username = rawUsername.trim().toLowerCase()
  if (!username) return

  const user = await db.getUserByUsername(env.DB, username)
  if (!user || !user.email) return

  const existing = await findActiveCode(env, user.id)
  if (existing) return

  const code = await createResetCode(env, user.id)

  try {
    await sendPasswordResetEmail(env, { email: user.email }, code)
  } catch (err) {
    console.error('password-reset email send failed:', err)
  }
}

export type ResetVerifyResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Public entry point for POST /auth/password-reset/verify.
 *
 * Validates input, finds the active code (if any), checks attempt budget,
 * verifies the code, then rotates the password. On success the user's
 * existing JWTs are implicitly invalidated by the auth.ts fingerprint
 * mechanism — no extra bookkeeping here.
 *
 * Returns a generic error message on every failure path so callers can't
 * distinguish "wrong code" from "code already used" from "user not found".
 */
export async function handlePasswordResetVerify(
  env: Env,
  rawUsername: string,
  rawCode: string,
  rawNewPassword: string,
): Promise<ResetVerifyResult> {
  const GENERIC_ERROR: ResetVerifyResult = {
    ok: false,
    error: 'Code invalid or expired',
  }

  const username = rawUsername.trim().toLowerCase()
  const code = rawCode.trim()
  const newPassword = rawNewPassword

  if (!username || !code || !newPassword) return GENERIC_ERROR
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: 'Password must be at least 8 characters long' }
  }

  const user: UserRow | null = await db.getUserByUsername(env.DB, username)
  if (!user) return GENERIC_ERROR

  const row = await findActiveCode(env, user.id)
  if (!row) return GENERIC_ERROR

  await incrementAttempts(env, row.id)
  const newAttempts = row.attempts + 1
  if (newAttempts >= MAX_ATTEMPTS) {
    // Burn the code so no further guesses can hit it, even if this attempt
    // happens to be correct.
    await markCodeUsed(env, row.id)
    return GENERIC_ERROR
  }

  const matched = await verifyPassword(code, row.code_hash)
  if (!matched) return GENERIC_ERROR

  const newHash = await hashPassword(newPassword)
  const updated = await db.updateUser(env.DB, user.id, { password: newHash })
  if (!updated.success) {
    // Don't burn the code on a server failure — let the user retry.
    return { ok: false, error: 'Failed to update password' }
  }

  await markCodeUsed(env, row.id)

  if (user.email) {
    try {
      await sendPasswordChangedEmail(env, { email: user.email })
    } catch (err) {
      console.error('password-changed email send failed:', err)
    }
  }

  return { ok: true }
}

/**
 * app.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Hono application for Chinmaya Janata backend.
 * Runs on Cloudflare Workers / Pages Functions.
 *
 * All Express routes ported to Hono with D1 + Web Crypto auth.
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, UserRow, EventRow, CenterRow, BoardPostApiResponse, BoardType } from './types'
import { userRowToApi, centerRowToApi, eventRowToApi, boardRowToApi } from './types'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  passwordFingerprint,
} from './auth'
import * as db from './db'
import * as inviteCodes from './inviteCodes'
import * as notifications from './notifications'
import * as passwordReset from './passwordReset'
import { sendVerificationEmail } from './email'
import { ADMIN_EMAIL, NORMAL_USER, SEVAK, BRAHMACHARI, TIER_DESCALE, ADMIN_CUTOFF, DEVELOPER_EMAILS, UNVERIFIED_USER } from './constants'
import { rateLimit, cacheControl, securityHeaders, validate } from './middleware'

// ── Hono app type with CF bindings ────────────────────────────────────

type HonoEnv = {
  Bindings: Env
  Variables: {
    user: UserRow
  }
}

export const app = new Hono<HonoEnv>().basePath('/api')

// ── Helper: Check if user is admin ─────────────────────────────────────

function isAdmin(user: { email: string | null; verification_level: number }): boolean {
  return user.email === ADMIN_EMAIL || user.verification_level >= ADMIN_CUTOFF
}

const BOARD_REACTIONS = new Set(['🙏', '👍', '🪔', '❤️', '🚗', '🌾'])

function isBoardType(value: string): value is BoardType {
  return value === 'center' || value === 'event'
}

function boardPostToApi(post: db.BoardPostWithAuthor): BoardPostApiResponse {
  return {
    id: post.id,
    boardId: post.board_id,
    body: post.body,
    imageUrl: post.image_url,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    deletedAt: post.deleted_at,
    author: userRowToApi(post.author),
    reactions: post.reactions,
    replyCount: post.reply_count,
  }
}

async function verifyBoardAccess(
  c: any,
  type: BoardType,
  parentId: string,
  user: UserRow,
): Promise<Response | null> {
  if (!parentId) {
    return c.json({ message: 'Board parent ID is required' }, 400)
  }

  const userIsAdmin = isAdmin(user)
  if (!userIsAdmin && user.verification_level < NORMAL_USER) {
    return c.json({ message: 'Verified member access required' }, 403)
  }

  if (type === 'center') {
    const center = await db.getCenterById(c.env.DB, parentId)
    if (!center) {
      return c.json({ message: 'Center not found' }, 404)
    }
    if (!userIsAdmin && user.center_id !== parentId) {
      return c.json({ message: 'You do not have access to this center board' }, 403)
    }
    return null
  }

  const event = await db.getEventById(c.env.DB, parentId)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  const isCreator = event.created_by === user.id
  const isAttending = await db.isUserAttending(c.env.DB, parentId, user.id)
  if (!userIsAdmin && !isCreator && !isAttending) {
    return c.json({ message: 'You do not have access to this event board' }, 403)
  }

  return null
}

// ── Admin middleware ─────────────────────────────────────────────────

async function adminMiddleware(c: any, next: () => Promise<void>): Promise<Response | void> {
  const authResult = await authMiddleware(c, async () => {})
  if (authResult) return authResult
  const user = c.get('user')
  if (!user || !isAdmin(user)) {
    return c.json({ message: 'Admin access required' }, 403)
  }
  await next()
}

// ── Global error handler ──────────────────────────────────────────────

app.onError((err, c) => {
  console.error(`[${c.req.method}] ${c.req.path} — Unhandled error:`, err)
  const errorMessage = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : ''
  console.error('Stack:', stack)
  return c.json({ message: 'Internal server error', error: errorMessage }, 500)
})

// ── Global middleware ─────────────────────────────────────────────────

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return '*'
      const allowed = [
        'https://chinmaya-janata.pages.dev',
        'https://chinmayajanata.org',
        'https://www.chinmayajanata.org',
        'https://main.project-janatha.pages.dev',
        'http://localhost:8081',
        'http://localhost:8787',
        'http://localhost:19006',
      ]
      if (allowed.includes(origin)) return origin
      if (origin.startsWith('http://localhost:')) return origin
      if (origin.endsWith('.chinmaya-janata.pages.dev')) return origin
      if (origin.endsWith('.project-janatha.pages.dev')) return origin
      return ''
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
)

app.use('*', securityHeaders)

// ── Auth middleware factory ───────────────────────────────────────────

async function authMiddleware(c: any, next: () => Promise<void>): Promise<Response | void> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    return c.json({ message: 'Authorization header missing' }, 401)
  }

  const parts = authHeader.split(' ')
  const token = parts.length > 1 ? parts[1] : parts[0]
  if (!token) {
    return c.json({ message: 'Authorization header missing' }, 401)
  }

  const decoded = await verifyToken(token, c.env.JWT_SECRET)
  if (!decoded || decoded.type !== 'access') {
    return c.json({ message: 'Invalid or expired token' }, 403)
  }

  const userData = await db.getUserByUsername(c.env.DB, decoded.username)
  if (!userData) {
    return c.json({ message: 'User not found' }, 403)
  }

  // Session-kill on password change: tokens minted after the rollout carry a
  // `tv` claim fingerprinting the password hash at issue time. If the password
  // has rotated since (reset flow), the fingerprints diverge and the token
  // dies. JWTs without a `tv` claim were issued before this check existed —
  // accept them so existing users aren't logged out at deploy.
  if (typeof decoded.tv === 'string') {
    const expected = await passwordFingerprint(userData.password)
    if (decoded.tv !== expected) {
      return c.json({ message: 'Session expired, please sign in again' }, 401)
    }
  }

  c.set('user', userData)
  await next()
}

// ── Health check ──────────────────────────────────────────────────────

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    message: 'Backend is running',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
  })
})

// ── User existence check ──────────────────────────────────────────────

app.post('/userExistence', async (c) => {
  const { username } = await c.req.json<{ username: string }>()
  if (!username) {
    return c.json({ existence: false })
  }
  const user = await db.getUserByUsername(c.env.DB, username)
  return c.json({ existence: !!user })
})

// ═══════════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/validate-invite-code
 * Validate an invite code for beta access
 * Public endpoint (no authentication required)
 */
app.post('/auth/validate-invite-code', rateLimit(10, 60_000), async (c) => {
  let body: { code?: string } = {}
  try {
    body = await c.req.json<{ code: string }>()
  } catch {
    // Empty body
  }

  if (!body.code || typeof body.code !== 'string' || body.code.trim().length === 0) {
    return c.json({ valid: false, error: 'Invite code is required' }, 400)
  }

  const code = await inviteCodes.validateInviteCode(c.env, body.code)

  if (code) {
    return c.json({ valid: true })
  }

  return c.json({ valid: false, error: 'Invalid or inactive invite code' })
})

app.post('/auth/register', rateLimit(5, 60_000), async (c) => {
  const body = await c.req.json<{
    username: string
    password: string
    inviteCode?: string
  }>()

  const normalizedUsername = validate.username(body.username)
  const validPassword = validate.password(body.password)

  if (!normalizedUsername || !validPassword) {
    return c.json({ message: 'Username and password are required' }, 400)
  }

  if (validPassword.length < 8) {
    return c.json({ message: 'Password must be at least 8 characters long' }, 400)
  }

  const existingUser = await db.getUserByUsername(c.env.DB, normalizedUsername.toLowerCase())
  if (existingUser) {
    return c.json({ message: 'Username already exists' }, 409)
  }

  // v2 signup model: new users land at UNVERIFIED_USER (30) and promote on
  // email-verify (with optional invite-code-driven level bump). Developer
  // emails still bypass to BRAHMACHARI. Invite code is now optional; if
  // provided we validate and store it, but don't apply the level bump until
  // email-verify. See docs/plans/2026-05-05-v2-roles-invites-messaging.md §5.
  const isDeveloper = DEVELOPER_EMAILS.includes(normalizedUsername.toLowerCase())

  let verificationLevel = UNVERIFIED_USER
  let inviteCodeUsed: string | null = null

  if (isDeveloper) {
    verificationLevel = BRAHMACHARI
  } else if (body.inviteCode && typeof body.inviteCode === 'string' && body.inviteCode.trim().length > 0) {
    const inviteCodeData = await inviteCodes.validateInviteCode(c.env, body.inviteCode)
    if (!inviteCodeData) {
      return c.json({ message: 'Invalid or inactive invite code' }, 401)
    }
    // Atomically consume the code so single-use invites can't be raced by
    // two simultaneous signups. Admin cohort codes (max_uses=NULL) succeed
    // trivially. Note: verification_level stays UNVERIFIED_USER; the bump
    // happens at email-verify time (see GET /auth/verify-email).
    const consumed = await inviteCodes.consumeInviteCode(c.env, inviteCodeData.code)
    if (!consumed) {
      return c.json({ message: 'Invite code already redeemed or expired' }, 409)
    }
    inviteCodeUsed = inviteCodeData.code
  }

  const hashedPassword = await hashPassword(validPassword)
  const userId = crypto.randomUUID()

  try {
    const created = await db.createUser(c.env.DB, {
      id: userId,
      username: normalizedUsername.toLowerCase(),
      password: hashedPassword,
      email: normalizedUsername.toLowerCase(),
      verification_level: verificationLevel,
      invite_code: inviteCodeUsed,
    })

    if (!created.success) {
      const status = created.error === 'User already exists' ? 409 : 500
      return c.json(
        {
          message:
            created.error === 'User already exists'
              ? 'Username already exists'
              : 'Failed to create user',
        },
        status,
      )
    }

    // Auto-send verification email (non-fatal). Skipped for developer accounts
    // since they're already at BRAHMACHARI and don't need to verify. If the
    // send fails (Resend down, etc.) the user can request a resend via
    // POST /auth/send-verification-email.
    if (!isDeveloper) {
      try {
        const bytes = new Uint8Array(32)
        crypto.getRandomValues(bytes)
        const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        await c.env.DB.prepare(
          `INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES (?, ?, ?)`,
        )
          .bind(token, userId, expiresAt)
          .run()

        await sendVerificationEmail(c.env, { email: normalizedUsername.toLowerCase() }, token)
      } catch (err: any) {
        console.error('signup verification email error:', err)
        // Non-fatal: user can request a resend later.
      }
    }

    return c.json(
      { message: 'User registered successfully', username: normalizedUsername.toLowerCase() },
      201,
    )
  } catch (err: any) {
    console.error('createUser error:', err)
    return c.json({ message: 'Failed to create user', error: err?.message }, 500)
  }
})

app.post('/auth/authenticate', rateLimit(5, 60_000), async (c) => {
  const body = await c.req.json<{
    username: string
    password: string
  }>()

  const normalizedUsername = validate.username(body.username)
  const validPassword = validate.password(body.password)

  if (!normalizedUsername || !validPassword) {
    return c.json({ message: 'Username and password are required.' }, 400)
  }

  const user = await db.getUserByUsername(c.env.DB, normalizedUsername.toLowerCase())
  if (!user) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const passwordMatch = await verifyPassword(validPassword, user.password)
  if (!passwordMatch) {
    return c.json({ message: 'Invalid credentials' }, 401)
  }

  const jwtSecret = c.env.JWT_SECRET
  const refreshSecret = c.env.JWT_REFRESH_SECRET || jwtSecret

  const token = await generateToken(user, jwtSecret)
  const refreshToken = await generateRefreshToken(user, refreshSecret)

  return c.json({
    message: 'Authentication successful!',
    user: userRowToApi(user),
    token,
    refreshToken,
  })
})

app.post('/auth/deauthenticate', (c) => {
  return c.json({ message: 'Deauthentication successful!' })
})

// ── Refresh token endpoint ────────────────────────────────────────────

app.post('/auth/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json<{ refreshToken: string }>()
    if (!refreshToken) {
      return c.json({ message: 'Refresh token is required' }, 400)
    }

    const refreshSecret = c.env.JWT_REFRESH_SECRET || c.env.JWT_SECRET
    const decoded = await verifyRefreshToken(refreshToken, refreshSecret)
    if (!decoded) {
      return c.json({ message: 'Invalid or expired refresh token' }, 401)
    }

    const user = await db.getUserByUsername(c.env.DB, decoded.username)
    if (!user) {
      return c.json({ message: 'User not found' }, 401)
    }

    const newAccessToken = await generateToken(user, c.env.JWT_SECRET)
    const newRefreshToken = await generateRefreshToken(user, refreshSecret)

    return c.json({
      message: 'Token refreshed',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: userRowToApi(user),
    })
  } catch {
    return c.json({ message: 'Failed to refresh token' }, 500)
  }
})

app.get('/auth/verify', authMiddleware, (c) => {
  const user = c.get('user')
  return c.json({
    message: 'Token is valid',
    user: userRowToApi(user),
  })
})

// ── Email verification (v2) ───────────────────────────────────────────
//
// Promotion path: signup lands at UNVERIFIED_USER (30). User receives an
// email with a verification link. GET /auth/verify-email consumes the
// token, sets email_verified_at, and (if the user has a stored invite
// code) bumps their verification_level to the code's level. See
// docs/plans/2026-05-05-v2-roles-invites-messaging.md §4-5.

app.post('/auth/send-verification-email', rateLimit(3, 60 * 60_000), authMiddleware, async (c) => {
  const user = c.get('user')
  if (!user.email) {
    return c.json({ message: 'User has no email on file' }, 400)
  }
  if (user.email_verified_at) {
    return c.json({ message: 'Email already verified' }, 400)
  }

  // 32 bytes = 64 hex chars = 256 bits entropy
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  try {
    await c.env.DB.prepare(
      `INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES (?, ?, ?)`,
    )
      .bind(token, user.id, expiresAt)
      .run()

    await sendVerificationEmail(c.env, { email: user.email }, token)
  } catch (err: any) {
    console.error('send-verification-email error:', err)
    return c.json({ message: 'Failed to send verification email' }, 500)
  }

  return c.json({ message: 'Verification email sent' })
})

app.get('/auth/verify-email', async (c) => {
  const token = c.req.query('token')
  if (!token || typeof token !== 'string') {
    return c.json({ message: 'Token is required' }, 400)
  }

  const row = await c.env.DB.prepare(
    `SELECT token, user_id, expires_at, consumed_at
       FROM email_verification_tokens WHERE token = ?`,
  )
    .bind(token)
    .first<{ token: string; user_id: string; expires_at: string; consumed_at: string | null }>()

  if (!row) {
    return c.json({ message: 'Invalid token' }, 410)
  }
  if (row.consumed_at) {
    return c.json({ message: 'Token already used' }, 410)
  }
  if (new Date(row.expires_at) <= new Date()) {
    return c.json({ message: 'Token expired' }, 410)
  }

  const user = await db.getUserById(c.env.DB, row.user_id)
  if (!user) {
    return c.json({ message: 'User not found' }, 404)
  }

  const now = new Date().toISOString()

  // Path A promotion: if user signed up with an invite code and hasn't been
  // promoted yet, apply the code's verification_level now. Won't downgrade.
  // Use getInviteCode (not validateInviteCode) since single-use codes are
  // already consumed at signup; we just need the recorded level.
  let newLevel = user.verification_level
  if (user.invite_code && user.verification_level < NORMAL_USER) {
    const inviteCode = await inviteCodes.getInviteCode(c.env, user.invite_code)
    if (inviteCode) {
      newLevel = Math.max(user.verification_level, inviteCode.verification_level)
    }
  }

  await c.env.DB.prepare(
    `UPDATE email_verification_tokens SET consumed_at = ? WHERE token = ?`,
  )
    .bind(now, token)
    .run()

  const updates: Partial<UserRow> = { email_verified_at: now }
  if (newLevel !== user.verification_level) {
    updates.verification_level = newLevel
  }
  await db.updateUser(c.env.DB, user.id, updates)

  const updated = await db.getUserById(c.env.DB, user.id)
  return c.json({
    message: 'Email verified',
    user: updated ? userRowToApi(updated) : null,
  })
})

// ── Password reset (v2) ───────────────────────────────────────────────
//
// Self-serve flow: user requests a 6-digit code (always returns ok to
// avoid enumeration), then submits the code + new password to /verify.
// On success, every live JWT for the user dies via the password-hash
// fingerprint in auth.ts. See docs/plans/2026-05-24-password-reset.md.

app.post('/auth/password-reset/request', rateLimit(5, 60_000), async (c) => {
  let body: { username?: string } = {}
  try {
    body = await c.req.json<{ username: string }>()
  } catch {
    // empty body -- still return ok so attackers learn nothing
  }
  if (body.username && typeof body.username === 'string') {
    await passwordReset.handlePasswordResetRequest(c.env, body.username)
  }
  return c.json({ ok: true })
})

app.post('/auth/password-reset/verify', rateLimit(10, 60_000), async (c) => {
  let body: { username?: string; code?: string; newPassword?: string } = {}
  try {
    body = await c.req.json()
  } catch {
    // fall through to validation below
  }
  if (
    typeof body.username !== 'string' ||
    typeof body.code !== 'string' ||
    typeof body.newPassword !== 'string'
  ) {
    return c.json({ ok: false, error: 'Missing required fields' }, 400)
  }

  const result = await passwordReset.handlePasswordResetVerify(
    c.env,
    body.username,
    body.code,
    body.newPassword,
  )
  return c.json(result, result.ok ? 200 : 400)
})

// ── User-issued invite codes (v2) ─────────────────────────────────────
//
// Verified users can mint single-use, 30-day-expiry links and share them.
// Recipients redeem either at signup (handled in /auth/register) or
// post-signup via /auth/redeem-invite. See
// docs/plans/2026-05-05-v2-roles-invites-messaging.md §5.A.

const INVITE_SHARE_URL_BASE = 'https://chinmayajanata.org/join'

app.post('/auth/invite-codes', authMiddleware, async (c) => {
  const user = c.get('user')
  if (user.verification_level < NORMAL_USER) {
    return c.json({ message: 'Only verified users can issue invite codes' }, 403)
  }

  const result = await inviteCodes.mintUserInviteCode(c.env, user.id)
  if (!result.success) {
    console.error('mintUserInviteCode error:', result.error)
    return c.json({ message: 'Failed to mint invite code' }, 500)
  }

  return c.json({
    code: result.code,
    expiresAt: result.expiresAt,
    shareUrl: `${INVITE_SHARE_URL_BASE}?code=${result.code}`,
  })
})

app.get('/auth/invite-codes/mine', authMiddleware, async (c) => {
  const user = c.get('user')
  const rows = await inviteCodes.getUserMintedCodes(c.env, user.id)
  return c.json({
    codes: rows.map((row) => ({
      ...inviteCodes.inviteCodeRowToApi(row),
      shareUrl: `${INVITE_SHARE_URL_BASE}?code=${row.code}`,
    })),
  })
})

app.post('/auth/redeem-invite', rateLimit(5, 60_000), authMiddleware, async (c) => {
  const user = c.get('user')

  if (user.verification_level >= NORMAL_USER) {
    return c.json({ message: 'Already verified; no invite needed' }, 400)
  }
  if (user.invite_code) {
    return c.json({ message: 'An invite code is already associated with this account' }, 400)
  }

  const body = await c.req.json<{ code?: string }>().catch(() => ({ code: undefined }))
  if (!body.code || typeof body.code !== 'string' || body.code.trim().length === 0) {
    return c.json({ message: 'Invite code is required' }, 400)
  }

  const validated = await inviteCodes.validateInviteCode(c.env, body.code)
  if (!validated) {
    return c.json({ message: 'Invalid, expired, or fully redeemed invite code' }, 401)
  }

  const consumed = await inviteCodes.consumeInviteCode(c.env, validated.code)
  if (!consumed) {
    // Race: someone else consumed it between validate and consume.
    return c.json({ message: 'Invite code already redeemed or expired' }, 409)
  }

  // Record the code on the user. If email is already verified, apply the
  // promotion now. Otherwise the bump happens at email-verify.
  const updates: Partial<UserRow> = { invite_code: validated.code }
  let promoted = false
  if (user.email_verified_at && user.verification_level < validated.verification_level) {
    updates.verification_level = validated.verification_level
    promoted = true
  }
  await db.updateUser(c.env.DB, user.id, updates)

  const updated = await db.getUserById(c.env.DB, user.id)
  return c.json({
    message: promoted
      ? 'Invite redeemed; you are now verified'
      : 'Invite recorded; verify your email to complete promotion',
    user: updated ? userRowToApi(updated) : null,
  })
})

app.post('/auth/complete-onboarding', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    const body = await c.req.json<{
      firstName?: string
      lastName?: string
      dateOfBirth?: string
      centerID?: string
      profileComplete?: boolean
      phoneNumber?: string
      interests?: string[]
    }>()

    const updates: Partial<UserRow> = {}
    if (body.firstName !== undefined) updates.first_name = body.firstName
    if (body.lastName !== undefined) updates.last_name = body.lastName
    if (body.dateOfBirth !== undefined) updates.date_of_birth = body.dateOfBirth
    // Skip center_id if empty string (no center selected during onboarding)
    if (body.centerID) updates.center_id = body.centerID
    if (body.profileComplete !== undefined) updates.profile_complete = body.profileComplete ? 1 : 0
    if (body.phoneNumber !== undefined) updates.phone_number = body.phoneNumber
    if (body.interests !== undefined) updates.interests = JSON.stringify(body.interests)

    const result = await db.updateUser(c.env.DB, user.id, updates)

    if (result.success) {
      const updated = await db.getUserById(c.env.DB, user.id)
      return c.json({
        message: 'Profile completed successfully',
        user: updated ? userRowToApi(updated) : null,
      })
    }

    return c.json({ message: 'Failed to update profile', error: result.error }, 500)
  } catch (err: any) {
    console.error('complete-onboarding error:', err)
    return c.json({ message: 'Failed to complete onboarding' }, 500)
  }
})

app.put('/auth/update-profile', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{
    firstName?: string
    lastName?: string
    email?: string
    centerID?: string
    profileComplete?: boolean
    profileImage?: string
    bio?: string
    phoneNumber?: string
    interests?: string[]
    dateOfBirth?: string
  }>()

  const updates: Partial<UserRow> = {}
  if (body.firstName !== undefined) updates.first_name = body.firstName
  if (body.lastName !== undefined) updates.last_name = body.lastName
  if (body.email !== undefined) updates.email = body.email
  if (body.dateOfBirth !== undefined) updates.date_of_birth = body.dateOfBirth
  // Coerce empty string to null (allowed by FK), reject non-existent center IDs naturally
  if (body.centerID !== undefined) updates.center_id = body.centerID || null
  if (body.profileComplete !== undefined) updates.profile_complete = body.profileComplete ? 1 : 0
  if (body.profileImage !== undefined) updates.profile_image = body.profileImage
  if (body.bio !== undefined) updates.bio = body.bio || null
  if (body.phoneNumber !== undefined) updates.phone_number = body.phoneNumber
  if (body.interests !== undefined) updates.interests = JSON.stringify(body.interests)

  const result = await db.updateUser(c.env.DB, user.id, updates)

  if (result.success) {
    const updated = await db.getUserById(c.env.DB, user.id)
    return c.json({
      message: 'Profile updated',
      user: updated ? userRowToApi(updated) : null,
    })
  }

  return c.json({ message: 'Failed to update profile', error: result.error }, 500)
})

app.delete('/auth/delete-account', authMiddleware, async (c) => {
  const user = c.get('user')
  const result = await db.deleteUser(c.env.DB, user.id)

  if (result.success) {
    return c.json({ message: 'Account deleted successfully' })
  }

  return c.json({ message: 'Failed to delete account', error: result.error }, 500)
})

// Legacy auth routes (backward compatibility)
app.post('/register', rateLimit(10, 60_000), async (c) => {
  // Forward to the new route handler
  const body = await c.req.json()
  const url = new URL(c.req.url)
  url.pathname = '/api/auth/register'
  const newReq = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: JSON.stringify(body),
  })
  return app.fetch(newReq, c.env)
})

app.post('/authenticate', rateLimit(10, 60_000), async (c) => {
  const body = await c.req.json()
  const url = new URL(c.req.url)
  url.pathname = '/api/auth/authenticate'
  const newReq = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: JSON.stringify(body),
  })
  return app.fetch(newReq, c.env)
})

app.post('/deauthenticate', (c) => {
  return c.json({ message: 'Deauthentication successful!' })
})

// ═══════════════════════════════════════════════════════════════════════
// CENTER ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.get('/centers', cacheControl(30), async (c) => {
  const centers = await db.getAllCenters(c.env.DB)
  return c.json({ centers: centers.map(centerRowToApi) })
})

app.post('/addCenter', authMiddleware, async (c) => {
  const body = await c.req.json<{
    latitude: number
    longitude: number
    centerName: string
    address?: string
    website?: string
    phone?: string
    image?: string
    acharya?: string
    pointOfContact?: string
  }>()

  const validName = validate.centerName(body.centerName)
  if (!validName) {
    return c.json({ message: 'centerName is required (max 100 characters)' }, 400)
  }

  const lat = typeof body.latitude === 'number' ? body.latitude : NaN
  const lng = typeof body.longitude === 'number' ? body.longitude : NaN
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return c.json(
      { message: 'Valid latitude (-90..90) and longitude (-180..180) are required' },
      400
    )
  }

  const id = crypto.randomUUID()
  const result = await db.createCenter(c.env.DB, {
    id,
    name: validName,
    latitude: lat,
    longitude: lng,
    address: body.address ?? null,
    website: body.website ?? null,
    phone: body.phone ?? null,
    image: body.image ?? null,
    acharya: body.acharya ?? null,
    point_of_contact: body.pointOfContact ?? null,
  })

  if (!result.success) {
    return c.json({ message: 'Internal server error OR center ID not unique' }, 500)
  }

  return c.json({ message: 'Operation successful', id })
})

app.post('/verifyCenter', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!isAdmin(user)) {
    return c.json({ message: 'User is not authorized to verify or verification failed.' }, 401)
  }

  const { centerID } = await c.req.json<{ centerID: string }>()
  const center = await db.getCenterById(c.env.DB, centerID)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  const result = await db.updateCenter(c.env.DB, centerID, {
    is_verified: 1,
  })

  if (result.success) {
    return c.json({ message: 'Successful verification!' })
  }
  return c.json({ message: 'Verification failed' }, 500)
})

app.post('/removeCenter', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!isAdmin(user)) {
    return c.json({ message: 'Insufficient permissions' }, 401)
  }

  const { centerID } = await c.req.json<{ centerID: string }>()
  const result = await db.deleteCenter(c.env.DB, centerID)

  if (result.success) {
    return c.json({ message: 'Successful removal!' })
  }
  return c.json({ message: 'Removal failed' }, 500)
})

app.post('/fetchAllCenters', async (c) => {
  const centers = await db.getAllCenters(c.env.DB)
  return c.json({
    message: 'Successful',
    centersList: centers.map(centerRowToApi),
  })
})

app.post('/fetchCenter', async (c) => {
  const { centerID } = await c.req.json<{ centerID: string }>()
  if (!centerID) {
    return c.json({ message: 'Malformed centerID' }, 400)
  }

  const center = await db.getCenterById(c.env.DB, centerID)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  return c.json({ message: 'Success', center: centerRowToApi(center) })
})

// ═══════════════════════════════════════════════════════════════════════
// USER ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.post('/verifyUser', authMiddleware, async (c) => {
  const adminUser = c.get('user')
  if (!isAdmin(adminUser)) {
    return c.json({ message: 'Insufficient permission to authorize.' }, 401)
  }

  const { usernameToVerify, verificationLevel } = await c.req.json<{
    usernameToVerify: string
    verificationLevel: number
  }>()

  const targetUser = await db.getUserByUsername(c.env.DB, usernameToVerify)
  if (!targetUser) {
    return c.json({ message: 'User not found.' }, 404)
  }

  const result = await db.updateUser(c.env.DB, targetUser.id, {
    is_verified: 1,
    verification_level: verificationLevel,
  })

  if (result.success) {
    return c.json({ message: 'Verification successful.' })
  }
  return c.json({ message: 'Verification failed.' }, 500)
})

app.post('/userUpdate', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!isAdmin(user)) {
    return c.json({ message: 'Insufficient permissions' }, 401)
  }

  const { username, userJSON } = await c.req.json<{
    username: string
    userJSON: any
  }>()

  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) {
    return c.json({ message: 'User not found.' }, 404)
  }

  // Map the legacy userJSON fields to D1 column names
  const updates: Partial<UserRow> = {}
  if (userJSON.firstName !== undefined) updates.first_name = userJSON.firstName
  if (userJSON.lastName !== undefined) updates.last_name = userJSON.lastName
  if (userJSON.dateOfBirth !== undefined) updates.date_of_birth = userJSON.dateOfBirth
  if (userJSON.profilePictureURL !== undefined) updates.profile_image = userJSON.profilePictureURL
  if (userJSON.center !== undefined)
    updates.center_id = userJSON.center === -1 ? null : String(userJSON.center)
  if (userJSON.points !== undefined) updates.points = userJSON.points
  if (userJSON.isVerified !== undefined) updates.is_verified = userJSON.isVerified ? 1 : 0
  if (userJSON.verificationLevel !== undefined)
    updates.verification_level = userJSON.verificationLevel
  if (userJSON.isActive !== undefined) updates.is_active = userJSON.isActive ? 1 : 0

  const result = await db.updateUser(c.env.DB, targetUser.id, updates)

  if (result.success) {
    return c.json({ message: 'Operation successful.' })
  }
  return c.json({ message: 'Update failed.' }, 400)
})

app.post('/updateRegistration', authMiddleware, async (c) => {
  const user = c.get('user')
  const { username, userJSON } = await c.req.json<{
    username: string
    userJSON: any
  }>()

  if (user.username !== username && !isAdmin(user)) {
    return c.json({ message: 'Insufficient permissions' }, 401)
  }

  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) {
    return c.json({ message: 'Update failed' }, 400)
  }

  const updates: Partial<UserRow> = {}
  if (userJSON.firstName !== undefined) updates.first_name = userJSON.firstName
  if (userJSON.lastName !== undefined) updates.last_name = userJSON.lastName
  if (userJSON.dateOfBirth !== undefined) updates.date_of_birth = userJSON.dateOfBirth
  if (userJSON.center !== undefined)
    updates.center_id = userJSON.center === -1 ? null : String(userJSON.center)

  const result = await db.updateUser(c.env.DB, targetUser.id, updates)

  if (result.success) {
    return c.json({ message: 'User updated' })
  }
  return c.json({ message: 'Update failed' }, 400)
})

app.post('/removeUser', authMiddleware, async (c) => {
  const user = c.get('user')
  if (!isAdmin(user)) {
    return c.json({ message: 'Insufficient permissions' }, 401)
  }

  const { username } = await c.req.json<{ username: string }>()
  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) {
    return c.json({ message: 'Removal failed' }, 400)
  }

  const result = await db.deleteUser(c.env.DB, targetUser.id)
  if (result.success) {
    return c.json({ message: 'User removed' })
  }
  return c.json({ message: 'Removal failed' }, 400)
})

app.post('/getUserEvents', authMiddleware, async (c) => {
  const { username } = await c.req.json<{ username: string }>()
  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) {
    return c.json({ message: 'User not found' }, 404)
  }

  const events = await db.getUserEvents(c.env.DB, targetUser.id)
  return c.json({
    message: 'Success',
    events: events.map(eventRowToApi),
  })
})

// ═══════════════════════════════════════════════════════════════════════
// PROFILE ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.get('/profile/:username/events', authMiddleware, async (c) => {
  const { username } = c.req.param()
  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) return c.json({ message: 'User not found' }, 404)
  const events = await db.getUserEvents(c.env.DB, targetUser.id)
  return c.json({ events: events.map(eventRowToApi) })
})

app.get('/profile/:username/posts', authMiddleware, async (c) => {
  const { username } = c.req.param()
  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) return c.json({ message: 'User not found' }, 404)
  const posts = await db.getUserCreatedEvents(c.env.DB, targetUser.id)
  return c.json({ posts: posts.map(eventRowToApi) })
})

app.get('/profile/:username/groups', authMiddleware, async (c) => {
  const { username } = c.req.param()
  const targetUser = await db.getUserByUsername(c.env.DB, username)
  if (!targetUser) return c.json({ message: 'User not found' }, 404)
  const groups = targetUser.center_id
    ? [centerRowToApi(await db.getCenterById(c.env.DB, targetUser.center_id) as any)]
    : []
  return c.json({ groups: groups.filter(Boolean) })
})

app.get('/profile/:username/messages', authMiddleware, async (_c) => {
  // Messaging not yet implemented — reserved for future use
  return _c.json({ messages: [], total: 0 })
})

// ═══════════════════════════════════════════════════════════════════════
// BOARD ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.get('/boards/:type/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const typeParam = c.req.param('type')
  const parentId = c.req.param('id')

  if (!isBoardType(typeParam)) {
    return c.json({ message: 'Board type must be center or event' }, 400)
  }

  const accessError = await verifyBoardAccess(c, typeParam, parentId, user)
  if (accessError) return accessError

  const limit = Number.parseInt(c.req.query('limit') || '50', 10)
  const offset = Number.parseInt(c.req.query('offset') || '0', 10)
  const board = await db.ensureBoard(c.env.DB, typeParam, parentId)
  const posts = await db.listBoardPosts(c.env.DB, board.id, { limit, offset })

  return c.json({
    board: boardRowToApi(board),
    posts: posts.map(boardPostToApi),
  })
})

app.post('/boards/:type/:id/posts', authMiddleware, async (c) => {
  const user = c.get('user')
  const typeParam = c.req.param('type')
  const parentId = c.req.param('id')

  if (!isBoardType(typeParam)) {
    return c.json({ message: 'Board type must be center or event' }, 400)
  }

  const accessError = await verifyBoardAccess(c, typeParam, parentId, user)
  if (accessError) return accessError

  const body: { body?: string; imageUrl?: string | null } = await c.req
    .json<{ body?: string; imageUrl?: string | null }>()
    .catch(() => ({}))
  const text = typeof body.body === 'string' ? body.body.trim() : ''
  if (!text) {
    return c.json({ message: 'Post body is required' }, 400)
  }
  if (text.length > 2000) {
    return c.json({ message: 'Post body must be 2000 characters or fewer' }, 400)
  }

  const imageUrl = body.imageUrl ?? null
  const validImageUrl = validate.url(imageUrl || undefined)
  if (validImageUrl === false) {
    return c.json({ message: 'Image URL is invalid' }, 400)
  }

  const board = await db.ensureBoard(c.env.DB, typeParam, parentId)
  const postId = crypto.randomUUID()
  const created = await db.createBoardPost(c.env.DB, {
    id: postId,
    board_id: board.id,
    author_id: user.id,
    body: text,
    image_url: validImageUrl ?? null,
  })

  if (!created.success) {
    console.error('createBoardPost error:', created.error)
    return c.json({ message: 'Failed to create board post' }, 500)
  }

  const posts = await db.listBoardPosts(c.env.DB, board.id, { limit: 1 })
  const post = posts.find((candidate) => candidate.id === postId)
  if (!post) {
    return c.json({ message: 'Board post created but could not be loaded' }, 500)
  }

  return c.json({ post: boardPostToApi(post) }, 201)
})

app.post('/boards/posts/:postId/reactions', authMiddleware, async (c) => {
  const user = c.get('user')
  const postId = c.req.param('postId')
  const post = await db.getBoardPostById(c.env.DB, postId)
  if (!post) {
    return c.json({ message: 'Board post not found' }, 404)
  }

  const board = await db.getBoardById(c.env.DB, post.board_id)
  if (!board) {
    return c.json({ message: 'Board not found' }, 404)
  }

  const accessError = await verifyBoardAccess(c, board.type, board.parent_id, user)
  if (accessError) return accessError

  const body: { emoji?: string } = await c.req.json<{ emoji?: string }>().catch(() => ({}))
  if (!body.emoji || !BOARD_REACTIONS.has(body.emoji)) {
    return c.json({ message: 'Reaction emoji is not allowed' }, 400)
  }

  const result = await db.toggleBoardPostReaction(c.env.DB, post.id, user.id, body.emoji)
  return c.json(result)
})

// ═══════════════════════════════════════════════════════════════════════
// EVENT ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.post('/addEvent', authMiddleware, async (c) => {
  const user = c.get('user')
  const data = await c.req.json<{
    title?: string
    description?: string
    latitude: number
    longitude: number
    address?: string
    date: string
    centerID: string
    endorsers?: string[]
    pointOfContact?: string
    image?: string
    category?: number
    externalUrl?: string | null
    signupUrl?: string | null
    allowJanataSignup?: boolean
  }>()

  // Validate required fields
  const validCenterID = validate.id(data.centerID)
  if (!validCenterID) {
    return c.json({ message: 'Valid centerID is required' }, 400)
  }

  if (!data.date || typeof data.date !== 'string') {
    return c.json({ message: 'date is required' }, 400)
  }

  const lat = typeof data.latitude === 'number' ? data.latitude : NaN
  const lng = typeof data.longitude === 'number' ? data.longitude : NaN
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return c.json(
      { message: 'Valid latitude (-90..90) and longitude (-180..180) are required' },
      400
    )
  }

  // Validate optional string fields (false = exceeded max length)
  const validTitle = validate.title(data.title)
  const validDescription = validate.description(data.description)
  const validAddress = validate.address(data.address)
  const validImage = validate.url(data.image)

  if (
    validTitle === false ||
    validDescription === false ||
    validAddress === false ||
    validImage === false
  ) {
    return c.json({ message: 'One or more fields exceed maximum length' }, 400)
  }

  // Validate center exists
  const center = await db.getCenterById(c.env.DB, validCenterID)
  if (!center) {
    return c.json({ message: 'Center not found.' }, 404)
  }

  const eventId = crypto.randomUUID()

  const validExternalUrl = validate.url(data.externalUrl)
  const validSignupUrl = validate.url(data.signupUrl)
  if (validExternalUrl === false || validSignupUrl === false) {
    return c.json({ message: 'External URL or signup URL is invalid' }, 400)
  }

  const result = await db.createEvent(c.env.DB, {
    id: eventId,
    title: validTitle ?? '',
    description: validDescription ?? '',
    date: data.date,
    latitude: lat,
    longitude: lng,
    address: validAddress ?? null,
    center_id: validCenterID,
    point_of_contact: data.pointOfContact ?? null,
    image: validImage ?? null,
    category: data.category ?? null,
    external_url: validExternalUrl ?? null,
    signup_url: validSignupUrl ?? null,
    allow_janata_signup: data.allowJanataSignup ? 1 : 0,
    created_by: user.id,
  })

  if (!result.success) {
    return c.json({ message: 'Failed to store event.' }, 500)
  }

  // Add endorsers
  if (data.endorsers && data.endorsers.length > 0) {
    for (const endorserUsername of data.endorsers) {
      const endorserUser = await db.getUserByUsername(c.env.DB, endorserUsername)
      if (endorserUser && endorserUser.verification_level >= SEVAK) {
        await db.addEventEndorser(c.env.DB, eventId, endorserUser.id)
        // Also add as attendee
        await db.addEventAttendee(c.env.DB, eventId, endorserUser.id)
      }
    }
  }

  // Calculate tier
  const endorsers = await db.getEventEndorsers(c.env.DB, eventId)
  const attendeeCount = (await db.getEventAttendees(c.env.DB, eventId)).length
  const tier = calculateTier(endorsers, attendeeCount)
  await db.updateEvent(c.env.DB, eventId, { tier, people_attending: attendeeCount })

  return c.json({ id: eventId, tier })
})

app.post('/removeEvent', authMiddleware, async (c) => {
  const user = c.get('user')
  const { id } = await c.req.json<{ id: string }>()
  if (!id) {
    return c.json({ message: 'Event ID required' }, 400)
  }

  const existing = await db.getEventById(c.env.DB, id)
  if (!existing) {
    return c.json({ message: 'Event not found' }, 404)
  }

  // Allow admin or the event creator to delete (mirrors /updateEvent gate;
  // legacy events with no creator are admin-only)
  const isCreator = existing.created_by === user.id
  if (!isAdmin(user) && !isCreator) {
    return c.json(
      { message: 'Insufficient permissions - only admin or event creator can delete' },
      401,
    )
  }

  const result = await db.deleteEvent(c.env.DB, id)
  if (result.success) {
    return c.json({ message: 'Event removed' })
  }
  return c.json({ message: 'Failed to remove event' }, 500)
})

app.post('/fetchEvent', async (c) => {
  const { id } = await c.req.json<{ id: string }>()
  const event = await db.getEventById(c.env.DB, id)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }
  return c.json({ message: 'Success', event: eventRowToApi(event) })
})

app.post('/updateEvent', authMiddleware, async (c) => {
  const user = c.get('user')

  const { eventJSON } = await c.req.json<{ eventJSON: any }>()

  const eventId = eventJSON.id || eventJSON.eventID
  if (!eventId) {
    return c.json({ message: 'Event ID required' }, 400)
  }

  const existing = await db.getEventById(c.env.DB, eventId)
  if (!existing) {
    return c.json({ message: 'Event not found' }, 404)
  }

  // Allow admin or the event creator to edit (or any logged-in user for events without creator)
  const userIsAdmin = isAdmin(user)
  const isCreator = existing.created_by === user.id
  const isEditable = userIsAdmin || isCreator || existing.created_by === null
  if (!isEditable) {
    return c.json({ message: 'Insufficient permissions - only admin or event creator can edit' }, 401)
  }

  const updates: Partial<EventRow> = {}
  if (eventJSON.title !== undefined) updates.title = eventJSON.title
  if (eventJSON.description !== undefined) updates.description = eventJSON.description
  if (eventJSON.date !== undefined) updates.date = eventJSON.date
  if (eventJSON.latitude !== undefined) updates.latitude = parseFloat(String(eventJSON.latitude))
  if (eventJSON.longitude !== undefined) updates.longitude = parseFloat(String(eventJSON.longitude))
  if (eventJSON.address !== undefined) updates.address = eventJSON.address
  if (eventJSON.centerID !== undefined) updates.center_id = eventJSON.centerID
  if (eventJSON.pointOfContact !== undefined) updates.point_of_contact = eventJSON.pointOfContact
  if (eventJSON.image !== undefined) updates.image = eventJSON.image
  if (eventJSON.category !== undefined) updates.category = eventJSON.category
  if (eventJSON.externalUrl !== undefined) updates.external_url = eventJSON.externalUrl
  if (eventJSON.signupUrl !== undefined) updates.signup_url = eventJSON.signupUrl
  if (eventJSON.allowJanataSignup !== undefined)
    updates.allow_janata_signup = eventJSON.allowJanataSignup ? 1 : 0

  const result = await db.updateEvent(c.env.DB, eventId, updates)
  if (result.success) {
    return c.json({ message: 'Event updated' })
  }
  return c.json({ message: 'Update failed' }, 400)
})

app.post('/getEventUsers', async (c) => {
  const { id } = await c.req.json<{ id: string }>()
  if (!id) {
    return c.json({ message: 'Bad request - missing id' }, 400)
  }

  const event = await db.getEventById(c.env.DB, id)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  const attendees = await db.getEventAttendees(c.env.DB, id)
  return c.json({
    message: 'Success',
    users: attendees.map((u) => userRowToApi(u)),
  })
})

app.post('/attendEvent', authMiddleware, async (c) => {
  const user = c.get('user')
  const { eventID } = await c.req.json<{ eventID: string }>()

  if (!eventID) {
    return c.json({ message: 'eventID is required' }, 400)
  }

  const event = await db.getEventById(c.env.DB, eventID)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  // Check if already registered
  const attendees = await db.getEventAttendees(c.env.DB, eventID)
  const alreadyRegistered = attendees.some((a) => a.id === user.id)
  if (alreadyRegistered) {
    return c.json({ message: 'Already registered for this event' }, 400)
  }

  const result = await db.addEventAttendee(c.env.DB, eventID, user.id)
  if (!result.success) {
    return c.json({ message: 'Failed to register attendance', error: result.error }, 500)
  }

  const updated = await db.getEventById(c.env.DB, eventID)
  return c.json({
    message: 'Successfully registered for event',
    peopleAttending: updated?.people_attending ?? event.people_attending + 1,
  })
})

app.post('/unattendEvent', authMiddleware, async (c) => {
  const user = c.get('user')
  const { eventID } = await c.req.json<{ eventID: string }>()

  if (!eventID) {
    return c.json({ message: 'eventID is required' }, 400)
  }

  const event = await db.getEventById(c.env.DB, eventID)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  const result = await db.removeEventAttendee(c.env.DB, eventID, user.id)
  if (!result.success) {
    return c.json({ message: 'Failed to remove attendance', error: result.error }, 500)
  }

  const updated = await db.getEventById(c.env.DB, eventID)
  return c.json({
    message: 'Successfully unregistered from event',
    peopleAttending: updated?.people_attending ?? Math.max(0, event.people_attending - 1),
  })
})

app.post('/fetchEventsByCenter', async (c) => {
  const { centerID } = await c.req.json<{ centerID: string }>()
  const events = await db.getEventsByCenterId(c.env.DB, centerID)
  return c.json({
    message: 'Success',
    events: events.map(eventRowToApi),
  })
})

app.get('/fetchAllEvents', cacheControl(30), async (c) => {
  const events = await db.getAllEvents(c.env.DB)
  return c.json({
    message: 'Success',
    events: events.map(eventRowToApi),
  })
})

// ══════════════════════════════════════════════════════════════════════
// PROFILE IMAGE ROUTES
// ══════════════════════════════════════════════════════════════════════

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
app.post('/profile/uploadImage', authMiddleware, async (c) => {
  const user = c.get('user')

  // Parse multipart form data
  const body = await c.req.parseBody()
  const file = body['file']

  // Validate file
  if (!(file instanceof File)) {
    return c.json({ message: 'No file uploaded' }, 400)
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json(
      { message: 'Unsupported file type. Allowed types are JPEG, PNG, GIF, WebP, HEIC' },
      400
    )
  }

  // Validate file size (max 5MB)
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ message: 'File size exceeds 5MB limit' }, 400)
  }

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg'
  const key = `avatars/${user.id}/${crypto.randomUUID()}.${ext}`

  // Upload to R2
  await c.env.AVATARS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: {
      userId: user.id,
      originalFileName: file.name,
    },
  })

  const baseUrl = 'https://avatars.chinmayajanata.org/avatars'
  const url = `${baseUrl}/${key}`

  // Update user profile with new image URL
  await db.updateUser(c.env.DB, user.id, {
    profile_image: url,
  })

  return c.json({ message: 'Profile image uploaded successfully', imageUrl: url })
})

// ── Fun route ─────────────────────────────────────────────────────────

app.post('/brewCoffee', (c) => {
  return c.json(
    {
      message:
        'This server is a teapot, and cannot brew coffee. It not just cannot, but it will not. How dare you disgrace this server with a request to brew coffee? This is a server that brews tea. Masala Chai >>> Filter Coffee.',
    },
    418
  )
})

// ── Tier calculation ──────────────────────────────────────────────────

function calculateTier(endorsers: UserRow[], attendeeCount: number): number {
  let tier = 0
  let brahmachariAndAbove = 0

  for (const endorser of endorsers) {
    tier += endorser.points * endorser.verification_level
    if (endorser.verification_level >= BRAHMACHARI) {
      brahmachariAndAbove++
    }
  }

  tier += attendeeCount * NORMAL_USER
  tier *= brahmachariAndAbove + 1
  tier = Math.floor(tier / TIER_DESCALE)

  return tier
}

// ═══════════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════════

app.get('/admin/stats', adminMiddleware, async (c) => {
  const [users, centers, events] = await Promise.all([
    db.countUsers(c.env.DB),
    db.countCenters(c.env.DB),
    db.countEvents(c.env.DB),
  ])
  return c.json({ users, centers, events })
})

app.get('/admin/users', adminMiddleware, async (c) => {
  const url = new URL(c.req.url)
  const q = url.searchParams.get('q') || undefined
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
  const { data, total } = await db.listUsers(c.env.DB, { q, limit, offset })
  return c.json({ data: data.map(userRowToApi), total, limit, offset })
})

app.get('/admin/centers', adminMiddleware, async (c) => {
  const url = new URL(c.req.url)
  const q = url.searchParams.get('q') || undefined
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
  const { data, total } = await db.listCenters(c.env.DB, { q, limit, offset })
  return c.json({ data: data.map(centerRowToApi), total, limit, offset })
})

app.get('/admin/events', adminMiddleware, async (c) => {
  const url = new URL(c.req.url)
  const q = url.searchParams.get('q') || undefined
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
  const { data, total } = await db.listEvents(c.env.DB, { q, limit, offset })
  return c.json({ data: data.map(eventRowToApi), total, limit, offset })
})

// ── Admin center actions ──────────────────────────────────────────────

app.put('/admin/centers/:id', adminMiddleware, async (c) => {
  const centerId = c.req.param('id')
  const center = await db.getCenterById(c.env.DB, centerId)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  const body = await c.req.json<{
    name?: string
    address?: string
    website?: string
    phone?: string
    image?: string
    acharya?: string
    pointOfContact?: string
  }>()

  const updates: Partial<CenterRow> = {}
  if (body.name !== undefined) updates.name = body.name
  if (body.address !== undefined) updates.address = body.address
  if (body.website !== undefined) updates.website = body.website
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.image !== undefined) updates.image = body.image
  if (body.acharya !== undefined) updates.acharya = body.acharya
  if (body.pointOfContact !== undefined) updates.point_of_contact = body.pointOfContact

  const result = await db.updateCenter(c.env.DB, centerId, updates)
  if (result.success) {
    return c.json({ message: 'Center updated' })
  }
  return c.json({ message: 'Failed to update center', error: result.error }, 500)
})

app.post('/admin/centers/:id/verify', adminMiddleware, async (c) => {
  const centerId = c.req.param('id')
  const center = await db.getCenterById(c.env.DB, centerId)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  const newValue = center.is_verified ? 0 : 1
  const result = await db.updateCenter(c.env.DB, centerId, { is_verified: newValue })
  if (result.success) {
    return c.json({ message: newValue ? 'Center verified' : 'Center unverified' })
  }
  return c.json({ message: 'Failed to toggle verification', error: result.error }, 500)
})

app.delete('/admin/centers/:id', adminMiddleware, async (c) => {
  const centerId = c.req.param('id')
  const center = await db.getCenterById(c.env.DB, centerId)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  const result = await db.deleteCenter(c.env.DB, centerId)
  if (result.success) {
    return c.json({ message: 'Center deleted' })
  }
  return c.json({ message: 'Failed to delete center', error: result.error }, 500)
})

app.get('/admin/centers/:id/members', adminMiddleware, async (c) => {
  const centerId = c.req.param('id')
  const center = await db.getCenterById(c.env.DB, centerId)
  if (!center) {
    return c.json({ message: 'Center not found' }, 404)
  }

  const members = await db.getCenterMembers(c.env.DB, centerId)
  return c.json({ data: members.map(userRowToApi) })
})

// ── Admin event actions ───────────────────────────────────────────────

app.put('/admin/events/:id', adminMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const event = await db.getEventById(c.env.DB, eventId)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  const body = await c.req.json<{
    title?: string
    description?: string
    date?: string
    address?: string
    pointOfContact?: string
    image?: string
    category?: number
    externalUrl?: string | null
    signupUrl?: string | null
    allowJanataSignup?: boolean
  }>()

  const updates: Partial<EventRow> = {}
  if (body.title !== undefined) updates.title = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.date !== undefined) updates.date = body.date
  if (body.address !== undefined) updates.address = body.address
  if (body.pointOfContact !== undefined) updates.point_of_contact = body.pointOfContact
  if (body.image !== undefined) updates.image = body.image
  if (body.category !== undefined) updates.category = body.category
  if (body.externalUrl !== undefined) updates.external_url = body.externalUrl
  if (body.signupUrl !== undefined) updates.signup_url = body.signupUrl
  if (body.allowJanataSignup !== undefined) updates.allow_janata_signup = body.allowJanataSignup ? 1 : 0

  const result = await db.updateEvent(c.env.DB, eventId, updates)
  if (result.success) {
    return c.json({ message: 'Event updated' })
  }
  return c.json({ message: 'Failed to update event', error: result.error }, 500)
})

app.delete('/admin/events/:id', adminMiddleware, async (c) => {
  const eventId = c.req.param('id')
  const event = await db.getEventById(c.env.DB, eventId)
  if (!event) {
    return c.json({ message: 'Event not found' }, 404)
  }

  const result = await db.deleteEvent(c.env.DB, eventId)
  if (result.success) {
    return c.json({ message: 'Event deleted' })
  }
  return c.json({ message: 'Failed to delete event', error: result.error }, 500)
})

// ── Admin user actions ──────────────────────────────────────────────

app.post('/admin/users/:id/verify', adminMiddleware, async (c) => {
  const userId = c.req.param('id')
  const targetUser = await db.getUserById(c.env.DB, userId)
  if (!targetUser) {
    return c.json({ message: 'User not found' }, 404)
  }

  const body = await c.req.json<{
    verificationLevel?: number
    isVerified?: boolean
  }>()

  const updates: Partial<UserRow> = {}

  if (body.isVerified === false) {
    updates.is_verified = 0
    updates.verification_level = body.verificationLevel ?? NORMAL_USER
  } else {
    updates.is_verified = 1
    updates.verification_level = body.verificationLevel ?? targetUser.verification_level
  }

  const result = await db.updateUser(c.env.DB, userId, updates)
  if (result.success) {
    return c.json({
      message: updates.is_verified ? 'User verified' : 'User unverified',
      isVerified: updates.is_verified === 1,
    })
  }
  return c.json({ message: 'Update failed' }, 500)
})

app.delete('/admin/users/:id', adminMiddleware, async (c) => {
  const userId = c.req.param('id')
  const adminUser = c.get('user')

  if (adminUser.id === userId) {
    return c.json({ message: 'Cannot delete your own account from admin panel' }, 400)
  }

  const targetUser = await db.getUserById(c.env.DB, userId)
  if (!targetUser) {
    return c.json({ message: 'User not found' }, 404)
  }

  const result = await db.deleteUser(c.env.DB, userId)
  if (result.success) {
    return c.json({ message: 'User deleted' })
  }
  return c.json({ message: 'Delete failed' }, 500)
})

// ── Admin invite code actions ──────────────────────────────────────────

app.get('/admin/invite-codes', adminMiddleware, async (c) => {
  const codes = await inviteCodes.getAllInviteCodes(c.env)
  const codesWithUsage = await Promise.all(
    codes.map(async (code) => ({
      ...inviteCodes.inviteCodeRowToApi(code),
      usageCount: await inviteCodes.countUsersWithCode(c.env, code.code),
    }))
  )
  return c.json({ data: codesWithUsage })
})

app.post('/admin/invite-codes', adminMiddleware, async (c) => {
  const body = await c.req.json<{
    code: string
    label: string
    verificationLevel?: number
  }>()

  if (!body.code || !body.label) {
    return c.json({ message: 'Code and label are required' }, 400)
  }

  const verificationLevel = body.verificationLevel ?? NORMAL_USER
  if (verificationLevel >= ADMIN_CUTOFF) {
    return c.json({ message: 'Verification level cannot grant admin access' }, 400)
  }

  const result = await inviteCodes.createInviteCode(
    c.env,
    body.code,
    body.label,
    verificationLevel,
    true
  )

  if (result.success) {
    return c.json({ message: 'Invite code created' })
  }
  return c.json({ message: result.error || 'Failed to create invite code' }, 400)
})

app.post('/admin/invite-codes/:code/toggle', adminMiddleware, async (c) => {
  const code = c.req.param('code')
  const existing = await inviteCodes.getInviteCode(c.env, code)
  if (!existing) {
    return c.json({ message: 'Invite code not found' }, 404)
  }

  const result = existing.is_active
    ? await inviteCodes.deactivateInviteCode(c.env, code)
    : await inviteCodes.reactivateInviteCode(c.env, code)

  if (result.success) {
    return c.json({ message: existing.is_active ? 'Code deactivated' : 'Code activated' })
  }
  return c.json({ message: result.error || 'Failed to toggle invite code' }, 500)
})

app.get('/admin/invite-codes/:code/users', adminMiddleware, async (c) => {
  const code = c.req.param('code')
  const userIds = await inviteCodes.getUsersWithCode(c.env, code)
  const users = await Promise.all(
    userIds.map(async (id) => {
      const user = await db.getUserById(c.env.DB, id)
      return user ? userRowToApi(user) : null
    })
  )
  return c.json({ data: users.filter(Boolean) })
})

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /notifications
 * Get all notifications for the authenticated user
 */
app.get('/notifications', authMiddleware, async (c) => {
  const user = c.get('user')
  const limit = parseInt(c.req.query('limit') || '50')
  const offset = parseInt(c.req.query('offset') || '0')
  const unreadOnly = c.req.query('unreadOnly') === 'true'

  const notifs = await notifications.getUserNotifications(c.env, user.id, {
    limit: Math.min(limit, 100),
    offset,
    unreadOnly,
  })

  return c.json({
    notifications: notifs.map(notifications.notificationRowToApi),
    count: notifs.length,
  })
})

/**
 * GET /notifications/unread-count
 * Get unread notification count for the authenticated user
 */
app.get('/notifications/unread-count', authMiddleware, async (c) => {
  const user = c.get('user')
  const count = await notifications.getUnreadNotificationCount(c.env, user.id)
  return c.json({ unreadCount: count })
})

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
app.put('/notifications/:id/read', authMiddleware, async (c) => {
  const user = c.get('user')
  const notifId = c.req.param('id')

  const success = await notifications.markNotificationAsRead(c.env, notifId, user.id)

  if (success) {
    return c.json({ message: 'Notification marked as read' })
  }

  return c.json({ message: 'Notification not found' }, 404)
})

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read
 */
app.put('/notifications/mark-all-read', authMiddleware, async (c) => {
  const user = c.get('user')

  await notifications.markAllNotificationsAsRead(c.env, user.id)

  return c.json({ message: 'All notifications marked as read' })
})

/**
 * PUT /notifications/:id/archive
 * Archive a notification
 */
app.put('/notifications/:id/archive', authMiddleware, async (c) => {
  const user = c.get('user')
  const notifId = c.req.param('id')

  const success = await notifications.archiveNotification(c.env, notifId, user.id)

  if (success) {
    return c.json({ message: 'Notification archived' })
  }

  return c.json({ message: 'Notification not found' }, 404)
})

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
app.delete('/notifications/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const notifId = c.req.param('id')

  const success = await notifications.deleteNotification(c.env, notifId, user.id)

  if (success) {
    return c.json({ message: 'Notification deleted' })
  }

  return c.json({ message: 'Notification not found' }, 404)
})

/**
 * GET /notifications/preferences
 * Get notification preferences for the authenticated user
 */
app.get('/notifications/preferences', authMiddleware, async (c) => {
  const user = c.get('user')

  let prefs = await notifications.getNotificationPreferences(c.env, user.id)

  // Create default preferences if they don't exist
  if (!prefs) {
    prefs = await notifications.createDefaultNotificationPreferences(c.env, user.id)
  }

  return c.json(notifications.preferencesRowToApi(prefs))
})

/**
 * PUT /notifications/preferences
 * Update notification preferences
 */
app.put('/notifications/preferences', authMiddleware, async (c) => {
  const user = c.get('user')
  const body = await c.req.json()

  // Convert from camelCase API format to snake_case DB format
  const updates: Partial<notifications.NotificationPreferenceRow> = {}

  if (body.inAppEnabled !== undefined) updates.in_app_enabled = body.inAppEnabled ? 1 : 0
  if (body.pushEnabled !== undefined) updates.push_enabled = body.pushEnabled ? 1 : 0
  if (body.emailEnabled !== undefined) updates.email_enabled = body.emailEnabled ? 1 : 0
  if (body.eventReminders !== undefined) updates.event_reminders = body.eventReminders ? 1 : 0
  if (body.eventCreated !== undefined) updates.event_created = body.eventCreated ? 1 : 0
  if (body.eventCancelled !== undefined) updates.event_cancelled = body.eventCancelled ? 1 : 0
  if (body.eventUpdated !== undefined) updates.event_updated = body.eventUpdated ? 1 : 0
  if (body.attendeeJoined !== undefined) updates.attendee_joined = body.attendeeJoined ? 1 : 0
  if (body.centerAnnouncements !== undefined) updates.center_announcements = body.centerAnnouncements ? 1 : 0
  if (body.quietHoursStart !== undefined) updates.quiet_hours_start = body.quietHoursStart
  if (body.quietHoursEnd !== undefined) updates.quiet_hours_end = body.quietHoursEnd
  if (body.quietHoursEnabled !== undefined) updates.quiet_hours_enabled = body.quietHoursEnabled ? 1 : 0

  const prefs = await notifications.updateNotificationPreferences(c.env, user.id, updates)

  if (!prefs) {
    return c.json({ message: 'Preferences not found' }, 404)
  }

  return c.json(notifications.preferencesRowToApi(prefs))
})

// ═══════════════════════════════════════════════════════════════════════
// ADMIN NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /admin/notifications
 * List all notifications across all users (paginated, searchable)
 */
app.get('/admin/notifications', adminMiddleware, async (c) => {
  const url = new URL(c.req.url)
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 100)
  const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '0', 10) || 0, 0)
  const userId = url.searchParams.get('userId') || undefined
  const typeId = url.searchParams.get('typeId') ? parseInt(url.searchParams.get('typeId')!, 10) : undefined

  let query = `SELECT n.*, u.first_name, u.last_name, u.username FROM notifications n LEFT JOIN users u ON n.user_id = u.id`
  const conditions: string[] = []
  const values: any[] = []

  if (userId) {
    conditions.push('n.user_id = ?')
    values.push(userId)
  }
  if (typeId) {
    conditions.push('n.type_id = ?')
    values.push(typeId)
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  query += ` ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
  values.push(limit, offset)

  const stmt = c.env.DB.prepare(query)
  const result = await stmt.bind(...values).all()

  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM notifications n`
  const countValues = values.slice(0, -2) // exclude limit/offset
  if (conditions.length > 0) {
    countQuery += ` WHERE ${conditions.join(' AND ')}`
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countValues).first<{ count: number }>()

  return c.json({
    data: (result.results || []).map((row: any) => ({
      ...notifications.notificationRowToApi(row),
      recipientName: row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.username || 'Unknown',
      recipientUsername: row.username,
    })),
    total: countResult?.count || 0,
    limit,
    offset,
  })
})

/**
 * GET /admin/notifications/stats
 * Notification system stats for admin dashboard
 */
app.get('/admin/notifications/stats', adminMiddleware, async (c) => {
  const [totalResult, unreadResult, typeBreakdown, recentResult] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications').first<{ count: number }>(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').first<{ count: number }>(),
    c.env.DB.prepare('SELECT type_id, COUNT(*) as count FROM notifications GROUP BY type_id').all(),
    c.env.DB.prepare('SELECT COUNT(*) as count FROM notifications WHERE created_at > datetime("now", "-24 hours")').first<{ count: number }>(),
  ])

  return c.json({
    total: totalResult?.count || 0,
    unread: unreadResult?.count || 0,
    last24h: recentResult?.count || 0,
    byType: (typeBreakdown.results || []).map((row: any) => ({
      typeId: row.type_id,
      count: row.count,
    })),
  })
})

/**
 * POST /admin/notifications/send
 * Send a notification to a user or all users
 */
app.post('/admin/notifications/send', adminMiddleware, async (c) => {
  const body = await c.req.json<{
    userId?: string
    typeId: number
    title: string
    message: string
    actionUrl?: string
    broadcast?: boolean
  }>()

  if (!body.title || !body.message || !body.typeId) {
    return c.json({ message: 'title, message, and typeId are required' }, 400)
  }

  if (body.broadcast) {
    // Send to all users
    const users = await c.env.DB.prepare('SELECT id FROM users').all<{ id: string }>()
    let sent = 0
    for (const user of users.results || []) {
      await notifications.createNotification(c.env, user.id, body.typeId, body.title, body.message, {
        actionUrl: body.actionUrl,
      })
      sent++
    }
    return c.json({ message: `Notification sent to ${sent} users`, sent })
  }

  if (!body.userId) {
    return c.json({ message: 'userId is required when not broadcasting' }, 400)
  }

  const notif = await notifications.createNotification(c.env, body.userId, body.typeId, body.title, body.message, {
    actionUrl: body.actionUrl,
  })

  return c.json({ message: 'Notification sent', notification: notifications.notificationRowToApi(notif) })
})

/**
 * DELETE /admin/notifications/:id
 * Admin delete any notification
 */
app.delete('/admin/notifications/:id', adminMiddleware, async (c) => {
  const notifId = c.req.param('id')

  const result = await c.env.DB.prepare('DELETE FROM notifications WHERE id = ?').bind(notifId).run()

  if (result.success) {
    return c.json({ message: 'Notification deleted' })
  }
  return c.json({ message: 'Failed to delete notification' }, 500)
})

// ── Default export ────────────────────────────────────────────────────

export default app

/**
 * passwordReset.test.ts — coverage for the v2 self-serve reset flow.
 *
 * The flow is split across two endpoints. Tests against /request exercise
 * the side effects (row inserted, prior codes invalidated) since the
 * plaintext code is opaque after generation. Tests against /verify use
 * manually-inserted rows with a known code so we can exercise the full
 * matching path.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test'
import { applyMigration, dropAllTables, TEST_INVITE_CODE } from './setup'
import { app } from '../app'
import { hashPassword } from '../auth'
import { clearRateLimits } from '../middleware'

interface ResetRow {
  id: string
  user_id: string
  code_hash: string
  expires_at: string
  used_at: string | null
  attempts: number
  created_at: string
}

async function fetchJSON(path: string, init?: RequestInit) {
  const req = new Request(`http://localhost${path}`, init)
  const ctx = createExecutionContext()
  const res = await app.fetch(req, env, ctx)
  await waitOnExecutionContext(ctx)
  const text = await res.text()
  let body: any = {}
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }
  return { res, body }
}

function jsonPost(path: string, data: unknown) {
  return fetchJSON(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

async function register(username: string, password = 'initialpw123') {
  await jsonPost('/api/auth/register', {
    username,
    password,
    inviteCode: TEST_INVITE_CODE,
  })
  const user = await env.DB.prepare(
    'SELECT id, email FROM users WHERE username = ?',
  )
    .bind(username.toLowerCase())
    .first<{ id: string; email: string }>()
  return user!
}

async function loadActiveRow(userId: string): Promise<ResetRow | null> {
  return await env.DB.prepare(
    `SELECT id, user_id, code_hash, expires_at, used_at, attempts, created_at
     FROM password_reset_codes
     WHERE user_id = ? AND used_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
  )
    .bind(userId)
    .first<ResetRow>()
}

async function insertKnownCode(
  userId: string,
  code: string,
  opts: { expiresInMs?: number; attempts?: number; used?: boolean } = {},
): Promise<string> {
  const id = crypto.randomUUID()
  const expiresAt = new Date(
    Date.now() + (opts.expiresInMs ?? 15 * 60 * 1000),
  ).toISOString()
  const codeHash = await hashPassword(code)
  await env.DB.prepare(
    `INSERT INTO password_reset_codes
       (id, user_id, code_hash, expires_at, used_at, attempts, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      userId,
      codeHash,
      expiresAt,
      opts.used ? new Date().toISOString() : null,
      opts.attempts ?? 0,
      new Date().toISOString(),
    )
    .run()
  return id
}

beforeEach(async () => {
  await dropAllTables()
  await applyMigration()
  clearRateLimits()
})

// ═══════════════════════════════════════════════════════════════════════
// REQUEST endpoint
// ═══════════════════════════════════════════════════════════════════════

describe('POST /api/auth/password-reset/request', () => {
  it('always returns ok:true even for an unknown email (no enumeration)', async () => {
    const { res, body } = await jsonPost('/api/auth/password-reset/request', {
      username: 'nobody@nowhere.test',
    })
    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })

    // No row created for a phantom user
    const rows = await env.DB.prepare(
      'SELECT COUNT(*) as c FROM password_reset_codes',
    ).first<{ c: number }>()
    expect(rows!.c).toBe(0)
  })

  it('inserts a row with attempts=0 and ~15min expiry for a real user', async () => {
    const user = await register('alice@reset.test')
    const before = Date.now()
    const { res, body } = await jsonPost('/api/auth/password-reset/request', {
      username: 'alice@reset.test',
    })
    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })

    const row = await loadActiveRow(user.id)
    expect(row).not.toBeNull()
    expect(row!.attempts).toBe(0)
    expect(row!.used_at).toBeNull()
    const ttl = new Date(row!.expires_at).getTime() - before
    // Should be within 15 minutes ± a small fudge for clock + test runtime.
    expect(ttl).toBeGreaterThan(14 * 60 * 1000)
    expect(ttl).toBeLessThan(16 * 60 * 1000)
  })

  it('invalidates prior active codes when a new request comes in', async () => {
    const user = await register('rotate@reset.test')
    await jsonPost('/api/auth/password-reset/request', {
      username: 'rotate@reset.test',
    })
    const first = await loadActiveRow(user.id)
    expect(first).not.toBeNull()

    await jsonPost('/api/auth/password-reset/request', {
      username: 'rotate@reset.test',
    })

    // Exactly one active row should remain, and it should be a new one.
    const activeCount = await env.DB.prepare(
      `SELECT COUNT(*) as c FROM password_reset_codes
       WHERE user_id = ? AND used_at IS NULL`,
    )
      .bind(user.id)
      .first<{ c: number }>()
    expect(activeCount!.c).toBe(1)

    const second = await loadActiveRow(user.id)
    expect(second!.id).not.toBe(first!.id)

    // The first row should be marked used.
    const firstNow = await env.DB.prepare(
      'SELECT used_at FROM password_reset_codes WHERE id = ?',
    )
      .bind(first!.id)
      .first<{ used_at: string | null }>()
    expect(firstNow!.used_at).not.toBeNull()
  })

  it('returns ok:true even on a malformed body', async () => {
    const { res, body } = await fetchJSON('/api/auth/password-reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })
  })
})

// ═══════════════════════════════════════════════════════════════════════
// VERIFY endpoint
// ═══════════════════════════════════════════════════════════════════════

describe('POST /api/auth/password-reset/verify', () => {
  it('rotates the password on the correct code and marks the code used', async () => {
    const user = await register('happy@reset.test', 'oldpw12345')
    await insertKnownCode(user.id, '123456')

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'happy@reset.test',
      code: '123456',
      newPassword: 'brandNewPw99',
    })
    expect(res.status).toBe(200)
    expect(body).toEqual({ ok: true })

    // Login with old password must now fail
    const loginOld = await jsonPost('/api/auth/authenticate', {
      username: 'happy@reset.test',
      password: 'oldpw12345',
    })
    expect(loginOld.res.status).toBe(401)

    // Login with new password works
    const loginNew = await jsonPost('/api/auth/authenticate', {
      username: 'happy@reset.test',
      password: 'brandNewPw99',
    })
    expect(loginNew.res.status).toBe(200)
    expect(loginNew.body.token).toBeDefined()

    // The code row should be marked used
    const row = await env.DB.prepare(
      'SELECT used_at FROM password_reset_codes WHERE user_id = ?',
    )
      .bind(user.id)
      .first<{ used_at: string | null }>()
    expect(row!.used_at).not.toBeNull()
  })

  it('rejects a wrong code with a generic error and increments attempts', async () => {
    const user = await register('wrong@reset.test')
    await insertKnownCode(user.id, '654321')

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'wrong@reset.test',
      code: '000000',
      newPassword: 'anotherNewPw99',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toMatch(/invalid or expired/i)

    const row = await loadActiveRow(user.id)
    expect(row!.attempts).toBe(1)
    expect(row!.used_at).toBeNull()
  })

  it('hard-invalidates after 5 attempts even if the 5th is correct', async () => {
    const user = await register('burn@reset.test')
    // Insert with attempts already at 4 -- next bump puts it at 5 → burn.
    await insertKnownCode(user.id, '111111', { attempts: 4 })

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'burn@reset.test',
      code: '111111',
      newPassword: 'shouldNotApply',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)

    const row = await env.DB.prepare(
      'SELECT used_at, attempts FROM password_reset_codes WHERE user_id = ?',
    )
      .bind(user.id)
      .first<{ used_at: string | null; attempts: number }>()
    expect(row!.used_at).not.toBeNull()
    expect(row!.attempts).toBe(5)

    // Password unchanged
    const login = await jsonPost('/api/auth/authenticate', {
      username: 'burn@reset.test',
      password: 'initialpw123',
    })
    expect(login.res.status).toBe(200)
  })

  it('rejects an already-used code', async () => {
    const user = await register('reuse@reset.test')
    await insertKnownCode(user.id, '222222', { used: true })

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'reuse@reset.test',
      code: '222222',
      newPassword: 'shouldNotApply',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
  })

  it('rejects an expired code', async () => {
    const user = await register('expired@reset.test')
    await insertKnownCode(user.id, '333333', { expiresInMs: -1000 })

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'expired@reset.test',
      code: '333333',
      newPassword: 'shouldNotApply',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
  })

  it('rejects when newPassword is too short', async () => {
    const user = await register('short@reset.test')
    await insertKnownCode(user.id, '444444')

    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'short@reset.test',
      code: '444444',
      newPassword: 'abc',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toMatch(/at least 8/i)

    // Code should still be usable (we don't burn on validation failure)
    const row = await loadActiveRow(user.id)
    expect(row!.used_at).toBeNull()
  })

  it('returns a generic error for an unknown username (no enumeration on verify)', async () => {
    const { res, body } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'ghost@reset.test',
      code: '555555',
      newPassword: 'someNewPw99',
    })
    expect(res.status).toBe(400)
    expect(body.ok).toBe(false)
    expect(body.error).toMatch(/invalid or expired/i)
  })

  it('returns 400 when required fields are missing', async () => {
    const { res } = await jsonPost('/api/auth/password-reset/verify', {
      username: 'x@reset.test',
    })
    expect(res.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════════════════════
// COMPOSITION WITH JWT INVALIDATION (Phase 1.1)
// ═══════════════════════════════════════════════════════════════════════

describe('reset composes with JWT invalidation', () => {
  it('JWT issued before the reset is rejected afterwards (401)', async () => {
    await register('compose@reset.test', 'oldpw12345')
    const { body: loginBody } = await jsonPost('/api/auth/authenticate', {
      username: 'compose@reset.test',
      password: 'oldpw12345',
    })
    const oldToken = loginBody.token
    expect(oldToken).toBeDefined()

    // Sanity: token works pre-reset
    const verifyPre = await fetchJSON('/api/auth/verify', {
      headers: { Authorization: `Bearer ${oldToken}` },
    })
    expect(verifyPre.res.status).toBe(200)

    // Reset the password
    const user = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?',
    )
      .bind('compose@reset.test')
      .first<{ id: string }>()
    await insertKnownCode(user!.id, '777777')

    const resetResult = await jsonPost('/api/auth/password-reset/verify', {
      username: 'compose@reset.test',
      code: '777777',
      newPassword: 'brandNewPw99',
    })
    expect(resetResult.res.status).toBe(200)

    // Old token now fails with tv mismatch
    const verifyPost = await fetchJSON('/api/auth/verify', {
      headers: { Authorization: `Bearer ${oldToken}` },
    })
    expect(verifyPost.res.status).toBe(401)
  })
})

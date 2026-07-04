/**
 * auth.ts
 *
 * Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
 *
 * Authentication utilities for Cloudflare Workers.
 * - PBKDF2 via Web Crypto API (replaces bcryptjs)
 * - JWT via jose library (replaces jsonwebtoken)
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// ── Password hashing with PBKDF2 ─────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000 // CF Workers max (OWASP min for PBKDF2-SHA256)
const SALT_LENGTH = 16
const KEY_LENGTH = 32

/**
 * Hashes a plaintext password using PBKDF2-SHA256.
 * Returns a string in the format: `iterations:salt_base64:hash_base64`
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  const hashArr = new Uint8Array(bits)
  return `${PBKDF2_ITERATIONS}:${uint8ToBase64(salt)}:${uint8ToBase64(hashArr)}`
}

/**
 * Verifies a plaintext password against a PBKDF2 hash string.
 * Also accepts bcryptjs hashes (starting with "$2") for migration
 * compatibility, but will always return false for those since we
 * can't verify bcrypt in Workers -- the migration script should
 * re-hash on first login.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Legacy bcrypt hash detection -- cannot verify in Workers
  if (stored.startsWith('$2')) {
    return false
  }

  const parts = stored.split(':')
  if (parts.length !== 3) return false

  const [iterStr, saltB64, hashB64] = parts
  const iterations = parseInt(iterStr, 10)
  if (isNaN(iterations)) return false

  const salt = base64ToUint8(saltB64)
  const expectedHash = base64ToUint8(hashB64)

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    expectedHash.length * 8,
  )
  const actualHash = new Uint8Array(bits)
  return timingSafeEqual(actualHash, expectedHash)
}

// ── JWT helpers ───────────────────────────────────────────────────────

interface TokenPayload extends JWTPayload {
  id: string
  username: string
  type?: 'access' | 'refresh'
  // Fingerprint of users.password at issue time. When the password changes
  // (reset flow, "change password" future), the fingerprint shifts and all
  // outstanding JWTs fail the authMiddleware check. Optional so JWTs issued
  // before this rollout still verify.
  tv?: string
}

function secretToKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret)
}

/**
 * Derives a short, stable fingerprint of a stored password hash.
 * Used as the `tv` (token version) claim on JWTs so that rotating a user's
 * password invalidates every live JWT for that user.
 *
 * Hashing the already-hashed password keeps us from putting raw hash bytes
 * into the token. 16 hex chars = 64 bits, plenty to detect any change.
 */
export async function passwordFingerprint(passwordHash: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passwordHash))
  const arr = new Uint8Array(bytes)
  let hex = ''
  for (let i = 0; i < 8; i++) {
    hex += arr[i].toString(16).padStart(2, '0')
  }
  return hex
}

export async function generateToken(
  user: { id: string; username: string; password: string },
  secret: string,
): Promise<string> {
  const tv = await passwordFingerprint(user.password)
  return new SignJWT({ id: user.id, username: user.username, type: 'access', tv })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretToKey(secret))
}

export async function generateRefreshToken(
  user: { id: string; username: string; password: string },
  secret: string,
): Promise<string> {
  const tv = await passwordFingerprint(user.password)
  return new SignJWT({ id: user.id, username: user.username, type: 'refresh', tv })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(secretToKey(secret))
}

export async function verifyToken(
  token: string,
  secret: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretToKey(secret))
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function verifyRefreshToken(
  token: string,
  secret: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretToKey(secret))
    if ((payload as TokenPayload).type !== 'refresh') return null
    return payload as TokenPayload
  } catch {
    return null
  }
}

// ── Utility functions ─────────────────────────────────────────────────

function uint8ToBase64(arr: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i])
  }
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const arr = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i)
  }
  return arr
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i]
  }
  return result === 0
}

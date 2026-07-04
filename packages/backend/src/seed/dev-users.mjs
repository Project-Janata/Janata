/**
 * Dev user seed script — generates PBKDF2 hashes matching auth.ts,
 * then executes the inserts against the local D1 via wrangler.
 *
 * Run: node packages/backend/src/seed/dev-users.mjs
 */

import { webcrypto } from 'node:crypto'
import { execSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const subtle = webcrypto.subtle
const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const KEY_LENGTH = 32
const PASSWORD = 'PreviewTest2026!'

// Boston-area center from centers.sql (Chinmaya Maruti, Andover MA)
const BOSTON_CENTER_ID = 'c0000001-0000-0000-0000-000000000002'

function uint8ToBase64(arr) {
  return Buffer.from(arr).toString('base64')
}

async function hashPassword(password) {
  const salt = webcrypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  )
  const hashArr = new Uint8Array(bits)
  return `${PBKDF2_ITERATIONS}:${uint8ToBase64(salt)}:${uint8ToBase64(hashArr)}`
}

function escape(s) {
  return s.replace(/'/g, "''")
}

const users = [
  {
    id: 'dev00001-0000-0000-0000-000000000001',
    username: 'unverified_dev',
    email: 'unverified@chinmayajanata.org',
    first_name: 'Dev',
    last_name: 'Unverified',
    verification_level: 30,
    is_verified: 0,
    is_active: 1,
    profile_complete: 0,
    center_id: null,
    points: 30,
  },
  {
    id: 'dev00001-0000-0000-0000-000000000002',
    username: 'member_dev',
    email: 'member@chinmayajanata.org',
    first_name: 'Dev',
    last_name: 'Member',
    verification_level: 45,
    is_verified: 1,
    is_active: 1,
    profile_complete: 1,
    center_id: BOSTON_CENTER_ID,
    points: 45,
  },
  {
    id: 'dev00001-0000-0000-0000-000000000003',
    username: 'sevak_dev',
    email: 'sevak@chinmayajanata.org',
    first_name: 'Dev',
    last_name: 'Sevak',
    verification_level: 54,
    is_verified: 1,
    is_active: 1,
    profile_complete: 1,
    center_id: BOSTON_CENTER_ID,
    points: 54,
  },
  {
    id: 'dev00001-0000-0000-0000-000000000004',
    username: 'brahmachari_dev',
    email: 'brahmachari@chinmayajanata.org',
    first_name: 'Dev',
    last_name: 'Brahmachari',
    verification_level: 108,
    is_verified: 1,
    is_active: 1,
    profile_complete: 1,
    center_id: BOSTON_CENTER_ID,
    points: 108,
  },
  {
    id: 'dev00001-0000-0000-0000-000000000005',
    username: 'admin_dev',
    email: 'admin@chinmayajanata.org',
    first_name: 'Dev',
    last_name: 'Admin',
    verification_level: 110,
    is_verified: 1,
    is_active: 1,
    profile_complete: 1,
    center_id: BOSTON_CENTER_ID,
    points: 110,
  },
]

console.log('Hashing passwords...')
const rows = await Promise.all(
  users.map(async (u) => ({ ...u, password: await hashPassword(PASSWORD) }))
)

const statements = rows.map((u) => {
  const centerVal = u.center_id ? `'${u.center_id}'` : 'NULL'
  return `INSERT INTO users (
  id, username, password, email, first_name, last_name,
  points, is_verified, verification_level, is_active, profile_complete,
  center_id, created_at, updated_at
) VALUES (
  '${u.id}', '${escape(u.username)}', '${escape(u.password)}',
  '${escape(u.email)}', '${escape(u.first_name)}', '${escape(u.last_name)}',
  ${u.points}, ${u.is_verified}, ${u.verification_level}, ${u.is_active}, ${u.profile_complete},
  ${centerVal}, datetime('now'), datetime('now')
) ON CONFLICT(id) DO UPDATE SET
  password = excluded.password,
  email = excluded.email,
  verification_level = excluded.verification_level,
  is_verified = excluded.is_verified,
  is_active = excluded.is_active,
  profile_complete = excluded.profile_complete,
  center_id = excluded.center_id,
  updated_at = datetime('now');`
})

const sql = statements.join('\n\n')

const tmpFile = join(tmpdir(), 'janata-dev-users.sql')
writeFileSync(tmpFile, sql)

console.log('Inserting users into local D1...')
try {
  execSync(
    `npx wrangler d1 execute chinmaya-janata-db --local --file="${tmpFile}"`,
    { cwd: new URL('../../', import.meta.url).pathname, stdio: 'inherit' }
  )
  console.log('\nDone! Dev users seeded:')
  users.forEach((u) => console.log(`  ${u.email}  (level ${u.verification_level})`))
  console.log(`  Password for all: ${PASSWORD}`)
} finally {
  unlinkSync(tmpFile)
}

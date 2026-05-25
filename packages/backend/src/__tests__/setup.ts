/**
 * setup.ts
 *
 * Test setup: applies D1 migrations before each test suite.
 */
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
} from 'cloudflare:test'

const MIGRATION = `
-- FK constraints are dropped in the test schema to avoid a circular ref
-- between invite_codes.created_by_user_id and users.invite_code at
-- table-drop time (D1 doesn't honor PRAGMA foreign_keys = OFF inside
-- the test pool). The production migration still enforces them.
CREATE TABLE IF NOT EXISTS invite_codes (
  code              TEXT PRIMARY KEY,
  label             TEXT NOT NULL,
  verification_level INTEGER NOT NULL DEFAULT 45,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  created_by_user_id TEXT,
  expires_at        TEXT,
  max_uses          INTEGER,
  uses_count        INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invite_codes_creator ON invite_codes(created_by_user_id);

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password        TEXT NOT NULL,
  email           TEXT COLLATE NOCASE,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  date_of_birth   TEXT,
  phone_number    TEXT,
  profile_image   TEXT,
  bio             TEXT,
  center_id       TEXT REFERENCES centers(id) ON DELETE SET NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  is_verified     INTEGER NOT NULL DEFAULT 0,
  verification_level INTEGER NOT NULL DEFAULT 45,
  is_active       INTEGER NOT NULL DEFAULT 0,
  profile_complete INTEGER NOT NULL DEFAULT 0,
  interests       TEXT,
  invite_code     TEXT,
  email_verified_at TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_center   ON users(center_id);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  consumed_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_prc_user_active ON password_reset_codes(user_id, expires_at);

CREATE TABLE IF NOT EXISTS centers (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  latitude        REAL NOT NULL DEFAULT 0,
  longitude       REAL NOT NULL DEFAULT 0,
  address         TEXT,
  website         TEXT,
  phone           TEXT,
  image           TEXT,
  acharya         TEXT,
  point_of_contact TEXT,
  member_count    INTEGER NOT NULL DEFAULT 0,
  is_verified     INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_centers_name ON centers(name);

CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL,
  latitude        REAL NOT NULL DEFAULT 0,
  longitude       REAL NOT NULL DEFAULT 0,
  address         TEXT,
  center_id       TEXT REFERENCES centers(id) ON DELETE SET NULL,
  tier            INTEGER NOT NULL DEFAULT 0,
  people_attending INTEGER NOT NULL DEFAULT 0,
  point_of_contact TEXT,
  image           TEXT,
  category        INTEGER,
  end_date        TEXT,
  is_recurring    INTEGER NOT NULL DEFAULT 0,
  external_url    TEXT,
  signup_url      TEXT,
  allow_janata_signup INTEGER NOT NULL DEFAULT 0,
  created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_center ON events(center_id);
CREATE INDEX IF NOT EXISTS idx_events_date   ON events(date);

CREATE TABLE IF NOT EXISTS event_attendees (
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ea_user  ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_ea_event ON event_attendees(event_id);

CREATE TABLE IF NOT EXISTS event_endorsers (
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ee_user  ON event_endorsers(user_id);
CREATE INDEX IF NOT EXISTS idx_ee_event ON event_endorsers(event_id);
`

/** Test invite code seeded after migration */
export const TEST_INVITE_CODE = 'TEST-BETA'

/**
 * Run the D1 migration. Call this in beforeAll() or beforeEach().
 */
export async function applyMigration(): Promise<void> {
  const db = env.DB
  const statements = MIGRATION.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    await db.prepare(stmt).run()
  }

  // Seed a test invite code for registration tests
  await db.prepare(
    `INSERT OR IGNORE INTO invite_codes (code, label, verification_level, is_active) VALUES (?, ?, ?, ?)`
  ).bind(TEST_INVITE_CODE, 'Test Beta', 45, 1).run()
}

/**
 * Drop all tables. Call this in afterEach() for clean isolation.
 *
 * invite_codes and users have a circular FK (users.invite_code ↔
 * invite_codes.created_by_user_id), so we disable FK checks during the
 * drop sequence and re-enable after.
 */
export async function dropAllTables(): Promise<void> {
  const db = env.DB
  const tables = [
    'event_endorsers',
    'event_attendees',
    'events',
    'email_verification_tokens',
    'password_reset_codes',
    'invite_codes',
    'users',
    'centers',
  ]
  for (const table of tables) {
    await db.prepare(`DROP TABLE IF EXISTS ${table}`).run()
  }
}

/**
 * Helper: make a request to the Hono app with proper env bindings.
 */
export function makeRequest(
  path: string,
  init?: RequestInit,
): Request {
  return new Request(`http://localhost${path}`, init)
}

-- 0001_initial_schema.sql
-- Cloudflare D1 (SQLite) schema for Chinmaya Janata
--
-- Om Sri Chinmaya Sadgurave Namaha. Om Sri Gurubyo Namaha.
--
-- Migrated from DynamoDB (ChinmayaJanata-Users, ChinmayaJanata-Centers,
-- ChinmayaJanata-Events) where data was stored as nested JSON blobs
-- (userObject, centerObject, eventObject). This schema flattens everything
-- into proper relational columns.

-- ═══════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,                -- UUID
  username        TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password        TEXT NOT NULL,                   -- PBKDF2 hash (base64)
  email           TEXT COLLATE NOCASE,
  first_name      TEXT NOT NULL DEFAULT '',
  last_name       TEXT NOT NULL DEFAULT '',
  date_of_birth   TEXT,                            -- ISO-8601 date string
  phone_number    TEXT,
  profile_image   TEXT,                            -- URL or R2 key
  center_id       TEXT REFERENCES centers(id) ON DELETE SET NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  is_verified     INTEGER NOT NULL DEFAULT 0,      -- 0 = false, 1 = true
  verification_level INTEGER NOT NULL DEFAULT 45,  -- NORMAL_USER = 45
  is_active       INTEGER NOT NULL DEFAULT 0,
  profile_complete INTEGER NOT NULL DEFAULT 0,
  interests       TEXT,                            -- JSON array string
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_center   ON users(center_id);

-- ═══════════════════════════════════════════════════════════════════════
-- CENTERS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS centers (
  id              TEXT PRIMARY KEY,                -- UUID
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

-- ═══════════════════════════════════════════════════════════════════════
-- EVENTS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS events (
  id              TEXT PRIMARY KEY,                -- UUID
  title           TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL,                   -- ISO-8601 datetime
  latitude        REAL NOT NULL DEFAULT 0,
  longitude       REAL NOT NULL DEFAULT 0,
  address         TEXT,
  center_id       TEXT REFERENCES centers(id) ON DELETE SET NULL,
  tier            INTEGER NOT NULL DEFAULT 0,
  people_attending INTEGER NOT NULL DEFAULT 0,
  point_of_contact TEXT,
  image           TEXT,                            -- URL or R2 key
  category        INTEGER,                         -- 91 = SATSANG, 92 = BHIKSHA
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_center ON events(center_id);
CREATE INDEX IF NOT EXISTS idx_events_date   ON events(date);

-- ═══════════════════════════════════════════════════════════════════════
-- EVENT ATTENDEES  (junction table replacing usersAttending[] array)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS event_attendees (
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ea_user  ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_ea_event ON event_attendees(event_id);

-- ═══════════════════════════════════════════════════════════════════════
-- EVENT ENDORSERS  (junction table replacing endorsers[] array)
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS event_endorsers (
  event_id        TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ee_user  ON event_endorsers(user_id);
CREATE INDEX IF NOT EXISTS idx_ee_event ON event_endorsers(event_id);

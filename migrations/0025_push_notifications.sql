-- 0025_push_notifications.sql
-- Push notification delivery (#102) plus board-post notification types.
--
-- Adds:
--   1. push_tokens: one row per device, stores the Expo push token so the
--      backend can deliver to APNs/FCM via the Expo Push API.
--   2. New notification_types for board activity (post, reply, reaction, mention).
--   3. Per-type preference columns on notification_preferences so each new
--      category has its own toggle in Settings.

-- ═══════════════════════════════════════════════════════════════════════
-- PUSH TOKENS
-- ═══════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS push_tokens (
  id          TEXT PRIMARY KEY,                -- UUID
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,            -- ExponentPushToken[...]
  platform    TEXT,                            -- ios / android / web
  device_id   TEXT,                            -- stable installation id (optional)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- ═══════════════════════════════════════════════════════════════════════
-- NEW NOTIFICATION TYPES (board activity)
-- ═══════════════════════════════════════════════════════════════════════
INSERT OR IGNORE INTO notification_types (id, name, description, icon) VALUES
  (8,  'BOARD_POST',     'New post on a board you follow', 'message-square'),
  (9,  'BOARD_REPLY',    'Someone replied to your post',   'corner-down-right'),
  (10, 'BOARD_REACTION', 'Someone reacted to your post',   'heart'),
  (11, 'BOARD_MENTION',  'You were mentioned in a post',   'at-sign');

-- ═══════════════════════════════════════════════════════════════════════
-- NEW PER-TYPE PREFERENCE COLUMNS
-- (SQLite ALTER TABLE ADD COLUMN is the only supported alter — one per line)
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE notification_preferences ADD COLUMN board_posts INTEGER NOT NULL DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN board_replies INTEGER NOT NULL DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN board_reactions INTEGER NOT NULL DEFAULT 1;
ALTER TABLE notification_preferences ADD COLUMN board_mentions INTEGER NOT NULL DEFAULT 1;

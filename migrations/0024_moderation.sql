-- Migration 0024 — Moderation tools (#209)
--
-- Adds the three pillars of lightweight human moderation (PRD §5.7):
--   1. post_reports — any verified user can report a board post (one report
--      per user per post, and re-reporting updates the reason).
--   2. moderation_actions — append-only audit log of every admin action
--      (delete post, suspend/unsuspend user). Kept generic (action + nullable
--      target_post_id/target_user_id + JSON metadata) so the v3 AI pipeline
--      can write to the same log later.
--   3. user suspension — additive columns on users that gate posting without
--      destroying the user's verification tier. Lazily expiring: a user is
--      suspended while suspended_at IS NOT NULL AND (suspended_until IS NULL
--      OR suspended_until > now). suspended_until NULL = indefinite.
--
-- All Tier 2 (feature-evolving) — new tables + additive ALTERs, no data loss.

-- ── Reports ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_reports (
  id           TEXT PRIMARY KEY,
  post_id      TEXT NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  reporter_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'open',  -- open | actioned | dismissed
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (post_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_post_reports_post ON post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_status_created
  ON post_reports(status, created_at);

-- ── Audit log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moderation_actions (
  id              TEXT PRIMARY KEY,
  -- nullable so ON DELETE SET NULL is valid if the acting admin is ever
  -- deleted (the audit row survives, attributed to a null actor).
  actor_id        TEXT REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,  -- delete_post | suspend_user | unsuspend_user
  target_post_id  TEXT REFERENCES board_posts(id) ON DELETE SET NULL,
  target_user_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  reason          TEXT,
  metadata        TEXT,           -- JSON blob for action-specific detail
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_created
  ON moderation_actions(created_at);

-- ── User suspension (additive, nullable) ───────────────────────────────
ALTER TABLE users ADD COLUMN suspended_at TEXT;
ALTER TABLE users ADD COLUMN suspended_until TEXT;
ALTER TABLE users ADD COLUMN suspended_reason TEXT;
ALTER TABLE users ADD COLUMN suspended_by TEXT REFERENCES users(id);

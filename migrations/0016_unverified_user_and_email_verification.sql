-- 0016_unverified_user_and_email_verification.sql
-- Adds email verification primitives for the v2 verification model.
--
-- Why: v2 introduces a new UNVERIFIED_USER (verification_level=30) tier that
-- new signups land in until they verify their email. Verified status
-- (NORMAL_USER=45) is then earned either by consuming an invite code
-- (Path A) or via cold application admin review (Path B, separate migration).
--
-- See docs/plans/2026-05-05-v2-roles-invites-messaging.md §4 for the full
-- verification ladder.

-- Track when each user verified their email. NULL = not yet verified.
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

-- Outstanding email verification tokens. One row per send.
CREATE TABLE email_verification_tokens (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  consumed_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_user ON email_verification_tokens(user_id);

-- Backfill: existing users are grandfathered in as already-verified, using
-- their account creation timestamp. They shouldn't be locked out by a new
-- gate they couldn't have known about.
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;

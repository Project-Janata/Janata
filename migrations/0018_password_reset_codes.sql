-- 0018_password_reset_codes.sql
-- One-time codes for the self-serve password reset flow.
--
-- See docs/plans/2026-05-24-password-reset.md.
--
-- The token-version mechanism mentioned in the design doc is not needed:
-- JWTs now embed a fingerprint of users.password (auth.ts `passwordFingerprint`),
-- so updating password in the reset handler invalidates every live JWT for
-- that user on the next authenticated request.

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prc_user_active
  ON password_reset_codes(user_id, expires_at);

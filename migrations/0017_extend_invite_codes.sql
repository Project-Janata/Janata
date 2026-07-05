-- 0017_extend_invite_codes.sql
-- Extends invite_codes for v2 user-issued links.
--
-- Why: v1 invite_codes were admin-managed cohort codes (multi-use, no
-- expiry). v2 lets verified users mint expiring links with use caps. The same
-- table backs both paths.
--
-- Backward compatibility: existing admin cohort codes have all new
-- columns NULL/0. validateInviteCode treats NULL max_uses as unlimited
-- and NULL expires_at as no expiry.
--
-- See docs/plans/2026-05-05-v2-roles-invites-messaging.md §5.A.

ALTER TABLE invite_codes ADD COLUMN created_by_user_id TEXT REFERENCES users(id);
ALTER TABLE invite_codes ADD COLUMN expires_at TEXT;
ALTER TABLE invite_codes ADD COLUMN max_uses INTEGER;
ALTER TABLE invite_codes ADD COLUMN uses_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_invite_codes_creator ON invite_codes(created_by_user_id);

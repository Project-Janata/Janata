-- 0027_invite_attribution.sql
-- Records the direct inviter -> invitee edge for vouching and abuse tracing.

ALTER TABLE users ADD COLUMN invited_by_user_id TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_users_invited_by_user_id ON users(invited_by_user_id);

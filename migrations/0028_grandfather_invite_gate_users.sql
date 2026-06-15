-- 0028_grandfather_invite_gate_users.sql
-- Hard invite gate grandfathering.
--
-- PR #440 made invite signups verified at inception, and the hard gate now
-- blocks new no-invite registrations. Existing soft-signup accounts predate
-- that policy, so promote below-member users to NORMAL_USER once rather than
-- leaving them stranded behind member-only surfaces.

UPDATE users
   SET verification_level = 45,
       is_verified = 1,
       email_verified_at = COALESCE(email_verified_at, created_at, datetime('now')),
       updated_at = datetime('now')
 WHERE verification_level < 45;

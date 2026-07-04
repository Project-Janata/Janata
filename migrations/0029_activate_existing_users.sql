-- 0029_activate_existing_users.sql
-- Make account activation enforceable.
--
-- The original users.is_active default was 0, but auth never enforced it, so
-- normal signups functioned while marked inactive. New application-created
-- users now insert is_active = 1; this migration activates existing accounts so
-- the new auth middleware can safely deny only accounts deactivated after this
-- point.

UPDATE users SET is_active = 1 WHERE is_active = 0;

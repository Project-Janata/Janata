-- _reset_preview.sql — PREVIEW-ONLY hard reset. Drops every app table so the
-- full migration set can be re-applied from scratch onto the isolated v2 preview
-- D1 (chinmaya-janata-db-v2preview). Underscore prefix keeps it out of the
-- 0NNN_*.sql migration glob. NEVER run against prod.
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS board_post_reactions;
DROP TABLE IF EXISTS board_post_replies;
DROP TABLE IF EXISTS board_post_pins;
DROP TABLE IF EXISTS board_posts;
DROP TABLE IF EXISTS boards;
DROP TABLE IF EXISTS post_reports;
DROP TABLE IF EXISTS moderation_actions;
DROP TABLE IF EXISTS event_attendees;
DROP TABLE IF EXISTS event_endorsers;
DROP TABLE IF EXISTS event_guest_rsvps;
DROP TABLE IF EXISTS event_users;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS centers;
DROP TABLE IF EXISTS invite_codes;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notification_types;
DROP TABLE IF EXISTS email_verification_tokens;
DROP TABLE IF EXISTS email_verification;
DROP TABLE IF EXISTS password_reset_codes;
DROP TABLE IF EXISTS password_reset_tokens;
DROP TABLE IF EXISTS users;

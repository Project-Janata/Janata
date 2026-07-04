-- Migration 0023 — guest RSVP + per-event verified gate (#191)
--
-- Two parts:
--   1. events.requires_verified — when 1, /attendEvent rejects users below
--      NORMAL_USER (45). Used for higher-trust events (e.g. members-only
--      satsangs, leadership gatherings) until we have a real role system.
--   2. event_guest_rsvps — non-authenticated RSVPs (name + email) on events
--      where requires_verified = 0 AND the new POST /attendEventGuest route
--      is hit. When the same email later signs up + verifies, the rows are
--      upgraded into event_attendees with upgraded_user_id set.
--
-- Renumbered from spec's "0019" because 0019 (boards) shipped earlier this
-- sprint. Spec said 0019; we're 0023.
--
-- events is Tier 1 canon — additive ALTER only (safe).
-- event_guest_rsvps is a brand new Tier 2 table.

ALTER TABLE events ADD COLUMN requires_verified INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS event_guest_rsvps (
  event_id          TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  name              TEXT NOT NULL,
  -- NULL until the same email signs up + verifies. Set by the email-verify
  -- backfill so the guest-RSVP becomes a regular attendee idempotently.
  upgraded_user_id  TEXT REFERENCES users(id),
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (event_id, email)
);

-- Index for the upgrade lookup at verify time: "find all guest RSVPs by
-- this newly-verified email and turn them into attendees."
CREATE INDEX IF NOT EXISTS idx_event_guest_rsvps_email ON event_guest_rsvps(email);

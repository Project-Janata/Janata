-- Migration 0022 — official-event badge (#192)
--
-- Adds `is_official` to events. Auto-set to 1 by /createEvent when the
-- creator's verification_level >= SEVAK (54). Frontend renders a verified-
-- check badge when set.
--
-- Renumbered from spec's 0020 because the slot is no longer the next free
-- one in v2 (0021 already shipped with profile fields). Call out at the
-- v2 → main cutover.
--
-- Tier 2 (events is canon Tier 1 per the migrations README, BUT this is
-- additive ALTER only — safe regardless of tier).

ALTER TABLE events ADD COLUMN is_official INTEGER NOT NULL DEFAULT 0;

-- No backfill. Per #192's "Backfill on creator level change" decision:
-- existing events keep their badge state at create-time. Simpler for v2.
-- An admin can manually toggle via a future moderation tool if needed.

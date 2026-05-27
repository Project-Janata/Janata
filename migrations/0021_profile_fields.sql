-- Migration 0021 — minimal profile fields (#210)
--
-- Adds: school, work, region, looking_for to the users table.
-- Tier 2 (users is disposable per migrations/README.md), but the table has
-- real user data on prod so we use additive ALTERs anyway.
--
-- Renumbered from 0020 because #192 (official-event badge) reserved 0020.
-- Call out at v2 → main cutover: this PR will be 0021 and #192 will be 0020.
--
-- All four columns are nullable text — empty profile fields are the norm
-- and the API layer will only emit them when present (per #210 acceptance:
-- "empty optional fields don't render").

ALTER TABLE users ADD COLUMN school TEXT;
ALTER TABLE users ADD COLUMN work TEXT;
ALTER TABLE users ADD COLUMN region TEXT;
-- JSON array string, like interests
ALTER TABLE users ADD COLUMN looking_for TEXT;

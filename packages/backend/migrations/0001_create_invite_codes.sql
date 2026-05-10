-- Migration: create invite_codes table
-- Used for beta access gating during onboarding

CREATE TABLE IF NOT EXISTS invite_codes (
  code               TEXT PRIMARY KEY,
  label              TEXT NOT NULL,
  verification_level INTEGER NOT NULL DEFAULT 45,
  is_active          INTEGER NOT NULL DEFAULT 1,
  created_at         TEXT NOT NULL
);

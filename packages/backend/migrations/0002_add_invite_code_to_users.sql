-- Migration: add invite_code column to users table

ALTER TABLE users ADD COLUMN invite_code TEXT REFERENCES invite_codes(code);

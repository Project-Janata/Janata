-- seed_preview_data.sql — demo EVENTS for the v2 PREVIEW database only.
--
-- Runs LAST in deploy-v2preview.sh, AFTER the real center list
-- (packages/backend/src/seed/centers.sql) has been loaded. It no longer
-- touches the centers table, so the preview shows the full real center
-- list (all 93, including Chinmaya Vrindavan and the India centers).
--
-- It clears events and inserts a small known set that exercises v2 features,
-- each anchored to a REAL center id so everything lines up:
--   - #192 official-event badge (is_official)
--   - #191 per-event verified gate (requires_verified)
--   - #199 home v3 featured + this-week list
--
-- NEVER run against prod. This file is preview-only.

DELETE FROM events;

-- Real center anchors used below:
--   c0000001-...-0002  Chinmaya Maruti        (Andover, MA)
--   c0000001-...-0008  Chinmaya Sandeepany    (San Jose, CA)
--   c0000001-...-0081  Chinmaya Vrindavan     (Cranbury, NJ)
INSERT OR REPLACE INTO events (id, title, description, date, latitude, longitude, address, center_id, tier, people_attending, point_of_contact, image, category, is_official, requires_verified, created_at, updated_at) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Bhagavad Gita Study', 'Weekly chapter-by-chapter discussion. All levels welcome.', '2026-08-15', 42.6765858, -71.1508859, '1 Union St, Andover, MA - 01810, US', 'c0000001-0000-0000-0000-000000000002', 0, 14, 'Ramesh Ji', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000&q=80', 91, 1, 0, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000002', 'Bala Vihar Children''s Class', 'Sundays for kids ages 5-12. Stories, songs, satsang.', '2026-08-17', 40.3089353, -74.5605169, '95 Cranbury Neck Rd, Cranbury, NJ - 08512, US', 'c0000001-0000-0000-0000-000000000081', 0, 32, 'Anita Akka', 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1000&q=80', 1, 1, 0, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000003', 'Members Only - Leadership Retreat', 'Annual leadership planning retreat. Requires verified center membership.', '2026-09-10', 37.3593226, -121.8095066, '10160 Clayton Rd, San Jose, CA - 95127, US', 'c0000001-0000-0000-0000-000000000008', 0, 8, 'Suresh Ji', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1000&q=80', 50, 1, 1, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000004', '33rd Mahasamadhi Aradhana Camp', 'Mahasamadhi camp at MSC. Talks, satsangs, seva.', '2026-08-01', 40.8567, -74.4296, '1 Krishnalaya Way, Parsippany, NJ', 'c0000001-0000-0000-0000-000000000081', 1, 487, 'MSC Coordination Team', 'https://res.cloudinary.com/chinmayaorlando/image/upload/q_auto/cmo/2026/summercamp.jpg', 91, 1, 0, datetime('now'), datetime('now'));

-- Test user is created via the signup flow on the preview URL (real PBKDF2 hash),
-- or via curl against the preview API - see docs/v2-preview-runbook.md step 6.

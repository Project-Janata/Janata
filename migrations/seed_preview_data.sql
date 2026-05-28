-- seed_preview_data.sql — dummy data for the v2 PREVIEW database only.
--
-- Runs LAST in setup-preview-db.sh, after all migrations, so it's the
-- authoritative final state. Clears centers + events and inserts a known
-- set that exercises the v2 features:
--   - #192 official-event badge (is_official)
--   - #191 per-event verified gate (requires_verified)
--   - #199 home v3 featured + this-week list
--   - #107 pagination (10 centers)
--
-- NEVER run against prod. This file is preview-only.

DELETE FROM events;
DELETE FROM centers;

INSERT OR REPLACE INTO centers (id, name, latitude, longitude, address, member_count, is_verified, created_at, updated_at) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'Chinmaya Mission Boston', 42.3601, -71.0589, '90 Lincoln St, Boston, MA 02111', 245, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000002', 'Chinmaya Mission New Jersey', 40.7357, -74.1724, '125 C Charlotte Ave, South River, NJ 08882', 312, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000003', 'Chinmaya Mission San Francisco', 37.7749, -122.4194, '675 Templeton Dr, Grover Beach, CA 93433', 189, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000004', 'Chinmaya Mission Los Angeles', 34.0522, -118.2437, '722 Jefferson Ave, Glendale, CA 91203', 428, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000005', 'Chinmaya Mission Chicago', 41.8781, -87.6298, '1921 E Oakton St, Arlington Heights, IL 60004', 156, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000006', 'Chinmaya Mission Houston', 29.7604, -95.3698, '10370 Bissonnet St, Houston, TX 77099', 267, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000007', 'Chinmaya Mission Dallas', 32.7767, -96.7970, '1000 E Plano Pkwy, Plano, TX 75074', 198, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000008', 'Chinmaya Mission Seattle', 47.6062, -122.3321, '11422 Eldorado Pkwy, Frisco, TX 75035', 134, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000009', 'Chinmaya Mission Washington DC', 38.9072, -77.0369, '12100 Eldorado Pkwy, Frisco, TX 75035', 223, 1, datetime('now'), datetime('now')),
  ('c1000001-0000-0000-0000-000000000010', 'Chinmaya Mission Tampa', 27.9506, -82.4572, '5490 Crane Ridge Dr, Jacksonville, FL 32216', 145, 1, datetime('now'), datetime('now'));

INSERT OR REPLACE INTO events (id, title, description, date, latitude, longitude, address, center_id, tier, people_attending, point_of_contact, image, category, is_official, requires_verified, created_at, updated_at) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Bhagavad Gita Study', 'Weekly chapter-by-chapter discussion. All levels welcome.', '2026-08-15', 42.3601, -71.0589, '90 Lincoln St, Boston, MA', 'c1000001-0000-0000-0000-000000000001', 0, 14, 'Ramesh Ji', NULL, 91, 1, 0, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000002', 'Bala Vihar Children''s Class', 'Sundays for kids ages 5-12. Stories, songs, satsang.', '2026-08-17', 40.7357, -74.1724, '125 C Charlotte Ave, South River, NJ', 'c1000001-0000-0000-0000-000000000002', 0, 32, 'Anita Akka', NULL, 1, 1, 0, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000003', 'Members Only — Leadership Retreat', 'Annual leadership planning retreat. Requires verified center membership.', '2026-09-10', 37.7749, -122.4194, '675 Templeton Dr, Grover Beach, CA', 'c1000001-0000-0000-0000-000000000003', 0, 8, 'Suresh Ji', NULL, 50, 1, 1, datetime('now'), datetime('now')),
  ('e0000001-0000-0000-0000-000000000004', '33rd Mahasamadhi Aradhana Camp', 'Mahasamadhi camp at MSC. Talks, satsangs, seva.', '2026-08-01', 40.8567, -74.4296, '1 Krishnalaya Way, Parsippany, NJ', 'c1000001-0000-0000-0000-000000000002', 1, 487, 'MSC Coordination Team', NULL, 91, 1, 0, datetime('now'), datetime('now'));

-- Test user is created via the signup flow on the preview URL (real PBKDF2 hash),
-- or via curl against the preview API — see docs/v2-preview-runbook.md step 6.

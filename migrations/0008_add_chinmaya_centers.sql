-- 0008_add_chinmaya_centers.sql
-- Add 4 Chinmaya centers missing from production, identified while ingesting
-- Chinmaya Mission events (Mar–Jul 2026) for app import:
--
--   098  Chinmaya Mission New York (Chinmaya Upavan)  — Woodbury, NY
--                                                       (inaugurated 2026-07-26)
--   099  Central Chinmaya Mission Trust              — Powai, Mumbai, India
--                                                       (umbrella anchor for the
--                                                        2026 Chinmaya Amrit Yatra
--                                                        national pilgrimage)
--   100  Sandeepany Himalayas (Sidhbari)             — Kangra, HP, India
--                                                       (Chinmaya Jayanti Camp,
--                                                        Vedanta Course conclusion)
--   101  Chinmaya Mangalam                            — Barry, TX
--                                                       (CMDFW 143-acre camp;
--                                                        High School Retreat,
--                                                        GCC State Finals)
--
-- New IDs continue the c0000001-0000-0000-0000-… sequence used in production
-- (max existing = 097). All entries are is_verified = 1, matching the prod
-- convention (all 91 existing centers are verified).

INSERT INTO centers (
  id, name, latitude, longitude, address, member_count, is_verified,
  website, phone, image, acharya, point_of_contact,
  created_at, updated_at
) VALUES
(
  'c0000001-0000-0000-0000-000000000098',
  'Chinmaya Mission New York',
  40.8203, -73.4684,
  '129 Woodbury Rd, Woodbury, NY - 11797, US',
  0, 1,
  'https://chinmayanewyork.org/',
  NULL,
  'https://chinmayanewyork.org/wp-content/uploads/2026/04/Final-CMNY-Upavan-Hanuman-Havan.png',
  NULL,
  'info@chinmayanewyork.org',
  datetime('now'), datetime('now')
),
(
  'c0000001-0000-0000-0000-000000000099',
  'Central Chinmaya Mission Trust',
  19.1197, 72.9053,
  'Saki Vihar Rd, Powai, Mumbai - 400072, IN',
  0, 1,
  'https://www.chinmayamission.com/',
  '+91-22-2803-4900',
  'https://images.chinmayamission.com/uploads/YATRA_BANNER_9320f94db2.jpeg',
  NULL,
  'ccmt@chinmayamission.com',
  datetime('now'), datetime('now')
),
(
  'c0000001-0000-0000-0000-000000000100',
  'Sandeepany Himalayas (Sidhbari)',
  32.1879, 76.3175,
  'Tapovan Rd, Sidhbari, Dharamshala, Distt. Kangra, HP - 176057, IN',
  0, 1,
  'https://www.chinmayamission.com/sidhbari',
  '+91-1892-236199',
  'https://images.chinmayamission.com/uploads/2_d81b0572fb.webp',
  NULL,
  'sidhbari@chinmayamission.com',
  datetime('now'), datetime('now')
),
(
  'c0000001-0000-0000-0000-000000000101',
  'Chinmaya Mangalam',
  31.9938, -96.6394,
  '10470 W FM 744, Barry, TX - 75102, US',
  0, 1,
  'https://chinmayamissionwest.com/chinmaya-mangalam/',
  '(972) 250-2470',
  NULL,
  NULL,
  NULL,
  datetime('now'), datetime('now')
);

-- Centers 008/009/015/016/047/057/065/067/088 are referenced by the events in
-- 0010_seed_chinmaya_events_2026.sql but were never created by any migration
-- (they predate the c1000001-prefixed seed_centers.sql rewrite, which left these
-- c0000001 references orphaned). A fresh `npm run d1:migrate:all` therefore
-- FK-failed on 0010. Recreate them here (before 0010) so the chain applies
-- cleanly. INSERT OR IGNORE keeps this idempotent — environments where these
-- rows already exist (e.g. the stateful preview/prod D1) are left untouched.
-- Geo/address are a representative event location per center; richer metadata
-- can be backfilled later. See issue #331.
INSERT OR IGNORE INTO centers (
  id, name, latitude, longitude, address, member_count, is_verified,
  created_at, updated_at
) VALUES
  ('c0000001-0000-0000-0000-000000000008', 'Chinmaya Sandeepany San Jose', 37.3593226, -121.8095066, '10160 Clayton Rd, San Jose, CA - 95127, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000009', 'Chinmaya Prabha (Houston)', 29.6659766, -95.615816, '10353 Synott Rd, Sugar Land, TX - 77498, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000015', 'Chinmaya Mission Chicago', 41.7143174, -87.9470168, '11S080 Kingery Hwy, Willowbrook, IL - 60527, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000016', 'Chinmaya Mission Orlando', 28.6680904, -81.2926141, 'Casselberry, FL, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000047', 'Chinmaya Mission Portland', 45.5446737, -122.8807329, '3551 NW John Olsen Pl, Hillsboro, OR - 97124, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000057', 'Chinmaya Somnath (Washington DC)', 38.903992, -77.478483, '4350 Blue Spring Dr, Chantilly, VA - 20151, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000065', 'Chinmaya Mission Atlanta', 33.9004478, -84.1743202, '5511 Williams Rd, Norcross, GA - 30093, US', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000067', 'Chinmaya Mission Niagara', 43.0986956, -79.0896157, 'Niagara Region, ON, CA', 0, 1, datetime('now'), datetime('now')),
  ('c0000001-0000-0000-0000-000000000088', 'Chinmaya-Saaket (Dallas-Fort Worth)', 32.9903214, -96.7942022, '17701 Davenport Rd, Dallas, TX - 75252, US', 0, 1, datetime('now'), datetime('now'));

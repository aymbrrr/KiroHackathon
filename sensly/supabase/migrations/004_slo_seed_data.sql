-- ============================================================
-- Sensly — San Luis Obispo Seed Data
-- Run this in Supabase SQL Editor.
-- Replaces SF seed data with SLO venues for demo.
-- ============================================================

-- Clear SF seed data first
delete from venues where is_home = false or is_home is null;

-- SLO venues with realistic sensory ratings
-- Cal Poly campus + downtown SLO + In-N-Out
insert into venues (name, category, lat, lng, address, avg_noise_db, avg_lighting, avg_crowding, avg_smell, avg_predictability, overall_score, total_ratings, sensory_features, quiet_hours) values

  -- Campus
  ('Kennedy Library',                'library',    35.3022, -120.6625, '1 Grand Ave, Cal Poly',           35.0, 2.0, 1.5, 1.0, 5.0, 1.4, 32, '["very quiet","dim lighting","predictable layout","visible exits","quiet zones","outdoor courtyard"]', '[]'),
  ('Cal Poly Recreation Center',     'gym',        35.2998, -120.6590, 'Cal Poly Campus',                 72.0, 4.0, 3.5, 2.5, 3.0, 3.5, 18, '["loud music","bright lighting","crowded peak hours"]', '[{"day":"mon","start":"06:00","end":"08:00","label":"Quieter early morning"}]'),
  ('Campus Market',                  'store',      35.3005, -120.6610, 'Cal Poly Campus',                 62.0, 4.5, 3.0, 2.5, 3.5, 3.1, 14, '["fluorescent lighting","moderate crowds at lunch"]', '[]'),
  ('Dexter Lawn',                    'park',       35.3010, -120.6595, 'Cal Poly Campus',                 45.0, 1.0, 2.0, 1.0, 4.0, 1.6, 25, '["outdoor","open space","natural light","quiet","visible exits"]', '[]'),
  ('University Union',               'building',   35.3008, -120.6605, 'Cal Poly Campus',                 68.0, 4.0, 4.0, 3.0, 2.5, 3.6, 20, '["loud at lunch","food court smells","unpredictable crowds"]', '[{"day":"mon","start":"07:00","end":"09:00","label":"Quiet before classes"}]'),

  -- Downtown SLO
  ('Kreuzberg Coffee',               'cafe',       35.2795, -120.6640, '685 Higuera St',                  52.0, 2.5, 2.0, 2.0, 4.0, 2.2, 28, '["dim lighting","quiet corners","outdoor patio","predictable layout"]', '[]'),
  ('Scout Coffee',                   'cafe',       35.2810, -120.6620, '1130 Garden St',                  58.0, 3.0, 2.5, 2.0, 3.5, 2.6, 22, '["natural light","moderate noise","outdoor seating"]', '[]'),
  ('Linnaea''s Café',                'cafe',       35.2788, -120.6615, '1110 Garden St',                  48.0, 2.0, 2.0, 2.0, 4.5, 1.9, 35, '["very quiet","garden seating","dim lighting","predictable","no background music"]', '[]'),
  ('Firestone Grill',                'restaurant', 35.2802, -120.6635, '1001 Higuera St',                 74.0, 3.5, 4.5, 4.0, 2.5, 3.9, 19, '["loud","crowded","strong food smells","long lines"]', '[{"day":"tue","start":"14:00","end":"16:00","label":"Quieter mid-afternoon"}]'),
  ('Novo Restaurant',                'restaurant', 35.2790, -120.6645, '726 Higuera St',                  65.0, 2.5, 3.0, 3.0, 3.5, 2.9, 24, '["creekside patio","moderate noise","natural light","outdoor option"]', '[]'),
  ('SLO Public Library',             'library',    35.2825, -120.6590, '995 Palm St',                     32.0, 2.5, 1.5, 1.0, 5.0, 1.3, 40, '["very quiet","predictable layout","visible exits","quiet zones","dim lighting available"]', '[]'),
  ('Mission Plaza',                  'park',       35.2785, -120.6650, 'Mission Plaza, Broad St',         50.0, 1.0, 2.5, 1.5, 3.0, 1.9, 30, '["outdoor","open space","natural light","sometimes events — unpredictable"]', '[]'),
  ('Higuera Street (downtown)',      'street',     35.2800, -120.6638, 'Higuera St',                      64.0, 3.0, 3.5, 2.5, 2.0, 3.2, 15, '["busy sidewalks","variable noise","street performers sometimes"]', '[]'),

  -- In-N-Out (the demo spot!)
  ('In-N-Out Burger',                'restaurant', 35.2635, -120.6540, '397 Santa Rosa St',               70.0, 4.5, 4.0, 4.0, 3.0, 3.8, 26, '["bright fluorescent lighting","crowded","strong food smells","predictable menu/layout","drive-thru noise"]', '[{"day":"mon","start":"14:00","end":"16:00","label":"Quieter mid-afternoon"}]'),

  -- Quiet spots for recovery mode
  ('Bishop Peak Trailhead',          'park',       35.2920, -120.6870, 'Bishop Peak Trail',               38.0, 1.0, 1.5, 1.0, 4.0, 1.3, 20, '["very quiet","outdoor","nature","open space","no crowds weekday mornings"]', '[]');

-- Also insert some individual rating rows so time heatmaps have data
-- In-N-Out ratings at different times
insert into ratings (venue_id, noise_db, lighting, crowding, smell, predictability, time_of_day, day_of_week, notes) values
  ((select id from venues where name = 'In-N-Out Burger'), 72.0, 5, 4, 4, 3, 'afternoon', 5, 'Friday lunch rush — packed'),
  ((select id from venues where name = 'In-N-Out Burger'), 68.0, 5, 3, 4, 3, 'afternoon', 1, 'Monday afternoon — manageable'),
  ((select id from venues where name = 'In-N-Out Burger'), 75.0, 5, 5, 4, 3, 'evening',   6, 'Saturday dinner — very loud'),
  ((select id from venues where name = 'In-N-Out Burger'), 60.0, 5, 2, 3, 3, 'morning',   2, 'Tuesday 10:30am — quiet, just opened'),
  ((select id from venues where name = 'In-N-Out Burger'), 71.0, 5, 4, 4, 3, 'afternoon', 3, null);

-- Kennedy Library ratings
insert into ratings (venue_id, noise_db, lighting, crowding, smell, predictability, time_of_day, day_of_week, notes) values
  ((select id from venues where name = 'Kennedy Library'), 33.0, 2, 1, 1, 5, 'morning',   1, 'Monday morning — dead quiet'),
  ((select id from venues where name = 'Kennedy Library'), 38.0, 2, 2, 1, 5, 'afternoon', 3, 'Wednesday afternoon — a bit busier'),
  ((select id from venues where name = 'Kennedy Library'), 42.0, 2, 3, 1, 5, 'evening',   0, 'Sunday evening — finals week busy'),
  ((select id from venues where name = 'Kennedy Library'), 30.0, 2, 1, 1, 5, 'morning',   5, 'Friday morning — empty');

-- Kreuzberg ratings
insert into ratings (venue_id, noise_db, lighting, crowding, smell, predictability, time_of_day, day_of_week, notes) values
  ((select id from venues where name = 'Kreuzberg Coffee'), 50.0, 2, 2, 2, 4, 'morning',   1, 'Quiet morning, great for studying'),
  ((select id from venues where name = 'Kreuzberg Coffee'), 55.0, 3, 3, 2, 4, 'afternoon', 6, 'Saturday afternoon — busier'),
  ((select id from venues where name = 'Kreuzberg Coffee'), 48.0, 2, 1, 2, 4, 'evening',   3, 'Wednesday evening — mellow');

-- Firestone ratings
insert into ratings (venue_id, noise_db, lighting, crowding, smell, predictability, time_of_day, day_of_week, notes) values
  ((select id from venues where name = 'Firestone Grill'), 76.0, 4, 5, 4, 2, 'evening',   5, 'Friday night — absolute chaos'),
  ((select id from venues where name = 'Firestone Grill'), 70.0, 3, 3, 4, 3, 'afternoon', 2, 'Tuesday lunch — not bad'),
  ((select id from venues where name = 'Firestone Grill'), 78.0, 4, 5, 5, 2, 'evening',   6, 'Saturday — avoid');

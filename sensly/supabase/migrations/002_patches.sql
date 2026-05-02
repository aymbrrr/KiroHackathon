-- ============================================================
-- Sensly — Migration 002: Patches to initial schema
-- Run this after 001_initial_schema.sql
-- ============================================================

-- Required by earthdistance extension
create extension if not exists "cube";

-- is_home flag on venues (needed for home environment logging)
alter table venues add column if not exists is_home boolean default false;

-- Update the venue aggregate trigger to also compute weighted overall_score
-- Noise converted from dB to 1-5 scale: (avg_noise_db - 30) / 14.0 clamped to 1-5
-- Weights: noise 35%, lighting 25%, crowding 20%, predictability 15%, smell 5%
create or replace function recalculate_venue_aggregates()
returns trigger as $$
begin
  update venues set
    avg_noise_db       = (select avg(noise_db)       from ratings where venue_id = NEW.venue_id and noise_db       is not null),
    avg_lighting       = (select avg(lighting)       from ratings where venue_id = NEW.venue_id and lighting       is not null),
    avg_crowding       = (select avg(crowding)       from ratings where venue_id = NEW.venue_id and crowding       is not null),
    avg_smell          = (select avg(smell)          from ratings where venue_id = NEW.venue_id and smell          is not null),
    avg_predictability = (select avg(predictability) from ratings where venue_id = NEW.venue_id and predictability is not null),
    overall_score      = (
      select
        least(5, greatest(1,
          coalesce((avg(noise_db) - 30) / 14.0, 3) * 0.35 +
          coalesce(avg(lighting), 3)                * 0.25 +
          coalesce(avg(crowding), 3)                * 0.20 +
          coalesce(avg(predictability), 3)          * 0.15 +
          coalesce(avg(smell), 3)                   * 0.05
        ))
      from ratings where venue_id = NEW.venue_id
    ),
    total_ratings      = (select count(*) from ratings where venue_id = NEW.venue_id),
    updated_at         = now()
  where id = NEW.venue_id;
  return NEW;
end;
$$ language plpgsql;

-- ============================================================
-- SEED DATA — 15 sample venues for demo
-- Uses San Francisco coords — update lat/lng to your demo city.
-- ============================================================

insert into venues (name, category, lat, lng, address, avg_noise_db, avg_lighting, avg_crowding, avg_smell, avg_predictability, overall_score, total_ratings, sensory_features, quiet_hours) values
  ('Quiet Corner Café',       'cafe',       37.7749, -122.4194, '123 Main St',        48.0, 2.0, 1.5, 1.5, 4.5, 1.8, 12, '["dim lighting","outdoor seating","no background music","quiet zone in back"]', '[{"day":"mon","start":"07:00","end":"09:00","label":"Morning quiet hours"}]'),
  ('Blue Bottle Coffee',      'cafe',       37.7751, -122.4180, '456 Market St',      62.0, 3.0, 3.0, 2.5, 3.5, 2.9, 28, '["natural light","outdoor seating"]', '[]'),
  ('The Loud Diner',          'restaurant', 37.7745, -122.4200, '789 Mission St',     74.0, 4.0, 4.0, 3.5, 2.0, 3.9, 8,  '[]', '[]'),
  ('City Library — Main',     'library',    37.7780, -122.4150, '100 Larkin St',      38.0, 2.5, 1.5, 1.0, 5.0, 1.5, 45, '["very quiet","dim lighting","predictable layout","visible exits","quiet zones"]', '[]'),
  ('Whole Foods Market',      'store',      37.7760, -122.4170, '1765 California St', 68.0, 5.0, 3.5, 3.0, 3.0, 3.5, 19, '["sensory-friendly hours tue 7-8am"]', '[{"day":"tue","start":"07:00","end":"08:00","label":"Sensory-friendly hour"}]'),
  ('Dolores Park',            'park',       37.7596, -122.4269, 'Dolores Park',       55.0, 1.0, 2.5, 1.5, 2.5, 2.1, 33, '["outdoor","natural light","open space","visible exits"]', '[]'),
  ('Tartine Bakery',          'cafe',       37.7614, -122.4241, '600 Guerrero St',    70.0, 3.5, 4.5, 4.0, 2.5, 3.8, 22, '["strong food smells","often crowded"]', '[]'),
  ('Nopa Restaurant',         'restaurant', 37.7762, -122.4374, '560 Divisadero St',  72.0, 3.0, 4.0, 3.0, 3.0, 3.5, 15, '["loud evenings","quieter at lunch"]', '[{"day":"mon","start":"11:00","end":"14:00","label":"Quieter lunch service"}]'),
  ('Ritual Coffee Roasters',  'cafe',       37.7630, -122.4210, '1026 Valencia St',   58.0, 3.0, 2.5, 2.0, 4.0, 2.6, 17, '["moderate noise","natural light"]', '[]'),
  ('AMC Metreon 16',          'theater',    37.7841, -122.4033, '135 4th St',         80.0, 4.5, 4.0, 2.0, 3.5, 4.1, 9,  '["sensory-friendly screenings sat 10am"]', '[{"day":"sat","start":"10:00","end":"12:00","label":"Sensory-friendly screening"}]'),
  ('Philz Coffee',            'cafe',       37.7855, -122.4089, '201 Berry St',       55.0, 2.5, 2.0, 2.5, 4.0, 2.3, 31, '["dim lighting option","moderate noise","predictable layout"]', '[]'),
  ('Trader Joe''s',           'store',      37.7877, -122.4072, '555 9th St',         65.0, 4.0, 3.5, 2.5, 3.5, 3.3, 14, '["bright lighting","moderate crowds"]', '[]'),
  ('Golden Gate Park — East', 'park',       37.7694, -122.4862, 'Golden Gate Park',   42.0, 1.0, 1.5, 1.0, 3.5, 1.4, 27, '["very quiet","outdoor","open space","natural light"]', '[]'),
  ('Sightglass Coffee',       'cafe',       37.7773, -122.4063, '270 7th St',         60.0, 3.5, 2.5, 2.0, 3.5, 2.7, 20, '["industrial space","high ceilings — echoes","natural light"]', '[]'),
  ('SF MOMA',                 'museum',     37.7857, -122.4011, '151 3rd St',         45.0, 3.0, 2.0, 1.0, 4.5, 2.0, 38, '["quiet zones","predictable layout","visible exits","sensory-friendly hours"]', '[{"day":"thu","start":"09:00","end":"10:00","label":"Sensory-friendly morning"}]');

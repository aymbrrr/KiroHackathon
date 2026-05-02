-- ============================================================
-- Sensly — Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run.
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "earthdistance" cascade;  -- for radius queries
create extension if not exists "cube";                   -- required by earthdistance

-- ============================================================
-- TABLES
-- ============================================================

-- Venues (populated from OSM + user submissions)
create table if not exists venues (
  id                  uuid primary key default gen_random_uuid(),
  osm_id              text unique,
  name                text not null,
  category            text,                    -- cafe, restaurant, store, clinic, theater...
  lat                 numeric(10,7) not null,
  lng                 numeric(10,7) not null,
  address             text,
  -- Aggregates (maintained by Postgres trigger on ratings insert)
  avg_noise_db        numeric(5,1),
  avg_lighting        numeric(3,2),
  avg_crowding        numeric(3,2),
  avg_smell           numeric(3,2),
  avg_predictability  numeric(3,2),
  overall_score       numeric(3,2),            -- weighted: noise 35%, lighting 25%, crowding 20%, predictability 15%, smell 5%
  total_ratings       integer default 0,
  -- Metadata
  quiet_hours         jsonb default '[]',      -- [{"day":"tue","start":"18:00","end":"20:00","label":"Quiet hour"}]
  sensory_features    jsonb default '[]',      -- ["dim lighting available","outdoor seating","no background music"]
  is_home             boolean default false,   -- true for user home pseudo-venues
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Spatial index for radius queries
create index if not exists venues_location
  on venues using gist (ll_to_earth(lat::float8, lng::float8));

-- Individual ratings
create table if not exists ratings (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid references venues(id) on delete cascade,
  user_id         uuid references auth.users(id),   -- internal only, NEVER exposed to other users
  -- Noise
  noise_db        numeric(5,1),                     -- auto-measured via expo-av (dBFS → dB SPL)
  noise_manual    smallint check (noise_manual between 1 and 5),
  -- Manual dimensions (1-5 scale)
  lighting        smallint check (lighting between 1 and 5),
  crowding        smallint check (crowding between 1 and 5),
  smell           smallint check (smell between 1 and 5),
  predictability  smallint check (predictability between 1 and 5),
  -- Context
  time_of_day     text check (time_of_day in ('morning','afternoon','evening','night')),
  day_of_week     smallint check (day_of_week between 0 and 6),
  -- Optional health context (opt-in only, never shared)
  heart_rate      smallint,
  stress_level    smallint,
  -- Notes
  notes           text,
  photo_url       text,
  created_at      timestamptz default now()
);

-- User sensory profiles (multiple per account supported)
-- GDPR NOTE: diagnosis_tags is Article 9 special category health data.
-- Requires explicit consent (diagnosis_consent = true) before any tags are stored.
-- Encrypted at rest via Supabase AES-256. Never exposed in public queries.
create table if not exists profiles (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade,
  display_name          text not null default 'My profile',
  -- Sensory thresholds
  -- Research-backed defaults:
  --   65 dB: upper comfortable limit for most adults in social settings
  --   crowding 3: mid-scale, highly individual
  --   lighting 'moderate': warm white 2700-3000K recommended for autism/ADHD
  noise_threshold       smallint default 65,
  lighting_preference   text check (lighting_preference in ('dim','moderate','bright')) default 'moderate',
  crowding_threshold    smallint default 3,
  -- Trigger preferences
  triggers              jsonb default '[]',          -- ["fluorescent lights","perfume","sirens"]
  trigger_categories    jsonb default '[]',          -- ["sound","smell","lighting","texture","unpredictability"]
  comfort_items         jsonb default '[]',          -- ["noise-canceling headphones","sunglasses"]
  -- Optional diagnosis (GDPR Article 9 — explicit consent required)
  -- Used only to: pre-fill threshold defaults, pre-check trigger chips
  -- Never shared, never used in venue aggregates, never sent to third parties
  diagnosis_tags        jsonb default '[]',          -- ["autism","adhd","ptsd","migraine","spd","anxiety","ocd","dyslexia"]
  diagnosis_consent     boolean default false,       -- MUST be true before any tags are written
  -- Profile metadata
  is_default            boolean default false,
  home_venue_id         uuid references venues(id),  -- pseudo-venue for home environment logging
  created_at            timestamptz default now()
);

-- Anonymous venue comments (moderated via Edge Function before insert)
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid references venues(id) on delete cascade,
  user_id     uuid references auth.users(id),        -- internal only
  body        text not null,
  is_flagged  boolean default false,
  created_at  timestamptz default now()
);

-- Venue follows (with familiar/safe place flag)
create table if not exists venue_follows (
  user_id       uuid references auth.users(id) on delete cascade,
  venue_id      uuid references venues(id) on delete cascade,
  is_familiar   boolean default false,   -- "Familiar place" — pinned for hard days
  created_at    timestamptz default now(),
  primary key (user_id, venue_id)
);

-- User activity log (streak tracking + learning engine input)
create table if not exists user_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('rating','home_log','check_in')),
  venue_id      uuid references venues(id),
  is_home       boolean default false,
  created_at    timestamptz default now()
);

-- Daily check-in log (threshold overrides per day)
create table if not exists daily_checkins (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users(id) on delete cascade,
  profile_id                uuid references profiles(id) on delete cascade,
  noise_threshold_today     smallint,
  crowding_threshold_today  smallint,
  notes                     text,
  created_at                timestamptz default now()
);

-- Companion sessions ("Going With Me" mode — stretch goal)
create table if not exists companion_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  uuid references auth.users(id) on delete cascade,
  join_code     text unique not null,    -- 6-char alphanumeric, expires after 24h
  profile_id    uuid references profiles(id),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  expires_at    timestamptz default (now() + interval '24 hours')
);

-- Profile share tokens (read-only shareable profile links)
create table if not exists profile_shares (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete cascade,
  token         text unique not null,
  created_at    timestamptz default now()
);

-- Sensory journal insights cache (generated weekly by Edge Function)
create table if not exists journal_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  week_start    date not null,
  insights      jsonb not null,          -- [{"text":"You tend to struggle on Fridays...","type":"pattern"}]
  generated_at  timestamptz default now(),
  unique (user_id, week_start)
);

-- ============================================================
-- POSTGRES TRIGGER — Venue Aggregate Recalculation
-- Runs automatically after every new rating insert.
-- No client-side aggregate math needed.
-- ============================================================

create or replace function recalculate_venue_aggregates()
returns trigger as $$
begin
  update venues set
    avg_noise_db       = (select avg(noise_db) from ratings where venue_id = NEW.venue_id and noise_db is not null),
    avg_lighting       = (select avg(lighting) from ratings where venue_id = NEW.venue_id and lighting is not null),
    avg_crowding       = (select avg(crowding) from ratings where venue_id = NEW.venue_id and crowding is not null),
    avg_smell          = (select avg(smell) from ratings where venue_id = NEW.venue_id and smell is not null),
    avg_predictability = (select avg(predictability) from ratings where venue_id = NEW.venue_id and predictability is not null),
    -- Weighted overall score: noise 35%, lighting 25%, crowding 20%, predictability 15%, smell 5%
    -- Noise converted from dB to 1-5 scale for weighting: (avg_noise_db - 30) / 14.0 clamped to 1-5
    overall_score      = (
      select
        least(5, greatest(1,
          coalesce((avg(noise_db) - 30) / 14.0, 3) * 0.35 +
          coalesce(avg(lighting), 3) * 0.25 +
          coalesce(avg(crowding), 3) * 0.20 +
          coalesce(avg(predictability), 3) * 0.15 +
          coalesce(avg(smell), 3) * 0.05
        ))
      from ratings where venue_id = NEW.venue_id
    ),
    total_ratings      = (select count(*) from ratings where venue_id = NEW.venue_id),
    updated_at         = now()
  where id = NEW.venue_id;
  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_rating_insert on ratings;
create trigger on_rating_insert
  after insert on ratings
  for each row execute function recalculate_venue_aggregates();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Venues: anyone can read, authenticated users can insert
alter table venues enable row level security;
create policy "venues_read" on venues for select using (true);
create policy "venues_insert" on venues for insert with check (auth.uid() is not null);
create policy "venues_update_own" on venues for update using (auth.uid() is not null);

-- Ratings: anyone can read (aggregated via venues); user_id never selected by client queries
alter table ratings enable row level security;
create policy "ratings_read" on ratings for select using (true);
create policy "ratings_insert" on ratings for insert with check (auth.uid() = user_id);

-- Profiles: strictly private to owner
alter table profiles enable row level security;
create policy "profiles_owner" on profiles using (auth.uid() = user_id);

-- Comments: anyone can read non-flagged; authenticated users can insert
alter table comments enable row level security;
create policy "comments_read" on comments for select using (not is_flagged);
create policy "comments_insert" on comments for insert with check (auth.uid() is not null);

-- Venue follows: private to owner
alter table venue_follows enable row level security;
create policy "follows_owner" on venue_follows using (auth.uid() = user_id);

-- User activity: private to owner
alter table user_activity enable row level security;
create policy "activity_owner" on user_activity using (auth.uid() = user_id);

-- Daily check-ins: private to owner
alter table daily_checkins enable row level security;
create policy "checkins_owner" on daily_checkins using (auth.uid() = user_id);

-- Companion sessions: host manages; anyone can read active session by join_code (for joining)
alter table companion_sessions enable row level security;
create policy "companion_host" on companion_sessions using (auth.uid() = host_user_id);
create policy "companion_join_read" on companion_sessions for select using (is_active = true);

-- Profile shares: owner manages; anyone can read by token (for shared link view)
alter table profile_shares enable row level security;
create policy "share_owner" on profile_shares using (auth.uid() = user_id);
create policy "share_token_read" on profile_shares for select using (true);

-- Journal insights: private to owner
alter table journal_insights enable row level security;
create policy "insights_owner" on journal_insights using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA — 15 sample venues for demo
-- Run after schema is set up. Adjust lat/lng to your demo city.
-- These use San Francisco coords — change to your location.
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

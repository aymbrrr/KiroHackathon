-- ============================================================
-- Sensly — Initial Schema Migration
-- Run this in Supabase SQL Editor before starting development.
-- Both Person A and Person B work against this schema.
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "earthdistance" cascade;  -- for radius queries

-- ─── Venues ──────────────────────────────────────────────────────────────────

create table venues (
  id                  uuid primary key default gen_random_uuid(),
  osm_id              text unique,
  name                text not null,
  category            text,
  lat                 numeric(10,7) not null,
  lng                 numeric(10,7) not null,
  address             text,
  -- Aggregates (maintained by trigger on ratings insert)
  avg_noise_db        numeric(5,1),
  avg_lighting        numeric(3,2),
  avg_crowding        numeric(3,2),
  avg_smell           numeric(3,2),
  avg_predictability  numeric(3,2),
  overall_score       numeric(3,2),
  total_ratings       integer default 0,
  -- Metadata
  quiet_hours         jsonb,
  sensory_features    jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index venues_location on venues using gist (ll_to_earth(lat, lng));
create index venues_category on venues (category);
create index venues_overall_score on venues (overall_score);

-- ─── Ratings ─────────────────────────────────────────────────────────────────

create table ratings (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid references venues(id) on delete cascade,
  user_id         uuid references auth.users(id),
  noise_db        numeric(5,1),
  noise_manual    smallint check (noise_manual between 1 and 5),
  lighting        smallint check (lighting between 1 and 5),
  crowding        smallint check (crowding between 1 and 5),
  smell           smallint check (smell between 1 and 5),
  predictability  smallint check (predictability between 1 and 5),
  time_of_day     text check (time_of_day in ('morning','afternoon','evening','night')),
  day_of_week     smallint check (day_of_week between 0 and 6),
  heart_rate      smallint,
  stress_level    smallint,
  notes           text,
  photo_url       text,
  created_at      timestamptz default now()
);

create index ratings_venue_id on ratings (venue_id);
create index ratings_created_at on ratings (created_at desc);
create index ratings_user_id on ratings (user_id);  -- for learning engine queries

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- diagnosis_tags is GDPR Article 9 special category data.
-- Requires explicit consent (diagnosis_consent = true) before storing.
-- Never exposed in public-facing queries.

create table profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  display_name        text not null,
  noise_threshold     smallint default 65,
  lighting_preference text check (lighting_preference in ('dim','moderate','bright')) default 'moderate',
  crowding_threshold  smallint default 3,
  triggers            jsonb default '[]',
  trigger_categories  jsonb default '[]',
  comfort_items       jsonb default '[]',
  diagnosis_tags      jsonb default '[]',
  diagnosis_consent   boolean default false,
  home_venue_id       uuid references venues(id),
  is_default          boolean default false,
  created_at          timestamptz default now()
);

create index profiles_user_id on profiles (user_id);

-- ─── Comments ─────────────────────────────────────────────────────────────────

create table comments (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid references venues(id) on delete cascade,
  user_id     uuid references auth.users(id),
  body        text not null,
  is_flagged  boolean default false,
  created_at  timestamptz default now()
);

create index comments_venue_id on comments (venue_id);

-- ─── Venue follows ────────────────────────────────────────────────────────────

create table venue_follows (
  user_id       uuid references auth.users(id) on delete cascade,
  venue_id      uuid references venues(id) on delete cascade,
  is_familiar   boolean default false,
  created_at    timestamptz default now(),
  primary key (user_id, venue_id)
);

-- ─── User activity ────────────────────────────────────────────────────────────

create table user_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('rating','home_log','check_in')),
  venue_id      uuid references venues(id),
  is_home       boolean default false,
  created_at    timestamptz default now()
);

create index user_activity_user_id on user_activity (user_id);
create index user_activity_created_at on user_activity (created_at desc);

-- ─── Daily check-ins ──────────────────────────────────────────────────────────

create table daily_checkins (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references auth.users(id) on delete cascade,
  profile_id                uuid references profiles(id) on delete cascade,
  noise_threshold_today     smallint,
  crowding_threshold_today  smallint,
  notes                     text,
  created_at                timestamptz default now()
);

create index daily_checkins_user_date on daily_checkins (user_id, created_at desc);

-- ─── Companion sessions ───────────────────────────────────────────────────────

create table companion_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  uuid references auth.users(id) on delete cascade,
  join_code     text unique not null,
  profile_id    uuid references profiles(id),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  expires_at    timestamptz default (now() + interval '24 hours')
);

-- ─── Profile shares ───────────────────────────────────────────────────────────

create table profile_shares (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete cascade,
  token       text unique not null,
  created_at  timestamptz default now()
);

-- ─── Journal insights ─────────────────────────────────────────────────────────

create table journal_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  week_start    date not null,
  insights      jsonb not null,
  generated_at  timestamptz default now(),
  unique (user_id, week_start)
);

-- ─── Venue aggregate trigger ──────────────────────────────────────────────────

create or replace function recalculate_venue_aggregates()
returns trigger as $$
begin
  update venues set
    avg_noise_db       = (select avg(noise_db)       from ratings where venue_id = NEW.venue_id and noise_db       is not null),
    avg_lighting       = (select avg(lighting)       from ratings where venue_id = NEW.venue_id and lighting       is not null),
    avg_crowding       = (select avg(crowding)       from ratings where venue_id = NEW.venue_id and crowding       is not null),
    avg_smell          = (select avg(smell)          from ratings where venue_id = NEW.venue_id and smell          is not null),
    avg_predictability = (select avg(predictability) from ratings where venue_id = NEW.venue_id and predictability is not null),
    total_ratings      = (select count(*)            from ratings where venue_id = NEW.venue_id),
    updated_at         = now()
  where id = NEW.venue_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_rating_insert
  after insert on ratings
  for each row execute function recalculate_venue_aggregates();

-- ─── Row Level Security ───────────────────────────────────────────────────────

-- Venues: public read, authenticated insert
alter table venues enable row level security;
create policy "venues_read"   on venues for select using (true);
create policy "venues_insert" on venues for insert with check (auth.uid() is not null);

-- Ratings: public read (aggregates only via venues), authenticated insert
alter table ratings enable row level security;
create policy "ratings_read"   on ratings for select using (true);
create policy "ratings_insert" on ratings for insert with check (auth.uid() = user_id);

-- Profiles: private to owner
alter table profiles enable row level security;
create policy "profiles_owner" on profiles using (auth.uid() = user_id);

-- Comments: public read (non-flagged), authenticated insert
alter table comments enable row level security;
create policy "comments_read"   on comments for select using (not is_flagged);
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);

-- Venue follows: private to owner
alter table venue_follows enable row level security;
create policy "follows_owner" on venue_follows using (auth.uid() = user_id);

-- User activity: private to owner
alter table user_activity enable row level security;
create policy "activity_owner" on user_activity using (auth.uid() = user_id);

-- Daily check-ins: private to owner
alter table daily_checkins enable row level security;
create policy "checkins_owner" on daily_checkins using (auth.uid() = user_id);

-- Companion sessions: host manages; anyone can read active session by join_code
alter table companion_sessions enable row level security;
create policy "companion_host"      on companion_sessions using (auth.uid() = host_user_id);
create policy "companion_join_read" on companion_sessions for select using (auth.uid() = host_user_id);

-- Profile shares: owner manages; token lookup must go through an edge function with service role
alter table profile_shares enable row level security;
create policy "share_owner" on profile_shares using (auth.uid() = user_id);

-- Journal insights: private to owner
alter table journal_insights enable row level security;
create policy "insights_owner" on journal_insights using (auth.uid() = user_id);

-- ─── Public venue stats view ──────────────────────────────────────────────────
-- Excludes diagnosis_tags and any user-identifying fields.
-- Use this view for anonymous/public venue reads.

create view public_venue_stats as
  select
    id, osm_id, name, category, lat, lng, address,
    avg_noise_db, avg_lighting, avg_crowding, avg_smell, avg_predictability,
    overall_score, total_ratings, quiet_hours, sensory_features,
    created_at, updated_at
  from venues;

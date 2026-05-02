# Sensly — Detailed Design

> Generated via PDD workflow. Based on design.md + requirements Q&A (idea-honing.md).
> Last updated: 2026-05-02
> Updated: new features integrated from Q6 (personalization, learning engine, companion mode, journal, briefing, streaks, home logging)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native App (Expo)                       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  React Navigation v6                     │    │
│  │         Bottom Tab Navigator (4 tabs)                    │    │
│  │   [Map]   [Search]   [Followed]   [Profile]              │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Zustand Stores                         │   │
│  │  authStore  profileStore  venueStore  queueStore          │   │
│  │  settingsStore (accessibility, language, UI mode)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │expo-av   │  │react-    │  │expo-     │  │expo-          │   │
│  │(mic/dB + │  │native-   │  │sqlite    │  │notifications  │   │
│  │ voice)   │  │maps      │  │(offline  │  │(follow+brief) │   │
│  │          │  │          │  │queue)    │  │               │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │expo-     │  │expo-     │  │Supabase  │                       │
│  │calendar  │  │speech    │  │Realtime  │                       │
│  │(briefing)│  │(voice log│  │(companion│                       │
│  │          │  │ transcr.)│  │ mode)    │                       │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                       │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        └─────────────┴──────┬──────┘                 │
                             │                        │
              ┌──────────────▼────────────────────┐   │
              │           Supabase                 │   │
              │                                    │   │
              │  Auth    Postgres    Edge Fns       │◄──┘
              │  RLS     Realtime    Storage        │
              └──────────────┬────────────────────┘
                             │
              ┌──────────────▼────────────────────┐
              │         External APIs              │
              │  Nominatim   Overpass   i18n CDN   │
              └───────────────────────────────────┘
```

### Data flow summary
- App reads/writes Supabase directly via `@supabase/supabase-js`
- RLS policies enforce all access control — no client-side security logic
- Offline ratings queue in expo-sqlite; sync triggered on network reconnect
- Venue aggregates recalculated by Postgres trigger on each new rating insert
- Comment moderation runs in a Supabase Edge Function before insert
- Push notifications delivered via Expo Push Notification Service → expo-notifications
- Learning engine runs as Supabase Edge Function, queries user's rating history to detect patterns
- Companion mode uses Supabase Realtime — live dB readings broadcast to companion's device
- Morning briefing scheduled via expo-notifications + expo-calendar for calendar-aware alerts
- Voice logging transcribed on-device via expo-speech (no external API needed)

---

## 2. Navigation Structure

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── WelcomeScreen
│   ├── SignInScreen
│   ├── SignUpScreen
│   └── OnboardingScreen (first launch: mode select, profile setup)
│       ├── OnboardingModeScreen       — Self / Support toggle
│       ├── OnboardingTriggersScreen   — chip-based trigger selector (sounds, smells, lighting types)
│       ├── OnboardingThresholdScreen  — noise comfort slider (40–90 dB)
│       ├── OnboardingHealthScreen     — opt-in HealthKit / Health Connect
│       └── OnboardingReadyScreen      — "You're ready"
│
└── AppTabs (authenticated)
    ├── Tab: Map
    │   ├── MapScreen (main map view + Recovery Mode FAB)
    │   ├── VenueDetailScreen (modal/sheet)
    │   └── RatingFlowScreen (modal stack)
    │       ├── AutoSenseScreen (mic measurement)
    │       ├── VoiceLogScreen  (voice note recording + transcription)
    │       ├── ManualRatingScreen (sliders)
    │       └── RatingConfirmScreen
    │
    ├── Tab: Search
    │   ├── SearchScreen (text search + filters)
    │   └── VenueDetailScreen (shared)
    │
    ├── Tab: Followed
    │   ├── FollowedVenuesScreen (watched venues + Familiar Places section)
    │   └── VenueDetailScreen (shared)
    │
    ├── Tab: Journal  ← NEW (replaces or extends Profile tab)
    │   ├── JournalScreen (weekly insights + sensory history)
    │   ├── SensoryBriefingScreen (morning briefing for today's plans)
    │   └── HomeLogScreen (home environment logging)
    │
    └── Tab: Profile
        ├── ProfileScreen (active profile + switch + streak indicator)
        ├── ProfileEditScreen
        ├── DailyCheckInModal (overlay on app open — "How are you today?")
        ├── CompanionScreen (Going With Me mode + share profile link)
        ├── SettingsScreen
        │   ├── AccessibilitySettingsScreen
        │   ├── LanguageSettingsScreen
        │   └── HealthIntegrationScreen
        └── AccountScreen (auth, sign out, delete account)
```

### Self mode vs Support mode
Both modes use the same tab structure. The `settingsStore.uiMode` value (`'self' | 'support'`) controls:
- Font sizes (Self: larger base size, minimum 18sp)
- Information density (Self: one key stat prominent, Support: full radar chart)
- Rating flow steps (Self: 3 steps max, Support: full 5-dimension flow)
- Tab labels (Self: icon-only tabs, Support: icon + label)
- Sensory budget alert style (Self: haptic only, Support: haptic + banner)
- Daily check-in (Self: always shown on open, Support: optional)
- Journal tab (Self: simplified "how was today?" view, Support: full analytics)

---

## 3. Component Architecture

```
src/
├── app/                          # expo-router file-based routing (or screens/ if using RN Navigation)
├── components/
│   ├── map/
│   │   ├── MapView.tsx           # react-native-maps wrapper, venue pins
│   │   ├── VenuePin.tsx          # colorblind-safe marker: blue/circle, orange/square, red/triangle
│   │   ├── VenueBottomSheet.tsx  # slide-up sheet on pin tap (react-native-bottom-sheet)
│   │   ├── LocationFAB.tsx       # floating "center on me" button
│   │   └── RecoveryModeFAB.tsx   # "Find me somewhere quiet" preset filter button
│   ├── venue/
│   │   ├── VenueCard.tsx         # compact summary (used in Search + Followed lists)
│   │   ├── VenueDetail.tsx       # full detail view
│   │   ├── SensoryRadar.tsx      # 5-axis radar chart (victory-native)
│   │   ├── TimeHeatmap.tsx       # day × time noise grid
│   │   ├── CommentList.tsx       # anonymous comments with report button
│   │   └── CommentInput.tsx      # text input + submit
│   ├── rating/
│   │   ├── RatingFlow.tsx        # step wizard coordinator
│   │   ├── AutoSenseStep.tsx     # mic measurement UI
│   │   ├── VoiceLogStep.tsx      # voice note record + transcribe (expo-av + expo-speech)
│   │   ├── SensorySlider.tsx     # visual 1-5 scale with icons
│   │   └── RatingConfirm.tsx     # summary before submit
│   ├── sensing/
│   │   ├── DbGauge.tsx           # animated dB meter (SVG arc)
│   │   ├── VenueDetector.tsx     # GPS → Nominatim → "You're at X"
│   │   └── SensoryBudgetBanner.tsx # threshold exceeded alert
│   ├── profile/
│   │   ├── ProfileCard.tsx       # active profile summary + streak badge
│   │   ├── ProfileSwitcher.tsx   # dropdown/sheet to switch profiles
│   │   ├── TriggerChips.tsx      # visual trigger tags (editable chip grid)
│   │   ├── DailyCheckIn.tsx      # "How are you today?" modal with threshold override
│   │   └── StreakIndicator.tsx   # quiet "🌱 5 days of logging" display
│   ├── companion/
│   │   ├── CompanionSession.tsx  # Going With Me — start/stop session, show join code
│   │   ├── CompanionView.tsx     # companion's real-time dB + alert view
│   │   └── ProfileShareCard.tsx  # read-only shareable profile summary
│   ├── journal/
│   │   ├── WeeklyInsights.tsx    # LLM-generated weekly pattern summary
│   │   ├── SensoryBriefing.tsx   # today's calendar events flagged by venue score
│   │   ├── HomeLogEntry.tsx      # home environment rating entry
│   │   └── InsightCard.tsx       # single insight chip ("You struggle Fridays in crowds")
│   ├── accessibility/
│   │   ├── ColorBlindFilter.tsx  # wraps children with color matrix overlay
│   │   └── DyslexiaText.tsx      # Text component with OpenDyslexic + spacing
│   └── shared/
│       ├── SensoryIcon.tsx       # icon set for each dimension
│       ├── ScoreChip.tsx         # colored score badge
│       ├── OfflineBanner.tsx     # "No connection" notice
│       └── LoadingState.tsx      # skeleton loaders
├── stores/
│   ├── authStore.ts              # session, user id, sign in/out
│   ├── profileStore.ts           # active profile, all profiles, CRUD, dailyThresholdOverride
│   ├── venueStore.ts             # venue cache, nearby venues, followed, familiar places
│   ├── queueStore.ts             # offline rating queue, sync status
│   ├── companionStore.ts         # companion session state, Realtime channel
│   └── settingsStore.ts          # uiMode, language, accessibility prefs
├── hooks/
│   ├── useAudioMeter.ts          # expo-av mic → dBFS → dB SPL
│   ├── useGeolocation.ts         # expo-location watchPosition
│   ├── useNearbyVenues.ts        # Overpass query + venueStore cache
│   ├── useOfflineSync.ts         # NetInfo → flush queueStore on reconnect
│   ├── useHealthData.ts          # HealthKit / Health Connect heart rate read
│   ├── useVoiceLog.ts            # expo-av record + expo-speech transcribe
│   ├── useCompanion.ts           # Supabase Realtime channel for companion mode
│   └── useCalendarBriefing.ts    # expo-calendar → venue score lookup for today's events
├── lib/
│   ├── supabase.ts               # Supabase client init
│   ├── nominatim.ts              # reverse geocode with 1 req/sec debounce
│   ├── overpass.ts               # nearby POI query, 200m radius, cached
│   ├── sensoryUtils.ts           # dB → label, score → color, aggregate math
│   ├── learningEngine.ts         # pattern detection queries (calls Edge Function)
│   ├── i18n.ts                   # react-i18next setup + language detection
│   └── notifications.ts          # expo-notifications registration + handlers
├── types/
│   ├── venue.ts
│   ├── rating.ts
│   ├── profile.ts
│   ├── companion.ts
│   └── supabase.ts               # generated types from Supabase CLI
└── constants/
    ├── sensoryScales.ts          # dB ranges, label strings, color mappings
    ├── quietHours.ts             # pre-loaded chain quiet hours data
    ├── triggerOptions.ts         # preset trigger chips for onboarding
    └── theme.ts                  # color tokens, spacing, typography scale
```

---

## 4. Data Models

### Supabase Schema

```sql
-- Venues (populated from OSM + user submissions)
create table venues (
  id              uuid primary key default gen_random_uuid(),
  osm_id          text unique,
  name            text not null,
  category        text,                    -- cafe, restaurant, store, clinic, theater...
  lat             numeric(10,7) not null,
  lng             numeric(10,7) not null,
  address         text,
  -- Aggregates (maintained by Postgres trigger)
  avg_noise_db    numeric(5,1),
  avg_lighting    numeric(3,2),
  avg_crowding    numeric(3,2),
  avg_smell       numeric(3,2),
  avg_predictability numeric(3,2),
  overall_score   numeric(3,2),            -- computed: weighted average of all dimensions
  total_ratings   integer default 0,
  -- Metadata
  quiet_hours     jsonb,                   -- [{"day":"tue","start":"18:00","end":"20:00","label":"Quiet hour"}]
  sensory_features jsonb,                  -- ["dim lighting available","outdoor seating","no background music"]
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index venues_location on venues using gist (
  ll_to_earth(lat, lng)                    -- earthdistance extension for radius queries
);

-- Individual ratings
create table ratings (
  id              uuid primary key default gen_random_uuid(),
  venue_id        uuid references venues(id) on delete cascade,
  user_id         uuid references auth.users(id),   -- internal only, never exposed
  -- Noise
  noise_db        numeric(5,1),                     -- auto-measured dBFS converted
  noise_manual    smallint check (noise_manual between 1 and 5),
  -- Manual dimensions (1-5)
  lighting        smallint check (lighting between 1 and 5),
  crowding        smallint check (crowding between 1 and 5),
  smell           smallint check (smell between 1 and 5),
  predictability  smallint check (predictability between 1 and 5),
  -- Context
  time_of_day     text check (time_of_day in ('morning','afternoon','evening','night')),
  day_of_week     smallint check (day_of_week between 0 and 6),
  heart_rate      smallint,                         -- optional, from HealthKit/Health Connect
  stress_level    smallint,                         -- optional, from HealthKit (HRV-derived)
  notes           text,
  photo_url       text,
  created_at      timestamptz default now()
);

-- User sensory profiles (multiple per account)
-- Default thresholds are research-informed baselines:
--   noise_threshold 65 dB: upper comfortable limit for most autistic adults in social settings
--     (below the 70 dB Hearing Health Foundation safe limit; above quiet-room baseline of ~40 dB)
--   crowding_threshold 3: mid-scale default; highly individual, adjusted via daily check-in
--   lighting_preference 'moderate': warm white (2700K–3000K) is recommended for autism/ADHD
--     (fluorescent/cool white >4000K associated with increased sensory distress per neurolaunch.com research)
create table profiles (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade,
  display_name        text not null,               -- "My profile", "Jamie's profile"
  noise_threshold     smallint default 65,         -- dB SPL; 65 = comfortable social setting upper limit
  lighting_preference text check (lighting_preference in ('dim','moderate','bright')) default 'moderate',
  crowding_threshold  smallint default 3,          -- 1-5 scale; 3 = moderate crowd tolerance
  triggers            jsonb default '[]',          -- ["fluorescent lights","perfume","crowds","sirens"]
  trigger_categories  jsonb default '[]',          -- ["sound","smell","lighting","texture","unpredictability"]
  comfort_items       jsonb default '[]',          -- ["noise-canceling headphones","sunglasses"]
  is_default          boolean default false,
  created_at          timestamptz default now()
);

-- Comments on venues
create table comments (
  id          uuid primary key default gen_random_uuid(),
  venue_id    uuid references venues(id) on delete cascade,
  user_id     uuid references auth.users(id),      -- internal only
  body        text not null,
  is_flagged  boolean default false,
  created_at  timestamptz default now()
);

-- Venue follows (with safe/familiar place flag)
create table venue_follows (
  user_id       uuid references auth.users(id) on delete cascade,
  venue_id      uuid references venues(id) on delete cascade,
  is_familiar   boolean default false,   -- "Familiar place" — pinned for hard days
  created_at    timestamptz default now(),
  primary key (user_id, venue_id)
);

-- Offline queue (local SQLite only — never in Supabase)
-- expo-sqlite table on device:
-- pending_ratings (id, venue_id, payload_json, created_at, synced_at)

-- User activity log — for streak tracking and learning engine
create table user_activity (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  activity_type text not null,           -- 'rating', 'home_log', 'check_in'
  venue_id      uuid references venues(id),  -- null for home logs / check-ins
  is_home       boolean default false,
  created_at    timestamptz default now()
);

-- Daily check-in log — threshold overrides per day
create table daily_checkins (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade,
  profile_id            uuid references profiles(id) on delete cascade,
  noise_threshold_today smallint,        -- override for today only
  crowding_threshold_today smallint,
  notes                 text,            -- "rough day, headache"
  created_at            timestamptz default now()
);

-- Companion sessions — for "Going With Me" mode
create table companion_sessions (
  id            uuid primary key default gen_random_uuid(),
  host_user_id  uuid references auth.users(id) on delete cascade,
  join_code     text unique not null,    -- 6-char alphanumeric, expires after 24h
  profile_id    uuid references profiles(id),
  is_active     boolean default true,
  created_at    timestamptz default now(),
  expires_at    timestamptz default (now() + interval '24 hours')
);

-- Profile share tokens — read-only shareable profile links
create table profile_shares (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete cascade,
  token         text unique not null,    -- URL-safe random token
  created_at    timestamptz default now()
);

-- Sensory journal insights cache — generated weekly by Edge Function
create table journal_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  week_start    date not null,
  insights      jsonb not null,          -- [{"text": "You tend to struggle on Fridays...", "type": "pattern"}]
  generated_at  timestamptz default now(),
  unique (user_id, week_start)
);
```

### Postgres Trigger — Venue Aggregate Recalculation

```sql
create or replace function recalculate_venue_aggregates()
returns trigger as $$
begin
  update venues set
    avg_noise_db       = (select avg(noise_db) from ratings where venue_id = NEW.venue_id and noise_db is not null),
    avg_lighting       = (select avg(lighting) from ratings where venue_id = NEW.venue_id and lighting is not null),
    avg_crowding       = (select avg(crowding) from ratings where venue_id = NEW.venue_id and crowding is not null),
    avg_smell          = (select avg(smell) from ratings where venue_id = NEW.venue_id and smell is not null),
    avg_predictability = (select avg(predictability) from ratings where venue_id = NEW.venue_id and predictability is not null),
    total_ratings      = (select count(*) from ratings where venue_id = NEW.venue_id),
    updated_at         = now()
  where id = NEW.venue_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_rating_insert
  after insert on ratings
  for each row execute function recalculate_venue_aggregates();
```

### RLS Policies

```sql
-- Venues: anyone can read, authenticated users can insert
alter table venues enable row level security;
create policy "venues_read" on venues for select using (true);
create policy "venues_insert" on venues for insert with check (auth.uid() is not null);

-- Ratings: anyone can read aggregates via venues table; user_id never selected by client
alter table ratings enable row level security;
create policy "ratings_read" on ratings for select using (true);
create policy "ratings_insert" on ratings for insert with check (auth.uid() = user_id);

-- Profiles: private to owner
alter table profiles enable row level security;
create policy "profiles_owner" on profiles using (auth.uid() = user_id);

-- Comments: anyone can read non-flagged; authenticated can insert
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

-- Companion sessions: host can manage; anyone can read active session by join_code (for joining)
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
```

---

## 5. Key Technical Implementations

### 5.1 Audio Measurement (expo-av)

```typescript
// hooks/useAudioMeter.ts
import { Audio } from 'expo-av';

export function useAudioMeter() {
  const [db, setDb] = useState<number>(0);
  const [isListening, setIsListening] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const start = async () => {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true });

    const { recording } = await Audio.Recording.createAsync(
      {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,   // enables dBFS metering
      },
      (status) => {
        if (status.metering !== undefined) {
          // status.metering is dBFS (negative, 0 = max)
          // Map -60 dBFS → 30 dB SPL, 0 dBFS → 90 dB SPL
          const dbSPL = Math.round(Math.max(30, Math.min(100, status.metering + 90)));
          setDb(dbSPL);
        }
      },
      100  // update interval ms
    );
    recordingRef.current = recording;
    setIsListening(true);
  };

  const stop = async (): Promise<number> => {
    await recordingRef.current?.stopAndUnloadAsync();
    setIsListening(false);
    return db; // return final reading
  };

  return { db, isListening, start, stop };
}
```

### 5.2 Offline Queue (expo-sqlite)

```typescript
// lib/offlineQueue.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('sensly.db');

export function initQueue() {
  db.transaction(tx => {
    tx.executeSql(`
      create table if not exists pending_ratings (
        id          text primary key,
        venue_id    text not null,
        payload     text not null,   -- JSON stringified rating
        created_at  text not null,
        synced      integer default 0
      )
    `);
  });
}

export function enqueueRating(venueId: string, payload: object) {
  db.transaction(tx => {
    tx.executeSql(
      'insert into pending_ratings (id, venue_id, payload, created_at) values (?,?,?,?)',
      [uuid(), venueId, JSON.stringify(payload), new Date().toISOString()]
    );
  });
}

export async function flushQueue(supabase: SupabaseClient) {
  return new Promise<void>((resolve) => {
    db.transaction(tx => {
      tx.executeSql(
        'select * from pending_ratings where synced = 0',
        [],
        async (_, { rows }) => {
          for (const row of rows._array) {
            const { error } = await supabase
              .from('ratings')
              .insert(JSON.parse(row.payload));
            if (!error) {
              tx.executeSql('update pending_ratings set synced = 1 where id = ?', [row.id]);
            }
          }
          resolve();
        }
      );
    });
  });
}
```

### 5.3 Supabase Edge Function — Comment Moderation

```typescript
// supabase/functions/moderate-comment/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const BLOCKED_TERMS = ['...'] // maintained list

serve(async (req) => {
  const { venue_id, body } = await req.json()
  const authHeader = req.headers.get('Authorization')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get user from JWT
  const { data: { user } } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '') ?? ''
  )
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Moderation check
  const lower = body.toLowerCase()
  const flagged = BLOCKED_TERMS.some(term => lower.includes(term))

  const { error } = await supabase.from('comments').insert({
    venue_id,
    user_id: user.id,
    body,
    is_flagged: flagged
  })

  if (error) return new Response(error.message, { status: 500 })
  return new Response(JSON.stringify({ flagged }), { status: 200 })
})
```

### 5.4 Accessibility — Color Blindness Filter

```typescript
// components/accessibility/ColorBlindFilter.tsx
// Wraps the entire app at root level when a filter is active

const MATRICES = {
  deuteranopia: [
    0.625, 0.375, 0,    0, 0,
    0.7,   0.3,   0,    0, 0,
    0,     0.3,   0.7,  0, 0,
    0,     0,     0,    1, 0,
  ],
  protanopia: [
    0.567, 0.433, 0,    0, 0,
    0.558, 0.442, 0,    0, 0,
    0,     0.242, 0.758,0, 0,
    0,     0,     0,    1, 0,
  ],
  tritanopia: [
    0.95,  0.05,  0,    0, 0,
    0,     0.433, 0.567,0, 0,
    0,     0.475, 0.525,0, 0,
    0,     0,     0,    1, 0,
  ],
};

export function ColorBlindFilter({ children, mode }: {
  children: React.ReactNode;
  mode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
}) {
  if (mode === 'none') return <>{children}</>;
  return (
    <View style={{ flex: 1 }}>
      <ColorMatrix matrix={MATRICES[mode]}>
        {children}
      </ColorMatrix>
    </View>
  );
  // Uses react-native-color-matrix-image-filters
}
```

---

## 6. Zustand Stores

```typescript
// stores/settingsStore.ts
interface SettingsStore {
  uiMode: 'self' | 'support';
  language: string;                          // BCP 47 tag e.g. 'en', 'es'
  colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';
  dyslexiaMode: boolean;
  setUiMode: (mode: 'self' | 'support') => void;
  setLanguage: (lang: string) => void;
  setColorBlindMode: (mode: string) => void;
  setDyslexiaMode: (enabled: boolean) => void;
}

// stores/queueStore.ts
interface QueueStore {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  enqueue: (venueId: string, payload: RatingPayload) => void;
  flush: () => Promise<void>;
}

// stores/profileStore.ts
interface ProfileStore {
  profiles: SensoryProfile[];
  activeProfileId: string | null;
  activeProfile: SensoryProfile | null;       // derived
  dailyThresholdOverride: number | null;      // set by daily check-in, resets at midnight
  fetchProfiles: () => Promise<void>;
  setActiveProfile: (id: string) => void;
  setDailyOverride: (threshold: number | null) => void;
  createProfile: (data: Partial<SensoryProfile>) => Promise<void>;
  updateProfile: (id: string, data: Partial<SensoryProfile>) => Promise<void>;
  // Derived: effective threshold = dailyThresholdOverride ?? activeProfile.noise_threshold
  effectiveNoiseThreshold: number;
}

// stores/venueStore.ts
interface VenueStore {
  nearbyVenues: Venue[];
  followedVenues: VenueFollow[];
  familiarVenues: VenueFollow[];             // is_familiar = true subset
  venueCache: Record<string, Venue>;
  setNearby: (venues: Venue[]) => void;
  toggleFollow: (venueId: string) => Promise<void>;
  toggleFamiliar: (venueId: string) => Promise<void>;
}

// stores/companionStore.ts
interface CompanionStore {
  sessionId: string | null;
  joinCode: string | null;
  isHost: boolean;
  liveDb: number | null;                     // real-time dB from host (companion view)
  channel: RealtimeChannel | null;
  startSession: (profileId: string) => Promise<string>;  // returns join code
  joinSession: (joinCode: string) => Promise<void>;
  endSession: () => void;
  broadcastDb: (db: number) => void;         // host calls this during measurement
}
```

---

## 7. Self Mode vs Support Mode — UI Differences

| Element | Self Mode | Support Mode |
|---|---|---|
| Base font size | 20sp | 16sp |
| Tab bar | Icons only | Icons + labels |
| Map pin tap | Full-screen venue card, 1 key stat | Bottom sheet with radar chart |
| Rating flow | 3 steps (noise → lighting → done) | 5 steps (all dimensions) |
| Venue detail | Large score, simple label | Full radar, time heatmap, comments |
| Sensory budget alert | Haptic pulse only | Haptic + top banner |
| Onboarding | Minimal (3 screens) | Full (5 screens with profile setup) |
| Color scheme | Higher contrast, muted palette | Standard palette |
| Daily check-in | Always shown on app open | Optional, can be dismissed |
| Journal tab | "How was today?" simple entry | Full weekly insights + analytics |
| Familiar places | Prominent at top of Followed tab | Section within Followed tab |

Mode is toggled in Profile → Settings → "Who is using this app?" and persists via settingsStore.

---

## 8. Sensory Score System

### Noise → Score mapping
Research basis: Hearing Health Foundation cites 70 dB as the upper safe limit for sustained exposure. Studies on autism (SPARK for Autism, 2021 review) show 50–70% of autistic people experience hypersensitivity to everyday sounds, with discomfort commonly reported at levels neurotypical people find unremarkable (as low as 55–65 dB in busy environments). NIOSH recommends 85 dB as the occupational damage threshold.

| dB SPL | Score | Label | Typical context |
|---|---|---|---|
| < 40 | 1 | Very quiet | Empty library, quiet bedroom |
| 40–54 | 2 | Quiet | Soft conversation, small café |
| 55–69 | 3 | Moderate | Busy café, open-plan office |
| 70–84 | 4 | Loud | Restaurant at peak, busy bar |
| 85+ | 5 | Very loud | Hearing risk — NIOSH damage threshold |

### Overall venue score (for pin color)
```
overall_score = weighted average:
  noise:          35%  (highest weight — most impactful for sensory needs)
  lighting:       25%
  crowding:       20%
  predictability: 15%
  smell:           5%
```

### Pin color thresholds (colorblind-safe — blue/orange/red + shape redundancy)
- Blue + circle (score 1.0–2.4): sensory-friendly
- Orange + square (score 2.5–3.4): moderate
- Red + triangle (score 3.5–5.0): high-stimulation

See Section 16.2 for the full colorblind-safe rationale and hex values.

---

## 9. New Feature Implementations

### 9.1 Richer Onboarding — Trigger Preference Builder

Onboarding expands from a single noise slider to a 5-screen flow:

```
Screen 1: Mode select (Self / Support)
Screen 2: Trigger chips — user taps any that apply
  Categories: Sound | Lighting | Smell | Texture | Unpredictability
  Examples per category (from constants/triggerOptions.ts):
    Sound:           "Loud music", "Crowds talking", "Sirens", "High-pitched sounds", "Sudden noises"
    Lighting:        "Fluorescent lights", "Bright sunlight", "Flickering lights", "Dim lighting"
    Smell:           "Perfume/cologne", "Food smells", "Cleaning products", "Smoke"
    Texture:         "Certain fabrics", "Sticky surfaces"
    Unpredictability:"Unexpected changes", "Loud announcements", "Busy visual environments"
Screen 3: Noise comfort threshold slider (40–90 dB) with live label
Screen 4: Health integration opt-in
Screen 5: Ready — "Your profile is set up"
```

Selected triggers stored as `profiles.triggers` (string array) and `profiles.trigger_categories` (category array). Used by the learning engine to weight pattern detection.

---

### 9.2 Daily Check-In — Threshold Override

A modal shown on app open (configurable frequency in settings):

```typescript
// components/profile/DailyCheckIn.tsx
// Shows: "How are you feeling today?"
// Three quick options (large tap targets for Self mode):
//   🟢 Good day — use my normal settings
//   🟡 Sensitive day — lower my thresholds by 10 dB
//   🔴 Hard day — lower my thresholds by 20 dB + show Familiar Places first
// Custom option: manual slider override

// On submit:
profileStore.setDailyOverride(selectedThreshold);
supabase.from('daily_checkins').insert({ profile_id, noise_threshold_today, ... });
// Override resets at midnight via a scheduled check in useEffect on app foreground
```

The `profileStore.effectiveNoiseThreshold` derived value is used everywhere thresholds are checked — the map filter, sensory budget banner, and learning engine all use this, not the raw profile value.

---

### 9.3 Familiar Places

An `is_familiar` boolean on `venue_follows`. UI changes:
- Followed tab: "Familiar Places" section pinned at top, below a "Safe spots for hard days" header
- VenueDetail: star/heart toggle to mark as familiar (distinct from follow)
- Hard day check-in: automatically opens Followed tab filtered to familiar places only

---

### 9.4 Recovery Mode

A floating action button on the map screen (bottom-left, distinct from LocationFAB):

```typescript
// components/map/RecoveryModeFAB.tsx
// Tap → applies preset filter to map:
//   avg_noise_db <= 50
//   avg_crowding <= 2
//   avg_lighting <= 2 (dim preferred)
// Shows banner: "Recovery mode — showing quiet, calm spots nearby"
// Tap again to clear filter
```

No new data needed — uses existing venue aggregates and map filter system.

---

### 9.5 Voice Logging

Added as an optional step in the rating flow after AutoSense:

```typescript
// hooks/useVoiceLog.ts
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech'; // for TTS feedback
// For transcription: use @react-native-voice/voice (device on-device speech recognition)

export function useVoiceLog() {
  const startRecording = async () => { /* expo-av record */ };
  const stopAndTranscribe = async (): Promise<string> => {
    // Stop recording
    // Pass audio to Voice.start() for on-device transcription
    // Return transcribed text → auto-fills rating notes field
  };
}
```

UX: "Say something about this place" → user speaks → transcription appears in notes field → user can edit before submitting. Works while walking — no need to stop and type.

---

### 9.6 Learning Engine — Proactive Warnings

A Supabase Edge Function that runs on demand (called when app foregrounds near a venue):

```typescript
// supabase/functions/detect-patterns/index.ts
// Input: { user_id, venue_id, venue_category }
// Queries: last 90 days of ratings by this user
// Detects:
//   - Category pattern: "user has left [cafe] venues within 20 min 3+ times"
//   - Time pattern: "user rates [crowding >= 4] on Friday evenings consistently"
//   - Trigger match: venue's sensory_features overlap with user's known triggers
// Returns: { warning: string | null, confidence: 'high'|'medium'|'low' }

// Client-side (lib/learningEngine.ts):
export async function checkProactiveWarning(venueId: string, category: string) {
  const { data } = await supabase.functions.invoke('detect-patterns', {
    body: { venue_id: venueId, venue_category: category }
  });
  return data; // { warning: "You've left cafes quickly 4 times before", confidence: "high" }
}
```

Warning shown as a non-intrusive banner on VenueDetail: "⚠️ Heads up — places like this have affected you before."

---

### 9.7 Sensory Journal — Weekly Insights

```typescript
// supabase/functions/generate-insights/index.ts
// Runs weekly (Supabase cron or triggered on Journal tab open if stale)
// Queries user's ratings + daily_checkins for the past 7 days
// Builds structured summary:
//   { worst_day, best_venue_category, pattern_text, streak_count }
// Calls Groq free tier (llama-3) to generate 2-3 natural language insight strings
// Stores result in journal_insights table

// Example insights generated:
// "You tend to struggle on Fridays in crowded spaces"
// "Libraries and bookshops consistently feel safe for you"
// "Your sensitive days correlate with poor sleep the night before (from Health data)"
```

Journal screen displays these as `InsightCard` chips — short, scannable, not overwhelming.

---

### 9.8 Morning Sensory Briefing

```typescript
// hooks/useCalendarBriefing.ts
import * as Calendar from 'expo-calendar';

export async function getTodaysBriefing(profiles: SensoryProfile[]) {
  const events = await Calendar.getEventsAsync(
    await Calendar.getCalendarsAsync(),
    startOfDay(new Date()),
    endOfDay(new Date())
  );

  // For each event with a location:
  //   1. Geocode location via Nominatim
  //   2. Find nearest venue in Supabase within 100m
  //   3. Compare venue score against active profile thresholds
  //   4. Flag if likely overwhelming

  return events.map(event => ({
    event,
    venue: matchedVenue,
    warning: venueScore > effectiveThreshold ? 'May be overwhelming' : null
  }));
}
```

Delivered as a push notification at 8am: "You have 3 stops today. The coffee meeting at 10am may be loud (avg 72 dB). Tap to see alternatives."

Also accessible as a screen in the Journal tab for manual review.

---

### 9.9 "Going With Me" — Companion Mode

Uses Supabase Realtime for live dB broadcasting:

```typescript
// stores/companionStore.ts

// HOST flow:
startSession(profileId) → insert companion_sessions → get join_code
broadcastDb(db) → channel.send({ type: 'broadcast', event: 'db_update', payload: { db } })

// COMPANION flow:
joinSession(joinCode) → fetch session by join_code → subscribe to channel
channel.on('broadcast', { event: 'db_update' }, ({ payload }) => {
  companionStore.liveDb = payload.db;
  // If db > host profile threshold → show alert to companion
})
```

Companion sees a simplified screen: live dB gauge + the host's sensory profile thresholds + alert when exceeded. No map, no rating — just awareness.

Share via: "Going With Me" button in Profile → generates join code → companion enters code or taps shared link.

---

### 9.10 Share Sensory Profile

```typescript
// Generate a read-only shareable link
// POST /profile-shares → creates profile_shares row with random token
// Shareable URL: sensly://profile/share/{token}
// Or web fallback: https://sensly.app/profile/{token}

// The shared view shows:
//   - Display name (e.g. "Jamie's profile")
//   - Noise threshold: "Comfortable up to 65 dB"
//   - Trigger categories as chips
//   - Comfort items
//   - NO ratings history, NO location data, NO account info
```

Intended for sharing with a therapist, parent, or friend so they understand the person's sensory needs without needing an account.

---

### 9.11 Home Environment Logging

A special venue type with `is_home = true` on the rating. Entry point: Journal tab → "Log home environment" button.

Same rating schema as venue ratings but:
- No GPS required (uses a fixed "Home" pseudo-venue per user)
- No noise auto-measurement (optional — user can tap to measure)
- Adds a "sleep quality" field (1–5) for correlation with next-day sensitivity
- Shown in journal insights: "You rated 3 loud days this week — your sensitive days followed"

```sql
-- Home pseudo-venue created per user on first home log
-- venue_id stored in profiles.home_venue_id (add column)
alter table profiles add column home_venue_id uuid references venues(id);
```

---

### 9.12 Gentle Streak Tracking

```typescript
// components/profile/StreakIndicator.tsx
// Queries user_activity for consecutive days with at least one entry
// Display: small plant emoji + count — "🌱 5 days"
// Shown quietly in Profile tab header — not a prominent gamification element
// No notifications, no "you broke your streak" messaging
// Resets silently — no punishment for missing days
```

The streak counts any activity: rating, home log, or daily check-in. Low bar intentionally — the goal is habit formation, not pressure.

---

## 10. Push Notifications — Venue Follow Flow + Morning Briefing

```
Venue follow notification:
User follows venue
  → insert into venue_follows
  → Supabase webhook fires on new rating insert for followed venues
  → Calls Expo Push Notification API with user's push token
  → expo-notifications delivers: "New rating at Blue Bottle Coffee"

Morning briefing notification:
Scheduled daily at 8am via expo-notifications (local notification)
  → useCalendarBriefing runs on notification tap
  → Fetches today's calendar events, geocodes locations, checks venue scores
  → Delivers: "3 stops today — the 10am coffee meeting may be loud (72 dB)"
```

Push token stored in `auth.users` metadata on first app launch via `expo-notifications.getExpoPushTokenAsync()`.

---

## 11. Health Data Integration

### iOS (HealthKit via expo-health)
- Permission requested: `HKQuantityTypeIdentifierHeartRate` (read)
- On rating flow start: read most recent heart rate sample (last 5 minutes)
- Attached to rating as `heart_rate` field (integer bpm)
- Never synced to other users — stored only on the rating row for the user's own context

### Android (Health Connect via expo-health-connect)
- Same concept, same data point
- Requires Android 14+ for Health Connect; graceful degradation on older versions (field simply omitted)

### Opt-in flow
- Prompted once during onboarding: "Want to attach your heart rate to ratings for personal context?"
- Can be enabled/disabled in Profile → Settings → Health Integration
- If declined, health data is never requested

---

## 12. Localization

```
src/locales/
  en.json     # English (primary)
  es.json     # Spanish
  fr.json     # French (stretch goal)

// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

i18n.use(initReactI18next).init({
  lng: Localization.locale,
  fallbackLng: 'en',
  resources: { en, es },
  interpolation: { escapeValue: false },
});
```

All user-facing strings use `t('key')` — no hardcoded English strings in components.
RTL layout enabled automatically via `I18nManager.forceRTL` for Arabic/Hebrew if added later.

---

## 13. Error Handling

| Scenario | Handling |
|---|---|
| Mic permission denied | Rating flow skips AutoSense step, goes straight to manual sliders. Banner: "Enable mic in Settings for auto noise measurement." |
| Location permission denied | Map centers on city level. VenueDetector disabled. User can still search and browse. |
| Nominatim rate limit (429) | Exponential backoff (1s, 2s, 4s). Cache last result for 30 seconds. |
| Overpass timeout | Retry once. If fails, show cached venues only with "Results may be outdated" notice. |
| Supabase offline | Rating goes to offline queue. OfflineBanner shown. Sync on reconnect via NetInfo listener. |
| Rating sync conflict | Each rating is an independent insert — no conflicts possible. |
| Comment flagged | User sees "Your comment is under review" — not shown to others until manually approved. |
| Health data unavailable | Field omitted silently. No error shown to user. |
| Push token registration fails | Notifications silently disabled. User can retry in Settings. |
| Voice transcription fails | Falls back to empty text field — user types manually. No error shown. |
| Calendar permission denied | Morning briefing feature disabled silently. Briefing screen shows "Enable calendar access in Settings." |
| Companion session expired | Companion sees "Session ended" screen. Host can start a new session. |
| Learning engine Edge Function timeout | Warning silently suppressed. No proactive warning shown — fail safe, not fail loud. |
| Groq API unavailable (journal insights) | Show cached insights if available. If none: "Insights will appear after a few days of logging." |
| Daily check-in dismissed | No override set — use profile defaults. Check-in shown again next day. |

---

## 14. Testing Strategy

### Unit tests (Jest + React Native Testing Library)
- `sensoryUtils.ts` — dB → label mapping, score calculations, aggregate math
- `nominatim.ts` — debounce logic, cache behavior
- `offlineQueue.ts` — enqueue, flush, conflict handling
- Zustand stores — state transitions, persistence

### Integration tests
- Rating flow end-to-end (mock Supabase, mock expo-av)
- Offline queue → sync cycle (mock NetInfo, mock Supabase)
- Auth flow (mock Supabase Auth)

### Manual / device tests
- Audio meter accuracy on iOS and Android (compare against known dB reference)
- react-native-maps rendering on both platforms
- Accessibility modes (color filters, dyslexia font) visual verification
- Push notifications (requires physical device)
- HealthKit integration (requires iOS device with Health app data)

---

## 15. Open Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Chart library | victory-native vs react-native-gifted-charts | victory-native — better maintained, SVG-based |
| Bottom sheet | react-native-bottom-sheet vs @gorhom/bottom-sheet | Same library (gorhom) — de facto standard |
| Profanity filter in Edge Function | Custom list vs `bad-words` npm package | `bad-words` (MIT) — saves time, good coverage |
| Initial language count | English only vs English + Spanish | English + Spanish — 500M Spanish speakers, strong demo signal |
| overall_score weights | Fixed weights vs user-configurable | Fixed for v1 — configurable weights add complexity without clear user benefit yet |
| Voice transcription | @react-native-voice/voice (on-device) vs Whisper API | On-device — no API cost, works offline, no audio data leaves device |
| Journal insights LLM | Groq free tier vs on-device LLM | Groq free tier — sufficient for weekly batch, no cost, better quality than on-device |
| Companion mode transport | Supabase Realtime vs WebSockets | Supabase Realtime — already in stack, no extra infrastructure |
| Morning briefing scheduling | Local expo-notifications vs server-side push | Local notification — no server needed, works without internet |
| Streak reset behavior | Silent reset vs notification | Silent reset — no punishment messaging, aligns with low-pressure design philosophy |

---

## 16. Neurodivergent & Trauma-Informed Design Guidelines

These are small, specific design constraints applied throughout the app — not separate features. Every component should be built with these in mind.

### 16.1 Motion & Animation
- **Respect `reduceMotionEnabled`** — all animations check `AccessibilityInfo.isReduceMotionEnabled()` and fall back to instant transitions
- **No looping animations** anywhere in the UI — looping motion is a known ADHD attention disruptor ([WebAIM, 2024](https://webaim.org/techniques/carousels))
- **Animation duration cap: 200ms** for transitions; 300ms max for the dB gauge arc fill — longer durations increase cognitive load for ADHD users
- **No parallax effects** — vestibular disorders (common co-occurrence with autism) cause nausea from parallax
- **No auto-playing anything** — no sounds, no videos, no carousels that advance without user input

### 16.2 Color & Contrast
- **Minimum contrast ratio: 4.5:1** for all body text (WCAG AA); 7:1 target for Self mode (WCAG AAA)
- **Never use color as the only signal** — every status indicator (venue pin, score chip, alert) must also use shape, icon, or text label. Covers deuteranopia (~6% of men) and protanopia (~1% of men)
- **Avoid red/green as the primary signal pair** — the most common color blindness type (deuteranopia) makes these indistinguishable. Use blue/orange as the safe alternative
- **Venue pin color system (colorblind-safe)**:
  - Sensory-friendly: **blue** `#0077BB` + circle shape
  - Moderate: **orange** `#EE7733` + square shape
  - High-stimulation: **red** `#CC3311` + triangle shape
  - Shape redundancy means the map is readable without color perception
- **Muted, desaturated palette** for the app UI — high saturation increases visual stress for autistic users. Research recommends less-saturated, cool-to-neutral tones ([ResearchGate, 2018](https://www.researchgate.net/publication/327177712))
- **No pure white backgrounds** — use off-white `#F8F6F2` (warm neutral) to reduce glare-induced eye strain for photosensitive users

### 16.3 Typography
- **Minimum body font size: 16sp** (Support mode), **20sp** (Self mode)
- **Line height: 1.5×** font size minimum — tight line spacing is a primary dyslexia barrier
- **Left-aligned text only** — never justified. Justified text creates uneven word spacing that disrupts reading flow for dyslexic users
- **No all-caps text** — reduces readability for dyslexic users and reads as shouting
- **Letter spacing: +0.5px** on body text in dyslexia mode (applied alongside OpenDyslexic font)
- **Sentence case for all labels** — not title case, not all-caps

### 16.4 Language & Content
- **Plain language throughout** — target B1 reading level (short sentences, common words, no jargon). ND-friendly web design standard ([arocom.de, 2025](https://www.arocom.de/en/knowledge/inclusion/nd-friendly-webdesign))
- **Neutral error messages** — never "You failed", "Wrong", "Error". Use "Something didn't work — try again"
- **Consistent labels** — the same action always has the same label across all screens. Never rename "Submit" to "Done" to "Save"
- **Predictable navigation** — back button always goes to the previous screen, never to an unexpected destination

### 16.5 PTSD & Trauma-Informed Design
Research basis: Trauma-informed design ([UXPA Magazine](https://uxpamagazine.org/inclusive-by-design-use-a-trauma-informed-approach), [ACM 2024](https://dl.acm.org/doi/10.1145/3676310)) centers five principles — safety, trustworthiness, choice, collaboration, empowerment.

- **No sudden alerts or sounds** — all notifications are silent by default; sound is opt-in only. Unexpected sounds are a known PTSD hypervigilance trigger
- **Sensory budget alerts use haptic-only by default** — `expo-haptics.impactAsync(Light)`, not Heavy or audio
- **User always in control** — every step in the rating wizard has a visible "Skip" or "Cancel". No dead ends
- **No countdown pressure** — the 30-second measurement has a prominent "Done early" button. Timers that can't be stopped increase anxiety
- **Opt-in for everything sensitive** — mic, location, health data, notifications all require explicit opt-in with plain-language explanation. No dark patterns
- **Exit is always one tap away** — rating flow can be abandoned at any step without confirmation dialog
- **No loss framing** — streak tracking never says "you broke your streak". Shows current count only. No punishment messaging

### 16.6 ADHD-Specific
- **One primary action per screen** — no screen presents more than one main CTA
- **Progress always visible** — step indicators show "Step 2 of 3" in the rating wizard
- **Auto-save everything** — partial ratings saved to local state immediately; user returns to where they left off
- **Forgiving UI** — 10-second "Undo" snackbar after rating submission. No irreversible actions without confirmation
- **Chunked information** — Self mode shows one stat prominently with "See more" to expand. Never a wall of data

### 16.7 Lighting Scale — Research-Backed Descriptions

The lighting dimension (1–5) maps to real-world illuminance and color temperature. Research basis: autism-friendly lighting studies recommend warm white 2700K–3000K and < 300 lux for comfortable autistic environments ([neurolaunch.com](https://neurolaunch.com/best-lighting-for-autism), [totalcareaba.com](https://totalcareaba.com/autism/light-sensitivity-and-autism)). Fluorescent/cool white > 4000K is consistently associated with increased sensory distress. Eaton research confirms ADHD and migraine sufferers also benefit from warm, lower-intensity lighting.

| Score | Label | Illuminance | Color temp | Example |
|---|---|---|---|---|
| 1 | Very dim | < 50 lux | Warm (2700K) | Candlelit restaurant, dim lounge |
| 2 | Dim | 50–150 lux | Warm white (2700–3000K) | Cozy café, bookshop |
| 3 | Moderate | 150–300 lux | Neutral white (3000–4000K) | Standard office, casual restaurant |
| 4 | Bright | 300–500 lux | Cool white (4000K+) | Supermarket, fast food |
| 5 | Harsh | > 500 lux | Daylight/fluorescent (5000K+) | Hospital, big-box retail, stadium |

**Onboarding default**: `lighting_preference = 'moderate'` (score 3). Users with strong preferences adjust during onboarding trigger setup.

### 16.8 Noise Threshold Defaults by Profile Type

When a user selects a profile type during onboarding, pre-fill the noise threshold as a starting point (always adjustable):

| Profile type | Default noise_threshold | Rationale |
|---|---|---|
| Autism / sensory processing | **55 dB** | Below typical social-setting discomfort onset; 50–70% of autistic people report hypersensitivity at everyday levels ([SPARK for Autism, 2021](https://sparkforautism.org)) |
| ADHD | **65 dB** | Moderate sensitivity; ADHD noise sensitivity is real but typically less acute than autism hyperacusis |
| PTSD / anxiety | **60 dB** | Hypervigilance lowers effective tolerance; sudden loud sounds are a known trigger |
| Migraine | **55 dB** | Phonophobia during and between episodes; conservative threshold appropriate |
| General / unsure | **65 dB** | Safe middle ground; below the 70 dB Hearing Health Foundation safe limit |

These are starting points only — the daily check-in and profile edit allow fine-tuning. The app never labels a user by diagnosis; these are internal defaults mapped from the trigger chips selected during onboarding.

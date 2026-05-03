# Sensly — Setup Guide

> Last updated: Steps 1–5 complete (scaffold, auth, map, audio, rating flow)

Two people can work in parallel after completing the shared setup steps below.

---

## Shared First Step — Both do this together (~15 min)

### 1. Create Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Name: `sensly` | Region: pick closest to you
3. Wait ~2 minutes for provisioning

### 2. Run the migrations in order
In Supabase dashboard → **SQL Editor** → New query — run each file in sequence:

1. `sensly/supabase/migrations/001_initial_schema.sql` — all tables, trigger, RLS, indexes
2. `sensly/supabase/migrations/002_patches.sql` — `cube` extension, `is_home` column, improved `overall_score` trigger, 15 seeded demo venues (SF coords)

You should see "Success. No rows returned" for each. Verify in **Table Editor** — you should see 10 tables and 15 rows in `venues`.

### 3. Disable email confirmation (for development)
Supabase dashboard → **Authentication → Providers → Email** → turn off **"Confirm email"** → Save.
This lets sign-up immediately create a session without waiting for email confirmation.

### 4. Get credentials
Supabase dashboard → **Project Settings → API**:
- `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
- `anon public` key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (Person B only, never in client code)

### 5. Create `.env`
In `sensly/` directory:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GROQ_API_KEY=your-groq-key-here
```
Get a free Groq API key at [console.groq.com](https://console.groq.com) (used for weekly journal insights only).

---

## Person A (Core Data Layer) — Start after shared setup

### What you own
Auth, map, audio measurement, rating flow, offline queue, venue store.
See `agents/planning/sensoryscout/design/detailed-design.md` Section 18 for the full split.

### Install and run
```bash
cd sensly
npm install
npx expo start --clear
```

Install **Expo Go** on your phone → scan the QR code.

### Critical notes
- The `expo-sqlite/localStorage/install` polyfill in `App.tsx` **must be the first import** — do not reorder it. It fixes a Supabase + Hermes compatibility issue.
- Auth tokens are stored via `expo-sqlite` localStorage (handled by Supabase client) — never use AsyncStorage for tokens.
- `react-native-worklets` is pinned to `0.5.1` — do not upgrade it. It must match what Expo Go SDK 54 ships with.

### Current build state (Steps 1–7 + UI-A complete — Person A scope done)
- ✅ Step 1: Scaffold, Supabase schema, utility libs (`sensoryUtils`, `validation`, `secureStorage`)
- ✅ Step 2: Auth flow — Welcome, Sign In, Sign Up, session restore via `onAuthStateChange`
- ✅ Step 3: Map screen — GPS, venue pins (colorblind-safe), bottom sheet, offline banner
- ✅ Step 4: Audio measurement — `useAudioMeter`, `DbGauge`, `VenueDetector`
- ✅ Step 5: Rating flow — AutoSense → manual sliders → Supabase insert
- ✅ Step 6: Venue detail — `VenueDetailScreen`, custom SVG radar chart, time heatmap
- ✅ Step 7: Sensory profile — `ProfileScreen`, `ProfileEditScreen`, `SensoryBudgetBanner`, bottom tab bar
- ✅ UI-A: `DashboardScreen` (Home tab, live sensors + risk score), `CalmScreen` (4-phase), `useMotionSensor`, navigation restructured (4 tabs: Home/Map/Calm/Profile)

### Person C placeholders (marked with comments in code)
- `AxolotlSvg` → colored circle in `DashboardScreen.tsx` + `CalmScreen.tsx`
- Kelp background → teal `View` in `DashboardScreen.tsx`
- Fredoka font → system font (C loads via `expo-font` in `App.tsx`)
- Color tokens → still original blue palette (C updates `theme.ts`)

### Next steps (Person A — stretch if time allows)
- Step 8: Offline queue + sync
- Step 11C: Accessibility modes (color blindness filters, dyslexia font)

### Critical notes
- `expo-sqlite/localStorage/install` must be the **first import** in `App.tsx`
- `react-native-worklets` pinned to `0.5.1` — do not upgrade
- `@gorhom/bottom-sheet` must be v5+ (Reanimated v4 compatibility)
- `victory-native` v41 uses Skia — do NOT use `VictoryChart`/`VictoryTheme`. Use custom SVG via `react-native-svg`
- All imports must be at the top of files — mid-file imports cause duplicate declaration errors
- Restart with `npx expo start --clear` after any `.env` changes

---

## Person B (User Intelligence Layer) — Start after shared setup

### What you own
Sensory profiles, daily check-in, learning engine, journal insights, companion mode, push notifications, health integration.
See `agents/planning/sensoryscout/design/detailed-design.md` Section 18 for the full split and build order.

### Start condition
Wait until Person A completes Steps 1–3 (scaffold, auth, map). You can start Phase 1 (profileStore, settingsStore) as soon as the schema migration is run.

### Handoff contract — what Person A exposes
```typescript
// Import these from Person A's files — do not modify them
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';     // authStore.user.id
import { useVenueStore } from '@/stores/venueStore';   // nearbyVenues, venueCache
import { dbToLabel, scoreToPinStyle } from '@/lib/sensoryUtils';
```

### Edge Functions setup
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref your-project-id

# Deploy functions (files in sensly/supabase/functions/)
supabase functions deploy detect-patterns
supabase functions deploy generate-insights
supabase functions deploy moderate-comment
```

Set environment variables in Supabase dashboard → **Edge Functions → Secrets**:
- `GROQ_API_KEY` — for `generate-insights` only

---

## Coordination Rules

1. **Schema changes** — Person B must tell Person A before running any new migration. Both need to update `src/types/supabase.ts`.
2. **Shared files** — `lib/supabase.ts`, `lib/sensoryUtils.ts`, `lib/validation.ts` are owned by Person A. Person B imports them read-only.
3. **No `--legacy-peer-deps`** — dependency conflicts should be resolved properly. If you hit a peer dep error, check the compatibility table in `detailed-design.md` Section 15.
4. **`react-native-worklets` is pinned** — do not run `npx expo install --fix` without checking the worklets version first.
5. **Restart with `--clear` after `.env` changes** — Metro caches env vars at startup.

---

## Key Files Reference

| File | Purpose |
|---|---|
| `sensly/App.tsx` | Entry point — polyfill must be first import |
| `sensly/src/lib/supabase.ts` | Supabase client — import this everywhere, never create a second instance |
| `sensly/src/lib/sensoryUtils.ts` | dB scoring, pin colors, weighted score |
| `sensly/src/lib/validation.ts` | Input sanitization, diagnosis tag whitelist |
| `sensly/src/constants/theme.ts` | Color tokens, typography, spacing — source of truth for UI |
| `sensly/src/navigation/RootNavigator.tsx` | Auth vs app routing, session listener |
| `sensly/supabase/migrations/` | Run in order: 001 then 002 |
| `agents/planning/sensoryscout/design/detailed-design.md` | Full architecture, schema, security, neurodivergent design guidelines |

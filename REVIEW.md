# Sensly — Code Review (remaining issues)

> Reviewed by Claude (claude-sonnet-4-6), 2026-05-11.
> Scope: every source file in `sensly/src`, `sensly/supabase/`, and the web UI prototype.
> Priority ratings: **HIGH** → **MEDIUM** → **LOW**

---

## Table of Contents
1. [Security](#1-security)
2. [Bugs](#2-bugs)
3. [Frontend / Backend Separation](#3-frontendbackend-separation)
4. [Test Gaps](#4-test-gaps)
5. [Performance](#5-performance)
6. [Architecture & Style](#6-architecture--style)

---

## 1. Security

---

### [HIGH-S7] `venues_insert` allows any user to upsert arbitrary venue data

**File:** [sensly/supabase/migrations/001_initial_schema.sql](sensly/supabase/migrations/001_initial_schema.sql#L199-L200)

```sql
create policy "venues_insert" on venues for insert with check (auth.uid() is not null);
```

There is no UPDATE policy, yet `upsertVenue` in the store uses `.upsert()` which
requires an UPDATE-capable path via `onConflict`. Supabase's `.upsert()` route
falls through to `INSERT ... ON CONFLICT DO UPDATE`, which **bypasses the insert
check** and updates the row. Any authenticated user can overwrite a venue's
`avg_noise_db`, `avg_lighting`, etc. with fabricated values.

**Proposed fix:** Add a strict UPDATE policy allowing only admins, or use a stored procedure that validates contributor identity.

---

## 2. Bugs

---

## 3. Frontend / Backend Separation

---

### [HIGH-FS1] Rating submission bypasses the store — direct Supabase call in ManualRatingScreen

**File:** [sensly/src/screens/rating/ManualRatingScreen.tsx](sensly/src/screens/rating/ManualRatingScreen.tsx#L115)

```ts
const { error: dbError } = await supabase.from('ratings').insert(payload);
```

This is the only mutation in the app that doesn't go through a Zustand store. It
means there's no central place to add optimistic updates, offline queuing, or
re-fetch of related state (e.g., the venue's aggregate scores). It also makes the
screen impossible to test without a live Supabase connection.

**Proposed fix:** Add `submitRating(payload)` to `venueStore.ts` (or a new
`ratingsStore.ts`) and call it from the screen.

---

### [MEDIUM-FS3] VenueDetailScreen and JournalScreen make direct Supabase reads

**Files:**
- [sensly/src/screens/venue/VenueDetailScreen.tsx](sensly/src/screens/venue/VenueDetailScreen.tsx#L59-L65)
- [sensly/src/screens/journal/JournalScreen.tsx](sensly/src/screens/journal/JournalScreen.tsx#L63-L88)

Both screens query the `ratings` table directly with `supabase.from('ratings').select(...)`.
These are currently read-only so the risk is lower, but they can't be cached, deduplicated,
or stubbed in tests. They also don't go through the RLS-verified user check that the stores
perform.

**Proposed fix:** Create a `useRatings(userId, since)` hook that encapsulates the query and
can be mocked in tests.

---

## 4. Test Gaps

---

### [HIGH-T1] Zustand stores have zero tests

**Files:** `src/stores/authStore.ts`, `profileStore.ts`, `venueStore.ts`, `settingsStore.ts`

The stores contain the most critical business logic: auth state machine, profile
creation fallback, venue bounding-box query, settings hydration gate. None of it is
tested.

**Proposed fix:** Add Jest unit tests using `zustand/testing` or by calling store
actions directly with a mocked Supabase client via `jest.mock('../lib/supabase')`.
Key cases:
- `signIn` sets session on success, sets error string on failure
- `fetchProfile` creates a default profile when none exists (PGRST116 path)
- `settingsStore` `onboardingCompletedForUserId` gates the navigator correctly
- `selectEffectiveNoiseThreshold` returns the override when set, falls back to profile

---

### [HIGH-T2] Edge functions have zero tests

**Files:** `supabase/functions/generate-insights/`, `detect-patterns/`, `moderate-comment/`

The LLM prompt construction, template fallback logic, pattern detection thresholds, and
comment moderation blocklist are all untested.

**Proposed fix:** Write Deno tests (`Deno.test`) for:
- `generateFromTemplates` — each insight type
- `countStreak` — streak of 0, 1, and broken streak
- Pattern detection with mocked Supabase responses
- `BLOCKED_TERMS` matcher in `moderate-comment`

---

### [HIGH-T3] Core utility functions `computeRiskScore`, `riskToMood`, `riskToLevel` are not tested

**File:** [sensly/src/lib/sensoryUtils.ts](sensly/src/lib/sensoryUtils.ts#L140-L167)

`dbToScore` and `weightedOverallScore` are tested. The live-sensing functions that
drive the dashboard and determine when the axolotl turns "stressed" are not.

**Proposed fix:** Add to `sensoryUtils.test.ts`:
```ts
describe('computeRiskScore', () => {
  it('returns 0 for silence and stillness', () => expect(computeRiskScore(0, 0)).toBe(0));
  it('clamps to 100', () => expect(computeRiskScore(200, 200)).toBe(100));
  it('uses crowding path when opts provided', () => expect(computeRiskScore(75, 0, { crowding: 3 })).toBeGreaterThan(0));
});
describe('riskToMood', () => {
  it('returns stressed above 75', () => expect(riskToMood(76)).toBe('stressed'));
  it('returns happy at 35', () => expect(riskToMood(35)).toBe('thinking'));
});
```

---

### [MEDIUM-T4] No tests for hooks (`useAudioMeter`, `useGeolocation`, `useMotionSensor`, `useWeeklyInsights`)

These hooks contain permission handling, hardware API calls, and state machines that
are hard to debug once broken. No tests exist for permission-denied paths, cleanup on
unmount, or the weekly-insights deduplication logic.

**Proposed fix:** Use `@testing-library/react-hooks` with mocked `expo-av`,
`expo-location`, and `expo-sensors` to test the state transitions.

---

### [MEDIUM-T5] No tests for `overpass.ts` — particularly the cache and malformed-response paths

**File:** [sensly/src/lib/overpass.ts](sensly/src/lib/overpass.ts)

The Overpass cache (5-min TTL, 111m grid key) is untested. A stale cache, a network
error, or an Overpass API format change would silently return wrong results.

**Proposed fix:** Mock `fetch` in Jest and test:
- Cache hit path (no second network call)
- Cache miss after TTL
- Response missing `elements` key
- Element with no `tags.name` is filtered out

---

### [LOW-T6] No end-to-end or integration tests

There are no Detox or Playwright tests for the critical user paths:
- Sign up → onboarding → map load
- Tap a pin → rate a venue → confirmation
- Journal → weekly insights fetch

---

## 5. Performance

---

### [MEDIUM-P3] VenueDetailScreen fetches up to 100 raw rating rows just to build a heatmap

**File:** [sensly/src/screens/venue/VenueDetailScreen.tsx](sensly/src/screens/venue/VenueDetailScreen.tsx#L59-L65)

```ts
const { data } = await supabase
  .from('ratings')
  .select('day_of_week, time_of_day, noise_db')
  .eq('venue_id', venueId)
  .order('created_at', { ascending: false })
  .limit(100);
```

The heatmap and radar only need aggregated counts per `(day_of_week, time_of_day)`
bucket, not 100 raw rows. This is wasteful and will get slower as venues accumulate
ratings.

**Proposed fix:** Use a Supabase RPC or a materialized view that pre-aggregates
`(day_of_week, time_of_day, avg(noise_db), count(*))` per venue.

---

### [LOW-P4] `lightHistory` and `tempHistory` sparklines are initialized but never updated

**File:** [sensly/src/screens/dashboard/DashboardScreen.tsx](sensly/src/screens/dashboard/DashboardScreen.tsx#L156-L194)

```ts
const lightHistory = useRef<number[]>(Array(12).fill(lightEstimate));
const tempHistory  = useRef<number[]>(Array(12).fill(tempEstimate));
```

Unlike `soundHistory` and `motionHistory`, these refs are never pushed into when
`lightEstimate` or `tempEstimate` change. The light and temperature sparklines always
display a flat line.

**Proposed fix:**
```ts
useEffect(() => {
  lightHistory.current = [...lightHistory.current.slice(1), lightEstimate];
}, [lightEstimate]);

useEffect(() => {
  tempHistory.current = [...tempHistory.current.slice(1), tempEstimate];
}, [tempEstimate]);
```

---

## 6. Architecture & Style

---

### [MEDIUM-A5] JournalScreen hard-codes color values outside the theme system

**File:** [sensly/src/screens/journal/JournalScreen.tsx](sensly/src/screens/journal/JournalScreen.tsx#L299-L510)

Over 20 hard-coded hex values (`'#183844'`, `'#426773'`, `'#5d7b86'`, etc.) appear in
`JournalScreen`'s StyleSheet, bypassing the `colors` theme object imported from
`constants/theme.ts`. This makes theming, colorblind mode, and dark mode impossible to
apply uniformly.

**Proposed fix:** Map these to named tokens in `theme.ts` and reference them via
`colors.textPrimary`, `colors.textSecondary`, etc.

---

### [LOW-A7] `DashboardScreen` casts navigation to `any`

**File:** [sensly/src/screens/dashboard/DashboardScreen.tsx](sensly/src/screens/dashboard/DashboardScreen.tsx#L197)

```ts
navigation.navigate('CurrentSense' as any, { ... });
```

`CurrentSense` is defined in `AppRootParamList` but the Dashboard is mounted inside
the Tab navigator whose type doesn't include root-stack screens. The correct fix is to
use `useNavigation` with the root stack type, not `as any`.

**Proposed fix:**
```ts
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<AppRootParamList>
>;
const navigation = useNavigation<DashboardNav>();
```

---

### [LOW-A8] `seed data` migration clears venues with `delete from venues where is_home = false OR is_home is null`

**File:** [sensly/supabase/migrations/004_slo_seed_data.sql](sensly/supabase/migrations/004_slo_seed_data.sql#L8)

```sql
delete from venues where is_home = false or is_home is null;
```

This deletes **all non-home venues** whenever the seed migration is re-run, including
any user-contributed venues that accumulated in production. Migrations should be
additive and idempotent.

**Proposed fix:** Use `INSERT ... ON CONFLICT (osm_id) DO NOTHING` or `DO UPDATE` for
the seed rows, and never run a destructive `DELETE` in a numbered migration.

---

## Summary Table

| ID | Priority | Category | File(s) | One-liner |
|----|----------|----------|---------|-----------|
| S7 | HIGH | Security | `001_initial_schema.sql` | Venue upsert allows score fabrication |
| FS1 | HIGH | Separation | `ManualRatingScreen.tsx` | Rating insert bypasses store |
| FS3 | MEDIUM | Separation | `VenueDetailScreen.tsx`, `JournalScreen.tsx` | Direct Supabase reads skip cache layer |
| T1 | HIGH | Tests | `src/stores/` | Zero tests for all Zustand stores |
| T2 | HIGH | Tests | `supabase/functions/` | Zero tests for all edge functions |
| T3 | HIGH | Tests | `sensoryUtils.ts` | Live-sensing functions untested |
| T4 | MEDIUM | Tests | `src/hooks/` | No hook tests — permission-denied paths untested |
| T5 | MEDIUM | Tests | `overpass.ts` | Cache TTL and malformed-response paths untested |
| T6 | LOW | Tests | — | No E2E or integration tests |
| P3 | MEDIUM | Perf | `VenueDetailScreen.tsx` | Fetches 100 raw rows for a heatmap |
| P4 | LOW | Perf | `DashboardScreen.tsx` | Light/temp sparklines never update |
| A5 | MEDIUM | Arch | `JournalScreen.tsx` | 20+ hard-coded colors bypass theme system |
| A7 | LOW | Arch | `DashboardScreen.tsx` | `as any` navigation cast hides type error |
| A8 | LOW | Arch | `004_slo_seed_data.sql` | Destructive `DELETE` in numbered migration |

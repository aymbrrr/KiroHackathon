# Sensly Test Plan

## Overview

Tests live under `sensly/src/test/`, mirroring the `src/` directory structure. The project uses **jest-expo** (Jest 29 + `jest-expo` preset) with `@testing-library/react-native` for component tests. All native modules (expo-av, expo-location, expo-secure-store, expo-haptics, expo-sensors, react-native-maps) are mocked at the module level.

---

## Directory Structure

```
sensly/src/test/
  lib/
    sensoryUtils.test.ts        ← extends existing __tests__
    validation.test.ts          ← extends existing __tests__
    overpass.test.ts
    secureStorage.test.ts
  stores/
    authStore.test.ts
    profileStore.test.ts
    venueStore.test.ts
    settingsStore.test.ts
  hooks/
    useAudioMeter.test.ts
    useGeolocation.test.ts
    useMotionSensor.test.ts
    useWeeklyInsights.test.ts
  components/
    sensing/
      SensoryBudgetBanner.test.tsx
    rating/
      SensorySlider.test.tsx
    map/
      VenuePin.test.tsx
    shared/
      ScaledText.test.tsx
  constants/
    sensoryScales.test.ts
```

> Note: The existing `src/lib/__tests__/` files are kept as-is. The new `src/test/lib/` files extend coverage with edge cases and security tests not covered there.

---

## Test Files — Detailed Spec

---

### `lib/sensoryUtils.test.ts`

**Purpose:** Full coverage of scoring, risk, and pin-style logic. Extends the existing `__tests__/sensoryUtils.test.ts`.

| Test | What it checks |
|------|---------------|
| `dbToScore` boundary: exactly 40 | Returns 2 (not 1) |
| `dbToScore` boundary: exactly 55 | Returns 3 (not 2) |
| `dbToScore` boundary: exactly 70 | Returns 4 (not 3) |
| `dbToScore` boundary: exactly 85 | Returns 5 (not 4) |
| `dbToScore` negative dB | Returns 1 (clamps to very quiet) |
| `dbToScore` 0 dB | Returns 1 |
| `dbToScore` 200 dB | Returns 5 |
| `weightedOverallScore` partial data re-normalizes | Only noise + lighting → weights sum to 1.0 |
| `weightedOverallScore` all dimensions at 1 | Returns 1.0 |
| `weightedOverallScore` all dimensions at 5 | Returns 5.0 |
| `weightedOverallScore` noise dominates (35%) | Loud noise + calm everything else → score > 3 |
| `scoreToPinStyle` boundary: exactly 2.4 | calm |
| `scoreToPinStyle` boundary: exactly 2.5 | moderate |
| `scoreToPinStyle` boundary: exactly 3.4 | moderate |
| `scoreToPinStyle` boundary: exactly 3.5 | loud |
| `computeRiskScore` clamps to 0 | Negative inputs → 0 |
| `computeRiskScore` clamps to 100 | Very high inputs → 100 |
| `computeRiskScore` with crowding opts | Uses noise+crowding formula, not sound*0.45 |
| `computeRiskScore` without opts | Uses sound*0.45 + motion*0.25 formula |
| `riskToMood` boundaries | 35→happy, 36→thinking, 55→thinking, 56→alert, 75→alert, 76→stressed |
| `riskToLevel` returns correct colors | Matches hex values in source |

**Edge cases / security:**
- `dbToScore` with `NaN` — should not throw, returns a valid score (or document behavior)
- `weightedOverallScore` with `avg_noise_db: 0` — treated as valid (0 dB is a real reading, not null)
- `computeRiskScore` with `Infinity` — clamps to 100

---

### `lib/validation.test.ts`

**Purpose:** Security-critical. All user input passes through here before hitting Supabase.

| Test | What it checks |
|------|---------------|
| `validate.text` strips zero-width chars | `\u200B`, `\u200C`, `\u200D`, `\u202A`–`\u202E` removed |
| `validate.text` strips RTL override | `\u202E` (right-to-left override) removed |
| `validate.text` strips BOM | `\uFEFF` removed |
| `validate.text` preserves normal unicode | Emoji, accented chars, CJK kept |
| `validate.text` default maxLength 500 | 501-char string truncated to 500 |
| `validate.text` custom maxLength | Respected |
| `validate.text` empty string | Returns `""` |
| `validate.rating` rejects 0 | Throws |
| `validate.rating` rejects 6 | Throws |
| `validate.rating` rejects negative | Throws |
| `validate.rating` rejects float 5.5 | Throws (rounds to 6, then throws) |
| `validate.rating` accepts float 4.5 | Returns 5 (rounds to 5) |
| `validate.db` rejects NaN | Throws |
| `validate.db` rejects Infinity | Clamps to 140 |
| `validate.db` rejects -Infinity | Clamps to 0 |
| `validate.db` rejects string | Throws (TypeScript guard) |
| `validate.noiseThreshold` boundary 30 | Accepts |
| `validate.noiseThreshold` boundary 100 | Accepts |
| `validate.noiseThreshold` 29 | Throws |
| `validate.noiseThreshold` 101 | Throws |
| `validate.diagnosisTag` case-insensitive | `"AUTISM"`, `"Autism"` → `"autism"` |
| `validate.diagnosisTag` whitespace | `" autism "` → `"autism"` |
| `validate.diagnosisTag` SQL injection attempt | `"autism'; DROP TABLE profiles;--"` → throws |
| `validate.diagnosisTag` XSS attempt | `"<script>alert(1)</script>"` → throws |
| `validate.diagnosisTags` empty array | Returns `[]` |
| `validate.diagnosisTags` mixed valid/invalid | Throws on first invalid |
| `validate.lat` boundary -90 | Accepts |
| `validate.lat` boundary 90 | Accepts |
| `validate.lat` -91 | Throws |
| `validate.lat` 91 | Throws |
| `validate.lng` boundary -180 | Accepts |
| `validate.lng` boundary 180 | Accepts |
| `validate.lng` -181 | Throws |
| `validate.lng` 181 | Throws |

**Critical security notes:**
- The text sanitizer strips Unicode control characters that could be used for bidirectional text attacks (CVE-class: visual spoofing)
- Diagnosis tag whitelist prevents injection of arbitrary strings into the DB
- Supabase uses parameterized queries, but app-layer validation is defense-in-depth

---

### `lib/overpass.test.ts`

**Purpose:** Verify Overpass API integration, caching, and error handling. Uses `global.fetch` mock.

| Test | What it checks |
|------|---------------|
| Returns cached result on second call | `fetch` called only once for same lat/lng |
| Cache key rounds to 3 decimal places | `35.2801` and `35.2804` share a cache key |
| Cache expires after 5 minutes | After `Date.now` + 5min+1ms, re-fetches |
| Filters out unnamed nodes | Nodes without `tags.name` excluded |
| Maps `amenity` to category | `amenity: "cafe"` → `category: "cafe"` |
| Maps `shop` to category | `shop: "supermarket"` → `category: "supermarket"` |
| Builds address from housenumber + street | `addr:housenumber: "123"`, `addr:street: "Main St"` → `"123 Main St"` |
| Omits address when missing | No address field if tags absent |
| Throws on non-200 response | `fetch` returns 500 → throws `Error` |
| Handles empty elements array | Returns `[]` |
| osm_id format | `"node/12345"` |

**Edge cases:**
- Concurrent calls for same key — only one fetch fires (cache hit on second)
- `lat`/`lng` at 0,0 — valid, not treated as falsy

---

### `lib/secureStorage.test.ts`

**Purpose:** Verify the secure storage wrapper and Supabase adapter. Security-critical.

| Test | What it checks |
|------|---------------|
| `setItem` calls `SecureStore.setItemAsync` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Keychain access level enforced |
| `getItem` delegates to `SecureStore.getItemAsync` | Returns value |
| `getItem` returns null for missing key | Not undefined |
| `removeItem` calls `SecureStore.deleteItemAsync` | Correct key passed |
| `supabaseSecureStorageAdapter` has `getItem`, `setItem`, `removeItem` | Supabase-compatible shape |
| Adapter methods delegate to `secureStorage` | Same underlying calls |

**Security notes:**
- `WHEN_UNLOCKED_THIS_DEVICE_ONLY` prevents tokens from being accessible in device backups or when locked — this must not be changed
- Test explicitly asserts the access level option is passed, not just that the call succeeds

---

### `stores/authStore.test.ts`

**Purpose:** Auth state machine — sign in, sign up, sign out, error handling.

Mocks: `../lib/supabase` (mock `supabase.auth.*`)

| Test | What it checks |
|------|---------------|
| Initial state | `session: null`, `user: null`, `isLoading: false`, `error: null` |
| `setSession(session)` | Updates `session` and `user` |
| `setSession(null)` | Clears both |
| `signIn` success | Sets `isLoading: true` then `false`, no error |
| `signIn` failure | Sets `error` to Supabase error message, `isLoading: false` |
| `signUp` success | `isLoading: false`, no error (email confirmation pending) |
| `signUp` failure | Sets `error`, `isLoading: false` |
| `signOut` | Calls `supabase.auth.signOut`, clears session/user |
| `clearError` | Resets `error` to null |
| `isLoading` is true during async ops | Checked mid-flight |

**Edge cases:**
- `signIn` with empty email/password — Supabase returns error, store surfaces it
- Concurrent `signIn` calls — second call doesn't corrupt state

---

### `stores/profileStore.test.ts`

**Purpose:** Profile CRUD, daily threshold override, and the `selectEffectiveNoiseThreshold` selector.

Mocks: `../lib/supabase`

| Test | What it checks |
|------|---------------|
| `selectEffectiveNoiseThreshold` with no profile, no override | Returns 65 (default) |
| `selectEffectiveNoiseThreshold` with profile, no override | Returns `profile.noise_threshold` |
| `selectEffectiveNoiseThreshold` with override | Returns override, ignores profile value |
| `setDailyOverride(null)` | Clears override, falls back to profile |
| `fetchProfile` success | Sets `profile`, clears `isLoading` |
| `fetchProfile` creates default on PGRST116 | Inserts default profile |
| `fetchProfile` other error | Sets `error` |
| `fetchProfile` no user | Sets `profile: null` |
| `saveProfile` updates existing | Calls `supabase.from('profiles').update()` |
| `saveProfile` creates new when no profile | Calls `supabase.from('profiles').insert()` |
| `clear` | Resets all state |

**Edge cases:**
- `setDailyOverride(0)` — 0 is a valid threshold (though unusual), should not be treated as falsy
- `saveProfile` with empty object `{}` — should not crash

---

### `stores/venueStore.test.ts`

**Purpose:** Venue fetching, caching, rating submission.

Mocks: `../lib/supabase`, `../lib/sensoryUtils`

| Test | What it checks |
|------|---------------|
| `fetchNearbyFromDB` success | Populates `nearbyVenues` and `venueCache` |
| `fetchNearbyFromDB` error | Sets `error`, `isLoading: false` |
| `fetchNearbyFromDB` bounding box math | `latDelta = radiusKm / 111` |
| `getVenueById` cache hit | Returns cached, no Supabase call |
| `getVenueById` cache miss | Fetches from Supabase, caches result |
| `getVenueById` not found | Returns null |
| `upsertVenue` success | Adds to cache |
| `upsertVenue` failure | Returns null |
| `submitRating` success | Busts venue cache for that venue_id |
| `submitRating` failure | Returns `{ error: message }` |
| `clearError` | Resets error |

**Edge cases:**
- `fetchNearbyFromDB` with `radiusKm = 0` — bounding box collapses to a point, still valid
- `submitRating` for a venue not in cache — no crash (delete on non-existent key is safe)

---

### `stores/settingsStore.test.ts`

**Purpose:** Settings persistence, hydration flag, onboarding tracking.

Mocks: `@react-native-async-storage/async-storage`

| Test | What it checks |
|------|---------------|
| Initial state | All defaults correct |
| `setUiMode('support')` | Updates `uiMode` |
| `setColorBlindMode('deuteranopia')` | Updates `colorBlindMode` |
| `setTextSizeMode('large')` | Updates `textSizeMode` |
| `setOnboardingComplete(userId)` | Sets `onboardingCompletedForUserId` |
| `resetOnboarding` | Sets to null |
| `setHasHydrated(true)` | Sets `_hasHydrated: true` |
| `_hasHydrated` not persisted | Not in `partialize` output |
| Persist key is `'sensly-settings-v2'` | Correct storage key |

**Edge cases:**
- `setOnboardingComplete('')` — empty string is falsy but technically valid; store should accept it
- Multiple `setUiMode` calls — last one wins

---

### `hooks/useAudioMeter.test.ts`

**Purpose:** Audio meter hook — permission flow, dBFS→dBSPL conversion, start/stop lifecycle.

Mocks: `expo-av` (`Audio.getPermissionsAsync`, `Audio.requestPermissionsAsync`, `Audio.Recording.createAsync`, `Audio.setAudioModeAsync`)

| Test | What it checks |
|------|---------------|
| Initial state | `db: 0`, `isListening: false`, `permissionGranted: null`, `error: null` |
| `start()` permission denied | Returns `false`, sets `permissionGranted: false`, sets error |
| `start()` permission granted | Returns `true`, sets `isListening: true` |
| `start()` stops existing recording first | `stopAndUnloadAsync` called if recording exists |
| dBFS → dBSPL conversion: -60 dBFS | `clampDb(-60) = max(30, min(100, -60+90)) = 30` |
| dBFS → dBSPL conversion: 0 dBFS | `clampDb(0) = max(30, min(100, 90)) = 90` |
| dBFS → dBSPL conversion: -100 dBFS | Clamps to 30 |
| dBFS → dBSPL conversion: 10 dBFS | Clamps to 100 |
| `stop()` with no recording | Returns null |
| `stop()` computes avg/peak/min | Correct math over sample array |
| `stop()` with empty readings | Returns null |
| `stop()` resets audio mode | `setAudioModeAsync({ allowsRecordingIOS: false })` called |

**Edge cases:**
- `start()` called twice without `stop()` — second call stops first recording
- `stop()` called while not recording — no crash

---

### `hooks/useGeolocation.test.ts`

**Purpose:** GPS permission flow, position updates, cleanup.

Mocks: `expo-location`

| Test | What it checks |
|------|---------------|
| Initial state | `position: null`, `permissionGranted: null`, `isLoading: false` |
| On mount, permission already granted | Starts watch without prompting |
| On mount, permission denied | Sets `permissionGranted: false`, no watch |
| `requestPermission` denied | Sets error message, no watch |
| `requestPermission` granted | Calls `getCurrentPositionAsync` then `watchPositionAsync` |
| Position update from watch | Updates `position` with lat/lng/accuracy |
| Cleanup on unmount | `watchRef.current.remove()` called |

**Edge cases:**
- `getCurrentPositionAsync` throws (GPS off) — sets error, does not crash
- `accuracy: null` — valid, passed through as-is

---

### `hooks/useMotionSensor.test.ts`

**Purpose:** DeviceMotion subscription, availability check.

Mocks: `expo-sensors`

| Test | What it checks |
|------|---------------|
| Returns `isAvailable: false` on simulator | Matches expo-sensors mock behavior |
| Subscribes to DeviceMotion on mount | `DeviceMotion.addListener` called |
| Unsubscribes on unmount | Subscription removed |
| Motion data updates state | `motionLevel` computed from acceleration |

---

### `hooks/useWeeklyInsights.test.ts`

**Purpose:** Weekly insights check — once-per-session guard, Supabase calls, notification scheduling.

Mocks: `../lib/supabase`, `expo-notifications`, `react-native` (AppState)

| Test | What it checks |
|------|---------------|
| No user → no Supabase call | Early return |
| Insights already exist → no generation | `functions.invoke` not called |
| No insights → calls `generate-insights` | Edge function invoked |
| Successful generation → schedules notification | `scheduleNotificationAsync` called with correct content |
| Failed generation → no notification | No crash |
| `checkedThisSession` prevents double-check | Second mount doesn't re-check |
| AppState `active` event resets guard | Re-checks on foreground |

**Edge cases:**
- `data.insights` is empty array → no notification
- `data.insights[0].text` is undefined → uses fallback body text

---

### `components/sensing/SensoryBudgetBanner.test.tsx`

**Purpose:** Banner visibility, haptic behavior, dismiss, 30-second cooldown.

Mocks: `expo-haptics`, `../../stores/settingsStore`

| Test | What it checks |
|------|---------------|
| `self` mode: banner never renders | `uiMode: 'self'` → null |
| `support` mode: banner hidden when below threshold | `currentDb < threshold` → not visible |
| `support` mode: banner appears after 5s above threshold | Timer fires, banner visible |
| Haptic fires on alert | `Haptics.impactAsync(Light)` called |
| Haptic is always Light, never Heavy | Asserts `ImpactFeedbackStyle.Light` |
| Dismiss button hides banner | Press ✕ → banner gone |
| 30-second cooldown | Second alert within 30s does not re-show |
| Threshold drop below mid-alert | Timer cleared, no alert |

**Critical (trauma-informed design):**
- Test explicitly asserts `ImpactFeedbackStyle.Light` — never `Medium` or `Heavy`
- No sound is played (no `Audio` calls)

---

### `components/rating/SensorySlider.test.tsx`

**Purpose:** Accessibility, selection state, callback.

| Test | What it checks |
|------|---------------|
| Renders all options | 5 options visible |
| Selected option has `accessibilityState.selected: true` | ARIA state correct |
| Unselected options have `selected: false` | |
| `onChange` called with correct value | Tap option 3 → `onChange(3)` |
| `accessibilityRole="radio"` on each option | Screen reader announces as radio |
| `accessibilityLabel` includes dimension name | `"Noise: Moderate"` |
| `null` value → no option selected | All `selected: false` |

---

### `components/map/VenuePin.test.tsx`

**Purpose:** Colorblind-safe pin rendering, accessibility label.

Mocks: `react-native-maps` (mock `Marker`)

| Test | What it checks |
|------|---------------|
| Score ≤ 2.4 → blue circle | `backgroundColor: '#0077BB'` |
| Score 2.5–3.4 → orange square | `backgroundColor: '#EE7733'` |
| Score ≥ 3.5 → red triangle | `backgroundColor: '#CC3311'` |
| `null` score → moderate (orange) | Default for unknown |
| `accessibilityLabel` includes venue name and level | `"Blue Bottle Coffee — Sensory-friendly"` |
| `onPress` called with venue | Tap → callback with venue object |
| `tracksViewChanges: false` | Performance prop set |

**Colorblind-safety note:** Shape redundancy (circle/square/triangle) is as important as color. Tests verify both.

---

### `components/shared/ScaledText.test.tsx`

**Purpose:** Text scaling respects `textSizeMode` setting.

Mocks: `../../stores/settingsStore`

| Test | What it checks |
|------|---------------|
| `normal` mode → base font size | No scaling applied |
| `large` mode → scaled up | Font size multiplied |
| `xlarge` mode → scaled up more | Larger multiplier |
| Passes through `style` prop | Custom styles merged |
| Renders children | Text content visible |

---

### `constants/sensoryScales.test.ts`

**Purpose:** Verify research-backed constants are not accidentally changed.

| Test | What it checks |
|------|---------------|
| `NOISE_THRESHOLD_DEFAULTS.autism` is 55 | Research: SPARK for Autism (2021) |
| `NOISE_THRESHOLD_DEFAULTS.migraine` is 55 | Phonophobia threshold |
| `NOISE_THRESHOLD_DEFAULTS.ptsd` is 60 | Hypervigilance threshold |
| `NOISE_THRESHOLD_DEFAULTS.adhd` is 65 | Less acute than autism |
| `NOISE_THRESHOLD_DEFAULTS.default` is 65 | Below 70 dB HHF safe limit |
| `LIGHTING_SCALE` has 5 entries | Scores 1–5 |
| `CROWDING_SCALE` has 5 entries | Scores 1–5 |
| `SMELL_SCALE` has 5 entries | Scores 1–5 |
| `PREDICTABILITY_SCALE` has 5 entries | Scores 1–5 |
| `TRIGGER_OPTIONS` has all 5 categories | sound, lighting, smell, texture, unpredictability |

**Why these are tested:** These constants encode clinical research. A refactor that accidentally changes `autism: 55` to `autism: 65` would silently break the product's core safety promise to users.

---

## Mock Strategy

```
__mocks__/
  expo-av.ts              — Audio.Recording.createAsync, getPermissionsAsync
  expo-location.ts        — getForegroundPermissionsAsync, watchPositionAsync
  expo-secure-store.ts    — setItemAsync, getItemAsync, deleteItemAsync
  expo-haptics.ts         — impactAsync
  expo-sensors.ts         — DeviceMotion.addListener, isAvailableAsync
  expo-notifications.ts   — scheduleNotificationAsync
  react-native-maps.ts    — Marker (renders children)
```

Supabase is mocked inline per test file using `jest.mock('../lib/supabase')` to keep each test's mock surface minimal.

---

## What Is NOT Tested Here

- **Screens** — too much native navigation/layout infrastructure; integration tests would require Detox or a full simulator. Screen logic is covered indirectly through store and hook tests.
- **Edge Functions** — Deno runtime, tested separately if at all.
- **Navigation** — RootNavigator wiring is runtime behavior, not unit-testable without a full navigation tree.
- **SVG rendering** — `SensoryRadar`, `TimeHeatmap`, `DbGauge` — pure visual, no logic to unit test.

---

## Running Tests

```bash
# From project root
npm test

# Watch mode
npx jest --watch

# Single file
npx jest src/test/lib/validation.test.ts
```

Test output should show 0 failures. Coverage is not enforced by CI but can be checked with `--coverage`.

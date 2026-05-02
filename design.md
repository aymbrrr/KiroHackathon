# Sensly — Build Plan

> **Source of truth for the hackathon build.**
> Full architecture, schemas, and component detail: `agents/planning/sensoryscout/design/detailed-design.md`
> Requirements Q&A and decisions: `agents/planning/sensoryscout/idea-honing.md`
> Feature summary: `agents/planning/sensoryscout/rough-idea.md`

---

## The Concept

A crowdsourced sensory environment map that uses your phone's microphone to automatically measure venue noise levels, combined with user ratings on lighting, crowding, smell, and predictability. Think Wheelmap for sensory needs — but the phone does half the work.

**Tagline:** "Know before you go. Your phone listens so you can prepare."

---

## Platform

**React Native (Expo)** — single codebase for iOS and Android. Desktop is read-only, not a priority.
Test on device during development using **Expo Go** (scan QR code, no build step needed).

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React Native (Expo managed) | Single codebase iOS + Android |
| Navigation | React Navigation v6 — bottom tab bar | 4 tabs: Map, Search, Followed, Profile |
| State | Zustand | One store per domain |
| Backend | Supabase (Auth + Postgres + RLS + Edge Functions + Realtime) | Free tier sufficient |
| Map | react-native-maps | Apple Maps (iOS) / Google Maps (Android) — free at hackathon scale |
| Microphone | expo-av with `isMeteringEnabled` | Replaces Web Audio API — more reliable on native |
| Offline queue | expo-sqlite | Pending ratings queue locally, sync on reconnect |
| Token storage | expo-secure-store | iOS Keychain / Android Keystore — never AsyncStorage |
| Haptics | expo-haptics | Sensory budget threshold alerts |
| Voice logging | expo-av + expo-speech | On-device transcription, no external API |
| Push notifications | expo-notifications | Venue follow alerts, morning briefing |
| Calendar | expo-calendar | Morning sensory briefing |
| Health data | expo-health / expo-health-connect | Opt-in heart rate context on ratings |
| Localization | react-i18next + expo-localization | English + Spanish; RTL-ready |
| Charts | victory-native | Radar chart, time heatmap |
| Geocoding | Nominatim (free, no key) | 1 req/sec — debounce + cache |
| POI queries | Overpass API (free, no key) | 200m radius, cache per bounding box |
| AI insights | Groq free tier (llama-3) | Weekly journal only — the only LLM call |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native App (Expo)                       │
│                                                                  │
│  React Navigation v6 — Bottom Tab Navigator (4 tabs)            │
│  [Map]   [Search]   [Followed]   [Profile]                       │
│                                                                  │
│  Zustand Stores                                                  │
│  authStore  profileStore  venueStore  queueStore  settingsStore  │
│                                                                  │
│  expo-av    react-native-maps    expo-sqlite    expo-notifications│
│  expo-calendar  expo-speech  Supabase Realtime  expo-secure-store│
└──────────────────────────────┬──────────────────────────────────┘
                               │
              ┌────────────────▼──────────────────┐
              │              Supabase              │
              │  Auth  Postgres  RLS  Edge Fns     │
              │  Realtime  Storage                 │
              └────────────────┬──────────────────┘
                               │
              ┌────────────────▼──────────────────┐
              │          External APIs             │
              │  Nominatim   Overpass   Groq       │
              └───────────────────────────────────┘
```

### Key data flow decisions
- App reads/writes Supabase directly — no separate API layer
- RLS policies enforce all access control at the DB layer — no client-side security logic
- Offline ratings queue in expo-sqlite; sync on network reconnect
- Venue aggregates recalculated by Postgres trigger on each new rating insert
- Comment moderation runs in a Supabase Edge Function before insert
- Learning engine runs as Edge Function via SQL pattern queries — no LLM
- Morning briefing is fully deterministic: calendar + venue score + template string — no LLM
- Journal insights use Groq free tier once per week per user — the only LLM call
- Voice logging transcribed on-device via expo-speech — no external API

---

## Audio Measurement (expo-av)

Replaces Web Audio API. Uses `Audio.Recording` with `isMeteringEnabled: true`.

```typescript
// hooks/useAudioMeter.ts
import { Audio } from 'expo-av';

const { recording } = await Audio.Recording.createAsync(
  { ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true },
  (status) => {
    if (status.metering !== undefined) {
      // status.metering is dBFS (negative, 0 = max)
      // Map: -60 dBFS → 30 dB SPL, 0 dBFS → 90 dB SPL
      const dbSPL = Math.round(Math.max(30, Math.min(100, status.metering + 90)));
      setDb(dbSPL);
    }
  },
  100  // update interval ms
);
```

**dB labels:** < 40 = "Very quiet", 40–54 = "Quiet", 55–69 = "Moderate", 70–84 = "Loud", 85+ = "Very loud — hearing risk"
**Note:** Label readings as relative ("quieter than a busy café"), not absolute SPL — phone mics vary across devices.

---

## Navigation Structure

```
RootNavigator
├── AuthStack
│   ├── WelcomeScreen
│   ├── SignInScreen
│   ├── SignUpScreen
│   └── OnboardingScreen
│       ├── OnboardingModeScreen       — Self / Support toggle
│       ├── OnboardingTriggersScreen   — chip-based trigger selector
│       ├── OnboardingThresholdScreen  — noise comfort slider (40–90 dB)
│       ├── OnboardingHealthScreen     — opt-in HealthKit / Health Connect
│       └── OnboardingReadyScreen
│
└── AppTabs
    ├── Map tab
    │   ├── MapScreen
    │   ├── VenueDetailScreen (modal)
    │   └── RatingFlowScreen (modal stack)
    │       ├── AutoSenseScreen
    │       ├── VoiceLogScreen
    │       ├── ManualRatingScreen
    │       └── RatingConfirmScreen
    ├── Search tab
    ├── Followed tab  (watched venues + Familiar Places)
    ├── Journal tab   (weekly insights, morning briefing, home log)
    └── Profile tab
        ├── ProfileScreen + DailyCheckInModal
        ├── CompanionScreen  ← stretch goal
        └── SettingsScreen (accessibility, language, health)
```

### Self mode vs Support mode

`settingsStore.uiMode` (`'self' | 'support'`) controls:

| Setting | Self mode | Support mode |
|---|---|---|
| Font size | 18sp minimum | Standard |
| Tab labels | Icon only | Icon + label |
| Rating steps | 3 (noise, lighting, crowding) | Full 5 dimensions |
| Sensory budget alert | Haptic only | Haptic + banner |
| Radar chart | Hidden (single key stat) | Shown |
| Daily check-in | Always on app open | Optional |

---

## Database Schema (Supabase)

Full schema with RLS policies and Postgres trigger in `detailed-design.md` section 4. Key tables:

| Table | Purpose |
|---|---|
| `venues` | Crowdsourced venue data + aggregates (maintained by trigger) |
| `ratings` | Individual ratings — `user_id` stored internally, never exposed |
| `profiles` | Sensory profiles — multiple per account, private to owner |
| `comments` | Anonymous venue comments, moderated via Edge Function |
| `venue_follows` | Followed venues + `is_familiar` flag for Familiar Places |
| `user_activity` | Streak tracking + learning engine input |
| `daily_checkins` | Daily threshold overrides ("rough day" mode) |
| `companion_sessions` | Going With Me sessions *(stretch goal)* |
| `journal_insights` | Weekly AI insight cache (Groq, generated once/week) |

**Diagnosis tags** (`profiles.diagnosis_tags`) are GDPR Article 9 special category data:
- Explicit consent required (`diagnosis_consent` boolean must be `true` before storing)
- Encrypted at rest (Supabase AES-256)
- Never exposed in any public-facing query
- Pre-fills research-backed noise thresholds: autism/migraine = 55 dB, PTSD/anxiety = 60 dB, ADHD/general = 65 dB

---

## Component Architecture

```
src/
├── components/
│   ├── map/          MapView, VenuePin (colorblind-safe), VenueBottomSheet,
│   │                 LocationFAB, RecoveryModeFAB
│   ├── venue/        VenueCard, VenueDetail, SensoryRadar, TimeHeatmap,
│   │                 CommentList, CommentInput
│   ├── rating/       RatingFlow, AutoSenseStep, VoiceLogStep,
│   │                 SensorySlider, RatingConfirm
│   ├── sensing/      DbGauge (SVG arc), VenueDetector, SensoryBudgetBanner
│   ├── profile/      ProfileCard, ProfileSwitcher, TriggerChips,
│   │                 DailyCheckIn, StreakIndicator
│   ├── companion/    CompanionSession, CompanionView, ProfileShareCard
│   ├── journal/      WeeklyInsights, SensoryBriefing, HomeLogEntry, InsightCard
│   ├── accessibility/ ColorBlindFilter (color matrix), DyslexiaText
│   └── shared/       SensoryIcon, ScoreChip, OfflineBanner, LoadingState
├── stores/           authStore, profileStore, venueStore, queueStore,
│                     companionStore, settingsStore
├── hooks/            useAudioMeter, useGeolocation, useNearbyVenues,
│                     useOfflineSync, useHealthData, useVoiceLog,
│                     useCompanion, useCalendarBriefing
├── lib/              supabase, secureStorage, validation, nominatim,
│                     overpass, sensoryUtils, learningEngine, i18n, notifications
├── types/            venue, rating, profile, companion, supabase (generated)
└── constants/        sensoryScales, quietHours, triggerOptions, theme
```

**Map pins are colorblind-safe:** blue circle = calm, orange square = moderate, red triangle = loud (shape + color, not color alone).

---

## Zero-Cost API Stack

| Service | Use | Cost |
|---|---|---|
| OpenStreetMap + react-native-maps | Map tiles | Free |
| Nominatim | Reverse geocoding | Free, no key |
| Overpass API | Nearby POI queries | Free, no key |
| Supabase free tier | DB, auth, realtime, edge functions | Free (500MB, 50k rows) |
| expo-av | Microphone measurement | Built-in |
| expo-speech | On-device voice transcription | Built-in |
| Groq free tier (llama-3) | Weekly journal insights only | Free |
| ARASAAC picture symbols | Accessibility icons | CC BY-NC-SA, free |

---

## Security & Privacy Summary

- Auth tokens in expo-secure-store (hardware-backed) — never AsyncStorage
- Diagnosis tags: GDPR Article 9 — explicit consent, encrypted at rest, never public
- All ratings/comments anonymous to other users — `user_id` internal only
- RLS enforces all data access at DB layer
- Screenshot prevention on sensitive screens (expo-screen-capture)
- GDPR rights: access, erasure, rectification, portability
- Input validation + diagnosis tag whitelist in `lib/validation.ts`
- Location: never stored as history — GPS used in-session only, discarded after use

---

## Technical Risks + Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| expo-av dB accuracy across devices | Medium | Label as relative ("quieter than a busy café"), not absolute SPL |
| Nominatim rate limiting (1 req/sec) | Low | Debounce + cache results |
| Overpass API slow for large areas | Medium | Limit radius to 200m, cache per bounding box |
| Supabase free tier limits | None for hackathon | 500MB / 50k rows — more than sufficient |
| react-native-maps offline tiles | Low | Map requires connectivity — show clear offline state |
| Apple HealthKit App Store review | Low-Medium | Requires entitlement justification — straightforward for this use case |
| User declines mic permission | Medium | App works with manual ratings only — mic is enhancement, not requirement |

---

## What Makes This Win

1. **The phone listens for you.** No other sensory mapping app auto-measures noise. Sensly turns the phone into a sensory instrument.
2. **The demo is visceral.** Open the app, the gauge starts moving, the room's noise level appears in real-time. Judges experience the solution, not just hear about it.
3. **It serves 300M+ people.** Autism, ADHD, PTSD, SPD, anxiety, migraine — the audience is enormous and underserved.
4. **Zero-cost stack.** No paid APIs, no billing setup, no API key stress during demo.
5. **Self-improving.** Every rating makes the map better. Classic network effect story for judges.

---

## Out of Scope (v1)

- Home screen widget (requires native WidgetKit — not possible in Expo managed workflow)
- Auto-report on short dwell time (background location — App Store review risk)
- Business owner portal
- Wearable integration
- Offline map tile caching

---

## Key UX Flows

### Flow 1: "What's it like here?" (Rate on Arrival)
1. User opens app → GPS detects location
2. Nominatim reverse-geocodes to nearest venue: "You're at Blue Bottle Coffee"
3. If venue exists: show existing ratings + "Measure now?"
4. If new venue: "First one here! Want to rate it?"
5. User taps "Measure" → expo-av activates → live dB gauge for 30 seconds
6. After measurement: "This venue is 58 dB — quiet conversation level"
7. Rate remaining dimensions (lighting, crowding, smell, predictability) via visual sliders
8. Optional: voice log a note while walking (transcribed on-device)
9. Submit → venue appears on map for all users; queued locally if offline

### Flow 2: "Where should I go?" (Search Before Leaving)
1. User searches or browses map
2. Pins colorblind-safe: blue circle = calm, orange square = moderate, red triangle = loud
3. Tap pin → see radar chart of 5 dimensions + "best time to visit"
4. Filter: "Show only venues under 60 dB" or "My comfort zone only"
5. If user has a sensory profile: venues auto-filtered and scored against their thresholds

### Flow 3: Sensory Budget Warning
1. App is open, mic permission granted → passive dB monitoring
2. Current environment exceeds user's noise threshold → haptic pulse
3. Self mode: haptic only. Support mode: haptic + banner "Current noise: 74 dB — above your comfort level"
4. Tap banner → map filters to nearest quiet-rated venues

### Flow 4: Morning Sensory Briefing
1. expo-calendar reads today's events
2. Edge Function geocodes event locations → looks up venue scores
3. Push notification before user leaves: "Heads up — your 2pm meeting is at a venue rated 72 dB"

---

## 13-Hour Build Timeline

### Hour 0-1: Foundation
- [ ] `npx create-expo-app sensly --template blank-typescript`
- [ ] Install: `react-native-maps @supabase/supabase-js zustand expo-av expo-location expo-sqlite expo-secure-store expo-haptics victory-native react-i18next`
- [ ] Create Supabase project — run SQL schema (venues, ratings, profiles tables + RLS + trigger)
- [ ] Set up react-native-maps centered on user location
- [ ] Basic `useGeolocation` hook with `expo-location`
- [ ] **Checkpoint:** Map loads, GPS dot visible

### Hour 1-3: Audio Measurement Engine ⚡ CRITICAL PATH
- [ ] Build `useAudioMeter.ts` — expo-av with `isMeteringEnabled`, dBFS → dB SPL conversion
- [ ] Build `DbGauge.tsx` — animated SVG arc showing live dB level
- [ ] 30-second measurement flow with countdown timer
- [ ] Map dB to human-readable labels
- [ ] Test on actual phone — verify readings make sense
- [ ] **Checkpoint:** Mic measurement working, gauge animating, readings reasonable

### Hour 3-5: Venue Detection + Map
- [ ] Build `nominatim.ts` — reverse geocode with 1 req/sec debounce
- [ ] Build `overpass.ts` — nearby amenities query, 200m radius, cached
- [ ] Build `VenueDetector.tsx` — "You're at [venue name]" banner
- [ ] Build `VenuePin.tsx` — colorblind-safe markers (shape + color)
- [ ] Build `VenueBottomSheet.tsx` — tap pin → summary card
- [ ] Supabase query: fetch venues within map bounding box
- [ ] **Checkpoint:** Map loads, nearby venues shown as pins, tapping works

### Hour 5-7: Rating Flow
- [ ] Build `SensorySlider.tsx` — visual 1-5 scale with icons
- [ ] Build `RatingFlow.tsx` — step wizard: auto-sense → lighting → crowding → smell → predictability → notes
- [ ] Wire expo-av measurement into rating flow
- [ ] Supabase insert for new rating
- [ ] Postgres trigger recalculates venue aggregates automatically
- [ ] Offline queue: enqueue to expo-sqlite if no connection, flush on reconnect
- [ ] **Checkpoint:** Full rate flow works end-to-end, data appears in Supabase

### Hour 7-9: Venue Detail + Visualization
- [ ] Build `SensoryRadar.tsx` — 5-axis radar chart (victory-native)
- [ ] Build `VenueDetail.tsx` — full page with radar, tags, rating history
- [ ] Build `TimeHeatmap.tsx` — day × time noise grid
- [ ] "Best time to visit" from heatmap
- [ ] Sensory feature tags: "outdoor seating", "no background music", "dim lighting", "quiet zone"
- [ ] **Checkpoint:** Venue detail looks polished, radar renders, time patterns visible

### Hour 9-10.5: Sensory Profile + Filtering
- [ ] Build onboarding: mode select (Self/Support) → trigger chips → noise threshold slider
- [ ] Store profile in Supabase via `profileStore`
- [ ] Filter map pins by profile match — recommendation score applied
- [ ] "My comfort zone only" toggle
- [ ] `SensoryBudgetBanner.tsx` — threshold exceeded alert
- [ ] expo-haptics: gentle pulse on threshold breach
- [ ] Daily check-in modal: "How are you today?" → sets `dailyThresholdOverride`
- [ ] **Checkpoint:** Profile works, map filters dynamically, threshold warning fires

### Hour 10.5-12: Polish + Stretch Features
- [ ] Styling pass: color tokens, typography, spacing, Self vs Support mode differences
- [ ] Colorblind-safe pin shapes confirmed
- [ ] WCAG 2.1 AA contrast check on all text
- [ ] Seed 10-15 sample venues with realistic ratings for demo
- [ ] Empty states, error states (mic denied, GPS unavailable, offline)
- [ ] **If time:** Voice logging in rating notes (expo-av + expo-speech)
- [ ] **If time:** Familiar places (is_familiar flag on venue_follows)
- [ ] **If time:** Anonymous comments on venue detail

### Hour 12-13: Demo Prep
- [ ] Script the 2-minute demo:
  1. "I'm autistic and want a quiet place for lunch"
  2. Map shows colorblind-safe pins filtered to comfort zone
  3. Open Sensly at current location → live dB gauge measures the room
  4. Auto-detects venue → rate it → data appears on map
  5. Show radar chart comparison: "This café vs. that one"
  6. Show time heatmap: "Come Tuesday morning, not Saturday afternoon"
- [ ] Pre-cache demo data for offline resilience
- [ ] Test full flow on phone 3×
- [ ] Prepare context slide: "300M+ people worldwide are neurodivergent. Most can't answer 'what's this place like?' before they get there."

---

## Sensory Profile Schemas

> Full research, trigger findings by diagnosis, and onboarding UX guidelines are in `.kiro/steering/sensory-research.md`. Load that file when implementing recommendation logic, onboarding flows, or AI-generated user-facing content.

---

#### Schema 1: `user_sensory_profile`

Fields capture personal sensory preferences without requiring diagnosis disclosure. All fields are optional — users set only what's relevant to them.

```json
{
  "id": "uuid",
  "created_at": "timestamp",

  "noise": {
    "max_comfortable_db": 65,
    "dislikes_sudden_sounds": true,
    "prefers_consistent_background": false
  },

  "lighting": {
    "sensitivity": "high",
    "dislikes_fluorescent": true,
    "dislikes_flicker": true,
    "preferred_level": "dim"
  },

  "crowding": {
    "max_comfortable_density": "moderate",
    "needs_personal_space": true,
    "dislikes_queues": false
  },

  "smell": {
    "sensitivity": "moderate",
    "triggers": ["strong_food", "cleaning_products", "perfume"]
  },

  "predictability": {
    "importance": "high",
    "needs_layout_preview": true,
    "distressed_by_changes": true
  },

  "exit_visibility": {
    "important": true
  },

  "recovery_space": {
    "needed": true
  },

  "sensory_seeking": {
    "noise": false,
    "movement": false
  },

  "comfort_tools": ["noise_canceling_headphones", "sunglasses", "fidget_tool"],

  "self_reported_diagnoses": {
    "disclosed": ["autism", "ptsd"],
    "other": null
  },

  "onboarding_complete": true,
  "profile_version": 1
}
```

**Field notes:**
- `noise.max_comfortable_db` — maps directly to the auto-measured dB value from the venue rating. The primary filter signal.
- `noise.dislikes_sudden_sounds` — distinguishes consistent background noise (tolerable for many) from unpredictable spikes (universally more distressing). Relevant for PTSD and autism.
- `lighting.dislikes_fluorescent` / `dislikes_flicker` — fluorescent lighting is a top trigger for autism and migraine. Separate from overall brightness preference.
- `predictability.importance` — high-weight field for autism and PTSD users. Maps to venue's `predictability` score and `layout_available` flag.
- `exit_visibility.important` — PTSD-specific need. Maps to venue's `has_visible_exits` flag.
- `self_reported_diagnoses` — entirely optional, never shown to other users, never used for filtering (preferences drive recommendations, not labels). `disclosed` is a multi-select array from a predefined list (`autism`, `adhd`, `ptsd`, `spd`, `anxiety`, `migraine`, `other`). `other` is a free-text field for anything not on the list. If present, the app can use it to surface relevant tips ("Many people with PTSD find venues with visible exits helpful — we've added that to your filters") but it never gates features or changes the core recommendation logic.
- `recovery_space.needed` — maps to venue's `has_quiet_zone` flag.
- `sensory_seeking` — captures ADHD sensory-seeking subtype. A user who seeks noise should not be filtered away from louder venues.
- All sensitivity fields use `"low" | "moderate" | "high"` rather than numeric scales — more intuitive for onboarding.

---

#### Schema 2: `place_sensory_rating`

Aggregated from crowdsourced ratings and auto-measured data. Designed to map directly to user profile fields.

```json
{
  "id": "uuid",
  "venue_id": "uuid",
  "updated_at": "timestamp",
  "rating_count": 47,

  "noise": {
    "avg_db": 62,
    "peak_db": 78,
    "consistency": "moderate",
    "has_background_music": true,
    "music_volume": "low",
    "sudden_sound_risk": "low"
  },

  "lighting": {
    "avg_level": 3,
    "has_fluorescent": true,
    "has_natural_light": true,
    "dimmable_available": false,
    "glare_risk": "low"
  },

  "crowding": {
    "avg_density": 3,
    "has_queues": false,
    "personal_space_rating": 3,
    "peak_hours": ["sat_afternoon", "sun_afternoon"]
  },

  "smell": {
    "avg_intensity": 2,
    "smell_types": ["coffee", "food"]
  },

  "predictability": {
    "avg_score": 4,
    "layout_available": true,
    "layout_url": "https://...",
    "routine_changes": "rare"
  },

  "accessibility": {
    "has_quiet_zone": true,
    "quiet_zone_description": "Back corner seating area",
    "has_visible_exits": true,
    "exit_count": 3,
    "outdoor_seating": true,
    "sensory_bag_available": false,
    "kulturecity_certified": false,
    "nas_autism_friendly": false
  },

  "time_patterns": {
    "quietest_period": "tue_morning",
    "loudest_period": "sat_afternoon",
    "noise_by_slot": {
      "mon_morning": 52,
      "mon_afternoon": 61,
      "sat_afternoon": 74
    }
  },

  "tags": ["outdoor_seating", "no_background_music", "dim_lighting_option", "predictable_layout"]
}
```

**Field notes:**
- `noise.sudden_sound_risk` — derived from rating variance and user notes. High variance = unpredictable noise spikes. Critical for PTSD and autism.
- `noise.consistency` — `"consistent" | "moderate" | "unpredictable"`. Separate from volume level.
- `lighting.has_fluorescent` — boolean flag because fluorescent is a specific trigger, not just a brightness level.
- `predictability.layout_available` + `layout_url` — allows users who need to preview a space to do so before visiting.
- `accessibility.has_quiet_zone` — maps to `recovery_space.needed` in user profile.
- `accessibility.has_visible_exits` — maps to `exit_visibility.important` in user profile.
- `time_patterns.noise_by_slot` — enables "best time to visit" recommendations. Sparse object — only populated slots are stored.
- `tags` — free-text searchable features. Populated from user notes and structured ratings.

---

#### Schema 3: Recommendation Score Logic

The match score between a user profile and a place rating is computed as a weighted penalty system. A perfect match starts at 100 and loses points for each mismatch between user needs and venue conditions.

```
recommendation_score(user, place) → 0–100

HARD FILTERS (disqualify venue entirely if failed):
  - user.noise.max_comfortable_db < place.noise.avg_db  →  exclude
  - user.lighting.sensitivity == "high" AND place.lighting.has_fluorescent == true  →  exclude (unless user has override)
  - user.smell.sensitivity == "high" AND place.smell.avg_intensity >= 4  →  exclude

WEIGHTED PENALTY SCORING (applied after hard filters pass):
  Start at 100.

  Noise penalties:
    - place.noise.avg_db within 5 dB of user.noise.max_comfortable_db  →  -10
    - user.noise.dislikes_sudden_sounds AND place.noise.sudden_sound_risk == "high"  →  -20
    - user.noise.dislikes_sudden_sounds AND place.noise.sudden_sound_risk == "moderate"  →  -10

  Lighting penalties:
    - user.lighting.dislikes_fluorescent AND place.lighting.has_fluorescent  →  -15
    - user.lighting.sensitivity == "high" AND place.lighting.avg_level >= 4  →  -10

  Crowding penalties:
    - user.crowding.max_comfortable_density == "low" AND place.crowding.avg_density >= 4  →  -15
    - user.crowding.needs_personal_space AND place.crowding.personal_space_rating <= 2  →  -10

  Smell penalties:
    - user.smell.sensitivity == "high" AND place.smell.avg_intensity >= 3  →  -10
    - user.smell.triggers contains any of place.smell.smell_types  →  -10

  Predictability penalties:
    - user.predictability.importance == "high" AND place.predictability.avg_score <= 2  →  -20
    - user.predictability.needs_layout_preview AND place.predictability.layout_available == false  →  -5

  Exit/safety penalties:
    - user.exit_visibility.important AND place.accessibility.has_visible_exits == false  →  -15

  BONUSES (add back points for positive features):
    - user.recovery_space.needed AND place.accessibility.has_quiet_zone  →  +10
    - user.predictability.needs_layout_preview AND place.predictability.layout_available  →  +5
    - place.accessibility.outdoor_seating AND user.crowding.needs_personal_space  →  +5
    - place.accessibility.kulturecity_certified  →  +5

  TIME ADJUSTMENT:
    - If user requests a specific time slot, replace place.noise.avg_db with
      place.time_patterns.noise_by_slot[requested_slot] for noise calculations.

  Final score = max(0, 100 - total_penalties + total_bonuses)
  Scores >= 80: "Good match" (green)
  Scores 60–79: "Moderate match" (yellow)
  Scores < 60: "Poor match" (red)
```

**Design rationale:**
- Hard filters prevent recommending venues that will definitely cause distress — no amount of bonuses should override a fluorescent-light allergy or a noise threshold breach.
- Penalty weights are intentionally asymmetric: predictability and sudden sounds carry higher penalties because research shows these are more distressing than consistent-but-loud environments.
- Bonuses are capped and modest — they reward genuinely helpful features without inflating scores for venues that are merely "not bad."
- Time adjustment is the key differentiator: a venue that's 74 dB on Saturday afternoon might be 52 dB on Tuesday morning. The score should reflect when the user is actually going.

---

---

### Privacy & Data Handling

Sensory profiles and diagnosis disclosures are among the most sensitive data a user can share. These rules must be implemented, not just documented.

#### What is private (never leaves the user's account)
- `self_reported_diagnoses` — never exposed via API to other users, never included in aggregated venue data, never used for analytics or targeting
- Full `user_sensory_profile` — other users never see your thresholds, triggers, or comfort tools
- Individual ratings are associated with an anonymous user ID by default — not a name or email

#### What is public (by design)
- Aggregated venue scores (avg_db, avg_lighting, etc.) — these are the crowdsourced map data, always anonymized
- Tags and sensory features on venues — contributed anonymously
- No individual rating is attributable to a specific person in the public-facing UI

#### Implementation rules
- `self_reported_diagnoses` must be stored in a separate table or encrypted column — not bundled with general profile data that might be queried broadly
- Row-level security (RLS) in Supabase: a user can only read and write their own profile row — no admin query should return all profiles in bulk without explicit justification
- Diagnosis data must never be sent to the AI/LLM layer as part of a prompt — only preference fields (noise thresholds, lighting sensitivity, etc.) are passed to recommendation logic
- If the app ever adds social features (sharing profiles with a companion — stretch goal, cut for hackathon), diagnosis fields must be explicitly excluded from the shared payload — share preferences only, never labels
- On account deletion, `self_reported_diagnoses` must be hard-deleted immediately, not soft-deleted or retained in backups beyond 30 days

#### Onboarding disclosure
When the optional diagnosis field is presented in onboarding, show this copy (or equivalent):

> "This is completely optional and only used to surface relevant tips for you. It's never shared with other users, never used to filter your results, and you can remove it any time."

The diagnosis field should appear on its own screen, after the preference questions, clearly framed as optional and separate from the core profile.

#### What the diagnosis field is used for (and only this)
- Surfacing contextual tips: "Many people with PTSD find venues with visible exits helpful — want to add that to your filters?"
- Pre-populating relevant preference toggles during onboarding if the user wants a shortcut
- Nothing else. It does not change recommendation scores, does not gate features, and is not used in any analytics.

#### Location privacy
Location is the most sensitive data this app handles — a history of where someone goes can reveal their medical providers, mental health support, religious practice, and daily routine.

- **Never store raw location history** — the app uses GPS to detect nearby venues and measure the current environment, but precise coordinates must never be logged to the database against a user ID
- **Venue check-ins are anonymous** — when a user rates a venue, store the venue ID and timestamp, not the GPS coordinates of where they were standing
- **No movement tracking** — the app must not record a trail of locations over time. GPS is used in-session only (to center the map and detect nearby venues) and discarded immediately after use
- **"Going with me" location sharing** *(stretch goal — cut for hackathon, implement only if time allows)* — if built, location must be shared peer-to-peer for the duration of the session only, never stored server-side. Session ends when either party closes it. No replay, no history.
- **Geofencing / dwell time detection** (used for auto-report prompts) — dwell time is calculated on-device only. The server receives "user left a venue quickly" as a boolean event, not the coordinates or duration
- **On-device processing first** — any feature that can be computed on-device (nearby venue detection, threshold breach alerts) should be, to minimize what gets transmitted
- **Location permission prompt** — request "while using the app" permission only, never "always on." Explain why in the permission prompt: "To show nearby venues and measure your current environment."
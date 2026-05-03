# Sensly — Idea Summary

> Originally captured from design.md. Updated to reflect all decisions made during PDD Q&A and design sessions.
> For full detail see: detailed-design.md | idea-honing.md | checkpoint.md

---

## The Concept

A crowdsourced sensory environment map that uses your phone's microphone to automatically measure venue noise levels, combined with user ratings on lighting, crowding, smell, and predictability. Think Wheelmap for sensory needs — but the phone does half the work.

**Tagline:** "Know before you go. Your phone listens so you can prepare."

---

## Target Users
- Autistic individuals, people with ADHD, PTSD, sensory processing disorder, anxiety, migraine
- Caregivers and support persons managing sensory needs for others
- Estimated 300M+ people worldwide who are neurodivergent

---

## Core Differentiator
The phone auto-measures ambient noise via microphone — no other sensory mapping app does this.
Manual ratings cover: lighting, crowding, smell, predictability.
The app learns your patterns over time and warns you proactively.

---

## Platform
**Native iOS + Android** via React Native (Expo). Desktop is read-only/not a priority.

---

## Key Features (v1)

### Map & Venues
- Interactive map with colorblind-safe venue pins (blue/circle = calm, orange/square = moderate, red/triangle = loud)
- Nearby venues pulled from OpenStreetMap via Overpass API (free, no key)
- Reverse geocoding via Nominatim (free, no key)
- "Recovery mode" quick filter — one tap shows only quiet, low-stimulation spots nearby

### Auto-Noise Measurement
- Phone mic measures ambient dB via expo-av with `isMeteringEnabled`
- 30-second measurement window with live animated gauge
- Maps dBFS → dB SPL → human-readable label ("quiet conversation level")
- Research-backed thresholds: < 40 dB = very quiet, 55–69 dB = moderate, 85+ dB = hearing risk

### Rating Flow
- Step wizard: auto-sense noise → lighting → crowding → smell → predictability → notes
- Voice logging: speak notes while walking, transcribed on-device
- Self mode: 3 steps only (noise, lighting, crowding)
- Offline-first: ratings queue in SQLite when no connection, sync on reconnect

### Sensory Profile
- Multiple profiles per account (e.g. "My profile", "Jamie's profile")
- Optional self-reported diagnosis tags (autism, ADHD, PTSD, migraine, SPD, anxiety, OCD, dyslexia)
  - GDPR Article 9 special category data — explicit consent required, never shared
  - Pre-fills research-backed noise thresholds: autism/migraine = 55 dB, PTSD/anxiety = 60 dB, ADHD/general = 65 dB
- Trigger preferences: sound, lighting, smell, texture, unpredictability chips
- Daily check-in: "How are you today?" temporarily adjusts thresholds for the day
- Familiar places: mark safe venues, pinned for hard days

### Two UI Modes
- **Self mode**: large text (20sp), icon-only tabs, 3-step rating, haptic-only alerts, high contrast
- **Support mode**: full information density, radar charts, 5-step rating, haptic + banner alerts

### Social & Sharing
- Anonymous comments on venues (moderated via Edge Function)
- Follow venues for push notifications on new ratings
- Share venue via deep link / native share sheet
- Share sensory profile (read-only link) with therapist, parent, or friend — excludes diagnosis tags
- "Going with me" companion mode: real-time dB broadcast to a companion via Supabase Realtime

### Personalization & Learning
- Learning engine detects patterns: "you've left cafes quickly 4 times — heads up"
- Sensory journal: weekly AI-generated insights ("you struggle Fridays in crowded spaces")
- Morning sensory briefing: checks today's calendar events against venue scores, alerts before you leave
- Gentle streak tracking: "🌱 5 days of logging" — no punishment for missing days

### Accessibility (in-app)
- Color blindness filters: deuteranopia, protanopia, tritanopia (CSS color matrix)
- Dyslexia mode: OpenDyslexic font, 1.5× line height, left-aligned, +0.5px letter spacing
- All UI meets WCAG 2.1 AA (4.5:1 contrast minimum); Self mode targets AAA (7:1)
- Reduce motion support, no looping animations, 200ms animation cap

### Health Integration (opt-in)
- Apple HealthKit (iOS) / Google Health Connect (Android)
- Reads heart rate at time of rating for personal context
- Never shared with other users

### Localization
- English + Spanish at launch; RTL-ready architecture

---

## Architecture Decisions

| Decision | Choice |
|---|---|
| Framework | React Native (Expo managed workflow) |
| Navigation | React Navigation v6 — root stack (map + rating modal) → tabs in Step 6+ |
| State management | Zustand (one store per domain) |
| Backend | Pure Supabase — Auth, Postgres, RLS, Edge Functions, Realtime |
| Map | react-native-maps (Apple Maps iOS / Google Maps Android) |
| Microphone | expo-av with isMeteringEnabled |
| Offline queue | expo-sqlite |
| Token storage | expo-sqlite localStorage (via Supabase client) — polyfill applied via `expo-sqlite/localStorage/install` |
| Localization | react-i18next + expo-localization |
| Charts | victory-native |
| Offline maps | Not in scope — map requires connectivity |
| Supabase polyfill | `expo-sqlite/localStorage/install` — must be first import in App.tsx (fixes Hermes URL protocol error) |
| Worklets version | `react-native-worklets@0.5.1` pinned — must match Expo Go SDK 54 bundled version |

---

## Security & Privacy Summary
- Auth tokens in expo-secure-store (hardware-backed encryption), never AsyncStorage
- Diagnosis tags: GDPR Article 9 special category — explicit consent, encrypted at rest, never exposed publicly
- All contributions (ratings, comments, measurements) anonymous to other users
- RLS enforces all data access at the database layer
- Screenshot prevention on sensitive screens (expo-screen-capture)
- GDPR rights implemented: access, erasure, rectification, portability
- Input validation + diagnosis tag whitelist in lib/validation.ts

---

## Zero-Cost API Stack
- OpenStreetMap + react-native-maps (free)
- Nominatim reverse geocoding (free, no key)
- Overpass API POI queries (free, no key)
- Supabase free tier (500MB, 50k rows — sufficient for demo + months of real use)
- expo-av microphone (built-in)
- Web Speech API / @react-native-voice/voice (on-device, free)
- Groq free tier (weekly journal insights only)
- ARASAAC picture symbols (CC BY-NC-SA, free)

---

## Out of Scope (v1)
- Home screen widget (requires native WidgetKit — not possible in Expo managed workflow)
- Auto-report on short dwell time (background location — Apple/Google review risk)
- Business owner portal (venue claiming, official quiet hours)
- Wearable integration (Apple Watch, hearing aids)
- Offline map tile caching

---

## Build Status

| Step | Status | What was built |
|---|---|---|
| 1 | ✅ Done | Scaffold, Supabase schema (2 migrations), `sensoryUtils`, `validation`, `secureStorage`, `theme`, `sensoryScales` |
| 2 | ✅ Done | Auth flow — Welcome, Sign In, Sign Up, `authStore`, `settingsStore`, `RootNavigator` with session restore |
| 3 | ✅ Done | Map screen — GPS, colorblind-safe venue pins, bottom sheet, offline banner, `venueStore`, `overpass.ts` |
| 4 | ✅ Done | Audio engine — `useAudioMeter`, `DbGauge`, `VenueDetector` |
| 5 | ✅ Done | Rating flow — `AutoSenseScreen`, `ManualRatingScreen`, `SensorySlider`, wired into map bottom sheet |
| 6 | ✅ Done | Venue detail — `VenueDetailScreen`, `SensoryRadar` (custom SVG), `TimeHeatmap`, "Full details" + "Rate" buttons |
| 7 | ✅ Done | Sensory profile — `ProfileScreen`, `ProfileEditScreen` (noise slider, lighting, triggers), `SensoryBudgetBanner`, bottom tab bar |
| UI-A | ✅ Done | **Person A UI integration** — `DashboardScreen` (Home tab, live sensors + risk score), `CalmScreen` (4-phase breathing/intervention), `useMotionSensor` (`expo-sensors`), risk/mood utilities in `sensoryUtils.ts`, navigation restructured (Dashboard first, 4 tabs: Home/Map/Calm/Profile) |
| 8–12 | 🔲 | Stretch features (offline queue, social, accessibility modes, health, journal) — Person B scope |

## Person C Placeholders (replace when delivered)
All placeholder locations are marked with `// Person C placeholder` comments:
- `AxolotlSvg` → colored circle + emoji in `DashboardScreen.tsx` and `CalmScreen.tsx`
- Kelp background → teal `View` in `DashboardScreen.tsx` (replace with `<Image source={kelpBg} />`)
- Fredoka font → system font (load via `expo-font` in `App.tsx`, apply to wordmark + labels)
- Frosted glass cards → semi-transparent white (add `backdropFilter` when C delivers)
- Color tokens → still using original blue palette (C updates `theme.ts`)

## Known Issues / Gotchas
- `expo-sqlite/localStorage/install` must be the **first import** in `App.tsx` — fixes Supabase + Hermes URL protocol error
- `react-native-worklets` pinned to `0.5.1` — do not upgrade without checking Expo Go SDK 54 compatibility
- `@gorhom/bottom-sheet` must be v5+ for Reanimated v4 compatibility
- Email confirmation must be disabled in Supabase for development (Auth → Providers → Email → uncheck "Confirm email")
- Always restart with `npx expo start --clear` after `.env` changes
- `victory-native` v41 uses Skia API — do NOT use `VictoryChart`/`VictoryTheme` (web API). Use custom SVG via `react-native-svg` instead
- All imports must be at the top of the file — mid-file imports after function declarations cause duplicate declaration errors
- `expo-sensors` DeviceMotion returns `isAvailable: false` on iOS simulator — Dashboard still works with sound-only risk score

---

## Source Documents
- `design.md` — original build plan
- `idea-honing.md` — full Q&A and decision log
- `checkpoint.md` — pre-design requirements checkpoint
- `design/detailed-design.md` — full architecture, schema, components, security
- `SETUP.md` — setup guide for both team members with current build state

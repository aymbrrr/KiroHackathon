# Sensly

Sensly is a crowdsourced sensory environment map for neurodivergent people. It uses your phone's microphone to automatically measure ambient noise at venues, combined with community ratings on lighting, crowding, smell, and predictability — so you can know what a place *feels like* before you walk in.

Built for autistic individuals, people with ADHD, PTSD, sensory processing disorder, anxiety, and migraine. Estimated 300M+ people worldwide who are neurodivergent have no tool like this today.

---

## What It Does

- **Live noise measurement** — tap Rate at any venue and the app measures ambient dB for 30 seconds using your phone's mic. No special hardware required.
- **Crowdsourced sensory ratings** — community rates lighting, crowding, smell, predictability, temperature, and texture on a 1–5 scale.
- **Sensory map** — colorblind-safe venue pins (blue circle = calm, orange square = moderate, red triangle = loud) on a GPS map of nearby venues.
- **Venue detail** — radar chart of all 6 dimensions, time heatmap showing quietest hours, quiet hours, and a rate CTA.
- **Dashboard** — live sensor cards (sound dB, motion %, estimated light, temperature) combine into a risk score. The axolotl mascot reacts to your sensory state.
- **Calm screen** — 4-phase guided reset: breathing circle → personalized tool picker → timed intervention → success. Tools are ranked by relevance to your specific triggers.
- **Sensory profile** — noise threshold, lighting preference, and trigger chips saved to your account. A daily check-in temporarily adjusts thresholds based on how you're feeling.
- **Journal** — weekly AI-generated insights about your sensory patterns, powered by Groq with a template fallback.
- **Onboarding** — 5-step first-run wizard: purpose + privacy → noise → lighting → triggers → personalized tutorial.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54, managed workflow) |
| Language | TypeScript |
| Navigation | React Navigation v6 — native stack + bottom tabs |
| State | Zustand v5 with AsyncStorage persistence |
| Backend | Supabase — Auth, PostgreSQL, RLS, Edge Functions (Deno), Realtime |
| Maps | react-native-maps + OpenStreetMap Overpass API |
| Audio | expo-av with `isMeteringEnabled` |
| Motion | expo-sensors DeviceMotion |
| Charts | Custom SVG via react-native-svg (radar, heatmap, dB gauge arc) |
| AI | Groq free tier (weekly journal insights) |
| Bottom sheet | @gorhom/bottom-sheet v5 |

---

## Project Structure

```
sensly/                     # React Native app
  src/
    screens/                # All screens (auth, dashboard, map, calm, profile, etc.)
    components/             # Shared components (AxolotlSvg, DbGauge, KelpBackground, etc.)
    hooks/                  # useAudioMeter, useMotionSensor, useGeolocation, useWeeklyInsights
    stores/                 # Zustand stores (auth, profile, settings, venue)
    lib/                    # sensoryUtils, validation, supabase client, secureStorage
    constants/              # theme.ts (design tokens), sensoryScales.ts
    navigation/             # RootNavigator, types
  supabase/
    migrations/             # 7 SQL migrations
    functions/              # 4 Edge Functions
  assets/                   # Images, fonts, icons

agents/planning/sensoryscout/   # PDD planning artifacts
  rough-idea.md                 # Feature list, build status, known issues
  design/detailed-design.md     # Full architecture, schema, security spec
  design/ui-integration-plan.md # Figma integration plan, three-person team split

.kiro/                      # Kiro AI toolchain
  steering/workflow.md      # Conductor rules — delegation format, review gate, git discipline
  steering/sensory-research.md  # Clinical research encoded as implementation constraints
  agents/                   # conductor, librarian, development-workflow-agent configs
  prompts/pdd.md            # Prompt-Driven Development process definition
```

---

## Backend

10 Supabase tables with row-level security, Postgres triggers for aggregate score recalculation, and 4 deployed Edge Functions:

| Function | Purpose |
|---|---|
| `moderate-comment` | Spam filtering before comment insertion |
| `detect-patterns` | SQL-based learning engine — warns users about venues that have affected them before |
| `generate-insights` | Weekly journal insights via Groq with template fallback |
| `notify-followers` | Push notifications when a followed venue gets a new rating |

15 seeded demo venues in San Luis Obispo with realistic sensory ratings and time-of-day noise patterns.

---

## Privacy

- All venue ratings are anonymous — never attributable to an individual
- Location is used in-session only to show nearby venues — never stored
- The microphone measures decibel levels only — no audio is ever recorded or stored
- Sensory preferences stay on your device and are never shared with other users
- Auth tokens stored in hardware-backed secure storage (expo-secure-store), never AsyncStorage
- GDPR rights implemented: access, erasure, rectification, portability

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo`)
- Expo Go app on your phone (iOS or Android)
- A Supabase project (free tier works)

### Setup

```bash
cd sensly
npm install
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
npx expo start --clear
```

Scan the QR code with Expo Go.

### Supabase setup

Run the migrations in order:

```bash
supabase db push
```

Or apply manually from `sensly/supabase/migrations/` in order (001 → 007).

Disable email confirmation in your Supabase project settings for local development.

---

## Research Basis

The recommendation logic, noise thresholds, onboarding UX rules, and AI content guidelines are grounded in published clinical literature including NIH publications, Frontiers in Psychiatry, Cleveland Clinic, and occupational therapy research. Key findings encoded into the product:

- Unpredictable sounds are more distressing than consistently loud noise
- Predictability is as important a venue signal as noise level
- Noise thresholds vary by population: autism/migraine ≈ 55 dB, PTSD/anxiety ≈ 60 dB, ADHD ≈ 65 dB
- Preferences drive all recommendations — diagnosis tags are never used in scoring logic

Full research citations and implementation constraints are in `.kiro/steering/sensory-research.md`.

---

## License

MIT

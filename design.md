# Sensly — Full Build Plan

## The Concept

A crowdsourced sensory environment map that uses your phone's microphone to automatically measure venue noise levels, combined with user ratings on lighting, crowding, smell, and predictability. Think Wheelmap for sensory needs — but the phone does half the work.

**Tagline:** "Monitor. Predict. Prevent."

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React PWA                         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Map     │  │  Venue   │  │  Auto-Sense      │  │
│  │  View    │  │  Detail  │  │  Engine          │  │
│  │ (Leaflet)│  │  + Rate  │  │  (Web Audio API) │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │              │                 │             │
│       └──────────────┼─────────────────┘             │
│                      │                               │
│              ┌───────▼────────┐                      │
│              │  Supabase      │                      │
│              │  - venues      │                      │
│              │  - ratings     │                      │
│              │  - auto_sense  │                      │
│              │  - profiles    │                      │
│              └───────┬────────┘                      │
│                      │                               │
│              ┌───────▼────────┐                      │
│              │  Nominatim /   │                      │
│              │  Overpass API  │                      │
│              │  (free, no key)│                      │
│              └────────────────┘                      │
└─────────────────────────────────────────────────────┘
```

### Key API Decision: Skip Google Places, Use OpenStreetMap

Google Places requires billing setup and has per-request costs. For a hackathon, use:

- **Nominatim** (free, no API key): Reverse geocoding (lat/long → address/venue name)
- **Overpass API** (free, no API key): Query nearby POIs from OpenStreetMap
- **Leaflet + OpenStreetMap tiles** (free): Map rendering

This keeps the entire stack zero-cost and zero-setup.

---

## Web Audio API — dB Measurement Pipeline

This is the core technical differentiator. Here's exactly how it works:

### Step 1: Request Microphone Access
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: { 
    echoCancellation: false, 
    noiseSuppression: false, 
    autoGainControl: false  // Critical: disable AGC for accurate readings
  } 
});
```

### Step 2: Create Audio Processing Chain
```javascript
const audioContext = new AudioContext();
const source = audioContext.createMediaStreamSource(stream);
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8;
source.connect(analyser);
// Do NOT connect to destination — we listen, not play
```

### Step 3: Calculate dB Level (runs in requestAnimationFrame loop)
```javascript
const dataArray = new Uint8Array(analyser.frequencyBinCount);

function measureLevel() {
  analyser.getByteTimeDomainData(dataArray);
  
  // RMS calculation
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const normalized = (dataArray[i] - 128) / 128;
    sum += normalized * normalized;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  
  // Convert to dBFS
  const dbfs = 20 * Math.log10(Math.max(rms, 0.00001));
  
  // Estimate dB SPL (approximate — phone mics vary)
  // Most phone mics clip around 90-100 dB SPL
  // -60 dBFS ≈ 30 dB SPL (quiet room)
  // 0 dBFS ≈ 90 dB SPL (very loud)
  const dbSPL = Math.round(Math.max(30, Math.min(100, dbfs + 90)));
  
  return dbSPL;
}
```

### Step 4: 30-Second Measurement Window
```javascript
function runMeasurement(onComplete) {
  const readings = [];
  const duration = 30000; // 30 seconds
  const start = Date.now();
  
  function tick() {
    readings.push(measureLevel());
    if (Date.now() - start < duration) {
      requestAnimationFrame(tick);
    } else {
      const avg = Math.round(readings.reduce((a, b) => a + b) / readings.length);
      const peak = Math.max(...readings);
      const min = Math.min(...readings);
      onComplete({ avg, peak, min, samples: readings.length });
    }
  }
  tick();
}
```

### What the User Sees
- Live dB gauge animating in real-time during measurement
- After 30 seconds: "This venue is currently **62 dB** — moderate conversation level"
- Auto-translated to sensory rating: 30-40 dB = "Very quiet", 40-55 dB = "Quiet", 55-70 dB = "Moderate", 70-85 dB = "Loud", 85+ dB = "Very loud — hearing risk"

---

## Rating Schema

### Venue Record (Supabase `venues` table)
```sql
create table venues (
  id uuid primary key default gen_random_uuid(),
  osm_id text,                    -- OpenStreetMap reference
  name text not null,
  category text,                  -- restaurant, cafe, store, clinic, theater...
  lat numeric not null,
  lng numeric not null,
  address text,
  avg_noise_db numeric,           -- rolling average from auto-sense
  avg_lighting numeric,           -- 1-5 user rating
  avg_crowding numeric,           -- 1-5 user rating
  avg_smell numeric,              -- 1-5 user rating
  avg_predictability numeric,     -- 1-5 user rating
  total_ratings integer default 0,
  quiet_hours jsonb,              -- e.g. [{"day": "tue", "start": "18:00", "end": "20:00", "label": "Quiet hour"}]
  sensory_features jsonb,         -- e.g. ["dim lighting available", "outdoor seating", "no background music"]
  created_at timestamptz default now()
);
```

### Individual Rating (Supabase `ratings` table)
```sql
create table ratings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  user_id uuid,                   -- anonymous or authenticated
  noise_db numeric,               -- auto-measured
  noise_manual integer,           -- 1-5 manual override
  lighting integer,               -- 1-5: 1=very dim, 5=harsh fluorescent
  crowding integer,               -- 1-5: 1=empty, 5=packed
  smell integer,                  -- 1-5: 1=none, 5=overwhelming
  predictability integer,         -- 1-5: 1=chaotic, 5=very predictable
  time_of_day text,               -- morning, afternoon, evening, night
  day_of_week integer,            -- 0-6
  notes text,                     -- "has a quiet corner in the back"
  photo_url text,
  created_at timestamptz default now()
);
```

### User Sensory Profile (Supabase `profiles` table)
```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  noise_threshold integer,        -- max dB before discomfort (e.g., 65)
  lighting_preference text,       -- 'dim', 'moderate', 'bright'
  triggers jsonb,                 -- ["fluorescent lights", "perfume", "crowds > 20"]
  comfort_items jsonb,            -- ["noise-canceling headphones", "sunglasses"]
  created_at timestamptz default now()
);
```

### The Five Sensory Dimensions

| Dimension | How Rated | Scale | Auto-Sensed? |
|-----------|-----------|-------|--------------|
| **Noise** | Microphone auto-measurement | dB value → mapped to 1-5 | Yes — primary differentiator |
| **Lighting** | User taps visual scale | 1 (dim/cozy) → 5 (harsh/fluorescent) | Partial (AmbientLightSensor on Chrome) |
| **Crowding** | User taps visual scale | 1 (empty) → 5 (packed/no personal space) | No |
| **Smell** | User taps visual scale | 1 (neutral) → 5 (overwhelming) | No |
| **Predictability** | User taps visual scale | 1 (chaotic/changing) → 5 (consistent/routine) | No |

---

## Component Architecture

```
src/
├── App.jsx                      # Router, auth context, theme
├── components/
│   ├── Map/
│   │   ├── MapView.jsx          # Leaflet map with venue pins
│   │   ├── VenuePin.jsx         # Color-coded pin by overall score
│   │   └── LocationButton.jsx   # "Center on me" GPS button
│   ├── Venue/
│   │   ├── VenueCard.jsx        # Summary card on map tap
│   │   ├── VenueDetail.jsx      # Full detail view with ratings
│   │   ├── SensoryRadar.jsx     # 5-axis radar chart (recharts)
│   │   └── TimeHeatmap.jsx      # Best/worst times grid
│   ├── Rating/
│   │   ├── RatingFlow.jsx       # Step-by-step rating wizard
│   │   ├── SensorySlider.jsx    # Visual 1-5 scale with icons
│   │   └── AutoSenseGauge.jsx   # Live dB gauge during measurement
│   ├── Sensing/
│   │   ├── AudioMeter.jsx       # Web Audio API dB measurement
│   │   ├── VenueDetector.jsx    # GPS → Nominatim reverse geocode
│   │   └── SensoryBudget.jsx    # "You're at X dB — within your comfort"
│   ├── Profile/
│   │   ├── ProfileSetup.jsx     # Onboarding — set thresholds
│   │   └── TriggerManager.jsx   # Manage personal triggers
│   └── Shared/
│       ├── SensoryIcon.jsx      # Visual icons for each dimension
│       └── DbLabel.jsx          # "62 dB — moderate conversation"
├── hooks/
│   ├── useAudioMeter.js         # Web Audio API hook
│   ├── useGeolocation.js        # GPS watch position hook
│   ├── useNearbyVenues.js       # Overpass API query hook
│   └── useVibrate.js            # Haptic feedback hook
├── lib/
│   ├── supabase.js              # Supabase client
│   ├── nominatim.js             # Reverse geocoding
│   ├── overpass.js              # Nearby POI query
│   ├── sensoryUtils.js          # dB → label, score calculations
│   └── dbMeter.js               # Audio measurement engine
└── data/
    └── quietHours.json          # Pre-loaded chain quiet hours (Target, Lidl, etc.)
```

---

## Key UX Flows

### Flow 1: "What's it like here?" (Auto-Sense on Arrival)
1. User opens app → GPS detects location
2. Nominatim reverse-geocodes to nearest venue: "You're at Blue Bottle Coffee"
3. If venue exists in DB: show existing ratings + "Measure now?"
4. If new venue: "First one here! Want to rate it?"
5. User taps "Measure" → microphone activates → live dB gauge for 30 seconds
6. After measurement: "This venue is 58 dB — quiet conversation level"
7. Quick-rate remaining dimensions (lighting, crowding, smell, predictability) via visual sliders
8. Submit → venue appears on map for all users

### Flow 2: "Where should I go?" (Search Before Leaving)
1. User searches "coffee shops" or browses map
2. Pins colored by overall sensory score (green = low-stim, yellow = moderate, red = high-stim)
3. Tap pin → see radar chart of 5 dimensions + "best time to visit" recommendation
4. Filter: "Show only venues under 60 dB average" or "Dim lighting preferred"
5. If user has a sensory profile: venues auto-filtered to match their thresholds

### Flow 3: Sensory Budget Warning (Passive Background)
1. If mic permission is granted and app is open: passive dB monitoring
2. If current environment exceeds user's noise threshold → gentle haptic pulse + banner: "Current noise: 74 dB — above your comfort level (65 dB). Need a break?"
3. Tap banner → shows nearest quiet-rated venues on map

---

## 13-Hour Build Timeline

### Hour 0-1: Foundation (60 min)
- [ ] `npx create-expo-app sensly` or Vite + React
- [ ] Install: `leaflet react-leaflet recharts @supabase/supabase-js`
- [ ] Create Supabase project (free tier) — run SQL for venues, ratings, profiles tables
- [ ] Set up Leaflet map with OpenStreetMap tiles, center on user location
- [ ] Basic GPS hook (`useGeolocation.js`) with `navigator.geolocation.watchPosition`

### Hour 1-3: Audio Measurement Engine (120 min) ⚡ CRITICAL PATH
- [ ] Build `dbMeter.js` — the Web Audio API pipeline (exact code above)
- [ ] Build `useAudioMeter.js` hook — returns `{ db, isListening, start, stop }`
- [ ] Build `AutoSenseGauge.jsx` — animated SVG gauge showing live dB level
- [ ] 30-second measurement flow with countdown timer
- [ ] Map dB to human-readable labels ("quiet library", "busy cafe", "loud bar")
- [ ] Test on actual phone — verify readings make sense
- [ ] **Checkpoint:** Mic measurement working, gauge animating, readings reasonable

### Hour 3-5: Venue Detection + Map (120 min)
- [ ] Build `nominatim.js` — reverse geocode (lat,lng) → venue name + address
- [ ] Build `overpass.js` — query nearby amenities (cafes, restaurants, shops, clinics)
- [ ] Build `VenueDetector.jsx` — "You're at [venue name]" banner
- [ ] Build `VenuePin.jsx` — color-coded map pins (green/yellow/red)
- [ ] Build `VenueCard.jsx` — tap a pin → see summary card with name, address, and aggregate scores
- [ ] Supabase query: fetch venues within map bounding box
- [ ] **Checkpoint:** Map loads, GPS works, nearby venues shown as pins, tapping works

### Hour 5-7: Rating Flow (120 min)
- [ ] Build `SensorySlider.jsx` — visual 1-5 scale with descriptive icons for each level
- [ ] Build `RatingFlow.jsx` — step wizard: auto-sense noise → rate lighting → crowding → smell → predictability → optional notes → submit
- [ ] Wire dB measurement into rating flow — noise auto-populated
- [ ] Supabase insert for new rating
- [ ] Aggregate calculation: update venue averages on new rating
- [ ] Photo attachment via camera API (optional — add if time allows)
- [ ] **Checkpoint:** Full rate flow works end-to-end, data appears in Supabase

### Hour 7-9: Venue Detail + Visualization (120 min)
- [ ] Build `SensoryRadar.jsx` — 5-axis radar chart using Recharts
- [ ] Build `VenueDetail.jsx` — full page with radar, rating history, features list
- [ ] Build `TimeHeatmap.jsx` — grid showing noise levels by day-of-week × time-of-day
- [ ] "Best time to visit" recommendation based on lowest average noise
- [ ] Sensory features tags: "outdoor seating", "no background music", "dim lighting option"
- [ ] Individual rating cards with timestamps and notes
- [ ] **Checkpoint:** Venue detail page looks polished, radar chart renders, time patterns visible

### Hour 9-10.5: Sensory Profile + Filtering (90 min)
- [ ] Build `ProfileSetup.jsx` — onboarding: "What's your noise threshold?" slider (40-90 dB), lighting preference, known triggers
- [ ] Store profile in Supabase (or localStorage for anonymous users)
- [ ] Filter venues on map by profile match — pins that exceed thresholds show as red
- [ ] "Venues within your comfort zone" quick filter toggle
- [ ] `SensoryBudget.jsx` — banner when current environment exceeds profile threshold
- [ ] Vibration API: gentle haptic pulse on threshold breach (Android)
- [ ] **Checkpoint:** Profile works, map filters dynamically, threshold warning fires

### Hour 10.5-12: UI Polish + Pre-loaded Data (90 min)
- [ ] Styling pass: typography (distinctive, not generic), color system, spacing
- [ ] Mobile-first responsive layout — this is primarily a phone app
- [ ] Transitions and micro-interactions on rating submission
- [ ] Pre-load `quietHours.json` — known quiet hours for major chains (Target, Walmart, Lidl, Morrisons, AMC Sensory Friendly)
- [ ] Seed 10-15 sample venues in your local area with realistic ratings for demo
- [ ] Empty states: "Be the first to rate this venue"
- [ ] Error handling: mic permission denied, GPS unavailable, offline state

### Hour 12-13: Demo Prep (60 min)
- [ ] Script the 2-minute demo flow:
  1. Open app → "I'm autistic and I want to find a quiet place for lunch"
  2. Map shows nearby venues color-coded by sensory score
  3. Filter: "Under 60 dB only" → map updates
  4. Open Sensly at current location → live dB gauge measures the room
  5. Auto-detects venue → pre-fills rating → quick-rate remaining dimensions
  6. Show radar chart comparison: "This cafe vs. that one"
  7. Show time heatmap: "Come here Tuesday afternoon, not Saturday"
- [ ] Pre-cache demo data for offline resilience
- [ ] Test full flow on phone 3x — identify any crash points
- [ ] Prepare 1-slide context screen: "300M people worldwide are neurodivergent. Most can't answer 'what's this place like?' before they get there."

---

## Technical Risks + Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mic readings inaccurate across devices | Medium | Don't claim SPL accuracy — label as "relative noise level". Show comparative labels ("quieter than a library") not absolute dB. Add disclaimer. |
| Nominatim rate limiting (1 req/sec) | Low | Cache results, debounce requests, batch nearby venue lookups |
| Overpass API slow for large areas | Medium | Limit query radius to 200m, cache results per bounding box |
| Supabase free tier limits (500MB, 50k rows) | None for hackathon | More than sufficient for demo + months of real use |
| AmbientLightSensor browser support | Low | Mark as "bonus" feature. Chrome-only behind flag. Primary value is mic, not light sensor. |
| User doesn't grant mic permission | Medium | App still works with manual ratings only. Mic is enhancement, not requirement. |

---

## What Makes This Win

1. **The phone listens for you.** No other sensory mapping app auto-measures noise. NeuroHub requires manual ratings for everything. Sensly turns the phone into a sensory instrument.

2. **The demo is visceral.** Open the app, the gauge starts moving, the room's noise level appears in real-time. Judges don't need to imagine the problem — they experience the solution.

3. **It serves 300M+ people.** Autism, ADHD, PTSD, sensory processing disorder, anxiety disorders, migraine sufferers — the audience for sensory-friendly venue information is enormous.

4. **Zero-cost stack.** OpenStreetMap (free), Nominatim (free), Overpass (free), Supabase free tier, Web Audio API (built into every browser). No paid APIs, no billing setup, no API key stress during demo.

5. **Self-improving system.** Every rating makes the map better. Every auto-sense measurement enriches the noise data. The more people use it, the more useful it becomes — classic network effect story for judges.

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
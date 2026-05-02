# Sensly — Full Build Plan

## The Concept

A crowdsourced sensory environment map that uses your phone's microphone to automatically measure venue noise levels, combined with user ratings on lighting, crowding, smell, and predictability. Think Wheelmap for sensory needs — but the phone does half the work.

**Tagline:** "Know before you go. Your phone listens so you can prepare."

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
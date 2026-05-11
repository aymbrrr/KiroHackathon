DUE: MAY 14

---

# Priority Tiers

| Tier | Criteria |
|---|---|
| 🔴 Ship before demo | High impact, low-medium work. Visible to judges, fixes a core gap |
| 🟡 Ship if time allows | High impact but heavier lift, or medium impact + low work |
| ⚪ Post-demo | Low user-visible impact, or high work relative to payoff by May 14 |

---

## 🔴 SHIP BEFORE DEMO

---

### Home screen insight card
**Work: 3 / Impact: 5**

The empty space left by removing light/temp cards is the biggest UX gap right now. The axolotl and sensor cards give raw data but no interpretation. Judges opening the app see numbers with no clear "so what."

**What to build:** An inline card on `DashboardScreen` between the sensor grid and the axolotl status card that:
- Generates a 1–2 sentence qualitative summary based on live `db`, `motionLevel`, and `nearbyVenues[0]` aggregates (no edge function needed — use local logic)
- Never shows a numeric risk score — use `riskToLevel().label` ("All systems calm", "Stress may be rising") and a mood word
- Shows two action chips: **Open Calm** (navigate to `CalmScreen`) and **Quieter nearby** (filter `nearbyVenues` by `overall_score` and navigate to map)
- Pulls in community data (venue's `avg_crowding`, `avg_predictability`) to enrich the sentence: "The crowd here is usually moderate — your body is handling it"

**What exists:** `computeRiskScore`, `riskToMood`, `riskToLevel` are all working. `nearbyVenues` is already fetched in `venueStore`. Navigation to Calm and Map already works. Just needs a new component and copy logic.

**Key constraint:** The insight must not show a number. Showing a score to a dysregulated person adds pressure. Use adjectives only.

---

### Extend daily check-in
**Work: 2.5 / Impact: 5**

Currently the check-in stores one of three states (good/sensitive/hard) and sets a noise threshold. That's useful but throws away the reason. Knowing that today is hard *because* the user is tired vs. because they're emotionally overwhelmed vs. because they're hungry enables completely different recommendations.

**What to build:** When the user selects yellow (sensitive) or red (hard), show a second step — a row of tap-to-toggle chips:
- Tired / Low sleep
- Hungry
- Emotionally sensitive
- Easily overwhelmed
- Anxious / on edge

These are radio-friendly, low-cognitive-load options. No text input. One tap each. Auto-dismiss after 2 seconds of no new selection or a "Done" chip.

**Schema change:** Add columns to `daily_checkins`: `is_tired`, `is_hungry`, `is_emotional`, `is_overwhelmed`, `is_anxious` (all `boolean default false`). New migration file needed.

**Why this matters for pattern detection:** The `detect-patterns` edge function can now find: "On days you check in as tired + sensitive, noise above 60 dB triggers a hard day 80% of the time." That becomes a proactive insight — "You checked in as tired today. Quieter environments will help."

---

### Info screens when sensor cards are tapped
**Work: 1 / Impact: 3**

Currently tapping a sensor card navigates to `CurrentSenseScreen`. Most users — especially during onboarding — don't know what 62 dB means, what "MOTION 47%" represents, or how either number is being used.

**What to build:** A bottom sheet (already have `@gorhom/bottom-sheet` in deps) that slides up when the user long-presses or taps a `?` icon on the card. Content per card:

- **SOUND:** dB reference scale — 30 dB (quiet room), 60 dB (conversation), 85 dB (traffic), 110 dB (concert). "Sensly flags above 70 dB as elevated." Mention that 50–70% of autistic people are sensitive at levels others find comfortable.
- **MOTION:** "This measures how much your phone is moving — a proxy for your own activity level. It's not measuring the crowd around you." Reframe: "Higher movement often means your body is reacting before you consciously notice."

**No backend needed.** Static content in the bottom sheet. The `?` icon tap handler is a single `useState(showInfo)`.

---

### Familiarity score in venue detail
**Work: 1.5 / Impact: 4**

The `ratings` table records `user_id` + `venue_id` for every rating submitted. The `venue_follows` table has an `is_familiar` boolean. The data to compute "how many times has this user been here" already exists — nobody is using it.

**What to build:** In `VenueDetailScreen`, after fetching the venue, run a second query:
```ts
supabase.from('ratings').select('id', { count: 'exact', head: true })
  .eq('venue_id', venueId).eq('user_id', session.user.id)
```

Map the count to copy shown as a small line below the venue name:
- 0 visits → "New place for you — see what others say"
- 1–2 visits → "You've been here before"
- 3–5 visits → "You've visited {n} times — you know this place"
- 6+ visits → "This is a familiar spot for you"

Auto-set `venue_follows.is_familiar = true` once count ≥ 3 (upsert on `venue_follows`).

**Emotional payoff:** For a neurodivergent user, "this is a familiar spot" is genuinely reassuring and makes the app feel like it knows them. High impact per line of code.

---

### Quick actions row + micro-interventions
**Work: 2 / Impact: 4**

The home screen has no direct action path for a user who is mid-distress. The Calm screen exists but requires 2 taps. Rating a place requires navigating to the map.

**What to build:** A horizontal scrollable row of 3 action chips below the sensor grid:

1. **"🎙️ Rate this place"** — uses `nearbyVenues[0]` to pre-fill `venueId`/`venueName` and navigate to `Rating`. If no nearby venue, chip is disabled with label "No venue detected."
2. **"🌊 Calm"** — navigates directly to `CalmScreen`
3. **"🌱 Grounding"** — opens a bottom sheet with a rotating micro-intervention

Micro-intervention content (rotate daily, or randomize):
- **Box breathing:** Animated expanding/contracting circle. 4s inhale → 4s hold → 4s exhale → 4s hold. Based on established trauma-informed breathing regulation protocol.
- **5-4-3-2-1 grounding:** "Name 5 things you can see. 4 you can touch. 3 you can hear. 2 you can smell. 1 you can taste." Text displayed one at a time with a soft tap-to-advance.
- **"Step outside":** Shown when user is detected at an indoor venue (`venueTemp !== null` logic, or `category !== 'park'`). "Even 2 minutes outside can lower cortisol."
- **Brightness prompt:** "Lowering screen brightness can reduce visual overload." Instruction only — iOS doesn't allow programmatic brightness change without special entitlements.

**No backend.** Content is static. Bottom sheet is UI only.

---

## 🟡 SHIP IF TIME ALLOWS

---

### Motion data reframe
**Work: 2 / Impact: 3.5**

Motion currently contributes 25% to `computeRiskScore`, which penalizes users for fidgeting — the opposite of the app's intent. The label "MOTION 47% — active" is meaningless to most users.

**What to build:**
1. **Remove motion from `computeRiskScore`** — 1 line change in `sensoryUtils.ts`. Risk score becomes sound-only for live sensing (which is more honest).
2. **Relabel the card:** "MOVEMENT" instead of "MOTION", remove the number, show: calm / active / restless based on thresholds. Add a subtitle: "Your activity level."
3. **Session baseline:** Track running average of `motionLevel` in a `useRef` (same pattern as `soundHistory`). If current > 1.5× average for more than 30s, show "more active than usual."

**Longer term (post-demo):** Log motion alongside ratings so `detect-patterns` can find "you fidget more in busy venues" patterns. Store `avg_motion` column in `daily_checkins`.

---

### Time of day contextual labels
**Work: 1 / Impact: 3**

Ratings already have `time_of_day` + `day_of_week`. `TimeHeatmap` already renders this in VenueDetailScreen. The missing piece is surfacing it *in context* — when the user is looking at a venue right now.

**What to build:** In `VenueDetailScreen`, after fetching ratings, compute the bucket for the current moment:
```ts
const now = new Date();
const slot = now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : ...;
const dayBucket = ratings.filter(r => r.day_of_week === now.getDay() && r.time_of_day === slot);
const avgNow = mean(dayBucket.map(r => r.noise_db));
```
Show as a callout above the heatmap: "Usually **quiet** on Monday mornings" (or "Usually **busy** right now").

Only show if `dayBucket.length >= 3` — below that threshold the sample is too small.

---

### Sensory forecast strip
**Work: 3.5 / Impact: 4**

Like a weather app but for sensory load. "This afternoon here is usually loud. Evening gets quieter." Shown when the user is at or viewing a specific venue.

**What to build:**
- New Supabase RPC: `get_venue_day_forecast(venue_id uuid, dow int)` → returns `(time_of_day, avg_noise_db, avg_crowding, rating_count)` for each slot of that day of week
- Only include slots with `rating_count >= 5`
- UI: horizontal strip of 4 time-slot chips (morning / afternoon / evening / night) with a color dot and noise label. Renders in `VenueDetailScreen` above the heatmap
- Eventually could appear in the home screen insight card: "The coffee shop you're near gets louder after 3 PM"

**Constraint:** Needs real ratings data per venue per slot to be meaningful. Placeholder state: "Not enough data yet for this venue." This feature gets better with more users — good story for investors/judges.

---

### Anonymous comments
**Work: 2 / Impact: 3**

The `comments` table, RLS policies, and `moderate-comment` edge function are all done. This is pure UI work.

**What to build:**
- In `VenueDetailScreen`, below the sensory features section: a comments list + "Add a note" input
- Query: `supabase.from('comments').select('body, created_at').eq('venue_id', venueId).order('created_at', { ascending: false }).limit(20)`
- Submit: call `supabase.from('comments').insert({ venue_id, user_id: session.user.id, body: validated_text })`; then call `moderate-comment` edge function to filter post-insert
- Display: no avatar, no username — just the comment text and a relative timestamp ("3 days ago")
- Character limit: 280 chars (already in the `moderate-comment` logic)

**Why "anonymous":** RLS allows insert only when `auth.uid() = user_id`, so comments are attributed in the DB for moderation, but the UI never renders the `user_id` or any profile info.

---

## ⚪ POST-DEMO

---

### Verified community members / unverified locations (also fixes S7)
**Work: 4 / Impact: 4**

Important for trust at scale, but requires schema migration + RLS rewrite + UI in 3 places.

**What to build:** New migration adding `is_verified boolean default false`, `submitted_by uuid references auth.users`, `status text check (status in ('pending','verified','rejected')) default 'pending'` to `venues`. New RLS UPDATE policy: `auth.uid() = submitted_by`. Community-submitted badge ("Unverified — submitted by community") in VenueDetailScreen and MapScreen pin tooltip. Admin-only route to flip `is_verified`. Also fixes the S7 upsert security issue.

---

### Journal improvements
**Work: varies / Impact: 3**

"Better" needs definition before this can be scoped. Candidates:
- **Streak tracker** — "5 days logging in a row" badge. Data: count consecutive days with `user_activity.activity_type = 'home_log'`. Low work, moderate engagement.
- **Venue-linked entries** — attach a venue to each journal log so "Tuesday 2 PM at the library" shows in context. Requires `venue_id` column on `logs` table + UI picker.
- **Trend chart improvements** — overlay mood emoji on the bar chart. Requires `riskToMood()` per entry in the chart data.
- **Filter / search** — filter by venue, date range, mood. Medium work, useful for power users.

Recommend scoping to streak tracker only before demo (low work, visible).

---

### Bug fixes (non-S7)
- **P3** — Heatmap fetches 100 raw rows. Fix with a Supabase RPC aggregate. Low urgency: no venue has enough ratings yet for this to matter in demo.
- **A5** — 20+ hardcoded hex colors in JournalScreen. Cosmetic only, no user impact.
- **A7** — `as any` navigation cast in DashboardScreen. Type-only fix, no runtime effect.
- **A8** — Destructive DELETE in seed migration. Only matters if migrations are re-run in production.

---

### UI design overhaul
**Work: 4 / Impact: 3**

"Less vibey, more modern and polished" is too broad to implement safely 3 days before demo. Risk of breaking existing layouts. Better approached as:
1. Identify 2–3 specific screens that feel most off
2. Make targeted changes (tighter spacing, consistent font weights, remove gradient overuse)
3. Test on device before committing

Don't attempt a full redesign before May 14.

---

## Summary: Recommended Build Order for May 14

| # | Feature | Work | Impact | Why now |
|---|---|---|---|---|
| 1 | Home insight card | 3 | 5 | Biggest visible gap, fills empty space |
| 2 | Extend daily check-in | 2.5 | 5 | Unique data collection, demo-able |
| 3 | Info screens on sensor tap | 1 | 3 | Removes first-time confusion, trivial to build |
| 4 | Familiarity score | 1.5 | 4 | Data exists, emotionally resonant, ~1hr work |
| 5 | Quick actions + micro-interventions | 2 | 4 | High engagement, no backend |
| 6 | Motion reframe | 2 | 3.5 | Fixes misleading behavior for core user group |
| 7 | Time of day labels | 1 | 3 | Easy query, contextually useful |
| 8 | Sensory forecast | 3.5 | 4 | Differentiating, needs data volume to shine |
| 9 | Anonymous comments | 2 | 3 | Backend done, additive feature |
| 10 | Verified venues + S7 | 4 | 4 | Post-demo — schema-heavy |
| 11 | Journal improvements | varies | 3 | Scope to streak tracker only if time |
| 12 | UI overhaul | 4 | 3 | Too risky before demo |

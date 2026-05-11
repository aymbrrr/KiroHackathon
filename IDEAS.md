DUE: MAY 14

Improvements: 

## New Features
- Anonymous comments by users

- extend daily check in: be able to edit this, and collect more date for yellow/red response. eg. tired? hungry? emotional? sensitive? then we have actionable data. 

- Verified community members or admin can add locations, otherwise shows up as unverified

- bring up info screens when noise or motion is clicked to understand how to best use the data? 

- Integrate time of day data: add to when a place is reviewed, then track patterns based on time/other factors

- Home screen additions: we removed temp and light cards, so there is empty space.      
    - we want to improve the insight page by consolidating to a place where you can view insights from the home screen. 
        - the insights should be based on where you are, what time it is, and noise. it should refrence data from other users like lighting and predictivility to judge the score of how regulated you are, but not show a risk score to the user. 
        - Insights should be followed with actionable items, such as “calm” screen or show places nearby that are more sensory friendly, these things could live on the home page as well.

- home quick actions idea: rate this place, log feeling, calm. or a short micro intervention such as: 10-second breathing pulse
“Grounding: name 3 things you see”
“Lower brightness suggestion”, step outside. do some research on these.

- Sensory forecast:
Like weather:
Predict noise/crowd/light over next few hours. show on home screen when user is at a location.

- Familiarity score: track how many times the user has been to a location, then combined with other useful data, can make generalizations such as “You’ve been here 3 times”
“You handled this well before” or “this place is new for you.” and action.

- make the journal feature better

- Motion data — reframe as a personal self-regulation signal, not an environment sensor

  **What it currently does:** The phone accelerometer measures how much the phone itself is physically moving (0–100 scale). It currently feeds 25% of the risk score, which means users who naturally fidget always show elevated risk — counterproductive for the exact population Sensly serves.

  **What it can actually tell us (phone as a self-awareness proxy):**
  - **Fidgeting / restlessness** — frequent small movements while stationary indicate building anxiety or dysregulation before the user consciously notices. This is the most valuable signal: catching the body's response before the mind catches up.
  - **Phone pickup frequency** — how often the user picks up the phone is a known stress and anxiety marker (similar to how digital wellbeing apps use screen time). If pickup rate climbs in a new or loud place, that's a meaningful signal.
  - **Settled vs. unsettled transitions** — movement going from low → high while sound stays flat suggests the stressor is internal (anxiety, sensory fatigue) rather than environmental. Movement going high alongside sound suggests the environment is the trigger.
  - **Session-baseline comparison** — "you're moving more than usual right now" is much more meaningful than an absolute 47%. Track a rolling average per session; flag when current level is >1.5× that average.
  - **Pattern over time** — combined with the detect-patterns edge function, can generate insights like: "You tend to fidget more in the evenings" or "Your movement picks up 10–15 min into crowded places, even before noise gets loud."

  **What to remove:** Drop motion from `computeRiskScore` entirely. The risk score should only reflect what the environment is doing to the user, not what the user's body is doing. Keep motion as a parallel, separate signal.

  **UI direction:** Replace the "MOTION 47% — active" card with a qualitative "MOVEMENT" indicator: calm / active / restless, with no number shown. Add a note: "This reflects your activity level, not the environment's." Eventually surface it in the journal and pattern insights rather than the live dashboard.

## Bug Fixes

| ID | Priority | Category | File(s) | One-liner |
|----|----------|----------|---------|-----------|
| S7 | HIGH | Security | `001_initial_schema.sql` | Venue upsert allows score fabrication |
| P3 | MEDIUM | Perf | `VenueDetailScreen.tsx` | Fetches 100 raw rows for a heatmap |
| A5 | MEDIUM | Arch | `JournalScreen.tsx` | 20+ hard-coded colors bypass theme system |
| A7 | LOW | Arch | `DashboardScreen.tsx` | `as any` navigation cast hides type error |
| A8 | LOW | Arch | `004_slo_seed_data.sql` | Destructive `DELETE` in numbered migration |

## UI Design

- make it look less vibey
- more modern and polished

DUE: MAY 14

Improvements: 

## New Features
- Anonymous comments by users

- Verified community members or admin can add locations, otherwise shows up as unverified

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

## Bug Fixes

- ID | Priority | Category | File(s) | One-liner |
|----|----------|----------|---------|-----------|
| S7 | HIGH | Security | `001_initial_schema.sql` | Venue upsert allows score fabrication |
| P3 | MEDIUM | Perf | `VenueDetailScreen.tsx` | Fetches 100 raw rows for a heatmap |
| A5 | MEDIUM | Arch | `JournalScreen.tsx` | 20+ hard-coded colors bypass theme system |
| A7 | LOW | Arch | `DashboardScreen.tsx` | `as any` navigation cast hides type error |
| A8 | LOW | Arch | `004_slo_seed_data.sql` | Destructive `DELETE` in numbered migration |

- long words (noticable) get wrapped around in the rating tab. other issues: overwhelming, consistent

## UI Design

- make it look less vibey
- more modern and polished

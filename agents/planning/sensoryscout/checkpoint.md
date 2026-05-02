# Sensly — PDD Checkpoint

> Pre-design checkpoint. Confirmed requirements + key decisions before moving to detailed design.

---

## Confirmed Requirements

1. **Crowdsourced sensory venue map** — users contribute ratings on noise, lighting, crowding, smell, and predictability for real-world venues
2. **Auto-noise measurement** — phone microphone measures ambient dB automatically during a rating session; manual override available
3. **Dual user modes** — "Self" mode (low-stimulation UI, large targets, minimal text for use during sensory overload) and "Support" mode (information-dense, caregiver managing profiles for others)
4. **Multiple sensory profiles per account** — one account can hold profiles for multiple people (e.g., caregiver + child)
5. **Account required, contributions anonymous** — users must sign in, but all ratings/measurements/comments are anonymous to other users; `user_id` stored internally for moderation only
6. **Native iOS + Android app** — built with React Native (Expo); desktop is read-only/not a priority
7. **Offline-first** — ratings and measurements queue locally when offline, sync when connectivity returns
8. **Multi-language + localization** — expo-localization + react-i18next; RTL support; English + at least one additional language at launch
9. **In-app accessibility modes** — color blindness filters (4 types), dyslexia-friendly mode (OpenDyslexic font, spacing), all UI meets WCAG 2.1 AA
10. **Health app integration (opt-in)** — read heart rate / stress level from Apple HealthKit (iOS) or Google Health Connect (Android) to optionally attach as context to a rating
11. **Social features** — anonymous comments on venues, follow a venue for push notifications on new ratings, share venue via deep link / native share sheet
12. **Zero-cost API stack** — OpenStreetMap, Nominatim, Overpass API, Supabase free tier; no paid APIs required

---

## Key Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | React Native (Expo) | Single codebase for iOS + Android; Expo managed workflow reduces native config |
| Map | react-native-maps | Native maps (Apple Maps / Google Maps); better performance than web Leaflet on device |
| Microphone | expo-av | Reliable native mic access; replaces Web Audio API |
| Database | Supabase (Postgres + RLS) | Free tier sufficient; RLS enforces anonymity at DB layer |
| Auth | Supabase Auth + Apple/Google Sign-In | Native social login via expo-auth-session |
| Offline queue | expo-sqlite | Local SQLite for pending ratings; sync on reconnect |
| Localization | react-i18next + expo-localization | Industry standard; RTL support built in |
| Health data | expo-health (iOS) / expo-health-connect (Android) | Opt-in heart rate context on ratings |
| Push notifications | expo-notifications | Venue follow alerts |
| Haptics | expo-haptics | Sensory budget threshold alerts |

---

## Key Research Findings (from design.md)

- Web Audio API dB pipeline is well-understood; expo-av equivalent uses `Audio.Recording` with metering enabled (`isMeteringEnabled: true`) — returns `metering` value in dBFS on each status update
- Nominatim rate limit: 1 req/sec — must debounce and cache
- Overpass API: limit query radius to 200m, cache per bounding box
- Supabase free tier: 500MB DB, 50k rows — more than sufficient for demo and months of real use
- AmbientLightSensor has poor cross-platform support — lighting remains manual rating only
- react-native-maps offline tile caching is limited; Mapbox SDK has better offline support but requires API key — flag as risk

---

## Open Questions / Risks

| Item | Risk Level | Notes |
|---|---|---|
| Mapbox vs react-native-maps for offline tiles | Medium | react-native-maps has no built-in offline tile cache; may need Mapbox (free tier: 50k loads/month) for offline map browsing |
| expo-av dB accuracy across devices | Medium | Phone mics vary; label readings as relative ("quieter than a busy café") not absolute SPL |
| Apple HealthKit review requirements | Low-Medium | Apple requires explicit justification for HealthKit access in App Store review; straightforward for this use case but needs careful entitlement setup |
| Google Health Connect permissions UX | Low | Requires Android 14+ for full support; graceful degradation on older versions |
| Offline conflict resolution | Low | Each rating is an independent row — no conflicts possible; last-write-wins is safe |
| Comment moderation at scale | Low for hackathon | Basic profanity filter + report button sufficient for v1 |

---

## Decision Needed

**Proceed to design, revisit any requirement, or do more research on any of the open questions above?**

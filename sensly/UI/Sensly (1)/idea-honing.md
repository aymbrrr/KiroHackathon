# SensoryScout — Requirements Q&A

Running record of questions and answers during the requirements phase.

---

## Q1: Who is the primary user operating the app?

**Question:** Who is the primary user operating the app in the moment — the person with sensory needs themselves, or a caregiver/support person?

**Answer:** Both. The app should support both modes.

**Implications:**
- Need two distinct UI modes: a "Self" mode (low-stimulation, large targets, minimal text, operable during sensory overload) and a "Support" mode (more information-dense, detailed rating flow, caregiver can manage profiles for multiple people)
- Onboarding should ask "Who are you using this for?" and set the mode accordingly
- Sensory budget warnings need to be configurable — the person themselves may want a subtle haptic, a caregiver may want a visible banner
- Profile system needs to support multiple profiles under one account (caregiver managing profiles for a child + themselves)

---

---

## Q2: What platform is the priority?

**Question:** Mobile web PWA, native iOS/Android, or desktop too?

**Answer:** Priority is iOS and Android native app.

**Implications:**
- Shift from React PWA to **React Native (Expo)** — single codebase, deploys to both iOS and Android
- Web Audio API → replaced by **expo-av** for microphone access (more reliable on native, no browser permission quirks)
- Leaflet → replaced by **react-native-maps** (Apple Maps on iOS, Google Maps on Android — both free at hackathon scale)
- Supabase JS client works identically in React Native — no change
- Nominatim + Overpass API calls work identically — no change
- PWA offline caching → replaced by **AsyncStorage / MMKV** for local caching
- Haptic feedback via **expo-haptics** (better native support than browser Vibration API)
- Camera for photo attachments via **expo-image-picker**
- Desktop is acceptable as read-only but not a priority

---

## Q3: What is the authentication and privacy model?

**Question:** Do users need accounts, or should the core experience work anonymously?

**Answer:** Account required, but all contributions (ratings, measurements, recommendations) are anonymous to other users.

**Implications:**
- Supabase Auth for account management (email/password + social login via Google/Apple — both supported natively in Expo)
- `user_id` is stored internally on ratings/measurements for moderation and abuse prevention, but is **never exposed** to other users
- No usernames, no public profiles, no social graph — the app is a tool, not a social network
- Caregiver mode: one account can hold multiple sensory profiles (e.g., "My profile", "Jamie's profile") — profiles are private to the account
- Ratings display as "A SensoryScout user" or just aggregate scores — no attribution
- This also simplifies GDPR/COPPA compliance: no PII is ever public-facing
- Supabase Row Level Security (RLS) enforces this at the DB layer — users can only read/write their own profile rows, but can read all venue/rating aggregates

---

## Q4: What is explicitly in scope for v1?

**Question:** What's in scope vs. out of scope for the first version?

**Answer:** The following are IN SCOPE for v1:

1. **Offline-first full sync** — users can rate venues and record measurements without connectivity; data syncs when back online
2. **Multi-language / localization** — app supports multiple languages
3. **Accessibility features** — color blindness modes, dyslexia-friendly font/layout (LensLearn concepts applied to this app)
4. **Health app integration** — link to Apple Health or Google Fit (whichever is easier; Apple HealthKit via expo-health or Google Health Connect via expo-health-connect)
5. **Social features** — comments on venues, following venues (get notified of new ratings), sharing a venue to a friend

**Out of scope for v1:**
- Business owner portal (venue claiming, official quiet hours management)
- Wearable integration (Apple Watch, hearing aids)
- Web desktop as a first-class experience

**Implications of in-scope additions:**

### Offline-first
- Need a local queue (AsyncStorage or SQLite via expo-sqlite) to store pending ratings/measurements
- Background sync when connectivity restored (expo-background-fetch or simple app-foreground detection)
- Conflict resolution strategy: last-write-wins on ratings (each rating is its own row, no conflicts)
- Map tile caching for offline map browsing (react-native-maps has limited offline support — may need Mapbox offline tiles as fallback)

### Localization
- expo-localization for device locale detection
- i18n-js or react-i18next for string management
- RTL layout support via React Native's built-in I18nManager
- Initial languages: English + at least one more (Spanish or French) for demo credibility

### Accessibility (in-app)
- Color blindness: 4 filter modes (none, deuteranopia, protanopia, tritanopia) applied via color theme system
- Dyslexia mode: OpenDyslexic font (expo-font), increased letter spacing, left-aligned text, no justified text
- These are settings within the app's profile/settings screen
- All UI must meet WCAG 2.1 AA contrast ratios regardless of mode

### Health App Integration
- **Apple HealthKit** (iOS): expo-health — read stress/heart rate data as optional context for a rating ("I was stressed when I rated this")
- **Google Health Connect** (Android): expo-health-connect — same concept
- Use case: optionally attach current heart rate or stress level to a rating, giving richer personal context
- This is opt-in, clearly explained, never shared with other users
- Simpler than it sounds: one read permission, one data point attached to a rating row

### Social Features
- **Comments**: text comments on venue detail page, anonymous, moderated (profanity filter + report button)
- **Following venues**: user can "watch" a venue, gets push notification (expo-notifications) when new rating is added
- **Sharing**: deep link to a venue detail page (expo-linking), shareable as URL or native share sheet
- No social graph between users — you follow venues, not people

---

## Q5: Offline map tiles — in or out?

**Question:** Should the map itself work offline, or just rating submission?

**Answer:** Scrap offline maps. Offline-first applies only to **rating and measurement submission** — the map requires connectivity. react-native-maps stays as the map library (no Mapbox needed).

**Implications:**
- react-native-maps confirmed as map library — free, no API key for basic use
- Offline queue (expo-sqlite) is only for pending ratings/measurements, not map tiles
- Show a clear "No connection — map unavailable" state when offline, but allow the user to still submit a rating for their current GPS location (queued locally)
- Simplifies the architecture significantly

---

## Architecture Decisions

### A1: Navigation
**Answer:** Tab-based navigation (bottom tab bar)
- 4 tabs: Map, Search, Followed, Profile
- Self mode simplifies each tab's content, does not change navigation structure
- Built with React Navigation v6 (expo-router or @react-navigation/bottom-tabs)

### A2: State Management
**Answer:** Zustand
- One store per domain: authStore, profileStore, venueStore, queueStore, settingsStore
- Persisted stores (auth token, settings, offline queue) via zustand/middleware persist + AsyncStorage

### A3: Backend
**Answer:** Pure Supabase — no separate API layer
- Postgres triggers for venue aggregate recalculation on new rating
- Supabase Edge Functions (Deno) for comment moderation (profanity filter)
- Supabase RLS for all data access control
- Supabase Realtime for push-style venue follow notifications (or expo-notifications via Supabase webhook)

---

## Q6: Additional feature set — placement decisions

**New features provided and their placement:**

### Merged into existing Core steps (no new steps)
- **Richer onboarding trigger-preference builder** → Step 2 (onboarding expanded from simple slider to chip-based trigger selector)
- **"Recovery mode" quick filter** → Step 3 (map filter preset: noise ≤45 dB, crowding ≤2)
- **Voice logging** → Step 5 (rating flow notes field extended with voice recording via expo-av + speech recognition)
- **"Familiar places" pinned list** → Step 7 (safe_place boolean on venue_follows record, filter on Followed tab)
- **"How are you today?" daily check-in** → Step 7 (modal on app open, sets dailyThresholdOverride in profileStore)

### New Stretch steps added (hours 8–12)
- **Step 9A**: Learning engine — proactive warnings from history
- **Step 9B**: Sensory journal — weekly insights (pairs with 9A data)
- **Step 9C**: Social — comments, follow, share (was Step 9)
- **Step 10A**: Morning sensory briefing + calendar integration
- **Step 10B**: "Going with me" companion mode (Supabase Realtime)
- **Step 10C**: Share sensory profile with trusted person (read-only link)
- **Step 11A**: Home environment logging
- **Step 11B**: Gentle streak tracking
- **Step 11C**: Accessibility modes — color blindness + dyslexia (was Step 10)
- **Step 11D**: Health data integration (was Step 11)

### Deferred to post-hackathon
- One-tap home screen widget (requires native WidgetKit/App Widget — not possible in Expo managed workflow)
- Auto-report on short dwell time (requires background location — Apple/Google review risk)

---

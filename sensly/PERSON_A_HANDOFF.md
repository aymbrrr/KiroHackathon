# Sensly — Backend Handoff for Person A

Everything Person B has built and what you need to know to wire it up.

---

## What's live in Supabase right now

### Database
All tables are created and running. The Supabase client is already set up correctly in `src/lib/supabase.ts` — use that, never call `createClient` directly anywhere else.

**Key rule:** `import 'expo-sqlite/localStorage/install'` must be the first line in `src/lib/supabase.ts` (it already is — don't move it).

### Tables you'll query most
| Table | What it's for |
|---|---|
| `venues` | Map pins — read publicly, insert when authenticated |
| `ratings` | User ratings — insert only, never read `user_id` |
| `profiles` | Sensory profile — private to owner via RLS |
| `venue_follows` | Followed + familiar places |
| `daily_checkins` | Daily threshold overrides |
| `user_activity` | Streak tracking — insert on every rating/check-in |
| `journal_insights` | Cached weekly insights — read, don't write directly |

### TypeScript types
`src/types/supabase.ts` is generated from the live schema. Import like this:

```typescript
import type { Database } from '../types/supabase';
import type { Tables } from '../types/supabase';

type Venue = Tables<'venues'>;
type Profile = Tables<'profiles'>;
type Rating = Tables<'ratings'>;
```

If the schema changes, Person B will regenerate and push — just pull.

---

## Edge Functions — how to call them

All Edge Functions require the user's JWT in the Authorization header. Use `supabase.functions.invoke()` — it handles auth automatically.

### moderate-comment
Call this when a user submits a comment on a venue. Do NOT insert directly into `comments` table — always go through this function.

```typescript
const { data, error } = await supabase.functions.invoke('moderate-comment', {
  body: { venue_id: 'uuid', body: 'comment text' }
})
// data: { success: true, flagged: false }
// If flagged: show "Your comment is under review"
```

### detect-patterns
Call this when a user opens a VenueDetail screen. Shows a warning banner if the user has had bad experiences at this venue or category before.

```typescript
const { data, error } = await supabase.functions.invoke('detect-patterns', {
  body: { venue_id: 'uuid', venue_category: 'cafe' }
})
// data: { warning: "This place has felt loud to you before", confidence: "high" }
// data.warning is null if no patterns found — only show banner when non-null
```

### generate-insights
Call this when the user opens the Journal tab. Returns cached results if already generated this week.

```typescript
const { data, error } = await supabase.functions.invoke('generate-insights', {
  body: {}
})
// data: {
//   insights: [{ text: "Fridays tend to feel harder for you", type: "pattern" }],
//   cached: true
// }
// insight.type is one of: "pattern" | "wellbeing" | "streak"
```

---

## Auth

Email auth is enabled. Use Supabase Auth directly:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({ email, password })

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()

// Listen for auth state changes (put in authStore)
supabase.auth.onAuthStateChange((event, session) => {
  // update authStore.session
})
```

**Token storage:** Already handled by `expo-sqlite/localStorage` polyfill in `src/lib/supabase.ts`. Do NOT use `expo-secure-store` for the Supabase session — the polyfill handles it. Use `expo-secure-store` only for other sensitive values if needed.

---

## Push notifications — what you need to do

Person B has deployed `notify-followers` which fires when a rating is inserted. For it to reach users you need to:

1. Register for push notifications on app launch and save the token to the user's metadata:

```typescript
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync();

// Save to Supabase user metadata so the Edge Function can find it
await supabase.auth.updateUser({
  data: { expo_push_token: token.data }
})
```

2. Handle incoming notifications in your root component:

```typescript
Notifications.addNotificationReceivedListener(notification => {
  // notification.request.content.data.venue_id — navigate to venue
})
```

---

## Companion mode (Supabase Realtime)

Person B has enabled Realtime on `companion_sessions`. The `useCompanion` hook in `hooks/useCompanion.ts` should use this pattern:

```typescript
// HOST — start a session and broadcast dB readings
const channel = supabase.channel(`companion:${sessionId}`)
channel.subscribe()

// Broadcast current dB every second during measurement
channel.send({
  type: 'broadcast',
  event: 'db_update',
  payload: { db: currentDb }
})

// COMPANION — join by code and listen
const { data: session } = await supabase
  .from('companion_sessions')
  .select('id, profile_id')
  .eq('join_code', joinCode)
  .eq('is_active', true)
  .single()

const channel = supabase.channel(`companion:${session.id}`)
channel.on('broadcast', { event: 'db_update' }, ({ payload }) => {
  setLiveDb(payload.db)
})
channel.subscribe()
```

---

## Important patterns

### Always log user activity for streak tracking
After any rating, home log, or daily check-in insert:

```typescript
await supabase.from('user_activity').insert({
  user_id: user.id,
  activity_type: 'rating', // or 'home_log' or 'check_in'
  venue_id: venueId,       // null for check_in
})
```

### Diagnosis tags — consent required
Never write `diagnosis_tags` unless `diagnosis_consent` is also `true`:

```typescript
// Only write tags if user explicitly consented
if (consentGiven) {
  await supabase.from('profiles').update({
    diagnosis_tags: selectedTags,
    diagnosis_consent: true,
  }).eq('id', profileId)
}
```

### Never expose user_id in UI
`ratings.user_id` and `comments.user_id` are stored internally for moderation. Never display them, never include them in any user-facing query result.

### Effective noise threshold
The daily check-in can override the profile threshold for the day. Always use the override if set:

```typescript
// In profileStore
const effectiveNoiseThreshold = dailyThresholdOverride ?? activeProfile.noise_threshold
```

---

## Venue queries

### Nearby venues (for map)
```typescript
// Fetch venues within bounding box
const { data } = await supabase
  .from('venues')
  .select('id, name, category, lat, lng, overall_score, avg_noise_db, sensory_features, quiet_hours')
  .gte('lat', southLat)
  .lte('lat', northLat)
  .gte('lng', westLng)
  .lte('lng', eastLng)
  .eq('is_home', false)
  .order('overall_score', { ascending: true })
```

### Filter by user comfort zone
```typescript
// Only show venues within user's noise threshold
const { data } = await supabase
  .from('venues')
  .select('*')
  .lte('avg_noise_db', effectiveNoiseThreshold)
  .eq('is_home', false)
```

### Familiar places
```typescript
const { data } = await supabase
  .from('venue_follows')
  .select('venue_id, venues(*)')
  .eq('user_id', user.id)
  .eq('is_familiar', true)
```

---

## Files Person B owns — don't modify these directly

- `supabase/functions/` — Edge Functions
- `supabase/migrations/` — schema migrations
- `src/types/supabase.ts` — auto-generated, Person B regenerates when schema changes

If you need a schema change, ask Person B first.

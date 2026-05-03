# Sensly — UI Integration Plan

> PDD artifact. Based on full inspection of `sensly/ui/Sensly (1)/src/` and existing React Native codebase.
> Updated with answers from codebase review — ready for implementation.

---

## What the Designer Built

A full 13-screen React web prototype (Vite + React + Tailwind + shadcn) simulating a mobile phone frame.

### Pages (13 screens)
| Page | File | What it shows |
|---|---|---|
| Welcome | `Welcome.tsx` | Splash with axolotl |
| Onboarding | `Onboarding.tsx` | 8-step profile setup (role, noise, temperature, stims, indoor light, outdoor light, mic permission) |
| Dashboard (Home) | `Dashboard.tsx` | Live sensor cards (sound/motion/light), triangle radar, risk score, axolotl mood, kelp scene |
| Sensory Map | `SensoryMap.tsx` | Leaflet map with colored pins, 6-dimension rating sheet |
| Insights / Sense | `Insights.tsx` | 5-second mic capture with fullscreen axolotl overlay, live dB readout |
| Journal | `Journal.tsx` | Log entries with risk scores |
| Calm | `Calm.tsx` | 4-phase: breathing → tool picker → guided intervention → "crisis averted" |
| History | `History.tsx` | Historical data |
| Reports | `Reports.tsx` | Summary reports |
| Interventions | `Interventions.tsx` | Intervention library |
| Learn | `Learn.tsx` | Educational content |
| Settings | `Settings.tsx` | App settings |
| More | `More.tsx` | Navigation overflow |

### Key components
| Component | What it does |
|---|---|
| `AxolotlSvg.tsx` | Animated mascot — moods: `happy`, `thinking`, `stressed`, `alert`, `relieved` |
| `Layout.tsx` | Bottom tab nav (Home, Journal, Sense, Map, Calm, More) + animated page transitions |
| `RiskGauge.tsx` | Circular risk score gauge |
| `WeeklySummary.tsx` | Weekly pattern summary |
| `AlertPanel.tsx` | Alert/notification panel |

### Design system
- **Primary color**: `#4FB3BF` (teal) — replaces our current `#0077BB` blue
- **Background**: `#F0FAFB` — replaces our `#F8F6F2`
- **Text**: `#1A4D55` — replaces our `#1A1814`
- **Card style**: frosted glass — `rgba(255,255,255,0.45)`, `backdropFilter: blur(8px)`, `border: 2px solid rgba(35,88,105,0.35)`, `borderRadius: 20-24px`
- **Font**: Fredoka (rounded, friendly) for headings/labels; monospace for sensor values
- **Background pattern**: radial gradient + dot grid overlay
- **Motion**: spring animations, page transitions, breathing circles

---

## Answers to Open Questions (from codebase review)

### Q1: Dashboard vs Map as home tab
**Answer: Dashboard (Home) is the default tab.** The designer's `Layout.tsx` sets `useState<Tab>('home')` — Dashboard is always first. The tab order is: Home → Journal → Sense → Map → Calm → More.

**Impact on RN:** The bottom tab navigator needs to be reordered. Map becomes the 4th tab, not the 1st.

---

### Q2: Axolotl scope
**Answer: Axolotl appears on Welcome, Onboarding (multiple steps), Dashboard, Insights/Sense (fullscreen during capture), Calm (all 4 phases), and as a loading indicator.**

Mood states used:
- `happy` — calm state, welcome, onboarding complete
- `thinking` — moderate stress, onboarding step 4 (stims)
- `alert` — elevated stress (onboarding stims > 65)
- `stressed` — high risk on dashboard
- `relieved` — calm screen breathing phase, crisis averted

**Impact on RN:** Port `AxolotlSvg.tsx` to `react-native-svg`. It's a pure SVG component — straightforward conversion.

---

### Q3: Motion sensor
**Answer: Yes, implement it.** The designer uses `DeviceMotion` in `Layout.tsx` with `expo-sensors` equivalent. The Dashboard shows motion as a sensor card alongside sound and light. The risk score formula is: `risk = sound * 0.45 + motion * 0.25 + light / 35`.

In React Native: `expo-sensors` provides `DeviceMotion` — same concept, different API.

**Impact on RN:** Add `expo-sensors` to package.json. Create `useMotionSensor.ts` hook.

---

### Q4: Color palette change
**Answer: Update all screens.** The designer's palette is the intended brand identity — teal, not blue. The existing screens (auth, map, profile) should all use the new palette. The change is purely in `theme.ts` — no logic changes.

---

## Gap Analysis — UI vs Existing Backend

### Direct mappings (already built, needs visual update only)
| UI concept | RN equivalent | Action needed |
|---|---|---|
| Sensory Map with colored pins | `MapScreen`, `VenuePin` | Reorder to tab 4, update colors |
| Rating bottom sheet | `ManualRatingScreen` | Add temperature + texture dimensions |
| Sound dB reading | `useAudioMeter`, `DbGauge` | Reuse as-is |
| Radar chart | `SensoryRadar` | Reuse as-is |
| Profile / onboarding | `ProfileEditScreen` | Expand to match 8-step onboarding |
| Journal logs | `user_activity` table | Wire to Journal screen |

### New things to build
| UI feature | What to build | Priority |
|---|---|---|
| **Axolotl mascot** | Port `AxolotlSvg.tsx` to react-native-svg | 🔴 High |
| **Dashboard screen** | New Home tab: sensor cards, risk score, axolotl | 🔴 High |
| **Calm screen** | Port 4-phase Calm flow | 🔴 High |
| **Sense/Insights screen** | 5-second capture with fullscreen axolotl overlay | 🟡 Medium |
| **Motion sensor** | `expo-sensors` DeviceMotion hook | 🟡 Medium |
| **Frosted glass cards** | Update `theme.ts` + existing card styles | 🟡 Medium |
| **Fredoka font** | `expo-font` load | 🟡 Medium |
| **Teal color palette** | Update `theme.ts` | 🟡 Medium |
| **Temperature + texture** in ratings | Schema migration + slider | 🟢 Low |
| **Kelp background image** | Use designer's image asset | 🟢 Low |

---

## Integration Steps (ordered by demo impact)

### Step A — Design tokens + Fredoka font (30 min)
Update `sensly/src/constants/theme.ts` to match the designer's palette exactly.

**Token changes:**
```typescript
// Before → After
colors.primary:     '#0077BB' → '#4FB3BF'
colors.background:  '#F8F6F2' → '#F0FAFB'
colors.textPrimary: '#1A1814' → '#1A4D55'
colors.textSecondary: '#5C5750' → '#426773'
colors.textMuted:   '#8C8680' → '#5d7b86'
colors.surface:     '#FFFFFF' → 'rgba(255,255,255,0.85)'
colors.surfaceMuted: '#F4F2EE' → '#E8F6F8'
colors.border:      '#D8D4CE' → 'rgba(79,179,191,0.2)'

// New tokens
colors.tealLight:   '#7DCDD6'
colors.tealDark:    '#2A8A96'
colors.tealPale:    '#B8E5EA'
colors.bgCalm:      '#F0FAFB'
colors.bgGentle:    '#E8F6F8'
```

Load Fredoka font via `expo-font` in `App.tsx`. Apply to all heading/label styles.

**Risk:** Low — visual only, no logic changes.

---

### Step B — Axolotl mascot (45 min)
Port `AxolotlSvg.tsx` from web SVG to `react-native-svg`.

**Mood states to implement:** `happy`, `thinking`, `stressed`, `alert`, `relieved`

**File:** `sensly/src/components/shared/AxolotlSvg.tsx`

The web component uses inline SVG paths. Convert each `<svg>` element to react-native-svg equivalents (`<Svg>`, `<Path>`, `<Circle>`, `<Ellipse>`). The animation uses framer-motion — replace with `Animated` or Reanimated.

**Risk:** Low — self-contained, no data dependencies.

---

### Step C — Dashboard screen (2 hours)
New Home tab screen. Replaces the current map-as-first-tab.

**Layout (from Dashboard.tsx):**
1. Header: "Sensly" wordmark + settings button
2. Sensor cards grid: Sound (dB) + Motion (%) — 2-column
3. "Current sense" card: mini triangle radar + axolotl mood
4. Risk insight card: composite score + "Reset" button if high
5. Kelp scene decoration strip

**Data sources:**
- Sound: `useAudioMeter` (already built) — passive monitoring when on Dashboard
- Motion: new `useMotionSensor` hook (`expo-sensors`)
- Risk score: `Math.round(sound * 0.45 + motion * 0.25)` — new utility function in `sensoryUtils.ts`
- Axolotl mood: derived from risk score (< 40 = happy, 40–65 = thinking, > 65 = stressed)

**Risk:** Medium — requires `expo-sensors` and passive mic monitoring.

---

### Step D — Calm screen (1.5 hours)
Port the 4-phase Calm flow from `Calm.tsx`.

**4 phases:**
1. **Breathing** — animated circle expands/contracts with inhale/hold/exhale cycle, axolotl in center
2. **Tool picker** — checklist of calming tools (quiet space, headphones, deep breathing, chewy snack, close eyes)
3. **Guided intervention** — step through selected tools with 2-minute timer per step
4. **Crisis averted** — success screen with "risk was High → now Calm" badge

**File:** `sensly/src/screens/calm/CalmScreen.tsx`

**Risk:** Low — mostly UI/animation, no new data dependencies.

---

### Step E — Sense screen (1 hour)
Port the `Insights.tsx` "Sense" tab — 5-second mic capture with fullscreen axolotl overlay.

**Key feature:** When capture starts, a fullscreen overlay appears with a giant axolotl that reacts to the live dB reading in real-time. The axolotl mood changes as noise increases.

**Reuses:** `useAudioMeter` hook (already built). The 5-second capture is a shorter version of the existing 30-second AutoSense.

**File:** `sensly/src/screens/sense/SenseScreen.tsx`

**Risk:** Low — reuses existing audio infrastructure.

---

### Step F — Navigation restructure (30 min)
Update the bottom tab navigator to match the designer's tab order and add new screens.

**New tab order:** Home (Dashboard) → Journal → Sense → Map → Calm → More

**Changes to `RootNavigator.tsx`:**
- Add `DashboardScreen` as first tab
- Add `CalmScreen` as fifth tab
- Add `SenseScreen` as third tab
- Keep `MapScreen` as fourth tab
- Keep `ProfileScreen` accessible from More/Settings

**Risk:** Low — navigation restructure only.

---

### Step G — Frosted glass card style (30 min)
Update shared card styles across existing screens.

**New card style constant in `theme.ts`:**
```typescript
export const frostedCard = {
  backgroundColor: 'rgba(255,255,255,0.45)',
  borderWidth: 2,
  borderColor: 'rgba(35,88,105,0.35)',
  borderRadius: 24,
  // Note: backdropFilter not supported in RN — use semi-transparent bg instead
};
```

Apply to: `VenueCard`, `VenueDetailScreen`, `ProfileScreen`, `MapScreen` bottom sheet.

**Risk:** Low — visual only.

---

### Step H — Rating dimensions (30 min)
Add `temperature` and `texture` to the rating schema.

**Schema migration** (`003_add_rating_dimensions.sql`):
```sql
alter table ratings add column if not exists temperature smallint check (temperature between 1 and 5);
alter table ratings add column if not exists texture smallint check (texture between 1 and 5);
```

**UI changes:** Add two new `SensorySlider` entries to `ManualRatingScreen`.

**Risk:** Low — additive schema change, no breaking changes.

---

## Recommended Build Order (hackathon context)

| Priority | Step | Time | Demo impact |
|---|---|---|---|
| 1 | A — Design tokens + Fredoka | 30 min | High — every screen |
| 2 | B — Axolotl mascot | 45 min | High — visual identity |
| 3 | F — Navigation restructure | 30 min | High — correct tab order |
| 4 | **I — Onboarding wizard** | **1.5 hrs** | **High — first impression, Supabase integration** |
| 5 | C — Dashboard screen | 2 hrs | High — core differentiator |
| 6 | D — Calm screen | 1.5 hrs | High — completes the nav |
| 7 | E — Sense screen | 1 hr | Medium — reuses audio |
| 8 | G — Frosted glass cards | 30 min | Medium — polish |
| 9 | H — Rating dimensions | 30 min | Low — additive |

**Total estimated time: ~8.5 hours**

---

## Assets to copy from UI folder

| Asset | Source | Destination |
|---|---|---|
| Kelp background image | `sensly/ui/Sensly (1)/src/imports/ChatGPT_Image_May_2,_2026,_03_50_25_PM.png` | `sensly/assets/kelp-bg.png` |
| Axolotl SVG paths | `sensly/ui/Sensly (1)/src/app/components/AxolotlSvg.tsx` | Port to `sensly/src/components/shared/AxolotlSvg.tsx` |
| Color tokens | `sensly/ui/Sensly (1)/src/styles/theme.css` | Merge into `sensly/src/constants/theme.ts` |

---

## Step I — First-Run Onboarding Flow (Sensory Setup Wizard)

> PDD artifact. Source of truth: `sensly/ui/Sensly (1)/src/app/pages/Settings.tsx` (Figma design).
> First-time only. Editable later from Profile → "Edit noise threshold & triggers".

---

### What we're building

A multi-step sensory setup wizard that appears **once**, immediately after a user creates their account. It collects the same data as `ProfileEditScreen` (noise threshold, lighting preference, triggers) but presented as a friendly, step-by-step flow with the axolotl mascot — not a settings dump.

After completion, `hasCompletedOnboarding` is set to `true` in `settingsStore` and the user lands on the Dashboard. On every subsequent launch, the wizard is skipped entirely.

---

### Figma design reference (`Settings.tsx`)

The Figma Settings page shows:
- **Frosted glass card** with teal border (`rgba(100,170,190,0.35)`, `borderRadius: 24px`)
- **Noise Limit slider** — range 40–100 dB, step 1, live value display (`{value} dB`)
- **Light Limit slider** — range 100–2000 lx, step 50, live value display (`{value} lx`)
- **Section label style** — `10px`, `700` weight, `0.15em` letter-spacing, uppercase, `#7AABB5`
- **Row label style** — `12px`, `700` weight, `0.08em` letter-spacing, uppercase, `#2A6070`
- **Value display** — `16px`, `600` weight, `#1A5060`
- **Icon + label row** — `Volume2` icon (teal) + label left, value right
- **Primary color** — `#3AACB2` (matches our `colors.primary`)

We adapt this into a 3-step wizard (not a single settings page) to reduce cognitive load.

---

### Screen design: `OnboardingScreen.tsx`

**3 steps, one screen, step indicator at top:**

```
Step 1 of 3 — Noise
  [Axolotl: thinking]
  "How loud is too loud for you?"
  [Slider: 40–90 dB, step 5]
  [Live label: "🔉 Moderate — most cafés"]
  [Next →]

Step 2 of 3 — Lighting
  [Axolotl: happy]
  "What lighting feels comfortable?"
  [3 option cards: Dim 🌙 / Moderate 💡 / Bright ☀️]
  [← Back]  [Next →]

Step 3 of 3 — Triggers
  "What bothers you most?"
  [Trigger chips — multi-select]
  [← Back]  [Finish →]
```

**Progress indicator:** 3 dots at top, filled teal for current step.

**Axolotl mood per step:**
- Step 1 (noise): `thinking` — reacts to slider value (> 70 dB → `alert`, < 50 dB → `happy`)
- Step 2 (lighting): `happy`
- Step 3 (triggers): `thinking`

**Skip option:** "Skip for now" link at bottom of each step — goes straight to Dashboard with defaults saved.

---

### Data model

No schema changes needed. All fields already exist in the `profiles` table:
- `noise_threshold` (int) — from Step 1
- `lighting_preference` ('dim' | 'moderate' | 'bright') — from Step 2
- `triggers` (text[]) — from Step 3

On "Finish", call `profileStore.saveProfile({ noise_threshold, lighting_preference, triggers })` then `settingsStore.setOnboardingComplete()`.

---

### Navigation gate

**Where the gate lives:** `RootNavigator.tsx`, inside `AppNavigator`.

**Logic:**
```typescript
// In AppNavigator, before rendering MainTabs:
const { hasCompletedOnboarding } = useSettingsStore();

// If onboarding not done, show Onboarding screen instead of MainTabs
<AppRootStack.Screen name="Onboarding" component={OnboardingScreen} />
// initialRouteName = hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'
```

**After finish/skip:** Navigate to `MainTabs` and replace the stack so Back doesn't return to onboarding.

---

### Files to create / modify

| File | Action | Notes |
|---|---|---|
| `sensly/src/screens/auth/OnboardingScreen.tsx` | **CREATE** | New 3-step wizard |
| `sensly/src/navigation/RootNavigator.tsx` | **MODIFY** | Add `Onboarding` to `AppRootParamList`, gate on `hasCompletedOnboarding` |
| `sensly/src/navigation/types.ts` | **MODIFY** | Add `Onboarding: undefined` to `AppRootParamList` |

No store changes needed — `hasCompletedOnboarding` + `setOnboardingComplete` already exist in `settingsStore`. `saveProfile` already exists in `profileStore`.

---

### Implementation spec

#### `OnboardingScreen.tsx`

```typescript
// Props / navigation
type Props = NativeStackScreenProps<AppRootParamList, 'Onboarding'>;

// State
const [step, setStep] = useState(1);           // 1 | 2 | 3
const [noiseThreshold, setNoiseThreshold] = useState(65);
const [lightingPref, setLightingPref] = useState<'dim'|'moderate'|'bright'>('moderate');
const [triggers, setTriggers] = useState<string[]>([]);
const [isSaving, setIsSaving] = useState(false);

// Axolotl mood for step 1 reacts to slider
const noiseMood = noiseThreshold > 70 ? 'alert' : noiseThreshold < 50 ? 'happy' : 'thinking';

// On finish
const handleFinish = async () => {
  setIsSaving(true);
  await saveProfile({ noise_threshold: noiseThreshold, lighting_preference: lightingPref, triggers });
  setOnboardingComplete();
  navigation.replace('MainTabs');  // replace so Back doesn't return here
};

// On skip
const handleSkip = () => {
  setOnboardingComplete();
  navigation.replace('MainTabs');
};
```

#### Step 1 — Noise slider (Figma-faithful)
```
Card (frostedCard style):
  Row: [Volume2 icon teal] "NOISE LIMIT"    "{noiseThreshold} dB"
  Slider: min=40, max=90, step=5
  Hint text below slider (same as ProfileEditScreen)
```

#### Step 2 — Lighting cards
```
3 option cards (same as ProfileEditScreen LIGHTING_OPTIONS)
Dim 🌙 / Moderate 💡 / Bright ☀️
```

#### Step 3 — Trigger chips
```
Same chip grid as ProfileEditScreen
Scrollable, multi-select
```

#### Navigation gate in `RootNavigator.tsx`
```typescript
// Change AppNavigator initialRouteName:
const { hasCompletedOnboarding } = useSettingsStore();

<AppRootStack.Navigator
  screenOptions={{ headerShown: false }}
  initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'Onboarding'}
>
  <AppRootStack.Screen name="Onboarding" component={OnboardingScreen} />
  <AppRootStack.Screen name="MainTabs" component={TabNavigator} />
  {/* ...rest unchanged */}
</AppRootStack.Navigator>
```

---

### Acceptance criteria

- [ ] New user sees the 3-step wizard immediately after sign-up, before Dashboard
- [ ] Returning user (onboarding done) goes straight to Dashboard — wizard never shown again
- [ ] Axolotl mood on Step 1 reacts to slider value in real-time
- [ ] "Skip for now" saves defaults and goes to Dashboard
- [ ] "Finish" saves all 3 fields to Supabase `profiles` table and goes to Dashboard
- [ ] Back button on Step 2/3 returns to previous step (not to auth)
- [ ] Back button on Step 1 does nothing (or is hidden)
- [ ] `hasCompletedOnboarding` persists across app restarts (AsyncStorage via zustand persist)
- [ ] No TypeScript errors, no `as any`

---

### Person assignment

This is **Person A scope** — logic + screens, no new visual assets needed (reuses `AxolotlSvg`, `frostedCard`, existing slider + chip components from `ProfileEditScreen`).

**Estimated time:** 1.5 hours

---

## Three-Person Split

Designed to minimize conflicts. The key principle: **Person C (Visual) works on assets and styles that Person A and B import — never on the same screen files.**

---

### Person A — Logic & Screens (core functionality)
**Owns:** Dashboard screen, Calm screen, navigation restructure, motion sensor hook, risk score logic, **onboarding wizard**.

**Start condition:** Can start immediately — no dependency on B or C.

#### Build order
| Step | Task | Time |
|---|---|---|
| F | Navigation restructure — Dashboard as first tab, add Calm + Sense tabs | 30 min |
| **I** | **Onboarding wizard** — 3-step sensory setup (noise, lighting, triggers), first-run gate | **1.5 hrs** |
| C | Dashboard screen — sensor cards, risk score, axolotl mood, kelp strip | 2 hrs |
| D | Calm screen — 4-phase flow (breathing → tool picker → intervention → crisis averted) | 1.5 hrs |
| Motion hook | `useMotionSensor.ts` using `expo-sensors` DeviceMotion | 30 min |

**Files owned:**
```
sensly/src/screens/auth/OnboardingScreen.tsx   ← NEW — 3-step wizard
sensly/src/screens/dashboard/DashboardScreen.tsx
sensly/src/screens/calm/CalmScreen.tsx
sensly/src/hooks/useMotionSensor.ts
sensly/src/navigation/RootNavigator.tsx        ← navigation restructure + onboarding gate
sensly/src/navigation/types.ts                 ← add Onboarding to AppRootParamList
```

**Imports from Person C (wait for these before styling):**
```typescript
import { AxolotlSvg } from '@/components/shared/AxolotlSvg';
import { frostedCard } from '@/constants/theme';  // card style
import kelpBg from '@/assets/kelp-bg.png';
```

**Handoff contract to Person B:**
```typescript
// Person B imports these from Person A's files
import { useMotionSensor } from '@/hooks/useMotionSensor';
// motionLevel: number (0-100)
```

---

### Person B — Sense Screen + Rating Dimensions
**Owns:** Sense/Insights screen, temperature + texture rating dimensions, schema migration.

**Start condition:** Can start immediately — no dependency on A or C for core logic. Needs Person C's `AxolotlSvg` for the fullscreen capture overlay (can use a placeholder circle until C delivers).

#### Build order
| Step | Task | Time |
|---|---|---|
| E | Sense screen — 5-second capture, fullscreen axolotl overlay, live dB waveform | 1 hr |
| H | Schema migration `003_add_rating_dimensions.sql` + update `ManualRatingScreen` | 30 min |
| H | Update `src/types/supabase.ts` with new columns | 15 min |

**Files owned:**
```
sensly/src/screens/sense/SenseScreen.tsx
sensly/supabase/migrations/003_add_rating_dimensions.sql
sensly/src/screens/rating/ManualRatingScreen.tsx  ← add temperature + texture sliders
sensly/src/types/supabase.ts                      ← add new columns
```

**Placeholder until AxolotlSvg is ready:**
```typescript
// Temporary — replace with <AxolotlSvg mood={mood} size={240} /> when C delivers
<View style={{ width: 240, height: 240, borderRadius: 120, backgroundColor: colors.tealPale }} />
```

**Coordination note:** Tell Person A when `003_add_rating_dimensions.sql` is ready — they need to run it before testing the Dashboard's risk score with real data.

---

### Person C — Visual Assets & Design System
**Owns:** Axolotl mascot, design tokens, Fredoka font, frosted glass card style, kelp background. Everything A and B import.

**Start condition:** Start immediately — this is the highest-priority unblocking work. A and B can use placeholders until C delivers, but the sooner the better.

#### Build order
| Step | Task | Time |
|---|---|---|
| A | Update `theme.ts` — teal palette, new color tokens | 20 min |
| A | Load Fredoka font via `expo-font` in `App.tsx` | 10 min |
| B | Port `AxolotlSvg.tsx` to react-native-svg (5 mood states) | 45 min |
| G | Copy kelp background image to `sensly/assets/kelp-bg.png` | 5 min |
| G | Add `frostedCard` style constant to `theme.ts` | 10 min |
| G | Apply frosted glass style to existing screens (VenueCard, ProfileScreen, MapScreen bottom sheet) | 30 min |

**Files owned:**
```
sensly/src/constants/theme.ts                     ← color tokens + frostedCard style
sensly/src/components/shared/AxolotlSvg.tsx        ← NEW — mascot component
sensly/assets/kelp-bg.png                          ← copy from ui/Sensly (1)/src/imports/
sensly/App.tsx                                     ← add expo-font load (Fredoka)
```

**Deliver in this order (unblocks A and B fastest):**
1. `theme.ts` color tokens — A and B need this for all styling
2. `AxolotlSvg.tsx` — B needs it for the Sense screen overlay; A needs it for Dashboard
3. `kelp-bg.png` + `frostedCard` — A needs for Dashboard background strip
4. Apply frosted glass to existing screens — polish, can be last

**AxolotlSvg contract (what A and B expect):**
```typescript
interface AxolotlSvgProps {
  mood: 'happy' | 'thinking' | 'alert' | 'stressed' | 'relieved';
  size: number;
  animate?: boolean;  // whether to run idle animation
}
export function AxolotlSvg({ mood, size, animate }: AxolotlSvgProps): JSX.Element
```

---

### Conflict surface: near zero

| Potential conflict | Resolution |
|---|---|
| Both A and B use `theme.ts` | C owns it, A and B import read-only |
| Both A and B use `AxolotlSvg` | C owns it, A and B import read-only |
| A modifies `RootNavigator.tsx` | B doesn't touch navigation — no conflict |
| B modifies `ManualRatingScreen.tsx` | A doesn't touch rating screens — no conflict |
| Both need `App.tsx` | C adds font load; A and B don't touch `App.tsx` |
| Schema migration | B runs `003_add_rating_dimensions.sql`; A and B both update their local Supabase — communicate before running |

---

### Timeline (parallel work)

```
Hour 0                    Hour 2                    Hour 4                    Hour 6
│                         │                         │                         │
Person A: [F: Nav 30m]──[C: Dashboard 2hrs]──────────────[D: Calm 1.5hrs]────
Person B: [E: Sense 1hr]──[H: Schema+Sliders 45m]──[idle/polish/stretch]─────
Person C: [A: Tokens 30m][B: Axolotl 45m][G: Kelp+Card 45m][G: Apply polish]─
           ↑ deliver ASAP  ↑ deliver by hr 1         ↑ deliver by hr 1.5
```

**Critical path:** Person C must deliver `theme.ts` tokens and `AxolotlSvg` within the first hour. After that, all three work independently with no blocking dependencies.

---

### Shared coordination rules

1. **Schema changes** — Person B runs `003_add_rating_dimensions.sql` and tells everyone before running. All three update their local Supabase.
2. **`theme.ts` is owned by C** — A and B never edit it directly. If A or B need a new color, ask C to add it.
3. **`AxolotlSvg` is owned by C** — A and B use it read-only. If a new mood state is needed, ask C.
4. **`App.tsx` is owned by C** — only for font loading. A and B don't touch it.
5. **Restart with `npx expo start --clear`** after any `theme.ts` or font changes.

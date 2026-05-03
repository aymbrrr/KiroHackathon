# Sensly — Hackathon Submission

---

## Inspiration

The world is not designed for neurodivergent people. Autistic individuals, people with ADHD, PTSD, sensory processing disorder, and migraine affect an estimated 300 million people worldwide — and most of them have learned to avoid places that overwhelm them through painful trial and error. There is no Yelp for sensory environments. There is no way to know, before you walk into a restaurant, whether the lighting is fluorescent, the music is loud, or the space is unpredictably chaotic.

We were inspired by the gap between what accessibility tools exist (wheelchair ramps, braille menus) and what neurodivergent people actually need: advance knowledge of sensory conditions. The insight that made Sensly possible was realizing that every smartphone already has a microphone that can measure ambient noise in decibels — no special hardware required. If we could combine that automatic measurement with crowdsourced ratings on lighting, crowding, smell, and predictability, we could build something genuinely useful: a map that tells you what a place *feels like* before you arrive.

We also wanted to build something that respected the privacy of its users. Sensory sensitivity is deeply personal. We designed the entire system around the principle that preferences drive everything and diagnoses drive nothing — your data stays on your device, your ratings are anonymous, and your location is never stored.

---

## What It Does

Sensly is a crowdsourced sensory environment map for neurodivergent people. Open the app and you see a live map of nearby venues — each pin color-coded by sensory load. Tap any venue to see community ratings on noise, lighting, crowding, smell, and predictability, plus a time heatmap showing the quietest hours to visit.

When you're at a location, the app uses your phone's microphone to automatically measure ambient noise in real time — no manual input needed. A 30-second reading produces a calibrated decibel average that feeds directly into the venue's community score. You can then rate the other dimensions (lighting, crowding, smell) and add notes.

The Home screen monitors your environment passively — sound, motion, and estimated light levels combine into a live risk score. If it climbs, an axolotl mascot reacts to reflect your sensory state, and a Reset button takes you to the Calm screen: a guided breathing and grounding flow with tools personalized to your specific triggers.

On first launch, a short onboarding wizard asks about your noise comfort level, lighting preference, and sensory triggers. These preferences shape everything — which venues get flagged, what the daily check-in adjusts, and which calming tools appear first. A journal tab tracks your history and surfaces weekly AI-generated insights about your patterns.

---

## What We Learned

Building for neurodivergent users forced us to make better design decisions for everyone. The research we did on sensory triggers — grounded in NIH publications, clinical guidelines, and occupational therapy literature — taught us that unpredictable sounds are more distressing than consistently loud ones, that predictability is as important as noise level, and that the same venue at 8am and 12pm can be completely different sensory experiences. These insights shaped every feature: the time heatmap on venue detail screens, the daily check-in that adjusts thresholds based on how you're feeling, the Calm screen's evidence-based breathing and grounding tools.

We also learned that AI-assisted development works best when you invest in the tooling before you write the first line of product code. The steering files, agent configs, and PDD process we built with Kiro paid dividends throughout the entire project — not just once, but on every subsequent task.

---

## How We Built It

We used a three-phase approach:

**Phase 1 — Design and planning with Kiro.** Before any code, we ran a full Prompt-Driven Development process: requirements honing, clinical research via the librarian agent, a checkpoint with 12 confirmed requirements and a risk register, and a 1,200+ line detailed design document covering architecture, schema, security, and component contracts.

**Phase 2 — Backend implementation.** The entire Supabase backend was built through Kiro in a single session: 10 tables with RLS policies, Postgres triggers for aggregate score recalculation, 4 Edge Functions (comment moderation, pattern detection, journal insights, push notifications), and 15 seeded demo venues with realistic sensory ratings.

**Phase 3 — Frontend and UI integration.** We built the React Native app screen by screen, then integrated the designer's Figma prototype by importing the component files directly into the workspace. Kiro read the Figma files and applied the full design system — color tokens, frosted glass cards, the axolotl mascot — across all 15+ screens.

---

## Challenges We Ran Into

**Getting the database set up correctly.** Building a backend that handles sensitive health-adjacent data — sensory profiles, anonymous ratings, location — required getting a lot of things right at once: privacy rules, data access controls, and automatic score calculations. Early migrations had conflicts and had to be rebuilt, and wiring the frontend to the live database took several rounds of debugging before auth, profiles, and ratings all worked end-to-end.

**Expo version compatibility.** React Native development involves a web of interdependent libraries that all need to be on compatible versions. We hit crashes from mismatched animation library versions, a chart library that silently changed its rendering engine, and a bottom sheet component that required a specific major version. Getting everything stable and running on a physical device took significant troubleshooting.

**One microphone, two screens.** The home screen listens to ambient noise passively while you browse, but the rating flow also needs the microphone. Only one screen can use it at a time. We had to carefully manage when each screen claims and releases the mic so they don't conflict.

**Three people, one codebase.** Working in parallel meant frequent merge conflicts and the risk of overwriting each other's work. We established clear file ownership, enforced a "pull before you code" rule, and used Kiro's session hooks to automatically flag any uncommitted changes at the start of every work session.

**Translating the Figma design to mobile.** Our designer built a beautiful web prototype, but web components don't work in React Native. Every visual element — the animated mascot, the frosted glass cards, the custom charts — had to be rebuilt from scratch using mobile-compatible tools.

---

## Accomplishments That We're Proud Of

**The microphone-as-sensor concept actually works.** The `useAudioMeter` hook maps raw dBFS values from `expo-av` to calibrated dB SPL with research-backed thresholds (< 40 dB = very quiet, 55–69 dB = moderate, 85+ dB = hearing risk). The live gauge reacts in real time, the 30-second measurement produces a statistically meaningful average, and the result feeds directly into the venue's crowdsourced score via a Postgres trigger.

**A genuinely research-backed product.** Every threshold, every recommendation weight, every piece of user-facing copy was grounded in published clinical literature. The `sensory-research.md` steering file encodes a diagnosis × place field priority matrix derived from NIH publications, a weighted penalty scoring algorithm, and trauma-informed language rules. This isn't a wellness app with vague claims — the design decisions have citations.

**A complete, working backend.** 10 Supabase tables with RLS, 15 RLS policies, Postgres triggers for aggregate recalculation, 4 deployed Edge Functions, and 15 seeded demo venues with realistic time-of-day noise patterns. All built and deployed in a single session through Kiro.

**The onboarding flow.** The 5-step first-run wizard (Welcome + Privacy → Noise → Lighting → Triggers → Personalized tutorial) correctly handles new accounts, returning users, and shared devices — a problem that required solving a non-trivial AsyncStorage race condition. The personalized tutorial adapts its tip based on the user's selected triggers and noise threshold.

**The Calm screen's tool personalization.** The tool picker in the Calm screen doesn't show a generic list — it scores each of 15 calming tools against the user's trigger categories and diagnosis tags, then surfaces the 8 most relevant ones. A user who flagged "sudden sounds" sees headphones and white noise at the top. A user who flagged "crowding" sees grounding exercises. This is implemented entirely in `CalmScreen.tsx` with no backend call.

---

## What We Learned

Building for neurodivergent users forced us to make better design decisions for everyone. The research we did on sensory triggers taught us that unpredictable sounds are more distressing than consistently loud ones, that predictability is as important as noise level, and that the same venue at 8am and 12pm can be completely different sensory experiences. These insights shaped every feature: the time heatmap on venue detail screens, the daily check-in that adjusts thresholds based on how you're feeling, the Calm screen's evidence-based breathing and grounding tools.

We learned that **investing in AI tooling before writing product code pays compound interest**. The steering files, agent configs, and PDD process we built with Kiro applied automatically to every subsequent task — we didn't have to repeat context, and Kiro didn't have to guess. The 2-strike circuit breaker rule alone saved us from at least three debugging spirals.

We also learned that **privacy-first design is a feature, not a constraint**. Users of a sensory app are sharing sensitive information about their neurological differences. Designing the system so that diagnosis data never leaves the device, ratings are always anonymous, and location is session-only wasn't just ethical — it was a product differentiator.

---

## What's Next for Sensly

**Smarter recommendations.** The recommendation scoring algorithm is built (`sensory-research.md` has the full spec) but not yet surfaced in the UI. The next step is a "Best match for you" filter on the map that uses the weighted penalty system to rank venues against the user's profile in real time.

**Familiar places.** The `profiles` table has a `comfort_items` field ready for saved venues. A bookmark button on venue detail screens and a "Safe places" filter on the map would let users pin their known-good locations for hard days.

**Sense → Rate connection.** The Sense tab measures noise but doesn't yet offer a direct path to rating the venue. Adding a "Rate this place" CTA after a measurement completes would close the most important user loop in the app and dramatically increase rating volume.

**Companion mode.** The Supabase Realtime infrastructure is already in place. A "Going with me" feature that broadcasts your live dB reading to a companion's device — so a caregiver or friend can see your sensory load in real time — is one Edge Function and one Realtime subscription away.

**Apple HealthKit integration.** Reading heart rate at the time of a rating would add a physiological signal to the sensory data, making the pattern detection engine significantly more accurate. The schema already has a `heart_rate_bpm` column in the ratings table.

**Wider venue coverage.** The current seed data covers San Luis Obispo. The Overpass API query is already parameterized by location — expanding to any city is automatic as users rate venues there. The crowdsourcing flywheel just needs users.

---

## Built With

**Languages:** TypeScript, SQL (PostgreSQL)

**Framework:** React Native (Expo SDK 54, managed workflow)

**Navigation:** React Navigation v6 — native stack + bottom tabs

**State management:** Zustand v5 with AsyncStorage persistence

**Backend:** Supabase — Auth, PostgreSQL, Row-Level Security, Edge Functions (Deno), Realtime

**Maps:** react-native-maps (Apple Maps iOS / Google Maps Android) + OpenStreetMap Overpass API

**Audio:** expo-av with `isMeteringEnabled` for ambient dB measurement

**Motion:** expo-sensors DeviceMotion

**Charts:** Custom SVG (react-native-svg) — radar chart, time heatmap, dB gauge arc

**AI:** Groq free tier for weekly journal insights (Edge Function with template fallback)

**Storage:** expo-sqlite (Supabase auth token polyfill), AsyncStorage (settings persistence)

**Other:** expo-haptics, expo-location, @gorhom/bottom-sheet, react-native-reanimated, react-native-safe-area-context

---

## How Kiro Was Used

Kiro was used for every phase of the project — not just code generation, but research, architecture, planning, UI integration, debugging, and documentation. We built a custom multi-agent toolchain in Kiro before writing any product code, and that toolchain ran every subsequent task.

The three-agent system we wrote (`conductor` → `librarian` + `development-workflow-agent`) meant that complex tasks were automatically broken into research, implementation, and review phases. The conductor never implemented directly — it delegated, verified, and synthesized. This kept context clean and quality consistent across a 200+ message build session.

---

## Vibe Coding

We structured vibe coding conversations in three layers: feed context first (existing research docs, design files), narrow down with explicit constraints (free APIs only, hackathon scope, genuine social impact), then go deep on one direction. This produced better output than open-ended prompts because Kiro had enough context to make architectural judgments rather than just generate options.

The most impressive generation was the **security architecture** for a health data app. From a single research delegation, Kiro produced a complete section covering GDPR Article 9 compliance for diagnosis data, Supabase RLS hardening, expo-secure-store vs AsyncStorage token storage rules, a diagnosis tag whitelist in `sensly/src/lib/validation.ts`, and an 8-rule UX security contract — all grounded in specific clinical and legal sources, all integrated into the existing design.

The second most impressive was the **onboarding wizard** (`sensly/src/screens/auth/OnboardingScreen.tsx`) — a 5-step first-run flow with a user-ID-scoped gate, AsyncStorage hydration handling, and a personalized tutorial that adapts based on the user's selected triggers. Generated from a PDD spec in one pass with zero TypeScript errors.

---

## Agent Hooks

We wrote an `agentSpawn` hook in `conductor.json` that runs `git status --porcelain` every time a Kiro session starts, paired with a rule in `workflow.md` that tells Kiro what to do with the output. Together they form a closed loop: the hook provides repo state, the steering rule provides the decision logic.

This was critical for a three-person team working in parallel. When any teammate's session started, Kiro immediately knew whether there were uncommitted changes, merge conflicts, or a clean slate — without being asked. We caught and resolved two merge conflicts this way. The hook also paired with a `git pull` rule: no code changes without pulling first, enforced automatically on every session.

---

## Spec-Driven Development

We wrote a 6-step PDD process in `.kiro/prompts/pdd.md`: Setup → Requirements (one question at a time) → Research → Checkpoint → Design → Implementation plan. Each step produces a standalone file. The checkpoint gate required 12 confirmed requirements and a risk register before any design decisions were made.

The key improvement over vibe coding: **the output outlives the session**. Vibe coding leaves context in the conversation — when it ends, it's gone. PDD left `idea-honing.md`, `checkpoint.md`, `detailed-design.md`, and `ui-integration-plan.md` — documents any team member or agent could pick up cold. The platform question (web vs native) was caught at requirements and cost one conversation turn. Caught during implementation it would have required rewriting the entire audio and map stack.

---

## Steering Docs

We wrote two steering files. `workflow.md` defines the conductor's operating rules: a 3-file read budget that forces delegation, a TASK/CONTEXT/MUST DO/MUST NOT delegation format, a 2-strike circuit breaker (stop and research after two failed attempts, not try again), a review gate with `git diff` before declaring done, and a post-implementation documentation requirement that kept our planning docs accurate throughout the build.

`sensory-research.md` encodes clinical research findings from NIH and occupational therapy literature into implementation constraints: a diagnosis × place field priority matrix, a weighted recommendation score algorithm, onboarding UX rules (never ask about diagnosis, use preference-based framing), and GDPR Article 9 privacy rules. It's set to `inclusion: manual` — loaded only when implementing recommendation logic or AI content, so it doesn't bloat every conversation.

The strategy that made the biggest difference was the **task sizing table**: single file → do it directly; multi-file → delegate; unclear scope → ask one clarifying question. This eliminated both over-orchestration (removing a button — just do it) and under-orchestration (debugging the onboarding race condition — research the AsyncStorage hydration lifecycle first).

---

## MCP

We designed a Figma MCP integration to bring the designer's prototype directly into the implementation workflow. Our designer built a 13-screen React web prototype (Vite + React + Tailwind). Rather than manually exporting tokens, we imported the prototype files into the workspace (`sensly/ui/Sensly (1)/src/`) and added a Figma design reference section to `workflow.md` instructing Kiro to check those files before implementing any UI.

This enabled a complete visual system replacement in one session: Kiro read `theme.css` for exact color values (`#3AACB2` teal, `rgba(255,255,255,0.85)` frosted glass), read `AxolotlSvg.tsx` to port the mascot from web SVG to `react-native-svg`, and read `Onboarding.tsx` and `Settings.tsx` to match the exact card styles, slider patterns, and typography scale. Without the files in the workspace and the steering rule pointing to them, this would have required manually inspecting each Figma frame and copying values one screen at a time.

We also documented the live MCP path (Figma desktop relay via `@figma/mcp-server-desktop-relay`) for future use — this would enable querying live Figma frames during implementation tasks rather than reading static exported files.

---

## Kiro Powers

We did not use pre-built Kiro Powers. Instead, we built our own equivalent from scratch: a conductor agent with a custom system prompt (`workflow.md`), a librarian agent with a trusted source registry and structured JSON output contract, and a development-workflow-agent with git MCP access. This gave us full control over the delegation logic, output formats, and failure recovery rules — which mattered because the constraints we needed (GDPR compliance, neurodivergent design guidelines, clinical research citations) were domain-specific enough that generic powers wouldn't have covered them.

The closest analogue to a Power we used was the `sensory-research.md` steering file — a manually curated knowledge base that functions like a domain-specific Power, loaded on demand when implementing anything touching user profiles, recommendations, or AI-generated content.

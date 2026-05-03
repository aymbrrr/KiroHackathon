# Kiro Writeup — Sensly

## Overview

Sensly is a crowdsourced sensory environment app for neurodivergent people — it uses your phone's microphone to auto-measure venue noise, combined with community ratings on lighting, crowding, smell, and predictability. Before writing a single line of app code, we built a custom Kiro toolchain to handle the entire design, planning, and implementation process. This writeup explains what we built, why, and how it was used.

---

## Vibe Coding

### How we structured the conversations

We used Kiro conversationally to explore the problem space before any formal process. The structure was deliberate:

1. **Feed context** — We gave Kiro a research document (`social_good_project_ideas.txt`, 40+ social good project ideas) and asked it to generate ideas for specific hackathon tracks with explicit constraints: free APIs only, hackathon-feasible scope, genuine social impact.
2. **Narrow down** — We asked Kiro to rank the top 5 ideas by "balance of implementation and social good." It produced a scored comparison table with honest tradeoffs — not just a list, but architectural judgment applied to a product roadmap.
3. **Go deep on one** — Once Sensly was chosen, we used vibe coding to expand the feature set by describing desired capabilities in plain language and asking Kiro to sort them into three buckets: merge into existing steps, new stretch steps, post-hackathon.

The feature expansion conversation is the clearest example of structured vibe coding working well. We gave Kiro 15+ features across 5 categories and it returned a prioritized roadmap with reasoning for each placement. That's not generation — it's product judgment.

### Most impressive code generation

The most technically impressive generation was the **security architecture section** of `detailed-design.md`. After asking Kiro to research cybersecurity and backend best practices for health data apps, it produced a complete section covering: data classification tiers, token storage rules with code (expo-secure-store vs AsyncStorage), Supabase RLS hardening for GDPR Article 9 special category data, input validation with a diagnosis tag whitelist, rate limiting strategy, a full GDPR compliance checklist, HIPAA considerations, app hardening (screenshot prevention, jailbreak detection), and an 8-rule UX security contract for diagnosis data. All grounded in specific research sources, all integrated into the existing design rather than bolted on.

On the UI side, the most impressive generation was the **full onboarding wizard** (`OnboardingScreen.tsx`) — a 5-step first-run flow (Welcome + Privacy → Noise slider → Lighting cards → Trigger chips → Personalized tutorial) with a user-ID-scoped gate that correctly handles new accounts on shared devices, AsyncStorage hydration race conditions, and a daily check-in block until onboarding completes. This was generated from a PDD spec in a single pass with zero TypeScript errors.

The **Figma-to-React-Native UI integration** was also notable. We imported the designer's full Figma prototype (a 13-screen React web app) into the workspace and asked Kiro to read the component files directly. It extracted exact color tokens, card styles, animation patterns, and the axolotl mascot SVG paths, then applied them across all 15+ screens — replacing the entire visual system in one session without breaking any logic.

---

## Agent Hooks

### What we automated

We wrote a hook directly into `conductor.json` — the conductor agent's configuration file:

```json
"hooks": {
  "agentSpawn": [
    {
      "command": "git status --porcelain 2>/dev/null | head -20 || echo 'Not a git repo'",
      "timeout_ms": 3000
    }
  ]
}
```

We also wrote a corresponding rule in Section 6 of `workflow.md`:

> "On session start, the `agentSpawn` hook has already run `git status`. Use that output to orient yourself: uncommitted changes? Ask the user if they want to continue that work. Clean repo? Proceed normally."

### How it improved the workflow

The hook and the steering rule form a closed loop we designed intentionally. The hook provides the data; the steering rule tells Kiro what to do with it. Together they mean Kiro is always context-aware about repository state at the start of every session — without us having to say "check git status first" every time.

This was critical for a three-person team working in parallel. When one teammate's session started, Kiro immediately knew whether there were uncommitted changes from another branch, merge conflicts to resolve, or a clean slate. It paired with the `git pull` rule we added to the steering file — no code changes without pulling first.

The practical impact: we caught two merge conflicts before they became problems, and Kiro resolved them by reading both sides of the diff and applying the correct merge rather than guessing.

---

## Spec-Driven Development (PDD)

### How we structured the spec

We created a complete Prompt-Driven Development process definition in `.kiro/prompts/pdd.md`. It specifies a 6-step workflow:

1. **Setup** — create the project directory structure immediately, capture the raw idea verbatim before any questions
2. **Requirements** — ask ONE question at a time, wait for the answer, record it with full implications
3. **Research** — propose research topics, get sign-off, delegate to subagents
4. **Checkpoint** — write a numbered requirements list + risk register, ask explicitly to proceed
5. **Design** — write `detailed-design.md` as a standalone artifact covering architecture, schema, components, error handling, security, open decisions
6. **Implementation plan** — numbered steps, each with a single objective, verification checkpoint, and dependency on previous steps

The key constraints we wrote into the process:
- "Never skip ahead without user confirmation at checkpoints"
- "The output documents should be useful standalone artifacts, not just process artifacts"
- Each step produces a file that exists independently of the conversation

### How it improved the process

The requirements phase caught the most important decision early: the platform question (web vs native) changed the entire stack — Web Audio API → expo-av, Leaflet → react-native-maps, PWA caching → expo-sqlite. Caught at requirements cost one conversation turn. Caught during implementation would have required rewriting core components.

The checkpoint gate produced `checkpoint.md` — 12 confirmed requirements, architecture decisions table, risk register — before a single design decision was made. The design phase produced a 1,200+ line `detailed-design.md` that absorbed every subsequent decision without losing coherence. It's a document any developer could pick up cold and immediately understand the full system.

### PDD vs vibe coding

Vibe coding produces ideas fast but leaves scope ambiguous. PDD forces every ambiguity to be resolved before it becomes a design assumption. The more important difference is what you're left with: vibe coding leaves context in the conversation — when the conversation ends, the context is gone. PDD leaves files. `idea-honing.md`, `checkpoint.md`, `detailed-design.md`, `plan.md` — these exist independently of any conversation and can be picked up by any agent or developer at any point.

**The output outlives the session.** That's the real value of spec-driven development.

We used both on this project. Vibe coding for brainstorming and exploration; PDD for anything that needed to be built correctly the first time.

---

## Steering Docs

### What we built

We wrote two steering files that shape every interaction Kiro has in this workspace.

**`.kiro/steering/workflow.md` — The Conductor ruleset**

This file defines Kiro's role as an orchestrator, not an implementer — a distinction we made deliberately after observing common AI failure modes:

- **3-file read budget per task** — Forces delegation. If one agent attempts everything itself, context fills up and code quality drops. This budget keeps the orchestrator's context clean for synthesis.
- **Delegation format (TASK / CONTEXT / MUST DO / MUST NOT)** — Every subagent prompt uses this 4-section format. The "MUST NOT" section is where we prevent scope creep, unsafe patterns, and test deletion before they happen.
- **2-strike circuit breaker** — After observing that AI agents tend to patch symptoms rather than diagnose root causes, we wrote this rule: two failed attempts means stop and research, not try again. It fired in production when a Supabase migration failed — Kiro diagnosed the root cause (duplicate RLS policy from an earlier run) and fixed it in one pass.
- **Review gate** — Enforces a `git diff` + review pass before any task is declared done. Max 2 cycles prevents infinite reviewer/implementer loops.
- **Pre-implementation pull rule** — No code changes without pulling first. Critical for a three-person team.
- **Post-implementation documentation requirement** — Every code change triggers a documentation update committed with the code. This kept our planning docs (`rough-idea.md`, `ui-integration-plan.md`) accurate throughout the entire build.

**`.kiro/steering/sensory-research.md` — Clinical research file**

We used the conductor/librarian pattern to research sensory trigger profiles across five populations (autism, ADHD, PTSD, SPD, anxiety). The librarian searched published clinical sources (NIH, Frontiers in Psychiatry, Cleveland Clinic) and returned structured findings with citations. We encoded those findings into a steering file containing:

- A diagnosis × place field priority matrix
- A weighted recommendation score algorithm (0–100, hard filters + asymmetric penalties)
- Onboarding UX guidelines (preference-based framing, never ask about diagnosis)
- Privacy rules for GDPR Article 9 special category data
- AI content rules (trauma-informed language, no clinical labels in user-facing copy)

This file is set to `inclusion: manual` — it's not injected into every conversation. When implementing recommendation logic, onboarding, or AI content, we load it via `#sensory-research` in chat. Kiro then has the full clinical research context exactly when it needs it, without bloating every other conversation.

### The strategy that made the biggest difference

The **task sizing table** in `workflow.md`:

| Signal | Action |
|---|---|
| Single file, known location | Do it directly |
| Multi-file change | Create TODO, delegate |
| "Add feature X" | Full orchestration: research → plan → implement → review |
| Unclear scope | Ask ONE clarifying question, then proceed |

This table eliminated two failure modes: over-orchestrating trivial tasks (removing a button — just do it) and under-orchestrating complex ones (designing the onboarding gate — research the AsyncStorage hydration race condition first). Kiro applied this table consistently throughout the project without us having to specify the approach each time.

---

## MCP

### What we built

We designed and configured a Figma MCP integration to bring live design context directly into the implementation workflow. Our designer built a full 13-screen React web prototype in Figma (Vite + React + Tailwind + shadcn), and we needed a way to get that design system into the codebase without manual export steps.

We identified two integration paths and documented both in the writeup:

**Option 1 — Passive context via steering files (implemented):**
We imported the designer's Figma prototype files directly into the workspace (`sensly/ui/Sensly (1)/src/`). We then added a Figma design reference section to `workflow.md` that instructs Kiro to check the Figma prototype files before implementing any UI screen or component:

```markdown
## Figma Design Reference
When implementing any UI screen or component, check the Figma prototype first:
- The color tokens in `sensly/src/constants/theme.ts` are the source of truth for code
- Priority screens: Map view, Venue detail, Rating flow, Profile/onboarding
```

This meant Kiro could read the actual Figma component files (`Dashboard.tsx`, `Onboarding.tsx`, `Settings.tsx`, `Welcome.tsx`, etc.) and extract exact values — `#3AACB2` teal, `rgba(255,255,255,0.85)` frosted glass, `borderRadius: 24`, Fredoka font — then apply them across all 15+ screens. No manual token export, no copy-pasting hex values.

**Option 2 — Live MCP via desktop relay (designed, not yet connected):**
```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp-server-desktop-relay"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```
This connects to a local server run by the Figma desktop app in Dev Mode — bypasses OAuth entirely, works with any MCP-compatible client including Kiro. We documented this path for future use.

### What MCP enabled that would otherwise have been difficult

The passive Figma integration enabled something that would have been extremely tedious manually: **a complete visual system replacement in a single session**. We asked Kiro to read the designer's prototype files and apply the design system to the entire app. It:

- Extracted the exact color palette from `theme.css` and updated `theme.ts`
- Ported the axolotl mascot from web SVG to React Native's `react-native-svg`
- Applied frosted glass card styles across all screens
- Matched the exact button styles, typography scale, and spacing tokens from the Figma files
- Identified which Figma screens mapped to which existing React Native screens and flagged gaps

Without the Figma files in the workspace and the steering rule pointing Kiro to check them, this would have required manually inspecting each Figma frame, copying values, and applying them one screen at a time. Instead it happened in one orchestrated session.

---

## What We Built — Summary

| Artifact | What it is | Where it was used |
|---|---|---|
| `.kiro/steering/workflow.md` | Conductor ruleset — orchestrator identity, delegation format, review gate, git discipline, doc requirements | Every interaction in the project |
| `.kiro/steering/sensory-research.md` | Clinical research + implementation guidelines | Recommendation logic, onboarding, AI content, privacy |
| `AGENTS.md` | Agent directory — defines conductor, librarian, development-workflow-agent and how they coordinate | Agent onboarding, delegation decisions |
| `.kiro/agents/conductor.json` | Conductor agent config + agentSpawn hook | Orchestrates all tasks |
| `.kiro/agents/librarian.json` | Librarian agent config — read-only research specialist, trusted source registry | All external research (APIs, security, accessibility, neurodivergent design) |
| `.kiro/agents/context/system-prompts/librarian-prompt.md` | Librarian system prompt — research process, output format contract, rules | Structures every research delegation |
| `.kiro/agents/context/includes/source-registry.json` | Trusted source registry — domains the librarian consults first | Research quality and consistency |
| `.kiro/prompts/pdd.md` | PDD process definition — 6-step spec-driven development workflow | Sensly requirements, design, implementation plan |
| `sensly/supabase/migrations/` | Database schema + seed data | Live Supabase backend — 10 tables, 15 RLS policies, Postgres triggers |
| `sensly/supabase/functions/` | 4 Edge Functions | Comment moderation, pattern detection, journal insights, push notifications |
| `sensly/src/hooks/useWeeklyInsights.ts` | Weekly insights check + notification | Journal feature |
| `sensly/src/types/supabase.ts` | Auto-generated TypeScript types | Type-safe frontend development |
| `sensly/ui/Sensly (1)/src/` | Designer's Figma prototype — imported as workspace files | UI integration source of truth for all screens |
| `agents/planning/sensoryscout/` | PDD planning artifacts — rough-idea, detailed-design, ui-integration-plan | Living documentation updated throughout the build |

The through-line across all of these: we built the tools first, then used them. The steering files, agent configs, hooks, PDD process, and Figma integration were all authored before the Sensly implementation began. That investment paid off because every rule applied automatically to every subsequent interaction — we didn't have to repeat ourselves, and Kiro didn't have to guess.

# Kiro Writeup — Sensly

## Overview

Sensly is a crowdsourced sensory environment app for neurodivergent people — it uses your phone's microphone to auto-measure venue noise, combined with community ratings on lighting, crowding, smell, and predictability. Before writing a single line of app code, I built a custom Kiro toolchain to handle the entire design and planning process. This writeup explains what I built, why, and how it was used.

---

## Steering Docs

### What We built

We wrote two steering files that shape every interaction Kiro has in this workspace.

**`.kiro/steering/workflow.md` — The Conductor ruleset**

This file defines Kiro's job as an conductor, not an. implemter, in order to prevent failure points we have experienced in AI development. 

- **3-file read budget per task** — This rule forces delegation to fix the issue of overflowed context windows. If one Kiro agent attempts everything itself, context fills up and code quality drops. This budget keeps the orchestrator's context clean, which allows it to ...

- **Delegation format (TASK / CONTEXT / MUST DO / MUST NOT)** — We wrote this 4-section format so every subagent prompt is extremely specific. "MUST NOT" the section where we prevent common issues with AI such as scope creep and unsafe patterns before they happen.

- **2-strike circuit breaker** — Wer wrote this after observing that AI agents tend to patch symptoms rather than actuallly research and diagnose root causes. Two failed attempts means stop and research, not try again aimlessly.

- **Review gate** — We wrote this to enforce a `git diff` + review pass before any task is declared done. Setting a max of 2 cycles prevents infinite reviewer/implementer disagreement loops.

- **Pre-implementation pull rule** — We added this when we realized the project needed it with many people working at the same time. This rule helps eliminate merge conflics and sync our project workflow accross the team. We also added documentation mandantory with every code change to be committed with the code itself. 


**`AGENTS.md` — The agent directory**

We wrote a three agent system where the conductor delegates tasks and has the ability to spawn additional agents. AGENTS.md is the shared source of truth for this systemm, and it defines each agent's purpose, scope, allowed tools, and how they coordinate.

### The strategy that made the biggest difference

The **task sizing table** in `workflow.md`:

| Signal | Action |
|---|---|
| Single file, known location | Do it directly |
| Multi-file change | Create TODO, delegate |
| "Add feature X" | Full orchestration |
| Unclear scope | Ask ONE clarifying question |

This table eliminated two failure modes, which are over-orchestrating trivial tasks (renaming the app across 5 files — just do it) and under-orchestrating complex ones (designing the security architecture — research first). Kiro applied this table consistently throughout the project without me having to specify the approach each time. This helped us greatly in our planning stage, where we had an extremely detailed design and architecture that was backed by research before any coding. 

The other high impact change was the **post-implementation documentation requirement**. Because we wrote it into the steering file, every code change automatically triggers a documentation update and push to GitHub, and with our agent that has GitHub features allowed and build into its tools, it is integrated seamlessly into the workflow.

---

## Agent Hooks

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

The hook and the steering rule form a closed loop we designed intentionally. The hook provides the data while the steering rule tells Kiro what to do with it. Together they mean Kiro is always context-aware about repository state at the start of every session without having to specifhy "check git status first."

This pairs with the `git pull` rule we added to the steering file.

---

## Spec-Driven Development (PDD)

Before implementing any code, we created a complete Prompt-Driven Development process definition. It specifies a 6-step workflow:

1. **Setup** — create the project directory structure immediately, capture the raw idea verbatim before any questions
2. **Requirements** — keep human in the loop by asking ONE question at a time, wait for the answer, record it
3. **Research** — propose research topics, get sign-off, delegate to subagents
4. **Checkpoint** — write a numbered requirements list + risk register, ask explicitly to proceed
5. **Design** — write `detailed-design.md` as a standalone artifact covering architecture, schema, components, error handling, testing, open decisions
6. **Implementation plan** — numbered steps, each with a single objective, verification checkpoint, and dependency on previous steps

The key constraints we wrote into the process:
- "Never skip ahead without user confirmation at checkpoints"
- "The output documents should be useful standalone artifacts, not just process artifacts"
- Each step produces a file that exists independently of the conversation

### How it was used on Sensly

We invoked PDD with `design.md` as the input, which was our starting design file. Kiro immediately created the full directory structure and captured the raw idea before asking anything.

The requirements phase asked specific questions to hone our idea so the AI did not create any decisions out of the blue without keeping us in the loop. 

Each answer was recorded to `idea-honing.md` with its full implications. The platform question (Q2) is the clearest example of why this matters: the answer changed the entire stack — Web Audio API → expo-av, Leaflet → react-native-maps, PWA caching → expo-sqlite. Caught at requirements cost one conversation turn. Caught during implementation would have required rewriting core components.

The checkpoint gate produced `checkpoint.md` — 12 confirmed requirements, architecture decisions table, risk register — before a single design decision was made.

The design phase produced a 1,200+ line `detailed-design.md` that absorbed every subsequent decision (neurodivergent design guidelines, security architecture, diagnosis data privacy, LLM scope) without losing coherence. It's a document I could hand to a developer who wasn't in any of these conversations and they'd have everything they need.

### PDD vs vibe coding

I used both on this project and the difference is clear. Vibe coding (the brainstorming phase) produced ideas fast but left scope ambiguous. PDD forced every ambiguity to be resolved before it became a design assumption.

The more important difference is what you're left with. Vibe coding leaves context in the conversation — when the conversation ends, the context is gone. PDD leaves files. `idea-honing.md`, `checkpoint.md`, `detailed-design.md`, `plan.md` — these exist independently of any conversation and can be picked up by any agent or developer at any point. That's the real value of spec-driven development: **the output outlives the session.**

---

## Vibe Coding

### How I structured the conversations

Before invoking PDD, I used Kiro conversationally to explore the problem space. The structure was:

1. **Feed context** — I gave Kiro `social_good_project_ideas.txt` (a research document I'd already compiled) and asked it to generate ideas for two specific hackathon tracks with explicit constraints: free APIs only, hackathon-feasible scope, genuine social impact
2. **Narrow down** — asked Kiro to rank the top 5 ideas by "balance of implementation and social good" — it produced a scored comparison table with honest tradeoffs
3. **Go deep on one** — once Sensly was chosen, used vibe coding to expand the feature set by describing desired capabilities in plain language and asking Kiro to decide where each fit in the existing plan

The feature expansion conversation is a good example of structured vibe coding. I gave Kiro a list of 15+ features across 5 categories (personalization, low-friction reporting, companion features, daily-use stickiness, daily life extension) and asked it to sort them. It returned three buckets — merge into existing steps, new stretch steps, post-hackathon — with clear reasoning for each decision. That's not just generation; it's architectural judgment applied to a product roadmap.

### Most impressive generation

The **LensLearn brainstorm** — before Sensly was chosen. From a single prompt asking for an education project for special needs students, Kiro generated a fully-formed adaptive learning platform with:
- Per-disability UI profiles (dyslexia, ADHD, color blindness, dyscalculia, AAC support)
- A teacher workflow for generating shareable per-student versions of any lesson
- A complete tech stack using only free/open-source tools (OpenDyslexic font, Web Speech API, ARASAAC picture symbols, Groq free tier)
- A specific hackathon MVP recommendation (dyslexia + ADHD focus mode only) with rationale
- A demo script

That came from one conversational prompt and required no follow-up clarification. It's the kind of output that would take a product team a full sprint to produce.

On the Sensly side, the most technically impressive generation was the **security architecture section** of `detailed-design.md`. After I asked Kiro to research cybersecurity and backend best practices for health data apps, it produced a complete Section 17 covering: data classification tiers, token storage rules with code (expo-secure-store vs AsyncStorage), Supabase RLS hardening for GDPR Article 9 special category data, input validation with a diagnosis tag whitelist, rate limiting strategy, a full GDPR compliance checklist, HIPAA considerations, app hardening (screenshot prevention, jailbreak detection, biometric lock), and a 8-rule UX security contract for diagnosis data. All grounded in specific research sources, all integrated into the existing design rather than bolted on.

---

## MCP

### What I explored

I researched connecting Kiro to Figma's MCP server to bring live design context into the planning workflow. This surfaced a real constraint worth documenting: **Figma's remote MCP server only supports an allowlisted set of clients** (VS Code, Cursor, Claude Code, Codex). Kiro is not currently on that list.

I identified two paths forward:

**Option 1 — Remote MCP (may not work):**
```json
{
  "mcpServers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```
The OAuth flow is designed for specific clients — likely to fail outside the allowlist.

**Option 2 — Desktop relay (recommended):**
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
This connects to a local server run by the Figma desktop app in Dev Mode — bypasses OAuth entirely, works with any MCP-compatible client including Kiro.

### What MCP would enable

I designed two integration strategies for bringing Figma into the Sensly workflow:

**Passive context via steering files** — export design tokens and component specs from Figma as JSON/markdown, reference them via `#[[file:...]]` in a steering file. Kiro automatically includes that design context in every code generation task. No MCP required, available immediately.

**Active context via live MCP** — once the desktop relay is connected, agents can query live Figma frames during a task. For Sensly specifically, this would mean: paste a Figma frame URL into a prompt, and Kiro pulls the component specs, color tokens, spacing values, and layout data directly — no manual export step. The `Make resources` feature would also let Kiro pull code resources from Figma Make files as context for implementation.

The workflow improvement that would otherwise be difficult: **keeping the design system in sync with the codebase automatically**. With MCP connected and Code Connect set up, Kiro would know which real components to use when generating UI code rather than generating new ones that diverge from the design system. That's the gap between a prototype and a production-quality implementation.

---

## What I Built — Summary

| Artifact | What it is | Where it was used |
|---|---|---|
| `.kiro/steering/workflow.md` | Conductor ruleset — orchestrator identity, delegation format, review gate, git discipline, doc requirements | Every interaction in the project |
| `AGENTS.md` | Agent directory — defines conductor, librarian, development-workflow-agent and how they coordinate | Agent onboarding, delegation decisions |
| `.kiro/agents/conductor.json` | Conductor agent config — tools, resources, subagent registry, agentSpawn hook | Orchestrates all planning tasks |
| `.kiro/agents/librarian.json` | Librarian agent config — read-only research specialist, trusted source registry | All external research (APIs, security, accessibility, neurodivergent design) |
| `.kiro/agents/context/system-prompts/librarian-prompt.md` | Librarian system prompt — research process, output format contract, rules | Structures every research delegation |
| `.kiro/agents/context/includes/source-registry.json` | Trusted source registry — domains the librarian consults first | Research quality and consistency |
| `.kiro/prompts/pdd.md` | PDD process definition — 6-step spec-driven development workflow | Sensly requirements, design, implementation plan |
| `agentSpawn` hook in `conductor.json` | Runs `git status` on every session start | Repo state awareness, pairs with git pull rule |

The through-line across all of these: I wrote the tools first, then used them. The steering files, agent configs, hooks, and PDD process were all authored before the Sensly design work began. That investment paid off because every rule I wrote applied automatically to every subsequent interaction — I didn't have to repeat myself, and Kiro didn't have to guess.

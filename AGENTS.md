# Agent Directory

This file is the shared source of truth for all agents in this repository.
When an agent makes changes that affect how other agents should behave, update this file.
When onboarding to this repo, read this file first.

---

## Overview

This repo uses a multi-agent workflow built on three cooperating agents:

```
User
 └── conductor          (orchestrator — plans, delegates, verifies)
       ├── librarian    (research — fetches docs, finds examples, returns findings)
       └── development-workflow-agent  (git-aware implementation agent)
```

The conductor never implements directly. It breaks work into tasks, delegates to specialists, and synthesizes results back to the user.

---

## Agents

### conductor
**File:** `.kiro/agents/conductor.json`
**Prompt:** `.kiro/steering/workflow.md`

The orchestrator. Receives user requests, plans the work, delegates to subagents, runs the review gate, and reports back.

**When to use:** Always. This is the default entry point for all tasks.

**Key behaviors:**
- Reads at most 3 files directly per task — everything else is delegated
- Spawns the librarian for any external research or documentation lookup
- Runs `git diff` after implementation and spawns a review pass before declaring done
- On startup, runs `git status` to orient itself

**Delegation format (required for all subagent prompts):**
```
TASK: one atomic goal
CONTEXT: file paths, patterns, constraints
MUST DO: explicit requirements
MUST NOT: forbidden actions
```

**Subagents available:**
| Name | Purpose |
|------|---------|
| `librarian` | External research, docs, best practices |

---

### librarian
**File:** `.kiro/agents/librarian.json`
**System prompt:** `.kiro/agents/context/system-prompts/librarian-prompt.md`
**Source registry:** `.kiro/agents/context/includes/source-registry.json`

The research specialist. Given a research question, it consults the trusted source registry, fetches and analyzes content, and returns structured findings to the conductor.

**When to use:** Delegate here whenever the conductor needs:
- Official documentation for a library or API
- Code examples or patterns from external sources
- Best practice recommendations
- Version-specific details

**Output format (always JSON):**
```json
{
  "sources": [{ "url": "...", "type": "official|github|blog", "relevance": "high|medium|low" }],
  "findings": [],
  "examples": [],
  "recommendations": []
}
```

**Trusted sources:** Defined in `.kiro/agents/context/includes/source-registry.json`.
To add a new trusted domain, add it to both the registry and the `web_fetch.trusted` list in `librarian.json`.

**Does NOT:** implement code, write files, or make commits.

---

### development-workflow-agent
**File:** `.kiro/agents/development-workflow-agent.json`

A git-aware implementation agent. Handles code changes with full access to git operations via the `git-mcp-server`.

**When to use:** Delegate here for implementation tasks that require git awareness — branching, staging, diffing, committing.

**Allowed write paths:**
- `src/**`, `tests/**`, `docs/**`
- `*.md`, `*.json`, `package.json`, `requirements.txt`

**On startup:** Runs `git status` and `git branch --show-current` to orient itself.

**Does NOT:** do external research, fetch documentation, or make architectural decisions.

---

## Workflow: How Agents Coordinate

### Standard feature request
```
1. conductor receives request
2. conductor spawns librarian → research findings returned
3. conductor spawns development-workflow-agent → implementation
4. conductor runs git diff
5. conductor spawns review pass (development-workflow-agent or inline)
6. conductor reports to user
```

### Research-only request
```
1. conductor receives request
2. conductor spawns librarian → structured findings returned
3. conductor synthesizes and responds to user
```

### Small single-file task
```
1. conductor does it directly (no delegation needed)
```

---

## Shared Context Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — agent directory and coordination guide |
| `.kiro/steering/workflow.md` | Conductor's operating rules (read budget, delegation format, review gate) |
| `.kiro/prompts/pdd.md` | Prompt-Driven Development process for new features |
| `.kiro/agents/context/CONTEXT.md` | Guide to the context directory structure |
| `.kiro/agents/context/includes/source-registry.json` | Trusted external sources for the librarian |
| `.kiro/agents/context/system-prompts/librarian-prompt.md` | Librarian's full system prompt |

---

## Contributing

### Adding a new agent
1. Create `.kiro/agents/<name>.json` following the schema of an existing agent
2. Add an entry to the **Agents** section of this file
3. If the conductor should delegate to it, add it to `conductor.json` under `subagents` and update the delegation table above
4. Add any new trusted sources to `source-registry.json`

### Modifying an existing agent
1. Make the change in the agent's `.json` file
2. Update the relevant section in this file if behavior, scope, or outputs change
3. If the change affects how other agents interact with it, update the **Workflow** section

### Updating trusted sources
Edit `.kiro/agents/context/includes/source-registry.json` and add the domain to `librarian.json`'s `web_fetch.trusted` array.

---
name: pdd
description: Prompt-Driven Development - transform an idea into requirements, design, and implementation plan. Use for new features or significant changes.
---

# Prompt-Driven Development

## Parameters
- **idea** (required): The concept to develop. Text, file path, or URL.
- **project_dir** (optional, default: `agents/planning/{name}`): Output directory.

---

## Process

### 1. Setup
Create the project directory with this structure:
```
{project_dir}/
  rough-idea.md          # verbatim capture of the original idea
  idea-honing.md         # running record of Q&A and refined requirements
  research/              # findings from research phase
  design/                # architecture and detailed design docs
  implementation/        # step-by-step implementation plan
```

Write the raw idea to `rough-idea.md` immediately, before any questions.

---

### 2. Requirements (interactive)
Ask ONE question at a time. Wait for the answer. Record each answer to `idea-honing.md`.

Good questions to ask (pick the most relevant, don't ask all of them):
- Who are the users and what problem does this solve for them?
- What does success look like? How will we know it's working?
- What are the hard constraints? (performance, compatibility, existing systems)
- What is explicitly out of scope?
- Are there existing patterns in this codebase we should follow?

Continue until scope is clear. When requirements feel complete, summarize them and ask the user to confirm before moving on.

---

### 3. Research
Based on the requirements, identify what needs investigation. Propose a list of research topics to the user and get their sign-off before diving in.

Delegate research to subagents — do not do it yourself. Each subagent gets one focused research question.

Document all findings in the `research/` directory, one file per topic.

Check in with the user after each major finding. Offer to return to requirements if research reveals new questions or constraints.

---

### 4. Checkpoint
Before moving to design, write a checkpoint summary covering:
- Confirmed requirements (numbered list)
- Key research findings that affect the design
- Open questions or risks

Ask the user: **proceed to design, revisit requirements, or do more research?**

Do not proceed until the user explicitly says to move forward.

---

### 5. Design
Write `design/detailed-design.md` as a standalone document. It must cover:

- **Architecture**: How the pieces fit together, with a diagram if helpful (ASCII is fine)
- **Components**: What each piece does and its interface/contract
- **Data models**: Schemas, types, or data structures
- **Error handling**: What can go wrong and how it's handled
- **Testing strategy**: What to test and at what level (unit/integration/e2e)
- **Open decisions**: Anything still unresolved, with tradeoffs noted

Review the design with the user before writing the implementation plan. Incorporate feedback.

---

### 6. Implementation Plan
Write `implementation/plan.md` as a numbered list of steps. Each step must:

- Have a clear, single objective
- Build on previous steps (no orphaned work)
- Include test requirements inline (not as separate steps)
- End with something functional or verifiable

Include a checklist at the top of the file for tracking:
```
## Progress
- [ ] Step 1: ...
- [ ] Step 2: ...
```

After writing the plan, present it to the user. Once approved, the conductor can execute it step by step using the normal orchestration flow (research → implement → review per step).

---

## Notes
- This process is interactive. Never skip ahead without user confirmation at checkpoints.
- The output documents should be useful standalone artifacts, not just process artifacts.
- If the user wants to jump straight to implementation, note the risks (unclear scope, missing research) and let them decide.

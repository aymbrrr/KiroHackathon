# Context Directory

This directory holds shared context that agents load at runtime. It is the connective tissue between agents — if you change how an agent behaves, the relevant file here should be updated too.

**All files here are shared across contributors.** Treat them like code: changes should be intentional, reviewed, and reflected in `AGENTS.md`.

---

## Structure

```
context/
  CONTEXT.md                          ← this file
  system-prompts/
    librarian-prompt.md               ← librarian agent's full system prompt
  includes/
    source-registry.json              ← trusted external sources for the librarian
```

---

## Files

### `system-prompts/librarian-prompt.md`
The librarian agent's system prompt, kept as a standalone markdown file so it can be version-controlled, reviewed, and updated independently of the agent JSON config.

Referenced by `librarian.json` via the `prompt` field.

**When to update:** When the librarian's research process, output format, or rules change.
**Who is affected:** The librarian agent only.

---

### `includes/source-registry.json`
The registry of trusted external sources the librarian consults when doing research. Organized by topic category.

**Schema:**
```json
{
  "sources": {
    "<category>": {
      "primary": [
        { "url": "...", "type": "static|spa|api", "strategy": "web_fetch|api" }
      ],
      "inspiration": [
        { "url": "...", "type": "...", "strategy": "...", "note": "..." }
      ]
    }
  }
}
```

**When to update:** When adding, removing, or changing trusted research sources.
**Who is affected:** The librarian agent. Also update `web_fetch.trusted` in `librarian.json` to match.

---

## How to Add a New Context File

1. Create the file in the appropriate subdirectory (`system-prompts/` for agent prompts, `includes/` for data/config)
2. Reference it from the relevant agent JSON using `file://` in `resources` or inline in `prompt`
3. Add a row to the table in `AGENTS.md` under **Shared Context Files**
4. Add an entry to this file under **Files**

---

## Conventions

- **Markdown files** (`.md`) are for human-readable instructions and prompts
- **JSON files** (`.json`) are for structured data agents parse at runtime
- File names use kebab-case
- Every file should have a one-line comment at the top explaining its purpose (use `#` for md, `//`-style comment in JSON where supported)

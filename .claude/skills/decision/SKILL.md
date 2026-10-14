---
name: decision
description: Author and manage ADRs (Architecture Decision Records) in docs/adr/. Use for /decision, when a hard-to-reverse choice is made (rendering, sync model, storage format, a major dependency), or when the user asks why something was decided.
---

# /decision

Decisions live in `docs/adr/NNNN-<slug>.md`. Template: `docs/adr/0000-template.md`.

Write one when a choice is hard to reverse and had real alternatives. Standing
"always do X" guidance is a rule (`/rules`), not an ADR.

## Format

First heading `# NNNN. <Title>`, then a list of fields, then sections
Context, Decision, Consequences:

```
- Status: proposed | accepted | rejected | superseded
- Date: YYYY-MM-DD          # date of the last status change
- Supersedes: NNNN, …       # or —
- Superseded-by: NNNN       # or —
```

`refresh-state.mjs` reads the title and `Status:` into STATE.md, so keep both
in that shape.

## Subcommands

| Form | Behavior |
|---|---|
| `/decision` | Same as `/decision list`. |
| `/decision list [status]` | Table: id, status, date, title. Filter by status if given. |
| `/decision show <id-or-slug>` | Print full ADR. |
| `/decision why <id>` | Print just the **Context** and **Decision** sections. |
| `/decision new "<title>"` | Next id, copy the template, fill it in (below). Status `proposed`. |
| `/decision accept <id>` | `proposed` → `accepted`, update `Date:`, log it. |
| `/decision reject <id> <reason>` | `proposed` → `rejected`, update `Date:`, append `**Rejected:** <reason>`, log it. |
| `/decision supersede <old> "<new-title>"` | New ADR with `Supersedes: <old>`; on the old one set `Status: superseded` and `Superseded-by: <new>`; log it. The new ADR starts `proposed`. |

## Filling in a new ADR

Write Context, Decision and Consequences from the conversation and any arc
notes (`docs/phases/<topic>/brainstorm.md`). Ask the user only for what you
can't infer. Name the alternatives that lost in Context. Set `Date:` to today.

## Id assignment

```sh
ls docs/adr | grep -E '^[0-9]{4}-' | cut -c1-4 | sort -n | tail -1
```

Increment and zero-pad to 4 digits (the template is `0000`, so the first ADR
is `0001`). Never reuse an id, even for `rejected` ADRs. Slug: kebab-case of
the title.

## Logging

On accept, reject and supersede, record the event:

```sh
node .claude/scripts/refresh-state.mjs log "ADR NNNN <accepted|rejected|superseded by MMMM>: <title>"
```

This also refreshes STATE.md.

## Rules

- **Accepted ADRs are immutable** except their `Status:`, `Date:` and
  `Superseded-by:` lines. To change a decision, supersede it.
- `proposed` ADRs can be edited freely.
- One decision per ADR. If a file grows past ~80 lines, move the exploration
  to the arc's `brainstorm.md` and keep the ADR tight.

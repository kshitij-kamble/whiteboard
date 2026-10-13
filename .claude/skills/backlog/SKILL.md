---
name: backlog
description: Capture, list, and manage backlog items in docs/backlog.md. Use for /backlog, and suggest it (once) when the user floats a feature idea, reports a bug, flags tech debt, or raises an open question.
---

# /backlog

Single source of truth: `docs/backlog.md`. This skill formalizes the ritual —
hand-editing the file is still allowed and expected.

## Subcommands

| Form                              | Behavior                                                       |
|-----------------------------------|----------------------------------------------------------------|
| `/backlog`                        | Same as `/backlog list open`.                                  |
| `/backlog add <tag> <statement>`  | Append a new item with its title, description, AC and DoD (below). Assigns next `id`. Confirm before writing. |
| `/backlog list [status]`          | Print id, tag, status, slug, 1-line statement (no bodies).     |
| `/backlog show <id-or-slug>`      | Print the full item, plus its AC and DoD sections.             |
| `/backlog done <id>`              | Check the DoD gates (below), flip to `done`, add a one-line outcome note. |
| `/backlog drop <id> <reason>`     | Flip to `dropped` with the reason inline.                      |
| `/backlog sync`                   | Create a GitHub issue for every item missing `issue:`, and close issues of `done`/`dropped` items that are still open. |

To flip status to `in-progress`, edit the item directly — that's what
`/arc start … from <id>` does, and it's a one-field change.

After any write, run `/state refresh` (the Stop hook also does this at the end
of the turn).

## Tags and statuses

- **tags:** `feature` · `bug` · `tech-debt` · `spike` · `question`
- **statuses:** `open` → `in-progress` → `done`, or `dropped` from any state

## Id assignment

`b-YYYYMMDD-NNN` where `NNN` is the next zero-padded counter for that date
(today's date, not a guess). Compute by grepping existing ids in
`docs/backlog.md` — don't guess.

## What `add` captures

`add` collects four things and writes each to its own file, keyed by the new id:

| Part | Where it goes |
|---|---|
| **Title**: readable, e.g. "Draw freehand strokes" | `- **title:**` field on the item in `docs/backlog.md` |
| **Description**: what the feature or task is, in prose | the item's body in `docs/backlog.md` |
| **Acceptance criteria**: "User can…" outcomes, numbered | `## <id> — <slug>` section in `docs/acceptance-criteria.md` |
| **Definition of done**: checklist items beyond the universal gates | `## <id> — <slug>  (\`<tag>\`)` section in `docs/definition-of-done.md` |

Append each section after the last per-item section in its file. A `question`,
`spike` or `tech-debt` item can skip AC and DoD. Ask for any part the user
hasn't given rather than inventing it, and show all four in the confirmation
before writing.

Whiteboard features usually need criteria for what *other* collaborators see,
not just the acting user ("A second user sees the stroke within ~1s",
"Undo removes only my stroke, not a collaborator's"). Prompt for these when the
item touches shared board state.

**Adding from a file** (e.g. a list or sheet the user points at): read each row
and run the same `add` for it, mapping its title, description, acceptance
criteria and definition of done onto the four parts above. Confirm the whole
list once before writing.

## `done` gates

Before flipping to `done`, read the item's section in
`docs/definition-of-done.md` **and** the universal gates at the top of that
file. If any gate is unmet, list it and stop — don't flip. If the item has a
linked arc, its `reconcile.md` should be filled in first.

## GitHub Issues mirror

`docs/backlog.md` stays the source of truth; every item is mirrored as an issue
on the `origin` repo (public — write nothing secret into issues). Run `gh` from
the project root so it targets that repo; if `gh` isn't on PATH, use
`"C:\Program Files\GitHub CLI\gh.exe"`. Labels match tags one-to-one
(`feature`, `bug`, `tech-debt`, `spike`, `question`).

| Event | GitHub side |
|---|---|
| `add` (after the files are written) | `gh issue create --title "<title>" --label <tag> --body-file <tmp>`. Body: description, then the numbered AC, then `Backlog id: <id>`. Write the returned number as `- **issue:** #N` on the item. |
| flipped to `in-progress` | `gh issue comment N --body "In progress — arc: docs/phases/<folder>/"` |
| `done` | `gh issue close N --reason completed --comment "Done — <outcome>"` |
| `drop` | `gh issue close N --reason "not planned" --comment "Dropped — <reason>"` |

Write the body to a file in the scratchpad (not inline) so quotes and newlines
survive. If a `gh` call fails (offline, not logged in), still write the local
change, say so in one line, and leave `issue:` empty — `/backlog sync` catches
it up later. Never close an issue whose item isn't `done`/`dropped` locally.

Commits for an item reference its issue (`… (#N)`); the PR that finishes it
says `Closes #N`.

## Suggest-on-keyword (passive mode)

When NOT invoked via `/backlog`, watch for phrases that smell like backlog
material:

- **feature:** "we should", "it'd be nice if", "what if we", "someday", "eventually"
- **bug:** "this is broken", "there's a bug", "regression", "strokes disappear", "out of sync"
- **tech-debt:** "this is hacky", "clean this up later", "todo", "fixme"
- **spike:** "half-formed thought", "just thinking out loud", "quick spike"
- **question:** "not sure how", "we haven't decided", "open question"

When one hits, **suggest once** — a single line: *"Sounds like a backlog item —
want me to `/backlog add <tag> …`?"* Do not auto-write. Do not repeat within
the same turn.

## Item format (canonical)

```md
## <slug>  <!-- id: b-YYYYMMDD-NNN -->
- **tag:** feature
- **status:** open
- **created:** YYYY-MM-DD
- **linked-phase:**
- **issue:** #N
- **title:** <readable title>

<description>
```

Keep the description to what the item is. If it needs design discussion,
propose starting an arc (`/arc start <topic> from <id>`) instead of a bloated
backlog entry. `title:` is optional; the slug is the title when it's absent.

- `linked-phase:` holds the arc folder name (`YYYY-MM-DD-<topic>`), written by
  `/arc start … from <id>`. A feature split into slices lists every slice arc
  under a `Slices:` section in its body instead.
- `issue:` holds the mirrored GitHub issue number (see *GitHub Issues mirror*).
- A drop reason goes **inline on the status line**: `- **status:** dropped — <reason>`.
- A done note goes **inline on the status line**: `- **status:** done — <outcome>`.

---
name: state
description: Show or regenerate docs/STATE.md (the "where are we right now" snapshot) and append to the activity log. Use for /state, at the start of a session, or when the user asks what's in flight.
---

# /state

Answers "what's happening on this project right now?" in one file:
`docs/STATE.md`. Regenerated from backlog + phase notes + decisions +
activity — never hand-edited.

Sources it reads:

| Source | Contributes |
|---|---|
| `docs/backlog.md` | counts by status, in-progress + open items (see `/backlog`) |
| `docs/phases/*/index.md` | active arcs, their phase and backlog link (see `/arc`) |
| `docs/adr/NNNN-*.md` | five most recent decisions + their status |
| `docs/activity.md` | ten most recent activity entries |

## Subcommands

| Form                              | Behavior                                                    |
|-----------------------------------|-------------------------------------------------------------|
| `/state`                          | Print current `docs/STATE.md`.                              |
| `/state refresh`                  | `node .claude/scripts/refresh-state.mjs`                    |
| `/state log <line>`               | `node .claude/scripts/refresh-state.mjs log "<line>"` — prepends a dated entry to `docs/activity.md`, then refreshes. |
| `/state stale`                    | `node .claude/scripts/refresh-state.mjs --check` — exit 1 and a warning if STATE.md doesn't match its sources. |

Report the script's one-line output as-is. On a non-zero exit (other than
`--check`), show its message and don't hand-patch STATE.md.

## When to refresh

- **Automatic:** a `Stop` hook in `.claude/settings.json` runs the script with
  `--quiet` at the end of every turn, so it rarely goes stale on its own. It
  only rewrites STATE.md when the content actually changes.
- After hand-editing backlog status, a phase's status, or adding an ADR.
- Before starting a session, so you're reading a fresh snapshot.
- Cheap enough that you can `refresh` liberally.

The auto-refresh only regenerates STATE from its sources — it does **not** write
activity entries. Notable events (decisions, milestones, external context) still
have to be logged into `docs/activity.md` by hand or via `/state log`.

## Activity log rules

- **Newest at the top.** Entry format: `- YYYY-MM-DD — <event>`. The script
  and `/state log` both assume it; lines in any other shape are ignored.
- **One line per event.** If it needs more, it's a decision (write an ADR in
  `docs/adr/`) or a phase note (start an arc).
- **Not for commits.** `git log` is the commit stream. Activity is for events
  git can't see: decisions accepted, milestones hit, incidents, external
  context ("users report strokes lag on boards with 5k+ shapes"), etc.
- **Don't delete entries.** If wrong, add a correcting entry. History is
  cheap; rewriting it is expensive to trust.

## ADR format

Owned by `/decision` (`.claude/skills/decision/SKILL.md`). This script only
needs the first `# ` heading (title) and the `Status:` line.

**Never hand-edit STATE.md.** If it's wrong, the fix is in the source
(backlog status, phase `index.md` status, missing activity entry) — then
`refresh`.

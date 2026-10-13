---
name: arc
description: 6-phase arc driver — ideate, brainstorm, prep, align, implement, reconcile. Use for /arc, and suggest it when the user starts non-trivial work (a new whiteboard tool, sync/collaboration changes, data-model changes, anything spanning several files or sessions).
---

# /arc

Drives non-trivial work through six phases. Each topic gets its own folder:

```
docs/phases/YYYY-MM-DD-<topic>/
  index.md         # metadata: backlog link, current phase, started/updated dates
  ideate.md
  brainstorm.md
  prep.md
  align.md
  implement.md
  reconcile.md
```

One file per phase. Files are created eagerly at `/arc start` as stubs
(`_(not yet entered)_`) so `ls` answers "which phases are done?" at a glance.

**Reading order:** reconcile needs ideate + brainstorm + prep side-by-side
against implement outcomes. Use `/arc show` to print the phase files in
canonical order — never in file-tree order (that alphabetizes; e.g. align
comes before brainstorm), which scrambles the narrative.

## Subcommands

| Form                              | Behavior                                                            |
|-----------------------------------|--------------------------------------------------------------------|
| `/arc start <topic> [from <id>]`  | Create the phase folder + stub files. With `from <id>`: set `backlog:` in `index.md`, and on the item in `docs/backlog.md` flip status to `in-progress` and set `linked-phase:` to the folder name. |
| `/arc ideate`                     | Enter Ideate phase.                                                 |
| `/arc brainstorm`                 | Enter Brainstorm phase.                                             |
| `/arc prep`                       | Enter Prep phase.                                                   |
| `/arc align`                      | Enter Align phase.                                                  |
| `/arc implement`                  | Enter Implement phase.                                              |
| `/arc reconcile`                  | Enter Reconcile phase.                                              |
| `/arc show [topic]`               | Print all six phase files in canonical order.                      |
| `/arc status`                     | Print current topic + phase, and the last ~10 lines of the current phase file. |

"Current topic" is the folder in `docs/phases/` whose `index.md` status isn't
`done`, most recently `updated`. If several are active, ask which.

Entering a phase: replace that file's `_(not yet entered)_` with
`_Entered YYYY-MM-DD._`, and update `status:` + `updated:` in `index.md`.
Then `/state refresh` (the Stop hook also does this at the end of the turn).

## GitHub Issues

Every arc reports to one issue (mirror rules and `gh` usage:
`.claude/skills/backlog/SKILL.md` → *GitHub Issues mirror*).

- **Which issue:** with a backlog id, the item's `issue:` in `docs/backlog.md`
  (add the `arc` label to it). Without one, `/arc start` creates an issue
  (title = topic, label `arc`, body = the problem statement) and stores its
  number as `issue: N` in `index.md` — no `#`, the frontmatter parser treats
  `#` as a comment.
- **On each phase entered:** `gh issue comment N` with
  `**<Phase>** entered — <1–3 line summary of the previous phase's output>`.
  Keep it a summary; the phase files hold the detail.
- **On reconcile done:** comment with the reconcile summary. For a backlog-linked
  arc, closing waits for `/backlog done`; an arc-only issue closes here
  (`--reason completed`).

A failed `gh` call never blocks a phase change — note it in one line and
post the missed comment next time.

Never auto-advance phases. When one feels done, suggest the next in one short
sentence — the user drives the transition.

## The 6 phases

### 1. Ideate — bird's-eye
Elaborate the problem, not the solution. Ask *why*, *for whom*, *what does
success look like*, *what happens if we don't*. For collaborative features,
include *what do the other people on the board experience*. **Output:** a
problem statement tight enough that a stranger could restate it. No
implementation talk.

### 2. Brainstorm — the how & the how-else
Now go deep. Alternatives, prior art, code references, sketches. Research the
forebears — how did Excalidraw, tldraw, Miro, Figma do it, and why.
Deliberately surface the contrarian option. Typical axes here: rendering
(Canvas 2D / SVG / WebGL), sync model (CRDT / OT / server-authoritative /
last-write-wins), what is persisted vs ephemeral (presence, cursors).
**Output:** 2–4 candidate directions with trade-offs; one chosen with a
reason; concrete references (files, papers, libraries). A choice that's hard
to reverse becomes an ADR in `docs/adr/`.

### 3. Prep — foundations & boundaries
Skeleton, not content. Whatever applies of:
- **Board model:** element/shape types and their fields, ids, z-order, schema
  version + migration of existing saved boards.
- **Operations:** the ops/commands that change the board, and how each one
  undoes and redoes (whose undo stack — per user, not global).
- **Sync contract:** message shapes over the wire, who's authoritative,
  conflict rule for concurrent edits, presence/cursor messages.
- **Render & input boundaries:** tool/state-machine shells (idle → drawing →
  committed), hit-testing interface, which layer draws what.
- **Server/API shells:** routes or socket handlers, payloads + responses,
  persistence shape.
- **Test stubs:** including a two-client test for anything that syncs.
- **Feature flags** if it ships dark.

**Output:** the shape of the implementation is fully visible; filling it in
should feel mechanical.

### 4. Align — structural sanity check
Cheap (~10 min). Read the skeleton against ideate + brainstorm.
- Does every "how" from brainstorm have a home in prep?
- Are contracts tight enough that implementation is mechanical?
- Any boundary that will bite us? (Concurrent edits, reconnect/offline,
  large boards, undo across users.) Any prep artifact we can't justify?
- If linked to a backlog id: does every **acceptance criterion** for it in
  `docs/acceptance-criteria.md` have a home in prep? A criterion with nowhere
  to land means prep isn't done. Behaviour tagged `@undefined` there is
  deliberately unspecified — never let it become a criterion here.

**Output:** either a green light, or a short list of prep patches. If the list
is long, prep isn't done — loop back, don't push through.

### 5. Implement — fill it in
Write code inside the boundaries prep drew. Tests pass. If you discover prep
was wrong, **stop and go back to prep** — do not silently redesign in-place.
Record the reversal in `implement.md` (this is what reconcile is looking for).

### 6. Reconcile — intent vs outcome
Read the phase files in canonical order (`/arc show`). Compare shipped work
against ideate + brainstorm decisions.
- Where did we follow the plan?
- Where did we divert, and was the divert justified in `implement.md`?
- What did we discover that belongs in a rule (`CLAUDE.md`) or an ADR?
- What did we punt? → new backlog items via `/backlog add`.
- If linked to a backlog id: does the work clear every gate in
  `docs/definition-of-done.md` for it, universal gates included? An unmet gate
  blocks `/backlog done`.

**Output:** `reconcile.md` filled in, `index.md` status → `done`, plus any new
backlog/ADR/rule entries.

## Templates

**`index.md`** (one per folder, holds metadata read by `/state`):

```md
---
topic: <slug>
started: YYYY-MM-DD
updated: YYYY-MM-DD
backlog: b-YYYYMMDD-NNN   # empty if none
issue: N                  # only for arcs without a backlog id
status: ideate   # ideate | brainstorm | prep | align | implement | reconcile | done
---

# <topic>

<one-paragraph problem statement — a stranger should be able to restate it>
```

**Each phase file** (`ideate.md`, `brainstorm.md`, …):

```md
# <Phase> — <topic>

_(not yet entered)_
```

…which becomes `_Entered YYYY-MM-DD._` followed by the phase content once the
phase is entered. Use today's date, never a copied example date.

## Skip criteria

Skip the arc when the task is small enough that the ritual costs more than
it saves: typo fixes, one-line bug fixes, direct questions, obvious refactors
under ~50 lines, a style tweak to an existing tool. When in doubt, do a
lightweight ideate (3–5 lines) and decide from there.

## Vertical slicing (for product feature work)

A single **feature** backlog item typically spawns **multiple slice arcs** —
one per thin end-to-end path a user can actually exercise. Cross-link them in
the backlog item's body under a `Slices:` section.

Example — "sticky notes" as slices, not layers:
1. Place a sticky note on the board; it survives reload (single user).
2. A second user sees it appear live.
3. Edit its text; concurrent edits resolve sensibly.
4. Resize/recolor; undo/redo works per user.

- Each slice's ideate/brainstorm can be brief (most decisions were made when
  the feature was scoped) but align/implement/reconcile is real per slice.
- Do NOT run a single feature-wide arc that goes "build the whole data model,
  then all the sync, then all the UI." That's horizontal — call it out and
  propose slices.
- Architectural work (choosing the sync engine, rendering foundation, auth,
  persistence, deploy pipeline) is exempt — those run as their own non-slice
  arcs.

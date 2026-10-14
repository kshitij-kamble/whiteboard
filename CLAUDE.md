# Interactive Whiteboard

A collaborative, real-time whiteboard. Multiple people edit the same board and
see each other's changes live.

**The goal is learning.** The user writes core logic. See the `must` rules in
`docs/rules/` and the guard in `.claude/scripts/guard-deps.mjs`.

**Stack:** TypeScript + Vite, no UI framework (ADR 0001). Canvas 2D rendering
(ADR 0002). Node 24 + `ws` sync server (ADR 0003). Folders: `client/`,
`server/`, `shared/`. **Sync model and storage are still open.** They get
decided after the naive sync breaks (`docs/rules/layers-in-order.md`).

## Start of session

Read `docs/STATE.md`: active arcs, open backlog, recent decisions and activity.
It's regenerated automatically; never hand-edit it.

## Commands

_To be filled in once the stack is chosen (install, dev server, test, lint, typecheck, build)._

## Workflow

| Need | Use | Lives in |
|---|---|---|
| Capture an idea, bug, debt, question | `/backlog` | `docs/backlog.md` (mirrored to GitHub Issues) |
| Drive non-trivial work | `/arc` | `docs/phases/<date>-<topic>/` |
| Record a hard-to-reverse choice | `/decision` | `docs/adr/` |
| Standing "always/never" guidance | `/rules` | `docs/rules/` |
| What's in flight | `/state` | `docs/STATE.md`, `docs/activity.md` |

- Acceptance criteria: `docs/acceptance-criteria.md`. Definition of done: `docs/definition-of-done.md`.
- Skip `/arc` for small work (typos, one-line fixes, small refactors).

## Conventions

- Branches: `<name>/<type>/<topic>`, e.g. `kshitij/feat/sticky-notes`. PRs target `main`.
- Commits for a backlog item reference its issue (`… (#N)`); the finishing PR says `Closes #N`.
- The GitHub repo is public. Put nothing secret in issues, commits or docs.
- Anything touching shared board state must be checked with two clients and after a reload.

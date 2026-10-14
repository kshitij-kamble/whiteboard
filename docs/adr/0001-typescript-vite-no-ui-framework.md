# 0001. TypeScript and Vite, no UI framework

- Status: accepted
- Date: 2026-10-15
- Supersedes: —
- Superseded-by: —

## Context

We need a language and build setup for both the browser client and the sync
server. The project's goal is learning (see `docs/rules/learn-before-library.md`),
so the tooling should stay out of the way without hiding whiteboard problems.

Alternatives considered:
- **Plain JavaScript.** Less to learn at once, but the client and server can't
  share checked types. A change to a message's shape would then fail silently
  between two tabs instead of at compile time, and sync work is where that
  hurts most.
- **A UI framework (React, Svelte).** The toolbar is a handful of buttons. A
  framework brings a second state system, and "does the truth live in React or
  in the board?" is a confusing question while learning to keep board state
  correct.

## Decision

- **TypeScript** everywhere, `strict`, with `erasableSyntaxOnly` (no `enum`,
  `namespace` or parameter properties) so the server runs under Node's built-in
  type stripping (see 0003).
- **Vite** for the client dev server and build.
- **Vitest** for tests.
- **No UI framework.** Toolbar and panels use plain DOM.
- Layout: `client/`, `server/`, `shared/`. `shared/` holds the shape model
  and the sync message protocol, imported by both sides.

## Consequences

- Protocol changes break the build on both sides until both are updated.
- Pure geometry (camera math, hit testing) is easy to unit-test with Vitest.
- UI beyond a simple toolbar (menus, panels, settings) will get clumsy in plain
  DOM. Revisit with a new ADR when that happens. Adding a framework later is
  contained if board state never lives in UI components.
- Reversing TypeScript would be a large mechanical change. Not expected.

---
title: Hand-build a core layer before adopting a library for it
scope: global
priority: must
status: active
appliesToKeywords: [library, package, dependency, install, npm, pnpm, yarn, tldraw, excalidraw, liveblocks, yjs, automerge, crdt, konva, fabric, pixi, partykit, socket.io, react-konva, rough.js, perfect-freehand]
appliesToPaths: [package.json, "**/package.json"]
supersedes: []
---

**Why:** This project exists to learn how a collaborative whiteboard works.
A library that handles rendering, shapes, sync or presence does that learning
for us. The working board would teach nothing about the problem it solves.

- Core layers: canvas and camera, shapes and hit testing, tools and input,
  undo/redo, real-time sync, presence, persistence, performance.
- Hand-build each layer first, working well enough to have hit its hard parts.
- To adopt a library for a core layer, write an **accepted** ADR that says what
  the hand-built version taught us and what the library adds. Add the line
  `Allow-dependency: <package>` to it. `.claude/scripts/guard-deps.mjs` blocks
  installs of guarded packages until that line exists.
- Tooling that teaches nothing about whiteboards is fine without an ADR:
  TypeScript, Vite, test runners, linters, a bare WebSocket library (`ws`).
- Don't get around the guard: no vendoring, copy-pasting library source, or
  CDN script tags.

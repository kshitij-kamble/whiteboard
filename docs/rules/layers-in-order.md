---
title: Build layers in order — single-player before multiplayer, naive sync before real sync
scope: process
priority: should
status: active
appliesToKeywords: [sync, websocket, multiplayer, realtime, real-time, collaboration, presence, cursors, conflict, crdt, offline, reconnect]
appliesToPaths: ["src/sync/**", "server/**"]
supersedes: []
---

**Why:** Each layer only makes sense once the problem it solves is real. Sync
built before shapes and tools work single-player has nothing real to sync.
A "correct" sync design built before seeing a naive one fail is just copying an
answer.

- A feature works single-player (and after a reload) before it is made multiplayer.
- The first sync is deliberately naive: broadcast every change. Break it with
  two tabs and write down what went wrong (lost updates, divergence, flicker)
  in the arc before designing the fix.
- Compare sync approaches in an ADR, based on the failures we actually saw.
- Skipping a step is allowed only if the arc says so and gives the reason.

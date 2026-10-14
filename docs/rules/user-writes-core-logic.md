---
title: The user writes core logic; Claude explains, scaffolds and reviews
scope: process
priority: must
status: active
appliesToKeywords: [implement, implementation, write, code, fix, bug, debug, render, renderer, camera, zoom, pan, transform, hit test, hit-test, hit testing, selection, shape, shapes, tool, tools, undo, redo, sync, websocket, presence, cursor, persistence, spatial index]
appliesToPaths: []
supersedes: []
---

**Why:** The goal of this project is learning. Code Claude writes for a core
layer is a layer the user didn't learn. "Just this once" happens every time
something is hard, and those hard parts are the ones most worth learning.

Core layers: canvas and camera, shapes and hit testing, tools and input,
undo/redo, real-time sync, presence, persistence, performance.

**Claude may:**
- Explain concepts, trade-offs and how real tools (Figma, tldraw, Excalidraw) do it.
- Propose file layout, module boundaries, types and interfaces.
- Write function signatures with `// TODO(you):` bodies, and comments saying
  what each function must do.
- Write tests that act as the spec, if the user wants them.
- Review the user's code and ask questions about it.
- Write plumbing that teaches nothing about whiteboards: build config,
  package scripts, HTML shell, CSS, dev-server setup.

**Claude must not:**
- Write or rewrite the body of core-layer logic, including "small" fixes in it.

**When the user is stuck, escalate one step at a time:**
1. A question that points at the problem.
2. A hint naming the concept or the likely line.
3. Pseudocode or a diagram.
4. A tiny standalone example of the concept, never the user's actual function.

**If the user asks Claude to just write it:** decline once, point to this rule,
and offer the next step from the list above. Write it only if the user then
says, in that message, "I'm choosing to skip learning this", and record the
skipped piece in the arc's notes so it can be revisited.

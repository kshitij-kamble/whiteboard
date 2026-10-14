# 0002. Render the board with Canvas 2D

- Status: accepted
- Date: 2026-10-15
- Supersedes: —
- Superseded-by: —

## Context

The board has to draw shapes, pan and zoom, and know what the pointer is over.
The rendering approach sets how much of a whiteboard engine we build ourselves.

Alternatives considered:
- **SVG / DOM (retained mode).** The browser keeps the shape tree and handles
  hit testing (`event.target`), transforms (`viewBox`), text and redraws. It's
  easier to start with, but it skips most of what we want to learn (camera,
  hit testing, render loop), and it slows down with thousands of shapes.
  tldraw takes this route.
- **WebGL.** GPU-fast, as in Figma, but shaders and buffers would come before
  any whiteboard learning. Better as a later experiment in the performance
  layer.

## Decision

Use a single `<canvas>` with the **2D context** (immediate mode), as Excalidraw
does. We build ourselves:
- the camera (screen ↔ world coordinates, pan, zoom toward the cursor)
- hit testing (shapes, thin strokes with a tolerance, z-order)
- the render loop (at most one redraw per frame)
- high-DPI handling via `devicePixelRatio`

**Design constraint:** shapes are plain data, and rendering is a function of
that data. The renderer never owns state.

## Consequences

- Most of layers 1–3 (canvas and camera, shapes and hit testing, tools and
  input) become our own code. That's the point.
- Editing text is harder. Plan: show an HTML `<textarea>` over the canvas while
  editing, and paint the text onto the canvas when editing ends.
- Accessibility is weak (one opaque canvas). Accepted for a learning project.
- Because shapes are plain data, swapping the renderer (to SVG or WebGL) means
  rewriting one module. The same plain data is what sync sends over the wire.

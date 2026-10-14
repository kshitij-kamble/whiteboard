# 0003. Run the sync server on Node with `ws`

- Status: accepted
- Date: 2026-10-15
- Supersedes: —
- Superseded-by: —

## Context

Multiplayer needs a server that holds client connections, receives changes and
passes them to the other clients, eventually decides the order changes happen
in, and saves boards. The sync model itself is deliberately undecided (see
`docs/rules/layers-in-order.md`). This ADR covers only what that code runs on.

Alternatives considered:
- **socket.io.** Gives rooms, reconnection, delivery confirmations and offline
  buffering for free, which are lessons in the sync, presence and persistence
  layers. Blocked by `learn-before-library`.
- **Bun.** Built-in WebSockets and TypeScript without a build step. Fewer docs
  and answers online when stuck, and Node 24 now runs TypeScript directly too.
- **Deno.** Built-in TypeScript and WebSockets, plus a permission model. The
  smallest ecosystem of the three, with nothing whiteboard-specific gained.

## Decision

- **Node 24** runtime, running `.ts` files directly through built-in type
  stripping (requires `erasableSyntaxOnly`, see 0001).
- **`ws`** for WebSockets. It only covers connection open, message and close.
  Rooms, broadcast, ordering and reconnect are ours to build.

## Consequences

- Nearly all WebSocket tutorials and debugging help apply directly.
- No server build step in development.
- Only erasable TypeScript syntax is allowed in `server/` and `shared/`.
- Easy to reverse: server code built on `ws` ports to another runtime in an
  afternoon.

# Multiplayer Conway's Game of Life

A server-authoritative multiplayer Game of Life implementation.

## Assumptions of current features

- The board is fixed & bounded 80×50 grid.
- A server restart resets the world.
- Placing a cell over an existing cell replaces its color.
- Pattern placement replaces any cells covered by the pattern.
- Patterns are positioned randomly by the server.
- A surviving cell retains its existing color.
- A newborn cell receives the rounded RGB arithmetic mean of its
  three live neighbors.
- A browser keeps its color across temporary reconnects while the
  server process remains alive.
- There is one shared room.

## Out of scope of current features

- Authentication
- Multiple rooms
- Durable persistence
- Infinite boards
- Horizontal server scaling
- Administrative controls
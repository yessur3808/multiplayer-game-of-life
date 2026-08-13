# Multiplayer Conway's Game of Life

A real-time, shared Conway's Game of Life simulation. Every connected browser
sees and edits the same board, receives a persistent player color, and can
control the shared simulation.

The React client renders the board on a canvas. The Node.js WebSocket server
owns the board, applies commands in arrival order, advances generations, and
broadcasts authoritative snapshots. Browser timing and local state never become
the source of truth.

## The problem

A normal Game of Life implementation evolves a board locally. Making it multiplayer introduces several additional requirements:

- all players must observe the same generation and cell state
- simultaneous edits must be applied in a deterministic order
- new and reconnecting clients must be able to catch up immediately
- untrusted network messages must not corrupt the simulation
- player ownership should remain visible as cells interact over time.

This service solves those problems with one game process. Node's event loop
serializes incoming commands, the server validates every message, and each
mutation increments a board revision before the resulting state is broadcast.
Surviving cells retain their color. A newborn cell receives the rounded RGB
average of its three live neighbors.

## Current behavior

- There is one shared, bounded board. Its default size is 80 × 50 cells.
- The simulation starts paused and advances once per second by default while running.
- Any connected player can place a cell and can start or pause the shared simulation.
- Placing a cell on an occupied coordinate replaces its color.
- The Block, Blinker, Glider, Beacon, and Lightweight Spaceship patterns are supported. The server chooses a random valid origin for a requested pattern, and occupied cells covered by it are replaced.
- Every browser receives a randomly generated player color. A UUID stored in browser local storage preserves that color across reconnects for the lifetime of the server process.
- The board has hard edges. Cells outside it are treated as dead.
- A process restart clears the board, resets the generation, and forgets player colors.

## Architecture

```text
Browser(s)                    Public origin                    Game service
React + canvas  ── / ──────> static file server
                ── /ws ────> reverse proxy ── WebSocket ───> Node.js + ws
                                                               │
                                                               └─ in-memory Game
```

The browser uses a canvas rather than one DOM node per cell. It opens a WebSocket at `/ws?clientId=<uuid>` on the same origin from which the page was loaded. In development, Vite proxies that path to the game server. In production, the static host or reverse proxy must do the same and must preserve the WebSocket upgrade headers.

The server sends a `welcome` message with the board dimensions and assigned color, followed by the current `snapshot`. It then broadcasts a new snapshot after a player command or completed generation. A monotonically increasing `revision` allows clients to ignore an older snapshot received out of order. `generation` increases only when the Game of Life rules are evaluated.

### Repository layout

```text
client/                 React 19 application, canvas renderer, and connection logic
  src/components/       Game controls, status, and canvas
  src/hooks/            WebSocket lifecycle and reconnect behavior
  src/lib/              URL, client ID, coordinate, and protocol helpers
server/                 Node.js WebSocket service
  src/game/             Board model, rules, colors, and built-in patterns
  src/app.ts            HTTP/WebSocket lifecycle and message handling
  src/index.ts          Environment configuration and process shutdown
```

## Prerequisites

- Node.js 24 LTS. Both `.nvmrc` and `.node-version` pin the expected major.
- npm.
- Docker, only when building the server container.

The client and server have independent lockfiles and must be installed separately.

## Run locally

Install dependencies from the repository root:

```sh
nvm use
npm --prefix server ci
npm --prefix client ci
```

Start the server in one terminal:

```sh
npm --prefix server run dev
```

Start the client in another:

```sh
npm --prefix client run dev
```

Open `http://localhost:5173`. To exercise multiplayer behavior, open the application in multiple browsers or browser profiles. Tabs in the same browser profile share the locally stored client ID and therefore share a player color.

The Vite development server listens on port 5173 and proxies `/ws` to `ws://localhost:3000`. If the backend port is changed, update the proxy target in `client/vite.config.ts` as well.

## Use the application

- Click an empty or occupied board coordinate to place a cell in your assigned color.
- Select a pattern to ask the server to place it at a random valid position.
- Select **Play** or **Pause** to change the state of the shared simulation.
- Use the status bar to monitor connectivity, generation number, live-cell count, and protocol errors.

If the connection is interrupted, the client retries five times with exponential delays of 0.5, 1, 2, 4, and 5 seconds. Board controls remain disabled while disconnected. Reload the page to begin a new retry sequence after all attempts have failed.

## Configuration

The server reads these environment variables at startup:

| Variable | Default | Description |
| --- | ---: | --- |
| `HOST` | `0.0.0.0` | Interface on which the HTTP/WebSocket server listens. |
| `PORT` | `3000` | Listening port. |
| `BOARD_WIDTH` | `80` | Board width in cells. |
| `BOARD_HEIGHT` | `50` | Board height in cells. |
| `SIMULATION_INTERVAL_MS` | `1000` | Time between generations while running. |

Numeric values must be positive integers. Invalid values cause startup to fail rather than silently falling back.

For example:

```sh
BOARD_WIDTH=120 BOARD_HEIGHT=75 SIMULATION_INTERVAL_MS=250 npm --prefix server run dev
```

Choose board dimensions with care. Each generation scans every coordinate, and each snapshot contains every live cell.

## Test and quality checks

Run the complete local verification suite from the repository root:

```sh
npm --prefix server test
npm --prefix server run build
npm --prefix client test
npm --prefix client run lint
npm --prefix client run build
```

Server tests cover the Game of Life rules, color inheritance, pattern placement, board validation, WebSocket handshake, shared play/pause state, and reconnection identity. Client tests cover rendering and controls, message parsing, stale-revision handling, coordinate mapping, URL construction, cleanup, and reconnect backoff.

For focused development, both packages also provide an interactive watcher:

```sh
npm --prefix server run test:watch
npm --prefix client run test:watch
```

## Build

Build each package independently:

```sh
npm --prefix server ci
npm --prefix server run build
npm --prefix client ci
npm --prefix client run build
```

The server output is written to `server/dist` and starts with:

```sh
npm --prefix server start
```

The browser assets are written to `client/dist` and can be served by any static HTTP server. `npm --prefix client run preview` is suitable for checking the production client build locally, but is not intended to be a production web server.

## Deploy

The repository includes a production, multi-stage Dockerfile for the game server:

```sh
docker build -t multiplayer-game-of-life-server ./server
docker run --rm -p 3000:3000 multiplayer-game-of-life-server
```

The image installs only production dependencies in its runtime stage and starts the compiled Node.js service. Send `SIGTERM` during deployment so the process stops its simulation timer, closes WebSocket clients, and shuts down the HTTP server cleanly.

The client is a separate static artifact. A complete production deployment must:

1. build and serve `client/dist` over HTTPS
2. expose the game server through `/ws` on that same public origin
3. forward WebSocket upgrade and connection headers
4. route all WebSocket traffic to a single game-server replica.

A minimal Caddy route in front of a game server named `game-server` looks like this. Caddy handles the WebSocket upgrade automatically:

```caddyfile
handle /ws* {
    reverse_proxy game-server:3000
}
```

Terminate TLS at the reverse proxy or platform ingress. When the page is served over HTTPS, the client automatically selects `wss://`.

The current HTTP server intentionally returns 404 for non-WebSocket requests and does not expose a health endpoint. Until one is added, use process/container health and a WebSocket handshake check rather than an HTTP `/` check. Do not run multiple independent replicas behind a load balancer: each replica would own a different board, timer, and player-color map.

## WebSocket protocol

All messages are JSON. Connections are accepted only at `/ws` and require a valid UUID in the `clientId` query parameter. Client messages are schema-validated, unknown fields are rejected, and payloads are limited to 4 KiB.

Client to server:

```json
{ "type": "place_cell", "x": 12, "y": 8 }
{ "type": "place_pattern", "pattern": "glider" }
{ "type": "set_running", "running": true }
```

Valid pattern names are `block`, `blinker`, `glider`, `beacon`, and `lightweight_spaceship`.

Server to client:

```json
{
  "type": "welcome",
  "playerColor": [214, 66, 122],
  "board": { "width": 80, "height": 50 }
}
```

```json
{
  "type": "snapshot",
  "generation": 3,
  "revision": 9,
  "running": true,
  "cells": [{ "x": 12, "y": 8, "color": [214, 66, 122] }]
}
```

```json
{
  "type": "error",
  "code": "INVALID_PLACEMENT",
  "message": "Cell coordinates are outside the board"
}
```

`INVALID_MESSAGE` is returned for malformed JSON or messages that fail schema validation. `INVALID_PLACEMENT` is returned for out-of-bounds cells or a pattern that cannot fit on the configured board.

## Technical decisions

| Decision | Why it works here | Cost |
| --- | --- | --- |
| Server-authoritative state | Gives every player one canonical board and deterministic command ordering. Joining requires only the latest snapshot. | The game process is stateful and cannot be replicated horizontally without coordination. |
| WebSockets | Provide low-latency, bidirectional commands and updates. | Production requires upgrade-aware proxying, connection monitoring, and capacity planning. |
| Full snapshots | Make joining, reconnecting, and missed-update recovery straightforward. | Bandwidth grows with live-cell count and connected clients. |
| Sparse `Map` storage | Empty cells consume no persistent entries, lookup is constant-time, and colors live naturally beside coordinates. | Evolution still scans every coordinate, making each tick `O(width × height)`. |
| TypeScript plus Zod | TypeScript checks code within each package; Zod protects the untrusted network boundary. | Client and server protocol types are maintained separately and can drift. |
| Server-selected colors and origins | Prevents clients from impersonating colors or placing patterns partly outside the board. | Players cannot choose colors or exact pattern locations. |
| Canvas rendering | Redraws a regular grid without thousands of DOM elements. | Accessible, DOM-based board interaction requires a separate interface. |
| Browser UUID identity | Preserves a color across reconnects without requiring accounts. | It is an identity hint, not authentication; users can copy or replace IDs. |

## Trade-offs and future work

| Current trade-off | Present impact | Likely next step |
| --- | --- | --- |
| All state lives in one process. | Restarting clears the board, generation, run state, and player colors. Multiple replicas would host separate games. | Persist snapshots or an event log, then introduce rooms with sticky routing or a shared coordinator. |
| Every update is a full snapshot. | Simple and reliable for the default board, but bandwidth grows with board activity and audience size. | Send cell deltas for normal updates and periodic snapshots for recovery. |
| Every generation scans the full board. | Runtime grows with `width × height`, even when few cells are alive. | Evaluate only live cells and their neighbors; move heavy simulation work off the main event loop if needed. |
| UUIDs are client-controlled. | Reconnect identity works without accounts, but it provides no authentication or authorization. | Add authenticated identities and role-based controls where ownership matters. |
| Public-network protections are minimal. | There are no origin checks, rate limits, connection limits, or administrative controls. | Add abuse prevention before exposing the service directly to the internet. |
| Operational visibility is limited. | There are no metrics, health endpoints, structured logs, or WebSocket heartbeats. | Add health/readiness routes, telemetry, heartbeat cleanup, and alerting. |
| Protocol types are duplicated. | Client and server changes must be synchronized manually. | Generate both type surfaces from one shared schema. |
| Deployment is split. | The server has a Docker image, while the client remains a separate static artifact. | Add a complete deployment definition for static hosting, proxying, TLS, and the game service. |

The repository already includes parallel client and server CI jobs. New commits
to the same pull request cancel obsolete runs.

Product-level follow-up work could include rooms, deterministic pattern
placement, removing cells, configurable rules, host-only controls, better
mobile input, and an accessible alternative to the canvas. These remain out of
scope so the current version stays focused on shared simulation and connection
behavior.

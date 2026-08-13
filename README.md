# Multiplayer Conway's Game of Life

A server-authoritative multiplayer Game of Life implementation.

## Development

Node.js 24 LTS is required. Both `.nvmrc` and `.node-version` declare the
local runtime, and each package enforces the Node 24 major through its
`engines` field.

```sh
nvm use
npm --prefix server ci
npm --prefix client ci
```

Run the server checks with `npm --prefix server test` and
`npm --prefix server run build`. Run the client checks with
`npm --prefix client test`, `npm --prefix client run lint`, and
`npm --prefix client run build`.

The server container also uses Node.js 24 LTS:

```sh
docker build -t multiplayer-game-of-life-server ./server
docker run --rm -p 3000:3000 multiplayer-game-of-life-server
```

## Assumptions of current features

- The board is fixed & bounded 80×50 grid.
- A server restart resets the world.
- Placing a cell over an existing cell replaces its color.
- Pattern placement replaces any cells covered by the pattern.
- A selected pattern is placed from the board cell clicked by the player.
- Play and pause control the simulation for the shared room.
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
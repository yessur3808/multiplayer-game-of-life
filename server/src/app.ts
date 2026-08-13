import { createServer, type Server } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

import { createPlayerColor } from "./game/colors.js";
import { Game } from "./game/Game.js";
import { PATTERNS, type PatternName } from "./game/patterns/patterns.js";
import type { Color } from "./game/types.js";
import { clientMsgSchema, type ServerMessage } from "./protocol.js";

export interface AppOptions {
  width: number;
  height: number;
  simulationIntervalMs: number;
  random?: () => number;
  initialPatternCount?: number;
}

export interface App {
  server: Server;
  webSocketServer: WebSocketServer;
  game: Game;
  close: () => Promise<void>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getClientId = (request: IncomingMessage): string | undefined => {
  const url = new URL(request.url ?? "", "http://localhost");
  const clientId = url.searchParams.get("clientId");

  if (
    clientId === null ||
    clientId.length === 0 ||
    clientId.length > 64 ||
    !UUID_PATTERN.test(clientId)
  ) {
    return undefined;
  }

  return clientId;
};

export const createGameServer = ({
  width,
  height,
  simulationIntervalMs,
  random = Math.random,
  initialPatternCount = 2,
}: AppOptions): App => {
  const server = createServer((_request, response) => {
    response.writeHead(404).end();
  });
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 4 * 1024,
    verifyClient: ({ req }, done) => {
      if (getClientId(req) === undefined) {
        done(false, 401, "A valid clientId UUID is required");
        return;
      }

      done(true);
    },
  });
  const playerColors = new Map<string, Color>();
  let running = false;

  const game = new Game(width, height);
  const patternNames = Object.keys(PATTERNS).filter((patternName) => {
    const pattern = PATTERNS[patternName as PatternName];

    return pattern.width <= width && pattern.height <= height;
  }) as PatternName[];
  const initialPlayerColor =
    initialPatternCount > 0 && patternNames.length > 0
      ? createPlayerColor(random)
      : undefined;
  let initialPlayerColorAvailable = initialPlayerColor !== undefined;
  const occupiedInitialCells = new Set<string>();

  for (
    let patternIndex = 0;
    patternIndex < initialPatternCount;
    patternIndex += 1
  ) {
    const viablePatterns = patternNames
      .map((patternName) => {
        const pattern = PATTERNS[patternName];
        const origins = Array.from(
          { length: height - pattern.height + 1 },
          (_, y) =>
            Array.from({ length: width - pattern.width + 1 }, (_, x) => ({
              x,
              y,
            })),
        )
          .flat()
          .filter(({ x, y }) =>
            pattern.cells.every(
              ([offsetX, offsetY]) =>
                !occupiedInitialCells.has(`${x + offsetX},${y + offsetY}`),
            ),
          );

        return { patternName, origins };
      })
      .filter(({ origins }) => origins.length > 0);

    if (viablePatterns.length === 0) {
      break;
    }

    const selectedPattern =
      viablePatterns[Math.floor(random() * viablePatterns.length)];
    const origin =
      selectedPattern.origins[
        Math.floor(random() * selectedPattern.origins.length)
      ];
    const pattern = PATTERNS[selectedPattern.patternName];

    game.placePattern(
      selectedPattern.patternName,
      origin.x,
      origin.y,
      initialPlayerColor!,
    );

    for (const [offsetX, offsetY] of pattern.cells) {
      occupiedInitialCells.add(`${origin.x + offsetX},${origin.y + offsetY}`);
    }
  }

  const send = (socket: WebSocket, message: ServerMessage): void => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  };

  const broadcastSnapshot = (): void => {
    const { generation, revision, cells } = game.getSnapshot();
    const message: ServerMessage = {
      type: "snapshot",
      generation,
      revision,
      running,
      cells,
    };

    for (const client of webSocketServer.clients) {
      send(client, message);
    }
  };

  webSocketServer.on("connection", (socket, request) => {
    const clientId = getClientId(request)!;
    let playerColor = playerColors.get(clientId);

    if (playerColor === undefined) {
      if (initialPlayerColorAvailable) {
        playerColor = initialPlayerColor!;
        initialPlayerColorAvailable = false;
      } else {
        playerColor = createPlayerColor(random);
      }

      playerColors.set(clientId, playerColor);
    }

    send(socket, {
      type: "welcome",
      playerColor,
      board: { width, height },
    });
    const { generation, revision, cells } = game.getSnapshot();
    send(socket, { type: "snapshot", generation, revision, running, cells });

    socket.on("message", (data) => {
      try {
        const message = clientMsgSchema.parse(JSON.parse(data.toString()));

        if (message.type === "set_running") {
          running = message.running;
        } else if (message.type === "place_cell") {
          if (!game.placeCell(message.x, message.y, playerColor)) {
            send(socket, {
              type: "error",
              code: "INVALID_PLACEMENT",
              message: "Cell coordinates are outside the board",
            });
            return;
          }
        } else if (
          !game.placePatternRandom(message.pattern, playerColor, random)
        ) {
          send(socket, {
            type: "error",
            code: "INVALID_PLACEMENT",
            message: "Pattern does not fit in the available board space",
          });
          return;
        }

        broadcastSnapshot();
      } catch (error) {
        send(socket, {
          type: "error",
          code: "INVALID_MESSAGE",
          message: error instanceof Error ? error.message : "Invalid message",
        });
      }
    });
  });

  const simulationTimer = setInterval(() => {
    if (running) {
      game.tick();
      broadcastSnapshot();
    }
  }, simulationIntervalMs);

  let closePromise: Promise<void> | undefined;

  const close = (): Promise<void> => {
    closePromise ??= new Promise<void>((resolve, reject) => {
      clearInterval(simulationTimer);

      for (const client of webSocketServer.clients) {
        client.terminate();
      }

      webSocketServer.close((webSocketError) => {
        if (webSocketError) {
          reject(webSocketError);
          return;
        }

        server.close((serverError) => {
          if (serverError) {
            reject(serverError);
            return;
          }

          resolve();
        });
      });
    });

    return closePromise;
  };

  return { server, webSocketServer, game, close };
};

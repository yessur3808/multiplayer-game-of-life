import { createServer, type Server } from "node:http";
import type { IncomingMessage } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

import { createPlayerColor } from "./game/colors.js";
import { Game } from "./game/Game.js";
import type { Color } from "./game/types.js";
import { clientMsgSchema, type ServerMessage } from "./protocol.js";

export interface AppOptions {
  width: number;
  height: number;
  simulationIntervalMs: number;
  random?: () => number;
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
  let running = true;

  const game = new Game(width, height);

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
      playerColor = createPlayerColor(random);
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
          !game.placePattern(message.pattern, message.x, message.y, playerColor)
        ) {
          send(socket, {
            type: "error",
            code: "INVALID_PLACEMENT",
            message: "Pattern does not fit at those coordinates",
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

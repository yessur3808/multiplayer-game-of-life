import { createServer, type Server } from "node:http";
import { WebSocket, WebSocketServer } from "ws";

import { createPlayerColor } from "./game/colors.js";
import { Game } from "./game/Game.js";
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
  });

  const game = new Game(width, height, random);

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
      cells,
    };

    for (const client of webSocketServer.clients) {
      send(client, message);
    }
  };

  webSocketServer.on("connection", (socket) => {
    const playerColor = createPlayerColor(random);

    send(socket, {
      type: "welcome",
      playerColor,
      board: { width, height },
    });
    const { generation, revision, cells } = game.getSnapshot();
    send(socket, { type: "snapshot", generation, revision, cells });

    socket.on("message", (data) => {
      try {
        const message = clientMsgSchema.parse(JSON.parse(data.toString()));

        if (message.type === "place_cell") {
          if (!game.placeCell(message.x, message.y, playerColor)) {
            send(socket, {
              type: "error",
              code: "INVALID_PLACEMENT",
              message: "Cell coordinates are outside the board",
            });
            return;
          }
        } else {
          game.placePattern(message.pattern, playerColor);
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
    game.tick();
    broadcastSnapshot();
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

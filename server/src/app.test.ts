import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { createGameServer } from "./app.js";
import type { ServerMessage } from "./protocol.js";

describe("createApp", () => {
  it("creates the servers and advances the game on the simulation interval", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 10,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    await expect
      .poll(() => app.game.getSnapshot().generation)
      .toBeGreaterThan(0);

    expect(app.webSocketServer.options.path).toBe("/ws");

    await app.close();

    expect(app.server.listening).toBe(false);
  });

  it("accepts WebSocket connections and sends the initial game state", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    const { port } = app.server.address() as AddressInfo;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const messages: ServerMessage[] = [];

    await new Promise<void>((resolve, reject) => {
      socket.on("error", reject);
      socket.on("message", (data) => {
        messages.push(JSON.parse(data.toString()) as ServerMessage);

        if (messages.length === 2) {
          resolve();
        }
      });
    });

    expect(messages).toEqual([
      {
        type: "welcome",
        playerColor: [226, 54, 54],
        board: { width: 8, height: 6 },
      },
      {
        type: "snapshot",
        generation: 0,
        revision: 0,
        cells: [],
      },
    ]);

    await app.close();
  });
});

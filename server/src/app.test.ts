import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";

import { createGameServer } from "./app.js";
import { BLOCK } from "./game/patterns/patterns.js";
import type { ServerMessage, WelcomeMessage } from "./protocol.js";

const CLIENT_ID = "123e4567-e89b-42d3-a456-426614174000";
const SECOND_CLIENT_ID = "987fcdeb-51a2-43d7-8abc-123456789abc";

const connectAndReadWelcome = async (
  port: number,
  clientId: string,
): Promise<WelcomeMessage> => {
  const socket = new WebSocket(
    `ws://127.0.0.1:${port}/ws?clientId=${clientId}`,
  );

  return new Promise<WelcomeMessage>((resolve, reject) => {
    socket.on("error", reject);
    socket.on("message", (data) => {
      const message = JSON.parse(data.toString()) as ServerMessage;

      if (message.type === "welcome") {
        resolve(message);
      }
    });
  });
};

describe("createApp", () => {
  it("creates the servers with the simulation initially paused", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 10,
      initialPatternCount: 0,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(app.webSocketServer.options.path).toBe("/ws");
    expect(app.game.getSnapshot().generation).toBe(0);

    await app.close();

    expect(app.server.listening).toBe(false);
  });

  it("accepts a valid UUID and sends welcome and snapshot messages", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0,
      initialPatternCount: 0,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    const { port } = app.server.address() as AddressInfo;
    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/ws?clientId=${CLIENT_ID}`,
    );
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

    expect(messages.map(({ type }) => type)).toEqual(["welcome", "snapshot"]);
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
        running: false,
        cells: [],
      },
    ]);

    await app.close();
  });

  it("reuses a color for the same client ID and assigns new IDs a new color", async () => {
    const randomValues = [0, 0.5];
    let randomCalls = 0;
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => randomValues[randomCalls++] ?? 0,
      initialPatternCount: 0,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    const { port } = app.server.address() as AddressInfo;
    const firstConnection = await connectAndReadWelcome(port, CLIENT_ID);
    const reconnect = await connectAndReadWelcome(port, CLIENT_ID);
    const differentClient = await connectAndReadWelcome(port, SECOND_CLIENT_ID);

    expect(firstConnection.playerColor).toEqual([226, 54, 54]);
    expect(reconnect.playerColor).toEqual(firstConnection.playerColor);
    expect(differentClient.playerColor).toEqual([54, 226, 226]);
    expect(randomCalls).toBe(2);

    await app.close();
  });

  it("creates a new color assignment after the server restarts", async () => {
    const firstApp = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0,
      initialPatternCount: 0,
    });
    firstApp.server.listen(0, "127.0.0.1");
    await once(firstApp.server, "listening");
    const firstAddress = firstApp.server.address() as AddressInfo;
    const firstWelcome = await connectAndReadWelcome(
      firstAddress.port,
      CLIENT_ID,
    );
    await firstApp.close();

    const restartedApp = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0.5,
      initialPatternCount: 0,
    });
    restartedApp.server.listen(0, "127.0.0.1");
    await once(restartedApp.server, "listening");
    const restartedAddress = restartedApp.server.address() as AddressInfo;
    const restartedWelcome = await connectAndReadWelcome(
      restartedAddress.port,
      CLIENT_ID,
    );

    expect(firstWelcome.playerColor).toEqual([226, 54, 54]);
    expect(restartedWelcome.playerColor).toEqual([54, 226, 226]);

    await restartedApp.close();
  });

  it("starts the shared simulation and pauses it again", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 10,
      initialPatternCount: 0,
    });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    const { port } = app.server.address() as AddressInfo;
    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/ws?clientId=${CLIENT_ID}`,
    );
    await once(socket, "open");

    socket.send(JSON.stringify({ type: "set_running", running: true }));
    await expect
      .poll(() => app.game.getSnapshot().generation)
      .toBeGreaterThan(0);

    socket.send(JSON.stringify({ type: "set_running", running: false }));
    await new Promise<void>((resolve) => {
      socket.on("message", (data) => {
        const message = JSON.parse(data.toString()) as ServerMessage;
        if (message.type === "snapshot" && !message.running) {
          resolve();
        }
      });
    });
    const pausedGeneration = app.game.getSnapshot().generation;
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(app.game.getSnapshot().generation).toBe(pausedGeneration);

    await app.close();
  });

  it("places a requested pattern at a server-selected random origin", async () => {
    const randomValues = [0, 0.5, 0.25];
    let randomIndex = 0;
    const app = createGameServer({
      width: 10,
      height: 8,
      simulationIntervalMs: 60_000,
      random: () => randomValues[randomIndex++] ?? 0,
      initialPatternCount: 0,
    });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    const { port } = app.server.address() as AddressInfo;
    const socket = new WebSocket(
      `ws://127.0.0.1:${port}/ws?clientId=${CLIENT_ID}`,
    );
    await once(socket, "open");

    const patternSnapshot = new Promise<ServerMessage>((resolve) => {
      socket.on("message", (data) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        if (message.type === "snapshot" && message.revision === 1) {
          resolve(message);
        }
      });
    });

    socket.send(
      JSON.stringify({
        type: "place_pattern",
        pattern: "lightweight_spaceship",
      }),
    );

    await expect(patternSnapshot).resolves.toMatchObject({
      type: "snapshot",
      revision: 1,
      cells: [
        { x: 4, y: 1 },
        { x: 7, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
        { x: 7, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 4 },
        { x: 5, y: 4 },
        { x: 6, y: 4 },
      ],
    });

    await app.close();
  });

  it("starts with two random patterns matching the initial color", async () => {
    const randomValues = [0, 0, 0, 0.6, 0];
    let randomIndex = 0;
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => randomValues[randomIndex++] ?? 0,
    });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    const { port } = app.server.address() as AddressInfo;
    const initial = await connectAndReadWelcome(port, CLIENT_ID);
    const snapshot = app.game.getSnapshot();

    expect(initial.playerColor).toEqual([226, 54, 54]);
    expect(snapshot).toMatchObject({
      generation: 0,
      revision: 2,
      cells: [
        { x: 0, y: 0, color: [226, 54, 54] },
        { x: 1, y: 0, color: [226, 54, 54] },
        { x: 0, y: 1, color: [226, 54, 54] },
        { x: 1, y: 1, color: [226, 54, 54] },
        { x: 2, y: 0, color: [226, 54, 54] },
        { x: 3, y: 1, color: [226, 54, 54] },
        { x: 1, y: 2, color: [226, 54, 54] },
        { x: 2, y: 2, color: [226, 54, 54] },
        { x: 3, y: 2, color: [226, 54, 54] },
      ],
    });
    for (const cell of snapshot.cells) {
      expect(cell.color).toEqual(initial.playerColor);
    }

    await app.close();
  });

  it("keeps the two initial patterns from overlapping", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0,
    });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    const snapshot = app.game.getSnapshot();
    const coordinates = snapshot.cells.map(({ x, y }) => `${x},${y}`);

    expect(snapshot.revision).toBe(2);
    expect(snapshot.cells).toHaveLength(BLOCK.cells.length * 2);
    expect(new Set(coordinates).size).toBe(snapshot.cells.length);

    await app.close();
  });

  it("broadcasts a cell placed by one client to another client", async () => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      random: () => 0,
      initialPatternCount: 0,
    });
    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");
    const { port } = app.server.address() as AddressInfo;
    const firstClient = new WebSocket(
      `ws://127.0.0.1:${port}/ws?clientId=${CLIENT_ID}`,
    );
    const secondClient = new WebSocket(
      `ws://127.0.0.1:${port}/ws?clientId=${SECOND_CLIENT_ID}`,
    );
    await Promise.all([once(firstClient, "open"), once(secondClient, "open")]);

    const secondClientSnapshot = new Promise<ServerMessage>((resolve) => {
      secondClient.on("message", (data) => {
        const message = JSON.parse(data.toString()) as ServerMessage;

        if (message.type === "snapshot" && message.revision === 1) {
          resolve(message);
        }
      });
    });

    firstClient.send(JSON.stringify({ type: "place_cell", x: 3, y: 2 }));

    await expect(secondClientSnapshot).resolves.toMatchObject({
      type: "snapshot",
      revision: 1,
      cells: [{ x: 3, y: 2, color: [226, 54, 54] }],
    });

    await app.close();
  });

  it.each([
    { description: "missing", query: "" },
    { description: "empty", query: "?clientId=" },
    {
      description: "longer than 64 decoded characters",
      query: `?clientId=${encodeURIComponent("a".repeat(65))}`,
    },
    { description: "not a UUID", query: "?clientId=not-a-uuid" },
  ])("rejects a $description client ID", async ({ query }) => {
    const app = createGameServer({
      width: 8,
      height: 6,
      simulationIntervalMs: 60_000,
      initialPatternCount: 0,
    });

    app.server.listen(0, "127.0.0.1");
    await once(app.server, "listening");

    const { port } = app.server.address() as AddressInfo;
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws${query}`);
    let opened = false;
    socket.on("open", () => {
      opened = true;
    });

    const [, response] = (await once(socket, "unexpected-response")) as [
      import("node:http").ClientRequest,
      import("node:http").IncomingMessage,
    ];
    let body = "";
    response.setEncoding("utf8");
    response.on("data", (chunk) => {
      body += chunk;
    });
    await once(response, "end");

    expect(response.statusCode).toBe(401);
    expect(body).toBe("A valid clientId UUID is required");
    expect(opened).toBe(false);

    await app.close();
  });
});

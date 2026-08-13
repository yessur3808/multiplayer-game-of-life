import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FakeWebSocket } from "../test/FakeWebSocket";
import { useGameSocket } from "./useGameSocket";

vi.mock("../lib/clientId", () => ({
  getClientId: () => "123e4567-e89b-42d3-a456-426614174000",
}));

const originalWebSocket = globalThis.WebSocket;

describe("useGameSocket", () => {
  beforeEach(() => {
    FakeWebSocket.reset();
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.WebSocket = originalWebSocket;
  });

  it("connects with the client ID and applies valid game messages", () => {
    const { result } = renderHook(() => useGameSocket());
    const socket = FakeWebSocket.instances[0];

    expect(socket.url).toBe(
      "wss://game.example/ws?clientId=123e4567-e89b-42d3-a456-426614174000",
    );
    expect(result.current.status).toBe("connecting");

    act(() => {
      socket.open();
      socket.receive(
        JSON.stringify({
          type: "welcome",
          playerColor: [10, 20, 30],
          board: { width: 80, height: 50 },
        }),
      );
      socket.receive(
        JSON.stringify({
          type: "snapshot",
          generation: 2,
          revision: 3,
          cells: [],
        }),
      );
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.playerColor).toEqual([10, 20, 30]);
    expect(result.current.board).toEqual({ width: 80, height: 50 });
    expect(result.current.snapshot?.revision).toBe(3);
  });

  it("rejects malformed and older server messages", () => {
    const { result } = renderHook(() => useGameSocket());
    const socket = FakeWebSocket.instances[0];

    act(() => {
      socket.receive(JSON.stringify({ type: "welcome" }));
    });
    expect(result.current.error).toBe("Received an invalid server message.");

    act(() => {
      socket.receive(
        JSON.stringify({
          type: "snapshot",
          generation: 5,
          revision: 5,
          cells: [],
        }),
      );
      socket.receive(
        JSON.stringify({
          type: "snapshot",
          generation: 4,
          revision: 4,
          cells: [],
        }),
      );
    });

    expect(result.current.snapshot?.revision).toBe(5);
  });

  it("reports whether placement commands were sent", () => {
    const { result } = renderHook(() => useGameSocket());
    const socket = FakeWebSocket.instances[0];

    expect(result.current.placeCell(1, 2)).toBe(false);

    act(() => socket.open());

    expect(result.current.placeCell(1, 2)).toBe(true);
    expect(result.current.placePattern("glider")).toBe(true);
    expect(socket.sentMessages.map((message) => JSON.parse(message))).toEqual([
      { type: "place_cell", x: 1, y: 2 },
      { type: "place_pattern", pattern: "glider" },
    ]);
  });

  it("reconnects with backoff and ignores stale socket events", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameSocket());
    const firstSocket = FakeWebSocket.instances[0];

    act(() => {
      firstSocket.open();
      firstSocket.serverClose();
    });
    expect(result.current.status).toBe("reconnecting");

    act(() => vi.advanceTimersByTime(500));
    const secondSocket = FakeWebSocket.instances[1];

    act(() => {
      firstSocket.receive(
        JSON.stringify({
          type: "snapshot",
          generation: 99,
          revision: 99,
          cells: [],
        }),
      );
      secondSocket.open();
    });

    expect(result.current.status).toBe("connected");
    expect(result.current.snapshot).toBeNull();
    expect(secondSocket.url).toBe(firstSocket.url);
  });

  it("resets the reconnect delay after a successful connection", () => {
    vi.useFakeTimers();
    renderHook(() => useGameSocket());

    act(() => FakeWebSocket.instances[0].serverClose());
    act(() => vi.advanceTimersByTime(500));
    act(() => FakeWebSocket.instances[1].open());
    act(() => FakeWebSocket.instances[1].serverClose());
    act(() => vi.advanceTimersByTime(500));

    expect(FakeWebSocket.instances).toHaveLength(3);
  });

  it("stops after five failed reconnect attempts", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameSocket());
    const delays = [500, 1_000, 2_000, 4_000, 5_000];

    for (const delay of delays) {
      act(() => FakeWebSocket.instances.at(-1)?.serverClose());
      act(() => vi.advanceTimersByTime(delay));
    }

    act(() => FakeWebSocket.instances.at(-1)?.serverClose());

    expect(FakeWebSocket.instances).toHaveLength(6);
    expect(result.current.status).toBe("disconnected");
    expect(result.current.error).toBe(
      "Unable to reconnect to the game server.",
    );
  });

  it("closes the socket and cancels reconnects on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useGameSocket());
    const socket = FakeWebSocket.instances[0];

    act(() => socket.serverClose());
    unmount();
    act(() => vi.runAllTimers());

    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("closes the active socket on unmount", () => {
    const { unmount } = renderHook(() => useGameSocket());
    const socket = FakeWebSocket.instances[0];

    unmount();

    expect(socket.closeCallCount).toBe(1);
  });

  it("ignores the socket cleaned up by React StrictMode", () => {
    const { result } = renderHook(() => useGameSocket(), {
      reactStrictMode: true,
    });
    const cleanedSocket = FakeWebSocket.instances.find(
      (socket) => socket.closeCallCount === 1,
    );
    const currentSocket = FakeWebSocket.instances.at(-1);

    expect(cleanedSocket).toBeDefined();
    expect(currentSocket).toBeDefined();

    if (!cleanedSocket || !currentSocket) {
      throw new Error("StrictMode did not create both socket lifecycles");
    }

    act(() => {
      cleanedSocket.open();
      currentSocket.open();
    });

    expect(result.current.status).toBe("connected");
    expect(FakeWebSocket.instances).toHaveLength(2);
  });
});

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { FakeWebSocket } from "./test/FakeWebSocket";

vi.mock("./lib/clientId", () => ({
  getClientId: () => "123e4567-e89b-42d3-a456-426614174000",
}));

const originalWebSocket = globalThis.WebSocket;

describe("App", () => {
  beforeEach(() => {
    FakeWebSocket.reset();
    globalThis.WebSocket = FakeWebSocket as unknown as typeof WebSocket;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.WebSocket = originalWebSocket;
  });

  it("uses the game socket hook without sending a hello message", () => {
    render(<App />);
    const socket = FakeWebSocket.instances[0];

    expect(screen.getByText("Connection: connecting")).toBeTruthy();

    act(() => socket.open());

    expect(screen.getByText("Connection: connected")).toBeTruthy();
    expect(socket.sentMessages).toEqual([]);
  });

  it("renders the canvas from welcome board dimensions and snapshot cells", () => {
    render(<App />);
    const socket = FakeWebSocket.instances[0];

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
          generation: 0,
          revision: 0,
          cells: [],
        }),
      );
    });

    expect(
      screen.getByLabelText("Multiplayer Game of Life board"),
    ).toBeTruthy();
  });
});

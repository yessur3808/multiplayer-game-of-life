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
  });

  afterEach(() => {
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
});

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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
    cleanup();
    vi.restoreAllMocks();
    globalThis.WebSocket = originalWebSocket;
  });

  it("uses the game socket hook without sending a hello message", () => {
    render(<App />);
    const socket = FakeWebSocket.instances[0];

    expect(screen.getByText("Connecting")).toBeTruthy();

    act(() => socket.open());

    expect(screen.getByText("Connected")).toBeTruthy();
    expect(socket.sentMessages).toEqual([]);
  });

  it("renders the canvas from welcome board dimensions and snapshot cells", () => {
    const { container } = render(<App />);
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
          running: false,
          cells: [],
        }),
      );
    });

    expect(
      screen.getByLabelText("Multiplayer Game of Life board"),
    ).toBeTruthy();
    expect(
      container.querySelector<HTMLElement>(".player-color__swatch")?.style
        .backgroundColor,
    ).toBe("rgb(10, 20, 30)");
  });

  it("places a cell when the connected canvas is clicked", () => {
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
          running: true,
          cells: [],
        }),
      );
    });

    const canvas = screen.getByLabelText("Multiplayer Game of Life board");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      width: 960,
      height: 600,
      right: 960,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.click(canvas, { clientX: 18, clientY: 30 });

    expect(JSON.parse(socket.sentMessages[0])).toEqual({
      type: "place_cell",
      x: 1,
      y: 2,
    });
  });

  it("requests random pattern placement from a toolbar button", () => {
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
          running: true,
          cells: [],
        }),
      );
    });

    const lightweightSpaceshipButton = screen.getByRole("button", {
      name: "Lightweight Spaceship",
    });
    fireEvent.click(lightweightSpaceshipButton);

    expect(JSON.parse(socket.sentMessages[0])).toEqual({
      type: "place_pattern",
      pattern: "lightweight_spaceship",
    });
  });

  it("starts paused and sends shared play and pause commands", () => {
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
          running: false,
          cells: [],
        }),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Play simulation" }));
    expect(JSON.parse(socket.sentMessages[0])).toEqual({
      type: "set_running",
      running: true,
    });

    act(() => {
      socket.receive(
        JSON.stringify({
          type: "snapshot",
          generation: 0,
          revision: 0,
          running: true,
          cells: [],
        }),
      );
    });
    fireEvent.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(JSON.parse(socket.sentMessages[1])).toEqual({
      type: "set_running",
      running: false,
    });
  });
});

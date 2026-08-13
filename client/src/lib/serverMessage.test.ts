import { describe, expect, it } from "vitest";

import { parseServerMessage } from "./serverMessage";

describe("parseServerMessage", () => {
  it.each([
    {
      type: "welcome",
      playerColor: [12, 34, 56],
      board: { width: 80, height: 50 },
    },
    {
      type: "snapshot",
      generation: 4,
      revision: 7,
      running: true,
      cells: [{ x: 1, y: 2, color: [255, 0, 128] }],
    },
    { type: "error", code: "INVALID_MESSAGE", message: "Invalid message" },
  ])("accepts a valid $type message", (message) => {
    expect(parseServerMessage(JSON.stringify(message))).toEqual(message);
  });

  it.each([
    "not json",
    "null",
    JSON.stringify({ type: "unknown" }),
    JSON.stringify({ type: "welcome", board: { width: 80, height: 50 } }),
    JSON.stringify({
      type: "snapshot",
      generation: 1,
      revision: "new",
      running: true,
      cells: [],
    }),
    JSON.stringify({
      type: "snapshot",
      generation: 1,
      revision: 1,
      running: true,
      cells: [{ x: 0, y: 0, color: [300, 0, 0] }],
    }),
  ])("rejects malformed input", (rawValue) => {
    expect(parseServerMessage(rawValue)).toBeNull();
  });
});

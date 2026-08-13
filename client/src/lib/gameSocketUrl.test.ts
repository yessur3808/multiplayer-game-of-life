import { describe, expect, it } from "vitest";

import { createGameSocketUrl } from "./gameSocketUrl";

describe("createGameSocketUrl", () => {
  it("uses a secure socket and encodes the client ID", () => {
    expect(createGameSocketUrl("client id/1")).toBe(
      "wss://game.example/ws?clientId=client+id%2F1",
    );
  });
});

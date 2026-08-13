import { describe, expect, it } from "vitest";

import { calculateReconnectDelay, MAX_RECONNECT_ATTEMPTS } from "./reconnect";

describe("calculateReconnectDelay", () => {
  it("uses exponential backoff capped at five seconds", () => {
    expect(
      Array.from({ length: MAX_RECONNECT_ATTEMPTS }, (_, attempt) =>
        calculateReconnectDelay(attempt),
      ),
    ).toEqual([500, 1_000, 2_000, 4_000, 5_000]);
  });

  it("normalizes invalid negative and fractional attempts", () => {
    expect(calculateReconnectDelay(-1)).toBe(500);
    expect(calculateReconnectDelay(2.9)).toBe(2_000);
  });
});

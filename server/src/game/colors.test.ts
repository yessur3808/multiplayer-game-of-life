import { describe, expect, it } from "vitest";

import { createPlayerColor } from "./colors.js";

describe("createPlayerColor", () => {
  it.each([0, 0.1, 0.25, 0.5, 0.75, 0.999])(
    "returns three integer channels between 0 and 255 for random value %s",
    (random) => {
      const color = createPlayerColor(() => random);

      expect(color).toHaveLength(3);

      for (const channel of color) {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      }
    },
  );

  it.each([
    { random: 0, expected: [226, 54, 54] },
    { random: 1 / 6, expected: [226, 226, 54] },
    { random: 0.5, expected: [54, 226, 226] },
  ])(
    "returns predictable RGB values for injected random value $random",
    ({ random, expected }) => {
      expect(createPlayerColor(() => random)).toEqual(expected);
    },
  );
});

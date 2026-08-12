import { describe, expect, it } from "vitest";

import { PATTERNS } from "./patterns.js";

describe("PATTERNS", () => {
  it.each(Object.entries(PATTERNS))(
    "%s contains unique cells",
    (_patternName, pattern) => {
      const cellKeys = pattern.cells.map(([x, y]) => `${x},${y}`);

      expect(new Set(cellKeys).size).toBe(pattern.cells.length);
    },
  );

  it.each(Object.entries(PATTERNS))(
    "%s offsets fit within its dimensions",
    (_patternName, pattern) => {
      for (const [x, y] of pattern.cells) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(pattern.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(pattern.height);
      }
    },
  );
});

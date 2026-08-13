import { describe, expect, it } from "vitest";

import { Game } from "./Game.js";
import type { Color } from "./model/index.js";

describe("Game.placeCell", () => {
  it("returns true for a valid placement", () => {
    const game = new Game(5, 5);

    expect(game.placeCell(2, 3, [255, 0, 0])).toBe(true);
  });

  it("returns false for an invalid placement", () => {
    const game = new Game(5, 5);

    expect(game.placeCell(5, 3, [255, 0, 0])).toBe(false);
  });

  it("includes a valid placement in the snapshot", () => {
    const game = new Game(5, 5);
    const color: Color = [255, 0, 0];

    game.placeCell(2, 3, color);

    expect(game.getSnapshot().cells).toContainEqual({ x: 2, y: 3, color });
  });

  it("changes the color when replacing a live cell", () => {
    const game = new Game(5, 5);

    game.placeCell(2, 3, [255, 0, 0]);
    game.placeCell(2, 3, [0, 0, 255]);

    expect(game.getSnapshot().cells).toEqual([
      { x: 2, y: 3, color: [0, 0, 255] },
    ]);
  });

  it("does not increment the revision for an invalid placement", () => {
    const game = new Game(5, 5);

    game.placeCell(2, 3, [255, 0, 0]);
    const revisionBeforeInvalidPlacement = game.getSnapshot().revision;

    game.placeCell(-1, 3, [0, 0, 255]);

    expect(game.getSnapshot().revision).toBe(revisionBeforeInvalidPlacement);
  });
});

describe("Game.placePattern", () => {
  it("places the named pattern at a random valid origin in the supplied color", () => {
    const game = new Game(5, 5, () => 0.99);
    const color: Color = [40, 120, 200];

    expect(game.placePattern("glider", color)).toBe(true);
    expect(game.getSnapshot()).toMatchObject({
      revision: 1,
      cells: [
        { x: 3, y: 2, color },
        { x: 4, y: 3, color },
        { x: 2, y: 4, color },
        { x: 3, y: 4, color },
        { x: 4, y: 4, color },
      ],
    });
  });

  it.each([
    { width: 2, height: 3 },
    { width: 3, height: 2 },
  ])(
    "throws without incrementing revision on a $width x $height board",
    ({ width, height }) => {
      const game = new Game(width, height);

      expect(() => game.placePattern("glider", [255, 0, 0])).toThrow(
        `Pattern "glider" does not fit on a ${width}x${height} board`,
      );
      expect(game.getSnapshot()).toMatchObject({ revision: 0, cells: [] });
    },
  );
});

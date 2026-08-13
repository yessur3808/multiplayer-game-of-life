import { describe, expect, it } from "vitest";

import { Game } from "./Game.js";
import type { Color } from "./types.js";

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
  it("places the named pattern at the supplied origin and color", () => {
    const game = new Game(5, 5);
    const color: Color = [40, 120, 200];

    expect(game.placePattern("glider", 2, 2, color)).toBe(true);
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

  it("rejects an origin where the pattern would exceed the board", () => {
    const game = new Game(5, 5);

    expect(game.placePattern("glider", 3, 3, [255, 0, 0])).toBe(false);
    expect(game.getSnapshot()).toMatchObject({ revision: 0, cells: [] });
  });
});

describe("Game.placePatternRandom", () => {
  it("places a pattern at a random valid origin", () => {
    const game = new Game(10, 8);
    const randomValues = [0.5, 0.25];
    let randomIndex = 0;
    const color: Color = [40, 120, 200];

    expect(
      game.placePatternRandom(
        "glider",
        color,
        () => randomValues[randomIndex++] ?? 0,
      ),
    ).toBe(true);
    expect(game.getSnapshot().cells).toEqual([
      { x: 5, y: 1, color },
      { x: 6, y: 2, color },
      { x: 4, y: 3, color },
      { x: 5, y: 3, color },
      { x: 6, y: 3, color },
    ]);
  });

  it("rejects a pattern that cannot fit on the board", () => {
    const game = new Game(2, 2);

    expect(game.placePatternRandom("glider", [255, 0, 0])).toBe(false);
    expect(game.getSnapshot()).toMatchObject({ revision: 0, cells: [] });
  });

  it("moves random pattern placement to avoid overlapping live cells", () => {
    const game = new Game(8, 6);
    const existingColor: Color = [220, 40, 80];
    const patternColor: Color = [40, 120, 200];

    game.placePattern("block", 0, 0, existingColor);

    expect(game.placePatternRandom("glider", patternColor, () => 0)).toBe(
      true,
    );

    const snapshot = game.getSnapshot();

    expect(snapshot.revision).toBe(2);
    expect(snapshot.cells).toHaveLength(9);
    expect(snapshot.cells).toEqual([
      { x: 0, y: 0, color: existingColor },
      { x: 1, y: 0, color: existingColor },
      { x: 0, y: 1, color: existingColor },
      { x: 1, y: 1, color: existingColor },
      { x: 2, y: 0, color: patternColor },
      { x: 3, y: 1, color: patternColor },
      { x: 1, y: 2, color: patternColor },
      { x: 2, y: 2, color: patternColor },
      { x: 3, y: 2, color: patternColor },
    ]);
  });
});

describe("Game.tick", () => {
  it("evolves a blinker to its next oscillator phase", () => {
    const game = new Game(5, 5);
    const color: Color = [40, 120, 200];

    game.placePattern("blinker", 1, 2, color);
    game.tick();

    expect(game.getSnapshot()).toMatchObject({
      generation: 1,
      revision: 2,
      cells: [
        { x: 2, y: 1, color },
        { x: 2, y: 2, color },
        { x: 2, y: 3, color },
      ],
    });
  });
});

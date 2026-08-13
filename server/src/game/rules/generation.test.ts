import { describe, expect, it } from "vitest";

import { getLiveNeighborColors, stepBoard } from "./index.js";
import { cellKey } from "../coordinates.js";
import { Board, Color } from "../types.js";

describe("getLiveNeighborColors", () => {
  it("returns only live neighbor colors within the board", () => {
    const board: Board = new Map([
      [cellKey(0, 0, 3), [255, 0, 0]],
      [cellKey(1, 0, 3), [0, 255, 0]],
      [cellKey(0, 1, 3), [0, 0, 255]],
      [cellKey(1, 1, 3), [255, 255, 0]],
      [cellKey(2, 2, 3), [255, 0, 255]],
    ]);

    expect(getLiveNeighborColors(board, 0, 0, 3, 3)).toEqual([
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
    ]);
  });
});

describe("stepBoard", () => {
  it("kills an isolated live cell", () => {
    const board: Board = new Map([[cellKey(2, 2, 5), [255, 0, 0]]]);

    const nextBoard = stepBoard(board, 5, 5);

    expect(nextBoard.size).toBe(0);
  });

  it("retains a surviving cell's original color", () => {
    const survivorColor: Color = [240, 80, 120];

    const board: Board = new Map([
      [cellKey(2, 2, 5), survivorColor],
      [cellKey(1, 2, 5), [0, 255, 0]],
      [cellKey(3, 2, 5), [0, 0, 255]],
    ]);

    const nextBoard = stepBoard(board, 5, 5);

    expect(nextBoard.get(cellKey(2, 2, 5))).toEqual(survivorColor);
  });
});

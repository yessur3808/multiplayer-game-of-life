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
  it.each([
    { neighborCount: 0, neighbors: [] },
    { neighborCount: 1, neighbors: [[1, 2]] },
  ])(
    "kills a live cell with $neighborCount live neighbors",
    ({ neighbors }) => {
      const board: Board = new Map([[cellKey(2, 2, 5), [255, 0, 0]]]);

      for (const [x, y] of neighbors) {
        board.set(cellKey(x, y, 5), [0, 255, 0]);
      }

      const nextBoard = stepBoard(board, 5, 5);

      expect(nextBoard.has(cellKey(2, 2, 5))).toBe(false);
    },
  );

  it.each([
    {
      neighborCount: 2,
      neighbors: [
        [1, 2],
        [3, 2],
      ],
    },
    {
      neighborCount: 3,
      neighbors: [
        [1, 2],
        [3, 2],
        [2, 1],
      ],
    },
  ])(
    "retains a live cell with $neighborCount neighbors and its original color",
    ({ neighbors }) => {
      const survivorColor: Color = [240, 80, 120];
      const board: Board = new Map([[cellKey(2, 2, 5), survivorColor]]);

      for (const [x, y] of neighbors) {
        board.set(cellKey(x, y, 5), [0, 255, 0]);
      }

      const nextBoard = stepBoard(board, 5, 5);

      expect(nextBoard.get(cellKey(2, 2, 5))).toEqual(survivorColor);
    },
  );

  it("kills a live cell with more than three neighbors", () => {
    const board: Board = new Map([
      [cellKey(2, 2, 5), [255, 0, 0]],
      [cellKey(1, 2, 5), [0, 255, 0]],
      [cellKey(3, 2, 5), [0, 0, 255]],
      [cellKey(2, 1, 5), [255, 255, 0]],
      [cellKey(2, 3, 5), [255, 0, 255]],
    ]);

    const nextBoard = stepBoard(board, 5, 5);

    expect(nextBoard.has(cellKey(2, 2, 5))).toBe(false);
  });

  it("births a dead cell with the rounded RGB average of three neighbors", () => {
    const board: Board = new Map([
      [cellKey(1, 2, 5), [255, 0, 0]],
      [cellKey(3, 2, 5), [0, 255, 0]],
      [cellKey(2, 1, 5), [0, 0, 254]],
    ]);

    const nextBoard = stepBoard(board, 5, 5);

    expect(nextBoard.get(cellKey(2, 2, 5))).toEqual([85, 85, 85]);
  });

  it("leaves a dead cell dead unless it has exactly three neighbors", () => {
    const board: Board = new Map([
      [cellKey(1, 2, 5), [255, 0, 0]],
      [cellKey(3, 2, 5), [0, 255, 0]],
    ]);

    const nextBoard = stepBoard(board, 5, 5);

    expect(nextBoard.has(cellKey(2, 2, 5))).toBe(false);
  });
});

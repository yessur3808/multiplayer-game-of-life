import { averageColors } from "./colors.js";
import { cellKey } from "./coordinates.js";
import type { Board, Color } from "./types.js";

export const NEIGHBOR_OFFSETS: ReadonlyArray<
  readonly [xOffset: number, yOffset: number]
> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

export const getLiveNeighborColors = (
  board: Board,
  x: number,
  y: number,
  width: number,
  height: number,
): Color[] => {
  const colors: Color[] = [];

  for (const [xOffset, yOffset] of NEIGHBOR_OFFSETS) {
    const neighborX = x + xOffset;
    const neighborY = y + yOffset;

    if (
      neighborX < 0 ||
      neighborX >= width ||
      neighborY < 0 ||
      neighborY >= height
    ) {
      continue;
    }

    const color = board.get(cellKey(neighborX, neighborY, width));

    if (color) {
      colors.push(color);
    }
  }

  return colors;
};

export const stepBoard = (
  board: Board,
  width: number,
  height: number,
): Board => {
  const nextBoard: Board = new Map();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = cellKey(x, y, width);
      const currentColor = board.get(key);
      const neighborColors = getLiveNeighborColors(board, x, y, width, height);
      const neighborCount = neighborColors.length;

      if (currentColor && (neighborCount === 2 || neighborCount === 3)) {
        nextBoard.set(key, currentColor);
        continue;
      }

      if (!currentColor && neighborCount === 3) {
        nextBoard.set(key, averageColors(neighborColors));
      }
    }
  }

  return nextBoard;
};

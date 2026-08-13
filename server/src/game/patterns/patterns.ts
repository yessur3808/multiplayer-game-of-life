export type PatternCell = readonly [x: number, y: number];

export interface GameOfLifePattern {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly cells: readonly PatternCell[];
}

export const BLOCK = {
  name: "Block",
  width: 2,
  height: 2,
  cells: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
} as const satisfies GameOfLifePattern;

export const BLINKER = {
  name: "Blinker",
  width: 3,
  height: 1,
  cells: [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
} as const satisfies GameOfLifePattern;

export const BEACON = {
  name: "Beacon",
  width: 4,
  height: 4,
  cells: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 3],
  ],
} as const satisfies GameOfLifePattern;

export const GLIDER = {
  name: "Glider",
  width: 3,
  height: 3,
  cells: [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ],
} as const satisfies GameOfLifePattern;

export const PATTERNS = {
  block: BLOCK,
  blinker: BLINKER,
  beacon: BEACON,
  glider: GLIDER,
} as const satisfies Record<string, GameOfLifePattern>;

export type PatternName = keyof typeof PATTERNS;

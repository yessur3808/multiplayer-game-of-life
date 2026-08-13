import { stepBoard } from "./rules/index.js";
import { PATTERNS, type PatternName } from "./patterns/patterns.js";
import { cellKey, keyToCoordinates } from "./coordinates.js";
import { Board, Color, GameSnapshot } from "./types.js";

export class Game {
  private board: Board = new Map();
  private generation = 0;
  private revision = 0;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  tick(): void {
    this.board = stepBoard(this.board, this.width, this.height);

    this.generation += 1;
    this.revision += 1;
  }

  getSnapshot(): GameSnapshot {
    const cells = Array.from(this.board, ([key, color]) => ({
      ...keyToCoordinates(key, this.width),
      color,
    }));

    return {
      width: this.width,
      height: this.height,
      generation: this.generation,
      revision: this.revision,
      cells,
    };
  }

  placeCell(x: number, y: number, color: Color): boolean {
    const isInvalid =
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height;

    if (isInvalid) {
      return false;
    }

    this.board.set(cellKey(x, y, this.width), color);

    this.revision += 1;

    return true;
  }

  placePattern(
    patternName: PatternName,
    originX: number,
    originY: number,
    color: Color,
  ): boolean {
    const pattern = PATTERNS[patternName];
    const maxOriginX = this.width - pattern.width;
    const maxOriginY = this.height - pattern.height;

    if (
      !Number.isInteger(originX) ||
      !Number.isInteger(originY) ||
      originX < 0 ||
      originY < 0 ||
      originX > maxOriginX ||
      originY > maxOriginY
    ) {
      return false;
    }

    for (const [offsetX, offsetY] of pattern.cells) {
      const key = cellKey(originX + offsetX, originY + offsetY, this.width);
      this.board.set(key, color);
    }

    this.revision += 1;

    return true;
  }
}

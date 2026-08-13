import { useEffect, useRef } from "react";

import type { BoardDescription, LiveCell } from "../types/protocol";

const CELL_SIZE = 12;

interface GameCanvasProps {
  board: BoardDescription;
  cells: LiveCell[];
  disabled: boolean;
}

export const GameCanvas = ({ board, cells, disabled }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const logicalWidth = board.width * CELL_SIZE;

  const logicalHeight = board.height * CELL_SIZE;

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = logicalWidth * pixelRatio;

    canvas.height = logicalHeight * pixelRatio;

    canvas.style.width = `${logicalWidth}px`;

    canvas.style.height = `${logicalHeight}px`;

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    context.fillStyle = "#111827";

    context.fillRect(0, 0, logicalWidth, logicalHeight);

    for (const cell of cells) {
      const [red, green, blue] = cell.color;

      context.fillStyle = `rgb(${red} ${green} ${blue})`;

      context.fillRect(
        cell.x * CELL_SIZE + 1,
        cell.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
      );
    }
  }, [cells, logicalHeight, logicalWidth]);

  return (
    <canvas
      ref={canvasRef}
      className={disabled ? "game-canvas game-canvas--disabled" : "game-canvas"}
      aria-label="Multiplayer Game of Life board"
    />
  );
};

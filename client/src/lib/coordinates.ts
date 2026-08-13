interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const pointerToCell = (
  point: Point,
  rectangle: Rectangle,
  boardWidth: number,
  boardHeight: number,
): Point | null => {
  const relX = (point.x - rectangle.left) / rectangle.width;
  const relY = (point.y - rectangle.top) / rectangle.height;

  const x = Math.floor(relX * boardWidth);
  const y = Math.floor(relY * boardHeight);

  if (x < 0 || x >= boardWidth || y < 0 || y >= boardHeight) {
    return null;
  }

  return { x, y };
};

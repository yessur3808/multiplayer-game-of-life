export const cellKey = (x: number, y: number, width: number): number => {
  return y * width + x;
};

export const keyToCoordinates = (
  key: number,
  width: number,
): { x: number; y: number } => {
  return {
    x: key % width,
    y: Math.floor(key / width),
  };
};
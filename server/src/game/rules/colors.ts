import type { Color } from "../model/index.js";

export const averageColors = (colors: readonly Color[]): Color => {
  if (colors.length === 0) {
    throw new Error("Cannot average an empty color collection");
  }

  const totals = colors.reduce<Color>(
    (sum, color) => [sum[0] + color[0], sum[1] + color[1], sum[2] + color[2]],
    [0, 0, 0],
  );

  return [
    Math.round(totals[0] / colors.length),
    Math.round(totals[1] / colors.length),
    Math.round(totals[2] / colors.length),
  ];
};

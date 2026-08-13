import type { Color } from "./types.js";

const hslToRgb = (
  hue: number,
  saturation: number,
  lightness: number,
): Color => {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const normalizedHue = ((hue % 360) + 360) % 360;
  const hueSection = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSection < 1) {
    [red, green] = [chroma, secondary];
  } else if (hueSection < 2) {
    [red, green] = [secondary, chroma];
  } else if (hueSection < 3) {
    [green, blue] = [chroma, secondary];
  } else if (hueSection < 4) {
    [green, blue] = [secondary, chroma];
  } else if (hueSection < 5) {
    [red, blue] = [secondary, chroma];
  } else {
    [red, blue] = [chroma, secondary];
  }

  const lightnessOffset = lightness - chroma / 2;

  return [red, green, blue].map((channel) =>
    Math.round((channel + lightnessOffset) * 255),
  ) as Color;
};

export const createPlayerColor = (
  random: () => number = Math.random,
): Color => {
  const hue = Math.floor(random() * 360);
  const saturation = 0.75;
  const lightness = 0.55;

  return hslToRgb(hue, saturation, lightness);
};

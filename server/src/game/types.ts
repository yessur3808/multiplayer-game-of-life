export type Color = [red: number, green: number, blue: number];

export interface LiveCell {
  x: number;
  y: number;
  color: Color;
}

export type Board = Map<number, Color>;

export type Color = [red: number, green: number, blue: number];

export interface LiveCell {
  x: number;
  y: number;
  color: Color;
}

export interface GameSnapshot {
  width: number;
  height: number;
  generation: number;
  revision: number;
  cells: LiveCell[];
}

export type Board = Map<number, Color>;

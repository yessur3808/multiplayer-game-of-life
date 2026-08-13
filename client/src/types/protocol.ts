export type Color = [red: number, green: number, blue: number];

export interface LiveCell {
  x: number;
  y: number;
  color: Color;
}

export interface BoardDescription {
  width: number;
  height: number;
}

export type PatternName = "block" | "blinker" | "glider" | "beacon";

export interface PlaceCellMessage {
  type: "place_cell";
  x: number;
  y: number;
}

export interface PlacePatternMessage {
  type: "place_pattern";
  pattern: PatternName;
}

export type ClientMessage = PlaceCellMessage | PlacePatternMessage;

export interface WelcomeMessage {
  type: "welcome";
  playerColor: Color;
  board: BoardDescription;
}

export interface SnapshotMessage {
  type: "snapshot";
  generation: number;
  revision: number;
  cells: LiveCell[];
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export type ServerMessage = WelcomeMessage | SnapshotMessage | ErrorMessage;

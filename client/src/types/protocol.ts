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

export type PatternName =
  | "block"
  | "blinker"
  | "glider"
  | "beacon"
  | "lightweight_spaceship";

export interface PlaceCellMessage {
  type: "place_cell";
  x: number;
  y: number;
}

export interface PlacePatternMessage {
  type: "place_pattern";
  pattern: PatternName;
}

export interface SetRunningMessage {
  type: "set_running";
  running: boolean;
}

export type ClientMessage =
  | PlaceCellMessage
  | PlacePatternMessage
  | SetRunningMessage;

export interface WelcomeMessage {
  type: "welcome";
  playerColor: Color;
  board: BoardDescription;
}

export interface SnapshotMessage {
  type: "snapshot";
  generation: number;
  revision: number;
  running: boolean;
  cells: LiveCell[];
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export type ServerMessage = WelcomeMessage | SnapshotMessage | ErrorMessage;

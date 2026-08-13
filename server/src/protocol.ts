import { z } from "zod";
import { Color, LiveCell } from "./game/types.js";

const placeCellSchema = z
  .object({
    type: z.literal("place_cell"),
    x: z.number().int(),
    y: z.number().int(),
  })
  .strict();

const patternNameSchema = z.enum(["block", "blinker", "glider", "beacon"]);

const placePatternSchema = z
  .object({
    type: z.literal("place_pattern"),
    pattern: patternNameSchema,
  })
  .strict();

export const clientMsgSchema = z.discriminatedUnion("type", [
  placeCellSchema,
  placePatternSchema,
]);

export type ClientMessage = z.infer<typeof clientMsgSchema>;

export interface WelcomeMessage {
  type: "welcome";
  playerColor: Color;
  board: {
    width: number;
    height: number;
  };
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

export const clientIdSchema = z
  .string()
  .uuid()
  .max(64);
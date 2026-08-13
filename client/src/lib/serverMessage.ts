import type {
  BoardDescription,
  Color,
  LiveCell,
  ServerMessage,
} from "../types/protocol";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isInteger(value) && isFiniteNumber(value) && value >= 0;

const isColor = (value: unknown): value is Color =>
  Array.isArray(value) &&
  value.length === 3 &&
  value.every(
    (channel) =>
      Number.isInteger(channel) &&
      isFiniteNumber(channel) &&
      channel >= 0 &&
      channel <= 255,
  );

const isBoardDescription = (value: unknown): value is BoardDescription =>
  isRecord(value) &&
  isNonNegativeInteger(value.width) &&
  isNonNegativeInteger(value.height);

const isLiveCell = (value: unknown): value is LiveCell =>
  isRecord(value) &&
  isNonNegativeInteger(value.x) &&
  isNonNegativeInteger(value.y) &&
  isColor(value.color);

const isServerMessage = (value: unknown): value is ServerMessage => {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "welcome") {
    return isColor(value.playerColor) && isBoardDescription(value.board);
  }

  if (value.type === "snapshot") {
    return (
      isNonNegativeInteger(value.generation) &&
      isNonNegativeInteger(value.revision) &&
      typeof value.running === "boolean" &&
      Array.isArray(value.cells) &&
      value.cells.every(isLiveCell)
    );
  }

  if (value.type === "error") {
    return typeof value.code === "string" && typeof value.message === "string";
  }

  return false;
};

export const parseServerMessage = (rawValue: string): ServerMessage | null => {
  try {
    const candidate: unknown = JSON.parse(rawValue);

    return isServerMessage(candidate) ? candidate : null;
  } catch {
    return null;
  }
};

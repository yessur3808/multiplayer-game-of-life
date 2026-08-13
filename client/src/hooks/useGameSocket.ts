import { useCallback, useEffect, useRef, useState } from "react";

import { getClientId } from "../lib/clientId";
import { createGameSocketUrl } from "../lib/gameSocketUrl";
import {
  calculateReconnectDelay,
  MAX_RECONNECT_ATTEMPTS,
} from "../lib/reconnect";
import { parseServerMessage } from "../lib/serverMessage";
import type {
  BoardDescription,
  ClientMessage,
  Color,
  PatternName,
  SnapshotMessage,
} from "../types/protocol";

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface GameConnection {
  status: ConnectionStatus;
  board: BoardDescription | null;
  snapshot: SnapshotMessage | null;
  playerColor: Color | null;
  running: boolean;
  error: string | null;

  placeCell(x: number, y: number): boolean;
  placePattern(pattern: PatternName, x: number, y: number): boolean;
  setRunning(running: boolean): boolean;
}

export const useGameSocket = (): GameConnection => {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [board, setBoard] = useState<BoardDescription | null>(null);
  const [snapshot, setSnapshot] = useState<SnapshotMessage | null>(null);
  const [playerColor, setPlayerColor] = useState<Color | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const socketCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const clientId = getClientId();
    let isDisposed = false;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = (): void => {
      if (isDisposed) {
        return;
      }

      const socket = new WebSocket(createGameSocketUrl(clientId));
      socketRef.current = socket;

      const isCurrentSocket = (): boolean =>
        !isDisposed && socketRef.current === socket;

      const handleOpen = (): void => {
        if (!isCurrentSocket()) {
          return;
        }

        reconnectAttempt = 0;
        setStatus("connected");
        setError(null);
      };

      const handleMessage = (event: MessageEvent): void => {
        if (!isCurrentSocket() || typeof event.data !== "string") {
          return;
        }

        const message = parseServerMessage(event.data);

        if (!message) {
          setError("Received an invalid server message.");
          return;
        }

        if (message.type === "welcome") {
          setPlayerColor(message.playerColor);
          setBoard(message.board);
          return;
        }

        if (message.type === "snapshot") {
          setSnapshot((currentSnapshot) => {
            if (
              currentSnapshot &&
              message.revision < currentSnapshot.revision
            ) {
              return currentSnapshot;
            }

            return message;
          });
          return;
        }

        setError(message.message);
      };

      const removeEventListeners = (): void => {
        socket.removeEventListener("open", handleOpen);
        socket.removeEventListener("message", handleMessage);
        socket.removeEventListener("close", handleClose);
        socket.removeEventListener("error", handleError);
      };

      const cleanupSocket = (): void => {
        removeEventListeners();

        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        socket.close();
      };

      const handleClose = (): void => {
        if (!isCurrentSocket()) {
          return;
        }

        removeEventListeners();
        socketRef.current = null;

        if (socketCleanupRef.current === cleanupSocket) {
          socketCleanupRef.current = null;
        }

        if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setStatus("disconnected");
          setError("Unable to reconnect to the game server.");
          return;
        }

        const delay = calculateReconnectDelay(reconnectAttempt);
        reconnectAttempt += 1;
        setStatus("reconnecting");
        setError("Connection lost. Reconnecting...");
        reconnectTimer = setTimeout(() => {
          reconnectTimer = undefined;
          connect();
        }, delay);
      };

      const handleError = (): void => {
        if (isCurrentSocket()) {
          setError("WebSocket connection failed.");
        }
      };

      socket.addEventListener("open", handleOpen);
      socket.addEventListener("message", handleMessage);
      socket.addEventListener("close", handleClose);
      socket.addEventListener("error", handleError);
      socketCleanupRef.current = cleanupSocket;
    };

    connect();

    return () => {
      isDisposed = true;

      if (reconnectTimer !== undefined) {
        clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }

      const cleanupSocket = socketCleanupRef.current;
      socketCleanupRef.current = null;
      cleanupSocket?.();
    };
  }, []);

  const sendMessage = useCallback((message: ClientMessage): boolean => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    socket.send(JSON.stringify(message));
    return true;
  }, []);

  const placeCell = useCallback(
    (x: number, y: number): boolean =>
      sendMessage({
        type: "place_cell",
        x,
        y,
      }),
    [sendMessage],
  );

  const placePattern = useCallback(
    (pattern: PatternName, x: number, y: number): boolean =>
      sendMessage({
        type: "place_pattern",
        pattern,
        x,
        y,
      }),
    [sendMessage],
  );

  const setRunning = useCallback(
    (running: boolean): boolean =>
      sendMessage({
        type: "set_running",
        running,
      }),
    [sendMessage],
  );

  return {
    status,
    board,
    snapshot,
    playerColor,
    running: snapshot?.running ?? true,
    error,
    placeCell,
    placePattern,
    setRunning,
  };
};

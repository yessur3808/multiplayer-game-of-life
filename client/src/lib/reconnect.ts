const BASE_RECONNECT_DELAY_MS = 500;
const MAX_RECONNECT_DELAY_MS = 5_000;

export const MAX_RECONNECT_ATTEMPTS = 5;

export const calculateReconnectDelay = (attempt: number): number => {
  const normalizedAttempt = Math.max(0, Math.floor(attempt));

  return Math.min(
    BASE_RECONNECT_DELAY_MS * 2 ** normalizedAttempt,
    MAX_RECONNECT_DELAY_MS,
  );
};

const STORAGE_KEY = "multiplayer-life-client-id";

export const getClientId = (): string => {
  const existingClientId = window.localStorage.getItem(STORAGE_KEY);

  if (existingClientId) {
    return existingClientId;
  }

  const clientId = crypto.randomUUID();

  window.localStorage.setItem(STORAGE_KEY, clientId);

  return clientId;
};

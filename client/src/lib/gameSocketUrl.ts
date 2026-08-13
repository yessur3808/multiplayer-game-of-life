export const createGameSocketUrl = (clientId: string): string => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = new URL(`${protocol}//${window.location.host}/ws`);

  url.searchParams.set("clientId", clientId);

  return url.toString();
};

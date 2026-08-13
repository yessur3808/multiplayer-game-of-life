import { useEffect, useState } from "react";

import { getClientId } from "./lib/clientId";

export const App = () => {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = new URL(`${protocol}//${window.location.host}/ws`);
    url.searchParams.set("clientId", getClientId());
    const socket = new WebSocket(url);

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "hello",
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      setMessage(event.data);
    });

    return () => {
      socket.close();
    };
  }, []);

  return <main>{message}</main>;
};

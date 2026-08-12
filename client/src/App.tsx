import { useEffect, useState } from "react";

export const App = () => {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

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

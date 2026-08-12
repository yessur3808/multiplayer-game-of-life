import { useEffect, useState } from "react";

export const App = () => {
  const [message, setMessage] = useState("Connecting...");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000/ws");

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

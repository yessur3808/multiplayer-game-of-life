import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const server = createServer();

const webSocketServer = new WebSocketServer({
  server,
  path: "/ws",
});

webSocketServer.on("connection", (socket) => {
  console.log("Browser connected");

  socket.send(
    JSON.stringify({
      type: "welcome",
      message: "Connected to the game server",
    }),
  );

  socket.on("message", (data) => {
    console.log("Received:", data.toString());
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

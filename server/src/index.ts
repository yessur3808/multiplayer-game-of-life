import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

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

server.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});

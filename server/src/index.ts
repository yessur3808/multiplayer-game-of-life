import { createServer } from "node:http";

const server = createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, {
      "content-type": "application/json",
    });

    response.end(
      JSON.stringify({
        status: "ok",
      }),
    );

    return;
  }

  response.writeHead(404);
  response.end("Not found");
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});

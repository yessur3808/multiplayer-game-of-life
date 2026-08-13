import { createGameServer } from "./app.js";

const readPositiveInteger = (name: string, defaultValue: number): number => {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
};

const host = process.env.HOST ?? "0.0.0.0";
const port = readPositiveInteger("PORT", 3000);
const width = readPositiveInteger("BOARD_WIDTH", 80);
const height = readPositiveInteger("BOARD_HEIGHT", 50);
const simulationIntervalMs = readPositiveInteger(
  "SIMULATION_INTERVAL_MS",
  1000,
);

const app = createGameServer({ width, height, simulationIntervalMs });

await new Promise<void>((resolve, reject) => {
  app.server.once("error", reject);
  app.server.listen(port, host, () => {
    app.server.off("error", reject);
    console.log(`Server listening on http://${host}:${port}`);
    resolve();
  });
});

let shuttingDown = false;

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`Received ${signal}, shutting down`);

  try {
    await app.close();
    process.exitCode = 0;
  } catch (error) {
    console.error("Failed to shut down cleanly", error);
    process.exitCode = 1;
  }
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

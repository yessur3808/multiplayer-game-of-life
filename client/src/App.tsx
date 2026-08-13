import { useGameSocket } from "./hooks/useGameSocket";
import { GameCanvas } from "./components/GameCanvas";

export const App = () => {
  const { status, error, board, snapshot } = useGameSocket();

  return (
    <main>
      <p>Connection: {status}</p>
      {error && <p role="alert">{error}</p>}
      {snapshot && <pre>{JSON.stringify(snapshot, null, 2)}</pre>}

      {board && snapshot && (
        <GameCanvas
          board={board}
          cells={snapshot.cells}
          disabled={status !== "connected"}
        />
      )}
    </main>
  );
};

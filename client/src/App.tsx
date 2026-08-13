import { useGameSocket } from "./hooks/useGameSocket";
import { GameCanvas } from "./components/GameCanvas";
import { GameToolbar } from "./components/GameToolbar";
import { StatusBar } from "./components/StatusBar";

export const App = () => {
  const {
    status,
    error,
    board,
    snapshot,
    playerColor,
    running,
    placeCell,
    placePattern,
    setRunning,
  } = useGameSocket();

  return (
    <main>
      <h2
        style={{
          position: "relative",
          marginTop: "12px",
          paddingBottom: "12px",
          textAlign: "center",
        }}
      >
        Multiplayer Conway's Game of Life
      </h2>

      <StatusBar
        status={status}
        generation={snapshot?.generation ?? 0}
        liveCellCount={snapshot?.cells.length ?? 0}
        error={error}
      />

      <GameToolbar
        disabled={status !== "connected"}
        playerColor={playerColor}
        running={running}
        onPlacePattern={placePattern}
        onToggleRunning={() => setRunning(!running)}
      />

      {board && snapshot && (
        <div className="game-board-container">
          <GameCanvas
            board={board}
            cells={snapshot.cells}
            disabled={status !== "connected"}
            onCellClick={placeCell}
          />
          {status !== "connected" && (
            <div className="connection-overlay">
              {status === "reconnecting"
                ? "Reconnecting…"
                : "Board unavailable"}
            </div>
          )}
        </div>
      )}
    </main>
  );
};

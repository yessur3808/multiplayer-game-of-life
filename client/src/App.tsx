import { useState } from "react";

import { useGameSocket } from "./hooks/useGameSocket";
import { GameCanvas } from "./components/GameCanvas";
import { GameToolbar } from "./components/GameToolbar";
import { StatusBar } from "./components/StatusBar";
import type { PatternName } from "./types/protocol";

export const App = () => {
  const [selectedPattern, setSelectedPattern] = useState<PatternName | null>(
    null,
  );
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

  const handleBoardClick = (x: number, y: number): void => {
    if (selectedPattern) {
      placePattern(selectedPattern, x, y);
      return;
    }

    placeCell(x, y);
  };

  return (
    <main>
      <StatusBar
        status={status}
        generation={snapshot?.generation ?? 0}
        liveCellCount={snapshot?.cells.length ?? 0}
        error={error}
      />

      <GameToolbar
        disabled={status !== "connected"}
        playerColor={playerColor}
        selectedPattern={selectedPattern}
        running={running}
        onSelectPattern={(pattern) => {
          setSelectedPattern((currentPattern) =>
            currentPattern === pattern ? null : pattern,
          );
        }}
        onToggleRunning={() => setRunning(!running)}
      />

      {board && snapshot && (
        <div className="game-board-container">
          <GameCanvas
            board={board}
            cells={snapshot.cells}
            disabled={status !== "connected"}
            onCellClick={handleBoardClick}
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

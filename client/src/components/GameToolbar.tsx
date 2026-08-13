import type { Color, PatternName } from "../types/protocol";

interface GameToolbarProps {
  disabled: boolean;
  playerColor: Color | null;
  selectedPattern: PatternName | null;
  running: boolean;
  onSelectPattern(pattern: PatternName): void;
  onToggleRunning(): void;
}

const PATTERN_BUTTONS: Array<{
  name: PatternName;
  label: string;
}> = [
  {
    name: "block",
    label: "Block",
  },
  {
    name: "blinker",
    label: "Blinker",
  },
  {
    name: "glider",
    label: "Glider",
  },
  {
    name: "beacon",
    label: "Beacon",
  },
];

export const GameToolbar = ({
  disabled,
  playerColor,
  selectedPattern,
  running,
  onSelectPattern,
  onToggleRunning,
}: GameToolbarProps) => {
  const playerColorValue =
    playerColor === null
      ? "transparent"
      : `rgb(${playerColor[0]} ${playerColor[1]} ${playerColor[2]})`;

  return (
    <section className="toolbar" aria-label="Game controls">
      <div className="player-color">
        <span
          className="player-color__swatch"
          style={{
            backgroundColor: playerColorValue,
          }}
          aria-hidden="true"
        />

        <span
          style={{
            color: "#aaa",
          }}
        >
          Your cell color
        </span>
      </div>

      <button
        type="button"
        className="toolbar-play-button"
        disabled={disabled}
        onClick={onToggleRunning}
        aria-label={running ? "Pause simulation" : "Play simulation"}
      >
        <span className="toolbar-play-button__icon" aria-hidden="true">
          {running ? "II" : ">"}
        </span>
        {running ? "Pause" : "Play"}
      </button>

      <div className="toolbar-patterns">
        {PATTERN_BUTTONS.map((pattern) => {
          const isSelected = selectedPattern === pattern.name;

          return (
            <button
              key={pattern.name}
              type="button"
              className={`toolbar-pattern-button${isSelected ? " toolbar-pattern-button--selected" : ""}`}
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => {
                onSelectPattern(pattern.name);
              }}
              title={`Select ${pattern.label}, then click the board to place it`}
            >
              {pattern.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

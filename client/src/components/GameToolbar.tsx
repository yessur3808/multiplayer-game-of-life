import type { Color, PatternName } from "../types/protocol";

interface GameToolbarProps {
  disabled: boolean;
  playerColor: Color | null;
  running: boolean;
  onPlacePattern(pattern: PatternName): void;
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
  {
    name: "lightweight_spaceship",
    label: "Lightweight Spaceship",
  },
];

export const GameToolbar = ({
  disabled,
  playerColor,
  running,
  onPlacePattern,
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
          return (
            <button
              key={pattern.name}
              type="button"
              className="toolbar-pattern-button"
              disabled={disabled}
              onClick={() => {
                onPlacePattern(pattern.name);
              }}
              title={`Place ${pattern.label} at a random location`}
            >
              {pattern.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

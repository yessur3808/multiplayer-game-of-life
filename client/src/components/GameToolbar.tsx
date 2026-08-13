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
  shortLabel?: string;
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
    shortLabel: "Spaceship",
  },
];

const PlayIcon = ({ running }: { running: boolean }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    {running ? (
      <>
        <rect x="5.5" y="4.5" width="3" height="11" rx="1" />
        <rect x="11.5" y="4.5" width="3" height="11" rx="1" />
      </>
    ) : (
      <path d="M6.5 4.65a1 1 0 0 1 1.53-.85l8 5.35a1 1 0 0 1 0 1.7l-8 5.35a1 1 0 0 1-1.53-.85V4.65Z" />
    )}
  </svg>
);

const AddIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 3.25v9.5M3.25 8h9.5" />
  </svg>
);

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
        <span className="player-color__copy">
          <span className="toolbar__eyebrow">Player</span>
          <span className="player-color__label">
            <span
              className="player-color__swatch"
              style={{ backgroundColor: playerColorValue }}
              aria-hidden="true"
            />
            Your color
          </span>
        </span>
      </div>

      <div className="toolbar__divider" aria-hidden="true" />

      <div className="toolbar-simulation">
        <span className="toolbar__eyebrow">Simulation</span>
        <button
          type="button"
          className={`toolbar-play-button${running ? " toolbar-play-button--running" : ""}`}
          disabled={disabled}
          onClick={onToggleRunning}
          aria-label={running ? "Pause simulation" : "Play simulation"}
        >
          <span className="toolbar-play-button__icon">
            <PlayIcon running={running} />
          </span>
          {running ? "Pause" : "Start"}
          <span className="toolbar-play-button__status" aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar-pattern-group">
        <div className="toolbar-pattern-group__heading">
          <span className="toolbar__eyebrow">Patterns</span>
          <span className="toolbar-pattern-group__hint">Random position</span>
        </div>
        <div className="toolbar-patterns">
          {PATTERN_BUTTONS.map((pattern) => (
            <button
              key={pattern.name}
              type="button"
              className="toolbar-pattern-button"
              disabled={disabled}
              onClick={() => {
                onPlacePattern(pattern.name);
              }}
              title={`Place ${pattern.label} at a random location`}
              aria-label={pattern.label}
            >
              <span className="toolbar-pattern-button__icon">
                <AddIcon />
              </span>
              <span>{pattern.shortLabel ?? pattern.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

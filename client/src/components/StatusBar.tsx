import type { ConnectionStatus } from "../hooks/useGameSocket";

interface StatusBarProps {
  status: ConnectionStatus;
  generation: number;
  liveCellCount: number;
  error: string | null;
}

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  connecting: "Connecting",
  connected: "Connected",
  reconnecting: "Reconnecting",
  disconnected: "Unable to connect",
};

export const StatusBar = ({
  status,
  generation,
  liveCellCount,
  error,
}: StatusBarProps) => {
  return (
    <section className={`status-bar status-bar--${status}`} aria-live="polite">
      <div className="status-bar__connection">
        <span className="status-bar__indicator" aria-hidden="true" />
        <strong>{STATUS_LABELS[status]}</strong>
      </div>

      <div className="status-bar__metrics">
        <span>
          Generation <strong>{generation}</strong>
        </span>
        <span className="status-bar__divider" aria-hidden="true" />
        <span>
          Live cells <strong>{liveCellCount}</strong>
        </span>
      </div>

      {error && (
        <div className="status-bar__error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
};

import { useGameSocket } from "./hooks/useGameSocket";

export const App = () => {
  const { status, error, snapshot } = useGameSocket();

  return (
    <main>
      <p>Connection: {status}</p>
      {error && <p role="alert">{error}</p>}
      {snapshot && <pre>{JSON.stringify(snapshot, null, 2)}</pre>}
    </main>
  );
};

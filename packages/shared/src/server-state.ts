/**
 * Canonical server lifecycle states (PLANNING.md → Server lifecycle & state machine).
 * The DB persists `state`; the only way it changes is via an allowed transition,
 * and every transition writes an EventLog entry.
 */
export enum ServerState {
  Installing = "Installing",
  Stopped = "Stopped",
  Starting = "Starting",
  Running = "Running",
  Stopping = "Stopping",
  Updating = "Updating",
  Crashed = "Crashed",
}

/** Allowed transitions. Anything not listed here is rejected by the state machine. */
export const ALLOWED_TRANSITIONS: Record<ServerState, ServerState[]> = {
  [ServerState.Stopped]: [ServerState.Starting, ServerState.Updating, ServerState.Installing],
  [ServerState.Installing]: [ServerState.Stopped, ServerState.Crashed],
  [ServerState.Updating]: [ServerState.Stopped, ServerState.Crashed],
  [ServerState.Starting]: [ServerState.Running, ServerState.Stopping, ServerState.Crashed],
  [ServerState.Running]: [ServerState.Stopping, ServerState.Crashed],
  [ServerState.Stopping]: [ServerState.Stopped, ServerState.Crashed],
  [ServerState.Crashed]: [ServerState.Starting, ServerState.Stopped, ServerState.Updating],
};

export function canTransition(from: ServerState, to: ServerState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/** States in which the underlying container is expected to exist/run. */
export const LIVE_STATES: ServerState[] = [
  ServerState.Starting,
  ServerState.Running,
  ServerState.Stopping,
];

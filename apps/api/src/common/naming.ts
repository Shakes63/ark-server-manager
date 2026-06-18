/** Shared Docker network the manager and all game containers join (for RCON). */
export const ARK_NETWORK = "ark-net";

/** Deterministic container name; also the RCON host on the shared network. */
export function containerName(serverId: string): string {
  return `ark-${serverId}`;
}

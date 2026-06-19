/** Shared Docker network the manager and all game containers join (for RCON). */
export const ARK_NETWORK = "ark-net";

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "server";
}

/**
 * Docker container name. Given the server name it's human-readable (so it's
 * recognizable on the Unraid Docker dashboard), suffixed with a slice of the id to
 * keep it unique across same-named servers; without a name it falls back to the
 * stable id form. Containers are always matched by the `ark.serverId` label, so the
 * name is purely cosmetic and may change freely. Also the RCON host on the bridge.
 */
export function containerName(serverId: string, name?: string): string {
  return name ? `ark-${slug(name)}-${serverId.slice(-6)}` : `ark-${serverId}`;
}

import { Game } from "@ark/shared";

/**
 * Game-server images. Both are proven, env-var-driven images that install the
 * game files + mods themselves on first boot and read our injected INIs — the
 * manager orchestrates them via env vars + config injection rather than passing
 * a launch command (validated on a real Unraid host, PLANNING.md).
 * - ASA: the POK image (acekorneya/asa_server) — SteamCMD + Proton internally.
 * - ASE: hermsi/ark-server (arkmanager-based) — native Linux ShooterGameServer.
 */
export const IMAGES: Record<Game, string> = {
  [Game.ASA]: "acekorneya/asa_server:2_1_latest",
  [Game.ASE]: "hermsi/ark-server:latest",
};

/** POK keeps all instance data (install + saves + config) under this path. */
export const POK_DATA_DIR = "/home/pok/arkserver";

/** hermsi's ARK_SERVER_VOLUME — game files install under <vol>/server. */
export const HERMSI_VOLUME = "/app";

/**
 * The uid/gid each image runs the server as. Neither chowns its mounts fully
 * (POK never does; hermsi only chowns the volume root), so the manager makes the
 * dirs/files it injects (config INIs, cluster transfer dir) writable by these.
 */
export const SERVER_UID: Record<Game, number> = {
  [Game.ASA]: 7777, // POK's fixed "pok" user (also in group 100/users)
  [Game.ASE]: 1000, // hermsi's "steam" user
};
export const SERVER_GID: Record<Game, number> = {
  [Game.ASA]: 7777,
  [Game.ASE]: 1000,
};

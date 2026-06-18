import {
  Game,
  SettingTarget,
  type PortSet,
  type ServerConfigValues,
  type SettingsCatalog,
} from "@ark/shared";

export interface ClusterRef {
  clusterId: string;
  transferDir: string; // path inside the container
}

export interface LaunchSpec {
  game: Game;
  map: string;
  sessionName: string;
  ports: PortSet;
  maxPlayers: number;
  adminPassword: string;
  serverPassword?: string | null;
  spectatorPassword?: string | null;
  modIds?: number[];
  cluster?: ClusterRef | null;
  catalog: SettingsCatalog;
  config: ServerConfigValues;
}

export interface BuiltLaunch {
  /** The "Map?opt=val?..." URL passed as the first argument. */
  mapUrl: string;
  /** Dashed flags/args after the map URL. */
  flags: string[];
  /** Full argv (mapUrl + flags), ready for the container entrypoint. */
  argv: string[];
}

/**
 * Assemble the ARK launch command (PLANNING.md → manager↔container contract).
 * RCON + admin password are injected automatically so the in-app console works.
 * First-class fields live here; everything catalog-driven is folded in by target.
 */
export function buildLaunchArgs(spec: LaunchSpec): BuiltLaunch {
  const opts: string[] = ["listen"];
  const push = (k: string, v: string | number) => opts.push(`${k}=${v}`);

  push("SessionName", spec.sessionName);
  push("Port", spec.ports.game);
  push("QueryPort", spec.ports.query);
  push("RCONEnabled", "True");
  push("RCONPort", spec.ports.rcon);
  push("ServerAdminPassword", spec.adminPassword);
  push("MaxPlayers", spec.maxPlayers);
  if (spec.serverPassword) push("ServerPassword", spec.serverPassword);
  if (spec.spectatorPassword) push("SpectatorPassword", spec.spectatorPassword);

  // Catalog-driven ?Key=Value options
  for (const def of spec.catalog.settings) {
    if (def.target !== SettingTarget.CommandLineOption) continue;
    const value = spec.config.values[def.key] ?? def.default;
    push(def.emitAs ?? def.key, def.type === "bool" ? (value ? "True" : "False") : String(value));
  }

  const mapUrl = `${spec.map}?${opts.join("?")}`;

  const flags: string[] = [];

  if (spec.modIds && spec.modIds.length > 0) {
    flags.push(`-mods=${spec.modIds.join(",")}`);
  }

  // Catalog-driven -flags (only when enabled)
  for (const def of spec.catalog.settings) {
    if (def.target !== SettingTarget.CommandLineFlag) continue;
    const value = spec.config.values[def.key] ?? def.default;
    if (value) flags.push(`-${def.emitAs ?? def.key}`);
  }

  // Catalog-driven -Key=Value options (skipped when empty / "None"/"Default").
  // Multiselect values are arrays joined with the setting's `joinWith` token.
  for (const def of spec.catalog.settings) {
    if (def.target !== SettingTarget.CommandLineDashOption) continue;
    const raw = spec.config.values[def.key] ?? def.default;
    const value = Array.isArray(raw)
      ? raw.join(def.joinWith ?? ",")
      : String(raw ?? "").trim();
    if (value && !["none", "default"].includes(value.toLowerCase())) {
      flags.push(`-${def.emitAs ?? def.key}=${value}`);
    }
  }

  // ASA needs an explicit player cap on the command line.
  if (spec.game === Game.ASA) flags.push(`-WinLiveMaxPlayers=${spec.maxPlayers}`);

  if (spec.cluster) {
    flags.push(`-clusterid=${spec.cluster.clusterId}`);
    flags.push(`-ClusterDirOverride=${spec.cluster.transferDir}`);
    flags.push("-NoTransferFromFiltering");
  }

  const rawArgs = (spec.config.rawCommandLineArgs ?? "").trim();
  if (rawArgs) flags.push(...rawArgs.split(/\s+/));

  return { mapUrl, flags, argv: [mapUrl, ...flags] };
}

/**
 * The "extra" launch args for POK's CUSTOM_SERVER_ARGS: catalog command-line
 * flags (except NoBattlEye — POK sets that via the BATTLEEYE env var), -Key=Value
 * dash options, and the user's raw args. POK builds the rest (map/ports/RCON/
 * admin password/max players/mods/cluster) itself from its own env vars.
 */
export function buildCustomArgs(catalog: SettingsCatalog, config: ServerConfigValues): string {
  const args: string[] = [];
  for (const def of catalog.settings) {
    if (def.target === SettingTarget.CommandLineFlag) {
      if ((def.emitAs ?? def.key) === "NoBattlEye") continue;
      if (config.values[def.key] ?? def.default) args.push(`-${def.emitAs ?? def.key}`);
    } else if (def.target === SettingTarget.CommandLineDashOption) {
      const raw = config.values[def.key] ?? def.default;
      const value = Array.isArray(raw) ? raw.join(def.joinWith ?? ",") : String(raw ?? "").trim();
      if (value && !["none", "default"].includes(value.toLowerCase())) {
        args.push(`-${def.emitAs ?? def.key}=${value}`);
      }
    }
  }
  const rawArgs = (config.rawCommandLineArgs ?? "").trim();
  if (rawArgs) args.push(rawArgs);
  return args.join(" ");
}

/** Whether the catalog's "disable BattlEye" flag is set (POK BATTLEEYE env). */
export function isBattlEyeDisabled(config: ServerConfigValues): boolean {
  return Boolean(config.values["DisableBattlEye"]);
}

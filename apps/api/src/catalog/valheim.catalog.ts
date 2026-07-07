import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Valheim catalog. The lloesche/valheim-server image is env-driven — it writes the
 * server's launch args from env vars, so every setting targets `Env` and the runtime
 * spec passes it through (key = env var name). First-class fields the orchestrator
 * owns (server name, join password, ports) are NOT here. Valheim has no RCON.
 * Booleans emit as true/false (the image's format).
 */
function vset(
  key: string,
  label: string,
  category: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return { key, label, category, target: SettingTarget.Env, type, default: def, emitAs: key, ...extra };
}

const settings: SettingDef[] = [
  // ── World ────────────────────────────────────────────────────────────────────
  vset("WORLD_NAME", "World name", "World", "string", "Dedicated", {
    help: "The world's save-file name. A new world is generated on first start; keep this stable to keep the same world.",
  }),

  // ── Server ───────────────────────────────────────────────────────────────────
  vset("SERVER_PUBLIC", "List in the public server browser", "Server", "bool", true, {
    help: "Advertise the server so it shows in Valheim's community browser. Off = join by IP / friends only.",
  }),
  vset("CROSSPLAY", "Crossplay (non-Steam clients)", "Server", "bool", false, {
    help: "Allow Xbox / Microsoft Store players to join (uses the PlayFab backend on the extra port).",
  }),
  vset("BEPINEX", "Enable BepInEx (mods)", "Server", "bool", false, {
    help: "Install the BepInEx mod framework. Every player also needs the same mods. Mutually exclusive with ValheimPlus.",
  }),
  vset("VALHEIM_PLUS", "Enable ValheimPlus (mod)", "Server", "bool", false, {
    help: "Install the ValheimPlus mod. Every player also needs it. Mutually exclusive with BepInEx.",
  }),
];

export const VALHEIM_CATALOG: SettingsCatalog = { game: Game.VALHEIM, version: "1", settings };

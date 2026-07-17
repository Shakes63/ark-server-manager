import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Valheim catalog. The lloesche/valheim-server image is env-driven for the core
 * settings (server name, world, crossplay, mods), so those target `Env` and the
 * runtime spec passes them through (key = env var name).
 *
 * The "World modifiers" (combat/deathpenalty/resources/raids/portals + a preset and
 * a few global keys) are NOT env vars — Valheim takes them as launch flags
 * (-preset / -modifier / -setkey). Settings in the "World modifiers" category are
 * compiled into the image's SERVER_ARGS by buildValheimSpec (see valheimServerArgs);
 * everything else flows through valheimCatalogEnv. First-class fields the orchestrator
 * owns (server name, join password, ports) are NOT here. Valheim has no RCON.
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

/** The launch-flag "world modifier" category — handled specially (see module doc). */
export const VALHEIM_MODIFIER_CATEGORY = "World modifiers";

const settings: SettingDef[] = [
  // ── Version ──────────────────────────────────────────────────────────────────
  // lloesche PUBLIC_TEST env → the Valheim public-test Steam beta branch.
  vset("PUBLIC_TEST", "Game version", "Version", "enum", "false", {
    choices: [
      { value: "false", label: "Stable (public)" },
      { value: "true", label: "Public-Test (beta)" },
    ],
    help: "Run Valheim's Public Test beta branch instead of the stable release. Changing it re-downloads the game on the next start.",
  }),
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
    help: "Install the BepInEx mod framework (required for the Mods browser). Every player also needs the same mods. Mutually exclusive with ValheimPlus.",
  }),
  vset("VALHEIM_PLUS", "Enable ValheimPlus (mod)", "Server", "bool", false, {
    help: "Install the ValheimPlus mod. Every player also needs it. Mutually exclusive with BepInEx.",
  }),

  // ── World modifiers (compiled into SERVER_ARGS, not env vars) ─────────────────
  vset("PRESET", "Difficulty preset", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "casual", label: "Casual" },
      { value: "easy", label: "Easy" },
      { value: "hard", label: "Hard" },
      { value: "hardcore", label: "Hardcore (permadeath)" },
      { value: "immersive", label: "Immersive" },
      { value: "hammer", label: "Hammer (building)" },
    ],
    help: "A bundle of world modifiers. Individual modifiers below override the preset. Only applied to a NEW world.",
  }),
  vset("MOD_combat", "Combat", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "veryeasy", label: "Very easy" },
      { value: "easy", label: "Easy" },
      { value: "hard", label: "Hard" },
      { value: "veryhard", label: "Very hard" },
    ],
    help: "Enemy health, damage, and spawn rates.",
  }),
  vset("MOD_deathpenalty", "Death penalty", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "casual", label: "Casual (keep everything)" },
      { value: "veryeasy", label: "Very easy" },
      { value: "easy", label: "Easy" },
      { value: "hard", label: "Hard" },
      { value: "hardcore", label: "Hardcore" },
    ],
    help: "How much skill XP you lose on death.",
  }),
  vset("MOD_resources", "Resources", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "muchless", label: "Much less" },
      { value: "less", label: "Less" },
      { value: "more", label: "More" },
      { value: "muchmore", label: "Much more" },
      { value: "most", label: "Most" },
    ],
    help: "How much you gather from trees, rocks, and other resource nodes.",
  }),
  vset("MOD_raids", "Raids", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "none", label: "None" },
      { value: "muchless", label: "Much less" },
      { value: "less", label: "Less" },
      { value: "more", label: "More" },
      { value: "muchmore", label: "Much more" },
    ],
    help: "How frequently enemy raids attack your base.",
  }),
  vset("MOD_portals", "Portals", VALHEIM_MODIFIER_CATEGORY, "enum", "", {
    choices: [
      { value: "", label: "Normal (default)" },
      { value: "casual", label: "Casual (carry anything)" },
      { value: "hard", label: "Hard" },
      { value: "veryhard", label: "Very hard (no portals)" },
    ],
    help: "What items can be transported through portals.",
  }),
  vset("KEY_nobuildcost", "No build cost", VALHEIM_MODIFIER_CATEGORY, "bool", false, {
    help: "Build without spending materials.",
  }),
  vset("KEY_passivemobs", "Passive enemies", VALHEIM_MODIFIER_CATEGORY, "bool", false, {
    help: "Enemies never attack.",
  }),
  vset("KEY_playerevents", "Events regardless of location", VALHEIM_MODIFIER_CATEGORY, "bool", false, {
    help: "Random events can trigger anywhere, not only in explored biomes.",
  }),
  vset("KEY_nomap", "No map", VALHEIM_MODIFIER_CATEGORY, "bool", false, {
    help: "Disable the in-game map and minimap entirely.",
  }),
];

export const VALHEIM_CATALOG: SettingsCatalog = { game: Game.VALHEIM, version: "1", settings };

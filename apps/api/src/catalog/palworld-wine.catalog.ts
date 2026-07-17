import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Palworld (Wine) catalog. The ripps818/jammsen image envsubsts these vars into
 * PalWorldSettings.ini, so every setting targets `Env` (key = the image's env
 * var name). NOTE the names differ from thijsvanloef's native image in places
 * (e.g. BASE_CAMP_WORKER_MAXNUM here vs BASE_CAMP_WORKER_MAX_NUM native), and the
 * image ships lowercase bool defaults — the Wine spec emitter lowercases bools.
 * First-class fields (name, passwords, players, ports, RCON) are handled by the
 * orchestrator and not here.
 */
function pset(
  key: string,
  label: string,
  category: string,
  type: SettingDef["type"],
  def: SettingDef["default"],
  extra: Partial<SettingDef> = {},
): SettingDef {
  return { key, label, category, target: SettingTarget.Env, type, default: def, emitAs: key, ...extra };
}

const x = (help: string): Partial<SettingDef> => ({ min: 0, max: 5, step: 0.1, unit: "×", help });

const settings: SettingDef[] = [
  // ── General ────────────────────────────────────────────────────────────────
  pset("SERVER_DESCRIPTION", "Server description", "General", "string", "", {
    help: "Description shown next to the server in the browser.",
  }),
  pset("DIFFICULTY", "Difficulty preset", "General", "enum", "None", {
    choices: [
      { value: "None", label: "Custom (use settings below)" },
      { value: "Casual", label: "Casual" },
      { value: "Normal", label: "Normal" },
      { value: "Hard", label: "Hard" },
    ],
    help: "A preset difficulty. “Custom” leaves your individual rates below in control.",
  }),
  pset("COMMUNITY_SERVER", "List on the community browser", "General", "bool", true, {
    help: "Advertise the server in the in-game community list.",
  }),
  pset("ALLOW_CLIENT_MOD", "Allow client mods", "General", "bool", true, {
    help: "Let players join with client-side mods.",
  }),

  // ── PvP / combat ─────────────────────────────────────────────────────────────
  pset("IS_PVP", "PvP enabled", "Combat", "bool", false, {
    help: "Allow player-vs-player combat.",
  }),
  pset("ENABLE_PLAYER_TO_PLAYER_DAMAGE", "Player↔player damage", "Combat", "bool", false, {
    help: "Players can damage each other (needs PvP).",
  }),
  pset("ENABLE_FRIENDLY_FIRE", "Friendly fire", "Combat", "bool", false, {
    help: "Damage within a guild/party.",
  }),
  pset("ENABLE_INVADER_ENEMY", "Raid enemies", "Combat", "bool", true, {
    help: "Wild raids can attack bases.",
  }),
  pset("DEATH_PENALTY", "Death penalty", "Combat", "enum", "All", {
    choices: [
      { value: "None", label: "None" },
      { value: "Item", label: "Drop items" },
      { value: "ItemAndEquipment", label: "Items + equipment" },
      { value: "All", label: "Everything (items, equipment, Pals)" },
    ],
    help: "What a player drops on death.",
  }),
  pset("HARDCORE", "Hardcore", "Combat", "bool", false, {
    help: "Permadeath for player characters.",
  }),
  pset("ENABLE_PREDATOR_BOSS_PAL", "Predator (alpha) Pals", "Combat", "bool", true, {
    help: "Spawn rare high-level predator Pals in the world.",
  }),

  // ── Rates ────────────────────────────────────────────────────────────────────
  pset("EXP_RATE", "EXP rate", "Rates", "float", 1, x("Experience multiplier.")),
  pset("PAL_CAPTURE_RATE", "Pal capture rate", "Rates", "float", 1, x("Capture success multiplier.")),
  pset("PAL_SPAWN_NUM_RATE", "Pal spawn rate", "Rates", "float", 1, x("How many Pals spawn in the world.")),
  pset("COLLECTION_DROP_RATE", "Gather drop rate", "Rates", "float", 1, x("Yield from gathering nodes.")),
  pset("ENEMY_DROP_ITEM_RATE", "Enemy drop rate", "Rates", "float", 1, x("Item drops from defeated enemies.")),
  pset("DAYTIME_SPEEDRATE", "Daytime speed", "Rates", "float", 1, x("How fast daytime passes.")),
  pset("NIGHTTIME_SPEEDRATE", "Nighttime speed", "Rates", "float", 1, x("How fast nighttime passes.")),

  // ── Base building / guilds ───────────────────────────────────────────────────
  pset("BASE_CAMP_MAX_NUM", "Max base camps", "Bases", "int", 128, {
    min: 1,
    max: 128,
    step: 1,
    help: "Total base camps allowed on the server.",
  }),
  pset("BASE_CAMP_WORKER_MAXNUM", "Base workers per camp", "Bases", "int", 15, {
    min: 1,
    max: 50,
    step: 1,
    help: "Max Pals assignable to one base camp.",
  }),
  pset("MAX_BUILDING_LIMIT_NUM", "Building limit (0 = none)", "Bases", "int", 0, {
    min: 0,
    max: 100000,
    step: 100,
    help: "Cap on placed structures per base (0 = unlimited).",
  }),
  pset("GUILD_PLAYER_MAX_NUM", "Max guild members", "Guilds", "int", 20, {
    min: 1,
    max: 100,
    step: 1,
    help: "Players per guild.",
  }),

  // ── World / misc ─────────────────────────────────────────────────────────────
  pset("ENABLE_FAST_TRAVEL", "Fast travel", "World", "bool", true, {
    help: "Allow fast travel between statues.",
  }),
  pset("DROP_ITEM_MAX_NUM", "Max dropped items", "World", "int", 3000, {
    min: 100,
    max: 10000,
    step: 100,
    help: "How many dropped items persist in the world.",
  }),
  pset("AUTO_SAVE_SPAN", "Auto-save interval", "World", "float", 30, {
    min: 5,
    max: 120,
    step: 1,
    unit: "s",
    help: "Seconds between world auto-saves.",
  }),
];

export const PALWORLD_WINE_CATALOG: SettingsCatalog = {
  game: Game.PALWORLD_WINE,
  version: "1",
  settings,
};

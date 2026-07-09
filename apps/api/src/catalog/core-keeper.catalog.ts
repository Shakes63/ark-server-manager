import { Game, SettingTarget, type SettingsCatalog, type SettingDef } from "@ark/shared";

/**
 * Core Keeper catalog. The escaping image is env-driven — every setting targets
 * `Env` and buildCoreKeeperSpec passes it through (key = env var name), dropping
 * empty values (notably SEASON, which must be UNSET for real-date seasons).
 *
 * First-class fields the orchestrator owns (world name, slots, world mode via the
 * repurposed map field) are NOT here. Relay mode: no ports, no passwords — the
 * secret Game ID is the join gate.
 */
function ckset(
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
  // ── World ─────────────────────────────────────────────────────────────────────
  ckset("WORLD_SEED", "World seed", "World", "string", "", {
    help: "Seed for a NEW world. Empty = random. Existing worlds keep theirs.",
  }),
  ckset("WORLD_INDEX", "World slot", "World", "int", 0, {
    min: 0,
    max: 9,
    help: "Which world slot the server hosts (a new slot starts a fresh world).",
  }),
  ckset("SEASON", "Season override", "World", "enum", "", {
    choices: [
      { value: "", label: "Real date (default)" },
      { value: "0", label: "None" },
      { value: "1", label: "Easter" },
      { value: "2", label: "Halloween" },
      { value: "3", label: "Christmas" },
      { value: "4", label: "Valentine" },
      { value: "5", label: "Anniversary" },
      { value: "6", label: "Cherry Blossom" },
      { value: "7", label: "Lunar New Year" },
    ],
    help: "Force a seasonal event. Leave on 'Real date' to follow the calendar.",
  }),
  ckset("ACTIVATE_ALL_CONTENT", "Activate all content bundles", "World", "bool", false, {
    help: "Enable every post-1.1 content bundle on worlds created before v1.1. IRREVERSIBLE once enabled.",
  }),

  // ── Session ───────────────────────────────────────────────────────────────────
  ckset("GAME_ID", "Fixed Game ID", "Session", "string", "", {
    help: "Pin the join token (15-28 alphanumeric chars) so it survives wipes. Empty = the server generates one and keeps it in GameID.txt.",
  }),
  ckset("DISCORD_WEBHOOK_URL", "Discord webhook URL", "Session", "string", "", {
    help: "The image posts join/leave/start/stop messages (including the Game ID) to this webhook.",
  }),
];

export const CORE_KEEPER_CATALOG: SettingsCatalog = {
  game: Game.CORE_KEEPER,
  version: "1",
  settings,
};

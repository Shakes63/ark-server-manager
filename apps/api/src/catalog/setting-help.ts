import type { SettingDef } from "@ark/shared";

/**
 * Human-readable explanations for each setting, shown as tooltips in the UI.
 * Kept separate from the catalog so descriptions are easy to edit in one place.
 */
export const SETTING_HELP: Record<string, string> = {
  // Rules
  ServerPVE: "Disables player-vs-player combat — players can't damage each other.",
  ServerHardcore: "On death, players lose their character and restart at level 1.",
  AllowThirdPersonPlayer: "Lets players toggle the third-person camera.",
  GlobalVoiceChat: "Voice chat is heard by everyone, not just nearby players.",
  ProximityChat: "Chat is only heard by players who are physically close.",
  ShowMapPlayerLocation: "Shows each player their own position on the map.",
  ShowFloatingDamageText: "Displays damage numbers in combat (RPG-style).",
  AllowHitMarkers: "Shows a hit marker when you land a hit.",
  ServerCrosshair: "Enables the aiming crosshair.",
  ServerForceNoHUD: "Hides the heads-up display for all players.",
  EnablePVPGamma: "Allows players to brighten their screen (gamma) during PvP.",
  DisablePvEGamma: "Prevents players from adjusting gamma in PvE.",
  AllowFlyerCarryPvE: "Allows flying tames to pick up other creatures in PvE.",
  NoTributeDownloads: "Blocks downloading items/creatures/survivors from other servers.",
  PreventDownloadSurvivors: "Blocks transferring survivors onto this server.",
  PreventDownloadItems: "Blocks transferring items onto this server.",
  PreventDownloadDinos: "Blocks transferring creatures onto this server.",
  AllowRaidDinoFeeding: "Allows feeding and keeping boss creatures like the Titans.",
  RandomSupplyCratePoints: "Randomizes where loot supply crates spawn.",
  AllowHideDamageSourceFromLogs: "Hides who dealt damage in the tribe log.",
  AllowAnyoneBabyImprintCuddle: "Any tribe member can imprint a baby, not just its raiser.",
  DisableImprintDinoBuff: "Removes the rider stat bonus from imprinted creatures.",
  AlwaysNotifyPlayerLeft: "Broadcasts a message whenever a player leaves.",
  DontAlwaysNotifyPlayerJoined: "Suppresses the message shown when a player joins.",

  // Difficulty
  DifficultyOffset: "Fine-tunes wild creature levels (0–1); works with the difficulty value.",
  OverrideOfficialDifficulty: "Sets max wild creature level. 5.0 ≈ level 150, 10.0 ≈ level 300.",

  // Rates
  XPMultiplier: "Scales all experience gained by players and tames.",
  TamingSpeedMultiplier: "Higher = creatures tame faster (less time and food).",
  HarvestAmountMultiplier: "Scales how many resources you get per harvest.",
  HarvestHealthMultiplier: "Scales the durability of harvestable nodes (more hits per node).",
  ResourcesRespawnPeriodMultiplier: "Time before resources regrow — lower = faster respawn.",
  ItemStackSizeMultiplier: "Scales the maximum stack size of items in inventories.",
  FuelConsumptionIntervalMultiplier: "How fast fuel (wood, gas, etc.) is consumed.",
  OxygenSwimSpeedStatMultiplier: "How much the Oxygen stat boosts swim speed.",

  // Time & weather
  DayCycleSpeedScale: "Overall speed of the full day/night cycle. Higher = both day and night pass faster (shorter cycle).",
  DayTimeSpeedScale:
    "Controls daytime length. It's a time-SPEED value, so it works in reverse: LOWER = longer days, HIGHER = shorter days (default 1).",
  NightTimeSpeedScale:
    "Controls nighttime length. It's a time-SPEED value, so it works in reverse: LOWER = longer nights, HIGHER = shorter nights (default 1).",
  DisableWeatherFog: "Turns off fog weather effects.",

  // Spoiling & decay
  GlobalSpoilingTimeMultiplier: "How long food/items take to spoil — higher = lasts longer.",
  GlobalItemDecompositionTimeMultiplier: "How long dropped items remain before vanishing.",
  GlobalCorpseDecompositionTimeMultiplier: "How long bodies and loot bags remain before vanishing.",
  ClampItemSpoilingTimes: "Caps spoil timers so config changes apply to existing items.",

  // Players
  PlayerCharacterFoodDrainMultiplier: "How fast players get hungry.",
  PlayerCharacterWaterDrainMultiplier: "How fast players get thirsty.",
  PlayerCharacterStaminaDrainMultiplier: "How fast player stamina depletes.",
  PlayerCharacterHealthRecoveryMultiplier: "How fast players regenerate health.",
  PlayerDamageMultiplier: "Scales damage dealt by players.",
  PlayerResistanceMultiplier: "Scales player resistance — higher values mean players take MORE damage.",
  OverrideMaxExperiencePointsPlayer: "Hard cap on total player XP. 0 keeps the default.",

  // Dinos
  DinoCountMultiplier: "Scales how many wild creatures spawn in the world.",
  DinoDamageMultiplier: "Scales damage dealt by wild creatures.",
  DinoResistanceMultiplier: "Scales wild creature resistance — higher = they take more damage.",
  TamedDinoDamageMultiplier: "Scales damage dealt by tamed creatures.",
  TamedDinoResistanceMultiplier: "Scales tamed creature resistance — higher = they take more damage.",
  DinoCharacterFoodDrainMultiplier: "How fast creatures get hungry.",
  DinoCharacterStaminaDrainMultiplier: "How fast creature stamina depletes.",
  DinoCharacterHealthRecoveryMultiplier: "How fast creatures regenerate health.",
  DinoHarvestingDamageMultiplier: "How much resources creatures gather when harvesting.",
  DinoTurretDamageMultiplier: "Scales damage auto-turrets deal to creatures.",
  ServerAutoForceRespawnWildDinosInterval: "Auto-respawns wild creatures on this interval (seconds). 0 disables.",
  MaxTamedDinos: "Server-wide cap on the total number of tamed creatures.",

  // Structures
  StructureResistanceMultiplier: "Scales structure resistance — higher = structures take more damage.",
  StructureDamageMultiplier: "Scales damage dealt by structures (turrets, spikes, etc.).",
  TheMaxStructuresInRange: "Maximum structures allowed within an area (build limit).",
  StructurePreventResourceRadiusMultiplier: "Size of the area where structures block resource respawns.",
  PerPlatformMaxStructuresMultiplier: "Scales how many structures a platform saddle can hold.",
  MaxPlatformSaddleStructureLimit: "Absolute cap on structures per platform saddle.",
  AlwaysAllowStructurePickup: "Lets structures be picked up at any time after placing.",
  DisableStructureDecayPVE: "Turns off auto-demolish of unused structures in PvE.",
  PvEStructureDecayPeriodMultiplier: "How long before unused PvE structures decay — higher = longer.",

  // Crops & farming
  CropGrowthSpeedMultiplier: "How fast crops grow in plots.",
  CropDecaySpeedMultiplier: "How fast planted crops wither without water/fertilizer.",
  PoopIntervalMultiplier: "How often players and creatures produce feces.",
  HairGrowthSpeedMultiplier: "How fast player hair and facial hair grows.",

  // Breeding
  MatingIntervalMultiplier: "Cooldown between matings — lower = breed again sooner.",
  MatingSpeedMultiplier: "How fast the mating progress bar fills.",
  EggHatchSpeedMultiplier: "How fast fertilized eggs incubate and hatch.",
  BabyMatureSpeedMultiplier: "How fast babies grow into adults.",
  BabyFoodConsumptionSpeedMultiplier: "How fast babies eat from troughs and inventory.",
  BabyCuddleIntervalMultiplier: "Time between imprint cuddle requests — lower = more often.",
  BabyCuddleGracePeriodMultiplier: "Grace time to fulfill a cuddle before imprint starts dropping.",
  BabyCuddleLoseImprintQualitySpeedMultiplier: "How fast imprint is lost when cuddles are missed.",
  BabyImprintingStatScaleMultiplier: "How much stat bonus a fully imprinted creature gets.",
  BabyImprintAmountMultiplier: "Imprint percentage gained per cuddle.",
  LayEggIntervalMultiplier: "Time between passive egg drops — lower = more often.",

  // XP breakdown
  KillXPMultiplier: "XP gained specifically from kills.",
  HarvestXPMultiplier: "XP gained from harvesting resources.",
  CraftXPMultiplier: "XP gained from crafting items.",
  GenericXPMultiplier: "Passive/idle XP gained over time.",
  SpecialXPMultiplier: "XP from special sources (boss fights, explorer notes, etc.).",

  // Crafting
  CustomRecipeEffectivenessMultiplier: "Scales the potency of custom cooking recipes.",
  CustomRecipeSkillMultiplier: "Scales the Crafting Skill bonus applied to custom recipes.",
  PlayerHarvestingDamageMultiplier: "How much resources players gather per harvest swing.",
  bAllowCustomRecipes: "Allows players to create custom cooking recipes.",

  // Tribes
  MaxNumberOfPlayersInTribe: "Maximum players per tribe. 0 = unlimited.",
  MaxTribeLogs: "How many entries the tribe log keeps.",
  TribeNameChangeCooldown: "Minutes a tribe must wait before it can rename again.",
  PreventTribeAlliances: "Disables forming alliances between tribes.",

  // PvP
  bPvEDisableFriendlyFire: "Prevents tribe and ally members from damaging each other in PvE.",
  bAutoPvETimer: "Enables scheduled PvE windows — the server is PvE during set hours.",
  AutoPvEStartTimeSeconds: "Time of day (in seconds) when the PvE window starts.",
  AutoPvEStopTimeSeconds: "Time of day (in seconds) when the PvE window ends.",
  PvPZoneStructureDamageMultiplier: "Extra structure damage inside designated PvP zones.",
  bIncreasePvPRespawnInterval: "Makes respawn timers grow when you're repeatedly killed in PvP.",
  bDisableLootCrates: "Disables loot and supply crate drops.",
  bAllowUnlimitedRespecs: "Lets players mindwipe (reset their stats) unlimited times.",
  bPassiveDefensesDamageRiderlessDinos: "Spike walls and Plant Species X damage unmounted creatures.",

  // Server
  AutoSavePeriodMinutes: "How often the world auto-saves, in minutes.",
  KickIdlePlayersPeriod: "Seconds of inactivity before idle players are kicked.",
  bUseSingleplayerSettings: "Applies the easier single-player rate tuning on top of your settings.",

  // Cross-server
  TributeItemExpirationSeconds: "How long uploaded items stay available before they expire.",
  TributeDinoExpirationSeconds: "How long uploaded creatures stay available before they expire.",
  TributeCharacterExpirationSeconds: "How long uploaded survivors stay available before they expire.",

  // ASA extras
  AllowCryoFridgeOnSaddle: "Allows cryofridges to be placed on platform saddles.",
  AllowFlyingStaminaRecovery: "Lets flyers regenerate stamina while in the air.",
  AllowMultipleAttachedC4: "Allows attaching more than one C4 to the same target.",
  StructurePickupTimeAfterPlacement: "Seconds after placing during which a structure can still be picked up.",
  StructurePickupHoldDuration: "How long you must hold the pickup key to grab a structure.",
  bDisableStructurePlacementCollision: "Lets structures place through terrain and each other.",

  // ASE extras
  AllowCaveBuildingPvE: "Allows building inside caves in PvE.",
  AllowCaveBuildingPvP: "Allows building inside caves in PvP.",
  PreventOfflinePvP: "Enables offline raid protection (defenses are tougher while offline).",

  // Launch flags
  DisableBattlEye: "Runs the server without the BattlEye anti-cheat. Some mods require this.",
  ForceRespawnDinos: "Wipes and respawns all wild creatures on the next start.",
  ForceAllowCaveFlyers: "Permits flying creatures inside caves.",

  // Tier A additions
  PreventDiseases: "Disables diseases such as Swamp Fever entirely.",
  NonPermanentDiseases: "Diseases are removed when a player respawns instead of being permanent.",
  PreventSpawnAnimations: "Skips the lie-down/get-up animation when players spawn in.",
  SupplyCrateLootQualityMultiplier: "Scales the quality of loot found in supply/loot crates.",
  FishingLootQualityMultiplier: "Scales the quality of loot caught while fishing.",
  CraftingSkillBonusMultiplier: "Scales the bonus that the Crafting Skill gives to crafted items.",
  OverrideMaxExperiencePointsDino: "Hard cap on total creature XP. 0 keeps the default.",
  bAllowSpeedLeveling: "Lets players put level-up points into Movement Speed.",
  bAllowFlyerSpeedLeveling: "Lets flyers level their Movement Speed stat.",
  EnableExtraStructurePreventionVolumes: "Blocks building in extra protected areas (artifacts, obelisks, etc.).",
  FastDecayUnsnappedCoreStructures: "Unsnapped foundations and pillars decay quickly (anti-pillar-spam).",
  DestroyUnconnectedWaterPipes: "Automatically removes water pipes not connected to anything.",
  OnlyAutoDestroyCoreStructures: "Auto-decay only affects core structures (foundations, pillars), not everything.",
  PlatformSaddleBuildAreaBoundsMultiplier: "Scales how far you can build out from a platform saddle.",
  PreventOfflinePvPInterval: "Delay (seconds) before offline raid protection activates after a tribe logs off.",
  MaxAlliancesPerTribe: "How many alliances a single tribe can be part of. 0 = unlimited.",
  MaxTribesPerAlliance: "How many tribes can belong to one alliance. 0 = unlimited.",
  AllowIntegratedSPlusStructures: "Enables the built-in Structures Plus (S+) structures (ASA).",
  culture: "Forces the server's language/locale (e.g. en, de, fr). Default leaves it unset.",
  NoUnderMeshKilling: "Stops the server from killing players detected under the world mesh.",
  NoUnderMeshChecking: "Disables under-mesh detection entirely.",
  ServerRCONOutputTribeLogs: "Includes tribe log lines in the RCON output stream.",
  NotifyAdminCommandsInChat: "Broadcasts a chat message whenever an admin uses a cheat command.",
};

/** Fill each setting's `help` from the map (map wins over any builder help). */
export function applyHelp(settings: SettingDef[]): SettingDef[] {
  return settings.map((s) => ({ ...s, help: SETTING_HELP[s.key] ?? s.help }));
}

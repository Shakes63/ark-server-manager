/**
 * Curated list of common ARK engrams (friendly name -> EngramClassName). Engram
 * class names are famously inconsistent, so this covers the predictable/common
 * ones; the engram picker accepts a custom class for anything else.
 */
export interface ArkEngram {
  name: string;
  className: string;
}

export const ARK_ENGRAMS: ArkEngram[] = [
  // Tools & weapons
  { name: "Stone Pick", className: "EngramEntry_StonePick_C" },
  { name: "Stone Hatchet", className: "EngramEntry_StoneHatchet_C" },
  { name: "Spear", className: "EngramEntry_Spear_C" },
  { name: "Pike", className: "EngramEntry_Pike_C" },
  { name: "Bow", className: "EngramEntry_Bow_C" },
  { name: "Slingshot", className: "EngramEntry_SlingShot_C" },
  { name: "Metal Pick", className: "EngramEntry_MetalPick_C" },
  { name: "Metal Hatchet", className: "EngramEntry_MetalHatchet_C" },

  // Crafting stations
  { name: "Campfire", className: "EngramEntry_Campfire_C" },
  { name: "Mortar and Pestle", className: "EngramEntry_MortarAndPestle_C" },
  { name: "Cooking Pot", className: "EngramEntry_CookingPot_C" },
  { name: "Smithy", className: "EngramEntry_AnvilBench_C" },
  { name: "Refining Forge", className: "EngramEntry_Forge_C" },
  { name: "Fabricator", className: "EngramEntry_Fabricator_C" },
  { name: "Industrial Forge", className: "EngramEntry_IndustrialForge_C" },
  { name: "Industrial Grill", className: "EngramEntry_IndustrialGrill_C" },
  { name: "Industrial Cooker", className: "EngramEntry_IndustrialCookingPot_C" },
  { name: "Chemistry Bench", className: "EngramEntry_ChemistryBench_C" },

  // Storage / utility
  { name: "Storage Box", className: "EngramEntry_StorageBox_C" },
  { name: "Large Storage Box", className: "EngramEntry_LargeStorageBox_C" },
  { name: "Vault", className: "EngramEntry_Vault_C" },
  { name: "Refrigerator", className: "EngramEntry_Refrigerator_C" },
  { name: "Preserving Bin", className: "EngramEntry_PreservingBin_C" },
  { name: "Sleeping Bag", className: "EngramEntry_SleepingBag_C" },
  { name: "Simple Bed", className: "EngramEntry_Bed_C" },

  // Structures — Thatch
  { name: "Thatch Foundation", className: "EngramEntry_ThatchFloor_C" },
  { name: "Thatch Wall", className: "EngramEntry_ThatchWall_C" },
  { name: "Thatch Ceiling", className: "EngramEntry_ThatchRoof_C" },
  { name: "Thatch Doorframe", className: "EngramEntry_ThatchDoorframe_C" },
  { name: "Thatch Door", className: "EngramEntry_ThatchDoor_C" },
  // Structures — Wood
  { name: "Wooden Foundation", className: "EngramEntry_WoodFloor_C" },
  { name: "Wooden Wall", className: "EngramEntry_WoodWall_C" },
  { name: "Wooden Ceiling", className: "EngramEntry_WoodCeiling_C" },
  { name: "Wooden Doorframe", className: "EngramEntry_WoodDoorframe_C" },
  { name: "Wooden Door", className: "EngramEntry_WoodDoor_C" },
  { name: "Wooden Pillar", className: "EngramEntry_WoodPillar_C" },
  { name: "Wooden Ramp", className: "EngramEntry_WoodRamp_C" },
  // Structures — Stone
  { name: "Stone Foundation", className: "EngramEntry_StoneFloor_C" },
  { name: "Stone Wall", className: "EngramEntry_StoneWall_C" },
  { name: "Stone Ceiling", className: "EngramEntry_StoneCeiling_C" },
  { name: "Stone Doorframe", className: "EngramEntry_StoneDoorframe_C" },
  // Structures — Metal
  { name: "Metal Foundation", className: "EngramEntry_MetalFloor_C" },
  { name: "Metal Wall", className: "EngramEntry_MetalWall_C" },
  { name: "Metal Ceiling", className: "EngramEntry_MetalCeiling_C" },

  // Electrical & advanced
  { name: "Electrical Generator", className: "EngramEntry_PowerGenerator_C" },
  { name: "Air Conditioner", className: "EngramEntry_AirConditioner_C" },
  { name: "Auto Turret", className: "EngramEntry_AutoTurret_C" },
  { name: "Plant Species X", className: "EngramEntry_PlantSpeciesX_C" },

  // Utility items
  { name: "Spyglass", className: "EngramEntry_Spyglass_C" },
  { name: "Parachute", className: "EngramEntry_Parachute_C" },
  { name: "Grappling Hook", className: "EngramEntry_GrapplingHook_C" },
];

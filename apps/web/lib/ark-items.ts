/**
 * Curated list of commonly stack-overridden ARK items, mapping a friendly name
 * to its class string. Not exhaustive — the item picker also accepts a custom
 * class string for anything not listed here.
 */
export interface ArkItem {
  className: string;
  name: string;
  category: string;
}

export const ARK_ITEMS: ArkItem[] = [
  // Resources
  { className: "PrimalItemResource_Wood", name: "Wood", category: "Resources" },
  { className: "PrimalItemResource_Thatch", name: "Thatch", category: "Resources" },
  { className: "PrimalItemResource_Stone", name: "Stone", category: "Resources" },
  { className: "PrimalItemResource_Fibers", name: "Fiber", category: "Resources" },
  { className: "PrimalItemResource_Flint", name: "Flint", category: "Resources" },
  { className: "PrimalItemResource_Metal", name: "Metal", category: "Resources" },
  { className: "PrimalItemResource_MetalIngot", name: "Metal Ingot", category: "Resources" },
  { className: "PrimalItemResource_Hide", name: "Hide", category: "Resources" },
  { className: "PrimalItemResource_Chitin", name: "Chitin", category: "Resources" },
  { className: "PrimalItemResource_Keratin", name: "Keratin", category: "Resources" },
  { className: "PrimalItemResource_Obsidian", name: "Obsidian", category: "Resources" },
  { className: "PrimalItemResource_Crystal", name: "Crystal", category: "Resources" },
  { className: "PrimalItemResource_Oil", name: "Oil", category: "Resources" },
  { className: "PrimalItemResource_Silicon", name: "Silica Pearls", category: "Resources" },
  { className: "PrimalItemResource_ChitinPaste", name: "Cementing Paste", category: "Resources" },
  { className: "PrimalItemResource_Sparkpowder", name: "Sparkpowder", category: "Resources" },
  { className: "PrimalItemResource_Gunpowder", name: "Gunpowder", category: "Resources" },
  { className: "PrimalItemResource_Charcoal", name: "Charcoal", category: "Resources" },
  { className: "PrimalItemResource_Gasoline", name: "Gasoline", category: "Resources" },
  { className: "PrimalItemResource_Electronics", name: "Electronics", category: "Resources" },
  { className: "PrimalItemResource_Polymer", name: "Polymer", category: "Resources" },
  { className: "PrimalItemResource_Polymer_Organic", name: "Organic Polymer", category: "Resources" },
  { className: "PrimalItemResource_BlackPearl", name: "Black Pearl", category: "Resources" },
  { className: "PrimalItemResource_Element", name: "Element", category: "Resources" },
  { className: "PrimalItemResource_ElementShard", name: "Element Shard", category: "Resources" },
  { className: "PrimalItemResource_ElementDust", name: "Element Dust", category: "Resources" },
  { className: "PrimalItemResource_Pelt", name: "Pelt", category: "Resources" },
  { className: "PrimalItemResource_Sap", name: "Sap", category: "Resources" },
  { className: "PrimalItemResource_Sulfur", name: "Sulfur", category: "Resources" },
  { className: "PrimalItemResource_RawSalt", name: "Raw Salt", category: "Resources" },
  { className: "PrimalItemResource_Clay", name: "Clay", category: "Resources" },
  { className: "PrimalItemResource_Sand", name: "Sand", category: "Resources" },
  { className: "PrimalItemResource_CactusSap", name: "Cactus Sap", category: "Resources" },
  { className: "PrimalItemResource_Propellant", name: "Propellant", category: "Resources" },
  { className: "PrimalItemResource_CondensedGas", name: "Condensed Gas", category: "Resources" },
  { className: "PrimalItemResource_FungalWood", name: "Fungal Wood", category: "Resources" },
  { className: "PrimalItemResource_RareFlower", name: "Rare Flower", category: "Resources" },
  { className: "PrimalItemResource_RareMushroom", name: "Rare Mushroom", category: "Resources" },
  { className: "PrimalItemResource_AnglerGel", name: "Angler Gel", category: "Resources" },
  { className: "PrimalItemResource_LeechBlood", name: "Leech Blood", category: "Resources" },
  { className: "PrimalItemResource_Silk", name: "Silk", category: "Resources" },
  { className: "PrimalItemResource_Mutagen", name: "Mutagen", category: "Resources" },
  { className: "PrimalItemResource_Mutagel", name: "Mutagel", category: "Resources" },

  // Meat & food
  { className: "PrimalItemConsumable_RawMeat", name: "Raw Meat", category: "Food" },
  { className: "PrimalItemConsumable_CookedMeat", name: "Cooked Meat", category: "Food" },
  { className: "PrimalItemConsumable_RawPrimeMeat", name: "Raw Prime Meat", category: "Food" },
  { className: "PrimalItemConsumable_CookedPrimeMeat", name: "Cooked Prime Meat", category: "Food" },
  { className: "PrimalItemConsumable_SpoiledMeat", name: "Spoiled Meat", category: "Food" },
  { className: "PrimalItemConsumable_RawMeat_Fish", name: "Raw Fish Meat", category: "Food" },
  { className: "PrimalItemConsumable_CookedMeat_Fish", name: "Cooked Fish Meat", category: "Food" },
  { className: "PrimalItemConsumable_RawMutton", name: "Raw Mutton", category: "Food" },
  { className: "PrimalItemConsumable_CookedLambChop", name: "Cooked Lamb Chop", category: "Food" },
  { className: "PrimalItemConsumable_Veggie_Rockarrot", name: "Rockarrot", category: "Food" },
  { className: "PrimalItemConsumable_Veggie_Longrass", name: "Longrass", category: "Food" },
  { className: "PrimalItemConsumable_Veggie_Savoroot", name: "Savoroot", category: "Food" },
  { className: "PrimalItemConsumable_Veggie_Citronal", name: "Citronal", category: "Food" },

  // Berries & consumables
  { className: "PrimalItemConsumable_Berry_Amarberry", name: "Amarberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Berry_Azulberry", name: "Azulberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Berry_Tintoberry", name: "Tintoberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Berry_Mejoberry", name: "Mejoberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Berry_Narcoberry", name: "Narcoberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Berry_Stimberry", name: "Stimberry", category: "Consumables" },
  { className: "PrimalItemConsumable_Narcotic", name: "Narcotic", category: "Consumables" },
  { className: "PrimalItemConsumable_Stimulant", name: "Stimulant", category: "Consumables" },
  { className: "PrimalItemConsumable_HealSoup", name: "Medical Brew", category: "Consumables" },
  { className: "PrimalItemConsumable_StaminaSoup", name: "Energy Brew", category: "Consumables" },
  { className: "PrimalItemConsumable_BloodPack", name: "Blood Pack", category: "Consumables" },

  // Ammo
  { className: "PrimalItemAmmo_ArrowStone", name: "Stone Arrow", category: "Ammo" },
  { className: "PrimalItemAmmo_ArrowTranq", name: "Tranq Arrow", category: "Ammo" },
  { className: "PrimalItemAmmo_CompoundBowArrow", name: "Compound Bow Arrow", category: "Ammo" },
  { className: "PrimalItemAmmo_SimpleBullet", name: "Simple Bullet", category: "Ammo" },
  { className: "PrimalItemAmmo_AdvancedBullet", name: "Advanced Bullet", category: "Ammo" },
  { className: "PrimalItemAmmo_AdvancedRifleBullet", name: "Advanced Rifle Bullet", category: "Ammo" },
  { className: "PrimalItemAmmo_SimpleShotgunBullet", name: "Shotgun Ammo", category: "Ammo" },
  { className: "PrimalItemAmmo_Rocket", name: "Rocket Propelled Grenade", category: "Ammo" },
];

// Shared shapes for the mod browser (CurseForge for ASA, Steam Workshop for ASE).

export type ModSort = "relevance" | "popularity" | "downloads" | "updated" | "name";

/** A mod as shown in browse/search result cards. */
export interface ModSearchResult {
  remoteId: number;
  /** URL slug — CurseForge only; needed to install a Minecraft modpack (CF_SLUG). */
  slug: string | null;
  name: string;
  summary: string;
  thumbnailUrl: string | null;
  downloadCount: number;
  authors: string[];
  websiteUrl: string | null;
  lastUpdated: string | null; // ISO timestamp
  fileSize: number | null; // bytes (latest file)
  version: string | null; // latest file display name / version label
  categories: string[];
  featured: boolean;
}

/** Full mod info for the detail view (heavier — fetched on demand). */
export interface ModDetail extends ModSearchResult {
  description: string; // long description (plain text — HTML/BBCode stripped server-side)
  screenshots: string[];
}

export interface ModCategory {
  id: string;
  name: string;
}

/** A favorited mod (stored per game in the manager DB). */
export interface ModFavorite {
  remoteId: number;
  name: string;
  thumbnailUrl: string | null;
}

/** Page size used by the browse endpoint; the UI infers "has more" from it. */
export const MOD_PAGE_SIZE = 20;

/**
 * The CurseForge modpack installed on a Minecraft server. Stored in the server's
 * config (underscore-prefixed keys) and consumed by the runtime spec, which switches
 * the itzg image to TYPE=AUTO_CURSEFORGE and feeds it CF_SLUG/CF_FILE_ID + the key.
 */
export interface MinecraftModpack {
  projectId: number;
  slug: string;
  name: string;
  thumbnailUrl: string | null;
  /** Pinned file (version) id, or null to let the image install the latest. */
  fileId: number | null;
  /** Update check (filled on GET when the pack is pinned): CurseForge's current
   *  main file vs the pinned one. */
  latestFileId?: number | null;
  latestFileName?: string | null;
  updateAvailable?: boolean;
}

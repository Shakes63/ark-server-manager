import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import {
  ASA_CURSEFORGE_GAME_ID,
  MOD_PAGE_SIZE,
  type ModCategory,
  type ModDetail,
  type ModSearchResult,
  type ModSort,
} from "@ark/shared";
import { ManagerSettingsService, SettingKeys } from "../manager-settings/manager-settings.service";
import { stripMarkup } from "./mod-util";

const CF_BASE = "https://api.curseforge.com";

// CurseForge sortField ids (relevance = let the API rank by the search filter).
const CF_SORT: Record<ModSort, { field: string; order: string } | null> = {
  relevance: null,
  popularity: { field: "2", order: "desc" },
  downloads: { field: "6", order: "desc" },
  updated: { field: "3", order: "desc" },
  name: { field: "4", order: "asc" },
};

export type { ModSearchResult };

/**
 * CurseForge Core API client for the ASA mod browser. The API key is stored
 * encrypted via ManagerSettings; without it, browsing is unavailable but install
 * -by-id still works (the ASA server downloads mods itself from CurseForge).
 */
@Injectable()
export class CurseForgeService {
  private readonly logger = new Logger(CurseForgeService.name);

  constructor(private readonly settings: ManagerSettingsService) {}

  private async key(): Promise<string> {
    const key = await this.settings.get(SettingKeys.CurseForgeApiKey);
    if (!key) {
      throw new BadRequestException(
        "CurseForge API key not configured — add it in Settings to browse mods.",
      );
    }
    return key;
  }

  private async request<T>(path: string): Promise<T> {
    const res = await fetch(`${CF_BASE}${path}`, {
      headers: { Accept: "application/json", "x-api-key": await this.key() },
    });
    if (!res.ok) {
      throw new BadRequestException(`CurseForge API ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  async search(
    query: string,
    page = 0,
    sort: ModSort = "relevance",
    opts: { gameVersion?: string; categoryId?: string } = {},
  ): Promise<ModSearchResult[]> {
    const params = new URLSearchParams({
      gameId: String(ASA_CURSEFORGE_GAME_ID),
      pageSize: String(MOD_PAGE_SIZE),
      index: String(page * MOD_PAGE_SIZE),
    });
    if (query) params.set("searchFilter", query);
    // relevance with a query → let CF rank; relevance with no query → popularity.
    const s = CF_SORT[sort] ?? (query ? null : CF_SORT.popularity);
    if (s) {
      params.set("sortField", s.field);
      params.set("sortOrder", s.order);
    }
    if (opts.gameVersion) params.set("gameVersion", opts.gameVersion);
    if (opts.categoryId) params.set("categoryId", opts.categoryId);
    const body = await this.request<{ data: CfMod[] }>(`/v1/mods/search?${params.toString()}`);
    return body.data.map(toResult);
  }

  async details(remoteId: number): Promise<ModDetail> {
    const [modBody, descBody] = await Promise.all([
      this.request<{ data: CfMod }>(`/v1/mods/${remoteId}`),
      this.request<{ data: string }>(`/v1/mods/${remoteId}/description`).catch(() => ({ data: "" })),
    ]);
    const m = modBody.data;
    return {
      ...toResult(m),
      description: stripMarkup(descBody.data || m.summary),
      screenshots: (m.screenshots ?? []).map((s) => s.url).filter((u): u is string => !!u),
    };
  }

  /** Mod categories for the game (for the browser's category filter). */
  async categories(): Promise<ModCategory[]> {
    const body = await this.request<{
      data: Array<{ id: number; name: string; isClass?: boolean }>;
    }>(`/v1/categories?gameId=${ASA_CURSEFORGE_GAME_ID}`);
    return (body.data ?? [])
      .filter((c) => !c.isClass)
      .map((c) => ({ id: String(c.id), name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

interface CfMod {
  id: number;
  name: string;
  summary: string;
  downloadCount: number;
  logo?: { thumbnailUrl?: string; url?: string };
  authors?: Array<{ name: string }>;
  links?: { websiteUrl?: string };
  dateModified?: string;
  isFeatured?: boolean;
  categories?: Array<{ name: string }>;
  latestFiles?: Array<{ displayName?: string; fileLength?: number }>;
  screenshots?: Array<{ url?: string }>;
}

function toResult(m: CfMod): ModSearchResult {
  return {
    remoteId: m.id,
    name: m.name,
    summary: m.summary,
    thumbnailUrl: m.logo?.thumbnailUrl ?? m.logo?.url ?? null,
    downloadCount: m.downloadCount ?? 0,
    authors: (m.authors ?? []).map((a) => a.name),
    websiteUrl: m.links?.websiteUrl ?? null,
    lastUpdated: m.dateModified ?? null,
    fileSize: m.latestFiles?.[0]?.fileLength ?? null,
    version: m.latestFiles?.[0]?.displayName ?? null,
    categories: (m.categories ?? []).map((c) => c.name).filter(Boolean),
    featured: !!m.isFeatured,
  };
}

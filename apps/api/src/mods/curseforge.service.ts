import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ASA_CURSEFORGE_GAME_ID } from "@ark/shared";
import { ManagerSettingsService, SettingKeys } from "../manager-settings/manager-settings.service";

const CF_BASE = "https://api.curseforge.com";

export interface ModSearchResult {
  remoteId: number;
  name: string;
  summary: string;
  thumbnailUrl: string | null;
  downloadCount: number;
  authors: string[];
  websiteUrl: string | null;
}

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

  async search(query: string, page = 0, pageSize = 20): Promise<ModSearchResult[]> {
    const params = new URLSearchParams({
      gameId: String(ASA_CURSEFORGE_GAME_ID),
      searchFilter: query,
      pageSize: String(pageSize),
      index: String(page * pageSize),
      sortField: "2", // popularity
      sortOrder: "desc",
    });
    const body = await this.request<{ data: CfMod[] }>(`/v1/mods/search?${params.toString()}`);
    return body.data.map(toResult);
  }

  async details(remoteId: number): Promise<ModSearchResult> {
    const body = await this.request<{ data: CfMod }>(`/v1/mods/${remoteId}`);
    return toResult(body.data);
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
  };
}

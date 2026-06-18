import { BadRequestException, Injectable } from "@nestjs/common";
import { ASE_WORKSHOP_APP_ID } from "@ark/shared";
import { ManagerSettingsService, SettingKeys } from "../manager-settings/manager-settings.service";
import type { ModSearchResult } from "./curseforge.service";

const STEAM_BASE = "https://api.steampowered.com";

/**
 * Steam Workshop browser for ASE mods via the Steam Web API
 * (IPublishedFileService/QueryFiles, app 346110). Key stored encrypted.
 */
@Injectable()
export class SteamService {
  constructor(private readonly settings: ManagerSettingsService) {}

  private async key(): Promise<string> {
    const key = await this.settings.get(SettingKeys.SteamWebApiKey);
    if (!key) {
      throw new BadRequestException(
        "Steam Web API key not configured — add it in Settings to browse Workshop mods.",
      );
    }
    return key;
  }

  async search(query: string, page = 0, pageSize = 20): Promise<ModSearchResult[]> {
    const params = new URLSearchParams({
      key: await this.key(),
      appid: String(ASE_WORKSHOP_APP_ID),
      search_text: query,
      numperpage: String(pageSize),
      page: String(page + 1),
      query_type: "3", // ranked by text-search match
      return_metadata: "true",
      return_previews: "true",
    });
    const res = await fetch(
      `${STEAM_BASE}/IPublishedFileService/QueryFiles/v1/?${params.toString()}`,
    );
    if (!res.ok) throw new BadRequestException(`Steam API ${res.status}: ${res.statusText}`);
    const body = (await res.json()) as { response?: { publishedfiledetails?: SteamFile[] } };
    return (body.response?.publishedfiledetails ?? []).map(toResult);
  }
}

interface SteamFile {
  publishedfileid: string;
  title?: string;
  short_description?: string;
  file_description?: string;
  preview_url?: string;
  subscriptions?: number;
}

function toResult(f: SteamFile): ModSearchResult {
  return {
    remoteId: Number(f.publishedfileid),
    name: f.title ?? `Workshop ${f.publishedfileid}`,
    summary: f.short_description ?? f.file_description?.slice(0, 200) ?? "",
    thumbnailUrl: f.preview_url ?? null,
    downloadCount: f.subscriptions ?? 0,
    authors: [],
    websiteUrl: `https://steamcommunity.com/sharedfiles/filedetails/?id=${f.publishedfileid}`,
  };
}

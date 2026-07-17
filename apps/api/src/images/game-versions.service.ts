import { Injectable, Logger } from "@nestjs/common";
import { Game, type GameVersionOption, type GameVersionsResult } from "@ark/shared";

const CACHE_TTL_MS = 30 * 60_000; // versions change rarely; a stale-ish list is fine
const FETCH_TIMEOUT_MS = 12_000;
const MAX_SNAPSHOTS = 25; // the Mojang manifest has thousands — cap the noise
const MAX_OPENTTD = 60;

/**
 * Lists the available GAME versions for a game — the value its wrapper image reads to
 * install a specific build of the game itself (distinct from the Docker image tag).
 * Backs the settings version dropdown so a user picks a real published version instead
 * of guessing a string. Only games whose image exposes a version knob have a provider;
 * everything else returns an empty list (the UI falls back to a free-text box).
 */
@Injectable()
export class GameVersionsService {
  private readonly logger = new Logger(GameVersionsService.name);
  private readonly cache = new Map<Game, { at: number; result: GameVersionsResult }>();

  private readonly providers: Partial<Record<Game, () => Promise<GameVersionsResult>>> = {
    [Game.MINECRAFT]: () => this.minecraft(),
    [Game.OPENTTD]: () => this.openttd(),
    // ich777 SteamCMD games: the game version is a Steam beta branch appended to GAME_ID.
    [Game.ATS]: () => this.steamBranches(2239530),
    [Game.ETS2]: () => this.steamBranches(1948160),
    [Game.LIF]: () => this.steamBranches(320850),
  };

  async list(game: Game): Promise<GameVersionsResult> {
    const provider = this.providers[game];
    if (!provider) return { defaultValue: "", defaultLabel: "", options: [] };
    const cached = this.cache.get(game);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.result;
    const result = await provider().catch((e) => {
      this.logger.warn(`version list for ${game} failed: ${(e as Error).message}`);
      return { defaultValue: "", defaultLabel: "", options: [] as GameVersionOption[] };
    });
    // Only cache a non-empty success — a transient failure shouldn't be sticky.
    if (result.options.length) this.cache.set(game, { at: Date.now(), result });
    return result;
  }

  /** itzg/minecraft-server VERSION env: "LATEST", "SNAPSHOT", or a concrete id. */
  private async minecraft(): Promise<GameVersionsResult> {
    const json = (await this.getJson(
      "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
    )) as { versions?: { id: string; type: string; releaseTime?: string }[] } | null;
    const versions = json?.versions ?? [];
    const date = (t?: string) => (t ? ` — ${t.slice(0, 10)}` : "");
    const releases = versions
      .filter((v) => v.type === "release")
      .map<GameVersionOption>((v) => ({ value: v.id, label: `${v.id}${date(v.releaseTime)}`, kind: "release" }));
    const snapshots = versions
      .filter((v) => v.type === "snapshot")
      .slice(0, MAX_SNAPSHOTS)
      .map<GameVersionOption>((v) => ({
        value: v.id,
        label: `${v.id} (snapshot)${date(v.releaseTime)}`,
        kind: "snapshot",
      }));
    return {
      defaultValue: "LATEST",
      defaultLabel: "Latest release (LATEST)",
      // "SNAPSHOT" is itzg's alias for the newest snapshot; then concrete versions.
      options: [
        { value: "SNAPSHOT", label: "Latest snapshot (SNAPSHOT)", kind: "default" },
        ...releases,
        ...snapshots,
      ],
    };
  }

  /** ich777 openttdserver GAME_VERSION: "latest" or a release tag (e.g. "15.3"). */
  private async openttd(): Promise<GameVersionsResult> {
    const json = (await this.getJson(
      "https://api.github.com/repos/OpenTTD/OpenTTD/releases?per_page=60",
    )) as { tag_name?: string; prerelease?: boolean; published_at?: string }[] | null;
    const options = (json ?? []).slice(0, MAX_OPENTTD).map<GameVersionOption>((r) => ({
      value: r.tag_name ?? "",
      label: `${r.tag_name}${r.prerelease ? " (beta)" : ""}${r.published_at ? ` — ${r.published_at.slice(0, 10)}` : ""}`,
      kind: r.prerelease ? "prerelease" : "release",
    }));
    return {
      defaultValue: "latest",
      defaultLabel: "Latest stable (latest)",
      options: options.filter((o) => o.value),
    };
  }

  /**
   * Steam beta branches for an ich777 SteamCMD game (via api.steamcmd.net). "public"
   * is the default (current release); other password-free branches become options —
   * for the truck sims these are per-version (temporary_1_59 = 1.59.x). The chosen
   * value is appended to GAME_ID as "-beta <branch>" in the spec builder.
   */
  private async steamBranches(appId: number): Promise<GameVersionsResult> {
    const json = (await this.getJson(`https://api.steamcmd.net/v1/info/${appId}`)) as {
      data?: Record<string, { depots?: { branches?: Record<string, { description?: string; pwdrequired?: string; timeupdated?: string }> } }>;
    } | null;
    const branches = json?.data?.[String(appId)]?.depots?.branches ?? {};
    const options = Object.entries(branches)
      // Skip the default (offered as defaultValue) + any password-protected branch.
      .filter(([name, b]) => name !== "public" && String(b?.pwdrequired ?? "0") !== "1")
      // Newest branch first where Steam gives us a timestamp.
      .sort(([, a], [, b]) => Number(b?.timeupdated ?? 0) - Number(a?.timeupdated ?? 0))
      .map<GameVersionOption>(([name, b]) => ({
        value: name,
        label: b?.description ? `${name} — ${b.description}` : name,
        kind: "branch",
      }));
    return { defaultValue: "public", defaultLabel: "Public (current release)", options };
  }

  private async getJson(url: string): Promise<unknown> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      // A UA header keeps the GitHub API from 403-ing anonymous requests.
      const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "palisade" } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }
}

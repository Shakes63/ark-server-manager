import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as cron from "node-cron";
import { Game, EventType, STEAM_APP_ID } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EventsService } from "../events/events.service";
import { LocalPaths } from "../common/paths";

// Every 3 hours, offset off the top of the hour. ARK ships updates a few times a
// week at most, so this is plenty without hammering the API.
const POLL_CRON = "23 */3 * * *";
const INITIAL_DELAY_MS = 30_000; // let the app settle/reconcile before the first check
const FETCH_TIMEOUT_MS = 15_000;

/** Build id from SteamCMD's app manifest (`"buildid"   "12345678"`), or null. */
export function parseAcfBuildId(acf: string): number | null {
  const m = acf.match(/"buildid"\s+"(\d+)"/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Public-branch build id from the steamcmd.net info JSON, or null. */
export function pickPublicBuildId(json: unknown, appId: number): number | null {
  const buildid = (json as Record<string, never> | null)?.["data"]?.[String(appId)]?.["depots"]?.[
    "branches"
  ]?.["public"]?.["buildid"];
  const n = Number(buildid);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Detects when a server's installed ARK build is behind Steam's latest public
 * build, flags `updateAvailable`, and emits an `UpdateAvailable` event (which the
 * notifications service forwards to Discord). The "latest" build comes from the
 * public steamcmd.net info API; failures degrade gracefully (the check is skipped,
 * never throwing). The "installed" build is read from SteamCMD's appmanifest .acf.
 */
@Injectable()
export class UpdatesService implements OnModuleInit {
  private readonly logger = new Logger(UpdatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  onModuleInit(): void {
    cron.schedule(POLL_CRON, () => void this.checkAll());
    setTimeout(() => void this.checkAll(), INITIAL_DELAY_MS).unref?.();
  }

  async checkAll(): Promise<void> {
    try {
      const servers = await this.prisma.server.findMany();
      const games = [...new Set(servers.map((s) => s.game as Game))];
      const latest = new Map<Game, number>();
      await Promise.all(
        games.map(async (g) => {
          const b = await this.latestBuildId(g);
          if (b !== null) latest.set(g, b);
        }),
      );

      for (const server of servers) {
        const newest = latest.get(server.game as Game);
        if (newest === undefined) continue; // couldn't fetch the latest → skip
        const installed = await this.installedBuildId(server.id, server.game as Game);
        if (installed === null) continue; // not installed yet → nothing to compare

        const outdated = newest > installed;
        const data: Record<string, unknown> = {};
        if (String(installed) !== server.installedBuildId) data.installedBuildId = String(installed);
        if (outdated !== server.updateAvailable) data.updateAvailable = outdated;
        if (Object.keys(data).length) {
          await this.prisma.server.update({ where: { id: server.id }, data }).catch(() => undefined);
        }
        // Notify once, on the false→true transition only (no every-poll spam).
        if (outdated && !server.updateAvailable) {
          await this.events.emit({
            type: EventType.UpdateAvailable,
            message: `Update available for "${server.name}" (installed build ${installed}, latest ${newest}). Use Install / Update, then restart.`,
            serverId: server.id,
            data: { installed: String(installed), latest: String(newest) },
          });
        }
      }
    } catch (err) {
      this.logger.warn(`update check failed: ${(err as Error).message}`);
    }
  }

  private async latestBuildId(game: Game): Promise<number | null> {
    const appId = STEAM_APP_ID[game];
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(`https://api.steamcmd.net/v1/info/${appId}`, { signal: ctrl.signal });
      if (!res.ok) return null;
      return pickPublicBuildId(await res.json(), appId);
    } catch (err) {
      this.logger.debug(`latestBuildId(${game}) failed: ${(err as Error).message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async installedBuildId(serverId: string, game: Game): Promise<number | null> {
    const file = `appmanifest_${STEAM_APP_ID[game]}.acf`;
    // A started server has its own copy; fall back to the shared golden cache.
    for (const dir of [LocalPaths.instanceRoot(serverId), LocalPaths.gameCache(game)]) {
      try {
        const buildid = parseAcfBuildId(await readFile(join(dir, file), "utf8"));
        if (buildid !== null) return buildid;
      } catch {
        /* file absent here → try the next location */
      }
    }
    return null;
  }
}

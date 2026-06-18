import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { ServerState, EventType } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EventsService } from "../events/events.service";
import { RconService } from "../rcon/rcon.service";
import { loadEnv } from "../config/env";

const DEFAULT_KEEP = 10;

/**
 * Save backups: on-demand + scheduler-driven pre-action snapshots, with
 * retention rotation and restore. A backup is a copy of the instance Saved dir.
 */
@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly rcon: RconService,
  ) {}

  list(serverId: string) {
    return this.prisma.snapshot.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Save the world (best-effort) then copy the Saved dir into backups/. */
  async create(serverId: string, reason: string) {
    const env = loadEnv();
    await this.rcon.saveWorld(serverId).catch(() => undefined);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const src = join(env.DATA_DIR, "instances", serverId, "Saved");
    const destDir = join(env.DATA_DIR, "backups", serverId);
    const dest = join(destDir, `${reason}-${stamp}`);
    await mkdir(destDir, { recursive: true });
    await cp(src, dest, { recursive: true }).catch((err) => {
      throw new BadRequestException(`Backup failed: ${(err as Error).message}`);
    });

    const snapshot = await this.prisma.snapshot.create({ data: { serverId, path: dest, reason } });
    await this.events.emit({
      type: EventType.BackupCreated,
      message: `Backup (${reason}) created`,
      serverId,
      data: { path: dest },
    });
    await this.applyRetention(serverId);
    return snapshot;
  }

  /** Restore a backup over the instance Saved dir. Server must be stopped. */
  async restore(serverId: string, snapshotId: string) {
    const env = loadEnv();
    const server = await this.prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundException("Server not found");
    if (![ServerState.Stopped, ServerState.Crashed].includes(server.state as ServerState)) {
      throw new BadRequestException("Stop the server before restoring a backup");
    }
    const snap = await this.prisma.snapshot.findUnique({ where: { id: snapshotId } });
    if (!snap) throw new NotFoundException("Backup not found");

    const dest = join(env.DATA_DIR, "instances", serverId, "Saved");
    // Snapshot the current state first so a restore is itself reversible.
    await this.create(serverId, "pre-restore").catch(() => undefined);
    await rm(dest, { recursive: true, force: true });
    await cp(snap.path, dest, { recursive: true });
    await this.events.emit({
      type: EventType.BackupCreated,
      message: `Restored backup from ${snap.createdAt.toISOString()}`,
      serverId,
    });
    return { restored: true };
  }

  async remove(snapshotId: string) {
    const snap = await this.prisma.snapshot.findUnique({ where: { id: snapshotId } });
    if (!snap) throw new NotFoundException("Backup not found");
    await rm(snap.path, { recursive: true, force: true }).catch(() => undefined);
    await this.prisma.snapshot.delete({ where: { id: snapshotId } });
    return { ok: true };
  }

  /** Keep the newest N backups per server; delete the rest (rows + dirs). */
  private async applyRetention(serverId: string, keep = DEFAULT_KEEP): Promise<void> {
    const all = await this.prisma.snapshot.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
    for (const old of all.slice(keep)) {
      await rm(old.path, { recursive: true, force: true }).catch(() => undefined);
      await this.prisma.snapshot.delete({ where: { id: old.id } }).catch(() => undefined);
    }
  }
}

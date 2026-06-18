import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Game, EventType } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EventsService } from "../events/events.service";

export interface AddModInput {
  remoteId: number;
  name?: string;
  thumbnailUrl?: string | null;
}

/**
 * Per-server mod management. The launch builder reads `server.modIds`, so this
 * service keeps that array in sync with the enabled ModInstalls (in load order)
 * while ModInstall/Mod hold the metadata, order, pin, and enabled flag.
 */
@Injectable()
export class ModsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async listInstalled(serverId: string) {
    return this.prisma.modInstall.findMany({
      where: { serverId },
      include: { mod: true },
      orderBy: { loadOrder: "asc" },
    });
  }

  async add(serverId: string, input: AddModInput) {
    const server = await this.prisma.server.findUnique({ where: { id: serverId } });
    if (!server) throw new NotFoundException("Server not found");
    const source = (server.game as Game) === Game.ASA ? "curseforge" : "workshop";

    const mod = await this.prisma.mod.upsert({
      where: {
        game_source_remoteId: { game: server.game, source, remoteId: String(input.remoteId) },
      },
      create: {
        game: server.game,
        source,
        remoteId: String(input.remoteId),
        name: input.name ?? `Mod ${input.remoteId}`,
        thumbnailUrl: input.thumbnailUrl ?? null,
      },
      update: input.name ? { name: input.name, thumbnailUrl: input.thumbnailUrl ?? null } : {},
    });

    const existing = await this.prisma.modInstall.findUnique({
      where: { serverId_modId: { serverId, modId: mod.id } },
    });
    if (existing) throw new BadRequestException("Mod already installed on this server");

    const max = await this.prisma.modInstall.aggregate({
      where: { serverId },
      _max: { loadOrder: true },
    });
    await this.prisma.modInstall.create({
      data: { serverId, modId: mod.id, loadOrder: (max._max.loadOrder ?? 0) + 1 },
    });
    await this.sync(serverId);
    await this.events.emit({
      type: EventType.ConfigChanged,
      message: `Added mod ${mod.name} (${input.remoteId})`,
      serverId,
    });
    return this.listInstalled(serverId);
  }

  async remove(serverId: string, modInstallId: string) {
    await this.prisma.modInstall.delete({ where: { id: modInstallId } });
    await this.sync(serverId);
    return this.listInstalled(serverId);
  }

  async setEnabled(serverId: string, modInstallId: string, enabled: boolean) {
    await this.prisma.modInstall.update({ where: { id: modInstallId }, data: { enabled } });
    await this.sync(serverId);
    return this.listInstalled(serverId);
  }

  async setPin(serverId: string, modInstallId: string, version: string | null) {
    await this.prisma.modInstall.update({
      where: { id: modInstallId },
      data: { pinnedVersion: version },
    });
    return this.listInstalled(serverId);
  }

  /** Reorder by an explicit list of ModInstall ids (load order matters in ARK). */
  async reorder(serverId: string, orderedIds: string[]) {
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.modInstall.update({ where: { id }, data: { loadOrder: idx + 1 } }),
      ),
    );
    await this.sync(serverId);
    return this.listInstalled(serverId);
  }

  /** Recompute server.modIds = enabled installs, in load order. */
  private async sync(serverId: string): Promise<void> {
    const installs = await this.prisma.modInstall.findMany({
      where: { serverId, enabled: true },
      include: { mod: true },
      orderBy: { loadOrder: "asc" },
    });
    const ids = installs.map((i) => Number(i.mod.remoteId)).filter((n) => !Number.isNaN(n));
    await this.prisma.server.update({
      where: { id: serverId },
      data: { modIds: JSON.stringify(ids) },
    });
  }
}

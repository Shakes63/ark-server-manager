import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Game, type CustomPreset } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";

/** What we stash in SettingProfile.configJson (the model predates this feature). */
interface StoredPreset {
  description?: string;
  values: Record<string, unknown>;
}

interface ProfileRow {
  id: string;
  name: string;
  game: string;
  configJson: string;
  createdAt: Date;
}

/**
 * User-defined settings presets. Backed by the (previously unused) SettingProfile
 * table — name + game are columns; the description and the value map live in
 * configJson, so this needs no schema migration.
 */
@Injectable()
export class PresetsService {
  constructor(private readonly prisma: PrismaService) {}

  private toDto(row: ProfileRow): CustomPreset {
    let parsed: StoredPreset = { values: {} };
    try {
      parsed = JSON.parse(row.configJson) as StoredPreset;
    } catch {
      /* corrupt row → empty preset rather than a 500 */
    }
    return {
      id: row.id,
      name: row.name,
      description: parsed.description,
      game: row.game as Game,
      values: parsed.values ?? {},
      createdAt: row.createdAt.toISOString(),
    };
  }

  async list(game?: Game): Promise<CustomPreset[]> {
    const rows = await this.prisma.settingProfile.findMany({
      where: game ? { game } : undefined,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDto(r));
  }

  async create(input: {
    name: string;
    description?: string;
    game: Game;
    values: Record<string, unknown>;
  }): Promise<CustomPreset> {
    const name = input.name.trim();
    if (!name) throw new BadRequestException("Preset name is required");
    const stored: StoredPreset = {
      description: input.description?.trim() || undefined,
      values: input.values ?? {},
    };
    const row = await this.prisma.settingProfile.create({
      data: { name, game: input.game, configJson: JSON.stringify(stored) },
    });
    return this.toDto(row);
  }

  async remove(id: string): Promise<void> {
    const row = await this.prisma.settingProfile.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Preset not found");
    await this.prisma.settingProfile.delete({ where: { id } });
  }
}

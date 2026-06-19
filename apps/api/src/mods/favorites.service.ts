import { Injectable } from "@nestjs/common";
import { Game, type ModFavorite } from "@ark/shared";
import { ManagerSettingsService } from "../manager-settings/manager-settings.service";

const KEY = (game: Game) => `mod_favorites_${game}`;

/**
 * Favorited mods, stored per game as a JSON array in ManagerSettings (key/value),
 * so it needs no schema migration. Favorites are global (not per server) — a mod
 * you like, ready to add to any server of that game.
 */
@Injectable()
export class FavoritesService {
  constructor(private readonly settings: ManagerSettingsService) {}

  async list(game: Game): Promise<ModFavorite[]> {
    const raw = await this.settings.get(KEY(game));
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as ModFavorite[]) : [];
    } catch {
      return [];
    }
  }

  async add(game: Game, fav: ModFavorite): Promise<ModFavorite[]> {
    const list = await this.list(game);
    if (list.some((f) => f.remoteId === fav.remoteId)) return list;
    const next = [
      { remoteId: fav.remoteId, name: fav.name, thumbnailUrl: fav.thumbnailUrl ?? null },
      ...list,
    ];
    await this.settings.set(KEY(game), JSON.stringify(next));
    return next;
  }

  async remove(game: Game, remoteId: number): Promise<ModFavorite[]> {
    const next = (await this.list(game)).filter((f) => f.remoteId !== remoteId);
    await this.settings.set(KEY(game), JSON.stringify(next));
    return next;
  }
}

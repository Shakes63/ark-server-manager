import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { Game, type ModSort } from "@ark/shared";
import { CurseForgeService } from "./curseforge.service";
import { SteamService } from "./steam.service";
import { FavoritesService } from "./favorites.service";
import { ModsService } from "./mods.service";

class AddModBody {
  @IsInt() remoteId!: number;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() thumbnailUrl?: string;
}
class FavoriteBody {
  @IsEnum(Game) game!: Game;
  @IsInt() remoteId!: number;
  @IsString() name!: string;
  @IsOptional() @IsString() thumbnailUrl?: string | null;
}
class ReorderBody {
  @IsArray() order!: string[];
}
class EnabledBody {
  @IsBoolean() enabled!: boolean;
}
class PinBody {
  @IsOptional() @IsString() version?: string;
}

@Controller()
export class ModsController {
  constructor(
    private readonly mods: ModsService,
    private readonly curseforge: CurseForgeService,
    private readonly steam: SteamService,
    private readonly favorites: FavoritesService,
  ) {}

  /** Mod browser — CurseForge for ASA, Steam Workshop for ASE. */
  @Get("mods/browse")
  browse(
    @Query("query") query = "",
    @Query("page") page = "0",
    @Query("game") game: Game = Game.ASA,
    @Query("sort") sort: ModSort = "relevance",
    @Query("gameVersion") gameVersion?: string,
    @Query("categoryId") categoryId?: string,
  ) {
    return game === Game.ASE
      ? this.steam.search(query, Number(page), sort)
      : this.curseforge.search(query, Number(page), sort, { gameVersion, categoryId });
  }

  /** Categories for the browser's filter (CurseForge only; ASE has none). */
  @Get("mods/categories")
  categories(@Query("game") game: Game = Game.ASA) {
    return game === Game.ASE ? [] : this.curseforge.categories();
  }

  // ── Favorites (global per game) ────────────────────────────────────────────
  @Get("mods/favorites")
  listFavorites(@Query("game") game: Game = Game.ASA) {
    return this.favorites.list(game);
  }

  @Post("mods/favorites")
  addFavorite(@Body() body: FavoriteBody) {
    return this.favorites.add(body.game, {
      remoteId: body.remoteId,
      name: body.name,
      thumbnailUrl: body.thumbnailUrl ?? null,
    });
  }

  @Delete("mods/favorites/:remoteId")
  removeFavorite(@Param("remoteId") remoteId: string, @Query("game") game: Game = Game.ASA) {
    return this.favorites.remove(game, Number(remoteId));
  }

  @Get("mods/:remoteId")
  details(@Param("remoteId") remoteId: string, @Query("game") game: Game = Game.ASA) {
    return game === Game.ASE
      ? this.steam.details(Number(remoteId))
      : this.curseforge.details(Number(remoteId));
  }

  @Get("servers/:id/mods")
  list(@Param("id") id: string) {
    return this.mods.listInstalled(id);
  }

  @Post("servers/:id/mods")
  add(@Param("id") id: string, @Body() body: AddModBody) {
    return this.mods.add(id, body);
  }

  @Delete("servers/:id/mods/:modInstallId")
  remove(@Param("id") id: string, @Param("modInstallId") modInstallId: string) {
    return this.mods.remove(id, modInstallId);
  }

  @Post("servers/:id/mods/reorder")
  reorder(@Param("id") id: string, @Body() body: ReorderBody) {
    return this.mods.reorder(id, body.order);
  }

  @Patch("servers/:id/mods/:modInstallId/enabled")
  setEnabled(
    @Param("id") id: string,
    @Param("modInstallId") modInstallId: string,
    @Body() body: EnabledBody,
  ) {
    return this.mods.setEnabled(id, modInstallId, body.enabled);
  }

  @Patch("servers/:id/mods/:modInstallId/pin")
  setPin(
    @Param("id") id: string,
    @Param("modInstallId") modInstallId: string,
    @Body() body: PinBody,
  ) {
    return this.mods.setPin(id, modInstallId, body.version ?? null);
  }
}

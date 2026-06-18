import { Controller, Get, Param } from "@nestjs/common";
import { Game } from "@ark/shared";
import { CatalogService } from "./catalog.service";

@Controller("catalog")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /** The settings catalog the UI renders forms from. */
  @Get(":game")
  getCatalog(@Param("game") game: string) {
    return this.catalog.getCatalog(game as Game);
  }

  @Get(":game/defaults")
  getDefaults(@Param("game") game: string) {
    return this.catalog.defaultsFor(game as Game);
  }
}

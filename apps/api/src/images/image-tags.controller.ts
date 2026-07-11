import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { Game } from "@ark/shared";
import { ImageTagsService } from "./image-tags.service";

@Controller("games/:game/image-tags")
export class ImageTagsController {
  constructor(private readonly imageTags: ImageTagsService) {}

  /** Available image tags for a game ({ repo, defaultTag, tags }). */
  @Get()
  list(@Param("game") game: string) {
    if (!Object.values(Game).includes(game as Game)) {
      throw new BadRequestException(`Unknown game "${game}"`);
    }
    return this.imageTags.list(game as Game);
  }
}

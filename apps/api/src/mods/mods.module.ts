import { Module } from "@nestjs/common";
import { ModsService } from "./mods.service";
import { CurseForgeService } from "./curseforge.service";
import { SteamService } from "./steam.service";
import { ModsController } from "./mods.controller";

@Module({
  controllers: [ModsController],
  providers: [ModsService, CurseForgeService, SteamService],
  exports: [ModsService],
})
export class ModsModule {}

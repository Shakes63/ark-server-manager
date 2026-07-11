import { Module } from "@nestjs/common";
import { ModUpdatesService } from "./modupdates.service";
import { ModUpdatesController } from "./modupdates.controller";
import { ValheimModsModule } from "../valheimmods/valheimmods.module";
import { ModsModule } from "../mods/mods.module";

@Module({
  imports: [ValheimModsModule, ModsModule],
  controllers: [ModUpdatesController],
  providers: [ModUpdatesService],
  exports: [ModUpdatesService],
})
export class ModUpdatesModule {}

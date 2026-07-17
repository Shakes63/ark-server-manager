import { Module } from "@nestjs/common";
import { ValheimModsController } from "./valheimmods.controller";
import { ValheimModsService } from "./valheimmods.service";

@Module({
  controllers: [ValheimModsController],
  providers: [ValheimModsService],
  exports: [ValheimModsService],
})
export class ValheimModsModule {}

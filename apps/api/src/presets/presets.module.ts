import { Module } from "@nestjs/common";
import { PresetsService } from "./presets.service";
import { PresetsController } from "./presets.controller";

@Module({
  controllers: [PresetsController],
  providers: [PresetsService],
})
export class PresetsModule {}

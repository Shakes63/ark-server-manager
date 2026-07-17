import { Module } from "@nestjs/common";
import { ArtworkService } from "./artwork.service";
import { ArtworkController } from "./artwork.controller";
import { ManagerSettingsModule } from "../manager-settings/manager-settings.module";

@Module({
  imports: [ManagerSettingsModule],
  controllers: [ArtworkController],
  providers: [ArtworkService],
  exports: [ArtworkService],
})
export class ArtworkModule {}

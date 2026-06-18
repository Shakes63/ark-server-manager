import { Global, Module } from "@nestjs/common";
import { ManagerSettingsService } from "./manager-settings.service";
import { ManagerSettingsController } from "./manager-settings.controller";

@Global()
@Module({
  controllers: [ManagerSettingsController],
  providers: [ManagerSettingsService],
  exports: [ManagerSettingsService],
})
export class ManagerSettingsModule {}

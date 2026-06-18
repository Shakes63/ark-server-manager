import { Module } from "@nestjs/common";
import { BackupsService } from "./backups.service";
import { BackupsController } from "./backups.controller";
import { RconModule } from "../rcon/rcon.module";

@Module({
  imports: [RconModule],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService],
})
export class BackupsModule {}

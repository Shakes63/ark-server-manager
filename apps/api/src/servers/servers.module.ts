import { Module } from "@nestjs/common";
import { ServersService } from "./servers.service";
import { ServersController } from "./servers.controller";
import { StateMachineService } from "./state-machine.service";
import { RconModule } from "../rcon/rcon.module";
import { BackupsModule } from "../backups/backups.module";

@Module({
  imports: [RconModule, BackupsModule],
  controllers: [ServersController],
  providers: [ServersService, StateMachineService],
  exports: [ServersService, StateMachineService],
})
export class ServersModule {}

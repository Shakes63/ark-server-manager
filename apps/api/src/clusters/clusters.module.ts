import { Module } from "@nestjs/common";
import { ClustersService } from "./clusters.service";
import { ClustersController } from "./clusters.controller";
import { ServersModule } from "../servers/servers.module";

@Module({
  imports: [ServersModule],
  controllers: [ClustersController],
  providers: [ClustersService],
  exports: [ClustersService],
})
export class ClustersModule {}

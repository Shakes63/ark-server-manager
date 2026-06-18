import { Global, Module } from "@nestjs/common";
import { DockerService } from "./docker.service";

@Global()
@Module({
  providers: [DockerService],
  exports: [DockerService],
})
export class DockerModule {}

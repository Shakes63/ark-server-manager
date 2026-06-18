import { Controller, Get } from "@nestjs/common";
import { Public } from "../auth/public.decorator";
import { DockerService } from "../docker/docker.service";

@Controller("health")
export class HealthController {
  constructor(private readonly docker: DockerService) {}

  @Public()
  @Get()
  async health() {
    return {
      status: "ok",
      docker: (await this.docker.ping()) ? "connected" : "unreachable",
      time: new Date().toISOString(),
    };
  }
}

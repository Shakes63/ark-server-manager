import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { IsBoolean, IsIn, IsInt } from "class-validator";
import { PortForwardsService } from "./portforwards.service";

class ToggleForwardBody {
  @IsInt() port!: number;
  @IsIn(["udp", "tcp"]) proto!: "udp" | "tcp";
  @IsBoolean() enabled!: boolean;
}

@Controller("servers/:id/portforwards")
export class PortForwardsController {
  constructor(private readonly portforwards: PortForwardsService) {}

  /** Each player-facing forward's state on the pfSense router. */
  @Get()
  status(@Param("id") id: string) {
    return this.portforwards.status(id);
  }

  /** Create missing forwards and re-target mismatched ones (auto pass rules) + apply. */
  @Post()
  apply(@Param("id") id: string) {
    return this.portforwards.apply(id);
  }

  /** Enable or disable one forward. */
  @Patch()
  toggle(@Param("id") id: string, @Body() body: ToggleForwardBody) {
    return this.portforwards.setEnabled(id, body.port, body.proto, body.enabled);
  }

  /** Delete one forward (?port=&proto=), or all of this server's forwards. */
  @Delete()
  remove(
    @Param("id") id: string,
    @Query("port") port?: string,
    @Query("proto") proto?: string,
  ) {
    const p = port !== undefined ? Number(port) : undefined;
    return this.portforwards.remove(id, p, proto === "tcp" ? "tcp" : proto === "udp" ? "udp" : undefined);
  }
}

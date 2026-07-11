import { Controller, Get, Param, Post } from "@nestjs/common";
import { ModUpdatesService } from "./modupdates.service";

@Controller("servers/:id/mod-updates")
export class ModUpdatesController {
  constructor(private readonly modUpdates: ModUpdatesService) {}

  /** Pending mod updates for this server ({ supported, count, items }). */
  @Get()
  status(@Param("id") id: string) {
    return this.modUpdates.status(id);
  }

  /** Apply every pending mod update. Returns { updated, failed, restartNeeded }. */
  @Post("apply")
  apply(@Param("id") id: string) {
    return this.modUpdates.updateAll(id);
  }
}

import { Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { BackupsService } from "./backups.service";

@Controller()
export class BackupsController {
  constructor(private readonly backups: BackupsService) {}

  @Get("servers/:id/backups")
  list(@Param("id") id: string) {
    return this.backups.list(id);
  }

  @Post("servers/:id/backups")
  create(@Param("id") id: string) {
    return this.backups.create(id, "manual");
  }

  @Post("servers/:id/backups/:snapshotId/restore")
  restore(@Param("id") id: string, @Param("snapshotId") snapshotId: string) {
    return this.backups.restore(id, snapshotId);
  }

  @Delete("backups/:snapshotId")
  remove(@Param("snapshotId") snapshotId: string) {
    return this.backups.remove(snapshotId);
  }
}

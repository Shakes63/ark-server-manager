import { Global, Module } from "@nestjs/common";
import { InstallerService } from "./installer.service";

@Global()
@Module({
  providers: [InstallerService],
  exports: [InstallerService],
})
export class InstallerModule {}

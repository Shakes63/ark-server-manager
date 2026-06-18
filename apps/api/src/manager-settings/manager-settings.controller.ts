import { Body, Controller, Get, Patch } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { ManagerSettingsService, SettingKeys } from "./manager-settings.service";

class UpdateSettingsBody {
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsString() curseForgeApiKey?: string;
  @IsOptional() @IsString() steamWebApiKey?: string;
}

@Controller("settings")
export class ManagerSettingsController {
  constructor(private readonly settings: ManagerSettingsService) {}

  /** Non-secret settings; secrets are reported only as present/absent. */
  @Get()
  view() {
    return this.settings.publicView();
  }

  @Patch()
  async update(@Body() body: UpdateSettingsBody) {
    if (body.timezone) await this.settings.set(SettingKeys.Timezone, body.timezone);
    if (body.curseForgeApiKey)
      await this.settings.set(SettingKeys.CurseForgeApiKey, body.curseForgeApiKey);
    if (body.steamWebApiKey)
      await this.settings.set(SettingKeys.SteamWebApiKey, body.steamWebApiKey);
    return this.settings.publicView();
  }
}

import { Body, Controller, Patch, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { NotificationsService } from "./notifications.service";
import { ManagerSettingsService, SettingKeys } from "../manager-settings/manager-settings.service";

class WebhookBody {
  @IsOptional() @IsString() discordWebhookUrl?: string;
}

@Controller("notifications")
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly settings: ManagerSettingsService,
  ) {}

  @Patch("webhook")
  async setWebhook(@Body() body: WebhookBody) {
    if (body.discordWebhookUrl !== undefined) {
      await this.settings.set(SettingKeys.DiscordWebhook, body.discordWebhookUrl);
    }
    return { ok: true };
  }

  @Post("test")
  test() {
    return this.notifications.test();
  }
}

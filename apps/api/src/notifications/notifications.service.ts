import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { EventType } from "@ark/shared";
import { EventsService, type EmitEventInput } from "../events/events.service";
import { ManagerSettingsService, SettingKeys } from "../manager-settings/manager-settings.service";

/** Event types worth pushing to Discord (status churn like RCON/log is excluded). */
const NOTIFY_TYPES = new Set<EventType>([
  EventType.StateTransition,
  EventType.InstallFinished,
  EventType.UpdateAvailable,
  EventType.BackupCreated,
  EventType.ScheduleFired,
  EventType.Warning,
  EventType.Error,
]);

/**
 * Dispatches selected events to a configured Discord (or generic) webhook.
 * Subscribes to the in-process event bus so it never couples into emit paths.
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly events: EventsService,
    private readonly settings: ManagerSettingsService,
  ) {}

  onModuleInit(): void {
    this.events.onEvent((input) => void this.handle(input));
  }

  private async handle(input: EmitEventInput): Promise<void> {
    if (!NOTIFY_TYPES.has(input.type)) return;
    const url = await this.settings.get(SettingKeys.DiscordWebhook);
    if (!url) return;
    await this.post(url, `**[${input.type}]** ${input.message}`).catch((err) =>
      this.logger.warn(`webhook post failed: ${(err as Error).message}`),
    );
  }

  async post(url: string, content: string): Promise<void> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok && res.status !== 204) {
      throw new Error(`webhook responded ${res.status}`);
    }
  }

  /** Send a test message to verify the configured webhook. */
  async test(): Promise<{ sent: boolean }> {
    const url = await this.settings.get(SettingKeys.DiscordWebhook);
    if (!url) return { sent: false };
    await this.post(url, "ARK Server Manager: webhook test ✅");
    return { sent: true };
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter } from "node:events";
import { EventType, RealtimeTopic } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

export interface EmitEventInput {
  type: EventType;
  message: string;
  serverId?: string | null;
  clusterId?: string | null;
  data?: Record<string, unknown> | null;
}

export type EventListener = (input: EmitEventInput) => void;

/**
 * Single sink for every notable thing that happens. Persists to EventLog (audit)
 * and pushes to the realtime gateway. State transitions and config changes MUST
 * go through here (PLANNING.md → Data model / state machine).
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly bus = new EventEmitter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {
    this.bus.setMaxListeners(50);
  }

  /** Subscribe to every emitted event (used by the notifications dispatcher). */
  onEvent(listener: EventListener): void {
    this.bus.on("event", listener);
  }

  async emit(input: EmitEventInput): Promise<void> {
    const row = await this.prisma.eventLog.create({
      data: {
        type: input.type,
        message: input.message,
        serverId: input.serverId ?? null,
        clusterId: input.clusterId ?? null,
        dataJson: input.data ? JSON.stringify(input.data) : null,
      },
    });
    this.realtime.broadcast({
      topic: RealtimeTopic.Event,
      serverId: input.serverId ?? undefined,
      payload: {
        id: row.id,
        type: input.type,
        message: input.message,
        serverId: input.serverId ?? null,
        clusterId: input.clusterId ?? null,
        data: input.data ?? null,
        createdAt: row.createdAt.toISOString(),
      },
      at: new Date().toISOString(),
    });
    this.bus.emit("event", input);
    this.logger.debug(`[${input.type}] ${input.message}`);
  }

  async recent(serverId?: string, take = 100) {
    return this.prisma.eventLog.findMany({
      where: serverId ? { serverId } : undefined,
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}

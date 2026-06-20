import { Logger } from "@nestjs/common";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { RealtimeMessage } from "@ark/shared";

/**
 * Socket.IO gateway for live status, log tails, install progress, RCON output,
 * and events. Clients subscribe to a server room to scope traffic.
 */
// addTrailingSlash:false lets engine.io accept the path after Next's rewrite
// strips the trailing slash from `/socket.io/`; without it the polling
// handshake 404s behind the single-origin proxy.
@WebSocketGateway({ cors: { origin: true, credentials: true }, addTrailingSlash: false })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(_client: Socket): void {
    // No per-server rooms: clients receive every message and filter by
    // serverId/topic themselves. (Emitting to a room AND globally delivered room
    // members two copies of each server-scoped message.)
  }

  handleDisconnect(_client: Socket): void {
    // no-op; sockets clean up automatically
  }

  /** Broadcast to all clients; each filters by serverId/topic itself. */
  broadcast(message: RealtimeMessage): void {
    this.server?.emit("message", message);
  }
}

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
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket): void {
    const serverId = client.handshake.query.serverId;
    if (typeof serverId === "string" && serverId) {
      void client.join(`server:${serverId}`);
    }
  }

  handleDisconnect(_client: Socket): void {
    // no-op; rooms clean up automatically
  }

  /** Broadcast to everyone, or to a server room if the message is server-scoped. */
  broadcast(message: RealtimeMessage): void {
    if (!this.server) return;
    if (message.serverId) {
      this.server.to(`server:${message.serverId}`).emit("message", message);
    }
    this.server.emit("message", message);
  }
}

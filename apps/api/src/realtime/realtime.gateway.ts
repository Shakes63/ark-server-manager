import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import type { RealtimeMessage } from "@ark/shared";
import { AuthService } from "../auth/auth.service";
import { loadEnv } from "../config/env";

/**
 * Socket.IO gateway for live status, log tails, install progress, RCON output,
 * and events. Clients subscribe to a server room to scope traffic.
 */
// addTrailingSlash:false lets engine.io accept the path after Next's rewrite
// strips the trailing slash from `/socket.io/`; without it the polling
// handshake 404s behind the single-origin proxy.
// Same-origin through the Next rewrite proxy needs no CORS; cross-origin
// sockets are denied unless origins are allowed via CORS_ORIGINS (like the API).
@WebSocketGateway({
  cors: {
    origin: loadEnv().CORS_ORIGINS.length > 0 ? loadEnv().CORS_ORIGINS : false,
    credentials: true,
  },
  addTrailingSlash: false,
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly auth: AuthService,
  ) {}

  /** Realtime traffic includes log tails and RCON output — require a valid,
   * unrevoked JWT in the socket.io handshake before any message flows. */
  afterInit(server: Server): void {
    server.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error("unauthorized"));
        const payload = await this.jwt.verifyAsync(token);
        if (!(await this.auth.isTokenCurrent(payload.sub, payload.ver))) {
          return next(new Error("unauthorized"));
        }
        next();
      } catch {
        next(new Error("unauthorized"));
      }
    });
  }

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

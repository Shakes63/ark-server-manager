"use client";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import type { RealtimeMessage } from "@ark/shared";

/**
 * Subscribe to realtime messages, optionally scoped to one server. Returns
 * nothing; pass an onMessage handler. The connection is torn down on unmount.
 */
export function useRealtime(
  onMessage: (msg: RealtimeMessage) => void,
  serverId?: string,
): void {
  const handler = useRef(onMessage);
  handler.current = onMessage;

  useEffect(() => {
    const socket: Socket = io({
      path: "/socket.io",
      query: serverId ? { serverId } : undefined,
      transports: ["websocket"],
    });
    socket.on("message", (msg: RealtimeMessage) => handler.current(msg));
    return () => {
      socket.close();
    };
  }, [serverId]);
}

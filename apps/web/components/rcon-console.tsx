"use client";
import { useRef, useState } from "react";
import { SendHorizontal, Save, Users, RefreshCw } from "lucide-react";
import { apiPost } from "@/lib/api";
import { useRealtime } from "@/lib/socket";

export function RconConsole({ serverId }: { serverId: string }) {
  const [lines, setLines] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [players, setPlayers] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  const append = (line: string) => {
    setLines((prev) => [...prev.slice(-400), line]);
    requestAnimationFrame(() => boxRef.current?.scrollTo(0, boxRef.current.scrollHeight));
  };

  useRealtime((msg) => {
    if (msg.serverId !== serverId) return;
    if (msg.topic === "server.log") append((msg.payload as { line: string }).line);
    if (msg.topic === "rcon.output") {
      const p = msg.payload as { command: string; response: string };
      append(`> ${p.command}`);
      append(p.response);
    }
  }, serverId);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    try {
      await apiPost(`/servers/${serverId}/rcon`, { command });
      setCommand("");
    } catch (err) {
      append(`! ${(err as Error).message}`);
    }
  };

  const refreshPlayers = async () => {
    try {
      const { players } = await apiPost<{ players: string[] }>(`/servers/${serverId}/rcon/players`);
      setPlayers(players);
    } catch (err) {
      append(`! ${(err as Error).message}`);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-3">
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => apiPost(`/servers/${serverId}/rcon/save`)}>
            <Save className="h-4 w-4" /> Save world
          </button>
          <button className="btn-secondary" onClick={refreshPlayers}>
            <RefreshCw className="h-4 w-4" /> Refresh players
          </button>
        </div>
        <div
          ref={boxRef}
          className="h-80 overflow-y-auto rounded-lg border border-ark-border bg-black/40 p-3 font-mono text-xs leading-relaxed"
        >
          {lines.length === 0 ? (
            <span className="text-slate-500">Console output and live logs appear here…</span>
          ) : (
            lines.map((l, i) => <div key={i}>{l}</div>)
          )}
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            className="input font-mono"
            placeholder="RCON command e.g. Broadcast Hello"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
          />
          <button className="btn-primary">
            <SendHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" /> Players
        </h3>
        {players.length === 0 ? (
          <p className="text-sm text-slate-500">No players (or not refreshed).</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {players.map((p, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

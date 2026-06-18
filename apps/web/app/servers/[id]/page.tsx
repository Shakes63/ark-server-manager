"use client";
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Square, RotateCw, Download } from "lucide-react";
import { mapLabel, type ServerSummary, type ServerConfigValues } from "@ark/shared";
import { apiGet, apiPost } from "@/lib/api";
import { useRealtime } from "@/lib/socket";
import { StateBadge } from "@/components/state-badge";
import { SettingsForm } from "@/components/settings-form";
import { CopyMenu } from "@/components/copy-menu";
import { RconConsole } from "@/components/rcon-console";
import { ScheduleList } from "@/components/schedule-list";
import { ModsTab } from "@/components/mods-tab";
import { BackupsTab } from "@/components/backups-tab";

const TABS = ["Overview", "Settings", "Mods", "Console", "Schedules", "Backups"] as const;
type Tab = (typeof TABS)[number];

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<ServerSummary | null>(null);
  const [config, setConfig] = useState<ServerConfigValues | null>(null);
  const [configKey, setConfigKey] = useState(0); // bump to remount the editor on copy-in
  const [tab, setTab] = useState<Tab>("Overview");

  // Keep the active tab in the URL (?tab=settings) so a refresh lands you back
  // on the same tab instead of Overview. Uses replaceState — no scroll/navigation.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    const found = p && TABS.find((t) => t.toLowerCase() === p.toLowerCase());
    if (found) setTab(found);
  }, []);
  const changeTab = (t: Tab) => {
    setTab(t);
    const u = new URL(window.location.href);
    u.searchParams.set("tab", t.toLowerCase());
    window.history.replaceState(null, "", u);
  };

  const refresh = useCallback(() => {
    apiGet<ServerSummary>(`/servers/${id}`).then(setServer).catch(() => undefined);
  }, [id]);

  // Re-fetch server + config and remount the settings editor (used after a
  // "copy from another server", which replaces this server's config wholesale).
  const reload = useCallback(() => {
    refresh();
    apiGet<ServerConfigValues>(`/servers/${id}/config`)
      .then((c) => {
        setConfig(c);
        setConfigKey((k) => k + 1);
      })
      .catch(() => undefined);
  }, [id, refresh]);

  useEffect(() => {
    reload();
  }, [id, reload]);

  useRealtime((msg) => {
    if (msg.serverId === id && (msg.topic === "server.state" || msg.topic === "event")) refresh();
  }, id);

  const act = async (action: "install" | "start" | "stop" | "restart") => {
    await apiPost(`/servers/${id}/${action}`).catch((e) => alert(e.message));
    refresh();
  };

  if (!server) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200">
        <ArrowLeft className="h-4 w-4" /> All servers
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{server.name}</h1>
          <StateBadge state={server.state} />
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyMenu server={server} onAfterCopyIn={reload} />
          <button className="btn-secondary" onClick={() => act("install")}>
            <Download className="h-4 w-4" /> Install / Update
          </button>
          <button className="btn-primary" onClick={() => act("start")}>
            <Play className="h-4 w-4" /> Start
          </button>
          <button className="btn-secondary" onClick={() => act("restart")}>
            <RotateCw className="h-4 w-4" /> Restart
          </button>
          <button className="btn-secondary" onClick={() => act("stop")}>
            <Square className="h-4 w-4" /> Stop
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-ark-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-4 py-2 text-sm ${
              tab === t ? "border-b-2 border-ark-accent text-slate-100" : "text-slate-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview server={server} />}
      {tab === "Settings" &&
        (config ? (
          <SettingsForm key={configKey} serverId={id} game={server.game} map={server.map} initial={config} />
        ) : (
          <div className="text-slate-400">Loading settings…</div>
        ))}
      {tab === "Mods" && <ModsTab serverId={id} game={server.game} />}
      {tab === "Console" && <RconConsole serverId={id} />}
      {tab === "Schedules" && <ScheduleList serverId={id} />}
      {tab === "Backups" && <BackupsTab serverId={id} />}
    </div>
  );
}

function Overview({ server }: { server: ServerSummary }) {
  const rows: [string, string][] = [
    ["Game", server.game],
    ["Map", mapLabel(server.map)],
    ["Game port", `${server.ports.game}/udp`],
    ["Query port", `${server.ports.query}/udp`],
    ["RCON port", `${server.ports.rcon}/tcp`],
    ["Max players", String(server.maxPlayers)],
    ["Mods", server.modIds.length ? server.modIds.join(", ") : "none"],
    ["Cluster", server.clusterId ?? "—"],
    ["RAM limit", server.ramLimitMb ? `${server.ramLimitMb} MB` : "unset"],
  ];
  return (
    <div className="card">
      <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-ark-border/50 pb-2">
            <dt className="text-slate-400">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

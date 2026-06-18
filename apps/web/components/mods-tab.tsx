"use client";
import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Trash2, ArrowUp, ArrowDown, Package, Download } from "lucide-react";
import { Game } from "@ark/shared";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

interface ModInstall {
  id: string;
  loadOrder: number;
  enabled: boolean;
  pinnedVersion: string | null;
  mod: { remoteId: string; name: string; thumbnailUrl: string | null; source: string };
}
interface BrowseResult {
  remoteId: number;
  name: string;
  summary: string;
  thumbnailUrl: string | null;
  downloadCount: number;
  authors: string[];
}

export function ModsTab({ serverId, game }: { serverId: string; game: Game }) {
  const [installed, setInstalled] = useState<ModInstall[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BrowseResult[]>([]);
  const [manualId, setManualId] = useState("");
  const [browseError, setBrowseError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    apiGet<ModInstall[]>(`/servers/${serverId}/mods`).then(setInstalled).catch(() => undefined);
  }, [serverId]);
  useEffect(() => refresh(), [refresh]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrowseError(null);
    try {
      setResults(
        await apiGet<BrowseResult[]>(
          `/mods/browse?game=${game}&query=${encodeURIComponent(query)}`,
        ),
      );
    } catch (err) {
      setBrowseError((err as Error).message);
    }
  };

  const install = async (remoteId: number, name?: string, thumbnailUrl?: string | null) => {
    try {
      await apiPost(`/servers/${serverId}/mods`, { remoteId, name, thumbnailUrl });
      refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...installed];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setInstalled(next);
    await apiPost(`/servers/${serverId}/mods/reorder`, { order: next.map((m) => m.id) });
    refresh();
  };

  const toggle = async (m: ModInstall) => {
    await apiPatch(`/servers/${serverId}/mods/${m.id}/enabled`, { enabled: !m.enabled });
    refresh();
  };

  const remove = async (m: ModInstall) => {
    await apiDelete(`/servers/${serverId}/mods/${m.id}`);
    refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ark-accent2">
          <Package className="h-4 w-4" /> Installed ({installed.length}) — load order
        </h3>
        {installed.length === 0 && <div className="card text-slate-400">No mods installed.</div>}
        {installed.map((m, i) => (
          <div key={m.id} className="card flex items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3">
              <span className="w-6 text-center text-xs text-slate-500">{i + 1}</span>
              <div>
                <div className={m.enabled ? "" : "line-through opacity-50"}>{m.mod.name}</div>
                <div className="text-xs text-slate-500">#{m.mod.remoteId}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="btn-secondary px-2" onClick={() => move(i, -1)}>
                <ArrowUp className="h-4 w-4" />
              </button>
              <button className="btn-secondary px-2" onClick={() => move(i, 1)}>
                <ArrowDown className="h-4 w-4" />
              </button>
              <button className="btn-secondary px-2" onClick={() => toggle(m)}>
                {m.enabled ? "On" : "Off"}
              </button>
              <button className="btn-danger px-2" onClick={() => remove(m)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        <form onSubmit={(e) => { e.preventDefault(); if (manualId) install(Number(manualId)); setManualId(""); }} className="card flex gap-2">
          <input
            className="input"
            placeholder="Add by mod ID (works without API key)"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
          />
          <button className="btn-primary">
            <Plus className="h-4 w-4" /> Add
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ark-accent2">
          <Search className="h-4 w-4" /> {game === Game.ASA ? "CurseForge" : "Steam Workshop"} browser
        </h3>
        <form onSubmit={search} className="flex gap-2">
          <input
            className="input"
            placeholder="Search mods…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-primary">
            <Search className="h-4 w-4" />
          </button>
        </form>
        {browseError && <p className="text-sm text-amber-400">{browseError}</p>}
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.remoteId} className="card flex items-start justify-between gap-3">
              <div className="flex gap-3">
                {r.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.thumbnailUrl} alt="" className="h-12 w-12 rounded object-cover" />
                )}
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="line-clamp-2 text-xs text-slate-400">{r.summary}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    #{r.remoteId} · {r.downloadCount.toLocaleString()} downloads
                  </div>
                </div>
              </div>
              <button className="btn-primary shrink-0" onClick={() => install(r.remoteId, r.name, r.thumbnailUrl)}>
                <Download className="h-4 w-4" /> Install
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

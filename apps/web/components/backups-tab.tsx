"use client";
import { useCallback, useEffect, useState } from "react";
import { Archive, DatabaseBackup, RotateCcw, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

interface Snapshot {
  id: string;
  reason: string;
  path: string;
  createdAt: string;
}

export function BackupsTab({ serverId }: { serverId: string }) {
  const [backups, setBackups] = useState<Snapshot[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    apiGet<Snapshot[]>(`/servers/${serverId}/backups`).then(setBackups).catch(() => undefined);
  }, [serverId]);
  useEffect(() => refresh(), [refresh]);

  const create = async () => {
    setBusy(true);
    try {
      await apiPost(`/servers/${serverId}/backups`);
      refresh();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async (id: string) => {
    if (!confirm("Restore this backup? The server must be stopped; current saves are snapshotted first.")) return;
    await apiPost(`/servers/${serverId}/backups/${id}/restore`).catch((e) => alert(e.message));
  };

  const remove = async (id: string) => {
    await apiDelete(`/backups/${id}`).catch(() => undefined);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Backups copy the saved world. The newest 10 are kept; scheduled/disruptive actions
          snapshot automatically.
        </p>
        <button className="btn-primary" onClick={create} disabled={busy}>
          <DatabaseBackup className="h-4 w-4" /> {busy ? "Backing up…" : "Back up now"}
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="card text-slate-400">No backups yet.</div>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive className="h-5 w-5 text-ark-accent2" />
                <div>
                  <div className="font-medium">{new Date(b.createdAt).toLocaleString()}</div>
                  <div className="text-xs text-slate-500">{b.reason}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary" onClick={() => restore(b.id)}>
                  <RotateCcw className="h-4 w-4" /> Restore
                </button>
                <button className="btn-danger px-2" onClick={() => remove(b.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";

interface Schedule {
  id: string;
  name: string;
  cron: string;
  action: string;
  warnMinutes: number;
  enabled: boolean;
  lastRunAt: string | null;
}

const ACTIONS = ["restart", "update", "backup", "stop", "start"];

export function ScheduleList({ serverId }: { serverId: string }) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form, setForm] = useState({ name: "", cron: "0 5 * * *", action: "restart", warnMinutes: 10 });

  const refresh = useCallback(() => {
    apiGet<Schedule[]>(`/schedules?serverId=${serverId}`).then(setSchedules).catch(() => undefined);
  }, [serverId]);
  useEffect(() => refresh(), [refresh]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiPost("/schedules", { ...form, serverId, warnMinutes: Number(form.warnMinutes) });
      setForm({ name: "", cron: "0 5 * * *", action: "restart", warnMinutes: 10 });
      refresh();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const remove = async (id: string) => {
    await apiDelete(`/schedules/${id}`).catch(() => undefined);
    refresh();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="card grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Cron</label>
          <input className="input font-mono" value={form.cron} onChange={(e) => setForm((f) => ({ ...f, cron: e.target.value }))} />
        </div>
        <div>
          <label className="label">Action</label>
          <select className="input" value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}>
            {ACTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Warn (min)</label>
          <input
            type="number"
            className="input"
            value={form.warnMinutes}
            onChange={(e) => setForm((f) => ({ ...f, warnMinutes: Number(e.target.value) }))}
          />
        </div>
        <div className="md:col-span-5">
          <button className="btn-primary">
            <Plus className="h-4 w-4" /> Add schedule
          </button>
        </div>
      </form>

      {schedules.length === 0 ? (
        <div className="card text-slate-400">No schedules. Disruptive actions take a save snapshot first.</div>
      ) : (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-ark-accent2" />
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-400">
                    <span className="font-mono">{s.cron}</span> · {s.action} · warn {s.warnMinutes}m
                    {s.lastRunAt ? ` · last ${new Date(s.lastRunAt).toLocaleString()}` : ""}
                  </div>
                </div>
              </div>
              <button className="btn-danger" onClick={() => remove(s.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

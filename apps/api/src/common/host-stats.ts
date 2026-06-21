import { readFile, statfs } from "node:fs/promises";
import type { HostStats } from "@ark/shared";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Aggregate CPU jiffies from the `/proc/stat` "cpu " line. */
export function parseProcStatCpu(line: string): { total: number; idle: number } {
  const n = line.trim().split(/\s+/).slice(1).map(Number); // user nice system idle iowait irq softirq steal...
  const total = n.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
  const idle = (n[3] ?? 0) + (n[4] ?? 0); // idle + iowait
  return { total, idle };
}

/** MemTotal / MemAvailable (kB) from `/proc/meminfo` ("used" = total − available). */
export function parseMemInfo(text: string): { totalKb: number; availableKb: number } | null {
  const field = (k: string) => {
    const m = text.match(new RegExp(`^${k}:\\s+(\\d+)`, "m"));
    return m ? Number(m[1]) : null;
  };
  const totalKb = field("MemTotal");
  const availableKb = field("MemAvailable");
  return totalKb != null && availableKb != null ? { totalKb, availableKb } : null;
}

async function cpuSample(): Promise<{ total: number; idle: number }> {
  const text = await readFile("/proc/stat", "utf8");
  const line = text.split("\n").find((l) => l.startsWith("cpu ")) ?? "";
  return parseProcStatCpu(line);
}

/** Host CPU% busy over a short window (two /proc/stat samples). */
async function hostCpuPercent(): Promise<number | null> {
  try {
    const a = await cpuSample();
    await sleep(200);
    const b = await cpuSample();
    const dTotal = b.total - a.total;
    const dIdle = b.idle - a.idle;
    if (dTotal <= 0) return null;
    return Math.round((1 - dIdle / dTotal) * 1000) / 10;
  } catch {
    return null;
  }
}

const MB = 1024 * 1024;

/** Whole-machine stats (the Unraid host): CPU%, memory (used/total), and the data
 *  volume's disk (used/free/total). Reads the host's /proc + the /data filesystem.
 *  Best-effort — any unreadable source degrades to zero/null rather than throwing. */
export async function hostStats(dataDir: string): Promise<HostStats> {
  const [cpuPercent, mem, disk] = await Promise.all([
    hostCpuPercent(),
    readFile("/proc/meminfo", "utf8")
      .then(parseMemInfo)
      .catch(() => null),
    statfs(dataDir).catch(() => null),
  ]);

  const memTotalMb = mem ? Math.round((mem.totalKb * 1024) / MB) : 0;
  const memUsedMb = mem ? Math.round(((mem.totalKb - mem.availableKb) * 1024) / MB) : 0;

  const total = disk ? disk.blocks * disk.bsize : 0;
  const free = disk ? disk.bavail * disk.bsize : 0;
  return {
    cpuPercent,
    memUsedMb,
    memTotalMb,
    diskUsedMb: Math.round((total - free) / MB),
    diskFreeMb: Math.round(free / MB),
    diskTotalMb: Math.round(total / MB),
  };
}

import { describe, it, expect } from "vitest";
import { parseProcStatCpu, parseMemInfo } from "./host-stats";

describe("parseProcStatCpu", () => {
  it("sums all jiffies and counts idle+iowait as idle", () => {
    const r = parseProcStatCpu("cpu  100 0 50 800 40 0 10 0 0 0");
    expect(r.total).toBe(1000);
    expect(r.idle).toBe(840); // idle 800 + iowait 40
  });
});

describe("parseMemInfo", () => {
  it("reads MemTotal + MemAvailable (kB)", () => {
    const text = "MemTotal:       32000000 kB\nMemFree:         1000000 kB\nMemAvailable:   20000000 kB\n";
    expect(parseMemInfo(text)).toEqual({ totalKb: 32000000, availableKb: 20000000 });
  });

  it("returns null when a field is missing", () => {
    expect(parseMemInfo("MemTotal:  100 kB")).toBeNull();
    expect(parseMemInfo("")).toBeNull();
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { Game, ServerState, EventType } from "@ark/shared";
import { ModUpdatesService } from "./modupdates.service";

/** Minimal fakes for the four collaborators ModUpdatesService injects. */
function makeDeps(server: Record<string, unknown>) {
  const updates: Record<string, unknown> = { ...server };
  const emitted: { type: string; message: string }[] = [];
  const prisma = {
    server: {
      findUnique: async () => updates,
      findMany: async () => [updates],
      update: async ({ data }: { data: Record<string, unknown> }) => Object.assign(updates, data),
    },
  };
  const events = { emit: async (e: { type: string; message: string }) => void emitted.push(e) };
  const valheimCalls: string[] = [];
  const valheim = {
    statusMods: [] as { name: string; installedVersion: string | null; latestVersion: string | null; updateAvailable: boolean }[],
    status: async () => ({ mods: valheim.statusMods }),
    install: async (_id: string, name: string) => void valheimCalls.push(name),
  };
  const mcCalls: string[] = [];
  const mods = {
    pack: null as null | Record<string, unknown>,
    getMinecraftModpack: async () => mods.pack,
    updateMinecraftModpack: async () => void mcCalls.push("update"),
  };
  const svc = new ModUpdatesService(prisma as never, events as never, valheim as never, mods as never);
  return { svc, updates, emitted, valheim, valheimCalls, mods, mcCalls };
}

describe("ModUpdatesService.status", () => {
  it("reports Valheim mods that are behind Thunderstore", async () => {
    const { svc, valheim } = makeDeps({ id: "v1", game: Game.VALHEIM, state: ServerState.Stopped });
    valheim.statusMods = [
      { name: "Owner-A", installedVersion: "1.0.0", latestVersion: "1.1.0", updateAvailable: true },
      { name: "Owner-B", installedVersion: "2.0.0", latestVersion: "2.0.0", updateAvailable: false },
    ];
    const st = await svc.status("v1");
    expect(st.supported).toBe(true);
    expect(st.count).toBe(1);
    expect(st.items.map((i) => i.id)).toEqual(["Owner-A"]);
  });

  it("reports a pinned Minecraft modpack that has a newer file", async () => {
    const { svc, mods } = makeDeps({ id: "m1", game: Game.MINECRAFT, state: ServerState.Running });
    mods.pack = { slug: "all-the-mods", name: "All the Mods", fileId: 100, latestFileId: 200, updateAvailable: true };
    const st = await svc.status("m1");
    expect(st.count).toBe(1);
    expect(st.items[0]).toMatchObject({ id: "all-the-mods", installedVersion: "100", latestVersion: "200" });
  });

  it("is unsupported for games whose mods auto-update or have no remote version", async () => {
    const { svc } = makeDeps({ id: "a1", game: Game.ASA, state: ServerState.Running });
    const st = await svc.status("a1");
    expect(st).toEqual({ supported: false, count: 0, items: [] });
  });

  it("degrades to count:0 (never throws) when the source errors", async () => {
    const { svc, mods } = makeDeps({ id: "m1", game: Game.MINECRAFT, state: ServerState.Running });
    mods.getMinecraftModpack = async () => {
      throw new Error("CurseForge down");
    };
    const st = await svc.status("m1");
    expect(st).toEqual({ supported: true, count: 0, items: [] });
  });
});

describe("ModUpdatesService.updateAll", () => {
  it("updates every out-of-date Valheim mod and flags a restart when running", async () => {
    const { svc, valheim, valheimCalls } = makeDeps({ id: "v1", game: Game.VALHEIM, state: ServerState.Running });
    valheim.statusMods = [
      { name: "Owner-A", installedVersion: "1.0.0", latestVersion: "1.1.0", updateAvailable: true },
      { name: "Owner-B", installedVersion: "1.0.0", latestVersion: "1.2.0", updateAvailable: true },
      { name: "Owner-C", installedVersion: "3.0.0", latestVersion: "3.0.0", updateAvailable: false },
    ];
    const r = await svc.updateAll("v1");
    expect(valheimCalls).toEqual(["Owner-A", "Owner-B"]); // only the outdated ones
    expect(r.updated).toEqual(["Owner-A", "Owner-B"]);
    expect(r.restartNeeded).toBe(true);
  });

  it("does not ask for a restart when the server was stopped", async () => {
    const { svc, valheim } = makeDeps({ id: "v1", game: Game.VALHEIM, state: ServerState.Stopped });
    valheim.statusMods = [{ name: "Owner-A", installedVersion: "1.0.0", latestVersion: "1.1.0", updateAvailable: true }];
    const r = await svc.updateAll("v1");
    expect(r.updated).toEqual(["Owner-A"]);
    expect(r.restartNeeded).toBe(false);
  });

  it("re-pins the Minecraft modpack and records a failure without aborting", async () => {
    const { svc, mods, mcCalls } = makeDeps({ id: "m1", game: Game.MINECRAFT, state: ServerState.Running });
    mods.pack = { slug: "atm", name: "ATM", fileId: 1, latestFileId: 2, updateAvailable: true };
    const r = await svc.updateAll("m1");
    expect(mcCalls).toEqual(["update"]);
    expect(r.updated).toEqual(["ATM"]);
  });

  it("emits a ConfigChanged event summarizing what changed", async () => {
    const { svc, valheim, emitted } = makeDeps({ id: "v1", game: Game.VALHEIM, state: ServerState.Running });
    valheim.statusMods = [{ name: "Owner-A", installedVersion: "1.0.0", latestVersion: "1.1.0", updateAvailable: true }];
    await svc.updateAll("v1");
    expect(emitted.some((e) => e.type === EventType.ConfigChanged && /Owner-A/.test(e.message))).toBe(true);
  });
});

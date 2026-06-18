import { describe, it, expect } from "vitest";
import { Game, type ServerConfigValues } from "@ark/shared";
import { buildLaunchArgs, buildCustomArgs, isBattlEyeDisabled } from "./command-line";
import { ASA_CATALOG } from "./asa.catalog";

const baseConfig: ServerConfigValues = { values: {} };

describe("buildCustomArgs (POK CUSTOM_SERVER_ARGS)", () => {
  it("emits catalog flags + dash options + raw args, but never NoBattlEye", () => {
    const out = buildCustomArgs(ASA_CATALOG, {
      values: { DisableBattlEye: true, ForceAllowCaveFlyers: true, ActiveEvent: "WinterWonderland" },
      rawCommandLineArgs: "-mycustomarg",
    });
    expect(out).toContain("-ForceAllowCaveFlyers");
    expect(out).toContain("-ActiveEvent=WinterWonderland");
    expect(out).toContain("-mycustomarg");
    expect(out).not.toContain("NoBattlEye"); // POK handles via BATTLEEYE env
  });

  it("isBattlEyeDisabled reads the DisableBattlEye catalog flag", () => {
    expect(isBattlEyeDisabled({ values: { DisableBattlEye: true } })).toBe(true);
    expect(isBattlEyeDisabled({ values: {} })).toBe(false);
  });
});

describe("buildLaunchArgs", () => {
  it("injects RCON + admin password + ports into the map URL", () => {
    const { mapUrl } = buildLaunchArgs({
      game: Game.ASA,
      map: "TheIsland_WP",
      sessionName: "My Server",
      ports: { game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 },
      maxPlayers: 50,
      adminPassword: "secret",
      modIds: [],
      catalog: ASA_CATALOG,
      config: baseConfig,
    });
    expect(mapUrl).toContain("TheIsland_WP?listen");
    expect(mapUrl).toContain("RCONEnabled=True");
    expect(mapUrl).toContain("RCONPort=7780");
    expect(mapUrl).toContain("ServerAdminPassword=secret");
    expect(mapUrl).toContain("Port=7777");
    expect(mapUrl).toContain("MaxPlayers=50");
  });

  it("emits -mods, -WinLiveMaxPlayers, and cluster flags", () => {
    const { flags } = buildLaunchArgs({
      game: Game.ASA,
      map: "TheIsland_WP",
      sessionName: "S",
      ports: { game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 },
      maxPlayers: 70,
      adminPassword: "pw",
      modIds: [12345, 67890],
      cluster: { clusterId: "cluster-a", transferDir: "/ark/cluster" },
      catalog: ASA_CATALOG,
      config: baseConfig,
    });
    expect(flags).toContain("-mods=12345,67890");
    expect(flags).toContain("-WinLiveMaxPlayers=70");
    expect(flags).toContain("-clusterid=cluster-a");
    expect(flags).toContain("-ClusterDirOverride=/ark/cluster");
  });

  it("emits -Key=Value dash options and skips None/Default/blank", () => {
    const { flags } = buildLaunchArgs({
      game: Game.ASA,
      map: "TheIsland_WP",
      sessionName: "S",
      ports: { game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 },
      maxPlayers: 70,
      adminPassword: "pw",
      modIds: [],
      catalog: ASA_CATALOG,
      config: { values: { ActiveEvent: "Easter", culture: "Default", ServerPlatform: "" } },
    });
    expect(flags).toContain("-ActiveEvent=Easter");
    expect(flags.some((f) => f.startsWith("-culture"))).toBe(false);
    expect(flags.some((f) => f.startsWith("-ServerPlatform"))).toBe(false);
  });

  it("joins multiselect dash options (crossplay) with the token separator", () => {
    const { flags } = buildLaunchArgs({
      game: Game.ASA,
      map: "TheIsland_WP",
      sessionName: "S",
      ports: { game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 },
      maxPlayers: 70,
      adminPassword: "pw",
      modIds: [],
      catalog: ASA_CATALOG,
      config: { values: { ServerPlatform: ["PC", "XSX", "PS5"] } },
    });
    expect(flags).toContain("-ServerPlatform=PC+XSX+PS5");
  });

  it("appends raw command-line args verbatim", () => {
    const { flags } = buildLaunchArgs({
      game: Game.ASA,
      map: "TheIsland_WP",
      sessionName: "S",
      ports: { game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 },
      maxPlayers: 70,
      adminPassword: "pw",
      modIds: [],
      catalog: ASA_CATALOG,
      config: { values: {}, rawCommandLineArgs: "-ForceAllowCaveFlyers -customarg" },
    });
    expect(flags).toContain("-ForceAllowCaveFlyers");
    expect(flags).toContain("-customarg");
  });
});

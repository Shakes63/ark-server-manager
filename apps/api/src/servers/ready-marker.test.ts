import { describe, it, expect } from "vitest";
import { Game } from "@ark/shared";
import { readyReFor } from "./servers.service";

// readyReFor(game) is the marker that flips a server to Running — evaluated only
// against that game's own logs. ASA only becomes joinable at "advertising for join"
// — the earlier "has successfully started!" / "Full Startup:" markers fire ~30s
// before that and must NOT count as ready.
describe("readiness markers (per-game)", () => {
  const ark = readyReFor(Game.ASA); // ASA + ASE share the ARK marker
  const REAL_ASA =
    "[2026.06.19-23.14.24:284][237]Server has completed startup and is now advertising for join. (10.19GB Mem)";
  const WAITING =
    "[INFO] Waiting for startup completion markers: 'Full Startup:' or 'Server has completed startup and is now advertising for join'";

  it("matches the real ASA 'advertising for join' completion line", () => {
    expect(ark.test(REAL_ASA)).toBe(true);
  });

  it("does NOT flip on the early 'has successfully started!' line", () => {
    expect(ark.test('[2026.06.20-21.18.11:312][ 12]Server: "E2E Test" has successfully started!')).toBe(false);
  });

  it("does NOT flip on the early 'Full Startup:' line", () => {
    expect(ark.test("[ 12]Full Startup: 112.34 seconds")).toBe(false);
  });

  it("does NOT match POK's 'Waiting for startup completion markers' line", () => {
    expect(ark.test(WAITING)).toBe(false);
  });

  it("matches the hermsi/ASE 'server is up' line", () => {
    expect(readyReFor(Game.ASE).test("[arkmanager] server is up")).toBe(true);
  });

  // Conan (acekorneya): the "Startup report" line fires once when startup
  // completes; the earlier RCON-ready / engine-init lines (~30s sooner) must not.
  const conan = readyReFor(Game.CONAN);
  const REAL_CONAN =
    "[2026.06.21-21.55.53:143][  0]LogServerStats: Startup report. StartupTime=36 Name=Krusty the Barbarian Map=ConanSandbox QueryPort=7779 Type=1 Region=1 MaxPlayers=70";

  it("matches the real Conan 'Startup report' completion line", () => {
    expect(conan.test(REAL_CONAN)).toBe(true);
  });

  it("does NOT flip on Conan's earlier RCON-ready / engine-init lines", () => {
    expect(conan.test("[  0]LogRcon: Display: Rcon is ready for client connections on 0.0.0.0:7780!")).toBe(false);
    expect(conan.test("[  0]LogInit: Display: Engine is initialized. Leaving FEngineLoop::Init()")).toBe(false);
  });

  it("matches the real Palworld 'Running ... dedicated server' line", () => {
    expect(readyReFor(Game.PALWORLD).test("Running Palworld dedicated server on :7777")).toBe(true);
  });

  it("flips the Wine variant on the ripps818 image's 'Starting the gameserver' line", () => {
    const wine = readyReFor(Game.PALWORLD_WINE);
    expect(wine.test(">>> Starting the gameserver")).toBe(true);
    // Must NOT flip on the earlier "Preparing to start" / "server manager" lines.
    expect(wine.test(">>> Preparing to start the gameserver")).toBe(false);
    expect(wine.test(">>> Starting server manager")).toBe(false);
  });

  it("matches OpenTTD's 'Starting dedicated server' line", () => {
    expect(
      readyReFor(Game.OPENTTD).test("[2026-07-11 20:16:51] dbg: [net:3] Starting dedicated server, version 15.3"),
    ).toBe(true);
  });

  it("matches the Minecraft 'Done (Ns)! For help' line", () => {
    expect(readyReFor(Game.MINECRAFT).test('[Server thread/INFO]: Done (8.488s)! For help, type "help"')).toBe(
      true,
    );
  });

  // Icarus (mornedhels, no RCON): the Unreal server binds its game port and the
  // GameMode reaches the lobby — verified against a real boot.
  const icarus = readyReFor(Game.ICARUS);
  it("matches the real Icarus 'port bound' + lobby lines", () => {
    expect(icarus.test("icarus-server LogNet: Display: SteamNetDriver_2147481990 bound to port 17777")).toBe(
      true,
    );
    expect(
      icarus.test("icarus-server LogGameMode: Display: Match State Changed from EnteringMap to WaitingToStart"),
    ).toBe(true);
  });

  // The per-game split is what prevents cross-contamination: Icarus's generic
  // Unreal lines must NOT be treated as ready by the (also-Unreal) ARK marker, and
  // "Engine is initialized" (Conan's too-early line) must not count for anyone here.
  it("keeps Icarus's Unreal lines from flipping the ARK games", () => {
    expect(ark.test("LogNet: Display: SteamNetDriver_2147481990 bound to port 17777")).toBe(false);
    expect(ark.test("LogGameMode: Display: Match State Changed from EnteringMap to WaitingToStart")).toBe(false);
  });
});

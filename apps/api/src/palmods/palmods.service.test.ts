import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PalModsService, UE4SS_LINUX } from "./palmods.service";

/** UE4SS ships GuiConsoleEnabled=1 (no display on a dedicated server) and
 *  bUseUObjectArrayCache=true (crashes Palworld). Both must be flipped on install. */
describe("UE4SS headless settings patch", () => {
  let dir: string;
  const svc = new PalModsService({} as never);
  // makeHeadlessSafe is private; it's the whole point of the install path.
  const patch = (d: string) => (svc as unknown as { makeHeadlessSafe(d: string): Promise<void> }).makeHeadlessSafe(d);

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "palmods-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("flips both hazardous defaults, preserving the rest of the file", async () => {
    await writeFile(
      join(dir, "UE4SS-settings.ini"),
      ["[General]", "EnableHotReloadSystem = 1", "bUseUObjectArrayCache = true", "", "[Debug]", "ConsoleEnabled = 1", "GuiConsoleEnabled = 1", ""].join("\n"),
    );
    await patch(dir);
    const out = await readFile(join(dir, "UE4SS-settings.ini"), "utf8");
    expect(out).toContain("bUseUObjectArrayCache = false");
    expect(out).toContain("GuiConsoleEnabled = 0");
    // Untouched keys survive — including ConsoleEnabled, which is fine headless.
    expect(out).toContain("EnableHotReloadSystem = 1");
    expect(out).toContain("ConsoleEnabled = 1");
    expect(out).toContain("[Debug]");
  });

  it("does not rewrite GuiConsoleEnabled into a capture-group artifact", async () => {
    await writeFile(join(dir, "UE4SS-settings.ini"), "GuiConsoleEnabled = 1\n");
    await patch(dir);
    // "$10" would have produced "GuiConsoleEnabled = 1" (group 1 + '0') or worse.
    expect(await readFile(join(dir, "UE4SS-settings.ini"), "utf8")).toBe("GuiConsoleEnabled = 0\n");
  });

  it("is a no-op when the archive has no UE4SS-settings.ini", async () => {
    await expect(patch(dir)).resolves.toBeUndefined();
  });

  it("pins an exact release asset and digest (never 'latest')", () => {
    expect(UE4SS_LINUX.url).toMatch(/\/releases\/download\/linux-experiment\/UE4SS_0\.0\.0\.zip$/);
    expect(UE4SS_LINUX.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

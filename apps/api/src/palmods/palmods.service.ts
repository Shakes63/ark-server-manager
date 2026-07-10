import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readdir, readFile, rm, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";
import { Game, type ServerConfigValues } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LocalPaths } from "../common/paths";

const execFileP = promisify(execFile);

/** UE4SS drops its loader here; the server is launched with this on LD_PRELOAD
 *  (set by buildPalworldSpec when the framework is enabled). Official UE4SS is
 *  Windows-only — the Linux .so comes from the experimental fork
 *  https://github.com/Yangff/RE-UE4SS/releases/tag/linux-experiment (libUE4SS.so
 *  sits at the archive root, so extracting into Pal/Binaries/Linux lands it here). */
export const PAL_FRAMEWORK_DEFAULT_PRELOAD = "Pal/Binaries/Linux/libUE4SS.so";

/**
 * The one-click UE4SS install. Pinned to an exact release asset (not "latest"):
 * this is an unofficial fork whose artifact gets preloaded into the game process,
 * so we verify its digest before extracting rather than trusting whatever the URL
 * serves today. Bump BOTH fields together when moving to a newer build.
 */
export const UE4SS_LINUX = {
  url: "https://github.com/Yangff/RE-UE4SS/releases/download/linux-experiment/UE4SS_0.0.0.zip",
  sha256: "69d619b17596a4244d9af48cf6d690dc9946bc15fab2fd0df540f6ab99598b21",
  releasePage: "https://github.com/Yangff/RE-UE4SS/releases/tag/linux-experiment",
} as const;

const UE4SS_DOWNLOAD_TIMEOUT_MS = 60_000;

/**
 * Palworld isn't on Steam Workshop, so mods are managed as files in the bind-mounted
 * instance dir: .pak content mods in Pal/Content/Paks/~mods, and a server-side mod
 * framework (UE4SS) in Pal/Binaries/Linux loaded via LD_PRELOAD.
 *
 * We run the native Linux binary, so only Lua/Blueprint mods load. DLL-based mods
 * (PalGuard, PalDefender) need the Windows server under Wine and cannot work here.
 */
@Injectable()
export class PalModsService {
  constructor(private readonly prisma: PrismaService) {}

  private async palServer(id: string) {
    const s = await this.prisma.server.findUnique({ where: { id } });
    if (!s) throw new NotFoundException("Server not found");
    if (s.game !== Game.PALWORLD) throw new BadRequestException("Mod files are Palworld-only here");
    return s;
  }
  private paksDir(id: string): string {
    return join(LocalPaths.instanceRoot(id), "Pal/Content/Paks/~mods");
  }
  private frameworkDir(id: string): string {
    return join(LocalPaths.instanceRoot(id), "Pal/Binaries/Linux");
  }

  async status(id: string) {
    const s = await this.palServer(id);
    const cfg = JSON.parse(s.configJson) as ServerConfigValues;
    const preload = (cfg.values?._palFrameworkPreload as string) || PAL_FRAMEWORK_DEFAULT_PRELOAD;
    let paks: string[] = [];
    try {
      paks = (await readdir(this.paksDir(id))).filter((f) => /\.(pak|ucas|utoc)$/i.test(f));
    } catch {
      /* dir not created yet */
    }
    let present = false;
    try {
      await stat(join(LocalPaths.instanceRoot(id), preload));
      present = true;
    } catch {
      /* framework lib not installed */
    }
    return { paks, framework: { enabled: Boolean(cfg.values?._palFramework), preload, present } };
  }

  /** Add a .pak (or .ucas/.utoc, or a .zip of them) to the ~mods folder. */
  async addPak(id: string, filename: string, data: Buffer) {
    await this.palServer(id);
    const safe = basename(filename);
    if (!/\.(pak|ucas|utoc|zip)$/i.test(safe)) {
      throw new BadRequestException("Upload a .pak / .ucas / .utoc (or a .zip containing them)");
    }
    const dir = this.paksDir(id);
    await mkdir(dir, { recursive: true });
    if (/\.zip$/i.test(safe)) await this.extractZip(data, dir);
    else await writeFile(join(dir, safe), data);
    return this.status(id);
  }

  async removePak(id: string, name: string) {
    await this.palServer(id);
    await rm(join(this.paksDir(id), basename(name)), { force: true });
    return this.status(id);
  }

  /** Toggle the mod framework on/off (and its LD_PRELOAD target). Takes effect on
   *  the next start — buildPalworldSpec reads these from config. */
  async setFramework(id: string, opts: { enabled?: boolean; preload?: string }) {
    const s = await this.palServer(id);
    const cfg = JSON.parse(s.configJson) as ServerConfigValues;
    const values: Record<string, unknown> = { ...(cfg.values ?? {}) };
    if (opts.enabled !== undefined) values._palFramework = opts.enabled;
    if (opts.preload !== undefined) {
      values._palFrameworkPreload = opts.preload.trim() || PAL_FRAMEWORK_DEFAULT_PRELOAD;
    }
    await this.prisma.server.update({
      where: { id },
      data: { configJson: JSON.stringify({ ...cfg, values }), configDirty: true },
    });
    return this.status(id);
  }

  /** Install a framework archive (UE4SS Linux build) into Pal/Binaries/Linux. */
  async installFramework(id: string, data: Buffer) {
    await this.palServer(id);
    const dir = this.frameworkDir(id);
    await mkdir(dir, { recursive: true });
    await this.extractZip(data, dir);
    await this.makeHeadlessSafe(dir);
    return this.status(id);
  }

  /**
   * UE4SS ships with GuiConsoleEnabled=1 and bUseUObjectArrayCache=true, neither of
   * which suits a headless dedicated server — the GUI console has no display to
   * attach to, and the object-array cache is the documented cause of crashes on
   * Palworld. Flip both after extracting so a fresh install just works.
   */
  private async makeHeadlessSafe(dir: string): Promise<void> {
    const file = join(dir, "UE4SS-settings.ini");
    let ini: string;
    try {
      ini = await readFile(file, "utf8");
    } catch {
      return; // not a UE4SS archive (or a layout we don't recognize) — leave it alone
    }
    // Function replacers, not "$10" — that reads as capture group 10, not group 1
    // followed by a zero.
    const patched = ini
      .replace(/^(\s*GuiConsoleEnabled\s*=\s*).*$/m, (_m, p1: string) => `${p1}0`)
      .replace(/^(\s*bUseUObjectArrayCache\s*=\s*).*$/m, (_m, p1: string) => `${p1}false`);
    if (patched !== ini) await writeFile(file, patched, "utf8");
  }

  /**
   * One-click: fetch the pinned UE4SS Linux build, verify its sha256, extract it
   * into Pal/Binaries/Linux (libUE4SS.so sits at the archive root, so it lands on
   * the default preload path), and enable the framework. Applies on next restart.
   */
  async installFrameworkFromUpstream(id: string) {
    await this.palServer(id);
    const data = await this.download(UE4SS_LINUX.url);

    const digest = createHash("sha256").update(data).digest("hex");
    if (digest !== UE4SS_LINUX.sha256) {
      // The pinned asset changed under us — refuse rather than preload an unknown
      // binary into the game process.
      throw new BadRequestException(
        `UE4SS download failed integrity check (expected ${UE4SS_LINUX.sha256.slice(0, 12)}…, got ${digest.slice(0, 12)}…). Install it manually from ${UE4SS_LINUX.releasePage}.`,
      );
    }

    await this.installFramework(id, data);
    // The archive must actually contain the loader at the DEFAULT path (not whatever
    // custom preload the server may have set), or enabling would start the server
    // with a dangling LD_PRELOAD.
    const loader = join(LocalPaths.instanceRoot(id), PAL_FRAMEWORK_DEFAULT_PRELOAD);
    if (!(await stat(loader).then(() => true).catch(() => false))) {
      throw new BadRequestException(
        `Extracted the archive but ${PAL_FRAMEWORK_DEFAULT_PRELOAD} is missing — the release layout may have changed.`,
      );
    }
    // Point the preload back at the default too: a stale custom path would silently
    // win over the loader we just installed.
    return this.setFramework(id, { enabled: true, preload: PAL_FRAMEWORK_DEFAULT_PRELOAD });
  }

  private async download(url: string): Promise<Buffer> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), UE4SS_DOWNLOAD_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal, redirect: "follow" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      throw new BadRequestException(`Could not download UE4SS: ${(e as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private async extractZip(data: Buffer, dest: string) {
    const tmp = join(tmpdir(), `palmod-upload-${process.pid}-${Date.now()}.zip`);
    await writeFile(tmp, data);
    try {
      await execFileP("unzip", ["-o", tmp, "-d", dest]);
    } catch (e) {
      throw new BadRequestException(`Could not unzip the upload: ${(e as Error).message}`);
    } finally {
      await rm(tmp, { force: true }).catch(() => undefined);
    }
  }
}

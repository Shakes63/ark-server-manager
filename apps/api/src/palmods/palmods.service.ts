import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readdir, rm, writeFile, stat } from "node:fs/promises";
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

  /** Install a framework archive (UE4SS/PalDefender Linux build) into Pal/Binaries/Linux. */
  async installFramework(id: string, data: Buffer) {
    await this.palServer(id);
    const dir = this.frameworkDir(id);
    await mkdir(dir, { recursive: true });
    await this.extractZip(data, dir);
    return this.status(id);
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

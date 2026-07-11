import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { mkdir, readdir, rm, writeFile, stat } from "node:fs/promises";
import { join, basename } from "node:path";
import { Game } from "@ark/shared";
import { PrismaService } from "../prisma/prisma.service";
import { LocalPaths } from "../common/paths";
import { extractZipSafe } from "../common/safe-extract";


/** Where the vinanrra image expects 7 Days to Die mods, relative to the instance root
 *  (the game install is bound at serverfiles/). Each mod is a folder holding a
 *  ModInfo.xml, loaded on the next server start. */
const SEVEN_DAYS_MODS_SUBPATH = "serverfiles/Mods";

/**
 * 7 Days to Die mods aren't on a central browser API — they're community folders
 * (from the official forums / NexusMods) dropped into the server's Mods/ directory.
 * This manages them as files in the bind-mounted install: a mod .zip is unpacked
 * into serverfiles/Mods and loads on the next start. Note two 7DTD quirks the UI
 * surfaces: every connecting player usually needs the same mods, and many mods need
 * EAC (Easy Anti-Cheat) turned off.
 */
@Injectable()
export class SevenDaysModsService {
  constructor(private readonly prisma: PrismaService) {}

  private async sdtdServer(id: string) {
    const s = await this.prisma.server.findUnique({ where: { id } });
    if (!s) throw new NotFoundException("Server not found");
    if (s.game !== Game.SEVEN_DAYS) throw new BadRequestException("Mod files are 7 Days to Die-only here");
    return s;
  }

  private modsDir(id: string): string {
    return join(LocalPaths.instanceRoot(id), SEVEN_DAYS_MODS_SUBPATH);
  }

  async status(id: string) {
    await this.sdtdServer(id);
    let mods: string[] = [];
    try {
      const entries = await readdir(this.modsDir(id), { withFileTypes: true });
      mods = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    } catch {
      /* dir not created yet */
    }
    return { mods };
  }

  /** Add a mod: upload a .zip and unpack it into the Mods/ folder. */
  async addMod(id: string, filename: string, data: Buffer) {
    await this.sdtdServer(id);
    const safe = basename(filename);
    if (!/\.zip$/i.test(safe)) {
      throw new BadRequestException("Upload a .zip containing the mod folder (with its ModInfo.xml)");
    }
    const dir = this.modsDir(id);
    await mkdir(dir, { recursive: true });
    await this.extractZip(data, dir);
    return this.status(id);
  }

  async removeMod(id: string, name: string) {
    await this.sdtdServer(id);
    const target = join(this.modsDir(id), basename(name));
    // Guard: only remove directories inside Mods/ (never a stray file path).
    const info = await stat(target).catch(() => null);
    if (!info?.isDirectory()) throw new NotFoundException("Mod not found");
    await rm(target, { recursive: true, force: true });
    return this.status(id);
  }

  private async extractZip(data: Buffer, dest: string) {
    // Untrusted upload → traversal-safe extraction (rejects ../ + absolute, strips symlinks).
    await extractZipSafe(data, dest);
  }
}

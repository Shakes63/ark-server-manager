import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractZipSafe, __test } from "./safe-extract";

const { isUnsafeEntry } = __test;

// Real zips (built with Python's zipfile, which — unlike the `zip` CLI — will store
// arbitrary entry names). EVIL has a `../ESCAPED.txt` entry; SAFE is a normal nested tree.
const EVIL_B64 =
  "UEsDBBQAAAAAACZy61x6zT+3BQAAAAUAAAAOAAAALi4vRVNDQVBFRC50eHRldmlsClBLAwQUAAAAAAAmcutcr11oLAUAAAAFAAAABgAAAG9rLnR4dGZpbmUKUEsBAhQDFAAAAAAAJnLrXHrNP7cFAAAABQAAAA4AAAAAAAAAAAAAAIABAAAAAC4uL0VTQ0FQRUQudHh0UEsBAhQDFAAAAAAAJnLrXK9daCwFAAAABQAAAAYAAAAAAAAAAAAAAIABMQAAAG9rLnR4dFBLBQYAAAAAAgACAHAAAABaAAAAAAA=";
const SAFE_B64 =
  "UEsDBBQAAAAAACZy61z7pH4CGgAAABoAAAANAAAAbWFuaWZlc3QuanNvbnsidmVyc2lvbl9udW1iZXIiOiIxLjAuMCJ9UEsDBBQAAAAAACZy61x6em/tAwAAAAMAAAAMAAAAc3ViL2ZpbGUudHh0aGkKUEsBAhQDFAAAAAAAJnLrXPukfgIaAAAAGgAAAA0AAAAAAAAAAAAAAIABAAAAAG1hbmlmZXN0Lmpzb25QSwECFAMUAAAAAAAmcutcenpv7QMAAAADAAAADAAAAAAAAAAAAAAAgAFFAAAAc3ViL2ZpbGUudHh0UEsFBgAAAAACAAIAdQAAAHIAAAAAAA==";

describe("safe-extract: entry vetting", () => {
  it("flags absolute + traversal entry names", () => {
    for (const bad of ["../x", "a/../b", "/etc/passwd", "foo/../../bar", "C:\\win\\x", "a\\..\\b"]) {
      expect(isUnsafeEntry(bad), bad).toBe(true);
    }
  });
  it("allows normal nested names", () => {
    for (const ok of ["a.txt", "sub/dir/file.dll", "manifest.json", "..dots..txt", "a..b/c"]) {
      expect(isUnsafeEntry(ok), ok).toBe(false);
    }
  });
});

describe("extractZipSafe (real unzip)", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "safe-extract-"));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("extracts a normal archive into the destination", async () => {
    await extractZipSafe(Buffer.from(SAFE_B64, "base64"), dir);
    const names = (await readdir(dir)).sort();
    expect(names).toContain("manifest.json");
    expect(JSON.parse(await readFile(join(dir, "manifest.json"), "utf8"))).toMatchObject({
      version_number: "1.0.0",
    });
  });

  it("REJECTS an archive containing a ../ traversal entry (nothing extracted)", async () => {
    await expect(extractZipSafe(Buffer.from(EVIL_B64, "base64"), dir)).rejects.toThrow(/unsafe path/i);
    // vetting happens before extraction → the destination stays empty.
    expect(await readdir(dir)).toEqual([]);
  });

  it("strips symlinks that survive extraction (defense-in-depth)", async () => {
    // extractZipSafe strips symlinks after unzip; simulate the post-extract state by
    // planting a symlink and running the (idempotent) strip via a fresh safe extract
    // that leaves the tree, then asserting no symlinks remain.
    await symlink("/etc/passwd", join(dir, "evil-link"));
    await writeFile(join(dir, "real.txt"), "x");
    await extractZipSafe(Buffer.from(SAFE_B64, "base64"), dir); // triggers stripSymlinks(dir)
    const entries = await readdir(dir, { withFileTypes: true });
    expect(entries.some((e) => e.isSymbolicLink()), "symlink was stripped").toBe(false);
    expect(entries.some((e) => e.name === "real.txt")).toBe(true); // real files untouched
  });
});

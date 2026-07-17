import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureSecrets } from "./ensure-secrets";

const KEYS = ["DATA_DIR", "SECRETS_KEY", "JWT_SECRET"] as const;
const quiet = () => undefined;

describe("ensureSecrets (first-run provisioning)", () => {
  let dir: string;
  const saved: Record<string, string | undefined> = {};

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "secrets-"));
    for (const k of KEYS) saved[k] = process.env[k];
    process.env.DATA_DIR = dir;
    delete process.env.SECRETS_KEY;
    delete process.env.JWT_SECRET;
  });
  afterEach(async () => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    await rm(dir, { recursive: true, force: true });
  });

  it("generates valid secrets and persists them when none are supplied", async () => {
    ensureSecrets(quiet);
    expect(process.env.SECRETS_KEY, "SECRETS_KEY").toMatch(/^[0-9a-f]{64}$/);
    expect((process.env.JWT_SECRET ?? "").length).toBeGreaterThanOrEqual(16);
    const stored = JSON.parse(await readFile(join(dir, ".secrets.json"), "utf8"));
    expect(stored.SECRETS_KEY).toBe(process.env.SECRETS_KEY);
    expect(stored.JWT_SECRET).toBe(process.env.JWT_SECRET);
  });

  it("reuses the persisted value on the next boot (stable across restarts)", async () => {
    ensureSecrets(quiet);
    const first = process.env.SECRETS_KEY;
    // Simulate a restart: the env var isn't set, but the file persists.
    delete process.env.SECRETS_KEY;
    delete process.env.JWT_SECRET;
    ensureSecrets(quiet);
    expect(process.env.SECRETS_KEY).toBe(first);
  });

  it("lets an explicit env value win and never copies it to disk", async () => {
    const mine = "a".repeat(64);
    process.env.SECRETS_KEY = mine;
    ensureSecrets(quiet);
    expect(process.env.SECRETS_KEY).toBe(mine);
    // JWT_SECRET was still auto-generated + persisted, but the BYO SECRETS_KEY is not.
    const stored = JSON.parse(await readFile(join(dir, ".secrets.json"), "utf8"));
    expect(stored.SECRETS_KEY).toBeUndefined();
    expect(stored.JWT_SECRET).toBe(process.env.JWT_SECRET);
  });

  it("regenerates when the persisted value is malformed", async () => {
    await writeFile(
      join(dir, ".secrets.json"),
      JSON.stringify({ SECRETS_KEY: "not-hex", JWT_SECRET: "short" }),
    );
    ensureSecrets(quiet);
    expect(process.env.SECRETS_KEY).toMatch(/^[0-9a-f]{64}$/);
    expect((process.env.JWT_SECRET ?? "").length).toBeGreaterThanOrEqual(16);
  });
});

import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";

/**
 * First-run secret provisioning — runs BEFORE {@link loadEnv} so a blank install boots.
 *
 * SECRETS_KEY (encrypts saved passwords) and JWT_SECRET (signs login sessions) must be
 * stable across restarts, but making the user run `openssl rand` before the container
 * will even start is the single biggest install barrier. So if either isn't supplied
 * via the environment, we generate a strong random value ONCE, persist it in the data
 * dir, and reuse it forever.
 *
 * Precedence per key: a valid env value always wins (bring-your-own / migration) → else
 * a previously-persisted value → else generate + persist. If we can't persist, we still
 * set it for this run but warn loudly, since a restart would otherwise rotate it (which
 * logs everyone out and, for SECRETS_KEY, makes saved passwords undecryptable).
 */
const SECRETS_FILE = ".secrets.json";

interface SecretSpec {
  gen: () => string;
  valid: (v: string) => boolean;
}

const SPECS: Record<string, SecretSpec> = {
  SECRETS_KEY: {
    gen: () => randomBytes(32).toString("hex"), // 64 hex chars
    valid: (v) => /^[0-9a-fA-F]{64}$/.test(v),
  },
  JWT_SECRET: {
    gen: () => randomBytes(24).toString("hex"),
    valid: (v) => typeof v === "string" && v.length >= 16,
  },
};

export function ensureSecrets(log: (msg: string) => void = console.log): void {
  const dataDir = process.env.DATA_DIR || "./data";
  const file = join(dataDir, SECRETS_FILE);

  let store: Record<string, string> = {};
  try {
    store = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
  } catch {
    /* first run, or unreadable — start empty */
  }

  let changed = false;
  for (const [key, spec] of Object.entries(SPECS)) {
    const fromEnv = process.env[key];
    if (fromEnv && spec.valid(fromEnv)) continue; // explicit env wins
    if (store[key] && spec.valid(store[key])) {
      process.env[key] = store[key]; // reuse the persisted value
      continue;
    }
    const value = spec.gen();
    store[key] = value;
    process.env[key] = value;
    changed = true;
    log(`[secrets] generated ${key} on first run — persisting to ${file}`);
  }

  if (!changed) return;
  try {
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(file, JSON.stringify(store, null, 2), { mode: 0o600 });
    chmodSync(file, 0o600); // tighten even if the file already existed
  } catch (e) {
    log(
      `[secrets] WARNING: could not persist ${file}: ${(e as Error).message}. ` +
        `The app will run, but a restart would rotate the generated secrets ` +
        `(logging everyone out). Set SECRETS_KEY/JWT_SECRET in the template to pin them.`,
    );
  }
}

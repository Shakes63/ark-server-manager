import { describe, it, expect, beforeAll } from "vitest";
import { Game } from "@ark/shared";
import { LocalPaths } from "./paths";

// Regression guard: saves live under a game-specific subdir, not the instance root.
// Pointing backup/restore/import at the root silently finds nothing (ENOENT).
beforeAll(() => {
  // loadEnv() validates required secrets; vitest doesn't load .env (see game-cache).
  process.env.DATA_DIR ??= "/data";
  process.env.SECRETS_KEY ??= "a".repeat(64);
  process.env.JWT_SECRET ??= "test-jwt-secret-1234";
});

describe("LocalPaths.savedDir", () => {
  it("resolves ARK saves to ShooterGame/Saved under the instance dir", () => {
    expect(LocalPaths.savedDir("s1", Game.ASA)).toMatch(/\/instances\/s1\/ShooterGame\/Saved$/);
    expect(LocalPaths.savedDir("s1", Game.ASE)).toMatch(/\/instances\/s1\/ShooterGame\/Saved$/);
  });
  it("resolves Conan saves to server/ConanSandbox/Saved", () => {
    expect(LocalPaths.savedDir("s1", Game.CONAN)).toMatch(
      /\/instances\/s1\/server\/ConanSandbox\/Saved$/,
    );
  });
});

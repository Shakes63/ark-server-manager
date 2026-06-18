import { describe, it, expect } from "vitest";
import { ServerState, canTransition } from "@ark/shared";

describe("server state machine", () => {
  it("allows Stopped → Starting → Running", () => {
    expect(canTransition(ServerState.Stopped, ServerState.Starting)).toBe(true);
    expect(canTransition(ServerState.Starting, ServerState.Running)).toBe(true);
  });

  it("rejects Stopped → Running (must go through Starting)", () => {
    expect(canTransition(ServerState.Stopped, ServerState.Running)).toBe(false);
  });

  it("allows recovery from Crashed", () => {
    expect(canTransition(ServerState.Crashed, ServerState.Starting)).toBe(true);
    expect(canTransition(ServerState.Crashed, ServerState.Stopped)).toBe(true);
  });

  it("rejects Running → Updating (must stop first)", () => {
    expect(canTransition(ServerState.Running, ServerState.Updating)).toBe(false);
  });
});

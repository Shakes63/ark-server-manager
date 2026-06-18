import { describe, it, expect } from "vitest";
import { derivePorts, nextBasePort, PORT_POOL_START, BLOCK_STRIDE } from "./ports";

describe("ports", () => {
  it("derives a contiguous block from a base", () => {
    expect(derivePorts(7777)).toEqual({ game: 7777, rawSocket: 7778, query: 7779, rcon: 7780 });
  });

  it("starts at the pool start when nothing is allocated", () => {
    expect(nextBasePort([])).toBe(PORT_POOL_START);
  });

  it("advances by the block stride past the highest used base", () => {
    expect(nextBasePort([7777, 7787])).toBe(7787 + BLOCK_STRIDE);
  });
});

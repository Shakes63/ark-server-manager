import { describe, it, expect } from "vitest";
import { parseAcfBuildId, pickPublicBuildId } from "./updates.service";

describe("parseAcfBuildId", () => {
  it("extracts the build id from a SteamCMD appmanifest", () => {
    const acf = [
      '"AppState"',
      "{",
      '\t"appid"\t\t"2430930"',
      '\t"Universe"\t\t"1"',
      '\t"buildid"\t\t"17284560"',
      '\t"name"\t\t"ARK Survival Ascended Dedicated Server"',
      "}",
    ].join("\n");
    expect(parseAcfBuildId(acf)).toBe(17284560);
  });

  it("returns null when there is no buildid", () => {
    expect(parseAcfBuildId('"AppState" {\n"appid" "2430930"\n}')).toBeNull();
    expect(parseAcfBuildId("")).toBeNull();
  });
});

describe("pickPublicBuildId", () => {
  it("reads data.<appid>.depots.branches.public.buildid", () => {
    const json = {
      data: { "2430930": { depots: { branches: { public: { buildid: "17284560" } } } } },
    };
    expect(pickPublicBuildId(json, 2430930)).toBe(17284560);
  });

  it("returns null for missing or malformed shapes", () => {
    expect(pickPublicBuildId({}, 2430930)).toBeNull();
    expect(pickPublicBuildId({ data: {} }, 2430930)).toBeNull();
    expect(pickPublicBuildId({ data: { "2430930": {} } }, 2430930)).toBeNull();
    expect(pickPublicBuildId(null, 2430930)).toBeNull();
  });
});

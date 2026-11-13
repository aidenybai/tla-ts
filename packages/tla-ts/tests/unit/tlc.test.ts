import { describe, expect, it } from "vite-plus/test";
import { checkFixture, getModuleLoader } from "./check-harness";

describe("TLCGet matches TLC", () => {
  it.each([
    ["Rich", [1121, 128, 9]],
    ["Inst", [46, 9, 4]],
    ["Subst", [5, 3, 3]],
    ["Unnamed", [5, 3, 3]],
    ["Param", [13, 4, 2]],
  ])("describes the %s specification as TLC does", async (name, counts) => {
    const result = await checkFixture("tlc-spec", name, name, {
      loadModule: getModuleLoader("tlc-spec"),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual(counts);
  });
});

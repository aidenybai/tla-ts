import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

describe("TLCGet matches TLC", () => {
  it.each([
    ["Rich", [1121, 128, 9]],
    ["Inst", [46, 9, 4]],
    ["Subst", [5, 3, 3]],
  ])("describes the %s specification as TLC does", async (name, counts) => {
    const directory = join(FIXTURES, "tlc-spec");
    const result = await check({
      source: readFileSync(join(directory, `${name}.tla`), "utf8"),
      config: readFileSync(join(directory, `${name}.cfg`), "utf8"),
      loadModule: (module) => readFileSync(join(directory, `${module}.tla`), "utf8"),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual(counts);
  });
});

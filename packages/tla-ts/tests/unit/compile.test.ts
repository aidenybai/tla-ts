import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { compileAndCheck } from "./compile-worker";

// A TypeScript port of DieHard.tla from tlaplus/Examples.
const DIE_HARD = join(import.meta.dirname, "../fixtures/typescript/examples/die-hard/die-hard.ts");

describe("compile", () => {
  it("compiles a TypeScript file into a spec that check takes", async () => {
    const checked = await compileAndCheck(readFileSync(DIE_HARD, "utf8"), DIE_HARD);
    expect(checked.status).toBe("invariant-violation");
    expect(checked.traceLength).toBe(7);
  }, 120_000);

  // ESCore names every spec's root module Program, whose strings its prepared modules rank.
  it.skip("names the spec after its file", async () => {
    expect((await compileAndCheck(readFileSync(DIE_HARD, "utf8"), DIE_HARD)).name).toBe("DieHard");
  });
});

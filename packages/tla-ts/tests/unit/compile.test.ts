import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, compile } from "../../src";
import { describe, expect, it } from "vite-plus/test";

// A TypeScript port of DieHard.tla from tlaplus/Examples.
const DIE_HARD = join(import.meta.dirname, "../fixtures/typescript/examples/die-hard/die-hard.ts");

describe("compile", () => {
  it("compiles a TypeScript file into a spec that check takes", async () => {
    const spec = await compile({ source: readFileSync(DIE_HARD, "utf8"), fileName: DIE_HARD });
    expect(spec.name).toBe("DieHard");
    const result = await check(spec);
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace.length).toBe(7);
  });
});

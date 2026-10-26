import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-statistics");

it("counts states for TLCGet while it generates them, as TLC does", async () => {
  const printed: string[] = [];
  const result = await check({
    source: readFileSync(join(DIRECTORY, "Statistics.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, "Statistics.cfg"), "utf8"),
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([15, 5, 3]);
  expect(printed).toEqual(
    readFileSync(join(DIRECTORY, "Statistics.out"), "utf8").trim().split("\n"),
  );
});

it("stops generating successors at the first violation", async () => {
  const printed: string[] = [];
  const result = await check({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' \\in {1, 2, 3} /\\ PrintT(<<x', TLCGet(\"generated\")>>)\nInv == x # 2\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("invariant-violation");
  expect(printed).toEqual(["<<1, 1>>", "<<2, 2>>"]);
  expect([result.generatedStates, result.distinctStates]).toEqual([3, 3]);
});

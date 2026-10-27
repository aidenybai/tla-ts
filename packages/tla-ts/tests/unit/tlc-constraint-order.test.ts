import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-constraint-order");

it("evaluates constraints before the duplicate check and invariants, as TLC does", async () => {
  const printed: string[] = [];
  const result = await check({
    source: readFileSync(join(DIRECTORY, "Order.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, "Order.cfg"), "utf8"),
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([8, 4, 3]);
  expect(printed).toEqual(readFileSync(join(DIRECTORY, "Order.out"), "utf8").trim().split("\n"));
});

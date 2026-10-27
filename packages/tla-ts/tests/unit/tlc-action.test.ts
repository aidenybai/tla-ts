import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-action");

it('returns TLC\'s unnamed action from TLCGet("action") in every context', async () => {
  const result = await check({
    source: readFileSync(join(DIRECTORY, "Action.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, "Action.cfg"), "utf8"),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
});

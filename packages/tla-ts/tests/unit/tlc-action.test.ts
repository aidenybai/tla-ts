import { expect, it } from "vite-plus/test";
import { checkFixture } from "./check-harness";

it('returns TLC\'s unnamed action from TLCGet("action") in every context', async () => {
  const result = await checkFixture("tlc-action", "Action");
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
});

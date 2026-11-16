import { expect, it } from "vite-plus/test";
import { formatValue } from "../../src";
import { checkFixture } from "./check-harness";

const checkProperty = (name: string) => checkFixture("tlc-live-level", "LiveLevel", name);

it.each(["ReachesThree", "StepsUp", "LevelsAtMostTwo", "LevelsFromOne"])(
  'evaluates TLCGet("level") in %s like TLC',
  async (name) => {
    const result = await checkProperty(name);
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 3, 2]);
  },
);

it('finds the behavior where TLCGet("level") never reaches 4', async () => {
  const result = await checkProperty("ReachesFour");
  expect(result.status).toBe("liveness-violation");
  expect(result.violation?.trace.map((step) => formatValue(step.state.x))).toEqual(["0", "1", "2"]);
  expect(result.violation?.loopStart).toBe(0);
});

it('reads TLCGet("level") of the search in the trace of a property that fails to evaluate', async () => {
  const result = await checkFixture("tlc-live-level", "LiveFail");
  expect(result.status).toBe("error");
  expect(result.failure?.trace?.map((step) => step.output)).toEqual([
    ['<<"level", 1, 0>>'],
    [],
    ['<<"level", 2, 1>>'],
  ]);
});

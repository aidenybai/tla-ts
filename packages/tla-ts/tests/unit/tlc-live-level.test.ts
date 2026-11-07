import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-live-level");

const checkProperty = (name: string) =>
  check({
    source: readFileSync(join(DIRECTORY, "LiveLevel.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
  });

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

// TLC rebuilds the trace of a property it fails to evaluate with the levels of the search, and
// prints each state's output as it finds the action that takes the step.
it('reads TLCGet("level") of the search in the trace of a property that fails to evaluate', async () => {
  const result = await check({
    source: readFileSync(join(DIRECTORY, "LiveFail.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, "LiveFail.cfg"), "utf8"),
  });
  expect(result.status).toBe("error");
  expect(result.failure?.trace?.map((step) => step.output)).toEqual([
    ['<<"level", 1, 0>>'],
    [],
    ['<<"level", 2, 1>>'],
  ]);
});

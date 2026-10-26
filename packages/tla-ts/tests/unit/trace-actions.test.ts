import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-get-non-determinism");

it("rebuilds a liveness trace from the initial predicate when Next sets registers", () => {
  const config = parseConfig(readFileSync(join(DIRECTORY, "TLCGetNonDeterminism.cfg"), "utf8"));
  config.checkDeadlock = false;
  const result = check({
    source: readFileSync(join(DIRECTORY, "TLCGetNonDeterminism.tla"), "utf8"),
    config,
  });
  expect(result.status).toBe("liveness-violation");
  expect(result.violation?.trace.map((step) => [step.action, formatValue(step.state.y)])).toEqual([
    [undefined, "0"],
    ["Next", "1"],
    ["Next", "2"],
    ["Next", "3"],
  ]);
  expect(result.violation?.loopStart).toBe(3);
});

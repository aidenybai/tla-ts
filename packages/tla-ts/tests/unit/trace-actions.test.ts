import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-get-non-determinism");

it("rebuilds a liveness trace from the initial predicate when Next sets registers", async () => {
  const config = parseConfig(readFileSync(join(DIRECTORY, "TLCGetNonDeterminism.cfg"), "utf8"));
  config.checkDeadlock = false;
  const result = await check({
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

it("sorts the records of each state it rebuilds for a liveness trace, as TLC fingerprints them", async () => {
  const result = await check({
    source: `---- MODULE M ----
VARIABLES z
Id(a) == a
Init == z = [b |-> TRUE, a |-> 1]
Next == z.b /\\ z' = [b |-> FALSE, a |-> 1]
Spec == Init /\\ [][Next]_z
Live == []<>(z.a = 0)
====`,
    config: parseConfig("SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE"),
  });
  expect(result.violation?.trace.map((step) => formatValue(step.state.z))).toEqual([
    "[a |-> 1, b |-> TRUE]",
    "[a |-> 1, b |-> FALSE]",
  ]);
});

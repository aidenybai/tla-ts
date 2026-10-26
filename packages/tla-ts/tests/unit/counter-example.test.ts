import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-ext");

const checkCounterExample = async (configName: string) => {
  const printed: string[] = [];
  const result = await check({
    source: readFileSync(join(DIRECTORY, "CounterExample.tla"), "utf8"),
    config: readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"),
    onPrint: (text) => printed.push(text),
  });
  return [result.status, ...printed];
};

describe("POSTCONDITION after a violation matches TLC", () => {
  it("binds CounterExample to the behavior that violates an invariant or deadlocks", async () => {
    expect(
      await Promise.all(["CounterExampleInvariant", "CounterExampleDeadlock"].map(checkCounterExample)),
    ).toEqual([
      [
        "invariant-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>}',
      ],
      ["deadlock", "<<[x |-> 0], [x |-> 1], [x |-> 2]>>", '{<<1, "Up", 2>>, <<2, "Up", 3>>}'],
    ]);
  });

  it("closes the lasso of a liveness violation with the step back to the loop", async () => {
    expect(
      await Promise.all(["CounterExampleCycle", "CounterExampleStutter"].map(checkCounterExample)),
    ).toEqual([
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Back", 2>>}',
      ],
      [
        "liveness-violation",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
        '{<<1, "Up", 2>>, <<2, "Up", 3>>, <<3, "Up", 3>>}',
      ],
    ]);
  });

  it("keeps the status of the violation when the postcondition is false", async () => {
    expect((await checkCounterExample("CounterExampleFails"))[0]).toBe("invariant-violation");
  });
});

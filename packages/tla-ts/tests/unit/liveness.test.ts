import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/liveness");

const SOURCE = readFileSync(join(DIRECTORY, "Liveness.tla"), "utf8");

const TLC_VERDICTS: [string, string][] = [
  ["Unfair-ReachesLimit", "liveness-violation"],
  ["Unfair-StaysAtLimit", "liveness-violation"],
  ["Unfair-Served", "liveness-violation"],
  ["Unfair-TokenMoves", "liveness-violation"],
  ["Unfair-NeverCritical", "liveness-violation"],
  ["Fair-ReachesLimit", "success"],
  ["Fair-StaysAtLimit", "success"],
  ["Fair-Served", "success"],
  ["Fair-TokenMoves", "success"],
  ["Fair-NeverCritical", "liveness-violation"],
  ["Strong-ReachesLimit", "success"],
  ["Strong-StaysAtLimit", "success"],
  ["Strong-Served", "success"],
  ["Strong-TokenMoves", "success"],
  ["Strong-NeverCritical", "liveness-violation"],
];

describe("liveness matches TLC", () => {
  it.each(TLC_VERDICTS)("%s is %s", (name, status) => {
    const result = check({
      source: SOURCE,
      config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
    });
    expect(result.status).toBe(status);
    expect([result.generatedStates, result.distinctStates]).toEqual([92, 36]);
  });

  it("reports a lasso whose cycle returns to an earlier state", () => {
    const result = check({
      source: SOURCE,
      config: readFileSync(join(DIRECTORY, "Unfair-ReachesLimit.cfg"), "utf8"),
    });
    const violation = result.violation;
    expect(violation?.loopStart).toBeDefined();
    expect(violation?.loopStart).toBeLessThan(violation?.trace.length ?? 0);
  });

  it("reports the deadlock before the temporal property that fails in the same state", () => {
    const checkConfig = (name: string) => {
      const directory = join(import.meta.dirname, "../fixtures/github710");
      const result = check({
        source: readFileSync(join(directory, "Github710d.tla"), "utf8"),
        config: readFileSync(join(directory, `${name}.cfg`), "utf8"),
      });
      return [
        result.status,
        result.violation?.name,
        result.violation?.trace.map((step) => step.state.x),
      ];
    };
    expect(checkConfig("Github710d")).toEqual(["deadlock", "deadlock", [0, 1, 2, 3]]);
    expect(checkConfig("Github710dNoDeadlock")).toEqual([
      "property-violation",
      "NeverThree",
      [0, 1, 2, 3],
    ]);
  });
});

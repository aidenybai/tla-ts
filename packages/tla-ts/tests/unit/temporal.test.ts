import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaError, TlaUnsupportedError } from "../../src";

const SOURCE = readFileSync(join(import.meta.dirname, "../fixtures/temporal/Temporal.tla"), "utf8");

type Verdict = [string, string, string, [number, number] | undefined];

const TLC_VERDICTS: Verdict[] = [
  ["Spec", "OnceTopThenNever", "property-violation", [16, 8]],
  ["Spec", "NeverTopAfterBottom", "property-violation", [16, 8]],
  ["Spec", "EventuallyStaysTop", "liveness-violation", [21, 8]],
  ["Spec", "OftenTop", "liveness-violation", [21, 8]],
  ["Spec", "TopThenBottom", "liveness-violation", [21, 8]],
  ["Spec", "OftenTopImpliesOftenFlip", "liveness-violation", [21, 8]],
  ["Spec", "TopLeadsToStaying", "liveness-violation", [21, 8]],
  ["Spec", "TopLeadsToFlip", "error", undefined],
  ["Spec", "VisitsInOrder", "liveness-violation", [21, 8]],
  ["Spec", "Tautology", "error", undefined],
  ["Spec", "Mixed", "liveness-violation", [21, 8]],
  ["WeakSpec", "OnceTopThenNever", "liveness-violation", [21, 8]],
  ["WeakSpec", "NeverTopAfterBottom", "liveness-violation", [21, 8]],
  ["WeakSpec", "EventuallyStaysTop", "liveness-violation", [21, 8]],
  ["WeakSpec", "OftenTop", "liveness-violation", [21, 8]],
  ["WeakSpec", "TopThenBottom", "liveness-violation", [21, 8]],
  ["WeakSpec", "OftenTopImpliesOftenFlip", "success", [21, 8]],
  ["WeakSpec", "TopLeadsToStaying", "liveness-violation", [21, 8]],
  ["WeakSpec", "TopLeadsToFlip", "error", undefined],
  ["WeakSpec", "VisitsInOrder", "liveness-violation", [21, 8]],
  ["WeakSpec", "Tautology", "error", undefined],
  ["WeakSpec", "Mixed", "liveness-violation", [21, 8]],
  ["StrongSpec", "OnceTopThenNever", "liveness-violation", [21, 8]],
  ["StrongSpec", "NeverTopAfterBottom", "liveness-violation", [21, 8]],
  ["StrongSpec", "EventuallyStaysTop", "liveness-violation", [21, 8]],
  ["StrongSpec", "OftenTop", "liveness-violation", [21, 8]],
  ["StrongSpec", "TopThenBottom", "liveness-violation", [21, 8]],
  ["StrongSpec", "OftenTopImpliesOftenFlip", "success", [21, 8]],
  ["StrongSpec", "TopLeadsToStaying", "liveness-violation", [21, 8]],
  ["StrongSpec", "TopLeadsToFlip", "error", undefined],
  ["StrongSpec", "VisitsInOrder", "liveness-violation", [21, 8]],
  ["StrongSpec", "Tautology", "error", undefined],
  ["StrongSpec", "Mixed", "liveness-violation", [21, 8]],
  ["AssumedSpec", "OnceTopThenNever", "liveness-violation", [21, 8]],
  ["AssumedSpec", "NeverTopAfterBottom", "liveness-violation", [21, 8]],
  ["AssumedSpec", "EventuallyStaysTop", "liveness-violation", [21, 8]],
  ["AssumedSpec", "OftenTop", "success", [21, 8]],
  ["AssumedSpec", "TopThenBottom", "liveness-violation", [21, 8]],
  ["AssumedSpec", "OftenTopImpliesOftenFlip", "liveness-violation", [21, 8]],
  ["AssumedSpec", "TopLeadsToStaying", "liveness-violation", [21, 8]],
  ["AssumedSpec", "TopLeadsToFlip", "error", undefined],
  ["AssumedSpec", "VisitsInOrder", "liveness-violation", [21, 8]],
  ["AssumedSpec", "Tautology", "error", undefined],
  ["AssumedSpec", "Mixed", "success", [21, 8]],
  ["QuantifiedSpec", "OnceTopThenNever", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "NeverTopAfterBottom", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "EventuallyStaysTop", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "OftenTop", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "TopThenBottom", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "OftenTopImpliesOftenFlip", "success", [21, 8]],
  ["QuantifiedSpec", "TopLeadsToStaying", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "TopLeadsToFlip", "error", undefined],
  ["QuantifiedSpec", "VisitsInOrder", "liveness-violation", [21, 8]],
  ["QuantifiedSpec", "Tautology", "error", undefined],
  ["QuantifiedSpec", "Mixed", "liveness-violation", [21, 8]],
  ["Spec", "OftenFlipped", "liveness-violation", [21, 8]],
  ["Spec", "FlipFollowsZero", "liveness-violation", [21, 8]],
  ["Spec", "SettlesOrFalls", "liveness-violation", [21, 8]],
  ["Spec", "EventuallyBounded", "success", [21, 8]],
  ["WeakSpec", "OftenFlipped", "success", [21, 8]],
  ["WeakSpec", "FlipFollowsZero", "success", [21, 8]],
  ["WeakSpec", "SettlesOrFalls", "success", [21, 8]],
  ["WeakSpec", "EventuallyBounded", "success", [21, 8]],
  ["StrongSpec", "OftenFlipped", "success", [21, 8]],
  ["StrongSpec", "FlipFollowsZero", "success", [21, 8]],
  ["StrongSpec", "SettlesOrFalls", "success", [21, 8]],
  ["StrongSpec", "EventuallyBounded", "success", [21, 8]],
  ["AssumedSpec", "OftenFlipped", "success", [21, 8]],
  ["AssumedSpec", "FlipFollowsZero", "success", [21, 8]],
  ["AssumedSpec", "SettlesOrFalls", "success", [21, 8]],
  ["AssumedSpec", "EventuallyBounded", "success", [21, 8]],
  ["QuantifiedSpec", "OftenFlipped", "success", [21, 8]],
  ["QuantifiedSpec", "FlipFollowsZero", "success", [21, 8]],
  ["QuantifiedSpec", "SettlesOrFalls", "success", [21, 8]],
  ["QuantifiedSpec", "EventuallyBounded", "success", [21, 8]],
];

const checkProperty = (specification: string, property: string) =>
  check({ source: SOURCE, config: `SPECIFICATION ${specification}\nPROPERTY ${property}\n` });

describe("general temporal formulas match TLC", () => {
  it.each(TLC_VERDICTS.filter((verdict) => verdict[2] !== "error"))(
    "%s with %s is %s",
    async (specification, property, status, counts) => {
      const result = await checkProperty(specification, property);
      expect(result.status).toBe(status);
      expect([result.generatedStates, result.distinctStates]).toEqual(counts);
    },
  );

  it.each(TLC_VERDICTS.filter((verdict) => verdict[2] === "error"))(
    "%s with %s is rejected",
    async (specification, property) => {
      await expect(checkProperty(specification, property)).rejects.toThrow(TlaError);
      await expect(checkProperty(specification, property)).rejects.not.toThrow(TlaUnsupportedError);
    },
  );

  it("names the violated property and returns a lasso", async () => {
    const result = await check({
      source: SOURCE,
      config: "SPECIFICATION WeakSpec\nPROPERTIES OftenFlipped OftenTop\n",
    });
    expect(result.violation?.name).toBe("OftenTop");
    expect(result.violation?.loopStart).toBeLessThan(result.violation?.trace.length ?? 0);
  });
});

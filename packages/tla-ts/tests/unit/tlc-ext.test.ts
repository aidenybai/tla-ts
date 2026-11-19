import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { checkFixture } from "./check-harness";

const printTrace = async (definitions: string, config = "") => {
  const prints: string[] = [];
  await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC, TLCExt, Randomization\nVARIABLE x\n${definitions}\n====`,
    config: `INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\n${config}`,
    seed: 4n,
    onPrint: (text) => prints.push(text),
  });
  return prints;
};

describe("TLCExt matches TLC", () => {
  it("checks TLC's TLCExtTrace model with Trace in an invariant and a constraint", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace");
    expect(result.status).toBe("deadlock");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([10, 10, 10]);
  });

  it("checks TLC's TLCExtTrace model with an alias", async () => {
    const result = await checkFixture("tlc-ext", "TLCExtTrace", "TLCExtTraceAlias");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace).toHaveLength(7);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([7, 7, 7]);
  });

  it("ends Trace in the state that the next-state relation extends", async () => {
    const result = await checkFixture("tlc-ext", "TraceNext");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 5, 5]);
  });

  it.each([
    [
      "the next-state relation",
      "Init == x = 0\nA(p) == x < 3 /\\ x' = x + 1 /\\ PrintT(p)\nNext == A(Trace)",
      "",
      [
        "<<[x |-> 0]>>",
        "<<[x |-> 0], [x |-> 1]>>",
        "<<[x |-> 0]>>",
        "<<[x |-> 0], [x |-> 1], [x |-> 2]>>",
      ],
    ],
    [
      "an invariant and a constraint",
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1 /\\ PrintT(x)\nInv == Len(Trace) > 0\nConstr == Len(Trace) > 0",
      "INVARIANT Inv\nCONSTRAINT Constr",
      ["0", "1", "0", "2", "0", "0", "1"],
    ],
    [
      "an invariant over register writes",
      "ASSUME TLCSet(1, 0)\nInit == x = 0\nNext == x < 4 /\\ x' = x + 1 /\\ TLCSet(1, TLCGet(1) + 1) /\\ PrintT(<<x, TLCGet(1)>>)\nInv == Len(Trace) < 10",
      "INVARIANT Inv",
      [
        "<<0, 1>>",
        "<<1, 2>>",
        "<<0, 3>>",
        "<<2, 4>>",
        "<<0, 5>>",
        "<<1, 6>>",
        "<<3, 7>>",
        "<<0, 8>>",
        "<<1, 9>>",
        "<<2, 10>>",
      ],
    ],
  ])(
    "evaluates the steps to the state again as TLCTrace rebuilds them for Trace in %s",
    async (_place, definitions, config, prints) => {
      expect(await printTrace(definitions, config)).toEqual(prints);
    },
  );

  // Deviation from TLC: it prints 773, 484, 773, 773, 773, 484, 484, as the rebuild leaves its last state current and the draws after Trace seed from it.
  it("draws after Trace as for the state the search expands, unlike TLC", async () => {
    expect(
      await printTrace(
        "Init == x = 0\nNext == x < 4 /\\ Len(Trace) > 0 /\\ x' = x + 1 /\\ PrintT(RandomElement(1..1000))",
      ),
    ).toEqual(["773", "484", "773", "203", "773", "484", "921"]);
  });

  // Deviation from TLC: it prints 1, 2, 3, 2, as the successor's trace then ends at the state the rebuild left current.
  it("reads the path to a successor after the action reads Trace, unlike TLC", async () => {
    expect(
      await printTrace(
        "Init == x = 0\nNext == x < 3 /\\ Len(Trace) > 0 /\\ x' = x + 1\nConstr == PrintT(Len(Trace))",
        "CONSTRAINT Constr",
      ),
    ).toEqual(["1", "2", "3", "4"]);
  });
});

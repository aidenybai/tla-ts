import { describe, expect, it } from "vite-plus/test";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

describe("TLCDefer matches TLC", () => {
  it("never evaluates its argument in breadth-first search", async () => {
    const printed: string[] = [];
    const result = await checkFixture("tlc-ext", "Defer", "Defer", {
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
    expect(printed).toEqual([]);
  });

  it("drops the argument of a constant definition, which TLC evaluates as it starts, in simulation", () => {
    const printed: string[] = [];
    simulate({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nC == TLCDefer(PrintT("c"))\nInit == x = 0\nNext == x < 2 /\\ TLCDefer(PrintT(<<"n", x>>)) /\\ C /\\ x\' = x + 1\n====',
      config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      seed: 4n,
      traceDepth: 4,
      traceCount: 1n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onPrint: (text) => printed.push(text),
      onSimulation: () => {},
    });
    expect(printed).toEqual(['<<"n", 0>>', '<<"n", 1>>']);
  });
});

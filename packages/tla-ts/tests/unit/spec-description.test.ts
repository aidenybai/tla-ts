import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { simulate } from "../../src/simulate";

const getSource = (init: string, invariant = "TRUE") =>
  [
    "---- MODULE Walk ----",
    "EXTENDS Naturals, TLC",
    "VARIABLE x",
    `Init == ${init}`,
    "Step(i) == x' = (x + i) % 3",
    'Next == \\E i \\in (IF PrintT("walk") THEN {1, 2} ELSE {}) : Step(i)',
    `Inv == ${invariant}`,
    "====",
  ].join("\n");

const CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

// TLC prints "walk" once in each of these runs: Tool's constructor splits Next into its actions, and nothing splits it again.
describe("the description of the specification", () => {
  it("is computed once for a simulation", () => {
    const printed: string[] = [];
    simulate({
      source: getSource("x = 0"),
      config: CONFIG,
      seed: 0n,
      traceDepth: 3,
      traceCount: 2n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onPrint: (text) => printed.push(text),
      onSimulation: () => {},
    });
    expect(printed).toEqual(['"walk"']);
  });

  it("is computed once for a check with coverage", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getSource("x = 0"),
      config: CONFIG,
      coverage: 1,
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(['"walk"']);
  });

  it("is reused by TLCGet", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getSource("x = 0", 'x = 2 => PrintT(TLCGet("spec").actions # {})'),
      config: CONFIG,
      coverage: 1,
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(['"walk"', "TRUE"]);
  });

  it("is reused by the replay of a failed initial state", async () => {
    const printed: string[] = [];
    const result = await check({
      source: getSource('x = 1 + "a"'),
      config: CONFIG,
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("error");
    expect(printed).toEqual(['"walk"']);
    expect(result.failure?.traceOutput).toEqual([]);
  });
});

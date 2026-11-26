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
    expect(result.failure?.trailingOutput).toEqual([]);
  });
});

describe("the record of an action keeps the field order of TLC's RecordValue, which ToString shows", () => {
  const getPrinted = async (source: string, config: string, coverage?: number) => {
    const printed: string[] = [];
    await check({ source, config, coverage, onPrint: (text) => printed.push(text) });
    return printed;
  };

  it("puts the name of the unnamed action first, though the spec's variable location sorts before it", async () => {
    expect(
      await getPrinted(
        '---- MODULE B ----\nEXTENDS Naturals, TLC\nVARIABLE location\nInit == location = 0 /\\ PrintT(ToString(TLCGet("action")))\nNext == location < 1 /\\ location\' = location + 1\n====',
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      ),
    ).toEqual([
      '"[name |-> \\"UnnamedAction\\", location |-> [beginLine |-> 0, beginColumn |-> 0, endLine |-> 0, endColumn |-> 0, module |-> \\"--TLA+ BUILTINS--\\"]]"',
    ]);
  });

  it("puts the coverage of an action after its location and its context in the order of its parameters", async () => {
    expect(
      await getPrinted(
        '---- MODULE D ----\nEXTENDS Naturals, TLC\nVARIABLE location\nSteps == {d \\in 1..1 : TRUE}\nInit == location = 0\nMove(r, d) == location < 1 /\\ location\' = location + d\nNext == \\E r \\in {0}, d \\in Steps : Move(r, d)\nPost == PrintT(ToString(TLCGet("spec").actions))\n====',
        "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\nPOSTCONDITION Post",
        1,
      ),
    ).toEqual([
      '"{[name |-> \\"Move\\", location |-> [beginLine |-> 6, beginColumn |-> 15, endLine |-> 6, endColumn |-> 54, module |-> \\"D\\"], coverage |-> [generated |-> 1, distinct |-> 1], context |-> [r |-> 0, d |-> 1], parameters |-> <<\\"r\\", \\"d\\">>]}"',
    ]);
  });
});

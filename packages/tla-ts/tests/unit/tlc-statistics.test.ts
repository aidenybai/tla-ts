import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-statistics");

it("counts states for TLCGet while it generates them, as TLC does", async () => {
  const printed: string[] = [];
  const result = await checkFixture("tlc-statistics", "Statistics", "Statistics", {
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([15, 5, 3]);
  expect(printed).toEqual(
    readFileSync(join(DIRECTORY, "Statistics.out"), "utf8").trim().split("\n"),
  );
});

it("stops generating successors at the first violation", async () => {
  const printed: string[] = [];
  const result = await check({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' \\in {1, 2, 3} /\\ PrintT(<<x', TLCGet(\"generated\")>>)\nInv == x # 2\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("invariant-violation");
  expect(printed).toEqual(["<<1, 1>>", "<<2, 2>>"]);
  expect([result.generatedStates, result.distinctStates]).toEqual([3, 3]);
});

it.each([
  [
    "the postcondition",
    'Inv == PrintT(<<"inv", x, TLCGet("diameter")>>)',
    "",
    [
      '<<"inv", 0, 0>>',
      '<<"inv", 1, 1>>',
      '<<"inv", 2, 1>>',
      '<<"inv", 3, 1>>',
      '<<"inv", 1, 2>>',
      '<<"inv", 2, 2>>',
      '<<"inv", 3, 2>>',
      '<<"post", 0>>',
    ],
    [],
  ],
  [
    "the alias of a printed behavior",
    "Inv == x < 2",
    "\nALIAS Alias",
    ['<<"post", 0>>'],
    [
      ["0", "0"],
      ["1", "0"],
      ["2", "0"],
    ],
  ],
])(
  'reads TLCGet("diameter") as 0 in %s, which TLC\'s Simulator evaluates on its own thread',
  (_label, invariant, alias, expectedPrinted, expectedStates) => {
    const printed: string[] = [];
    const states: string[][] = [];
    simulate({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\n${invariant}\nPost == PrintT(<<"post", TLCGet("diameter")>>)\nAlias == [x |-> x, d |-> TLCGet("diameter")]\n====`,
      config: `INIT Init\nNEXT Next\nINVARIANT Inv\nPOSTCONDITION Post${alias}`,
      seed: 4n,
      traceDepth: 3,
      traceCount: 2n,
      aril: 0n,
      isGenerating: false,
      scheduler: "random",
      onPrint: (text) => printed.push(text),
      onSimulation: (output) => {
        if (output.kind !== "behavior") return;
        output.trace.forEach((step) =>
          states.push([formatValue(step.state.x), formatValue(step.state.d)]),
        );
      },
    });
    expect([printed, states]).toEqual([expectedPrinted, expectedStates]);
  },
);

it("prints the statistics of a simulation in the order TLC writes them", () => {
  const messages: string[] = [];
  simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nAlpha == x' = x + 1\nBeta == x' = x + 2\nZed == x' = x + 3\nGamma == x' = x + 4\nNext == Alpha \\/ Beta \\/ Zed \\/ Gamma\nInv == x < 12 \\/ TLCGet(\"stats\").diameter = 0\n====",
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    seed: 4n,
    traceDepth: 20,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "message" && output.isError) messages.push(output.message);
    },
  });
  expect(messages[0]).toBe(
    'Evaluating invariant Inv failed.\nAttempted to select nonexistent field "diameter" from the record\n[ traces |-> 1,\n  duration |-> 0,\n  generated |-> 6,\n  behavior |-> [actions |-> [Gamma |-> 2, Alpha |-> 2, Beta |-> 1], id |-> 1],\n  worker |-> 0,\n  distinct |-> -1,\n  distinctvalues |-> -1,\n  retries |-> -1,\n  actions |-> [],\n  levelmean |-> 0,\n  levelvariance |-> 0 ]\nline 10, col 18 to line 10, col 41 of module M',
  );
});

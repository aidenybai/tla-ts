import { expect, it } from "vite-plus/test";
import { check } from "../../src";
import { simulate } from "../../src/simulate";
import { checkFixture } from "./check-harness";

it('returns TLC\'s unnamed action from TLCGet("action") in every context', async () => {
  const result = await checkFixture("tlc-action", "Action");
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([3, 3, 3]);
});

it('reads the current action through TLCEval(TLCGet("action")) under simulation, where TLC caches the unnamed action of an empty state', () => {
  const printed: string[] = [];
  simulate({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1 /\\ PrintT(<<TLCGet("action").name, TLCEval(TLCGet("action")).name>>)\n====',
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    seed: 1n,
    traceDepth: 4,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onPrint: (text) => printed.push(text),
  });
  expect(printed).toEqual(['<<"Init", "Init">>', '<<"Next", "Next">>']);
});

it('reads the current level through TLCEval(TLCGet("level")), where TLC caches the level of an empty state', async () => {
  const printed: string[] = [];
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1 /\\ PrintT(<<TLCGet("level"), TLCEval(TLCGet("level"))>>)\nInv == TLCEval(TLCGet("level")) = TLCGet("level")\n====',
    config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
    onPrint: (text) => printed.push(text),
  });
  expect([result.status, printed]).toEqual(["success", ["<<1, 1>>", "<<2, 2>>"]]);
});

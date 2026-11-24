import { expect, it } from "vite-plus/test";
import { check } from "../../src";

it('prints TLC\'s message and pauses on TLCSet("pause", TRUE)', async () => {
  const printed: string[] = [];
  const pauses: number[] = [];
  const result = await check({
    source:
      '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x\' = x + 1 /\\ TLCSet("pause", x = 1)\n====',
    config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
    onPrint: (text) => printed.push(text),
    onPause: () => pauses.push(printed.length),
  });
  expect(result.status).toBe("success");
  expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  expect(printed).toEqual(["Press enter to resume model checking."]);
  expect(pauses).toEqual([1]);
});

// Deviation from TLC: TLCGetSet#TLCSet drops the pause as TLC starts, so TLC never pauses on D.
it.each([
  'D == TLCSet("pause", TRUE)',
  'G(Op(_, _)) == Op("pause", TRUE)\nD == G(TLCSet)',
  'D == LET K == INSTANCE TLC IN K!TLCSet("pause", TRUE)',
])("pauses where the constant definition %j is used", async (definition) => {
  const printed: string[] = [];
  const pauses: number[] = [];
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2\n${definition}\nInv == D\n====`,
    config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    onPrint: (text) => printed.push(text),
    onPause: () => pauses.push(printed.length),
  });
  expect([result.status, printed, pauses]).toEqual([
    "success",
    ["Press enter to resume model checking.", "Press enter to resume model checking."],
    [1, 2],
  ]);
});

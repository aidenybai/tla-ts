import { expect, it } from "vite-plus/test";
import { formatValue } from "../../src";
import type { TraceStep } from "../../src/check";
import { simulate } from "../../src/simulate";

const SAFETY_CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

const getPrintedRecords = (body: string, config: string) => {
  const printed: string[][] = [];
  const print = (trace: TraceStep[]) =>
    printed.push(trace.map((step) => formatValue(step.state.q)));
  simulate({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES p, q\nId(a, c) == a\n${body}\n====`,
    config,
    seed: 4n,
    traceDepth: 5,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: (output) => {
      if (output.kind === "behavior") print(output.trace);
    },
    onProgress: (progress) => {
      if (progress.kind === "violation") print(progress.violation.trace);
    },
  });
  return printed;
};

it("sorts the records of the initial states, which TLC's simulator normalizes", () => {
  const body =
    "R == [b |-> 1, a |-> 2]\nInit == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p' = p + 1 /\\ q' = IF p = 0 THEN R ELSE [b |-> 5, a |-> 6]\nInv == p < 2";
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["[a |-> 0, b |-> 0]", "[a |-> 2, b |-> 1]", "[b |-> 5, a |-> 6]"],
  ]);
});

it('reports a violation in the step that sets TLCSet("exit"), which TLC\'s simulator drops', () => {
  const body =
    'Init == p = 0 /\\ q = 0\nNext == TLCSet("exit", TLCGet("level") > 3) /\\ p\' = p + 1 /\\ q\' = p + 1\nInv == q < 4';
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([["0", "1", "2", "3", "4"]]);
});

it("sorts the records that TLC compares with the previous state as it drops stuttering steps", () => {
  const body =
    "Init == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p' = p /\\ q' = [b |-> q.b + 1, a |-> 6]\nInv == q.b < 2";
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["[a |-> 0, b |-> 0]", "[a |-> 6, b |-> 1]", "[a |-> 6, b |-> 2]"],
  ]);
});

it("keeps a step whose values TLC fails to compare as it drops stuttering steps, where TLC hangs", () => {
  const body =
    'Init == p = 0 /\\ q = 0\nNext == p\' = p /\\ q\' = [b |-> TLCGet("level"), a |-> 2]\nInv == TLCGet("level") < 3';
  expect(getPrintedRecords(body, SAFETY_CONFIG)).toEqual([
    ["0", "[a |-> 2, b |-> 1]", "[a |-> 2, b |-> 2]"],
  ]);
});

it("sorts the records of a behavior TLC checks for liveness, as it fingerprints each state", () => {
  const body =
    "Init == p = 0 /\\ q = [b |-> 0, a |-> 0]\nNext == p < 2 /\\ p' = p + 1 /\\ q' = [b |-> 5, a |-> p]\nSpec == Init /\\ [][Next]_<<p, q>>\nLive == <>(q.a = 7)";
  expect(
    getPrintedRecords(body, "SPECIFICATION Spec\nPROPERTY Live\nCHECK_DEADLOCK FALSE"),
  ).toEqual([["[a |-> 0, b |-> 0]", "[a |-> 0, b |-> 5]", "[a |-> 1, b |-> 5]"]]);
});

it("reports a behavior that stutters at its initial state, which TLC's LiveCheck1 misses", () => {
  const violations: { states: string[]; loopStart: number | undefined }[] = [];
  const status = simulate({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == (x = 0) ~> (x = 1)\n====",
    config: "SPECIFICATION Spec\nPROPERTY Prop\nCHECK_DEADLOCK FALSE",
    seed: 4n,
    traceDepth: 3,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onProgress: (progress) => {
      if (progress.kind !== "violation") return;
      violations.push({
        states: progress.violation.trace.map((step) => formatValue(step.state.x)),
        loopStart: progress.violation.loopStart,
      });
    },
  });
  expect([status, violations]).toEqual([13, [{ states: ["0"], loopStart: 0 }]]);
});

const getCounterExample = (body: string, config: string) => {
  const printed: string[] = [];
  simulate({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC, TLCExt\nVARIABLE x\nPost == PrintT(<<CounterExample.state, {<<e[1][1], e[2].name, e[3][1]>> : e \\in CounterExample.action}>>)\nInit == x = 0\n${body}\n====`,
    config: `${config}\nPOSTCONDITION Post`,
    seed: 4n,
    traceDepth: 10,
    traceCount: 1n,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    onSimulation: () => {},
    onPrint: (text) => printed.push(text),
  });
  return printed;
};

it("binds CounterExample to the alias of each state of a behavior that violates an invariant", () => {
  const body = "Alias == [a |-> x, n |-> x']\nNext == x' = x + 1\nInv == x < 2";
  expect(getCounterExample(body, "INIT Init\nNEXT Next\nINVARIANT Inv\nALIAS Alias")).toEqual([
    '<< { <<1, [a |-> 0, n |-> 1]>>,\n     <<2, [a |-> 1, n |-> 2]>>,\n     <<3, [a |-> 2, n |-> 2]>> },\n   {<<1, "Next", 2>>, <<2, "Next", 3>>} >>',
  ]);
});

it("binds CounterExample to the lasso of a behavior that violates a temporal property", () => {
  const property = "SPECIFICATION Spec\nPROPERTY Prop";
  expect([
    getCounterExample(
      "A == x < 2 /\\ x' = x + 1\nB == x = 2 /\\ x' = 0\nNext == A \\/ B\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(x = 5)",
      property,
    ),
    getCounterExample(
      "Alias == [a |-> x, n |-> x + 1]\nNext == x' = 1 - x\nSpec == Init /\\ [][Next]_x\nProp == <>(x = 5)",
      `${property}\nALIAS Alias`,
    ),
  ]).toEqual([
    [
      '<< {<<1, [x |-> 0]>>, <<2, [x |-> 1]>>, <<3, [x |-> 2]>>},\n   {<<1, "A", 2>>, <<2, "A", 3>>, <<3, "B", 1>>} >>',
    ],
    ['<<{<<1, [a |-> 0, n |-> 1]>>}, {<<1, "UnnamedAction", 1>>}>>'],
  ]);
});

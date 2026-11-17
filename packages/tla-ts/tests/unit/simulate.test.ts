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
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES p, q\nId(a, c) == a\n${body}\n====`,
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

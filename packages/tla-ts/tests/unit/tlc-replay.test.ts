import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import type { Expression } from "../../src/ast";

const HEADER = [
  "EXTENDS Naturals, Sequences, TLC, FiniteSets",
  "VARIABLE x",
  'Name == <<"zero", "one">>',
  "Rec == [a |-> 1, b |-> 2]",
  'Map == 1 :> "a" @@ 2 :> "b"',
  "Op(i) == Name[i]",
].join("\n");

// The positions TLC prints for a call stack, which skip a node that repeats the one before it.
const formatCallStack = (expressions: Expression[] | undefined) =>
  expressions
    ?.filter((expression, index) => expression !== expressions[index - 1])
    .map((expression) => {
      const range = expression.location.range;
      return range
        ? `${range.start.line}.${range.start.column}-${range.end.line}.${range.end.column}`
        : "?";
    });

const getFailure = async (definitions: string, config = "INIT Init\nNEXT Next") => {
  const result = await check({
    source: `---- MODULE M ----\n${HEADER}\n${definitions}\n====`,
    config,
    onPrint: () => {},
  });
  return {
    callStack: formatCallStack(result.failure?.callStack),
    exitCode: result.failure?.exitCode,
  };
};

// Each call stack is the one TLC 1.8.0 prints for the same spec.
describe("the call stack of a replayed failure matches TLC", () => {
  it("walks the conjuncts and quantifiers of the next-state relation", async () => {
    expect(
      await getFailure("Init == x = 0\nNext == \\E i \\in {1, 2} : x' = x + Op(x + i)"),
    ).toEqual({ callStack: ["9.27-9.44", "9.32-9.44"], exitCode: 75 });
  });

  it("enters the definition that an action applies", async () => {
    expect(
      await getFailure("Step(n) == x' = n + Name[n + 2]\nInit == x = 0\nNext == Step(x)"),
    ).toEqual({ callStack: ["10.9-10.15", "8.12-8.31", "8.17-8.31"], exitCode: 75 });
  });

  it("keeps the conjuncts of a bulleted list that held", async () => {
    expect(
      await getFailure('Init == x = 0\nNext == /\\ Name[x + 1] # "z"\n        /\\ x\' = x + 1'),
    ).toEqual({ callStack: ["9.9-10.21", "9.12-9.28", "9.12-9.22"], exitCode: 75 });
  });

  it("checks an initial state inside the initial predicate", async () => {
    expect(
      await getFailure(
        "Init == x = 0\nNext == x' = x + 1\nInv == Name[x + 1] = Name[x]",
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      ),
    ).toEqual({ callStack: ["8.9-8.13", "10.8-10.28", "10.22-10.28"], exitCode: 75 });
  });

  it("checks the constraints of a successor after the action", async () => {
    expect(
      await getFailure(
        'Init == x = 0\nNext == x\' = x + 1\nSmall == Name[x + 1] # "z"',
        "INIT Init\nNEXT Next\nCONSTRAINT Small",
      ),
    ).toEqual({ callStack: ["10.10-10.26", "10.10-10.20"], exitCode: 75 });
  });

  it("exits with the code of a standard module's failure in an action property", async () => {
    const failure = await getFailure(
      "Init == x = 0\nNext == x < 3 /\\ x' = x + 1\nSpec == Init /\\ [][Next]_x\nProp == [][1 \\div (1 - x) = 1]_x",
      "SPECIFICATION Spec\nPROPERTY Prop",
    );
    expect(failure).toEqual({
      callStack: ["11.11-11.32", "11.12-11.29", "11.12-11.25"],
      exitCode: 255,
    });
  });
});

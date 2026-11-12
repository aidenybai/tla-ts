import { describe, expect, it } from "vite-plus/test";
import {
  check,
  type CheckResult,
  formatValue,
  TlaConfigError,
  TlaEvaluationError,
} from "../../src";
import { STACK_OVERFLOW_MESSAGE, UNEXPECTED_EXCEPTION } from "../../src/errors";
import { getExitCode } from "../../src/exit-codes";
import type { TlcVersion } from "../../src/tlc/version";
import { checkModule, checkSteps } from "./check-harness";

const getFailureSummary = (result: CheckResult) => [
  result.status,
  result.failure?.trace.map((step) => formatValue(step.state.x)),
  [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
  result.failure?.exitCode,
];

describe("evaluation errors match TLC", () => {
  it.each([
    ['IF "a" :> 1 THEN 1 ELSE 2', "(a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))"],
    [
      "IF [k \\in 1..2 |-> k] THEN 1 ELSE 2",
      "(a function  of the form (d1 :> e1 @@ ... @@ dN :> eN))",
    ],
    ["IF [a |-> 1] THEN 1 ELSE 2", "(a record)"],
    ["IF <<1, 2>> THEN 1 ELSE 2", "(a tuple)"],
    [
      '1 \\in ("a" :> 1)',
      "Attempted to check if the value:\n1\nis an element of the function [a |-> 1]",
    ],
    [
      "1 \\in [k \\in {} |-> k]",
      "Attempted to check if the value:\n1\nis an element of the function <<>>",
    ],
    ["1 \\in [a |-> 1]", "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]"],
    ["1 \\in <<1>>", "Attempted to check set membership in a tuple value."],
  ])("words the function in %s like TLC", async (expression, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ (${expression}) = TRUE\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    ["[a |-> 1]", "Attempted to check equality of record:\n[a |-> 1]\nwith non-record\n{}"],
    ['"a" :> 1', "Attempted to check equality of the function [a |-> 1] with the value:\n{}"],
    ['"a b" :> 1', 'Attempted to check equality of the function ("a b" :> 1) with the value:\n{}'],
  ])("words a failed comparison of %s with a set like TLC", async (value, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = ${value}\nNext == UNCHANGED x\nInv == x = {}\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect(result.failure?.message).toContain(message);
  });

  it("reports a CASE with no true guard like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nASSUME CASE 1 = 2 -> 3\nInit == x = 0\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.violation?.message).toBe(
      "Attempted to evaluate a CASE with no conditions true.\nline 3, col 8 to line 3, col 22 of module M",
    );
  });

  it("reports a CASE with no true guard in the next-state relation like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == CASE x = 5 -> x' = 0\n  [] x = 6 -> x' = 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In computing next states, TLC encountered a CASE with no conditions true.\nline 4, col 9 to line 5, col 20 of module M",
    );
    expect(result.failure?.exitCode).toBe(75);
  });

  it("reports the behavior up to a state whose invariant fails to evaluate", async () => {
    const result = await checkSteps(
      "Inv == 1 \\div (2 - x) >= 0",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(result.failure?.message).toBe(
      "Evaluating invariant Inv failed.\nThe second argument of \\div is 0.",
    );
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1", "2"], [3, 3, 0, 3], 76]);
  });

  it.each([
    [
      "0 \\in [{1} -> {2}]",
      "Attempted to check if \n0\nwhich is not a TLC function value, is in the set of functions:\n{<<2>>}",
    ],
    [
      "0 \\in SUBSET {1}",
      "Attempted to check if the non-enumerable value\n0\nis element of\n{{}, {1}}",
    ],
    [
      "Nat \\in SUBSET {1}",
      "Attempted to check if the non-enumerable value\nNat\nis element of\n{{}, {1}}",
    ],
    ["0 \\in Seq({1})", "Attempted to check if the value:\n0\nis an element of Seq({1})."],
  ])("reports a value that can't be an element of %s like TLC", async (expression, message) => {
    const result = await checkModule(`ASSUME ${expression}`);
    expect(result.violation?.message).toBe(message);
  });

  it("compares a value with the elements of a constant definition's set like TLC", async () => {
    const result = await checkModule(
      "S == {<<y>> : y \\in {1, 2, 3, 4}}\nASSUME [<<y>> \\in S |-> y + 1][2] = 3",
    );
    expect(result.violation?.message).toBe(
      "Attempted to compare integer 2 with non-integer:\n<<3>>",
    );
  });

  it("counts the states that the replay of a failed invariant adds", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nCONSTANTS Nodes\nVARIABLES nodeState\nLegalSets == {{}}\nTypeOK == nodeState \\in [Nodes -> [set: LegalSets]]\nInit == nodeState = [n \\in Nodes |-> [set |-> {}]]\nNext == \\E n \\in Nodes : nodeState' = [nodeState EXCEPT ![n].set = 1]\n====",
      config:
        "CONSTANT Nodes = {A, B}\nINIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\nINVARIANT TypeOK",
    });
    expect(result.failure?.message).toBe(
      "Evaluating invariant TypeOK failed.\nAttempted to compare integer 1 with non-integer:\n{}",
    );
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual([
      "FunctionSet",
      "RecordSet",
    ]);
    expect([result.distinctStates, result.failure?.exitCode]).toEqual([3, 75]);
  });

  it.each([
    ["\\E n \\in ({1} \\cup 2) : x' = n", ["Apply"]],
    ["x' = x /\\ \\A n \\in ({1} \\cup 2) : TRUE", ["Apply"]],
    ["x' = CHOOSE n \\in ({1} \\cup 2) : TRUE", ["Apply"]],
    ["x' = Cardinality({n + 1 : n \\in ({1} \\cup 2)})", ["Apply"]],
    ["x' \\in ({1} \\cup 2)", ["Apply"]],
    ["x' \\in {1} \\cup ({1} \\cup 2)", ["Apply", "Apply"]],
    ["x' \\in UNION {Nat}", ["Apply"]],
    ["x' = Cardinality({n \\in ({1} \\cup 2) : TRUE})", undefined],
  ])(
    "reports the sources of a set the replay of %s fails to enumerate like TLC",
    async (next, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, FiniteSets\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
    },
  );

  it.each(["\\E t \\in U : x' = t", "x' = CHOOSE t \\in U : TRUE"])(
    "reports a union of tuples and strings that %s fails to sort like TLC",
    async (next) => {
      const result = await check({
        source: `---- MODULE M ----\nVARIABLE x\nU == ({"t0"} \\X {0}) \\cup {"null"}\nInit == x = "none"\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.message).toContain(
        'Attempted to compare the function <<"t0", 0>> with the value:\n"null"',
      );
      expect(result.failure?.fingerprint).toBeUndefined();
    },
  );

  it.each([
    ["<<1, 2>>[3]", ["Tuple"]],
    ["[a |-> 1][1]", ["Record"]],
    ['[<<1, 2>> EXCEPT !["a"] = 1]', ["Tuple"]],
    ["[{1} EXCEPT ![1] = 1]", ["SetEnumeration"]],
    ["{1, 2}[1]", undefined],
  ])(
    "reports the source of a value the replay of x' = %s fails to apply like TLC",
    async (value, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = ${value}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
    },
  );

  it.each([
    ["{k : k \\in {3}} \\ (3 \\cup {1})", ["SetMap", "Apply"]],
    ["{k : k \\in {3}} \\cap (3 \\cup {1})", ["SetMap", "Apply"]],
    ["(3 \\cup {1}) \\cap {k : k \\in {3}}", ["SetMap", "Apply"]],
  ])("reports the set whose method computes %s and fails like TLC", async (set, sources) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ (${set}) = {}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
  });

  it.each([
    ['{3} \\cup {"a"}', 'Attempted to check equality of integer 3 with non-integer:\n"a"'],
    ['(1..2) \\cap {"a"}', 'Attempted to check equality of string "a" with non-string:\n1'],
    ['{"a"} \\ {3}', 'Attempted to check equality of integer 3 with non-integer:\n"a"'],
  ])("fails to compute %s with TLC's reason", async (set, reason) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ (${set}) = {}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.fingerprint?.reason).toBe(reason);
  });

  it.each([
    ["({<<1>>} \\cup {2}) = {}", ["SetEnumeration", "Tuple"]],
    ["({[a |-> 1]} \\cap {{1}}) = {}", ["SetEnumeration", "SetEnumeration", "SetEnumeration"]],
    ["2 \\in {<<1>>}", ["SetEnumeration", "Tuple"]],
    ['{("a" :> 1), <<2>>} = {}', ["SetEnumeration", "Tuple"]],
  ])("reports the value that fails to compare in %s like TLC", async (predicate, sources) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ ${predicate}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
  });

  it.each([
    ["x = [k \\in {1, 2} |-> k \\div 0]", "x' = x", ["FunctionConstruction"]],
    ["x = 0", "x' = [k \\in 1..2 |-> k \\div 0]", ["FunctionConstruction"]],
    ["x = 0", "x' = [k \\in {1, 2} |-> <<1, 2>>[k + 1]]", ["FunctionConstruction", "Tuple"]],
    [
      "x = 0",
      "x' = [j \\in {1} |-> [k \\in {1, 2} |-> k \\div 0]]",
      ["FunctionConstruction", "FunctionConstruction"],
    ],
    ["x = 0", "x' = [k \\in Nat |-> k \\div 0][1]", undefined],
  ])(
    "reports a function whose body fails in %s or %s as one TLC can't fingerprint",
    async (init, next, sources) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
      expect(result.failure?.exitCode).toBe(sources ? 75 : 255);
    },
  );

  it.each([
    ["x' = Filter /\\ {} = x'", ["SetEnumeration"]],
    ["x' = 1 /\\ {1} # Filter", ["SetEnumeration"]],
    ["x' = Filter /\\ x' = {}", undefined],
    ["x' = 1 /\\ {} = (1 \\div 0)", undefined],
  ])("reports the left side of %s that fails to compare like TLC", async (next, sources) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nFilter == {n \\in SUBSET {1} : 1 \\div 0 = 1}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.fingerprint?.sources.map((source) => source.kind)).toEqual(sources);
  });

  it("records the replay of a filter that fails to compare once", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = {n \\in SUBSET {1} : 1 \\div 0 = 1} /\\ x' = {}\n====",
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.map((expression) => {
      const range = expression.location.range;
      return range ? `${range.start.column}-${range.end.column}` : "";
    });
    expect(new Set(ranges)).toEqual(new Set(["9-57", "9-46", "51-57", "34-45", "34-41"]));
    expect(ranges?.at(-1)).toBe("34-41");
  });

  it("records the variables of an UNCHANGED tuple in order", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES a, b, c\nInit == a = 0 /\\ b = 0 /\\ c = 0\nNext == UNCHANGED <<a, b, c>> /\\ 1 \\div 0 = 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    const names = result.failure?.callStack?.flatMap((expression) =>
      expression.kind === "Identifier" ? [expression.name] : [],
    );
    expect(names).toEqual(["a", "b", "c"]);
  });

  it("keeps nested tuples and operators in an UNCHANGED as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y, z\nvars == <<x, y>>\nInit == x = 0 /\\ y = 0 /\\ z = 0\nNext ==\n  \\/ z' = (z + 1) % 3 /\\ UNCHANGED <<vars, <<x>>>>\n  \\/ y' \\in {y, 1} /\\ UNCHANGED <<<<z>>, vars>>\n  \\/ x < 2 /\\ x' = x + 1 /\\ UNCHANGED <<z, <<y>>, x>>\n  \\/ x < 2 /\\ x' = x + 1 /\\ UNCHANGED <<z, y>>\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure, result.generatedStates, result.distinctStates, result.depth]).toEqual([
      undefined,
      25,
      9,
      5,
    ]);
  });

  it("applies a function without computing the values it isn't applied to as TLC does", async () => {
    const result = await checkSteps(
      "G(n) == [k \\in {1, 2} |-> 10 \\div (k - n)]\nStep == x' = G(2)[1]",
      "INIT Init\nNEXT Step",
    );
    expect([result.failure, result.generatedStates, result.distinctStates]).toEqual([
      undefined,
      3,
      2,
    ]);
  });

  it("prints a function it can't compute in applying it outside its domain like TLC", async () => {
    const result = await checkSteps(
      "G(n) == [k \\in {1, 2} |-> 10 \\div (k - n)]\nStep == x' = G(1)[3]",
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In applying the function\n[k \\in {1, 2} |-> <expression line 6, col 27 to line 6, col 41 of module M>],\nthe first argument is:\n3\nwhich is not in its domain.\n",
    );
  });

  it.each([
    [
      "Step == [k \\in {1, 2} |-> x' = k][3]",
      "[k \\in {1, 2} |-> <expression line 6, col 27 to line 6, col 32 of module M>],\nthe first argument is:\n3which is not in its domain.\nline 6, col 9 to line 6, col 33 of module M",
    ],
    [
      "Step == [k \\in {1}, <<a, b>> \\in {<<1, 2>>} |-> x' = a][1, <<3, 4>>]",
      "[k \\in {1}, <<a, b>> \\in {<<1, 2>>} |-> <expression line 6, col 49 to line 6, col 54 of module M>],\nthe argument number 2 is:\n<<3, 4>>\nwhich is not in its domain.\nline 6, col 9 to line 6, col 55 of module M",
    ],
  ])(
    "applies a function outside its domain in an action as TLC does in %j",
    async (step, message) => {
      const result = await checkSteps(step, "INIT Init\nNEXT Step");
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In applying the function\n${message}`,
      );
    },
  );

  it.each([
    [
      "Step == <<1>>[1] /\\ UNCHANGED x",
      "INIT Init\nNEXT Step",
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut didn't find one.\nline 6, col 9 to line 6, col 16 of module M`,
    ],
    [
      "Step == 1[1] /\\ UNCHANGED x",
      "INIT Init\nNEXT Step",
      `${UNEXPECTED_EXCEPTION}In computing next states, a non-function (an integer) was applied as a function.\nline 6, col 9 to line 6, col 12 of module M`,
    ],
    [
      "Start == [k \\in {1} |-> x = 0][1]",
      "INIT Start\nNEXT Next",
      "In evaluation, the identifier x is either undefined or not an operator.\nline 6, col 25 to line 6, col 25 of module M",
    ],
  ])("applies the value of a function in %j as TLC does", async (definitions, config, message) => {
    const result = await checkSteps(definitions, config);
    expect(result.failure?.message).toBe(message);
  });

  it("computes a function definition that isn't recursive at once as TLC does", async () => {
    const result = await checkSteps(
      "F[k \\in {1}] == x = 0\nStart == F[1]",
      "INIT Start\nNEXT Next",
    );
    expect(result.failure?.message).toBe(
      "In evaluation, the identifier x is either undefined or not an operator.\nline 6, col 17 to line 6, col 17 of module M",
    );
  });

  it.each([
    ["Start == x = [k \\in {1, 2} |-> 0]\nStep == x' = x /\\ x[3] = 0", "Start", "<<0, 0>>"],
    ["Step == x' = [k \\in {1, 2} |-> 1] /\\ x'[3] = 0", "Init", "<<1, 1>>"],
  ])(
    "applies a function built over a set enumeration as the record TLC builds for %j",
    async (definitions, init, value) => {
      const result = await checkSteps(definitions, `INIT ${init}\nNEXT Step`);
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to apply function:\n${value}\nto argument 3, which is not in the domain of the function.`,
      );
    },
  );

  it.each([
    [
      "Start == x = [k \\in SUBSET {1} |-> 0]\nStep == x' = x /\\ x[{2}] = 0",
      "Start",
      ": Attempted to apply function:\n({} :> 0 @@ {1} :> 0)\nto argument {2}, which is not in the domain of the function.",
    ],
    [
      "Step == x' = [k \\in SUBSET {1} |-> 1] /\\ x'[{2}] = 0",
      "Init",
      ": In applying the function\n({} :> 1 @@ {1} :> 1),\nthe first argument is:\n{2}\nwhich is not in its domain.\n",
    ],
  ])(
    "applies a function as TLC does once it fingerprints it in %j",
    async (definitions, init, message) => {
      const result = await checkSteps(definitions, `INIT ${init}\nNEXT Step`);
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n${message}`,
      );
    },
  );

  it("reports a non-function applied as a function in computing next states like TLC", async () => {
    const result = await checkSteps(
      "Step == x' = (IF x = 0 THEN [k \\in {1, 2} |-> k] ELSE 0)[1]",
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: A non-function (an integer) was applied as a function.\nline 6, col 14 to line 6, col 59 of module M",
    );
  });

  it("reports a set TLC can't enumerate in computing next states like TLC", async () => {
    const result = await checkSteps("Step == x' \\in Nat", "INIT Init\nNEXT Step");
    expect(result.failure?.message).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: In computing next states, the right side of \\IN is not enumerable.\nline 6, col 9 to line 6, col 18 of module M",
    );
  });

  it.each([
    ["Nat", "TLC has found a state in which the value of a variable contains Nat", undefined],
    ["{Nat}", "TLC has found a state in which the value of a variable contains Nat", 1],
    ["SUBSET Nat", "Attempted to compute the number of elements in the overridden value Nat.", 1],
    [
      "{n \\in Nat : n > 1}",
      "Attempted to enumerate { x \\in S : p(x) } when S:\nNat\nis not enumerable",
      undefined,
    ],
  ])(
    "fails to fingerprint an initial state x = %s like TLC",
    async (expression, message, sources) => {
      const result = await checkSteps(`Start == x = ${expression}`, "INIT Start\nNEXT Next");
      expect(result.failure?.message).toBe(message);
      expect(result.failure?.fingerprint?.sources.length).toBe(sources);
      expect([result.generatedStates, result.distinctStates, result.failure?.exitCode]).toEqual([
        1, 0, 75,
      ]);
    },
  );

  it("prints a set filter it can't enumerate as its bound and the location of its predicate", async () => {
    const result = await checkSteps("Start == x = {n \\in Nat : n > 1}", "INIT Start\nNEXT Next");
    expect(result.failure?.initialState?.x && formatValue(result.failure.initialState.x)).toBe(
      "{n \\in Nat : <expression line 6, col 27 to line 6, col 31 of module M> }",
    );
  });

  it("fingerprints only the states in the model like TLC", async () => {
    const result = await checkSteps(
      "Start == x = SUBSET Nat\nC == x \\in {}",
      "INIT Start\nNEXT Next\nCONSTRAINT C",
    );
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      1,
      0,
    ]);
  });

  it("fails again as it prints a successor it can't fingerprint", async () => {
    const result = await checkSteps(
      "Step == x' = IF x = 1 THEN {Nat} ELSE x + 1",
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      `${UNEXPECTED_EXCEPTION}TLC has found a state in which the value of a variable contains Nat`,
    );
    expect(result.failure?.traceFailure?.message).toBe(result.failure?.message);
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1"], [3, 2, 0, 2], 75]);
  });

  it.each([
    ["master" as const, "tlc2.tool.EvalException\n: The second argument"],
    ["1.7.4" as const, "java.lang.RuntimeException\n: tlc2.tool.EvalException: The second"],
  ])("fails to fingerprint a function whose body fails in TLC %s", async (version, wrapped) => {
    const result = await checkSteps(
      "Step == x' = [k \\in SUBSET {1} |-> 1 \\div 0]",
      "INIT Init\nNEXT Step",
      version,
    );
    const failure = result.failure;
    expect(failure?.traceFailure?.message ?? failure?.message).toContain(wrapped);
    expect([result.generatedStates, failure?.exitCode]).toEqual([2, 255]);
  });

  it("doesn't force a function TLC builds lazily in a disabled action", async () => {
    const result = await checkSteps(
      "Step == x' = [k \\in SUBSET {1} |-> 1 \\div 0] /\\ FALSE",
      "INIT Init\nNEXT Step",
    );
    expect([result.status, result.failure]).toEqual(["deadlock", undefined]);
  });

  it.each(["INVARIANT", "CONSTRAINT"])(
    "fails at a non-boolean conjunct of %s P as the conjunction does",
    async (kind) => {
      const result = await checkSteps(
        "P == /\\ x < 3\n     /\\ IF x = 1 THEN 1 ELSE TRUE",
        `INIT Init\nNEXT Next\n${kind} P`,
      );
      expect(result.failure?.message).toContain(
        "A non-boolean expression (an integer) was used as a formula in a conjunction.\nline 7, col 9 to line 7, col 33 of module M",
      );
    },
  );

  it("prints what the replay of a failed constraint prints after the trace", async () => {
    const result = await checkSteps(
      'C == PrintT(<<"c", x>>) /\\ (IF x = 2 THEN 1 \\in 2 ELSE TRUE)',
      "INIT Init\nNEXT Next\nCONSTRAINT C",
    );
    expect(result.failure?.trace.map((step) => formatValue(step.state.x))).toEqual(["0", "1", "2"]);
    expect(result.failure?.traceOutput).toEqual(['<<"c", 2>>']);
  });

  it.each([
    ["INVARIANT", "P == x < 2 \\/ 1 \\div 0 = 0"],
    ["PROPERTY", "P == [][x' < 2 \\/ 1 \\div 0 = 0]_x"],
  ])("prints only the replay after the trace when %s P fails to evaluate", async (kind, check) => {
    const result = await checkSteps(
      `Step == Next /\\ PrintT(<<"s", x>>)\nSpec == Init /\\ [][Step]_x\n${check}`,
      `SPECIFICATION Spec\n${kind} P`,
    );
    expect(result.failure?.traceOutput).toEqual(['<<"s", 1>>']);
  });

  it("leaves out the state an action property fails on from the behavior graph in TLC 1.7.4", async () => {
    const result = await checkSteps(
      `Step == Next /\\ PrintT(<<"s", x>>)\nSpec == Init /\\ [][Step]_x /\\ WF_x(Step)\nP == [][x' < 2 \\/ 1 \\div 0 = 0]_x\nL == <>(x = 3)`,
      "SPECIFICATION Spec\nPROPERTY P\nPROPERTY L",
      "1.7.4",
    );
    expect(result.failure?.traceOutput).toEqual(['<<"s", 1>>']);
  });

  it.each(["1.7.4" as const, undefined])(
    "names an action property that fails to evaluate in TLC %s",
    async (version) => {
      const result = await checkSteps(
        "P == [][1 \\div (2 - x) >= 0]_x\nSpec == Init /\\ [][Next]_x",
        "SPECIFICATION Spec\nPROPERTY P",
        version,
      );
      expect(result.failure?.message).toBe(
        "Evaluating action property P failed.\nThe second argument of \\div is 0.",
      );
      expect(getFailureSummary(result)).toEqual(["error", ["0", "1", "2", "3"], [4, 4, 0, 4], 255]);
    },
  );

  it("reports the behavior up to a state whose successors fail to evaluate", async () => {
    const result = await checkSteps(
      'Step == Next /\\ Assert(x < 1, "boom")',
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      'The first argument of Assert evaluated to FALSE; the second argument was:\n"boom"',
    );
    expect(getFailureSummary(result)).toEqual(["error", ["0", "1"], [2, 2, 0, 2], 14]);
  });

  it("reports a check that is not a boolean at the location of its predicate", async () => {
    const getMessage = async (definitions: string, config: string) =>
      (await checkSteps(definitions, `INIT Init\nNEXT Next\n${config}`)).failure?.message;
    expect(await getMessage("Inv == x + 1", "INVARIANT Inv")).toBe(
      "TLC expected a boolean value, but did not find one. line 6, col 8 to line 6, col 12 of module M",
    );
    expect(await getMessage("Inv == 1", "INVARIANT Inv")).toBe(
      "TLC expected a boolean value, but did not find one. 1",
    );
    expect(await getMessage("C == x' + 1", "ACTION_CONSTRAINT C")).toBe(
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: TLC expected a boolean value, but did not find one. line 6, col 6 to line 6, col 11 of module M",
    );
    const property = await checkSteps(
      "Spec == Init /\\ [][Next]_x\nP == [][x' + 1]_x",
      "SPECIFICATION Spec\nPROPERTY P",
    );
    expect(property.failure?.message).toBe(
      "Evaluating action property P failed.\nAttempted to evaluate an expression of form [A]_e, but A was not a boolean.\nline 7, col 8 to line 7, col 17 of module M",
    );
  });

  it("names the initial state a check fails on unless a standard module fails", async () => {
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    const core = await checkSteps("Inv == (CHOOSE y \\in {} : TRUE) = x", config);
    const standard = await checkSteps("Inv == 1 \\div x = 0", config);
    expect(core.failure?.initialState).toEqual({ x: 0 });
    expect(getFailureSummary(core)).toEqual(["error", [], [1, 1, 1, 1], 75]);
    expect(standard.failure?.initialState).toBeUndefined();
    expect(getFailureSummary(standard)).toEqual(["error", [], [1, 1, 1, 1], 75]);
  });

  it("checks only the assumptions of a model without variables or an initial predicate", async () => {
    const result = await check({ source: "---- MODULE M ----\nASSUME TRUE\n====", config: "" });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([0, 0, 0]);
    await expect(
      check({ source: "---- MODULE M ----\nVARIABLE x\n====", config: "" }),
    ).rejects.toThrow(TlaConfigError);
  });

  it("reports an assumption that fails to evaluate and skips axioms", async () => {
    const result = await checkModule("AXIOM 1 = 2\nASSUME CHOOSE n \\in {} : TRUE");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.name).toBe("line 7, col 8 to line 7, col 29 of module M");
    expect(result.violation?.message).toMatch(
      /^Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P/,
    );
  });

  it("words arithmetic, sequence, and membership errors like TLC", async () => {
    const cases = [
      ["1 \\div 0 = 0", "The second argument of \\div is 0."],
      ["1 % 0 = 0", "The second argument of % should be a positive number, but instead it is:\n0"],
      [
        "2 ^ (-1) = 0",
        "The second argument of ^ should be a natural number, but instead it is:\n-1",
      ],
      ["0 ^ 0 = 0", "0^0 is undefined."],
      ["2147483647 + 1 = 0", "Overflow when computing 2147483647+1"],
      ["-2147483647 - 2 = 0", "Overflow when computing -2147483647-2"],
      ["65536 * 65536 = 0", "Overflow when computing 65536*65536"],
      ["2 ^ 31 = 0", "Overflow when computing 2^31"],
      ["-(-2147483647 - 1) = 0", "Overflow when computing --2147483648"],
      ["(-2147483647 - 1) \\div (-1) = 0", "Overflow when computing -2147483648 \\div -1"],
      ['"a" < 1', 'The first argument of < should be an integer, but instead it is:\n"a"'],
      ['1 >= "a"', 'The second argument of >= should be an integer, but instead it is:\n"a"'],
      [
        "1 /\\ (TRUE)",
        "Attempted to evaluate an expression of form P /\\ Q when P was\nan integer.\nline 6, col 8 to line 6, col 18 of module M",
      ],
      [
        "FALSE \\/ (1) \\/ TRUE",
        "Attempted to evaluate an expression of form P \\/ Q when Q was\nan integer.\nline 6, col 8 to line 6, col 19 of module M",
      ],
      ["Head(<<>>) = 0", "Attempted to apply Head to the empty sequence."],
      ["Tail(<<>>) = 0", "Attempted to apply Tail to the empty sequence."],
      ["Len(1) = 0", "The argument of Len should be a sequence, but instead it is:\n1"],
      [
        "Append(1, 2) = 0",
        "Evaluating an expression of the form Append(s, v) when s is not a sequence:\n1",
      ],
      [
        "1 \\o <<1>> = 0",
        "Evaluating an expression of the form s \\o t when s is not a sequence:\n1",
      ],
      [
        '"ab" \\o <<1>> = 0',
        "Evaluating an expression of the form t \\o s when s is not a string:\n<<1>>",
      ],
      [
        "SubSeq(<<1, 2>>, 1, 3) = <<>>",
        "The third argument of SubSeq must be in the domain of its first argument:\n<<1, 2>>\n, but instead it is\n3",
      ],
      [
        "SubSeq(<<>>, 1, 1) = <<>>",
        "The second argument of SubSeq must be in the domain of its first argument:\n<<>>\n, but instead it is\n1",
      ],
      [
        "SelectSeq(<<1>>, LAMBDA e: 1) = <<>>",
        "The second argument of SelectSeq should be a boolean-valued operator, but instead it is:\n<Operator LAMBDA>",
      ],
      ["Cardinality(Nat) = 0", "Attempted to compute cardinality of the value\nNat"],
      ...[
        ['"a" + 1 = 0', "Plus", "StringValue"],
        ['1 \\div "a" = 0', "Divide", "StringValue"],
        ["{1} * 2 = 0", "Times", "SetEnumValue"],
        ["2 % <<1>> = 0", "Mod", "TupleValue"],
        ["2 ^ [a |-> 1] = 0", "Expt", "RecordValue"],
        ["1 - TRUE = 0", "Minus", "BoolValue"],
        ["Nat + 1 = 0", "Plus", "UserValue"],
        ["[{1} -> {1}] + 1 = 0", "Plus", "SetOfFcnsValue"],
        ["({1} \\X {1}) + 1 = 0", "Plus", "SetOfTuplesValue"],
        ["[e \\in Nat |-> e] + 1 = 0", "Plus", "FcnLambdaValue"],
      ].map((item) => [
        item[0],
        `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Integers.${item[1]}(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.${item[2]} to tlc2.value.impl.IntValue`,
      ]),
      [
        '1 .. "a" = {}',
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue",
      ],
      [
        '-"a" = 0',
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue",
      ],
      [
        'IsFiniteSet("a")',
        'Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to check if the string "a" is a finite set.',
      ],
      ['"a" \\in Nat', 'Attempted to check if the value:\n"a"\nis an element of Nat.'],
      ['"a" \\in 1..2', 'Attempted to check if the value:\n"a"\nis in the integer interval 1..2'],
      ["1 \\in TRUE", "Attempted to check if the value:\n1\nis an element of the boolean TRUE"],
      ["1 \\in [a |-> 1]", "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]"],
      ["1 \\in <<1>>", "Attempted to check set membership in a tuple value."],
      [
        "(SUBSET 0)..2 = {}",
        "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.SubsetValue to tlc2.value.impl.IntValue",
      ],
      ["SUBSET 0 = {}", "Attempted to compute the number of elements in the integer 0."],
      ['SUBSET "a" = {}', 'Attempted to compute the number of elements in the string "a".'],
      [
        "SUBSET <<1, 2>> = {}",
        "Attempted to compute the value of an expression of form\nSUBSET S, but S is a non-enumerable value:\n<<1, 2>>",
      ],
      [
        "1 \\in [{1} -> {2}]",
        "Attempted to check if \n1\nwhich is not a TLC function value, is in the set of functions:\n{<<2>>}",
      ],
      ["{{}} \\cup {1} = {}", "Attempted to check equality of the set {} with the value:\n1"],
      ["{1} \\ {{}} = {}", "Attempted to check equality of the set {} with the value:\n1"],
      ["{{}} \\cap {1} = {}", "Attempted to check equality of integer 1 with non-integer:\n{}"],
      [
        "0 \\in SUBSET {1}",
        "Attempted to check if the non-enumerable value\n0\nis element of\n{{}, {1}}",
      ],
      [
        "Nat \\in SUBSET Nat",
        "Attempted to check if the non-enumerable value\nNat\nis element of\nSUBSET Nat",
      ],
      [
        "{1, 2} \\subseteq 0",
        "Attempted to check if the value:\n1\nis an element of the integer 0",
      ],
      [
        "{1} \\subseteq [a |-> 1]",
        "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]",
      ],
      ["{} \\subseteq 0", undefined],
      [
        "({1} \\cup {e \\in {1} \\cup TRUE : TRUE}) \\subseteq {}",
        "Attempted to enumerate S \\cup T when S:\n{1}\nand T:\nTRUE\nare not both enumerable",
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(`ASSUME ${item[0]}`)).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it.each([
    ["1.7.4" as const, "Append(v, s)"],
    [undefined, "Append(s, v)"],
  ])("words a failed Append like TLC %s", async (version, form) => {
    const result = await check({
      source: "---- MODULE M ----\nEXTENDS Sequences\nASSUME Append(1, 2) = 0\n====",
      config: "",
      version,
    });
    expect(result.violation?.message).toBe(
      `Evaluating an expression of the form ${form} when s is not a sequence:\n1`,
    );
  });

  const EXPECTED_BOOLEAN = "TLC expected a boolean expression,\nbut instead found";

  it.each([
    ["x = 0 /\\ 3", "x' = x", `In computing initial states, ${EXPECTED_BOOLEAN} 3.\n3`],
    [
      "x = 0 /\\ Op(x)",
      "x' = x",
      `In computing initial states, ${EXPECTED_BOOLEAN} 1.\nline 5, col 18 to line 5, col 22 of module M`,
    ],
    [
      "x = 0",
      "x' = x /\\ (0 \\div 3)",
      `In computing next states, ${EXPECTED_BOOLEAN} 0.\nline 6, col 20 to line 6, col 27 of module M`,
    ],
    ["x = 0", "x' = x /\\ \\b11", `In computing next states, ${EXPECTED_BOOLEAN} 3.\n\\b11`],
    ["3 /\\ x = 0", "x' = x", "The init state relation is not a boolean expression.\n3"],
    ["x = 0", "3 /\\ x' = x", "The next state relation is not a boolean expression.\n3"],
  ])("words a conjunct of %s or %s that isn't a boolean like TLC", async (init, next, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nOp(a) == a + 1\nInit == ${init}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    [
      "CASE 1 -> x = 0",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 5, col 19 to line 5, col 23 of module M",
    ],
    [
      "CASE FALSE -> x = 0",
      "x' = x",
      "In computing initial states, TLC encountered a CASE with no conditions true.\nline 5, col 9 to line 5, col 27 of module M",
    ],
    [
      "x = 0",
      "CASE 1 -> x' = x",
      "In computing next states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 6, col 19 to line 6, col 24 of module M",
    ],
    [
      "IF 1 THEN x = 0 ELSE x = 1",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as the condition of an IF.\nline 5, col 9 to line 5, col 34 of module M",
    ],
    [
      "x = 0",
      "IF 1 THEN x' = 0 ELSE x' = 1",
      "In computing next states, a non-boolean expression (an integer) was used as the condition of an IF.line 6, col 9 to line 6, col 36 of module M",
    ],
    [
      "x \\in Nat",
      "x' = x",
      "In computing initial states, the right side of \\IN is not enumerable.\nline 5, col 9 to line 5, col 17 of module M",
    ],
  ])("words a failed CASE, IF or \\IN in %s or %s like TLC", async (init, next, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nOp(a) == a + 1\nInit == ${init}\nNext == ${next}\n====`,
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    [
      "CASE x -> x' = x",
      "In computing ENABLED, a non-boolean expression(an integer) was used as a guard condition of a CASE.\nline 5, col 16 to line 5, col 21 of module M",
    ],
    [
      "IF x THEN x' = x ELSE x' = 1",
      "In computing ENABLED, a non-boolean expression(an integer) was used as the guard condition of an IF.\nline 5, col 6 to line 5, col 33 of module M",
    ],
    [
      "x' \\in Nat",
      "The right side of \\IN is not enumerable.\nline 5, col 6 to line 5, col 15 of module M",
    ],
  ])("words a failed %s in a fair action like TLC", async (action, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA == ${action}\nSpec == Init /\\ [][x' = x]_x /\\ WF_x(A)\nP == <>(x = 0)\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
    });
    expect(result.failure?.message).toContain(message);
  });

  it.each([
    ["3", "Attempted to compute ENABLED on a non-boolean expression.\n3"],
    [
      "x + 3",
      `In computing ENABLED, ${EXPECTED_BOOLEAN} 3.\nline 5, col 31 to line 5, col 35 of module M`,
    ],
  ])("words a conjunct of a fair action that is %s like TLC", async (value, message) => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA == x' = x /\\ (IF x = 0 THEN ${value} ELSE TRUE)\nSpec == Init /\\ [][x' = x]_x /\\ WF_x(A)\nP == <>(x = 0)\n====`,
      config: "SPECIFICATION Spec\nPROPERTY P",
    });
    expect(result.failure?.message).toContain(message);
  });

  const checkFairPrint = (action: string, config: string, version: TlcVersion) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nA == PrintT(x) /\\ ${action}\nSpec == Init /\\ [][A]_x /\\ WF_x(A)\nP == [](x = 0 => <>(x = 1))\nInv == x < 1\n====`,
      config: `SPECIFICATION Spec\nPROPERTY P\n${config}`,
      version,
    });

  it.each([
    ["1.7.4", 4],
    ["master", 5],
  ] as const)(
    "evaluates the action of ENABLED on a counterexample as TLC %s does",
    async (version, count) => {
      const prints: string[] = [];
      await check({
        source:
          '---- MODULE M ----\nEXTENDS TLC\nVARIABLE y\nInit == y = 0\nA == y\' = 0 /\\ PrintT("A")\nNext == A\nProp == [](ENABLED A => <>FALSE)\n====',
        config: "INIT Init\nNEXT Next\nPROPERTY Prop",
        version,
        onPrint: (text) => prints.push(text),
      });
      expect(prints).toHaveLength(count);
    },
  );

  it("adds a state to the behavior graph after a violation by a successor it never stored", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nA == x' = 0\nNext == A \\/ x' = 1\nSpec == Init /\\ [][Next]_x\nInv == x # 1\nLive == [](ENABLED A => <>FALSE)\n====",
      config: "SPECIFICATION Spec\nINVARIANT Inv\nPROPERTY Live",
    });
    expect([result.status, result.violation?.name]).toEqual(["invariant-violation", "Inv"]);
  });

  it("replays the next states when adding a state to the behavior graph fails to fingerprint", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nA == (\\E k \\in {1} \\cup SUBSET 3 : TRUE) /\\ x' = x\nSpec == Init /\\ [][A]_x /\\ SF_x(A)\nLive == <>(x = 0)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Live",
    });
    expect([result.failure?.exitCode, result.failure?.fingerprint?.reason]).toEqual([
      75,
      "Attempted to compute the number of elements in the integer 3.",
    ]);
  });

  it.each([
    ["master", 9],
    ["1.7.4", 6],
  ] as const)(
    "prints what adding a state whose next states fail to the behavior graph prints in TLC %s",
    async (version, count) => {
      const result = await checkFairPrint("(x' = 1 \\/ x' = 1 \\div 0)", "", version);
      expect(result.failure?.traceOutput).toEqual(Array.from({ length: count }, () => "0"));
    },
  );

  it.each([
    ["an invariant violation", "master", "INVARIANT Inv", ["0", "0", "0", "0", "0", "0", "0", "0"]],
    ["an invariant violation", "1.7.4", "INVARIANT Inv", []],
    ["a deadlock", "master", "", ["0", "1", "2"]],
    ["a deadlock", "1.7.4", "", ["2"]],
  ] as const)(
    "prints what adding a state to the behavior graph prints after %s in TLC %s",
    async (_title, version, config, expected) => {
      const result = await checkFairPrint("x < 2 /\\ x' = x + 1", config, version);
      expect(result.violation?.traceOutput).toEqual(expected);
    },
  );

  it.each([
    ["master", "[i \\in 1..2 |-> i]", 'y["a"]', 'integer domain to the non-integer argument "a"'],
    [
      "master",
      "(1 :> 2 @@ 3 :> 4)",
      'y["a"]',
      'check equality of integer 1 with non-integer:\n"a"',
    ],
    [
      "master",
      "[i \\in {2 * k : k \\in 1..40} |-> i]",
      'y["a"]',
      'Attempted to compare integer 40 with non-integer:\n"a"',
    ],
    ["master", "<<1, 2>>", 'y["a"]', 'Attempted to access tuple at a non integral index: "a"'],
    ["master", "[a |-> 1]", "y[1]", "Attempted to access record by a non-string argument: 1"],
    ["master", "<<1, 2>>", "[y EXCEPT ![1][1] = 2]", "apply EXCEPT construct to the value 1."],
    ["master", "{1, 2}", "y.a", 'Attempted to select field "a" from a non-record value {1, 2}'],
    ["master", "<<1, 2>>", "y.a", 'integer domain to the non-integer argument "a"'],
    ["1.7.4", "<<1, 2>>", "y.a", 'integer domain to the non-integer argument "a"'],
    [
      "1.7.4",
      "[i \\in 1..2 |-> i]",
      'y["a"]',
      'check equality of integer 1 with non-integer:\n"a"',
    ],
    [
      "1.7.4",
      "[i \\in {2 * k : k \\in 1..40} |-> i]",
      'y["a"]',
      'check equality of integer 2 with non-integer:\n"a"',
    ],
    [
      "1.7.4",
      "<<1, 2>>",
      '[y EXCEPT !["a"] = 1]',
      'Attempted to apply tuple to a non-integer argument "a".',
    ],
    [
      "1.7.4",
      "[a |-> 1]",
      "[y EXCEPT ![1] = 1]",
      "Attempted to apply record to a non-string argument 1.",
    ],
  ] as const)(
    "words a key of the wrong type in TLC %s for y = %s and x' = %s like TLC",
    async (version, value, next, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = ${value}\nNext == x' = ${next} /\\ UNCHANGED y\n====`,
        config: "INIT Init\nNEXT Next",
        version,
      });
      expect(result.failure?.message).toContain(message);
    },
  );

  it("enumerates SUBSET of a function with an empty domain as {{}} like TLC", async () => {
    const result = await checkModule("ASSUME SUBSET <<>> = {{}}");
    expect(result.status).toBe("success");
  });

  it.each([
    [true, "Integers"],
    [false, "Naturals"],
  ])(
    "names the Java class of .. by whether TLC records a trace (%s)",
    async (isTraceRecorded, module) => {
      const result = await check({
        source: '---- MODULE M ----\nEXTENDS Naturals\nASSUME 1 .. "a" = {}\n====',
        config: "",
        traceSpec: isTraceRecorded ? { module: "M_TTrace", traceFile: "M_TTrace.bin" } : undefined,
      });
      expect(result.violation?.message).toContain(`tlc2.module.${module}.DotDot`);
    },
  );

  // Deviation from TLC: tlc2.module.Naturals#Divide rounds some negative quotients toward 0 and reports no overflow; tla-ts floors and reports it, as Integers#Divide does.
  it.each([
    [false, "Naturals", ["<<-1, -1, -2>>"]],
    [true, "Naturals", ["<<-1, -1, -2>>"]],
    [false, "Integers", ["<<-1, -1, -2>>"]],
  ])(
    "divides negative integers as TLC does when it records a trace (%s) for a spec of %s",
    async (isTraceRecorded, module, quotients) => {
      const printed: string[] = [];
      await check({
        source: `---- MODULE M ----\nEXTENDS ${module}, TLC\nASSUME PrintT(<<1 \\div (0 - 2), (0 - 1) \\div 2, (0 - 3) \\div 2>>)\nASSUME PrintT((0 - 2147483647 - 1) \\div (0 - 1))\n====`,
        config: "",
        traceSpec: isTraceRecorded ? { module: "M_TTrace", traceFile: "M_TTrace.bin" } : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect(printed).toEqual(quotients);
    },
  );

  it("locates IF, CHOOSE, conjunction, DOMAIN, and field errors like TLC", async () => {
    const cases = [
      [
        "ASSUME IF 1 THEN TRUE ELSE FALSE",
        "A non-boolean expression (an integer) was used as the condition of an IF.\nline 6, col 8 to line 6, col 32 of module M",
      ],
      [
        "ASSUME CHOOSE e \\in {} : TRUE",
        "Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 6, col 8 to line 6, col 29 of module M",
      ],
      [
        "ASSUME CHOOSE e \\in Seq({1}) : TRUE",
        "Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\nline 6, col 8 to line 6, col 35 of module M",
      ],
      ["ASSUME \\A e \\in 1 : TRUE", "TLC encountered a non-enumerable quantifier bound\n1.\n1"],
      [
        "ASSUME {e \\in 1 : TRUE} = {}",
        "Attempted to enumerate { x \\in S : p(x) } when S:\n1\nis not enumerable",
      ],
      [
        "ASSUME CASE 1 -> TRUE",
        "A non-boolean expression (an integer) was used as a condition of a CASE. 1",
      ],
      [
        "ASSUME CHOOSE e \\in 3 : TRUE",
        "Attempted to compute the value of an expression of\nform CHOOSE x \\in S: P, but S was not enumerable.\nline 6, col 8 to line 6, col 28 of module M",
      ],
      [
        "ASSUME 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when P was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME TRUE /\\ 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when Q was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ {1}",
        "A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a formula in a conjunction.\nline 8, col 8 to line 8, col 10 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ 1",
        "A non-boolean expression (an integer) was used as a formula in a conjunction.\n1",
      ],
      [
        "ASSUME DOMAIN 1 = {}",
        "Attempted to apply the operator DOMAIN to a non-function\n(an integer)\nline 6, col 8 to line 6, col 15 of module M",
      ],
      [
        "ASSUME [a |-> 1].b = 0",
        'Attempted to select nonexistent field "b" from the record\n[a |-> 1]\nline 6, col 8 to line 6, col 18 of module M',
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(item[0])).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("treats a function as a finite set like TLC", async () => {
    expect((await checkModule("ASSUME IsFiniteSet(<<1>>) /\\ IsFiniteSet([a |-> 1])")).status).toBe(
      "success",
    );
  });

  it("reports an argument outside the domain of a function construction like TLC", async () => {
    const pairs = [
      -12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    ]
      .map((key) => `${key} :> ${key} @@\n  `)
      .join("");
    expect((await checkModule("ASSUME [n \\in -12..12 |-> n][13] = 0")).violation?.message).toBe(
      `In applying the function\n( ${pairs}12 :> 12 ),\nthe first argument is:\n13\nwhich is not in its domain.\n`,
    );
    expect((await checkModule('ASSUME [n \\in {"a"} |-> n]["b"] = 0')).violation?.message).toBe(
      'In applying the function\n[a |-> "a"],\nthe first argument is:\n"b"\nwhich is not in its domain.\n',
    );
  });

  it("reports an overflowing cardinality without enumerating the set", async () => {
    const result = await checkModule("ASSUME Cardinality(SUBSET (1..31)) > 0");
    expect(result.violation?.message).toBe(
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nOverflow when computing the number of elements in:\nSUBSET (1..31)",
    );
  });

  it("wraps a failure inside an operator that another operator's Java method calls", async () => {
    const result = await checkModule(
      "ASSUME SelectSeq(<<1>>, LAMBDA e : Cardinality(SUBSET (1..31)) > e) = <<>>",
    );
    expect(result.violation?.message).toBe(
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.Sequences.SelectSeq(tlc2.value.impl.Value,tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nOverflow when computing the number of elements in:\nSUBSET (1..31)",
    );
  });

  it("checks membership in a set enumeration TLC can't sort element by element", async () => {
    const result = await checkModule(
      'ASSUME 1 \\in {1, "a"}\nASSUME [e \\in {1, "a"} |-> e][1] = 1\nASSUME "a" \\in {1, "a"}',
    );
    expect(result.violation?.message).toBe(
      'Attempted to check equality of integer 1 with non-integer:\n"a"',
    );
  });

  it("shows a record in the order the spec writes it until TLC sorts it", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT([fld2 |-> 0])\nASSUME PrintT(ToString([fld1 |-> 1, fld2 |-> 2]))\nASSUME PrintT(ToString(("fld1" :> 1) @@ ("fld3" :> 3) @@ ("fld2" :> 2)))\nASSUME PrintT([fld1 |-> 1, fld2 |-> 2])\n====',
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(prints.slice(1)).toEqual([
      '"[fld1 |-> 1, fld2 |-> 2]"',
      '"[fld1 |-> 1, fld3 |-> 3, fld2 |-> 2]"',
      "[fld2 |-> 2, fld1 |-> 1]",
    ]);
  });

  it("sorts a record TLC compares with itself and the records inside it", async () => {
    const prints: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT([fld2 |-> 0])\nASSUME PrintT(ToString(LET r == <<[fld1 |-> 1, fld2 |-> 2]>> IN IF r = r THEN r ELSE r))\n====",
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(prints.slice(1)).toEqual(['"<<[fld2 |-> 2, fld1 |-> 1]>>"']);
  });

  it("sorts a TLCEval argument only outside an instance that substitutes", async () => {
    const inner =
      '---- MODULE Inner ----\nEXTENDS TLC\nCONSTANT K\nMixed == 1 \\in TLCEval({1, "a"})\n====';
    const instanced = await check({
      source: "---- MODULE M ----\nEXTENDS TLC\nINSTANCE Inner WITH K <- 1\nASSUME Mixed\n====",
      config: "",
      loadModule: (name) => (name === "Inner" ? inner : undefined),
    });
    expect(instanced.status).toBe("success");
    const direct = await checkModule('ASSUME 1 \\in TLCEval({1, "a"})');
    expect(direct.violation?.message).toBe(
      'Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.Value tlc2.module.TLCEval.tlcEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel),\nbut it produced the following error:\nAttempted to compare string "a" with non-string:\n1',
    );
  });

  it("rejects a mistyped membership outside an assumption", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = "a" /\\ x \\in Nat\nNext == x\' = x\n====',
      config: "INIT Init\nNEXT Next",
    });
    expect(result.status).toBe("error");
  });

  it("treats untyped model values as outside built-in sets", async () => {
    const result = await checkModule(
      'CONSTANT m\nASSUME ~(m \\in Nat) /\\ ~(m \\in Int) /\\ ~(m \\in STRING) /\\ ~(m \\in 1..3) /\\ ~(m \\in Seq({1}))\nASSUME ~("a" \\in 3..1)',
      "CONSTANT m = m",
    );
    expect(result.status).toBe("success");
  });

  it.each(['"a" \\in Nat', "1 \\in STRING", "{} \\in 1..4", "FALSE \\in Int"])(
    "rejects %s",
    async (membership) => {
      const result = await checkModule(`ASSUME ${membership}`);
      expect(result.status).toBe("assumption-violation");
      expect(result.violation?.message).toMatch(/^Attempted to check if the value/);
    },
  );

  it.each([
    ["1 \\in TRUE", "Attempted to check if the value:\n1\nis an element of the boolean TRUE"],
    ["1 \\notin 5", "Attempted to check if the value:\n1\nis an element of the integer 5"],
    ['1 \\in "abc"', 'Attempted to check if the value:\n1\nis an element of the string "abc"'],
    ["1 \\in m", "Attempted to check if the value:\n1\nis an element of the model value m"],
    ["1 \\in <<1, 2>>", "Attempted to check set membership in a tuple value."],
    ["1 \\in [a |-> 1]", "Attempted to check if element:\n1\nis in the record:\n[a |-> 1]"],
  ])("words %s like TLC", async (membership, message) => {
    const result = await checkModule(`CONSTANT m\nASSUME ${membership}`, "CONSTANT m = m");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });

  it("reports a failing TLCGet as a failure of its Java method like TLC", async () => {
    const signature =
      "public static tlc2.value.impl.Value tlc2.module.TLCGetSet.TLCGetEval(tlc2.tool.impl.Tool,tla2sany.semantic.ExprOrOpArgNode[],tlc2.util.Context,tlc2.tool.TLCState,tlc2.tool.TLCState,int,tlc2.tool.coverage.CostModel)";
    const cases = [
      ["TLCGet(42)", "TLCGet(42) was undefined."],
      ['TLCGet("nope")', "TLCGet(nope) was undefined."],
      [
        "TLCGet(<<1>>)",
        "The argument of TLCGet should be a nonnegative integer, but instead it is:\n<<1>>",
      ],
    ];
    const results = await Promise.all(
      cases.map((item) =>
        check({
          source: `---- MODULE M ----\nEXTENDS TLC\nVARIABLE x\nInit == x = ${item[0]}\nNext == UNCHANGED x\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ),
    );
    expect(results.map((result) => [result.failure?.message, result.failure?.exitCode])).toEqual(
      cases.map((item) => [
        `Attempted to apply the operator overridden by the Java method\n${signature},\nbut it produced the following error:\n${item[1]}`,
        75,
      ]),
    );
  });

  it("reports action composition as unsupported like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nNext == x' = 1\nInv == ENABLED (Next \\cdot Next)\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "The current version of TLC does not support action composition.  An incomplete implementation can be enabled via the tlc2.tool.impl.Tool.cdot=true java property.",
      75,
    ]);
  });

  it("reports a stack overflow in the next-state relation like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nRECURSIVE R(_)\nR(n) == R(n + 1)\nInit == x = 0\nNext == x' = R(0)\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(STACK_OVERFLOW_MESSAGE);
    expect(result.failure?.trace.map((step) => step.state.x)).toEqual([0]);
  });

  it("reports a successor the next-state relation leaves incomplete like TLC", async () => {
    const getResult = (next: string) =>
      check({
        source: `---- MODULE M ----\nVARIABLES x, y, z\nInit == x = 0 /\\ y = 0 /\\ z = 0\nA1 == x' = 1\nA2 == x' = 2 /\\ y' = 2 /\\ z' = 2\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
    const single = await getResult("x' = 1 /\\ y' = 1");
    expect([single.failure?.message, single.failure?.exitCode, single.generatedStates]).toEqual([
      "Successor state is not completely specified by the next-state action. The following variable is not defined: z.\n",
      75,
      2,
    ]);
    const several = await getResult("A1 \\/ A2");
    expect(several.failure?.message).toBe(
      "Successor state is not completely specified by action A1 of the next-state relation. The following variables are not defined: y, z.\n",
    );
    expect(several.failure?.trace.map((step) => [step.label, formatValue(step.state.y)])).toEqual([
      [undefined, "0"],
      ["A1 line 4, col 7 to line 4, col 12 of module M", "null"],
    ]);
  });

  it("reports a value where the initial or next-state relation expects a formula like TLC", async () => {
    const getFailure = async (init: string, next: string) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      return [result.failure?.message, result.failure?.exitCode];
    };
    expect(await getFailure("x = 0 /\\ x + 3", "x' = x")).toEqual([
      "In computing initial states, TLC expected a boolean expression,\nbut instead found 3.\nline 4, col 18 to line 4, col 22 of module M",
      75,
    ]);
    expect(await getFailure("x = 0", "x' = 1 /\\ x + 2")).toEqual([
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut instead found 2.\nline 5, col 19 to line 5, col 23 of module M`,
      75,
    ]);
    const error = await getFailure("x = 0", "3").catch((caught: unknown) => caught);
    expect(error).toEqual(
      new TlaEvaluationError(
        `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n3`,
      ),
    );
    expect(error instanceof Error && getExitCode(error)).toBe(255);
  });

  it("reports a failing constraint on a successor like a failure of the next-state relation", async () => {
    const getFailure = async (constraint: string, config: string) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nC == ${constraint}\n====`,
        config: `INIT Init\nNEXT Next\n${config} C`,
      });
      return [result.failure?.message, result.failure?.exitCode, result.failure?.trace.length];
    };
    expect(await getFailure("x < 1 \\/ x[1] = 0", "CONSTRAINT")).toEqual([
      `${UNEXPECTED_EXCEPTION}A non-function (an integer) was applied as a function.\nline 6, col 15 to line 6, col 18 of module M`,
      75,
      2,
    ]);
    expect(await getFailure("x' < 1 \\/ x[1] = 0", "ACTION_CONSTRAINT")).toEqual([
      `${UNEXPECTED_EXCEPTION}A non-function (an integer) was applied as a function.\nline 6, col 16 to line 6, col 19 of module M`,
      75,
      2,
    ]);
  });

  it("reports a successor it cannot fingerprint as a failure of the state it expands", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = SUBSET (SUBSET (1..32))\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([
      result.failure?.message,
      result.failure?.exitCode,
      result.failure?.trace.length,
    ]).toEqual([
      `${UNEXPECTED_EXCEPTION}Overflow when computing the number of elements in:\nSUBSET (1..32)`,
      75,
      1,
    ]);
  });

  it("reports a SUBSET too large to enumerate like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = SUBSET (SUBSET (1..36))\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "Overflow when computing the number of elements in:\nSUBSET (1..36)",
      75,
    ]);
  });

  it("reports a variable read before the initial predicate assigns it like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, y\nInit == y = x /\\ x = 0\nNext == UNCHANGED <<x, y>>\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In evaluation, the identifier x is either undefined or not an operator.\nline 3, col 13 to line 3, col 13 of module M",
      75,
    ]);
  });

  it("reports a variable drawn from a set it can't enumerate like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in Nat\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      "In computing initial states, the right side of \\IN is not enumerable.\nline 4, col 9 to line 4, col 17 of module M",
    );
    expect(result.failure?.exitCode).toBe(75);
  });

  it("reports a CASE with no true guard in the initial predicate like TLC", async () => {
    const result = await check({
      source: "---- MODULE M ----\nVARIABLE x\nInit == CASE FALSE -> x = 0\nNext == x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In computing initial states, TLC encountered a CASE with no conditions true.\nline 3, col 9 to line 3, col 27 of module M",
      75,
    ]);
  });

  it("reports a failure of the next-state relation as an unexpected exception like TLC", async () => {
    const results = await Promise.all(
      ["x' = CHOOSE n \\in {} : TRUE", "x' = 1 \\div 0"].map((next) =>
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ),
    );
    expect(results.map((result) => [result.failure?.message, result.failure?.exitCode])).toEqual([
      [
        `${UNEXPECTED_EXCEPTION}Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 5, col 14 to line 5, col 35 of module M`,
        75,
      ],
      ["The second argument of \\div is 0.", 255],
    ]);
  });

  it("quantifies over a power set too large to build in TLC's order, like TLC", async () => {
    const result = await checkModule(
      [
        "ASSUME \\E s \\in SUBSET (1..40) : Cardinality(s) = 2",
        "ASSUME ~\\A s \\in SUBSET (1..40) : Cardinality(s) < 1",
        "ASSUME (CHOOSE s \\in SUBSET (1..40) : Cardinality(s) = 1) = {1}",
        "ASSUME (CHOOSE s \\in SUBSET (1..32) : Cardinality(s) = 2 /\\ 5 \\in s) = {1, 5}",
      ].join("\n"),
    );
    expect(result.failure).toBeUndefined();
    expect(result.violation).toBeUndefined();
  });

  it("fails on a state holding a set it can't enumerate to fingerprint, like TLC", async () => {
    const results = await Promise.all(
      [
        ["Nat", "UNCHANGED x"],
        ["{}", "x' = SUBSET Nat"],
      ].map((item) =>
        check({
          source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = ${item[0]}\nNext == ${item[1]}\n====`,
          config: "INIT Init\nNEXT Next",
        }),
      ),
    );
    expect(
      results.map((result) => [
        result.failure?.message,
        result.failure?.exitCode,
        result.failure?.trace.length,
      ]),
    ).toEqual([
      ["TLC has found a state in which the value of a variable contains Nat", 75, 0],
      [
        "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to compute the number of elements in the overridden value Nat.",
        75,
        1,
      ],
    ]);
  });

  it("applies a set operator to a value that isn't a set until it needs its elements, like TLC", async () => {
    const result = await checkModule(
      [
        "ASSUME 1 \\in ({1} \\cup 0)",
        "ASSUME 1 \\in (0 \\cup {1})",
        'ASSUME 1 \\in ((1..2) \\cup "a")',
        "ASSUME ({} \\cup 0) = 0",
        "ASSUME ({} \\cap 0) = {}",
      ].join("\n"),
    );
    expect(result.failure).toBeUndefined();
    expect(result.violation).toBeUndefined();
    const messages = await Promise.all(
      ["2 \\in ({1} \\cup 0)", "1 \\in (0 \\ {1})", "Cardinality({1} \\cup 0) = 1"].map(
        async (expression) => (await checkModule(`ASSUME ${expression}`)).violation?.message,
      ),
    );
    expect(messages).toEqual([
      "Attempted to check if the value:\n2\nis an element of the integer 0",
      "Attempted to check if the value:\n1\nis an element of the integer 0",
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to enumerate S \\cup T when S:\n{1}\nand T:\n0\nare not both enumerable",
    ]);
  });

  it("names the Java class of Naturals in an arithmetic error unless the spec loads Integers, like TLC", async () => {
    const cases = [
      ["Naturals", "Naturals"],
      ["Naturals, Sequences", "Naturals"],
      ["Naturals, Integers", "Integers"],
      ["Naturals, TLCExt", "Integers"],
    ];
    const messages = await Promise.all(
      cases.map(
        async (item) =>
          (
            await check({
              source: `---- MODULE M ----\nEXTENDS ${item[0]}\nASSUME 1 + "a" = 1\n====`,
              config: "",
            })
          ).violation?.message,
      ),
    );
    expect(messages).toEqual(
      cases.map(
        (item) =>
          `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.${item[1]}.Plus(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue),\nbut it produced the following error:\nCannot cast tlc2.value.impl.StringValue to tlc2.value.impl.IntValue`,
      ),
    );
  });

  it("locates IF, CHOOSE, conjunction, DOMAIN, application, and field errors like TLC", async () => {
    const cases = [
      [
        "ASSUME IF 1 THEN TRUE ELSE FALSE",
        "A non-boolean expression (an integer) was used as the condition of an IF.\nline 6, col 8 to line 6, col 32 of module M",
      ],
      [
        "ASSUME CHOOSE e \\in {} : TRUE",
        "Attempted to compute the value of an expression of form\nCHOOSE x \\in S: P, but no element of S satisfied P.\nline 6, col 8 to line 6, col 29 of module M",
      ],
      [
        "ASSUME 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when P was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME TRUE /\\ 1 /\\ TRUE",
        "Attempted to evaluate an expression of form P /\\ Q when Q was\nan integer.\nline 6, col 8 to line 6, col 16 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ {1}",
        "A non-boolean expression (a set of the form {e1, ... ,eN}) was used as a formula in a conjunction.\nline 8, col 8 to line 8, col 10 of module M",
      ],
      [
        "ASSUME\n    /\\ TRUE\n    /\\ 1",
        "A non-boolean expression (an integer) was used as a formula in a conjunction.\n1",
      ],
      [
        "ASSUME DOMAIN 1 = {}",
        "Attempted to apply the operator DOMAIN to a non-function\n(an integer)\nline 6, col 8 to line 6, col 15 of module M",
      ],
      [
        "ASSUME [a |-> 1].b = 0",
        'Attempted to select nonexistent field "b" from the record\n[a |-> 1]\nline 6, col 8 to line 6, col 18 of module M',
      ],
      [
        "ASSUME 3[1] = 0",
        "A non-function (an integer) was applied as a function.\nline 6, col 8 to line 6, col 11 of module M",
      ],
      [
        'ASSUME "ab"[1, 2] = 0',
        "A non-function (a string) was applied as a function.\nline 6, col 8 to line 6, col 17 of module M",
      ],
      [
        "ASSUME {1}.b = 0",
        'Attempted to select field "b" from a non-record value {1}\nline 6, col 8 to line 6, col 12 of module M',
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(item[0])).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("reports an argument outside the domain of a tuple, record, or function like TLC", async () => {
    const cases = [
      ["<<1, 2>>[3]", "Attempted to access index 3 of tuple\n<<1, 2>>\nwhich is out of bounds."],
      ['<<1, 2>>["a"]', 'Attempted to access tuple at a non integral index: "a"'],
      ["[a |-> 1][2]", "Attempted to access record by a non-string argument: 2"],
      ['[a |-> 1]["b"]', "Attempted to access nonexistent field 'b' of record\n[a |-> 1]"],
      [
        "(1 :> 2)[3]",
        "Attempted to apply function:\n<<2>>\nto argument 3, which is not in the domain of the function.",
      ],
      ["<<>>.b", 'Attempted to apply function with integer domain to the non-integer argument "b"'],
      [
        "[n \\in 0..2 |-> n].b",
        'Attempted to apply function with integer domain to the non-integer argument "b"',
      ],
      [
        "[n \\in {} |-> n].b",
        'Attempted to apply function:\n<<>>\nto argument "b", which is not in the domain of the function.',
      ],
    ];
    const messages = await Promise.all(
      cases.map(async (item) => (await checkModule(`ASSUME ${item[0]} = 0`)).violation?.message),
    );
    expect(messages).toEqual(cases.map((item) => item[1]));
  });

  it("evaluates a function over a domain TLC keeps lazy only where it is applied", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nASSUME PrintT([b |-> 0])\nASSUME PrintT([s \\in SUBSET {1} |-> 1 \\div Cardinality(s)][{1}])\nASSUME PrintT([v \\in {0} |-> [a |-> 1, b |-> 2]])\nASSUME PrintT([v \\in SUBSET {0} |-> [a |-> 1, b |-> 2]])\nASSUME PrintT([v \\in {0} \\X {1} |-> [a |-> 1, b |-> 2]])\n====",
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(result.status).toBe("success");
    expect(prints.slice(1)).toEqual([
      "1",
      "(0 :> [b |-> 2, a |-> 1])",
      "({} :> [a |-> 1, b |-> 2] @@ {0} :> [a |-> 1, b |-> 2])",
      "(<<0, 1>> :> [a |-> 1, b |-> 2])",
    ]);
  });
});

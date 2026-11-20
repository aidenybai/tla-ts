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
import { getOutDegreeSummary } from "../../src/tlc/summary";
import type { TlcVersion } from "../../src/tlc/version";
import { checkModule, checkSteps, formatCallStackLines } from "./check-harness";

const getFailureSummary = (result: CheckResult) => [
  result.status,
  result.failure?.trace.map((step) => formatValue(step.state.x)),
  [result.generatedStates, result.distinctStates, result.queuedStates, result.depth],
  result.failure?.exitCode,
];

const ALL_MODULES = "Integers, Sequences, FiniteSets, TLC, Bags, Json";

const getJavaError = (signature: string, message: string) =>
  `Attempted to apply the operator overridden by the Java method\npublic static tlc2.${signature},\nbut it produced the following error:\n${message}`;

const getOverrideMessages = (cases: string[][]) =>
  Promise.all(
    cases.map(
      async (item) =>
        (
          await check({
            source: `---- MODULE M ----\nEXTENDS ${item[0]}\n${item[1]}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
            config: `INIT Init\nNEXT Next\nCONSTANT ${item[2]}`,
          })
        ).violation?.message,
    ),
  );

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

  it.each(["[a |-> Len(3), s |-> CASE 1 -> 2]", "[a : Len(3), s : CASE 1 -> 2]"])(
    "evaluates the fields of %s in the order they're written, like TLC",
    async (expression) => {
      const result = await checkModule(`F(s) == s\nASSUME ${expression} = {}`);
      expect(result.violation?.message).toBe(
        "The argument of Len should be a sequence, but instead it is:\n3",
      );
    },
  );

  it("passes an operator whose body is a literal to a Java override as an operator, which TLC passes as the literal", async () => {
    const result = await checkModule("One(a, b) == 1\nASSUME SortSeq(<<2, 1>>, One) = <<>>");
    expect(result.violation?.message).toBe(
      "The second argument of SortSeq should be a boolean function, but instead it is:\n1",
    );
  });

  it("reports a negative count of RandomSubset as its argument error, where TLC passes it to new ValueVec", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Randomization\nASSUME RandomSubset(-1, {1}) = {}\n====",
      config: "",
    });
    expect(result.violation?.message).toBe(
      "The first argument of RandomSubset should be a nonnegative integer, but instead it is:\n-1",
    );
  });

  it("evaluates a record's fields in an invariant in the order they're written, like TLC", async () => {
    const result = await checkSteps(
      "F(s) == s\nInv == [a |-> 1 \\div x, s |-> CASE x -> 2] = 1",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
    );
    expect(result.failure?.message).toBe("The second argument of \\div is 0.");
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

  it.each([
    ["{{}} # {0}", ["39-48", "39-42", "40-41"]],
    ["{{{}}} # {{0}}", ["39-52", "39-44", "40-43", "41-42"]],
    ["<<<<{}>>>> = <<<<0>>>>", ["39-60", "39-48", "41-46", "43-44"]],
    ["[a |-> {}] # [a |-> 0]", ["39-60", "39-48", "46-47"]],
  ])(
    "fingerprints each element of %s that fails to compare, as TLC's equals does",
    async (comparison, frames) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1 /\\ PrintT(${comparison})\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      });
      const ranges = result.failure?.callStack?.map((expression) => {
        const range = expression.location.range;
        return range && `${range.start.column}-${range.end.column}`;
      });
      expect([...new Set(ranges)].slice(5)).toEqual(frames);
    },
  );

  it("records each prefix of a chain of infix conjunctions as TLC nests them", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 /\\ y' = (TRUE /\\ 2 /\\ TRUE /\\ TRUE)\n====",
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.map((expression) => {
      const range = expression.location.range;
      return range && `${range.start.column}-${range.end.column}`;
    });
    expect([...new Set(ranges)]).toEqual(["9-50", "9-14", "19-50", "25-49", "25-41", "25-33"]);
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

  it.each([
    ["the next-state relation", "TRUE", "x' = 1 - x /\\ UNCHANGED (LET m == y IN m)", 0],
    [
      "ENABLED",
      "ENABLED (y' = 1 - y /\\ UNCHANGED (LET m == x IN m))",
      "x' = 1 - x /\\ UNCHANGED y",
      0,
    ],
    [
      "the next-state relation under -coverage",
      "TRUE",
      "x' = 1 - x /\\ UNCHANGED (LET m == y IN m)",
      1,
    ],
    [
      "ENABLED under -coverage",
      "ENABLED (y' = 1 - y /\\ UNCHANGED (LET m == x IN m))",
      "x' = 1 - x /\\ UNCHANGED y",
      1,
    ],
  ])(
    "keeps the variable a LET names under UNCHANGED in %s, as TLC's Tool#getVar looks through the LET",
    async (_title, invariant, next, coverage) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == ${next}\nInv == ${invariant}\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        coverage: coverage || undefined,
      });
      expect([result.failure, result.generatedStates, result.distinctStates, result.depth]).toEqual(
        [undefined, 3, 2, 2],
      );
    },
  );

  it.each([
    ["an initial predicate", "(LET m == x IN m) = 0 /\\ y = 0", "UNCHANGED <<x, y>>", [2, 1, 1]],
    ["a primed LET", "x = 0 /\\ y = 0", "(LET m == x IN m)' = 1 - x /\\ UNCHANGED y", [3, 2, 2]],
    [
      "a LET of a primed variable",
      "x = 0 /\\ y = 0",
      "(LET m == x' IN m) = 1 - x /\\ UNCHANGED y",
      [3, 2, 2],
    ],
  ])(
    "assigns the variable a LET names in %s under -coverage, as TLC's Tool#getVar and Spec#getPrimedVar look through the LET",
    async (_title, init, next, counts) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        coverage: 1,
      });
      expect([result.failure, result.generatedStates, result.distinctStates, result.depth]).toEqual(
        [undefined, ...counts],
      );
    },
  );

  it("warns about a changed variable that a LET definition names under UNCHANGED at the name, as TLC does", async () => {
    const warnings: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == LET m == y IN (y' = 1 /\\ UNCHANGED m /\\ x' = x)\n====",
      config: "INIT Init\nNEXT Next",
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress.text);
      },
    });
    expect(result.status).toBe("deadlock");
    expect(warnings).toEqual([
      "The variable y was changed while it is specified as UNCHANGED at\nline 5, col 44 to line 5, col 44 of module M",
    ]);
  });

  it("warns about a changed variable that a definition names under UNCHANGED at the name written there, as TLC's Tool#processUnchanged does", async () => {
    const warnings: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nZy == y\nInit == x = 0 /\\ y = 0\nNext == y' = 1 /\\ UNCHANGED Zy /\\ x' = x\n====",
      config: "INIT Init\nNEXT Next",
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress.text);
      },
    });
    expect(warnings).toEqual([
      "The variable y was changed while it is specified as UNCHANGED at\nline 6, col 29 to line 6, col 30 of module M",
    ]);
  });

  it("warns about a changed variable that a LET definition names under UNCHANGED with -coverage, which evaluates the definition at each reference as TLC does", async () => {
    const warnings: string[] = [];
    await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == LET m == y IN (y' = 1 /\\ UNCHANGED m /\\ x' = x)\n====",
      config: "INIT Init\nNEXT Next",
      coverage: 1,
      onProgress: (progress) => {
        if (progress.kind === "warning") warnings.push(progress.text);
      },
    });
    expect(warnings).toEqual([
      "The variable y was changed while it is specified as UNCHANGED at\nline 5, col 44 to line 5, col 44 of module M",
    ]);
  });

  // Deviation from TLC: TLC's all-assigned path evaluates UNCHANGED x as FALSE and deadlocks without the warning.
  it.each([
    [
      "VARIABLE x\nInit == x = 0\nNext == x' = 1 /\\ UNCHANGED x",
      "line 5, col 29 to line 5, col 29 of module M",
    ],
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 1\nNext == x' = 1 /\\ y' = 2 /\\ UNCHANGED x",
      "line 5, col 39 to line 5, col 39 of module M",
    ],
  ])(
    "warns about a changed variable under UNCHANGED after the step assigns every variable, unlike TLC: %s",
    async (definitions, location) => {
      const getOutcome = async (maxSetSize: number | undefined, coverage?: number) => {
        const warnings: string[] = [];
        const result = await check({
          source: `---- MODULE M ----\nEXTENDS Naturals\n${definitions}\n====`,
          config: "INIT Init\nNEXT Next",
          maxSetSize,
          coverage,
          onProgress: (progress) => {
            if (progress.kind === "warning") warnings.push(progress.text);
          },
        });
        return [result.status, warnings];
      };
      const expected = [
        "deadlock",
        [`The variable x was changed while it is specified as UNCHANGED at\n${location}`],
      ];
      expect(await getOutcome(undefined)).toEqual(expected);
      expect(await getOutcome(1_000_000)).toEqual(expected);
      expect(await getOutcome(undefined, 1)).toEqual(expected);
    },
  );

  it.each([
    [
      "VARIABLE x\nInit == x = 0\nNext == x' = {1} /\\ UNCHANGED x",
      "{1}",
      [
        "Line 5, column 9 to line 5, column 31 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 31 in M",
      ],
    ],
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = {1} /\\ UNCHANGED x /\\ y' = 0",
      "{1}",
      [
        "Line 5, column 9 to line 5, column 41 in M",
        "Line 5, column 9 to line 5, column 31 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 31 in M",
        "Line 5, column 31 to line 5, column 31 in M",
      ],
    ],
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == LET U(v) == UNCHANGED v IN x' = {1} /\\ U(x) /\\ y' = 0",
      "{1}",
      [
        "Line 5, column 36 to line 5, column 61 in M",
        "Line 5, column 36 to line 5, column 51 in M",
        "Line 5, column 36 to line 5, column 43 in M",
        "Line 5, column 48 to line 5, column 51 in M",
        "Line 5, column 21 to line 5, column 31 in M",
        "Line 5, column 31 to line 5, column 31 in M",
      ],
    ],
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = {1} /\\ UNCHANGED <<y, x>> /\\ y' = 0",
      "{1}",
      [
        "Line 5, column 9 to line 5, column 48 in M",
        "Line 5, column 9 to line 5, column 38 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 38 in M",
        "Line 5, column 31 to line 5, column 38 in M",
        "Line 5, column 33 to line 5, column 33 in M",
        "Line 5, column 36 to line 5, column 36 in M",
      ],
    ],
    [
      "VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = \"a\" /\\ y' = 0 /\\ UNCHANGED x",
      '"a"',
      [
        "Line 5, column 9 to line 5, column 41 in M",
        "Line 5, column 9 to line 5, column 26 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 26 in M",
        "Line 5, column 31 to line 5, column 41 in M",
      ],
    ],
    [
      "VARIABLES x, y\nInit == x = {0} /\\ y = 0\nNext == x' = {{\"a\"}} /\\ UNCHANGED x /\\ y' = 0",
      '{"a"}',
      [
        "Line 5, column 9 to line 5, column 45 in M",
        "Line 5, column 9 to line 5, column 35 in M",
        "Line 5, column 9 to line 5, column 20 in M",
        "Line 5, column 25 to line 5, column 35 in M",
        "Line 5, column 35 to line 5, column 35 in M",
      ],
    ],
  ])(
    "compares a variable's value with its successor's under UNCHANGED, as TLC's Tool#processUnchangedImplVar calls val0.equals(val1): %s",
    async (definitions, successor, callStack) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.message).toBe(
        getRuntimeException(
          `Attempted to check equality of integer 0 with non-integer:\n${successor}`,
        ),
      );
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint).toBeUndefined();
    },
  );

  it("compares the value under a predicate's UNCHANGED with its successor's on TLC's path, as TLC's eval of UNCHANGED does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = {1} /\\ ~UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect(result.failure?.message).toBe(
      getRuntimeException("Attempted to check equality of integer 0 with non-integer:\n{1}"),
    );
    expect(formatCallStackLines(result)).toEqual([
      "Line 5, column 9 to line 5, column 32 in M",
      "Line 5, column 9 to line 5, column 16 in M",
      "Line 5, column 21 to line 5, column 32 in M",
      "Line 5, column 22 to line 5, column 32 in M",
    ]);
  });

  it("evaluates the expression under a predicate's UNCHANGED before its successor, as TLC's eval of UNCHANGED does", async () => {
    const printed: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 2 /\\ ~UNCHANGED Print(x, x)\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect(printed).toEqual(["0  0", "1  1", "1  1", "0  0"]);
  });

  it.each([
    [
      "x' = {1} /\\ ~UNCHANGED <<x, x>>",
      "{1}",
      [
        "Line 5, column 9 to line 5, column 39 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 39 in M",
        "Line 5, column 22 to line 5, column 39 in M",
        "Line 5, column 32 to line 5, column 39 in M",
      ],
    ],
    [
      'x\' = "a" /\\ ~UNCHANGED {x}',
      '"a"',
      [
        "Line 5, column 9 to line 5, column 34 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 34 in M",
        "Line 5, column 22 to line 5, column 34 in M",
        "Line 5, column 32 to line 5, column 34 in M",
      ],
    ],
    [
      'x\' = "a" /\\ UNCHANGED {x}',
      '"a"',
      [
        "Line 5, column 9 to line 5, column 33 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 33 in M",
        "Line 5, column 31 to line 5, column 33 in M",
      ],
    ],
    [
      "x' = {1} /\\ UNCHANGED <<x, x>>",
      "{1}",
      [
        "Line 5, column 9 to line 5, column 38 in M",
        "Line 5, column 9 to line 5, column 16 in M",
        "Line 5, column 21 to line 5, column 38 in M",
        "Line 5, column 31 to line 5, column 38 in M",
      ],
    ],
    [
      "x' = <<1>> /\\ UNCHANGED <<x>>",
      "<<1>>",
      [
        "Line 5, column 9 to line 5, column 37 in M",
        "Line 5, column 9 to line 5, column 18 in M",
        "Line 5, column 23 to line 5, column 37 in M",
        "Line 5, column 33 to line 5, column 37 in M",
      ],
    ],
  ])(
    "frames the value a predicate's UNCHANGED compares with its successor's, as TLC's equals heads the FingerprintException with it: %s",
    async (next, successor, callStack) => {
      const reason = `Attempted to check equality of integer 0 with non-integer:\n${successor}`;
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      "UNCHANGED of a tuple with an impure element",
      "LET m == <<x, RandomElement({y})>> IN (y' = y /\\ UNCHANGED m)",
      0,
      [2, 1, 1],
    ],
    [
      "UNCHANGED of a tuple with an impure element under -coverage",
      "LET m == <<x, RandomElement({y})>> IN (y' = y /\\ UNCHANGED m)",
      1,
      [2, 1, 1],
    ],
    ["a prime under -coverage", "LET m == x IN (m' = 1 - x /\\ UNCHANGED y)", 1, [3, 2, 2]],
    ["an equality under -coverage", "LET m == x' IN (m = 1 - x /\\ UNCHANGED y)", 1, [3, 2, 2]],
  ])(
    "finds the variables of a LET definition it evaluates at each reference in %s, as TLC looks through the definition",
    async (_title, next, coverage, counts) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        coverage: coverage || undefined,
      });
      expect([result.failure, result.generatedStates, result.distinctStates, result.depth]).toEqual(
        [undefined, ...counts],
      );
    },
  );

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

  it.each(["5", "[a |-> 1]"])(
    "applies a function of two arguments to %s in an action as TLC does",
    async (argument) => {
      const result = await checkSteps(
        `Step == [k \\in {1}, j \\in {2} |-> x' = k][${argument}]`,
        "INIT Init\nNEXT Step",
      );
      expect([
        result.failure?.message,
        new Set(
          result.failure?.callStack?.map((expression) => expression.location.range?.end.column),
        ),
      ]).toEqual([
        `${UNEXPECTED_EXCEPTION}Attempted to apply a function to an argument not in its domain.\nline 6, col 9 to line 6, col 41 of module M`,
        new Set([43 + argument.length]),
      ]);
    },
  );

  it.each([
    [
      "<<1>>",
      "[k \\in {1}, j \\in {2} |-> <expression line 6, col 35 to line 6, col 40 of module M>],\nthe argument list is:\n<<1>>\nwhich does not match its formal parameter.\n",
    ],
    [
      "<<1, 2, 3>>",
      "[k \\in {1}, j \\in {2} |-> <expression line 6, col 35 to line 6, col 40 of module M>],\nthe argument list is:\n<<1, 2, 3>>\nwhich does not match its formal parameter.\n",
    ],
  ])("rejects %s for a function of two arguments in an action", async (argument, message) => {
    const result = await checkSteps(
      `Step == [k \\in {1}, j \\in {2} |-> x' = k][${argument}]`,
      "INIT Init\nNEXT Step",
    );
    expect(result.failure?.message).toBe(
      `${UNEXPECTED_EXCEPTION}In applying the function\n${message}`,
    );
  });

  it.each([
    ["[k \\in {1}, j \\in {2} |-> k + j]", "<<1, 2, 3>>", "(<<1, 2>> :> 3)"],
    [
      "[<<a, b>> \\in {<<1, 2>>}, c \\in {3} |-> a + b + c]",
      "<<<<1, 2>>>>",
      "(<<<<1, 2>>, 3>> :> 6)",
    ],
    [
      "[<<a, b>> \\in {<<1, 2>>}, c \\in {3} |-> a + b + c]",
      "<<<<1, 2>>, 3, 4>>",
      "(<<<<1, 2>>, 3>> :> 6)",
    ],
  ])(
    "rejects applying %s to the argument list %s of the wrong length",
    async (fcn, argument, shown) => {
      const result = await checkModule(`ASSUME PrintT(${fcn}[${argument}])`);
      expect(result.violation?.message).toBe(
        `In applying the function\n${shown},\nthe argument list is:\n${argument}\nwhich does not match its formal parameter.\n`,
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

  it("prints a set filter whose predicate is a numeral as the numeral, like TLC", async () => {
    const result = await checkSteps("Start == x = {n \\in Nat : 1}", "INIT Start\nNEXT Next");
    expect(result.failure?.initialState?.x && formatValue(result.failure.initialState.x)).toBe(
      "{n \\in Nat : <expression 1> }",
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

  it.each([
    ["x /\\ TRUE", 255],
    ['Assert(FALSE, "a")', 14],
  ])(
    "reports a success to the summary and exits with the status of %s when the replay of the next state doesn't fail again",
    async (failing, exitCode) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ TLCSet(1, 0)\nNext == TLCSet(1, TLCGet(1) + 1) /\\ x' = IF TLCGet(1) = 1 THEN ${failing} ELSE x\n====`,
        config: "INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE",
      });
      expect([
        result.failure?.callStack,
        result.outDegrees && getOutDegreeSummary(result.outDegrees),
        result.failure?.exitCode,
      ]).toEqual([
        undefined,
        "The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).",
        exitCode,
      ]);
    },
  );

  it.each([
    [
      "checks the postconditions of a deadlocked failed state",
      'Init == x = 0 /\\ TLCSet(1, 0) /\\ PrintT(<<"i", TLCGet(1)>>)\nNext == TLCSet(1, TLCGet(1) + 1) /\\ PrintT(<<"n", TLCGet(1)>>) /\\ x\' = IF TLCGet(1) = 1 THEN (x /\\ TRUE) ELSE x\nPost == PrintT(<<"post", TLCGet(1)>>)',
      "INIT Init\nNEXT Next\nPOSTCONDITION Post",
      ['<<"i", 0>>', '<<"post", 0>>', '<<"n", 1>>'],
      75,
    ],
    [
      "rebuilds the trace to a successor that fails a constraint",
      'Init == x = 0 /\\ TLCSet(1, 0)\nNext == x < 3 /\\ \\E b \\in {1, 2} : TLCSet(1, TLCGet(1) + 1) /\\ x\' = x + b\nC == PrintT(<<"c", x, TLCGet(1)>>) /\\ IF x = 3 /\\ TLCGet(1) \\in {5, 6} THEN 1 \\in 2 ELSE TRUE',
      "INIT Init\nNEXT Next\nCONSTRAINT C\nCHECK_DEADLOCK FALSE",
      ['<<"c", 3, 6>>'],
      75,
    ],
    [
      "rebuilds the trace to a successor that fails an invariant",
      'Init == x = 0 /\\ TLCSet(1, 0)\nNext == x < 3 /\\ \\E b \\in {1, 2} : TLCSet(1, TLCGet(1) + 1) /\\ PrintT(<<"n", x, TLCGet(1)>>) /\\ x\' = IF TLCGet(1) = 8 THEN (x /\\ TRUE) ELSE x + b\nInv == IF x = 4 /\\ TLCGet(1) = 6 THEN 1 \\in 2 ELSE TRUE',
      "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      ['<<"n", 2, 5>>', '<<"n", 2, 6>>'],
      76,
    ],
  ])(
    "%s before TLC's ModelChecker replays the next state",
    async (_title, definitions, config, traceOutput, exitCode) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\n${definitions}\n====`,
        config,
        onPrint: () => {},
      });
      expect([result.failure?.traceOutput, result.failure?.exitCode]).toEqual([
        traceOutput,
        exitCode,
      ]);
    },
  );

  it("keeps the initial state of a failed step as it is, as TLC's TLCTrace prints it without generating the initial states again", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0 /\\ TLCSet(1, 0)\nNext == \\E b \\in {1, 2} : TLCSet(1, TLCGet(1) + 1) /\\ PrintT(<<"n", b, TLCGet(1)>>) /\\ x\' = x + b\nC == IF x = 2 /\\ TLCGet(1) \\in {2, 6} THEN 1 \\in 2 ELSE TRUE\n====',
      config: "INIT Init\nNEXT Next\nCONSTRAINT C",
      onPrint: () => {},
    });
    expect([
      result.failure?.trace.map((step) => step.output),
      result.failure?.traceOutput,
      result.failure?.exitCode,
    ]).toEqual([[[], ['<<"n", 1, 3>>', '<<"n", 2, 4>>']], ['<<"n", 1, 5>>', '<<"n", 2, 6>>'], 75]);
  });

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

  it.each([
    ["Fail \\/ Shown", "", ['<<"s", 0>>']],
    ["Fail \\/ Shown", "CHECK_DEADLOCK FALSE", []],
    ["Shown \\/ Fail", "", ['<<"s", 1>>']],
  ])(
    "prints the output of the trace again after %s fails only as TLC finds the state deadlocked (%s)",
    async (step, config, expected) => {
      const result = await checkSteps(
        `Shown == PrintT(<<"s", x>>) /\\ Next\nFail == x = 1 /\\ x' = 1 /\\ 1\nStep == ${step}`,
        `INIT Init\nNEXT Step\n${config}`,
      );
      expect(result.failure?.traceOutput).toEqual(expected);
    },
  );

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

  it("fails a Java override of no arguments that a <- applies to some, like TLC", async () => {
    const getError = (signature: string) =>
      getJavaError(
        `value.impl.Value tlc2.module.${signature}()`,
        "cannot convert MethodHandle()Value to (Value[])Value",
      );
    const one = "CONSTANT F(_)\nASSUME PrintT(F(1))";
    const cases = [
      ["Naturals, TLC", one, "F <- Nat", getError("Naturals.Nat")],
      [ALL_MODULES, one, "F <- Int", getError("Integers.Int")],
      [
        "Integers, Sequences, FiniteSets, TLC",
        "Op(a) == a\nASSUME PrintT(Op(1))",
        "Op <- STRING",
        getError("Strings.STRING"),
      ],
      [ALL_MODULES, one, "F <- EmptyBag", getError("Bags.EmptyBag")],
      [
        ALL_MODULES,
        "CONSTANT F(_)\nASSUME PrintT(F(1) = 1)",
        "F <- JavaTime",
        getError("TLC.JavaTime"),
      ],
      [ALL_MODULES, one, "F <- Any", getError("TLC.Any")],
      [
        ALL_MODULES,
        "CONSTANT F(_)\nAp(Op(_)) == Op(1)\nASSUME PrintT(Ap(F))",
        "F <- Nat",
        getError("Integers.Nat"),
      ],
    ];
    expect(await getOverrideMessages(cases)).toEqual(cases.map((item) => item[3]));
  });

  it("checks the number of arguments an arithmetic Java override gets from a <-, like TLC", async () => {
    const integers = "tlc2.value.impl.IntValue,tlc2.value.impl.IntValue";
    const one = "CONSTANT F(_)\nASSUME PrintT(F(1))";
    const cases = [
      [
        "Naturals, TLC",
        one,
        "F <- +",
        getJavaError(
          `value.impl.IntValue tlc2.module.Naturals.Plus(${integers})`,
          "array is not of length 2",
        ),
      ],
      [
        "Naturals, TLC",
        one,
        "F <- ..",
        getJavaError(
          `value.impl.IntervalValue tlc2.module.Naturals.DotDot(${integers})`,
          "array is not of length 2",
        ),
      ],
      [
        "Integers, TLC",
        "CONSTANT F(_, _)\nASSUME PrintT(F(1, 2))",
        "F <- -.",
        getJavaError(
          "value.impl.IntValue tlc2.module.Integers.Neg(tlc2.value.impl.IntValue)",
          "array is not of length 1",
        ),
      ],
    ];
    expect(await getOverrideMessages(cases)).toEqual(cases.map((item) => item[3]));
  });

  it("applies the Java override that a <- gives a name of no arguments to none, like TLC", async () => {
    const getError = (signature: string, result: string) =>
      getJavaError(signature, `handle's method type (IValue[])${result} but found ()Value`);
    const none = "CONSTANT N\nASSUME PrintT(N)";
    const value = "tlc2.value.impl.Value";
    const len = `value.impl.IntValue tlc2.module.Sequences.Len(${value})`;
    const cases = [
      [ALL_MODULES, none, "N <- Len", getError(len, "IntValue")],
      [
        ALL_MODULES,
        none,
        "N <- Head",
        getError(`value.impl.Value tlc2.module.Sequences.Head(${value})`, "Value"),
      ],
      [
        ALL_MODULES,
        none,
        "N <- IsFiniteSet",
        getError(`value.IBoolValue tlc2.module.FiniteSets.IsFiniteSet(${value})`, "IBoolValue"),
      ],
      [
        ALL_MODULES,
        none,
        "N <- ToJson",
        getError(
          "value.impl.StringValue tlc2.module.Json.toJson(tlc2.value.IValue) throws java.io.IOException",
          "StringValue",
        ),
      ],
      [
        ALL_MODULES,
        none,
        "N <- JsonDeserialize",
        getError(
          "value.IValue tlc2.module.Json.deserialize(tlc2.value.impl.StringValue) throws java.io.IOException",
          "IValue",
        ),
      ],
      [
        ALL_MODULES,
        none,
        "N <- ..",
        getError(
          "value.impl.IntervalValue tlc2.module.Integers.DotDot(tlc2.value.impl.IntValue,tlc2.value.impl.IntValue)",
          "IntervalValue",
        ),
      ],
      [
        ALL_MODULES,
        none,
        "N <- >",
        getError(`value.impl.BoolValue tlc2.module.Integers.GT(${value},${value})`, "BoolValue"),
      ],
      [
        "Integers, Sequences, FiniteSets, TLC",
        "Op == 1\nASSUME PrintT(Op)",
        "Op <- Len",
        getError(len, "IntValue"),
      ],
    ];
    expect(await getOverrideMessages(cases)).toEqual(cases.map((item) => item[3]));
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS ${ALL_MODULES}\nCONSTANT N\nVARIABLE x\nInit == x = N\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next\nCONSTANT N <- Len",
    });
    expect([result.failure?.message, formatCallStackLines(result)]).toEqual([
      getError(len, "IntValue"),
      ["Line 5, column 9 to line 5, column 13 in M", "Line 5, column 13 to line 5, column 13 in M"],
    ]);
    expect((await checkModule("CONSTANT N\nASSUME TRUE", "CONSTANT N <- Len")).status).toBe(
      "success",
    );
  });

  it("names the return type of a synchronized Java override applied to no arguments, like TLC", async () => {
    const getError = (method: string, result: string) =>
      `Attempted to apply the operator overridden by the Java method\npublic static synchronized tlc2.value.impl.${result} tlc2.module.TLCExt.${method}(tlc2.value.impl.Value),\nbut it produced the following error:\nhandle's method type (IValue[])${result} but found ()Value`;
    const none = "CONSTANT N\nASSUME PrintT(N)";
    const cases = [
      ["TLC, TLCExt", none, "N <- TLCFP", getError("tlcFingerprint", "IntValue")],
      ["TLC, TLCExt", none, "N <- TLCModelValue", getError("tlcModelValue", "Value")],
    ];
    expect(await getOverrideMessages(cases)).toEqual(cases.map((item) => item[3]));
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

  it.each([
    [
      "an invariant",
      "Inv == ENABLED (y' = 1 - y /\\ UNCHANGED (IF z = 2 THEN 0 ELSE x))",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      "z",
      75,
      undefined,
    ],
    [
      "an invariant under coverage",
      "Inv == ENABLED (y' = 1 - y /\\ UNCHANGED (IF z = 2 THEN 0 ELSE x))",
      "INIT Init\nNEXT Next\nINVARIANT Inv",
      "z",
      75,
      1,
    ],
    [
      "a fair action",
      "A == y' = y /\\ UNCHANGED (x + 1)\nSpec == Init /\\ [][Next]_<<x, y, z>> /\\ WF_<<x, y, z>>(A)\nProp == <>(x = 5)",
      "SPECIFICATION Spec\nPROPERTY Prop",
      "x",
      255,
      undefined,
    ],
  ])(
    "words an unassigned variable under UNCHANGED of an expression in ENABLED in %s like TLC",
    async (_place, definitions, config, variable, exitCode, coverage) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y, z\nInit == x = 0 /\\ y = 0 /\\ z = 0\nNext == x' = 1 - x /\\ UNCHANGED <<y, z>>\n${definitions}\n====`,
        config,
        coverage,
      });
      expect([result.failure?.message, result.failure?.exitCode]).toEqual([
        expect.stringContaining(
          `The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable ${variable} occurring in the state formula v.\n`,
        ),
        exitCode,
      ]);
    },
  );

  it.each([
    ["", undefined],
    [" under -coverage", 1],
  ])(
    "compares an application under UNCHANGED in ENABLED without a warning once the step assigns its variables%s, as TLC's Tool#enabledUnchanged does",
    async (_title, coverage) => {
      const warnings: string[] = [];
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 - x /\\ UNCHANGED y\nOp(v) == v\nInv == ENABLED (x' = 1 /\\ UNCHANGED Op(x))\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        coverage,
        onProgress: (progress) => {
          if (progress.kind === "warning") warnings.push(progress.text);
        },
      });
      expect([result.status, warnings]).toEqual(["invariant-violation", []]);
    },
  );

  it.each([
    ["", undefined],
    [" under -coverage", 1],
  ])(
    "keeps the body of an application under UNCHANGED in ENABLED unchanged where the step leaves its variable unassigned%s, unlike TLC",
    async (_title, coverage) => {
      const result = await check({
        source:
          "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = x\nOp(v) == v\nInv == ENABLED (UNCHANGED Op(x))\n====",
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
        coverage,
      });
      expect([result.failure, result.generatedStates, result.distinctStates]).toEqual([
        undefined,
        2,
        1,
      ]);
    },
  );

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

  it.each(["INVARIANT Bad", "CONSTRAINT Bad", "ACTION_CONSTRAINT BadA", "PROPERTY Prop"])(
    "evaluates a failing %s once under coverage before the replay, as TLC does",
    async (configLine) => {
      const prints: string[] = [];
      const result = await check({
        source:
          '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE v\nInit == v = 0\nNext == v\' = 1 - v\nBad == PrintT("a") /\\ v \\div 0 = 1\nBadA == PrintT("a") /\\ v\' \\div 0 = 1\nProp == [][BadA]_v\n====',
        config: `INIT Init\nNEXT Next\n${configLine}`,
        coverage: 1,
        onPrint: (text) => prints.push(text),
      });
      expect([prints, result.failure?.traceOutput]).toEqual([['"a"'], ['"a"']]);
    },
  );

  it("reports the error of the evaluation under coverage of a failing invariant, before printing a recursive function makes TLC enumerate it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE v\nfib[n \\in 0..3] == IF n < 2 THEN n ELSE fib[n - 1] + fib[n - 2]\nInit == v = 0\nNext == UNCHANGED v\nInv == v = 0 /\\ fib[7] = 1\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      coverage: 1,
    });
    expect(result.failure?.message).toBe(
      "In applying the function\n(0 :> 0 @@ 1 :> 1 @@ 2 :> 1 @@ 3 :> 2),\nthe first argument is:\n7\nwhich is not in its domain.\n",
    );
  });

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

  // Deviation from TLC: Naturals#Divide rounds some negative quotients toward 0 and wraps on overflow, where tla-ts floors and reports the overflow as Integers#Divide does.
  it.each([
    [false, "Naturals", ["<<-1, -1, -2>>"]],
    [true, "Naturals", ["<<-1, -1, -2>>"]],
    [false, "Integers", ["<<-1, -1, -2>>"]],
  ])(
    "divides negative integers as TLC does when it records a trace (%s) for a spec of %s",
    async (isTraceRecorded, module, quotients) => {
      const printed: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS ${module}, TLC\nASSUME PrintT(<<1 \\div (0 - 2), (0 - 1) \\div 2, (0 - 3) \\div 2>>)\nASSUME PrintT((0 - 2147483647 - 1) \\div (0 - 1))\n====`,
        config: "",
        traceSpec: isTraceRecorded ? { module: "M_TTrace", traceFile: "M_TTrace.bin" } : undefined,
        onPrint: (text) => printed.push(text),
      });
      expect([printed, result.violation?.message]).toEqual([
        quotients,
        "Overflow when computing -2147483648 \\div -1",
      ]);
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

  it("fails on a set that mixes types in a value TLC compares with itself", async () => {
    const messages = await Promise.all(
      [
        ['ASSUME PrintT(LET D == <<{1, "a"}>> IN D = D)', ""],
        ['ASSUME PrintT(LET D == [a |-> {1, "a"}] IN D = D)', ""],
        ['ASSUME PrintT(LET D == {{1, "a"}} IN D = D)', ""],
        ['ASSUME PrintT(LET D == SUBSET {1, "a"} IN D = D)', ""],
        ['ASSUME PrintT(LET D == [{1, "a"} -> {1}] IN D = D)', ""],
        ['ASSUME PrintT(LET D == {1, "a"} \\X {1} IN D = D)', ""],
        ['ASSUME PrintT(LET D == {1, "a"} IN D \\in {D})', ""],
        ['D == {1, "a"}\nASSUME PrintT(D = D)', ""],
        ["Def == 3\nASSUME PrintT(Def = Def)", 'CONSTANT Def = {{1, "a"}}'],
        ['ASSUME PrintT(LET D == {1, "a"} IN Cardinality({D, D}))', ""],
      ].map(async (item) => (await checkModule(item[0], item[1])).violation?.message),
    );
    const message = 'Attempted to compare string "a" with non-string:\n1';
    expect(messages).toEqual([
      ...Array(9).fill(message),
      getJavaError(
        "value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value)",
        message,
      ),
    ]);
  });

  it("starts a check without the values an earlier check made", async () => {
    const earlier = await checkModule(
      'CONSTANT C\nASSUME \\E s \\in {{1, "a"}} : C \\notin {1}',
      "CONSTANT C = t_a",
    );
    const later = await checkModule("ASSUME LET D == [{} -> {[n \\in Nat |-> n]}] IN D = D");
    expect([earlier.violation?.message, later.status]).toEqual([
      "Attempted to check equality of the typed model value t_a and the non-model value\n1",
      "success",
    ]);
  });

  it("stops at an empty set of functions, records or tuples TLC compares with itself", async () => {
    const statuses = await Promise.all(
      [
        'ASSUME LET F == [{} -> {1, "a"}] IN F = F',
        'ASSUME LET F == [{1, "a"} -> {}] IN F = F',
        'ASSUME LET F == [a : {}, b : {1, "a"}] IN F = F',
        'ASSUME LET F == [b : {1, "a"}, a : {}] IN F = F',
        'ASSUME LET F == {} \\X {1, "a"} IN F = F',
        'ASSUME LET F == {1, "a"} \\X {} IN F = F',
        'ASSUME LET F == <<[{} -> {1, "a"}]>> IN F = F',
        'ASSUME LET F == [{1, "a"} -> {}] IN {F} = {F}',
        'ASSUME LET F == [{} -> {1, "a"}] IN F \\in {F}',
        'ASSUME LET F == [{} -> {1, "a"}] IN F # F => FALSE',
        'ASSUME LET F == [{} -> {1, "a"}] IN Cardinality({F, F}) = 1',
        'ASSUME LET F == [{1, "a"} -> {}] IN Cardinality({F, F}) = 1',
      ].map(
        async (assumption) => (await checkModule(`ASSUME 1 \\in {1, "a"}\n${assumption}`)).status,
      ),
    );
    expect(statuses).toEqual(Array(12).fill("success"));
  });

  it("evaluates a function over Nat in a value TLC compares with itself", async () => {
    const messages = await Promise.all(
      [
        "ASSUME LET D == <<[n \\in Nat |-> n]>> IN D = D",
        "ASSUME LET D == <<1, [n \\in Nat |-> n]>> IN D = D",
        "ASSUME LET D == {[n \\in Nat |-> n]} IN D = D",
        "ASSUME LET D == [a |-> [n \\in Nat |-> n]] IN D = D",
        "ASSUME LET D == [k \\in {1, 2} |-> [n \\in Nat |-> n]] IN D = D",
        "ASSUME LET D == <<[n \\in Nat |-> n]>> IN D \\in {D}",
        "ASSUME LET D == <<[n \\in Nat |-> n]>> IN D # D => FALSE",
        "ASSUME LET D == <<{n \\in Nat : n > 2}>> IN D = D",
        "ASSUME LET D == <<[n \\in Nat |-> n]>> IN Cardinality({D, D}) = 1",
      ].map(async (assumption) => (await checkModule(assumption)).violation?.message),
    );
    const message = "Attempted to compute the number of elements in the overridden value Nat.";
    expect(messages).toEqual([
      ...Array(7).fill(message),
      "Attempted to enumerate { x \\in S : p(x) } when S:\nNat\nis not enumerable",
      getJavaError(
        "value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value)",
        message,
      ),
    ]);
  });

  it("compares the base of a Seq(S) TLC compares with itself", async () => {
    const messages = await Promise.all(
      [
        "ASSUME LET Q == Seq({[n \\in Nat |-> n]}) IN Q = Q",
        "ASSUME LET Q == <<Seq({[n \\in Nat |-> n]})>> IN Q = Q",
        "ASSUME LET Q == Seq({[n \\in Nat |-> n]}) IN Q \\in {Q}",
        "ASSUME LET Q == Seq({[n \\in Nat |-> n]}) IN Q # Q => FALSE",
        'ASSUME LET Q == {Seq({1, "a"})} IN Q = Q',
        'ASSUME LET Q == Seq(SUBSET {1, "a"}) IN Q = Q',
        'ASSUME LET Q == Seq([a : {}, b : {1, "a"}]) IN Q = Q',
        "ASSUME LET Q == Seq(Nat) IN Q = Q",
      ].map(async (assumption) => (await checkModule(assumption)).violation?.message),
    );
    expect(messages).toEqual([
      ...Array(4).fill("Attempted to compute the number of elements in the overridden value Nat."),
      ...Array(2).fill('Attempted to compare string "a" with non-string:\n1'),
      undefined,
      undefined,
    ]);
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

  it("evaluates a TLCEval argument that reads a variable SANY ignores in the state", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS TLC\nVARIABLE v\nInit == v = 0\nNext == UNCHANGED v\nInv == TLCEval(Print(v, TRUE))\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["success", ["0  TRUE"]]);
  });

  it.each([
    [
      "TLCEval(<<5, 6>>)[6]",
      "Attempted to apply function:\n<<5, 6>>\nto argument 6, which is not in the domain of the function.",
    ],
    [
      "TLCEval([a |-> 1]).b",
      'Attempted to apply function:\n[a |-> 1]\nto argument "b", which is not in the domain of the function.',
    ],
    [
      'TLCEval(<<5, 6>>)["a"]',
      'Attempted to apply function with integer domain to the non-integer argument "a"',
    ],
  ])("applies %s as the plain function TLCEval makes", async (expression, message) => {
    expect((await checkModule(`ASSUME PrintT(${expression})`)).violation?.message).toBe(message);
  });

  it("evaluates a constant TLCEval argument once for every state", async () => {
    const prints: string[] = [];
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == x >= 0 /\\ TLCEval(Print("b", TRUE))\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["deadlock", ['"b"  TRUE']]);
  });

  it("evaluates a constant TLCEval argument again under a bound name", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nASSUME \\A i \\in 1..3 : TLCEval(Print("a", 7)) = 7\n====',
      config: "",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"a"  7', '"a"  7', '"a"  7']);
  });

  it("evaluates a constant TLCEval argument once under a LET of operators with parameters, but again under an operator argument", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nOp(G(_)) == TLCEval(Print(G("o"), TRUE))\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == x >= 0 /\\ LET F(a) == a IN TLCEval(Print(F("l"), TRUE)) /\\ Op(F)\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"l"  TRUE', '"o"  TRUE', '"o"  TRUE', '"o"  TRUE']);
  });

  it("evaluates a constant TLCEval argument again in an operator without parameters called under a bound name, whose context TLC passes on", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nD == TLCEval(Print("d", TRUE)) /\\ x >= 0\nD2 == D\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == /\\ \\A i \\in 1..2 : D\n       /\\ \\A i \\in 1..2 : D2\n       /\\ D\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(Array.from({ length: 13 }, () => '"d"  TRUE'));
  });

  it("evaluates a constant TLCEval argument again in a selection or CASE under a bound name, whose context TLC passes on", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nE == TLCEval(Print("e", TRUE)) /\\ TRUE\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == /\\ \\A i \\in 1..2 : E!1 /\\ x >= 0\n       /\\ \\A i \\in 1..2 : CASE x >= 0 -> TLCEval(Print("c", TRUE))\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      '"e"  TRUE',
      ...Array.from({ length: 3 }, () => [
        '"e"  TRUE',
        '"e"  TRUE',
        '"c"  TRUE',
        '"c"  TRUE',
      ]).flat(),
    ]);
  });

  it("caches a constant TLCEval argument in the first LET definition without parameters only, whose context TLC leaves empty", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nL == LET a == TLCEval(Print("a", TRUE))\n         b == TLCEval(Print("b", TRUE))\n     IN a /\\ b /\\ x >= 0\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == L\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"a"  TRUE', '"b"  TRUE', '"b"  TRUE', '"b"  TRUE']);
  });

  it("caches a constant TLCEval argument in the first LET definition without parameters after a RECURSIVE operator, which TLC leaves out of the context", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nL == LET RECURSIVE r(_)\n         r(n) == IF n = 0 THEN 0 ELSE r(n - 1)\n         a == TLCEval(Print("a", TRUE))\n         b == TLCEval(Print("b", TRUE))\n     IN a /\\ b /\\ r(1) = 0 /\\ x >= 0\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == L\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual(['"a"  TRUE', '"b"  TRUE', '"b"  TRUE', '"b"  TRUE']);
  });

  it("caches a constant TLCEval argument in the first LET definition without parameters before a RECURSIVE operator, which TLC finds by its definition", async () => {
    const prints: string[] = [];
    await check({
      source:
        '---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nL == LET a == TLCEval(Print("a", TRUE))\n         b == TLCEval(Print("b", TRUE))\n         RECURSIVE r(_)\n         r(n) == IF n = 0 THEN 0 ELSE r(n - 1)\n         c == TLCEval(Print("c", TRUE))\n     IN a /\\ b /\\ c /\\ r(1) = 0 /\\ x >= 0\nInit == x = 0\nNext == x < 2 /\\ x\' = x + 1\nInv == L\n====',
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      onPrint: (text) => prints.push(text),
    });
    expect(prints).toEqual([
      '"a"  TRUE',
      '"b"  TRUE',
      '"c"  TRUE',
      '"b"  TRUE',
      '"c"  TRUE',
      '"b"  TRUE',
      '"c"  TRUE',
    ]);
  });

  it("evaluates a LET definition without parameters that calls a RECURSIVE operator defined after it, as TLC does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = LET RECURSIVE f(_)\n                c == f(2)\n                f(n) == IF n = 0 THEN 0 ELSE f(n - 1) + 1\n            IN c\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it("rejects EXCEPT at an argument that is not a tuple of a lazy function of two arguments", async () => {
    const pairs = [1, 2].flatMap((first) =>
      [0, 1, 2, 3, 4].map((second) => `<<${first}, ${second}>> :> 100`),
    );
    expect(
      (
        await checkModule(
          "ASSUME PrintT([[a \\in {1, 2}, b \\in 0..4 |-> 100] EXCEPT ![5] = 0][<<1, 1>>])",
        )
      ).violation?.message,
    ).toBe(
      `In applying the function\n( ${pairs.join(" @@\n  ")} ),\nthe argument list is:\n5\nwhich does not match its formal parameter.\n`,
    );
  });

  it.each([
    ['PrintT("a") /\\ PrintT("b") /\\ x + 1', ['"a"', '"b"']],
    ['Print("p", x + 1)', ['"p"  1']],
  ])("evaluates the invariant %s once when it is not boolean", async (body, texts) => {
    const prints: string[] = [];
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\nInv == ${body}\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint: (text) => prints.push(text),
    });
    expect([result.status, prints]).toEqual(["error", texts]);
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

  it.each([
    [
      "S \\cap T",
      "CONSTANTS S, T\nASSUME S \\cap T = {}",
      "CONSTANTS S = {__x, __y} T = {m1, {m2}}",
      "Attempted to compare the typed model value __x and non-model value\n{m2}",
    ],
    [
      "T \\cap S",
      "CONSTANTS S, T\nASSUME T \\cap S = {}",
      "CONSTANTS S = {__x, __y} T = {m1, {m2}}",
      "Attempted to compare the typed model value __y and the non-model value\n{m2}",
    ],
    [
      "a normalized set",
      "CONSTANTS T, C\nASSUME C \\notin T",
      "CONSTANTS C = __x T = {m1, {m2}}",
      "Attempted to compare the typed model value __x and non-model value\n{m2}",
    ],
    [
      "S \\ T",
      "CONSTANTS S, D, E\nASSUME S \\ {D, E} = S",
      "CONSTANTS S = {t_a, m1} D = m1 E = 1",
      "Attempted to check equality of the typed model value t_a and the non-model value\n1",
    ],
    [
      "a set of integers",
      "CONSTANTS C, D\nASSUME 6 \\in {C, D, 5, 6, 7}",
      "CONSTANTS C = t_a D = m2",
      "Attempted to check equality of typed model value t_a and non-model value\n6",
    ],
    [
      "a union",
      "CONSTANTS C, D, E, F\nASSUME C \\notin {D, E} \\cup {F}",
      "CONSTANTS C = x_1 D = m1 E = m2 F = t_a",
      "Attempted to check equality of the differently-typed model values t_a and x_1",
    ],
  ])(
    "compares the elements of %s with a typed model value like TLC",
    async (_name, body, config, message) => {
      const result = await checkModule(body, config);
      expect([result.status, result.violation?.message]).toEqual(["assumption-violation", message]);
    },
  );

  it.each([
    [
      "<<C, D>> # (C :> 1) @@ (D :> 2)",
      "CONSTANTS C = zz D = m3",
      "Attempted to compare an integer with non-integer:\nzz.",
    ],
    [
      "[i \\in 1..2 |-> i] # (C :> 1) @@ (D :> 2)",
      "CONSTANTS C = m1 D = m2",
      "Attempted to compare an integer with non-integer:\nm1.",
    ],
    [
      "[a |-> 1, b |-> 2] # (C :> 1) @@ (D :> 2)",
      "CONSTANTS C = m1 D = m2",
      "Attempted to check equality of record:\n[a |-> 1, b |-> 2]\nwith non-record\n(m1 :> 1 @@ m2 :> 2)",
    ],
    [
      "Cardinality({<<1, 2>>, (C :> 1) @@ (D :> 2)}) = 2",
      "CONSTANTS C = m1 D = m2",
      getJavaError(
        "value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value)",
        "Attempted to compare integer with non-integer\nm1.",
      ),
    ],
    [
      "Cardinality({(C :> 1) @@ (D :> 2), <<1, 2>>}) = 2",
      "CONSTANTS C = m1 D = m2",
      getJavaError(
        "value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value)",
        "Attempted to compare integer with non-integer:\nm1.",
      ),
    ],
  ])("compares the model value keys in %s like TLC", async (assumption, config, message) => {
    const result = await checkModule(`CONSTANTS C, D\nASSUME ${assumption}`, config);
    expect([result.status, result.violation?.message]).toEqual(["assumption-violation", message]);
  });

  it("compares a function of a set of integers with model value keys like TLC", async () => {
    const result = await checkModule(
      "CONSTANTS C, D\nASSUME [i \\in {1, 2} |-> i] # (C :> 1) @@ (D :> 2)",
      "CONSTANTS C = m1 D = m2",
    );
    expect(result.status).toBe("success");
  });

  it.each([
    ["Cardinality({D, STRING}) = 2", "success", undefined],
    ["STRING # D", "success", undefined],
    ["D \\notin {Int}", "success", undefined],
    [
      "{D, STRING, {C, 1}} = {}",
      "assumption-violation",
      "Attempted to compare the set {a_, 1} with the value:\nSTRING",
    ],
  ])(
    "orders an overridden set after a typed model value in %s like TLC",
    async (assumption, status, message) => {
      const result = await checkModule(
        `CONSTANTS C, D\nASSUME ${assumption}`,
        "CONSTANTS C = a_ D = t_a",
      );
      expect([result.status, result.violation?.message]).toEqual([status, message]);
    },
  );

  it("prints a function in the order TLC sorts it in as it checks it against a record", async () => {
    const result = await checkModule(
      "CONSTANTS C, D\nASSUME (D :> 1) @@ (C :> 2) \\in {[a |-> 1, b |-> 2], <<1, 2>>}",
      'CONSTANTS C = Mb D = "s"',
    );
    expect([result.status, result.violation?.message]).toEqual([
      "assumption-violation",
      'Attempted to check equality of record:\n[a |-> 1, b |-> 2]\nwith non-record\n(Mb :> 2 @@ "s" :> 1)',
    ]);
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

  it.each([
    [
      "an instance with parameters",
      "VARIABLES x, y\nI == INSTANCE Mid",
      "(\\E i \\in {1} : I!A(i))",
      "I!A",
      "y",
    ],
    ["an instance", "VARIABLES x, y\nI == INSTANCE Mid", "I!B", "I!B", "x"],
    ["EXTENDS", "EXTENDS Mid", "(\\E i \\in {1} : A(i))", "A", "y"],
  ])(
    "names an incomplete action from %s as TLC does",
    async (_title, head, action, name, missing) => {
      const result = await check({
        source: `---- MODULE M ----\n${head}\nC == x' = 2 /\\ y' = 2\nInit == x = 0 /\\ y = 0\nNext == ${action} \\/ C\n====`,
        config: "INIT Init\nNEXT Next",
        loadModule: (module) =>
          module === "Mid"
            ? "---- MODULE Mid ----\nVARIABLES x, y\nA(i) == x' = i\nB == y' = 1\n===="
            : undefined,
      });
      expect(result.failure?.message).toBe(
        `Successor state is not completely specified by action ${name} of the next-state relation. The following variable is not defined: ${missing}.\n`,
      );
    },
  );

  it("stops at a successor the next-state relation leaves incomplete under -continue", async () => {
    const result = await check({
      source: "---- MODULE M ----\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1\n====",
      config: "INIT Init\nNEXT Next",
      isContinued: true,
    });
    expect([result.failure?.message, result.failure?.exitCode, result.generatedStates]).toEqual([
      "Successor state is not completely specified by the next-state action. The following variable is not defined: y.\n",
      75,
      2,
    ]);
  });

  it("prints what finding the action of an incomplete successor prints, and nothing after the trace, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, TLC\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nA == PrintT(<<\"a\", x>>) /\\ x' = x + 1 /\\ (x > 0 \\/ y' = 0)\nNext == A\n====",
      config: "INIT Init\nNEXT Next",
      onPrint: () => {},
    });
    expect([
      result.failure?.trace.map((step) => [formatValue(step.state.x), step.output]),
      result.failure?.traceOutput ?? [],
    ]).toEqual([
      [
        ["0", []],
        ["1", ['<<"a", 0>>']],
        ["2", ['<<"a", 1>>']],
      ],
      [],
    ]);
  });

  it("fails as it prints an incomplete successor when another branch of its action fails, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x' = 1 /\\ (x = 0 \\/ <<x>>[2] = 0)\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([
      result.failure?.trace.map((step) => formatValue(step.state.x)),
      result.failure?.traceFailure?.message,
      result.failure?.exitCode,
    ]).toEqual([
      ["0"],
      `${UNEXPECTED_EXCEPTION}Attempted to access index 2 of tuple\n<<0>>\nwhich is out of bounds.`,
      75,
    ]);
  });

  it.each([
    [
      "a successor it can't fingerprint",
      'VARIABLE x\nInit == x = 0\nA == PrintT(<<"a", x>>) /\\ x \\in 0..1 /\\ x\' = x + 5\nB == PrintT(<<"b", x>>) /\\ x\' = IF x = 1 THEN [k \\in SUBSET {1} |-> 1 \\div 0] ELSE x + 1\nNext == A \\/ B',
      ['<<"a", 1>>'],
    ],
    [
      "an incomplete successor",
      'VARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == PrintT(<<"n", x>>) /\\ x\' = 1 /\\ (x = 0 \\/ <<x>>[2] = 0)',
      ['<<"n", 0>>'],
    ],
  ])(
    "keeps what the spec prints as TLC fails to print %s, like TLC",
    async (_name, definitions, expected) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC\n${definitions}\n====`,
        config: "INIT Init\nNEXT Next",
      });
      expect(result.failure?.traceFailure?.output).toEqual(expected);
    },
  );

  it("reports the failure of a successor it can't compare as it rebuilds the step, where TLC skips the successor and reports a TLC bug(5)", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = IF x = 1 THEN {1} \\X 2 ELSE x + 1\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([
      result.failure?.trace.map((step) => formatValue(step.state.x)),
      result.failure?.traceFailure?.message,
      result.failure?.fingerprint?.reason,
      result.failure?.exitCode,
    ]).toEqual([
      ["0", "1"],
      `${UNEXPECTED_EXCEPTION}Shouldn't call isEmpty() on value 2`,
      "Shouldn't call isEmpty() on value 2",
      75,
    ]);
  });

  // Deviation from TLC: TLC prints "Too many possible next states for the last state in the trace." after x = 1.
  it("rebuilds a step from a state with more successors than -maxSetSize, where TLC's Tool#getState fails", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == x < 3 /\\ x' = x + 1 /\\ y' \\in [{1, 2} -> SUBSET (1..(x + 1))]\nInv == x < 3\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\nCHECK_DEADLOCK FALSE",
      maxSetSize: 10,
    });
    expect([
      result.status,
      result.violation?.trace.map(
        (step) => `${formatValue(step.state.x)} ${formatValue(step.state.y)}`,
      ),
      result.violation?.traceFailure,
      [result.generatedStates, result.distinctStates, result.queuedStates],
    ]).toEqual([
      "invariant-violation",
      ["0 0", "1 <<{}, {}>>", "2 <<{}, {}>>", "3 <<{}, {}>>"],
      undefined,
      [70, 22, 15],
    ]);
  });

  it("records where the liveness check of a state fails after a successor of it is left incomplete, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, z\nInit == x = 0 /\\ z = FALSE\nA0 == x' = 0\nA1 == x' = 0\nNext == A0 \\/ A1\nSpec == Init /\\ [][Next]_<<x, z>> /\\ WF_<<x, z>>(A1)\nProp == []<>z\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    const ranges = result.failure?.callStack?.map((expression) => {
      const range = expression.location.range;
      return range && `${range.start.line}:${range.start.column}-${range.end.column}`;
    });
    expect(result.failure?.code).toBe(2109);
    expect([...new Set(ranges)]).toEqual(["7:50-51", "5:7-12", "7:41-48", "7:46-46"]);
  });

  it("records where the liveness check fails as it generates again the successors of a state left incomplete, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Sequences\nVARIABLES x, z\nInit == x = <<0>> /\\ z = 0\nA0 == x' = x\nA1 == x' = x /\\ (Tail(x) /\\ TRUE) /\\ z' = z\nNext == A0 \\/ A1\nSpec == Init /\\ [][Next]_<<x, z>>\nProp == [](z = 0 => (z = 0 ~> x = <<>>))\nConstraint == x' /= x\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop\nACTION_CONSTRAINT Constraint",
    });
    const ranges = result.failure?.callStack?.map((expression) => {
      const range = expression.location.range;
      return range && `${range.start.line}:${range.start.column}-${range.end.column}`;
    });
    expect(result.failure?.code).toBe(2109);
    expect([...new Set(ranges)]).toEqual(["6:7-43", "6:7-33", "6:7-12", "6:18-32", "6:18-24"]);
  });

  it("records AssertError's message after the expression it catches the failure of, as TLC evaluates it then", async () => {
    const result = await check({
      source:
        '---- MODULE M ----\nEXTENDS Naturals, TLCExt\nVARIABLE x\nInit == x = 0\nNext == x\' = x /\\ AssertError("m", 1 \\div 0) = 0\n====',
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.flatMap((expression) => {
      const range = expression.location.range;
      return range
        ? [`${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`]
        : [];
    });
    expect(ranges?.filter((range, index) => range !== ranges[index - 1])).toEqual([
      "5:9-5:48",
      "5:9-5:14",
      "5:19-5:48",
      "5:19-5:44",
      "5:36-5:43",
      "5:31-5:33",
      "5:48-5:48",
    ]);
  });

  it("records a value that fails to fingerprint inside a Java method as a nested expression, as TLC's MethodValue rethrows it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Sequences\nVARIABLE x\nInit == x = 0\nNext == SelectSeq(<<1>>, LAMBDA k : {x} = <<x>>) = <<>> /\\ x' = x\n====",
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.flatMap((expression) => {
      const range = expression.location.range;
      return range ? [`${range.start.line}:${range.start.column}-${range.end.column}`] : [];
    });
    expect([
      result.failure?.fingerprint,
      ranges?.filter((range, index) => range !== ranges[index - 1]),
    ]).toEqual([undefined, ["5:9-65", "5:9-55", "5:9-48", "5:37-47", "5:37-39"]]);
  });

  it("records the frames in Randomization of an error in TestRandomSetOfSubsets, which TLC evaluates from its definition", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, Randomization\nVARIABLE x\nInit == x = 0\nNext == x' = x\nInv == <<TestRandomSetOfSubsets(x - 1, 2, {1})>> /= <<>>\n====",
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
    });
    const ranges = result.failure?.callStack?.flatMap((expression) => {
      const range = expression.location.range;
      return range
        ? [
            `${range.module} ${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`,
          ]
        : [];
    });
    expect([
      result.failure?.fingerprint?.reason,
      ranges?.filter((range, index) => range !== ranges[index - 1]),
    ]).toEqual([
      "The first argument of RandomSetOfSubsets should be a nonnegative integer, but instead it is:\n-1",
      [
        "M 4:9-4:13",
        "M 6:8-6:56",
        "M 6:8-6:48",
        "M 6:10-6:46",
        "Randomization 62:15-62:71",
        "Randomization 62:31-62:70",
        "Randomization 62:43-62:69",
      ],
    ]);
  });

  it("records the frames in Bags of an error in SubBag, which TLC evaluates from its definition", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals, Bags\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ SubBag(x) = {}\n====",
      config: "INIT Init\nNEXT Next",
    });
    const ranges = result.failure?.callStack?.flatMap((expression) => {
      const range = expression.location.range;
      return range
        ? [
            `${range.module} ${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`,
          ]
        : [];
    });
    expect([
      result.failure?.message,
      ranges?.filter((range, index) => range !== ranges[index - 1]),
    ]).toEqual([
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to apply the operator DOMAIN to a non-function\n(an integer)\nline 106, col 58 to line 106, col 65 of module Bags",
      [
        "M 5:9-5:32",
        "M 5:9-5:14",
        "M 5:19-5:32",
        "M 5:19-5:27",
        "Bags 97:3-110:11",
        "Bags 110:6-110:11",
        "Bags 110:6-110:8",
        "Bags 106:7-109:68",
        "Bags 106:18-106:66",
        "Bags 106:24-106:66",
        "Bags 106:51-106:65",
        "Bags 106:58-106:65",
      ],
    ]);
  });

  it.each([
    [
      "L == INSTANCE Inner WITH c <- TRUE",
      "L!G(1)",
      [
        "M 6:9-6:19",
        "M 6:14-6:19",
        "M 4:1-4:34",
        "Inner 5:9-5:16",
        "Inner 5:9-5:12",
        "Inner 4:9-4:13",
      ],
    ],
    [
      "L(p) == INSTANCE Inner WITH c <- p",
      "L(TRUE)!h[2]",
      ["M 6:9-6:25", "M 6:14-6:25", "Inner 6:20-6:24"],
    ],
    [
      "L == INSTANCE Inner WITH c <- TRUE",
      "L!H",
      [
        "M 6:9-6:16",
        "M 6:14-6:16",
        "M 4:1-4:34",
        "Inner 7:6-7:13",
        "Inner 7:6-7:9",
        "Inner 6:20-6:24",
      ],
    ],
    [
      "L == INSTANCE Inner WITH c <- TRUE",
      "L!K!1",
      ["M 6:9-6:18", "M 6:14-6:18", "M 4:1-4:34", "Inner 8:7-8:11"],
    ],
    [
      "L == INSTANCE Inner WITH c <- TRUE",
      "L!G(1)!1",
      ["M 6:9-6:21", "M 6:14-6:21", "M 4:1-4:34", "Inner 5:9-5:12", "Inner 4:9-4:13"],
    ],
    [
      "L == INSTANCE Inner WITH c <- TRUE",
      "L!k[1]",
      [
        "M 6:9-6:19",
        "M 6:14-6:19",
        "M 6:14-6:16",
        "M 4:1-4:34",
        "Inner 9:1-9:24",
        "Inner 9:9-9:18",
        "Inner 9:13-9:17",
      ],
    ],
  ])(
    "records the substitutions of %s where its name reaches %s, not in the calls and functions it reaches, like TLC",
    async (instance, reference, expected) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${instance}\nInit == x = 0\nNext == x' = ${reference}\n====`,
        config: "INIT Init\nNEXT Next",
        loadModule: (name) =>
          name === "Inner"
            ? "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT c\nF(a) == a + c\nG(a) == F(a) + 1\nh[z \\in {1, 2}] == z + c\nH == h[1] + 1\nK == {c + 1, 2}\nk[z \\in {1, c + 1}] == z\n===="
            : undefined,
      });
      const ranges = result.failure?.callStack?.flatMap((expression) => {
        const range = expression.location.range;
        return range
          ? [
              `${range.module} ${range.start.line}:${range.start.column}-${range.end.line}:${range.end.column}`,
            ]
          : [];
      });
      expect(ranges?.filter((range, index) => range !== ranges[index - 1])).toEqual(expected);
    },
  );

  it.each([
    [
      "I == INSTANCE Inner WITH N <- 3",
      "I!f[x + 5]",
      "Attempted to apply function:\n<<2, 4, 6>>\nto argument 5, which is not in the domain of the function.",
    ],
    [
      "I(n) == INSTANCE Inner WITH N <- n",
      "I(3)!f[x + 5]",
      "In applying the function\n<<2, 4, 6>>,\nthe first argument is:\n5\nwhich is not in its domain.\n",
    ],
  ])(
    "applies the function %s defines through %s as TLC does",
    async (instance, reference, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${instance}\nInit == x = 0\nNext == x' = ${reference}\n====`,
        config: "INIT Init\nNEXT Next",
        loadModule: (name) =>
          name === "Inner"
            ? "---- MODULE Inner ----\nEXTENDS Naturals\nCONSTANT N\nf[i \\in 1..N] == i * 2\n===="
            : undefined,
      });
      expect(result.failure?.message).toBe(
        `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ${message}`,
      );
    },
  );

  it.each([
    [
      'Assert(FALSE, "bound")',
      'The first argument of Assert evaluated to FALSE; the second argument was:\n"bound"',
    ],
    ["<<x>>[3] = 0", "Attempted to access index 3 of tuple\n<<1>>\nwhich is out of bounds."],
  ])(
    "exits with TLC's general error code when its rerun of the initial states stops at a violation before %s fails again",
    async (failure, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLES x, y\nInit == x \\in 0..1 /\\ y \\in {0, 1} /\\ (x = 0 \\/ ${failure})\nNext == UNCHANGED <<x, y>>\nInv == y = 0\nView == x\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv\nVIEW View",
      });
      expect([result.failure?.message, result.failure?.exitCode]).toEqual([message, 255]);
    },
  );

  it("exits with the code of the error the liveness check of an initial state fails with, as TLC's rerun finds that state seen", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nA == x' = CHOOSE t \\in {0, 1} : t /= x /\\ UNCHANGED y\nSpec == Init /\\ [][A]_<<x, y>>\nProp == <>(ENABLED A)\n====",
      config: "SPECIFICATION Spec\nPROPERTY Prop",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In evaluation, the identifier y is either undefined or not an operator.\nline 4, col 53 to line 4, col 53 of module M",
      151,
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

  it.each([
    [
      "x = 0",
      "x + 2 /\\ x' = 1",
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut instead found 2.\nline 5, col 9 to line 5, col 13 of module M`,
    ],
    [
      "x = 0",
      "x' = 1 /\\ x + 2",
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC expected a boolean expression,\nbut instead found 2.\nline 5, col 19 to line 5, col 23 of module M`,
    ],
    [
      "x = 0",
      "IF x THEN x' = 1 ELSE x' = 2",
      `${UNEXPECTED_EXCEPTION}In computing next states, a non-boolean expression (an integer) was used as the condition of an IF.line 5, col 9 to line 5, col 36 of module M`,
    ],
    [
      "x = 0",
      "CASE x -> x' = 1 [] OTHER -> x' = 2",
      `${UNEXPECTED_EXCEPTION}In computing next states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 5, col 19 to line 5, col 24 of module M`,
    ],
    [
      "x = 0",
      "CASE x = 1 -> x' = 1",
      `${UNEXPECTED_EXCEPTION}In computing next states, TLC encountered a CASE with no conditions true.\nline 5, col 9 to line 5, col 28 of module M`,
    ],
    [
      "x = 0",
      "x => x' = 1",
      `${UNEXPECTED_EXCEPTION}In computing next states of a predicate of the form P => Q, P was\nan integer.\nline 5, col 9 to line 5, col 19 of module M`,
    ],
    [
      "x = 0",
      "3 /\\ x' = 1",
      `${UNEXPECTED_EXCEPTION}The next state relation is not a boolean expression.\n3`,
    ],
    [
      "IF 1 THEN x = 0 ELSE x = 1",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as the condition of an IF.\nline 4, col 9 to line 4, col 34 of module M",
    ],
    [
      "CASE 1 -> x = 0 [] OTHER -> x = 1",
      "x' = x",
      "In computing initial states, a non-boolean expression (an integer) was used as a guard condition of a CASE.\nline 4, col 19 to line 4, col 23 of module M",
    ],
    [
      "1 => x = 0",
      "x' = x",
      "In computing initial states of a predicate of form P => Q, P was an integer\n.line 4, col 9 to line 4, col 18 of module M",
    ],
    [
      "x = 0 /\\ x + 3",
      "x' = x",
      "In computing initial states, TLC expected a boolean expression,\nbut instead found 3.\nline 4, col 18 to line 4, col 22 of module M",
    ],
  ])(
    "reports Init == %s and Next == %s under -coverage as without it, like TLC",
    async (init, next, message) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == ${init}\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        coverage: 1,
      });
      expect([result.failure?.message, result.failure?.exitCode]).toEqual([message, 75]);
    },
  );

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

  it("reports an unassigned variable taken as a conjunct of the initial predicate as read before it is assigned", async () => {
    const result = await check({
      source: "---- MODULE M ----\nVARIABLE x\nInit == x /\\ x = FALSE\nNext == UNCHANGED x\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.exitCode]).toEqual([
      "In evaluation, the identifier x is either undefined or not an operator.\nline 3, col 9 to line 3, col 9 of module M",
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

  it("applies a recursive function as its table once an error message has printed it, like TLC", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nfib[n \\in 0..3] == IF n < 2 THEN n ELSE fib[n - 1] + fib[n - 2]\nFoo == fib[7] = 1\nASSUME Foo\n====",
      config: "",
    });
    expect(result.violation?.message).toBe(
      "Attempted to apply function:\n(0 :> 0 @@ 1 :> 1 @@ 2 :> 1 @@ 3 :> 2)\nto argument 7, which is not in the domain of the function.",
    );
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

  const checkSetBound = (next: string, invariant: string) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLE x\nInit == x = 0\nNext == ${next}\nInv == ${invariant}\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      maxSetSize: 10,
    });

  it.each([
    [
      "\\E f \\in [1..2 -> 1..4] : x' = f",
      "TRUE",
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a util.WrongInvocationException\n: Attempted to construct a set with too many elements (>10).",
      [],
      undefined,
    ],
    [
      "x' = x",
      "\\A r \\in [a : 1..4, b : 1..4] : r.a > 0",
      "Attempted to construct a set with too many elements (>10).",
      [],
      undefined,
    ],
    [
      "x' = x",
      "[a : 1..4, b : 1..4] # {}",
      "Attempted to construct a set with too many elements (>10).",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 6, column 8 to line 6, column 32 in M",
        "Line 6, column 8 to line 6, column 27 in M",
      ],
      "Attempted to construct a set with too many elements (>10).",
    ],
    [
      "x' = x",
      "Cardinality({p \\in (1..4) \\X (1..4) : TRUE}) > 0",
      "Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\nAttempted to construct a set with too many elements (>10).",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 6, column 8 to line 6, column 55 in M",
        "Line 6, column 8 to line 6, column 51 in M",
      ],
      undefined,
    ],
    [
      "x' = x",
      "\\A t \\in (1..2) \\X [a : 1..3, b : 1..4] : TRUE",
      "Attempted to construct a set with too many elements (>10).",
      [],
      undefined,
    ],
    [
      "x' = x",
      "\\A f \\in [{1} -> {r \\in [a : 1..4, b : 1..4] : r.a < 4}] : TRUE",
      "Attempted to construct a set with too many elements (>10).",
      [],
      undefined,
    ],
    [
      "x' = x",
      "\\A s \\in SUBSET [a : 1..3, b : 1..4] : TRUE",
      "Attempted to construct a set with too many elements (>10).",
      [
        "Line 4, column 9 to line 4, column 13 in M",
        "Line 6, column 8 to line 6, column 50 in M",
        "Line 6, column 17 to line 6, column 43 in M",
      ],
      "Attempted to construct a set with too many elements (>10).",
    ],
  ])(
    "bounds the sets TLC's toSetEnum collects by -maxSetSize and pops the frames it doesn't fingerprint: %s, %s",
    async (next, invariant, message, callStack, reason) => {
      const result = await checkSetBound(next, invariant);
      expect(result.failure?.message).toBe(message);
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
      expect(result.failure?.exitCode).toBe(75);
    },
  );

  const BOUND_EXCEPTION =
    "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a util.WrongInvocationException\n: Attempted to construct a set with too many elements (>10).";
  const EQUALITY_EXCEPTION =
    "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to check equality of the set {} with the value:\n1";
  const getRuntimeException = (reason: string) =>
    `TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: ${reason}`;
  const COMPARE_REASON = 'Attempted to compare string "a" with non-string:\n1';

  it.each([
    [
      "x' = x /\\ \\A e \\in ((SUBSET {1, 2} \\ {{}}) \\cup SUBSET (1..3)) : TRUE",
      BOUND_EXCEPTION,
      [],
    ],
    ["x' = x /\\ \\A e \\in (SUBSET (1..4) \\ {{}}) : TRUE", BOUND_EXCEPTION, []],
    [
      "x' = Cardinality(CHOOSE e \\in (SUBSET (1..4) \\cap SUBSET (1..4)) : TRUE)",
      BOUND_EXCEPTION,
      [],
    ],
    [
      "x' = x /\\ \\A e \\in ({s \\in SUBSET (1..2) : s = 1} \\ {{}}) : TRUE",
      EQUALITY_EXCEPTION,
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 72 in M",
        "Line 5, column 52 to line 5, column 56 in M",
      ],
    ],
    [
      "x' = Cardinality(CHOOSE e \\in ({s \\in SUBSET (1..2) : s = 1} \\cup SUBSET {}) : TRUE)",
      EQUALITY_EXCEPTION,
      [
        "Line 5, column 9 to line 5, column 92 in M",
        "Line 5, column 14 to line 5, column 92 in M",
        "Line 5, column 26 to line 5, column 91 in M",
        "Line 5, column 63 to line 5, column 67 in M",
      ],
    ],
    [
      "x' = x /\\ \\A e \\in (Nat \\cap Int) : TRUE",
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a java.lang.RuntimeException\n: Attempted to enumerate S \\cap T when neither S:\nNat\nnor T:\nInt\nis enumerable",
      [
        "Line 5, column 9 to line 5, column 48 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 48 in M",
        "Line 5, column 29 to line 5, column 40 in M",
      ],
      "Attempted to enumerate S \\cap T when neither S:\nNat\nnor T:\nInt\nis enumerable",
    ],
  ])(
    "frames a set operation for a quantifier or CHOOSE only as TLC's elements() opens it: %s",
    async (next, message, callStack, reason?: string) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(message);
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      "x' = x /\\ \\E e \\in (({s \\in SUBSET (1..2) : s = 1} \\cup SUBSET {}) \\ {{}}) : TRUE",
      [
        "Line 5, column 9 to line 5, column 89 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 89 in M",
        "Line 5, column 53 to line 5, column 57 in M",
      ],
    ],
    [
      "x' \\in (({s \\in SUBSET (1..2) : s = 1} \\cup SUBSET {}) \\ {{}})",
      ["Line 5, column 9 to line 5, column 70 in M", "Line 5, column 41 to line 5, column 45 in M"],
    ],
    [
      "x' \\in UNION {{s \\in SUBSET (1..2) : s = 1}}",
      ["Line 5, column 9 to line 5, column 52 in M", "Line 5, column 46 to line 5, column 50 in M"],
    ],
    [
      "x' = x /\\ \\A e \\in UNION {{s \\in SUBSET (1..2) : s = 1}} : TRUE",
      [
        "Line 5, column 9 to line 5, column 71 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 71 in M",
        "Line 5, column 58 to line 5, column 62 in M",
      ],
    ],
    [
      "x' = CHOOSE e \\in UNION {{s \\in SUBSET (1..2) : s = 1}} : TRUE",
      [
        "Line 5, column 9 to line 5, column 70 in M",
        "Line 5, column 14 to line 5, column 70 in M",
        "Line 5, column 57 to line 5, column 61 in M",
      ],
    ],
  ])(
    "streams UNION S and a set operation outside their frames, as TLC's nextElement does: %s",
    async (next, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(EQUALITY_EXCEPTION);
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint).toBeUndefined();
    },
  );

  it.each([
    [
      'x\' \\in ({1} \\cup SUBSET {1, "a"})',
      [
        "Line 5, column 9 to line 5, column 41 in M",
        "Line 5, column 17 to line 5, column 40 in M",
        "Line 5, column 26 to line 5, column 40 in M",
        "Line 5, column 33 to line 5, column 40 in M",
      ],
    ],
    [
      'x\' \\in (({1} \\X {1, "a"}) \\ {})',
      [
        "Line 5, column 9 to line 5, column 39 in M",
        "Line 5, column 17 to line 5, column 38 in M",
        "Line 5, column 18 to line 5, column 32 in M",
        "Line 5, column 25 to line 5, column 32 in M",
      ],
    ],
    [
      'x\' \\in ([{1} -> {1, "a"}] \\ {})',
      [
        "Line 5, column 9 to line 5, column 39 in M",
        "Line 5, column 17 to line 5, column 38 in M",
        "Line 5, column 17 to line 5, column 33 in M",
        "Line 5, column 25 to line 5, column 32 in M",
      ],
    ],
    [
      'x\' \\in ([a : {1, "a"}] \\ {})',
      [
        "Line 5, column 9 to line 5, column 36 in M",
        "Line 5, column 17 to line 5, column 35 in M",
        "Line 5, column 17 to line 5, column 30 in M",
        "Line 5, column 22 to line 5, column 29 in M",
      ],
    ],
    [
      'x\' \\in ({s \\in SUBSET {1, "a"} : TRUE} \\ {})',
      [
        "Line 5, column 9 to line 5, column 52 in M",
        "Line 5, column 17 to line 5, column 51 in M",
        "Line 5, column 24 to line 5, column 38 in M",
        "Line 5, column 31 to line 5, column 38 in M",
      ],
    ],
    [
      'x\' \\in ((SUBSET {1, "a"} \\cup {}) \\ {})',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 17 to line 5, column 46 in M",
        "Line 5, column 18 to line 5, column 40 in M",
        "Line 5, column 25 to line 5, column 32 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in (SUBSET {1, "a"} \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 56 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 56 in M",
        "Line 5, column 29 to line 5, column 48 in M",
        "Line 5, column 29 to line 5, column 43 in M",
        "Line 5, column 36 to line 5, column 43 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in UNION {SUBSET {1, "a"}} : TRUE',
      [
        "Line 5, column 9 to line 5, column 56 in M",
        "Line 5, column 14 to line 5, column 56 in M",
        "Line 5, column 27 to line 5, column 49 in M",
        "Line 5, column 34 to line 5, column 48 in M",
        "Line 5, column 41 to line 5, column 48 in M",
      ],
    ],
  ])(
    "frames the operands that TLC's elements() opens for a set operation or UNION: %s",
    async (next, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(
        'Attempted to compare string "a" with non-string:\n1',
      );
    },
  );

  it("opens no operand of an empty S \\X T, as TLC's elements() does", async () => {
    const result = await checkSetBound("x' \\in (({1, \"a\"} \\X {}) \\ {}) \\/ x' = 1", "TRUE");
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      3,
      2,
    ]);
  });

  it.each([
    [
      'x\' = CHOOSE e \\in SUBSET {1, "a"} : TRUE',
      [
        "Line 5, column 9 to line 5, column 48 in M",
        "Line 5, column 14 to line 5, column 48 in M",
        "Line 5, column 27 to line 5, column 41 in M",
        "Line 5, column 34 to line 5, column 41 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in [{1, "a"} -> {0}] : TRUE',
      [
        "Line 5, column 9 to line 5, column 50 in M",
        "Line 5, column 14 to line 5, column 50 in M",
        "Line 5, column 27 to line 5, column 43 in M",
        "Line 5, column 28 to line 5, column 35 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in ({1, "a"} \\X {0}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 50 in M",
        "Line 5, column 14 to line 5, column 50 in M",
        "Line 5, column 28 to line 5, column 42 in M",
        "Line 5, column 28 to line 5, column 35 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in [a : {1, "a"}] : TRUE',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 14 to line 5, column 47 in M",
        "Line 5, column 27 to line 5, column 40 in M",
        "Line 5, column 32 to line 5, column 39 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in (SUBSET {1} \\ {1, "a"}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 56 in M",
        "Line 5, column 14 to line 5, column 56 in M",
        "Line 5, column 28 to line 5, column 48 in M",
        "Line 5, column 41 to line 5, column 48 in M",
      ],
    ],
  ])("fingerprints the domain of CHOOSE as TLC's normalize does: %s", async (next, callStack) => {
    const result = await checkSetBound(next, "TRUE");
    expect(formatCallStackLines(result)).toEqual(callStack);
    expect(result.failure?.fingerprint?.reason).toBe(
      'Attempted to compare string "a" with non-string:\n1',
    );
  });

  it.each([
    [
      'x\' = x /\\ \\A e \\in (SUBSET SUBSET {1, "a"} \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 63 in M",
        "Line 5, column 29 to line 5, column 55 in M",
        "Line 5, column 29 to line 5, column 50 in M",
        "Line 5, column 36 to line 5, column 50 in M",
        "Line 5, column 43 to line 5, column 50 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in (SUBSET [a : {1, "a"}] \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 62 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 62 in M",
        "Line 5, column 29 to line 5, column 54 in M",
        "Line 5, column 29 to line 5, column 49 in M",
        "Line 5, column 36 to line 5, column 49 in M",
        "Line 5, column 41 to line 5, column 48 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in (SUBSET ({1} \\X {1, "a"}) \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 65 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 65 in M",
        "Line 5, column 29 to line 5, column 57 in M",
        "Line 5, column 29 to line 5, column 52 in M",
        "Line 5, column 37 to line 5, column 51 in M",
        "Line 5, column 44 to line 5, column 51 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in (SUBSET [{1} -> {1, "a"}] \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 65 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 65 in M",
        "Line 5, column 29 to line 5, column 57 in M",
        "Line 5, column 29 to line 5, column 52 in M",
        "Line 5, column 36 to line 5, column 52 in M",
        "Line 5, column 44 to line 5, column 51 in M",
      ],
    ],
    [
      'x\' \\in (SUBSET SUBSET {1, "a"} \\cup {})',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 17 to line 5, column 46 in M",
        "Line 5, column 24 to line 5, column 38 in M",
        "Line 5, column 31 to line 5, column 38 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in (SUBSET [a : SUBSET {1, "a"}] \\ {}) : TRUE',
      [
        "Line 5, column 9 to line 5, column 69 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 69 in M",
        "Line 5, column 29 to line 5, column 61 in M",
        "Line 5, column 29 to line 5, column 56 in M",
        "Line 5, column 36 to line 5, column 56 in M",
        "Line 5, column 41 to line 5, column 55 in M",
        "Line 5, column 48 to line 5, column 55 in M",
      ],
    ],
  ])("frames the sets that TLC's size() sizes for SUBSET S: %s", async (next, callStack) => {
    const result = await checkSetBound(next, "TRUE");
    expect(result.failure?.message).toBe(getRuntimeException(COMPARE_REASON));
    expect(formatCallStackLines(result)).toEqual(callStack);
    expect(result.failure?.fingerprint?.reason).toBe(COMPARE_REASON);
  });

  it.each([
    [
      'x\' = x /\\ ~(((1..2) \\cup SUBSET {1, "a"}) \\subseteq {})',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 63 in M",
        "Line 5, column 21 to line 5, column 62 in M",
        "Line 5, column 22 to line 5, column 48 in M",
        "Line 5, column 34 to line 5, column 48 in M",
        "Line 5, column 41 to line 5, column 48 in M",
      ],
    ],
    [
      'x\' = x /\\ ~(((1..2) \\cup [{1, "a"} -> {1}]) \\subseteq {})',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 65 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 65 in M",
        "Line 5, column 21 to line 5, column 64 in M",
        "Line 5, column 22 to line 5, column 50 in M",
        "Line 5, column 34 to line 5, column 50 in M",
        "Line 5, column 35 to line 5, column 42 in M",
      ],
    ],
    [
      'x\' = x /\\ ~(((1..2) \\cup [a : SUBSET {1, "a"}]) \\subseteq {})',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 69 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 69 in M",
        "Line 5, column 21 to line 5, column 68 in M",
        "Line 5, column 22 to line 5, column 54 in M",
        "Line 5, column 34 to line 5, column 54 in M",
        "Line 5, column 39 to line 5, column 53 in M",
        "Line 5, column 46 to line 5, column 53 in M",
      ],
    ],
    [
      'x\' = x /\\ ((((1..2) \\cup SUBSET {1, "a"}) \\X {1}) # ({} \\X {1}))',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 20 to line 5, column 71 in M",
        "Line 5, column 21 to line 5, column 56 in M",
        "Line 5, column 22 to line 5, column 48 in M",
        "Line 5, column 34 to line 5, column 48 in M",
        "Line 5, column 41 to line 5, column 48 in M",
      ],
    ],
    [
      'x\' = x /\\ ([{1} -> ((1..2) \\cup SUBSET {1, "a"})] # [{1} -> {}])',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 20 to line 5, column 71 in M",
        "Line 5, column 20 to line 5, column 57 in M",
        "Line 5, column 29 to line 5, column 55 in M",
        "Line 5, column 41 to line 5, column 55 in M",
        "Line 5, column 48 to line 5, column 55 in M",
      ],
    ],
    [
      'x\' = x /\\ ([a : ((1..2) \\cup [{1, "a"} -> {1}])] # [a : {}])',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 68 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 20 to line 5, column 67 in M",
        "Line 5, column 20 to line 5, column 56 in M",
        "Line 5, column 26 to line 5, column 54 in M",
        "Line 5, column 38 to line 5, column 54 in M",
        "Line 5, column 39 to line 5, column 46 in M",
      ],
    ],
  ])(
    "opens both operands of S \\cup T before it streams either, as TLC's elements() does: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      'x\' = x /\\ \\A e \\in ((1..20) \\cup SUBSET {1, "a"}) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 64 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 64 in M",
        "Line 5, column 29 to line 5, column 56 in M",
        "Line 5, column 42 to line 5, column 56 in M",
        "Line 5, column 49 to line 5, column 56 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in ((1..20) \\cup [{1, "a"} -> {1}]) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 66 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 66 in M",
        "Line 5, column 29 to line 5, column 58 in M",
        "Line 5, column 42 to line 5, column 58 in M",
        "Line 5, column 43 to line 5, column 50 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in ((1..20) \\cup ({1} \\X {1, "a"})) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 66 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 66 in M",
        "Line 5, column 29 to line 5, column 58 in M",
        "Line 5, column 43 to line 5, column 57 in M",
        "Line 5, column 50 to line 5, column 57 in M",
      ],
    ],
    [
      'x\' = CHOOSE e \\in ((1..20) \\cup SUBSET {1, "a"}) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 14 to line 5, column 63 in M",
        "Line 5, column 28 to line 5, column 55 in M",
        "Line 5, column 41 to line 5, column 55 in M",
        "Line 5, column 48 to line 5, column 55 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in ((1..5) \\cup ((6..12) \\cup SUBSET {1, "a"})) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 78 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 78 in M",
        "Line 5, column 29 to line 5, column 70 in M",
        "Line 5, column 42 to line 5, column 69 in M",
        "Line 5, column 55 to line 5, column 69 in M",
        "Line 5, column 62 to line 5, column 69 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in ((1..20) \\cup {t \\in SUBSET {1, "a"} : TRUE}) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 79 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 79 in M",
        "Line 5, column 29 to line 5, column 71 in M",
        "Line 5, column 49 to line 5, column 63 in M",
        "Line 5, column 56 to line 5, column 63 in M",
      ],
    ],
    [
      'x\' = x /\\ \\A e \\in ((1..20) \\cup [{1} -> SUBSET {1, "a"}]) : TRUE',
      COMPARE_REASON,
      [
        "Line 5, column 9 to line 5, column 73 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 73 in M",
        "Line 5, column 29 to line 5, column 65 in M",
        "Line 5, column 42 to line 5, column 65 in M",
        "Line 5, column 50 to line 5, column 64 in M",
        "Line 5, column 57 to line 5, column 64 in M",
      ],
    ],
    [
      "x' = x /\\ \\A e \\in ((1..20) \\cup SUBSET Nat) : TRUE",
      "Attempted to compute the number of elements in the overridden value Nat.",
      [
        "Line 5, column 9 to line 5, column 59 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 59 in M",
        "Line 5, column 29 to line 5, column 51 in M",
        "Line 5, column 42 to line 5, column 51 in M",
      ],
    ],
  ])(
    "opens both operands of S \\cup T before it collects them past -maxSetSize, as TLC's elements() does: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      "x' \\in ([Nat -> {1}] \\ {})",
      "Attempted to enumerate a set of the form [D -> R],but the domain D:\nNat\ncannot be enumerated.",
      [
        "Line 5, column 9 to line 5, column 34 in M",
        "Line 5, column 17 to line 5, column 33 in M",
        "Line 5, column 17 to line 5, column 28 in M",
      ],
    ],
    [
      "x' \\in ([{1} -> Nat] \\ {})",
      "Attempted to enumerate a set of the form [D -> R],but the range R:\nNat\ncannot be enumerated.",
      [
        "Line 5, column 9 to line 5, column 34 in M",
        "Line 5, column 17 to line 5, column 33 in M",
        "Line 5, column 17 to line 5, column 28 in M",
      ],
    ],
    [
      "x' \\in ([a : Nat] \\ {})",
      "Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the `a' field:\nNat",
      [
        "Line 5, column 9 to line 5, column 31 in M",
        "Line 5, column 17 to line 5, column 30 in M",
        "Line 5, column 17 to line 5, column 25 in M",
      ],
    ],
    [
      "x' \\in ((Nat \\X {1}) \\ {})",
      "Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s0:\nNat",
      [
        "Line 5, column 9 to line 5, column 34 in M",
        "Line 5, column 17 to line 5, column 33 in M",
        "Line 5, column 18 to line 5, column 27 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in ([{1} -> Nat] \\ {}) : TRUE",
      "Attempted to enumerate a set of the form [D -> R],but the range R:\nNat\ncannot be enumerated.",
      [
        "Line 5, column 9 to line 5, column 53 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 53 in M",
        "Line 5, column 29 to line 5, column 45 in M",
        "Line 5, column 29 to line 5, column 40 in M",
      ],
    ],
    [
      "x' = x /\\ ~(((1..2) \\cup ({1} \\X Nat)) \\subseteq {})",
      "Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s1:\nNat",
      [
        "Line 5, column 9 to line 5, column 60 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 60 in M",
        "Line 5, column 21 to line 5, column 59 in M",
        "Line 5, column 22 to line 5, column 45 in M",
        "Line 5, column 35 to line 5, column 44 in M",
      ],
    ],
  ])(
    "frames a component that can't be enumerated as TLC's elements() opens the set: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  const INTERVAL_SIZE_REASON =
    "Size of interval value exceeds the maximum representable size (32bits): 0..2147483647.";

  it.each([
    [
      "x' = x /\\ ~(((1..2) \\cup SUBSET (0..2147483647)) \\subseteq {})",
      [
        "Line 5, column 9 to line 5, column 70 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 70 in M",
        "Line 5, column 21 to line 5, column 69 in M",
        "Line 5, column 22 to line 5, column 55 in M",
        "Line 5, column 34 to line 5, column 55 in M",
      ],
    ],
    [
      "x' = x /\\ \\A e \\in (SUBSET (0..2147483647) \\ {}) : TRUE",
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 63 in M",
        "Line 5, column 29 to line 5, column 55 in M",
        "Line 5, column 29 to line 5, column 50 in M",
      ],
    ],
  ])(
    "sizes the interval under SUBSET S as TLC's elements() opens it: %s",
    async (next, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(INTERVAL_SIZE_REASON));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(INTERVAL_SIZE_REASON);
    },
  );

  const PRINTED_FILTER = "{t \\in (1..3) \\X {0} : PrintT(t)}";
  const PRINTED_PASS = ["<<1, 0>>", "<<1, 0>>", "<<2, 0>>", "<<3, 0>>"];
  const PRINTED_RESETS = [
    "<<1, 0>>",
    "<<1, 0>>",
    "<<1, 0>>",
    "<<2, 0>>",
    "<<1, 0>>",
    "<<2, 0>>",
    "<<2, 0>>",
    "<<1, 0>>",
  ];
  const PRINTED_LATE_MATCH = [
    "<<1, 0>>",
    "<<2, 0>>",
    "<<3, 0>>",
    "<<1, 0>>",
    "<<2, 0>>",
    "<<3, 0>>",
  ];

  it.each([
    [`x' = Cardinality((1..2) \\cup [{1} -> ${PRINTED_FILTER}])`, PRINTED_PASS, PRINTED_PASS],
    [`x' = Cardinality((1..2) \\cup [a : ${PRINTED_FILTER}])`, PRINTED_PASS, PRINTED_PASS],
    [
      `x' = x /\\ ~(((1..2) \\cup [{1} -> ${PRINTED_FILTER}]) \\subseteq {})`,
      PRINTED_PASS.slice(0, 2),
      undefined,
    ],
    [
      `(TLCGet("level") = 1 /\\ x' \\in ((1..2) \\cup [{1} -> ${PRINTED_FILTER}])) \\/ (TLCGet("level") > 1 /\\ UNCHANGED x)`,
      PRINTED_PASS,
      undefined,
    ],
    [
      "x' = Cardinality((1..2) \\cup [{1, 2} -> {t \\in (1..2) \\X {0} : PrintT(t)}])",
      PRINTED_RESETS,
      PRINTED_RESETS,
    ],
    [
      "x' = Cardinality((1..2) \\cup [{1} -> {t \\in (1..3) \\X {0} : PrintT(t) /\\ t[1] = 3}])",
      PRINTED_LATE_MATCH,
      PRINTED_LATE_MATCH,
    ],
    [
      `x' = x /\\ \\E e \\in ({t \\in (1..2) \\X {0} : PrintT(t)} \\cup [{1} -> {u \\in (4..5) \\X {0} : PrintT(u)}]) : FALSE`,
      ["<<4, 0>>", "<<4, 0>>", "<<1, 0>>", "<<2, 0>>", "<<5, 0>>"],
      undefined,
    ],
  ])(
    "evaluates a filter under an operand of S \\cup T as TLC's enumerators do: %s",
    async (next, printed, traceOutput) => {
      const lines: string[] = [];
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == ${next}\n====`,
        config: "INIT Init\nNEXT Next",
        onPrint: (text) => lines.push(text),
      });
      expect([lines, result.failure?.traceOutput]).toEqual([printed, traceOutput]);
    },
  );

  it("normalizes [S -> T] after it streams a component S \\cup T, as TLC's toSetEnum does", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ \\E e \\in [{1, 2} -> {9} \\cup {t \\in (1..2) \\X {0} : t[1] > 0}] : FALSE\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.failure?.message, result.failure?.fingerprint]).toEqual([
      getRuntimeException("Attempted to compare the function <<1, 0>> with the value:\n9"),
      undefined,
    ]);
    expect(formatCallStackLines(result)).toEqual([
      "Line 5, column 9 to line 5, column 88 in M",
      "Line 5, column 9 to line 5, column 14 in M",
      "Line 5, column 19 to line 5, column 88 in M",
    ]);
  });

  it.each([
    [
      "x' = x /\\ [a |-> x] \\notin [{x} -> {1}]",
      'Attempted to check equality of integer 0 with non-integer:\n"a"',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 47 in M",
        "Line 5, column 36 to line 5, column 47 in M",
        "Line 5, column 37 to line 5, column 39 in M",
      ],
    ],
    [
      "x' = x /\\ [a |-> x] \\notin ([{x} -> {1}] \\cup {})",
      'Attempted to check equality of integer 0 with non-integer:\n"a"',
      [
        "Line 5, column 9 to line 5, column 57 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 57 in M",
        "Line 5, column 37 to line 5, column 56 in M",
        "Line 5, column 38 to line 5, column 40 in M",
      ],
    ],
    [
      'x\' = x /\\ [k \\in {x} |-> 1] \\notin [{"a"} -> {1}]',
      'Attempted to check equality of string "a" with non-string:\n0',
      [
        "Line 5, column 9 to line 5, column 57 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 57 in M",
        "Line 5, column 44 to line 5, column 57 in M",
        "Line 5, column 45 to line 5, column 49 in M",
      ],
    ],
    [
      'x\' = x /\\ [{x} -> {1}] \\subseteq [{"a"} -> {1}]',
      'Attempted to check equality of string "a" with non-string:\n0',
      [
        "Line 5, column 9 to line 5, column 55 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 55 in M",
        "Line 5, column 19 to line 5, column 30 in M",
        "Line 5, column 42 to line 5, column 55 in M",
        "Line 5, column 43 to line 5, column 47 in M",
      ],
    ],
  ])(
    "frames the domain of [S -> T] that membership compares, as TLC's SetOfFcnsValue#member does: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      'x\' = x /\\ [{x} -> {1}] # [{"a"} -> {1}]',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 47 in M",
        "Line 5, column 19 to line 5, column 30 in M",
        "Line 5, column 20 to line 5, column 22 in M",
      ],
    ],
    [
      'x\' = x /\\ [{1} -> {x}] # [{1} -> {"a"}]',
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 47 in M",
        "Line 5, column 19 to line 5, column 30 in M",
        "Line 5, column 27 to line 5, column 29 in M",
      ],
    ],
    [
      'x\' = x /\\ [a : {x}] # [a : {"a"}]',
      [
        "Line 5, column 9 to line 5, column 41 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 41 in M",
        "Line 5, column 19 to line 5, column 27 in M",
        "Line 5, column 24 to line 5, column 26 in M",
      ],
    ],
    [
      'x\' = x /\\ {x} \\X {1} # {"a"} \\X {1}',
      [
        "Line 5, column 9 to line 5, column 43 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 43 in M",
        "Line 5, column 19 to line 5, column 28 in M",
        "Line 5, column 19 to line 5, column 21 in M",
      ],
    ],
    [
      'x\' = x /\\ SUBSET {x} # SUBSET {"a"}',
      [
        "Line 5, column 9 to line 5, column 43 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 43 in M",
        "Line 5, column 19 to line 5, column 28 in M",
        "Line 5, column 26 to line 5, column 28 in M",
      ],
    ],
  ])(
    "compares and frames each component of two [S -> T], [a : S], S \\X T or SUBSET S as TLC's equals does: %s",
    async (next, callStack) => {
      const reason = 'Attempted to check equality of integer 0 with non-integer:\n"a"';
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      "x' = x /\\ <<0, 1>> \\in [a : ([a : 0..x, b : Nat] \\cap [{x} -> {}])]",
      "Attempted to check if non-record\n<<0, 1>>\nis in the set of records:\n[a: [a: 0..0, b: Nat] \\cap {}]",
      [
        "Line 5, column 9 to line 5, column 75 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 75 in M",
        "Line 5, column 32 to line 5, column 75 in M",
      ],
    ],
    [
      'x\' = x /\\ <<1, x>> \\notin SUBSET ([a : {"a", "b"}, b : {"a", "b"}] \\ {x, 1})',
      'Attempted to check if the non-enumerable value\n<<1, 0>>\nis element of\nSUBSET {[a |-> "a", b |-> "a"], [a |-> "a", b |-> "b"], [a |-> "b", b |-> "a"], [a |-> "b", b |-> "b"]} \\ {0, 1}',
      [
        "Line 5, column 9 to line 5, column 84 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 84 in M",
        "Line 5, column 35 to line 5, column 84 in M",
      ],
    ],
  ])(
    "drops the frames of a set that fails to expand as an error message prints it, as TLC's toString swallows the failure: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  const OVERRIDDEN_UNION_REASON =
    'Attempted to compare overridden value Nat with non-overridden value:\n{"a", "b"}';
  const NON_RECORD_REASON =
    "Attempted to check if non-record\n{}\nis in the set of records:\n{[a |-> 1, b |-> 1], [a |-> 2, b |-> 1]}";

  it.each([
    [
      'x\' = x /\\ \\E e \\in {1} \\X UNION {{"a", "b"}, Nat} : TRUE',
      OVERRIDDEN_UNION_REASON,
      [
        "Line 5, column 9 to line 5, column 64 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 64 in M",
        "Line 5, column 28 to line 5, column 57 in M",
        "Line 5, column 35 to line 5, column 57 in M",
        "Line 5, column 41 to line 5, column 57 in M",
      ],
    ],
    [
      'x\' = x /\\ \\E e \\in [a : UNION {{"a", "b"}, Nat}] : TRUE',
      OVERRIDDEN_UNION_REASON,
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 63 in M",
        "Line 5, column 28 to line 5, column 56 in M",
        "Line 5, column 33 to line 5, column 55 in M",
        "Line 5, column 39 to line 5, column 55 in M",
      ],
    ],
    [
      "x' = x /\\ [a : (SUBSET {x} \\ [a : {1, 2}, b : {1}])] # [{1} -> {1}]",
      NON_RECORD_REASON,
      [
        "Line 5, column 9 to line 5, column 75 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 75 in M",
        "Line 5, column 19 to line 5, column 60 in M",
        "Line 5, column 25 to line 5, column 58 in M",
        "Line 5, column 38 to line 5, column 58 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in [a : (SUBSET {x} \\ [a : {1, 2}, b : {1}])] : TRUE",
      NON_RECORD_REASON,
      [
        "Line 5, column 9 to line 5, column 76 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 76 in M",
        "Line 5, column 28 to line 5, column 69 in M",
        "Line 5, column 34 to line 5, column 67 in M",
        "Line 5, column 47 to line 5, column 67 in M",
      ],
    ],
  ])(
    "frames a component whose emptiness check fails, as TLC's Value#isEmpty does: %s",
    async (next, reason, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      'x\' = x /\\ [a |-> x] \\notin SUBSET [{1} -> UNION {{1, "a"}, Nat}]',
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 72 in M",
        "Line 5, column 36 to line 5, column 72 in M",
        "Line 5, column 43 to line 5, column 72 in M",
        "Line 5, column 51 to line 5, column 71 in M",
        "Line 5, column 57 to line 5, column 71 in M",
        "Line 5, column 58 to line 5, column 65 in M",
      ],
    ],
    [
      'x\' = x /\\ [a |-> 1] \\notin SUBSET [a : UNION {{1, "a"}, Nat}]',
      [
        "Line 5, column 9 to line 5, column 69 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 69 in M",
        "Line 5, column 36 to line 5, column 69 in M",
        "Line 5, column 43 to line 5, column 69 in M",
        "Line 5, column 48 to line 5, column 68 in M",
        "Line 5, column 54 to line 5, column 68 in M",
        "Line 5, column 55 to line 5, column 62 in M",
      ],
    ],
    [
      'x\' = x /\\ 1 \\notin SUBSET ({1} \\X UNION {{1, "a"}, Nat})',
      [
        "Line 5, column 9 to line 5, column 64 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 64 in M",
        "Line 5, column 28 to line 5, column 64 in M",
        "Line 5, column 36 to line 5, column 63 in M",
        "Line 5, column 43 to line 5, column 63 in M",
        "Line 5, column 49 to line 5, column 63 in M",
        "Line 5, column 50 to line 5, column 57 in M",
      ],
    ],
  ])(
    "frames each set an error message prints while printing it fails, as TLC's toString does: %s",
    async (next, callStack) => {
      const reason = 'Attempted to compare string "a" with non-string:\n1';
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  const INTEGER_REASON = 'Attempted to compare integer 1 with non-integer:\n"a"';
  const STRING_REASON = 'Attempted to compare string "a" with non-string:\n1';

  it.each([
    [
      'Seq({1}) = Seq({"a"})',
      INTEGER_REASON,
      [
        "Line 5, column 9 to line 5, column 39 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 39 in M",
        "Line 5, column 23 to line 5, column 25 in M",
      ],
    ],
    [
      'Seq({x}) = Seq({"a"})',
      'Attempted to compare integer 0 with non-integer:\n"a"',
      [
        "Line 5, column 9 to line 5, column 39 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 39 in M",
        "Line 5, column 23 to line 5, column 25 in M",
      ],
    ],
    [
      '{Seq({1}), Seq({"a"})} # {}',
      STRING_REASON,
      [
        "Line 5, column 9 to line 5, column 45 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 45 in M",
        "Line 5, column 19 to line 5, column 40 in M",
        "Line 5, column 34 to line 5, column 38 in M",
      ],
    ],
    [
      'Seq({1}) \\in {Seq({"a"})}',
      STRING_REASON,
      [
        "Line 5, column 9 to line 5, column 43 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 43 in M",
        "Line 5, column 32 to line 5, column 43 in M",
        "Line 5, column 37 to line 5, column 41 in M",
      ],
    ],
    [
      'Seq(Seq({1})) = Seq(Seq({"a"}))',
      INTEGER_REASON,
      [
        "Line 5, column 9 to line 5, column 49 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 49 in M",
        "Line 5, column 27 to line 5, column 29 in M",
      ],
    ],
    [
      "Seq({1}) = Seq(Nat)",
      "Attempted to compare the set {1} with the value:\nNat",
      [
        "Line 5, column 9 to line 5, column 37 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 37 in M",
        "Line 5, column 23 to line 5, column 25 in M",
      ],
    ],
    [
      '<<Seq({1})>> # <<Seq({"a"})>>',
      INTEGER_REASON,
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 47 in M",
        "Line 5, column 19 to line 5, column 30 in M",
        "Line 5, column 25 to line 5, column 27 in M",
      ],
    ],
  ])(
    "compares the ranges of two Seq(S), as TLC's Sequences#compareTo does: x' = x /\\ %s",
    async (comparison, reason, callStack) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ ${comparison}\nInv == TRUE\n====`,
        config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      });
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  const RECORD_SET_ORDER_REASON = 'Attempted to compare integer 0 with non-integer:\n"a"';

  it.each([
    [
      'x\' = x /\\ \\E e \\in UNION {[a : {"a", "b"}], [a : {x, 1}]} : TRUE',
      RECORD_SET_ORDER_REASON,
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 72 in M",
        "Line 5, column 28 to line 5, column 65 in M",
        "Line 5, column 34 to line 5, column 65 in M",
        "Line 5, column 53 to line 5, column 64 in M",
      ],
      RECORD_SET_ORDER_REASON,
    ],
    [
      'x\' = x /\\ UNION {[a : {"a", "b"}], [a : {x, 1}]} # {}',
      RECORD_SET_ORDER_REASON,
      [
        "Line 5, column 9 to line 5, column 61 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 61 in M",
        "Line 5, column 19 to line 5, column 56 in M",
        "Line 5, column 25 to line 5, column 56 in M",
        "Line 5, column 44 to line 5, column 55 in M",
      ],
      RECORD_SET_ORDER_REASON,
    ],
    [
      'x\' = x /\\ Cardinality(UNION {[a : {"a"}], [a : {x}]}) = 2',
      `Attempted to apply the operator overridden by the Java method\npublic static tlc2.value.impl.IntValue tlc2.module.FiniteSets.Cardinality(tlc2.value.impl.Value),\nbut it produced the following error:\n${RECORD_SET_ORDER_REASON}`,
      [
        "Line 5, column 9 to line 5, column 65 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 65 in M",
        "Line 5, column 19 to line 5, column 61 in M",
      ],
      undefined,
    ],
  ])(
    "orders two sets of records by their elements, as TLC's SetOfRcdsValue#compareTo does: %s",
    async (next, reason, callStack, fingerprintReason) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(fingerprintReason);
    },
  );

  const checkComparison = (comparison: string, onPrint?: (text: string) => void) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ ${comparison}\nInv == TRUE\n====`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv",
      onPrint,
    });

  it("orders two SUBSET S by their bases without enumerating them, as TLC's SubsetValue#compareTo does", async () => {
    const result = await checkComparison("{SUBSET (1..30), SUBSET (1..31)} # {}");
    expect(result.failure).toBeUndefined();
  });

  it.each([
    [
      '{SUBSET {x}, SUBSET {"a"}} # {}',
      'Attempted to compare string "a" with non-string:\n0',
      [
        "Line 5, column 9 to line 5, column 49 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 49 in M",
        "Line 5, column 19 to line 5, column 44 in M",
        "Line 5, column 32 to line 5, column 43 in M",
        "Line 5, column 39 to line 5, column 43 in M",
      ],
    ],
    [
      "{SUBSET Nat, SUBSET {1}} # {}",
      "Attempted to compare the set {1} with the value:\nNat",
      [
        "Line 5, column 9 to line 5, column 47 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 47 in M",
        "Line 5, column 19 to line 5, column 42 in M",
        "Line 5, column 32 to line 5, column 41 in M",
        "Line 5, column 39 to line 5, column 41 in M",
      ],
    ],
  ])(
    "frames the base two SUBSET S compare, as TLC's SubsetValue#compareTo does: x' = x /\\ %s",
    async (comparison, reason, callStack) => {
      const result = await checkComparison(comparison);
      expect(result.failure?.message).toBe(getRuntimeException(reason));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  const NAT_MEMBER_REASON = "Attempted to check if the value:\n<<1, 0>>\nis an element of Nat.";

  it.each([
    [
      "<<1, x>> \\notin {e \\in ({} \\cup Nat) : e # x}",
      "line 5, col 58 to line 5, col 62",
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 63 in M",
        "Line 5, column 43 to line 5, column 53 in M",
      ],
    ],
    [
      "\\E s \\in {{e \\in ({} \\cup Nat) : e # x}} : <<1, x>> \\in s",
      "line 5, col 52 to line 5, col 56",
      [
        "Line 5, column 9 to line 5, column 75 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 75 in M",
        "Line 5, column 62 to line 5, column 75 in M",
        "Line 5, column 37 to line 5, column 47 in M",
      ],
    ],
  ])(
    "reports the base's failure under a filter's membership once the base frames it, as TLC's SetPredValue#member catches only an EvalException: x' = x /\\ %s",
    async (comparison, predicate, callStack) => {
      const result = await checkComparison(comparison);
      expect(result.failure?.message).toBe(
        getRuntimeException(
          `Cannot decide if element:\n<<1, 0>>\n is element of:\nNat\nand satisfies the predicate ${predicate} of module M`,
        ),
      );
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(NAT_MEMBER_REASON);
    },
  );

  const PRINTING_FILTER = 'LET Bad == {s \\in SUBSET {1, 2} : PrintT(<<"b", s>>) /\\ s # 1} IN';
  const UNEXPANDED_FILTER_REASON =
    "Attempted to check equality of the set {{s \\in {{}, {1}, {2}, {1, 2}} : <expression line 5, col 53 to line 5, col 79 of module M> }} with the value:\nSTRING";

  it("prints a set it compares with STRING as TLC's toString does, which leaves a filter that fails unexpanded", async () => {
    const printed: string[] = [];
    const result = await checkComparison(`${PRINTING_FILTER} {Bad} = STRING`, (text) =>
      printed.push(text),
    );
    expect(result.failure?.message).toBe(getRuntimeException(UNEXPANDED_FILTER_REASON));
    expect(result.failure?.fingerprint?.reason).toBe(UNEXPANDED_FILTER_REASON);
    expect([printed, result.failure?.traceOutput]).toEqual([['<<"b", {}>>'], ['<<"b", {}>>']]);
  });

  it("keeps the call stack frozen at a failure an error message swallows, as TLC's CallStackTool does", async () => {
    const result = await checkComparison(`${PRINTING_FILTER} {Bad} = STRING`);
    expect(result.failure?.fingerprint?.reason).toBe(UNEXPANDED_FILTER_REASON);
    expect(formatCallStackLines(result)).toEqual([
      "Line 5, column 9 to line 5, column 98 in M",
      "Line 5, column 9 to line 5, column 14 in M",
      "Line 5, column 19 to line 5, column 98 in M",
      "Line 5, column 85 to line 5, column 98 in M",
      "Line 5, column 53 to line 5, column 79 in M",
      "Line 5, column 75 to line 5, column 79 in M",
    ]);
  });

  const SET_EQUALITY_REASON = "Attempted to check equality of the set {1} with the value:\n1";

  it.each([
    [
      "x' \\in (({1} \\X {s \\in SUBSET (1..2) : s = {} \\/ s = 1}) \\ {})",
      [
        "Line 5, column 9 to line 5, column 70 in M",
        "Line 5, column 48 to line 5, column 62 in M",
        "Line 5, column 58 to line 5, column 62 in M",
      ],
      undefined,
    ],
    [
      "x' \\in (([a : {s \\in SUBSET (1..2) : s = {} \\/ s = 1}]) \\cup {})",
      [
        "Line 5, column 9 to line 5, column 72 in M",
        "Line 5, column 46 to line 5, column 60 in M",
        "Line 5, column 56 to line 5, column 60 in M",
      ],
      undefined,
    ],
    [
      "x' \\in ([{1} -> {s \\in SUBSET (1..2) : s = {} \\/ s = 1}] \\ {})",
      [
        "Line 5, column 9 to line 5, column 70 in M",
        "Line 5, column 48 to line 5, column 62 in M",
        "Line 5, column 58 to line 5, column 62 in M",
      ],
      undefined,
    ],
    [
      "x' \\in ({1} \\X {s \\in SUBSET (1..2) : s = {} \\/ s = 1})",
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 47 to line 5, column 61 in M",
        "Line 5, column 57 to line 5, column 61 in M",
      ],
      undefined,
    ],
    [
      "x' = x /\\ \\E e \\in {t \\in ({1} \\X {s \\in SUBSET (1..2) : s = {} \\/ s = 1}) : TRUE} : TRUE",
      [
        "Line 5, column 9 to line 5, column 97 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 97 in M",
        "Line 5, column 66 to line 5, column 80 in M",
        "Line 5, column 76 to line 5, column 80 in M",
      ],
      undefined,
    ],
    [
      "x' \\in [{s \\in SUBSET (1..2) : s = {} \\/ s = 1} -> {1}]",
      [
        "Line 5, column 9 to line 5, column 63 in M",
        "Line 5, column 40 to line 5, column 54 in M",
        "Line 5, column 50 to line 5, column 54 in M",
      ],
      SET_EQUALITY_REASON,
    ],
  ])(
    "streams [S -> T], [a : S] and S \\X T outside their frames, as TLC's nextElement does: %s",
    async (next, callStack, reason) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(SET_EQUALITY_REASON));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    [
      "x' = x /\\ \\E e \\in ({1} \\X {s \\in SUBSET (1..2) : s = {} \\/ s = 1}) : TRUE",
      [
        "Line 5, column 9 to line 5, column 82 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 82 in M",
        "Line 5, column 59 to line 5, column 73 in M",
        "Line 5, column 69 to line 5, column 73 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in [{1} -> {s \\in SUBSET (1..2) : s = {} \\/ s = 1}] : TRUE",
      [
        "Line 5, column 9 to line 5, column 82 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 82 in M",
        "Line 5, column 59 to line 5, column 73 in M",
        "Line 5, column 69 to line 5, column 73 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in [a : {s \\in SUBSET (1..2) : s = {} \\/ s = 1}] : TRUE",
      [
        "Line 5, column 9 to line 5, column 79 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 79 in M",
        "Line 5, column 56 to line 5, column 70 in M",
        "Line 5, column 66 to line 5, column 70 in M",
      ],
    ],
    [
      "x' = CHOOSE e \\in ({1} \\X {s \\in SUBSET (1..2) : s = {} \\/ s = 1}) : TRUE",
      [
        "Line 5, column 9 to line 5, column 81 in M",
        "Line 5, column 14 to line 5, column 81 in M",
        "Line 5, column 58 to line 5, column 72 in M",
        "Line 5, column 68 to line 5, column 72 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in [a : {1}, b : {s \\in SUBSET (1..2) : s = {} \\/ s = 1}] : TRUE",
      [
        "Line 5, column 9 to line 5, column 88 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 88 in M",
        "Line 5, column 65 to line 5, column 79 in M",
        "Line 5, column 75 to line 5, column 79 in M",
      ],
    ],
    [
      "x' = x /\\ \\E e \\in [{1, 2} -> {s \\in SUBSET (1..2) : s = {} \\/ s = 1}] : TRUE",
      [
        "Line 5, column 9 to line 5, column 85 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 85 in M",
        "Line 5, column 62 to line 5, column 76 in M",
        "Line 5, column 72 to line 5, column 76 in M",
      ],
    ],
  ])(
    "collects [S -> T], [a : S] and S \\X T for a quantifier outside their frames, as TLC's toSetEnum does: %s",
    async (next, callStack) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(getRuntimeException(SET_EQUALITY_REASON));
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint).toBeUndefined();
    },
  );

  it("streams S into UNION S past -maxSetSize, as TLC's UnionValue does", async () => {
    const result = await checkSetBound(
      "x' = Cardinality(UNION (SUBSET {1} \\cup (SUBSET {2} \\cup (SUBSET {1} \\cup (SUBSET {2} \\cup (SUBSET {1} \\cup SUBSET {2}))))))",
      "TRUE",
    );
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      3,
      2,
    ]);
  });

  it.each([
    [
      "x' = x /\\ {UNION (SUBSET (1..3) \\cup SUBSET (1..3))} # {0}",
      [
        "Line 5, column 9 to line 5, column 66 in M",
        "Line 5, column 9 to line 5, column 14 in M",
        "Line 5, column 19 to line 5, column 66 in M",
        "Line 5, column 19 to line 5, column 60 in M",
        "Line 5, column 20 to line 5, column 59 in M",
      ],
      "Attempted to construct a set with too many elements (>10).",
    ],
    ["x' = x /\\ \\A e \\in UNION (SUBSET (1..3) \\cup SUBSET (1..3)) : TRUE", [], undefined],
  ])(
    "fails UNION S past -maxSetSize as TLC's UnionValue collects it: %s",
    async (next, callStack, reason) => {
      const result = await checkSetBound(next, "TRUE");
      expect(result.failure?.message).toBe(BOUND_EXCEPTION);
      expect(formatCallStackLines(result)).toEqual(callStack);
      expect(result.failure?.fingerprint?.reason).toBe(reason);
    },
  );

  it.each([
    ["x' \\in [a : {f \\in [1..2 -> 1..4] : TRUE}]", 273, 17],
    ["x' = [f \\in [1..2 -> 1..4] |-> 1]", 3, 2],
    [
      "x' = LET F[r \\in [a : 1..4, b : 1..4]] == IF r.a = 1 THEN 1 ELSE F[[a |-> 1, b |-> r.b]] IN F",
      3,
      2,
    ],
  ])(
    "streams the sets TLC's elements() enumerates past -maxSetSize: %s",
    async (next, generated, distinct) => {
      const result = await checkSetBound(next, "TRUE");
      expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
        "success",
        generated,
        distinct,
      ]);
    },
  );

  it.each([
    [
      "\\A r \\in [a : SUBSET (1..40)] : TRUE",
      "Attempted to construct a set with too many elements (>1000000).",
    ],
    [
      "\\A f \\in [{1} -> SUBSET (1..40)] : TRUE",
      "Attempted to construct a set with too many elements (>1000000).",
    ],
    [
      "\\A r \\in [a : SUBSET (1..40), b : Nat] : TRUE",
      "Attempted to enumerate a set of the form [l1 : v1, ..., ln : vn],\nbut can't enumerate the value of the `b' field:\nNat",
    ],
    [
      "\\A r \\in {1} \\X (SUBSET (1..40)) \\X Nat : TRUE",
      "Attempted to enumerate a set of the form s1 \\X s2 ... \\X sn,\nbut can't enumerate s2:\nNat",
    ],
  ])(
    "streams SUBSET S into a product TLC collects, which fails before SUBSET S overflows: %s",
    async (assumption, message) => {
      const result = await checkModule(`ASSUME ${assumption}`);
      expect([result.status, result.violation?.message]).toEqual(["assumption-violation", message]);
    },
  );

  it("sizes the domain of a recursive function as TLC's FcnLambdaValue#toFcnRcd does, which bounds a filter by -maxSetSize", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nEXTENDS Integers, FiniteSets\nVARIABLE x\nF[r \\in {s \\in [a : 1..4, b : 1..4] : TRUE}] == IF r.a = 1 THEN 1 ELSE F[[a |-> 1, b |-> r.b]]\nInit == x = 0\nNext == x' = F\n====",
      config: "INIT Init\nNEXT Next",
      maxSetSize: 10,
    });
    expect([
      result.failure?.message,
      formatCallStackLines(result),
      result.failure?.fingerprint,
      [result.generatedStates, result.distinctStates],
    ]).toEqual([
      "TLC threw an unexpected exception.\nThis was probably caused by an error in the spec or model.\nSee the User Output or TLC Console for clues to what happened.\nThe exception was a util.WrongInvocationException\n: Attempted to construct a set with too many elements (>10).",
      [],
      undefined,
      [2, 1],
    ]);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  formatValue,
  parseConfig,
  TlaConfigError,
  TlaEvaluationError,
  TlaSyntaxError,
  TlaUnsupportedError,
} from "../../src";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const checkModule = (body: string, config = "") =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, Sequences, FiniteSets, TLC\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${body}\n====`,
    config: `${config}\nINIT Init\nNEXT Next`,
  });

const checkFixture = (directory: string, name: string) =>
  check({
    source: readFileSync(join(FIXTURES, directory, `${name}.tla`), "utf8"),
    config: readFileSync(join(FIXTURES, directory, `${name}.cfg`), "utf8"),
  });

describe("check matches TLC", () => {
  it("evaluates every assumption in the semantics fixture", () => {
    const result = checkFixture("semantics", "Semantics");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
  });

  it("explores the mutex state space", () => {
    const result = checkFixture("mutex", "Mutex");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([18, 10, 4]);
  });

  it("explores a commit protocol over model values", () => {
    const result = checkFixture("commit", "Commit");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([890, 251, 11]);
  });

  it("stops exploring states that fail a constraint", () => {
    const result = checkFixture("queue", "Queue");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([181, 105, 9]);
  });

  it("reports the shortest trace to an invariant violation", () => {
    const result = checkFixture("water-jugs", "WaterJugs");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    const trace = result.violation?.trace ?? [];
    expect(trace).toHaveLength(7);
    expect(trace[0].action).toBeUndefined();
    expect(formatValue(trace[6].state.large)).toBe("4");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([73, 14, 7]);
  });

  it("reports deadlock with the trace that reaches it", () => {
    const result = checkFixture("counter", "Counter");
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("stops branching on initial conjuncts once every variable is assigned", () => {
    const result = checkFixture("initial-states", "InitialStates");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 2, 1]);
  });

  it("assigns variables through definitions, parameters, function applications, and <<A>>_v", () => {
    const result = checkFixture("assignments", "Assignments");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([98, 24, 5]);
  });

  it("reduces states under a symmetry set", () => {
    const result = checkFixture("symmetry", "Symmetry");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([42, 10, 7]);
  });

  it("rejects a symmetry that names a constant", () => {
    expect(() => checkModule("CONSTANT P", "CONSTANT P = {p1, p2}\nSYMMETRY P")).toThrow(
      TlaConfigError,
    );
  });

  it("rejects substituting a constant with a state-level definition", () => {
    expect(() => checkModule("CONSTANT C\nFoo == x", "CONSTANT C <- Foo")).toThrow(TlaConfigError);
    expect(checkModule("CONSTANT C\nFoo == 1", "CONSTANT C <- Foo").status).toBe("success");
    expect(() => checkModule('CONSTANT C\nFoo == TLCGet("level")', "CONSTANT C <- Foo")).toThrow(
      TlaConfigError,
    );
  });

  it("overrides definitions and ignores undeclared names assigned by the configuration", () => {
    const result = check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x \\in Nat \\cap {0, 9}\nNext == x' = x\n====",
      config: "CONSTANT Foo = 1\nCONSTANT Nat = {0, 1}\nINIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      2,
      1,
    ]);
  });

  it("substitutes infix operator constants", () => {
    const result = checkModule(
      "CONSTANT _++_\nPlusPlus(a, b) == <<a, b>>\nASSUME (1 ++ 2) = <<1, 2>>",
      "CONSTANT ++ <- PlusPlus",
    );
    expect(result.status).toBe("success");
  });

  it("follows definition overrides inside the specification", () => {
    const result = check({
      source:
        "---- MODULE M ----\nVARIABLE x\nInit == x = 0\nMCInit == x = 1\nSpec == Init /\\ [][x' = x]_x\nInv == x = 1\n====",
      config: "CONSTANT Init <- MCInit\nSPECIFICATION Spec\nINVARIANT Inv",
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates]).toEqual([2, 1]);
  });
});

describe("evaluation errors match TLC", () => {
  it("checks only the assumptions of a model without variables or an initial predicate", () => {
    const result = check({ source: "---- MODULE M ----\nASSUME TRUE\n====", config: "" });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([0, 0, 0]);
    expect(() => check({ source: "---- MODULE M ----\nVARIABLE x\n====", config: "" })).toThrow(
      TlaConfigError,
    );
  });

  it("reports an assumption that fails to evaluate and skips axioms", () => {
    const result = checkModule("AXIOM 1 = 2\nASSUME CHOOSE n \\in {} : TRUE");
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.name).toBe("line 7, column 1");
    expect(result.violation?.message).toMatch(/^Attempted to compute CHOOSE/);
  });

  it("reports an overflowing cardinality without enumerating the set", () => {
    const result = checkModule("ASSUME Cardinality(SUBSET (1..31)) > 0");
    expect(result.violation?.message).toMatch(/^Overflow when computing the number of elements/);
  });

  it("rejects a mistyped membership outside an assumption", () => {
    expect(() =>
      check({
        source:
          '---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = "a" /\\ x \\in Nat\nNext == x\' = x\n====',
        config: "INIT Init\nNEXT Next",
      }),
    ).toThrow(TlaEvaluationError);
  });

  it("treats untyped model values as outside built-in sets", () => {
    const result = checkModule(
      'CONSTANT m\nASSUME ~(m \\in Nat) /\\ ~(m \\in Int) /\\ ~(m \\in STRING) /\\ ~(m \\in 1..3) /\\ ~(m \\in Seq({1}))\nASSUME ~("a" \\in 3..1)',
      "CONSTANT m = m",
    );
    expect(result.status).toBe("success");
  });

  it.each(['"a" \\in Nat', "1 \\in STRING", "{} \\in 1..4", "FALSE \\in Int"])(
    "rejects %s",
    (membership) => {
      const result = checkModule(`ASSUME ${membership}`);
      expect(result.status).toBe("assumption-violation");
      expect(result.violation?.message).toMatch(/^Attempted to check if the value/);
    },
  );
});

describe("name resolution matches SANY", () => {
  const checkSource = (source: string) =>
    check({
      source: `---- MODULE M ----\n${source}\nVARIABLE x\nInit == x = 0\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it.each([
    ["an operator from a module that is not extended", "EXTENDS Naturals\nf == 1 :> 2"],
    ["an operator that a standard module only instantiates locally", "EXTENDS TLC\nf == 1 + 1"],
    ["a definition before it is defined", "EXTENDS Naturals\nf == g + 1\ng == 1"],
    ["an operator with the wrong number of arguments", "g(a) == a\nf == g(1, 2)"],
    ["a record with duplicate fields", "f == [a |-> 1, b |-> 2, a |-> 1]"],
  ])("rejects %s", (_, source) => {
    expect(() => checkSource(source)).toThrow(TlaSyntaxError);
  });

  it("defines prefix, postfix, and <: operators", () => {
    const result = checkSource(
      "EXTENDS Naturals\nn ^+ == n + 1\n-. n == 10 - n\na <: b == a - b\nASSUME (2^+) = 3 /\\ -4 = 6 /\\ (5 <: 2) = 3",
    );
    expect(result.status).toBe("success");
  });

  it("accepts recursive functions, named assumptions, and operator aliases", () => {
    const result = checkSource(
      "EXTENDS Naturals\nRECURSIVE fact\ntwice[n \\in Nat] == fact[n] * 2\nfact[n \\in Nat] == IF n = 0 THEN 1 ELSE n * fact[n - 1]\nASSUME Positive == twice[3] = 12\nASSUME Positive\na \\oplus b == a + b\nASSUME 1 (+) 2 = 3",
    );
    expect(result.status).toBe("success");
  });
});

describe("parseConfig matches TLC", () => {
  it("reads operator symbols and names that start with digits", () => {
    const config = parseConfig("CONSTANT ++ <- PlusPlus\n  Plus <- +\n  \\o <- +\nINVARIANT 1Inv");
    expect(config.substitutions).toEqual([
      { name: "++", target: "PlusPlus" },
      { name: "Plus", target: "+" },
      { name: "\\o", target: "+" },
    ]);
    expect(config.invariants).toEqual(["1Inv"]);
  });

  it("reports _POSSIBLE as unsupported", () => {
    expect(() => parseConfig("SPECIFICATION Spec\n_POSSIBLE Done")).toThrow(TlaUnsupportedError);
  });
});

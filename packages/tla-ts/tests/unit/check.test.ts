import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import {
  check,
  formatValue,
  parseConfig,
  parseModule,
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
    loadModule: (module) => readFileSync(join(FIXTURES, directory, `${module}.tla`), "utf8"),
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

  it("assigns a primed variable passed as an operator argument", () => {
    const result = check({
      source:
        "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x, y\nSend(p, old, new) == new = p\nInit == x = 0 /\\ y = 0\nNext == \\E p \\in {1, 2} : Send(p, x, x') /\\ y' = y\n====",
      config: "INIT Init\nNEXT Next",
    });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      "success",
      7,
      3,
    ]);
  });

  it("reduces states under a symmetry set", () => {
    const result = checkFixture("symmetry", "Symmetry");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([42, 10, 7]);
  });

  it("reports the TLC trace when states are deduplicated by VIEW", () => {
    const result = checkFixture("view", "ViewMap");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("Inv");
    const trace = result.violation?.trace ?? [];
    expect(trace.map((step) => step.action)).toEqual([
      undefined,
      "lbc",
      "lbc",
      "lbp",
      "lbp",
      "lbc",
      "lbc",
      "lbc",
    ]);
    expect(trace.map((step) => formatValue(step.state.waitset))).toEqual([
      "{}",
      "{c1}",
      "{c1, c2}",
      "{c2}",
      "{c2, p1}",
      "{p1}",
      "{c1, p1}",
      "{c1, c2, p1}",
    ]);
    expect(formatValue(trace[7].state.pc)).toBe('(c1 :> "lbc" @@ c2 :> "lbc" @@ p1 :> "lbp")');
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([43, 14, 8]);
  });

  it("checks liveness on the graph of VIEW values", () => {
    const result = checkFixture("view", "MCDistributedReplicatedLog");
    expect(result.status).toBe("liveness-violation");
    expect(result.violation?.name).toBe("InSync");
    expect(result.violation?.trace.slice(1).every((step) => step.action !== undefined)).toBe(true);
    expect([result.generatedStates, result.distinctStates]).toEqual([271, 37]);
  });

  it("rejects a VIEW that is not an operator without arguments", () => {
    expect(() => checkModule("", "VIEW Missing")).toThrow(TlaConfigError);
    expect(() => checkModule("View(a) == a", "VIEW View")).toThrow(TlaConfigError);
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

describe("the Bags module matches TLC", () => {
  const checkBags = (body: string) =>
    check({
      source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC, Bags\nCONSTANT C\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${body}\n====`,
      config: "CONSTANT C = C\nINIT Init\nNEXT Next",
    });

  it("evaluates every assumption in TLC's BagsTest", () => {
    expect(checkFixture("bags", "BagsTest").status).toBe("success");
  });

  const getPassedLines = (numbers: number[]) =>
    numbers.map((number) => `"Test ${number} OK"  TRUE`);

  it.each([
    [
      "test36",
      [
        ...getPassedLines([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        '"TLC Fails Tests 11 & 12 because SubBag not implemented"  TRUE',
        ...getPassedLines([13, 14, 15, 16]),
      ],
    ],
    ["test50", getPassedLines([1, 2, 3, 4, 5, 6, 7])],
  ])("prints what TLC prints for its %s suite test", (name, lines) => {
    const printed: string[] = [];
    const result = check({
      source: readFileSync(join(FIXTURES, "bags", `${name}.tla`), "utf8"),
      config: readFileSync(join(FIXTURES, "bags", `${name}.cfg`), "utf8"),
      onPrint: (text) => printed.push(text),
    });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
    expect(printed).toEqual(lines);
  });

  it("evaluates SubBag by its TLA+ definition", () => {
    const result = checkBags(
      'Bag1 == SetToBag({"a", "b"})\nBag2 == Bag1 (+) SetToBag({"a"})\nASSUME Bag1 \\in SubBag(Bag2) /\\ Cardinality(SubBag(Bag2)) = 6\nASSUME Cardinality(SubBag(<<2, 1, 3>>)) = 24 /\\ SubBag(EmptyBag) = {EmptyBag}\nASSUME SubBag(<<2, 1>>) = {<<>>, <<1>>, <<2>>, (2 :> 1), <<1, 1>>, <<2, 1>>}',
    );
    expect(result.status).toBe("success");
  });

  it("accepts the values that TLC's Java overrides accept", () => {
    const result = checkBags(
      'ASSUME ~IsABag(C) /\\ ~IsABag("abc") /\\ ~IsABag({1})\nASSUME <<0, -1, 2>> (-) EmptyBag = (3 :> 2)\nASSUME BagUnion({1}) = 1 /\\ BagUnion({<<0>>, <<1>>}) = <<1>>\nASSUME <<0>> \\sqsubseteq EmptyBag /\\ ~(<<1>> \\sqsubseteq <<-3>>)\nASSUME BagOfAll(LAMBDA n : n \\div 2, <<1, 2, 3, 4>>) = (0 :> 1 @@ 1 :> 5 @@ 2 :> 4)\nASSUME ~BagIn(C, <<1>>) /\\ ~BagIn(1, <<0>>) /\\ CopiesIn(2, <<1, 0>>) = 0',
    );
    expect(result.status).toBe("success");
  });

  it.each([
    [
      "BagCardinality(<<0>>)",
      "Applying BagCardinality to the following value, which is not a bag: <<0>>",
    ],
    ["<<0>> (+) EmptyBag", "The first argument of (+) should be a bag, but instead it is: <<0>>"],
    ["EmptyBag (-) 1", "The second argument of (-) should be a bag, but instead it is: 1"],
    [
      'BagIn(1, <<"a">>)',
      'The second argument of BagIn should be a bag, but instead it is: <<"a">>',
    ],
    [
      "BagUnion({1, 2})",
      "Attempted to apply BagUnion to the following set, whose element is not a bag: {1, 2}",
    ],
    [
      "SetToBag(Nat)",
      "Applying BagToSet to the following value, which is not a function with a finite domain: Nat",
    ],
    [
      "1 \\sqsubseteq EmptyBag",
      "Applying \\sqsubseteq to the following value, which is not a function with a finite domain: 1",
    ],
    [
      "BagOfAll(LAMBDA n : n, 1)",
      "The second argument of BagOfAll should be a function with a finite domain, but instead it is: 1",
    ],
    ["<<2147483647>> (+) <<1>>", "Overflow when computing 2147483647+1"],
  ])("rejects %s", (expression, message) => {
    const result = checkBags(`ASSUME PrintT(${expression})`);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });
});

describe("the Reals module matches TLC", () => {
  const checkSource = (source: string) =>
    check({
      source: `---- MODULE M ----\n${source}\nNext == x' = x\n====`,
      config: "INIT Init\nNEXT Next",
    });

  it("extends Integers and defines Real as a string", () => {
    const result = checkSource(
      'EXTENDS Reals\nVARIABLE x\nASSUME (-7) \\div 2 = -4 /\\ (-7) % 2 = 1 /\\ -1 \\in Int\nASSUME Real = "Reals"\nInit == x = Real',
    );
    expect(result.status).toBe("success");
    expect(result.distinctStates).toBe(1);
  });

  it("fails to check membership in Real", () => {
    const result = checkSource("EXTENDS Reals\nVARIABLE x\nASSUME 1 \\in Real\nInit == x = 0");
    expect(result.status).toBe("assumption-violation");
  });

  it("fails to choose a quotient before evaluating its operands", () => {
    const divide = () => checkSource("EXTENDS Reals\nVARIABLE x\nInit == x = 1 / (1 \\div 0)");
    expect(divide).toThrow(TlaEvaluationError);
    expect(divide).toThrow(/non-enumerable quantifier bound "Reals" at line 16/);
  });

  it("fails to evaluate Infinity as an unbounded CHOOSE", () => {
    expect(() => checkSource("EXTENDS Reals\nVARIABLE x\nInit == x = Infinity")).toThrow(
      /unbounded CHOOSE at line 17, column 13/,
    );
  });

  it("parses decimal literals", () => {
    const module = parseModule("---- MODULE M ----\nHalf == 1.5\nRange == 1..2\n====");
    expect(module.definitions.map((definition) => definition.body.kind)).toEqual([
      "Decimal",
      "Apply",
    ]);
  });

  it.each([
    ["an evaluated decimal", "EXTENDS Reals\nVARIABLE x\nInit == x = 1.5"],
    ["a decimal that is never evaluated", "VARIABLE x\nHalf == 1.5\nInit == x = 0"],
  ])("rejects %s before checking", (_, source) => {
    const run = () => checkSource(source);
    expect(run).toThrow(TlaEvaluationError);
    expect(run).toThrow(/^TLC can't handle real numbers: 1\.5/);
  });
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

  it("applies operators in prefix form and reads keywords as field names", () => {
    const result = checkSource(
      'EXTENDS Naturals\nn ^+ == n + 1\nASSUME +(4, 6) = 10 /\\ ^+(2) = 3\nASSUME [[x \\in {"THEN"} |-> 1] EXCEPT !.THEN = 2].THEN = 2',
    );
    expect(result.status).toBe("success");
  });

  it("takes infix operators as parameters", () => {
    const result = checkSource(
      "EXTENDS Naturals\nFoo(a, _--_) == a -- 1\nASSUME Foo(7, +) = 8 /\\ Foo(7, *) = 7",
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

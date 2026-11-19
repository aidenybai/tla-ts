import { mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { FIXTURES } from "./check-harness";
import { getToolSequence, runCliWith } from "./cli-harness";

const runCli = (directory: string, name: string, args: string[] = []) =>
  runCliWith(directory, [`${name}.tla`, ...args]);

const getCheckedSpecs = (output: string) =>
  output.split("\n").filter((line) => /^Checking \S+\.tla with /.test(line));

const getStateLines = (output: string) =>
  output.split("\n").filter((line) => line.includes(" = ") && !line.startsWith("State"));

describe("the CLI prints traces like TLC", () => {
  it("prints a state with one variable without a conjunction", () => {
    const result = runCli("counter", "Counter");
    expect(result.status).toBe(11);
    expect(getStateLines(result.stdout)).toEqual([
      "count = 0",
      "count = 1",
      "count = 2",
      "count = 3",
    ]);
  });

  it("prints a state with several variables as a conjunction", () => {
    const result = runCli("water-jugs", "WaterJugs");
    expect(result.status).toBe(12);
    expect(getStateLines(result.stdout).slice(0, 2)).toEqual(["/\\ large = 0", "/\\ small = 0"]);
  });
});

const STARTUP_LINE =
  /^(TLC2 Version |Running breadth-first search |Parsing file |Semantic processing of module |Linting of module )/;

const getSteadyLines = (output: string) =>
  output
    .replace(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/g, "_")
    .replace(/_TTrace_\d+/g, "_TTrace__")
    .replace(/__Debugger(Expr|Module)__\d+/g, "__Debugger$1__")
    .replace(/ in \d\ds at /g, " in _ at ")
    .split("\n")
    .filter((line) => !STARTUP_LINE.test(line));

const TLC_REPORTS = [
  [
    "AssumptionFalse",
    10,
    [
      "Starting... (_)",
      "Error: Assumption line 4, col 20 to line 4, col 24 of module AssumptionFalse is false.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "Success",
    0,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 2 distinct states generated at _.",
      "Model checking completed. No error has been found.",
      "  Estimates of the probability that TLC did not check all reachable states",
      "  because two distinct states had the same fingerprint:",
      "  calculated (optimistic):  val = 1.3E-18",
      "10 states generated, 6 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).",
      "Finished in _ at (_)",
    ],
  ],
  [
    "InitialInvariant",
    12,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: Invariant Inv is violated by the initial state:",
      "x = 0",
      "",
      "Finished in _ at (_)",
    ],
  ],
  [
    "Lasso",
    13,
    [
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Progress(2) at _: 3 states generated, 2 distinct states found, 0 states left on queue.",
      "Checking temporal properties for the complete state space with 2 total distinct states at (_)",
      "Error: Temporal property Prop was violated.",
      "",
      "Error: The following behavior constitutes a counter-example:",
      "",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 18 of module Lasso>",
      "x = 1",
      "",
      "Back to state 1: <Next line 5, col 9 to line 5, col 18 of module Lasso>",
      "",
      "Finished checking temporal properties in _ at _",
      "3 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./Lasso_TTrace__.tla",
    ],
  ],
  [
    "Lassos",
    13,
    [
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 2 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Progress(3) at _: 4 states generated, 3 distinct states found, 0 states left on queue.",
      "Checking 2 branches of temporal properties for the complete state space with 6 total distinct states at (_)",
      "Error: Temporal properties Reach, Settle, and Stop were violated.",
      "",
      "Error: The following behavior constitutes a counter-example:",
      "",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 24 of module Lassos>",
      "x = 1",
      "",
      "State 3: <Next line 5, col 9 to line 5, col 24 of module Lassos>",
      "x = 2",
      "",
      "Back to state 1: <Next line 5, col 9 to line 5, col 24 of module Lassos>",
      "",
      "Finished checking temporal properties in _ at _",
      "4 states generated, 3 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./Lassos_TTrace__.tla",
    ],
  ],
  [
    "SafetyProperty",
    12,
    [
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: Temporal property Bounded was violated.",
      "",
      "Error: The following behavior constitutes a counter-example:",
      "",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 27 of module SafetyProperty>",
      "x = 1",
      "",
      "3 states generated, 3 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./SafetyProperty_TTrace__.tla",
    ],
  ],
  [
    "FailedInvariant",
    76,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: Evaluating invariant Inv failed.",
      "The second argument of \\div is 0.",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 5, col 9 to line 5, col 27 of module FailedInvariant>",
      "x = 1",
      "",
      "State 3: <Next line 5, col 9 to line 5, col 27 of module FailedInvariant>",
      "x = 2",
      "",
      "3 states generated, 3 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./FailedInvariant_TTrace__.tla",
    ],
  ],
  [
    "RebuildFailure",
    12,
    [
      "Starting... (_)",
      "Computing initial states...",
      '"i"',
      "Finished computing initial states: 1 distinct state generated at _.",
      '<<"n", 0>>',
      '<<"n", 1>>',
      "Error: Invariant Inv is violated.",
      '"i"',
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      '<<"n", 0>>',
      "State 2: <Next line 5, col 9 to line 5, col 83 of module RebuildFailure>",
      "x = 1",
      "",
      '<<"n", 1>>',
      '"b"',
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "See the User Output or TLC Console for clues to what happened.",
      "The exception was a java.lang.RuntimeException",
      ": In computing next states, TLC expected a boolean expression,",
      "but instead found 1.",
      "1",
      '"i"',
      '<<"n", 0>>',
      '<<"n", 1>>',
      '"b"',
      "3 states generated, 3 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./RebuildFailure_TTrace__.tla",
    ],
  ],
  [
    "EventualAction",
    255,
    [
      "Starting... (_)",
      "Warning: Declaring symmetry during liveness checking is dangerous. It might cause TLC to miss violations of the stated liveness properties. Please check liveness without symmetry defined.",
      "(Use the -nowarning option to disable this warning.)",
      "Error: Temporal formulas containing actions must be of forms <>[]A or []<>A.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "NoNext",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: No next state actions defined to generate successor states from.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "FailedAssert",
    14,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: The first argument of Assert evaluated to FALSE; the second argument was:",
      '"x is 1"',
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "State 2: <Next line 6, col 5 to line 7, col 30 of module FailedAssert>",
      "x = 1",
      "",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 6, column 5 to line 7, column 30 in FailedAssert",
      "1. Line 6, column 8 to line 6, column 17 in FailedAssert",
      "2. Line 7, column 8 to line 7, column 30 in FailedAssert",
      "",
      "",
      "2 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./FailedAssert_TTrace__.tla",
    ],
  ],
  [
    "FailedInitialInvariant",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: The first argument of Assert evaluated to FALSE; the second argument was:",
      '"a is 1"',
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 5, column 5 to line 6, column 15 in FailedInitialInvariant",
      "1. Line 5, column 8 to line 5, column 17 in FailedInitialInvariant",
      "2. Line 6, column 8 to line 6, column 15 in FailedInitialInvariant",
      "3. Line 8, column 8 to line 8, column 30 in FailedInitialInvariant",
      "",
      "",
      "1 states generated, 1 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "IllegalInitialState",
    255,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: current state is not a legal state",
      "While working on the initial state:",
      "/\\ x = 1",
      "/\\ y = null",
      "",
      "Finished in _ at (_)",
    ],
  ],
  [
    "LivenessError",
    255,
    [
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 9, column 14 to line 9, column 22 in LivenessError",
      "",
      "",
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "See the User Output or TLC Console for clues to what happened.",
      "The exception was a java.lang.RuntimeException",
      ": Attempted to check equality of integer 0 with non-integer:",
      '"abc"',
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "/\\ x = 0",
      "/\\ y = 0",
      "",
      "2 states generated, 2 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).",
      "Finished in _ at (_)",
    ],
  ],
  [
    "Undefined",
    150,
    [
      "*** Warnings: 1",
      "",
      "line 5, col 17 to line 5, col 20 of module Undefined",
      "",
      "Multiple declarations or definitions for symbol F.  ",
      "This duplicates the one at line 5, col 11 to line 5, col 14 of module Undefined.",
      "",
      "",
      "",
      "Semantic errors:",
      "",
      "*** Errors: 2",
      "",
      "line 5, col 11 to line 5, col 14 of module Undefined",
      "",
      "Symbol F declared in RECURSIVE statement but not defined.",
      "",
      "",
      "line 5, col 17 to line 5, col 20 of module Undefined",
      "",
      "Symbol F declared in RECURSIVE statement but not defined.",
      "",
      "",
      "Starting... (_)",
      "Error: Parsing or semantic analysis failed.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "UnfingerprintedEquality",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "See the User Output or TLC Console for clues to what happened.",
      "The exception was a java.lang.RuntimeException",
      ": Attempted to check equality of the set {1, 2} with the value:",
      "0",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      "Error: TLC was unable to fingerprint.",
      "",
      "Fingerprint Stack Trace:",
      "0. Line 6, column 5 to line 7, column 43 in UnfingerprintedEquality",
      "1. Line 6, column 8 to line 6, column 12 in UnfingerprintedEquality",
      "2. Line 7, column 8 to line 7, column 43 in UnfingerprintedEquality",
      "3. Line 7, column 13 to line 7, column 43 in UnfingerprintedEquality",
      "4. Line 7, column 16 to line 7, column 25 in UnfingerprintedEquality",
      "5. Line 7, column 16 to line 7, column 21 in UnfingerprintedEquality",
      "",
      "",
      "Reason:",
      "Attempted to check equality of the set {1, 2} with the value:",
      "0",
      "1 states generated, 1 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "UnfingerprintedProduct",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: Shouldn't call isEmpty() on value <<3, 1, 2>>",
      "While working on the initial state:",
      "x = 0",
      "",
      "Error: TLC was unable to fingerprint.",
      "",
      "Fingerprint Stack Trace:",
      "0. Line 3, column 9 to line 3, column 13 in UnfingerprintedProduct",
      "1. Line 5, column 8 to line 5, column 49 in UnfingerprintedProduct",
      "2. Line 5, column 24 to line 5, column 41 in UnfingerprintedProduct",
      "3. Line 5, column 24 to line 5, column 34 in UnfingerprintedProduct",
      "",
      "",
      "Reason:",
      "Shouldn't call isEmpty() on value <<3, 1, 2>>",
      "1 states generated, 1 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "UnfingerprintedConcat",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: Shouldn't call isEmpty() on value <<3, 1, 2>>",
      "While working on the initial state:",
      "x = 0",
      "",
      "Error: TLC was unable to fingerprint.",
      "",
      "Fingerprint Stack Trace:",
      "0. Line 4, column 9 to line 4, column 13 in UnfingerprintedConcat",
      "1. Line 6, column 8 to line 6, column 59 in UnfingerprintedConcat",
      "2. Line 6, column 24 to line 6, column 51 in UnfingerprintedConcat",
      "3. Line 6, column 33 to line 6, column 43 in UnfingerprintedConcat",
      "",
      "",
      "Reason:",
      "Shouldn't call isEmpty() on value <<3, 1, 2>>",
      "1 states generated, 1 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "UnfingerprintedState",
    75,
    [
      "Starting... (_)",
      "Computing initial states...",
      "Error: Overflow when computing the number of elements in:",
      "SUBSET (1..36)",
      "While working on the initial state:",
      "x = SUBSET SUBSET (1..36)",
      "",
      "Error: TLC was unable to fingerprint.",
      "",
      "Fingerprint Stack Trace:",
      "1) line 4, col 20 to line 4, col 33 of module UnfingerprintedState",
      "0) line 4, col 13 to line 4, col 33 of module UnfingerprintedState",
      "",
      "Reason:",
      "Overflow when computing the number of elements in:",
      "SUBSET (1..36)",
      "1 states generated, 0 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
    ],
  ],
  [
    "UnspecifiedFairness",
    255,
    [
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 9, column 14 to line 9, column 18 in UnspecifiedFairness",
      "1. Line 7, column 10 to line 7, column 15 in UnspecifiedFairness",
      "2. Line 9, column 12 to line 9, column 12 in UnspecifiedFairness",
      "",
      "",
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "See the User Output or TLC Console for clues to what happened.",
      "The exception was a java.lang.RuntimeException",
      ": The action formula A appearing in a WF_v(A) or SF_v(A) operator does not specify the primed value of the variable y occurring in the state formula v.",
      "",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "/\\ x = 0",
      "/\\ y = 0",
      "",
      "2 states generated, 2 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "The average outdegree of the complete state graph is 1 (minimum is 1, the maximum 1 and the 95th percentile is 1).",
      "Finished in _ at (_)",
    ],
  ],
  [
    "Warned",
    0,
    [
      "*** Warnings: 1",
      "",
      "line 14, col 1 to line 14, col 16 of module Naturals",
      "",
      "Multiple declarations or definitions for symbol Nat.  ",
      "This duplicates the one at line 3, col 1 to line 3, col 10 of module Warned.",
      "",
      "",
      "",
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Model checking completed. No error has been found.",
      "  Estimates of the probability that TLC did not check all reachable states",
      "  because two distinct states had the same fingerprint:",
      "  calculated (optimistic):  val = 5.4E-20",
      "2 states generated, 1 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "The average outdegree of the complete state graph is 0 (minimum is 0, the maximum 0 and the 95th percentile is 0).",
      "Finished in _ at (_)",
    ],
  ],
] as const;

describe("the CLI reports results like TLC", () => {
  it.each(TLC_REPORTS)("reports %s", (name, code, lines) => {
    const result = runCli("cli-output", name);
    expect(result.status).toBe(code);
    expect(getSteadyLines(result.stdout)).toEqual([...lines, ""]);
  });

  it("names no temporal property when the counterexample a VIEW merges satisfies them all", () => {
    const result = runCli("cli-output", "ViewLasso");
    expect(result.status).toBe(13);
    expect(result.stdout).toContain("Error: Temporal properties were violated.\n");
  });

  it("prints the counterexample before it fails to rebuild the step back of a lasso under a VIEW like TLC", () => {
    const result = runCli("view", "Recover");
    expect(result.status).toBe(1);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Progress(2) at _: 5 states generated, 3 distinct states found, 0 states left on queue.",
      "Checking temporal properties for the complete state space with 3 total distinct states at (_)",
      "Error: Temporal property Never was violated.",
      "",
      "Error: The following behavior constitutes a counter-example:",
      "",
      "State 1: <Initial predicate>",
      "/\\ x = 0",
      "/\\ y = 0",
      "",
      "State 2: <A line 6, col 6 to line 6, col 30 of module Recover>",
      "/\\ x = 1",
      "/\\ y = 0",
      "",
      "State 3: <B line 8, col 6 to line 8, col 30 of module Recover>",
      "/\\ x = 2",
      "/\\ y = 0",
      "",
      "Error: TLC threw an unexpected exception.",
      "This was probably caused by an error in the spec or model.",
      "See the User Output or TLC Console for clues to what happened.",
      "The exception was a tlc2.tool.EvalException",
      ": Failed to recover the next state from its fingerprint.",
      "",
    ]);
  });

  it("checks liveness on the complete state graph with -lncheck final", () => {
    const [, code, lines] = TLC_REPORTS.find((report) => report[0] === "Lasso") ?? [];
    const result = runCli("cli-output", "Lasso", ["-lncheck", "final"]);
    expect(result.status).toBe(code);
    expect(getSteadyLines(result.stdout)).toEqual([...(lines ?? []), ""]);
  });

  it.each([
    "Continue",
    "DoInitFunctorInvariantContinue",
    "ContinueSuccessors",
    "ContinueAlias",
    "ContinueInitialPrint",
  ])("goes on past each violation in %s with -continue like TLC", (name) => {
    const result = runCli("tlc-continue", name, ["-continue"]);
    expect(result.status).toBe(12);
    expect(getSteadyLines(result.stdout)).toEqual(
      readFileSync(join(FIXTURES, "tlc-continue", `${name}.out`), "utf8").split("\n"),
    );
  });

  it.each(["ContinueNextFailure", "ContinueNextFailureSuccessors"])(
    "reports the failure of the next-state relation in %s once with -continue, where TLC reports it twice",
    (name) => {
      const result = runCli("tlc-continue", name, ["-continue"]);
      expect(result.status).toBe(75);
      expect(getSteadyLines(result.stdout)).toEqual(
        readFileSync(join(FIXTURES, "tlc-continue", `${name}.out`), "utf8").split("\n"),
      );
    },
  );

  it("rejects a spec whose file name differs from its module name like TLC", () => {
    const result = runCli("cli-module-name", "Renamed");
    const reason =
      "File name 'Renamed' does not match the name 'Other' of the top level module it contains.";
    expect(result.status).toBe(150);
    expect(getSteadyLines(result.stdout)).toEqual([
      "",
      "Fatal errors while parsing TLA+ spec in file Renamed",
      "",
      "Unknown location",
      "",
      reason,
      "*** Errors: 1",
      "",
      "Unknown location",
      "",
      reason,
      "",
      "",
      "",
      "Starting... (_)",
      "Error: Parsing or semantic analysis failed.",
      "Finished in _ at (_)",
      "",
    ]);
  });

  it("prints SANY's message for an extended module it cannot parse like TLC", () => {
    const result = runCli("cli-parse-error", "Root");
    expect(result.status).toBe(150);
    expect(result.stdout.replace(/\(\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\)/g, "(DATE)")).toContain(
      [
        "***Parse Error***",
        'Encountered "]" at line 2, column 24 and token "|->" ',
        "",
        "Residual stack trace follows:",
        "ExtendableExpr starting at line 2, column 24.",
        "Expression starting at line 2, column 24.",
        "Field Value starting at line 2, column 18.",
        "Some [] Form starting at line 2, column 8.",
        "ExtendableExpr starting at line 2, column 8.",
        "",
        "",
        "Fatal errors while parsing TLA+ spec in file Root",
        "",
        "In module Base",
        "",
        "Could not parse module Base from file Base.tla",
        "*** Errors: 1",
        "",
        "In module Base",
        "",
        "Could not parse module Base from file Base.tla",
        "",
        "",
        "",
        "Starting... (DATE)",
        "Error: Parsing or semantic analysis failed.",
      ].join("\n"),
    );
  });

  it("rejects -lncheck without a strategy like TLC", () => {
    const result = runCli("cli-output", "Lasso", ["-lncheck"]);
    expect(result.status).toBe(1);
    expect(result.stdout.split("\n").slice(1)).toEqual([
      "Error: Error: expect a strategy such as final for -lncheck option.",
      "Usage: java tlc2.TLC [-help] [-option] inputfile",
      "",
    ]);
  });

  it("names a spec given by an absolute path by its file name, as TLC runs from its directory", () => {
    const directory = join(FIXTURES, "cli-output");
    const result = runCliWith("cli-output", [
      "-config",
      "Success.cfg",
      join(directory, "Missing.tla"),
    ]);
    expect(result.status).toBe(150);
    expect(result.stderr).toBe(
      `File does not exist: ${directory}/Missing.tla while looking in these directories: ${directory}, , classpath:/tla2sany/StandardModules, classpath:/\n`,
    );
    expect(result.stdout).toContain("\nFatal errors while parsing TLA+ spec in file Missing\n");
  });

  it("reports its version and runtime, then the files SANY parses, the modules it analyzes and the modules it lints", () => {
    const directory = join(FIXTURES, "cli-output");
    const args = [
      "-Djava.io.tmpdir=/tmp",
      "-cp",
      "/lib/tla2tools.jar",
      "tlc2.TLC",
      "-workers",
      "2",
      "-seed",
      "7",
      "Success",
    ];
    const result = runCliWith("cli-output", args);
    const lines = result.stdout.split("\n");
    expect(lines[0]).toMatch(/^TLC2 Version \d+\.\d+\.\d+ \(rev: tla-ts\)$/);
    expect(lines[1]).toMatch(
      /^Running breadth-first search Model-Checking with fp 0 and seed 7 with 2 workers on \d+ cores with \d+MB heap and 64MB offheap memory \[pid: \d+\] \(.+, Node\.js .+, MSBDiskFPSet, DiskStateQueue\)\.$/,
    );
    expect(lines[2]).toBe(`Parsing file ${realpathSync(join(directory, "Success.tla"))}`);
    const standardModules = ["Naturals", "_TLCTrace", "TLC", "TLCExt", "Sequences", "FiniteSets"];
    expect(lines.slice(3, 10)).toEqual(
      [...standardModules, "Integers"].map((name) =>
        expect.stringMatching(
          new RegExp(
            `^Parsing file ${realpathSync("/tmp")}/tlc-\\d+/${name}\\.tla \\(jar:file:/lib/tla2tools\\.jar!/tla2sany/StandardModules/${name}\\.tla\\)$`,
          ),
        ),
      ),
    );
    expect(lines.slice(10, 21)).toEqual([
      "Semantic processing of module Naturals",
      "Semantic processing of module Sequences",
      "Semantic processing of module FiniteSets",
      "Semantic processing of module TLC",
      "Semantic processing of module Integers",
      "Semantic processing of module TLCExt",
      "Semantic processing of module _TLCTrace",
      "Semantic processing of module Success",
      "Linting of module TLCExt",
      "Linting of module _TLCTrace",
      "Linting of module Success",
    ]);
    // Deviation from TLC: TLC names its copies of the standard modules at random, and tla-ts the same way each run.
    expect(runCliWith("cli-output", args).stdout.split("\n")[3]).toBe(lines[3]);
    expect(
      runCliWith("cli-output", [...args, "-noTE"])
        .stdout.split("\n")
        .slice(4, 7),
    ).toEqual([
      "Semantic processing of module Naturals",
      "Semantic processing of module Success",
      "Linting of module Success",
    ]);
  });

  it("reports the JVM's default offheap memory when it simulates or searches depth first", () => {
    expect(
      runCliWith("cli-output", ["-simulate", "num=1", "-seed", "7", "Success"]).stdout.split(
        "\n",
      )[1],
    ).toMatch(
      /^Running Random Simulation with seed 7 with 1 worker on \d+ cores with \d+MB heap and 64MB offheap memory \[pid: \d+\] \(.+, Node\.js .+\)\.$/,
    );
    expect(runCliWith("cli-output", ["-dfid", "3", "Success"]).stdout.split("\n")[1]).toMatch(
      /^Running depth-first search Model-Checking with fp 0 and seed 0 with 1 worker on \d+ cores with \d+MB heap and 64MB offheap memory \[pid: \d+\] \(.+, Node\.js .+\)\.$/,
    );
  });

  it("reports the coverage of a simulation, again with its last progress, and of a depth-first search", () => {
    const getCoverage = (args: string[]) => {
      const lines = getSteadyLines(runCliWith("cli-output", [...args, "Coverage"]).stdout);
      const start = lines.findIndex((line) => line.startsWith("The coverage statistics"));
      return lines.slice(
        start,
        lines.findIndex((line, index) => index > start && line.includes("states generated")),
      );
    };
    const heading =
      "The coverage statistics at _ (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).";
    const simulation = [
      heading,
      "<x line 3, col 10 to line 3, col 10 of module Coverage>: 0",
      "<Init line 4, col 1 to line 4, col 4 of module Coverage>: 2:2",
      "  line 4, col 9 to line 4, col 20 of module Coverage: 2",
      "  |line 4, col 15 to line 4, col 20 of module Coverage: 1:3",
      "<A line 5, col 1 to line 5, col 1 of module Coverage>: 6:6",
      "  line 5, col 6 to line 5, col 10 of module Coverage: 6",
      "  |line 5, col 6 to line 5, col 6 of module Coverage: 8",
      "  line 5, col 15 to line 5, col 24 of module Coverage: 6",
      "<B line 6, col 1 to line 6, col 1 of module Coverage>: 6:6",
      "  line 6, col 6 to line 6, col 24 of module Coverage: 6",
      "<Inv line 8, col 1 to line 8, col 3 of module Coverage>",
      "  line 8, col 8 to line 8, col 13 of module Coverage: 14",
      "End of statistics.",
    ];
    expect(
      getCoverage(["-simulate", "num=3", "-depth", "4", "-seed", "4", "-coverage", "1"]),
    ).toEqual([...simulation, ...simulation]);
    expect(getCoverage(["-dfid", "3", "-coverage", "1"])).toEqual([
      heading,
      "<x line 3, col 10 to line 3, col 10 of module Coverage>: 0",
      "<Init line 4, col 1 to line 4, col 4 of module Coverage>: 2:2",
      "  line 4, col 9 to line 4, col 20 of module Coverage: 2",
      "  |line 4, col 15 to line 4, col 20 of module Coverage: 1:3",
      "<A line 5, col 1 to line 5, col 1 of module Coverage>: 0:5",
      "  line 5, col 6 to line 5, col 24 of module Coverage: 5",
      "<B line 6, col 1 to line 6, col 1 of module Coverage>: 0:3",
      "  line 6, col 6 to line 6, col 10 of module Coverage: 3",
      "  |line 6, col 6 to line 6, col 6 of module Coverage: 5",
      "  line 6, col 15 to line 6, col 24 of module Coverage: 3",
      "<Inv line 8, col 1 to line 8, col 3 of module Coverage>",
      "  line 8, col 8 to line 8, col 13 of module Coverage: 4",
      "End of statistics.",
    ]);
  });

  const runCliWithUserFile = (name: string) => {
    const directory = mkdtempSync(join(tmpdir(), "user-file-"));
    const path = join(directory, "user.txt");
    const result = runCli("cli-output", name, ["-noGenerateSpecTE", "-userFile", path]);
    const written = readFileSync(path, "utf8");
    rmSync(directory, { recursive: true });
    return { result, written };
  };

  it("writes the output of Print and PrintT to -userFile, also while it rebuilds the trace, like TLC", () => {
    const run = runCliWithUserFile("UserFile");
    expect(run.result.status).toBe(12);
    expect(run.result.stdout.split("\n").filter((line) => line.startsWith("<<"))).toEqual([]);
    expect(run.written).toBe(
      [
        '<<"init", 0>>',
        '<<"next", 0>>  TRUE',
        '<<"next", 1>>  TRUE',
        '<<"init", 0>>',
        '<<"next", 0>>  TRUE',
        '<<"next", 1>>  TRUE',
        '<<"init", 0>>',
        '<<"next", 0>>  TRUE',
        '<<"next", 1>>  TRUE',
        "",
      ].join("\n"),
    );
  });

  it("writes the counts of the _POSSIBLE predicates to -userFile like TLC", () => {
    const run = runCliWithUserFile("UserFilePossible");
    expect(run.result.status).toBe(10);
    expect(run.result.stdout).not.toContain("[Seen |-> 1, Unseen |-> 0]");
    expect(run.written).toBe("[Seen |-> 1, Unseen |-> 0]\n");
  });

  it("writes the value of PrintT and the counts of the _POSSIBLE predicates to -userFile on one line, and that of Print pretty-printed, like TLC", () => {
    const run = runCliWithUserFile("UserFileLong");
    expect(run.result.status).toBe(10);
    expect(run.written).toBe(
      [
        "<<100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000>>",
        "<< 100000,",
        "   200000,",
        "   300000,",
        "   400000,",
        "   500000,",
        "   600000,",
        "   700000,",
        "   800000,",
        "   900000,",
        "   1000000,",
        "   1100000,",
        "   1200000 >>  TRUE",
        "[ReachesTheFirstLongState |-> 1, ReachesTheSecondLongState |-> 1, ReachesTheThirdLongStateNever |-> 0, AlsoNeverReachedWithLongName |-> 0]",
        "",
      ].join("\n"),
    );
  });
});

describe("the CLI answers PickSuccessor from standard input like TLC", () => {
  const getPickLines = (output: string) => {
    const lines = output.split("\n");
    return lines.slice(
      lines.findIndex((line) => line.startsWith("Finished computing initial states")) + 1,
      lines.findIndex((line) => /^(Model checking completed|Progress:)/.test(line)),
    );
  };
  const ask = (length: number, line: number) =>
    `Extend behavior of length ${length} with a "Next" step [<Action line ${line}, col 12 to line ${line}, col 45 of module PickAsk>]? (Yes/no/explored/states/diff):`;
  const getCoverageLines = (output: string) => {
    const lines = output.split("\n");
    return lines.slice(
      lines.findIndex((line) => line.startsWith("The coverage statistics")) + 1,
      lines.indexOf("End of statistics."),
    );
  };
  const askExplored = (length: number, line: number) =>
    `Extend behavior of length ${length} with a "Next" step [<Action line ${line}, col 12 to line ${line}, col 41 of module PickExplored>]? (Yes/no/explored/states/diff):`;

  it("shows the states or their difference and asks again until an answer extends the behavior or not", () => {
    const result = runCliWith("tlc-ext", ["PickAsk.tla"], "s\nd\nzz\nN\ny\n \nno\nYes\n\n");
    expect(result.status).toBe(0);
    expect(getPickLines(result.stdout)).toEqual([
      ask(1, 8),
      "/\\ x = 0",
      "/\\ y = 0",
      "~>",
      "/\\ x = 1",
      "/\\ y = 0",
      ask(1, 8),
      "/\\ x = 1",
      "",
      ask(1, 8),
      ask(1, 8),
      ask(1, 8),
      ask(1, 9),
      ask(2, 8),
      ask(2, 9),
      ask(3, 8),
    ]);
  });

  it("marks a successor explored, which TLC neither checks nor asks about again", () => {
    const result = runCliWith("tlc-ext", ["PickExplored.tla"], "y\ny\ne\n");
    expect(result.status).toBe(0);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      askExplored(1, 10),
      askExplored(1, 11),
      askExplored(2, 11),
      "Progress(2) at _: 5 states generated, 4 distinct states found, 0 states left on queue.",
      "Checking temporal properties for the complete state space with 4 total distinct states at (_)",
      "Finished checking temporal properties in _ at _",
      "Model checking completed. No error has been found.",
      "  Estimates of the probability that TLC did not check all reachable states",
      "  because two distinct states had the same fingerprint:",
      "  calculated (optimistic):  val = 2.2E-19",
      "5 states generated, 4 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 2 and the 95th percentile is 2).",
      "Finished in _ at (_)",
      "",
    ]);
  });

  it("asks nothing after an invariant violation, as TLC has seen the successor that violates it", () => {
    const result = runCliWith("tlc-ext", ["PickExplored.tla"], "y\ny\ny\ny\n");
    expect(result.status).toBe(12);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Implied-temporal checking--satisfiability problem has 1 branches.",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      askExplored(1, 10),
      askExplored(1, 11),
      askExplored(2, 11),
      "Error: Invariant Unmarked is violated.",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "/\\ x = 0",
      "/\\ y = 0",
      "",
      "State 2: <Next line 10, col 12 to line 10, col 41 of module PickExplored>",
      "/\\ x = 1",
      "/\\ y = 0",
      "",
      "State 3: <Next line 11, col 12 to line 11, col 41 of module PickExplored>",
      "/\\ x = 1",
      "/\\ y = 1",
      "",
      "4 states generated, 4 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "Finished in _ at (_)",
      "Trace exploration spec path: ./PickExplored_TTrace__.tla",
      "",
    ]);
  });

  it.each([
    ["PickExploredPlain", "temporal properties for the complete state space with 3"],
    ["PickExploredBoth", "2 branches of temporal properties for the complete state space with 7"],
  ])(
    "counts the states of each branch's graph for the temporal check of %s like TLC",
    (config, checking) => {
      const result = runCliWith(
        "tlc-ext",
        ["PickExplored.tla", "-config", `${config}.cfg`],
        "y\ny\ne\n",
      );
      expect(result.status).toBe(0);
      expect(getSteadyLines(result.stdout)).toEqual(
        expect.arrayContaining([
          `Checking ${checking} total distinct states at (_)`,
          "5 states generated, 4 distinct states found, 0 states left on queue.",
        ]),
      );
    },
  );

  it("counts the successors TLC generates again to find the action of a step in the coverage", () => {
    const result = runCliWith("tlc-ext", ["PickAsk.tla", "-coverage", "1"], "y\n".repeat(7));
    expect(result.status).toBe(0);
    expect(getCoverageLines(result.stdout)).toEqual([
      "<x line 4, col 11 to line 4, col 11 of module PickAsk>: 3",
      "<y line 4, col 14 to line 4, col 14 of module PickAsk>: 2",
      "<Init line 6, col 1 to line 6, col 4 of module PickAsk>: 1:1",
      "  line 6, col 9 to line 6, col 22 of module PickAsk: 1",
      "<Next line 8, col 1 to line 8, col 4 of module PickAsk (8 12 8 45)>: 2:8",
      "  line 8, col 12 to line 8, col 16 of module PickAsk: 8",
      "  |line 8, col 12 to line 8, col 12 of module PickAsk: 11",
      "  line 8, col 21 to line 8, col 30 of module PickAsk: 8",
      "  line 8, col 35 to line 8, col 45 of module PickAsk: 8",
      "<Next line 8, col 1 to line 8, col 4 of module PickAsk (9 12 9 45)>: 3:6",
      "  line 9, col 12 to line 9, col 16 of module PickAsk: 6",
      "  |line 9, col 12 to line 9, col 12 of module PickAsk: 9",
      "  line 9, col 21 to line 9, col 30 of module PickAsk: 6",
      "  line 9, col 35 to line 9, col 45 of module PickAsk: 6",
      "<Ask line 11, col 1 to line 11, col 3 of module PickAsk>: 7:7",
      "  line 11, col 8 to line 11, col 27 of module PickAsk: 7",
      "  |line 11, col 22 to line 11, col 26 of module PickAsk: 5",
    ]);
  });

  it("counts the successors the behavior graph generates again in the coverage, also after a violation", () => {
    const result = runCliWith("tlc-ext", ["PickExplored.tla", "-coverage", "1"], "y\ny\ny\n");
    expect(result.status).toBe(12);
    expect(getCoverageLines(result.stdout)).toEqual([
      "<x line 4, col 11 to line 4, col 11 of module PickExplored>: 2",
      "<y line 4, col 14 to line 4, col 14 of module PickExplored>: 2",
      "<Init line 8, col 1 to line 8, col 4 of module PickExplored>: 3:3",
      "  line 8, col 9 to line 8, col 22 of module PickExplored: 3",
      "<Next line 10, col 1 to line 10, col 4 of module PickExplored (10 12 10 41)>: 1:5",
      "  line 10, col 12 to line 10, col 16 of module PickExplored: 15",
      "  |line 10, col 12 to line 10, col 12 of module PickExplored: 10",
      "  line 10, col 21 to line 10, col 26 of module PickExplored: 5",
      "  line 10, col 31 to line 10, col 41 of module PickExplored: 5",
      "<Next line 10, col 1 to line 10, col 4 of module PickExplored (11 12 11 41)>: 2:7",
      "  line 11, col 12 to line 11, col 16 of module PickExplored: 13",
      "  |line 11, col 12 to line 11, col 12 of module PickExplored: 7",
      "  line 11, col 21 to line 11, col 26 of module PickExplored: 6",
      "  line 11, col 31 to line 11, col 41 of module PickExplored: 6",
      "<Unmarked line 17, col 1 to line 17, col 8 of module PickExplored>",
      "  line 17, col 13 to line 17, col 21 of module PickExplored: 4",
      "<Ask line 15, col 1 to line 15, col 3 of module PickExplored>: 4:4",
      "  line 15, col 8 to line 15, col 27 of module PickExplored: 4",
      "  |line 15, col 22 to line 15, col 26 of module PickExplored: 3",
    ]);
  });

  it("tells a simulation it can't mark a state explored and asks again", () => {
    const lines = getPickLines(
      runCliWith(
        "tlc-ext",
        ["-simulate", "num=1", "-seed", "1", "-depth", "2", "PickAsk.tla"],
        "e\ny\nn\n",
      ).stdout,
    );
    expect(lines).toEqual([
      ask(1, 9),
      "Marking a state explored is unsupported by the current TLC mode. Is TLC running in simulation mode?",
      ask(1, 9),
      ask(2, 8),
    ]);
  });

  it("evaluates the guard of a partial successor in a simulation, which remembers no states", () => {
    const lines = getPickLines(
      runCliWith("tlc-ext", ["-simulate", "num=1", "-seed", "1", "-depth", "3", "PickGuard.tla"])
        .stdout,
    );
    expect(lines).toEqual(['"guard"', '"guard"', '"guard"']);
  });
});

describe("the CLI checks an invariant of -inv in a module of its own like TLC", () => {
  const runInvariants = (name: string, args: string[]) =>
    runCliWith("runtime-invariants", [`${name}.tla`, "-noGenerateSpecTE", ...args]);

  it("leaves the invariant out of the coverage statistics", () => {
    const result = runInvariants("InvParameterizedTest", [
      "-coverage",
      "1",
      "-inv",
      "~(small = 3 /\\ big = 0)",
    ]);
    expect(result.status).toBe(12);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      "Error: Invariant __DebuggerExpr__ is violated.",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "/\\ big = 0",
      "/\\ small = 0",
      "",
      "State 2: <FillSmall line 12, col 14 to line 13, col 28 of module InvParameterizedTest>",
      "/\\ big = 0",
      "/\\ small = 3",
      "",
      "The coverage statistics at _ (see https://explain.tlapl.us/module-coverage-statistics for how to interpret the following statistics).",
      "<big line 4, col 18 to line 4, col 20 of module InvParameterizedTest>: 0",
      "<small line 4, col 11 to line 4, col 15 of module InvParameterizedTest>: 0",
      "<Init line 9, col 1 to line 9, col 4 of module InvParameterizedTest>: 2:2",
      "  line 9, col 9 to line 10, col 20 of module InvParameterizedTest: 2",
      "<FillSmall line 12, col 1 to line 12, col 9 of module InvParameterizedTest>: 1:3",
      "  line 12, col 17 to line 12, col 26 of module InvParameterizedTest: 2",
      "  line 13, col 17 to line 13, col 28 of module InvParameterizedTest: 2",
      "  |line 13, col 26 to line 13, col 28 of module InvParameterizedTest: 3",
      "<FillBig line 15, col 1 to line 15, col 7 of module InvParameterizedTest>: 0:0",
      "  line 15, col 15 to line 15, col 24 of module InvParameterizedTest: 0",
      "  line 16, col 15 to line 16, col 28 of module InvParameterizedTest: 0",
      "<EmptySmall line 18, col 1 to line 18, col 10 of module InvParameterizedTest>: 0:0",
      "  line 18, col 18 to line 18, col 27 of module InvParameterizedTest: 0",
      "  line 19, col 18 to line 19, col 29 of module InvParameterizedTest: 0",
      "<EmptyBig line 21, col 1 to line 21, col 8 of module InvParameterizedTest>: 0:0",
      "  line 21, col 16 to line 21, col 25 of module InvParameterizedTest: 0",
      "  line 22, col 16 to line 22, col 29 of module InvParameterizedTest: 0",
      "<SmallToBig line 24, col 1 to line 24, col 10 of module InvParameterizedTest>: 0:0",
      "  line 25, col 24 to line 25, col 43 of module InvParameterizedTest: 0",
      "  line 26, col 24 to line 26, col 33 of module InvParameterizedTest: 0",
      "  line 27, col 24 to line 27, col 33 of module InvParameterizedTest: 0",
      "  line 28, col 24 to line 28, col 49 of module InvParameterizedTest: 0",
      "<BigToSmall line 30, col 1 to line 30, col 10 of module InvParameterizedTest>: 0:0",
      "  line 31, col 24 to line 31, col 33 of module InvParameterizedTest: 0",
      "  line 32, col 24 to line 32, col 43 of module InvParameterizedTest: 0",
      "  line 33, col 24 to line 33, col 49 of module InvParameterizedTest: 0",
      "  line 34, col 24 to line 34, col 33 of module InvParameterizedTest: 0",
      "End of statistics.",
      "2 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "Finished in _ at (_)",
      "",
    ]);
  });

  it("locates an error in the invariant in the generated module", () => {
    const result = runInvariants("InvParameterizedTest", [
      "-inv",
      "small = CHOOSE n \\in {} : TRUE",
    ]);
    expect(result.status).toBe(75);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Computing initial states...",
      "Error: Attempted to compute the value of an expression of form",
      "CHOOSE x \\in S: P, but no element of S satisfied P.",
      "line 4, col 42 to line 4, col 63 of module __DebuggerModule__",
      "While working on the initial state:",
      "/\\ big = 0",
      "/\\ small = 0",
      "",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 9, column 9 to line 10, column 20 in InvParameterizedTest",
      "1. Line 9, column 12 to line 9, column 20 in InvParameterizedTest",
      "2. Line 10, column 12 to line 10, column 20 in InvParameterizedTest",
      "3. Line 4, column 34 to line 4, column 63 in __DebuggerModule__",
      "4. Line 4, column 42 to line 4, column 63 in __DebuggerModule__",
      "",
      "",
      "1 states generated, 1 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
      "",
    ]);
  });

  it("leaves the invariants out of TLCGet and parses them after the spec", () => {
    const result = runInvariants("RuntimeInvariants", ["-inv", "Small", "-inv", "[q |-> x].q < 4"]);
    expect(result.status).toBe(11);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      '<<{"p", "q"}, {}>>',
      "Error: Deadlock reached.",
      "Error: The behavior up to this point is:",
      "State 1: <Initial predicate>",
      "x = 0",
      "",
      '<<{"p", "q"}, {}>>',
      "State 2: <Next line 5, col 9 to line 5, col 80 of module RuntimeInvariants>",
      "x = 1",
      "",
      '<<{"p", "q"}, {}>>',
      "2 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
      "Finished in _ at (_)",
      "",
    ]);
  });

  it("parses a module the invariant instances with the spec, which neither assumes its ASSUME nor declares its constant", () => {
    const result = runInvariants("RuntimeInvariants", [
      "-inv",
      "LET I == INSTANCE Instanced WITH N <- 1 IN I!Positive",
    ]);
    expect(result.status).toBe(11);
    expect(
      result.stdout.split("\n").filter((line) => /^(Semantic processing|Linting) of /.test(line)),
    ).toEqual([
      "Semantic processing of module Naturals",
      "Semantic processing of module Sequences",
      "Semantic processing of module FiniteSets",
      "Semantic processing of module TLC",
      "Semantic processing of module Instanced",
      "Semantic processing of module RuntimeInvariants",
      "Linting of module Instanced",
      "Linting of module RuntimeInvariants",
    ]);
    expect(getSteadyLines(result.stdout).slice(0, 4)).toEqual([
      "Starting... (_)",
      "Computing initial states...",
      "Finished computing initial states: 1 distinct state generated at _.",
      '<<{"p", "q"}, {}>>',
    ]);
  });

  it("evaluates the body of a named operator, even one that takes arguments", () => {
    const result = runInvariants("RuntimeInvariants", ["-inv", "Below"]);
    expect(result.status).toBe(75);
    expect(getSteadyLines(result.stdout)).toEqual([
      "Starting... (_)",
      "Computing initial states...",
      "Error: In evaluation, the identifier n is either undefined or not an operator.",
      "line 7, col 17 to line 7, col 17 of module RuntimeInvariants",
      "While working on the initial state:",
      "x = 0",
      "",
      "Error: The error occurred when TLC was evaluating the nested",
      "expressions at the following positions:",
      "0. Line 4, column 9 to line 4, column 13 in RuntimeInvariants",
      "1. Line 7, column 13 to line 7, column 17 in RuntimeInvariants",
      "2. Line 7, column 17 to line 7, column 17 in RuntimeInvariants",
      "",
      "",
      "1 states generated, 1 distinct states found, 1 states left on queue.",
      "The depth of the complete state graph search is 1.",
      "Finished in _ at (_)",
      "",
    ]);
  });
});

describe("the CLI takes several specs and globs", () => {
  it("checks each spec a glob matches and exits with the first failure", () => {
    const result = runCliWith("cli-output", ["*.tla"]);
    expect(result.status).toBe(10);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking AssumptionFalse.tla with AssumptionFalse.cfg",
      "Checking Coverage.tla with Coverage.cfg",
      "Checking EventualAction.tla with EventualAction.cfg",
      "Checking FailedAssert.tla with FailedAssert.cfg",
      "Checking FailedInitialInvariant.tla with FailedInitialInvariant.cfg",
      "Checking FailedInvariant.tla with FailedInvariant.cfg",
      "Checking IllegalInitialState.tla with IllegalInitialState.cfg",
      "Checking InitialInvariant.tla with InitialInvariant.cfg",
      "Checking Lasso.tla with Lasso.cfg",
      "Checking Lassos.tla with Lassos.cfg",
      "Checking LivenessError.tla with LivenessError.cfg",
      "Checking NoNext.tla with NoNext.cfg",
      "Checking RebuildFailure.tla with RebuildFailure.cfg",
      "Checking SafetyProperty.tla with SafetyProperty.cfg",
      "Checking Success.tla with Success.cfg",
      "Checking Undefined.tla with Undefined.cfg",
      "Checking UnfingerprintedConcat.tla with UnfingerprintedConcat.cfg",
      "Checking UnfingerprintedEquality.tla with UnfingerprintedEquality.cfg",
      "Checking UnfingerprintedProduct.tla with UnfingerprintedProduct.cfg",
      "Checking UnfingerprintedState.tla with UnfingerprintedState.cfg",
      "Checking UnspecifiedFairness.tla with UnspecifiedFairness.cfg",
      "Checking UserFile.tla with UserFile.cfg",
      "Checking UserFileLong.tla with UserFileLong.cfg",
      "Checking UserFilePossible.tla with UserFilePossible.cfg",
      "Checking ViewLasso.tla with ViewLasso.cfg",
      "Checking Warned.tla with Warned.cfg",
    ]);
  });

  it("skips a module a glob matches when it has no configuration", () => {
    const result = runCliWith("tlc-spec", ["*.tla"]);
    expect(result.status).toBe(0);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking Inst.tla with Inst.cfg",
      "Checking Param.tla with Param.cfg",
      "Checking Rich.tla with Rich.cfg",
      "Checking Subst.tla with Subst.cfg",
      "Checking Unnamed.tla with Unnamed.cfg",
    ]);
  });

  it("checks the spec beside a configuration", () => {
    const [, , lines] = TLC_REPORTS.find((report) => report[0] === "Success") ?? [];
    const result = runCliWith("cli-output", ["Success.cfg"]);
    expect(result.status).toBe(0);
    expect(getSteadyLines(result.stdout)).toEqual([...(lines ?? []), ""]);
  });

  it("rejects -config with a glob of several specs", () => {
    const result = runCliWith("cli-output", ["Lasso*.tla", "-config", "Success.cfg"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      "Error: -config applies to one specification, but several were given.\n",
    );
  });

  it("rejects -config with several specs as TLC does", () => {
    const result = runCliWith("cli-output", ["Lasso.tla", "Success.tla", "-config", "Success.cfg"]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(
      "Error: more than one input files: Lasso and Success.tla\nUsage: java tlc2.TLC [-help] [-option] inputfile",
    );
  });
});

describe("the CLI prints messages for a program to read like TLC", () => {
  const runTool = (name: string, args: string[] = []) =>
    runCli("tool-output", name, [
      "-tool",
      "-workers",
      "1",
      "-fp",
      "0",
      "-lncheck",
      "final",
      ...args,
    ]);

  it("prints again what the spec prints as it rebuilds a safety trace", () => {
    const result = runTool("Steps");
    expect(result.status).toBe(12);
    const getStep = (count: number) => `<<"step", ${count}>>`;
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      "2190",
      getStep(0),
      getStep(1),
      "2110",
      "2121",
      "2217",
      getStep(0),
      "2217",
      getStep(1),
      "2217",
      getStep(0),
      getStep(1),
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("prints what the ALIAS prints right before each state, and again as TLC's Worker#doPostCondition evaluates it", () => {
    const result = runTool("AliasSteps");
    expect(result.status).toBe(12);
    const [getStep, getAlias] = ["step", "alias"].map(
      (name) => (count: number) => `<<"${name}", ${count}>>`,
    );
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      "2190",
      getStep(0),
      getStep(1),
      "2110",
      "2121",
      getAlias(0),
      "2217",
      getStep(0),
      getAlias(1),
      "2217",
      getStep(1),
      getAlias(2),
      "2217",
      getStep(0),
      getStep(1),
      getAlias(0),
      getAlias(1),
      getAlias(2),
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  const getView = (value: number, level: number) => `<<"view", ${value}, ${level}>>`;

  it("evaluates the VIEW as TLC fingerprints the states of a trace it prints and rebuilds, and seeds its random generator for them", () => {
    const result = runTool("ViewSteps");
    expect(result.status).toBe(11);
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      getView(0, 1),
      getView(1, 1),
      "2190",
      getView(1, 2),
      getView(2, 2),
      getView(3, 3),
      "2114",
      getView(0, 1),
      getView(1, 1),
      getView(2, 2),
      getView(1, 1),
      "2121",
      "2217",
      getView(2, 2),
      "2217",
      getView(3, 3),
      getView(3, 3),
      getView(3, 3),
      "2217",
      getView(2, 2),
      getView(0, 1),
      getView(1, 1),
      getView(2, 2),
      getView(1, 1),
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("evaluates the VIEW as TLC fingerprints an initial state it prints alone and rebuilds", () => {
    const result = runTool("ViewSteps", ["-config", "ViewInitial.cfg"]);
    expect(result.status).toBe(11);
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      getView(0, 1),
      getView(1, 1),
      "2190",
      getView(1, 2),
      "2114",
      "2121",
      getView(1, 1),
      "2217",
      getView(1, 1),
      getView(0, 1),
      getView(1, 1),
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("evaluates the VIEW only for the candidates as TLC rebuilds a lasso from the fingerprints the search stored", () => {
    const result = runTool("ViewLoop");
    expect(result.status).toBe(13);
    const sequence = getToolSequence(result.stdout);
    expect(sequence.slice(sequence.indexOf("2192"))).toEqual([
      "2192",
      getView(0, 1),
      getView(1, 2),
      getView(2, 3),
      getView(3, 4),
      "2116",
      "2264",
      "2217",
      "2217",
      "2217",
      "2217",
      getView(1, 5),
      "2122",
      "2267",
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("prints what the ALIAS prints right before each state of a simulated behavior, as TLC's Simulator evaluates it", () => {
    const result = runCli("tool-output", "AliasSteps", [
      "-tool",
      "-workers",
      "1",
      "-fp",
      "0",
      "-simulate",
      "num=1",
      "-depth",
      "6",
      "-seed",
      "4",
    ]);
    expect(result.status).toBe(12);
    const [getStep, getAlias] = ["step", "alias"].map(
      (name) => (count: number) => `<<"${name}", ${count}>>`,
    );
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2188",
      "2220",
      "2219",
      "2185",
      "2269",
      "2190",
      getStep(0),
      getStep(1),
      "2110",
      "2121",
      getAlias(0),
      "2217",
      getAlias(1),
      "2217",
      getAlias(2),
      "2217",
      "2209",
      "2210",
      getAlias(0),
      getAlias(1),
      getAlias(2),
      "2209",
      "2186",
    ]);
  });

  it("prints what the ALIAS prints as TLC's LiveWorker evaluates it on the loop of a counterexample", () => {
    const result = runTool("AliasLoop");
    expect(result.status).toBe(13);
    const [getStep, getAlias] = ["step", "alias"].map(
      (name) => (count: number) => `<<"${name}", ${count}>>`,
    );
    expect(getToolSequence(result.stdout).slice(24)).toEqual([
      "2200",
      "2192",
      getStep(0),
      getStep(1),
      getAlias(0),
      getAlias(1),
      getStep(2),
      getAlias(2),
      getAlias(3),
      "2116",
      "2264",
      "2217",
      "2217",
      "2217",
      "2217",
      getStep(3),
      "2122",
      "2267",
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("reports an invariant its replay of the initial states finds violated", () => {
    const result = runTool("Replayed");
    expect(result.status).toBe(255);
    expect(result.stdout).toContain(
      [
        "@!@!@STARTMSG 1000:1 @!@!@",
        "@!@!@STARTMSG 2184:0 @!@!@",
        "Attempted to apply Head to the empty sequence.",
        "@!@!@ENDMSG 2184 @!@!@",
        "@!@!@ENDMSG 1000 @!@!@",
        "@!@!@STARTMSG 2107:1 @!@!@",
        "Invariant Small is violated by the initial state:",
        "x = 1",
        "",
        "@!@!@ENDMSG 2107 @!@!@",
        "@!@!@STARTMSG 2200:0 @!@!@",
      ].join("\n"),
    );
  });

  it("reports the temporal properties it checks on the complete state graph", () => {
    const result = runTool("Loop");
    expect(result.status).toBe(13);
    const [getInit, getUp, getReset] = ["init", "up", "reset"].map(
      (name) => (count: number) => `<<"${name}", ${count}>>`,
    );
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2212",
      "2189",
      getInit(0),
      "2190",
      getUp(0),
      getUp(0),
      getUp(0),
      getUp(0),
      getUp(1),
      getUp(1),
      getUp(1),
      getUp(1),
      getReset(2),
      getReset(2),
      getReset(2),
      getReset(2),
      "2200",
      "2192",
      getInit(0),
      getUp(0),
      getUp(1),
      "2116",
      "2264",
      "2217",
      "2217",
      "2217",
      getReset(2),
      "2122",
      "2267",
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
    expect(result.stdout).toContain(
      "Implied-temporal checking--satisfiability problem has 1 branches.",
    );
    expect(result.stdout).toContain(
      "Checking temporal properties for the complete state space with 3 total distinct states",
    );
  });

  it("warns about a state-level property and names an invariant that a property asserts", () => {
    const result = runTool("Always");
    expect(result.status).toBe(12);
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2255",
      "2189",
      "2190",
      "2110",
      "2121",
      "2217",
      "2217",
      "2217",
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
    expect(result.stdout).toContain("The formula Small is a state-level formula");
    expect(result.stdout).toContain("Invariant Small is violated.");
  });

  it("fails on a warning -messagesAsErrors lists as the replay for the call stack raises it, as TLC's MP#printWarning does", () => {
    const result = runCli("tool-output", "PromotedWarning", [
      "-tool",
      "-workers",
      "1",
      "-messagesAsErrors",
      "2143",
    ]);
    expect(result.status).toBe(75);
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      "2102",
      "2143",
      "2103",
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
    expect(result.stdout).toContain("6. Line 5, column 26 to line 5, column 26 in PromotedWarning");
  });
});

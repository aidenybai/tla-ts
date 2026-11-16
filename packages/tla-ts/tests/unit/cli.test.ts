import { readFileSync, realpathSync } from "node:fs";
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

  it("checks liveness on the complete state graph with -lncheck final", () => {
    const [, code, lines] = TLC_REPORTS.find((report) => report[0] === "Lasso") ?? [];
    const result = runCli("cli-output", "Lasso", ["-lncheck", "final"]);
    expect(result.status).toBe(code);
    expect(getSteadyLines(result.stdout)).toEqual([...(lines ?? []), ""]);
  });

  it.each(["Continue", "DoInitFunctorInvariantContinue", "ContinueSuccessors", "ContinueAlias"])(
    "goes on past each violation in %s with -continue like TLC",
    (name) => {
      const result = runCli("tlc-continue", name, ["-continue"]);
      expect(result.status).toBe(12);
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
      /^Running breadth-first search Model-Checking with fp 0 and seed 7 with 2 workers on \d+ cores with \d+MB heap and 0MB offheap memory \[pid: \d+\] \(.+, Node\.js .+, MemFPSet, MemStateQueue\)\.$/,
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
});

describe("the CLI takes several specs and globs", () => {
  it("checks each spec a glob matches and exits with the first failure", () => {
    const result = runCliWith("cli-output", ["*.tla"]);
    expect(result.status).toBe(10);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking AssumptionFalse.tla with AssumptionFalse.cfg",
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
      "Checking SafetyProperty.tla with SafetyProperty.cfg",
      "Checking Success.tla with Success.cfg",
      "Checking Undefined.tla with Undefined.cfg",
      "Checking UnfingerprintedEquality.tla with UnfingerprintedEquality.cfg",
      "Checking UnfingerprintedState.tla with UnfingerprintedState.cfg",
      "Checking UnspecifiedFairness.tla with UnspecifiedFairness.cfg",
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
  const runTool = (name: string) =>
    runCli("tool-output", name, ["-tool", "-workers", "1", "-fp", "0", "-lncheck", "final"]);

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
});

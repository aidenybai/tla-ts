import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const runCliWith = (directory: string, args: string[]) =>
  spawnSync(
    process.execPath,
    ["--import", "tsx", join(import.meta.dirname, "../../src/cli.ts"), ...args],
    { cwd: join(FIXTURES, directory), encoding: "utf8" },
  );

const runCli = (directory: string, name: string, args: string[] = []) =>
  runCliWith(directory, [`${name}.tla`, ...args]);

const getCheckedSpecs = (output: string) =>
  output.split("\n").filter((line) => line.startsWith("Checking "));

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

// TLC's output for the same models, without the lines that report versions, progress and time.
const TLC_REPORTS = [
  [
    "AssumptionFalse",
    10,
    ["Error: Assumption line 4, col 20 to line 4, col 24 of module AssumptionFalse is false."],
  ],
  [
    "Success",
    0,
    [
      "Model checking completed. No error has been found.",
      "  Estimates of the probability that TLC did not check all reachable states",
      "  because two distinct states had the same fingerprint:",
      "  calculated (optimistic):  val = 1.3E-18",
      "10 states generated, 6 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
      "The average outdegree of the complete state graph is 1 (minimum is 0, the maximum 1 and the 95th percentile is 1).",
    ],
  ],
  ["InitialInvariant", 12, ["Error: Invariant Inv is violated by the initial state:", "x = 0", ""]],
  [
    "Lasso",
    13,
    [
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
      "3 states generated, 2 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 2.",
    ],
  ],
  [
    "Lassos",
    13,
    [
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
      "4 states generated, 3 distinct states found, 0 states left on queue.",
      "The depth of the complete state graph search is 3.",
    ],
  ],
  [
    "SafetyProperty",
    12,
    [
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
    ],
  ],
  [
    "FailedInvariant",
    76,
    [
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
    ],
  ],
  ["NoNext", 75, ["Error: No next state actions defined to generate successor states from."]],
  [
    "FailedAssert",
    14,
    [
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
    ],
  ],
  [
    "FailedInitialInvariant",
    75,
    [
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
    ],
  ],
  [
    "IllegalInitialState",
    255,
    [
      "Error: current state is not a legal state",
      "While working on the initial state:",
      "/\\ x = 1",
      "/\\ y = null",
      "",
    ],
  ],
] as const;

describe("the CLI reports results like TLC", () => {
  it.each(TLC_REPORTS)("reports %s", (name, code, lines) => {
    const result = runCli("cli-output", name);
    expect(result.status).toBe(code);
    expect(result.stdout.split("\n").slice(1)).toEqual([...lines, ""]);
  });

  it("checks liveness on the complete state graph with -lncheck final", () => {
    const [, code, lines] = TLC_REPORTS.find((report) => report[0] === "Lasso") ?? [];
    const result = runCli("cli-output", "Lasso", ["-lncheck", "final"]);
    expect(result.status).toBe(code);
    expect(result.stdout.split("\n").slice(1)).toEqual([...(lines ?? []), ""]);
  });

  it("rejects a spec whose file name differs from its module name like TLC", () => {
    const result = runCli("cli-module-name", "Renamed");
    expect(result.status).toBe(150);
    expect(result.stdout).toContain(
      [
        "Fatal errors while parsing TLA+ spec in file Renamed",
        "",
        "Unknown location",
        "",
        "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
        "*** Errors: 1",
        "",
        "Unknown location",
        "",
        "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
        "",
        "",
        "",
        "Error: Parsing or semantic analysis failed.",
      ].join("\n"),
    );
  });

  it("rejects -lncheck without a strategy like TLC", () => {
    const result = runCli("cli-output", "Lasso", ["-lncheck"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Error: expect a strategy such as final for -lncheck option.\n");
  });
});

describe("the CLI takes several specs and globs", () => {
  it("checks each spec a glob matches and exits with the first failure", () => {
    const result = runCliWith("cli-output", ["*.tla"]);
    expect(result.status).toBe(10);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking AssumptionFalse.tla with AssumptionFalse.cfg",
      "Checking FailedAssert.tla with FailedAssert.cfg",
      "Checking FailedInitialInvariant.tla with FailedInitialInvariant.cfg",
      "Checking FailedInvariant.tla with FailedInvariant.cfg",
      "Checking IllegalInitialState.tla with IllegalInitialState.cfg",
      "Checking InitialInvariant.tla with InitialInvariant.cfg",
      "Checking Lasso.tla with Lasso.cfg",
      "Checking Lassos.tla with Lassos.cfg",
      "Checking NoNext.tla with NoNext.cfg",
      "Checking SafetyProperty.tla with SafetyProperty.cfg",
      "Checking Success.tla with Success.cfg",
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
    const result = runCliWith("cli-output", ["Success.cfg"]);
    expect(result.status).toBe(0);
    expect(getCheckedSpecs(result.stdout)).toEqual(["Checking Success.tla with Success.cfg"]);
  });

  it("rejects -config with several specs", () => {
    const result = runCliWith("cli-output", ["Lasso.tla", "Success.tla", "-config", "Success.cfg"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      "Error: -config applies to one specification, but several were given.\n",
    );
  });
});

describe("prove prints obligations as tlapm -N does", () => {
  // Each .toolbox file is what tlapm -N writes to stderr for the same arguments.
  const readToolbox = (name: string) =>
    readFileSync(join(FIXTURES, "obligations", `${name}.toolbox`), "utf8");

  it("prints each obligation with its text", () => {
    const result = runCliWith("obligations", [
      "prove",
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Proofs.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readToolbox("Proofs"));
  });

  it("numbers omitted proofs but doesn't print them", () => {
    const result = runCliWith("obligations", ["prove", "-N", "--toolbox", "0", "0", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readToolbox("Omit"));
  });

  it("generates only the proofs within the lines", () => {
    const result = runCliWith("obligations", ["prove", "-N", "--toolbox", "6", "7", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readToolbox("Omit-6-7"));
  });

  it("warns when a module's name differs from its file's", () => {
    const result = runCliWith("obligations", [
      "prove",
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Renamed.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readToolbox("Renamed"));
  });

  it("reports the warnings tlapm reports", () => {
    const result = runCliWith("obligations", [
      "prove",
      "-N",
      "--toolbox",
      "0",
      "0",
      "--printallobs",
      "Warnings.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe(readToolbox("Warnings"));
  });

  // Each .strict file is what tlapm -N --strict writes to stderr.
  it("reports incomplete proofs under --strict", () => {
    const result = runCliWith("obligations", ["prove", "-N", "--strict", "Incomplete.tla"]);
    expect(result.status).toBe(11);
    expect(result.stderr).toBe(
      readFileSync(join(FIXTURES, "obligations", "Incomplete.strict"), "utf8"),
    );
  });

  it("reports a target without obligations under --strict", () => {
    const result = runCliWith("obligations", [
      "prove",
      "-N",
      "--strict",
      "--line",
      "2",
      "Proofs.tla",
    ]);
    expect(result.status).toBe(12);
    expect(result.stderr).toBe(
      readFileSync(join(FIXTURES, "obligations", "Proofs-2.strict"), "utf8"),
    );
  });

  // Notes.stdout and Notes.stderr are what tlapm -N writes.
  it("prints the notes tlapm prints outside toolbox mode", () => {
    const result = runCliWith("obligations", ["prove", "-N", "Notes.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readFileSync(join(FIXTURES, "obligations", "Notes.stdout"), "utf8"));
    expect(result.stderr).toBe(readFileSync(join(FIXTURES, "obligations", "Notes.stderr"), "utf8"));
  });

  it("prints tlapm's header in toolbox mode", () => {
    const result = runCliWith("obligations", ["prove", "-N", "--line", "3", "Omit.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(
      /^\n\\\* TLAPM version 5f5037f\n\\\* launched at \d{4}-\d\d-\d\d \d\d:\d\d:\d\d with command line:\n\\\* tla-ts prove -N --line 3 Omit\.tla\n\n$/,
    );
  });

  it("prints nothing outside toolbox mode", () => {
    const result = runCliWith("obligations", ["prove", "-N", "Proofs.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout + result.stderr).toBe("");
  });

  it("explains that proving needs tlapm when it isn't on the PATH", () => {
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", join(import.meta.dirname, "../../src/cli.ts"), "prove", "Proofs.tla"],
      {
        cwd: join(FIXTURES, "obligations"),
        encoding: "utf8",
        env: { PATH: dirname(process.execPath) },
      },
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      "Error: tla-ts prove runs tlapm to prove obligations, but tlapm isn't on your PATH. Install tlapm, or pass -N to only generate the obligations.\n",
    );
  });

  const tlapm = (process.env.PATH ?? "")
    .split(delimiter)
    .map((directory) => join(directory, "tlapm"))
    .find((path) => spawnSync(path, ["--version"]).status === 0);

  it.skipIf(tlapm === undefined)("runs tlapm without -N", () => {
    const result = runCliWith("obligations", ["prove", "--version"]);
    const expected = spawnSync(tlapm ?? "", ["--version"], { encoding: "utf8" });
    expect(result.status).toBe(expected.status);
    expect(result.stdout).toBe(expected.stdout);
  });

  it("rejects the tlapm options it doesn't support", () => {
    const result = runCliWith("obligations", ["prove", "-N", "-C", "Proofs.tla"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe("Error: tla-ts prove does not support the tlapm option -C.\n");
  });

  // Each .summary file is what tlapm --summary writes to stdout.
  it("summarizes the missing and omitted proofs of each theorem", () => {
    const result = runCliWith("obligations", ["prove", "--summary", "Incomplete.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(
      readFileSync(join(FIXTURES, "obligations", "Incomplete.summary"), "utf8"),
    );
    expect(result.stderr).toBe("");
  });

  // Each .stderr file is what tlapm -N writes to stderr, without the OCaml backtrace.
  it.each([
    "Declaration",
    "Hide",
    "Label",
    "NotFound",
    "Recursive",
    "Tab",
    "Unexpected",
    "UnknownModule",
  ])("prints the error tlapm prints for %s", (name) => {
    const result = runCliWith("obligation-errors", ["prove", "-N", `${name}.tla`]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      readFileSync(join(FIXTURES, "obligation-errors", `${name}.stderr`), "utf8"),
    );
  });

  it("names a module it cannot find", () => {
    const result = runCliWith("obligations", ["prove", "-N", "Missing.tla"]);
    expect(result.status).toBe(3);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe(
      'File "<unknown>":\nError: File "Missing.tla" not found\n tlapm ending abnormally with Failure("Module.Parser.parse_file")\n\n',
    );
  });
});

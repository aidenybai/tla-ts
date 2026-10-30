import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
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

// The lines in which TLC reports its version and runtime, and the files SANY parses.
const STARTUP_LINE =
  /^(TLC2 Version |Running breadth-first search |Parsing file |Semantic processing of module |Linting of module )/;

// TLC's output for the same models without -tool, with the time it ran and the dates it printed as _,
// and without its startup lines.
const getSteadyLines = (output: string) =>
  output
    .replace(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d/g, "_")
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
] as const;

describe("the CLI reports results like TLC", () => {
  it.each(TLC_REPORTS)("reports %s", (name, code, lines) => {
    const result = runCli("cli-output", name);
    expect(result.status).toBe(code);
    expect(getSteadyLines(result.stdout)).toEqual([...lines, ""]);
  });

  it("checks liveness on the complete state graph with -lncheck final", () => {
    const [, code, lines] = TLC_REPORTS.find((report) => report[0] === "Lasso") ?? [];
    const result = runCli("cli-output", "Lasso", ["-lncheck", "final"]);
    expect(result.status).toBe(code);
    expect(getSteadyLines(result.stdout)).toEqual([...(lines ?? []), ""]);
  });

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
    expect(lines[3]).toMatch(
      new RegExp(
        `^Parsing file ${realpathSync("/tmp")}/tlc-\\d+/Naturals\\.tla \\(jar:file:/lib/tla2tools\\.jar!/tla2sany/StandardModules/Naturals\\.tla\\)$`,
      ),
    );
    expect(lines.slice(4, 7)).toEqual([
      "Semantic processing of module Naturals",
      "Semantic processing of module Success",
      "Linting of module Success",
    ]);
    // TLC names its copies of the standard modules at random, and tla-ts the same way each run.
    expect(runCliWith("cli-output", args).stdout.split("\n")[3]).toBe(lines[3]);
  });
});

// What SANY's XMLExporter prints to standard error for the same modules, and its exit code.
const XML_EXPORT_FAILURES = [
  [
    "Renamed.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file Renamed.tla",
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
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "Twice.tla",
    2,
    [
      "Semantic errors:",
      "",
      "*** Errors: 1",
      "",
      "line 3, col 1 to line 3, col 7 of module Twice",
      "",
      "Operator Op already defined or declared.",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "LevelError.tla",
    2,
    [
      "Semantic errors:",
      "",
      "*** Errors: 1",
      "",
      "line 8, col 8 to line 8, col 16 of module LevelError",
      "",
      "Level error in applying operator I!Foo:",
      "The level of argument 1 exceeds the maximum level allowed by the operator.",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
  [
    "DefineStep.tla",
    1,
    [
      'Exception in thread "main" java.lang.IllegalArgumentException: unsupported kind: 37 in xml export',
    ],
  ],
  [
    "FormFeed.tla",
    7,
    [
      "ERROR: The spec contains the character U+000C in the StringValue element. XML 1.0 cannot represent that character in character data, not even as a numeric character reference, so the spec cannot be exported until the character is removed from it.",
    ],
  ],
  [
    "nested/Root.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file nested/Root.tla",
      "",
      "In module Root",
      "",
      "Cannot find source file for module Sibling imported in module Root.",
      "*** Errors: 1",
      "",
      "In module Root",
      "",
      "Cannot find source file for module Sibling imported in module Root.",
      "",
      "",
      "",
      "ERROR: Failed to parse module.",
    ],
  ],
] as const;

const exportXml = (args: string[]) =>
  runCliWith("xml-export", ["tla2sany.xml.XMLExporter", "-o", ...args]);

describe("the CLI exports XML like SANY's XMLExporter", () => {
  it.each(XML_EXPORT_FAILURES)("fails on %s", (file, code, lines) => {
    const result = exportXml([file]);
    expect(result.status).toBe(code);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe([...lines, ""].join("\n"));
  });

  it("finds the root module and the modules it extends in the -I directories", () => {
    const result = exportXml(["-I", "nested", "Root"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("<RootModule>Root</RootModule>");
  });

  it("names the file of a root module it cannot find and where it looked", () => {
    const directory = join(FIXTURES, "xml-export");
    const result = exportXml(["-I", "nested", "Missing"]);
    expect(result.status).toBe(2);
    expect(result.stderr.split("\n").slice(0, 7)).toEqual([
      `File does not exist: ${directory}/./Missing.tla while looking in these directories: ${directory}, nested, classpath:/tla2sany/StandardModules, classpath:/`,
      "",
      "Fatal errors while parsing TLA+ spec in file Missing",
      "",
      "Unknown location",
      "",
      "Cannot find source file for module Missing",
    ]);
  });
});

describe("the CLI takes several specs and globs", () => {
  it("checks each spec a glob matches and exits with the first failure", () => {
    const result = runCliWith("cli-output", ["*.tla"]);
    expect(result.status).toBe(10);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking AssumptionFalse.tla with AssumptionFalse.cfg",
      "Checking FailedInvariant.tla with FailedInvariant.cfg",
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
    const [, , lines] = TLC_REPORTS.find((report) => report[0] === "Success") ?? [];
    const result = runCliWith("cli-output", ["Success.cfg"]);
    expect(result.status).toBe(0);
    expect(getSteadyLines(result.stdout)).toEqual([...(lines ?? []), ""]);
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

// The message codes and the lines that Print writes, in the order TLC 1.8.0 prints them with -tool.
const getToolSequence = (output: string) =>
  output
    .split("\n")
    .filter((line) => line.startsWith("@!@!@STARTMSG") || line.startsWith("<<"))
    .map((line) => line.match(/^@!@!@STARTMSG (\d+):/)?.[1] ?? line);

describe("the CLI prints messages for a program to read like TLC", () => {
  const runTool = (name: string) =>
    runCli("tool-output", name, ["-tool", "-workers", "1", "-fp", "0", "-lncheck", "final"]);

  it("prints again what the spec prints as it rebuilds a safety trace", () => {
    const result = runTool("Steps");
    expect(result.status).toBe(12);
    const step = (n: number) => `<<"step", ${n}>>`;
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2189",
      "2190",
      step(0),
      step(1),
      "2110",
      "2121",
      "2217",
      step(0),
      "2217",
      step(1),
      "2217",
      step(0),
      step(1),
      "2200",
      "2199",
      "2194",
      "2186",
    ]);
  });

  it("reports the temporal properties it checks on the complete state graph", () => {
    const result = runTool("Loop");
    expect(result.status).toBe(13);
    const [init, up, reset] = ["init", "up", "reset"].map(
      (name) => (n: number) => `<<"${name}", ${n}>>`,
    );
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
      "2212",
      "2189",
      init(0),
      "2190",
      up(0),
      up(0),
      up(0),
      up(0),
      up(1),
      up(1),
      up(1),
      up(1),
      reset(2),
      reset(2),
      reset(2),
      reset(2),
      "2200",
      "2192",
      init(0),
      up(0),
      up(1),
      "2116",
      "2264",
      "2217",
      "2217",
      "2217",
      reset(2),
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

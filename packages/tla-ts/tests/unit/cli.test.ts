import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
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
    // TLC's trace exploration spec adds _TLCTrace to the modules the spec extends.
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
    // TLC names its copies of the standard modules at random, and tla-ts the same way each run.
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
    "Nesting.tla",
    2,
    [
      "",
      "Fatal errors while parsing TLA+ spec in file Nesting.tla",
      "",
      "In module Inner",
      "",
      "Cannot find source file for module Absent imported in module Inner.",
      "*** Errors: 1",
      "",
      "In module Inner",
      "",
      "Cannot find source file for module Absent imported in module Inner.",
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

  // Numbered.xml is what XMLExporter writes for Numbered.tla, which has a node of each kind SANY
  // numbers out of the order of the spec's text.
  it("writes the XML that XMLExporter writes, with SANY's UIDs in the order of its HashMap", () => {
    const result = exportXml(["Numbered.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readFileSync(join(FIXTURES, "xml-export", "Numbered.xml"), "utf8"));
  });

  // Commented.xml is what XMLExporter writes for Commented.tla with -t, -r and -u: on one line,
  // without what Commented has from Counted, and with the pre-comments out of their boxes.
  it("writes the XML of the root module alone, unboxed and on one line, as XMLExporter does", () => {
    const result = exportXml(["-t", "-r", "-u", "Commented.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(readFileSync(join(FIXTURES, "xml-export", "Commented.xml"), "utf8"));
  });

  it("prints its usage for -help, and with an error for an argument it does not know", () => {
    const help = exportXml(["-help"]);
    expect(help.status).toBe(0);
    expect(help.stdout.split("\n").slice(0, 4)).toEqual([
      "",
      "\x1b[1mNAME\x1b[0m",
      "",
      "\ttla2sany.xml.XMLExporter - Emit SANY's parse tree as XML - Version 2.2 created 08 July 2020",
    ]);
    const unknown = exportXml(["-x", "Commented.tla"]);
    expect(unknown.status).toBe(1);
    expect(unknown.stderr).toBe(`ERROR: Only one TLA file to check allowed!\n${help.stdout}`);
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

// tla2tools-1.7.4.jar holds only the manifest of TLC 1.7.4's jar, which is all tla-ts reads of it.
const JAR_174 = join(FIXTURES, "xml-export", "tla2tools-1.7.4.jar");

const exportXml174 = (args: string[]) =>
  runCliWith("xml-export", ["-cp", JAR_174, "tla2sany.xml.XMLExporter", ...args]);

const getXmlExporterException = (exception: string, line: number) =>
  `Exception in thread "main" ${exception}\n\tat tla2sany.xml.XMLExporter.main(XMLExporter.java:${line})\n`;

// The expected output is what XMLExporter prints with TLC 1.7.4's tla2tools.jar.
describe("the CLI exports XML like TLC 1.7.4's XMLExporter when its jar is on the class path", () => {
  const standardModules = `jar:file:${pathToFileURL(JAR_174).pathname}!/tla2sany/StandardModules/`;

  it("writes the XML on one line, after the modules SANY analyzes", () => {
    const result = exportXml174(["-o", "Counted.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(
      readFileSync(join(FIXTURES, "xml-export", "Counted.1.7.4.xml"), "utf8"),
    );
    expect(result.stderr).toBe(
      "Semantic processing of module Naturals\nSemantic processing of module Counted\n",
    );
  });

  it("writes the XML of a specification SANY finds errors in", () => {
    const result = exportXml174(["-o", "Twice.tla"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("<RootModule>Twice</RootModule>");
    expect(result.stderr).toMatch(/^Semantic processing of module Twice\nSemantic errors:\n/);
  });

  it.each([
    [[], "at least one .tla file must be given", 59],
    [["-t", "Counted.tla"], "Only one TLA file to check allowed!", 83],
  ])("throws on the arguments %j", (args, message, line) => {
    const result = exportXml174(args);
    expect(result.status).toBe(1);
    expect(result.stderr).toBe(
      getXmlExporterException(`java.lang.IllegalArgumentException: ${message}`, line),
    );
  });

  it("names the last file it looked for of a module it cannot find", () => {
    const directory = join(FIXTURES, "xml-export");
    expect(exportXml174(["Missing.tla"])).toMatchObject({
      status: 0,
      stdout: "",
      stderr: `File does not exist: /Missing.tla while looking in these directories: /, ${standardModules}\n`,
    });
    expect(exportXml174(["-I", "nested", "Missing.tla"]).stderr).toBe(
      `File does not exist: ${directory}/nested/Missing.tla while looking in these directories: nested/, ${standardModules}\n`,
    );
  });

  it("throws for a specification SANY aborts on, which it names once it parses the root module", () => {
    const renamed = exportXml174(["-o", "Renamed.tla"]);
    expect(renamed.status).toBe(1);
    expect(renamed.stderr).toBe(
      [
        "",
        "Fatal errors while parsing TLA+ spec in file Renamed.tla",
        "",
        "tla2sany.semantic.AbortException",
        "*** Abort messages: 1",
        "",
        "Unknown location",
        "",
        "File name 'Renamed' does not match the name 'Other' of the top level module it contains.",
        "",
        "",
        getXmlExporterException(
          "tla2sany.xml.XMLExportingException: spec Other is malformed - does not have a root module",
          110,
        ),
      ].join("\n"),
    );
    // Numbered has a string that TLC 1.7.4's lexer cannot read.
    expect(exportXml174(["-o", "Numbered.tla"]).stderr).toContain(
      "spec null is malformed - does not have a root module",
    );
  });
});

describe("the CLI checks a spec like TLC 1.7.4 when its jar is on the class path", () => {
  const check174 = (name: string) =>
    runCliWith("tlc-174", [
      "-cp",
      JAR_174,
      "tlc2.TLC",
      "-tool",
      "-workers",
      "1",
      "-fp",
      "0",
      "-lncheck",
      "final",
      `${name}.tla`,
    ]);

  it("reports the depth and outdegree after an invariant violation, labels actions without their parameters, and doesn't warn about a constant invariant", () => {
    const result = check174("Climb");
    expect(result.status).toBe(12);
    expect(getToolSequence(result.stdout)).toEqual([
      "2262",
      "2187",
      "2220",
      "2219",
      "2185",
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
      "2268",
      "2186",
    ]);
    expect(result.stdout).toContain(
      "2: <Step line 5, col 12 to line 5, col 21 of module Climb>\nx = 1\n",
    );
  });

  it("reports a temporal violation without naming the properties or the depth", () => {
    const result = check174("Cycle");
    expect(result.status).toBe(13);
    expect(result.stdout).toContain(
      "@!@!@STARTMSG 2116:1 @!@!@\nTemporal properties were violated.\n\n@!@!@ENDMSG 2116 @!@!@",
    );
    expect(getToolSequence(result.stdout).slice(-4)).toEqual(["2267", "2200", "2199", "2186"]);
  });

  it("prints what rebuilding a counterexample prints after its heading, the prefix at once and the cycle state by state", () => {
    const result = check174("CyclePrint");
    expect(result.status).toBe(13);
    const states = [0, 1, 2, 3].map(
      (value) =>
        `@!@!@STARTMSG 2217:4 @!@!@\n${value === 0 ? "1: <Initial predicate>" : `${value + 1}: <Next line 5, col 9 to line 5, col 63 of module CyclePrint>`}\nx = ${value}\n\n@!@!@ENDMSG 2217 @!@!@\n`,
    );
    expect(result.stdout).toContain(
      [
        "@!@!@STARTMSG 2264:1 @!@!@\nThe following behavior constitutes a counter-example:\n\n@!@!@ENDMSG 2264 @!@!@\n",
        '"init"\n<<"n", 0>>\n<<"n", 1>>\n',
        states[0],
        states[1],
        states[2],
        '<<"n", 2>>\n',
        states[3],
        '<<"n", 3>>\n',
        "@!@!@STARTMSG 2122:4 @!@!@\n3: Back to state",
      ].join(""),
    );
  });

  it("prints the sources of the values it fails to fingerprint rather than the call stack", () => {
    const result = check174("Unfingerprinted");
    expect(result.status).toBe(75);
    expect(result.stdout).toContain(
      "Fingerprint Stack Trace:\n0) line 8, col 18 to line 8, col 30 of module Unfingerprinted\n\nReason:\n",
    );
  });

  it("reports an error in building the liveness checker as an unexpected EvalException", () => {
    const result = check174("Undiameter");
    expect(result.status).toBe(255);
    expect(result.stdout).toContain(
      [
        "@!@!@STARTMSG 1000:1 @!@!@",
        "TLC threw an unexpected exception.",
        "This was probably caused by an error in the spec or model.",
        "See the User Output or TLC Console for clues to what happened.",
        "The exception was a tlc2.tool.EvalException",
        ": @!@!@STARTMSG 2145:0 @!@!@",
        "TLCGet(diameter) was undefined.",
        "@!@!@ENDMSG 2145 @!@!@",
        "@!@!@ENDMSG 1000 @!@!@",
      ].join("\n"),
    );
  });

  it("marks the message of a temporal formula it can't handle inside another", () => {
    const result = check174("Unhandled");
    expect(result.status).toBe(255);
    expect(result.stdout).toContain(
      [
        "@!@!@STARTMSG 2213:1 @!@!@",
        "TLC cannot handle the temporal formula line 7, col 9 to line 7, col 51 of module Unhandled:",
        "@!@!@STARTMSG 2213:0 @!@!@",
        "TLC cannot handle the temporal formula line 7, col 25 to line 7, col 51 of module Unhandled:",
        "Attempted to check if the value:",
        "2",
        "is an element of the integer 1",
        "@!@!@ENDMSG 2213 @!@!@",
        "@!@!@ENDMSG 2213 @!@!@",
      ].join("\n"),
    );
  });

  it("reports an error in the config as an unexpected exception", () => {
    const result = check174("Aliased");
    expect(result.status).toBe(255);
    expect(result.stdout).toContain(
      [
        "@!@!@STARTMSG 1000:1 @!@!@",
        "TLC threw an unexpected exception.",
        "This was probably caused by an error in the spec or model.",
        "See the User Output or TLC Console for clues to what happened.",
        "The exception was a tlc2.tool.ConfigFileException",
        ": @!@!@STARTMSG 5006:0 @!@!@",
        "TLC found an error in the configuration file at line 3",
        "It was expecting a keyword, but did not find it.",
        "@!@!@ENDMSG 5006 @!@!@",
      ].join("\n"),
    );
  });

  it("warns about the constraints of a liveness check and reports a depth of at least 1", () => {
    const bounded = check174("Bounded");
    expect(bounded.status).toBe(0);
    expect(getToolSequence(bounded.stdout).slice(4, 7)).toEqual(["2185", "2284", "2212"]);
    const unbounded = check174("Unbounded");
    expect(unbounded.status).toBe(0);
    expect(getToolSequence(unbounded.stdout).slice(4, 6)).toEqual(["2185", "2212"]);
    const empty = check174("Empty");
    expect(empty.status).toBe(0);
    expect(empty.stdout).toContain("The depth of the complete state graph search is 1.");
  });

  it("names the file it looked for a module in that it can't find", () => {
    const result = check174("Lost");
    expect(result.status).toBe(150);
    expect(result.stderr).toBe(
      `File does not exist: ${join(FIXTURES, "tlc-174", "Gone.tla")} while looking in these directories: jar:file:${pathToFileURL(JAR_174).pathname}!/tla2sany/StandardModules/\n`,
    );
    expect(result.stdout).toContain(
      "Unknown location\n\nCannot find source file for module Gone imported in module Lost.\n",
    );
  });
});

describe("the CLI takes several specs and globs", () => {
  it("checks each spec a glob matches and exits with the first failure", () => {
    const result = runCliWith("cli-output", ["*.tla"]);
    expect(result.status).toBe(10);
    expect(getCheckedSpecs(result.stdout)).toEqual([
      "Checking AssumptionFalse.tla with AssumptionFalse.cfg",
      "Checking EventualAction.tla with EventualAction.cfg",
      "Checking FailedInvariant.tla with FailedInvariant.cfg",
      "Checking InitialInvariant.tla with InitialInvariant.cfg",
      "Checking Lasso.tla with Lasso.cfg",
      "Checking Lassos.tla with Lassos.cfg",
      "Checking NoNext.tla with NoNext.cfg",
      "Checking SafetyProperty.tla with SafetyProperty.cfg",
      "Checking Success.tla with Success.cfg",
      "Checking ViewLasso.tla with ViewLasso.cfg",
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
    const step = (count: number) => `<<"step", ${count}>>`;
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
    const [init, up, reset] = ["init", "up", "reset"].map(
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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { FIXTURES } from "./check-harness";
import { getToolSequence, JAR_174, runCliWith } from "./cli-harness";

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

describe("the CLI reproduces the TLC that -Dtla-ts.tlc names without a jar", () => {
  const tlcArgs = ["tlc2.TLC", "-tool", "-workers", "1", "-fp", "0"];

  it.each(["Climb", "Cycle", "Aliased"])(
    "checks %s like TLC 1.7.4 with its jar on the class path",
    (name) => {
      const withJar = runCliWith("tlc-174", ["-cp", JAR_174, ...tlcArgs, `${name}.tla`]);
      const withProperty = runCliWith("tlc-174", ["-Dtla-ts.tlc=1.7.4", ...tlcArgs, `${name}.tla`]);
      expect(withProperty.status).toBe(withJar.status);
      expect(getToolSequence(withProperty.stdout)).toEqual(getToolSequence(withJar.stdout));
    },
  );

  it("leaves the jar out of the directories it looked for a missing module in", () => {
    const result = runCliWith("tlc-174", ["-Dtla-ts.tlc=1.7.4", ...tlcArgs, "Lost.tla"]);
    expect(result.status).toBe(150);
    expect(result.stderr).toBe(
      `File does not exist: ${join(FIXTURES, "tlc-174", "Gone.tla")} while looking in these directories: \n`,
    );
  });

  it("exports XML like TLC 1.7.4's XMLExporter", () => {
    const result = runCliWith("xml-export", [
      "-Dtla-ts.tlc=1.7.4",
      "tla2sany.xml.XMLExporter",
      "-o",
      "Counted.tla",
    ]);
    expect(result.status).toBe(0);
    expect(result.stdout).toBe(
      readFileSync(join(FIXTURES, "xml-export", "Counted.1.7.4.xml"), "utf8"),
    );
  });

  it("takes the TLC it names over that of the jar", () => {
    const run = (args: string[]) => runCliWith("tlc-174", [...args, ...tlcArgs, "Cycle.tla"]);
    const master = run(["-cp", JAR_174, "-Dtla-ts.tlc=master"]);
    expect(getToolSequence(master.stdout)).toEqual(getToolSequence(run([]).stdout));
    expect(getToolSequence(master.stdout)).not.toEqual(
      getToolSequence(run(["-cp", JAR_174]).stdout),
    );
  });
});

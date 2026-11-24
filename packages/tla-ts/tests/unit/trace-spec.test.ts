import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { checkDepthFirst } from "../../src/dfid";
import { simulate } from "../../src/simulate";
import { formatState } from "../../src/values";

const DIRECTORY = join(import.meta.dirname, "../fixtures/trace-spec");

const readFixture = (name: string) => readFileSync(join(DIRECTORY, name), "utf8");

const stripDate = (text: string | undefined) => text?.replace(/\\\* Generated on .*$/, "");

const RECORD_VALUE = 4;

const checkFixture = async (name: string, module: string, traceFile?: string) => {
  const written = new Map<string, string | Uint8Array>();
  const result = await check({
    source: readFixture(`${name}.tla`),
    config: readFixture(`${name}.cfg`),
    onPrint: () => {},
    writeFile: (path, content) => written.set(path, content),
    traceSpec: { module, traceFile },
  });
  return { ...result, written };
};

const simulateFixture = (name: string, module: string, traceDepth: number, isDiffTrace = false) => {
  const traceSpecs: string[] = [];
  simulate({
    source: readFixture(`${name}.tla`),
    config: readFixture(`${name}.cfg`),
    onPrint: () => {},
    traceSpec: { module },
    traceDepth,
    traceCount: undefined,
    aril: 0n,
    isGenerating: false,
    scheduler: "random",
    isDiffTrace,
    onSimulation: (output) => {
      if (output.kind === "trace-spec") traceSpecs.push(output.text);
    },
  });
  return traceSpecs.map(stripDate);
};

const searchDepthFirst = (source: string, config: string, module: string) => {
  const traceSpecs: string[] = [];
  checkDepthFirst({
    source,
    config,
    maxDepth: 5,
    onPrint: () => {},
    traceSpec: { module },
    onOutput: (output) => {
      if (output.kind === "trace-spec") traceSpecs.push(output.text);
    },
  });
  return traceSpecs.map(stripDate);
};

describe("trace exploration spec", () => {
  it.each([
    ["Safety", "te_out"],
    ["Stuttering", "te"],
    ["Live", "te"],
  ])("writes the spec TLC writes for %s", async (name, module) => {
    const result = await checkFixture(name, module);
    expect(stripDate(result.traceSpec)).toBe(stripDate(readFixture(`${name}_TTrace.tla`)));
  });

  it("prints and writes a trace whose last state nests 6,000 tuples", async () => {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLES x, y\nInit == x = 0 /\\ y = 0\nNext == y' = y + 1 /\\ x' = ${"<< ".repeat(100)}x${" >>".repeat(100)}\nInv == y < 60\n====\n`,
      config: "INIT Init\nNEXT Next\nINVARIANT Inv\n",
      traceSpec: { module: "M_TTrace" },
    });
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.trace.map((step) => formatState(step.state))).toEqual(
      Array.from(
        { length: 61 },
        (_value, index) =>
          `/\\ x = ${"<< ".repeat(100 * index)}0${" >>".repeat(100 * index)}\n/\\ y = ${index}\n`,
      ),
    );
    expect(result.traceSpec?.split("\n").find((line) => line.endsWith(",y |-> 60])"))).toBe(
      `    ([x |-> ${"<<".repeat(6000)}0${">>".repeat(6000)},y |-> 60])`,
    );
  });

  it("records the trace in TLC's binary format through _TLCTrace", async () => {
    const result = await checkFixture("Safety", "te_out", "te_out.bin");
    const binary = result.written.get("te_out.bin");
    expect(binary instanceof Uint8Array && gunzipSync(binary)[0]).toBe(RECORD_VALUE);
  });

  it("lists a model value the configuration assigns once in the trace spec's configuration, where TLC repeats it", async () => {
    const result = await check({
      source:
        "---- MODULE M ----\nCONSTANTS P, a\nVARIABLE x\nInit == x = a\nNext == x' \\in P\nInv == x = a\n====\n",
      config: "CONSTANTS\n  P = {p1, p2}\n  a = a\nINIT Init\nNEXT Next\nINVARIANT Inv\n",
      traceSpec: { module: "M_TTrace" },
    });
    expect(result.traceSpec).toContain(
      "CONSTANTS\n    P = { p1 , p2 }\n    a = a\n    p1 = p1\n    p2 = p2\n\n",
    );
  });

  it.each([
    [
      0,
      "Servers, Values",
      "Servers = {n1, n2, n3}\n    Values = {v}",
      "    Servers = { n1 , n2 , n3 }\n    Values = { v }\n    n3 = n3\n    v = v\n    n1 = n1\n    n2 = n2\n",
    ],
    [
      0,
      "P, a",
      "P = {p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13}\n    a = a",
      "    P = { p1 , p2 , p3 , p4 , p5 , p6 , p7 , p8 , p9 , p10 , p11 , p12 , p13 }\n    a = a\n    p8 = p8\n    p3 = p3\n    p4 = p4\n    p5 = p5\n    p9 = p9\n    p2 = p2\n    p12 = p12\n    p7 = p7\n    p11 = p11\n    p10 = p10\n    p1 = p1\n    p13 = p13\n    p6 = p6\n",
    ],
    [
      7,
      "P, a",
      "P = {p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13}\n    a = a",
      "    P = { p1 , p2 , p3 , p4 , p5 , p6 , p7 , p8 , p9 , p10 , p11 , p12 , p13 }\n    a = a\n    p3 = p3\n    p5 = p5\n    p6 = p6\n    p4 = p4\n    p7 = p7\n    p1 = p1\n    p2 = p2\n    p8 = p8\n    p11 = p11\n    p13 = p13\n    p12 = p12\n    p9 = p9\n    p10 = p10\n",
    ],
  ])(
    "lists the model values in TLC's HashSet order under -fp %i for constants %s",
    async (fingerprintPolynomial, constants, assignments, listed) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nCONSTANTS ${constants}\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == x < 1\n====\n`,
        config: `CONSTANTS\n    ${assignments}\nINIT Init\nNEXT Next\nINVARIANT Inv\n`,
        fingerprintPolynomial,
        traceSpec: { module: "M_TTrace" },
      });
      expect(result.traceSpec).toContain(`\nCONSTANTS\n${listed}\n`);
    },
  );

  it.each([
    ["Missionaries = {m1, m2}\n  Cannibals = {c1, c2}", "", "m1, m2, c1, c2"],
    [
      "Missionaries = {m1, m2}\n  F(q2) = q1\n  Cannibals = {c1, c2}",
      ", F(_)",
      "m1, m2, q2, q1, c1, c2",
    ],
  ])(
    "declares the model values of %j in the order the configuration names them, as TLC numbers them",
    async (constants, operator, declared) => {
      const result = await check({
        source: `---- MODULE M ----\nCONSTANTS Missionaries, Cannibals${operator}\nVARIABLE x\nInit == x \\in Missionaries\nNext == x' \\in Cannibals\nInv == x \\in Missionaries\n====\n`,
        config: `CONSTANTS\n  ${constants}\nINIT Init\nNEXT Next\nINVARIANT Inv\n`,
        traceSpec: { module: "M_TTrace" },
      });
      expect(result.traceSpec).toContain(`\nCONSTANTS ${declared}\n`);
    },
  );

  const checkModelValue = (header: string, value: string) =>
    check({
      source: `---- MODULE M ----\n${header}CONSTANT C\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == x < 2\n====\n`,
      config: `CONSTANT C = ${value}\nINIT Init\nNEXT Next\nINVARIANT Inv\n`,
      loadModule: (name) => (name === "N" ? "---- MODULE N ----\nFoo == 1\n====\n" : undefined),
      writeFile: () => {},
      traceSpec: { module: "M_TTrace", traceFile: "M_TTrace.bin" },
    });

  it.each([
    ["m", "nothing defines it", "EXTENDS Naturals\n"],
    ["ToJson", "no module loads Json", "EXTENDS Naturals\n"],
    ["Foo", "only an instance's J!Foo defines it", "EXTENDS Naturals\nJ == INSTANCE N\n"],
  ])(
    "declares the model value %s where %s, as TLC finds no definition of that name",
    async (value, _description, header) => {
      expect((await checkModelValue(header, value)).traceSpec).toContain(`\nCONSTANTS ${value}\n`);
    },
  );

  it.each([
    ["Len", "the root extends Sequences", "EXTENDS Naturals, Sequences\n"],
    ["Len", "a named instance loads Sequences", "EXTENDS Naturals\nI == INSTANCE Sequences\n"],
    ["Len", "only _TLCTrace loads Sequences", "EXTENDS Naturals\n"],
    ["Trace", "only _TLCTrace loads TLCExt", "EXTENDS Naturals\n"],
    ["Cardinality", "only _TLCTrace loads FiniteSets", "EXTENDS Naturals\n"],
  ])(
    "declares no model value %s where %s, as TLC finds a definition of that name",
    async (value, _description, header) => {
      expect((await checkModelValue(header, value)).traceSpec).not.toContain("_TEConstants");
    },
  );

  it("writes no binary trace without a file for it", async () => {
    const result = await checkFixture("Safety", "te_out");
    expect(result.written.size).toBe(0);
    expect(result.traceSpec).toBeDefined();
  });

  it.each([
    ["Safety", "te_out"],
    ["Stuttering", "te"],
    ["Live", "te"],
  ])("writes the spec TLC writes for %s under -simulate", (name, module) => {
    expect(simulateFixture(name, module, 10)).toEqual([
      stripDate(readFixture(`${name}_TTrace.tla`)),
    ]);
  });

  it("leaves the states -difftrace omits under -simulate out of the spec, as TLC does", () => {
    expect(simulateFixture("View", "te", 10, true)).toEqual([
      stripDate(readFixture("View_TTrace.tla")),
    ]);
  });

  it("writes no spec under -simulate -depth -1, where TLC prints only the error state", () => {
    expect(simulateFixture("Safety", "te_out", -1)).toEqual([]);
  });

  it("writes the spec of the last trace under -continue, where TLC's appends every trace it prints", async () => {
    const result = await check({
      source: readFixture("Continue.tla"),
      config: readFixture("Continue.cfg"),
      isContinued: true,
      onPrint: () => {},
      traceSpec: { module: "te" },
    });
    expect(stripDate(result.traceSpec)).toBe(
      stripDate(readFixture("Continue_TTrace.tla"))?.replace(
        "    ([x |-> 0]),\n    ([x |-> 2]),\n    ([x |-> 1]),\n    ([x |-> 3]),\n    ([x |-> 0]),\n    ([x |-> 2]),\n    ([x |-> 4]),\n",
        "",
      ),
    );
  });

  it("writes the spec TLC writes for Safety under -dfid", () => {
    expect(
      searchDepthFirst(readFixture("Safety.tla"), readFixture("Safety.cfg"), "te_out"),
    ).toEqual([stripDate(readFixture("Safety_TTrace.tla"))]);
  });

  it("writes no spec for a deadlock under -dfid, whose trace TLC prints without recording it", () => {
    expect(
      searchDepthFirst(
        "---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 3 /\\ x' = x + 1\nInv == x < 3\nLive == <>(x = 3)\nCheck == x <= 3\n====\n",
        "INIT Init\nNEXT Next\n",
        "M_TTrace",
      ),
    ).toEqual([]);
  });
});

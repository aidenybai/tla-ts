import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

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

describe("trace exploration spec", () => {
  it.each([
    ["Safety", "te_out"],
    ["Stuttering", "te"],
    ["Live", "te"],
  ])("writes the spec TLC writes for %s", async (name, module) => {
    const result = await checkFixture(name, module);
    expect(stripDate(result.traceSpec)).toBe(stripDate(readFixture(`${name}_TTrace.tla`)));
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

  it("writes no binary trace without a file for it", async () => {
    const result = await checkFixture("Safety", "te_out");
    expect(result.written.size).toBe(0);
    expect(result.traceSpec).toBeDefined();
  });
});

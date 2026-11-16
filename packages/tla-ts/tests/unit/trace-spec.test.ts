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
  // Deviation from TLC: it adds a view to every lasso, which only one with a repeated state needs.
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

  it("writes no binary trace without a file for it", async () => {
    const result = await checkFixture("Safety", "te_out");
    expect(result.written.size).toBe(0);
    expect(result.traceSpec).toBeDefined();
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-set");

describe("TLCGet revision and configuration match TLC", () => {
  it.each(["TLCSet", "TLCSetPost"])("passes TLC's TLCSet test with %s.cfg", (name) => {
    const config = parseConfig(readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"));
    config.checkDeadlock = false;
    const result = check({ source: readFileSync(join(DIRECTORY, "TLCSet.tla"), "utf8"), config });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([
      4225, 4225, 4225,
    ]);
  });

  it("reports a development build like TLC without a manifest", () => {
    const printed: string[] = [];
    check({
      source:
        '---- MODULE M ----\nEXTENDS TLC\nASSUME PrintT(TLCGet("revision")) /\\ PrintT(TLCGet("config").install)\n====',
      config: "",
      onPrint: (text) => printed.push(text),
    });
    expect(printed[0]).toMatch(
      /^\[calver \|-> "\d{4}\.\d{2}\.\d{2}\.\d{6}", count \|-> 0, date \|-> "\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}Z", tag \|-> "development", timestamp \|-> \d+\]$/,
    );
    expect(printed[1]).toBe(formatValue("unknown"));
  });
});

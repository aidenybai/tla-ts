import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, formatValue, parseConfig } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/tlc-set");

describe("TLCGet revision and configuration match TLC", () => {
  it.each(["TLCSet", "TLCSetPost"])("passes TLC's TLCSet test with %s.cfg", async (name) => {
    const config = parseConfig(readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"));
    config.checkDeadlock = false;
    const result = await check({ source: readFileSync(join(DIRECTORY, "TLCSet.tla"), "utf8"), config });
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([
      4225, 4225, 4225,
    ]);
  });

  it("reports a development build like TLC without a manifest", async () => {
    const printed: string[] = [];
    const fields = ["calver", "count", "date", "tag", "timestamp"];
    await check({
      source: `---- MODULE M ----\nEXTENDS TLC\nASSUME DOMAIN TLCGet("revision") = {${fields.map((field) => `"${field}"`).join(", ")}}\n${fields.map((field) => `ASSUME PrintT(TLCGet("revision").${field})`).join("\n")}\nASSUME PrintT(TLCGet("config").install)\n====`,
      config: "",
      onPrint: (text) => printed.push(text),
    });
    expect(printed).toHaveLength(6);
    expect(printed[0]).toMatch(/^"\d{4}\.\d{2}\.\d{2}\.\d{6}"$/);
    expect(printed[1]).toBe("0");
    expect(printed[2]).toMatch(/^"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}Z"$/);
    expect(printed.slice(3, 4)).toEqual([formatValue("development")]);
    expect(printed[4]).toMatch(/^\d+$/);
    expect(printed[5]).toBe(formatValue("unknown"));
  });
});

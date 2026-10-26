import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/json");

const checkFixture = (name: string) => {
  const written = new Map<string, string>();
  const result = check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
    readFile: (path) => {
      const fixturePath = join(DIRECTORY, path);
      return (
        written.get(path) ??
        (existsSync(fixturePath) ? readFileSync(fixturePath, "utf8") : undefined)
      );
    },
    writeFile: (path, content) => written.set(path, content),
  });
  return { ...result, written };
};

describe("Json matches TLC", () => {
  it("checks TLC's JsonTests model", () => {
    const result = checkFixture("JsonTests");
    expect(result.status).toBe("success");
    expect(result.written.get("target/json/test.json")).toBe('{"a":3,"b":{"c":[4,5,6]}}');
  });

  it("converts and reads values like TLC's Java Json module", () => {
    const result = checkFixture("JsonValues");
    expect(result.status).toBe("success");
    expect(result.written.size).toBe(0);
  });
});

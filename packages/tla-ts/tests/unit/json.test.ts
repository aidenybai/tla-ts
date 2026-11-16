import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { checkFixture } from "./check-harness";

const DIRECTORY = join(import.meta.dirname, "../fixtures/json");

const checkJson = async (name: string) => {
  const written = new Map<string, string>();
  const result = await checkFixture("json", name, name, {
    readFile: (path) => {
      const fixturePath = join(DIRECTORY, path);
      return (
        written.get(path) ??
        (existsSync(fixturePath) ? readFileSync(fixturePath, "utf8") : undefined)
      );
    },
    writeFile: (path, content) => written.set(path, String(content)),
  });
  return { ...result, written };
};

describe("Json matches TLC", () => {
  it("checks TLC's JsonTests model", async () => {
    const result = await checkJson("JsonTests");
    expect(result.status).toBe("success");
    expect(result.written.get("target/json/test.json")).toBe('{"a":3,"b":{"c":[4,5,6]}}');
  });

  it("converts and reads values like TLC's Java Json module", async () => {
    const result = await checkJson("JsonValues");
    expect(result.status).toBe("success");
    expect(result.written.size).toBe(0);
  });
});

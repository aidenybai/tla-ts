import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaUnsupportedError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/overrides");

const loadClass = (name: string) => {
  const path = join(DIRECTORY, `${name}.class`);
  return existsSync(path) ? readFileSync(path) : undefined;
};

describe("Java module overrides match TLC", () => {
  it("replaces each operator with the method of the same name and arity", async () => {
    const result = await check({
      source: readFileSync(join(DIRECTORY, "Overrides.tla"), "utf8"),
      config: "",
      loadClass,
    });
    expect(result.status).toBe("success");
  });

  it("rejects an override whose method computes its value", async () => {
    await expect(
      check({
        source: "---- MODULE Overrides ----\nComputed == 0\nASSUME Computed = 7\n====",
        config: "",
        loadClass,
      }),
    ).rejects.toThrow(TlaUnsupportedError);
  });
});

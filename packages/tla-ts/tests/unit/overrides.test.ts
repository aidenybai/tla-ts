import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, type CheckProgress, TlaUnsupportedError } from "../../src";

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

  it("reports whether each method matches an operator as it loads the class", async () => {
    const overrides: Extract<CheckProgress, { kind: "java-override" }>[] = [];
    await check({
      source: readFileSync(join(DIRECTORY, "Overrides.tla"), "utf8"),
      config: "",
      loadClass,
      onProgress: (progress) => {
        if (progress.kind === "java-override") overrides.push(progress);
      },
    });
    // TLC lists the methods in an order that depends on the JVM.
    expect(overrides.toSorted((left, right) => (left.operator < right.operator ? -1 : 1))).toEqual(
      [
        ["Computed", "()", false],
        ["Flag", "()", true],
        ["Large", "()", true],
        ["Mismatch", "(tlc2.value.impl.Value)", false],
        ["Name", "()", true],
        ["Small", "()", true],
        ["Twice", "(tlc2.value.impl.Value)", true],
      ].map(([operator, parameters, isMatched]) => ({
        kind: "java-override",
        module: "Overrides",
        operator,
        signature: `public static tlc2.value.impl.Value Overrides.${operator}${parameters}`,
        isMatched,
      })),
    );
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

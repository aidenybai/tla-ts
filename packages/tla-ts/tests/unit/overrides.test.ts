import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, type CheckProgress, TlaUnsupportedError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/overrides");

const loadClass = (name: string) => {
  const path = join(DIRECTORY, `${name}.class`);
  return existsSync(path) ? readFileSync(path) : undefined;
};

const PARAMETERIZED = "---- MODULE Overrides ----\nCONSTANT N\nFlag == N = {}\nG == Flag\n====";

const checkMatched = async (source: string, config: string, modules: Map<string, string>) => {
  const matched: string[] = [];
  const result = await check({
    source,
    config,
    loadModule: (name) => modules.get(name),
    loadClass,
    onProgress: (progress) => {
      if (progress.kind === "java-override" && progress.isMatched) matched.push(progress.operator);
    },
  });
  return [result.status, result.violation?.name, matched];
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

  it.each([
    [
      "an extended module's LOCAL INSTANCE",
      "EXTENDS Mid\nASSUME MidFlag",
      "assumption-violation",
      "line 3, col 8 to line 3, col 14 of module Root",
      false,
    ],
    [
      "a named INSTANCE",
      "O == INSTANCE Overrides\nASSUME O!Flag",
      "assumption-violation",
      "line 3, col 8 to line 3, col 13 of module Root",
      false,
    ],
    [
      "the root's LOCAL INSTANCE",
      "LOCAL INSTANCE Overrides\nASSUME Flag",
      "success",
      undefined,
      true,
    ],
  ])(
    "overrides an operator reached through %s only where the root sees its name",
    async (_name, body, status, assumption, isFlagMatched) => {
      expect(
        await checkMatched(
          `---- MODULE Root ----\n${body}\n====`,
          "",
          new Map([
            ["Overrides", "---- MODULE Overrides ----\nFlag == FALSE\n===="],
            ["Mid", "---- MODULE Mid ----\nLOCAL INSTANCE Overrides\nMidFlag == Flag\n===="],
          ]),
        ),
      ).toEqual([status, assumption, isFlagMatched ? ["Flag"] : []]);
    },
  );

  it("overrides no operator the root sees through an unnamed INSTANCE with substitutions", async () => {
    expect(
      await checkMatched(
        "---- MODULE Root ----\nINSTANCE Overrides WITH N <- {1}\nASSUME Flag\n====",
        "",
        new Map([["Overrides", PARAMETERIZED]]),
      ),
    ).toEqual(["assumption-violation", "line 3, col 8 to line 3, col 11 of module Root", []]);
  });

  it("overrides an instance's copy of an operator that reads a substitution", async () => {
    expect(
      await checkMatched(
        "---- MODULE Root ----\nEXTENDS Overrides\nO == INSTANCE Overrides WITH N <- {1}\nASSUME O!G /\\ O!Flag /\\ \\A i \\in {1} : O!Flag\n====",
        "CONSTANT N = {}",
        new Map([["Overrides", PARAMETERIZED]]),
      ),
    ).toEqual(["success", undefined, ["Flag"]]);
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

  it("keeps a LOCAL definition of a RECURSIVE operator from its override, which TLC loads through SANY's leak", async () => {
    const matched: string[] = [];
    const result = await check({
      source: "---- MODULE Root ----\nEXTENDS Overrides\nASSUME Double(5) = 10\n====",
      config: "",
      loadModule: (name) =>
        name === "Overrides"
          ? "---- MODULE Overrides ----\nEXTENDS Integers\nRECURSIVE Twice(_)\nLOCAL Twice(n) == 2 * n\nDouble(n) == Twice(n)\n===="
          : undefined,
      loadClass,
      onProgress: (progress) => {
        if (progress.kind === "java-override" && progress.isMatched)
          matched.push(progress.operator);
      },
    });
    expect([result.status, matched]).toEqual(["success", []]);
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { check, type CheckResult, formatValue } from "tla-ts";
import { describe, expect, it } from "vite-plus/test";
import { compile, TsproverError } from "../src";

const readFixture = (name: string) =>
  readFileSync(join(import.meta.dirname, "fixtures", name), "utf8");

const getTrace = (result: CheckResult) =>
  result.violation?.trace.map((step) =>
    Object.fromEntries(
      Object.entries(step.state).map(([name, value]) => [name, formatValue(value)]),
    ),
  );

describe("compile", () => {
  it("checks DieHard like the spec in tlaplus/Examples", async () => {
    const original = await check({
      source: readFixture("DieHard.tla"),
      config: readFixture("DieHard.cfg"),
    });
    const ported = await check(compile(readFixture("die-hard.ts")));
    expect(ported.status).toBe("invariant-violation");
    expect(ported.violation?.name).toBe("notSolved");
    expect([ported.generatedStates, ported.distinctStates, ported.depth]).toEqual([
      original.generatedStates,
      original.distinctStates,
      original.depth,
    ]);
    expect(getTrace(ported)).toEqual(getTrace(original));
  });

  it("reads a variable's new value after assigning it", async () => {
    const result = await check(
      compile(`
        let count = 1;
        export const step = () => {
          if (count > 10) return;
          count = count + 1;
          count *= 2;
        };
        export const isNotFour = () => count !== 4;
      `),
    );
    expect(getTrace(result)).toEqual([{ count: "1" }, { count: "4" }]);
  });

  it("disables an action whose guard returns", async () => {
    const result = await check(
      compile(`
        let isOpen = false;
        let openings = 0;
        export const open = () => {
          if (isOpen || openings >= 2) return;
          isOpen = true;
          openings++;
        };
        export const close = () => {
          if (!isOpen) return;
          isOpen = false;
        };
      `),
    );
    expect(result.status).toBe("deadlock");
    expect(result.distinctStates).toBe(5);
  });

  it("reports type errors", () => {
    expect(() => compile(`let count = 0;\nexport const step = () => { count = "one"; };`)).toThrow(
      /Type 'string' is not assignable to type 'number'/,
    );
  });

  it("rejects unsupported operators with their location", () => {
    expect(() =>
      compile(`let count = 8;\nexport const halve = () => { count = count / 2; };`),
    ).toThrow(new TsproverError("2:44 Unsupported operator: /"));
  });

  it("rejects a guard after an assignment", () => {
    expect(() =>
      compile(
        `let count = 0;\nexport const step = () => {\n  count++;\n  if (count > 3) return;\n};`,
      ),
    ).toThrow(new TsproverError("4:3 A guard must come before any assignment"));
  });
});

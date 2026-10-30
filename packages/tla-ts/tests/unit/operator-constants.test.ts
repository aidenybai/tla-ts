import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, TlaConfigError } from "../../src";
import { UNEXPECTED_EXCEPTION } from "../../src/errors";

const DIRECTORY = join(import.meta.dirname, "../fixtures/operator-constants");

const SOURCE =
  "---- MODULE Op ----\nEXTENDS Naturals\nCONSTANT F(_), G(_, _), C\nVARIABLE x\nInit == x = 0\nNext == x' = F(x)\nInv == x /= 2\nInc(n) == n + 1\nAdd(a, b) == a + b\nZero == 0\n====";

const checkConstants = (constants: string) =>
  check({ source: SOURCE, config: `INIT Init\nNEXT Next\nINVARIANT Inv\nCONSTANT ${constants}` });

const getTrace = async (constants: string) => {
  const result = await checkConstants(constants);
  return [result.status, result.violation?.trace.map((step) => step.state.x)];
};

describe("operator constants match TLC", () => {
  it("assigns an operator constant from a table", async () => {
    const result = await check({
      source: readFileSync(join(DIRECTORY, "ConstantOperatorConfiguration.tla"), "utf8"),
      config: readFileSync(join(DIRECTORY, "ConstantOperatorConfiguration.cfg"), "utf8"),
    });
    expect([result.status, result.violation?.name]).toEqual(["invariant-violation", "Inv"]);
  });

  it("applies an operator assigned a plain value to any arguments", async () => {
    expect(
      await Promise.all(
        ["F = 1 G <- Add C = 1", "F = F G <- Add C = 1"].map(async (constants) => {
          const result = await checkConstants(constants);
          return [result.status, result.generatedStates, result.distinctStates];
        }),
      ),
    ).toEqual([
      ["success", 3, 2],
      ["success", 3, 2],
    ]);
  });

  it("replaces defined operators with tables and values", async () => {
    expect(await getTrace("F <- Inc G <- Add C = 1 Inc = 2")).toEqual([
      "invariant-violation",
      [0, 2],
    ]);
    expect((await checkConstants("F <- Inc G <- Add C = 1 Inc(0) = 7")).failure?.message).toBe(
      `${UNEXPECTED_EXCEPTION}Attempted to apply operator:\n{ <0, 7>}\nto arguments (7), which is undefined.`,
    );
  });

  it("prefers a substitution over a table and leaves the root module's definitions to scoped tables", async () => {
    expect(await getTrace("F(0) = 1 F <- Inc G <- Add C = 1")).toEqual([
      "invariant-violation",
      [0, 1, 2],
    ]);
    expect(await getTrace("F <- Inc G <- Add C = 1 Inc(0) = [Op] 7")).toEqual([
      "invariant-violation",
      [0, 1, 2],
    ]);
  });

  it("reports arguments a table does not cover like TLC", async () => {
    const cases = [
      [
        "F(0) = 1 G <- Add C = 1",
        "Attempted to apply operator:\n{ <0, 1>}\nto arguments (1), which is undefined.",
      ],
      [
        "F(a) = 1 F(0) = 1 G <- Add C = 1",
        "Attempted to apply operator:\n{ <a, 1>, <0, 1>}\nto arguments (1), which is undefined.",
      ],
      [
        "F(0, 0) = 1 G <- Add C = 1",
        "Attempted to apply the operator { <0, 0, 1>}\nwith wrong number of arguments.",
      ],
    ];
    for (const [constants, message] of cases) {
      expect((await checkConstants(constants)).failure?.message).toBe(
        `${UNEXPECTED_EXCEPTION}${message}`,
      );
    }
  });

  it("rejects configurations TLC rejects", async () => {
    const cases = [
      [
        "F(0) = 1 F(1, 2) = 3 G <- Add C = 1",
        "The arity of the operator F is inconsistent in the configuration file.",
      ],
      [
        "F <- Add G <- Add C = 1",
        "The configuration file substitutes for F with Add of different number of arguments.",
      ],
      [
        "F <- Inc G <- Add C <- Inc",
        "The configuration file substitutes for C with Inc of different number of arguments.",
      ],
      [
        "F <- Nope G <- Add C = 1",
        "The configuration file substitutes for F with the undefined identifier Nope.",
      ],
      [
        "F <- Inc G <- Add C = 1 Q <- Zero",
        "In the configuration file, the identifier Q does not appear in the specification.",
      ],
      [
        "F <- Inc G <- Add C = 1 Inc <- Add",
        "In the configuration file, the identifier Inc appears\non the right-hand side of a <- after already appearing on the\nleft-hand side of one.",
      ],
    ];
    for (const [constants, message] of cases) {
      await expect(checkConstants(constants)).rejects.toThrow(new TlaConfigError(message));
    }
  });
});

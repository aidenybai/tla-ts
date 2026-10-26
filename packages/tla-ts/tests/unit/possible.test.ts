import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, parseConfig, TlaConfigError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/possible");

const NEVER_WITNESSED =
  "was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.";

const checkPossible = async (configName: string) => {
  const config = parseConfig(readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"));
  config.checkDeadlock = false;
  const result = await check({
    source: readFileSync(join(DIRECTORY, "PossibleFail.tla"), "utf8"),
    config,
  });
  return [result.status, result.violation?.message, result.violation?.counts];
};

const checkModule = (body: string, config: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}`,
  });

describe("_POSSIBLE matches TLC", () => {
  it("names the first unwitnessed predicate with its location and prints the counts", async () => {
    expect(
      await Promise.all(
        [
        "PossibleFailStateTest",
        "PossibleFailActionTest",
        "PossibleFailMixedTest",
          "PossibleFailNoTransTest",
        ].map(checkPossible),
      ),
    ).toEqual([
      [
        "postcondition-violation",
        `The _POSSIBLE predicate Unreachable at line 12, col 16 to line 12, col 20 of module PossibleFail ${NEVER_WITNESSED}`,
        "[Unreachable |-> 0]",
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate BigJump at line 16, col 15 to line 16, col 24 of module PossibleFail ${NEVER_WITNESSED}`,
        "[BigJump |-> 0]",
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate Unreachable at line 12, col 16 to line 12, col 20 of module PossibleFail ${NEVER_WITNESSED}`,
        "[AtOne |-> 1, AllDone |-> 1, Unreachable |-> 0, WrapAround |-> 1, BigJump |-> 0]",
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate BigJump at line 16, col 15 to line 16, col 24 of module PossibleFail ${NEVER_WITNESSED}`,
        "<<>>",
      ],
    ]);
  });

  it("prints the counts in the order of the definitions", async () => {
    const body = "Zeta == x = 5\nAlpha == x = 6\nMid == x = 7";
    expect((await checkModule(body, "_POSSIBLE Mid Alpha Zeta")).violation?.counts).toBe(
      "[Zeta |-> 0, Alpha |-> 0, Mid |-> 0]",
    );
  });

  it("checks _POSSIBLE after a violation without changing its status", async () => {
    const result = await checkModule(
      "Unreachable == x = 5\nInv == x < 2",
      "_POSSIBLE Unreachable\nINVARIANT Inv",
    );
    expect([result.status, result.violation?.unwitnessed]).toEqual([
      "invariant-violation",
      {
        name: "Unreachable",
        message: `The _POSSIBLE predicate Unreachable at line 6, col 16 to line 6, col 20 of module M ${NEVER_WITNESSED}`,
        counts: "[Unreachable |-> 0]",
      },
    ]);
  });

  it("rejects predicates TLC cannot track", async () => {
    const body = "AtOne == x = 1\nConstant == TRUE\nArgument(n) == x = n\nTemporal == <>(x = 1)";
    const cases = [
      [
        "Undefined",
        "The possible Undefined specified in the configuration file\nis not defined in the specification.",
      ],
      [
        "x",
        "The possible x specified in the configuration file\nis not defined in the specification.",
      ],
      ["Constant", "The possible Constant cannot be a constant."],
      ["Argument", "TLC requires possible not to take any argument, but one was given: Argument"],
      [
        "Temporal",
        "The possible of Temporal is equal to a temporal formula; only state- and action-level predicates are supported",
      ],
      ["AtOne AtOne", "_POSSIBLE lists AtOne more than once"],
    ];
    for (const [possible, message] of cases) {
      await expect(checkModule(body, `_POSSIBLE ${possible}`)).rejects.toThrow(
        new TlaConfigError(message),
      );
    }
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, parseConfig, TlaConfigError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/possible");

const NEVER_WITNESSED =
  "was never witnessed.\nOthers may be unwitnessed too; only witnessed predicates appear with a\nnon-zero count in the record printed above.\nSee https://explain.tlapl.us/possible-conditions for additional details.";

const checkPossible = (configName: string) => {
  const printed: string[] = [];
  const config = parseConfig(readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"));
  config.checkDeadlock = false;
  const result = check({
    source: readFileSync(join(DIRECTORY, "PossibleFail.tla"), "utf8"),
    config,
    onPrint: (text) => printed.push(text),
  });
  return [result.status, result.violation?.message, printed];
};

const checkModule = (body: string, config: string) => {
  const printed: string[] = [];
  const result = check({
    source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\n${body}\n====`,
    config: `INIT Init\nNEXT Next\n${config}`,
    onPrint: (text) => printed.push(text),
  });
  return { result, printed };
};

describe("_POSSIBLE matches TLC", () => {
  it("names the first unwitnessed predicate with its location and prints the counts", () => {
    expect(
      [
        "PossibleFailStateTest",
        "PossibleFailActionTest",
        "PossibleFailMixedTest",
        "PossibleFailNoTransTest",
      ].map(checkPossible),
    ).toEqual([
      [
        "postcondition-violation",
        `The _POSSIBLE predicate Unreachable at line 12, col 16 to line 12, col 20 of module PossibleFail ${NEVER_WITNESSED}`,
        ["[Unreachable |-> 0]"],
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate BigJump at line 16, col 15 to line 16, col 24 of module PossibleFail ${NEVER_WITNESSED}`,
        ["[BigJump |-> 0]"],
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate Unreachable at line 12, col 16 to line 12, col 20 of module PossibleFail ${NEVER_WITNESSED}`,
        ["[AtOne |-> 1, AllDone |-> 1, Unreachable |-> 0, WrapAround |-> 1, BigJump |-> 0]"],
      ],
      [
        "postcondition-violation",
        `The _POSSIBLE predicate BigJump at line 16, col 15 to line 16, col 24 of module PossibleFail ${NEVER_WITNESSED}`,
        ["<<>>"],
      ],
    ]);
  });

  it("prints the counts in the order of the definitions", () => {
    const body = "Zeta == x = 5\nAlpha == x = 6\nMid == x = 7";
    expect(checkModule(body, "_POSSIBLE Mid Alpha Zeta").printed).toEqual([
      "[Zeta |-> 0, Alpha |-> 0, Mid |-> 0]",
    ]);
  });

  it("checks _POSSIBLE after a violation without changing its status", () => {
    const outcome = checkModule(
      "Unreachable == x = 5\nInv == x < 2",
      "_POSSIBLE Unreachable\nINVARIANT Inv",
    );
    expect([
      outcome.result.status,
      outcome.result.violation?.postcondition,
      outcome.printed,
    ]).toEqual([
      "invariant-violation",
      {
        name: "Unreachable",
        message: `The _POSSIBLE predicate Unreachable at line 6, col 16 to line 6, col 20 of module M ${NEVER_WITNESSED}`,
      },
      ["[Unreachable |-> 0]"],
    ]);
  });

  it("rejects predicates TLC cannot track", () => {
    const body = "AtOne == x = 1\nConstant == TRUE\nArgument(n) == x = n\nTemporal == <>(x = 1)";
    [
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
    ].forEach(([possible, message]) =>
      expect(() => checkModule(body, `_POSSIBLE ${possible}`)).toThrow(new TlaConfigError(message)),
    );
  });
});

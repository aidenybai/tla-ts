import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check, parseConfig, TlaConfigError } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/possible");

const checkPossible = (configName: string) => {
  const printed: string[] = [];
  const config = parseConfig(readFileSync(join(DIRECTORY, `${configName}.cfg`), "utf8"));
  config.checkDeadlock = false;
  const result = check({
    source: readFileSync(join(DIRECTORY, "PossibleFail.tla"), "utf8"),
    config,
    onPrint: (text) => printed.push(text),
  });
  return [result.status, result.violation?.name, printed];
};

const checkModule = (possible: string) =>
  check({
    source:
      "---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = (x + 1) % 3\nAtOne == x = 1\nConstant == TRUE\nArgument(n) == x = n\nTemporal == <>(x = 1)\n====",
    config: `INIT Init\nNEXT Next\n_POSSIBLE ${possible}`,
  });

describe("_POSSIBLE matches TLC", () => {
  it("names the first unwitnessed predicate and prints the counts", () => {
    expect(["PossibleFailStateTest", "PossibleFailActionTest"].map(checkPossible)).toEqual([
      ["postcondition-violation", "Unreachable", ["[Unreachable |-> 0]"]],
      ["postcondition-violation", "BigJump", ["[BigJump |-> 0]"]],
    ]);
    expect(checkPossible("PossibleFailMixedTest").slice(0, 2)).toEqual([
      "postcondition-violation",
      "Unreachable",
    ]);
  });

  it("names an action predicate that no transition could witness", () => {
    expect(checkPossible("PossibleFailNoTransTest")).toEqual([
      "postcondition-violation",
      "BigJump",
      ["<<>>"],
    ]);
  });

  it("rejects predicates TLC cannot track", () => {
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
      expect(() => checkModule(possible)).toThrow(new TlaConfigError(message)),
    );
  });
});

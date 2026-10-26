import { describe, expect, it } from "vite-plus/test";
import { check, TlaError } from "../../src";
import { getErrorExitCode } from "../../src/run-cli";

const STEP = "Init == x = 0\nNext == x < 2 /\\ x' = x + 1";

const getThrownExitCode = (definitions: string, config = "INIT Init\nNEXT Next") => {
  try {
    check({
      source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC\nVARIABLE x\n${definitions}\n====`,
      config,
      onPrint: () => {},
    });
  } catch (error) {
    if (error instanceof TlaError) return getErrorExitCode(error);
    throw error;
  }
  return undefined;
};

describe("CLI exit codes match TLC", () => {
  it.each([
    ["a parse error", "Init == x = = 0\nNext == x' = x", 150],
    ["an unresolved symbol", "Init == x = y\nNext == x' = x", 150],
    ["a constant without a value", "CONSTANT C\nInit == x = 0\nNext == x' = x", 151],
    ["a literal too big for TLC", "Init == x = 3000000000\nNext == x' = x", 255],
    ["a failure in the initial predicate", "Init == x = 1 \\div 0\nNext == x' = x", 75],
    [
      "an Assert in the initial predicate",
      'Init == x = 0 /\\ Assert(FALSE, "a")\nNext == x\' = x',
      75,
    ],
    ["an initial state that is not complete", "VARIABLE y\nInit == x = 0\nNext == x' = x", 255],
    ["a core failure in the next-state relation", "Init == x = 0\nNext == x' = <<1>>[2]", 75],
    [
      "a standard-module failure in the next-state relation",
      "Init == x = 0\nNext == x' = 1 \\div 0",
      255,
    ],
    ["a wrong argument to +", 'Init == x = 0\nNext == x\' = x + "a"', 75],
    ["a wrong argument to Len", "Init == x = 0\nNext == x' = Len(1)", 255],
    [
      "an Assert in the next-state relation",
      'Init == x = 0\nNext == Assert(x < 0, "a") /\\ x\' = x',
      14,
    ],
    ["a next-state relation that is not a boolean", "Init == x = 0\nNext == 3", 255],
  ])("exits for %s", (_, definitions, code) => {
    expect(getThrownExitCode(definitions)).toBe(code);
  });

  it("exits with 75 when an invariant fails on an initial state and 76 afterwards", () => {
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    expect(getThrownExitCode(`${STEP}\nInv == 1 \\div 0 = x`, config)).toBe(75);
    expect(getThrownExitCode(`${STEP}\nInv == x < 1 \\/ 1 \\div 0 = 1`, config)).toBe(76);
  });

  it("exits with 255 when a liveness property fails to evaluate", () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(1 \\div 0 = x)`;
    expect(getThrownExitCode(definitions, "SPECIFICATION Spec\nPROPERTY Prop")).toBe(255);
  });

  it("exits with 75 when the configuration has no next-state relation", () => {
    expect(getThrownExitCode("Init == x = 0", "INIT Init")).toBe(75);
  });
});

import { describe, expect, it } from "vite-plus/test";
import { check, TlaError } from "../../src";
import { getErrorExitCode } from "../../src/errors";

const STEP = "Init == x = 0\nNext == x < 2 /\\ x' = x + 1";

const getFailureExitCode = async (definitions: string, config = "INIT Init\nNEXT Next") => {
  try {
    const result = await check({
      source: `---- MODULE M ----\nEXTENDS Naturals, Sequences, TLC\nVARIABLE x\n${definitions}\n====`,
      config,
      onPrint: () => {},
    });
    return result.failure?.exitCode;
  } catch (error) {
    if (error instanceof TlaError) return getErrorExitCode(error);
    throw error;
  }
};

describe("CLI exit codes match TLC", () => {
  it.each([
    ["a parse error", "Init == x = = 0\nNext == x' = x", 150],
    ["an unresolved symbol", "Init == x = y\nNext == x' = x", 150],
    ["a constant without a value", "CONSTANT C\nInit == x = 0\nNext == x' = x", 151],
    ["a literal too big for TLC", "Init == x = 3000000000\nNext == x' = x", 255],
    ["an unused literal too big for TLC", "Big == 3000000000\nInit == x = 0\nNext == x' = x", 255],
    ["an unused decimal literal", "Half == 1.5\nInit == x = 0\nNext == x' = x", 151],
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
  ])("exits for %s", async (_, definitions, code) => {
    expect(await getFailureExitCode(definitions)).toBe(code);
  });

  it("exits with 75 when an invariant fails on an initial state and 76 afterwards", async () => {
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    expect(await getFailureExitCode(`${STEP}\nInv == 1 \\div 0 = x`, config)).toBe(75);
    expect(await getFailureExitCode(`${STEP}\nInv == x < 1 \\/ 1 \\div 0 = 1`, config)).toBe(76);
  });

  it("exits with 255 when a liveness property fails to evaluate", async () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(1 \\div 0 = x)`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec\nPROPERTY Prop")).toBe(255);
  });

  it("exits with 255 for a temporal quantifier over variables in the specification", async () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x /\\ \\EE y : y = x`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec")).toBe(255);
  });

  it("exits with 75 when the configuration has no next-state relation", async () => {
    expect(await getFailureExitCode("Init == x = 0", "INIT Init")).toBe(75);
  });
});

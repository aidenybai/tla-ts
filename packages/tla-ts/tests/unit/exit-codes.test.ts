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

  it("exits with 255 for a symmetry that isn't a set of permutations", async () => {
    const config = "INIT Init\nNEXT Next\nSYMMETRY P";
    expect(await getFailureExitCode(`${STEP}\nP == 1`, config)).toBe(255);
    expect(await getFailureExitCode(STEP, config)).toBe(151);
  });

  it("exits with 255 for a box over a state predicate in the specification", async () => {
    const config = "SPECIFICATION Spec";
    expect(
      await getFailureExitCode(`${STEP}\nSpec == Init /\\ [][Next]_x /\\ [](x < 3)`, config),
    ).toBe(255);
  });

  it("exits like TLC on a stack overflow in each phase", async () => {
    const recursion = "RECURSIVE R(_)\nR(n) == R(n + 1)";
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    expect(await getFailureExitCode(`${recursion}\nInit == x = R(0)\nNext == x' = x`)).toBe(75);
    expect(await getFailureExitCode(`${recursion}\nInit == x = 0\nNext == x' = R(0)`)).toBe(255);
    expect(await getFailureExitCode(`${recursion}\n${STEP}\nInv == R(0) = 0`, config)).toBe(75);
    expect(
      await getFailureExitCode(`${recursion}\n${STEP}\nInv == x = 0 \\/ R(0) = 0`, config),
    ).toBe(255);
    expect(await getFailureExitCode(`${recursion}\nASSUME R(0) = 0\n${STEP}`)).toBe(255);
  });

  it("exits with the status of an error in the liveness check of an initial state", async () => {
    const config = "SPECIFICATION Spec\nPROPERTY Prop";
    const spec = `${STEP}\nSpec == Init /\\ [][Next]_x`;
    expect(await getFailureExitCode(`${spec}\nProp == <>~ENABLED (x' > x)`, config)).toBe(151);
    expect(await getFailureExitCode(`${spec}\nProp == <>(1 = {})`, config)).toBe(255);
  });

  it("exits with 75 when an invariant fails on an initial state and 76 afterwards", async () => {
    const config = "INIT Init\nNEXT Next\nINVARIANT Inv";
    expect(await getFailureExitCode(`${STEP}\nInv == 1 \\div 0 = x`, config)).toBe(75);
    expect(await getFailureExitCode(`${STEP}\nInv == x < 1 \\/ 1 \\div 0 = 1`, config)).toBe(76);
  });

  it.each([
    ["an Assert", 'Assert(x < 1, "a")', 14],
    ["a standard-module failure", "1 \\div (1 - x) = 1", 255],
    ["a core failure", "<<1>>[x + 1] = 1", 75],
  ])("exits for %s in an action property", async (_, action, code) => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x\nProp == [][${action}]_x`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec\nPROPERTY Prop")).toBe(code);
  });

  it("exits with 255 when a liveness property fails to evaluate", async () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x /\\ WF_x(Next)\nProp == <>(1 \\div 0 = x)`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec\nPROPERTY Prop")).toBe(255);
  });

  it("exits with 255 for a temporal quantifier over variables in the specification", async () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x /\\ \\EE y : y = x`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec")).toBe(255);
  });

  it("exits with 77 for a property that is a tautology and 76 for an invariant with a prime", async () => {
    const definitions = `${STEP}\nSpec == Init /\\ [][Next]_x\nProp == <>[]TRUE => TRUE\nInv == x' = x`;
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec\nPROPERTY Prop")).toBe(77);
    expect(await getFailureExitCode(definitions, "SPECIFICATION Spec\nINVARIANT Inv")).toBe(76);
  });

  it("rejects a formula too large in disjunctive normal form as TLC does", async () => {
    const definitions = `Init == x = FALSE\nNext == x' \\in BOOLEAN\nSpec == Init /\\ [][Next]_x /\\ \\A i \\in 1..6 : \\A j \\in 1..6 : SF_x(Next)\nProp == <>[](x \\in BOOLEAN)`;
    const config = "SPECIFICATION Spec\nPROPERTY Prop";
    await expect(
      check({
        source: `---- MODULE M ----\nEXTENDS Naturals\nVARIABLE x\n${definitions}\n====`,
        config,
      }),
    ).rejects.toThrow(
      "TLC cannot handle the temporal formula because it exceeds the maximum supported size in disjunctive normal form.",
    );
    expect(await getFailureExitCode(definitions, config)).toBe(255);
  });

  it("exits with 75 when the configuration has no next-state relation", async () => {
    expect(await getFailureExitCode("Init == x = 0", "INIT Init")).toBe(75);
  });
});

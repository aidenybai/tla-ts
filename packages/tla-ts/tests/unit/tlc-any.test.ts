import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { formatCallStackLines } from "./check-harness";

const checkAssumption = (assumption: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nASSUME ${assumption}\n====`,
    config: "",
  });

describe("Any matches TLC", () => {
  it("contains every value", async () => {
    const result = await checkAssumption(
      '1 \\in Any /\\ "a" \\in Any /\\ {} \\in Any /\\ {1} \\subseteq Any /\\ ~IsFiniteSet(Any) /\\ ToString(<<Any>>) = "<<ANY>>"',
    );
    expect(result.status).toBe("success");
  });

  it.each(["Any = Any", "{Any} = {Any}", "<<Any>> = <<Any>>", "Any \\in {Any}"])(
    "fails to compare %s",
    async (assumption) => {
      const result = await checkAssumption(assumption);
      expect(result.status).toBe("assumption-violation");
      expect(result.violation?.message).toBe("Attempted to compare ANY with the value\nANY");
    },
  );

  it.each([
    ["Any = {1}", "Attempted to compare overridden value ANY with non-overridden value:\n{1}"],
    ["Any = Nat", "Attempted to compare ANY with the value\nNat"],
    ["{1} = Any", "Attempted to check equality of the set {1} with the value:\nANY"],
    ["Nat = Any", "Attempted to compare Nat with the value\nANY"],
  ])("fails to check %s for equality like TLC's Java classes", async (assumption, message) => {
    const result = await checkAssumption(assumption);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });

  it.each([
    ["[{Any} -> {1, 2}] # {}", [63, 62, 57], 75],
    ["[a : {Any}, b : {1, 2}] # {}", [69, 68, 63], 75],
    ["{Any} \\X {1, 2} # {}", [61, 60, 55], 75],
    ["{} # [{Any} -> {1, 2}]", [63, 62, 42], 75],
    ["[{Any} -> {1, 2}] \\cup {} # {}", [71, 70, 65], 75],
    ["\\E f \\in [{Any} -> {1, 2}] : f[Any] = 2", [80, 79], 255],
  ])(
    "compares the elements holding ANY of the product %s converts, as TLC's SetEnumValue#normalize sorts them",
    async (expression, ends, exitCode) => {
      const result = await check({
        source: `---- MODULE M ----\nEXTENDS Integers, TLC, FiniteSets, Sequences, Bags\nCONSTANT M1, M2\nVARIABLE x\nInit == x = 0\nNext == x' = x /\\ PrintT("n") /\\ PrintT(${expression})\n====`,
        config: "CONSTANT M1 = M1\nCONSTANT M2 = M2\nINIT Init\nNEXT Next",
      });
      const getLine = (start: number, end: number) =>
        `Line 6, column ${start} to line 6, column ${end} in M`;
      expect([
        result.failure?.fingerprint?.reason ?? result.failure?.message,
        formatCallStackLines(result),
        result.failure?.exitCode,
      ]).toEqual([
        "Attempted to compare ANY with the value\nANY",
        [
          getLine(9, ends[0]),
          getLine(9, 29),
          getLine(9, 14),
          getLine(34, ends[0]),
          ...ends.slice(1).map((end) => getLine(41, end)),
        ],
        exitCode,
      ]);
    },
  );
});

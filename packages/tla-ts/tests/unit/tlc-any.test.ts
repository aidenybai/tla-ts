import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

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
});

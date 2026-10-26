import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const checkAssumption = (assumption: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC\nASSUME ${assumption}\n====`,
    config: "",
  });

describe("Any matches TLC", () => {
  it("contains every value", () => {
    const result = checkAssumption(
      '1 \\in Any /\\ "a" \\in Any /\\ {} \\in Any /\\ {1} \\subseteq Any /\\ ~IsFiniteSet(Any) /\\ ToString(<<Any>>) = "<<ANY>>"',
    );
    expect(result.status).toBe("success");
  });

  it.each(["Any = Any", "{Any} = {Any}", "<<Any>> = <<Any>>", "Any \\in {Any}"])(
    "fails to compare %s",
    (assumption) => {
      const result = checkAssumption(assumption);
      expect(result.status).toBe("assumption-violation");
      expect(result.violation?.message).toBe("Attempted to compare ANY with the value\nANY");
    },
  );
});

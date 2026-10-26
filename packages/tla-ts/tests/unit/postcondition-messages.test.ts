import { describe, expect, it } from "vite-plus/test";
import { check, TlaConfigError } from "../../src";

const checkPostcondition = (postcondition: string, extra = "") =>
  check({
    source: `---- MODULE M ----\nEXTENDS Naturals, TLC\nVARIABLE x\nInit == x = 0\nNext == x < 2 /\\ x' = x + 1\nInv == x < 1\nFalse == FALSE\nNum == 1\nDistinct == TLCGet("distinct") = 99\n====`,
    config: `INIT Init\nNEXT Next\nCHECK_DEADLOCK FALSE\n${extra}POSTCONDITION ${postcondition}`,
    onPrint: () => {},
  });

describe("POSTCONDITION messages match TLC", () => {
  it("names the range of a false postcondition", () => {
    const result = checkPostcondition("Distinct");
    expect(result.status).toBe("postcondition-violation");
    expect(result.violation?.message).toBe(
      "Postcondition Distinct at line 9, col 13 to line 9, col 35 of module M is false.",
    );
  });

  it("prints a numeral body instead of its range", () => {
    expect(checkPostcondition("Num").violation?.message).toMatch(
      /^Evaluating postcondition Num at 1 failed\.\n/,
    );
  });

  it("rejects a constant postcondition after the search", () => {
    expect(() => checkPostcondition("False")).toThrow(TlaConfigError);
  });

  it("skips every postcondition after a violation when one is constant", () => {
    const result = checkPostcondition("False", "INVARIANT Inv\n");
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.postcondition).toBeUndefined();
  });
});

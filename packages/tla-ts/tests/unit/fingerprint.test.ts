import { describe, expect, it } from "vite-plus/test";
import { getObligations } from "../../src/obligations";
import { getFingerprint } from "../../src/prove/prep/fingerprint";

const getFingerprints = (theorems: string[]) =>
  getObligations(
    [
      {
        file: "M.tla",
        source: ["---- MODULE M ----", "EXTENDS Naturals", ...theorems, "===="].join("\n"),
      },
    ],
    () => undefined,
  )[0].obligations.map((obligation) => getFingerprint(obligation.sequent));

describe("fingerprints match tlapm's fp_sequent", () => {
  it("ignores the names of bound variables but not of declarations", () => {
    const fingerprints = getFingerprints([
      "THEOREM \\A x \\in Nat : x + 0 = x",
      "  OBVIOUS",
      "THEOREM \\A y \\in Nat : y + 0 = y",
      "  OBVIOUS",
      "THEOREM ASSUME NEW a PROVE a = a",
      "  OBVIOUS",
      "THEOREM ASSUME NEW b PROVE b = b",
      "  OBVIOUS",
    ]);
    expect(fingerprints[0]).toBe(fingerprints[1]);
    expect(fingerprints[2]).not.toBe(fingerprints[3]);
  });
});

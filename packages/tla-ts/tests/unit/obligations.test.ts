import { describe, expect, it } from "vite-plus/test";
import { getObligations } from "../../src/obligations";

const getTexts = (body: string) =>
  getObligations(
    [{ file: "M.tla", source: `---- MODULE M ----\nEXTENDS Naturals\n${body}\n====\n` }],
    () => undefined,
  )[0].obligations.map((obligation) => obligation.text);

describe("proof obligations match tlapm", () => {
  it("prints an @ that no earlier step defines", () => {
    const texts = getTexts(
      [
        "VARIABLE x",
        "THEOREM x = 1",
        "<1>1. TRUE",
        "  OBVIOUS",
        "<1>2. @ = x",
        "  OBVIOUS",
        "<1>3. QED",
        "  OBVIOUS",
      ].join("\n"),
    );
    expect(texts).toEqual([
      "ASSUME NEW VARIABLE x\nPROVE  x = 1\n",
      "ASSUME NEW VARIABLE x\nPROVE  TRUE\n",
      "ASSUME NEW VARIABLE x\nPROVE  @ = x\n",
    ]);
  });
});

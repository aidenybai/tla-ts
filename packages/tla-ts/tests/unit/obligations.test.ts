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

  it("prints and selects the label of a nested ASSUME/PROVE", () => {
    const texts = getTexts(
      [
        "CONSTANT c",
        "THEOREM T == ASSUME a :: ASSUME c = 1 PROVE c > 0 PROVE TRUE",
        "  OBVIOUS",
        "THEOREM U == TRUE",
        "  BY T!a",
      ].join("\n"),
    );
    expect(texts).toEqual([
      "ASSUME NEW CONSTANT c,\n       a::ASSUME c = 1 \n          PROVE  c > 0 \nPROVE  TRUE\n",
      "ASSUME NEW CONSTANT c,\n       ASSUME c = 1 \n       PROVE  c > 0 \nPROVE  TRUE\n",
      "ASSUME NEW CONSTANT c\nPROVE  ASSUME c = 1 \n       PROVE  c > 0\n",
    ]);
  });
});

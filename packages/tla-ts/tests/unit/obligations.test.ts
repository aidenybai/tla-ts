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

  it("reads a label of an earlier step, as in <1>1!e", () => {
    const texts = getTexts(
      [
        "CONSTANT A, B",
        "THEOREM A /\\ B => A",
        "<1>1. e :: (A /\\ B => A)",
        "  OBVIOUS",
        "<1>2. <1>1!e",
        "  BY <1>1",
        "<1>3. \\A x : g(x) :: x = x",
        "  OBVIOUS",
        "<1>4. <1>3!g(A)",
        "  BY <1>3",
        "<1> QED",
        "  BY <1>1!e",
      ].join("\n"),
    );
    const constants = "ASSUME NEW CONSTANT A,\n       NEW CONSTANT B";
    expect(texts).toEqual([
      `${constants},\n       A /\\ B => A \nPROVE  A /\\ B => A\n`,
      `${constants}\nPROVE  A /\\ B => A\n`,
      `${constants}\nPROVE  e::(A /\\ B => A)\n`,
      `${constants},\n       <1>1 \nPROVE  A /\\ B => A\n`,
      `${constants}\nPROVE  <1>1\n`,
      `${constants}\nPROVE  \\A x : (g(x):: x = x)\n`,
      `${constants},\n       <1>3 \nPROVE  A = A\n`,
      `${constants}\nPROVE  <1>3\n`,
    ]);
  });

  it("rejects a label that an earlier step lacks, as tlapm does", () => {
    expect(() =>
      getTexts(
        "CONSTANT A\nTHEOREM A => A\n<1>1. e :: A => A\n  OBVIOUS\n<1>2. <1>1!g\n  OBVIOUS\n<1> QED\n  BY <1>1",
      ),
    ).toThrow("Could not resolve subexpression reference");
  });
});

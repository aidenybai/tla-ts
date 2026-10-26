import { describe, expect, it } from "vite-plus/test";
import { check, formatValue } from "../../src";

const checkPrinting = async (body: string, config = "") => {
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE M ----\nEXTENDS Integers, TLC\n${body}\n====`,
    config,
    onPrint: (text) => printed.push(text),
  });
  return { result, printed };
};

describe("printing matches TLC", () => {
  it.each([
    ["3..1", "{}"],
    ["<<3..1>>", "<<{}>>"],
    ["SUBSET {1}", "{{}, {1}}"],
    ["SUBSET (1..7)", "SUBSET (1..7)"],
    ["SUBSET SUBSET (1..3)", "SUBSET {{}, {1}, {2}, {3}, {1, 2}, {1, 3}, {2, 3}, {1, 2, 3}}"],
    ["SUBSET (3..1)", "{{}}"],
    ["[{1} -> {2, 3}]", "{<<2>>, <<3>>}"],
    ["[1..2 -> 1..45]", "[1..2 -> 1..45]"],
    ["[{} -> {1}]", "{<<>>}"],
    ["[a : {1, 2}]", "{[a |-> 1], [a |-> 2]}"],
    ["[a : 1..2000]", "[a: 1..2000]"],
    ["{1} \\X {2, 3}", "{<<1, 2>>, <<1, 3>>}"],
    ["(1..40) \\X (1..50)", "(1..40 \\X 1..50)"],
    ["{} \\X Nat", "{}"],
    ["<<SUBSET (1..7)>>", "<<SUBSET (1..7)>>"],
  ])("prints %s as %s", async (expression, text) => {
    expect((await checkPrinting(`ASSUME PrintT(${expression})`)).printed).toEqual([text]);
  });

  it.each([
    ["SUBSET {1}", '"{{}, {1}}"'],
    ["[{1} -> {2, 3}]", '"{<<2>>, <<3>>}"'],
    ["3..1", '"{}"'],
    ["SUBSET (1..7)", '"SUBSET (1..7)"'],
  ])("converts %s to the string %s", async (expression, text) => {
    expect((await checkPrinting(`ASSUME PrintT(ToString(${expression}))`)).printed).toEqual([
      text,
    ]);
  });

  it.each(["PrintT(SUBSET Nat)", "Print([Nat -> {1}], TRUE)", 'ToString(Nat \\X {1}) = ""'])(
    "fails to print a set that it can't enumerate in %s",
    async (expression) => {
      expect((await checkPrinting(`ASSUME ${expression}`)).result.status).toBe(
        "assumption-violation",
      );
    },
  );

  it.each([
    ["SUBSET {1}", "{{}, {1}}"],
    ["SUBSET (1..7)", "SUBSET (1..7)"],
    ["[1..2 -> 1..45]", "[1..2 -> 1..45]"],
    ["2..1", "{}"],
  ])("prints %s in a trace as %s", async (expression, text) => {
    const result = (
      await checkPrinting(
        `VARIABLE b\nInit == b = ${expression}\nNext == UNCHANGED b\nInv == b # b`,
        "INIT Init\nNEXT Next\nINVARIANT Inv",
      )
    ).result;
    expect(result.status).toBe("invariant-violation");
    expect(formatValue(result.violation?.trace[0].state.b ?? false)).toBe(text);
  });

  it("expands small sets in error messages", async () => {
    expect((await checkPrinting("ASSUME 1 \\in SUBSET {1}")).result.violation?.message).toContain(
      "{{}, {1}}",
    );
  });
});

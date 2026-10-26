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
    ["{} \\cup (0..0)", "0..0"],
    ["(0..1) \\cup {}", "{0, 1}"],
    ["DOMAIN [i \\in 0..1 |-> 0]", "0..1"],
    ["DOMAIN [[i \\in 0..1 |-> 0] EXCEPT ![0] = 1]", "0..1"],
    ["{DOMAIN f : f \\in [0..1 -> {0, 1}]}", "{0..1}"],
    ["DOMAIN RandomElement([1..2 -> {0}])", "{1, 2}"],
  ])("prints %s as %s", async (expression, text) => {
    expect((await checkPrinting(`ASSUME PrintT(${expression})`)).printed).toEqual([text]);
  });

  it.each([
    ["SUBSET {1}", '"{{}, {1}}"'],
    ["[{1} -> {2, 3}]", '"{<<2>>, <<3>>}"'],
    ["3..1", '"{}"'],
    ["SUBSET (1..7)", '"SUBSET (1..7)"'],
  ])("converts %s to the string %s", async (expression, text) => {
    expect((await checkPrinting(`ASSUME PrintT(ToString(${expression}))`)).printed).toEqual([text]);
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

const NESTED_TUPLE_LINES = Array.from({ length: 10 }, () => "<<1, 2, 3, 4, 5, 6, 7, 8, 9, 10>>");

describe("line breaking matches TLC's pretty printer", () => {
  it.each([
    ["[x \\in 1..10 |-> [y \\in 1..10 |-> y]]", `<< ${NESTED_TUPLE_LINES.join(",\n   ")} >>`],
    [
      "[x \\in 1..5 |-> [fielda |-> x, fieldb |-> 1..x]]",
      "<< [fielda |-> 1, fieldb |-> 1..1],\n   [fielda |-> 2, fieldb |-> 1..2],\n   [fielda |-> 3, fieldb |-> 1..3],\n   [fielda |-> 4, fieldb |-> 1..4],\n   [fielda |-> 5, fieldb |-> 1..5] >>",
    ],
    [
      "[x \\in 1..3 |-> [y \\in 1..3 |-> [z \\in 1..3 |-> <<x, y, z>>]]]",
      "<< << <<<<1, 1, 1>>, <<1, 1, 2>>, <<1, 1, 3>>>>,\n      <<<<1, 2, 1>>, <<1, 2, 2>>, <<1, 2, 3>>>>,\n      <<<<1, 3, 1>>, <<1, 3, 2>>, <<1, 3, 3>>>> >>,\n   << <<<<2, 1, 1>>, <<2, 1, 2>>, <<2, 1, 3>>>>,\n      <<<<2, 2, 1>>, <<2, 2, 2>>, <<2, 2, 3>>>>,\n      <<<<2, 3, 1>>, <<2, 3, 2>>, <<2, 3, 3>>>> >>,\n   << <<<<3, 1, 1>>, <<3, 1, 2>>, <<3, 1, 3>>>>,\n      <<<<3, 2, 1>>, <<3, 2, 2>>, <<3, 2, 3>>>>,\n      <<<<3, 3, 1>>, <<3, 3, 2>>, <<3, 3, 3>>>> >> >>",
    ],
    [
      "[fieldaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |-> <<1, 2>>]",
      "[ fieldaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |->\n      <<1, 2>> ]",
    ],
    [
      "[x \\in 2..9 |-> x * 100000000]",
      "( 2 :> 200000000 @@\n  3 :> 300000000 @@\n  4 :> 400000000 @@\n  5 :> 500000000 @@\n  6 :> 600000000 @@\n  7 :> 700000000 @@\n  8 :> 800000000 @@\n  9 :> 900000000 )",
    ],
    [
      '<<"a\\"b", "cccccccccccccccccccccccccccccccccccccccccccc", "dddddddddddddddddddddddddddddd">>',
      '<<"a\\"b", "cccccccccccccccccccccccccccccccccccccccccccc", "dddddddddddddddddddddddddddddd">>',
    ],
  ])("prints %s across lines", async (expression, text) => {
    expect((await checkPrinting(`ASSUME PrintT(${expression})`)).printed).toEqual([text]);
  });

  it("breaks the value in a failed Assert", async () => {
    expect(
      (await checkPrinting("ASSUME Assert(FALSE, [x \\in 1..10 |-> [y \\in 1..10 |-> y]])")).result
        .violation?.message,
    ).toBe(
      `The first argument of Assert evaluated to FALSE; the second argument was:\n<< ${NESTED_TUPLE_LINES.join(",\n   ")} >>`,
    );
  });
});

describe("functions over infinite domains print like TLC", () => {
  it.each([
    [
      "ASSUME PrintT([n \\in Nat |-> n])",
      "[n \\in Nat |-> <expression line 3, col 30 to line 3, col 30 of module M>]",
    ],
    [
      "ASSUME PrintT([n, m \\in Nat |-> n])",
      "[n \\in Nat |-> <expression line 3, col 33 to line 3, col 33 of module M>]",
    ],
    [
      "ASSUME PrintT([n \\in Nat, m \\in 1..2 |-> n])",
      "[n \\in Nat, m \\in 1..2 |-> <expression line 3, col 42 to line 3, col 42 of module M>]",
    ],
    [
      "ASSUME PrintT([<<a, b>> \\in Nat \\X Nat |-> a])",
      "[<<a, b>> \\in (Nat \\X Nat) |-> <expression line 3, col 44 to line 3, col 44 of module M>]",
    ],
    [
      "ASSUME PrintT([n \\in Nat |->\n  n + 1])",
      "[n \\in Nat |-> <expression line 4, col 3 to line 4, col 7 of module M>]",
    ],
    [
      "ASSUME PrintT([[n \\in Int |-> n] EXCEPT ![1] = 5])",
      "[n \\in Int |-> <expression line 3, col 31 to line 3, col 31 of module M>]",
    ],
    [
      "f[n \\in Nat] == IF n = 0 THEN 0 ELSE f[n - 1]\nASSUME PrintT(f)",
      "[n \\in Nat |-> <expression line 3, col 17 to line 3, col 45 of module M>]",
    ],
    [
      "ASSUME PrintT(ToString([n \\in Nat \\ {1} |-> n]))",
      '"[n \\\\in Nat \\\\ {1} |-> <expression line 3, col 45 to line 3, col 45 of module M>]"',
    ],
  ])("prints %s with its parameters and body location", async (body, text) => {
    expect((await checkPrinting(body)).printed).toEqual([text]);
  });
});

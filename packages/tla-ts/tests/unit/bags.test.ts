import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const DIRECTORY = join(import.meta.dirname, "../fixtures/bags");

const checkBagsFixture = (name: string, onPrint?: (text: string) => void) =>
  check({
    source: readFileSync(join(DIRECTORY, `${name}.tla`), "utf8"),
    config: readFileSync(join(DIRECTORY, `${name}.cfg`), "utf8"),
    onPrint,
  });

const checkBags = (body: string) =>
  check({
    source: `---- MODULE M ----\nEXTENDS Integers, FiniteSets, TLC, Bags\nCONSTANT C\nVARIABLE x\nInit == x = 0\nNext == x' = x\n${body}\n====`,
    config: "CONSTANT C = C\nINIT Init\nNEXT Next",
  });

const getPassedLines = (numbers: number[]) => numbers.map((number) => `"Test ${number} OK"  TRUE`);

describe("the Bags module matches TLC", () => {
  it("evaluates every assumption in TLC's BagsTest", async () => {
    const result = await checkBagsFixture("BagsTest");
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates]).toEqual([0, 0]);
  });

  it.each([
    [
      "test36",
      [
        ...getPassedLines([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]),
        '"TLC Fails Tests 11 & 12 because SubBag not implemented"  TRUE',
        ...getPassedLines([13, 14, 15, 16]),
      ],
    ],
    ["test50", getPassedLines([1, 2, 3, 4, 5, 6, 7])],
  ])("prints what TLC prints for its %s suite test", async (name, lines) => {
    const printed: string[] = [];
    const result = await checkBagsFixture(name, (text) => printed.push(text));
    expect(result.status).toBe("success");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([2, 1, 1]);
    expect(printed).toEqual(lines);
  });

  it("evaluates SubBag by its TLA+ definition", async () => {
    const result = await checkBags(
      'Bag1 == SetToBag({"a", "b"})\nBag2 == Bag1 (+) SetToBag({"a"})\nASSUME Bag1 \\in SubBag(Bag2) /\\ Cardinality(SubBag(Bag2)) = 6\nASSUME Cardinality(SubBag(<<2, 1, 3>>)) = 24 /\\ SubBag(EmptyBag) = {EmptyBag}\nASSUME SubBag(<<2, 1>>) = {<<>>, <<1>>, <<2>>, (2 :> 1), <<1, 1>>, <<2, 1>>}',
    );
    expect(result.status).toBe("success");
  });

  it("accepts the values that TLC's Java overrides accept", async () => {
    const result = await checkBags(
      'ASSUME ~IsABag(C) /\\ ~IsABag("abc") /\\ ~IsABag({1})\nASSUME <<0, -1, 2>> (-) EmptyBag = (3 :> 2)\nASSUME BagUnion({1}) = 1 /\\ BagUnion({<<0>>, <<1>>}) = <<1>>\nASSUME <<0>> \\sqsubseteq EmptyBag /\\ ~(<<1>> \\sqsubseteq <<-3>>)\nASSUME BagOfAll(LAMBDA n : n \\div 2, <<1, 2, 3, 4>>) = (0 :> 1 @@ 1 :> 5 @@ 2 :> 4)\nASSUME ~BagIn(C, <<1>>) /\\ ~BagIn(1, <<0>>) /\\ CopiesIn(2, <<1, 0>>) = 0',
    );
    expect(result.status).toBe("success");
  });

  it.each([
    [
      "BagCardinality(<<0>>)",
      "Applying BagCardinality to the following value,\nwhich is not a bag:\n<<0>>",
    ],
    ["<<0>> (+) EmptyBag", "The first argument of (+) should be a bag, but instead it is:\n<<0>>"],
    ["EmptyBag (-) 1", "The second argument of (-) should be a bag, but instead it is:\n1"],
    [
      'BagIn(1, <<"a">>)',
      'The second argument of BagIn should be a bag, but instead it is:\n<<"a">>',
    ],
    [
      "BagUnion({1, 2})",
      "Attempted to apply BagUnion to the following set, whose\nelement is not a bag:\n{1, 2}",
    ],
    [
      "BagUnion(Nat)",
      "Applying BagUnion to the following value,\nwhich is not a finite enumerable set:\nNat",
    ],
    [
      "SetToBag(Nat)",
      "Applying BagToSet to the following value,\nwhich is not a function with a finite domain:\nNat",
    ],
    [
      "1 \\sqsubseteq EmptyBag",
      "Applying \\sqsubseteq to the following value,\nwhich is not a function with a finite domain:\n1",
    ],
    [
      "BagOfAll(LAMBDA n : n, 1)",
      "The second argument of BagOfAll should be a function with a finite domain, but instead it is:\n1",
    ],
    ["<<2147483647>> (+) <<1>>", "Overflow when computing 2147483647+1"],
    ['SubBag(<<"a">>)', 'The first argument of >= should be an integer, but instead it is:\n"a"'],
  ])("rejects %s", async (expression, message) => {
    const result = await checkBags(`ASSUME PrintT(${expression})`);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(message);
  });

  it.each([
    ['<<"a">> (-) EmptyBag', "tlc2.value.impl.Value tlc2.module.Bags.BagDiff"],
    ['<<"a">> \\sqsubseteq EmptyBag', "tlc2.value.IBoolValue tlc2.module.Bags.SqSubseteq"],
    ['BagOfAll(LAMBDA e : TRUE, <<"a", 1>>)', "tlc2.value.impl.Value tlc2.module.Bags.BagOfAll"],
  ])("fails to cast a count that isn't an integer in %s", async (expression, method) => {
    const result = await checkBags(`ASSUME PrintT(${expression})`);
    expect(result.violation?.message).toBe(
      `Attempted to apply the operator overridden by the Java method\npublic static ${method}(tlc2.value.impl.Value,tlc2.value.impl.Value),\nbut it produced the following error:\nclass tlc2.value.impl.StringValue cannot be cast to class tlc2.value.impl.IntValue (tlc2.value.impl.StringValue and tlc2.value.impl.IntValue are in unnamed module of loader 'app')`,
    );
  });

  it.each([
    '<<"a">> (-) EmptyBag',
    '<<"a">> \\sqsubseteq EmptyBag',
    'BagOfAll(LAMBDA e : TRUE, <<"a", 1>>)',
    "IsABag([n \\in Nat |-> 1])",
    "SubBag(<<0>>)",
  ])("fails to evaluate %s", async (expression) => {
    expect((await checkBags(`ASSUME PrintT(${expression})`)).status).toBe("assumption-violation");
  });

  it.each([
    ['BagOfAll(LAMBDA e : "c", <<1>>)', '"c"'],
    ["LET H(e) == 1 IN BagOfAll(H, <<1>>)", "1"],
    ['LET H(e) == "c"\n    G(Op(_)) == BagOfAll(Op, <<1>>)\nIN G(H)', '"c"'],
  ])("rejects an operator with a literal body in %s", async (expression, literal) => {
    const result = await checkBags(`ASSUME PrintT(${expression})`);
    expect(result.status).toBe("assumption-violation");
    expect(result.violation?.message).toBe(
      `The first argument of BagOfAll should be an operator, but instead it is:\n${literal}`,
    );
  });

  it("applies an operator whose body is not a literal", async () => {
    const result = await checkBags(
      "ASSUME BagOfAll(LAMBDA e : TRUE, <<1>>) = (TRUE :> 1)\nASSUME LET H(e) == -1 IN BagOfAll(H, <<1, 1>>) = (-1 :> 2)\nASSUME BagOfAll(LAMBDA e : C, <<1>>) = (C :> 1)",
    );
    expect(result.status).toBe("success");
  });
});

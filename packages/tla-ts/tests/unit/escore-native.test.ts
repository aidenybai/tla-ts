import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";

const ECMASCRIPT_DIRECTORY = join(import.meta.dirname, "../../ecmascript");

const CONFIG = "CONSTANTS None = None\nEmpty = Empty\nAbsent = Absent\n";

// ESCore's TLA+ under the name of the runtime, whose HeapGet, IsArrayIndex, and PropBucket tla-ts
// runs natively, and under its own name, whose operators run as written.
const loadModule = (name: string) => {
  const path = join(ECMASCRIPT_DIRECTORY, `${name === "ESRuntime" ? "ESCore" : name}.tla`);
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, "utf8");
  return name === "ESRuntime" ? text.replace("MODULE ESCore", "MODULE ESRuntime") : text;
};

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

const HEAP = "HeapOf([j \\in 1..600 |-> [id |-> j]])";

// Keys of every kind that PropBucket and IsArrayIndex tell apart: indices in each bucket, the
// largest index and the integers past it, strings that aren't indices, and symbols and objects.
const KEYS = [
  ...Array.from({ length: 1200 }, (_, index) => `Str(${getUnits(String(index))})`),
  ...Array.from({ length: 100 }, (_, index) => `Str(${getUnits(String(index * 42_949_672))})`),
  ...[
    "4294967294",
    "4294967295",
    "4294967296",
    "4294967289",
    "4294967300",
    "9999999999",
    "10000000000",
    "00",
    "01",
    "-1",
    "+1",
    "1.0",
    "1a",
    "a",
    "",
    " 1",
    "\u0661",
    "1\uff10",
  ].map((text) => `Str(${getUnits(text)})`),
  "Sym(1)",
  "Obj(1)",
  '[type |-> "string", value |-> <<97, "a">>]',
];

// Strings that CanonicalNumericIndexString tells apart: the canonical strings of integers on
// either side of 0 and 2^30, of fractions, exponents, NaN and the infinities, strings that read as
// Numbers but aren't their canonical strings, and strings that no Number's string spells.
const NUMERIC_STRINGS = [
  ...Array.from({ length: 400 }, (_, index) => String(index - 200)),
  ...Array.from({ length: 60 }, (_, index) => String((index - 30) * 35_791_394)),
  ...["1073741823", "1073741824", "-1073741823", "-1073741824", "4294967295", "9007199254740993"],
  ...["-0", "0", "00", "01", "-01", "+1", " 1", "1 ", "1.5", "-1.5", "0.5", ".5", "1e21", "1e+21"],
  ...["1e-7", "1.5e-7", "NaN", "Infinity", "-Infinity", "+Infinity", "nan", "length", "foo"],
  ...["", "-", "e", "0x10", "1_0", "\u0661", "1\uff10", "Infinityx"],
];

const getChecks = () => [
  ...NUMERIC_STRINGS.map((text) => {
    const call = `CanonicalNumericIndexString(${getUnits(text)})`;
    return `${call} = Plain!${call} /\\ ToString(${call}) = ToString(Plain!${call})`;
  }),
  ...KEYS.flatMap((key) =>
    ["PropBucket", "IsArrayIndex"].map(
      (operator) =>
        `${operator}(${key}) = Plain!${operator}(${key}) /\\ ToString(${operator}(${key})) = ToString(Plain!${operator}(${key}))`,
    ),
  ),
  // HeapGet's TLA+ reads a heap and an index lazily, so neither the page's other records nor the
  // set whose size is the index is built.
  ...[
    "HeapGet([pages |-> <<[i \\in 1..256 |-> IF i = 2 THEN CHOOSE x \\in {} : TRUE ELSE i]>>], 1)",
    "HeapGet([pages |-> <<<<5>>>>], Cardinality(DOMAIN [i \\in 1..1 |-> CHOOSE x \\in {} : TRUE]))",
  ].map((call) => `${call} = Plain!${call} /\\ ToString(${call}) = ToString(Plain!${call})`),
  `\\A i \\in 1..600 : HeapGet(${HEAP}, i) = Plain!HeapGet(${HEAP}, i) /\\ ToString(HeapGet(${HEAP}, i)) = ToString(Plain!HeapGet(${HEAP}, i))`,
];

// Whether each check holds, where the root module extends ESRuntime and instances ESCore as Plain.
const getOutcomes = async (checks: string[]) => {
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE RuntimeChecks ----\nEXTENDS ESRuntime\nPlain == INSTANCE ESCore\nASSUME PrintT(<<${checks.join(",\n")}>>)\n====`,
    config: CONFIG,
    loadModule,
    onPrint: (text) => printed.push(text),
  });
  expect(result.status).toBe("success");
  return printed.join("\n").match(/TRUE|FALSE/g) ?? [];
};

// The error that evaluating an expression in a module extending the given one stops with.
const getError = async (module: string, expression: string) =>
  (
    await check({
      source: `---- MODULE RuntimeError ----\nEXTENDS ${module}\nASSUME PrintT(${expression})\n====`,
      config: CONFIG,
      loadModule,
    })
  ).violation?.message?.replaceAll("module ESRuntime", "module ESCore");

// What a module that extends the runtime prints, under the name ESRuntime, whose operators that
// read a CONSTANT tla-ts runs natively, or under ESCore, whose operators run as written. An INSTANCE
// such as Plain would run the TLA+ of both.
const getPrinted = async (module: string, body: string, config = CONFIG) => {
  const printed: string[] = [];
  const result = await check({
    source: `---- MODULE Twin ----\nEXTENDS ${module}\n${body}\n====`,
    config,
    loadModule,
    onPrint: (text) => printed.push(text),
  });
  return [result.status, result.violation?.message, ...printed];
};

const OWN_PROPERTIES = `Object(pairs) == WithDataProps(MakeObject(Null, "ordinary", <<>>), pairs)
Objects == <<Object(<<>>),
             Object([j \\in 1..120 |-> <<Str(IntToRadix(j * 7, 10)), Num(NumIntNum(j))>>]),
             Object(<<<<Sym(1), True>>, <<Str(<<97>>), False>>>>)>>
Keys == <<Str(<<97>>), Str(<<98>>), Sym(1), Sym(2), Str(<<>>)>> \\o [n \\in 1..900 |-> Str(IntToRadix(n - 1, 10))]
ASSUME PrintT([i \\in 1..Len(Objects) |-> [j \\in 1..Len(Keys) |->
  ToString(OrdinaryGetOwnProperty(Objects[i], Keys[j]))]])`;

describe("runs ESCore's native operators as their TLA+ does", () => {
  it("gives the values the TLA+ gives", { timeout: 120_000 }, async () => {
    const checks = getChecks();
    expect(await getOutcomes(checks)).toEqual(checks.map(() => "TRUE"));
  });

  it.each([
    ["the CONSTANTS the configuration gives", CONFIG],
    ["Absent bound to a value", "CONSTANTS None = None\nEmpty = Empty\nAbsent = 8\n"],
  ])(
    "reads an object's own properties, and Absent, as the TLA+ does under %s",
    { timeout: 120_000 },
    async (_, config) => {
      const expected = await getPrinted("ESCore", OWN_PROPERTIES, config);
      expect(expected[0]).toBe("success");
      expect(await getPrinted("ESRuntime", OWN_PROPERTIES, config)).toEqual(expected);
    },
  );

  it.each([
    ["PropBucket of a key that isn't a record", "PropBucket(3)"],
    [
      "IsArrayIndex of a string whose units aren't integers",
      'IsArrayIndex([type |-> "string", value |-> <<49, "a">>])',
    ],
    ["HeapGet of an address past the heap", `HeapGet(${HEAP}, 601)`],
    [
      "CanonicalNumericIndexString of units that aren't integers",
      'CanonicalNumericIndexString(<<49, "a">>)',
    ],
    ["OrdinaryGetOwnProperty of an object without props", "OrdinaryGetOwnProperty(3, Str(<<97>>))"],
    [
      "OrdinaryGetOwnProperty of a bucket that isn't a function",
      "OrdinaryGetOwnProperty([props |-> (-1 :> 5)], Str(<<97>>))",
    ],
    [
      "CanonicalNumericIndexString of a lazy function",
      "CanonicalNumericIndexString([i \\in Nat |-> 49])",
    ],
  ])("fails as the TLA+ fails on %s", { timeout: 120_000 }, async (_, expression) => {
    const error = await getError("ESCore", expression);
    expect(error).toBeDefined();
    expect(await getError("ESRuntime", expression)).toBe(error);
  });
});

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
  "1073741823",
  "1073741824",
  "-1073741823",
  "-1073741824",
  "4294967295",
  "9007199254740993",
  "-0",
  "0",
  "00",
  "01",
  "-01",
  "+1",
  " 1",
  "1 ",
  "1.5",
  "-1.5",
  "0.5",
  ".5",
  "1e21",
  "1e+21",
  "1e-7",
  "1.5e-7",
  "NaN",
  "Infinity",
  "-Infinity",
  "+Infinity",
  "nan",
  "length",
  "foo",
  "",
  "-",
  "e",
  "0x10",
  "1_0",
  "\u0661",
  "1\uff10",
  "Infinityx",
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
  return [
    result.status,
    result.violation?.message?.replaceAll("module ESRuntime", "module ESCore"),
    ...printed,
  ];
};

const OWN_PROPERTIES = `Object(pairs) == WithDataProps(MakeObject(Null, "ordinary", <<>>), pairs)
Objects == <<Object(<<>>),
             Object([j \\in 1..120 |-> <<Str(IntToRadix(j * 7, 10)), Num(NumIntNum(j))>>]),
             Object(<<<<Sym(1), True>>, <<Str(<<97>>), False>>>>)>>
Keys == <<Str(<<97>>), Str(<<98>>), Sym(1), Sym(2), Str(<<>>)>> \\o [n \\in 1..900 |-> Str(IntToRadix(n - 1, 10))]
ASSUME PrintT([i \\in 1..Len(Objects) |-> [j \\in 1..Len(Keys) |->
  ToString(OrdinaryGetOwnProperty(Objects[i], Keys[j]))]])`;

// A state's environments and objects, of each kind that HasBinding and GetBindingValue tell apart:
// an ordinary global object and a declarative part, with an initialized binding and one that
// isn't, function, module, and catch environments, an import, a with statement's object
// environment, an accessor, and a proxy, as the global environment's object and as an object
// environment's.
const BINDING_STATE = `Name(j) == <<97 + (j % 26)>> \\o IntToRadix(j, 10)
Desc(v) == DataDesc(v, TRUE, TRUE, TRUE)
GlobalObject == WithDataProps(MakeObject(Null, "ordinary", <<>>), [j \\in 1..40 |-> <<Str(Name(j)), Num(NumIntNum(j))>>])
AccessorObject == PutProp(WithDataProps(MakeObject(Null, "ordinary", <<>>), <<<<Str(<<100>>), True>>>>), Str(<<103>>), AccessorDesc(Undefined, Undefined, TRUE, TRUE))
ProxyObject == WithDataProps(MakeObject(Null, "proxy", [target |-> Obj(1), handler |-> Obj(1)]), <<<<Str(Name(41)), True>>>>)
Declarative == (<<120>> :> Binding(Num(NumIntNum(5)), TRUE, TRUE, FALSE, FALSE)) @@ (<<121>> :> Binding(Undefined, TRUE, FALSE, FALSE, FALSE))
Envs == <<[kind |-> "object", outer |-> 0, obj |-> Obj(1), withEnv |-> FALSE],
          [kind |-> "declarative", outer |-> 0, b |-> Declarative],
          [kind |-> "global", outer |-> 0, objRec |-> 1, declRec |-> 2],
          [kind |-> "object", outer |-> 0, obj |-> Obj(2), withEnv |-> FALSE],
          [kind |-> "function", outer |-> 0, b |-> Declarative, this |-> Undefined, thisStatus |-> "lexical", fn |-> Obj(1), newTarget |-> Undefined],
          [kind |-> "module", outer |-> 0, b |-> (<<105>> :> Binding([type |-> "import", module |-> 1, name |-> <<120>>], FALSE, TRUE, TRUE, FALSE)) @@ (<<120>> :> Binding(True, TRUE, TRUE, TRUE, FALSE)), module |-> 1],
          [kind |-> "object", outer |-> 0, obj |-> Obj(1), withEnv |-> TRUE],
          [kind |-> "catch", outer |-> 0, b |-> <<>>],
          [kind |-> "object", outer |-> 0, obj |-> Obj(3), withEnv |-> FALSE],
          [kind |-> "global", outer |-> 0, objRec |-> 9, declRec |-> 2]>>
State == [envs |-> HeapOf(Envs), objs |-> HeapOf(<<GlobalObject, AccessorObject, ProxyObject>>)]`;

const BINDINGS = `${BINDING_STATE}
Names == <<<<120>>, <<121>>, <<122, 122>>, <<100>>>> \\o [j \\in 1..45 |-> Name(j)]
ASSUME PrintT(<<
  [e \\in {1, 2, 3, 4, 5, 6, 8} |-> [j \\in 1..Len(Names) |-> ToString(HasBinding(State, e, Names[j]))]],
  [j \\in 1..41 |-> ToString(GetBindingValue(State, 1, Names[j + 4], FALSE))],
  [j \\in 1..40 |-> ToString(GetBindingValue(State, 3, Names[j + 4], TRUE))],
  [e \\in {2, 3, 5, 6} |-> ToString(GetBindingValue(State, e, <<120>>, CHOOSE x \\in {} : TRUE))],
  ToString(GetBindingValue(State, 1, <<122, 122>>, FALSE)),
  ToString(GetBindingValue(State, 4, <<100>>, FALSE)),
  ToString(GetBindingValue(State, 4, <<103>>, FALSE)),
  ToString(HasBinding(State, 9, Name(41))),
  ToString(HasBinding(State, 10, Name(41))),
  ToString(GetBindingValue(State, 10, Name(41), FALSE))
>>)`;

describe("runs ESCore's native operators as their TLA+ does", () => {
  it("gives the values the TLA+ gives", { timeout: 120_000 }, async () => {
    const checks = getChecks();
    expect(await getOutcomes(checks)).toEqual(checks.map(() => "TRUE"));
  });

  it.each([
    ["the CONSTANTS the configuration gives", CONFIG],
    ["Empty bound to a value", "CONSTANTS None = None\nEmpty = 9\nAbsent = Absent\n"],
  ])("reads bindings as the TLA+ does under %s", { timeout: 180_000 }, async (_, config) => {
    const expected = await getPrinted("ESCore", BINDINGS, config);
    expect(expected[0]).toBe("success");
    expect(await getPrinted("ESRuntime", BINDINGS, config)).toEqual(expected);
  });

  it.each([
    ["an uninitialized binding", "GetBindingValue(State, 2, <<121>>, FALSE)"],
    ["a missing global in strict code", "GetBindingValue(State, 1, <<122, 122>>, TRUE)"],
    [
      "a strict that fails where it's read",
      "GetBindingValue(State, 1, <<122, 122>>, CHOOSE x \\in {} : TRUE)",
    ],
    ["an environment past the heap", "HasBinding(State, 11, CHOOSE x \\in {} : TRUE)"],
  ])("fails as the TLA+ fails on %s", { timeout: 180_000 }, async (_, expression) => {
    const body = `${BINDING_STATE}\nASSUME PrintT(${expression})`;
    const expected = await getPrinted("ESCore", body);
    expect(expected[1]).toBeDefined();
    expect(await getPrinted("ESRuntime", body)).toEqual(expected);
  });

  // The TLA+ compares a descriptor with Absent before its value, which fails where Absent is a
  // number.
  it(
    "fails as the TLA+ fails on a global's value where Absent is a number",
    { timeout: 180_000 },
    async () => {
      const body = `${BINDING_STATE}\nASSUME PrintT(GetBindingValue(State, 1, Name(1), FALSE))`;
      const config = "CONSTANTS None = None\nEmpty = Empty\nAbsent = 9\n";
      const expected = await getPrinted("ESCore", body, config);
      expect(expected[1]).toBeDefined();
      expect(await getPrinted("ESRuntime", body, config)).toEqual(expected);
    },
  );

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

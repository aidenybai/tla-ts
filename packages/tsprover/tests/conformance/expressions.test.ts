import { describe, expect, it } from "vite-plus/test";
import { evaluateExpression } from "./harness";

// Each expression evaluates the same in JavaScript and in the TLA+ that tsprover compiles it to.
const CASES: Record<string, (string | [string, string])[]> = {
  numbers: [
    "1 + 2 * 3 - 4",
    "2 ** 10",
    "-(3 - 5)",
    "7 % 3",
    "-7 % 3",
    "7 % -3",
    "-7 % -3",
    "0 % 5",
    "Math.floor(7 / 2)",
    "Math.floor(-7 / 2)",
    "Math.trunc(7 / 2)",
    "Math.trunc(-7 / 2)",
    "Math.trunc(7 / -2)",
    "Math.abs(-4)",
    "Math.abs(4)",
    "Math.min(3, 1, 2)",
    "Math.max(3, 1, 2)",
    "Math.min(...[4, 2, 8])",
    "Math.max(...new Set([4, 2, 8]))",
    "Math.abs(2 - 7)",
    "Math.max(1 + 1, 5 - 4, 2 * 2, -3)",
    "Math.min(...[4, 2, 8].map((value) => value - 5))",
    "[1 < 2, 2 <= 2, 3 > 4, 4 >= 5]",
  ],
  booleans: [
    "true && false",
    "true || false",
    "!true",
    ["one === 1 && two !== 3", "const one: number = 1;\nconst two: number = 2;"],
    "(1 > 2) === false",
    "3 > 2 ? 10 : 20",
    "3 < 2 ? 10 : 20",
  ],
  "null and undefined": [
    "null",
    "undefined",
    ["value ?? 5", "const value: number | null = null as number | null;"],
    ["value ?? 5", "const value: number | undefined = 3 as number | undefined;"],
    ["(value ?? 2) * (value ?? 3)", "const value: number | null = null as number | null;"],
    ["value === null", "const value: number | null = null as number | null;"],
  ],
  strings: [
    '"tla" + "+"',
    '"a" + 1',
    "`x${1}y${'z'}`",
    "`${[1, 2].length} items`",
    '"hello".length',
    ['letter === "a"', 'const letter: string = "a";'],
    ['letter !== "b"', 'const letter: string = "a";'],
  ],
  arrays: [
    "[]",
    "[1, 2, 3]",
    "[[1, 2], [3]]",
    "[...[1, 2], 3, ...[4]]",
    "[1, 2, 3][0]",
    "[1, 2, 3][2]",
    "[1, 2, 3].length",
    "[1, 2, 3].at(-1)",
    "[1, 2, 3].at(0)",
    "[1, 2, 3].at(5)",
    "[1, 2, 3].includes(2)",
    "[1, 2, 3].includes(4)",
    "[3, 1, 3].indexOf(3)",
    "[3, 1, 3].indexOf(4)",
    "[1, 2, 3].map((value) => value * 2).indexOf(2 + 2)",
    "[1, 2, 3].filter((value) => value > 1).at(-1)",
    "[1, 2, 3, 4].slice(1)",
    "[1, 2, 3, 4].slice(1, 3)",
    "[1, 2, 3, 4].slice(-2)",
    "[1, 2, 3, 4].slice(1, -1)",
    "[1, 2, 3, 4].slice(0, 10)",
    "[1, 2, 3, 4].slice(3, 1)",
    "[1, 2].concat([3], 4)",
    "[1, 2, 3].with(1, 9)",
    "[1, 2, 3].toReversed()",
    "[1, 2, 3].map((value) => value * 2)",
    "[5, 6].map((value, index) => value + index)",
    "[1, 2, 3, 4].filter((value) => value % 2 === 0)",
    "[1, 2, 3].every((value) => value > 0)",
    "[1, 2, 3].some((value) => value > 2)",
    "[1, 2, 3].some((value, index) => index === 2 && value === 3)",
    "[].every((value) => value > 0)",
    "[4, 5, 6].find((value) => value > 4)",
    "[4, 5, 6].find((value) => value > 9)",
    "[4, 5, 6].findIndex((value) => value > 4)",
    "[4, 5, 6].findIndex((value) => value > 9)",
    "Array.from({ length: 3 }, (_, index) => index * index)",
    "Array(3).fill(7)",
    "new Array(2).fill(false)",
    "[[1, 2], [3, 4]].map((pair) => pair[0] + pair[1])",
    "[[1, 2], [3, 4]].map(([first, second]) => first * second)",
  ],
  sets: [
    "new Set()",
    "new Set([1, 2, 2, 3])",
    "new Set([3, 1, 2])",
    "new Set([1, 2]).has(2)",
    "new Set([1, 2]).has(3)",
    "new Set([1, 2, 2]).size",
    "new Set([1, 2]).union(new Set([2, 3]))",
    "new Set([1, 2]).intersection(new Set([2, 3]))",
    "new Set([1, 2]).difference(new Set([2, 3]))",
    "new Set([1, 2]).symmetricDifference(new Set([2, 3]))",
    "new Set([1]).isSubsetOf(new Set([1, 2]))",
    "new Set([1, 3]).isSubsetOf(new Set([1, 2]))",
    "new Set([1, 2]).isSupersetOf(new Set([1]))",
    "new Set([1]).isDisjointFrom(new Set([2]))",
    "new Set([1, 2]).isDisjointFrom(new Set([2]))",
    "[...new Set([1, 2, 3])].filter((value) => value > 1).length",
    "new Set([...new Set([1, 2, 3])].map((value) => value % 2))",
    "new Set([1, 2, 3].map((value) => value % 2))",
    "new Set([1, 2, 3]).values().every((value) => value < 4)",
    "new Set([1, 2, 3]).values().some((value) => value === 2)",
    "new Set([1, 2, 3]).values().filter((value) => value !== 2).toArray().length",
    "[...new Set([1, 2, 3])].includes(2)",
    "new Set([5]).values().find((value) => value > 1)",
    "new Set([5]).values().find((value) => value > 9)",
    "new Set([1, 2]).add(3)",
    "new Set([1, 2]).has(1) === new Set([2, 1]).has(1)",
  ],
  maps: [
    "new Map()",
    "new Map([['a', 1], ['b', 2]])",
    "new Map([['a', 1], ['a', 2]])",
    "new Map([['a', 1]]).get('a')",
    "new Map([['a', 1]]).get('b')",
    "new Map([['ab', 1]]).get('a' + 'b')",
    "new Map([['a', 1]]).has('a')",
    "new Map([['a', 1]]).has('b')",
    "new Map([['a', 1], ['b', 2]]).size",
    "new Set(new Map([['a', 1], ['b', 2]]).keys())",
    "new Set(new Map([['a', 1], ['b', 1]]).values())",
    "new Set(new Map([['a', 1]]).entries())",
    "new Map(new Set([1, 2]).values().map((key) => [key, key * 10]))",
    "new Map(new Map([['a', 1]])).set('b', 2)",
  ],
  records: [
    "{ a: 1, b: 'x' }",
    "{ a: { b: [1, 2] } }",
    "{ ...{ a: 1, b: 2 }, b: 3 }",
    "{ ...{ a: 1 }, ...{ b: 2 } }",
    "{ a: 1, b: 2 }.b",
    "{ a: 1, b: 2 }['a']",
    "new Set(Object.keys({ a: 1, b: 2 }))",
    "new Set(Object.values({ a: 1, b: 1 }))",
    "new Set(Object.entries({ a: 1 }))",
    "new Set([1, 2, 3].filter((value) => value > 1).map((value) => value * 10))",
    "'a' in { a: 1 }",
    "Object.fromEntries(new Set(['a', 'b']).values().map((key) => [key, key + '!']))",
    "({ 1: 'one', 2: 'two' })[2]",
  ],
  helpers: [
    ["double(4)", "const double = (value: number) => value * 2;"],
    [
      "factorial(5)",
      "const factorial = (value: number): number => (value <= 1 ? 1 : value * factorial(value - 1));",
    ],
    [
      "apply((value) => value + 1, 2)",
      "const apply = (fn: (value: number) => number, value: number) => fn(value);",
    ],
    ["[1, 2, 3].filter(isOdd)", "const isOdd = (value: number) => value % 2 !== 0;"],
    ["LIMIT * 2", "const LIMIT = 21;"],
    [
      "classify(5)",
      `function classify(value: number) {
        if (value < 0) return "negative";
        const half = Math.floor(value / 2);
        if (half * 2 === value) return "even";
        return "odd";
      }`,
    ],
    [
      "describe(Color.Green)",
      `enum Color { Red, Green }
      const describe = (color: Color) => {
        switch (color) {
          case Color.Red:
            return "red";
          default:
            return "other";
        }
      };`,
    ],
    [
      "sum([1, 2, 3])",
      "const sum = (values: number[]): number => (values.length === 0 ? 0 : values[0] + sum(values.slice(1)));",
    ],
    [
      "getLength({ x: 3, y: 4 })",
      "const getLength = (point: { x: number; y: number }) => { const { x, y } = point; return x * x + y * y; };",
    ],
    [
      "count(new Set([1, 2, 3]))",
      "const count = (values: Set<number>) => { const isLarge = (value: number) => value > 1; return [...values].filter(isLarge).length; };",
    ],
  ],
};

describe.each(Object.entries(CASES))("%s", (_, cases) => {
  it.each(cases.map((entry) => (typeof entry === "string" ? [entry, ""] : entry)))(
    "%s",
    async (expression, setup) => {
      const result = await evaluateExpression(expression, setup);
      expect(result.actual).toBe(result.expected);
    },
  );
});

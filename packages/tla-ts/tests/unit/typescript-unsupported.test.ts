import { describe, expect, it } from "vite-plus/test";
import { check } from "../../src";
import { TlaTypeScriptError } from "../../src/errors";
import { compile } from "../../src/typescript/compile";

const CASES: [string, string][] = [
  ["for-in loops", "for (const key in record) count++;"],
  ["for-of loops over a set", "for (const value of new Set([1, 2])) count += value;"],
  [
    "a Set of numbers and strings",
    'const mixed = new Set<number | string>([1, "a"]); count = mixed.size;',
  ],
  ["changing an array a for-of iterates", "for (const value of values) values.pop();"],
  ["division", "count = count / 2;"],
  ["fractions", "count = 1.5;"],
  ["negative zero", "count = -0;"],
  ["incrementing a value that isn't a number", "let value: any = true; value++; count = value;"],
  ["integers past 32 bits", "count = 2147483648;"],
  ["object rest elements", "const { a, ...others } = record; count = a ?? 0;"],
  ["a callback's rest parameter", "values = values.map((...items: number[]) => items.length);"],
  ["string methods as values", "count = label.includes.length;"],
  ["properties of functions", "count = step.length;"],
  ["converting an array to a string", "label = `${values}`;"],
  ["delete", "delete record.a;"],
  ["throwing an array", "try { throw values; } catch { count = 0; }"],
  [
    "yielding inside a loop",
    "const make = function* () { for (const value of values) yield; }; make().next();",
  ],
  [
    "an array typed as an object with other properties",
    "const descriptor: PropertyDescriptor = []; count = descriptor.enumerable === true ? 1 : 0;",
  ],
  ["calling an async function", "const run = async () => { count++; }; run();"],
  [
    "reassigning a function inside a loop",
    "let run: () => void; run = () => { count++; }; for (const value of [1]) run = () => { count--; };",
  ],
  [
    "reading a variable that holds a function",
    "let run: () => void; run = () => { count++; }; const other = run; other();",
  ],
  ["assigning a function to a state variable", "label = () => 'a';"],
  [
    "an unsupported value returned from an inlined call",
    "const getLength = () => { return step.length; }; getLength();",
  ],
  [
    "instanceof on a value that isn't caught, an error, or of type unknown or any",
    "const value: object = record; if (value instanceof Error) count = 1;",
  ],
  [
    "a break past the nearest loop",
    "outer: for (const value of values) { for (const other of values) { count++; break outer; } }",
  ],
  ["an increment after a comma", "count = (label, count++);"],
  ["returning a value from an action", "count++; return count;"],
  ["assigning a constant", "LIMIT = 3;"],
  ["calling an action from an action", "step();"],
  ["a method that reads this", "class Box { size() { return this; } } new Box().size();"],
  [
    "a method of a class with fields",
    "class Box { size = 1; grow() { count++; } } new Box().grow();",
  ],
  ["a conversion to a fraction", "count = Number('1.5');"],
  ["reading a property of a built-in prototype", "count = Array.prototype.length;"],
  [
    "reading a property of a prototype in a variable",
    "const proto = Object.getPrototypeOf(values); count = proto.length;",
  ],
  [
    "the prototype of a value whose type doesn't tell",
    "const value: unknown = count; label = String(Object.getPrototypeOf(value) === null);",
  ],
  ["a callback parameter with a default", "count = [undefined].map((value = 1) => value)[0];"],
  ["a callback rest parameter", "count = [1].map((...values) => values.length)[0];"],
  [
    "a callback array parameter typed as an object",
    "count = [1].filter((_, __, array: { length: number }) => array.length === 1).length;",
  ],
  ["a conversion whose type is unknown", "const value: unknown = label; count = Number(value);"],
  ["an unknown call in a callback", "values = values.map(() => Math.random());"],
];

it.each(CASES)("rejects %s", (_, statements) => {
  const model = `
    const LIMIT = 2;
    let count = 0;
    let label = "a";
    let values = [3, 1, 2];
    let record: { a?: number } = { a: 1 };
    export const step = () => {
      ${statements}
    };
  `;
  expect(() => compile(model)).toThrow(TlaTypeScriptError);
  expect(() => compile(model)).toThrow(/spec\.ts[:(]8[:,]/);
});

describe("adds a value of type any to a number as JavaScript does", () => {
  const getModel = (bound: number) => `
    let count = 0;
    export const step = () => {
      if (count >= 2) return;
      const value: any = true;
      count = count + value;
    };
    export const isSmall = () => count <= ${bound};
  `;

  it("agrees with Node", async () => {
    const result = await check(compile(getModel(2)));
    expect([result.status, result.distinctStates]).toEqual(["deadlock", 3]);
  });

  it("rejects a smaller bound", async () => {
    expect((await check(compile(getModel(1)))).status).toBe("invariant-violation");
  });
});

it("stops where a let is used before its declaration in try", async () => {
  const result = await check(
    compile(`
      let count = 0;
      export const step = () => {
        try { const read = () => later; count = read(); } catch { count = 0; } let later = 1;
      };
    `),
  );
  expect(result.failure?.message).toContain(
    "tla-ts can't throw the ReferenceError of reading later before its declaration",
  );
});

describe.each([
  ["an object that then changes", "let other = record; other.a = 2; count = record.a ?? 0;", 2],
  [
    "an element that then changes",
    "let rows = [[1]]; const row = rows[0]; rows[0].push(2); count = row.length;",
    2,
  ],
  [
    "an object that an array stores and then changes",
    "let rows = [values]; rows[0].push(4); count = values.length;",
    4,
  ],
])("shares %s on the heap, as Node does", (_, statements, expected) => {
  const getModel = (bound: number) => `
    let count = 0;
    let values = [3, 1, 2];
    let record: { a?: number } = { a: 1 };
    export const step = () => {
      if (count !== 0) return;
      ${statements}
    };
    export const isShared = () => count === 0 || count === ${bound};
  `;

  it("agrees with Node", async () => {
    expect((await check(compile(getModel(expected)))).failure).toBeUndefined();
  });

  it("rejects a copy", async () => {
    expect((await check(compile(getModel(expected - 1)))).status).toBe("invariant-violation");
  });
});

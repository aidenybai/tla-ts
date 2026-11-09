import { expect, it } from "vite-plus/test";
import { TlaTypeScriptError } from "../../src/errors";
import { compile } from "../../src/typescript/compile";

// TypeScript with no TLA+ equivalent fails to compile with a TlaTypeScriptError at the construct, rather
// than producing a spec that TLC rejects or that means something else.
const CASES: [string, string][] = [
  ["for-in loops", "for (const key in record) count++;"],
  ["for-of loops over a set", "for (const value of new Set([1, 2])) count += value;"],
  [
    "a Set of numbers and strings",
    'const mixed = new Set<number | string>([1, "a"]); count = mixed.size;',
  ],
  ["returning from a loop", "while (count < 2) { count++; return; }"],
  ["changing an array a for-of iterates", "for (const value of values) values.pop();"],
  ["division", "count = count / 2;"],
  ["fractions", "count = 1.5;"],
  ["negative zero", "count = -0;"],
  ["arithmetic on a value that isn't a number", "const value: any = true; count = count + value;"],
  ["incrementing a value that isn't a number", "let value: any = true; value++; count = value;"],
  ["integers past 32 bits", "count = 2147483648;"],
  ["object rest elements", "const { a, ...others } = record; count = a ?? 0;"],
  ["a callback's rest parameter", "values = values.map((...items: number[]) => items.length);"],
  ["string methods as values", "count = label.includes.length;"],
  ["properties of functions", "count = step.length;"],
  ["converting an array to a string", "label = `${values}`;"],
  ["bitwise and", "count = count & 1;"],
  ["bitwise or", "count = count | 1;"],
  ["bitwise xor", "count = count ^ 1;"],
  ["shifts", "count = count << 1;"],
  ["bitwise not", "count = ~count;"],
  ["delete", "delete record.a;"],
  ["optional chaining", "count = record?.a ?? 0;"],
  [
    "a call that throws inside an expression in try",
    "const getChecked = (): number => { throw new Error('no'); }; try { count = getChecked(); } catch { count = 0; }",
  ],
  ["throwing an array", "try { throw values; } catch { count = 0; }"],
  [
    "yielding inside a loop",
    "const make = function* () { for (const value of values) yield; }; make().next();",
  ],
  ["delegating a yield", "const make = function* () { yield* [1]; }; make().next();"],
  ["calling an async function", "const run = async () => { count++; }; run();"],
  [
    "a var that redeclares a catch parameter",
    "try { throw 1; } catch (error) { for (var error of [1]) count = 1; }",
  ],
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
    "nested destructuring in try",
    "try { const [[first]] = [values]; count = first; } catch { count = 0; }",
  ],
  [
    "a let used before its declaration in try",
    "try { const read = () => later; count = read(); } catch { count = 0; } let later = 1;",
  ],
  [
    "throwing out of a loop to a catch",
    "try { while (count < 2) { throw new Error('a'); } } catch { count = 0; }",
  ],
  [
    "instanceof on a value that isn't caught or an error",
    "const value: unknown = count; if (value instanceof Error) count = 1;",
  ],
  ["labels", "outer: { count++; }"],
  ["comma expressions", "count = (count++, count);"],
  ["sort", "values.sort();"],
  ["reverse", "values.reverse();"],
  ["splice", "values.splice(0, 1);"],
  ["array length assignment", "values.length = 0;"],
  ["string comparison", "if (label < 'b') count++;"],
  ["returning a value from an action", "count++; return count;"],
  ["assigning a constant", "LIMIT = 3;"],
  ["calling an action from an action", "step();"],
  [
    "sharing an object that then changes",
    "let other = record; other.a = 2; count = record.a ?? 0;",
  ],
  [
    "sharing an element that then changes",
    "let rows = [[1]]; const row = rows[0]; rows[0].push(2); count = row.length;",
  ],
  [
    "storing an object that then changes",
    "let rows = [values]; rows[0].push(4); count = values.length;",
  ],
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
  ["indexing an array with a string", 'count = values["0"] ?? 0;'],
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
  // The error points at the statement, on line 8, as either a compile or a TypeScript type error.
  expect(() => compile(model)).toThrow(/spec\.ts[:(]8[:,]/);
});

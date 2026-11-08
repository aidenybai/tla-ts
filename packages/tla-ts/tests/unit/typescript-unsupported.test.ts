import { expect, it } from "vite-plus/test";
import { TlaTypeScriptError } from "../../src/errors";
import { compile } from "../../src/typescript/compile";

// TypeScript with no TLA+ equivalent fails to compile with a TlaTypeScriptError at the construct, rather
// than producing a spec that TLC rejects or that means something else.
const CASES: [string, string][] = [
  ["for loops", "for (let index = 0; index < 2; index++) count++;"],
  ["for-of loops", "for (const value of [1, 2]) count += value;"],
  ["while loops", "while (count < 2) count++;"],
  ["do loops", "do { count++; } while (count < 2);"],
  ["division", "count = count / 2;"],
  ["fractions", "count = 1.5;"],
  ["negative zero", "count = -0;"],
  ["integers past 32 bits", "count = 2147483648;"],
  ["rest parameters", "const add = (...more: number[]) => more.length; count = add(1, 2);"],
  ["string methods as values", "count = label.includes.length;"],
  ["properties of functions", "count = step.length;"],
  ["converting an array to a string", "label = `${values}`;"],
  ["bitwise and", "count = count & 1;"],
  ["bitwise or", "count = count | 1;"],
  ["bitwise xor", "count = count ^ 1;"],
  ["shifts", "count = count << 1;"],
  ["bitwise not", "count = ~count;"],
  ["typeof", "label = typeof count;"],
  ["delete", "delete record.a;"],
  ["optional chaining", "count = record?.a ?? 0;"],
  ["try", "try { count++; } catch { count--; }"],
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
  ["an unknown call in a callback", "values = values.map(() => Math.random());"],
  ["a test that doesn't return a boolean", "values = values.filter((value) => value);"],
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

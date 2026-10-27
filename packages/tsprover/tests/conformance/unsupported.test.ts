import { expect, it } from "vite-plus/test";
import { compile, TsproverError } from "../../src";

// TypeScript with no TLA+ equivalent fails to compile with a TsproverError at the construct, rather
// than producing a spec that TLC rejects or that means something else.
const CASES: [string, string][] = [
  ["for loops", "for (let index = 0; index < 2; index++) count++;"],
  ["for-of loops", "for (const value of [1, 2]) count += value;"],
  ["while loops", "while (count < 2) count++;"],
  ["do loops", "do { count++; } while (count < 2);"],
  ["division", "count = count / 2;"],
  ["fractions", "count = 1.5;"],
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
  ["Math.random", "count = Math.random();"],
  ["sort", "values.sort();"],
  ["reverse", "values.reverse();"],
  ["splice", "values.splice(0, 1);"],
  ["array length assignment", "values.length = 0;"],
  ["string comparison", "if (label < 'b') count++;"],
  ["string methods", "label = label.toUpperCase();"],
  ["Date", "count = new Date().getTime();"],
  ["returning a value from an action", "count++; return count;"],
  ["assigning a constant", "LIMIT = 3;"],
  ["calling an action from an action", "step();"],
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
  expect(() => compile(model)).toThrow(TsproverError);
  // The error points at the statement, on line 8, as either a tsprover or a TypeScript error.
  expect(() => compile(model)).toThrow(/spec\.ts[:(]8[:,]/);
});

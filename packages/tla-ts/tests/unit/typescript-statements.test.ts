import { describe, expect, it } from "vite-plus/test";
import { runStatements } from "./typescript-harness";

interface Case {
  variables: string;
  statements: string;
  setup?: string;
}

// Each action body changes the variables the same way in JavaScript and in the TLA+ that tla-ts compiles it to.
const CASES: Record<string, Case[]> = {
  assignments: [
    { variables: "count = 1", statements: "count = 5;" },
    { variables: "count = 1", statements: "count = count + 1; count = count * 3;" },
    { variables: "count = 10", statements: "count += 2; count -= 5; count *= 3;" },
    { variables: "count = 0", statements: "count++; count++; count--;" },
    { variables: "count = 0", statements: "++count; --count; ++count;" },
    { variables: "label = 'a'", statements: "label += 'b'; label = label + label;" },
    { variables: "label = 'a'", statements: "label += 1; label += true;" },
    { variables: "isOn = false", statements: "isOn = !isOn;" },
    { variables: "count = 0", statements: "let next: number | undefined; next = 3; count = next;" },
    { variables: "isEqual = false, count = 2", statements: "isEqual = count === 2;" },
    { variables: "first = 1, second = 2", statements: "[first, second] = [second, first];" },
    {
      variables: "first = 1, second = 2, third = 3",
      statements: "[first, second, third] = [third, first, second];",
    },
    {
      variables: "first = 0, second = 0",
      statements: "[first, second] = pair;",
      setup: "const pair: [number, number] = [4, 5];",
    },
    {
      variables: "first = 0, second = 0",
      statements: "({ first, second } = { first: 7, second: 8 });",
    },
    {
      variables: "first = 0, second = 0",
      statements:
        "const pairs: { first?: number; second?: number }[] = [{ second: 3 }]; ({ first = 5, second = 6 } = pairs[0]);",
    },
    {
      variables: "first = 0, second = 0",
      statements: "const values: number[] = [1]; [first = 5, second = first] = values;",
    },
  ],
  "top-level patterns": [
    {
      variables: "copy = 0",
      statements: "copy = first * 100 + second * 10 + rest.length;",
      setup: "let [first, second, ...rest] = [1, 2, 3, 4];",
    },
    {
      variables: "copy = 0",
      statements: "copy = x * 10 + y;",
      setup: "const { x, y = 5 }: { x: number; y?: number } = { x: 1 };",
    },
  ],
  "fields and indexes": [
    { variables: "point = { x: 1, y: 2 }", statements: "point.x = 5; point.y += point.x;" },
    { variables: "point = { x: 1, y: 2 }", statements: "point = { ...point, y: 9 };" },
    {
      variables: "nested = { inner: { value: 1 }, other: 2 }",
      statements: "nested.inner.value++;",
    },
    { variables: "values = [1, 2, 3]", statements: "values[1] = 9; values[0] += values[2];" },
    {
      variables: "grid = [[1, 2], [3, 4]]",
      statements: "grid[1][0] = 7;",
    },
    {
      variables: "balances: Record<'a' | 'b', number> = { a: 1, b: 2 }",
      statements: "balances['a'] -= 1; balances.b += 1;",
    },
    {
      variables: "flags: Record<1 | 2, boolean> = { 1: false, 2: false }",
      statements: "flags[2] = true;",
    },
    { variables: "values: number[] = [1]", statements: "values[1] = 2; values[2] = values[0];" },
  ],
  loops: [
    {
      variables: "count = 0",
      statements: "for (let index = 0; index < 3; index++) count += index;",
    },
    { variables: "count = 0", statements: "for (const value of [4, 5, 6]) count += value;" },
    { variables: "count = 0", statements: "while (count < 5) count += 2;" },
    { variables: "count = 9", statements: "do { count++; } while (count < 5);" },
    { variables: "count = 9", statements: "while (count < 5) count++;" },
    {
      variables: "count = 0, total = 0",
      statements:
        "for (let index = 0; ; index++) { if (index === 4) break; if (index % 2 === 0) continue; count++; total += index; }",
    },
    {
      variables: "values: number[] = []",
      statements: "for (const [first, second] of [[1, 2], [3, 4]]) values.push(first * second);",
    },
    {
      variables: "count = 0, last = 0",
      statements: "for (last of [4, 5, 6]) count += last;",
    },
    {
      variables: "count = 0",
      statements: "let index = 0; while (true) { index++; if (index > 3) break; count += index; }",
    },
  ],
  arrays: [
    { variables: "queue: number[] = [1]", statements: "queue.push(2); queue.push(3, 4);" },
    { variables: "queue = [1, 2, 3]", statements: "queue.pop(); queue.shift();" },
    { variables: "queue = [3]", statements: "queue.unshift(1, 2);" },
    {
      variables: "queue = [1, 2, 3], head = 0",
      statements: "const first = queue.shift()!; head = first;",
    },
    {
      variables: "queue = [1, 2, 3], tail = 0",
      statements: "const last = queue.pop()!; tail = last * 10;",
    },
    {
      variables: "queue = [1, 2], received: number[] = []",
      statements: "received = [...received, queue[0]]; queue = queue.slice(1);",
    },
  ],
  aliasing: [
    {
      variables: "count = 0",
      statements:
        "let rows = [[1], [2]]; const first = rows[0]; rows.push([3]); rows = rows.slice(1); count = first.length + rows.length;",
    },
    {
      variables: "count = 0",
      statements:
        "let rows = [{ size: 1 }]; for (const row of rows) count += row.size; rows[0].size = 4; count += rows[0].size;",
    },
  ],
  sets: [
    { variables: "seen = new Set([1])", statements: "seen.add(2); seen.add(1);" },
    { variables: "seen = new Set([1, 2])", statements: "seen.delete(1); seen.delete(5);" },
    { variables: "seen = new Set([1, 2])", statements: "seen.clear();" },
    {
      variables: "seen = new Set([1, 2]), count = 0",
      statements: "seen.add(3); count = seen.size;",
    },
  ],
  maps: [
    {
      variables: "owners = new Map<string, number>()",
      statements: "owners.set('a', 1); owners.set('b', 2); owners.set('a', 3);",
    },
    {
      variables: "owners = new Map([['a', 1], ['b', 2]])",
      statements: "owners.delete('a');",
    },
    { variables: "owners = new Map([['a', 1]])", statements: "owners.clear();" },
    {
      variables: "held = new Map([['a', new Set<number>()], ['b', new Set<number>()]])",
      statements: "held.get('a')!.add(1); held.get('a')!.add(2); held.get('b')!.add(3);",
    },
    {
      variables: "counts = new Map([['a', { total: 0 }]])",
      statements: "counts.get('a')!.total += 4;",
    },
  ],
  "control flow": [
    {
      variables: "count = 3, label = ''",
      statements: "if (count > 2) label = 'big'; else label = 'small';",
    },
    {
      variables: "count = 1, label = ''",
      statements: "if (count > 2) { label = 'big'; } else if (count > 0) { label = 'some'; }",
    },
    {
      variables: "count = 1, other = 0",
      statements: "count = 2; if (count === 2) return; other = 1;",
    },
    {
      variables: "count = 0",
      statements: "const doubled = count * 2 + 1; count = doubled; count = doubled + count;",
    },
    {
      variables: "count = 0",
      statements: "let local = 1; local += 2; local *= local; count = local;",
    },
    {
      variables: "count = 0",
      statements: "var local = 1; local += 2; count = local;",
    },
    {
      variables: "count = 0, record = { IF: 1, 'b-c': 2 }",
      statements:
        "record.IF = 5; record['b-c'] += 1; const { 'b-c': inner, IF } = record; count = inner + IF;",
    },
    {
      variables: "phase: 'a' | 'b' | 'c' = 'b', count = 0",
      statements: `switch (phase) {
        case 'a':
          count = 1;
          break;
        case 'b':
        case 'c':
          count = 2;
          phase = 'a';
          break;
        default:
          count = 3;
      }`,
    },
    {
      variables: "count = 5, result = 0",
      statements: "result = count > 3 ? count - 3 : count + 3;",
    },
  ],
  errors: [
    {
      variables: "log: string[] = []",
      statements:
        "const error = new TypeError(); const named = new MyError('m'); log.push(error.message); log.push(error.name); log.push(named.name); log.push(named.message);",
      setup: "class MyError extends Error {}",
    },
    {
      variables: "log: string[] = []",
      statements:
        "const error: Error = new MyError('m'); if (error instanceof MyError) log.push('mine'); if (error instanceof TypeError) log.push('type'); if (error instanceof Error) log.push('error');",
      setup: "class MyError extends Error {}",
    },
  ],
  exceptions: [
    {
      variables: "log: string[] = []",
      statements:
        "try { throw 'a'; } catch (error) { log.push(typeof error); if (error === 'a') log.push('same'); }",
    },
    {
      variables: "log: string[] = []",
      statements:
        "try { check(1); check(5); log.push('unreachable'); } catch (error) { if (error instanceof MyError) log.push(error.message); if (error instanceof TypeError) log.push('type'); if (error instanceof Error) log.push('error'); } finally { log.push('finally'); }",
      setup:
        "class MyError extends Error {}\nconst check = (value: number) => { if (value > 2) throw new MyError('big'); log.push('ok'); };",
    },
    {
      variables: "log: string[] = []",
      statements:
        "try { try { throw new TypeError('t'); } finally { log.push('inner'); } } catch (error) { if (error instanceof TypeError) log.push('outer'); }",
    },
    {
      variables: "log: string[] = []",
      statements:
        "attempt(() => { throw new RangeError('r'); }); attempt(() => { log.push('ran'); });",
      setup:
        "const attempt = (run: () => void) => { try { run(); } catch { log.push('caught'); return; } log.push('none'); };",
    },
    {
      variables: "log: string[] = []",
      statements: "leave(); log.push('after');",
      setup: "const leave = () => { try { return; } finally { log.push('finally'); } };",
    },
    {
      variables: "log: string[] = []",
      statements:
        "for (const value of [1, 2, 3]) { try { if (value === 2) continue; if (value === 3) break; log.push('body'); } finally { log.push('finally'); } }",
    },
    {
      variables: "log: string[] = []",
      statements:
        "try { try { throw 1; } catch (inner) { log.push('inner'); throw inner; } } catch (outer) { if (outer === 1) log.push('rethrown'); }",
    },
  ],
  helpers: [
    {
      variables: "count = 0",
      statements: "start([2]).next(); for (const item of [1, 2]) start([item]).next();",
      setup:
        "function* start([amount]: number[]) {\n  try { count += amount; yield; count += 100; } finally { count += 1000; }\n}",
    },
    {
      variables: "count = 0",
      statements: "Counter.add(2); new Counter().twice(3); count += new Counter().double(4);",
      setup:
        "class Counter {\n  static add(amount: number) { count += amount; }\n  #twice(amount: number) { count += amount * 2; }\n  get twice() { return this.#twice; }\n  double(amount: number) { return amount * 2; }\n}",
    },
    {
      variables: "count = 0",
      statements:
        "twice(add); let n = 0; const inc = () => { n += 1; }; for (const item of [1, 2]) inc(); count += n;",
      setup:
        "const add = () => { count += 10; };\nconst twice = (run: () => void) => { for (const item of [1, 2]) run(); };",
    },
    {
      variables: "count = 0",
      statements:
        "let probe: () => number; { const inner = 3; probe = () => inner; } count = probe();",
    },
    {
      variables: "count = 0",
      statements:
        "let run: () => void; run = () => { count += 1; }; run(); if (count > 0) run = () => { count += 10; }; run();",
    },
    {
      variables: "count = 0",
      statements: "twice(() => { count += 1; }); twice(add);",
      setup:
        "const add = () => { count += 10; };\nconst twice = (run: () => void) => { run(); run(); };",
    },
    {
      variables: "count = 0",
      statements: "bump(); bump();",
      setup: "const bump = () => { count++; };",
    },
    {
      variables: "count = 0, total = 0",
      statements: "addTo(3); addTo(4);",
      setup: "const addTo = (amount: number) => { count++; total += amount; };",
    },
    {
      variables: "count = 0",
      statements: "add(); add(4);",
      setup: "const add = (amount?: number) => { count += amount ?? 1; };",
    },
    {
      variables: "count = 1, copy = 0",
      statements: "count = 4; copy = getDouble();",
      setup: "const getDouble = () => count * 2;",
    },
    {
      variables: "count = 1",
      statements: "const isSmall = (value: number) => value < 3; if (isSmall(count)) count = 10;",
    },
  ],
  "missing keys": [
    {
      variables: "result: unknown = 0",
      statements:
        'result = [table["a"]["b"], table["z"] === undefined, table["a"]["c"] === undefined];',
      setup: "const table: Record<string, Record<string, number>> = { a: { b: 1, zero: 0 } };",
    },
  ],
};

describe.each(Object.entries(CASES))("%s", (_, cases) => {
  it.each(cases.map((entry) => [entry.statements, entry] as const))("%s", async (_, entry) => {
    const result = await runStatements(entry.variables, entry.statements, entry.setup);
    expect(result.actual).toBe(result.expected);
  });
});

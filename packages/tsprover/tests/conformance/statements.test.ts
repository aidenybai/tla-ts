import { describe, expect, it } from "vite-plus/test";
import { runStatements } from "./harness";

interface Case {
  variables: string;
  statements: string;
  setup?: string;
}

// Each action body changes the variables the same way in JavaScript and in tsprover's TLA+.
const CASES: Record<string, Case[]> = {
  assignments: [
    { variables: "count = 1", statements: "count = 5;" },
    { variables: "count = 1", statements: "count = count + 1; count = count * 3;" },
    { variables: "count = 10", statements: "count += 2; count -= 5; count *= 3;" },
    { variables: "count = 0", statements: "count++; count++; count--;" },
    { variables: "count = 0", statements: "++count; --count; ++count;" },
    { variables: "label = 'a'", statements: "label += 'b'; label = label + label;" },
    { variables: "isOn = false", statements: "isOn = !isOn;" },
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
  helpers: [
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
      variables: "count = 1, copy = 0",
      statements: "count = 4; copy = getDouble();",
      setup: "const getDouble = () => count * 2;",
    },
    {
      variables: "count = 1",
      statements: "const isSmall = (value: number) => value < 3; if (isSmall(count)) count = 10;",
    },
  ],
};

describe.each(Object.entries(CASES))("%s", (_, cases) => {
  it.each(cases.map((entry) => [entry.statements, entry] as const))("%s", async (_, entry) => {
    const result = await runStatements(entry.variables, entry.statements, entry.setup);
    expect(result.actual).toBe(result.expected);
  });
});

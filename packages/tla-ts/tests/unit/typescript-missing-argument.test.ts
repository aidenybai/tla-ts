import { expect, it } from "vite-plus/test";
import { TlaTypeScriptError } from "../../src/errors";
import { compile } from "../../src/typescript/compile";

const CASES: [string, string, string][] = [
  ["Set.has", "found = seen.has();", "Set method needs an argument: has"],
  ["Set.union", "seen = seen.union();", "Set method needs an argument: union"],
  ["Map.has", "found = ages.has();", "Map method needs a key: has"],
  ["Map.get", "count = ages.get() ?? 0;", "Map method needs a key: get"],
];

it.each(CASES)("rejects %s without an argument", (_, statement, message) => {
  const model = `
    let seen = new Set<number>();
    let ages = new Map<string, number>();
    let found = false;
    let count = 0;
    export const step = () => {
      // @ts-ignore
      ${statement}
    };
  `;
  expect(() => compile(model)).toThrow(TlaTypeScriptError);
  expect(() => compile(model)).toThrow(message);
});

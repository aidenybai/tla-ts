import type { CompiledSpec, Region } from "../../../tla-ts/src/typescript/emit";
import { getTokens } from "./syntax";

interface OutlineVariable {
  name: string;
  type: string | undefined;
  initial: string | undefined;
}

interface OutlineAction {
  name: string;
  head: string;
  reads: string[];
  writes: string[];
}

interface OutlineEntry {
  name: string;
  head: string;
  role: string | undefined;
}

export interface Outline {
  variables: OutlineVariable[];
  actions: OutlineAction[];
  checks: OutlineEntry[];
  definitions: OutlineEntry[];
}

const CONFIG_ROLES = new Map([
  ["INVARIANTS", "invariant"],
  ["PROPERTIES", "property"],
  ["CONSTRAINTS", "constraint"],
  ["ACTION_CONSTRAINTS", "action constraint"],
  ["VIEW", "view"],
  ["POSTCONDITIONS", "postcondition"],
]);

const getRoles = (spec: CompiledSpec) =>
  new Map([
    ...spec.config.split("\n").flatMap((line) => {
      const words = line.split(" ");
      const role = CONFIG_ROLES.get(words[0]);
      return role === undefined ? [] : words.slice(1).map((name): [string, string] => [name, role]);
    }),
    ...[...spec.source.matchAll(/^ASSUME (\w+)$/gm)].map((match): [string, string] => [
      match[1],
      "assumption",
    ]),
  ]);

const getOutput = (spec: CompiledSpec, region: Region) =>
  spec.source.slice(region.output.start, region.output.end);

const getAccesses = (formula: string, variables: ReadonlySet<string>) => {
  const body = formula.replace(/UNCHANGED\s*(?:<<[^>]*>>|\w+)/g, "");
  const names = getTokens(body, "tla").flatMap((token) => {
    const name = body.slice(token.start, token.end);
    return token.kind === "name" && variables.has(name) && body[token.start - 1] !== "."
      ? [{ name, isPrimed: body[token.end] === "'" }]
      : [];
  });
  return {
    reads: [...new Set(names.filter((name) => !name.isPrimed).map((name) => name.name))],
    writes: [...new Set(names.filter((name) => name.isPrimed).map((name) => name.name))],
  };
};

export const getOutline = (spec: CompiledSpec, input: string): Outline => {
  const roles = getRoles(spec);
  const getHead = (region: Region) => getOutput(spec, region).split(" ==")[0];
  const variables = spec.regions.filter((region) => region.kind === "variable");
  const names = new Set(variables.map((variable) => variable.name));
  return {
    variables: variables.map((variable) => {
      const init = spec.regions.find(
        (region) => region.kind === "init" && region.name === variable.name,
      );
      const declaration = init === undefined ? "" : input.slice(init.source.start, init.source.end);
      return {
        name: variable.name,
        type: /^let\s+[\w$]+\s*:\s*([^;]+?)\s*(?:=(?!>)|;|$)/.exec(declaration)?.[1],
        initial:
          init === undefined ? undefined : getOutput(spec, init).slice(variable.name.length).trim(),
      };
    }),
    actions: spec.regions
      .filter((region) => region.kind === "action")
      .map((region) => ({
        name: region.name,
        head: getHead(region),
        ...getAccesses(getOutput(spec, region), names),
      })),
    checks: spec.regions
      .filter((region) => region.kind === "predicate" || region.kind === "property")
      .map((region) => ({
        name: region.name,
        head: getHead(region),
        role: roles.get(region.name),
      })),
    definitions: spec.regions
      .filter((region) => region.kind === "definition")
      .map((region) => ({ name: region.name, head: getHead(region), role: undefined })),
  };
};

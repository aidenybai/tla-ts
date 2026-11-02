// ctx.ml and backend/smtlib.ml's naming: each name is salted past the names in scope.

import { formatName } from "./format";

// A quantifier's variables, in scope until the quantifier's closing parenthesis.
interface QuantifierScope {
  depth: number;
  exits: (() => void)[];
}

export interface Identifier {
  base: string;
  salt: number;
  name: string;
}

const getSaltedName = (base: string, salt: number) => (salt === 0 ? base : `${base}_${salt}`);

// Ctx.maybe_adj: a name is its formatted base, salted past the last one with that base and past
// every name in scope.
export const createContext = () => {
  const salts = new Map<string, number>();
  const names = new Set<string>();
  const adjoin = (raw: string): Identifier => {
    const base = formatName(raw);
    const start = (salts.get(base) ?? -1) + 1;
    const salt =
      Array.from({ length: names.size + 1 }, (_value, index) => start + index).find(
        (candidate) => !names.has(getSaltedName(base, candidate)),
      ) ?? start;
    return { base, salt, name: getSaltedName(base, salt) };
  };
  // Brings an identifier into scope and returns how to take it out again.
  const enter = (identifier: Identifier) => {
    const previous = salts.get(identifier.base);
    salts.set(identifier.base, identifier.salt);
    names.add(identifier.name);
    return () => {
      names.delete(identifier.name);
      if (previous === undefined) salts.delete(identifier.base);
      else salts.set(identifier.base, previous);
    };
  };
  return { names, adjoin, enter };
};

// Smtlib.pp_print_obligation names each declaration for the rest of the obligation, and each
// quantifier's variables within it, so a variable's name depends on the names in scope.
export const createPrinter = (declared: Map<string, Identifier>) => {
  const context = createContext();
  const resolve = (line: string) => {
    const declaration = /^\(declare-fun (\S+)/.exec(line)?.[1];
    if (declaration !== undefined) {
      const identifier = declared.get(declaration);
      if (identifier) context.enter(identifier);
      else context.names.add(declaration);
      return line;
    }
    const tokens = [...line.matchAll(/\|[^|]*\||[()]|[^\s()|]+/g)];
    const replacements = new Map<number, string>();
    const renames = new Map<string, string[]>();
    const scopes: QuantifierScope[] = [];
    const state = { index: 0, depth: 0 };
    while (state.index < tokens.length) {
      const token = tokens[state.index][0];
      const isQuantifier =
        token === "(" &&
        (tokens[state.index + 1]?.[0] === "forall" || tokens[state.index + 1]?.[0] === "exists") &&
        tokens[state.index + 2]?.[0] === "(";
      if (isQuantifier) {
        state.depth++;
        const scope: QuantifierScope = { depth: state.depth, exits: [] };
        scopes.push(scope);
        state.index += 3;
        while (tokens[state.index]?.[0] === "(") {
          const raw = tokens[state.index + 1][0];
          const identifier = context.adjoin(raw.replace(/#\d+$/, ""));
          const stack = renames.get(raw) ?? [];
          renames.set(raw, [...stack, identifier.name]);
          scope.exits.push(context.enter(identifier), () => renames.set(raw, stack));
          replacements.set(state.index + 1, identifier.name);
          state.index += 4;
        }
        state.index++;
        continue;
      }
      if (token === "(") state.depth++;
      if (token === ")") {
        if (scopes.at(-1)?.depth === state.depth)
          scopes
            .pop()
            ?.exits.toReversed()
            .forEach((exit) => exit());
        state.depth--;
      }
      const name = renames.get(token)?.at(-1);
      if (name !== undefined) replacements.set(state.index, name);
      state.index++;
    }
    return tokens
      .map((match, index) => {
        const end = tokens[index + 1]?.index ?? line.length;
        return `${replacements.get(index) ?? match[0]}${line.slice(match.index + match[0].length, end)}`;
      })
      .join("");
  };
  return { resolve };
};

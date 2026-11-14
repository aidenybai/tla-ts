import { formatName } from "./format";

interface QuantifierScope {
  depth: number;
  exits: (() => void)[];
}

interface LetScope {
  depth: number;
  names: number[];
}

// The index of each name a LET binds, and of the parenthesis that closes its definitions.
const getLetNames = (tokens: RegExpMatchArray[], start: number) => {
  const names: number[] = [];
  let position = start;
  let depth = 0;
  do {
    const token = tokens[position][0];
    if (token === "(") depth++;
    if (token === ")") depth--;
    if (token === "(" && depth === 2) names.push(position + 1);
    position++;
  } while (depth > 0);
  return { names, end: position - 1 };
};

export interface Identifier {
  base: string;
  salt: number;
  name: string;
}

const getSaltedName = (base: string, salt: number) => (salt === 0 ? base : `${base}_${salt}`);

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

export const createPrinter = (declared: Map<string, Identifier>) => {
  const context = createContext();
  return (line: string) => {
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
    const lets = new Map<number, LetScope>();
    let position = 0;
    let depth = 0;
    while (position < tokens.length) {
      const token = tokens[position][0];
      if (token === "(" && tokens[position + 1]?.[0] === "let") {
        const found = getLetNames(tokens, position + 2);
        lets.set(found.end, { depth: depth + 1, names: found.names });
      }
      const isQuantifier =
        token === "(" &&
        (tokens[position + 1]?.[0] === "forall" || tokens[position + 1]?.[0] === "exists") &&
        tokens[position + 2]?.[0] === "(";
      if (isQuantifier) {
        depth++;
        const scope: QuantifierScope = { depth, exits: [] };
        scopes.push(scope);
        position += 3;
        while (tokens[position]?.[0] === "(") {
          const raw = tokens[position + 1][0];
          const identifier = context.adjoin(raw.replace(/(:\w+)?#\d+$/, ""));
          const stack = renames.get(raw) ?? [];
          renames.set(raw, [...stack, identifier.name]);
          scope.exits.push(context.enter(identifier), () => renames.set(raw, stack));
          replacements.set(position + 1, identifier.name);
          position += 4;
        }
        position++;
        continue;
      }
      if (token === "(") depth++;
      if (token === ")") {
        if (scopes.at(-1)?.depth === depth)
          scopes
            .pop()
            ?.exits.toReversed()
            .forEach((exit) => exit());
        depth--;
      }
      const name = renames.get(token)?.at(-1);
      if (name !== undefined) replacements.set(position, name);
      // Smtlib names a LET's definitions in order, though it prints them last first, and only its
      // body sees them.
      const letScope = lets.get(position);
      if (letScope !== undefined) {
        const scope: QuantifierScope = { depth: letScope.depth, exits: [] };
        letScope.names.toReversed().forEach((index) => {
          const raw = tokens[index][0];
          const identifier = context.adjoin(raw.replace(/(:\w+)?#\d+$/, ""));
          const stack = renames.get(raw) ?? [];
          renames.set(raw, [...stack, identifier.name]);
          scope.exits.push(context.enter(identifier), () => renames.set(raw, stack));
          replacements.set(index, identifier.name);
        });
        scopes.push(scope);
      }
      position++;
    }
    return tokens
      .map((match, index) => {
        const end = tokens[index + 1]?.index ?? line.length;
        return `${replacements.get(index) ?? match[0]}${line.slice(match.index + match[0].length, end)}`;
      })
      .join("");
  };
};

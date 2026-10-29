// Ported from Isabelle2025's Pure/name.ML and the name bumping of Pure/General/symbol.ML.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

// Symbol.explode: \<name> symbols count as one symbol.
export const explodeSymbols = (text: string): string[] =>
  text.match(/\\<\^?[A-Za-z0-9_']*>|[^]/gu) ?? [];

const isRawSymbolic = (symbol: string) => symbol.startsWith("\\<") && !symbol.startsWith("\\<^");

const isQuasi = (symbol: string) => symbol === "_" || symbol === "'";

const isSymbolicEnd = (reversed: readonly string[]): boolean => {
  if (reversed.length === 0) return false;
  if (reversed.length > 1 && reversed[1] === "\\<^sub>") return true;
  if (reversed[0] === "'") return isSymbolicEnd(reversed.slice(1));
  return isRawSymbolic(reversed[0]);
};

export const bumpInit = (text: string) =>
  isSymbolicEnd(explodeSymbols(text).reverse()) ? `${text}'` : `${text}a`;

export const bumpString = (text: string) => {
  const symbols = explodeSymbols(text);
  let suffixStart = symbols.length;
  while (suffixStart > 0 && isQuasi(symbols[suffixStart - 1])) suffixStart -= 1;
  const reversed = symbols.slice(0, suffixStart).reverse();
  const bump = (rest: readonly string[]): string[] => {
    if (rest.length === 0) return ["a"];
    if (rest[0] === "z") return ["a", ...bump(rest.slice(1))];
    const code = rest[0].length === 1 ? rest[0].charCodeAt(0) : -1;
    return code >= 97 && code < 122
      ? [String.fromCharCode(code + 1), ...rest.slice(1)]
      : ["a", ...rest];
  };
  const bumped = isSymbolicEnd(reversed) ? ["'", ...reversed] : bump(reversed);
  return [...bumped.reverse(), ...symbols.slice(suffixStart)].join("");
};

const cleanIndex = (name: string): [string, number] => {
  let base = name;
  let count = 0;
  while (base.endsWith("_")) {
    base = base.slice(0, -1);
    count += 1;
  }
  return [base, count];
};

export const cleanName = (name: string) => cleanIndex(name)[0];

// Name.context: the declared names with their latest renaming.
export type NameContext = ReadonlyMap<string, string | undefined>;

export const declareName = (name: string, context: NameContext): NameContext => {
  const clean = cleanName(name);
  if (context.has(clean)) return context;
  return new Map(context).set(clean, undefined);
};

export const emptyNameContext: NameContext = new Map([
  ["", undefined],
  ["'", undefined],
]);

export const makeNameContext = (names: readonly string[]) =>
  names.reduce((context, name) => declareName(name, context), emptyNameContext);

// Name.variant: a name distinct from the declared ones, keeping a suffix of underscores.
export const variantName = (name: string, context: NameContext): [string, NameContext] => {
  const [base, count] = cleanIndex(name);
  if (!context.has(base)) return [base + "_".repeat(count), declareName(base, context)];
  const initial = bumpInit(base);
  let current = initial;
  while (context.has(current)) current = bumpString(context.get(current) ?? current);
  const renamed =
    cleanName(initial) === cleanName(current)
      ? context
      : new Map(context).set(cleanName(initial), cleanName(current));
  return [current + "_".repeat(count), declareName(current, renamed)];
};

export const variantNames = (names: readonly string[], context: NameContext) => {
  let current = context;
  return names.map((name) => {
    const [variant, next] = variantName(name, current);
    current = next;
    return variant;
  });
};

export const variantList = (used: readonly string[], names: readonly string[]) =>
  variantNames(names, makeNameContext(used));

// Name.invent: count fresh names starting from name.
export const inventNames = (context: NameContext, name: string, count: number) => {
  const names: string[] = [];
  let current = cleanName(name);
  while (names.length < count) {
    if (!context.has(current)) names.push(current);
    current = bumpString(current);
  }
  return names;
};

// Name.is_bound and Name.bound: the names of loose bound variables in nets and printing.
// Name.is_bound: the names the simplifier gives the free variables standing for bound ones.
export const isBoundName = (name: string) => name.startsWith(":");

export const boundName = (index: number) => `:${String(index).padStart(3, "0")}`;

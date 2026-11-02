// Comparing formulas by their own alpha-equivalence: each formula prints to a key in which a bound
// variable is the number of binders between it and its own.

import { term, UncheckedError, variable, type Env, type Operators, type Term } from "./terms";

export const createKeys = () => {
  const freeNames = new WeakMap<Term, Set<string>>();
  const topKeys = new WeakMap<Term, string>();
  let freshCount = 0;

  // The variables and applied symbols that a formula doesn't bind, which are the names an
  // environment can change.
  const getFreeNames = (formula: Term): Set<string> => {
    const cached = freeNames.get(formula);
    if (cached !== undefined) return cached;
    const names = new Set<string>();
    const bound =
      formula.kind === "subst"
        ? formula.symbol
        : formula.kind === "all" ||
            formula.kind === "ex" ||
            formula.kind === "tau" ||
            formula.kind === "lam"
          ? formula.args[0].symbol
          : undefined;
    if (formula.kind === "var" || formula.kind === "app") names.add(formula.symbol);
    if (formula.kind !== "meta")
      formula.args.forEach((inner, index) => {
        for (const name of getFreeNames(inner))
          if (name !== bound || (formula.kind === "subst" && index === 1)) names.add(name);
      });
    freeNames.set(formula, names);
    return names;
  };

  // `operators` replaces applied symbols, for definitions whose parameters are operators.
  const getKey = (formula: Term, env: Env, depth: number, operators?: Operators): string => {
    for (const name of getFreeNames(formula))
      if (env.has(name) || operators?.has(name) === true)
        return getEnvKey(formula, env, depth, operators);
    return getTopKey(formula);
  };

  const getEnvKey = (formula: Term, env: Env, depth: number, operators?: Operators): string => {
    const recurse = (inner: Term) => getKey(inner, env, depth, operators);
    const named = (tag: string, name: string) => `${tag}${name.length}:${name}`;
    const without = (name: string) => {
      if (operators === undefined || !operators.has(name)) return operators;
      const inner = new Map(operators);
      inner.delete(name);
      return inner;
    };
    switch (formula.kind) {
      case "var": {
        const binding = env.get(formula.symbol);
        if (binding === undefined) return named("v", formula.symbol);
        if (typeof binding === "number") return `#${depth - binding}`;
        return getKey(binding.formula, binding.env, depth, binding.operators);
      }
      case "meta":
        return `m(${getTopKey(formula.args[0])})`;
      case "true":
        return "T";
      case "false":
        return "F";
      case "subst": {
        const inner = new Map(env);
        inner.set(formula.symbol, { formula: formula.args[1], env, operators });
        return getKey(formula.args[0], inner, depth, without(formula.symbol));
      }
      case "app": {
        const args = formula.args.map(recurse);
        if (formula.symbol === "$notequiv" && args.length === 2)
          return `~(equiv(${args[0]},${args[1]}))`;
        const operator = operators?.get(formula.symbol);
        if (operator === undefined) return `${named("a", formula.symbol)}(${args.join(",")})`;
        if (operator.kind === "lam" && args.length === 1) {
          const inner: Env = new Map([
            [operator.args[0].symbol, { formula: formula.args[0], env, operators }],
          ]);
          return getKey(operator.args[1], inner, depth);
        }
        if (operator.kind === "var") return `${named("a", operator.symbol)}(${args.join(",")})`;
        if (operator.kind === "app")
          return `${named("a", operator.symbol)}(${[
            ...operator.args.map((inner) => getKey(inner, new Map(), depth)),
            ...args,
          ].join(",")})`;
        throw new UncheckedError();
      }
      case "not":
        return `~(${recurse(formula.args[0])})`;
      case "and":
      case "or":
      case "imply":
      case "equiv":
        return `${formula.kind}(${recurse(formula.args[0])},${recurse(formula.args[1])})`;
      default: {
        const inner = new Map(env);
        inner.set(formula.args[0].symbol, depth);
        const body = getKey(formula.args[1], inner, depth + 1, without(formula.args[0].symbol));
        return `${formula.kind}${named("", formula.symbol)}{${body}}`;
      }
    }
  };

  const getTopKey = (formula: Term) => {
    const cached = topKeys.get(formula);
    if (cached !== undefined) return cached;
    // Keys count binders from the variable, so a formula's key doesn't depend on where it sits.
    const key = getEnvKey(formula, new Map(), 0);
    topKeys.set(formula, key);
    return key;
  };

  return {
    getKey,
    getTopKey,
    isSame: (left: Term, right: Term) => getTopKey(left) === getTopKey(right),
    bind: (kind: "all" | "ex", type: string, build: (bound: Term) => Term) => {
      const bound = variable(`\u0000${freshCount++}`);
      return term(kind, type, [bound, build(bound)]);
    },
  };
};

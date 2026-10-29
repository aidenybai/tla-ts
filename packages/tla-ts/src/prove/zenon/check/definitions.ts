// The check of unfolding a definition: a real definition from the input, or a pseudo-definition
// that Zenon reads off a hypothesis.

import type { Definition } from "../parse";
import {
  app,
  ensure,
  isApp,
  variable,
  type Checker,
  type Env,
  type Operators,
  type RuleSpec,
  type Term,
} from "./terms";

// Checks that `unfolded` is `folded` with occurrences of the defined symbol replaced by its body,
// going through applications and negations as Zenon does.
const isUnfolding = (
  checker: Checker,
  definition: Definition,
  folded: Term,
  unfolded: Term,
  isFormulaOnly: boolean,
  isInTerm = false,
): boolean => {
  if (checker.isSame(folded, unfolded)) return true;
  const isApplication = folded.kind === "app" && folded.symbol === definition.symbol;
  const isConstant = folded.kind === "var" && folded.symbol === definition.symbol;
  if (isApplication || isConstant) {
    if (isFormulaOnly && isInTerm) return false;
    const actuals = folded.args;
    const body = definition.body;
    if (definition.params.length === 0 && isApplication && body.kind === "var")
      return definition.kind === "real" && checker.isSame(unfolded, app(body.symbol, actuals));
    if (definition.params.length !== actuals.length) return false;
    const env: Env = new Map();
    const operators: Operators = new Map();
    definition.params.forEach((param, index) => {
      env.set(param.symbol, { formula: actuals[index], env: new Map() });
      operators.set(param.symbol, actuals[index]);
    });
    return checker.getKey(body, env, 0, operators) === checker.getTopKey(unfolded);
  }
  if (folded.kind !== unfolded.kind || folded.symbol !== unfolded.symbol) return false;
  if (folded.kind !== "app" && folded.kind !== "not") return false;
  if (folded.args.length !== unfolded.args.length) return false;
  return folded.args.every((inner, index) =>
    isUnfolding(
      checker,
      definition,
      inner,
      unfolded.args[index],
      isFormulaOnly,
      isInTerm || folded.kind === "app",
    ),
  );
};

const getBound = (origin: Term) => {
  const bound: string[] = [];
  let matrix = origin;
  while (matrix.kind === "all") {
    bound.push(matrix.args[0].symbol);
    matrix = matrix.args[1];
  }
  return { bound, matrix };
};

// A pseudo-definition stands for its hypothesis, \A params : f(params) = body or <=> body.
const isDefinedBy = (checker: Checker, definition: Definition, origin: Term) => {
  const quantified = getBound(origin);
  const bound = quantified.bound;
  const matrix = quantified.matrix;
  if (!isApp(matrix, "=", 2) && matrix.kind !== "equiv") return false;
  const names = definition.params.map((param) => param.symbol);
  if (new Set(names).size !== names.length || new Set(bound).size !== bound.length) return false;
  if (names.length !== bound.length || names.some((name) => !bound.includes(name))) return false;
  const params = definition.params;
  const heads = [
    app(
      definition.symbol,
      params.map((param) => variable(param.symbol)),
    ),
  ];
  if (params.length === 0) heads.push(variable(definition.symbol));
  const sides = matrix.args;
  // The parameters are free in the head and the body, so compare them under the same names.
  const env: Env = new Map(bound.map((name, index) => [name, index]));
  const keyOf = (formula: Term) => checker.getKey(formula, env, bound.length);
  const headKeys = heads.map(keyOf);
  const bodyKey = keyOf(definition.body);
  return (
    (headKeys.includes(keyOf(sides[0])) && keyOf(sides[1]) === bodyKey) ||
    (headKeys.includes(keyOf(sides[1])) && keyOf(sides[0]) === bodyKey)
  );
};

const getFreeSymbols = (formula: Term, symbols: Set<string>) => {
  if (formula.kind === "var" || formula.kind === "app") symbols.add(formula.symbol);
  for (const inner of formula.args) getFreeSymbols(inner, symbols);
  return symbols;
};

// Real definitions are sound when each symbol has one and they don't refer to themselves.
const isWellFounded = (definition: Definition, definitions: Definition[]) => {
  const reals = definitions.filter((candidate) => candidate.kind === "real");
  const bySymbol = new Map(reals.map((candidate) => [candidate.symbol, candidate]));
  if (reals.filter((candidate) => candidate.symbol === definition.symbol).length !== 1)
    return false;
  const visiting = new Set<string>();
  const visit = (current: Definition): boolean => {
    if (visiting.has(current.symbol)) return false;
    visiting.add(current.symbol);
    const params = new Set(current.params.map((param) => param.symbol));
    for (const symbol of getFreeSymbols(current.body, new Set())) {
      const next = bySymbol.get(symbol);
      if (!params.has(symbol) && next !== undefined && !visit(next)) return false;
    }
    visiting.delete(current.symbol);
    return true;
  };
  return visit(definition);
};

export const getDefinitionSpec = (
  definition: Definition,
  args: [Term, Term],
  checker: Checker,
): RuleSpec => {
  const definitions = checker.context.definitions;
  ensure(definitions.includes(definition));
  // An equivalence only says the two sides have the same truth value, so it unfolds where a
  // formula is expected, not inside a term.
  const isEquivalence =
    definition.kind === "pseudo" && getBound(definition.origin).matrix.kind === "equiv";
  ensure(isUnfolding(checker, definition, args[0], args[1], isEquivalence));
  if (definition.kind === "real") {
    ensure(isWellFounded(definition, definitions));
    return { premises: [args[0]], branches: [[args[1]]] };
  }
  ensure(isDefinedBy(checker, definition, definition.origin));
  return { premises: [args[0], definition.origin], branches: [[args[1]]] };
};

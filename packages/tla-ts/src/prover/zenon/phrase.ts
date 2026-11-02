// Ported from Zenon's phrase.ml, as shipped in tlapm. Copyright 2004 INRIA, see LICENSE.
//
// Splits the input into definitions and hypotheses. A hypothesis that defines a symbol, such as
// x = e or \A a, b : f(a, b) <=> e, becomes a definition that the prover unfolds.

import type { Expr } from "./expr";
import type { Definition, Phrase } from "./parse";

export interface Hypothesis {
  formula: Expr;
  goalness: number;
}

const hasName = (env: Expr[], name: string) => env.some((variable) => variable.symbol === name);

// Zenon's check_args: the arguments are variables, and exactly the quantified ones.
const isParameterList = (env: Expr[], args: Expr[]) => {
  if (!args.every((arg) => arg.kind === "var")) return false;
  const envNames = env.map((variable) => variable.symbol).sort();
  const argNames = args.map((arg) => arg.symbol).sort();
  return (
    envNames.length === argNames.length &&
    envNames.every((name, index) => name === argNames[index]) &&
    envNames.every((name, index) => index === 0 || name !== envNames[index - 1])
  );
};

const isBodyOf = (env: Expr[], symbol: string, expression: Expr): boolean => {
  switch (expression.kind) {
    case "var":
      return expression.symbol !== symbol || hasName(env, expression.symbol);
    case "app":
      return (
        expression.symbol !== symbol &&
        expression.args.every((inner) => isBodyOf(env, symbol, inner))
      );
    case "all":
    case "ex":
    case "tau":
    case "lam":
      return isBodyOf([expression.args[0], ...env], symbol, expression.args[1]);
    default:
      return expression.args.every((inner) => isBodyOf(env, symbol, inner));
  }
};

interface Shape {
  symbol: string;
  params: Expr[] | undefined;
  body: Expr;
}

// The ways a formula can define a symbol, in the order Zenon tries them: a definiendum that is an
// application with its parameters, or a constant.
const getShapes = (expression: Expr): Shape[] => {
  const sides =
    expression.kind === "equiv" || (expression.kind === "app" && expression.symbol === "=")
      ? expression.args
      : undefined;
  if (sides === undefined || sides.length !== 2) return [];
  const left = sides[0];
  const right = sides[1];
  const toShape = (definiendum: Expr, body: Expr): Shape[] =>
    definiendum.kind === "app"
      ? [{ symbol: definiendum.symbol, params: definiendum.args, body }]
      : definiendum.kind === "var"
        ? [{ symbol: definiendum.symbol, params: undefined, body }]
        : [];
  const shapes = [...toShape(left, right), ...toShape(right, left)];
  const applications = shapes.filter((shape) => shape.params !== undefined);
  const constants = shapes.filter((shape) => shape.params === undefined);
  return expression.kind === "equiv"
    ? [...applications, ...constants]
    : [...constants, ...applications];
};

const stripForall = (expression: Expr, env: Expr[]): { env: Expr[]; body: Expr } =>
  expression.kind === "all"
    ? stripForall(expression.args[1], [expression.args[0], ...env])
    : { env, body: expression };

// Zenon's is_def, then make_def. The two try the shapes with different conditions, so the shape
// that defines the symbol can differ from the one that qualifies the formula.
const getDefinition = (
  predefined: string[],
  hypothesis: Hypothesis,
): Extract<Definition, { kind: "pseudo" }> | undefined => {
  const stripped = stripForall(hypothesis.formula, []);
  const shapes = getShapes(stripped.body);
  const qualifying = shapes.find((candidate) => !predefined.includes(candidate.symbol));
  if (qualifying === undefined) return undefined;
  const areParamsValid =
    qualifying.params === undefined
      ? stripped.env.length === 0
      : isParameterList(stripped.env, qualifying.params);
  if (!areParamsValid || !isBodyOf([], qualifying.symbol, qualifying.body)) return undefined;
  const shape = shapes.find(
    (candidate) =>
      !predefined.includes(candidate.symbol) &&
      (candidate.params === undefined || isParameterList(stripped.env, candidate.params)),
  );
  return (
    shape && {
      kind: "pseudo",
      origin: hypothesis.formula,
      goalness: hypothesis.goalness,
      symbol: shape.symbol,
      params: shape.params ?? [],
      body: shape.body,
    }
  );
};

const getFreeSymbols = (env: Expr[], accumulator: string[], expression: Expr): string[] => {
  switch (expression.kind) {
    case "var":
      return hasName(env, expression.symbol) ? accumulator : [expression.symbol, ...accumulator];
    case "app":
      return expression.args.reduce(
        (symbols, inner) => getFreeSymbols(env, symbols, inner),
        [expression.symbol, ...accumulator],
      );
    case "all":
    case "ex":
    case "tau":
    case "lam":
      return getFreeSymbols([expression.args[0], ...env], accumulator, expression.args[1]);
    default:
      return expression.args.reduce(
        (symbols, inner) => getFreeSymbols(env, symbols, inner),
        accumulator,
      );
  }
};

type Dependency = [string, string[]];

const followDependencies = (symbols: string[], dependencies: Dependency[]): string[] =>
  symbols.flatMap(
    (symbol) => dependencies.find((dependency) => dependency[0] === symbol)?.[1] ?? [],
  );

const isLooping = (symbol: string, symbols: string[], dependencies: Dependency[]): boolean =>
  symbols.length > 0 &&
  (symbols.includes(symbol) ||
    isLooping(symbol, followDependencies(symbols, dependencies), dependencies));

// Zenon's separate. Definitions come before hypotheses, each in input order, except where a
// symbol is defined twice: then neither formula defines it.
export const separate = (predefined: string[], phrases: Phrase[]) => {
  let dependencies: Dependency[] = [];
  const multiple: string[] = [];
  let definitions: Definition[] = [];
  const hypotheses: Hypothesis[] = [];
  for (const phrase of phrases) {
    if (phrase.kind === "def") {
      definitions.unshift(phrase.definition);
      continue;
    }
    const hypothesis = { formula: phrase.formula, goalness: phrase.goalness };
    const definition = getDefinition(predefined, hypothesis);
    if (definition === undefined) {
      hypotheses.unshift(hypothesis);
      continue;
    }
    const symbol = definition.symbol;
    const dependency: Dependency = [symbol, getFreeSymbols(definition.params, [], definition.body)];
    // The lists are reversed, as in Zenon, so a definition's index 0 is the latest.
    const previous = definitions.findIndex(
      (existing) => existing.kind === "pseudo" && existing.symbol === symbol,
    );
    const removed = definitions[previous];
    if (multiple.includes(symbol) || isLooping(symbol, dependency[1], dependencies)) {
      hypotheses.unshift(hypothesis);
    } else if (removed?.kind === "pseudo") {
      // Zenon's remove_def reverses the definitions after the old one.
      definitions = [
        ...definitions.slice(0, previous).reverse(),
        ...definitions.slice(previous + 1),
      ];
      const dependencyIndex = dependencies.findIndex((candidate) => candidate[0] === symbol);
      dependencies = dependencies.filter((_, position) => position !== dependencyIndex);
      multiple.unshift(symbol);
      hypotheses.unshift(hypothesis, { formula: removed.origin, goalness: removed.goalness });
    } else {
      dependencies.unshift(dependency);
      definitions.unshift(definition);
    }
  }
  return { definitions: definitions.reverse(), hypotheses: hypotheses.reverse() };
};

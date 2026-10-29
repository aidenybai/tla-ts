// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// What the rules of the TLA+ extension share: the symbols it knows, a literal taken apart, and the
// nodes it makes.

import { TlaZenonError } from "../../../errors";
import { isApp, type Expr, type Expressions } from "../expr";
import type { Index } from "../index-table";
import type { Node, Priority } from "../node";
import { makeRule, type Rule } from "../proof";

// A node, or Zenon's Stop: the rules after it don't apply to the formula.
export type Item = Node | "stop";

export const SET_CONSTRUCTORS = [
  "TLA.emptyset",
  "TLA.upair",
  "TLA.addElt",
  "TLA.set",
  "TLA.infinity",
  "TLA.SUBSET",
  "TLA.UNION",
  "TLA.INTER",
  "TLA.cup",
  "TLA.cap",
  "TLA.setminus",
  "TLA.subsetOf",
  "TLA.setOfAll",
  "TLA.FuncSet",
  "TLA.DOMAIN",
  "TLA.Product",
  "arith.N",
  "arith.Z",
  "arith.R",
  "arith.natrange",
  "arith.intrange",
  "TLA.Seq",
  "TLA.recordset",
];

export const FUNCTION_CONSTRUCTORS = ["TLA.Fcn", "TLA.except", "TLA.oneArg", "TLA.extend"];

const OTHER_SYMBOLS = [
  "TLA.in",
  "TLA.isAFcn",
  "TLA.cond",
  "TLA.CASE",
  "TLA.tuple",
  "TLA.record",
  "TLA.fapply",
  "TLA.box",
];

// The symbols that hypotheses can't define, as Zenon's predef with the tla extension.
export const PREDEFINED_SYMBOLS = [
  "=",
  ...SET_CONSTRUCTORS,
  ...FUNCTION_CONSTRUCTORS,
  ...OTHER_SYMBOLS,
];

export const isVariable = (expression: Expr, name: string) =>
  expression.kind === "var" && expression.symbol === name;

export const isConstructor = (constructors: string[], expression: Expr) =>
  (expression.kind === "var" || expression.kind === "app") &&
  constructors.includes(expression.symbol);

export const isNotEquiv = (expression: Expr) => isApp(expression, "$notequiv");

export const isString = (expression: Expr) => isApp(expression, "$string");

export const equal = (exprs: Expressions, left: Expr, right: Expr) =>
  exprs.eapp("=", [left, right]);

export const member = (exprs: Expressions, element: Expr, set: Expr) =>
  exprs.eapp("TLA.in", [element, set]);

export const fapply = (exprs: Expressions, fcn: Expr, argument: Expr) =>
  exprs.eapp("TLA.fapply", [fcn, argument]);

export const domain = (exprs: Expressions, fcn: Expr) => exprs.eapp("TLA.DOMAIN", [fcn]);

export const getBranches = (formulas: Expr[]) => formulas.map((formula) => [formula]);

export const makeNatural = (exprs: Expressions, count: number) => {
  let result = exprs.evar("0");
  for (let index = 0; index < count; index++)
    result = fapply(exprs, exprs.evar("TLA.Succ"), result);
  return result;
};

export const isTriviallyNotIn = (element: Expr, set: Expr) =>
  isString(element) &&
  isApp(set, "TLA.set") &&
  set.args.every((inner) => isString(inner) && inner !== element);

export const getPairs = (args: Expr[]) => {
  const pairs: [Expr, Expr][] = [];
  for (let index = 0; index + 1 < args.length; index += 2)
    pairs.push([args[index], args[index + 1]]);
  return pairs;
};

export interface TlaContext {
  index: Index;
  exprs: Expressions;
}

// A formula that the propositional rules look at: a literal, its atom and the atom's first two
// arguments.
export interface Literal {
  context: TlaContext;
  formula: Expr;
  goalness: number;
  isNegated: boolean;
  atom: Expr;
  left: Expr;
  right: Expr;
  isEquality: boolean;
  isMembership: boolean;
}

export const getLiteral = (context: TlaContext, formula: Expr, goalness: number): Literal => {
  const isNegated = formula.kind === "not";
  const atom = isNegated ? formula.args[0] : formula;
  return {
    context,
    formula,
    goalness,
    isNegated,
    atom,
    left: atom.args[0],
    right: atom.args[1],
    isEquality: isApp(atom, "=", 2),
    isMembership: isApp(atom, "TLA.in", 2),
  };
};

export const makeExtensionNode = (
  literal: Literal,
  priority: Priority,
  rule: Rule,
  branches: Expr[][],
): Node[] => [
  {
    conclusions: [literal.formula],
    rule,
    priority,
    goalness: literal.goalness,
    branches,
  },
];

export const makeInstanceNode = (
  literal: Literal,
  priority: Priority,
  quantified: Expr,
  term: Expr,
): Node[] => {
  const exprs = literal.context.exprs;
  const goalness = literal.goalness;
  if (quantified.kind === "all")
    return [
      {
        conclusions: [quantified],
        rule: makeRule("all", [quantified, term]),
        priority,
        goalness,
        branches: [[exprs.substitute([[quantified.args[0], term]], quantified.args[1])]],
      },
    ];
  if (quantified.kind === "ex") {
    const negated = exprs.enot(quantified);
    return [
      {
        conclusions: [negated],
        rule: makeRule("not_ex", [negated, term]),
        priority,
        goalness,
        branches: [
          [exprs.substitute([[quantified.args[0], term]], exprs.enot(quantified.args[1]))],
        ],
      },
    ];
  }
  throw new TlaZenonError("Zenon: instantiating a formula that isn't quantified");
};

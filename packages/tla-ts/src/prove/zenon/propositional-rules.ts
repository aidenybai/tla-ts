// Ported from Zenon's prove.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// The rules for connectives and quantifiers, closing a branch, and unfolding definitions.

import { getStringValue } from "./equality-rules";
import { isApp, type Expr, type Expressions } from "./expr";
import { insertNode, type Queue } from "./node";
import type { Definition } from "./parse";
import { makeRelationRule, makeRule, type Rule } from "./proof";
import { makeNode, type RuleResult, type SearchRule } from "./rules";

// Zenon's is_conj and is_disj: how many more conjuncts or disjuncts a formula needs to reach m.
const countConjuncts = (formula: Expr, needed: number): number => {
  if (needed <= 0) return 0;
  if (formula.kind === "and")
    return countConjuncts(formula.args[1], countConjuncts(formula.args[0], needed));
  if (formula.kind === "not") return countDisjuncts(formula.args[0], needed);
  return needed - 1;
};

const countDisjuncts = (formula: Expr, needed: number): number => {
  if (needed <= 0) return 0;
  if (formula.kind === "or")
    return countDisjuncts(formula.args[1], countDisjuncts(formula.args[0], needed));
  if (formula.kind === "imply")
    return countDisjuncts(formula.args[1], countConjuncts(formula.args[0], needed));
  if (formula.kind === "not") return countConjuncts(formula.args[0], needed);
  return needed - 1;
};

const decomposeConjunction = (
  exprs: Expressions,
  isNegated: boolean,
  accumulator: Expr[],
  formula: Expr,
): Expr[] => {
  if (formula.kind === "and")
    return decomposeConjunction(
      exprs,
      isNegated,
      decomposeConjunction(exprs, isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "not")
    return decomposeDisjunction(exprs, !isNegated, accumulator, formula.args[0]);
  return [isNegated ? exprs.enot(formula) : formula, ...accumulator];
};

const decomposeDisjunction = (
  exprs: Expressions,
  isNegated: boolean,
  accumulator: Expr[],
  formula: Expr,
): Expr[] => {
  if (formula.kind === "or")
    return decomposeDisjunction(
      exprs,
      isNegated,
      decomposeDisjunction(exprs, isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "imply")
    return decomposeConjunction(
      exprs,
      !isNegated,
      decomposeDisjunction(exprs, isNegated, accumulator, formula.args[1]),
      formula.args[0],
    );
  if (formula.kind === "not")
    return decomposeConjunction(exprs, !isNegated, accumulator, formula.args[0]);
  return [isNegated ? exprs.enot(formula) : formula, ...accumulator];
};

export const addAbsurd: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (formula.kind === "not" && context.index.isMember(formula.args[0]))
    return [
      insertNode(
        queue,
        makeNode(
          [formula, formula.args[0]],
          makeRule("close", [formula.args[0]]),
          "prop",
          goalness,
          [],
        ),
      ),
      true,
    ];
  const negation = exprs.enot(formula);
  if (!context.index.isMember(negation)) return [queue, false];
  return [
    insertNode(
      queue,
      makeNode([formula, negation], makeRule("close", [formula]), "prop", goalness, []),
    ),
    true,
  ];
};

export const addClosure: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const close = (conclusions: Expr[], rule: Rule): RuleResult => [
    insertNode(queue, makeNode(conclusions, rule, "prop", goalness, [])),
    true,
  ];
  if (formula.kind === "false") return close([formula], makeRule("false", []));
  const operand = formula.kind === "not" ? formula.args[0] : undefined;
  if (operand?.kind === "true") return close([formula], makeRule("not_true", []));
  const relations = context.relations;
  if (
    operand?.kind === "app" &&
    operand.args.length === 2 &&
    relations.isReflexive(operand.symbol) &&
    operand.args[0] === operand.args[1]
  )
    return close([formula], makeRelationRule("close_refl", operand.symbol, [operand.args[0]]));
  if (
    formula.kind === "app" &&
    formula.args.length === 2 &&
    relations.isSymmetric(formula.symbol)
  ) {
    const reversed = exprs.enot(exprs.eapp(formula.symbol, [formula.args[1], formula.args[0]]));
    if (context.index.isMember(reversed))
      return close(
        [formula, reversed],
        makeRelationRule("close_sym", formula.symbol, [formula.args[0], formula.args[1]]),
      );
  }
  if (
    operand?.kind === "app" &&
    operand.args.length === 2 &&
    relations.isSymmetric(operand.symbol)
  ) {
    const reversed = exprs.eapp(operand.symbol, [operand.args[1], operand.args[0]]);
    if (context.index.isMember(reversed))
      return close(
        [formula, reversed],
        makeRelationRule("close_sym", operand.symbol, [operand.args[1], operand.args[0]]),
      );
  }
  if (isApp(formula, "=", 2)) {
    const left = getStringValue(formula.args[0]);
    const right = getStringValue(formula.args[1]);
    if (left !== undefined && right !== undefined && left !== right)
      return close([formula], makeRule("stringequal", [left, right]));
  }
  return [queue, false];
};

export const addJunctionTree: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const operand = formula.kind === "not" ? formula.args[0] : undefined;
  const isConjunctive =
    formula.kind === "and" || operand?.kind === "or" || operand?.kind === "imply";
  if (isConjunctive && countConjuncts(formula, 3) === 0)
    return [
      insertNode(
        queue,
        makeNode([formula], makeRule("conj_tree", [formula]), "prop", goalness, [
          decomposeConjunction(exprs, false, [], formula),
        ]),
      ),
      true,
    ];
  const isDisjunctive =
    formula.kind === "or" || operand?.kind === "and" || formula.kind === "imply";
  if (isDisjunctive && countDisjuncts(formula, 3) === 0)
    return [
      insertNode(
        queue,
        makeNode(
          [formula],
          makeRule("disj_tree", [formula]),
          "prop",
          goalness,
          decomposeDisjunction(exprs, false, [], formula).map((inner) => [inner]),
        ),
      ),
      true,
    ];
  return [queue, false];
};

export const addAlpha: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const add = (rule: Rule, branch: Expr[]): RuleResult => [
    insertNode(queue, makeNode([formula], rule, "prop", goalness, [branch])),
    true,
  ];
  if (formula.kind === "and")
    return add(makeRule("and", [formula.args[0], formula.args[1]]), [
      formula.args[0],
      formula.args[1],
    ]);
  if (formula.kind !== "not") return [queue, false];
  const operand = formula.args[0];
  if (operand.kind === "not") return add(makeRule("not_not", [operand.args[0]]), [operand.args[0]]);
  if (operand.kind === "or")
    return add(makeRule("not_or", [operand.args[0], operand.args[1]]), [
      exprs.enot(operand.args[0]),
      exprs.enot(operand.args[1]),
    ]);
  if (operand.kind === "imply")
    return add(makeRule("not_impl", [operand.args[0], operand.args[1]]), [
      operand.args[0],
      exprs.enot(operand.args[1]),
    ]);
  return [queue, false];
};

export const addBeta: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const add = (rule: Rule, branches: Expr[][]): RuleResult => [
    insertNode(queue, makeNode([formula], rule, "prop", goalness, branches)),
    true,
  ];
  if (formula.kind === "or" || formula.kind === "imply" || formula.kind === "equiv") {
    const left = formula.args[0];
    const right = formula.args[1];
    if (formula.kind === "or") return add(makeRule("or", [left, right]), [[left], [right]]);
    if (formula.kind === "imply")
      return add(makeRule("impl", [left, right]), [[exprs.enot(left)], [right]]);
    return add(makeRule("equiv", [left, right]), [
      [exprs.enot(left), exprs.enot(right)],
      [left, right],
    ]);
  }
  if (formula.kind !== "not") return [queue, false];
  const operand = formula.args[0];
  if (operand.kind !== "and" && operand.kind !== "equiv") return [queue, false];
  const first = operand.args[0];
  const second = operand.args[1];
  if (operand.kind === "and")
    return add(makeRule("not_and", [first, second]), [[exprs.enot(first)], [exprs.enot(second)]]);
  return add(makeRule("not_equiv", [first, second]), [
    [exprs.enot(first), second],
    [first, exprs.enot(second)],
  ]);
};

export const addDelta: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (formula.kind === "ex") {
    const variable = formula.args[0];
    const body = formula.args[1];
    const witness = exprs.substitute(
      [[variable, exprs.etau(variable, formula.symbol, body)]],
      body,
    );
    return [
      insertNode(
        queue,
        makeNode([formula], makeRule("ex", [formula]), "prop", goalness, [[witness]]),
      ),
      true,
    ];
  }
  if (formula.kind !== "not" || formula.args[0].kind !== "all") return [queue, false];
  const quantified = formula.args[0];
  const variable = quantified.args[0];
  const negatedBody = exprs.enot(quantified.args[1]);
  const witness = exprs.substitute(
    [[variable, exprs.etau(variable, quantified.symbol, negatedBody)]],
    negatedBody,
  );
  const existential = exprs.eex(variable, quantified.symbol, negatedBody);
  return [
    insertNode(
      queue,
      makeNode([formula], makeRule("not_all_ex", [formula]), "prop", goalness, [
        [witness, existential],
      ]),
    ),
    true,
  ];
};

export const addGamma: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (formula.kind === "all") {
    const meta = exprs.emeta(formula);
    const instance = exprs.substitute([[formula.args[0], meta]], formula.args[1]);
    return [
      insertNode(
        queue,
        makeNode([formula], makeRule("all", [formula, meta]), "arity", goalness, [[instance]]),
      ),
      true,
    ];
  }
  if (formula.kind !== "not" || formula.args[0].kind !== "ex") return [queue, false];
  const quantified = formula.args[0];
  const meta = exprs.emeta(quantified);
  const instance = exprs.enot(exprs.substitute([[quantified.args[0], meta]], quantified.args[1]));
  return [
    insertNode(
      queue,
      makeNode([formula], makeRule("not_ex", [formula, meta]), "arity", goalness, [[instance]]),
    ),
    true,
  ];
};

const unfold = (
  exprs: Expressions,
  queue: Queue,
  formula: Expr,
  goalness: number,
  definition: Definition,
  args: Expr[] | undefined,
  wrap: (unfolded: Expr) => Expr,
): RuleResult => {
  const params = definition.params;
  const body = definition.body;
  const add = (unfolded: Expr): RuleResult => {
    const rule: Rule = { name: "definition", definition, args: [formula, unfolded] };
    return [insertNode(queue, makeNode([formula], rule, "prop", goalness, [[unfolded]])), true];
  };
  if (params.length === 0 && args !== undefined && body.kind === "var")
    return add(wrap(exprs.eapp(body.symbol, args)));
  const actuals = args ?? [];
  if (params.length !== actuals.length) return [queue, false];
  const unfolded = exprs.substituteSecondOrder(
    params.map((param, index) => [param, actuals[index]]),
    body,
  );
  return unfolded === undefined ? [queue, false] : add(wrap(unfolded));
};

export const addUnfold: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const index = context.index;
  const isAny = context.relations.isAny;
  const isNegated = formula.kind === "not";
  const atom = isNegated ? formula.args[0] : formula;
  const negate = (inner: Expr) => (isNegated ? exprs.enot(inner) : inner);
  const tryUnfold = (term: Expr, wrap: (unfolded: Expr) => Expr) => {
    const definition =
      term.kind === "app" || term.kind === "var" ? index.getDefinition(term.symbol) : undefined;
    return definition === undefined
      ? undefined
      : unfold(
          exprs,
          queue,
          formula,
          goalness,
          definition,
          term.kind === "app" ? term.args : undefined,
          wrap,
        );
  };
  // Zenon tries applications before variables, each first as the formula itself, then as either
  // side of a relation that is reflexive, symmetric or transitive.
  for (const kind of ["app", "var"]) {
    if (atom.kind === kind) {
      const result = tryUnfold(atom, negate);
      if (result !== undefined) return result;
    }
    if (atom.kind !== "app" || atom.args.length !== 2 || !isAny(atom.symbol)) continue;
    const left = atom.args[0];
    const right = atom.args[1];
    if (left.kind === kind) {
      const result = tryUnfold(left, (unfolded) =>
        negate(exprs.eapp(atom.symbol, [unfolded, right])),
      );
      if (result !== undefined) return result;
    }
    if (right.kind === kind) {
      const result = tryUnfold(right, (unfolded) =>
        negate(exprs.eapp(atom.symbol, [left, unfolded])),
      );
      if (result !== undefined) return result;
    }
  }
  return [queue, false];
};

export const addUseless: SearchRule = (_context, queue, formula) => {
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  const isUseless =
    atom.kind === "var" ||
    atom.kind === "tau" ||
    formula.kind === "true" ||
    (formula.kind === "not" && atom.kind === "false");
  return [queue, isUseless];
};

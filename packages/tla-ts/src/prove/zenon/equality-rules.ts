// Ported from Zenon's prove.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// The rules for equality and other relations: instances that unify a metavariable, matching a
// literal against its negation, congruence, reflexivity, symmetry and transitivity.

import { TlaZenonError } from "../../errors";
import { isApp, isMeta, type Expr, type Expressions } from "./expr";
import { getHead } from "./index-table";
import { insertNode, type Priority, type Queue } from "./node";
import { makeRelationRule, makeRule } from "./proof";
import { insertAll, makeNode, unequal, type SearchContext, type SearchRule } from "./rules";

export const makeInstance = (
  exprs: Expressions,
  queue: Queue,
  quantified: Expr,
  term: Expr,
  goalness: number,
): Queue => {
  if (quantified.kind === "all") {
    const instance = exprs.substitute([[quantified.args[0], term]], quantified.args[1]);
    return insertNode(
      queue,
      makeNode(
        [quantified],
        makeRule("all", [quantified, term]),
        { instance: quantified },
        goalness,
        [[instance]],
      ),
    );
  }
  if (quantified.kind === "ex") {
    const instance = exprs.substitute([[quantified.args[0], term]], exprs.enot(quantified.args[1]));
    const negated = exprs.enot(quantified);
    return insertNode(
      queue,
      makeNode([negated], makeRule("not_ex", [negated, term]), { instance: quantified }, goalness, [
        [instance],
      ]),
    );
  }
  // Zenon hands applications to the extension named by the symbol's prefix, and tla has none.
  if (quantified.kind === "app") return queue;
  throw new TlaZenonError("Zenon: make_inst on a formula that isn't quantified");
};

const makeInequalities = (exprs: Expressions, left: Expr[], right: Expr[]) =>
  left.map((inner, index) => [unequal(exprs, inner, right[index])]);

const isGoodMatch = (left: Expr, right: Expr): boolean => {
  if (left.kind === "meta" || right.kind === "meta") return true;
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "var":
      return left.symbol === right.symbol;
    case "app":
      return left.symbol === right.symbol;
    case "not":
      return isGoodMatch(left.args[0], right.args[0]);
    case "and":
    case "or":
    case "imply":
    case "equiv":
      return isGoodMatch(left.args[0], right.args[0]) || isGoodMatch(left.args[1], right.args[1]);
    case "true":
    case "false":
      return true;
    case "tau":
      return left === right;
    default:
      return false;
  }
};

const makeNotEquiv = (
  exprs: Expressions,
  queue: Queue,
  isSymmetric: boolean,
  positive: [Expr, number],
  negative: [Expr, number],
): Queue => {
  const atom = positive[0];
  const negation = negative[0];
  const negated = negation.args[0];
  if (
    isApp(atom, "TLA.in", 2) &&
    atom.args[1].kind === "var" &&
    negated.args.length === 2 &&
    atom.args[1] !== negated.args[1] &&
    !isMeta(atom.args[0]) &&
    !isMeta(atom.args[1]) &&
    !isMeta(negated.args[0]) &&
    !isMeta(negated.args[1]) &&
    atom.args[0] !== negated.args[0]
  )
    return queue;
  const args = atom.args;
  const negatedArgs = negated.args;
  if ((isSymmetric && negatedArgs.length !== 2) || args.length !== negatedArgs.length) return queue;
  const isGood = args.every((inner, index) => isGoodMatch(inner, negatedArgs[index]));
  const priority: Priority = isGood
    ? atom.symbol === "="
      ? "arity_eq"
      : "arity"
    : { instance: atom };
  return insertNode(
    queue,
    makeNode(
      [atom, negation],
      isSymmetric
        ? makeRelationRule("p_not_p_sym", atom.symbol, [atom, negation])
        : makeRule("p_not_p", [atom, negation]),
      priority,
      Math.min(positive[1], negative[1]),
      makeInequalities(exprs, isSymmetric ? [...args].reverse() : args, negatedArgs),
    ),
  );
};

export const getStringValue = (expression: Expr) =>
  isApp(expression, "$string", 1) ? expression.args[0] : undefined;

export const addStringEqualities: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (!isApp(formula, "=", 2)) return [queue, false];
  const isRightString = getStringValue(formula.args[1]) !== undefined;
  if (!isRightString && getStringValue(formula.args[0]) === undefined) return [queue, false];
  const string = isRightString ? formula.args[1] : formula.args[0];
  const term = isRightString ? formula.args[0] : formula.args[1];
  const names = isRightString
    ? (["stringdiffll", "stringdifflr"] as const)
    : (["stringdiffrl", "stringdiffrr"] as const);
  let current = queue;
  const visit = (name: (typeof names)[number], isReversed: boolean, pairs: [Expr, string][]) => {
    for (const pair of pairs) {
      const otherString = exprs.eapp("$string", [exprs.evar(pair[1])]);
      const equality = exprs.eapp(
        "=",
        isReversed ? [otherString, pair[0]] : [pair[0], otherString],
      );
      if (string === otherString) continue;
      current = insertNode(
        current,
        makeNode(
          [formula, equality],
          makeRule(name, [term, string, pair[0], otherString]),
          "prop",
          goalness,
          [[unequal(exprs, term, pair[0])]],
        ),
      );
    }
  };
  visit(names[0], false, context.index.getStringEqualities());
  visit(names[1], true, context.index.getReversedStringEqualities());
  return [current, false];
};

export const addReflexivity: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (formula.kind !== "not") return [queue, false];
  const atom = formula.args[0];
  if (atom.kind !== "app" || atom.args.length !== 2) return [queue, false];
  const left = atom.args[0];
  const right = atom.args[1];
  if (atom.symbol !== "=") {
    if (!context.relations.isReflexive(atom.symbol)) return [queue, false];
    return [
      insertNode(
        queue,
        makeNode(
          [formula],
          makeRelationRule("refl", atom.symbol, [left, right]),
          "arity",
          goalness,
          [[unequal(exprs, left, right)]],
        ),
      ),
      false,
    ];
  }
  if (left.kind === "meta" && right.kind === "meta")
    return [
      makeInstance(
        exprs,
        makeInstance(exprs, queue, right.args[0], left, goalness),
        left.args[0],
        right,
        goalness,
      ),
      false,
    ];
  if (left.kind === "meta")
    return [makeInstance(exprs, queue, left.args[0], right, goalness), false];
  if (right.kind === "meta")
    return [makeInstance(exprs, queue, right.args[0], left, goalness), false];
  return [queue, false];
};

export const addCongruence: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  if (formula.kind !== "not" || !isApp(formula.args[0], "=", 2)) return [queue, false];
  const left = formula.args[0].args[0];
  const right = formula.args[0].args[1];
  const leftString = getStringValue(left);
  const rightString = getStringValue(right);
  if (leftString !== undefined && rightString !== undefined && leftString !== rightString)
    return [queue, false];
  if (left.kind !== "app" || right.kind !== "app" || left.symbol !== right.symbol)
    return [queue, false];
  if (left.args.length !== right.args.length) return [queue, false];
  return [
    insertNode(
      queue,
      makeNode(
        [formula],
        makeRule("not_equal", [left, right]),
        "arity",
        goalness,
        makeInequalities(exprs, left.args, right.args),
      ),
    ),
    false,
  ];
};

const makeTransNode = (
  exprs: Expressions,
  isSymmetric: boolean,
  positive: [Expr, number],
  negative: [Expr, number],
) => {
  const atom = positive[0];
  const negated = negative[0].args[0];
  const relation = atom.symbol;
  const left = atom.args[0];
  const right = atom.args[1];
  const negatedLeft = negated.args[0];
  const negatedRight = negated.args[1];
  const terms = isSymmetric
    ? [negatedRight, left, right, negatedLeft]
    : [negatedLeft, left, right, negatedRight];
  return makeNode(
    [atom, negative[0]],
    makeRule(isSymmetric ? "trans_sym" : "trans", [atom, negative[0]]),
    relation === "=" ? "arity_eq" : "arity",
    Math.min(positive[1], negative[1]),
    [
      [unequal(exprs, terms[0], terms[1]), exprs.enot(exprs.eapp(relation, [terms[0], terms[1]]))],
      [unequal(exprs, terms[2], terms[3]), exprs.enot(exprs.eapp(relation, [terms[2], terms[3]]))],
    ],
  );
};

const makeTransEqualityNode = (
  context: SearchContext,
  isSymmetric: boolean,
  equality: [Expr, number],
  negative: [Expr, number],
) => {
  const exprs = context.exprs;
  const left = equality[0].args[0];
  const right = equality[0].args[1];
  const negated = negative[0].args[0];
  const relation = negated.symbol;
  const negatedLeft = negated.args[0];
  const negatedRight = negated.args[1];
  const isRelationSymmetric = context.relations.isSymmetric(relation);
  const terms = isSymmetric
    ? isRelationSymmetric
      ? [negatedRight, left, right, negatedLeft]
      : [negatedLeft, right, left, negatedRight]
    : [negatedLeft, left, right, negatedRight];
  const first = exprs.enot(exprs.eapp(relation, [terms[0], terms[1]]));
  const second = exprs.enot(exprs.eapp(relation, [terms[2], terms[3]]));
  const name = isSymmetric ? (isRelationSymmetric ? "trans_eq_sym" : "trans_eq2") : "trans_eq";
  return makeNode(
    [equality[0], negative[0]],
    makeRule(name, [left, right, negative[0]]),
    relation === "=" ? "arity_eq" : "arity",
    Math.min(equality[1], negative[1]),
    [
      [unequal(exprs, terms[0], terms[1]), first],
      [first, second],
      [unequal(exprs, terms[2], terms[3]), second],
    ],
  );
};

export const addTransitivity: SearchRule = (context, queue, formula, goalness) => {
  const exprs = context.exprs;
  const index = context.index;
  const relations = context.relations;
  const entry: [Expr, number] = [formula, goalness];
  const transEq = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransEqualityNode(context, isSymmetric, entry, match);
  const trans = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransNode(exprs, isSymmetric, entry, match);
  const negTrans = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransNode(exprs, isSymmetric, match, entry);
  const negTransEq = (isSymmetric: boolean) => (match: [Expr, number]) =>
    makeTransEqualityNode(context, isSymmetric, match, entry);
  if (isApp(formula, "=", 2)) {
    const left = formula.args[0];
    const right = formula.args[1];
    if (left.kind === "meta" && right.kind === "meta")
      return [insertAll(queue, index.findNegative("=").map(transEq(false))), false];
    if (!index.addTrans(formula)) return [queue, false];
    const leftHead = getHead(left);
    const rightHead = getHead(right);
    if (leftHead === undefined || rightHead === undefined) return [queue, false];
    return [
      insertAll(queue, [
        ...index.findAllNegTransLeft(leftHead).map(transEq(false)),
        ...index.findAllNegTransLeft(rightHead).map(transEq(true)),
        ...index.findAllNegTransRight(leftHead).map(transEq(true)),
        ...index.findAllNegTransRight(rightHead).map(transEq(false)),
      ]),
      false,
    ];
  }
  if (
    formula.kind === "app" &&
    formula.args.length === 2 &&
    relations.isTransitive(formula.symbol)
  ) {
    if (!index.addTrans(formula)) return [queue, false];
    const relation = formula.symbol;
    const leftHead = getHead(formula.args[0]);
    const rightHead = getHead(formula.args[1]);
    if (leftHead === undefined || rightHead === undefined) return [queue, false];
    const isSymmetric = relations.isSymmetric(relation);
    return [
      insertAll(queue, [
        ...index.findNegTransLeft(relation, leftHead).map(trans(false)),
        ...(isSymmetric ? index.findNegTransLeft(relation, rightHead) : []).map(trans(true)),
        ...(isSymmetric ? index.findNegTransRight(relation, leftHead) : []).map(trans(true)),
        ...index.findNegTransRight(relation, rightHead).map(trans(false)),
      ]),
      false,
    ];
  }
  if (formula.kind !== "not") return [queue, false];
  const atom = formula.args[0];
  if (atom.kind !== "app" || atom.args.length !== 2 || !relations.isTransitive(atom.symbol))
    return [queue, false];
  const relation = atom.symbol;
  index.addNegTrans(formula);
  const leftHead = getHead(atom.args[0]);
  const rightHead = getHead(atom.args[1]);
  if (leftHead === undefined || rightHead === undefined) return [queue, false];
  const isSymmetric = relations.isSymmetric(relation);
  const nodes = [
    ...index.findTransLeft(relation, leftHead).map(negTrans(false)),
    ...(isSymmetric ? index.findTransRight(relation, leftHead) : []).map(negTrans(true)),
    ...(isSymmetric ? index.findTransLeft(relation, rightHead) : []).map(negTrans(true)),
    ...index.findTransRight(relation, rightHead).map(negTrans(false)),
  ];
  const equalityNodes =
    relation === "="
      ? []
      : [
          ...index.findTransLeft("=", leftHead).map(negTransEq(false)),
          ...index.findTransRight("=", leftHead).map(negTransEq(true)),
          ...index.findTransLeft("=", rightHead).map(negTransEq(true)),
          ...index.findTransRight("=", rightHead).map(negTransEq(false)),
        ];
  return [insertAll(queue, [...equalityNodes.reverse(), ...nodes]), false];
};

export const addSymmetricMatches: SearchRule = (context, queue, formula, goalness) => {
  const entry: [Expr, number] = [formula, goalness];
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app" || atom.args.length !== 2 || atom.symbol === "=") return [queue, false];
  if (!context.relations.isSymmetric(atom.symbol)) return [queue, false];
  if (formula.kind === "not")
    return [
      context.index
        .findPositive(atom.symbol)
        .reduce(
          (current, match) => makeNotEquiv(context.exprs, current, true, match, entry),
          queue,
        ),
      false,
    ];
  return [
    context.index
      .findNegative(atom.symbol)
      .reduce((current, match) => makeNotEquiv(context.exprs, current, true, entry, match), queue),
    false,
  ];
};

export const addMatches: SearchRule = (context, queue, formula, goalness) => {
  const entry: [Expr, number] = [formula, goalness];
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app" || atom.symbol === "=") return [queue, false];
  if (formula.kind === "not")
    return [
      context.index
        .findPositive(atom.symbol)
        .reduce(
          (current, match) => makeNotEquiv(context.exprs, current, false, match, entry),
          queue,
        ),
      true,
    ];
  return [
    context.index
      .findNegative(atom.symbol)
      .reduce((current, match) => makeNotEquiv(context.exprs, current, false, entry, match), queue),
    true,
  ];
};

// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// The rules for sets: membership in each kind of set, set equality and inclusion.

import { isApp, type Expr } from "../expr";
import type { Priority } from "../node";
import { makeRule, type Rule } from "../proof";
import {
  equal,
  getBranches,
  isConstructor,
  isVariable,
  makeExtensionNode,
  makeInstanceNode,
  member,
  SET_CONSTRUCTORS,
  type Item,
  type Literal,
} from "./terms";

const decomposeAdd = (set: Expr): [Expr[], Expr] => {
  const elements: Expr[] = [];
  let rest = set;
  while (isApp(rest, "TLA.addElt", 2)) {
    elements.push(rest.args[0]);
    rest = rest.args[1];
  }
  return [elements, rest];
};

export const getMembershipNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  const instance = (priority: Priority, quantified: Expr, term: Expr) =>
    makeInstanceNode(literal, priority, quantified, term);
  if (relation?.symbol === "TLA.in") {
    const element = relation.args[0];
    const set = relation.args[1];
    if (!isNegated && isVariable(set, "TLA.emptyset"))
      return node("prop", makeRule("in_emptyset", [formula, element]), []);
    if (isApp(set, "TLA.upair", 2)) {
      const first = equal(exprs, element, set.args[0]);
      const second = equal(exprs, element, set.args[1]);
      return isNegated
        ? node(
            "prop",
            makeRule("notin_upair", [
              formula,
              exprs.enot(first),
              exprs.enot(second),
              element,
              set.args[0],
              set.args[1],
            ]),
            [[exprs.enot(first), exprs.enot(second)]],
          )
        : node(
            "prop",
            makeRule("in_upair", [formula, first, second, element, set.args[0], set.args[1]]),
            [[first], [second]],
          );
    }
    if (isApp(set, "TLA.addElt", 2)) {
      const decomposed = decomposeAdd(set);
      const isEmptyRest = decomposed[1] === exprs.evar("TLA.emptyset");
      if (!isNegated) {
        const equalities = decomposed[0].map((inner) => equal(exprs, element, inner));
        const formulas = isEmptyRest
          ? equalities
          : [...equalities, member(exprs, element, decomposed[1])];
        return node("prop", makeRule("in_addElt", [formula, element, set]), getBranches(formulas));
      }
      const inequalities = decomposed[0].map((inner) => exprs.enot(equal(exprs, element, inner)));
      const formulas = isEmptyRest
        ? inequalities
        : [exprs.enot(member(exprs, element, decomposed[1])), ...inequalities];
      return node("prop", makeRule("notin_addElt", [formula, element, set]), [formulas]);
    }
    if (isApp(set, "TLA.set"))
      return isNegated
        ? node("prop", makeRule("notin_set", [formula, element, set]), [
            set.args.map((inner) => exprs.enot(equal(exprs, element, inner))),
          ])
        : node(
            "prop",
            makeRule("in_set", [formula, element, set]),
            getBranches(set.args.map((inner) => equal(exprs, element, inner))),
          );
    if (isNegated && set.kind === "meta")
      return instance({ instance: set.args[0] }, set.args[0], exprs.eapp("TLA.set", [element]));
    if (isApp(set, "TLA.SUBSET", 1)) {
      const subset = exprs.eapp("TLA.subseteq", [element, set.args[0]]);
      return isNegated
        ? node(
            "prop",
            makeRule("notin_SUBSET", [formula, exprs.enot(subset), element, set.args[0]]),
            [[exprs.enot(subset)]],
          )
        : node("prop", makeRule("in_SUBSET", [formula, subset, element, set.args[0]]), [[subset]]);
    }
    if (isApp(set, "TLA.UNION", 1)) {
      const bound = exprs.newVar();
      const exists = exprs.eex(
        bound,
        "",
        exprs.eand(member(exprs, bound, set.args[0]), member(exprs, element, bound)),
      );
      return isNegated
        ? node(
            "arity",
            makeRule("notin_UNION", [formula, exprs.enot(exists), element, set.args[0]]),
            [[exprs.enot(exists)]],
          )
        : node("prop", makeRule("in_UNION", [formula, exists, element, set.args[0]]), [[exists]]);
    }
    const binarySetRules: Record<
      string,
      [
        "in_cup" | "in_cap" | "in_setminus",
        "notin_cup" | "notin_cap" | "notin_setminus",
        boolean,
        boolean,
      ]
    > = {
      "TLA.cup": ["in_cup", "notin_cup", true, false],
      "TLA.cap": ["in_cap", "notin_cap", false, true],
      "TLA.setminus": ["in_setminus", "notin_setminus", false, true],
    };
    const binarySetRule = set.kind === "app" ? binarySetRules[set.symbol] : undefined;
    if (binarySetRule !== undefined && set.args.length === 2) {
      const first = member(exprs, element, set.args[0]);
      const secondPositive = member(exprs, element, set.args[1]);
      const isMinus = set.symbol === "TLA.setminus";
      const second = isMinus !== isNegated ? exprs.enot(secondPositive) : secondPositive;
      const firstLiteral = isNegated ? exprs.enot(first) : first;
      const isSplit = isNegated ? binarySetRule[3] : binarySetRule[2];
      return node(
        "prop",
        makeRule(isNegated ? binarySetRule[1] : binarySetRule[0], [
          formula,
          firstLiteral,
          second,
          element,
          set.args[0],
          set.args[1],
        ]),
        isSplit ? [[firstLiteral], [second]] : [[firstLiteral, second]],
      );
    }
    if (isApp(set, "TLA.subsetOf", 2) && set.args[1].kind === "lam") {
      const predicate = set.args[1];
      const inBase = member(exprs, element, set.args[0]);
      const holds = exprs.substitute([[predicate.args[0], element]], predicate.args[1]);
      return isNegated
        ? node(
            "prop",
            makeRule("notin_subsetof", [
              formula,
              exprs.enot(inBase),
              exprs.enot(holds),
              element,
              set.args[0],
              predicate,
            ]),
            [[exprs.enot(inBase)], [exprs.enot(holds)]],
          )
        : node(
            "prop",
            makeRule("in_subsetof", [formula, inBase, holds, element, set.args[0], predicate]),
            [[inBase, holds]],
          );
    }
    if (isApp(set, "TLA.setOfAll", 2) && set.args[1].kind === "lam") {
      const predicate = set.args[1];
      const bound = exprs.newVar();
      const exists = exprs.eex(
        bound,
        "",
        exprs.eand(
          member(exprs, bound, set.args[0]),
          equal(exprs, element, exprs.substitute([[predicate.args[0], bound]], predicate.args[1])),
        ),
      );
      const result = isNegated ? exprs.enot(exists) : exists;
      return node(
        { instance: result },
        makeRule(isNegated ? "notin_setofall" : "in_setofall", [
          formula,
          result,
          element,
          set.args[0],
          predicate,
        ]),
        [[result]],
      );
    }
  }
  return undefined;
};

export const getSetEqualityNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (relation?.symbol !== "=") return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  if (!isNegated && isVariable(right, "TLA.emptyset")) {
    const bound = exprs.newVar();
    const empty = exprs.eall(bound, "", exprs.enot(member(exprs, bound, left)));
    return node("arity", makeRule("setequalempty", [formula, empty, left]), [[empty]]);
  }
  if (!isNegated && isVariable(left, "TLA.emptyset")) {
    const bound = exprs.newVar();
    const empty = exprs.eall(bound, "", exprs.enot(member(exprs, bound, right)));
    return node("arity", makeRule("setemptyequal", [formula, empty, right]), [[empty]]);
  }
  if (isConstructor(SET_CONSTRUCTORS, left) || isConstructor(SET_CONSTRUCTORS, right)) {
    const bound = exprs.newVar();
    const extensional = exprs.eall(
      bound,
      "",
      exprs.eequiv(member(exprs, bound, left), member(exprs, bound, right)),
    );
    const result = isNegated ? exprs.enot(extensional) : extensional;
    return node(
      { instance: result },
      makeRule(isNegated ? "notsetequal" : "setequal", [formula, result, left, right]),
      [[result]],
    );
  }
  return undefined;
};

// A metavariable in a set, against the disequalities of that set.
export const getMetaMembershipNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const index = literal.context.index;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (relation?.symbol === "TLA.in" && relation.args[0].kind === "meta") {
    const bound = exprs.newVar();
    return index.findDisequalities(relation.args[1]).flatMap((disequality) => {
      const sides: Expr[] = disequality.args[0].args;
      const different = exprs.enot(
        exprs.eall(
          bound,
          "",
          exprs.eequiv(member(exprs, bound, sides[0]), member(exprs, bound, sides[1])),
        ),
      );
      return node(
        { instance: different },
        makeRule("notsetequal", [disequality, different, sides[0], sides[1]]),
        [[different]],
      );
    });
  }
  return undefined;
};

export const getSubsetNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (relation?.symbol === "TLA.subseteq") {
    const left = relation.args[0];
    const right = relation.args[1];
    if (isApp(left, "TLA.cup", 2)) {
      const first = exprs.eapp("TLA.subseteq", [left.args[0], right]);
      const second = exprs.eapp("TLA.subseteq", [left.args[1], right]);
      return isNegated
        ? node(
            "arity",
            makeRule("not_cup_subseteq", [formula, exprs.enot(first), exprs.enot(second)]),
            [[exprs.enot(first)], [exprs.enot(second)]],
          )
        : node("arity", makeRule("cup_subseteq", [formula, first, second]), [[first, second]]);
    }
    if (isApp(right, "TLA.cap", 2)) {
      // Zenon builds the same subset twice here, from the second set.
      const subset = exprs.eapp("TLA.subseteq", [left, right.args[1]]);
      return isNegated
        ? node(
            "arity",
            makeRule("not_subseteq_cap", [formula, exprs.enot(subset), exprs.enot(subset)]),
            [[exprs.enot(subset)], [exprs.enot(subset)]],
          )
        : node("arity", makeRule("subseteq_cap", [formula, subset, subset]), [[subset, subset]]);
    }
  }
  return undefined;
};

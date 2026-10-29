// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// The TLA+ extension: rules for set theory, functions, records, tuples, CHOOSE, IF and CASE, and
// rewriting a subterm with an equality on the branch.

import {
  FALSE,
  isApp,
  TRUE,
  type Expr,
  type Expressions,
  type NegatedRelationExpr,
  type RelationExpr,
} from "../expr";
import type { Node, Priority } from "../node";
import type { Phrase } from "../parse";
import { makeRule, type Rule } from "../proof";
import { getFunctionNodes, getFunctionSetNodes } from "./functions";
import { getRecordNodes, getTupleNodes } from "./records";
import { getRewriteNodes } from "./rewrites";
import {
  getMembershipNodes,
  getMetaMembershipNodes,
  getSetEqualityNodes,
  getSubsetNodes,
} from "./sets";
import {
  equal,
  FUNCTION_CONSTRUCTORS,
  getLiteral,
  isNotEquiv,
  isVariable,
  makeExtensionNode,
  makeInstanceNode,
  member,
  SET_CONSTRUCTORS,
  type Item,
  type Literal,
  type TlaContext,
} from "./terms";

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

const definition = (
  exprs: Expressions,
  name: string,
  symbol: string,
  params: string[],
  body: Expr,
): Phrase => ({
  kind: "def",
  definition: {
    kind: "real",
    name,
    symbol,
    params: params.map((param) => exprs.evar(param)),
    body,
  },
});

// Zenon's built_in_defs. Expressions belong to one run of the prover, so each run builds them.
export const getBuiltInDefinitions = (exprs: Expressions): Phrase[] => {
  const bound = exprs.evar("x");
  const isInSet = exprs.eapp("TLA.in", [bound, exprs.evar("S")]);
  const holds = exprs.eapp("P", [bound]);
  return [
    definition(
      exprs,
      "subset_def",
      "TLA.subseteq",
      ["A", "B"],
      exprs.eapp("TLA.bAll", [
        exprs.evar("A"),
        exprs.elam(bound, "", exprs.eapp("TLA.in", [bound, exprs.evar("B")])),
      ]),
    ),
    definition(
      exprs,
      "bAll_def",
      "TLA.bAll",
      ["S", "P"],
      exprs.eall(bound, "", exprs.eimply(isInSet, holds)),
    ),
    definition(
      exprs,
      "bEx_def",
      "TLA.bEx",
      ["S", "P"],
      exprs.eex(bound, "", exprs.eand(isInSet, holds)),
    ),
    definition(
      exprs,
      "bChoose_def",
      "TLA.bChoice",
      ["S", "P"],
      exprs.etau(bound, "", exprs.eand(isInSet, holds)),
    ),
    definition(
      exprs,
      "prod_def",
      "TLA.prod",
      ["A", "B"],
      exprs.eapp("TLA.Product", [exprs.eapp("TLA.tuple", [exprs.evar("A"), exprs.evar("B")])]),
    ),
  ];
};

// The elements of a set given by enumeration, and whether it may hold more.
const getSetValues = (set: Expr): [Expr[], boolean] => {
  if (isVariable(set, "TLA.emptyset")) return [[], false];
  if (isApp(set, "TLA.upair", 2)) return [set.args, false];
  if (isApp(set, "TLA.set")) return [set.args, false];
  if (isApp(set, "TLA.addElt", 2)) {
    const rest = getSetValues(set.args[1]);
    return [[set.args[0], ...rest[0]], rest[1]];
  }
  if (isApp(set, "TLA.union", 2)) {
    const left = getSetValues(set.args[0]);
    const right = getSetValues(set.args[1]);
    return [[...left[0], ...right[0]], left[1] || right[1]];
  }
  return [[], true];
};

const getBooleanNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const atom = literal.atom;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  const instance = (priority: Priority, quantified: Expr, term: Expr) =>
    makeInstanceNode(literal, priority, quantified, term);
  if (atom.kind === "meta") return instance("arity", atom.args[0], isNegated ? TRUE : FALSE);
  if (relation?.symbol !== "=") return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  if (right.kind === "true")
    return isNegated
      ? node("prop", makeRule("noteq_x_true", [formula, exprs.enot(left), left]), [
          [exprs.enot(left)],
        ])
      : node("prop", makeRule("eq_x_true", [formula, left, left]), [[left]]);
  if (left.kind === "true")
    return isNegated
      ? node("prop", makeRule("noteq_true_x", [formula, exprs.enot(right), right]), [
          [exprs.enot(right)],
        ])
      : node("prop", makeRule("eq_true_x", [formula, right, right]), [[right]]);
  if (!isNegated && right.kind === "false")
    return node("prop", makeRule("eq_x_false", [formula, exprs.enot(left), left]), [
      [exprs.enot(left)],
    ]);
  if (!isNegated && left.kind === "false")
    return node("prop", makeRule("eq_false_x", [formula, exprs.enot(right), right]), [
      [exprs.enot(right)],
    ]);
  return undefined;
};

const getChoiceNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const goalness = literal.goalness;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (relation === undefined) return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  const isEquality = relation.symbol === "=";
  if (
    isNegated &&
    isEquality &&
    left.kind === "tau" &&
    right.kind === "tau" &&
    !isNotEquiv(left.args[1]) &&
    !isNotEquiv(right.args[1])
  ) {
    const bound = exprs.newVar();
    const leftBody = exprs.substitute([[left.args[0], bound]], left.args[1]);
    const rightBody = exprs.substitute([[right.args[0], bound]], right.args[1]);
    const differ = exprs.eex(bound, left.symbol, exprs.eapp("$notequiv", [leftBody, rightBody]));
    return node(
      { instance: differ },
      makeRule("choose_diff_choose", [
        formula,
        differ,
        exprs.elam(left.args[0], left.symbol, left.args[1]),
        exprs.elam(right.args[0], right.symbol, right.args[1]),
      ]),
      [[differ]],
    );
  }
  if (!isNegated && relation.symbol === "$notequiv")
    return node("arity", makeRule("notequivdef", []), [[exprs.enot(exprs.eequiv(left, right))]]);
  const choice = right.kind === "tau" ? right : left.kind === "tau" ? left : undefined;
  if (isNegated && isEquality && choice !== undefined) {
    const term = right.kind === "tau" ? left : right;
    const exists = exprs.eex(choice.args[0], choice.symbol, choice.args[1]);
    const notExists = exprs.enot(exists);
    const notHolds = exprs.enot(exprs.substitute([[choice.args[0], term]], choice.args[1]));
    return [
      {
        conclusions: [],
        rule: makeRule("notequalchoose", [
          exists,
          notExists,
          notHolds,
          exprs.elam(choice.args[0], choice.symbol, choice.args[1]),
          term,
        ]),
        priority: { instance: notExists },
        goalness,
        branches: [[exists], [notExists, notHolds]],
      },
    ];
  }
  return undefined;
};

// The bounded quantifier over an enumerated set in \A x : x \in S => P or ~\E x : x \in S /\ P.
const getEnumeratedQuantifier = (formula: Expr) => {
  const isEnumerated = (set: Expr) =>
    isVariable(set, "TLA.emptyset") ||
    (set.kind === "app" &&
      ["TLA.addElt", "TLA.upair", "TLA.set", "TLA.union"].includes(set.symbol));
  if (formula.kind === "all") {
    const body = formula.args[1];
    if (
      body.kind === "imply" &&
      isApp(body.args[0], "TLA.in", 2) &&
      isEnumerated(body.args[0].args[1])
    )
      return { quantified: formula, set: body.args[0].args[1] };
  }
  if (formula.kind === "not" && formula.args[0].kind === "ex") {
    const body = formula.args[0].args[1];
    if (
      body.kind === "and" &&
      isApp(body.args[0], "TLA.in", 2) &&
      isEnumerated(body.args[0].args[1])
    )
      return { quantified: formula.args[0], set: body.args[0].args[1] };
  }
  return undefined;
};

const getEnumeratedNodes = (literal: Literal): Item[] | undefined => {
  const formula = literal.formula;
  const instance = (priority: Priority, quantified: Expr, term: Expr) =>
    makeInstanceNode(literal, priority, quantified, term);
  const enumerated = getEnumeratedQuantifier(formula);
  if (enumerated !== undefined) {
    const values = getSetValues(enumerated.set);
    const nodes: Item[] = values[0].flatMap((value) =>
      instance("arity", enumerated.quantified, value),
    );
    return values[1] ? nodes : [...nodes, "stop"];
  }
  return undefined;
};

const getNaturalNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  const instance = (priority: Priority, quantified: Expr, term: Expr) =>
    makeInstanceNode(literal, priority, quantified, term);
  if (isNegated && relation?.symbol === "TLA.in" && isVariable(relation.args[1], "arith.N")) {
    const left = relation.args[0];
    if (isVariable(left, "0")) return node("prop", makeRule("in_nat_0", [formula]), []);
    if (isApp(left, "TLA.fapply", 2) && isVariable(left.args[0], "TLA.Succ")) {
      const previous = exprs.enot(member(exprs, left.args[1], exprs.evar("arith.N")));
      return node("prop", makeRule("in_nat_succ", [formula, previous, left.args[1]]), [[previous]]);
    }
    if (left.kind === "meta")
      return instance({ instance: left.args[0] }, left.args[0], exprs.evar("0"));
  }
  return undefined;
};

const getPropNodes = (context: TlaContext, formula: Expr, goalness: number): Item[] => {
  const literal = getLiteral(context, formula, goalness);
  return (
    getBooleanNodes(literal) ??
    getMembershipNodes(literal) ??
    getFunctionSetNodes(literal) ??
    getSetEqualityNodes(literal) ??
    getFunctionNodes(literal) ??
    getChoiceNodes(literal) ??
    getEnumeratedNodes(literal) ??
    getNaturalNodes(literal) ??
    getMetaMembershipNodes(literal) ??
    (!literal.isNegated && isApp(literal.atom, "TLA.box", 1)
      ? makeExtensionNode(literal, "prop", makeRule("box_p", [formula, literal.atom.args[0]]), [
          [literal.atom.args[0]],
        ])
      : undefined) ??
    getTupleNodes(literal) ??
    getRecordNodes(literal) ??
    getSubsetNodes(literal) ??
    []
  );
};

// Zenon's newnodes_inst_bounded: instantiates \A x \in S : P and ~\E x \in S : P with the terms
// known to be in S.
const getBoundedInstances = (context: TlaContext, formula: Expr, goalness: number): Node[] => {
  const exprs = context.exprs;
  const index = context.index;
  const makeNode = (
    name: "all_in" | "notex_in",
    bounded: Expr,
    membership: Expr,
    set: Expr,
    predicate: Expr,
    term: Expr,
  ): Node => {
    const instance =
      name === "all_in" ? exprs.apply(predicate, term) : exprs.enot(exprs.apply(predicate, term));
    return {
      conclusions: bounded === formula ? [membership, formula] : [formula, bounded],
      rule: makeRule(name, [bounded, membership, instance, set, predicate]),
      priority: { instance: formula },
      goalness,
      branches: [[instance]],
    };
  };
  const getTermsIn = (set: Expr) =>
    index
      .findPositive("TLA.in")
      .map((entry) => entry[0])
      .filter(
        (membership): membership is RelationExpr =>
          isApp(membership, "TLA.in", 2) &&
          membership.args[0].metas.length === 0 &&
          membership.args[1] === set,
      );
  if (isApp(formula, "TLA.in", 2) && formula.args[0].metas.length === 0) {
    const term = formula.args[0];
    const set = formula.args[1];
    const universals = index
      .findPositive("TLA.bAll")
      .map((entry) => entry[0])
      .filter(
        (bounded): bounded is RelationExpr =>
          isApp(bounded, "TLA.bAll", 2) && bounded.args[0] === set,
      );
    const existentials = index
      .findNegative("TLA.bEx")
      .map((entry) => entry[0])
      .filter(
        (bounded): bounded is NegatedRelationExpr =>
          bounded.kind === "not" &&
          isApp(bounded.args[0], "TLA.bEx", 2) &&
          bounded.args[0].args[0] === set,
      );
    const notExists = existentials.map((bounded) =>
      makeNode("notex_in", bounded, formula, set, bounded.args[0].args[1], term),
    );
    const forAll = universals.map((bounded) =>
      makeNode("all_in", bounded, formula, set, bounded.args[1], term),
    );
    return [...forAll.reverse(), ...notExists];
  }
  if (isApp(formula, "TLA.bAll", 2))
    return getTermsIn(formula.args[0]).map((membership) =>
      makeNode("all_in", formula, membership, formula.args[0], formula.args[1], membership.args[0]),
    );
  if (formula.kind === "not" && isApp(formula.args[0], "TLA.bEx", 2)) {
    const bounded = formula.args[0];
    return getTermsIn(bounded.args[0]).map((membership) =>
      makeNode(
        "notex_in",
        formula,
        membership,
        bounded.args[0],
        bounded.args[1],
        membership.args[0],
      ),
    );
  }
  return [];
};

const makePropositionEqualityNode = (
  exprs: Expressions,
  name: "p_eq_l" | "p_eq_r" | "np_eq_l" | "np_eq_r",
  formula: Expr,
  left: Expr,
  right: Expr,
  goalness: number,
): Node => {
  const isNegated = name === "np_eq_l" || name === "np_eq_r";
  const isLeft = name === "p_eq_l" || name === "np_eq_l";
  const proposition = isNegated && formula.kind === "not" ? formula.args[0] : formula;
  const equality = equal(exprs, left, right);
  const differ = exprs.enot(equal(exprs, proposition, isLeft ? left : right));
  const other = isLeft ? right : left;
  const rest = isNegated ? exprs.enot(other) : other;
  return {
    conclusions: [formula, equality],
    rule: makeRule(
      name,
      isNegated
        ? [formula, equality, differ, rest, proposition, left, right]
        : [formula, equality, differ, other, formula, left, right],
    ),
    priority: "arity_eq",
    goalness,
    branches: [[differ], [rest]],
  };
};

const getPropositionEqualityNodes = (context: TlaContext, formula: Expr, goalness: number) => {
  const exprs = context.exprs;
  const index = context.index;
  const atom = formula.kind === "not" ? formula.args[0] : formula;
  if (atom.kind !== "app") return [];
  const isNegated = formula.kind === "not";
  const make = (isLeft: boolean) => (entry: [RelationExpr, number]) =>
    makePropositionEqualityNode(
      exprs,
      isNegated ? (isLeft ? "np_eq_l" : "np_eq_r") : isLeft ? "p_eq_l" : "p_eq_r",
      formula,
      entry[0].args[0],
      entry[0].args[1],
      goalness,
    );
  return [
    ...index.findTransLeft("=", atom.symbol).map(make(true)),
    ...index.findTransRight("=", atom.symbol).map(make(false)),
  ];
};

const getEqualityPropositionNodes = (
  context: TlaContext,
  formula: Expr,
  isLeft: boolean,
): Node[] => {
  const exprs = context.exprs;
  if (!isApp(formula, "=", 2)) return [];
  const term = formula.args[isLeft ? 0 : 1];
  if (term.kind !== "app") return [];
  const index = context.index;
  const make = (isNegated: boolean) => (entry: [Expr, number]) =>
    makePropositionEqualityNode(
      exprs,
      isNegated ? (isLeft ? "np_eq_l" : "np_eq_r") : isLeft ? "p_eq_l" : "p_eq_r",
      entry[0],
      formula.args[0],
      formula.args[1],
      entry[1],
    );
  return [
    ...index.findPositive(term.symbol).map(make(false)),
    ...index.findNegative(term.symbol).map(make(true)),
  ];
};

export interface ExtensionNodes {
  nodes: Node[];
  isStopped: boolean;
}

export const getExtensionNodes = (
  context: TlaContext,
  formula: Expr,
  goalness: number,
): ExtensionNodes => {
  // OCaml evaluates the operands of @ right to left, so the last rules run first. The order
  // decides the names of fresh variables.
  const bounded = getBoundedInstances(context, formula, goalness);
  const right = getEqualityPropositionNodes(context, formula, false);
  const left = getEqualityPropositionNodes(context, formula, true);
  const propositions = getPropositionEqualityNodes(context, formula, goalness);
  const rewrites = getRewriteNodes(context, formula, goalness);
  const props = getPropNodes(context, formula, goalness);
  const items = [...props, ...rewrites, ...propositions, ...left, ...right, ...bounded];
  const stop = items.indexOf("stop");
  const kept = stop === -1 ? items : items.slice(0, stop);
  return { nodes: kept.filter((item): item is Node => item !== "stop"), isStopped: stop !== -1 };
};

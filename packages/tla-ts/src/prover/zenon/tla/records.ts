// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.
//
// The rules for tuples and records.

import { compareExprs, isApp, type Expr } from "../expr";
import { stableSort } from "../ocaml";
import type { Priority } from "../node";
import { makeRule, type Rule } from "../proof";
import {
  domain,
  equal,
  fapply,
  getBranches,
  getPairs,
  isTriviallyNotIn,
  makeExtensionNode,
  makeNatural,
  member,
  type Item,
  type Literal,
} from "./terms";

const getStringName = (expression: Expr) =>
  isApp(expression, "$string", 1) && expression.args[0].kind === "var"
    ? expression.args[0].symbol
    : undefined;

// Zenon's check_record_labels on sorted fields: false for Invalid_record, a repeated label.
const hasDistinctLabels = (pairs: [Expr, Expr][]) => {
  for (let index = 0; index + 1 < pairs.length; index++) {
    const left = pairs[index][0];
    const right = pairs[index + 1][0];
    const leftName = getStringName(left);
    if (leftName !== undefined && leftName === getStringName(right)) return false;
    if (left === right) return false;
  }
  return true;
};

const sortPairs = (pairs: [Expr, Expr][]) =>
  stableSort(pairs, (left, right) => compareExprs(left[0], right[0]));

const getSortedLabels = (args: Expr[]) => {
  const sorted = stableSort(
    getPairs(args).map((pair) => pair[0]),
    compareExprs,
  );
  return sorted.filter(
    (label, index) => index === 0 || compareExprs(sorted[index - 1], label) !== 0,
  );
};

export const getTupleNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const atom = literal.atom;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (isNegated && isApp(atom, "TLA.isASeq", 1) && isApp(atom.args[0], "TLA.tuple"))
    return node("prop", makeRule("tuple_notisaseq", [formula]), []);
  if (relation === undefined) return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  const isEquality = relation.symbol === "=";
  const isMembership = relation.symbol === "TLA.in";
  if (!isNegated && isEquality && isApp(left, "TLA.tuple") && isApp(right, "TLA.tuple")) {
    if (left.args.length !== right.args.length)
      return node("prop", makeRule("tuple_eq_mismatch", [formula, formula]), []);
    const equalities = left.args.map((inner, position) =>
      equal(exprs, inner, right.args[position]),
    );
    return node("prop", makeRule("tuple_eq_match", [formula, ...equalities]), [equalities]);
  }
  if (isMembership && isApp(right, "TLA.Product", 1) && isApp(right.args[0], "TLA.tuple")) {
    const element = left;
    const tuple = right.args[0];
    if (!isNegated) {
      const components = tuple.args.map((inner, position) =>
        member(exprs, fapply(exprs, element, makeNatural(exprs, position + 1)), inner),
      );
      const isSequence = exprs.eapp("TLA.isASeq", [element]);
      const hasLength = equal(
        exprs,
        exprs.eapp("TLA.Len", [element]),
        makeNatural(exprs, tuple.args.length),
      );
      return node(
        "prop",
        makeRule("in_product", [formula, element, tuple, isSequence, hasLength, ...components]),
        [[isSequence, hasLength, ...components]],
      );
    }
    if (
      isApp(element, "TLA.tuple") &&
      (element.args.length !== tuple.args.length ||
        element.args.some((inner, position) => isTriviallyNotIn(inner, tuple.args[position])))
    )
      return [];
    const components = tuple.args.map((inner, position) =>
      exprs.enot(member(exprs, fapply(exprs, element, makeNatural(exprs, position + 1)), inner)),
    );
    const formulas = [
      exprs.enot(exprs.eapp("TLA.isASeq", [element])),
      exprs.enot(
        equal(exprs, exprs.eapp("TLA.Len", [element]), makeNatural(exprs, tuple.args.length)),
      ),
      ...components,
    ];
    return node(
      "prop",
      makeRule("notin_product", [formula, element, tuple, ...formulas]),
      getBranches(formulas),
    );
  }
  return undefined;
};

export const getRecordNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const atom = literal.atom;
  const relation = literal.relation;
  const node = (priority: Priority, rule: Rule, branches: Expr[][]) =>
    makeExtensionNode(literal, priority, rule, branches);
  if (isNegated && isApp(atom, "TLA.isAFcn", 1) && isApp(atom.args[0], "TLA.record"))
    return node("prop", makeRule("record_notisafcn", [formula]), []);
  if (relation === undefined) return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  const isEquality = relation.symbol === "=";
  const isMembership = relation.symbol === "TLA.in";
  if (isEquality && isApp(left, "TLA.record") && isApp(right, "TLA.record")) {
    const leftFields = sortPairs(getPairs(left.args));
    const rightFields = sortPairs(getPairs(right.args));
    if (!hasDistinctLabels(leftFields) || !hasDistinctLabels(rightFields)) return [];
    const isMatch =
      leftFields.length === rightFields.length &&
      leftFields.every((field, position) => field[0] === rightFields[position][0]);
    if (!isMatch)
      return isNegated ? [] : node("prop", makeRule("record_eq_mismatch", [formula, formula]), []);
    const equalities = leftFields.map((field, position) =>
      equal(exprs, field[1], rightFields[position][1]),
    );
    if (!isNegated)
      return node("prop", makeRule("record_eq_match", [formula, ...equalities]), [equalities]);
    const inequalities = equalities.map((inner) => exprs.enot(inner));
    return node(
      "prop",
      makeRule("record_neq_match", [formula, ...inequalities]),
      getBranches(inequalities),
    );
  }
  if (isNegated && isEquality && (isApp(right, "TLA.record") || isApp(left, "TLA.record"))) {
    const record = isApp(right, "TLA.record") ? right : left;
    const other = isApp(right, "TLA.record") ? left : right;
    const pairs = getPairs(record.args);
    const formulas = [
      exprs.enot(exprs.eapp("TLA.isAFcn", [other])),
      exprs.enot(
        equal(
          exprs,
          domain(exprs, other),
          exprs.eapp(
            "TLA.set",
            pairs.map((pair) => pair[0]),
          ),
        ),
      ),
      ...pairs.map((pair) => exprs.enot(equal(exprs, fapply(exprs, other, pair[0]), pair[1]))),
    ];
    return node(
      "prop",
      makeRule(record === right ? "neq_record" : "record_neq", [
        formula,
        other,
        record,
        ...formulas,
      ]),
      getBranches(formulas),
    );
  }
  if (isMembership && isApp(right, "TLA.recordset")) {
    const pairs = getPairs(right.args);
    const labels = exprs.eapp(
      "TLA.set",
      pairs.map((pair) => pair[0]),
    );
    if (!isNegated) {
      const formulas = [
        exprs.eapp("TLA.isAFcn", [left]),
        equal(exprs, domain(exprs, left), labels),
        ...pairs.map((pair) => member(exprs, fapply(exprs, left, pair[0]), pair[1])),
      ];
      return node("prop", makeRule("in_recordset", [formula, left, right, ...formulas]), [
        formulas,
      ]);
    }
    if (isApp(left, "TLA.record")) {
      const leftLabels = getSortedLabels(left.args);
      const rightLabels = getSortedLabels(right.args);
      const isSameLabels =
        leftLabels.length === rightLabels.length &&
        leftLabels.every((label, position) => label === rightLabels[position]);
      const isFieldNotIn = getPairs(left.args).some((field) => {
        const type = pairs.find((pair) => pair[0] === field[0]);
        return type === undefined || isTriviallyNotIn(field[1], type[1]);
      });
      if (!isSameLabels || isFieldNotIn) return [];
    }
    const formulas = [
      exprs.enot(exprs.eapp("TLA.isAFcn", [left])),
      exprs.enot(equal(exprs, domain(exprs, left), labels)),
      ...pairs.map((pair) => exprs.enot(member(exprs, fapply(exprs, left, pair[0]), pair[1]))),
    ];
    return node(
      "prop",
      makeRule("notin_recordset", [formula, left, right, ...formulas]),
      getBranches(formulas),
    );
  }
  return undefined;
};

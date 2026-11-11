// Ported from Zenon's ext_tla.ml, as shipped in tlapm. Copyright 2008 INRIA, see LICENSE.

import { isApp } from "../expr";
import type { Priority } from "../node";
import { makeRule } from "../proof";
import {
  domain,
  equal,
  fapply,
  FUNCTION_CONSTRUCTORS,
  isConstructor,
  makeExtensionNode,
  member,
  type Item,
  type Literal,
} from "./terms";

export const getFunctionSetNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const relation = literal.relation;
  if (relation?.symbol === "TLA.in") {
    const element = relation.args[0];
    const set = relation.args[1];
    if (isApp(set, "TLA.FuncSet", 2)) {
      const fcn = element;
      const source = set.args[0];
      const target = set.args[1];
      const fcnFormula = exprs.eapp("TLA.isAFcn", [fcn]);
      const domainFormula = equal(exprs, domain(exprs, fcn), source);
      const bound = exprs.newVar();
      const maps = exprs.eall(
        bound,
        "",
        exprs.eimply(
          member(exprs, bound, source),
          member(exprs, fapply(exprs, fcn, bound), target),
        ),
      );
      if (!isNegated) {
        const rule = makeRule("in_funcset", [
          formula,
          fcnFormula,
          domainFormula,
          maps,
          fcn,
          source,
          target,
        ]);
        return [
          ...makeExtensionNode(literal, "arity", rule, [[fcnFormula, domainFormula]]),
          ...makeExtensionNode(literal, { instance: maps }, rule, [
            [fcnFormula, domainFormula, maps],
          ]),
        ];
      }
      const notFcn = exprs.enot(fcnFormula);
      const notDomain = exprs.enot(domainFormula);
      const notMaps = exprs.enot(maps);
      const priority: Priority =
        fcn.kind === "app" && FUNCTION_CONSTRUCTORS.includes(fcn.symbol)
          ? "arity"
          : { instance: notMaps };
      const shortcut = isApp(fcn, "TLA.except", 3)
        ? makeExtensionNode(
            literal,
            "arity",
            makeRule("except_notin_funcset", [
              formula,
              exprs.enot(member(exprs, fcn.args[0], exprs.eapp("TLA.FuncSet", [source, target]))),
              exprs.enot(member(exprs, fcn.args[2], target)),
              fcn.args[0],
              fcn.args[1],
              fcn.args[2],
              source,
              target,
            ]),
            [
              [exprs.enot(member(exprs, fcn.args[0], exprs.eapp("TLA.FuncSet", [source, target])))],
              [exprs.enot(member(exprs, fcn.args[2], target))],
            ],
          )
        : [];
      return [
        ...shortcut,
        ...makeExtensionNode(
          literal,
          priority,
          makeRule("notin_funcset", [formula, notFcn, notDomain, notMaps, fcn, source, target]),
          [[notFcn], [notDomain], [notMaps]],
        ),
      ];
    }
  }
  return undefined;
};

export const getFunctionNodes = (literal: Literal): Item[] | undefined => {
  const exprs = literal.context.exprs;
  const formula = literal.formula;
  const isNegated = literal.isNegated;
  const atom = literal.atom;
  const relation = literal.relation;
  if (isNegated && isApp(atom, "TLA.isAFcn", 1)) {
    const fcn = atom.args[0];
    if (isApp(fcn, "TLA.Fcn", 2))
      return makeExtensionNode(
        literal,
        "prop",
        makeRule("notisafcn_fcn", [formula, fcn.args[0], fcn.args[1]]),
        [],
      );
    if (isApp(fcn, "TLA.except", 3))
      return makeExtensionNode(
        literal,
        "prop",
        makeRule("notisafcn_except", [formula, fcn.args[0], fcn.args[1], fcn.args[2]]),
        [],
      );
    if (isApp(fcn, "TLA.oneArg", 2))
      return makeExtensionNode(
        literal,
        "prop",
        makeRule("notisafcn_onearg", [formula, fcn.args[0], fcn.args[1]]),
        [],
      );
    if (isApp(fcn, "TLA.extend", 2))
      return makeExtensionNode(
        literal,
        "prop",
        makeRule("notisafcn_extend", [formula, fcn.args[0], fcn.args[1]]),
        [],
      );
  }
  if (relation?.symbol !== "=") return undefined;
  const left = relation.args[0];
  const right = relation.args[1];
  if (isConstructor(FUNCTION_CONSTRUCTORS, left) || isConstructor(FUNCTION_CONSTRUCTORS, right)) {
    const bound = exprs.newVar();
    const sameDomain = equal(exprs, domain(exprs, left), domain(exprs, right));
    const sameValue = equal(exprs, fapply(exprs, left, bound), fapply(exprs, right, bound));
    if (!isNegated) {
      const fcnEquivalence = exprs.eequiv(
        exprs.eapp("TLA.isAFcn", [left]),
        exprs.eapp("TLA.isAFcn", [right]),
      );
      const values = exprs.eall(bound, "", sameValue);
      const result = exprs.eand(exprs.eand(fcnEquivalence, sameDomain), values);
      return makeExtensionNode(
        literal,
        { instance: values },
        makeRule("funequal", [formula, result, left, right]),
        [[result]],
      );
    }
    const values = exprs.eall(
      bound,
      "",
      exprs.eimply(member(exprs, bound, domain(exprs, right)), sameValue),
    );
    const result = exprs.enot(
      exprs.eand(
        exprs.eand(
          exprs.eand(exprs.eapp("TLA.isAFcn", [left]), exprs.eapp("TLA.isAFcn", [right])),
          sameDomain,
        ),
        values,
      ),
    );
    return makeExtensionNode(
      literal,
      { instance: values },
      makeRule("notfunequal", [formula, result, left, right]),
      [[result]],
    );
  }
  return undefined;
};

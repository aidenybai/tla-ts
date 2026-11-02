// Ported from Zenon's prove.ml, as shipped in tlapm. Copyright 2002 INRIA, see LICENSE.
//
// Zenon's newnodes: each rule in turn suggests nodes for a formula added to a branch, until one
// says that the rest don't apply.

import type { Relations } from "./eqrel";
import {
  addCongruence,
  addMatches,
  addReflexivity,
  addStringEqualities,
  addSymmetricMatches,
  addTransitivity,
} from "./equality-rules";
import { type Expr, type Expressions } from "./expr";
import type { Index } from "./index-table";
import { insertNode, type Node, type Priority, type Queue } from "./node";
import type { Rule } from "./proof";
import {
  addAbsurd,
  addAlpha,
  addBeta,
  addClosure,
  addDelta,
  addGamma,
  addJunctionTree,
  addUnfold,
  addUseless,
} from "./propositional-rules";
import { getExtensionNodes } from "./tla/tla";

export interface SearchContext {
  index: Index;
  relations: Relations;
  exprs: Expressions;
}

export type RuleResult = [Queue, boolean];

export type SearchRule = (
  context: SearchContext,
  queue: Queue,
  formula: Expr,
  goalness: number,
) => RuleResult;

export const makeNode = (
  conclusions: Expr[],
  rule: Rule,
  priority: Priority,
  goalness: number,
  branches: Expr[][],
): Node => ({ conclusions, rule, priority, goalness, branches });

export const unequal = (exprs: Expressions, left: Expr, right: Expr) =>
  exprs.enot(exprs.eapp("=", [left, right]));

export const insertAll = (queue: Queue, nodes: Node[]) => nodes.reduce(insertNode, queue);

const addExtensions: SearchRule = (context, queue, formula, goalness) => {
  const result = getExtensionNodes(context, formula, goalness);
  return [insertAll(queue, result.nodes), result.isStopped];
};

// Zenon's newnodes_preunif comes after addReflexivity, but it never adds a node: it preunifies a
// formula with its negation, whose heads always differ.
const RULES: SearchRule[] = [
  addAbsurd,
  addClosure,
  addExtensions,
  addJunctionTree,
  addAlpha,
  addBeta,
  addStringEqualities,
  addDelta,
  addGamma,
  addUnfold,
  addReflexivity,
  addCongruence,
  addTransitivity,
  addSymmetricMatches,
  addMatches,
  addUseless,
];

export const addNodes = (context: SearchContext, queue: Queue, formula: Expr, goalness: number) => {
  let current = queue;
  for (const rule of RULES) {
    const result = rule(context, current, formula, goalness);
    current = result[0];
    if (result[1]) break;
  }
  return current;
};

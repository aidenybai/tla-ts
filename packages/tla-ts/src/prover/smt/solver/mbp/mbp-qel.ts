// Ported from Z3 (src/qe/mbp/mbp_qel.cpp), MIT license, see z3-license.txt.
import { OP_DISTINCT, OP_IMPLIES, OP_ITE, OP_OR, SORT_BOOL } from "../ast";
import { flattenAndVector, isAppOf } from "../ast-util";
import { RefVector } from "../ref-vector";
import { MbpBasicTg } from "./mbp-basic-tg";
import type { MbpContext } from "./mbp-plugin";
import { TermGraph } from "./mbp-term-graph";

// Projects the variables with the term graph's rules until saturation, first without and then with
// splits on the model. The caller rules out arrays and datatypes, whose rules are not ported.
export const applyMbpQel = (context: MbpContext, vars: RefVector, formula: number) => {
  const manager = context.manager;
  if (vars.size === 0) return formula;
  // Splitting also visits inactive branches, whose conditions may be undefined.
  const wasCompletion = context.isCompletion;
  context.isCompletion = true;
  const termGraph = new TermGraph(manager);
  termGraph.addVars(vars.items);
  termGraph.setExplicitEq();
  const fmls = new RefVector(manager);
  fmls.push(formula);
  flattenAndVector(manager, fmls);
  termGraph.addLits(fmls.items);
  fmls.reset();
  const basic = new MbpBasicTg(context, termGraph, new Set());
  while (basic.apply());
  basic.isUsingModel = true;
  while (basic.apply());
  termGraph.qel(vars);
  const isNonCore = (expr: number) =>
    isAppOf(manager, expr, OP_ITE) ||
    isAppOf(manager, expr, OP_OR) ||
    isAppOf(manager, expr, OP_IMPLIES) ||
    isAppOf(manager, expr, OP_DISTINCT);
  termGraph.qel(vars, isNonCore);
  // The remaining Boolean variables get their values.
  const substituted = new Set<number>();
  for (const innerVar of vars.items) {
    if (manager.sorts[innerVar] !== SORT_BOOL) continue;
    substituted.add(innerVar);
    termGraph.addEq(innerVar, context.eval(innerVar));
  }
  const result = context.pin(
    termGraph.qel(vars, (expr) => isAppOf(manager, expr, OP_ITE) || substituted.has(expr)),
  );
  termGraph.release();
  context.isCompletion = wasCompletion;
  return result;
};

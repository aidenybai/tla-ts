import { OP_DISTINCT, OP_IMPLIES, OP_ITE, OP_OR, SORT_BOOL } from "../ast";
import { flattenAndVector, isAppOf } from "../ast-util";
import { RefVector } from "../ref-vector";
import { MbpBasicTg } from "./mbp-basic-tg";
import type { MbpContext } from "./mbp-plugin";
import { TermGraph } from "./mbp-term-graph";

export class MbpQel {
  private termGraph: TermGraph;

  constructor(private context: MbpContext) {
    this.termGraph = new TermGraph(context.manager);
  }

  apply(vars: RefVector, formula: number) {
    const context = this.context;
    const manager = context.manager;
    const termGraph = this.termGraph;
    if (vars.size === 0) return formula;
    const wasCompletion = context.isCompletion;
    context.isCompletion = true;
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
    const substituted = new Set<number>();
    for (const innerVar of vars.items) {
      if (manager.sorts[innerVar] !== SORT_BOOL) continue;
      substituted.add(innerVar);
      termGraph.addEq(innerVar, context.eval(innerVar));
    }
    const result = context.pin(
      termGraph.qel(vars, (expr) => isAppOf(manager, expr, OP_ITE) || substituted.has(expr)),
    );
    context.isCompletion = wasCompletion;
    return result;
  }

  release() {
    this.termGraph.release();
  }
}

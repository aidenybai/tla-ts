// Ported from Z3 (src/qe/mbp/mbp_basic_tg.cpp), MIT license, see z3-license.txt.
import { OP_AND, OP_DISTINCT, OP_IMPLIES, OP_ITE, OP_OR } from "../ast";
import { isAppOf, mkNot } from "../ast-util";
import type { MbpContext } from "./mbp-plugin";
import type { TermGraph } from "./mbp-term-graph";

export class MbpBasicTg {
  isUsingModel = false;

  constructor(
    private context: MbpContext,
    private termGraph: TermGraph,
    private seen: Set<number>,
  ) {}

  // Splits on the ite terms, whether or not they contain variables.
  apply() {
    const context = this.context;
    const manager = context.manager;
    const termGraph = this.termGraph;
    const isUsingModel = this.isUsingModel;
    const shouldSplit = (expr: number) => isUsingModel || termGraph.hasValInClass(expr);
    const isTrue = (expr: number) =>
      (isUsingModel || termGraph.hasValInClass(expr)) && context.isTrue(expr, true);
    const isFalse = (expr: number) =>
      (isUsingModel || termGraph.hasValInClass(expr)) && context.isFalse(expr, true);
    let isProgress = false;
    for (const term of termGraph.getTerms()) {
      if (this.seen.has(term)) continue;
      if (isAppOf(manager, term, OP_ITE) && shouldSplit(manager.getArg(term, 0))) {
        const condition = manager.getArg(term, 0);
        this.seen.add(term);
        isProgress = true;
        if (context.isTrue(condition, true)) {
          termGraph.addLit(condition);
          termGraph.addEq(term, manager.getArg(term, 1));
        } else {
          termGraph.addLit(context.pin(mkNot(manager, condition)));
          termGraph.addEq(term, manager.getArg(term, 2));
        }
      }
      if (isAppOf(manager, term, OP_IMPLIES)) {
        const condition = manager.getArg(term, 0);
        const conclusion = manager.getArg(term, 1);
        if (isTrue(conclusion) || isFalse(condition)) {
          this.seen.add(term);
          isProgress = true;
          if (isTrue(conclusion)) termGraph.addLit(conclusion);
          else if (isFalse(condition)) termGraph.addLit(condition);
          termGraph.addEq(term, manager.trueExpr);
        } else if (isTrue(condition) && isFalse(conclusion)) {
          this.seen.add(term);
          isProgress = true;
          termGraph.addEq(term, manager.falseExpr);
        }
      }
      if (isAppOf(manager, term, OP_OR) || isAppOf(manager, term, OP_AND)) {
        const isOr = isAppOf(manager, term, OP_OR);
        const args = manager.getArgs(term);
        const isTrueTerm = isOr ? args.some(isTrue) : args.every(isTrue);
        const isFalseTerm = isOr ? args.every(isFalse) : args.some(isFalse);
        if (isTrueTerm || isFalseTerm) {
          this.seen.add(term);
          isProgress = true;
          termGraph.addEq(term, isTrueTerm ? manager.trueExpr : manager.falseExpr);
          if (isFalseTerm) {
            for (const arg of args) {
              if (!isFalse(arg)) continue;
              termGraph.addLit(context.pin(mkNot(manager, arg)));
              if (!isOr) break;
            }
          } else {
            for (const arg of args) {
              if (!isTrue(arg)) continue;
              termGraph.addLit(arg);
              if (isOr) break;
            }
          }
        }
      }
      if (isUsingModel && isAppOf(manager, term, OP_DISTINCT)) {
        this.seen.add(term);
        isProgress = true;
        let isEq = false;
        const args = manager.getArgs(term);
        for (const first of args) {
          for (const second of args) {
            if (first === second) continue;
            if (context.isTrue(context.pin(manager.mkEq(first, second)), true)) {
              termGraph.addEq(first, second);
              isEq = true;
              break;
            }
            termGraph.addDeq(first, second);
          }
        }
        termGraph.addEq(term, isEq ? manager.falseExpr : manager.trueExpr);
      }
    }
    return isProgress;
  }
}

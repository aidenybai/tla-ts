// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt. The state of theory_lra
// that every part of it shares: the lp solver, the theory variables and their enodes, the bounds of
// atoms, and what the scopes undo. The theory is a chain of classes, one file each, from this state
// to TheoryLra, so each part reaches the ones before it.
import { FAMILY_ARITH } from "./ast";
import type { Context } from "./context";
import { LarSolver } from "./lp/lar-solver";
import { Theory } from "./theory";

export abstract class TheoryLraState extends Theory {
  protected solver: LarSolver;

  constructor(context: Context) {
    super(context, FAMILY_ARITH);
    this.solver = new LarSolver(() => context.checkCanceled());
  }

  protected isIntExpr(expr: number) {
    return this.manager.isInt(expr);
  }

  protected isIntVar(thVar: number) {
    return this.isIntExpr(this.getExpr(thVar));
  }
}

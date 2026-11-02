// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt. The state of theory_lra
// that every part of it shares: the lp solver, the theory variables and their enodes, the bounds of
// atoms, and what the scopes undo. The theory is a chain of classes, one file each, from this state
// to TheoryLra, so each part reaches the ones before it.
import { AstManager } from "./ast";
import type { Context } from "./context";
import { Enode } from "./enode";
import { LarSolver } from "./lp/lar-solver";

export abstract class TheoryLraState {
  protected varEnodes: Enode[] = [];
  protected solver: LarSolver;

  constructor(protected context: Context) {
    this.solver = new LarSolver(() => context.checkCanceled());
  }

  protected get manager(): AstManager {
    return this.context.manager;
  }

  // get_enode, get_expr and get_num_vars: the theory reaches enodes only through these and
  // isEqual.
  getEnode(thVar: number) {
    return this.varEnodes[thVar];
  }

  protected getExpr(thVar: number) {
    return this.varEnodes[thVar].owner;
  }

  protected getNumVars() {
    return this.varEnodes.length;
  }

  protected isIntExpr(expr: number) {
    return this.manager.isInt(expr);
  }

  protected isIntVar(thVar: number) {
    return this.isIntExpr(this.getExpr(thVar));
  }
}

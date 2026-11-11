// Ported from Z3 (src/smt/theory_lra.cpp), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
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

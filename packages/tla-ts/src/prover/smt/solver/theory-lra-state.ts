import { FAMILY_ARITH } from "./ast";
import type { Context } from "./context";
import { LarSolver } from "./lp/lar-solver";
import { DEFAULT_HAMMER_PERIOD } from "./lp/lp-settings";
import { Theory } from "./theory";

export abstract class TheoryLraState extends Theory {
  readonly name = "arithmetic";
  protected solver: LarSolver;

  constructor(context: Context) {
    super(context, FAMILY_ARITH);
    this.solver = new LarSolver((cost) => context.checkCanceled(cost));
    this.updateParams();
  }

  // theory_lra::updt_params, which lp_settings::updt_params makes read the global lp parameters.
  updateParams() {
    this.solver.settings.updateParams(this.context.params.intHammerPeriod ?? DEFAULT_HAMMER_PERIOD);
  }

  protected isIntExpr(expr: number) {
    return this.manager.isInt(expr);
  }

  protected isIntVar(thVar: number) {
    return this.isIntExpr(this.getExpr(thVar));
  }
}

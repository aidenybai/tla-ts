// Ported from Z3 (src/smt/smt_kernel.cpp, src/smt/smt_context.cpp), MIT license, see
// z3-license.txt.
import { SmtCanceledError } from "../../../errors";
import { type AstManager } from "./ast";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import type { KernelParams } from "./solver";

export class SmtKernel {
  readonly context: Context;
  private asserted: AssertedFormulas;
  private isSetUp = false;

  constructor(manager: AstManager, params: KernelParams) {
    this.asserted = new AssertedFormulas(manager, params.isFindingMacros);
    this.context = new Context(manager, {
      isMbqi: params.isMbqi,
      mbqiMaxIterations: params.mbqiMaxIterations,
      relevancyLevel: params.relevancyLevel ?? 2,
    });
  }

  private setupContext() {
    if (this.isSetUp) return;
    this.isSetUp = true;
    this.context.setupContext();
  }

  assertExpr(expr: number) {
    this.context.popToBaseLevel();
    this.asserted.assertExpr(expr);
  }

  push() {
    const context = this.context;
    context.popToBaseLevel();
    this.setupContext();
    context.internalizeAssertions(this.asserted);
    const limit = context.manager.limit;
    if (!limit.inc()) throw new SmtCanceledError();
    const wasSuspended = limit.isSuspended;
    limit.isSuspended = true;
    if (!context.isInconsistent()) context.propagate();
    limit.isSuspended = wasSuspended;
    context.push();
    this.asserted.push();
  }

  getAssertions() {
    return this.asserted.getFormulas();
  }

  pop(numScopes: number) {
    this.context.pop(numScopes);
    for (let index = 0; index < numScopes; index++) this.asserted.pop();
  }

  initAssumptions(assumptions: number[]) {
    this.context.initAssumptions(assumptions, this.asserted);
  }

  check(assumptions: readonly number[] = []) {
    this.context.popToBaseLevel();
    this.setupContext();
    return this.context.checkResearching(this.asserted, assumptions);
  }
}

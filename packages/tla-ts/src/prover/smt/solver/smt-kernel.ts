// Ported from Z3 (src/smt/smt_kernel.cpp, src/smt/smt_context.cpp), MIT license, see
// z3-license.txt.
import { SmtCanceledError } from "../../../errors";
import { type AstManager } from "./ast";
import { isSetupUnknown, type SmtSetup } from "./smt-setup";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import type { KernelParams } from "./solver";

export class SmtKernel {
  readonly context: Context;
  private asserted: AssertedFormulas;
  private isSetUp = false;
  private setup: SmtSetup | undefined;

  constructor(manager: AstManager, params: KernelParams) {
    this.asserted = new AssertedFormulas(manager, params.isFindingMacros);
    this.context = new Context(manager, {
      isMbqi: params.isMbqi,
      mbqiMaxIterations: params.mbqiMaxIterations,
      relevancyLevel: params.relevancyLevel ?? 2,
    });
    this.setup = params.setup;
  }

  private setupContext(isUsingStaticFeatures: boolean) {
    if (this.isSetUp) return;
    this.isSetUp = true;
    const context = this.context;
    context.setupContext(
      isSetupUnknown(
        context.manager,
        this.setup,
        isUsingStaticFeatures,
        this.asserted.getFormulas(),
      ),
    );
  }

  assertExpr(expr: number) {
    this.context.popToBaseLevel();
    this.asserted.assertExpr(expr);
  }

  push() {
    const context = this.context;
    context.popToBaseLevel();
    this.setupContext(false);
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
    this.setupContext(false);
    return this.context.checkResearching(this.asserted, assumptions);
  }

  setupAndCheck() {
    this.setupContext(true);
    return this.check();
  }
}

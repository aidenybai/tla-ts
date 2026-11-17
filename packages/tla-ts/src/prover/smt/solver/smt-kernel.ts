import { SmtCanceledError } from "../../../errors";
import { type AstManager } from "./ast";
import type { SmtSetup } from "./smt-setup";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import { L_TRUE } from "./lbool";
import { Mus } from "./mus";
import { RefVector } from "./ref-vector";
import type { KernelParams } from "./solver";

export class SmtKernel {
  readonly context: Context;
  private asserted: AssertedFormulas;
  isSetUp = false;
  private setup: SmtSetup | undefined;
  private isCoreMinimizing: boolean;

  constructor(manager: AstManager, params: KernelParams) {
    this.asserted = new AssertedFormulas(manager, params.isFindingMacros);
    this.context = new Context(manager, {
      isMbqi: params.isMbqi,
      mbqiMaxIterations: params.mbqiMaxIterations,
      relevancyLevel: params.relevancyLevel ?? 2,
      randomSeed: params.randomSeed,
    });
    this.setup = params.setup;
    this.isCoreMinimizing = params.isCoreMinimizing ?? false;
  }

  // As in Z3, a kernel not yet set up reads auto_config again.
  updateParams(params: KernelParams) {
    if (!this.isSetUp) this.setup = params.setup;
    this.isCoreMinimizing = params.isCoreMinimizing ?? false;
    this.context.updateParams(params);
    this.asserted.updateParams(this.context.config);
  }

  private setupContext(isUsingStaticFeatures: boolean) {
    if (this.isSetUp) return;
    this.isSetUp = this.context.setupContext(this.setup, isUsingStaticFeatures, this.asserted);
  }

  // context::copy sets up and internalizes a copy as soon as it makes it.
  internalize() {
    this.setupContext(this.setup?.isAutoConfig ?? false);
    this.context.internalizeAssertions(this.asserted);
  }

  setPreprocess(isPreprocessing: boolean) {
    this.asserted.isPreprocessing = isPreprocessing;
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

  getUnsatCore(core: RefVector) {
    for (const expr of this.context.unsatCore) core.push(expr);
    if (!this.isCoreMinimizing) return;
    const manager = this.context.manager;
    const mus = new Mus(manager, {
      checkSat: (assumptions) => this.check(assumptions),
      getUnsatCore: () => this.context.unsatCore,
    });
    for (const literal of core.items) mus.addSoft(literal);
    const minimized = new RefVector(manager);
    if (mus.getMus(minimized) === L_TRUE) {
      core.reset();
      for (const literal of minimized.items) core.push(literal);
    }
    minimized.reset();
    mus.reset();
  }
}

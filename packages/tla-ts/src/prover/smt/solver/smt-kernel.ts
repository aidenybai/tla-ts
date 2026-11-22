import { type AstManager } from "./ast";
import { getDoubleParameter } from "./gparams";
import { getPhaseSelection, getRestartStrategy, type SmtSetup } from "./smt-setup";
import { AssertedFormulas } from "./asserted-formulas";
import { getCaseSplitStrategy } from "./case-split-queue";
import { Context } from "./context";
import { L_TRUE } from "./lbool";
import { Mus } from "./mus";
import { RefVector } from "./ref-vector";
import type { KernelParams } from "./solver";

export const getGlobalSmtParams = (
  parameters: ReadonlyMap<string, string>,
  relevancyLevel = Number(parameters.get("smt.relevancy") ?? "2"),
) => ({
  isEmatching: parameters.get("smt.ematching") !== "false",
  relevancyLevel,
  caseSplitStrategy: getCaseSplitStrategy(
    Number(parameters.get("smt.case_split") ?? "1"),
    relevancyLevel,
    parameters.get("smt.auto_config") !== "false" && parameters.get("auto_config") !== "false",
  ),
  phaseSelection: getPhaseSelection(Number(parameters.get("smt.phase_selection") ?? "3")),
  restartStrategy: getRestartStrategy(Number(parameters.get("smt.restart_strategy") ?? "1")),
  restartFactor: getDoubleParameter(parameters, "smt.restart_factor"),
  qiMaxInstances: Number(parameters.get("smt.qi.max_instances") ?? "4294967295"),
  qiMaxEagerMultipatterns: Number(parameters.get("smt.qi.max_multi_patterns") ?? "0"),
  isQiUpdatingGeneration: parameters.get("smt.qi.update_generation") !== "false",
  mbqiMaxCexs: Number(parameters.get("smt.mbqi.max_cexs") ?? "1"),
  mbqiForceTemplate: Number(parameters.get("smt.mbqi.force_template") ?? "10"),
  mbqiId: parameters.get("smt.mbqi.id") ?? "",
  isModelValidating: parameters.get("model_validate") === "true",
  isArrayExtensional: parameters.get("smt.array.extensional") !== "false",
});

export class SmtKernel {
  readonly context: Context;
  private asserted: AssertedFormulas;
  isSetUp = false;
  private setup: SmtSetup | undefined;
  private isCoreMinimizing: boolean;
  private scopeCount = 0;

  constructor(manager: AstManager, params: KernelParams) {
    this.asserted = new AssertedFormulas(
      manager,
      params.isFindingMacros,
      params.isEmatching,
      params.isProofsEnabled,
    );
    this.context = new Context(manager, {
      isMbqi: params.isMbqi,
      mbqiMaxIterations: params.mbqiMaxIterations,
      isEmatching: params.isEmatching,
      relevancyLevel: params.relevancyLevel ?? 2,
      caseSplitStrategy: params.caseSplitStrategy,
      phaseSelection: params.phaseSelection,
      restartStrategy: params.restartStrategy,
      restartFactor: params.restartFactor,
      randomSeed: params.randomSeed,
      intHammerPeriod: params.intHammerPeriod,
      isArithPropagatingEqs: params.isArithPropagatingEqs,
      qiCost: params.qiCost,
      qiEagerThreshold: params.qiEagerThreshold,
      qiLazyThreshold: params.qiLazyThreshold,
      qiMaxInstances: params.qiMaxInstances,
      qiMaxEagerMultipatterns: params.qiMaxEagerMultipatterns,
      isQiUpdatingGeneration: params.isQiUpdatingGeneration,
      mbqiMaxCexs: params.mbqiMaxCexs,
      mbqiForceTemplate: params.mbqiForceTemplate,
      mbqiId: params.mbqiId,
      isModelValidating: params.isModelValidating,
      isArrayExtensional: params.isArrayExtensional,
      isProofsEnabled: params.isProofsEnabled,
    });
    this.setup = params.setup;
    this.isCoreMinimizing = params.isCoreMinimizing ?? false;
  }

  // As in Z3, a kernel not yet set up reads auto_config again.
  updateParams(params: KernelParams) {
    if (!this.isSetUp) this.setup = params.setup;
    this.isCoreMinimizing = params.isCoreMinimizing ?? false;
    this.context.updateParams(params);
    this.asserted.updateParams(this.context.config, params.isEmatching);
  }

  private setupContext(isUsingStaticFeatures: boolean) {
    if (this.isSetUp) {
      this.context.keepRelevancyLevel();
      return;
    }
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

  // context::assert_expr_core counts a step, and drops the formula once the limit is spent.
  assertExpr(expr: number) {
    if (this.context.checkCanceled()) return;
    this.context.popToBaseLevel();
    this.asserted.assertExpr(expr);
  }

  push() {
    const context = this.context;
    context.popToBaseLevel();
    this.setupContext(false);
    context.internalizeAndPush(this.asserted);
    this.scopeCount++;
  }

  release() {
    this.context.release(this.asserted);
  }

  getAssertions() {
    return this.asserted.getFormulas();
  }

  pop(numScopes: number) {
    const count = Math.min(numScopes, this.scopeCount);
    if (count === 0) return;
    this.context.pop(count);
    this.scopeCount -= count;
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

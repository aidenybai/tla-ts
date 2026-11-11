// Ported from Z3 (src/opt/opt_solver.cpp, src/opt/opt_search.h), MIT license, see z3-license.txt.
// The relaxation upper bounds come only from nonlinear arithmetic, which this solver does not
// optimize, so it never probes them.
import type { AstManager } from "./ast";
import { InfEps } from "./inf-eps";
import { L_TRUE, L_UNDEF } from "./lbool";
import { AlgebraicManager } from "./nlsat/algebraic";
import type { ParetoSolver } from "./opt-pareto";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { SmtKernel } from "./smt-kernel";
import type { KernelParams } from "./solver";

const MODEL_BOUND_SCALE = Rational.of(10n ** 12n);

export interface MaximizeResult {
  // The no-model path accepts the hint without validating it.
  isBoundValid: boolean;
  hint: InfEps;
  // L_TRUE: accepted; L_FALSE: obj >= hint refuted; L_UNDEF: undecided or unchecked.
  hintStatus: number;
}

// An irrational value gives the requested side of an isolating interval, rounded outward to
// twelve decimals.
export const getModelValueBound = (
  manager: AstManager,
  am: AlgebraicManager,
  value: number,
  isLower: boolean,
) => {
  if (manager.isNumeral(value)) return manager.getRationalValue(value);
  if (!manager.isAlgebraicNumeral(value)) return undefined;
  const interval = am.getInterval(manager.getAlgebraicValue(value), 40);
  return isLower
    ? interval[0].mul(MODEL_BOUND_SCALE).floor().div(MODEL_BOUND_SCALE)
    : interval[1].mul(MODEL_BOUND_SCALE).ceil().div(MODEL_BOUND_SCALE);
};

export class OptSolver {
  private readonly kernel: SmtKernel;
  private readonly am = new AlgebraicManager();
  private model: ProtoModel | null = null;
  private objectiveVars: number[] = [];
  private objectiveValues: InfEps[] = [];
  private objectiveModels: (ProtoModel | null)[] = [];
  private objectiveTerms: number[] = [];
  // Every model and bound the search makes lives until the solver is released.
  private models: ProtoModel[] = [];
  private pinned: RefVector;
  wasUnknown = false;

  constructor(
    private readonly manager: AstManager,
    params: KernelParams,
  ) {
    this.kernel = new SmtKernel(manager, params);
    this.pinned = new RefVector(manager);
  }

  private hold(model: ProtoModel) {
    model.incRef();
    this.models.push(model);
    return model;
  }

  private getContextModel() {
    return this.hold(this.kernel.context.getModel());
  }

  private get arith() {
    return this.kernel.context.arith;
  }

  assertExpr(expr: number) {
    this.model = null;
    this.pinned.push(expr);
    this.kernel.assertExpr(expr);
  }

  push() {
    this.kernel.push();
  }

  pop(numScopes: number) {
    this.kernel.pop(numScopes);
  }

  private adjustResult(result: number) {
    if (result !== L_UNDEF || !this.kernel.context.isQuantifierIncomplete()) return result;
    this.wasUnknown = true;
    return L_TRUE;
  }

  check(assumptions: readonly number[] = []) {
    this.model = null;
    const result = this.adjustResult(this.kernel.check(assumptions));
    if (result === L_TRUE) {
      this.model = this.getContextModel();
      if (this.objectiveModels.length === 1) this.objectiveModels[0] = this.model;
    }
    return result;
  }

  getUnsatCore() {
    return this.kernel.context.unsatCore;
  }

  findMutexes(vars: readonly number[]) {
    const mutexes = this.kernel.context.findMutexes(vars);
    for (const mutex of mutexes) for (const literal of mutex) this.pinned.push(literal);
    return mutexes;
  }

  getModel() {
    if (this.model !== null) return this.model;
    for (let index = this.objectiveModels.length; index-- > 0;) {
      const model = this.objectiveModels[index];
      if (model !== null) return model;
    }
    return null;
  }

  addObjective(term: number) {
    this.pinned.push(term);
    this.objectiveVars.push(this.arith.addObjective(term));
    this.objectiveValues.push(InfEps.minusInfinity);
    this.objectiveTerms.push(term);
    this.objectiveModels.push(null);
  }

  resetObjectives() {
    this.objectiveVars = [];
    this.objectiveValues = [];
    this.objectiveTerms = [];
  }

  getSavedObjectiveValue(index: number) {
    return this.objectiveValues[index];
  }

  private getModelValueLowerBound(model: ProtoModel, index: number) {
    const value = model.eval(this.objectiveTerms[index], false);
    const bound = getModelValueBound(this.manager, this.am, value, true);
    this.manager.decRef(value);
    return bound;
  }

  mkGe(index: number, value: InfEps) {
    const manager = this.manager;
    if (!value.isFinite()) return value.isPositive() ? manager.falseExpr : manager.trueExpr;
    const bound = this.arith.mkGe(this.objectiveVars[index], value);
    this.pinned.push(bound);
    return bound;
  }

  // The arithmetic relaxation only hints at the optimum, so a finite hint is checked against
  // the other theories before it becomes the objective's value.
  maximizeObjective(index: number) {
    this.model = null;
    const maximized = this.arith.maximize(this.objectiveVars[index]);
    this.pinned.push(maximized.blocker);
    const value = maximized.value;
    const result: MaximizeResult = { isBoundValid: false, hint: value, hintStatus: L_UNDEF };
    const outcome = { result, blocker: maximized.blocker };
    this.model = this.getContextModel();
    this.objectiveModels[index] ??= this.model;
    if (this.manager.limit.isExhausted()) return outcome;
    const bound = this.getModelValueLowerBound(this.model, index);
    if (bound !== undefined && InfEps.of(bound).compare(this.objectiveValues[index]) > 0)
      this.objectiveValues[index] = InfEps.of(bound);
    if (this.manager.limit.isExhausted()) return outcome;
    if (value.isFinite()) {
      this.kernel.context.updateModel();
      if (!this.checkBound(index, value, result)) return outcome;
    }
    this.objectiveValues[index] = value;
    result.hintStatus = L_TRUE;
    result.isBoundValid = true;
    return outcome;
  }

  private checkBound(index: number, value: InfEps, result: MaximizeResult) {
    if (this.manager.limit.isExhausted()) return false;
    const bounded = this.boundValue(index, value);
    result.hintStatus = bounded === L_TRUE ? this.kernel.check() : bounded;
    return result.hintStatus === L_TRUE;
  }

  private boundValue(index: number, value: InfEps) {
    this.kernel.push();
    this.assertExpr(this.mkGe(index, value));
    const result = this.adjustResult(this.kernel.check());
    if (result === L_TRUE) {
      this.model = this.getContextModel();
      this.objectiveModels[index] = this.model;
    }
    this.kernel.pop(1);
    return result;
  }

  release() {
    for (const model of this.models) model.decRef();
    this.models = [];
    this.pinned.reset();
  }
}

// The pareto search runs on the solver of the hard constraints.
export class OptParetoSolver implements ParetoSolver {
  reasonUnknown = "";

  constructor(private readonly solver: OptSolver) {}

  get model() {
    return this.solver.getModel();
  }

  check() {
    return this.solver.check();
  }

  assert(expr: number) {
    this.solver.assertExpr(expr);
  }

  push() {
    this.solver.push();
  }

  pop() {
    this.solver.pop(1);
  }

  release() {}
}

// Ported from Z3 (src/opt/optsmt.cpp, src/opt/opt_search.h, src/opt/opt_geometric.h), MIT
// license, see z3-license.txt. Only the basic engine over linear objectives is ported: the nlsat
// proofs of unboundedness and the bisection of real objectives are unsupported.
import { SmtUnsupportedError } from "../../../errors";
import type { AstManager } from "./ast";
import { InfEps, maxInfEps, minInfEps } from "./inf-eps";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { MaximizeResult, OptSolver } from "./opt-solver";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

const UNBOUNDED_CHECK_ROUNDS = 8;

export interface OptsmtHost {
  getBaseModel(): ProtoModel | null;
  setModel(model: ProtoModel | null): void;
}

class GeometricStep {
  private steps = 0;
  private stepIncs = 0;
  value = Rational.one;

  update(canIncrease: boolean) {
    if (!canIncrease) {
      this.value = Rational.one;
      return;
    }
    if (this.steps <= this.stepIncs) {
      this.steps++;
      return;
    }
    this.value = this.value.mul(Rational.of(2n));
    this.stepIncs++;
    this.steps = 0;
  }

  reset() {
    this.steps = 0;
    this.stepIncs = 0;
    this.value = Rational.one;
  }
}

class ObjectiveSearch {
  private excludedUpper = InfEps.minusInfinity;
  private regions: InfEps[] = [];

  constructor(public upper: InfEps) {}

  private tightenUpper(bound: InfEps) {
    this.upper = minInfEps(this.upper, maxInfEps(bound, this.excludedUpper));
  }

  update(result: MaximizeResult) {
    if (!result.isBoundValid && result.hintStatus === L_FALSE && result.hint.isFinite())
      this.tightenUpper(result.hint);
  }

  excludeBelow(upper: InfEps) {
    this.excludedUpper = maxInfEps(this.excludedUpper, upper);
  }

  enterRegion(excludedUpper: InfEps) {
    this.regions.push(this.excludedUpper);
    this.excludeBelow(excludedUpper);
  }

  refuteRegion() {
    this.upper = minInfEps(this.upper, this.excludedUpper);
  }

  leaveRegion(status: number) {
    if (status === L_FALSE) this.refuteRegion();
    this.excludedUpper = this.regions.pop() ?? this.excludedUpper;
  }
}

export class Optsmt {
  private solver: OptSolver | null = null;
  private objs: RefVector;
  readonly lower: InfEps[] = [];
  readonly upper: InfEps[] = [];
  readonly models: (ProtoModel | null)[] = [];
  private model: ProtoModel | null = null;
  private bestModel: ProtoModel | null = null;

  constructor(
    private manager: AstManager,
    private host: OptsmtHost,
  ) {
    this.objs = new RefVector(manager);
  }

  private get optSolver() {
    if (this.solver === null) throw new SmtUnsupportedError("optimization before setup");
    return this.solver;
  }

  add(term: number) {
    const rewritten = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS).rewrite(term);
    this.objs.push(rewritten);
    this.manager.decRef(rewritten);
    this.lower.push(InfEps.minusInfinity);
    this.upper.push(InfEps.infinity);
    this.models.push(null);
    return this.objs.size - 1;
  }

  setup(solver: OptSolver) {
    this.solver = solver;
    solver.resetObjectives();
    solver.push();
    solver.pop(1);
    for (const term of this.objs.items) solver.addObjective(term);
  }

  private publishBestModel() {
    this.bestModel = this.model;
    this.host.setModel(this.model);
  }

  private updateLowerLex(index: number, value: InfEps) {
    if (value.compare(this.lower[index]) <= 0) return;
    this.lower[index] = value;
    for (let later = index + 1; later < this.objs.size; later++)
      this.lower[later] = this.optSolver.getSavedObjectiveValue(later);
    this.publishBestModel();
  }

  updateLowerBound(index: number, value: InfEps) {
    this.optSolver.mkGe(index, value);
    this.lower[index] = value;
  }

  updateUpperBound(index: number, value: InfEps) {
    this.upper[index] = value;
  }

  lex(index: number) {
    const solver = this.optSolver;
    this.bestModel = this.host.getBaseModel();
    solver.push();
    for (let earlier = 0; earlier < index; earlier++) this.commitAssignment(earlier);
    const result = this.geometricSearch(index);
    if (result === L_TRUE)
      for (let later = index + 1; later < this.lower.length; later++)
        this.lower[later] = InfEps.minusInfinity;
    solver.pop(1);
    return result;
  }

  box() {
    const solver = this.optSolver;
    if (this.objs.size === 0) return L_TRUE;
    this.bestModel = this.host.getBaseModel();
    for (let index = 0; index < this.objs.size && this.manager.limit.inc(); index++) {
      this.lower[index] = InfEps.minusInfinity;
      this.upper[index] = InfEps.infinity;
      solver.push();
      const status = this.geometricSearch(index);
      solver.pop(1);
      if (status !== L_TRUE) return status;
      this.models[index] = this.bestModel;
    }
    return L_TRUE;
  }

  getBestModel() {
    return this.bestModel;
  }

  isUnbounded(index: number, isMax: boolean) {
    return !(isMax ? this.upper : this.lower)[index].isFinite();
  }

  commitAssignment(index: number) {
    const lower = this.lower[index];
    if (lower.isFinite()) this.optSolver.assertExpr(this.optSolver.mkGe(index, lower));
  }

  private geometricSearch(index: number) {
    const manager = this.manager;
    const solver = this.optSolver;
    const isInt = manager.isInt(this.objs.items[index]);
    let status = L_TRUE;
    let bound = -1;
    let lastBound = -1;
    const step = new GeometricStep();
    let scopes = 0;
    const search = new ObjectiveSearch(this.upper[index]);
    let lastObjective = InfEps.minusInfinity;
    let isLastBoundValid = true;
    let climbRounds = 0;
    const enterRegion = (objective: InfEps) => {
      solver.push();
      scopes++;
      const excluded = objective.add(InfEps.of(step.value));
      search.enterRegion(excluded);
      return solver.mkGe(index, excluded);
    };
    while (manager.limit.inc()) {
      status = solver.check();
      if (status === L_TRUE) {
        const maximized = solver.maximizeObjective(index);
        bound = maximized.blocker;
        isLastBoundValid = maximized.result.isBoundValid;
        search.update(maximized.result);
        this.upper[index] = search.upper;
        this.model = solver.getModel();
        const objective = solver.getSavedObjectiveValue(index);
        this.updateLowerLex(index, objective);
        if (manager.limit.isExhausted()) {
          status = L_UNDEF;
          break;
        }
        step.update(isInt && this.lower[index].isFinite());
        if (isInt || search.upper.isFinite()) climbRounds = 0;
        else if (++climbRounds >= UNBOUNDED_CHECK_ROUNDS)
          throw new SmtUnsupportedError("an nlsat proof that a real objective is unbounded");
        if (
          !isLastBoundValid ||
          step.value.compare(Rational.one) > 0 ||
          (objective.equals(lastObjective) && isInt)
        )
          bound = enterRegion(objective);
        lastObjective = objective;
        if (bound === lastBound) {
          if (this.lower[index].isFinite() && this.lower[index].compare(objective) > 0)
            bound = solver.mkGe(index, this.lower[index]);
          if (bound === lastBound && objective.epsilon.isPositive()) bound = enterRegion(objective);
          if (bound === lastBound) break;
        }
        search.excludeBelow(maxInfEps(objective, this.lower[index]));
        solver.assertExpr(bound);
        lastBound = bound;
        continue;
      }
      if (status === L_FALSE && step.value.compare(Rational.one) > 0) {
        step.reset();
        solver.pop(1);
        scopes--;
        search.leaveRegion(status);
        this.upper[index] = search.upper;
        continue;
      }
      if (status === L_FALSE) {
        search.refuteRegion();
        this.upper[index] = search.upper;
      }
      if (
        ((status === L_FALSE && !isLastBoundValid) || status === L_UNDEF) &&
        !isInt &&
        this.lower[index].isFinite() &&
        this.lower[index].compare(search.upper) < 0
      )
        throw new SmtUnsupportedError("the bisection of a real objective");
      break;
    }
    if (scopes > 0) solver.pop(scopes);
    if (status === L_FALSE && this.model === null) return L_FALSE;
    if (!manager.limit.inc() || status === L_UNDEF) return L_UNDEF;
    if (!this.lower[index].isFinite() && this.lower[index].isNegative()) return L_UNDEF;
    this.upper[index] = this.lower[index];
    return L_TRUE;
  }

  release() {
    this.objs.reset();
    this.solver = null;
  }
}

// Ported from Z3 (src/opt/optsmt.cpp, src/opt/opt_search.h, src/opt/opt_geometric.h), MIT
// license, see z3-license.txt.
import { SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import { type AstManager, OP_GE, OP_GT, SORT_BOOL, SORT_INT, SORT_REAL } from "./ast";
import { InfEps, maxInfEps, minInfEps } from "./inf-eps";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { mkAlgebraicEq, NlsatOpt } from "./opt-nlsat";
import { getModelValueBound, type MaximizeResult, type OptSolver } from "./opt-solver";
import { ObjectiveValue } from "./opt-value";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import type { TacticEnvironment } from "./tactic";

// The initial budget is the one of the bounded nlsat run in nla_core; the known proofs of
// unboundedness need 4k to 23k.
const UNBOUNDED_CHECK_RLIMIT = 100000;
const UNBOUNDED_CHECK_ROUNDS = 8;
const MAX_ONE_SIDED_ROUNDS = 16;

export interface OptsmtHost {
  getBaseModel(): ProtoModel | null;
  setModel(model: ProtoModel | null): void;
}

export interface OptsmtParams {
  bisectRounds: number;
  isNlsat: boolean;
  isDualBounds: boolean;
  supremumRlimit: number;
  isLexAfterUnbounded: boolean;
}

const NLSAT_NO_RESULT = 0;
const NLSAT_CERTIFIED = 1;
const NLSAT_INCOMPLETE = 2;

class GeometricStep {
  private steps = 0;
  private stepIncs = 0;
  value = Rational.one;

  // A round that cannot grow uses step one but keeps both counters.
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

// A region excludes the objective values at or below its bound, so a certificate over the region
// lifts to the whole search space with the values every enclosing cut discarded.
class ObjectiveSearch {
  private excludedUpper = InfEps.minusInfinity;
  private regions: InfEps[] = [];

  constructor(public upper: InfEps) {}

  private tightenUpper(bound: InfEps) {
    this.upper = minInfEps(this.upper, maxInfEps(bound, this.excludedUpper));
  }

  update(result: MaximizeResult) {
    if (result.upperBound !== null) this.tightenUpper(InfEps.of(result.upperBound));
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

  resetRegions() {
    if (this.regions.length > 0) this.excludedUpper = this.regions[0];
    this.regions = [];
  }
}

// The pushes that try bounds such as obj >= best + step, which may be infeasible.
class ScopedPushes {
  size = 0;

  constructor(private solver: OptSolver) {}

  push() {
    this.solver.push();
    this.size++;
  }

  pop() {
    this.solver.pop(1);
    this.size--;
  }

  reset() {
    if (this.size > 0) this.solver.pop(this.size);
    this.size = 0;
  }
}

export class Optsmt {
  private solver: OptSolver | null = null;
  private objs: RefVector;
  readonly lower: ObjectiveValue[] = [];
  readonly upper: ObjectiveValue[] = [];
  readonly models: (ProtoModel | null)[] = [];
  private model: ProtoModel | null = null;
  private bestModel: ProtoModel | null = null;
  private nlsatModels: ProtoModel[] = [];
  private pinned: RefVector;

  constructor(
    private manager: AstManager,
    private environment: TacticEnvironment,
    private host: OptsmtHost,
    private params: OptsmtParams,
  ) {
    this.objs = new RefVector(manager);
    this.pinned = new RefVector(manager);
  }

  private get optSolver() {
    if (this.solver === null) throw new SmtUnsupportedError("optimization before setup");
    return this.solver;
  }

  private getLower(index: number) {
    return this.lower[index].bound;
  }

  private getUpper(index: number) {
    return this.upper[index].bound;
  }

  add(term: number) {
    const rewritten = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS).rewrite(term);
    this.objs.push(rewritten);
    this.manager.decRef(rewritten);
    this.lower.push(ObjectiveValue.minusInfinity);
    this.upper.push(ObjectiveValue.infinity);
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

  private setBest(index: number, value: InfEps) {
    this.lower[index] = new ObjectiveValue(value);
    this.upper[index] = this.upper[index].withoutExact();
    this.publishBestModel();
  }

  private updateLowerLex(index: number, value: InfEps) {
    if (value.compare(this.getLower(index)) <= 0) return;
    this.lower[index] = new ObjectiveValue(value);
    for (let later = index + 1; later < this.objs.size; later++)
      this.lower[later] = new ObjectiveValue(this.optSolver.getSavedObjectiveValue(later));
    this.publishBestModel();
  }

  updateLowerBound(index: number, value: InfEps) {
    this.optSolver.mkGe(index, value);
    this.lower[index] = this.lower[index].withRationalBound(value);
  }

  // A model callback can reset the bound to infinity, which does not refine its exact value.
  updateUpperBound(index: number, value: InfEps) {
    this.upper[index] = value.isFinite()
      ? this.upper[index].withRationalBound(value)
      : new ObjectiveValue(value);
  }

  // A finite, unattained limit that nlsat certified.
  hasOpenBound(index: number) {
    return this.lower[index].exact !== null && this.lower[index].hasInfinitesimal();
  }

  lex(index: number) {
    const solver = this.optSolver;
    this.bestModel = this.host.getBaseModel();
    solver.push();
    this.lower[index] = this.lower[index].withoutExact();
    this.upper[index] = this.upper[index].withoutExact();
    for (let earlier = 0; earlier < index; earlier++) this.commitAssignment(earlier);
    const result = this.geometricSearch(index, UNBOUNDED_CHECK_ROUNDS);
    if (result === L_TRUE)
      for (let later = index + 1; later < this.lower.length; later++)
        this.lower[later] = ObjectiveValue.minusInfinity;
    solver.pop(1);
    return result;
  }

  box() {
    const solver = this.optSolver;
    if (this.objs.size === 0) return L_TRUE;
    this.bestModel = this.host.getBaseModel();
    for (let index = 0; index < this.objs.size && this.manager.limit.inc(); index++) {
      this.lower[index] = ObjectiveValue.minusInfinity;
      this.upper[index] = ObjectiveValue.infinity;
      solver.push();
      const status = this.geometricSearch(index, UNBOUNDED_CHECK_ROUNDS);
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
    const solver = this.optSolver;
    const lower = this.getLower(index);
    const exact = this.lower[index].exact;
    if (exact !== null && !this.manager.am.isRational(exact)) {
      // The SMT core cannot use a root numeral, so the defining equation and its isolating
      // interval stand for it.
      const constraint = mkAlgebraicEq(this.manager, this.objs.items[index], exact);
      this.pinned.push(constraint);
      solver.assertExpr(constraint);
    } else if (lower.isFinite()) solver.assertExpr(solver.mkGe(index, lower));
  }

  private geometricSearch(index: number, initialCheckRounds: number) {
    const manager = this.manager;
    const solver = this.optSolver;
    const isInt = manager.isInt(this.objs.items[index]);
    let status = L_TRUE;
    let bound = -1;
    let lastBound = -1;
    const step = new GeometricStep();
    const scopes = new ScopedPushes(solver);
    const search = new ObjectiveSearch(this.getUpper(index));
    let lastObjective = InfEps.minusInfinity;
    let isLastBoundValid = true;
    let climbRounds = 0;
    let unboundedCheckRounds = initialCheckRounds;
    let unboundedCheckRlimit = UNBOUNDED_CHECK_RLIMIT;
    const enterRegion = (objective: InfEps) => {
      scopes.push();
      const excluded = objective.add(InfEps.of(step.value));
      search.enterRegion(excluded);
      return solver.mkGe(index, excluded);
    };
    while (manager.limit.inc()) {
      status = solver.check();
      if (status === L_TRUE) {
        // Once a finite cap is known, the search refines it without more probes.
        const maximized = solver.maximizeObjective(
          index,
          this.params.isDualBounds && !isInt,
          !search.upper.isFinite(),
        );
        bound = maximized.blocker;
        isLastBoundValid = maximized.result.isBoundValid;
        search.update(maximized.result);
        this.upper[index] = new ObjectiveValue(search.upper);
        this.model = solver.getModel();
        const objective = solver.getSavedObjectiveValue(index);
        this.updateLowerLex(index, objective);
        if (manager.limit.isExhausted()) {
          status = L_UNDEF;
          break;
        }
        step.update(isInt && this.lower[index].isFinite());
        // A real objective may improve forever without refuting an upper bound, so a streak of
        // improvements tries to prove it unbounded, with a budget and retries that back off.
        if (isInt || search.upper.isFinite()) climbRounds = 0;
        else if (this.params.isNlsat && ++climbRounds >= unboundedCheckRounds) {
          climbRounds = 0;
          unboundedCheckRounds *= 2;
          if (this.proveUnboundedAbove(index, unboundedCheckRlimit)) {
            this.setBest(index, InfEps.infinity);
            break;
          }
          if (unboundedCheckRlimit <= 0xffffffff / 2) unboundedCheckRlimit *= 2;
        }
        // An unvalidated hint gives a blocker beyond any model, so the model's value steps instead.
        if (
          !isLastBoundValid ||
          step.value.compare(Rational.one) > 0 ||
          (objective.equals(lastObjective) && isInt)
        )
          bound = enterRegion(objective);
        lastObjective = objective;
        if (bound === lastBound) {
          // The model's value may beat the relaxation where nonlinear terms, mod or to_int hide
          // part of the feasible region from it.
          if (this.lower[index].isFinite() && this.getLower(index).compare(objective) > 0)
            bound = solver.mkGe(index, this.getLower(index));
          // An objective infinitesimally above the previous strict bound is not an optimum: the
          // relaxation could not leave the bound, so the search steps beyond it.
          if (bound === lastBound && objective.epsilon.isPositive()) bound = enterRegion(objective);
          if (bound === lastBound) break;
        }
        search.excludeBelow(maxInfEps(objective, this.getLower(index)));
        solver.assertExpr(bound);
        lastBound = bound;
        continue;
      }
      if (status === L_FALSE && step.value.compare(Rational.one) > 0) {
        step.reset();
        scopes.pop();
        search.leaveRegion(status);
        this.upper[index] = new ObjectiveValue(search.upper);
        continue;
      }
      if (status === L_FALSE) {
        search.refuteRegion();
        this.upper[index] = new ObjectiveValue(search.upper);
      }
      // After the model-derived step, a refuted region does not make the model's value optimal.
      if (
        ((status === L_FALSE && !isLastBoundValid) || status === L_UNDEF) &&
        !isInt &&
        this.lower[index].isFinite()
      ) {
        const upper = search.upper;
        if (this.getLower(index).compare(upper) < 0) {
          scopes.reset();
          search.resetRegions();
          status = this.refineRealObjective(index, upper, status === L_UNDEF);
        }
      }
      break;
    }
    scopes.reset();
    if (status === L_FALSE && this.model === null) return L_FALSE;
    if (!manager.limit.inc() || status === L_UNDEF) return L_UNDEF;
    // Without a model value the lower bound is still -oo, which is no optimum.
    if (!this.lower[index].isFinite() && this.getLower(index).isNegative()) return L_UNDEF;
    if (this.lower[index].exact === null) this.upper[index] = this.lower[index];
    return L_TRUE;
  }

  private getHard() {
    return [...this.optSolver.getAssertions()];
  }

  // Projects the feasible nlsat regions onto the objective, within a resource budget; the bounds
  // the climb pushed hold in the current model.
  private proveUnboundedAbove(index: number, rlimit: number) {
    if (!this.lower[index].isFinite()) return false;
    const engine = new NlsatOpt(this.manager, this.environment);
    const limit = this.manager.limit;
    limit.push(rlimit);
    try {
      return (
        engine.proveUnbounded(
          this.getHard(),
          this.objs.items[index],
          this.getLower(index).value,
        ) === L_TRUE
      );
    } catch (error) {
      if (!(error instanceof SmtCanceledError)) throw error;
      return false;
    } finally {
      limit.pop();
    }
  }

  private refineRealObjective(index: number, upper: InfEps, isSmtGivingUp: boolean) {
    if (this.params.isNlsat) {
      const outcome = (() => {
        try {
          return this.optimizeNlsatCells(index, upper);
        } catch (error) {
          if (!(error instanceof SmtCanceledError)) throw error;
          return null;
        }
      })();
      if (outcome === null || outcome === NLSAT_INCOMPLETE) return L_UNDEF;
      if (outcome === NLSAT_CERTIFIED) return L_TRUE;
    }
    if (!upper.isFinite() || isSmtGivingUp) return L_UNDEF;
    if (this.getLower(index).compare(upper) < 0) return this.bisect(index, upper);
    return L_TRUE;
  }

  // Maximizes the objective over the nlsat cells of the assertions within [lower, upper]. An
  // irrational optimum keeps its exact value with outward rational brackets, and an open limit
  // is sup - epsilon.
  private optimizeNlsatCells(index: number, upper: InfEps) {
    if (!this.lower[index].isFinite()) return NLSAT_NO_RESULT;
    const optimized = new NlsatOpt(this.manager, this.environment).maximize(
      this.getHard(),
      this.objs.items[index],
      this.getLower(index).value,
      upper.isFinite() ? upper.value : null,
      this.params.bisectRounds,
      this.params.supremumRlimit,
    );
    const result = optimized.result;
    const model = result.model;
    if (model === null) return NLSAT_NO_RESULT;
    this.nlsatModels.push(model);
    if (result.isUnbounded) {
      this.model = model;
      this.setBest(index, InfEps.infinity);
      this.upper[index] = this.lower[index];
      return NLSAT_CERTIFIED;
    }
    if (result.isOpen && result.sup !== null) {
      // The model is a feasible witness below the limit.
      this.model = model;
      const lower = InfEps.of(result.supLower, Rational.minusOne);
      this.setBest(index, lower);
      this.lower[index] = new ObjectiveValue(lower, result.sup);
      this.upper[index] = new ObjectiveValue(
        InfEps.of(result.supUpper, Rational.minusOne),
        result.sup,
      );
      return NLSAT_CERTIFIED;
    }
    const value = InfEps.of(result.lower);
    if (value.compare(this.getLower(index)) < 0 || result.value === null) return NLSAT_NO_RESULT;
    this.model = model;
    this.setBest(index, value);
    if (optimized.status === L_TRUE) {
      this.lower[index] = new ObjectiveValue(value, result.value);
      this.upper[index] = new ObjectiveValue(InfEps.of(result.upper), result.value);
      return NLSAT_CERTIFIED;
    }
    const sup = result.hasSup ? minInfEps(InfEps.of(result.supUpper), upper) : upper;
    this.upper[index] = new ObjectiveValue(
      sup.compare(this.getLower(index)) < 0 ? this.getLower(index) : sup,
    );
    return NLSAT_INCOMPLETE;
  }

  // Searches [lower, upper] when the arithmetic cannot push a real objective: obj > lower proves
  // lower optimal when unsatisfiable, and obj >= (lower + upper) / 2 halves the gap.
  private bisect(index: number, initialUpper: InfEps) {
    const manager = this.manager;
    const solver = this.optSolver;
    let lower = this.getLower(index);
    let upper = initialUpper;
    const search = new ObjectiveSearch(upper);
    const epsilon = InfEps.of(Rational.zero, Rational.one);
    let isStrict = true;
    let result = L_UNDEF;
    for (
      let rounds = 0;
      manager.limit.inc() && lower.compare(upper) < 0 && rounds < this.params.bisectRounds;
      rounds++, isStrict = !isStrict
    ) {
      const bound = isStrict
        ? lower.add(epsilon)
        : new InfEps(
            lower.infinity.add(upper.infinity).div(Rational.of(2n)),
            lower.value.add(upper.value).div(Rational.of(2n)),
            lower.epsilon.add(upper.epsilon).div(Rational.of(2n)),
          );
      solver.push();
      search.enterRegion(isStrict ? lower : bound);
      solver.assertExpr(solver.mkGe(index, bound));
      const status = solver.check();
      if (status === L_TRUE) this.model = solver.getModel();
      solver.pop(1);
      search.leaveRegion(status);
      upper = search.upper;
      this.upper[index] = new ObjectiveValue(upper);
      if (status === L_TRUE) {
        const model = this.model;
        if (model === null) break;
        // An algebraic model value is no numeral, so the bound it satisfies stands for it.
        const evaluated = model.eval(this.objs.items[index], false);
        const numeral = manager.isNumeral(evaluated) ? manager.getRationalValue(evaluated) : null;
        manager.decRef(evaluated);
        const isAboveBound = numeral !== null && InfEps.of(numeral).compare(bound) >= 0;
        if (!isAboveBound && isStrict) continue;
        const value = isAboveBound && numeral !== null ? InfEps.of(numeral) : bound;
        if (value.compare(lower) > 0) {
          lower = value;
          this.setBest(index, value);
        }
      } else if (status === L_FALSE) {
        if (isStrict) {
          result = L_TRUE;
          break;
        }
      } else break;
    }
    this.lower[index] = new ObjectiveValue(lower);
    this.upper[index] = new ObjectiveValue(upper);
    return result === L_TRUE || lower.equals(upper) ? L_TRUE : L_UNDEF;
  }

  // Whether objective index still has the supremum +oo under the current assertions, with a
  // feasible witness from the search; all objective bounds are restored afterwards.
  private reachesInfinity(index: number) {
    const lower = [...this.lower];
    const upper = [...this.upper];
    const best = this.bestModel;
    const model = this.model;
    this.lower[index] = ObjectiveValue.minusInfinity;
    this.upper[index] = ObjectiveValue.infinity;
    // geometricSearch reports infeasibility only without a model.
    this.model = null;
    const solver = this.optSolver;
    solver.push();
    // The objective is known to be unbounded, so one climb round precedes the proof.
    const status = this.geometricSearch(index, 1);
    solver.pop(1);
    const isUnbounded = status === L_TRUE && !this.upper[index].isFinite();
    const witness = isUnbounded ? this.bestModel : null;
    this.lower.splice(0, lower.length, ...lower);
    this.upper.splice(0, upper.length, ...upper);
    this.bestModel = best;
    this.model = model;
    return { status: status === L_UNDEF ? L_UNDEF : isUnbounded ? L_TRUE : L_FALSE, witness };
  }

  private getModelObjectiveValue(index: number, model: ProtoModel | null) {
    if (model === null) return undefined;
    const evaluated = model.eval(this.objs.items[index], false);
    const value = getModelValueBound(this.manager, this.manager.am, evaluated, true);
    this.manager.decRef(evaluated);
    return value;
  }

  // Objective unbounded is +oo, so objective index takes L = lim_{c -> +oo} sup { f : F, u > c }.
  // A threshold t with F, f >= t keeping u unbounded has t <= L; one with F, f > t leaving u
  // bounded has L <= t. Thresholds come from model values and the relaxation's hints; a limit of
  // +-oo is never certified, and without a deciding threshold f keeps the interval [lo, hi].
  lexAfterUnbounded(unbounded: number, index: number) {
    if (!this.params.isLexAfterUnbounded) return L_TRUE;
    const manager = this.manager;
    const solver = this.optSolver;
    const objective = this.objs.items[index];
    const isInt = manager.isInt(objective);
    let lower = InfEps.minusInfinity;
    let upper = InfEps.infinity;
    let candidate: Rational | null = null;
    // f > lower keeps u unbounded, so lower is no limit unless upper closes in.
    let isAboveLowerFeasible = false;
    let best: ProtoModel | null = null;
    const step = new GeometricStep();
    const scopes = new ScopedPushes(solver);
    let result = L_UNDEF;
    let isDecided = false;
    let oneSidedRounds = 0;
    for (let rounds = 0; manager.limit.inc() && rounds < this.params.bisectRounds; rounds++) {
      if (
        isInt &&
        lower.isFinite() &&
        upper.isFinite() &&
        upper.value.compare(lower.value.add(Rational.one)) <= 0
      ) {
        isDecided = true;
        break;
      }
      if (
        best !== null &&
        (!lower.isFinite() || !upper.isFinite()) &&
        ++oneSidedRounds > MAX_ONE_SIDED_ROUNDS
      )
        break;
      let hasTrial = true;
      let isStrict = false;
      let threshold = Rational.zero;
      if (
        candidate !== null &&
        InfEps.of(candidate).compare(lower) > 0 &&
        InfEps.of(candidate).compare(upper) < 0
      )
        threshold = candidate;
      else if (best === null) hasTrial = false;
      else if (!lower.isFinite()) threshold = upper.value.sub(step.value);
      else if (!upper.isFinite()) threshold = lower.value.add(step.value);
      else if (!isInt && !isAboveLowerFeasible) {
        threshold = lower.value;
        isStrict = true;
      } else {
        threshold = lower.value.add(upper.value).div(Rational.of(2n));
        if (isInt) threshold = threshold.floor();
      }
      if (isInt && hasTrial) threshold = threshold.ceil();
      candidate = null;
      scopes.push();
      if (hasTrial) {
        const numeral = manager.mkNumeralOfSort(threshold, isInt ? SORT_INT : SORT_REAL);
        const trial = manager.mkApp(isStrict ? OP_GT : OP_GE, [objective, numeral], SORT_BOOL);
        this.pinned.push(trial);
        solver.assertExpr(trial);
      }
      const reached = this.reachesInfinity(unbounded);
      let hint: InfEps | null = null;
      if (reached.status === L_TRUE && solver.check() === L_TRUE) {
        // The relaxation's largest value of f under the trial is only a threshold to check.
        const maximized = solver.maximizeObjective(index, false, false);
        if (maximized.result.isBoundValid && maximized.result.hint.isFinite())
          hint = maximized.result.hint;
      }
      scopes.pop();
      if (reached.status === L_UNDEF) {
        result = L_UNDEF;
        break;
      }
      result = L_TRUE;
      if (reached.status === L_TRUE) {
        best = reached.witness;
        if (hasTrial && isStrict) isAboveLowerFeasible = true;
        else if (hasTrial) {
          lower = InfEps.of(threshold);
          isAboveLowerFeasible = false;
        }
        const value = this.getModelObjectiveValue(index, best);
        if (value !== undefined && InfEps.of(value).compare(lower) > 0) candidate = value;
        if (
          hint !== null &&
          hint.compare(lower) > 0 &&
          (candidate === null || hint.value.compare(candidate) > 0)
        )
          candidate = hint.value;
        step.update(true);
        continue;
      }
      if (!hasTrial) break;
      if (isStrict) {
        isDecided = true;
        break;
      }
      upper = InfEps.of(threshold);
      step.reset();
    }
    scopes.reset();
    this.lower[index] = new ObjectiveValue(lower);
    this.upper[index] = new ObjectiveValue(isDecided ? lower : upper);
    if (best !== null) {
      this.model = best;
      this.publishBestModel();
    }
    return result;
  }

  release() {
    this.objs.reset();
    this.pinned.reset();
    for (const model of this.nlsatModels) model.decRef();
    this.nlsatModels = [];
    this.solver = null;
  }
}

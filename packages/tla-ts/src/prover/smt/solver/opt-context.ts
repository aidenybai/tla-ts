// Ported from Z3 (src/opt/opt_context.cpp, src/opt/optsmt.cpp, src/opt/opt_value.cpp), MIT
// license, see z3-license.txt. Linear objectives run optsmt over the SMT core. Nonlinear real
// objectives skip the arithmetic climb that Z3 runs before nlsat, so a result nlsat does not
// certify is unsupported. A rational optimum has no exact value, as when the climb finds it, so it
// prints as Z3 prints it. MaxSMT objectives, from soft constraints or from the 0-1 elimination, are
// unsupported.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  OP_ADD,
  KIND_APP,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_MUL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Goal } from "./goal";
import { isPbSum } from "./lia2card";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { AlgebraicManager, type Anum } from "./nlsat/algebraic";
import { mkAlgebraicEq, NlsatOpt, type NlsatOptResult } from "./opt-nlsat";
import { canReuseNlsatSolver, giaPareto, ParetoNlsatSolver, type ParetoSolver } from "./opt-pareto";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { InfEps } from "./inf-eps";
import { getModelValueBound, OptParetoSolver, OptSolver } from "./opt-solver";
import { Optsmt } from "./optsmt";
import { compileInternalTactic, convertModel, type TacticEnvironment } from "./tactic";

const NORMALIZER =
  "(and-then (using-params simplify :som true) propagate-values solve-eqs simplify)";

const ZERO_ONE_NORMALIZER =
  "(and-then (using-params simplify :som true) propagate-values solve-eqs simplify dt2bv " +
  "(using-params lia2card :compile_equality false) eq2bv simplify)";

export interface OptObjective {
  term: number;
  isMax: boolean;
}

export interface OptOptions {
  priority: string;
  bisectRounds: number;
  supremumRlimit: number;
  isParetoNlsat: boolean;
  paretoMaxLemmas: number;
  hasAssumptions: boolean;
  isLinear: boolean;
  isEliminatingZeroOne: boolean;
}

interface ObjectiveValue {
  infinity: Rational;
  value: Rational;
  epsilon: Rational;
  exact: Anum | null;
}

const MINUS_INFINITY: ObjectiveValue = {
  infinity: Rational.minusOne,
  value: Rational.zero,
  epsilon: Rational.zero,
  exact: null,
};

const PLUS_INFINITY: ObjectiveValue = { ...MINUS_INFINITY, infinity: Rational.one };

export class OptContext {
  private am = new AlgebraicManager();
  private lower: ObjectiveValue[] = [];
  private upper: ObjectiveValue[] = [];
  private boxModels: ProtoModel[] = [];
  private boxIndex = -1;
  private pareto: ParetoSolver | null = null;
  private normalized: OptObjective[] = [];
  private normalizedGoal: Goal | null = null;
  private normalizedTerms: RefVector;
  private optSolver: OptSolver | null = null;
  private optsmt: Optsmt | null = null;
  private rawModel: ProtoModel | null = null;
  private fixedModels = new Map<ProtoModel, ProtoModel>();
  model: ProtoModel | null = null;
  reasonUnknown = "";

  constructor(
    private manager: AstManager,
    private environment: TacticEnvironment,
    private objectives: readonly OptObjective[],
  ) {
    this.normalizedTerms = new RefVector(manager);
  }

  private fixModel(model: ProtoModel, goal: Goal) {
    const existing = this.fixedModels.get(model);
    if (existing !== undefined) return existing;
    const fixed = convertModel(goal, model);
    fixed.incRef();
    this.fixedModels.set(model, fixed);
    return fixed;
  }

  private setModel(model: ProtoModel | null) {
    const goal = this.normalizedGoal;
    const fixed = model === null || goal === null ? model : this.fixModel(model, goal);
    fixed?.incRef();
    this.model?.decRef();
    this.model = fixed;
  }

  private getInternalTerm(index: number, pinned: RefVector) {
    const objective = this.normalized[index];
    if (objective.isMax) return objective.term;
    const negated = this.manager.mkApp(OP_UMINUS, [objective.term], SORT_REAL);
    pinned.push(negated);
    return negated;
  }

  private getCommitment(index: number, pinned: RefVector) {
    const manager = this.manager;
    const lower = this.lower[index];
    const term = this.getInternalTerm(index, pinned);
    const constraint =
      lower.exact !== null && !this.am.isRational(lower.exact)
        ? mkAlgebraicEq(manager, term, lower.exact)
        : manager.mkApp(OP_GE, [term, manager.mkRealNumeral(lower.value)], SORT_BOOL);
    pinned.push(constraint);
    return constraint;
  }

  private search(
    index: number,
    hard: readonly number[],
    options: OptOptions,
    isCommitting: boolean,
  ) {
    const pinned = new RefVector(this.manager);
    const commitments = Array.from({ length: isCommitting ? index : 0 }, (_value, earlier) =>
      this.lower[earlier].infinity.isZero() ? [this.getCommitment(earlier, pinned)] : [],
    ).flat();
    const optimized = new NlsatOpt(this.manager, this.environment).maximize(
      [...hard, ...commitments],
      this.getInternalTerm(index, pinned),
      null,
      null,
      options.bisectRounds,
      options.supremumRlimit,
    );
    pinned.reset();
    if (optimized.status === L_FALSE) return L_FALSE;
    if (optimized.status !== L_TRUE)
      throw new SmtUnsupportedError("an optimum that nlsat does not certify");
    this.setResult(index, optimized.result);
    this.setModel(optimized.result.model);
    optimized.result.model?.decRef();
    return L_TRUE;
  }

  private setResult(index: number, result: NlsatOptResult) {
    if (result.isUnbounded) {
      this.lower[index] = PLUS_INFINITY;
      this.upper[index] = PLUS_INFINITY;
      return;
    }
    const value = result.isOpen ? result.sup : result.value;
    if (value === null) throw new SmtUnsupportedError("an optimum that nlsat does not certify");
    const epsilon = result.isOpen ? Rational.minusOne : Rational.zero;
    const exact = !result.isOpen && this.am.isRational(value) ? null : value;
    const bracket = (rational: Rational) => ({
      infinity: Rational.zero,
      value: rational,
      epsilon,
      exact,
    });
    this.lower[index] = bracket(result.isOpen ? result.supLower : result.lower);
    this.upper[index] = bracket(
      exact === null ? result.lower : result.isOpen ? result.supUpper : result.upper,
    );
  }

  private executeLex(hard: readonly number[], options: OptOptions) {
    const count = this.objectives.length;
    for (let index = 0; index < count; index++) {
      const status = this.search(index, hard, options, true);
      if (status !== L_TRUE) return status;
      for (let later = index + 1; later < count; later++) this.lower[later] = MINUS_INFINITY;
      const isOpen = !this.lower[index].epsilon.isZero();
      if (isOpen && index + 1 < count) {
        this.reasonUnknown =
          "later lexicographic objectives after an unattained nonlinear optimum are not supported";
        return L_UNDEF;
      }
      if (!this.lower[index].infinity.isZero() && index + 1 < count)
        throw new SmtUnsupportedError("lexicographic objectives after an unbounded one");
    }
    return L_TRUE;
  }

  private executeBox(hard: readonly number[], options: OptOptions) {
    for (let index = 0; index < this.objectives.length; index++) {
      const status = this.search(index, hard, options, false);
      if (status !== L_TRUE) return status;
      const model = this.model;
      if (model === null) throw new SmtUnsupportedError("a box objective without a model");
      model.incRef();
      this.boxModels.push(model);
    }
    this.boxIndex = 1;
    this.setModel(this.boxModels[0]);
    return L_TRUE;
  }

  private getModelBound(value: number, isLower: boolean) {
    const manager = this.manager;
    if (manager.isNumeral(value)) return manager.getRationalValue(value);
    if (!manager.isAlgebraicNumeral(value)) return null;
    const scale = Rational.of(10n ** 12n);
    const interval = this.am.getInterval(manager.getAlgebraicValue(value), 40);
    return isLower
      ? interval[0].mul(scale).floor().div(scale)
      : interval[1].mul(scale).ceil().div(scale);
  }

  private executePareto() {
    const pareto = this.pareto;
    if (pareto === null) throw new SmtUnsupportedError("pareto optimization without a solver");
    const outcome = giaPareto(this.manager, pareto, this.normalized);
    if (outcome.status !== L_TRUE || outcome.model === null) {
      if (outcome.status === L_UNDEF) this.reasonUnknown = pareto.reasonUnknown;
      pareto.release();
      this.pareto = null;
      return outcome.status;
    }
    const model = outcome.model;
    for (const [index, objective] of this.normalized.entries()) {
      const value = model.eval(objective.term, true);
      const sides = [objective.isMax, !objective.isMax].map((isLower) => {
        const bound = this.getModelBound(value, isLower);
        return bound === null ? null : objective.isMax ? bound : bound.neg();
      });
      this.manager.decRef(value);
      const bracket = (rational: Rational) => ({
        infinity: Rational.zero,
        value: rational,
        epsilon: Rational.zero,
        exact: null,
      });
      if (sides[0] !== null) this.lower[index] = bracket(sides[0]);
      if (sides[1] !== null) this.upper[index] = bracket(sides[1]);
    }
    this.setModel(model);
    model.decRef();
    return L_TRUE;
  }

  private startPareto(hard: readonly number[], options: OptOptions) {
    if (!options.isParetoNlsat || options.hasAssumptions)
      throw new SmtUnsupportedError("pareto optimization without nlsat");
    const terms = [...hard, ...this.normalized.map((objective) => objective.term)];
    if (!canReuseNlsatSolver(this.manager, terms))
      throw new SmtUnsupportedError("pareto optimization without incremental nlsat");
    this.pareto = new ParetoNlsatSolver(this.manager, this.environment, options.paretoMaxLemmas);
    for (const form of hard) this.pareto.assert(form);
    return this.executePareto();
  }

  optimize(hard: readonly number[], options: OptOptions) {
    if (this.pareto !== null) return this.executePareto();
    if (this.boxIndex !== -1) {
      if (this.boxIndex < this.boxModels.length) {
        this.setModel(this.boxModels[this.boxIndex++]);
        return L_TRUE;
      }
      this.boxIndex = -1;
      return L_FALSE;
    }
    this.release();
    const normalized = this.normalize(hard, options.isEliminatingZeroOne);
    if (normalized.length === 1 && this.manager.isFalse(normalized[0])) return L_FALSE;
    return options.isLinear
      ? this.executeLinear(normalized, options)
      : this.execute(normalized, options);
  }

  private executeLinear(hard: readonly number[], options: OptOptions) {
    const manager = this.manager;
    this.reasonUnknown = "";
    if (hard.some((form) => manager.hasQuantifierFlags[form]))
      throw new SmtUnsupportedError("optimization with quantified constraints");
    const solver = new OptSolver(manager, this.environment);
    this.optSolver = solver;
    const optsmt = new Optsmt(manager, {
      getBaseModel: () => this.rawModel,
      setModel: (model) => {
        this.rawModel = model;
      },
    });
    this.optsmt = optsmt;
    for (const objective of this.normalized) {
      const term = objective.term;
      if (objective.isMax) {
        optsmt.add(term);
        continue;
      }
      const negated = manager.mkApp(OP_UMINUS, [term], manager.sorts[term]);
      this.normalizedTerms.push(negated);
      optsmt.add(negated);
    }
    for (const form of hard) solver.assertExpr(form);
    const checked = solver.check();
    this.rawModel = checked === L_FALSE ? null : solver.getModel();
    const status = checked !== L_FALSE && this.rawModel === null ? L_UNDEF : checked;
    if (status !== L_TRUE) {
      this.setModel(this.rawModel);
      return status;
    }
    optsmt.setup(solver);
    this.updateBound(optsmt);
    const count = this.objectives.length;
    if (count > 1 && options.priority === "pareto") {
      this.lower = this.objectives.map(() => MINUS_INFINITY);
      this.upper = this.objectives.map(() => PLUS_INFINITY);
      this.pareto = new OptParetoSolver(solver);
      return this.executePareto();
    }
    const result =
      count === 0
        ? L_TRUE
        : count === 1
          ? this.executeMinMax(optsmt, 0, true, false)
          : options.priority === "box"
            ? this.executeLinearBox(optsmt)
            : this.executeLinearLex(optsmt);
    const bracket = (value: InfEps) => ({ ...value, exact: null });
    this.lower = optsmt.lower.map(bracket);
    this.upper = optsmt.upper.map(bracket);
    this.setModel(this.rawModel);
    return result === L_TRUE && solver.wasUnknown ? L_UNDEF : result;
  }

  // update_bound(true): the model's objective values are lower bounds.
  private updateBound(optsmt: Optsmt) {
    const manager = this.manager;
    const model = this.rawModel;
    if (model === null) return;
    for (const [index, objective] of this.normalized.entries()) {
      const value = model.eval(objective.term, false);
      const bound = getModelValueBound(manager, this.am, value, objective.isMax);
      manager.decRef(value);
      if (bound !== undefined)
        optsmt.updateLowerBound(index, InfEps.of(objective.isMax ? bound : bound.neg()));
    }
  }

  private executeMinMax(optsmt: Optsmt, index: number, isCommitted: boolean, isScoped: boolean) {
    const solver = this.optSolver;
    if (solver === null) throw new SmtUnsupportedError("optimization without a solver");
    if (isScoped) solver.push();
    const status = optsmt.lex(index);
    const best = optsmt.getBestModel();
    if (status === L_TRUE || (status === L_UNDEF && best !== null)) this.rawModel = best;
    if (isScoped) solver.pop(1);
    if (status === L_TRUE && isCommitted) optsmt.commitAssignment(index);
    return status;
  }

  private executeLinearLex(optsmt: Optsmt) {
    const count = this.objectives.length;
    for (let index = 0; index < count; index++) {
      const isLast = index + 1 === count;
      const status = this.executeMinMax(optsmt, index, !isLast, !isLast);
      if (status !== L_TRUE) return status;
      if (!optsmt.upper[index].isFinite()) {
        if (!isLast)
          throw new SmtUnsupportedError("lexicographic objectives after an unbounded one");
        return status;
      }
      if (!isLast) this.updateBound(optsmt);
    }
    return L_TRUE;
  }

  private executeLinearBox(optsmt: Optsmt) {
    this.boxIndex = 1;
    const status = optsmt.box();
    if (status !== L_TRUE) return status;
    for (const model of optsmt.models) {
      const boxModel = model ?? this.rawModel;
      if (boxModel === null) throw new SmtUnsupportedError("a box objective without a model");
      boxModel.incRef();
      this.boxModels.push(boxModel);
    }
    if (this.boxModels.length > 0) this.rawModel = this.boxModels[0];
    return status;
  }

  private normalize(hard: readonly number[], isEliminatingZeroOne: boolean) {
    const manager = this.manager;
    const goal = new Goal(manager);
    const decls = this.objectives.map((objective) =>
      manager.mkFreshFuncDecl(
        objective.isMax ? "maximize" : "minimize",
        [manager.sorts[objective.term]],
        SORT_BOOL,
      ),
    );
    for (const form of hard) goal.assert(form);
    for (const [index, objective] of this.objectives.entries())
      goal.assert(manager.mkApp(decls[index], [objective.term], SORT_BOOL));
    const goals = compileInternalTactic(
      this.environment,
      isEliminatingZeroOne ? ZERO_ONE_NORMALIZER : NORMALIZER,
    )(goal);
    if (goals.length !== 1) throw new SmtUnsupportedError("a normalization into several goals");
    const result = goals[0];
    const forms = result.isInconsistent ? [manager.falseExpr] : [...result.forms.items];
    for (const form of forms) this.normalizedTerms.push(form);
    this.normalizedGoal = result;
    const pinned = this.normalizedTerms;
    const pin = (expr: number) => {
      pinned.push(expr);
      return expr;
    };
    const normalizedHard: number[] = [];
    const purify = (term: number) => {
      const fresh = pin(manager.mkFreshConst("obj", manager.sorts[term]));
      normalizedHard.push(
        pin(manager.mkApp(OP_GE, [fresh, term], SORT_BOOL)),
        pin(manager.mkApp(OP_LE, [fresh, term], SORT_BOOL)),
      );
      result.addConverter(manager.decls[fresh]);
      return fresh;
    };
    const isMulConst = (term: number) => {
      if (manager.isUninterpretedConst(term) || manager.isNumeral(term)) return true;
      if (manager.getOp(term) !== OP_MUL || manager.getNumArgs(term) !== 2) return false;
      const args = manager.getArgs(term);
      return (
        (manager.isNumeral(args[0]) && manager.isUninterpretedConst(args[1])) ||
        (manager.isNumeral(args[1]) && manager.isUninterpretedConst(args[0]))
      );
    };
    this.normalized = [...this.objectives];
    for (const form of forms) {
      const index = manager.kinds[form] === KIND_APP ? decls.indexOf(manager.decls[form]) : -1;
      if (index === -1) {
        normalizedHard.push(form);
        continue;
      }
      const term = manager.getArg(form, 0);
      if (isPbSum(manager, term)) throw new SmtUnsupportedError("MaxSMT objectives");
      const purified =
        manager.getOp(term) === OP_ADD
          ? pin(
              manager.mkApp(
                OP_ADD,
                manager.getArgs(term).map((arg) => (isMulConst(arg) ? arg : purify(arg))),
                manager.sorts[term],
              ),
            )
          : manager.getOp(term) === OP_ITE || !isMulConst(term)
            ? purify(term)
            : term;
      this.normalized[index] = { term: purified, isMax: this.objectives[index].isMax };
    }
    result.forms.reset();
    return normalizedHard;
  }

  private execute(hard: readonly number[], options: OptOptions) {
    this.reasonUnknown = "";
    this.lower = this.objectives.map(() => MINUS_INFINITY);
    this.upper = this.objectives.map(() => PLUS_INFINITY);
    if (this.objectives.length > 1 && options.priority === "pareto")
      return this.startPareto(hard, options);
    return this.objectives.length > 1 && options.priority === "box"
      ? this.executeBox(hard, options)
      : this.executeLex(hard, options);
  }

  private getAdjusted(index: number, isLower: boolean): ObjectiveValue {
    const isMax = this.objectives[index].isMax;
    const value = (isLower === isMax ? this.lower : this.upper)[index];
    if (isMax) return value;
    const exact = value.exact === null ? null : this.am.copy(value.exact);
    if (exact !== null) this.am.neg(exact);
    return {
      infinity: value.infinity.neg(),
      value: value.value.neg(),
      epsilon: value.epsilon.neg(),
      exact,
    };
  }

  private isEqual(first: ObjectiveValue, second: ObjectiveValue) {
    if (!first.infinity.equals(second.infinity) || !first.epsilon.equals(second.epsilon))
      return false;
    if (first.exact === null && second.exact === null) return first.value.equals(second.value);
    const isFirstAlgebraic = first.exact !== null && !this.am.isRational(first.exact);
    const isSecondAlgebraic = second.exact !== null && !this.am.isRational(second.exact);
    if (isFirstAlgebraic !== isSecondAlgebraic) return false;
    if (first.exact !== null && second.exact !== null && isFirstAlgebraic)
      return this.am.compare(first.exact, second.exact) === 0;
    return first.value.equals(second.value);
  }

  private toExpr(value: ObjectiveValue, pinned: RefVector) {
    const manager = this.manager;
    const isAlgebraic = value.exact !== null && !this.am.isRational(value.exact);
    const sort =
      !isAlgebraic && value.epsilon.isZero() && value.value.isInt() ? SORT_INT : SORT_REAL;
    const mkConst = (name: string, constSort: number) =>
      manager.mkApp(manager.mkFuncDecl(name, [], constSort), [], constSort);
    const mkScaled = (coefficient: Rational, term: number) =>
      coefficient.equals(Rational.one)
        ? term
        : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(coefficient, sort), term], sort);
    const args: number[] = [];
    if (!value.infinity.isZero()) args.push(mkScaled(value.infinity, mkConst("oo", sort)));
    if (isAlgebraic && value.exact !== null) args.push(manager.mkAlgebraicNumeral(value.exact));
    else if (!value.value.isZero()) args.push(manager.mkNumeralOfSort(value.value, sort));
    if (!value.epsilon.isZero()) args.push(mkScaled(value.epsilon, mkConst("epsilon", SORT_REAL)));
    const expr =
      args.length === 0
        ? manager.mkNumeral(0n)
        : args.length === 1
          ? args[0]
          : manager.mkApp(OP_ADD, args, sort);
    pinned.push(expr);
    return expr;
  }

  getObjectives(format: (expr: number) => string) {
    const pinned = new RefVector(this.manager);
    const lines = this.objectives.map((objective, index) => {
      const lower = this.getAdjusted(index, true);
      const upper = this.getAdjusted(index, false);
      const name = format(objective.term);
      if (!this.isEqual(lower, upper))
        return ` (${name}  (interval ${format(this.toExpr(lower, pinned))} ${format(this.toExpr(upper, pinned))}))`;
      if (lower.exact !== null && lower.epsilon.isZero()) {
        const exact = this.manager.mkAlgebraicNumeral(lower.exact);
        pinned.push(exact);
        return ` (${name} ${format(exact)})`;
      }
      return ` (${name} ${format(this.toExpr(lower, pinned))})`;
    });
    pinned.reset();
    return ["(objectives", ...lines, ")"].join("\n");
  }

  release() {
    this.optsmt?.release();
    this.optsmt = null;
    this.rawModel = null;
    this.pareto?.release();
    this.pareto = null;
    this.normalizedGoal = null;
    this.normalizedTerms.reset();
    this.normalized = [];
    for (const model of this.boxModels) model.decRef();
    this.boxModels = [];
    this.boxIndex = -1;
    this.setModel(null);
    for (const fixed of this.fixedModels.values()) fixed.decRef();
    this.fixedModels.clear();
    this.optSolver?.release();
    this.optSolver = null;
  }
}

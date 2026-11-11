// Ported from Z3 (src/opt/opt_context.cpp, src/opt/optsmt.cpp, src/opt/opt_value.cpp), MIT
// license, see z3-license.txt. Nonlinear real objectives skip the arithmetic climb that Z3 runs
// before nlsat, so a result nlsat does not certify is unsupported. A rational optimum has no exact
// value, as when the climb finds it, so it prints as Z3 prints it. MaxSMT runs on the SMT core.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_BV,
  OP_ADD,
  KIND_APP,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_MUL,
  OP_TO_REAL,
  OP_MOD,
  OP_IDIV,
  OP_DIV,
  OP_EXTRACT,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { mkNot } from "./ast-util";
import { mkBvApp } from "./bv-decl-plugin";
import { Goal } from "./goal";
import { getPbSum } from "./lia2card";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { MaxsatContext, MaxsatParams } from "./maxsmt-base";
import { Maxsmt } from "./maxsmt";
import { AlgebraicManager, type Anum } from "./nlsat/algebraic";
import { isInNraFragment, mkAlgebraicEq, NlsatOpt, type NlsatOptResult } from "./opt-nlsat";
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

export const O_MAXIMIZE = 0;
export const O_MINIMIZE = 1;
export const O_MAXSMT = 2;

export interface OptObjective {
  type: number;
  // The minimized or maximized term, or -1 for soft constraints.
  term: number;
  terms: number[];
  weights: Rational[];
  id: string | null;
}

interface Objective extends OptObjective {
  offset: Rational;
  isNegated: boolean;
  index: number;
  maxsmt: Maxsmt | null;
}

export interface OptOptions {
  priority: string;
  bisectRounds: number;
  supremumRlimit: number;
  isParetoNlsat: boolean;
  paretoMaxLemmas: number;
  hasAssumptions: boolean;
  isLinear: boolean;
  isSatEnabled: boolean;
  isEliminatingZeroOne: boolean;
  maxsat: MaxsatParams;
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

const getBracket = (value: InfEps): ObjectiveValue => ({ ...value, exact: null });

const getRationalValue = (value: Rational): ObjectiveValue => ({
  infinity: Rational.zero,
  value,
  epsilon: Rational.zero,
  exact: null,
});

// opt::context warns that it does not support quantifiers, and optsmt need not find a bound of
// nonlinear arithmetic, so the port does not answer either.
export const isBeyondOptimization = (manager: AstManager, formulas: readonly number[]) => {
  const seen = new Set<number>();
  const stack = [...formulas];
  for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.hasQuantifierFlags[expr]) return true;
    const args = manager.getArgs(expr);
    const op = manager.getOp(expr);
    const isConstant = (arg: number): boolean =>
      manager.isNumeral(arg) ||
      ((manager.getOp(arg) === OP_UMINUS || manager.getOp(arg) === OP_TO_REAL) &&
        isConstant(manager.getArg(arg, 0)));
    if (op === OP_MUL && args.filter((arg) => !isConstant(arg)).length > 1) return true;
    if ((op === OP_DIV || op === OP_IDIV || op === OP_MOD) && !manager.isNumeral(args[1]))
      return true;
    stack.push(...args);
  }
  return false;
};

const hasIntConst = (manager: AstManager, formulas: readonly number[]) => {
  const seen = new Set<number>();
  const stack = [...formulas];
  for (let expr = stack.pop(); expr !== undefined; expr = stack.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.isUninterpretedConst(expr) && manager.sorts[expr] === SORT_INT) return true;
    manager.pushArgs(expr, stack);
  }
  return false;
};

const isPropositional = (manager: AstManager, expr: number) => {
  const atom = manager.isNot(expr) ? manager.getArg(expr, 0) : expr;
  if (manager.isUninterpretedConst(atom)) return true;
  const seen = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (seen.has(current)) continue;
    seen.add(current);
    if (manager.kinds[current] !== KIND_APP) return false;
    if (manager.getFamily(current) !== FAMILY_BASIC && !manager.isUninterpretedConst(current))
      return false;
    manager.pushArgs(current, todo);
  }
  return true;
};

// is_fd: Boolean structure over Boolean and bit-vector constants and bit-vector operations.
const isFiniteDomain = (manager: AstManager, formulas: readonly number[]) => {
  const seen = new Set<number>();
  const todo = [...formulas];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.kinds[expr] !== KIND_APP) return false;
    const family = manager.getFamily(expr);
    const sort = manager.sorts[expr];
    if (
      family !== FAMILY_BASIC &&
      family !== FAMILY_BV &&
      (!manager.isUninterpretedConst(expr) || (sort !== SORT_BOOL && !manager.isBvSort(sort)))
    )
      return false;
    manager.pushArgs(expr, todo);
  }
  return true;
};

const SAT_MAXSAT_ENGINES = new Set([
  "maxres",
  "maxresw",
  "rc2",
  "rc2tot",
  "rc2bin",
  "maxres-bin",
  "maxres-bin-delay",
  "pd-maxres",
  "bcd2",
  "sls",
]);

export class OptContext {
  private am = new AlgebraicManager();
  private lower: ObjectiveValue[] = [];
  private upper: ObjectiveValue[] = [];
  private boxModels: ProtoModel[] = [];
  private boxIndex = -1;
  private pareto: ParetoSolver | null = null;
  private internal: Objective[] = [];
  private normalized: { term: number; isMax: boolean }[] = [];
  private normalizedGoal: Goal | null = null;
  private normalizedTerms: RefVector;
  private hiddenDecls: number[] = [];
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

  private pin(expr: number) {
    this.normalizedTerms.push(expr);
    return expr;
  }

  private applyConverters(model: ProtoModel) {
    for (const decl of this.hiddenDecls) model.unregisterDecl(decl);
    const goal = this.normalizedGoal;
    return goal === null ? model : convertModel(goal, model);
  }

  private fixModel(model: ProtoModel) {
    const existing = this.fixedModels.get(model);
    if (existing !== undefined) return existing;
    const fixed = this.applyConverters(model);
    fixed.incRef();
    this.fixedModels.set(model, fixed);
    return fixed;
  }

  private setModel(model: ProtoModel | null) {
    const fixed = model === null ? model : this.fixModel(model);
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
      if (sides[0] !== null) this.lower[index] = getRationalValue(sides[0]);
      if (sides[1] !== null) this.upper[index] = getRationalValue(sides[1]);
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
    const terms = [
      ...normalized,
      ...this.internal.flatMap((objective) =>
        objective.type === O_MAXSMT ? objective.terms : [objective.term],
      ),
    ];
    if (
      options.isLinear ||
      this.internal.every((objective) => objective.type === O_MAXSMT) ||
      !isBeyondOptimization(this.manager, terms)
    )
      return this.executeLinear(normalized, options);
    if (
      this.internal.some(
        (objective) =>
          objective.type === O_MAXSMT || this.manager.sorts[objective.term] !== SORT_REAL,
      ) ||
      !isInNraFragment(this.manager, terms) ||
      hasIntConst(this.manager, terms)
    )
      throw new SmtUnsupportedError("optimization beyond linear arithmetic");
    return this.execute(normalized, options);
  }

  private getMaxsatContext(solver: OptSolver, options: OptOptions): MaxsatContext {
    return {
      manager: this.manager,
      params: options.maxsat,
      isSatEnabled: false,
      numObjectives: this.internal.length,
      getSolver: () => ({
        assertExpr: (expr) => solver.assertExpr(expr),
        push: () => solver.push(),
        pop: (numScopes) => solver.pop(numScopes),
        checkSat: (assumptions) => solver.check(assumptions),
        getModel: () => solver.getModel(),
        getUnsatCore: () => solver.getUnsatCore(),
        findMutexes: (vars) => ({ status: L_TRUE, mutexes: solver.findMutexes(vars) }),
      }),
      getBaseModel: () => this.rawModel,
      hide: (decl) => {
        this.hiddenDecls.push(decl);
      },
      adjust: (index, value) => this.adjust(index, value),
      addOffset: (index, value) => {
        const objective = this.internal[index];
        objective.offset = objective.isNegated
          ? objective.offset.sub(value)
          : objective.offset.add(value);
      },
      verifyModel: (index, model, value) => this.verifyModel(index, model, value),
      modelUpdated: (model) => {
        this.rawModel = model;
      },
    };
  }

  private adjust(index: number, value: Rational) {
    const objective = this.internal[index];
    return (objective.isNegated ? value.neg() : value).add(objective.offset);
  }

  private verifyModel(index: number, model: ProtoModel, value: Rational) {
    const manager = this.manager;
    const term = this.internal[index].term;
    if (term === -1) return true;
    const expected = this.adjust(index, value);
    const copy = model.copy();
    copy.incRef();
    const fixed = this.applyConverters(copy);
    if (fixed !== copy) {
      fixed.incRef();
      copy.decRef();
    }
    const evaluated = fixed.eval(term, true);
    const actual = manager.isNumeral(evaluated)
      ? manager.getRationalValue(evaluated)
      : manager.isBvNumeral(evaluated)
        ? Rational.of(manager.getBvNumeralValue(evaluated))
        : undefined;
    manager.decRef(evaluated);
    fixed.decRef();
    return actual !== undefined && actual.equals(expected);
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
    const context = this.getMaxsatContext(solver, options);
    for (const [index, objective] of this.internal.entries()) {
      if (objective.type === O_MAXSMT) {
        const maxsmt = new Maxsmt(context, index);
        objective.maxsmt = maxsmt;
        for (const [termIndex, term] of objective.terms.entries())
          maxsmt.add(term, objective.weights[termIndex]);
        continue;
      }
      const term = objective.term;
      objective.index = optsmt.add(
        objective.type === O_MAXIMIZE
          ? term
          : this.pin(manager.mkApp(OP_UMINUS, [term], manager.sorts[term])),
      );
    }
    this.updateSolver(hard, options);
    for (const form of hard) solver.assertExpr(form);
    const checked = solver.check();
    this.rawModel = checked === L_FALSE ? null : solver.getModel();
    const status = checked !== L_FALSE && this.rawModel === null ? L_UNDEF : checked;
    if (status !== L_TRUE) {
      this.setModel(this.rawModel);
      return status;
    }
    optsmt.setup(solver);
    this.updateBound(optsmt, true);
    const count = this.internal.length;
    if (count > 1 && options.priority === "pareto") {
      if (this.internal.some((objective) => objective.type === O_MAXSMT))
        throw new SmtUnsupportedError("pareto optimization of soft constraints");
      this.lower = this.internal.map(() => MINUS_INFINITY);
      this.upper = this.internal.map(() => PLUS_INFINITY);
      this.pareto = new OptParetoSolver(solver);
      return this.executePareto();
    }
    const result =
      count === 0
        ? L_TRUE
        : count === 1
          ? this.execute1(optsmt, this.internal[0], true, false)
          : options.priority === "box"
            ? this.executeLinearBox(optsmt)
            : this.executeLinearLex(optsmt, options);
    this.lower = this.internal.map((objective) =>
      objective.type === O_MAXSMT ? MINUS_INFINITY : getBracket(optsmt.lower[objective.index]),
    );
    this.upper = this.internal.map((objective) =>
      objective.type === O_MAXSMT ? PLUS_INFINITY : getBracket(optsmt.upper[objective.index]),
    );
    this.setModel(this.rawModel);
    return result === L_TRUE && solver.wasUnknown ? L_UNDEF : result;
  }

  // update_solver: Z3 moves a MaxSAT query over finite domains to the SAT core.
  private updateSolver(hard: readonly number[], options: OptOptions) {
    if (!options.isSatEnabled) return;
    if (this.internal.some((objective) => objective.type !== O_MAXSMT)) return;
    const soft = this.internal.flatMap((objective) => objective.terms);
    if (!isFiniteDomain(this.manager, [...soft, ...hard])) return;
    if (!SAT_MAXSAT_ENGINES.has(options.maxsat.maxsatEngine) || options.priority === "pareto")
      return;
    throw new SmtUnsupportedError("the SAT core for MaxSAT");
  }

  // update_bound: the model's objective values are lower bounds, or upper bounds.
  private updateBound(optsmt: Optsmt, isLower: boolean) {
    const manager = this.manager;
    const model = this.rawModel;
    if (model === null) return;
    for (const objective of this.internal) {
      if (objective.type === O_MAXSMT) {
        let cost = Rational.zero;
        for (const [index, term] of objective.terms.entries()) {
          const value = model.eval(term, false);
          if (value !== manager.trueExpr) cost = cost.add(objective.weights[index]);
          manager.decRef(value);
        }
        if (isLower) objective.maxsmt?.updateUpper(cost);
        else objective.maxsmt?.updateLower(cost);
        continue;
      }
      const value = model.eval(objective.term, false);
      const bound =
        getModelValueBound(manager, this.am, value, isLower !== objective.isNegated) ??
        (manager.isBvNumeral(value) ? Rational.of(manager.getBvNumeralValue(value)) : undefined);
      manager.decRef(value);
      if (bound === undefined) continue;
      const adjusted = InfEps.of((objective.isNegated ? bound.neg() : bound).add(objective.offset));
      if (isLower) optsmt.updateLowerBound(objective.index, adjusted);
      else optsmt.updateUpperBound(objective.index, adjusted);
    }
  }

  private execute1(optsmt: Optsmt, objective: Objective, isCommitted: boolean, isScoped: boolean) {
    return objective.type === O_MAXSMT
      ? this.executeMaxsat(objective, isCommitted, isScoped)
      : this.executeMinMax(optsmt, objective.index, isCommitted, isScoped);
  }

  private executeMaxsat(objective: Objective, isCommitted: boolean, isScoped: boolean) {
    const solver = this.optSolver;
    const maxsmt = objective.maxsmt;
    if (solver === null || maxsmt === null)
      throw new SmtUnsupportedError("MaxSMT without a solver");
    if (isScoped) solver.push();
    const status = maxsmt.run(isCommitted);
    if (status !== L_FALSE && maxsmt.model !== null) this.rawModel = maxsmt.model;
    if (isScoped) solver.pop(1);
    if (status === L_TRUE && isCommitted) maxsmt.commitAssignment();
    return status;
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

  private executeLinearLex(optsmt: Optsmt, options: OptOptions) {
    const count = this.internal.length;
    const isScoped =
      options.maxsat.maxsatEngine !== "maxres" ||
      this.internal.some((objective) => objective.type !== O_MAXSMT);
    for (let index = 0; index < count; index++) {
      const objective = this.internal[index];
      const isLast = index + 1 === count;
      const status = this.execute1(optsmt, objective, !isLast, isScoped && !isLast);
      if (status !== L_TRUE) return status;
      if (objective.type !== O_MAXSMT && !optsmt.upper[objective.index].isFinite()) {
        if (!isLast)
          throw new SmtUnsupportedError("lexicographic objectives after an unbounded one");
        return status;
      }
      if (!isLast) this.updateBound(optsmt, true);
    }
    return L_TRUE;
  }

  private executeLinearBox(optsmt: Optsmt) {
    const solver = this.optSolver;
    if (solver === null) throw new SmtUnsupportedError("optimization without a solver");
    this.boxIndex = 1;
    let status = optsmt.box();
    for (const objective of this.internal) {
      if (status !== L_TRUE) break;
      if (objective.type === O_MAXSMT) {
        solver.push();
        status = this.execute1(optsmt, objective, false, false);
        solver.pop(1);
      }
      const boxModel =
        objective.type === O_MAXSMT
          ? this.rawModel
          : (optsmt.models[objective.index] ?? this.rawModel);
      if (boxModel === null) throw new SmtUnsupportedError("a box objective without a model");
      boxModel.incRef();
      this.boxModels.push(boxModel);
    }
    if (status === L_TRUE && this.boxModels.length > 0) this.rawModel = this.boxModels[0];
    return status;
  }

  private isMulConst(term: number) {
    const manager = this.manager;
    if (manager.isUninterpretedConst(term) || manager.isNumeral(term)) return true;
    if (manager.getOp(term) !== OP_MUL || manager.getNumArgs(term) !== 2) return false;
    const args = manager.getArgs(term);
    return (
      (manager.isNumeral(args[0]) && manager.isUninterpretedConst(args[1])) ||
      (manager.isNumeral(args[1]) && manager.isUninterpretedConst(args[0]))
    );
  }

  private purify(term: number, hard: number[], goal: Goal) {
    const manager = this.manager;
    const fresh = this.pin(manager.mkFreshConst("obj", manager.sorts[term]));
    const sort = manager.sorts[term];
    if (sort === SORT_INT || sort === SORT_REAL)
      hard.push(
        this.pin(manager.mkApp(OP_GE, [fresh, term], SORT_BOOL)),
        this.pin(manager.mkApp(OP_LE, [fresh, term], SORT_BOOL)),
      );
    else hard.push(this.pin(manager.mkEq(fresh, term)));
    goal.addConverter(manager.decls[fresh]);
    return fresh;
  }

  private purifyObjective(term: number, hard: number[], goal: Goal) {
    const manager = this.manager;
    if (manager.getOp(term) === OP_ADD)
      return this.pin(
        manager.mkApp(
          OP_ADD,
          manager
            .getArgs(term)
            .map((arg) => (this.isMulConst(arg) ? arg : this.purify(arg, hard, goal))),
          manager.sorts[term],
        ),
      );
    return manager.getOp(term) === OP_ITE || !this.isMulConst(term)
      ? this.purify(term, hard, goal)
      : term;
  }

  // is_maxsat on a minimized or maximized term: a pseudo-Boolean sum or a bit-vector.
  private getMaxsat(term: number, isMax: boolean) {
    const manager = this.manager;
    const sum = getPbSum(manager, term, this.normalizedTerms);
    if (sum !== undefined) {
      let offset = sum.coeff;
      const terms: number[] = [];
      const weights: Rational[] = [];
      for (const [index, arg] of sum.args.entries()) {
        const weight = sum.coeffs[index];
        const isNegative = weight.isNegative();
        if (isMax) offset = offset.add(isNegative ? weight.neg() : weight);
        else if (isNegative) offset = offset.add(weight);
        terms.push(isNegative === isMax ? this.pin(mkNot(manager, arg)) : arg);
        weights.push(isNegative ? weight.neg() : weight);
      }
      return { terms, weights, offset, isNegated: isMax };
    }
    const sort = manager.sorts[term];
    if (!manager.isBvSort(sort)) return undefined;
    const value = this.pin(manager.mkBvNumeral(isMax ? 1n : 0n, 1));
    const terms: number[] = [];
    const weights: Rational[] = [];
    let offset = Rational.zero;
    for (let bit = 0; bit < manager.getBvSize(sort); bit++) {
      const weight = Rational.of(2n ** BigInt(bit));
      weights.push(weight);
      terms.push(
        this.pin(manager.mkEq(value, this.pin(mkBvApp(manager, OP_EXTRACT, [term], [bit, bit])))),
      );
      if (isMax) offset = offset.add(weight);
    }
    return { terms, weights, offset, isNegated: isMax };
  }

  private mkAtomic(terms: number[], hard: number[], goal: Goal) {
    return terms.map((term) =>
      isPropositional(this.manager, term) ? term : this.purify(term, hard, goal),
    );
  }

  private normalize(hard: readonly number[], isEliminatingZeroOne: boolean) {
    const manager = this.manager;
    const goal = new Goal(manager);
    const decls = this.objectives.map((objective) =>
      manager.mkFreshFuncDecl(
        objective.type === O_MAXIMIZE
          ? "maximize"
          : objective.type === O_MINIMIZE
            ? "minimize"
            : "maxsat",
        objective.type === O_MAXSMT
          ? objective.terms.map(() => SORT_BOOL)
          : [manager.sorts[objective.term]],
        SORT_BOOL,
      ),
    );
    for (const form of hard) goal.assert(form);
    for (const [index, objective] of this.objectives.entries())
      goal.assert(
        manager.mkApp(
          decls[index],
          objective.type === O_MAXSMT ? objective.terms : [objective.term],
          SORT_BOOL,
        ),
      );
    const goals = compileInternalTactic(
      this.environment,
      isEliminatingZeroOne ? ZERO_ONE_NORMALIZER : NORMALIZER,
    )(goal);
    if (goals.length !== 1) throw new SmtUnsupportedError("a normalization into several goals");
    const result = goals[0];
    const forms = result.isInconsistent ? [manager.falseExpr] : [...result.forms.items];
    for (const form of forms) this.normalizedTerms.push(form);
    this.normalizedGoal = result;
    const normalizedHard: number[] = [];
    this.internal = this.objectives.map((objective) => ({
      ...objective,
      offset: Rational.zero,
      isNegated: objective.type === O_MINIMIZE,
      index: 0,
      maxsmt: null,
    }));
    for (const form of forms) {
      const index = manager.kinds[form] === KIND_APP ? decls.indexOf(manager.decls[form]) : -1;
      if (index === -1) {
        normalizedHard.push(form);
        continue;
      }
      const objective = this.internal[index];
      const args = manager.getArgs(form);
      if (objective.type === O_MAXSMT) {
        let offset = Rational.zero;
        const terms: number[] = [];
        const weights: Rational[] = [];
        for (const [argIndex, arg] of args.entries()) {
          const weight = objective.weights[argIndex];
          const term = weight.isNegative() ? this.pin(mkNot(manager, arg)) : arg;
          const positive = weight.isNegative() ? weight.neg() : weight;
          if (weight.isNegative()) offset = offset.sub(positive);
          if (manager.isTrue(term) || positive.isZero()) continue;
          if (manager.isFalse(term)) {
            offset = offset.add(positive);
            continue;
          }
          terms.push(term);
          weights.push(positive);
        }
        Object.assign(objective, {
          term: -1,
          terms: this.mkAtomic(terms, normalizedHard, result),
          weights,
          offset,
          isNegated: false,
        });
        continue;
      }
      const term = args[0];
      const isMax = objective.type === O_MAXIMIZE;
      const maxsat = this.getMaxsat(term, isMax);
      if (maxsat !== undefined) {
        Object.assign(objective, {
          type: O_MAXSMT,
          id: null,
          terms: this.mkAtomic(maxsat.terms, normalizedHard, result),
          weights: maxsat.weights,
          offset: maxsat.offset,
          isNegated: maxsat.isNegated,
        });
        continue;
      }
      objective.term = this.purifyObjective(term, normalizedHard, result);
    }
    for (const objective of this.internal)
      if (
        objective.type !== O_MAXSMT &&
        manager.sorts[objective.term] !== SORT_INT &&
        manager.sorts[objective.term] !== SORT_REAL
      )
        objective.term = this.pin(manager.mkNumeral(0n));
    this.normalized = this.internal.map((objective) => ({
      term: objective.term,
      isMax: objective.type === O_MAXIMIZE,
    }));
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
    const objective = this.internal[index];
    const maxsmt = objective?.maxsmt;
    if (maxsmt !== null && maxsmt !== undefined)
      return getRationalValue(isLower ? maxsmt.getLower() : maxsmt.getUpper());
    const isMax = this.objectives[index].type === O_MAXIMIZE;
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
      const name = objective.type === O_MAXSMT ? (objective.id ?? "") : format(objective.term);
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
    for (const objective of this.internal) objective.maxsmt?.release();
    this.internal = [];
    this.optsmt?.release();
    this.optsmt = null;
    this.rawModel = null;
    this.pareto?.release();
    this.pareto = null;
    for (const model of this.boxModels) model.decRef();
    this.boxModels = [];
    this.boxIndex = -1;
    this.setModel(null);
    for (const fixed of this.fixedModels.values()) fixed.decRef();
    this.fixedModels.clear();
    this.hiddenDecls = [];
    this.normalizedGoal = null;
    this.normalizedTerms.reset();
    this.normalized = [];
    this.optSolver?.release();
    this.optSolver = null;
  }
}

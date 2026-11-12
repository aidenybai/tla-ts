// Ported from Z3 (src/opt/opt_context.cpp, src/opt/opt_value.cpp), MIT license, see
// z3-license.txt. MaxSMT runs on the SMT core.
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
import { isInNraFragment } from "./opt-nlsat";
import { canReuseNlsatSolver, giaPareto, ParetoNlsatSolver, type ParetoSolver } from "./opt-pareto";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { InfEps } from "./inf-eps";
import { getModelValueBound, OptParetoSolver, OptSolver } from "./opt-solver";
import { ObjectiveValue } from "./opt-value";
import { Optsmt, type OptsmtParams } from "./optsmt";
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
  optsmt: OptsmtParams;
  isParetoNlsat: boolean;
  isParetoNlsatReused: boolean;
  paretoMaxLemmas: number;
  hasAssumptions: boolean;
  isSatEnabled: boolean;
  isEliminatingZeroOne: boolean;
  maxsat: MaxsatParams;
}

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

  private executePareto() {
    const pareto = this.pareto;
    const optsmt = this.optsmt;
    if (pareto === null || optsmt === null)
      throw new SmtUnsupportedError("pareto optimization without a solver");
    const outcome = giaPareto(
      this.manager,
      pareto,
      this.normalized,
      pareto instanceof ParetoNlsatSolver,
    );
    if (outcome.status !== L_TRUE || outcome.model === null) {
      if (outcome.status === L_UNDEF) this.reasonUnknown = pareto.reasonUnknown;
      pareto.release();
      this.pareto = null;
      return outcome.status;
    }
    this.rawModel = outcome.model;
    this.updateBound(optsmt, true);
    this.updateBound(optsmt, false);
    this.setModel(outcome.model);
    outcome.model.decRef();
    return L_TRUE;
  }

  // On a pure NRA problem the dominance and blocking constraints go to nlsat, which decides atoms
  // over irrational algebraic numerals that the SMT core does not internalize.
  private mkParetoSolver(solver: OptSolver, hard: readonly number[], options: OptOptions) {
    const manager = this.manager;
    if (!options.isParetoNlsat || options.hasAssumptions) return new OptParetoSolver(solver);
    const terms = [...hard];
    for (const objective of this.internal) {
      if (
        objective.type === O_MAXSMT ||
        manager.sorts[objective.term] !== SORT_REAL ||
        !isInNraFragment(manager, [...hard, objective.term])
      )
        return new OptParetoSolver(solver);
      terms.push(objective.term);
    }
    if (!options.isParetoNlsatReused || !canReuseNlsatSolver(manager, terms))
      throw new SmtUnsupportedError("pareto optimization without incremental nlsat");
    const pareto = new ParetoNlsatSolver(manager, this.environment, options.paretoMaxLemmas);
    for (const form of hard) pareto.assert(form);
    return pareto;
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
    return this.execute(normalized, options);
  }

  private getMaxsatContext(solver: OptSolver, options: OptOptions): MaxsatContext {
    return {
      manager: this.manager,
      params: options.maxsat,
      isSatEnabled: false,
      getSolver: () => ({
        assertExpr: (expr) => solver.assertExpr(expr),
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

  private execute(hard: readonly number[], options: OptOptions) {
    const manager = this.manager;
    this.reasonUnknown = "";
    if (hard.some((form) => manager.hasQuantifierFlags[form]))
      throw new SmtUnsupportedError("optimization with quantified constraints");
    const solver = new OptSolver(manager, this.environment);
    this.optSolver = solver;
    const optsmt = new Optsmt(
      manager,
      this.environment,
      {
        getBaseModel: () => this.rawModel,
        setModel: (model) => {
          this.rawModel = model;
        },
      },
      options.optsmt,
    );
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
      this.pareto = this.mkParetoSolver(solver, hard, options);
      return this.executePareto();
    }
    const result =
      count === 0
        ? L_TRUE
        : count === 1
          ? this.execute1(optsmt, this.internal[0], true, false)
          : options.priority === "box"
            ? this.executeBox(optsmt)
            : this.executeLex(optsmt, options);
    this.setModel(this.rawModel);
    return result === L_TRUE && solver.wasUnknown ? L_UNDEF : result;
  }

  // Z3 moves a MaxSAT query over finite domains to the SAT core.
  private updateSolver(hard: readonly number[], options: OptOptions) {
    if (!options.isSatEnabled) return;
    if (this.internal.some((objective) => objective.type !== O_MAXSMT)) return;
    const soft = this.internal.flatMap((objective) => objective.terms);
    if (!isFiniteDomain(this.manager, [...soft, ...hard])) return;
    if (!SAT_MAXSAT_ENGINES.has(options.maxsat.maxsatEngine) || options.priority === "pareto")
      return;
    throw new SmtUnsupportedError("the SAT core for MaxSAT");
  }

  // The model's objective values are lower bounds, or upper bounds.
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
        getModelValueBound(manager, manager.am, value, isLower !== objective.isNegated) ??
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
    const result = optsmt.lex(index);
    // A later lexicographic objective cannot be optimized at an unattained real value.
    const isOpen = result === L_TRUE && optsmt.hasOpenBound(index);
    const isBlockingLater = isOpen && isCommitted && this.internal.length > 1;
    if (isBlockingLater)
      this.reasonUnknown =
        "later lexicographic objectives after an unattained nonlinear optimum are not supported";
    const status = isBlockingLater ? L_UNDEF : result;
    const best = optsmt.getBestModel();
    if (status === L_TRUE || (status === L_UNDEF && best !== null)) this.rawModel = best;
    if (isScoped) solver.pop(1);
    if (status === L_TRUE && isCommitted && !isOpen) optsmt.commitAssignment(index);
    return status;
  }

  private executeLex(optsmt: Optsmt, options: OptOptions) {
    const count = this.internal.length;
    const isScoped =
      options.maxsat.maxsatEngine !== "maxres" ||
      this.internal.some((objective) => objective.type !== O_MAXSMT);
    for (let index = 0; index < count; index++) {
      const objective = this.internal[index];
      const isLast = index + 1 === count;
      const status = this.execute1(optsmt, objective, !isLast, isScoped && !isLast);
      if (status !== L_TRUE) return status;
      const isUnbounded = objective.type !== O_MAXSMT && optsmt.isUnbounded(objective.index, true);
      if (isUnbounded) return isLast ? status : this.executeLexAfterUnbounded(optsmt, index);
      if (!isLast) this.updateBound(optsmt, true);
    }
    return L_TRUE;
  }

  // Each later arithmetic objective takes the limit of its optima as the unbounded objective
  // grows. A determined limit is committed before the next objective; an interval ends the search,
  // and the later objectives keep their unrestricted intervals.
  private executeLexAfterUnbounded(optsmt: Optsmt, unbounded: number) {
    const count = this.internal.length;
    for (let index = unbounded + 1; index < count; index++) {
      const objective = this.internal[index];
      if (objective.type === O_MAXSMT) return L_TRUE;
      const status = optsmt.lexAfterUnbounded(this.internal[unbounded].index, objective.index);
      const best = optsmt.getBestModel();
      if (best !== null) this.rawModel = best;
      if (status !== L_TRUE) return status;
      if (index + 1 < count) {
        const am = this.manager.am;
        if (!this.getAdjusted(index, true).equals(this.getAdjusted(index, false), am))
          return L_TRUE;
        optsmt.commitAssignment(objective.index);
      }
    }
    return L_TRUE;
  }

  private executeBox(optsmt: Optsmt) {
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

  private getAdjusted(index: number, isLower: boolean) {
    const objective = this.internal[index];
    const maxsmt = objective?.maxsmt;
    if (maxsmt !== null && maxsmt !== undefined)
      return new ObjectiveValue(InfEps.of(isLower ? maxsmt.getLower() : maxsmt.getUpper()));
    const isMax = this.objectives[index].type === O_MAXIMIZE;
    const optsmt = this.optsmt;
    const value =
      optsmt === null || objective === undefined
        ? isLower === isMax
          ? ObjectiveValue.minusInfinity
          : ObjectiveValue.infinity
        : (isLower === isMax ? optsmt.lower : optsmt.upper)[objective.index];
    return isMax ? value : value.negated(this.manager.am);
  }

  private toExpr(value: ObjectiveValue, pinned: RefVector) {
    const manager = this.manager;
    const bound = value.bound;
    const isAlgebraic = value.exact !== null && !manager.am.isRational(value.exact);
    const sort =
      !isAlgebraic && bound.epsilon.isZero() && bound.value.isInt() ? SORT_INT : SORT_REAL;
    const mkConst = (name: string, constSort: number) =>
      manager.mkApp(manager.mkFuncDecl(name, [], constSort), [], constSort);
    const mkScaled = (coefficient: Rational, term: number) =>
      coefficient.equals(Rational.one)
        ? term
        : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(coefficient, sort), term], sort);
    const args: number[] = [];
    if (!bound.infinity.isZero()) args.push(mkScaled(bound.infinity, mkConst("oo", sort)));
    if (isAlgebraic && value.exact !== null) args.push(manager.mkAlgebraicNumeral(value.exact));
    else if (!bound.value.isZero()) args.push(manager.mkNumeralOfSort(bound.value, sort));
    if (!bound.epsilon.isZero()) args.push(mkScaled(bound.epsilon, mkConst("epsilon", SORT_REAL)));
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
      if (!lower.equals(upper, this.manager.am))
        return ` (${name}  (interval ${format(this.toExpr(lower, pinned))} ${format(this.toExpr(upper, pinned))}))`;
      if (lower.exact !== null && !lower.hasInfinitesimal()) {
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

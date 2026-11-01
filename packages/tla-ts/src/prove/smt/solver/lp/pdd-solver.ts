// Ported from Z3 (src/math/grobner/pdd_solver.h, src/math/grobner/pdd_solver.cpp), MIT license,
// see z3-license.txt. dd::solver, the Grobner basis completion that nla runs on polynomials as
// pdds. Each step picks the simplest equation whose leading variable is highest, simplifies it by
// the processed equations and them by it, and adds its S-polynomials with them to be simplified.
// Equations move between the solved, processed and to-simplify sets, each in an array where an
// equation knows its index. Z3's solver::simplify runs the simplifier, which here is PddSimplifier
// in pdd-simplifier, run by its caller.
import { PddMemoryOutError } from "../../../../errors";
import { Dependency, mkJoin } from "./dependency";
import { Pdd, PddManager } from "./pdd";
import { shrink } from "../array";

export const SOLVED = 0;
const PROCESSED = 1;
export const TO_SIMPLIFY = 2;

const UINT_MAX = 0xffffffff;

interface PddSolverConfig {
  eqsThreshold: number;
  exprSizeLimit: number;
  exprDegreeLimit: number;
  maxSteps: number;
  maxSimplified: number;
  eqsGrowth: number;
  exprSizeGrowth: number;
  exprDegreeGrowth: number;
  numberOfConflictsToReport: number;
}

export const getDefaultPddSolverConfig = (): PddSolverConfig => ({
  eqsThreshold: UINT_MAX,
  exprSizeLimit: UINT_MAX,
  exprDegreeLimit: UINT_MAX,
  maxSteps: UINT_MAX,
  maxSimplified: UINT_MAX,
  eqsGrowth: 10,
  exprSizeGrowth: 10,
  exprDegreeGrowth: 5,
  numberOfConflictsToReport: 1,
});

interface Subst {
  variable: number;
  poly: Pdd;
  dep: Dependency;
}

class PddSolverStats {
  simplified = 0;
  maxExprSize = 0;
  maxExprDegree = 0;
  superposed = 0;
  computeSteps = 0;
}

export class Equation {
  state = TO_SIMPLIFY;
  idx = 0;

  constructor(
    public poly: Pdd,
    public dep: Dependency,
  ) {}
}

// scoped_update: walks a set with i and keeps the equations that nextj moves to j. finish keeps
// those not walked and drops the rest, as Z3's destructor does.
export class SetUpdate {
  i = 0;
  private j = 0;
  readonly size: number;

  constructor(private set: Equation[]) {
    this.size = set.length;
  }

  get() {
    return this.set[this.i];
  }

  nextj() {
    this.set[this.j] = this.set[this.i];
    this.set[this.i].idx = this.j++;
  }

  finish() {
    for (; this.i < this.size; this.i++) this.nextj();
    shrink(this.set, this.j);
  }
}

export class PddSolver {
  stats = new PddSolverStats();
  config = getDefaultPddSolverConfig();
  solved: Equation[] = [];
  processed: Equation[] = [];
  toSimplify: Equation[] = [];
  private substs: Subst[] = [];
  conflict: Equation | null = null;
  private isTooComplexFound = false;
  private levelp1 = 0;
  private level2var: number[] = [];
  private var2level: number[] = [];

  constructor(
    readonly manager: PddManager,
    private isCanceled: () => boolean,
  ) {}

  adjustConfig() {
    const config = this.config;
    const count = this.toSimplify.length;
    config.eqsThreshold = Math.trunc(config.eqsGrowth * Math.ceil(Math.log(1 + count)) * count);
    config.exprSizeLimit = 0;
    config.exprDegreeLimit = 0;
    for (const equation of this.toSimplify) {
      config.exprSizeLimit = Math.max(config.exprSizeLimit, equation.poly.treeSize());
      config.exprDegreeLimit = Math.max(config.exprDegreeLimit, equation.poly.degree());
    }
    config.exprSizeLimit *= config.exprSizeGrowth;
    config.exprDegreeLimit *= config.exprDegreeGrowth;
  }

  reset() {
    this.substs = [];
    this.solved = [];
    this.processed = [];
    this.toSimplify = [];
    this.stats = new PddSolverStats();
    this.level2var = [];
    this.var2level = [];
    this.conflict = null;
  }

  add(poly: Pdd, dep: Dependency = null) {
    if (poly.isZero()) return;
    const equation = new Equation(poly, dep);
    if (this.checkConflict(equation)) return;
    this.pushEquation(TO_SIMPLIFY, equation);
    if (this.var2level.length > 0) {
      this.levelp1 = Math.max(this.var2level[poly.var()] + 1, this.levelp1);
    }
    this.updateStats(equation);
  }

  // simplify: applies the substitutions to p, and returns it with its dependency.
  simplify(poly: Pdd, dep: Dependency) {
    let result = poly;
    let resultDep = dep;
    for (const subst of this.substs) {
      const substituted = result.substPdd(subst.variable, subst.poly);
      if (substituted.equals(result)) continue;
      result = substituted;
      resultDep = mkJoin(resultDep, subst.dep);
    }
    return { poly: result, dep: resultDep };
  }

  addSubst(variable: number, poly: Pdd, dep: Dependency) {
    this.substs.push({ variable, poly, dep });
    if (this.var2level.length > 0) {
      this.levelp1 = Math.max(
        this.var2level[variable] + 1,
        Math.max(this.var2level[poly.var()] + 1, this.levelp1),
      );
    }
    const simplifier = (target: Equation) => {
      const substituted = target.poly.substPdd(variable, poly);
      if (substituted.equals(target.poly)) return null;
      if (this.isTooComplex(substituted)) {
        this.isTooComplexFound = true;
        return null;
      }
      const isLeadingTermChanged = substituted.differentLeadingTerm(target.poly);
      target.poly = substituted;
      target.dep = mkJoin(target.dep, dep);
      this.updateStats(target);
      return isLeadingTermChanged;
    };
    if (!this.isDone()) this.simplifySetUsing(this.processed, simplifier);
    if (!this.isDone()) this.simplifySetUsing(this.toSimplify, simplifier);
    if (!this.isDone()) this.simplifySetUsing(this.solved, simplifier);
  }

  saturate() {
    if (this.isDone()) return;
    this.initSaturate();
    try {
      while (!this.isDone() && this.step());
    } catch (error) {
      if (!(error instanceof PddMemoryOutError)) throw error;
    }
  }

  equations() {
    return [...this.solved, ...this.toSimplify, ...this.processed];
  }

  private step() {
    this.stats.computeSteps++;
    const equation = this.pickNext();
    if (equation === null) return false;
    // scoped_process: the equation goes back to processed unless the step settles it.
    let pending: Equation | null = equation;
    try {
      this.simplifyUsingAll(equation, this.processed);
      if (this.isTrivial(equation)) {
        pending = null;
        return true;
      }
      if (this.checkConflict(equation)) {
        pending = null;
        return false;
      }
      this.isTooComplexFound = false;
      this.simplifySetUsingEquation(this.processed, equation);
      if (this.isDone()) return false;
      for (const target of this.processed) this.superpose(equation, target);
      this.simplifySetUsingEquation(this.toSimplify, equation);
      if (this.isDone()) return false;
      if (!this.isTooComplexFound) {
        pending = null;
        this.pushEquation(equation.poly.degree() === 1 ? SOLVED : PROCESSED, equation);
      }
      return true;
    } finally {
      if (pending !== null) this.pushEquation(PROCESSED, pending);
    }
  }

  private initSaturate() {
    const level2var = this.manager.level2var;
    this.level2var = [...level2var];
    this.var2level = [];
    for (let level = 0; level < level2var.length; level++) this.var2level[level2var[level]] = level;
    this.levelp1 = level2var.length;
  }

  private pickNext() {
    while (this.levelp1 > 0) {
      const variable = this.level2var[this.levelp1 - 1];
      let picked: Equation | null = null;
      for (const current of this.toSimplify) {
        if (current.state !== TO_SIMPLIFY || current.poly.var() !== variable) continue;
        if (picked === null || this.isSimpler(current, picked)) picked = current;
      }
      if (picked !== null) {
        this.popEquation(picked);
        return picked;
      }
      this.levelp1--;
    }
    return null;
  }

  private superpose(first: Equation, second: Equation) {
    const poly = this.manager.trySpoly(first.poly, second.poly);
    if (poly === null || poly.isZero()) return;
    if (this.isTooComplex(poly)) {
      this.isTooComplexFound = true;
      return;
    }
    this.stats.superposed++;
    this.add(poly, mkJoin(first.dep, second.dep));
  }

  // simplify_using(eq, eqs): reduces eq by the set until no reduction applies.
  private simplifyUsingAll(equation: Equation, set: Equation[]) {
    let isSimplified = false;
    do {
      isSimplified = false;
      for (const source of set) {
        if (this.trySimplifyUsing(equation, source) !== null) isSimplified = true;
        if (this.isCanceled() || equation.poly.isVal()) break;
      }
    } while (isSimplified && !equation.poly.isVal());
    if (equation.poly.isUnary() && equation.poly.hi().val().isNegative()) {
      equation.poly = equation.poly.neg();
    }
  }

  private simplifySetUsingEquation(set: Equation[], source: Equation) {
    this.simplifySetUsing(set, (target) => this.trySimplifyUsing(target, source));
  }

  // simplify_using(set, simplifier): the simplifier returns null when it leaves the target, and
  // otherwise whether the leading term changed.
  private simplifySetUsing(set: Equation[], simplifier: (target: Equation) => boolean | null) {
    const update = new SetUpdate(set);
    for (; update.i < update.size; update.i++) {
      const target = set[update.i];
      const isLeadingTermChanged = this.isDone() ? null : simplifier(target);
      if (isLeadingTermChanged !== null && this.isTrivial(target)) continue;
      if (isLeadingTermChanged !== null && this.checkConflict(target)) continue;
      if (isLeadingTermChanged === true) {
        if (set === this.toSimplify) update.nextj();
        else this.pushEquation(TO_SIMPLIFY, target);
        if (this.var2level.length > 0) {
          this.levelp1 = Math.max(this.var2level[target.poly.var()] + 1, this.levelp1);
        }
        continue;
      }
      update.nextj();
    }
    update.finish();
  }

  // try_simplify_using: null when the target stays, and otherwise whether its leading term changed
  // while it was processed.
  private trySimplifyUsing(target: Equation, source: Equation) {
    if (source === target) return null;
    this.stats.simplified++;
    const reduced = target.poly.reduce(source.poly);
    if (reduced.equals(target.poly)) return null;
    if (this.isTooComplex(reduced)) {
      this.isTooComplexFound = true;
      return null;
    }
    const isLeadingTermChanged =
      target.state === PROCESSED && reduced.differentLeadingTerm(target.poly);
    target.poly = reduced;
    target.dep = mkJoin(target.dep, source.dep);
    this.updateStats(target);
    return isLeadingTermChanged;
  }

  // simplify_using(dst, src): reduces dst by src whatever the result, and returns whether its
  // leading term changed while it was processed.
  simplifyUsing(target: Equation, source: Equation) {
    if (source === target) return false;
    this.stats.simplified++;
    const reduced = target.poly.reduce(source.poly);
    const isLeadingTermChanged =
      target.state === PROCESSED && reduced.differentLeadingTerm(target.poly);
    if (reduced.equals(target.poly)) return isLeadingTermChanged;
    target.poly = reduced;
    target.dep = mkJoin(target.dep, source.dep);
    this.updateStats(target);
    return isLeadingTermChanged;
  }

  isDone() {
    return (
      this.toSimplify.length + this.processed.length >= this.config.eqsThreshold ||
      this.stats.simplified >= this.config.maxSimplified ||
      this.isCanceled() ||
      this.stats.computeSteps > this.config.maxSteps ||
      this.conflict !== null
    );
  }

  isTrivial(equation: Equation) {
    return equation.poly.isZero();
  }

  isConflict(equation: Equation) {
    return equation.poly.isVal() && !this.isTrivial(equation);
  }

  checkConflict(equation: Equation) {
    if (!this.isConflict(equation)) return false;
    this.setConflict(equation);
    return true;
  }

  setConflict(equation: Equation) {
    this.conflict = equation;
    this.pushEquation(SOLVED, equation);
  }

  private isSimpler(first: Equation, second: Equation) {
    return this.manager.lmLt(first.poly, second.poly);
  }

  private isTooComplex(poly: Pdd) {
    return (
      poly.treeSize() > this.config.exprSizeLimit || poly.degree() > this.config.exprDegreeLimit
    );
  }

  private getQueue(state: number) {
    if (state === PROCESSED) return this.processed;
    return state === TO_SIMPLIFY ? this.toSimplify : this.solved;
  }

  popEquation(equation: Equation) {
    const set = this.getQueue(equation.state);
    const last = set[set.length - 1];
    if (equation.idx !== set.length - 1) {
      last.idx = equation.idx;
      set[equation.idx] = last;
    }
    set.pop();
  }

  pushEquation(state: number, equation: Equation) {
    equation.state = state;
    const set = this.getQueue(state);
    equation.idx = set.length;
    set.push(equation);
  }

  private updateStats(equation: Equation) {
    this.stats.maxExprSize = Math.max(this.stats.maxExprSize, equation.poly.treeSize());
    this.stats.maxExprDegree = Math.max(this.stats.maxExprDegree, equation.poly.degree());
  }
}

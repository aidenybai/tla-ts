// Ported from Z3 (src/math/lp/nla_intervals.h, src/math/lp/nla_intervals.cpp), MIT license, see
// z3-license.txt. Evaluates a nex expression over the bounds of its variables. When the interval
// excludes zero, the expression cannot vanish, so the bounds behind the interval and the
// dependencies of the row conflict with the row's equation, and the conflict becomes a lemma.
import { Rational } from "../rational";
import {
  type DepInterval,
  type DepsMode,
  add,
  addScalar,
  checkIntervalForConflictOnZero,
  intersect,
  isEmpty,
  mkDepInterval,
  mul,
  mulScalar,
  power,
  separatedFromZero,
  set,
  setValue,
  setZeroIntervalDepsForMult,
} from "./dep-intervals";
import { type Dependency, linearize, mkJoin, mkLeaf } from "./dependency";
import { Explanation } from "./explanation";
import { LarTerm } from "./lar-term";
import { type Nex, type NexMul, type NexSum, isALinearTerm, isElementary } from "./nex";
import { LemmaBuilder, type NlaCore } from "./nla-core";

type ReportConflict = (explanation: Explanation) => void;

const mkExplanation = (constraints: number[]) => {
  const explanation = new Explanation();
  for (const constraint of constraints) explanation.push(constraint);
  return explanation;
};

export class Intervals {
  constructor(private readonly core: NlaCore) {}

  // check_nex: whether the expression's interval excludes zero, in which case a lemma explains it.
  checkNex(expr: Nex, initialDeps: Dependency) {
    const report: ReportConflict = (explanation) =>
      new LemmaBuilder(this.core).addExplanation(explanation);
    const interval = mkDepInterval();
    if (!this.intervalOfExpr(expr, 1, interval, "without-deps", report)) return true;
    if (!separatedFromZero(interval)) return false;
    const intervalWithDeps = mkDepInterval();
    this.intervalOfExpr(expr, 1, intervalWithDeps, "with-deps", report);
    checkIntervalForConflictOnZero(intervalWithDeps, initialDeps, (constraints) =>
      report(mkExplanation(constraints)),
    );
    return true;
  }

  private hasZeroInterval(expr: Nex) {
    return expr.kind === "var" && this.core.varIsFixedToZero(expr.variable);
  }

  private hasInfInterval(expr: Nex): boolean {
    if (expr.kind === "var") return this.core.noBounds(expr.variable);
    if (expr.kind === "mul") return this.mulHasInfInterval(expr);
    if (expr.kind === "scalar") return false;
    return expr.children.some((child) => this.hasInfInterval(child));
  }

  private mulHasInfInterval(mul: NexMul) {
    let hasInf = false;
    for (const child of mul.children) {
      if (!isElementary(child.expr)) return false;
      if (this.hasZeroInterval(child.expr)) return false;
      hasInf ||= this.hasInfInterval(child.expr);
    }
    return hasInf;
  }

  // expression_to_normalized_term: the sum a*t + b, where t is the linear part divided by the
  // coefficient of its smallest variable, which is a.
  private expressionToNormalizedTerm(sum: NexSum) {
    const pairs: [Rational, number][] = [];
    let constant = Rational.zero;
    let smallestVar = 0;
    let coeffIndex = -1;
    for (const child of sum.children) {
      if (child.kind === "scalar") {
        constant = constant.add(child.value);
        continue;
      }
      if (child.kind === "mul") {
        const first = child.children[0].expr;
        if (first.kind === "var") pairs.push([child.coeff, first.variable]);
      } else if (child.kind === "var") pairs.push([Rational.one, child.variable]);
      if (pairs.length === 0) continue;
      const last = pairs[pairs.length - 1];
      if (pairs.length === 1 || smallestVar > last[1]) {
        smallestVar = last[1];
        coeffIndex = pairs.length - 1;
      }
    }
    const coeff = pairs[coeffIndex][0];
    const term = new LarTerm();
    pairs.forEach((pair, index) => {
      if (coeff.equals(Rational.one)) term.addMonomial(pair[0], pair[1]);
      else if (index !== coeffIndex) term.addMonomial(pair[0].div(coeff), pair[1]);
      else term.addMonomial(Rational.one, pair[1]);
    });
    return { term, coeff, constant };
  }

  setVarInterval(lpVar: number, interval: DepInterval, mode: DepsMode) {
    const lra = this.core.lra;
    const isColumn = lpVar < lra.columns.length;
    const lowerDep = isColumn ? lra.getLowerWitness(lpVar) : null;
    if (lowerDep !== null) {
      const bound = lra.core.lowerBounds[lpVar];
      interval.lower = bound.x;
      interval.isLowerOpen = bound.y.isPositive();
      interval.isLowerInf = false;
    } else {
      interval.isLowerOpen = true;
      interval.isLowerInf = true;
    }
    if (mode === "with-deps") interval.lowerDep = lowerDep;
    const upperDep = isColumn ? lra.getUpperWitness(lpVar) : null;
    if (upperDep !== null) {
      const bound = lra.core.upperBounds[lpVar];
      interval.upper = bound.x;
      interval.isUpperOpen = bound.y.isNegative();
      interval.isUpperInf = false;
    } else {
      interval.isUpperOpen = true;
      interval.isUpperInf = true;
    }
    if (mode === "with-deps") interval.upperDep = upperDep;
  }

  // interval_from_term: the interval of a linear sum from the bounds of the term column that
  // equals it, or from an equivalence that fixes it.
  private intervalFromTerm(sum: NexSum, interval: DepInterval, mode: DepsMode) {
    const normalized = this.expressionToNormalizedTerm(sum);
    const explanation = new Explanation();
    if (this.core.explainByEquiv(normalized.term, explanation)) {
      setValue(interval, normalized.constant);
      if (mode === "with-deps") {
        for (const constraint of explanation)
          interval.lowerDep = mkJoin(interval.lowerDep, mkLeaf(constraint));
        interval.upperDep = interval.lowerDep;
      }
      return true;
    }
    const found = this.core.lra.fetchNormalizedTermColumn(normalized.term);
    if (found === undefined) return false;
    this.setVarInterval(found.column, interval, mode);
    const scaled = mkDepInterval();
    mulScalar(normalized.coeff.div(found.coeff), interval, scaled, mode);
    addScalar(normalized.constant, scaled);
    set(interval, scaled, mode);
    return true;
  }

  private intervalOfSumNoTerm(
    sum: NexSum,
    interval: DepInterval,
    mode: DepsMode,
    report: ReportConflict,
  ) {
    if (this.hasInfInterval(sum)) return true;
    if (!this.intervalOfExpr(sum.children[0], 1, interval, mode, report)) return false;
    for (const child of sum.children.slice(1)) {
      const childInterval = mkDepInterval();
      if (!this.intervalOfExpr(child, 1, childInterval, mode, report)) return false;
      const total = mkDepInterval();
      add(interval, childInterval, total, mode);
      set(interval, total, mode);
    }
    return true;
  }

  // conflict_u_l: whether first's upper bound is below second's lower bound. Like Z3, equal
  // bounds conflict when either upper bound is open.
  private conflictUpperLower(first: DepInterval, second: DepInterval) {
    if (first.isUpperInf || second.isLowerInf) return false;
    const comparison = first.upper.compare(second.lower);
    if (comparison !== 0) return comparison < 0;
    return first.isUpperOpen || second.isUpperOpen;
  }

  private intervalOfSum(
    sum: NexSum,
    interval: DepInterval,
    mode: DepsMode,
    report: ReportConflict,
  ) {
    if (!this.intervalOfSumNoTerm(sum, interval, mode, report)) return false;
    if (!isALinearTerm(sum)) return true;
    const fromTerm = mkDepInterval();
    if (!this.intervalFromTerm(sum, fromTerm, mode)) return true;
    const intersection = mkDepInterval();
    intersect(interval, fromTerm, intersection, mode);
    if (!isEmpty(intersection)) {
      set(interval, intersection, mode);
      return true;
    }
    if (mode === "with-deps") {
      const explanation = new Explanation();
      const deps = this.conflictUpperLower(interval, fromTerm)
        ? [interval.upperDep, intersection.lowerDep]
        : [intersection.upperDep, interval.lowerDep];
      for (const dep of deps)
        for (const constraint of linearize([dep])) explanation.push(constraint);
      report(explanation);
    } else this.intervalOfSum(sum, mkDepInterval(), "with-deps", report);
    return false;
  }

  private intervalOfMul(
    monomial: NexMul,
    interval: DepInterval,
    mode: DepsMode,
    report: ReportConflict,
  ) {
    const zeroChild = monomial.children.find((child) => this.hasZeroInterval(child.expr));
    if (zeroChild !== undefined) {
      this.intervalOfExpr(zeroChild.expr, 1, interval, mode, report);
      if (mode === "with-deps") setZeroIntervalDepsForMult(interval);
      return true;
    }
    setValue(interval, monomial.coeff);
    for (const child of monomial.children) {
      const childInterval = mkDepInterval();
      if (!this.intervalOfExpr(child.expr, child.power, childInterval, mode, report)) return false;
      const product = mkDepInterval();
      mul(interval, childInterval, product, mode);
      set(interval, product, mode);
    }
    return true;
  }

  private toPower(interval: DepInterval, exponent: number, mode: DepsMode) {
    if (exponent === 1) return;
    const result = mkDepInterval();
    power(interval, exponent, result, mode);
    set(interval, result, mode);
  }

  // interval_of_expr: false when a sum met a conflict, which report received.
  private intervalOfExpr(
    expr: Nex,
    exponent: number,
    interval: DepInterval,
    mode: DepsMode,
    report: ReportConflict,
  ): boolean {
    if (expr.kind === "scalar") {
      setValue(interval, expr.value.pow(exponent));
      return true;
    }
    if (expr.kind === "sum") {
      if (!this.intervalOfSum(expr, interval, mode, report)) return false;
    } else if (expr.kind === "mul") {
      if (!this.intervalOfMul(expr, interval, mode, report)) return false;
    } else this.setVarInterval(expr.variable, interval, mode);
    this.toPower(interval, exponent, mode);
    return true;
  }
}

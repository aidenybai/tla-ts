// Ported from Z3 (src/math/lp/monomial_bounds.{h,cpp}, src/util/mpq.h root), MIT license, see
// z3-license.txt. Bounds of monomials from the intervals of their factors and back, the
// linearization of monomials with at most one non-fixed factor, and the optimization of the bounds
// of nonlinear variables over the tableau. The shared-factor and binomial-sign lemmas, off by
// default (arith.nl.monomial_sandwich, arith.nl.monomial_binomial_sign), are not ported.
import { getLcm, Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import {
  DepInterval,
  div,
  mkDepInterval,
  mul,
  power,
  separatedFromZero,
  set,
  setValue,
} from "./dep-intervals";
import { LP_INFEASIBLE } from "./core-solver";
import { Dependency, linearize, mkJoin } from "./dependency";
import { Explanation } from "./explanation";
import { NULL_LPVAR } from "./lar-solver";
import { Impq } from "./numeric-pair";
import { LemmaBuilder, NLA_PARAMS, type NlaCore } from "./nla-core";
import type { Monic } from "./nla-emonics";

// The n-th root of an integer when it is exact.
const getIntRoot = (value: bigint, degree: number): bigint | undefined => {
  if (value < 0n) {
    if (degree % 2 === 0) return undefined;
    const root = getIntRoot(-value, degree);
    return root === undefined ? undefined : -root;
  }
  if (value < 2n || degree === 1) return value;
  const exponent = BigInt(degree);
  let low = 0n;
  let high = 1n;
  while (high ** exponent <= value) high *= 2n;
  while (high - low > 1n) {
    const mid = (low + high) / 2n;
    if (mid ** exponent <= value) low = mid;
    else high = mid;
  }
  return low ** exponent === value ? low : undefined;
};

// root: the n-th root of a rational when it is rational.
const getRoot = (value: Rational, degree: number) => {
  const num = getIntRoot(value.num, degree);
  const den = num === undefined ? undefined : getIntRoot(value.den, degree);
  return num === undefined || den === undefined ? undefined : Rational.of(num, den);
};

interface Gain {
  isUnbounded: boolean;
  minGain: Rational;
  maxGain: Impq;
}

interface ImprovedBound {
  readonly column: number;
  readonly kind: number;
  readonly bound: Rational;
  readonly dep: Dependency;
}

const getAbs = (value: Impq) =>
  value.x.isNegative() || (value.x.isZero() && value.y.isNegative()) ? value.neg() : value;

// normalize_gain: rounds a value down to a multiple of an integral divisor, -1 meaning none.
const roundDown = (value: Impq, divisor: Rational) => {
  if (divisor.equals(Rational.one)) return new Impq(value.floor());
  if (divisor.equals(Rational.minusOne)) return value;
  return new Impq(value.div(divisor).floor().mul(divisor));
};

export class MonomialBounds {
  constructor(private core: NlaCore) {}

  // generate_lemmas: with the sandwich and binomial-sign lemmas off, the conflict of an infeasible
  // lp solver, once some monic needs refinement.
  generateLemmas() {
    if (this.core.toRefine.size > 0) this.addLemma();
  }

  private computeProduct(start: number, monic: Monic, product: DepInterval) {
    const interval = mkDepInterval();
    for (let index = start; index < monic.size;) {
      const lpVar = monic.vars[index];
      this.varToInterval(lpVar, interval);
      index++;
      let exponent = 1;
      for (; index < monic.size && monic.vars[index] === lpVar; index++) exponent++;
      power(interval, exponent, interval, "with-deps");
      mul(product, interval, product, "with-deps");
    }
  }

  private varToInterval(lpVar: number, interval: DepInterval) {
    const lra = this.core.lra;
    const lower = lra.getBound(lpVar, false);
    if (lower !== undefined) {
      interval.isLowerOpen = lower.isStrict;
      interval.lower = lower.value;
      interval.lowerDep = lower.dep;
      interval.isLowerInf = false;
    } else interval.isLowerInf = true;
    const upper = lra.getBound(lpVar, true);
    if (upper !== undefined) {
      interval.isUpperOpen = upper.isStrict;
      interval.upper = upper.value;
      interval.upperDep = upper.dep;
      interval.isUpperInf = false;
    } else interval.isUpperInf = true;
  }

  // tighten_lp: the bounds of the factors from the monic's interval, and of the monic from theirs.
  private tightenLp(monic: Monic) {
    const analysis = this.analyzeMonomial(monic);
    const isPropagatingUp = analysis.numFree === 0;
    const isPropagatingDown = !this.isFree(monic.variable) && analysis.numFree <= 1;
    if (!isPropagatingUp && !isPropagatingDown) return false;
    const product = mkDepInterval();
    const interval = mkDepInterval();
    const monicInterval = mkDepInterval();
    const otherProduct = mkDepInterval();
    this.varToInterval(monic.variable, monicInterval);
    setValue(product, Rational.one);
    let isTightened = false;
    for (let index = 0; index < monic.size;) {
      const lpVar = monic.vars[index];
      index++;
      let exponent = 1;
      for (; index < monic.size && lpVar === monic.vars[index]; index++) exponent++;
      this.varToInterval(lpVar, interval);
      power(interval, exponent, interval, "with-deps");
      if (isPropagatingDown && (analysis.numFree === 0 || analysis.freeVar === lpVar)) {
        set(otherProduct, product, "with-deps");
        this.computeProduct(index, monic, otherProduct);
        if (this.tightenLpBoundByDivision(monicInterval, lpVar, exponent, otherProduct))
          isTightened = true;
      }
      mul(product, interval, product, "with-deps");
    }
    if (!isPropagatingUp) return isTightened;
    return this.tightenLpBound(product, monic.variable, 1) || isTightened;
  }

  private tightenLpBoundByDivision(
    monicInterval: DepInterval,
    lpVar: number,
    exponent: number,
    product: DepInterval,
  ) {
    if (!separatedFromZero(product)) return false;
    const range = mkDepInterval();
    div(monicInterval, product, range, "with-deps");
    return this.tightenLpBound(range, lpVar, exponent);
  }

  private isFree(lpVar: number) {
    return !this.core.hasLowerBound(lpVar) && !this.core.hasUpperBound(lpVar);
  }

  private isZero(lpVar: number) {
    const core = this.core;
    return (
      core.hasLowerBound(lpVar) &&
      core.hasUpperBound(lpVar) &&
      core.getLowerBound(lpVar).isZero() &&
      core.getUpperBound(lpVar).isZero()
    );
  }

  // analyze_monomial: the number of free variables of odd degree, and the last of them.
  private analyzeMonomial(monic: Monic) {
    let numFree = 0;
    let freeVar = -1;
    for (let index = 0; index < monic.vars.length;) {
      const lpVar = monic.vars[index];
      index++;
      let exponent = 1;
      for (; index < monic.vars.length && monic.vars[index] === lpVar; index++) exponent++;
      if (this.isZero(lpVar)) return { numFree: 0, freeVar };
      if (exponent % 2 === 1 && this.isFree(lpVar)) {
        numFree++;
        freeVar = lpVar;
      }
    }
    return { numFree, freeVar };
  }

  propagateChangedBounds() {
    const core = this.core;
    let isPropagated = false;
    for (const lpVar of core.monicsWithChangedBounds.elems) {
      if (!core.isMonicVar(lpVar)) continue;
      const monic = core.emon(lpVar);
      if (this.propagateLinearBound(monic)) isPropagated = true;
      if (this.tightenLp(monic)) isPropagated = true;
      if (core.lra.status === LP_INFEASIBLE) break;
    }
    return isPropagated;
  }

  // add_lemma: a conflict lemma when the lp solver is infeasible.
  private addLemma() {
    const lra = this.core.lra;
    if (lra.status !== LP_INFEASIBLE) return false;
    const explanation = new Explanation();
    lra.getInfeasibilityExplanation(explanation);
    new LemmaBuilder(this.core).addExplanation(explanation);
    return true;
  }

  private propagateLinearBound(monic: Monic) {
    if (monic.isPropagated) return false;
    const linear = this.getLinear(monic);
    if (linear === undefined) return false;
    this.core.emons.setPropagated(monic);
    return this.linearize(monic, linear.nonFixed, linear.fixedToZero);
  }

  private linearize(monic: Monic, nonFixed: number, fixedToZero: number) {
    let isPropagated: boolean;
    if (fixedToZero !== -1) isPropagated = this.propagateFixedToZero(monic, fixedToZero);
    else {
      const product = this.getFixedVarProduct(monic, nonFixed);
      isPropagated =
        nonFixed === -1
          ? this.propagateFixed(monic, product)
          : this.propagateNonfixed(monic, product, nonFixed);
    }
    if (isPropagated) this.core.stats.nlaPropagateEq++;
    return isPropagated;
  }

  // propagate_violated_linear_monomials: the defining rows of violated monomials with at most one
  // non-fixed factor, except for small fixed products, which branching enumerates.
  propagateViolatedLinearMonomials() {
    const core = this.core;
    if (!NLA_PARAMS.linearizeViolatedMonomials || !core.lra.isFeasible()) return false;
    let isPropagated = false;
    for (const monic of core.emons.monics) {
      if (core.checkMonic(monic)) continue;
      const linear = this.getLinear(monic);
      if (linear === undefined) continue;
      if (linear.fixedToZero === -1 && linear.nonFixed !== -1) {
        const product = this.getFixedVarProduct(monic, linear.nonFixed);
        if (product.isInt() && getBitSize(product) <= 16) continue;
      }
      if (this.linearize(monic, linear.nonFixed, linear.fixedToZero)) isPropagated = true;
      if (core.lra.status === LP_INFEASIBLE) break;
    }
    return isPropagated;
  }

  private getExplanation(dep: Dependency) {
    const explanation = new Explanation();
    for (const constraint of linearize([dep])) explanation.addPair(constraint, Rational.one);
    return explanation;
  }

  private propagateFixedToZero(monic: Monic, fixedToZero: number) {
    const core = this.core;
    if (core.varIsFixedToZero(monic.variable)) return false;
    const dep = core.lra.getBoundWitnesses(fixedToZero);
    core.lra.updateColumnTypeAndBound(monic.variable, KIND_EQ, Impq.zero, dep);
    core.fixedEqualities.push({
      lpVar: monic.variable,
      value: Rational.zero,
      explanation: this.getExplanation(dep),
    });
    return true;
  }

  private propagateFixed(monic: Monic, value: Rational) {
    const core = this.core;
    if (core.varIsFixed(monic.variable) && core.getLowerBound(monic.variable).equals(value))
      return false;
    const dep = this.explainFixed(monic, value);
    core.lra.updateColumnTypeAndBound(monic.variable, KIND_EQ, new Impq(value), dep);
    core.fixedEqualities.push({
      lpVar: monic.variable,
      value,
      explanation: this.getExplanation(dep),
    });
    return true;
  }

  // propagate_nonfixed: the row m - k * w = 0.
  private propagateNonfixed(monic: Monic, coeff: Rational, nonFixed: number) {
    const core = this.core;
    if (core.val(monic.variable).equals(coeff.mul(core.val(nonFixed)))) return false;
    const column = core.lra.addTerm(
      [
        [nonFixed, coeff.neg()],
        [monic.variable, Rational.one],
      ],
      NULL_LPVAR,
    );
    const dep = this.explainFixed(monic, coeff);
    core.lra.updateColumnTypeAndBound(column, KIND_EQ, Impq.zero, dep);
    if (coeff.equals(Rational.one))
      core.equalities.push({
        first: monic.variable,
        second: nonFixed,
        explanation: this.getExplanation(dep),
      });
    return true;
  }

  private explainFixed(monic: Monic, value: Rational) {
    const core = this.core;
    const lra = core.lra;
    let dep: Dependency = null;
    const updateDep = (lpVar: number) => {
      dep = mkJoin(dep, lra.getLowerWitness(lpVar));
      dep = mkJoin(dep, lra.getUpperWitness(lpVar));
      return dep;
    };
    if (value.isZero()) {
      for (const lpVar of monic.vars) if (core.varIsFixedToZero(lpVar)) return updateDep(lpVar);
    } else for (const lpVar of monic.vars) if (core.varIsFixed(lpVar)) updateDep(lpVar);
    return dep;
  }

  // is_linear: the one non-fixed factor, or a factor fixed to zero, unless two are non-fixed.
  private getLinear(monic: Monic) {
    const core = this.core;
    let nonFixed = -1;
    for (const lpVar of monic.vars) {
      if (!core.varIsFixed(lpVar)) {
        if (nonFixed !== -1) return undefined;
        nonFixed = lpVar;
      } else if (core.getLowerBound(lpVar).isZero()) return { nonFixed, fixedToZero: lpVar };
    }
    return { nonFixed, fixedToZero: -1 };
  }

  // fixed_var_product: from the lower bounds, since a value may lie outside its bounds.
  private getFixedVarProduct(monic: Monic, nonFixed: number) {
    let product = Rational.one;
    for (const lpVar of monic.vars)
      if (lpVar !== nonFixed) product = product.mul(this.core.lra.getLowerBound(lpVar).x);
    return product;
  }

  // range is an interval that v^p lies in: v's upper bound from it.
  private tightenLpUpperBound(range: DepInterval, lpVar: number, exponent: number) {
    const core = this.core;
    const isImprovingUpper = (candidate: Rational) =>
      !core.hasUpperBound(lpVar) || candidate.compare(core.getUpperBound(lpVar)) < 0;
    let isTightened = false;
    if (!range.isUpperInf) {
      const root = getRoot(range.upper, exponent);
      if (root !== undefined && isImprovingUpper(root)) {
        this.propagateLpBound(lpVar, range.isUpperOpen ? KIND_LT : KIND_LE, root, range.upperDep);
        isTightened = true;
      }
    }
    if (
      exponent % 2 === 0 &&
      !range.isLowerInf &&
      core.hasUpperBound(lpVar) &&
      !core.getUpperBound(lpVar).isPositive() &&
      !range.lower.isNegative()
    ) {
      const root = getRoot(range.lower, exponent);
      if (root !== undefined && isImprovingUpper(root.neg())) {
        const dep = mkJoin(range.lowerDep, core.lra.getUpperWitness(lpVar));
        this.propagateLpBound(lpVar, range.isLowerOpen ? KIND_LT : KIND_LE, root.neg(), dep);
        isTightened = true;
      }
    }
    return isTightened;
  }

  private tightenLpLowerBound(range: DepInterval, lpVar: number, exponent: number) {
    const core = this.core;
    const isImprovingLower = (candidate: Rational) =>
      !core.hasLowerBound(lpVar) || candidate.compare(core.getLowerBound(lpVar)) > 0;
    let isTightened = false;
    if (exponent % 2 === 1) {
      if (!range.isLowerInf) {
        const root = getRoot(range.lower, exponent);
        if (root !== undefined && isImprovingLower(root)) {
          this.propagateLpBound(lpVar, range.isLowerOpen ? KIND_GT : KIND_GE, root, range.lowerDep);
          isTightened = true;
        }
      }
      return isTightened;
    }
    if (!range.isUpperInf && !range.upper.isNegative()) {
      const root = getRoot(range.upper, exponent);
      if (root !== undefined && isImprovingLower(root.neg())) {
        this.propagateLpBound(
          lpVar,
          range.isUpperOpen ? KIND_GT : KIND_GE,
          root.neg(),
          range.upperDep,
        );
        isTightened = true;
      }
    }
    if (
      !range.isLowerInf &&
      core.hasLowerBound(lpVar) &&
      !core.getLowerBound(lpVar).isNegative() &&
      !range.lower.isNegative()
    ) {
      const root = getRoot(range.lower, exponent);
      if (root !== undefined && isImprovingLower(root)) {
        const dep = mkJoin(range.lowerDep, core.lra.getLowerWitness(lpVar));
        this.propagateLpBound(lpVar, range.isLowerOpen ? KIND_GT : KIND_GE, root, dep);
        isTightened = true;
      }
    }
    return isTightened;
  }

  // propagate_lp_bound: a bound on v, integral when v is.
  private propagateLpBound(lpVar: number, kind: number, value: Rational, dep: Dependency) {
    const lra = this.core.lra;
    const update = (updateKind: number, bound: Rational) =>
      lra.updateColumnTypeAndBound(lpVar, updateKind, new Impq(bound), dep);
    if (!this.core.varIsInt(lpVar)) update(kind, value);
    else if (value.isInt()) {
      if (kind === KIND_GT) update(KIND_GE, value.add(Rational.one));
      else if (kind === KIND_LT) update(KIND_LE, value.sub(Rational.one));
      else update(kind, value);
    } else if (kind === KIND_GE || kind === KIND_GT) update(KIND_GE, value.ceil());
    else update(KIND_LE, value.floor());
  }

  private tightenLpBound(range: DepInterval, lpVar: number, exponent: number) {
    let isPropagated = false;
    if (this.tightenLpUpperBound(range, lpVar, exponent)) isPropagated = true;
    if (this.tightenLpLowerBound(range, lpVar, exponent)) isPropagated = true;
    return isPropagated;
  }

  tightenLpBounds() {
    let isNewBound = false;
    for (const monic of this.core.emons.monics) if (this.tightenLp(monic)) isNewBound = true;
    return isNewBound;
  }

  // max_min: a bounded-effort primal simplex walk that maximizes or minimizes a column, keeping
  // integer columns integral, as theory_arith::max_min does.

  private isSafeGain(gain: Gain) {
    return gain.isUnbounded || new Impq(gain.minGain).compare(gain.maxGain) <= 0;
  }

  private initGains(column: number, isIncreasing: boolean): Gain {
    const lra = this.core.lra;
    const core = lra.core;
    const gain: Gain = { isUnbounded: true, minGain: Rational.minusOne, maxGain: Impq.zero };
    if (isIncreasing && core.hasUpperBound(column)) {
      gain.isUnbounded = false;
      gain.maxGain = core.upperBounds[column].sub(core.x[column]);
    } else if (!isIncreasing && core.hasLowerBound(column)) {
      gain.isUnbounded = false;
      gain.maxGain = core.x[column].sub(core.lowerBounds[column]);
    }
    if (lra.isInt(column)) gain.minGain = Rational.one;
    return gain;
  }

  private updateGains(isIncreasing: boolean, basic: number, coeff: Rational, gain: Gain) {
    const lra = this.core.lra;
    const core = lra.core;
    if (!this.isSafeGain(gain)) return false;
    const isDecrementing =
      (isIncreasing && coeff.isPositive()) || (!isIncreasing && coeff.isNegative());
    let isBounded = false;
    let maxIncrease = Impq.zero;
    if (isDecrementing && core.hasLowerBound(basic)) {
      maxIncrease = getAbs(core.x[basic].sub(core.lowerBounds[basic]).div(coeff));
      isBounded = true;
    } else if (!isDecrementing && core.hasUpperBound(basic)) {
      maxIncrease = getAbs(core.upperBounds[basic].sub(core.x[basic]).div(coeff));
      isBounded = true;
    }
    const isBasicInt = lra.isInt(basic);
    const coeffDen = isBasicInt ? Rational.of(coeff.den) : Rational.one;
    if (isBasicInt && !coeffDen.equals(Rational.one)) {
      gain.minGain = gain.minGain.isNegative()
        ? coeffDen
        : Rational.of(getLcm(gain.minGain.num, coeffDen.num));
      if (!gain.isUnbounded) gain.maxGain = roundDown(gain.maxGain, gain.minGain);
    }
    if (isBasicInt && !gain.isUnbounded && !gain.maxGain.isInt())
      gain.maxGain = roundDown(new Impq(gain.maxGain.floor()), gain.minGain);
    if (!isBounded) return false;
    if (isBasicInt) maxIncrease = roundDown(new Impq(maxIncrease.floor()), gain.minGain);
    if (gain.isUnbounded) {
      gain.isUnbounded = false;
      gain.maxGain = maxIncrease;
      return true;
    }
    if (gain.maxGain.compare(maxIncrease) > 0) {
      gain.maxGain = maxIncrease;
      return true;
    }
    return false;
  }

  private pickVarToLeave(column: number, isIncreasing: boolean) {
    const lra = this.core.lra;
    const core = lra.core;
    let leaving = -1;
    let leavingCoeff = Rational.zero;
    const gain = this.initGains(column, isIncreasing);
    if (lra.isInt(column) && !core.x[column].isInt())
      return { isSafe: false, gain, leaving, leavingCoeff };
    for (const cell of core.matrix.columns[column]) {
      const basic = core.basis[cell.row];
      const coeff = core.matrix.getVal(cell);
      if (
        this.updateGains(isIncreasing, basic, coeff, gain) ||
        (leaving === -1 && !gain.isUnbounded)
      ) {
        leaving = basic;
        leavingCoeff = coeff;
      }
    }
    return { isSafe: this.isSafeGain(gain), gain, leaving, leavingCoeff };
  }

  private updateValue(column: number, delta: Impq) {
    if (delta.isZero()) return;
    const lra = this.core.lra;
    lra.setValueForNbasicColumn(column, lra.core.x[column].add(delta));
  }

  private moveToBound(column: number, isIncreasing: boolean) {
    const lra = this.core.lra;
    const core = lra.core;
    if (lra.isInt(column) && !core.x[column].isInt()) return false;
    const gain = this.initGains(column, isIncreasing);
    for (const cell of core.matrix.columns[column])
      this.updateGains(isIncreasing, core.basis[cell.row], core.matrix.getVal(cell), gain);
    if (!this.isSafeGain(gain) || gain.isUnbounded) return false;
    this.updateValue(column, isIncreasing ? gain.maxGain : gain.maxGain.neg());
    return !gain.maxGain.isZero();
  }

  private optimize(target: number, isMaximizing: boolean) {
    const lra = this.core.lra;
    const core = lra.core;
    let bestEfforts = 0;
    for (let rounds = 0; bestEfforts < 20 && rounds < 200 && !this.core.isCanceled();) {
      rounds++;
      let entering = -1;
      let leaving = -1;
      let leavingCoeff = Rational.zero;
      let best: Gain = { isUnbounded: true, minGain: Rational.minusOne, maxGain: Impq.zero };
      let isIncreasing = false;
      let hasBound = false;
      const consider = (candidate: number, objectiveCoeff: Rational) => {
        const isCurrentIncreasing = objectiveCoeff.isPositive() ? isMaximizing : !isMaximizing;
        if (
          (isCurrentIncreasing && core.hasUpperBound(candidate)) ||
          (!isCurrentIncreasing && core.hasLowerBound(candidate))
        )
          hasBound = true;
        if (
          isCurrentIncreasing &&
          core.hasUpperBound(candidate) &&
          core.x[candidate].equals(core.upperBounds[candidate])
        )
          return false;
        if (
          !isCurrentIncreasing &&
          core.hasLowerBound(candidate) &&
          core.x[candidate].equals(core.lowerBounds[candidate])
        )
          return false;
        const picked = this.pickVarToLeave(candidate, isCurrentIncreasing);
        if (!picked.isSafe) {
          hasBound = true;
          bestEfforts++;
          return false;
        }
        const select = () => {
          leaving = picked.leaving;
          entering = candidate;
          leavingCoeff = picked.leavingCoeff;
          best = picked.gain;
          isIncreasing = isCurrentIncreasing;
        };
        if (picked.leaving === -1) {
          select();
          return true;
        }
        if (picked.gain.maxGain.compare(best.maxGain) > 0) select();
        else if (picked.gain.maxGain.isZero() && (leaving === -1 || picked.leaving < leaving))
          select();
        return false;
      };
      if (!core.isBase(target)) consider(target, Rational.one);
      else {
        const row = core.matrix.rows[core.heading[target]];
        const targetCoeff = row.find((cell) => cell.column === target)?.coeff ?? Rational.zero;
        for (const cell of row) {
          if (cell.column === target) continue;
          const objectiveCoeff = targetCoeff.isNegative() ? cell.coeff : cell.coeff.neg();
          if (consider(cell.column, objectiveCoeff)) break;
        }
      }
      if (!hasBound && leaving === -1 && entering === -1) return undefined;
      if (entering === -1) {
        if (bestEfforts !== 0 || !core.x[target].y.isZero()) return undefined;
        return core.x[target].x;
      }
      const gain: Gain = best;
      if (gain.minGain.isPositive() && !gain.minGain.equals(Rational.one)) bestEfforts++;
      if (leaving === -1) {
        const hasBlockingBound = isIncreasing
          ? core.hasUpperBound(entering)
          : core.hasLowerBound(entering);
        if (!hasBlockingBound || gain.maxGain.isZero()) return undefined;
        this.updateValue(entering, isIncreasing ? gain.maxGain : gain.maxGain.neg());
        continue;
      }
      if (
        core.hasLowerBound(entering) &&
        core.hasUpperBound(entering) &&
        !core.lowerBounds[entering].equals(core.upperBounds[entering]) &&
        core.upperBounds[entering].sub(core.lowerBounds[entering]).equals(gain.maxGain)
      ) {
        this.updateValue(entering, isIncreasing ? gain.maxGain : gain.maxGain.neg());
        continue;
      }
      core.pivot(entering, leaving);
      const isLeavingIncreasing = isIncreasing
        ? leavingCoeff.isNegative()
        : leavingCoeff.isPositive();
      if (!this.moveToBound(leaving, isLeavingIncreasing)) bestEfforts++;
    }
    return undefined;
  }

  // mm_dep_from_row: the witnesses of the bounds that bound the column through its row.
  private getDepFromRow(target: number, isMaximizing: boolean) {
    const lra = this.core.lra;
    const core = lra.core;
    if (!core.isBase(target)) return null;
    const row = core.matrix.rows[core.heading[target]];
    const targetCoeff = row.find((cell) => cell.column === target)?.coeff ?? Rational.zero;
    if (targetCoeff.isZero()) return null;
    let dep: Dependency = null;
    for (const cell of row) {
      if (cell.column === target) continue;
      const coeff = cell.coeff.neg().div(targetCoeff);
      if (coeff.isZero()) continue;
      const isUsingUpper = isMaximizing ? coeff.isPositive() : coeff.isNegative();
      if (isUsingUpper) {
        if (!core.hasUpperBound(cell.column)) return null;
        dep = mkJoin(dep, lra.getUpperWitness(cell.column));
      } else {
        if (!core.hasLowerBound(cell.column)) return null;
        dep = mkJoin(dep, lra.getLowerWitness(cell.column));
      }
    }
    return dep;
  }

  private improveBound(column: number, isLower: boolean) {
    const lra = this.core.lra;
    const core = lra.core;
    if (!lra.isFeasible()) return undefined;
    const bound = this.optimize(column, !isLower);
    if (bound === undefined) return undefined;
    const dep = this.getDepFromRow(column, !isLower);
    if (dep === null) return undefined;
    if (isLower && core.hasLowerBound(column) && bound.compare(core.lowerBounds[column].x) <= 0)
      return undefined;
    if (!isLower && core.hasUpperBound(column) && bound.compare(core.upperBounds[column].x) >= 0)
      return undefined;
    return { bound, dep };
  }

  // optimize_nl_bounds: tightens the bounds of the variables of monomials by optimizing each over
  // the tableau, then applies them together and makes the tableau feasible again.
  optimizeNlBounds() {
    const core = this.core;
    const lra = core.lra;
    if (!NLA_PARAMS.optimizeBounds || !lra.isFeasible()) return false;
    if (lra.findFeasibleSolution() === LP_INFEASIBLE) {
      core.initToRefine();
      return false;
    }
    const candidates: number[] = [];
    const addCandidate = (lpVar: number) => {
      if (core.activeVarSet.has(lpVar)) return;
      core.activeVarSet.add(lpVar);
      if (!lra.isFixed(lpVar)) candidates.push(lpVar);
    };
    core.activeVarSet.clear();
    for (const monic of core.emons.monics) {
      addCandidate(monic.variable);
      for (const lpVar of monic.vars) addCandidate(lpVar);
    }
    const maxVars = NLA_PARAMS.optimizeBoundsLpMaxVars;
    if (maxVars !== 0 && candidates.length > maxVars) {
      core.initToRefine();
      return false;
    }
    const improvements: ImprovedBound[] = [];
    for (const column of candidates) {
      if (!lra.isFeasible()) break;
      for (const isLower of [true, false]) {
        const improved = this.improveBound(column, isLower);
        if (improved === undefined) continue;
        improvements.push({
          column,
          kind: isLower ? KIND_GE : KIND_LE,
          bound: improved.bound,
          dep: improved.dep,
        });
      }
    }
    for (const improved of improvements)
      lra.updateColumnTypeAndBound(
        improved.column,
        improved.kind,
        new Impq(improved.bound),
        improved.dep,
      );
    lra.findFeasibleSolution();
    core.initToRefine();
    return improvements.length > 0;
  }
}

const getBitSize = (value: Rational) => {
  const magnitude = value.num < 0n ? -value.num : value.num;
  return magnitude === 0n ? 1 : magnitude.toString(2).length;
};

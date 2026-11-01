// Ported from Z3 (src/math/polynomial/algebraic_numbers.cpp, src/util/basic_interval.h,
// src/util/mpbq.cpp), MIT license, see z3-license.txt. Real algebraic numbers: a rational, or the
// root of a square-free integer polynomial in an open isolating interval of binary rationals whose
// ends the polynomial has opposite signs at. Comparing and evaluating refine these intervals in
// place, and may find a number rational, as Z3 does, so later operations see Z3's intervals.
import { SmtInvariantError } from "../../../../errors";
import { Rational } from "../rational";
import { getLog2, Mpbq } from "./mpbq";
import { PolynomialManager, type Polynomial, type ValueOps } from "./polynomial";
import { UpolynomialManager, type Upolynomial } from "./upolynomial";
import { factorUpolynomial, type FactorParams } from "./upolynomial-factorization";

// algebraic.factor_max_prime, factor_num_primes and factor_search_size.
const FACTOR_PARAMS: FactorParams = { maxPrime: 31, primeTrials: 1, maxSearchSize: 5000 };
// -algebraic.min_mag: a refined interval narrower than about 1/2^16 is not kept.
const MIN_MAGNITUDE = -16;
// DEFAULT_PRECISION: how far isolate_roots with signs refines each root first.
const SIGN_PRECISION = 2;
// The variables of the polynomials the binary operations build, m_x and m_y.
const X = 0;
const Y = 1;

export class AlgebraicCell {
  constructor(
    public p: Upolynomial,
    public lower: Mpbq,
    public upper: Mpbq,
    public isMinimal: boolean,
    public isSignLowerNeg: boolean,
    public isNotRational: boolean,
    // m_i: which root of p the number is, from 1, or 0 when not yet computed.
    public rootIndex: number,
  ) {}

  get signLower() {
    return this.isSignLowerNeg ? -1 : 1;
  }

  clone() {
    return new AlgebraicCell(
      this.p,
      this.lower,
      this.upper,
      this.isMinimal,
      this.isSignLowerNeg,
      this.isNotRational,
      this.rootIndex,
    );
  }
}

// anum: a mutable handle, since refining an algebraic number may turn it into a rational.
export class Anum {
  constructor(public value: Rational | AlgebraicCell) {}
}

interface BqInterval {
  lower: Mpbq;
  upper: Mpbq;
}

// One end of the interval select_small picks from: a binary rational end is closed, a rational one
// open.
interface SelectEnd {
  value: Rational;
  isOpen: boolean;
}

// save_intervals: an interval to restore when refining it made it too narrow to keep.
interface SavedInterval {
  anum: Anum;
  lower: Mpbq;
  upper: Mpbq;
  isRestored: boolean;
}

// The factor whose Sturm sequence counts the one root in an interval.
interface IsolatingFactor {
  factor: Upolynomial;
  sequence: Upolynomial[];
  lowerVariations: number;
}

export interface ClosestAnums {
  roots: Anum[];
  indices: number[];
}

export interface SignedRoots {
  roots: Anum[];
  signs: number[];
}

const minBq = (first: Mpbq, second: Mpbq) => (second.compare(first) < 0 ? second : first);
const maxBq = (first: Mpbq, second: Mpbq) => (second.compare(first) > 0 ? second : first);

// mpbqi_manager over open intervals, as t_eval uses it.
const INTERVAL_OPS: ValueOps<BqInterval> = {
  fromInteger: (value) => ({ lower: Mpbq.of(value), upper: Mpbq.of(value) }),
  add: (first, second) => ({
    lower: first.lower.add(second.lower),
    upper: first.upper.add(second.upper),
  }),
  mul: (first, second) => {
    const products = [
      first.lower.mul(second.lower),
      first.lower.mul(second.upper),
      first.upper.mul(second.lower),
      first.upper.mul(second.upper),
    ];
    return { lower: products.reduce(minBq), upper: products.reduce(maxBq) };
  },
  power: (base, exponent) => getIntervalPower(base, exponent),
};

const getIntervalPower = (base: BqInterval, exponent: number): BqInterval => {
  const lower = base.lower.power(exponent);
  const upper = base.upper.power(exponent);
  if (exponent % 2 === 1 || !base.lower.isNeg) return { lower, upper };
  if (base.upper.isNeg) return { lower: upper, upper: lower };
  return { lower: Mpbq.zero, upper: maxBq(lower, upper) };
};

const containsZero = (interval: BqInterval) => interval.lower.isNeg && interval.upper.isPos;

// mpz log2 and mlog2: 0 outside the sign they expect.
const getPositiveLog2 = (value: bigint) => (value <= 0n ? 0 : getLog2(value));
const getNegativeLog2 = (value: bigint) => (value >= 0n ? 0 : getLog2(value));

// magnitude_ub
const getMagnitudeUpperBound = (value: Mpbq) =>
  value.isZero
    ? 0
    : value.isPos
      ? getLog2(value.num) - value.k + 1
      : getNegativeLog2(value.num) - value.k;

// magnitude: about log2 of the width of (l, u).
const getMagnitude = (lower: Mpbq, upper: Mpbq) => {
  if (lower.k === upper.k) return getMagnitudeUpperBound(lower);
  const log2 = lower.isNeg ? getNegativeLog2 : getPositiveLog2;
  return log2(upper.num) - log2(lower.num) - upper.k + lower.k - upper.k;
};

// select_integer: the integer select_small takes from scaled ends, preferring a closed end.
const selectInteger = (
  lower: SelectEnd,
  upper: SelectEnd,
  lowerValue: Rational,
  upperValue: Rational,
) => {
  if (!lower.isOpen && lowerValue.isInt()) return lowerValue.num;
  if (!upper.isOpen && upperValue.isInt()) return upperValue.num;
  const ceilLower =
    lower.isOpen && lowerValue.isInt() ? lowerValue.num + 1n : lowerValue.ceil().num;
  const floorUpper =
    upper.isOpen && upperValue.isInt() ? upperValue.num - 1n : upperValue.floor().num;
  return ceilLower <= floorUpper ? ceilLower : null;
};

// select_small_core: the binary rational between two ends with the smallest power of two as its
// denominator.
const selectSmall = (lower: SelectEnd, upper: SelectEnd) => {
  for (let k = 0; ; k++) {
    const scale = Rational.of(1n << BigInt(k));
    const integer = selectInteger(lower, upper, lower.value.mul(scale), upper.value.mul(scale));
    if (integer !== null) return Mpbq.of(integer, k);
  }
};

const getCell = (anum: Anum | undefined) => {
  if (anum === undefined || anum.value instanceof Rational)
    throw new SmtInvariantError("expected an irrational algebraic number");
  return anum.value;
};

const getAssigned = (values: readonly (Anum | undefined)[], variable: number) => {
  const value = values[variable];
  if (value === undefined) throw new SmtInvariantError(`x${variable} is unassigned`);
  return value;
};

const getRationalValues = (values: readonly (Anum | undefined)[]) =>
  values.map((anum) => (anum?.value instanceof Rational ? anum.value : undefined));

const getExtended = (values: readonly (Anum | undefined)[], variable: number, anum: Anum) => {
  const extended = [...values];
  extended[variable] = anum;
  return extended;
};

const sameCoeffs = (first: Upolynomial, second: Upolynomial) =>
  first.length === second.length && first.every((coeff, index) => coeff === second[index]);

export class AlgebraicManager {
  private um = new UpolynomialManager();
  private pm = new PolynomialManager();
  private anumOps: ValueOps<Anum> = {
    fromInteger: (value) => new Anum(Rational.of(value)),
    add: (first, second) => this.add(first, second),
    mul: (first, second) => this.mul(first, second),
    power: (base, exponent) => this.power(base, exponent),
  };

  // Queries.

  isZero(anum: Anum) {
    return anum.value instanceof Rational && anum.value.isZero();
  }

  degree(anum: Anum) {
    if (this.isZero(anum)) return 0;
    return anum.value instanceof Rational ? 1 : anum.value.p.length - 1;
  }

  copy(anum: Anum) {
    return new Anum(anum.value instanceof Rational ? anum.value : anum.value.clone());
  }

  // is_int: refines the interval until it holds at most one integer, then tests it.
  isInt(anum: Anum): boolean {
    if (anum.value instanceof Rational) return anum.value.isInt();
    const cell = anum.value;
    if (cell.isNotRational) return false;
    if (!this.refineUntilPrecision(anum, 1)) return this.isInt(anum);
    const candidate = Rational.of(cell.upper.floor());
    if (cell.lower.compareRational(candidate) < 0 && this.um.evalSignAtQ(cell.p, candidate) === 0) {
      anum.value = candidate;
      return true;
    }
    return false;
  }

  // is_rational: by the rational root theorem, the only candidate in an interval narrower than
  // 1/|a_n| is floor(u*|a_n|)/|a_n|.
  isRational(anum: Anum) {
    if (anum.value instanceof Rational) return true;
    const cell = anum.value;
    if (cell.isNotRational) return false;
    const saved = this.saveInterval(anum);
    const leading = cell.p[cell.p.length - 1];
    const absLeading = leading < 0n ? -leading : leading;
    if (!this.refineUntilPrecision(anum, getLog2(absLeading) + 1)) return true;
    const candidate = Rational.of(cell.upper.mul(Mpbq.of(absLeading)).floor(), absLeading);
    const isRoot =
      cell.lower.compareRational(candidate) < 0 && this.um.evalSignAtQ(cell.p, candidate) === 0;
    this.restoreIfTooSmall(saved);
    if (isRoot) anum.value = candidate;
    else cell.isNotRational = true;
    return isRoot;
  }

  // get_i: which root of its polynomial the number is.
  getRootIndex(anum: Anum) {
    if (anum.value instanceof Rational) return this.isZero(anum) ? 0 : 1;
    const cell = anum.value;
    if (cell.rootIndex === 0) cell.rootIndex = this.um.getRootId(cell.p, cell.lower) + 1;
    return cell.rootIndex;
  }

  // Cells.

  // mk_algebraic_cell: the coefficients made primitive with a positive leading coefficient.
  private mkCell(p: Upolynomial, lower: Mpbq, upper: Mpbq, isMinimal: boolean) {
    const cell = new AlgebraicCell(p, lower, upper, isMinimal, false, isMinimal, 0);
    this.updateSignLower(cell);
    cell.p = this.um.normalize(cell.p);
    if (cell.p[cell.p.length - 1] < 0n) {
      cell.p = this.um.neg(cell.p);
      cell.isSignLowerNeg = !cell.isSignLowerNeg;
    }
    return cell;
  }

  private updateSignLower(cell: AlgebraicCell) {
    cell.isSignLowerNeg = this.um.evalSignAtBq(cell.p, cell.lower) < 0;
  }

  // set(a, p, l, u, minimal): the root of p in (l, u), a rational when p is linear.
  private mkAnum(p: Upolynomial, lower: Mpbq, upper: Mpbq, isMinimal: boolean) {
    if (p.length === 2) return new Anum(Rational.of(p[0]).div(Rational.of(p[1])).neg());
    return new Anum(this.mkCell(p, lower, upper, isMinimal));
  }

  // normalize: an interval around zero shrunk to the side of zero holding the root.
  private normalize(anum: Anum) {
    if (anum.value instanceof Rational) return;
    const cell = anum.value;
    const interval = this.um.normalizeInterval(cell.p, cell.lower, cell.upper, cell.signLower);
    if (interval === null) {
      anum.value = Rational.zero;
      return;
    }
    cell.lower = interval.lower;
    cell.upper = interval.upper;
  }

  // Refinement.

  // refine: halves the interval, or finds the number rational and returns false.
  private refine(anum: Anum) {
    if (anum.value instanceof Rational) return false;
    const cell = anum.value;
    const refined = this.um.refineCore(cell.p, cell.signLower, cell.lower, cell.upper);
    if (!refined.isInterval) {
      anum.value = refined.lower.toRational();
      return false;
    }
    cell.lower = refined.lower;
    cell.upper = refined.upper;
    return true;
  }

  private refineTimes(anum: Anum, count: number) {
    for (let index = 0; index < count; index++) if (!this.refine(anum)) return false;
    return true;
  }

  // refine_until_prec: refines until the interval is narrower than 1/2^precision.
  private refineUntilPrecision(anum: Anum, precision: number) {
    if (anum.value instanceof Rational) return true;
    const cell = anum.value;
    const refined = this.um.refineToPrecision(cell.p, cell.lower, cell.upper, precision);
    if (!refined.isInterval) {
      anum.value = refined.lower.toRational();
      return false;
    }
    cell.lower = refined.lower;
    cell.upper = refined.upper;
    return true;
  }

  private getCellMagnitude(cell: AlgebraicCell) {
    return getMagnitude(cell.lower, cell.upper);
  }

  private saveInterval(anum: Anum): SavedInterval {
    const cell = getCell(anum);
    return { anum, lower: cell.lower, upper: cell.upper, isRestored: false };
  }

  // restore_if_too_small: swaps the saved interval back in when the current one is too narrow.
  private restoreIfTooSmall(saved: SavedInterval) {
    saved.isRestored = true;
    if (saved.anum.value instanceof Rational) return;
    const cell = saved.anum.value;
    if (this.getCellMagnitude(cell) >= MIN_MAGNITUDE) return;
    [cell.lower, cell.upper, saved.lower, saved.upper] = [
      saved.lower,
      saved.upper,
      cell.lower,
      cell.upper,
    ];
  }

  // ~save_intervals
  private releaseInterval(saved: SavedInterval) {
    if (!saved.isRestored) this.restoreIfTooSmall(saved);
  }

  // Root isolation.

  private factor(p: Upolynomial) {
    return factorUpolynomial(this.um, p, FACTOR_PARAMS);
  }

  // isolate_roots(up): the real roots of a univariate polynomial, factor by factor, sorted.
  private isolateUnivariateRoots(up: Upolynomial) {
    const roots: Anum[] = [];
    if (up.length === 0) return roots;
    const hasZeroRoot = this.um.hasZeroRoots(up);
    if (hasZeroRoot) roots.push(new Anum(Rational.zero));
    const factored = this.factor(hasZeroRoot ? this.um.removeZeroRoots(up) : up);
    for (const factor of factored.factors.factors) {
      const degree = factor.length - 1;
      if (degree <= 0) continue;
      if (degree === 1) {
        roots.push(new Anum(Rational.of(factor[0]).div(Rational.of(factor[1])).neg()));
        continue;
      }
      const isolated = this.um.sqfIsolateRoots(factor);
      for (const root of isolated.roots) roots.push(new Anum(root.toRational()));
      for (let index = 0; index < isolated.lowers.length; index++) {
        const refined = this.um.isolating2refinable(
          factor,
          isolated.lowers[index],
          isolated.uppers[index],
        );
        roots.push(
          new Anum(
            refined.isInterval
              ? this.mkCell(factor, refined.lower, refined.upper, factored.isComplete)
              : refined.lower.toRational(),
          ),
        );
      }
    }
    this.sortRoots(roots);
    return roots;
  }

  // sort_roots: Z3's stable bottom-up merge sort, since each comparison may refine the roots.
  private sortRoots(roots: Anum[]) {
    const size = roots.length;
    if (size < 2) return;
    const isLess = (first: number, second: number) => {
      const sign = this.compare(roots[first], roots[second]);
      return sign !== 0 ? sign < 0 : first < second;
    };
    let source = roots.map((_root, index) => index);
    let target = [...source];
    for (let width = 1; width < size; width *= 2) {
      for (let low = 0; low < size; low += 2 * width) {
        const middle = Math.min(low + width, size);
        const high = Math.min(low + 2 * width, size);
        let left = low;
        let right = middle;
        let next = low;
        while (left < middle && right < high)
          target[next++] = isLess(source[right], source[left]) ? source[right++] : source[left++];
        while (left < middle) target[next++] = source[left++];
        while (right < high) target[next++] = source[right++];
      }
      [source, target] = [target, source];
    }
    const sorted = source.map((index) => roots[index]);
    for (let index = 0; index < size; index++) roots[index] = sorted[index];
  }

  private getSignVariationsAtQ(sequence: Upolynomial[], value: Rational) {
    if (sequence.length <= 1) return 0;
    let count = 0;
    let previous = 0;
    for (const coeffs of sequence) {
      const sign = this.um.evalSignAtQ(coeffs, value);
      if (sign === 0) continue;
      if (previous !== 0 && sign !== previous) count++;
      previous = sign;
    }
    return count;
  }

  // isolate_kth_root: the i-th real root of a square-free p, by bisecting with its Sturm sequence.
  private isolateKthRoot(p: Upolynomial, sequence: Upolynomial[], rootIndex: number) {
    if (p.length === 2) return new Anum(Rational.of(p[0]).div(Rational.of(p[1])).neg());
    const minusInf = this.um.signVariationsAtMinusInf(sequence);
    const atZero = this.um.signVariationsAtZero(sequence);
    const nonPositiveCount = minusInf - atZero;
    const isNonPositive = rootIndex <= nonPositiveCount;
    let low = isNonPositive
      ? Mpbq.of(-(1n << BigInt(this.um.knuthNegativeRootUpperBound(p))))
      : Mpbq.zero;
    let high = isNonPositive
      ? Mpbq.zero
      : Mpbq.of(1n << BigInt(this.um.knuthPositiveRootUpperBound(p)));
    let lowVariations = isNonPositive ? minusInf : atZero;
    let highVariations = isNonPositive ? atZero : this.um.signVariationsAtPlusInf(sequence);
    let target = isNonPositive ? rootIndex : rootIndex - nonPositiveCount;
    while (lowVariations > highVariations + 1) {
      const middle = low.add(high).div2();
      const middleVariations = this.um.signVariationsAt(sequence, middle);
      const leftCount = lowVariations - middleVariations;
      if (target <= leftCount) {
        high = middle;
        highVariations = middleVariations;
      } else {
        low = middle;
        lowVariations = middleVariations;
        target -= leftCount;
      }
    }
    if (this.um.evalSignAtBq(p, high) === 0) return new Anum(high.toRational());
    const refined = this.um.isolating2refinable(p, low, high);
    if (!refined.isInterval) return new Anum(refined.lower.toRational());
    const root = this.getRationalRootIn(p, refined.lower, refined.upper);
    return new Anum(
      root instanceof Rational ? root : this.mkCell(p, root.lower, root.upper, false),
    );
  }

  // rational_root_in_interval: the root of p in (l, u) when it is rational, else the interval
  // refined below 1/|a_n|.
  private getRationalRootIn(p: Upolynomial, lower: Mpbq, upper: Mpbq): Rational | BqInterval {
    const leading = p[p.length - 1];
    const absLeading = leading < 0n ? -leading : leading;
    const refined = this.um.refineToPrecision(p, lower, upper, getLog2(absLeading) + 1);
    if (!refined.isInterval) return refined.lower.toRational();
    const candidate = Rational.of(refined.upper.mul(Mpbq.of(absLeading)).floor(), absLeading);
    if (refined.lower.compareRational(candidate) < 0 && this.um.evalSignAtQ(p, candidate) === 0)
      return candidate;
    return { lower: refined.lower, upper: refined.upper };
  }

  // isolate_roots_closest_univariate: the roots next to s, s itself when it is a root.
  private isolateUnivariateClosest(
    pm: PolynomialManager,
    polynomial: Polynomial,
    sample: Rational,
  ): ClosestAnums {
    const result: ClosestAnums = { roots: [], indices: [] };
    if (pm.isConst(polynomial)) return result;
    const up = pm.toCoeffs(polynomial);
    if (up.length === 0) return result;
    const p = this.um.squareFree(up);
    if (p.length <= 1) return result;
    const sequence = this.um.sturmSeq(p);
    const minusInf = this.um.signVariationsAtMinusInf(sequence);
    const plusInf = this.um.signVariationsAtPlusInf(sequence);
    if (minusInf <= plusInf) return result;
    const total = minusInf - plusInf;
    const below = minusInf - this.getSignVariationsAtQ(sequence, sample);
    if (this.um.evalSignAtQ(p, sample) === 0)
      return { roots: [new Anum(sample)], indices: [below] };
    if (below > 0) {
      result.roots.push(this.isolateKthRoot(p, sequence, below));
      result.indices.push(below);
    }
    if (below < total) {
      result.roots.push(this.isolateKthRoot(p, sequence, below + 1));
      result.indices.push(below + 1);
    }
    return result;
  }

  // isolate_roots(p, x2v): the roots of p in its one unassigned variable at the values of the
  // others. Resultants eliminate the irrational values, and the roots of the result that are not
  // roots of p are filtered out.
  isolateRoots(
    pm: PolynomialManager,
    polynomial: Polynomial,
    values: readonly (Anum | undefined)[],
    isNested = false,
  ): Anum[] {
    if (pm.isConst(polynomial)) return [];
    if (pm.isUnivariate(polynomial)) return this.isolateUnivariateRoots(pm.toCoeffs(polynomial));
    const reduced = pm.substituteRational(polynomial, getRationalValues(values));
    if (pm.isConst(reduced)) return [];
    if (pm.isUnivariate(reduced)) {
      if (values[pm.maxVar(reduced)] !== undefined) return [];
      return this.isolateUnivariateRoots(pm.toCoeffs(reduced));
    }
    const xs = this.sortByDegree(pm.getVars(reduced), values);
    const x = xs[xs.length - 1];
    if (values[x] !== undefined) return [];
    let q = reduced;
    for (const y of xs.slice(0, -1)) {
      q = pm.resultant(q, pm.fromCoeffs(getCell(values[y]).p, y), y);
      if (q.size === 0) break;
    }
    if (q.size > 0) {
      if (pm.isConst(q)) return [];
      return this.filterRoots(pm, reduced, values, x, this.isolateUnivariateRoots(pm.toCoeffs(q)));
    }
    if (isNested)
      throw new SmtInvariantError("resultant vanished during nested isolate_roots call");
    return this.isolateVanishedRoots(pm, reduced, values, xs, x);
  }

  // The resultant vanished, perhaps at another root of a value's polynomial: p's leading
  // coefficient at the values decides.
  private isolateVanishedRoots(
    pm: PolynomialManager,
    reduced: Polynomial,
    values: readonly (Anum | undefined)[],
    xs: number[],
    x: number,
  ) {
    const evaluate = (polynomial: Polynomial) =>
      pm.evaluateWith(polynomial, this.anumOps, (variable) => getAssigned(values, variable));
    const degree = pm.degree(reduced, x);
    if (degree === 1) {
      const constant = evaluate(pm.coeff(reduced, x, 0));
      const leading = evaluate(pm.coeff(reduced, x, 1));
      if (this.isZero(leading)) return [];
      const root = this.div(constant, leading);
      this.neg(root);
      return [root];
    }
    let power = degree;
    let leading = new Anum(Rational.zero);
    for (; power >= 1; power--) {
      leading = evaluate(pm.coeff(reduced, x, power));
      if (!this.isZero(leading)) break;
    }
    if (power === 0) return [];
    // z*x^i + c_{i-1}*x^{i-1} + ... + c_0, with z the value of the leading coefficient.
    const z = Math.max(...xs) + 1;
    const q = this.pm.add(
      this.pm.mul(this.pm.mkVar(z), this.pm.mkVar(x, power)),
      this.convert(pm, reduced, x, power - 1),
    );
    return this.isolateRoots(this.pm, q, getExtended(values, z, leading), true);
  }

  // convert: p in the local manager, without its monomials of degree above maxDegree in x.
  private convert(pm: PolynomialManager, polynomial: Polynomial, x = -1, maxDegree = Infinity) {
    if (pm === this.pm) return polynomial;
    const as: bigint[] = [];
    const ms = [];
    for (let index = 0; index < polynomial.size; index++) {
      const monomial = polynomial.ms[index];
      if (x !== -1 && monomial.degreeOf(x) > maxDegree) continue;
      as.push(polynomial.as[index]);
      ms.push(this.pm.mkMonomial(monomial.vars, monomial.degrees));
    }
    return this.pm.mkPolynomial(as, ms);
  }

  // std::stable_sort with var_degree_lt: by the degree of each value, unassigned last.
  private sortByDegree(xs: number[], values: readonly (Anum | undefined)[]) {
    const getDegree = (variable: number) => {
      const value = values[variable];
      return value === undefined ? Infinity : this.degree(value);
    };
    return [...xs].sort((first, second) => getDegree(first) - getDegree(second));
  }

  // filter_roots: the roots at which p vanishes.
  private filterRoots(
    pm: PolynomialManager,
    polynomial: Polynomial,
    values: readonly (Anum | undefined)[],
    x: number,
    roots: Anum[],
  ) {
    return roots.filter(
      (root) => this.evalSignAt(pm, polynomial, getExtended(values, x, root)) === 0,
    );
  }

  // isolate_roots_closest: the roots of p next to the rational s, with their indices from 1.
  isolateRootsClosest(
    pm: PolynomialManager,
    polynomial: Polynomial,
    values: readonly (Anum | undefined)[],
    sample: Rational,
  ): ClosestAnums {
    const result: ClosestAnums = { roots: [], indices: [] };
    if (pm.isConst(polynomial)) return result;
    if (pm.isUnivariate(polynomial)) return this.isolateUnivariateClosest(pm, polynomial, sample);
    const reduced = pm.substituteRational(polynomial, getRationalValues(values));
    if (pm.isConst(reduced)) return result;
    if (pm.isUnivariate(reduced)) {
      if (values[pm.maxVar(reduced)] !== undefined) return result;
      return this.isolateUnivariateClosest(pm, reduced, sample);
    }
    const all = this.isolateRoots(pm, polynomial, values);
    const sampleAnum = new Anum(sample);
    let lower = -1;
    let upper = -1;
    for (let index = 0; index < all.length; index++) {
      if (this.compare(all[index], sampleAnum) <= 0) lower = index;
      else {
        upper = index;
        break;
      }
    }
    if (lower !== -1 && this.compare(all[lower], sampleAnum) === 0)
      return { roots: [all[lower]], indices: [lower + 1] };
    if (lower !== -1) {
      result.roots.push(all[lower]);
      result.indices.push(lower + 1);
    }
    if (upper !== -1) {
      result.roots.push(all[upper]);
      result.indices.push(upper + 1);
    }
    return result;
  }

  // isolate_roots(p, x2v, roots, signs): the roots, and the sign of p below, between and above
  // them, at a sample the unassigned variables share.
  isolateRootsWithSigns(
    pm: PolynomialManager,
    polynomial: Polynomial,
    values: readonly (Anum | undefined)[],
  ): SignedRoots {
    const roots = this.isolateRoots(pm, polynomial, values);
    const getSign = (sample: Anum) => {
      const extended = [...values];
      for (const variable of pm.getVars(polynomial))
        if (extended[variable] === undefined) extended[variable] = sample;
      return this.evalSignAt(pm, polynomial, extended);
    };
    if (roots.length === 0) return { roots, signs: [getSign(new Anum(Rational.zero))] };
    for (const root of roots) this.refineUntilPrecision(root, SIGN_PRECISION);
    const signs = [getSign(this.intLt(roots[0]))];
    for (let index = 1; index < roots.length; index++)
      signs.push(getSign(this.select(roots[index - 1], roots[index])));
    signs.push(getSign(this.intGt(roots[roots.length - 1])));
    return { roots, signs };
  }

  // Signs.

  // eval_sign_at: the sign of p at the values. Rational values are substituted, interval
  // arithmetic on the irrational ones decides most signs, and otherwise a lower bound on the
  // nonzero roots of the resultant with their polynomials tells zero apart.
  evalSignAt(pm: PolynomialManager, polynomial: Polynomial, values: readonly (Anum | undefined)[]) {
    while (true) {
      const rationalValues = getRationalValues(values);
      if (pm.getVars(polynomial).every((variable) => rationalValues[variable] !== undefined))
        return pm.getSign(polynomial, rationalValues);
      const reduced = pm.substituteRational(polynomial, rationalValues);
      if (reduced.size === 0) return 0;
      if (pm.isConst(reduced)) return reduced.as[0] > 0n ? 1 : -1;
      const xs = pm.getVars(reduced);
      const getInterval = (variable: number) => {
        const cell = getCell(values[variable]);
        return { lower: cell.lower, upper: cell.upper };
      };
      const evaluate = () => pm.evaluateWith(reduced, INTERVAL_OPS, getInterval);
      let interval = evaluate();
      let isRestarted = false;
      while (true) {
        if (!containsZero(interval)) return interval.lower.isNeg ? -1 : 1;
        let isRefined = false;
        for (const variable of xs) {
          const value = getAssigned(values, variable);
          if (this.getCellMagnitude(getCell(value)) <= MIN_MAGNITUDE) continue;
          if (!this.refine(value)) {
            isRestarted = true;
            break;
          }
          isRefined = true;
        }
        if (!isRefined || isRestarted) break;
        interval = evaluate();
      }
      if (isRestarted) continue;
      const sign = this.evalSignByResultant(pm, reduced, values, xs, interval, evaluate);
      if (sign !== null) return sign;
    }
  }

  // The resultant step of eval_sign_at, or null when a value turned rational and it restarts.
  private evalSignByResultant(
    pm: PolynomialManager,
    reduced: Polynomial,
    values: readonly (Anum | undefined)[],
    xs: number[],
    initial: BqInterval,
    evaluate: () => BqInterval,
  ) {
    const sorted = this.sortByDegree(xs, values);
    let resultant = this.pm.sub(this.pm.mkVar(Math.max(...xs) + 1), this.convert(pm, reduced));
    for (const variable of sorted)
      resultant = this.pm.resultant(
        resultant,
        this.pm.fromCoeffs(getCell(values[variable]).p, variable),
        variable,
      );
    const k = this.um.nonzeroRootLowerBound(this.pm.toCoeffs(resultant));
    const bound = Mpbq.of(1n, k);
    const isInsideBound = (interval: BqInterval) =>
      bound.neg().compare(interval.lower) < 0 && interval.upper.compare(bound) < 0;
    if (isInsideBound(initial)) return 0;
    const saved = sorted.map((variable) => this.saveInterval(getAssigned(values, variable)));
    let sign: number | null = null;
    while (sign === null) {
      const interval = evaluate();
      if (!containsZero(interval)) sign = interval.lower.isNeg ? -1 : 1;
      else if (isInsideBound(interval)) sign = 0;
      else if (!sorted.every((variable) => this.refine(getAssigned(values, variable)))) break;
    }
    for (const entry of saved) this.releaseInterval(entry);
    return sign;
  }

  // Arithmetic.

  add(first: Anum, second: Anum): Anum {
    if (this.isZero(first)) return this.copy(second);
    if (this.isZero(second)) return this.copy(first);
    if (first.value instanceof Rational)
      return second.value instanceof Rational
        ? new Anum(first.value.add(second.value))
        : this.addRational(second.value, first.value);
    if (second.value instanceof Rational) return this.addRational(first.value, second.value);
    return this.mkBinary(first, second, true);
  }

  // add(cell, basic): p(x - b), with the interval shifted by b.
  private addRational(cell: AlgebraicCell, value: Rational) {
    const p = this.um.translateQ(cell.p, value.neg());
    const shift = Mpbq.fromRational(value);
    const interval = shift.isExact
      ? { lower: cell.lower.add(shift.value), upper: cell.upper.add(shift.value) }
      : this.um.convertQ2bqInterval(
          p,
          cell.lower.toRational().add(value),
          cell.upper.toRational().add(value),
        );
    const result = this.mkAnum(p, interval.lower, interval.upper, cell.isMinimal);
    this.normalize(result);
    return result;
  }

  mul(first: Anum, second: Anum): Anum {
    if (this.isZero(first) || this.isZero(second)) return new Anum(Rational.zero);
    if (first.value instanceof Rational)
      return second.value instanceof Rational
        ? new Anum(first.value.mul(second.value))
        : this.mulRational(second.value, first.value);
    if (second.value instanceof Rational) return this.mulRational(first.value, second.value);
    return this.mkBinary(first, second, false);
  }

  // mul(cell, basic): b^n * p(x/b), with the interval scaled by b.
  private mulRational(cell: AlgebraicCell, value: Rational) {
    const p = this.um.composePQX(cell.p, Rational.one.div(value));
    const scale = Mpbq.fromRational(value);
    const isNegative = value.isNegative();
    let lower: Mpbq;
    let upper: Mpbq;
    if (scale.isExact) {
      upper = cell.upper.mul(scale.value);
      lower = cell.lower.mulIntoOther(scale.value);
      if (isNegative) [lower, upper] = [upper, lower];
    } else {
      let rationalLower = cell.lower.toRational().mul(value);
      let rationalUpper = cell.upper.toRational().mul(value);
      if (isNegative) [rationalLower, rationalUpper] = [rationalUpper, rationalLower];
      const interval = this.um.convertQ2bqInterval(p, rationalLower, rationalUpper);
      lower = interval.lower;
      upper = interval.upper;
    }
    const result = this.mkAnum(p, lower, upper, cell.isMinimal);
    this.normalize(result);
    return result;
  }

  // neg: p(-x) with the interval mirrored, in place.
  neg(anum: Anum) {
    if (anum.value instanceof Rational) {
      anum.value = anum.value.neg();
      return;
    }
    const cell = anum.value;
    cell.p = this.um.pMinusX(cell.p);
    [cell.lower, cell.upper] = [cell.upper.neg(), cell.lower.neg()];
    if (cell.rootIndex !== 0) cell.rootIndex = this.um.getRootId(cell.p, cell.lower) + 1;
    this.updateSignLower(cell);
  }

  // refine_nz_bound: moves an interval end off zero, halving it until its sign is right.
  private refineNonzeroBound(anum: Anum) {
    if (anum.value instanceof Rational) return;
    const cell = anum.value;
    if (!cell.lower.isZero && !cell.upper.isZero) return;
    const isLower = cell.lower.isZero;
    const targetSign = isLower ? cell.signLower : -cell.signLower;
    let bound = isLower ? cell.upper : cell.lower;
    while (true) {
      bound = bound.div2();
      if (isLower) cell.lower = bound;
      else cell.upper = bound;
      const sign = this.um.evalSignAtBq(cell.p, bound);
      if (sign === 0) {
        anum.value = bound.toRational();
        return;
      }
      if (sign === targetSign) return;
    }
  }

  // inv: x^n * p(1/x), with the interval (1/u, 1/l), in place.
  inv(anum: Anum) {
    if (this.isZero(anum)) throw new SmtInvariantError("division by zero");
    this.refineNonzeroBound(anum);
    if (anum.value instanceof Rational) {
      anum.value = Rational.one.div(anum.value);
      return;
    }
    const cell = anum.value;
    cell.p = this.um.p1DivX(cell.p);
    const interval = this.um.convertQ2bqInterval(
      cell.p,
      Rational.one.div(cell.upper.toRational()),
      Rational.one.div(cell.lower.toRational()),
    );
    if (!interval.isInterval) throw new SmtInvariantError("inversion of algebraic number failed");
    cell.lower = interval.lower;
    cell.upper = interval.upper;
    this.updateSignLower(cell);
  }

  div(first: Anum, second: Anum) {
    if (this.isZero(second)) throw new SmtInvariantError("division by zero");
    const inverse = this.copy(second);
    this.inv(inverse);
    return this.mul(first, inverse);
  }

  power(anum: Anum, exponent: number): Anum {
    if (exponent === 0) {
      if (this.isZero(anum)) throw new SmtInvariantError("0^0 is indeterminate");
      return new Anum(Rational.one);
    }
    if (exponent === 1) return this.copy(anum);
    if (anum.value instanceof Rational) return new Anum(anum.value.pow(exponent));
    return this.mkPower(anum, exponent);
  }

  // mk_add_polynomial: Res_y(pa(x - y), pb(y)), which has a + b as a root.
  private getSumPolynomial(first: AlgebraicCell, second: AlgebraicCell) {
    const pa = this.pm.composeXMinusY(this.pm.fromCoeffs(first.p, X), Y);
    return this.pm.toCoeffs(this.pm.resultant(pa, this.pm.fromCoeffs(second.p, Y), Y));
  }

  // mk_mul_polynomial: Res_y(y^n * pa(x/y), pb(y)), which has a*b as a root.
  private getProductPolynomial(first: AlgebraicCell, second: AlgebraicCell) {
    const pa = this.pm.composeXDivY(this.pm.fromCoeffs(first.p, X), Y);
    return this.pm.toCoeffs(this.pm.resultant(pa, this.pm.fromCoeffs(second.p, Y), Y));
  }

  // The factors of p whose Sturm sequence counts exactly one root in an interval, until only one
  // factor is left.
  private findIsolatingFactor(
    factors: bigint[][],
    sequences: (Upolynomial[] | null)[],
    interval: BqInterval,
  ): IsolatingFactor | null {
    let remaining = 0;
    let target = -1;
    let targetLowerVariations = 0;
    for (let index = 0; index < factors.length; index++) {
      const sequence = sequences[index];
      if (sequence === null) continue;
      const lowerVariations = this.um.signVariationsAt(sequence, interval.lower);
      const count = lowerVariations - this.um.signVariationsAt(sequence, interval.upper);
      if (count <= 0) {
        sequences[index] = null;
        continue;
      }
      if (count === 1) {
        target = index;
        targetLowerVariations = lowerVariations;
      }
      remaining++;
    }
    const sequence = sequences[target];
    return remaining === 1 && sequence !== null && sequence !== undefined
      ? { factor: factors[target], sequence, lowerVariations: targetLowerVariations }
      : null;
  }

  // mk_binary: a + b or a*b for irrational a and b, refining both until the interval of the result
  // isolates a root of one factor of the resultant.
  private mkBinary(first: Anum, second: Anum, isAdd: boolean) {
    const cellA = getCell(first);
    const cellB = getCell(second);
    const factored = this.factor(
      isAdd ? this.getSumPolynomial(cellA, cellB) : this.getProductPolynomial(cellA, cellB),
    );
    const factors = factored.factors.factors;
    const sequences: (Upolynomial[] | null)[] = factors.map((factor) => this.um.sturmSeq(factor));
    const savedA = this.saveInterval(first);
    const savedB = this.saveInterval(second);
    while (true) {
      const interval = isAdd ? INTERVAL_OPS.add(cellA, cellB) : INTERVAL_OPS.mul(cellA, cellB);
      const found = this.findIsolatingFactor(factors, sequences, interval);
      if (found !== null) {
        this.restoreIfTooSmall(savedA);
        this.restoreIfTooSmall(savedB);
        return this.setCore(found, interval, factored.isComplete);
      }
      if (!this.refine(first) || !this.refine(second)) {
        // Z3 restores a twice here, and b only once the operation is done.
        this.restoreIfTooSmall(savedA);
        this.restoreIfTooSmall(savedA);
        const result = isAdd ? this.add(first, second) : this.mul(first, second);
        this.releaseInterval(savedB);
        return result;
      }
    }
  }

  // mk_power_polynomial: Res_y(x - y^k, pa(y)), which has a^k as a root.
  private getPowerPolynomial(cell: AlgebraicCell, exponent: number) {
    const x = this.pm.sub(this.pm.mkVar(X), this.pm.mkVar(Y, exponent));
    return this.pm.toCoeffs(this.pm.resultant(x, this.pm.fromCoeffs(cell.p, Y), Y));
  }

  // mk_unary with mk_power_polynomial: a^k for an irrational a.
  private mkPower(anum: Anum, exponent: number): Anum {
    const cell = getCell(anum);
    const factored = this.factor(this.getPowerPolynomial(cell, exponent));
    const factors = factored.factors.factors;
    const sequences: (Upolynomial[] | null)[] = factors.map((factor) => this.um.sturmSeq(factor));
    const saved = this.saveInterval(anum);
    while (true) {
      const interval = getIntervalPower(cell, exponent);
      const found = this.findIsolatingFactor(factors, sequences, interval);
      if (found !== null) {
        this.restoreIfTooSmall(saved);
        return this.setCore(found, interval, factored.isComplete);
      }
      if (!this.refine(anum)) {
        this.restoreIfTooSmall(saved);
        return this.power(anum, exponent);
      }
    }
  }

  // set_core: the root of p in an isolating interval that may contain zero.
  private setCore(found: IsolatingFactor, interval: BqInterval, isMinimal: boolean) {
    const p = found.factor;
    let lower = interval.lower;
    let upper = interval.upper;
    if (containsZero(interval)) {
      if (this.um.hasZeroRoots(p)) return new Anum(Rational.zero);
      if (found.lowerVariations === this.um.signVariationsAtZero(found.sequence)) lower = Mpbq.zero;
      else upper = Mpbq.zero;
    }
    const nonzero = this.um.hasZeroRoots(p) ? this.um.removeZeroRoots(p) : p;
    const refined = this.um.isolating2refinable(nonzero, lower, upper);
    if (!refined.isInterval) return new Anum(refined.lower.toRational());
    return this.mkAnum(nonzero, refined.lower, refined.upper, isMinimal);
  }

  // Comparison.

  // compare(cell, b): by the interval, or by the sign of p at b.
  private compareRational(cell: AlgebraicCell, value: Rational) {
    if (cell.upper.compareRational(value) <= 0) return -1;
    if (cell.lower.compareRational(value) >= 0) return 1;
    const sign = this.um.evalSignAtQ(cell.p, value);
    if (sign === 0) return 0;
    return sign === cell.signLower ? 1 : -1;
  }

  compare(first: Anum, second: Anum): number {
    if (first.value instanceof Rational)
      return second.value instanceof Rational
        ? first.value.compare(second.value)
        : -this.compareRational(second.value, first.value);
    if (second.value instanceof Rational) return this.compareRational(first.value, second.value);
    return this.compareCore(first, second);
  }

  // compare_core: refines both intervals to a common magnitude, then tries a wider separation, and
  // last the sign of pb at a by a Sturm-Tarski sequence.
  private compareCore(first: Anum, second: Anum): number {
    const cellA = getCell(first);
    const cellB = getCell(second);
    const compareIntervals = () =>
      cellA.upper.compare(cellB.lower) <= 0 ? -1 : cellA.lower.compare(cellB.upper) >= 0 ? 1 : 0;
    let sign = compareIntervals();
    if (sign !== 0) return sign;
    if (sameCoeffs(cellA.p, cellB.p)) return 0;
    if (cellA.isMinimal && cellB.isMinimal)
      while (true) {
        this.refine(first);
        this.refine(second);
        sign = compareIntervals();
        if (sign !== 0) return sign;
      }
    const magnitudeA = this.getCellMagnitude(cellA);
    const magnitudeB = this.getCellMagnitude(cellB);
    const target = Math.max(MIN_MAGNITUDE, Math.min(magnitudeA, magnitudeB));
    if (magnitudeB > target) {
      if (!this.refineTimes(second, magnitudeB - target)) return this.compare(first, second);
      sign = compareIntervals();
      if (sign !== 0) return sign;
    }
    if (magnitudeA > target) {
      if (!this.refineTimes(first, magnitudeA - target)) return this.compare(first, second);
      sign = compareIntervals();
      if (sign !== 0) return sign;
    }
    for (let index = 0; index < target - MIN_MAGNITUDE; index++) {
      if (!this.refine(first) || !this.refine(second)) return this.compare(first, second);
      sign = compareIntervals();
      if (sign !== 0) return sign;
    }
    // get_interval at precision 10: copies of the intervals refined below 1/2^40.
    const intervalA = this.um.refineToPrecision(cellA.p, cellA.lower, cellA.upper, 40);
    const intervalB = this.um.refineToPrecision(cellB.p, cellB.lower, cellB.upper, 40);
    if (intervalA.isInterval && intervalB.isInterval) {
      if (intervalA.lower.compare(intervalB.upper) > 0) return 1;
      if (intervalA.upper.compare(intervalB.lower) < 0) return -1;
    }
    if (this.compareRational(cellA, intervalB.lower.toRational()) < 0) return -1;
    if (this.compareRational(cellA, intervalB.upper.toRational()) > 0) return 1;
    if (this.compareRational(cellB, intervalA.lower.toRational()) < 0) return 1;
    if (this.compareRational(cellB, intervalA.upper.toRational()) > 0) return -1;
    const sequence = this.um.sturmTarskiSeq(cellA.p, cellB.p);
    const variations =
      this.um.signVariationsAt(sequence, cellA.lower) -
      this.um.signVariationsAt(sequence, cellA.upper);
    if (variations === 0) return 0;
    return variations < 0 === cellB.signLower < 0 ? -1 : 1;
  }

  // Sample points.

  // int_lt: an integer below a.
  intLt(anum: Anum) {
    this.refineUntilPrecision(anum, 1);
    return new Anum(
      Rational.of(
        anum.value instanceof Rational ? anum.value.floor().num - 1n : anum.value.lower.floor(),
      ),
    );
  }

  // int_gt: an integer above a.
  intGt(anum: Anum) {
    this.refineUntilPrecision(anum, 1);
    return new Anum(
      Rational.of(
        anum.value instanceof Rational ? anum.value.ceil().num + 1n : anum.value.upper.ceil(),
      ),
    );
  }

  // separate: refines until the intervals of prev and curr do not touch.
  private separate(previous: Anum, current: Anum) {
    if (previous.value instanceof Rational) {
      const value = previous.value;
      while (
        current.value instanceof AlgebraicCell &&
        current.value.lower.compareRational(value) <= 0
      )
        this.refine(current);
      return;
    }
    if (current.value instanceof Rational) {
      const value = current.value;
      while (
        previous.value instanceof AlgebraicCell &&
        previous.value.upper.compareRational(value) >= 0
      )
        this.refine(previous);
      return;
    }
    while (
      previous.value instanceof AlgebraicCell &&
      current.value instanceof AlgebraicCell &&
      previous.value.upper.compare(current.value.lower) >= 0
    ) {
      this.refine(previous);
      this.refine(current);
    }
  }

  // select: a binary rational between prev < curr with the smallest denominator.
  select(previous: Anum, current: Anum) {
    this.separate(previous, current);
    const lower: SelectEnd =
      previous.value instanceof Rational
        ? { value: previous.value, isOpen: true }
        : { value: previous.value.upper.toRational(), isOpen: false };
    const upper: SelectEnd =
      current.value instanceof Rational
        ? { value: current.value, isOpen: true }
        : { value: current.value.lower.toRational(), isOpen: false };
    return new Anum(selectSmall(lower, upper).toRational());
  }
}

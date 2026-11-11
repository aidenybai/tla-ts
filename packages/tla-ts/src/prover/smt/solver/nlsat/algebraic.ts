// Ported from Z3 (src/math/polynomial/algebraic_numbers.cpp, src/util/basic_interval.h,
// src/util/mpbq.cpp, src/util/index_sort_with_mutations.h), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../../errors";
import { Rational } from "../rational";
import { getLog2, Mpbq } from "./mpbq";
import { PolynomialManager, type Polynomial, type ValueOps } from "./polynomial";
import { UpolynomialManager, type Upolynomial } from "./upolynomial";
import { factorUpolynomial, type FactorParams } from "./upolynomial-factorization";

const FACTOR_PARAMS: FactorParams = { maxPrime: 31, primeTrials: 1, maxSearchSize: 5000 };
const MIN_MAGNITUDE = -16;
const SIGN_PRECISION = 2;
const X = 0;
const Y = 1;

class AlgebraicCell {
  constructor(
    public p: Upolynomial,
    public lower: Mpbq,
    public upper: Mpbq,
    public isMinimal: boolean,
    public isSignLowerNeg: boolean,
    public isNotRational: boolean,
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

export class Anum {
  constructor(public value: Rational | AlgebraicCell) {}
}

interface BqInterval {
  lower: Mpbq;
  upper: Mpbq;
}

interface SelectEnd {
  value: Rational;
  isOpen: boolean;
}

interface SavedInterval {
  anum: Anum;
  lower: Mpbq;
  upper: Mpbq;
  isRestored: boolean;
}

interface IsolatingFactor {
  factor: Upolynomial;
  sequence: Upolynomial[];
  lowerVariations: number;
}

interface ClosestAnums {
  roots: Anum[];
  indices: number[];
}

interface SignedRoots {
  roots: Anum[];
  signs: number[];
}

const getMinBq = (first: Mpbq, second: Mpbq) => (second.compare(first) < 0 ? second : first);
const getMaxBq = (first: Mpbq, second: Mpbq) => (second.compare(first) > 0 ? second : first);

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
    return { lower: products.reduce(getMinBq), upper: products.reduce(getMaxBq) };
  },
  power: (base, exponent) => getIntervalPower(base, exponent),
};

const getIntervalPower = (base: BqInterval, exponent: number): BqInterval => {
  const lower = base.lower.power(exponent);
  const upper = base.upper.power(exponent);
  if (exponent % 2 === 1 || !base.lower.isNeg) return { lower, upper };
  if (base.upper.isNeg) return { lower: upper, upper: lower };
  return { lower: Mpbq.zero, upper: getMaxBq(lower, upper) };
};

const containsZero = (interval: BqInterval) => interval.lower.isNeg && interval.upper.isPos;

const getPositiveLog2 = (value: bigint) => (value <= 0n ? 0 : getLog2(value));
const getNegativeLog2 = (value: bigint) => (value >= 0n ? 0 : getLog2(value));

const getMagnitudeUpperBound = (value: Mpbq) =>
  value.isZero
    ? 0
    : value.isPos
      ? getLog2(value.num) - value.k + 1
      : getNegativeLog2(value.num) - value.k;

const getMagnitude = (lower: Mpbq, upper: Mpbq) => {
  if (lower.k === upper.k) return getMagnitudeUpperBound(lower);
  const log2 = lower.isNeg ? getNegativeLog2 : getPositiveLog2;
  return log2(upper.num) - log2(lower.num) - upper.k + lower.k - upper.k;
};

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

const hasSameCoeffs = (first: Upolynomial, second: Upolynomial) =>
  first.length === second.length && first.every((coeff, index) => coeff === second[index]);

export const mergeSortIndices = (
  count: number,
  isLess: (first: number, second: number) => boolean,
) => {
  let source = Array.from({ length: count }, (_unused, index) => index);
  for (let width = 1; width < count; width *= 2) {
    const target: number[] = [];
    for (let low = 0; low < count; low += 2 * width) {
      const middle = Math.min(low + width, count);
      const high = Math.min(low + 2 * width, count);
      let left = low;
      let right = middle;
      while (left < middle && right < high)
        target.push(isLess(source[right], source[left]) ? source[right++] : source[left++]);
      while (left < middle) target.push(source[left++]);
      while (right < high) target.push(source[right++]);
    }
    source = target;
  }
  return source;
};

export class AlgebraicManager {
  private um = new UpolynomialManager();
  private pm = new PolynomialManager();
  private anumOps: ValueOps<Anum> = {
    fromInteger: (value) => new Anum(Rational.of(value)),
    add: (first, second) => this.add(first, second),
    mul: (first, second) => this.mul(first, second),
    power: (base, exponent) => this.power(base, exponent),
  };

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

  getRootIndex(anum: Anum) {
    if (anum.value instanceof Rational) return this.isZero(anum) ? 0 : 1;
    const cell = anum.value;
    if (cell.rootIndex === 0) cell.rootIndex = this.um.getRootId(cell.p, cell.lower) + 1;
    return cell.rootIndex;
  }

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

  private mkAnum(p: Upolynomial, lower: Mpbq, upper: Mpbq, isMinimal: boolean) {
    if (p.length === 2) return new Anum(Rational.of(p[0]).div(Rational.of(p[1])).neg());
    return new Anum(this.mkCell(p, lower, upper, isMinimal));
  }

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

  private releaseInterval(saved: SavedInterval) {
    if (!saved.isRestored) this.restoreIfTooSmall(saved);
  }

  private factor(p: Upolynomial) {
    return factorUpolynomial(this.um, p, FACTOR_PARAMS);
  }

  private isolateUnivariateRoots(coeffs: Upolynomial) {
    const roots: Anum[] = [];
    if (coeffs.length === 0) return roots;
    const hasZeroRoot = this.um.hasZeroRoots(coeffs);
    if (hasZeroRoot) roots.push(new Anum(Rational.zero));
    const factored = this.factor(hasZeroRoot ? this.um.removeZeroRoots(coeffs) : coeffs);
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

  private sortRoots(roots: Anum[]) {
    if (roots.length < 2) return;
    const sorted = mergeSortIndices(
      roots.length,
      (first, second) => this.compare(roots[first], roots[second]) < 0,
    ).map((index) => roots[index]);
    for (let index = 0; index < sorted.length; index++) roots[index] = sorted[index];
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

  private isolateRootsClosestUnivariate(
    pm: PolynomialManager,
    polynomial: Polynomial,
    sample: Rational,
  ): ClosestAnums {
    const result: ClosestAnums = { roots: [], indices: [] };
    if (pm.isConst(polynomial)) return result;
    const coeffs = pm.toCoeffs(polynomial);
    if (coeffs.length === 0) return result;
    const p = this.um.squareFree(coeffs);
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
      return this.isolateUnivariateRoots(pm.toCoeffs(q)).filter(
        (root) => this.evalSignAt(pm, reduced, getExtended(values, x, root)) === 0,
      );
    }
    if (isNested)
      throw new SmtInvariantError("resultant vanished during nested isolate_roots call");
    return this.isolateVanishedRoots(pm, reduced, values, xs, x);
  }

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
    const z = Math.max(...xs) + 1;
    const q = this.pm.add(
      this.pm.mul(this.pm.mkVar(z), this.pm.mkVar(x, power)),
      this.convert(pm, reduced, x, power - 1),
    );
    return this.isolateRoots(this.pm, q, getExtended(values, z, leading), true);
  }

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

  private sortByDegree(xs: number[], values: readonly (Anum | undefined)[]) {
    const getDegree = (variable: number) => {
      const value = values[variable];
      return value === undefined ? Infinity : this.degree(value);
    };
    return [...xs].sort((first, second) => getDegree(first) - getDegree(second));
  }

  isolateRootsClosest(
    pm: PolynomialManager,
    polynomial: Polynomial,
    values: readonly (Anum | undefined)[],
    sample: Rational,
  ): ClosestAnums {
    const result: ClosestAnums = { roots: [], indices: [] };
    if (pm.isConst(polynomial)) return result;
    if (pm.isUnivariate(polynomial))
      return this.isolateRootsClosestUnivariate(pm, polynomial, sample);
    const reduced = pm.substituteRational(polynomial, getRationalValues(values));
    if (pm.isConst(reduced)) return result;
    if (pm.isUnivariate(reduced)) {
      if (values[pm.maxVar(reduced)] !== undefined) return result;
      return this.isolateRootsClosestUnivariate(pm, reduced, sample);
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

  private getSumPolynomial(first: AlgebraicCell, second: AlgebraicCell) {
    const composed = this.pm.composeXMinusY(this.pm.fromCoeffs(first.p, X), Y);
    return this.pm.toCoeffs(this.pm.resultant(composed, this.pm.fromCoeffs(second.p, Y), Y));
  }

  private getProductPolynomial(first: AlgebraicCell, second: AlgebraicCell) {
    const composed = this.pm.composeXDivY(this.pm.fromCoeffs(first.p, X), Y);
    return this.pm.toCoeffs(this.pm.resultant(composed, this.pm.fromCoeffs(second.p, Y), Y));
  }

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

  private getPowerPolynomial(cell: AlgebraicCell, exponent: number) {
    const x = this.pm.sub(this.pm.mkVar(X), this.pm.mkVar(Y, exponent));
    return this.pm.toCoeffs(this.pm.resultant(x, this.pm.fromCoeffs(cell.p, Y), Y));
  }

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

  private compareCore(first: Anum, second: Anum): number {
    const cellA = getCell(first);
    const cellB = getCell(second);
    const compareIntervals = () =>
      cellA.upper.compare(cellB.lower) <= 0 ? -1 : cellA.lower.compare(cellB.upper) >= 0 ? 1 : 0;
    let sign = compareIntervals();
    if (sign !== 0) return sign;
    if (hasSameCoeffs(cellA.p, cellB.p)) return 0;
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

  intLt(anum: Anum) {
    this.refineUntilPrecision(anum, 1);
    return new Anum(
      Rational.of(
        anum.value instanceof Rational ? anum.value.floor().num - 1n : anum.value.lower.floor(),
      ),
    );
  }

  intGt(anum: Anum) {
    this.refineUntilPrecision(anum, 1);
    return new Anum(
      Rational.of(
        anum.value instanceof Rational ? anum.value.ceil().num + 1n : anum.value.upper.ceil(),
      ),
    );
  }

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

  select(previous: Anum, current: Anum) {
    this.separate(previous, current);
    const lower =
      previous.value instanceof Rational
        ? { value: previous.value, isOpen: true }
        : { value: previous.value.upper.toRational(), isOpen: false };
    const upper =
      current.value instanceof Rational
        ? { value: current.value, isOpen: true }
        : { value: current.value.lower.toRational(), isOpen: false };
    return new Anum(selectSmall(lower, upper).toRational());
  }
}

// Ported from Z3 (src/math/polynomial/upolynomial_factorization{.cpp,_int.h}, the factorization
// in src/math/polynomial/upolynomial.cpp, src/util/prime_generator.cpp and mpz_manager::root),
// MIT license, see z3-license.txt. Factorization of univariate integer polynomials: square-free
// decomposition, Berlekamp's algorithm in Z_p for small primes p, quadratic Hensel lifting to
// p^e above a Mignotte bound, and a search over combinations of the lifted factors (Zassenhaus).
import { type Upolynomial, UpolynomialManager } from "./upolynomial";

const UINT_MAX = 4294967295;

export interface FactorParams {
  // Factor in Z_p for primes p up to maxPrime.
  maxPrime: number;
  // The number of factorizations in Z_p whose degree sets are intersected before lifting.
  primeTrials: number;
  // The most combinations of lifted factors the search tries.
  maxSearchSize: number;
}

// polynomial::factor_params(), which polynomial factorization and nlsat use.
export const DEFAULT_FACTOR_PARAMS: FactorParams = {
  maxPrime: UINT_MAX,
  primeTrials: 4,
  maxSearchSize: UINT_MAX,
};

// constant * factors[0]^degrees[0] * ... * factors[n]^degrees[n].
export interface UpolynomialFactors {
  constant: bigint;
  factors: bigint[][];
  degrees: number[];
}

const mkFactors = (): UpolynomialFactors => ({ constant: 1n, factors: [], degrees: [] });

const getTotalFactors = (fs: UpolynomialFactors) =>
  fs.degrees.reduce((total, degree) => total + degree, 0);

const getTotalDegree = (fs: UpolynomialFactors) =>
  fs.factors.reduce((total, factor, index) => total + (factor.length - 1) * fs.degrees[index], 0);

const pushFactor = (
  um: UpolynomialManager,
  fs: UpolynomialFactors,
  factor: Upolynomial,
  degree: number,
) => {
  fs.factors.push(um.set(factor));
  fs.degrees.push(degree);
};

// factors::multiply
const multiplyFactors = (um: UpolynomialManager, fs: UpolynomialFactors) => {
  if (fs.constant === 0n) return [];
  let result = [um.normalizeNumeral(fs.constant)];
  for (let index = 0; index < fs.factors.length; index++)
    result = um.mul(
      result,
      fs.degrees[index] > 1 ? um.pw(fs.factors[index], fs.degrees[index]) : fs.factors[index],
    );
  return result;
};

// prime_iterator: 2, 3, 5, 7, ...
const mkPrimeIterator = () => {
  let current = 1;
  return () => {
    for (current++; ; current++) {
      let isPrime = true;
      for (let divisor = 2; divisor * divisor <= current; divisor++)
        if (current % divisor === 0) {
          isPrime = false;
          break;
        }
      if (isPrime) return current;
    }
  };
};

// mpz_manager::root for n = 2: bisection from powers of two, returning the upper end when the
// square root is not an integer.
const getSquareRoot = (value: bigint) => {
  if (value === 0n) return value;
  const log2 = value.toString(2).length - 1;
  let lower = 1n << BigInt(Math.floor(log2 / 2));
  let upper = 1n << BigInt(Math.ceil((log2 + 1) / 2));
  if (lower === upper) return lower;
  while (true) {
    const middle = (upper + lower) >> 1n;
    const square = middle * middle;
    if (square === value) return middle;
    if (middle === lower || middle === upper) return upper;
    if (square < value) lower = middle;
    else upper = middle;
  }
};

// mpz_manager::is_perfect_square: the nonnegative square root, or null.
export const getExactSquareRoot = (value: bigint) => {
  if (value < 0n) return null;
  if (value < 2n) return value;
  let root = BigInt(Math.floor(Math.sqrt(Number(value))));
  while (root * root > value) root--;
  while ((root + 1n) * (root + 1n) <= value) root++;
  return root * root === value ? root : null;
};

// factorization_degree_set: the degrees that products of the factors can have.
const getDegreeSet = (fs: UpolynomialFactors) => {
  let set = [true];
  for (let index = 0; index < fs.factors.length; index++) {
    const degree = fs.factors[index].length - 1;
    for (let count = 0; count < fs.degrees[index]; count++) {
      const shifted = [...Array.from({ length: degree }, () => false), ...set];
      set = shifted.map((isIn, position) => isIn || (set[position] ?? false));
    }
  }
  return set;
};

const isTrivialDegreeSet = (set: readonly boolean[]) => {
  for (let degree = 1; degree < set.length - 1; degree++) if (set[degree]) return false;
  return true;
};

// berlekamp_matrix: Q - I, where row i of Q holds x^(p*i) modulo f.
class BerlekampMatrix {
  private matrix: bigint[];
  private size: number;
  private nullRow = 1;
  private columnPivot: number[];
  private rowPivot: number[];

  constructor(
    private zp: UpolynomialManager,
    f: Upolynomial,
  ) {
    const size = f.length - 1;
    this.size = size;
    this.columnPivot = Array.from({ length: size }, () => -1);
    this.rowPivot = Array.from({ length: size }, () => -1);
    const prime = Number(zp.zp);
    this.matrix = [1n, ...Array.from({ length: size }, () => 0n)];
    let row = 0;
    for (let k = 1, previousRow = 0; ; previousRow = row, k++) {
      if (k % prime === 1) {
        if (++row >= size) break;
        for (let column = 0; column < size; column++) this.matrix.push(0n);
      }
      const multiplier = this.get(previousRow, size - 1);
      for (let column = size - 1; column > 0; column--)
        this.put(row, column, this.get(previousRow, column - 1) - multiplier * f[column]);
      this.put(row, 0, -(f[0] * multiplier));
    }
    for (let index = 0; index < size; index++) this.put(index, index, this.get(index, index) - 1n);
  }

  private get(row: number, column: number) {
    return this.matrix[row * this.size + column];
  }

  private put(row: number, column: number, value: bigint) {
    this.matrix[row * this.size + column] = this.zp.normalizeNumeral(value);
  }

  // diagonalize: column operations that turn each pivot into -1. Returns the rank of the null
  // space.
  diagonalize() {
    let nullRank = 0;
    for (let row = 0; row < this.size; row++) {
      let isColumnFound = false;
      for (let column = 0; column < this.size; column++) {
        if (this.columnPivot[column] >= 0 || this.get(row, column) === 0n) continue;
        isColumnFound = true;
        this.columnPivot[column] = row;
        this.rowPivot[row] = column;
        const pivotMultiplier = this.zp.normalizeNumeral(-this.zp.inv(this.get(row, column)));
        for (let other = this.nullRow; other < this.size; other++)
          this.put(other, column, this.get(other, column) * pivotMultiplier);
        for (let otherColumn = 0; otherColumn < this.size; otherColumn++) {
          if (otherColumn === column) continue;
          const multiplier = this.get(row, otherColumn);
          for (let other = this.nullRow; other < this.size; other++)
            this.put(
              other,
              otherColumn,
              this.get(other, otherColumn) + multiplier * this.get(other, column),
            );
        }
      }
      if (!isColumnFound) nullRank++;
    }
    return nullRank;
  }

  // next_null_space_vector: the next basis vector of the null space, skipping [1, 0, ..., 0].
  nextNullSpaceVector() {
    for (; this.nullRow < this.size; this.nullRow++) {
      if (this.rowPivot[this.nullRow] >= 0) continue;
      const vector = Array.from({ length: this.size }, (_unused, column) =>
        this.rowPivot[column] >= 0
          ? this.get(this.nullRow, this.rowPivot[column])
          : column === this.nullRow
            ? 1n
            : 0n,
      );
      this.nullRow++;
      return vector;
    }
    return null;
  }
}

// zp_factor_square_free_berlekamp, deterministic: splits the monic square-free f in Z_p with
// gcd(v - s, f) for the null space vectors v of Q - I. Returns false when f is irreducible.
const factorSquareFreeInZp = (zp: UpolynomialManager, f: Upolynomial, fs: UpolynomialFactors) => {
  const prime = Number(zp.zp);
  const matrix = new BerlekampMatrix(zp, f);
  const firstFactor = fs.factors.length;
  pushFactor(zp, fs, f, 1);
  const nullRank = matrix.diagonalize();
  if (nullRank === 1) return false;
  for (let vector = matrix.nextNullSpaceVector(); vector !== null;) {
    const trimmed = zp.set(vector);
    const factorEnd = fs.factors.length;
    for (let factorIndex = firstFactor; factorIndex < factorEnd; factorIndex++) {
      if (fs.factors[factorIndex].length === 2) continue;
      for (let shift = 0; shift < prime; shift++) {
        const current = fs.factors[factorIndex];
        trimmed[0] = zp.normalizeNumeral(trimmed[0] - 1n);
        const common = zp.gcd(trimmed, current);
        if (common.length !== 1 && common.length !== current.length) {
          fs.factors[factorIndex] = zp.div(current, common);
          pushFactor(zp, fs, common, 1);
        }
        if (fs.factors.length - firstFactor === nullRank) return true;
      }
    }
    vector = matrix.nextNullSpaceVector();
  }
  return true;
};

// hensel_lift: from C = A*B (mod b) and U*A + V*B = 1 (mod r) with r | b, the A1 = A (mod b) and
// B1 = B (mod b) with C = A1*B1 (mod b*r), deg(A1) = deg(A) and lc(A1) = lc(A).
const henselLiftOnce = (
  z: UpolynomialManager,
  b: bigint,
  r: bigint,
  polynomials: { u: Upolynomial; a: Upolynomial; v: Upolynomial; b: Upolynomial; c: Upolynomial },
) => {
  const zr = new UpolynomialManager(r);
  const f = zr.set(z.divConst(z.sub(polynomials.c, z.mul(polynomials.a, polynomials.b)), b));
  const division = zr.divRem(zr.mul(polynomials.v, f), polynomials.a);
  const t = zr.add(zr.mul(polynomials.u, f), zr.mul(polynomials.b, division.quotient));
  return {
    a: z.add(polynomials.a, z.mulConst(division.remainder, b)),
    b: z.add(polynomials.b, z.mulConst(t, b)),
  };
};

// hensel_lift_quadratic: lifts C = A*B from Z_p to Z_(p^e), squaring the modulus of zpe and
// lifting U*A + V*B = 1 along with A and B.
const henselLiftQuadratic = (
  z: UpolynomialManager,
  c: Upolynomial,
  zpe: UpolynomialManager,
  a: Upolynomial,
  b: Upolynomial,
  e: number,
) => {
  const zp = new UpolynomialManager(zpe.zp);
  const ext = zp.extGcd(a, b);
  let u = ext.u;
  let v = ext.v;
  let currentA = [...a];
  let currentB = [...b];
  for (let k = 1; k < e; k *= 2) {
    const modulus = zpe.zp as bigint;
    const lifted = henselLiftOnce(z, modulus, modulus, {
      u,
      a: currentA,
      v,
      b: currentB,
      c,
    });
    const g = zpe.set(
      z.divConst(z.sub(z.sub([1n], z.mul(lifted.a, u)), z.mul(lifted.b, v)), modulus),
    );
    const division = zpe.divRem(zpe.mul(g, v), currentA);
    const s = zpe.add(zpe.mul(g, u), zpe.mul(division.quotient, currentB));
    u = z.add(u, z.mulConst(s, modulus));
    v = z.add(v, z.mulConst(division.remainder, modulus));
    zpe.squareModulus();
    u = zpe.set(u);
    v = zpe.set(v);
    currentA = zpe.set(lifted.a);
    currentB = zpe.set(lifted.b);
  }
  return { a: currentA, b: currentB };
};

// hensel_lift: the monic factors of f in Z_p lifted one by one to Z_(p^e), the last one carrying
// lc(f) until it is divided out.
const henselLiftFactors = (
  z: UpolynomialManager,
  f: Upolynomial,
  zp: UpolynomialManager,
  zpFs: UpolynomialFactors,
  e: number,
  zpe: UpolynomialManager,
) => {
  const prime = zp.zp as bigint;
  const zpeFs = mkFactors();
  zpe.setZp(prime);
  let parts = z.set(f);
  let b: Upolynomial = [];
  for (let index = 0; index < zpFs.factors.length - 1; index++) {
    const a = zp.set(zpFs.factors[index]);
    const c =
      index > 0
        ? zp.set(parts)
        : zp.mulConst(multiplyFactors(zp, zpFs), zp.normalizeNumeral(f[f.length - 1]));
    zpe.setZp(prime);
    const lifted = henselLiftQuadratic(z, parts, zpe, a, zp.div(c, a), e);
    b = lifted.b;
    if (index === 0) parts = zpe.set(f);
    parts = zpe.div(parts, lifted.a);
    zpeFs.factors.push(lifted.a);
    zpeFs.degrees.push(1);
  }
  zpeFs.factors.push(zpe.mulConst(b, zpe.inv(f[f.length - 1])));
  zpeFs.degrees.push(1);
  return zpeFs;
};

// mignotte_bound: the e, a power of two, with p^e above 2^n * (|f| + |lc(f)|) for n = deg(f)/2,
// which bounds twice the coefficients of the factors of degree at most n.
const getMignotteBound = (f: Upolynomial, prime: bigint) => {
  let squareNorm = 0n;
  for (const coeff of f) if (coeff !== 0n) squareNorm += coeff * coeff;
  const leading = f[f.length - 1];
  const bound =
    (1n << BigInt(Math.floor((f.length - 1) / 2))) *
    (getSquareRoot(squareNorm) + (leading < 0n ? -leading : leading));
  let e = 1;
  for (let power = prime; power <= bound; e *= 2) power *= power;
  return e;
};

// ufactorization_combination_iterator: the subsets of the enabled factors, smallest first and at
// most half of them, whose degree is in the degree set. Selected factors that turn out to be true
// factors are removed from later subsets.
class CombinationIterator {
  private totalSize: number;
  private maxSize: number;
  private isEnabled: boolean[];
  private currentSize = 0;
  private current: number[];

  constructor(
    private zpe: UpolynomialManager,
    private fs: UpolynomialFactors,
    private degreeSet: readonly boolean[],
  ) {
    const count = fs.factors.length;
    this.totalSize = count;
    this.maxSize = Math.floor(count / 2);
    this.isEnabled = Array.from({ length: count }, () => true);
    this.current = Array.from({ length: count + 1 }, () => count);
  }

  private find(position: number, upperBound: number) {
    let candidate = this.current[position] + 1;
    while (candidate < upperBound && !this.isEnabled[candidate]) candidate++;
    return candidate === upperBound ? -1 : candidate;
  }

  next(isRemovingCurrent: boolean) {
    const maxUpperBound = this.fs.factors.length;
    let isRemoving = isRemovingCurrent;
    do {
      let position = this.currentSize - 1;
      let value = -1;
      if (isRemoving) {
        for (position = this.currentSize - 1; position > 0; position--) {
          this.isEnabled[this.current[position]] = false;
          this.current[position] = maxUpperBound;
        }
        this.isEnabled[this.current[0]] = false;
        isRemoving = false;
        this.totalSize -= this.currentSize;
        this.maxSize = Math.floor(this.totalSize / 2);
      }
      while (position >= 0) {
        value = this.find(position, this.current[position + 1]);
        if (value >= 0) {
          this.current[position] = value;
          break;
        }
        position--;
      }
      do {
        if (value === -1) {
          if (this.currentSize >= this.maxSize) return false;
          this.currentSize++;
          this.current[0] = -1;
          position = 0;
          value = this.find(position, maxUpperBound);
          if (value === -1) return false;
          this.current[position] = value;
        }
        for (position++; position < this.currentSize; position++) {
          this.current[position] = this.current[position - 1];
          value = this.find(position, maxUpperBound);
          if (value === -1) {
            this.current[0] = -1;
            break;
          }
          this.current[position] = value;
        }
      } while (value === -1);
    } while (!this.degreeSet[this.getCurrentDegree()]);
    return true;
  }

  getCurrentDegree() {
    let degree = 0;
    for (let index = 0; index < this.currentSize; index++)
      degree += this.fs.factors[this.current[index]].length - 1;
    return degree;
  }

  // The enabled factors outside the selection, in order.
  private getRest() {
    const rest: number[] = [];
    for (let factor = 0, selected = 0; factor < this.fs.factors.length; factor++) {
      if (!this.isEnabled[factor]) continue;
      if (selected >= this.current.length || factor < this.current[selected]) rest.push(factor);
      else selected++;
    }
    return rest;
  }

  getLeft() {
    let result = this.zpe.set(this.fs.factors[this.current[0]]);
    for (let index = 1; index < this.currentSize; index++)
      result = this.zpe.mul(result, this.fs.factors[this.current[index]]);
    return result;
  }

  getRight() {
    let result: bigint[] = [];
    for (const factor of this.getRest())
      result =
        result.length === 0
          ? this.zpe.set(this.fs.factors[factor])
          : this.zpe.mul(result, this.fs.factors[factor]);
    return result;
  }

  // get_left_tail_coeff, get_right_tail_coeff: m times the constant terms of the side's factors.
  getLeftTailCoeff(multiplier: bigint) {
    let result = this.zpe.normalizeNumeral(multiplier);
    for (let index = 0; index < this.currentSize; index++)
      result = this.zpe.normalizeNumeral(result * this.fs.factors[this.current[index]][0]);
    return result;
  }

  getRightTailCoeff(multiplier: bigint) {
    let result = this.zpe.normalizeNumeral(multiplier);
    for (const factor of this.getRest())
      result = this.zpe.normalizeNumeral(result * this.fs.factors[factor][0]);
    return result;
  }
}

const divides = (divisor: bigint, dividend: bigint) =>
  divisor === 0n ? dividend === 0n : dividend % divisor === 0n;

// factor_square_free: the factors of the primitive square-free f in Z[x], each pushed with
// multiplicity k. Returns false when a limit in params stopped the search, leaving a factor that
// may be reducible.
export const factorSquareFree = (
  z: UpolynomialManager,
  f: Upolynomial,
  fs: UpolynomialFactors,
  k: number,
  params: FactorParams,
) => {
  let fPp = z.set(f);
  if (fPp.length > 0 && fPp[fPp.length - 1] < 0n) {
    fPp = fPp.map((coeff) => -coeff);
    if (k % 2 === 1) fs.constant = -fs.constant;
  }
  const zp = new UpolynomialManager(2n);
  let zpFs = mkFactors();
  let zpFsPrime = 2n;
  let degreeSet = [true];
  const getNextPrime = mkPrimeIterator();
  for (let trials = 0; trials <= params.primeTrials;) {
    const nextPrime = getNextPrime();
    if (nextPrime > params.maxPrime) {
      pushFactor(z, fs, fPp, k);
      return false;
    }
    const prime = BigInt(nextPrime);
    zp.setZp(prime);
    if (fPp[fPp.length - 1] % prime === 0n) continue;
    const fPpZp = zp.set(fPp);
    if (!zp.isSquareFree(fPpZp)) continue;
    const currentFs = mkFactors();
    if (!factorSquareFreeInZp(zp, zp.mkMonic(fPpZp), currentFs)) {
      pushFactor(z, fs, fPp, k);
      return true;
    }
    const currentDegreeSet = getDegreeSet(currentFs);
    degreeSet =
      degreeSet.length === 1
        ? currentDegreeSet
        : degreeSet.map((isIn, degree) => isIn && (currentDegreeSet[degree] ?? false));
    if (isTrivialDegreeSet(degreeSet)) {
      pushFactor(z, fs, fPp, k);
      return true;
    }
    trials++;
    if (zpFs.factors.length === 0 || getTotalFactors(zpFs) > getTotalFactors(currentFs)) {
      zpFs = currentFs;
      zpFsPrime = prime;
    }
  }
  zp.setZp(zpFsPrime);
  const zpe = new UpolynomialManager(zpFsPrime);
  const zpeFs = henselLiftFactors(z, fPp, zp, zpFs, getMignotteBound(fPp, zpFsPrime), zpe);
  let leading = zpe.normalizeNumeral(fPp[fPp.length - 1]);
  fPp = z.mulConst(fPp, leading);
  const iterator = new CombinationIterator(zpe, zpeFs, degreeSet);
  const halfDegree = Math.floor(getTotalDegree(zpFs) / 2);
  let result = true;
  let isRemoving = false;
  for (let counter = 1; iterator.next(isRemoving); counter++) {
    if (counter > params.maxSearchSize) {
      result = false;
      break;
    }
    const isUsingLeft = iterator.getCurrentDegree() <= halfDegree;
    const tail = isUsingLeft
      ? iterator.getLeftTailCoeff(leading)
      : iterator.getRightTailCoeff(leading);
    if (!divides(tail, fPp[0])) {
      isRemoving = false;
      continue;
    }
    const trial = zpe.mulConst(isUsingLeft ? iterator.getLeft() : iterator.getRight(), leading);
    const quotient = z.exactDiv(fPp, trial);
    if (quotient === null) {
      isRemoving = false;
      continue;
    }
    // The factor is the side of degree at most half, which the bound makes recoverable. The
    // search continues with the other side.
    pushFactor(z, fs, z.getPrimitive(isUsingLeft ? trial : quotient), k);
    fPp = z.getPrimitive(isUsingLeft ? quotient : trial);
    leading = fPp[fPp.length - 1];
    fPp = z.mulConst(fPp, leading);
    isRemoving = true;
  }
  if (fPp.length > 1) pushFactor(z, fs, z.divConst(fPp, leading), k);
  return result;
};

// factor_2_sqf_pp: a square-free primitive quadratic splits when its discriminant is a square.
const factorQuadratic = (
  z: UpolynomialManager,
  p: Upolynomial,
  fs: UpolynomialFactors,
  k: number,
) => {
  const root = getExactSquareRoot(p[1] * p[1] - 4n * p[2] * p[0]);
  if (root === null) {
    pushFactor(z, fs, p, k);
    return;
  }
  pushFactor(z, fs, z.normalize([p[1] - root, 2n * p[2]]), k);
  pushFactor(z, fs, z.normalize([p[1] + root, 2n * p[2]]), k);
};

// factor_sqf_pp
const factorSqfPp = (
  z: UpolynomialManager,
  p: Upolynomial,
  fs: UpolynomialFactors,
  k: number,
  params: FactorParams,
) => {
  if (p.length <= 2) {
    pushFactor(z, fs, p, k);
    return true;
  }
  if (p.length === 3) {
    factorQuadratic(z, p, fs, k);
    return true;
  }
  return factorSquareFree(z, p, fs, k, params);
};

// flip_factor_sign_if_lm_neg
const flipFactorSignIfLmNeg = (p: Upolynomial, fs: UpolynomialFactors, k: number) => {
  if (p.length === 0 || p[p.length - 1] >= 0n) return p;
  if (k % 2 === 1) fs.constant = -fs.constant;
  return p.map((coeff) => -coeff);
};

// manager::factor: the content and the irreducible factors of p with their multiplicities, by
// Yun's square-free decomposition. Returns false when a limit in params left a factor that may be
// reducible.
export const factorUpolynomial = (
  z: UpolynomialManager,
  p: Upolynomial,
  params: FactorParams,
): { isComplete: boolean; factors: UpolynomialFactors } => {
  const fs = mkFactors();
  if (p.length <= 1) {
    fs.constant = p.length === 0 ? 0n : p[0];
    return { isComplete: true, factors: fs };
  }
  fs.constant = z.getContent(p);
  const primitive = z.getPrimitive(p);
  let square = z.gcd(primitive, z.derivative(primitive));
  if (square.length <= 1) {
    const isComplete = factorSqfPp(z, flipFactorSignIfLmNeg(primitive, fs, 1), fs, 1, params);
    return { isComplete, factors: fs };
  }
  let isComplete = true;
  let product = z.exactDiv(primitive, square) as bigint[];
  for (let multiplicity = 1; product.length > 1; multiplicity++) {
    const next = z.gcd(product, square);
    const factor = z.exactDiv(product, next) as bigint[];
    if (factor.length > 1) {
      if (
        !factorSqfPp(z, flipFactorSignIfLmNeg(factor, fs, multiplicity), fs, multiplicity, params)
      )
        isComplete = false;
    } else if (factor[0] === -1n && multiplicity % 2 === 1) fs.constant = -fs.constant;
    square = z.exactDiv(square, next) as bigint[];
    product = next;
  }
  return { isComplete, factors: fs };
};

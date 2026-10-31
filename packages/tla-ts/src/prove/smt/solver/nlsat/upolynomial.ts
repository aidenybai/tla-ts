// Ported from Z3 (src/math/polynomial/upolynomial.{h,cpp}, src/util/mpzzp.h,
// src/math/polynomial/polynomial_primes.h), MIT license, see z3-license.txt. Univariate
// polynomials with integer coefficients, as coefficient arrays from the constant term up with no
// leading zeros, over Z or over Z_p. Root isolation by Descartes' rule of signs, Sturm sequences
// and refinement of isolating intervals with binary rational endpoints.
import { SmtInvariantError } from "../../../../errors";
import { getGcd, Rational } from "../rational";
import { getLog2, Mpbq, refineLower, refineUpper } from "./mpbq";

export type Upolynomial = readonly bigint[];

// g_big_primes: the primes mod_gcd tries, in order.
const BIG_PRIMES = [
  39103, 39107, 39113, 39119, 39133, 39139, 39157, 39161, 39163, 39181, 39191, 39199, 39209, 39217,
  39227, 39229, 39233, 39239, 39241, 39251, 39293, 39301, 39313, 39317, 39323, 39341, 39343, 39359,
  39367, 39371, 39373, 39383, 39397, 39409, 39419, 39439, 39443, 39451, 39461, 39499, 39503, 39509,
  39511, 39521, 39541, 39551, 39563, 39569, 39581, 39607, 39619, 39623, 39631, 39659, 39667, 39671,
  39679, 39703, 39709, 39719, 39727, 39733, 39749, 39761, 39769, 39779, 39791, 39799, 39821, 39827,
  39829, 39839, 39841, 39847, 39857, 39863, 39869, 39877, 39883, 39887, 39901, 39929, 39937, 39953,
  39971, 39979, 39983, 39989, 40009, 40013, 40031, 40037, 40039, 40063, 40087, 40093, 40099, 40111,
  40123, 40127, 40129, 40151, 40153, 40163, 40169, 40177, 40189, 40193, 40213, 40231, 40237, 40241,
  40253, 40277, 40283, 40289, 40343, 40351, 40357, 40361, 40387, 40423, 40427, 40429, 40433, 40459,
  40471, 40483, 40487, 40493, 40499, 40507, 40519, 40529, 40531, 40543, 40559, 40577, 40583, 40591,
  40597, 40609, 40627, 40637, 40639, 40693, 40697, 40699, 40709, 40739, 40751, 40759, 40763, 40771,
  40787, 40801, 40813, 40819, 40823, 40829, 40841, 40847, 40849, 40853, 40867, 40879, 40883, 40897,
  40903, 40927, 40933, 40939, 40949, 40961, 40973, 40993, 41011, 41017, 41023, 41039, 41047, 41051,
  41057, 41077, 41081, 41113, 41117, 41131, 41141, 41143, 41149, 41161, 41177, 41179, 41183, 41189,
  41201, 41203, 41213, 41221, 41227, 41231, 41233, 41243, 41257, 41263, 41269, 41281, 41299, 41333,
  41341, 41351, 41357, 41381, 41387, 41389, 41399, 41411, 41413, 41443, 41453, 41467, 41479, 41491,
  41507, 41513, 41519, 41521, 41539, 41543, 41549,
].map(BigInt);

const sign = (value: bigint) => (value > 0n ? 1 : value < 0n ? -1 : 0);

// mpz div: rounds toward minus infinity.
const floorDiv = (dividend: bigint, divisor: bigint) => {
  const quotient = dividend / divisor;
  return dividend % divisor !== 0n && dividend < 0n !== divisor < 0n ? quotient - 1n : quotient;
};

// mpz gcd(a, b, x, y, g): a*x + b*y = g.
const getExtendedGcd = (first: bigint, second: bigint) => {
  let [oldR, r] = [first, second];
  let [oldS, s] = [1n, 0n];
  let [oldT, t] = [0n, 1n];
  while (r !== 0n) {
    const quotient = oldR / r;
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
    [oldT, t] = [t, oldT - quotient * t];
  }
  return oldR < 0n ? { x: -oldS, y: -oldT, gcd: -oldR } : { x: oldS, y: oldT, gcd: oldR };
};

const trim = (coeffs: bigint[]) => {
  let size = coeffs.length;
  while (size > 0 && coeffs[size - 1] === 0n) size--;
  coeffs.length = size;
  return coeffs;
};

export interface IsolatedRoots {
  roots: Mpbq[];
  lowers: Mpbq[];
  uppers: Mpbq[];
}

// An interval (a, b) refined around the root of a square-free polynomial, or the root itself.
export interface Refinement {
  isInterval: boolean;
  lower: Mpbq;
  upper: Mpbq;
}

interface DrsFrame {
  parent: number;
  coeffs: bigint[];
  isFirst: boolean;
  isLeft: boolean;
}

export class UpolynomialManager {
  // Z_p when set, else Z. Coefficients over Z_p lie in the symmetric range around zero. Hensel
  // lifting also sets a prime power.
  private isPrimeModulus = true;

  constructor(private modulus: bigint | null = null) {}

  get zp() {
    return this.modulus;
  }

  // field: Z_p for a prime p. Over a prime power, division falls back to pseudo-division.
  private get isField() {
    return this.modulus !== null && this.isPrimeModulus;
  }

  // set_zp
  setZp(prime: bigint) {
    this.modulus = prime;
    this.isPrimeModulus = true;
  }

  // set_p_sq: from Z_m to Z_(m^2).
  squareModulus() {
    if (this.modulus === null) throw new SmtInvariantError("squaring the modulus of Z");
    this.modulus *= this.modulus;
    this.isPrimeModulus = false;
  }

  // scoped_set_zp
  withZp<T>(prime: bigint, body: () => T) {
    const savedModulus = this.modulus;
    const savedIsPrime = this.isPrimeModulus;
    this.setZp(prime);
    const result = body();
    this.modulus = savedModulus;
    this.isPrimeModulus = savedIsPrime;
    return result;
  }

  // Numerals.

  // p_normalize
  normalizeNumeral(value: bigint) {
    const modulus = this.modulus;
    if (modulus === null) return value;
    const upper = modulus / 2n;
    const lower = modulus % 2n === 0n ? -upper + 1n : -upper;
    const rest = value % modulus;
    return rest > upper ? rest - modulus : rest < lower ? rest + modulus : rest;
  }

  inv(value: bigint) {
    const modulus = this.modulus;
    if (modulus === null) throw new SmtInvariantError("inverse over Z");
    return this.normalizeNumeral(getExtendedGcd(this.normalizeNumeral(value), modulus).x);
  }

  // mpzzp div: exact over Z (rounding toward minus infinity), multiplication by the inverse over Z_p.
  private divNumeral(dividend: bigint, divisor: bigint) {
    return this.modulus === null
      ? floorDiv(dividend, divisor)
      : this.normalizeNumeral(dividend * this.inv(divisor));
  }

  private dividesNumeral(divisor: bigint, dividend: bigint) {
    if (this.isField && divisor !== 0n) return true;
    return divisor === 0n ? dividend === 0n : dividend % divisor === 0n;
  }

  // set: the coefficients reduced to the current ring.
  set(coeffs: Upolynomial) {
    return trim(coeffs.map((coeff) => this.normalizeNumeral(coeff)));
  }

  // Core operations.

  getContent(coeffs: Upolynomial) {
    let content = 0n;
    for (const coeff of coeffs) content = getGcd(content, coeff);
    return content;
  }

  getPrimitive(coeffs: Upolynomial) {
    const content = this.getContent(coeffs);
    return content === 1n ? [...coeffs] : trim(coeffs.map((coeff) => coeff / content));
  }

  neg(coeffs: Upolynomial) {
    return coeffs.map((coeff) => this.normalizeNumeral(-coeff));
  }

  add(first: Upolynomial, second: Upolynomial) {
    const size = Math.max(first.length, second.length);
    return trim(
      Array.from({ length: size }, (_unused, index) =>
        this.normalizeNumeral((first[index] ?? 0n) + (second[index] ?? 0n)),
      ),
    );
  }

  sub(first: Upolynomial, second: Upolynomial) {
    const size = Math.max(first.length, second.length);
    return trim(
      Array.from({ length: size }, (_unused, index) =>
        this.normalizeNumeral((first[index] ?? 0n) - (second[index] ?? 0n)),
      ),
    );
  }

  mul(first: Upolynomial, second: Upolynomial) {
    if (first.length === 0 || second.length === 0) return [];
    const result = Array.from({ length: first.length + second.length - 1 }, () => 0n);
    for (let index = 0; index < first.length; index++) {
      if (first[index] === 0n) continue;
      for (let other = 0; other < second.length; other++)
        if (second[other] !== 0n)
          result[index + other] = this.normalizeNumeral(
            result[index + other] + first[index] * second[other],
          );
    }
    return trim(result);
  }

  mulConst(coeffs: Upolynomial, factor: bigint) {
    if (factor === 0n) return [];
    return trim(coeffs.map((coeff) => this.normalizeNumeral(coeff * factor)));
  }

  // div(p, b): each coefficient divided by b, which divides it.
  divConst(coeffs: Upolynomial, divisor: bigint) {
    if (divisor === 1n) return [...coeffs];
    return trim(coeffs.map((coeff) => this.divNumeral(coeff, divisor)));
  }

  derivative(coeffs: Upolynomial) {
    if (coeffs.length <= 1) return [];
    return trim(
      coeffs.slice(1).map((coeff, index) => this.normalizeNumeral(coeff * BigInt(index + 1))),
    );
  }

  // normalize: the coefficients divided by their gcd, or the sign of a constant.
  normalize(coeffs: Upolynomial) {
    if (coeffs.length === 0) return [];
    if (coeffs.length === 1) return [coeffs[0] > 0n ? 1n : this.normalizeNumeral(-1n)];
    const content = this.getContent(coeffs);
    if (content === 1n) return [...coeffs];
    return coeffs.map((coeff) => this.divNumeral(coeff, content));
  }

  flipSignIfLmNeg(coeffs: Upolynomial) {
    return coeffs.length > 0 && coeffs[coeffs.length - 1] < 0n ? this.neg(coeffs) : [...coeffs];
  }

  // mk_monic: the polynomial divided by its leading coefficient, over Z_p.
  mkMonic(coeffs: Upolynomial) {
    if (coeffs.length === 0 || coeffs[coeffs.length - 1] === 1n) return [...coeffs];
    const inverse = this.inv(coeffs[coeffs.length - 1]);
    return coeffs.map((coeff, index) =>
      index === coeffs.length - 1 ? 1n : this.normalizeNumeral(coeff * inverse),
    );
  }

  // div_rem: q and r with lc(p2)^d * p1 = q * p2 + r over Z, or p1 = q * p2 + r over a field.
  divRem(dividend: Upolynomial, divisor: Upolynomial) {
    const isField = this.isField;
    if (divisor.length === 1) {
      const quotient = isField ? this.divConst(dividend, divisor[0]) : this.set(dividend);
      return { quotient, remainder: [] as bigint[], power: 0 };
    }
    const remainder = this.set(dividend);
    if (dividend.length <= 1) return { quotient: [] as bigint[], remainder, power: 0 };
    const quotientSize =
      dividend.length >= divisor.length ? dividend.length - divisor.length + 1 : 0;
    const quotient = Array.from({ length: quotientSize }, () => 0n);
    const leading = divisor[divisor.length - 1];
    let power = 0;
    while (remainder.length >= divisor.length) {
      const size = remainder.length;
      const shift = size - divisor.length;
      if (isField) {
        const ratio = this.divNumeral(remainder[size - 1], leading);
        quotient[shift] = this.normalizeNumeral(quotient[shift] + ratio);
        for (let index = 0; index < divisor.length - 1; index++)
          remainder[index + shift] = this.normalizeNumeral(
            remainder[index + shift] - ratio * divisor[index],
          );
      } else {
        power++;
        const top = remainder[size - 1];
        for (let index = 0; index < size - 1; index++)
          remainder[index] = this.normalizeNumeral(remainder[index] * leading);
        for (let index = 0; index < quotientSize; index++)
          quotient[index] = this.normalizeNumeral(quotient[index] * leading);
        quotient[shift] = this.normalizeNumeral(quotient[shift] + top);
        for (let index = 0; index < divisor.length - 1; index++)
          remainder[index + shift] = this.normalizeNumeral(
            remainder[index + shift] - top * divisor[index],
          );
      }
      remainder.length = size - 1;
      trim(remainder);
    }
    return { quotient: trim(quotient), remainder, power };
  }

  div(dividend: Upolynomial, divisor: Upolynomial) {
    return this.divRem(dividend, divisor).quotient;
  }

  // rem: the pseudo-remainder, with the number of pseudo-division steps.
  remWithPower(dividend: Upolynomial, divisor: Upolynomial) {
    if (divisor.length === 1) return { remainder: [] as bigint[], power: 0 };
    const remainder = this.set(dividend);
    if (dividend.length <= 1) return { remainder, power: 0 };
    const isField = this.isField;
    const leading = divisor[divisor.length - 1];
    let power = 0;
    while (remainder.length >= divisor.length) {
      const size = remainder.length;
      const shift = size - divisor.length;
      if (isField) {
        const ratio = this.divNumeral(remainder[size - 1], leading);
        for (let index = 0; index < divisor.length - 1; index++)
          remainder[index + shift] = this.normalizeNumeral(
            remainder[index + shift] - ratio * divisor[index],
          );
      } else {
        power++;
        const top = remainder[size - 1];
        for (let index = 0; index < size - 1; index++)
          remainder[index] = this.normalizeNumeral(remainder[index] * leading);
        for (let index = 0; index < divisor.length - 1; index++)
          remainder[index + shift] = this.normalizeNumeral(
            remainder[index + shift] - top * divisor[index],
          );
      }
      remainder.length = size - 1;
      trim(remainder);
    }
    return { remainder, power };
  }

  rem(dividend: Upolynomial, divisor: Upolynomial) {
    return this.remWithPower(dividend, divisor).remainder;
  }

  // srem: the signed pseudo-remainder, negated unless an odd number of steps by a negative leading
  // coefficient already flipped it.
  srem(dividend: Upolynomial, divisor: Upolynomial) {
    const result = this.remWithPower(dividend, divisor);
    return result.power % 2 === 0 || (divisor.length > 0 && divisor[divisor.length - 1] > 0n)
      ? this.neg(result.remainder)
      : result.remainder;
  }

  // divides: whether divisor divides dividend, checking only the leading coefficients.
  divides(dividend: Upolynomial, divisor: Upolynomial) {
    if (divisor.length === 0) return false;
    if (dividend.length === 0) return true;
    const leading = divisor[divisor.length - 1];
    const rest = this.set(dividend);
    while (rest.length > 0) {
      if (divisor.length > rest.length || !this.dividesNumeral(leading, rest[rest.length - 1]))
        return false;
      const shift = rest.length - divisor.length;
      const ratio = this.divNumeral(rest[rest.length - 1], leading);
      for (let index = 0; index < divisor.length - 1; index++)
        if (divisor[index] !== 0n)
          rest[index + shift] = this.normalizeNumeral(rest[index + shift] - ratio * divisor[index]);
      rest[rest.length - 1] = 0n;
      trim(rest);
    }
    return true;
  }

  // exact_div: dividend / divisor when the division is exact, else null.
  exactDiv(dividend: Upolynomial, divisor: Upolynomial): bigint[] | null {
    if (divisor.length === 0) return null;
    if (dividend.length === 0) return [];
    const leading = divisor[divisor.length - 1];
    if (divisor.length > dividend.length) return null;
    const result = Array.from({ length: dividend.length - divisor.length + 1 }, () => 0n);
    const rest = this.set(dividend);
    while (rest.length > 0) {
      if (
        divisor.length > rest.length ||
        !this.dividesNumeral(leading, rest[rest.length - 1]) ||
        !this.dividesNumeral(divisor[0], rest[0])
      )
        return null;
      const shift = rest.length - divisor.length;
      const ratio = this.divNumeral(rest[rest.length - 1], leading);
      result[shift] = ratio;
      for (let index = 0; index < divisor.length - 1; index++)
        if (divisor[index] !== 0n)
          rest[index + shift] = this.normalizeNumeral(rest[index + shift] - ratio * divisor[index]);
      rest[rest.length - 1] = 0n;
      trim(rest);
    }
    return trim(result);
  }

  // GCD.

  private euclidGcd(first: Upolynomial, second: Upolynomial) {
    if (first.length === 0) return this.flipSignIfLmNeg(this.set(second));
    if (second.length === 0) return this.flipSignIfLmNeg(this.set(first));
    let a = this.set(first);
    let b = this.set(second);
    while (b.length > 0) {
      const remainder = this.normalize(this.rem(a, b));
      a = b;
      b = remainder;
    }
    const normalized = this.normalize(a);
    return this.isField ? this.mkMonic(normalized) : this.flipSignIfLmNeg(normalized);
  }

  // CRA_combine_images: the image modulo bound * prime, in the symmetric range.
  private combineImages(image: Upolynomial, prime: bigint, combined: Upolynomial, bound: bigint) {
    const inverses = getExtendedGcd(prime, bound);
    const mod = (value: bigint, modulus: bigint) => ((value % modulus) + modulus) % modulus;
    const inverse1 = mod(inverses.x, bound);
    const inverse2 = mod(inverses.y, prime);
    const factor1 = bound * inverse2;
    const factor2 = prime * inverse1;
    const newBound = prime * bound;
    const upper = newBound / 2n;
    const size = Math.max(image.length, combined.length);
    const result: bigint[] = [];
    for (let index = 0; index < size; index++) {
      const value = mod(
        (image[index] ?? 0n) * factor1 + (combined[index] ?? 0n) * factor2,
        newBound,
      );
      result.push(value > upper ? value - newBound : value);
    }
    return { coeffs: result, bound: newBound };
  }

  // mod_gcd: the gcd over Z from images modulo big primes, combined by the Chinese remainder theorem.
  private modGcd(first: Upolynomial, second: Upolynomial) {
    const contentU = this.getContent(first);
    const contentV = this.getContent(second);
    const ppU = this.getPrimitive(first);
    const ppV = this.getPrimitive(second);
    const contentG = getGcd(contentU, contentV);
    const degreeU = first.length - 1;
    const degreeV = second.length - 1;
    const lcG = getGcd(ppU[degreeU], ppV[degreeV]);
    let combined: bigint[] = [];
    let bound = 0n;
    for (const prime of BIG_PRIMES) {
      const image = this.withZp(prime, () => {
        const uZp = this.set(ppU);
        const vZp = this.set(ppV);
        if (uZp.length - 1 < degreeU || vZp.length - 1 < degreeV) return null;
        return this.mulConst(this.mkMonic(this.euclidGcd(uZp, vZp)), lcG);
      });
      if (image === null) continue;
      if (image.length <= 1) return [contentG];
      // The first image, or one of lower degree, replaces the accumulated image. Before the first
      // image the bound is zero, which is even.
      if (image.length < combined.length || bound % 2n === 0n) {
        combined = image;
        bound = prime;
      } else {
        const next = this.combineImages(image, prime, combined, bound);
        combined = next.coeffs;
        bound = next.bound;
      }
      const candidate = this.getPrimitive(combined);
      if (
        this.dividesNumeral(candidate[candidate.length - 1], lcG) &&
        this.divides(ppU, candidate) &&
        this.divides(ppV, candidate)
      )
        return this.flipSignIfLmNeg(this.mulConst(candidate, contentG));
    }
    return this.euclidGcd(first, second);
  }

  gcd(first: Upolynomial, second: Upolynomial) {
    if (first.length === 0) return this.flipSignIfLmNeg(this.set(second));
    if (second.length === 0) return this.flipSignIfLmNeg(this.set(first));
    return this.modulus === null ? this.modGcd(first, second) : this.euclidGcd(first, second);
  }

  // square_free: p divided by gcd(p, p'), normalized.
  squareFree(coeffs: Upolynomial) {
    if (coeffs.length <= 1) return this.set(coeffs);
    const common = this.gcd(coeffs, this.derivative(coeffs));
    return common.length <= 1 ? this.set(coeffs) : this.normalize(this.div(coeffs, common));
  }

  isSquareFree(coeffs: Upolynomial) {
    return coeffs.length <= 1 || this.gcd(coeffs, this.derivative(coeffs)).length <= 1;
  }

  pw(coeffs: Upolynomial, exponent: number) {
    if (exponent === 0) return [1n];
    let result = this.set(coeffs);
    for (let index = 1; index < exponent; index++) result = this.mul(result, coeffs);
    return result;
  }

  // ext_gcd over Z_p: u, v and the monic d with a*u + b*v = d.
  extGcd(first: Upolynomial, second: Upolynomial) {
    let u: bigint[] = [1n];
    let d = this.mkMonic(this.set(first));
    let v1: bigint[] = [];
    let v3 = this.set(second);
    while (v3.length > 0) {
      const division = this.divRem(d, v3);
      const t = this.sub(u, this.mul(v1, division.quotient));
      u = v1;
      d = v3;
      v1 = t;
      v3 = division.remainder;
    }
    const v = this.div(this.sub(d, this.mul(first, u)), second);
    if (d.length === 0 || d[d.length - 1] === 1n) return { u, v, d };
    const inverse = this.inv(d[d.length - 1]);
    return {
      u: this.mulConst(u, inverse),
      v: this.mulConst(v, inverse),
      d: this.mkMonic(d),
    };
  }

  // Transformations.

  hasZeroRoots(coeffs: Upolynomial) {
    return coeffs.length > 0 && coeffs[0] === 0n;
  }

  removeZeroRoots(coeffs: Upolynomial) {
    let index = 0;
    while (coeffs[index] === 0n) index++;
    return coeffs.slice(index);
  }

  // has_one_half_root: 2^n * p(1/2) = 0.
  private hasOneHalfRoot(coeffs: Upolynomial) {
    if (coeffs.length === 0) return true;
    if (coeffs.length === 1) return false;
    let result = coeffs[coeffs.length - 1];
    for (let index = coeffs.length - 2, shift = 1n; index >= 0; index--, shift++)
      result += coeffs[index] << shift;
    return result === 0n;
  }

  // descartes_bound_0_1: the sign changes of (x+1)^n p(1/(x+1)), stopping above 1.
  private descartesBound01(coeffs: Upolynomial) {
    if (coeffs.length <= 1) return 0;
    const work = [...coeffs];
    let previous = 0;
    let changes = 0;
    for (let index = 0; index < work.length; index++) {
      let position = 1;
      for (; position < work.length - index; position++) work[position] += work[position - 1];
      const current = sign(work[position - 1]);
      if (current === 0) continue;
      if (current !== previous && previous !== 0) {
        changes++;
        if (changes > 1) return changes;
      }
      previous = current;
    }
    return changes;
  }

  // translate: p(x + 1).
  translate(coeffs: Upolynomial) {
    const result = [...coeffs];
    const degree = result.length - 1;
    for (let step = 1; step <= degree; step++)
      for (let index = degree - step; index <= degree - 1; index++)
        result[index] += result[index + 1];
    return result;
  }

  // translate_q: den^n * p(x + q).
  translateQ(coeffs: Upolynomial, value: Rational) {
    if (coeffs.length <= 1) return [...coeffs];
    const result = this.composeAnPxDivA(coeffs, value.den);
    const degree = result.length - 1;
    for (let step = 1; step <= degree; step++) {
      result[degree - step] += value.num * result[degree - step + 1];
      for (let index = degree - step + 1; index <= degree - 1; index++)
        result[index] = result[index] * value.den + value.num * result[index + 1];
      result[degree] *= value.den;
    }
    return result;
  }

  // compose_2n_p_x_div_2: 2^n * p(x/2).
  private compose2nPxDiv2(coeffs: Upolynomial) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) => coeff << BigInt(degree - index));
  }

  // p_minus_x: p(-x).
  pMinusX(coeffs: Upolynomial) {
    return coeffs.map((coeff, index) => (index % 2 === 1 && coeff !== 0n ? -coeff : coeff));
  }

  // p_1_div_x: x^n * p(1/x).
  p1DivX(coeffs: Upolynomial) {
    return [...coeffs].reverse();
  }

  // compose_p_2k_x: p(2^k * x).
  private composeP2kX(coeffs: Upolynomial, k: number) {
    return coeffs.map((coeff, index) => coeff << BigInt(k * index));
  }

  // compose_an_p_x_div_a: a^n * p(x/a).
  private composeAnPxDivA(coeffs: Upolynomial, factor: bigint) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) =>
      coeff === 0n ? 0n : coeff * factor ** BigInt(degree - index),
    );
  }

  // compose_p_q_x: c^n * p(b*x/c) for q = b/c.
  composePQX(coeffs: Upolynomial, value: Rational) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) =>
      coeff === 0n ? 0n : coeff * value.den ** BigInt(degree - index) * value.num ** BigInt(index),
    );
  }

  // Signs.

  // eval_sign_at for a binary rational: the sign of (2^k)^n * p(b).
  evalSignAtBq(coeffs: Upolynomial, value: Mpbq) {
    if (coeffs.length === 0) return 0;
    if (coeffs.length === 1) return sign(coeffs[0]);
    let result = coeffs[coeffs.length - 1];
    let shift = value.k;
    for (let index = coeffs.length - 2; index >= 0; index--, shift += value.k)
      result =
        coeffs[index] === 0n
          ? result * value.num
          : (coeffs[index] << BigInt(shift)) + result * value.num;
    return sign(result);
  }

  evalSignAtQ(coeffs: Upolynomial, value: Rational) {
    if (coeffs.length === 0) return 0;
    if (coeffs.length === 1) return sign(coeffs[0]);
    let result = coeffs[coeffs.length - 1];
    let denominator = value.den;
    for (let index = coeffs.length - 2; index >= 0; index--, denominator *= value.den)
      result =
        coeffs[index] === 0n
          ? result * value.num
          : coeffs[index] * denominator + result * value.num;
    return sign(result);
  }

  evalSignAtZero(coeffs: Upolynomial) {
    return coeffs.length === 0 ? 0 : sign(coeffs[0]);
  }

  evalSignAtPlusInf(coeffs: Upolynomial) {
    return coeffs.length === 0 ? 0 : sign(coeffs[coeffs.length - 1]);
  }

  evalSignAtMinusInf(coeffs: Upolynomial) {
    if (coeffs.length === 0) return 0;
    const leading = sign(coeffs[coeffs.length - 1]);
    return (coeffs.length - 1) % 2 === 0 ? leading : -leading;
  }

  private countSignVariations(signs: number[]) {
    if (signs.length <= 1) return 0;
    let variations = 0;
    let previous = 0;
    for (const current of signs) {
      if (current === 0) continue;
      if (current !== previous && previous !== 0) variations++;
      previous = current;
    }
    return variations;
  }

  signVariationsAtMinusInf(sequence: Upolynomial[]) {
    return this.countSignVariations(sequence.map((coeffs) => this.evalSignAtMinusInf(coeffs)));
  }

  signVariationsAtPlusInf(sequence: Upolynomial[]) {
    return this.countSignVariations(sequence.map((coeffs) => this.evalSignAtPlusInf(coeffs)));
  }

  signVariationsAtZero(sequence: Upolynomial[]) {
    return this.countSignVariations(sequence.map((coeffs) => this.evalSignAtZero(coeffs)));
  }

  signVariationsAt(sequence: Upolynomial[], value: Mpbq) {
    return this.countSignVariations(sequence.map((coeffs) => this.evalSignAtBq(coeffs, value)));
  }

  // Root bounds.

  // knuth_positive_root_upper_bound: k with every positive root below 2^k.
  knuthPositiveRootUpperBound(coeffs: Upolynomial) {
    if (coeffs.length === 0) return 0;
    let max = 0;
    const degree = coeffs.length - 1;
    const isLeadingPositive = coeffs[degree] > 0n;
    const log2Leading = getLog2(coeffs[degree]);
    for (let k = 1; k <= degree; k++) {
      const coeff = coeffs[degree - k];
      if (coeff === 0n || coeff > 0n === isLeadingPositive) continue;
      const log2Coeff = getLog2(coeff);
      if (log2Leading > log2Coeff) continue;
      const current = log2Coeff + 1 - log2Leading;
      const bound = current % k === 0 ? current / k : Math.floor(current / k) + 1;
      if (bound > max) max = bound;
    }
    return max + 1;
  }

  knuthNegativeRootUpperBound(coeffs: Upolynomial) {
    return this.knuthPositiveRootUpperBound(this.pMinusX(coeffs));
  }

  // nonzero_root_lower_bound: k with every nonzero root of absolute value above 1/2^k.
  nonzeroRootLowerBound(coeffs: Upolynomial) {
    const reversed = this.removeZeroRoots(coeffs).reverse();
    return Math.max(
      this.knuthPositiveRootUpperBound(reversed),
      this.knuthNegativeRootUpperBound(reversed),
    );
  }

  // Root isolation by Descartes' rule of signs.

  // push_child_frames: the halves (0, 1/2) and (1/2, 1), as 2^n p(x/2) and its translation.
  private pushChildFrames(coeffs: Upolynomial, frames: DrsFrame[]) {
    const parent = frames.length - 1;
    const left = this.normalize(this.compose2nPxDiv2(coeffs));
    frames.push({ parent, coeffs: left, isFirst: true, isLeft: true });
    frames.push({
      parent,
      coeffs: this.normalize(this.translate(left)),
      isFirst: true,
      isLeft: false,
    });
  }

  // The interval (0, 1), or the point 1/2, of the top frame mapped back through its ancestors.
  private mapToRoot(frames: DrsFrame[], value: Mpbq) {
    let result = value;
    for (let index = frames.length - 1; index !== -1; index = frames[index].parent)
      result = frames[index].isLeft ? result.div2() : result.add(Mpbq.one).div2();
    return result;
  }

  private drsIsolate01Roots(coeffs: Upolynomial, result: IsolatedRoots) {
    const bound = this.descartesBound01(coeffs);
    if (bound === 0) return;
    if (bound === 1) {
      result.lowers.push(Mpbq.zero);
      result.uppers.push(Mpbq.one);
      return;
    }
    const half = Mpbq.of(1n, 1);
    const frames: DrsFrame[] = [];
    const twoXMinusOne = [-1n, 2n];
    if (this.hasOneHalfRoot(coeffs)) {
      result.roots.push(half);
      this.pushChildFrames(this.div(coeffs, twoXMinusOne), frames);
    } else this.pushChildFrames(coeffs, frames);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1];
      if (!frame.isFirst) {
        frames.pop();
        continue;
      }
      frame.isFirst = false;
      const frameBound = this.descartesBound01(frame.coeffs);
      if (frameBound === 0) {
        frames.pop();
        continue;
      }
      if (frameBound === 1) {
        result.lowers.push(this.mapToRoot(frames, Mpbq.zero));
        result.uppers.push(this.mapToRoot(frames, Mpbq.one));
        frames.pop();
        continue;
      }
      if (this.hasOneHalfRoot(frame.coeffs)) {
        result.roots.push(this.mapToRoot(frames, half));
        this.pushChildFrames(this.div(frame.coeffs, twoXMinusOne), frames);
      } else this.pushChildFrames(frame.coeffs, frames);
    }
  }

  // drs_isolate_roots: the positive roots in (0, 2^k) and the negative ones in (-2^k', 0), each
  // found as the roots in (0, 1) of p(2^k x) or p(-2^k' x) and scaled back.
  private drsIsolateRoots(coeffs: Upolynomial, result: IsolatedRoots) {
    const normalized = this.normalize(coeffs);
    const negativeK = this.knuthNegativeRootUpperBound(coeffs);
    const positiveK = Math.max(negativeK, this.knuthPositiveRootUpperBound(coeffs));
    const isolateScaled = (scaled: Upolynomial, k: number, isNegated: boolean) => {
      const rootsStart = result.roots.length;
      const boundsStart = result.lowers.length;
      this.drsIsolate01Roots(this.composeP2kX(scaled, k), result);
      const adjust = (values: Mpbq[], start: number) => {
        for (let index = start; index < values.length; index++) {
          const value = values[index].mul2k(k);
          values[index] = isNegated ? value.neg() : value;
        }
      };
      adjust(result.roots, rootsStart);
      adjust(result.lowers, boundsStart);
      adjust(result.uppers, boundsStart);
      return boundsStart;
    };
    isolateScaled(normalized, positiveK, false);
    const negativeStart = isolateScaled(this.pMinusX(normalized), negativeK, true);
    for (let index = negativeStart; index < result.lowers.length; index++) {
      const lower = result.lowers[index];
      result.lowers[index] = result.uppers[index];
      result.uppers[index] = lower;
    }
  }

  // sqf_isolate_roots: the roots of a square-free polynomial, exact roots first when zero is one,
  // then the isolating intervals of the others.
  sqfIsolateRoots(coeffs: Upolynomial): IsolatedRoots {
    const result: IsolatedRoots = { roots: [], lowers: [], uppers: [] };
    if (this.hasZeroRoots(coeffs)) {
      result.roots.push(Mpbq.zero);
      this.drsIsolateRoots(this.removeZeroRoots(coeffs), result);
    } else this.drsIsolateRoots(coeffs, result);
    return result;
  }

  // Sturm sequences.

  private sturmSeqCore(sequence: bigint[][]) {
    while (true) {
      const remainder = this.srem(sequence[sequence.length - 2], sequence[sequence.length - 1]);
      if (remainder.length === 0) return sequence;
      sequence.push(this.normalize(remainder));
    }
  }

  sturmSeq(coeffs: Upolynomial) {
    return this.sturmSeqCore([[...coeffs], this.derivative(coeffs)]);
  }

  sturmTarskiSeq(first: Upolynomial, second: Upolynomial) {
    return this.sturmSeqCore([[...first], this.mul(this.derivative(first), second)]);
  }

  // Refinement.

  // isolating2refinable: an isolating interval of a square-free polynomial turned into one whose
  // endpoint signs differ, or the root it contains.
  isolating2refinable(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq): Refinement {
    const signLower = this.evalSignAtBq(coeffs, lower);
    const signUpper = this.evalSignAtBq(coeffs, upper);
    if (signLower !== 0 && signUpper !== 0) return { isInterval: true, lower, upper };
    if (signLower === 0 && signUpper !== 0) {
      let a = lower;
      let b = upper;
      let newA = a.add(b).div2();
      while (true) {
        const signNewA = this.evalSignAtBq(coeffs, newA);
        if (signNewA !== signUpper) return { isInterval: signNewA !== 0, lower: newA, upper: b };
        b = newA;
        newA = b.add(a).div2();
      }
    }
    if (signLower !== 0 && signUpper === 0) {
      let a = lower;
      let b = upper;
      let newB = a.add(b).div2();
      while (true) {
        const signNewB = this.evalSignAtBq(coeffs, newB);
        if (signNewB !== signLower)
          return signNewB === 0
            ? { isInterval: false, lower: newB, upper: b }
            : { isInterval: true, lower: a, upper: newB };
        a = newB;
        newB = b.add(a).div2();
      }
    }
    const a1 = lower;
    const b2 = upper;
    let b1 = a1.add(b2).div2();
    let a2 = b1;
    const signB1 = this.evalSignAtBq(coeffs, b1);
    const signA2 = signB1;
    if (signB1 === 0) return { isInterval: false, lower: b1, upper };
    let newA1 = a1.add(b1).div2();
    let newB2 = a2.add(b2).div2();
    while (true) {
      const signNewA1 = this.evalSignAtBq(coeffs, newA1);
      if (signNewA1 === 0) return { isInterval: false, lower: newA1, upper };
      if (signNewA1 === -signB1) return { isInterval: true, lower: newA1, upper: b1 };
      const signNewB2 = this.evalSignAtBq(coeffs, newB2);
      if (signNewB2 === 0) return { isInterval: false, lower: newB2, upper };
      if (signNewB2 === -signA2) return { isInterval: true, lower: a2, upper: newB2 };
      b1 = newA1;
      newA1 = b1.add(a1).div2();
      a2 = newB2;
      newB2 = b2.add(a2).div2();
    }
  }

  // refine_core: one bisection of a refinable interval, or the root at its midpoint.
  refineCore(coeffs: Upolynomial, signLower: number, lower: Mpbq, upper: Mpbq): Refinement {
    const middle = lower.add(upper).div2();
    const signMiddle = this.evalSignAtBq(coeffs, middle);
    if (signMiddle === 0) return { isInterval: false, lower: middle, upper };
    return signMiddle === signLower
      ? { isInterval: true, lower: middle, upper }
      : { isInterval: true, lower, upper: middle };
  }

  refine(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq) {
    return this.refineCore(coeffs, this.evalSignAtBq(coeffs, lower), lower, upper);
  }

  // refine_core with a precision: bisects until the interval is narrower than 1/2^k.
  refineToPrecision(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq, precision: number): Refinement {
    const signLower = this.evalSignAtBq(coeffs, lower);
    let current: Refinement = { isInterval: true, lower, upper };
    while (true) {
      if (current.upper.sub(current.lower).isLessThanOneDiv2k(precision)) return current;
      current = this.refineCore(coeffs, signLower, current.lower, current.upper);
      if (!current.isInterval) return current;
    }
  }

  // convert_q2bq_interval: a rational isolating interval (a, b) as a binary rational one (c, d), or
  // the root itself in c.
  convertQ2bqInterval(coeffs: Upolynomial, a: Rational, b: Rational): Refinement {
    const signA = this.evalSignAtQ(coeffs, a);
    const signB = this.evalSignAtQ(coeffs, b);
    let c = Mpbq.zero;
    let d = Mpbq.zero;
    let isFoundD = false;
    const lowerOfA = Mpbq.fromRational(a);
    if (lowerOfA.isExact) c = lowerOfA.value;
    else {
      let lower = lowerOfA.value;
      let upper = lower.mul2k(1);
      if (a.num < 0n) [lower, upper] = [upper, lower];
      while (upper.compareRational(b) >= 0) {
        const refined = refineUpper(a, lower, upper);
        lower = refined.lower;
        upper = refined.upper;
      }
      while (true) {
        const signUpper = this.evalSignAtBq(coeffs, upper);
        if (signUpper === 0) return { isInterval: false, lower: upper, upper };
        if (signUpper === signA) {
          c = upper;
          break;
        }
        if (!isFoundD) {
          isFoundD = true;
          d = upper;
        }
        const refined = refineUpper(a, lower, upper);
        lower = refined.lower;
        upper = refined.upper;
      }
    }
    if (isFoundD) return { isInterval: true, lower: c, upper: d };
    const lowerOfB = Mpbq.fromRational(b);
    if (lowerOfB.isExact) return { isInterval: true, lower: c, upper: lowerOfB.value };
    let lower = lowerOfB.value;
    let upper = lower.mul2k(1);
    if (b.num < 0n) [lower, upper] = [upper, lower];
    while (lower.compare(c) <= 0) {
      const refined = refineLower(b, lower, upper);
      lower = refined.lower;
      upper = refined.upper;
    }
    while (true) {
      const signLower = this.evalSignAtBq(coeffs, lower);
      if (signLower === 0) return { isInterval: false, lower, upper };
      if (signLower === signB) return { isInterval: true, lower: c, upper: lower };
      const refined = refineLower(b, lower, upper);
      lower = refined.lower;
      upper = refined.upper;
    }
  }

  // normalize_interval_core: a refinable interval around zero shrunk to the side of zero holding
  // the root, given the sign at its lower end. Null when zero is the root.
  normalizeInterval(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq, signLower: number) {
    if (!(lower.isNeg && upper.isPos)) return { lower, upper };
    if (this.hasZeroRoots(coeffs)) return null;
    return signLower === this.evalSignAtZero(coeffs)
      ? { lower: Mpbq.zero, upper }
      : { lower, upper: Mpbq.zero };
  }

  // get_root_id: the number of roots up to l.
  getRootId(coeffs: Upolynomial, lower: Mpbq) {
    const sequence = this.sturmSeq(coeffs);
    return this.signVariationsAtMinusInf(sequence) - this.signVariationsAt(sequence, lower);
  }
}

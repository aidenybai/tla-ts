// Ported from Z3 (src/math/polynomial/upolynomial.{h,cpp}, src/util/mpzzp.h,
// src/math/polynomial/polynomial_primes.h), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../../errors";
import { getGcd, Rational } from "../rational";
import { getLog2, Mpbq, refineLower, refineUpper } from "./mpbq";

export type Upolynomial = readonly bigint[];

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

const getSign = (value: bigint) => (value > 0n ? 1 : value < 0n ? -1 : 0);

export const floorDiv = (dividend: bigint, divisor: bigint) => {
  const quotient = dividend / divisor;
  return dividend % divisor !== 0n && dividend < 0n !== divisor < 0n ? quotient - 1n : quotient;
};

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

interface IsolatedRoots {
  roots: Mpbq[];
  lowers: Mpbq[];
  uppers: Mpbq[];
}

interface Refinement {
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
  private isPrimeModulus = true;

  constructor(private modulus: bigint | null = null) {}

  get zp() {
    return this.modulus;
  }

  private get isField() {
    return this.modulus !== null && this.isPrimeModulus;
  }

  setZp(prime: bigint) {
    this.modulus = prime;
    this.isPrimeModulus = true;
  }

  squareModulus() {
    if (this.modulus === null) throw new SmtInvariantError("squaring the modulus of Z");
    this.modulus *= this.modulus;
    this.isPrimeModulus = false;
  }

  withZp<T>(prime: bigint, body: () => T) {
    const savedModulus = this.modulus;
    const savedIsPrime = this.isPrimeModulus;
    this.setZp(prime);
    const result = body();
    this.modulus = savedModulus;
    this.isPrimeModulus = savedIsPrime;
    return result;
  }

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

  private divNumeral(dividend: bigint, divisor: bigint) {
    return this.modulus === null
      ? floorDiv(dividend, divisor)
      : this.normalizeNumeral(dividend * this.inv(divisor));
  }

  private dividesNumeral(divisor: bigint, dividend: bigint) {
    if (this.isField && divisor !== 0n) return true;
    return divisor === 0n ? dividend === 0n : dividend % divisor === 0n;
  }

  set(coeffs: Upolynomial) {
    return trim(coeffs.map((coeff) => this.normalizeNumeral(coeff)));
  }

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

  mkMonic(coeffs: Upolynomial) {
    if (coeffs.length === 0 || coeffs[coeffs.length - 1] === 1n) return [...coeffs];
    const inverse = this.inv(coeffs[coeffs.length - 1]);
    return coeffs.map((coeff, index) =>
      index === coeffs.length - 1 ? 1n : this.normalizeNumeral(coeff * inverse),
    );
  }

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

  srem(dividend: Upolynomial, divisor: Upolynomial) {
    const result = this.remWithPower(dividend, divisor);
    return result.power % 2 === 0 || (divisor.length > 0 && divisor[divisor.length - 1] > 0n)
      ? this.neg(result.remainder)
      : result.remainder;
  }

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

  hasZeroRoots(coeffs: Upolynomial) {
    return coeffs.length > 0 && coeffs[0] === 0n;
  }

  removeZeroRoots(coeffs: Upolynomial) {
    let index = 0;
    while (coeffs[index] === 0n) index++;
    return coeffs.slice(index);
  }

  private hasOneHalfRoot(coeffs: Upolynomial) {
    if (coeffs.length === 0) return true;
    if (coeffs.length === 1) return false;
    let result = coeffs[coeffs.length - 1];
    for (let index = coeffs.length - 2, shift = 1n; index >= 0; index--, shift++)
      result += coeffs[index] << shift;
    return result === 0n;
  }

  private descartesBound01(coeffs: Upolynomial) {
    if (coeffs.length <= 1) return 0;
    const work = [...coeffs];
    let previous = 0;
    let changes = 0;
    for (let index = 0; index < work.length; index++) {
      let position = 1;
      for (; position < work.length - index; position++) work[position] += work[position - 1];
      const current = getSign(work[position - 1]);
      if (current === 0) continue;
      if (current !== previous && previous !== 0) {
        changes++;
        if (changes > 1) return changes;
      }
      previous = current;
    }
    return changes;
  }

  translate(coeffs: Upolynomial) {
    const result = [...coeffs];
    const degree = result.length - 1;
    for (let step = 1; step <= degree; step++)
      for (let index = degree - step; index <= degree - 1; index++)
        result[index] += result[index + 1];
    return result;
  }

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

  private compose2nPxDiv2(coeffs: Upolynomial) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) => coeff << BigInt(degree - index));
  }

  pMinusX(coeffs: Upolynomial) {
    return coeffs.map((coeff, index) => (index % 2 === 1 && coeff !== 0n ? -coeff : coeff));
  }

  p1DivX(coeffs: Upolynomial) {
    return [...coeffs].reverse();
  }

  private composeP2kX(coeffs: Upolynomial, k: number) {
    return coeffs.map((coeff, index) => coeff << BigInt(k * index));
  }

  private composeAnPxDivA(coeffs: Upolynomial, factor: bigint) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) =>
      coeff === 0n ? 0n : coeff * factor ** BigInt(degree - index),
    );
  }

  composePQX(coeffs: Upolynomial, value: Rational) {
    const degree = coeffs.length - 1;
    return coeffs.map((coeff, index) =>
      coeff === 0n ? 0n : coeff * value.den ** BigInt(degree - index) * value.num ** BigInt(index),
    );
  }

  evalSignAtBq(coeffs: Upolynomial, value: Mpbq) {
    if (coeffs.length === 0) return 0;
    if (coeffs.length === 1) return getSign(coeffs[0]);
    let result = coeffs[coeffs.length - 1];
    let shift = value.k;
    for (let index = coeffs.length - 2; index >= 0; index--, shift += value.k)
      result =
        coeffs[index] === 0n
          ? result * value.num
          : (coeffs[index] << BigInt(shift)) + result * value.num;
    return getSign(result);
  }

  evalSignAtQ(coeffs: Upolynomial, value: Rational) {
    if (coeffs.length === 0) return 0;
    if (coeffs.length === 1) return getSign(coeffs[0]);
    let result = coeffs[coeffs.length - 1];
    let denominator = value.den;
    for (let index = coeffs.length - 2; index >= 0; index--, denominator *= value.den)
      result =
        coeffs[index] === 0n
          ? result * value.num
          : coeffs[index] * denominator + result * value.num;
    return getSign(result);
  }

  evalSignAtZero(coeffs: Upolynomial) {
    return coeffs.length === 0 ? 0 : getSign(coeffs[0]);
  }

  evalSignAtPlusInf(coeffs: Upolynomial) {
    return coeffs.length === 0 ? 0 : getSign(coeffs[coeffs.length - 1]);
  }

  evalSignAtMinusInf(coeffs: Upolynomial) {
    if (coeffs.length === 0) return 0;
    const leading = getSign(coeffs[coeffs.length - 1]);
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

  nonzeroRootLowerBound(coeffs: Upolynomial) {
    const reversed = this.removeZeroRoots(coeffs).reverse();
    return Math.max(
      this.knuthPositiveRootUpperBound(reversed),
      this.knuthNegativeRootUpperBound(reversed),
    );
  }

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

  sqfIsolateRoots(coeffs: Upolynomial): IsolatedRoots {
    const result: IsolatedRoots = { roots: [], lowers: [], uppers: [] };
    if (this.hasZeroRoots(coeffs)) {
      result.roots.push(Mpbq.zero);
      this.drsIsolateRoots(this.removeZeroRoots(coeffs), result);
    } else this.drsIsolateRoots(coeffs, result);
    return result;
  }

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

  refineCore(coeffs: Upolynomial, signLower: number, lower: Mpbq, upper: Mpbq): Refinement {
    const middle = lower.add(upper).div2();
    const signMiddle = this.evalSignAtBq(coeffs, middle);
    if (signMiddle === 0) return { isInterval: false, lower: middle, upper };
    return signMiddle === signLower
      ? { isInterval: true, lower: middle, upper }
      : { isInterval: true, lower, upper: middle };
  }

  refineToPrecision(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq, precision: number): Refinement {
    const signLower = this.evalSignAtBq(coeffs, lower);
    let current: Refinement = { isInterval: true, lower, upper };
    while (true) {
      if (current.upper.sub(current.lower).isLessThanOneDiv2k(precision)) return current;
      current = this.refineCore(coeffs, signLower, current.lower, current.upper);
      if (!current.isInterval) return current;
    }
  }

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

  normalizeInterval(coeffs: Upolynomial, lower: Mpbq, upper: Mpbq, signLower: number) {
    if (!(lower.isNeg && upper.isPos)) return { lower, upper };
    if (this.hasZeroRoots(coeffs)) return null;
    return signLower === this.evalSignAtZero(coeffs)
      ? { lower: Mpbq.zero, upper }
      : { lower, upper: Mpbq.zero };
  }

  getRootId(coeffs: Upolynomial, lower: Mpbq) {
    const sequence = this.sturmSeq(coeffs);
    return this.signVariationsAtMinusInf(sequence) - this.signVariationsAt(sequence, lower);
  }
}

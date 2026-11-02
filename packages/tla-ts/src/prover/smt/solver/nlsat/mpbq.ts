// Ported from Z3 (src/util/mpbq.{h,cpp}), MIT license, see z3-license.txt. Binary rationals
// num/2^k, normalized so that k is 0 or num is odd. Like Z3, mul, div2 and power skip normalizing
// when a normalized input cannot need it, so an unnormalized input stays unnormalized. That
// matters because magnitudes and is_int read k.
import { Rational } from "../rational";

const getPowerOfTwoMultiple = (value: bigint) => {
  if (value === 0n) return 0;
  let count = 0;
  let rest = value < 0n ? -value : value;
  while ((rest & 1n) === 0n) {
    rest >>= 1n;
    count++;
  }
  return count;
};

// mpz log2: the position of the most significant bit of |value|.
export const getLog2 = (value: bigint) => (value < 0n ? -value : value).toString(2).length - 1;

export class Mpbq {
  private constructor(
    readonly num: bigint,
    readonly k: number,
  ) {}

  static readonly zero = new Mpbq(0n, 0);
  static readonly one = new Mpbq(1n, 0);

  static of(num: bigint, k = 0) {
    if (k === 0 || num === 0n) return new Mpbq(num, 0);
    const shift = Math.min(getPowerOfTwoMultiple(num), k);
    return new Mpbq(num >> BigInt(shift), k - shift);
  }

  // to_mpbq: q when its denominator is a power of two, else the binary rational with q's numerator
  // over 2^(log2(den) + 1), which is not equal to q.
  static fromRational(value: Rational) {
    if (value.den === 1n) return { value: Mpbq.of(value.num), isExact: true };
    const log2 = getLog2(value.den);
    if (value.den === 1n << BigInt(log2)) return { value: Mpbq.of(value.num, log2), isExact: true };
    return { value: Mpbq.of(value.num, log2 + 1), isExact: false };
  }

  get isZero() {
    return this.num === 0n;
  }

  get isNeg() {
    return this.num < 0n;
  }

  get isPos() {
    return this.num > 0n;
  }

  get isInt() {
    return this.k === 0;
  }

  toRational() {
    return Rational.of(this.num, 1n << BigInt(this.k));
  }

  private align(other: Mpbq): [bigint, bigint, number] {
    const k = Math.max(this.k, other.k);
    return [this.num << BigInt(k - this.k), other.num << BigInt(k - other.k), k];
  }

  add(other: Mpbq) {
    const aligned = this.align(other);
    return Mpbq.of(aligned[0] + aligned[1], aligned[2]);
  }

  sub(other: Mpbq) {
    const aligned = this.align(other);
    return Mpbq.of(aligned[0] - aligned[1], aligned[2]);
  }

  // mul: normalized only when a factor is an integer.
  mul(other: Mpbq) {
    const product = new Mpbq(this.num * other.num, this.k + other.k);
    return this.k === 0 || other.k === 0 ? Mpbq.of(product.num, product.k) : product;
  }

  // mul(a, b, b): Z3 reads b's k after writing the product's, so it normalizes only when a is an
  // integer.
  mulIntoOther(other: Mpbq) {
    const product = new Mpbq(this.num * other.num, this.k + other.k);
    return this.k === 0 ? Mpbq.of(product.num, product.k) : product;
  }

  neg() {
    return new Mpbq(-this.num, this.k);
  }

  div2() {
    return this.k === 0 ? Mpbq.of(this.num, 1) : new Mpbq(this.num, this.k + 1);
  }

  mul2k(k: number) {
    return this.k >= k ? new Mpbq(this.num, this.k - k) : Mpbq.of(this.num << BigInt(k - this.k));
  }

  power(exponent: number) {
    return new Mpbq(this.num ** BigInt(exponent), this.k * exponent);
  }

  compare(other: Mpbq) {
    const aligned = this.align(other);
    return aligned[0] < aligned[1] ? -1 : aligned[0] > aligned[1] ? 1 : 0;
  }

  compareRational(other: Rational) {
    return this.toRational().compare(other);
  }

  // lt_1div2k: this < 1/2^k.
  isLessThanOneDiv2k(k: number) {
    if (this.num <= 0n) return true;
    if (this.k <= k) return false;
    return this.num < 1n << BigInt(this.k - k);
  }

  floor() {
    return this.isInt ? this.num : this.num >> BigInt(this.k);
  }

  ceil() {
    return this.isInt ? this.num : (this.num >> BigInt(this.k)) + 1n;
  }

  toString() {
    return this.k === 0
      ? `${this.num}`
      : this.k === 1
        ? `${this.num}/2`
        : `${this.num}/2^${this.k}`;
  }
}

// refine_upper: l < q < u, where q is not a binary rational. Bisects until the midpoint is above q,
// which becomes the new u.
export const refineUpper = (value: Rational, lower: Mpbq, upper: Mpbq) => {
  let currentLower = lower;
  while (true) {
    const middle = currentLower.add(upper).div2();
    if (middle.compareRational(value) > 0) return { lower: currentLower, upper: middle };
    currentLower = middle;
  }
};

// refine_lower: as refine_upper, until the midpoint is below q, which becomes the new l.
export const refineLower = (value: Rational, lower: Mpbq, upper: Mpbq) => {
  let currentUpper = upper;
  while (true) {
    const middle = lower.add(currentUpper).div2();
    if (middle.compareRational(value) < 0) return { lower: middle, upper: currentUpper };
    currentUpper = middle;
  }
};

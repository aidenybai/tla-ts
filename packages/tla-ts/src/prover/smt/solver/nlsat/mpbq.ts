// Ported from Z3 (src/util/mpbq.{h,cpp}), MIT license, see z3-license.txt.
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

export const getLog2 = (value: bigint) => (value < 0n ? -value : value).toString(2).length - 1;

// The exact n-th root, or else the ceiling of the real root.
const getIntegerRoot = (value: bigint, n: number) => {
  if (value === 0n || n === 1) return { value, isExact: true };
  const exponent = BigInt(n);
  const magnitude = value < 0n ? -value : value;
  let low = 0n;
  let high = 1n;
  while (high ** exponent <= magnitude) high *= 2n;
  while (high - low > 1n) {
    const middle = (low + high) / 2n;
    if (middle ** exponent <= magnitude) low = middle;
    else high = middle;
  }
  const isExact = low ** exponent === magnitude;
  if (value > 0n) return { value: isExact ? low : low + 1n, isExact };
  return { value: -low, isExact };
};

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

  // Like Z3, mul, div2 and power leave some results unnormalized, and magnitudes and isInt read k.
  mul(other: Mpbq) {
    const product = new Mpbq(this.num * other.num, this.k + other.k);
    return this.k === 0 || other.k === 0 ? Mpbq.of(product.num, product.k) : product;
  }

  // Z3's mul(a, b, b) reads b's k after writing the product's k, so only an integer a normalizes.
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

  rootLower(n: number) {
    const root = getIntegerRoot(this.num, n);
    const num = root.isExact ? root.value : root.value - 1n;
    const k = Math.floor(this.k / n);
    return Mpbq.of(num, this.k % n === 0 || num < 0n ? k : k + 1);
  }

  rootUpper(n: number) {
    const root = getIntegerRoot(this.num, n);
    const k = Math.floor(this.k / n);
    return Mpbq.of(root.value, this.k % n === 0 || root.value >= 0n ? k : k + 1);
  }

  toDecimal(precision: number) {
    if (this.isInt) return `${this.num}`;
    const scale = 1n << BigInt(this.k);
    const magnitude = this.num < 0n ? -this.num : this.num;
    const digits: string[] = [];
    let remainder = magnitude % scale;
    for (let index = 0; index < precision && remainder !== 0n; index++) {
      digits.push(`${(remainder * 10n) / scale}`);
      remainder = (remainder * 10n) % scale;
    }
    const sign = this.num < 0n ? "-" : "";
    return `${sign}${magnitude / scale}.${digits.join("")}${remainder === 0n ? "" : "?"}`;
  }

  toString() {
    return this.k === 0
      ? `${this.num}`
      : this.k === 1
        ? `${this.num}/2`
        : `${this.num}/2^${this.k}`;
  }
}

export const refineUpper = (value: Rational, lower: Mpbq, upper: Mpbq) => {
  let currentLower = lower;
  while (true) {
    const middle = currentLower.add(upper).div2();
    if (middle.compareRational(value) > 0) return { lower: currentLower, upper: middle };
    currentLower = middle;
  }
};

export const refineLower = (value: Rational, lower: Mpbq, upper: Mpbq) => {
  let currentUpper = upper;
  while (true) {
    const middle = lower.add(currentUpper).div2();
    if (middle.compareRational(value) < 0) return { lower: middle, upper: currentUpper };
    currentUpper = middle;
  }
};

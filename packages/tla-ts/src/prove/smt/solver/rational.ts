// Ported from Z3 (src/util/rational.h), MIT license, see z3-license.txt. Exact rationals for the
// simplex tableau, normalized with a positive denominator.

export const getGcd = (first: bigint, second: bigint) => {
  let left = first < 0n ? -first : first;
  let right = second < 0n ? -second : second;
  while (right !== 0n) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
};

const isBigInt = (value: bigint) => value <= -2147483648n || value > 2147483647n;

export const getLcm = (first: bigint, second: bigint) => {
  const product = first * second;
  return (product < 0n ? -product : product) / getGcd(first, second);
};

export class Rational {
  static readonly zero = new Rational(0n, 1n);
  static readonly one = new Rational(1n, 1n);
  static readonly minusOne = new Rational(-1n, 1n);

  private constructor(
    readonly num: bigint,
    readonly den: bigint,
  ) {}

  static of(num: bigint, den = 1n) {
    if (den === 1n) return new Rational(num, 1n);
    const sign = den < 0n ? -1n : 1n;
    const divisor = getGcd(num, den);
    return new Rational((sign * num) / divisor, (sign * den) / divisor);
  }

  static fromNumber(value: number) {
    return new Rational(BigInt(value), 1n);
  }

  isZero() {
    return this.num === 0n;
  }

  isInt() {
    return this.den === 1n;
  }

  isPositive() {
    return this.num > 0n;
  }

  isNegative() {
    return this.num < 0n;
  }

  add(other: Rational) {
    if (this.den === 1n && other.den === 1n) return new Rational(this.num + other.num, 1n);
    return Rational.of(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Rational) {
    if (this.den === 1n && other.den === 1n) return new Rational(this.num - other.num, 1n);
    return Rational.of(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Rational) {
    if (this.den === 1n && other.den === 1n) return new Rational(this.num * other.num, 1n);
    return Rational.of(this.num * other.num, this.den * other.den);
  }

  div(other: Rational) {
    return Rational.of(this.num * other.den, this.den * other.num);
  }

  neg() {
    return new Rational(-this.num, this.den);
  }

  abs() {
    return this.num < 0n ? this.neg() : this;
  }

  // is_big: mpz keeps a numerator or denominator outside a 32-bit int as a bignum.
  isBig() {
    return isBigInt(this.num) || isBigInt(this.den);
  }

  compare(other: Rational) {
    const left = this.num * other.den;
    const right = other.num * this.den;
    return left < right ? -1 : left > right ? 1 : 0;
  }

  equals(other: Rational) {
    return this.num === other.num && this.den === other.den;
  }

  floor() {
    if (this.den === 1n) return this;
    const quotient = this.num / this.den;
    return new Rational(this.num < 0n ? quotient - 1n : quotient, 1n);
  }

  ceil() {
    if (this.den === 1n) return this;
    const quotient = this.num / this.den;
    return new Rational(this.num < 0n ? quotient : quotient + 1n, 1n);
  }

  toString() {
    return this.den === 1n ? `${this.num}` : `${this.num}/${this.den}`;
  }
}

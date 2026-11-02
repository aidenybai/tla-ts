// Ported from Z3 (src/math/lp/numeric_pair.h), MIT license, see z3-license.txt. The value x + δy
// of a column, where δ is a positive infinitesimal that encodes strict bounds.
import { Rational } from "../rational";

export class Impq {
  static readonly zero = new Impq(Rational.zero, Rational.zero);

  constructor(
    readonly x: Rational,
    readonly y: Rational = Rational.zero,
  ) {}

  add(other: Impq) {
    return new Impq(this.x.add(other.x), this.y.add(other.y));
  }

  sub(other: Impq) {
    return new Impq(this.x.sub(other.x), this.y.sub(other.y));
  }

  mul(coeff: Rational) {
    return new Impq(this.x.mul(coeff), this.y.mul(coeff));
  }

  div(coeff: Rational) {
    return new Impq(this.x.div(coeff), this.y.div(coeff));
  }

  neg() {
    return new Impq(this.x.neg(), this.y.neg());
  }

  // Lexicographic, as δ is smaller than any positive rational.
  compare(other: Impq) {
    const byX = this.x.compare(other.x);
    return byX !== 0 ? byX : this.y.compare(other.y);
  }

  equals(other: Impq) {
    return this.x.equals(other.x) && this.y.equals(other.y);
  }

  isZero() {
    return this.x.isZero() && this.y.isZero();
  }

  isInt() {
    return this.y.isZero() && this.x.isInt();
  }

  // floor and ceil of numeric_pair: x + δy rounded, for a positive δ smaller than any gap.
  floor() {
    if (!this.x.isInt()) return this.x.floor();
    return this.y.isNegative() ? this.x.sub(Rational.one) : this.x;
  }

  ceil() {
    if (!this.x.isInt()) return this.x.ceil();
    return this.y.isPositive() ? this.x.add(Rational.one) : this.x;
  }

  toString() {
    return this.y.isZero() ? this.x.toString() : `(${this.x}, ${this.y})`;
  }
}

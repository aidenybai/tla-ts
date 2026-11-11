// Ported from Z3 (src/util/inf_eps_rational.h), MIT license, see z3-license.txt. A value
// infinity * oo + value + epsilon * ε, ordered lexicographically.
import { Rational } from "./rational";

export class InfEps {
  static readonly infinity = new InfEps(Rational.one, Rational.zero);
  static readonly minusInfinity = new InfEps(Rational.minusOne, Rational.zero);

  constructor(
    readonly infinity: Rational,
    readonly value: Rational,
    readonly epsilon: Rational = Rational.zero,
  ) {}

  static of(value: Rational, epsilon = Rational.zero) {
    return new InfEps(Rational.zero, value, epsilon);
  }

  isFinite() {
    return this.infinity.isZero();
  }

  isPositive() {
    return (
      this.infinity.isPositive() ||
      (this.infinity.isZero() &&
        (this.value.isPositive() || (this.value.isZero() && this.epsilon.isPositive())))
    );
  }

  isNegative() {
    return (
      this.infinity.isNegative() ||
      (this.infinity.isZero() &&
        (this.value.isNegative() || (this.value.isZero() && this.epsilon.isNegative())))
    );
  }

  compare(other: InfEps) {
    return (
      this.infinity.compare(other.infinity) ||
      this.value.compare(other.value) ||
      this.epsilon.compare(other.epsilon)
    );
  }

  equals(other: InfEps) {
    return this.compare(other) === 0;
  }

  add(other: InfEps) {
    return new InfEps(
      this.infinity.add(other.infinity),
      this.value.add(other.value),
      this.epsilon.add(other.epsilon),
    );
  }
}

export const maxInfEps = (first: InfEps, second: InfEps) =>
  first.compare(second) < 0 ? second : first;

export const minInfEps = (first: InfEps, second: InfEps) =>
  second.compare(first) < 0 ? second : first;

// Ported from Z3 (src/opt/opt_value.h, src/opt/opt_value.cpp), MIT license, see z3-license.txt.
import { InfEps } from "./inf-eps";
import type { AlgebraicManager, Anum } from "./nlsat/algebraic";

// A bound whose finite part may also be known exactly, as an algebraic number, while the bound
// keeps an outward rational endpoint.
export class ObjectiveValue {
  static readonly infinity = new ObjectiveValue(InfEps.infinity);
  static readonly minusInfinity = new ObjectiveValue(InfEps.minusInfinity);

  constructor(
    readonly bound: InfEps,
    readonly exact: Anum | null = null,
  ) {}

  isFinite() {
    return this.bound.isFinite();
  }

  hasInfinitesimal() {
    return !this.bound.epsilon.isZero();
  }

  withRationalBound(bound: InfEps) {
    return new ObjectiveValue(bound, this.exact);
  }

  withoutExact() {
    return new ObjectiveValue(this.bound);
  }

  negated(am: AlgebraicManager) {
    const bound = this.bound;
    const exact = this.exact === null ? null : am.copy(this.exact);
    if (exact !== null) am.neg(exact);
    return new ObjectiveValue(
      new InfEps(bound.infinity.neg(), bound.value.neg(), bound.epsilon.neg()),
      exact,
    );
  }

  // Equal isolating endpoints do not imply equal algebraic values.
  equals(other: ObjectiveValue, am: AlgebraicManager) {
    const first = this.bound;
    const second = other.bound;
    if (!first.infinity.equals(second.infinity) || !first.epsilon.equals(second.epsilon))
      return false;
    if (this.exact === null && other.exact === null) return first.value.equals(second.value);
    const isAlgebraic = this.exact !== null && !am.isRational(this.exact);
    const isOtherAlgebraic = other.exact !== null && !am.isRational(other.exact);
    if (isAlgebraic !== isOtherAlgebraic) return false;
    if (isAlgebraic && this.exact !== null && other.exact !== null)
      return am.compare(this.exact, other.exact) === 0;
    return first.value.equals(second.value);
  }
}

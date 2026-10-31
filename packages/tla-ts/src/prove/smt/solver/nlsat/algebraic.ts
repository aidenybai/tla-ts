// Ported from Z3 (src/math/polynomial/algebraic_numbers.cpp, src/util/mpbq.cpp), MIT license, see
// z3-license.txt. The rational fragment of Z3's real algebraic numbers that nlsat's
// check_assignment needs: its sample points are rational, and in scope every polynomial has
// degree 1 in the variable whose roots it isolates, so every root is rational too. A polynomial of
// degree 2 or more in that variable, which may have irrational roots, is out of scope.
import { Rational } from "../rational";
import { NlsatOutOfScope, type Polynomial, type PolynomialManager } from "./polynomial";

export interface ClosestRoots {
  roots: Rational[];
  indices: number[];
}

const NO_ROOTS: ClosestRoots = { roots: [], indices: [] };

// isolate_roots_closest: the roots of p, as a polynomial in x after substituting the sample for the
// other variables, that lie closest to the sample of x on either side, with their 1-based indices
// among all the real roots. In scope p has at most one root, which is always the closest.
export const isolateRootsClosest = (
  pm: PolynomialManager,
  polynomial: Polynomial,
  sample: readonly (Rational | undefined)[],
  rootVariable: number,
): ClosestRoots => {
  if (pm.isConst(polynomial)) return NO_ROOTS;
  // Z3 isolates the roots of a univariate polynomial in its own variable, whichever it is.
  const variable = pm.isUnivariate(polynomial) ? pm.maxVar(polynomial) : rootVariable;
  let leading = Rational.zero;
  let constant = Rational.zero;
  for (let index = 0; index < polynomial.size; index++) {
    const monomial = polynomial.ms[index];
    const degree = monomial.degreeOf(variable);
    if (degree > 1)
      throw new NlsatOutOfScope(
        `isolating the roots of ${polynomial} of degree 2 or more in x${variable}`,
      );
    let term = Rational.of(polynomial.as[index]);
    for (let power = 0; power < monomial.size; power++) {
      const current = monomial.vars[power];
      if (current === variable) continue;
      const assigned = sample[current];
      if (assigned === undefined) throw new Error(`x${current} is unassigned`);
      for (let count = 0; count < monomial.degrees[power]; count++) term = term.mul(assigned);
    }
    if (degree === 1) leading = leading.add(term);
    else constant = constant.add(term);
  }
  // A vanishing leading coefficient leaves a constant, which has no roots.
  if (leading.isZero()) return NO_ROOTS;
  return { roots: [constant.neg().div(leading)], indices: [1] };
};

const isIntegerBetween = (lower: Rational, upper: Rational) => {
  const ceilLower = lower.isInt() ? lower.num + 1n : lower.ceil().num;
  const floorUpper = upper.isInt() ? upper.num - 1n : upper.floor().num;
  return ceilLower <= floorUpper ? ceilLower : null;
};

// select: a rational strictly between a and b, with the smallest power of two as denominator, and the
// smallest such numerator (mpbq_manager::select_small_core).
export const selectBetween = (lower: Rational, upper: Rational) => {
  let scale = 1n;
  while (true) {
    const integer = isIntegerBetween(lower.mul(Rational.of(scale)), upper.mul(Rational.of(scale)));
    if (integer !== null) return Rational.of(integer, scale);
    scale *= 2n;
  }
};

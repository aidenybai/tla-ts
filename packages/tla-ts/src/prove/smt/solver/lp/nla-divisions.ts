// Ported from Z3 (src/math/lp/nla_divisions.h, src/math/lp/nla_divisions.cpp), MIT license, see
// z3-license.txt. The lemmas of nla on div, mod and /: monotonicity in the dividend and the
// divisor, bounded divisions by numerals, and divisibility closures over a shared divisor. Z3
// skips the check while nra's model is in use, which never happens here since nra is not ported.
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT } from "./constraints";
import { LarTerm } from "./lar-term";
import { KIND_NE, LemmaBuilder, mkIneq, type NlaCore } from "./nla-core";

// A division q = x / y with r its remainder, or a divisibility fact r = mod(x, y), q = div(x, y).
interface Division {
  readonly quotient: number;
  readonly dividend: number;
  readonly divisor: number;
  readonly remainder: number;
}

interface DivisionValues {
  readonly dividend: number;
  readonly dividendValue: Rational;
  readonly divisor: number;
  readonly divisorValue: Rational;
  readonly quotient: number;
  readonly quotientValue: Rational;
}

// div on integers: Euclidean division, as mpz_manager::div.
const getIntDiv = (dividend: Rational, divisor: Rational) => {
  const quotient = dividend.num / divisor.num;
  if (dividend.num >= 0n || quotient * divisor.num === dividend.num) return Rational.of(quotient);
  return Rational.of(divisor.num < 0n ? quotient + 1n : quotient - 1n);
};

const mkDifference = (first: number, second: number) =>
  new LarTerm([
    [first, Rational.one],
    [second, Rational.minusOne],
  ]);

export class Divisions {
  private idivisions: Division[] = [];
  private boundedDivisions: Division[] = [];
  // Divisibility facts, whose quotient is div(x, y) and remainder mod(x, y).
  private divisibility: Division[] = [];

  constructor(private core: NlaCore) {}

  private pushDivision(divisions: Division[], division: Division) {
    divisions.push(division);
    this.core.emons.trail.push(() => divisions.pop());
  }

  addIdivision(quotient: number, dividend: number, divisor: number, remainder: number) {
    if ([quotient, dividend, divisor, remainder].includes(-1)) return;
    this.pushDivision(this.idivisions, { quotient, dividend, divisor, remainder });
  }

  addBoundedDivision(quotient: number, dividend: number, divisor: number, remainder: number) {
    if ([quotient, dividend, divisor, remainder].includes(-1)) return;
    const lra = this.core.lra;
    if (lra.hasTerm(dividend) || lra.hasTerm(divisor) || lra.hasTerm(quotient)) return;
    this.pushDivision(this.boundedDivisions, { quotient, dividend, divisor, remainder });
  }

  addDivisibility(remainder: number, dividend: number, divisor: number, quotient: number) {
    if ([quotient, dividend, divisor, remainder].includes(-1)) return;
    this.pushDivision(this.divisibility, { quotient, dividend, divisor, remainder });
  }

  // y1 >= y2 > 0 & 0 <= x1 <= x2 => x1/y1 <= x2/y2
  private monotonicity1(first: DivisionValues, second: DivisionValues) {
    if (
      !(
        first.divisorValue.compare(second.divisorValue) >= 0 &&
        second.divisorValue.isPositive() &&
        !first.dividendValue.isNegative() &&
        first.dividendValue.compare(second.dividendValue) <= 0 &&
        first.quotientValue.compare(second.quotientValue) > 0
      )
    )
      return false;
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(mkDifference(first.divisor, second.divisor), KIND_LT, 0));
    lemma.addIneq(mkIneq(second.divisor, KIND_LE, 0));
    lemma.addIneq(mkIneq(first.dividend, KIND_LT, 0));
    lemma.addIneq(mkIneq(mkDifference(first.dividend, second.dividend), KIND_GT, 0));
    lemma.addIneq(mkIneq(mkDifference(first.quotient, second.quotient), KIND_LE, 0));
    return true;
  }

  // y2 <= y1 < 0 & x1 >= x2 >= 0 => x1/y1 <= x2/y2
  private monotonicity2(first: DivisionValues, second: DivisionValues) {
    if (
      !(
        second.divisorValue.compare(first.divisorValue) <= 0 &&
        first.divisorValue.isNegative() &&
        first.dividendValue.compare(second.dividendValue) >= 0 &&
        !second.dividendValue.isNegative() &&
        first.quotientValue.compare(second.quotientValue) > 0
      )
    )
      return false;
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(mkDifference(first.divisor, second.divisor), KIND_LT, 0));
    lemma.addIneq(mkIneq(first.divisor, KIND_GE, 0));
    lemma.addIneq(mkIneq(mkDifference(first.dividend, second.dividend), KIND_LT, 0));
    lemma.addIneq(mkIneq(second.dividend, KIND_LT, 0));
    lemma.addIneq(mkIneq(mkDifference(first.quotient, second.quotient), KIND_LE, 0));
    return true;
  }

  // y2 <= y1 < 0 & x1 <= x2 <= 0 => x1/y1 >= x2/y2
  private monotonicity3(first: DivisionValues, second: DivisionValues) {
    if (
      !(
        second.divisorValue.compare(first.divisorValue) <= 0 &&
        first.divisorValue.isNegative() &&
        first.dividendValue.compare(second.dividendValue) <= 0 &&
        !second.dividendValue.isPositive() &&
        first.quotientValue.compare(second.quotientValue) < 0
      )
    )
      return false;
    const lemma = new LemmaBuilder(this.core);
    lemma.addIneq(mkIneq(mkDifference(first.divisor, second.divisor), KIND_LT, 0));
    lemma.addIneq(mkIneq(first.divisor, KIND_GE, 0));
    lemma.addIneq(mkIneq(mkDifference(first.dividend, second.dividend), KIND_GT, 0));
    lemma.addIneq(mkIneq(second.dividend, KIND_GT, 0));
    lemma.addIneq(mkIneq(mkDifference(first.quotient, second.quotient), KIND_GE, 0));
    return true;
  }

  private monotonicity(first: DivisionValues, second: DivisionValues) {
    return (
      this.monotonicity1(first, second) ||
      this.monotonicity1(second, first) ||
      this.monotonicity2(first, second) ||
      this.monotonicity2(second, first) ||
      this.monotonicity3(first, second) ||
      this.monotonicity3(second, first)
    );
  }

  private getValues(division: Division): DivisionValues {
    const core = this.core;
    return {
      dividend: division.dividend,
      dividendValue: core.val(division.dividend),
      divisor: division.divisor,
      divisorValue: core.val(division.divisor),
      quotient: division.quotient,
      quotientValue: core.val(division.quotient),
    };
  }

  // The monotonicity lemmas of the integer divisions whose quotients are wrong, against the others.
  // Z3's theory_lra registers no real divisions, so the rdivisions it would also check stay empty.
  private checkMonotonicity(divisions: Division[]) {
    const core = this.core;
    for (const division of divisions) {
      if (!core.isRelevant(division.quotient)) continue;
      const values = this.getValues(division);
      const dividendValue = values.dividendValue;
      const divisorValue = values.divisorValue;
      if (divisorValue.isZero()) continue;
      if (!dividendValue.isInt() || !divisorValue.isInt()) continue;
      if (values.quotientValue.equals(getIntDiv(dividendValue, divisorValue))) continue;
      for (const other of divisions) {
        if (other.quotient === division.quotient || !core.isRelevant(other.quotient)) continue;
        if (this.monotonicity(values, this.getValues(other))) return true;
      }
    }
    return false;
  }

  check() {
    if (this.checkMonotonicity(this.idivisions)) return;
    this.checkModMult();
    this.checkLinearDivisibility();
    this.checkModCongruence();
  }

  // p <= q * div(r, q) + q - 1 => div(p, q) <= div(r, q), and p >= q * div(r, q) =>
  // div(r, q) <= div(p, q), for a bounded p, a value q and r = eval(p).
  checkBoundedDivisions() {
    const core = this.core;
    const offset = core.random();
    const size = this.boundedDivisions.length;
    for (let index = 0; index < size; index++) {
      const division = this.boundedDivisions[(offset + index) % size];
      const quotient = division.quotient;
      if (!core.isRelevant(quotient)) continue;
      const dividendValue = core.val(division.dividend);
      const divisorValue = core.val(division.divisor);
      if (dividendValue.isNegative() || !dividendValue.isInt()) continue;
      if (!divisorValue.isPositive() || !divisorValue.isInt()) continue;
      const divValue = getIntDiv(dividendValue, divisorValue);
      if (core.val(quotient).equals(divValue)) continue;
      const high = divisorValue.mul(divValue).add(divisorValue).sub(Rational.one);
      const low = divisorValue.mul(divValue);
      if (dividendValue.compare(high) > 0) {
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(division.divisor, KIND_NE, divisorValue));
        lemma.addIneq(mkIneq(division.dividend, KIND_GT, high));
        lemma.addIneq(mkIneq(quotient, KIND_LE, divValue));
        return;
      }
      if (dividendValue.compare(low) < 0) {
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(division.divisor, KIND_NE, divisorValue));
        lemma.addIneq(mkIneq(division.dividend, KIND_LT, low));
        lemma.addIneq(mkIneq(quotient, KIND_GE, divValue));
        return;
      }
    }
  }

  // mod(factor, p) = 0 => mod(factor * k, p) = 0
  private checkModMult() {
    const core = this.core;
    const offset = core.random();
    const size = this.boundedDivisions.length;
    for (let index = 0; index < size; index++) {
      const division = this.boundedDivisions[(offset + index) % size];
      const remainder = division.remainder;
      if (!core.isRelevant(division.quotient)) continue;
      if (core.varIsFixedToZero(remainder) || core.val(remainder).isZero()) continue;
      if (!core.isMonicVar(division.dividend)) continue;
      const divisorValue = core.val(division.divisor);
      if (!divisorValue.isPositive() || !divisorValue.isInt()) continue;
      for (const factor of core.emons.get(division.dividend).vars) {
        for (const other of this.boundedDivisions) {
          if (other.dividend !== factor) continue;
          if (!core.val(other.divisor).equals(divisorValue)) continue;
          if (!core.varIsFixedToZero(other.remainder)) continue;
          const lemma = new LemmaBuilder(core);
          lemma.addIneq(mkIneq(other.remainder, KIND_NE, 0));
          lemma.addIneq(mkIneq(remainder, KIND_EQ, 0));
          return;
        }
      }
    }
  }

  // y != 0 & mod(a, y) = 0 & x = c * a, for an integer constant c, => mod(x, y) = 0
  private checkLinearDivisibility() {
    const core = this.core;
    const size = this.divisibility.length;
    for (let index = 0; index < size; index++) {
      const fact = this.divisibility[index];
      const x = fact.dividend;
      const y = fact.divisor;
      if (!core.isRelevant(fact.remainder)) continue;
      if (core.val(fact.remainder).isZero()) continue;
      const xValue = core.val(x);
      const yValue = core.val(y);
      if (yValue.isZero() || xValue.isZero()) continue;
      for (let otherIndex = 0; otherIndex < size; otherIndex++) {
        if (index === otherIndex) continue;
        const other = this.divisibility[otherIndex];
        const a = other.dividend;
        const y2 = other.divisor;
        if (y2 !== y && !core.val(y2).equals(yValue)) continue;
        if (!core.isRelevant(other.remainder)) continue;
        if (!core.val(other.remainder).isZero()) continue;
        const aValue = core.val(a);
        if (aValue.isZero()) continue;
        const coeff = xValue.div(aValue);
        if (!coeff.isInt() || coeff.isZero()) continue;
        if (!xValue.equals(coeff.mul(aValue))) continue;
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(y, KIND_EQ, 0));
        if (y2 !== y) lemma.addIneq(mkIneq(mkDifference(y, y2), KIND_NE, 0));
        lemma.addIneq(
          mkIneq(
            new LarTerm([
              [x, Rational.one],
              [a, coeff.neg()],
            ]),
            KIND_NE,
            0,
          ),
        );
        lemma.addIneq(mkIneq(other.remainder, KIND_NE, 0));
        lemma.addIneq(mkIneq(fact.remainder, KIND_EQ, 0));
        return;
      }
    }
  }

  // div(x,y) - div(s,y) = delta => mod(x,y) - mod(s,y) = (x - s) - delta*y, for y != 0
  private checkModCongruence() {
    const core = this.core;
    const size = this.divisibility.length;
    for (let index = 0; index < size; index++) {
      const fact = this.divisibility[index];
      const y = fact.divisor;
      if (!core.isRelevant(fact.remainder)) continue;
      const yValue = core.val(y);
      if (yValue.isZero()) continue;
      for (let otherIndex = index + 1; otherIndex < size; otherIndex++) {
        const other = this.divisibility[otherIndex];
        const y2 = other.divisor;
        if (!core.isRelevant(other.remainder)) continue;
        if (y2 !== y && !core.val(y2).equals(yValue)) continue;
        const delta = core.val(fact.quotient).sub(core.val(other.quotient));
        const left = core.val(fact.remainder).sub(core.val(other.remainder));
        const right = core.val(fact.dividend).sub(core.val(other.dividend)).sub(delta.mul(yValue));
        if (left.equals(right)) continue;
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(y, KIND_EQ, 0));
        if (y2 !== y) lemma.addIneq(mkIneq(mkDifference(y, y2), KIND_NE, 0));
        lemma.addIneq(mkIneq(mkDifference(fact.quotient, other.quotient), KIND_NE, delta));
        const term = new LarTerm();
        term.addMonomial(Rational.one, fact.remainder);
        term.addMonomial(Rational.minusOne, other.remainder);
        term.addMonomial(Rational.minusOne, fact.dividend);
        term.addMonomial(Rational.one, other.dividend);
        term.addMonomial(delta, y);
        lemma.addIneq(mkIneq(term, KIND_EQ, 0));
        return;
      }
    }
  }
}

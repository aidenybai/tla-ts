// Ported from Z3 (src/math/lp/nla_divisions.h, src/math/lp/nla_divisions.cpp), MIT license, see
// z3-license.txt.
import { getEuclideanDiv, Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT, KIND_NE } from "./constraints";
import { NULL_LPVAR } from "./lar-solver";
import { LarTerm } from "./lar-term";
import type { NlaCore } from "./nla-core";
import { LemmaBuilder, mkIneq } from "./nla-types";

export interface Division {
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

const getIntDiv = (dividend: Rational, divisor: Rational) =>
  Rational.of(getEuclideanDiv(dividend.num, divisor.num));

const hasNullColumn = (division: Division) =>
  division.quotient === NULL_LPVAR ||
  division.dividend === NULL_LPVAR ||
  division.divisor === NULL_LPVAR ||
  division.remainder === NULL_LPVAR;

const mkDifference = (first: number, second: number) =>
  new LarTerm([
    [first, Rational.one],
    [second, Rational.minusOne],
  ]);

export class Divisions {
  private idivisions: Division[] = [];
  private boundedDivisions: Division[] = [];
  private divisibility: Division[] = [];

  constructor(private core: NlaCore) {}

  private pushDivision(divisions: Division[], division: Division) {
    divisions.push(division);
    this.core.emons.trail.push(() => divisions.pop());
  }

  addIdivision(division: Division) {
    if (hasNullColumn(division)) return;
    this.pushDivision(this.idivisions, division);
  }

  addBoundedDivision(division: Division) {
    if (hasNullColumn(division)) return;
    const lra = this.core.lra;
    if (lra.hasTerm(division.dividend) || lra.hasTerm(division.divisor)) return;
    if (lra.hasTerm(division.quotient)) return;
    this.pushDivision(this.boundedDivisions, division);
  }

  addDivisibility(division: Division) {
    if (hasNullColumn(division)) return;
    this.pushDivision(this.divisibility, division);
  }

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
    if (this.core.isUsingNraModel) return;
    if (this.checkMonotonicity(this.idivisions)) return;
    this.checkModMult();
    this.checkLinearDivisibility();
    this.checkModCongruence();
  }

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

  private checkLinearDivisibility() {
    const core = this.core;
    const size = this.divisibility.length;
    for (let index = 0; index < size; index++) {
      const fact = this.divisibility[index];
      const dividend = fact.dividend;
      const divisor = fact.divisor;
      if (!core.isRelevant(fact.remainder)) continue;
      if (core.val(fact.remainder).isZero()) continue;
      const dividendValue = core.val(dividend);
      const divisorValue = core.val(divisor);
      if (divisorValue.isZero() || dividendValue.isZero()) continue;
      for (let otherIndex = 0; otherIndex < size; otherIndex++) {
        if (index === otherIndex) continue;
        const other = this.divisibility[otherIndex];
        const otherDividend = other.dividend;
        const otherDivisor = other.divisor;
        if (otherDivisor !== divisor && !core.val(otherDivisor).equals(divisorValue)) continue;
        if (!core.isRelevant(other.remainder)) continue;
        if (!core.val(other.remainder).isZero()) continue;
        const otherDividendValue = core.val(otherDividend);
        if (otherDividendValue.isZero()) continue;
        const coeff = dividendValue.div(otherDividendValue);
        if (!coeff.isInt() || coeff.isZero()) continue;
        if (!dividendValue.equals(coeff.mul(otherDividendValue))) continue;
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(divisor, KIND_EQ, 0));
        if (otherDivisor !== divisor)
          lemma.addIneq(mkIneq(mkDifference(divisor, otherDivisor), KIND_NE, 0));
        lemma.addIneq(
          mkIneq(
            new LarTerm([
              [dividend, Rational.one],
              [otherDividend, coeff.neg()],
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

  private checkModCongruence() {
    const core = this.core;
    const size = this.divisibility.length;
    for (let index = 0; index < size; index++) {
      const fact = this.divisibility[index];
      const divisor = fact.divisor;
      if (!core.isRelevant(fact.remainder)) continue;
      const divisorValue = core.val(divisor);
      if (divisorValue.isZero()) continue;
      for (let otherIndex = index + 1; otherIndex < size; otherIndex++) {
        const other = this.divisibility[otherIndex];
        const otherDivisor = other.divisor;
        if (!core.isRelevant(other.remainder)) continue;
        if (otherDivisor !== divisor && !core.val(otherDivisor).equals(divisorValue)) continue;
        const delta = core.val(fact.quotient).sub(core.val(other.quotient));
        const left = core.val(fact.remainder).sub(core.val(other.remainder));
        const right = core
          .val(fact.dividend)
          .sub(core.val(other.dividend))
          .sub(delta.mul(divisorValue));
        if (left.equals(right)) continue;
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(divisor, KIND_EQ, 0));
        if (otherDivisor !== divisor)
          lemma.addIneq(mkIneq(mkDifference(divisor, otherDivisor), KIND_NE, 0));
        lemma.addIneq(mkIneq(mkDifference(fact.quotient, other.quotient), KIND_NE, delta));
        const term = new LarTerm();
        term.addMonomial(Rational.one, fact.remainder);
        term.addMonomial(Rational.minusOne, other.remainder);
        term.addMonomial(Rational.minusOne, fact.dividend);
        term.addMonomial(Rational.one, other.dividend);
        term.addMonomial(delta, divisor);
        lemma.addIneq(mkIneq(term, KIND_EQ, 0));
        return;
      }
    }
  }
}

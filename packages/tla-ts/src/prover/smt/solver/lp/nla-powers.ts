import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { Anum } from "../nlsat/algebraic";
import { Rational } from "../rational";
import { KIND_EQ, KIND_GE, KIND_GT, KIND_LE, KIND_LT, KIND_NE } from "./constraints";
import { NULL_LPVAR } from "./lar-solver";
import { LarTerm } from "./lar-term";
import { type NlaCore } from "./nla-core";
import { LemmaBuilder, mkIneq } from "./nla-types";

const THREE = Rational.of(3n);
const MAX_UNSIGNED = 0xffffffffn;

const isUnsigned = (value: Rational) =>
  value.isInt() && value.num >= 0n && value.num <= MAX_UNSIGNED;

// x != 0 => x^0 = 1
const xExp0 = (core: NlaCore, result: number, base: number, exponent: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_EQ, 0));
  lemma.addIneq(mkIneq(exponent, KIND_NE, 0));
  lemma.addIneq(mkIneq(result, KIND_EQ, 1));
  return L_FALSE;
};

// y != 0 => 0^y = 0
const zeroExpY = (core: NlaCore, result: number, base: number, exponent: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_NE, 0));
  lemma.addIneq(mkIneq(exponent, KIND_EQ, 0));
  lemma.addIneq(mkIneq(result, KIND_EQ, 0));
  return L_FALSE;
};

// x > 0 => x^y > 0
const xGt0 = (core: NlaCore, result: number, base: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_LE, 0));
  lemma.addIneq(mkIneq(result, KIND_GT, 0));
  return L_FALSE;
};

// x > 1, y < 0 => x^y < 1
const yLt1 = (core: NlaCore, result: number, base: number, exponent: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_LE, 1));
  lemma.addIneq(mkIneq(exponent, KIND_GE, 0));
  lemma.addIneq(mkIneq(result, KIND_LT, 1));
  return L_FALSE;
};

// x > 1, y > 0 => x^y > 1
const yGt1 = (core: NlaCore, result: number, base: number, exponent: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_LE, 1));
  lemma.addIneq(mkIneq(exponent, KIND_LE, 0));
  lemma.addIneq(mkIneq(result, KIND_GT, 1));
  return L_FALSE;
};

// x >= 3, y > 0 => x^y > ln(x)y + 1
const xGe3 = (core: NlaCore, result: number, base: number, exponent: number) => {
  const lemma = new LemmaBuilder(core);
  lemma.addIneq(mkIneq(base, KIND_LT, THREE));
  lemma.addIneq(mkIneq(exponent, KIND_LE, 0));
  lemma.addIneq(
    mkIneq(
      new LarTerm([
        [result, Rational.one],
        [exponent, Rational.minusOne],
      ]),
      KIND_GT,
      1,
    ),
  );
  return L_FALSE;
};

export const checkPower = (core: NlaCore, result: number, base: number, exponent: number) => {
  if (base === NULL_LPVAR || exponent === NULL_LPVAR || result === NULL_LPVAR) return L_UNDEF;
  const lra = core.lra;
  const am = core.nra.am;
  const values = core.isUsingNraModel
    ? [base, exponent, result].map((lpVar) => core.nra.value(lpVar))
    : undefined;
  if (
    values === undefined &&
    [base, exponent, result].some((lpVar) => !lra.getValue(lpVar).y.isZero())
  )
    return L_UNDEF;
  const rationals =
    values === undefined
      ? [core.val(base), core.val(exponent), core.val(result)]
      : values.every((value) => am.isRational(value))
        ? values.map((value) => am.toRational(value))
        : undefined;
  if (rationals !== undefined) {
    const baseValue = rationals[0];
    const exponentValue = rationals[1];
    const resultValue = rationals[2];
    if (!baseValue.isZero() && exponentValue.isZero() && !resultValue.equals(Rational.one))
      return xExp0(core, result, base, exponent);
    if (baseValue.isZero() && !exponentValue.isZero() && !resultValue.isZero())
      return zeroExpY(core, result, base, exponent);
    if (baseValue.isPositive() && !resultValue.isPositive()) return xGt0(core, result, base);
    if (
      baseValue.compare(Rational.one) > 0 &&
      exponentValue.isNegative() &&
      resultValue.compare(Rational.one) >= 0
    )
      return yLt1(core, result, base, exponent);
    if (
      baseValue.compare(Rational.one) > 0 &&
      exponentValue.isPositive() &&
      resultValue.compare(Rational.one) <= 0
    )
      return yGt1(core, result, base, exponent);
    if (
      baseValue.compare(THREE) >= 0 &&
      exponentValue.isPositive() &&
      resultValue.compare(exponentValue.add(Rational.one)) <= 0
    )
      return xGe3(core, result, base, exponent);
    if (baseValue.isPositive() && isUnsigned(exponentValue)) {
      const powerValue = baseValue.pow(Number(exponentValue.num));
      const comparison = resultValue.compare(powerValue);
      if (comparison === 0) return L_TRUE;
      if (core.random() % 2 === 0) {
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(base, KIND_NE, baseValue));
        lemma.addIneq(mkIneq(exponent, KIND_NE, exponentValue));
        lemma.addIneq(mkIneq(result, KIND_EQ, powerValue));
        return L_FALSE;
      }
      const isIncreasing = baseValue.compare(Rational.one) >= 0;
      if (exponentValue.isPositive() && comparison < 0) {
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(base, KIND_LT, baseValue));
        lemma.addIneq(mkIneq(exponent, isIncreasing ? KIND_LT : KIND_GT, exponentValue));
        if (!isIncreasing) lemma.addIneq(mkIneq(exponent, KIND_LT, 0));
        lemma.addIneq(mkIneq(result, KIND_GE, powerValue));
        return L_FALSE;
      }
      if (comparison > 0) {
        const lemma = new LemmaBuilder(core);
        lemma.addIneq(mkIneq(base, KIND_LE, 0));
        lemma.addIneq(mkIneq(base, KIND_GT, baseValue));
        lemma.addIneq(mkIneq(exponent, isIncreasing ? KIND_GT : KIND_LT, exponentValue));
        if (isIncreasing) lemma.addIneq(mkIneq(exponent, KIND_LT, 0));
        lemma.addIneq(mkIneq(result, KIND_LE, powerValue));
        return L_FALSE;
      }
    }
    if (baseValue.isPositive() && exponentValue.isPositive() && !exponentValue.isInt()) {
      const num = exponentValue.num;
      const den = exponentValue.den;
      if (
        num <= MAX_UNSIGNED &&
        den <= MAX_UNSIGNED &&
        resultValue.pow(Number(den)).equals(baseValue.pow(Number(num)))
      )
        return L_TRUE;
    }
    return L_UNDEF;
  }
  if (values === undefined) return L_UNDEF;
  const baseValue = values[0];
  const exponentValue = values[1];
  const resultValue = values[2];
  const zero = new Anum(Rational.zero);
  const one = new Anum(Rational.one);
  if (
    am.compare(baseValue, zero) !== 0 &&
    am.compare(exponentValue, zero) === 0 &&
    am.compare(resultValue, one) !== 0
  )
    return xExp0(core, result, base, exponent);
  if (
    am.compare(baseValue, zero) === 0 &&
    am.compare(exponentValue, zero) !== 0 &&
    am.compare(resultValue, zero) !== 0
  )
    return zeroExpY(core, result, base, exponent);
  if (am.compare(baseValue, zero) > 0 && am.compare(resultValue, zero) <= 0)
    return xGt0(core, result, base);
  if (
    am.compare(baseValue, one) > 0 &&
    am.compare(exponentValue, zero) < 0 &&
    am.compare(resultValue, one) >= 0
  )
    return yLt1(core, result, base, exponent);
  if (
    am.compare(baseValue, one) > 0 &&
    am.compare(exponentValue, zero) > 0 &&
    am.compare(resultValue, one) <= 0
  )
    return yGt1(core, result, base, exponent);
  if (
    am.compare(baseValue, new Anum(THREE)) >= 0 &&
    am.compare(exponentValue, zero) > 0 &&
    am.compare(resultValue, am.add(exponentValue, one)) <= 0
  )
    return xGe3(core, result, base, exponent);
  if (
    am.compare(baseValue, zero) > 0 &&
    am.compare(exponentValue, zero) > 0 &&
    am.isRational(exponentValue)
  ) {
    const exponentRational = am.toRational(exponentValue);
    if (
      exponentRational.num <= MAX_UNSIGNED &&
      exponentRational.den <= MAX_UNSIGNED &&
      am.compare(
        am.power(resultValue, Number(exponentRational.den)),
        am.power(baseValue, Number(exponentRational.num)),
      ) === 0
    )
      return L_TRUE;
  }
  return L_UNDEF;
};

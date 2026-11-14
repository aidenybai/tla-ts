// Ported from Z3 (src/math/lp/nla_powers.cpp), MIT license, see z3-license.txt.
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

interface Ordered<Value> {
  compare(first: Value, second: Value): number;
  of(value: Rational): Value;
  add(first: Value, second: Value): Value;
}

export const checkPower = (core: NlaCore, result: number, base: number, exponent: number) => {
  if (base === NULL_LPVAR || exponent === NULL_LPVAR || result === NULL_LPVAR) return L_UNDEF;
  const addLemma = (...ineqs: Parameters<typeof mkIneq>[]) => {
    const lemma = new LemmaBuilder(core);
    for (const ineq of ineqs) lemma.addIneq(mkIneq(...ineq));
    return L_FALSE;
  };
  const checkAxioms = <Value>(
    ordered: Ordered<Value>,
    baseValue: Value,
    exponentValue: Value,
    resultValue: Value,
  ) => {
    const sign = (value: Value, bound: Rational) => ordered.compare(value, ordered.of(bound));
    if (
      sign(baseValue, Rational.zero) !== 0 &&
      sign(exponentValue, Rational.zero) === 0 &&
      sign(resultValue, Rational.one) !== 0
    )
      return addLemma([base, KIND_EQ, 0], [exponent, KIND_NE, 0], [result, KIND_EQ, 1]);
    if (
      sign(baseValue, Rational.zero) === 0 &&
      sign(exponentValue, Rational.zero) !== 0 &&
      sign(resultValue, Rational.zero) !== 0
    )
      return addLemma([base, KIND_NE, 0], [exponent, KIND_EQ, 0], [result, KIND_EQ, 0]);
    if (sign(baseValue, Rational.zero) > 0 && sign(resultValue, Rational.zero) <= 0)
      return addLemma([base, KIND_LE, 0], [result, KIND_GT, 0]);
    if (
      sign(baseValue, Rational.one) > 0 &&
      sign(exponentValue, Rational.zero) < 0 &&
      sign(resultValue, Rational.one) >= 0
    )
      return addLemma([base, KIND_LE, 1], [exponent, KIND_GE, 0], [result, KIND_LT, 1]);
    if (
      sign(baseValue, Rational.one) > 0 &&
      sign(exponentValue, Rational.zero) > 0 &&
      sign(resultValue, Rational.one) <= 0
    )
      return addLemma([base, KIND_LE, 1], [exponent, KIND_LE, 0], [result, KIND_GT, 1]);
    if (
      sign(baseValue, THREE) >= 0 &&
      sign(exponentValue, Rational.zero) > 0 &&
      ordered.compare(resultValue, ordered.add(exponentValue, ordered.of(Rational.one))) <= 0
    )
      return addLemma(
        [base, KIND_LT, THREE],
        [exponent, KIND_LE, 0],
        [
          new LarTerm([
            [result, Rational.one],
            [exponent, Rational.minusOne],
          ]),
          KIND_GT,
          1,
        ],
      );
    return undefined;
  };
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
    const axiom = checkAxioms(
      {
        compare: (first: Rational, second: Rational) => first.compare(second),
        of: (value) => value,
        add: (first, second) => first.add(second),
      },
      baseValue,
      exponentValue,
      resultValue,
    );
    if (axiom !== undefined) return axiom;
    if (baseValue.isPositive() && isUnsigned(exponentValue)) {
      const powerValue = baseValue.pow(Number(exponentValue.num));
      const comparison = resultValue.compare(powerValue);
      if (comparison === 0) return L_TRUE;
      if (core.random() % 2 === 0)
        return addLemma(
          [base, KIND_NE, baseValue],
          [exponent, KIND_NE, exponentValue],
          [result, KIND_EQ, powerValue],
        );
      const isIncreasing = baseValue.compare(Rational.one) >= 0;
      if (exponentValue.isPositive() && comparison < 0)
        return addLemma(
          [base, KIND_LT, baseValue],
          [exponent, isIncreasing ? KIND_LT : KIND_GT, exponentValue],
          ...(isIncreasing ? [] : [[exponent, KIND_LT, 0] as Parameters<typeof mkIneq>]),
          [result, KIND_GE, powerValue],
        );
      if (comparison > 0)
        return addLemma(
          [base, KIND_LE, 0],
          [base, KIND_GT, baseValue],
          [exponent, isIncreasing ? KIND_GT : KIND_LT, exponentValue],
          ...(isIncreasing ? [[exponent, KIND_LT, 0] as Parameters<typeof mkIneq>] : []),
          [result, KIND_LE, powerValue],
        );
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
  const axiom = checkAxioms(
    {
      compare: (first: Anum, second: Anum) => am.compare(first, second),
      of: (value) => new Anum(value),
      add: (first, second) => am.add(first, second),
    },
    baseValue,
    exponentValue,
    resultValue,
  );
  if (axiom !== undefined) return axiom;
  if (
    am.compare(baseValue, new Anum(Rational.zero)) > 0 &&
    am.compare(exponentValue, new Anum(Rational.zero)) > 0 &&
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

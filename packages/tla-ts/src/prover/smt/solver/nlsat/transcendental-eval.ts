// Ported from Z3 (src/nlsat/transcendental_eval.h, src/nlsat/transcendental_eval.cpp), MIT license,
// see z3-license.txt. Z3 evaluates with the platform's libm, and V8's Math functions can differ from
// it in the last bit.
import {
  OP_ACOS,
  OP_ACOSH,
  OP_ASIN,
  OP_ASINH,
  OP_ATAN,
  OP_ATANH,
  OP_COS,
  OP_COSH,
  OP_EXP,
  OP_LOG,
  OP_SIN,
  OP_SINH,
  OP_TAN,
  OP_TANH,
} from "../ast";
import { Rational } from "../rational";

export type TranscendentalOp =
  | "sin"
  | "cos"
  | "tan"
  | "asin"
  | "acos"
  | "atan"
  | "sinh"
  | "cosh"
  | "tanh"
  | "asinh"
  | "acosh"
  | "atanh"
  | "exp"
  | "log";

export const TRANSCENDENTAL_OPS = new Map<number, TranscendentalOp>([
  [OP_SIN, "sin"],
  [OP_COS, "cos"],
  [OP_TAN, "tan"],
  [OP_SINH, "sinh"],
  [OP_COSH, "cosh"],
  [OP_TANH, "tanh"],
  [OP_ASIN, "asin"],
  [OP_ACOS, "acos"],
  [OP_ATAN, "atan"],
  [OP_ASINH, "asinh"],
  [OP_ACOSH, "acosh"],
  [OP_ATANH, "atanh"],
  [OP_EXP, "exp"],
  [OP_LOG, "log"],
]);

const EVALUATORS: Record<TranscendentalOp, (value: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  asinh: Math.asinh,
  acosh: Math.acosh,
  atanh: Math.atanh,
  exp: Math.exp,
  log: Math.log,
};

// pi/2 and pi rounded outward by more than a double's rounding error.
export const PI_2_UPPER = Rational.fromDouble(1.5707963267948968);
export const PI_UPPER = Rational.fromDouble(3.1415926535897936);

// A rational bracket of pi, tight to about 1e-14.
export const PI_LOWER_BRACKET = Rational.of(314159265358979n, 10n ** 14n);
export const PI_UPPER_BRACKET = Rational.of(314159265358980n, 10n ** 14n);

const SAFETY = 64 * Number.EPSILON;
// Near a pole or the boundary of the domain, where the derivative blows up.
const BOUNDARY_SAFETY = 4096 * Number.EPSILON;

export const evalTranscendental = (op: TranscendentalOp, value: number) => EVALUATORS[op](value);

// A conservative bound on the round-off of evaluating op at value in double precision.
export const getErrorBound = (op: TranscendentalOp, value: number, result: number) => {
  switch (op) {
    case "sin":
    case "cos":
    case "atan":
    case "tanh":
    case "asinh":
      return SAFETY * Math.max(1, Math.abs(value));
    case "sinh":
    case "cosh":
    case "exp":
      return SAFETY * Math.max(1, Math.abs(result));
    default:
      return BOUNDARY_SAFETY * Math.max(1, Math.abs(value), Math.abs(result));
  }
};

const getNextAfter = (from: number, to: number) => {
  if (from === to) return to;
  if (from === 0) return to > 0 ? Number.MIN_VALUE : -Number.MIN_VALUE;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, from);
  const bits = view.getBigUint64(0);
  // The bits of a double grow with its magnitude.
  const isGrowing = from > 0 ? from < to : from > to;
  view.setBigUint64(0, isGrowing ? bits + 1n : bits - 1n);
  return view.getFloat64(0);
};

// Whether some integer k puts phase + k * period in [low, high]. It can only err toward true.
const containsMultipleOf = (low: number, high: number, phase: number, period: number) =>
  low <= high && phase + Math.ceil((low - phase) / period) * period <= high;

// An enclosure of op over [low, high] that accounts for an extremum of sin, cos or cosh inside
// it. Undefined when an endpoint or its value is not finite, or a pole of tan is strictly inside.
// Z3 does not check the endpoints, and converts an infinite one to a rational with undefined
// behavior.
export const getWideIntervalEval = (op: TranscendentalOp, low: number, high: number) => {
  if (!(low <= high) || !Number.isFinite(low) || !Number.isFinite(high)) return undefined;
  const lowValue = evalTranscendental(op, low);
  const highValue = evalTranscendental(op, high);
  if (!Number.isFinite(lowValue) || !Number.isFinite(highValue)) return undefined;
  let lowest = Math.min(lowValue, highValue);
  let highest = Math.max(lowValue, highValue);
  const pi = Math.PI;
  const twoPi = 2 * pi;
  if (op === "sin") {
    if (containsMultipleOf(low, high, pi / 2, twoPi)) highest = 1;
    if (containsMultipleOf(low, high, -pi / 2, twoPi)) lowest = -1;
  } else if (op === "cos") {
    if (containsMultipleOf(low, high, 0, twoPi)) highest = 1;
    if (containsMultipleOf(low, high, pi, twoPi)) lowest = -1;
  } else if (op === "tan") {
    if (containsMultipleOf(getNextAfter(low, high), getNextAfter(high, low), pi / 2, pi))
      return undefined;
  } else if (op === "cosh" && low <= 0 && 0 <= high) lowest = 1;
  const slack = Math.max(getErrorBound(op, low, lowValue), getErrorBound(op, high, highValue));
  return { low: lowest - slack, high: highest + slack };
};

const min = (first: Rational, second: Rational) => (second.compare(first) < 0 ? second : first);
const max = (first: Rational, second: Rational) => (first.compare(second) < 0 ? second : first);

// The partial sums of a series over a common denominator, since reducing every partial sum of
// dozens of terms costs a gcd of numbers thousands of bits long.
class Series {
  private den: bigint;
  private sum = 0n;
  private term: bigint;

  constructor(term: Rational) {
    this.term = term.num;
    this.den = term.den;
  }

  get value() {
    return Rational.of(this.sum, this.den);
  }

  get lastTerm() {
    return Rational.of(this.term, this.den);
  }

  // Adds sign * term / divisor.
  add(sign = 1n, divisor = 1n) {
    this.sum = this.sum * divisor + sign * this.term;
    this.term *= divisor;
    this.den *= divisor;
  }

  // Multiplies the term by num / den, where den > 0.
  scale(num: bigint, den: bigint) {
    this.term *= num;
    this.sum *= den;
    this.den *= den;
  }
}

// Of the partial sums after each of numTerms terms, the bracket is the last two.
const getLastTwoSums = (series: Series, numTerms: number, step: (index: number) => void) => {
  for (let index = 0; index < numTerms - 1; index++) step(index);
  const previous = series.value;
  step(numTerms - 1);
  const last = series.value;
  return { low: min(previous, last), high: max(previous, last) };
};

// The Maclaurin series of exp is alternating for x <= 0 once n + 1 >= |x|, so consecutive partial
// sums from there bracket it. For x > 0 a geometric series bounds the omitted tail.
export const getExpTaylorBracket = (value: Rational) => {
  const numTerms = 40;
  const series = new Series(Rational.one);
  const step = (index: number) => {
    series.add();
    series.scale(value.num, value.den * BigInt(index + 1));
  };
  if (!value.isPositive() && value.compare(Rational.of(BigInt(-numTerms))) > 0)
    return getLastTwoSums(series, numTerms, step);
  if (value.isPositive() && value.compare(Rational.of(BigInt(numTerms + 1))) < 0) {
    for (let index = 0; index < numTerms; index++) step(index);
    const ratio = value.div(Rational.of(BigInt(numTerms + 1)));
    const sum = series.value;
    return { low: sum, high: sum.add(series.lastTerm.div(Rational.one.sub(ratio))) };
  }
  return undefined;
};

// The Mercator series of log(1 + u) alternates for u in [0, 1].
export const getLogTaylorBracket = (value: Rational) => {
  if (value.compare(Rational.one) < 0 || value.compare(Rational.of(2n)) > 0) return undefined;
  const offset = value.sub(Rational.one);
  const series = new Series(offset);
  return getLastTwoSums(series, 60, (index) => {
    series.add(index % 2 === 0 ? 1n : -1n);
    series.scale(offset.num * BigInt(index + 1), offset.den * BigInt(index + 2));
  });
};

// The Maclaurin series of atan alternates for |x| <= 1.
export const getAtanTaylorBracket = (value: Rational) => {
  if (value.compare(Rational.minusOne) < 0 || value.compare(Rational.one) > 0) return undefined;
  const series = new Series(value);
  const square = value.mul(value);
  return getLastTwoSums(series, 40, (index) => {
    series.add(1n, BigInt(2 * index + 1));
    series.scale(-square.num, square.den);
  });
};

// The terms (-1)^k x^(2k+b) / (2k+b)! of sin (b = 1) and cos (b = 0) shrink once x^2 <= (2k+b+1) *
// (2k+b+2), and then keep shrinking, so consecutive partial sums from there bracket the value.
// Undefined when that takes more than the term budget.
const getSinCosTaylorBracketAt = (value: Rational, basePower: number) => {
  const numTerms = 60;
  const square = value.mul(value);
  const getGrowth = (index: number) => {
    const power = BigInt(2 * index + basePower);
    return (power + 1n) * (power + 2n);
  };
  let start = 0;
  while (start < numTerms && square.compare(Rational.of(getGrowth(start))) > 0) start++;
  if (start >= numTerms) return undefined;
  const series = new Series(basePower === 0 ? Rational.one : value);
  return getLastTwoSums(series, numTerms, (index) => {
    series.add();
    series.scale(-square.num, square.den * getGrowth(index));
  });
};

// Whether phase + k * period may fall in [low, high] for some integer k, where phase and period are
// only known up to brackets. A maybe counts as yes, and so does a range too wide to scan.
const containsPeriodicPoint = (
  low: Rational,
  high: Rational,
  phaseLow: Rational,
  phaseHigh: Rational,
  periodLow: Rational,
  periodHigh: Rational,
) => {
  const first = low.sub(phaseHigh).div(periodLow).floor().sub(Rational.one);
  const last = high.sub(phaseLow).div(periodLow).ceil().add(Rational.one);
  if (last.sub(first).compare(Rational.of(1000n)) > 0) return true;
  for (let index = first; index.compare(last) <= 0; index = index.add(Rational.one)) {
    const candidates = [
      phaseLow.add(index.mul(periodLow)),
      phaseHigh.add(index.mul(periodHigh)),
      phaseLow.add(index.mul(periodHigh)),
      phaseHigh.add(index.mul(periodLow)),
    ];
    const positionLow = candidates.reduce(min);
    const positionHigh = candidates.reduce(max);
    if (positionLow.compare(high) <= 0 && positionHigh.compare(low) >= 0) return true;
  }
  return false;
};

// An exact enclosure of sin or cos over [low, high], clamped to the extremal value when a
// multiple of pi / 2 or pi may fall inside it.
export const getSinCosTaylorBracket = (op: "sin" | "cos", low: Rational, high: Rational) => {
  const basePower = op === "sin" ? 1 : 0;
  const lowBracket = getSinCosTaylorBracketAt(low, basePower);
  const highBracket = lowBracket && getSinCosTaylorBracketAt(high, basePower);
  if (lowBracket === undefined || highBracket === undefined) return undefined;
  let result = {
    low: min(lowBracket.low, highBracket.low),
    high: max(lowBracket.high, highBracket.high),
  };
  const two = Rational.of(2n);
  const periodLow = two.mul(PI_LOWER_BRACKET);
  const periodHigh = two.mul(PI_UPPER_BRACKET);
  const [maxPhaseLow, maxPhaseHigh, minPhaseLow, minPhaseHigh] =
    op === "sin"
      ? [
          PI_LOWER_BRACKET.div(two),
          PI_UPPER_BRACKET.div(two),
          PI_UPPER_BRACKET.div(two).neg(),
          PI_LOWER_BRACKET.div(two).neg(),
        ]
      : [Rational.zero, Rational.zero, PI_LOWER_BRACKET, PI_UPPER_BRACKET];
  if (containsPeriodicPoint(low, high, maxPhaseLow, maxPhaseHigh, periodLow, periodHigh))
    result = { ...result, high: max(result.high, Rational.one) };
  if (containsPeriodicPoint(low, high, minPhaseLow, minPhaseHigh, periodLow, periodHigh))
    result = { ...result, low: min(result.low, Rational.minusOne) };
  return result;
};

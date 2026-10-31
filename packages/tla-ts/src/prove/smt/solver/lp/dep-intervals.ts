// Ported from Z3 (src/math/interval/interval.h, src/math/interval/interval_def.h,
// src/math/interval/dep_intervals.h, src/math/interval/dep_intervals.cpp), MIT license, see
// z3-license.txt. Exact rational intervals with open, closed, or infinite bounds, where each bound
// carries the dependency that justifies it. Only the operations nla_intervals, horner,
// pdd_interval, and monomial_bounds call are here; mpq is exact, so there is no rounding.
import { Rational } from "../rational";
import { type Dependency, linearize, mkJoin } from "./dependency";

export interface DepInterval {
  lower: Rational;
  upper: Rational;
  isLowerOpen: boolean;
  isUpperOpen: boolean;
  isLowerInf: boolean;
  isUpperInf: boolean;
  lowerDep: Dependency;
  upperDep: Dependency;
}

// with_deps_t: whether an operation also computes the dependencies of the result.
export type DepsMode = "with-deps" | "without-deps";

interface ExtNumeral {
  readonly kind: "minus-inf" | "numeral" | "plus-inf";
  readonly value: Rational;
}

// interval_deps_combine_rule: bitmasks of the argument bounds that justify each result bound.
interface CombineRule {
  readonly lower: number;
  readonly upper: number;
}

const DEP_IN_LOWER1 = 1;
const DEP_IN_UPPER1 = 2;
const DEP_IN_LOWER2 = 4;
const DEP_IN_UPPER2 = 8;

export const mkDepInterval = (): DepInterval => ({
  lower: Rational.zero,
  upper: Rational.zero,
  isLowerOpen: true,
  isUpperOpen: true,
  isLowerInf: true,
  isUpperInf: true,
  lowerDep: null,
  upperDep: null,
});

const MINUS_INF: ExtNumeral = { kind: "minus-inf", value: Rational.zero };
const PLUS_INF: ExtNumeral = { kind: "plus-inf", value: Rational.zero };
const mkNumeral = (value: Rational): ExtNumeral => ({ kind: "numeral", value });

const getLowerExt = (interval: DepInterval) =>
  interval.isLowerInf ? MINUS_INF : mkNumeral(interval.lower);
const getUpperExt = (interval: DepInterval) =>
  interval.isUpperInf ? PLUS_INF : mkNumeral(interval.upper);

const extIsZero = (numeral: ExtNumeral) => numeral.kind === "numeral" && numeral.value.isZero();
const extIsPos = (numeral: ExtNumeral) =>
  numeral.kind === "plus-inf" || (numeral.kind === "numeral" && numeral.value.isPositive());
const extIsNeg = (numeral: ExtNumeral) =>
  numeral.kind === "minus-inf" || (numeral.kind === "numeral" && numeral.value.isNegative());

const extAdd = (first: ExtNumeral, second: ExtNumeral) => {
  if (first.kind !== "numeral") return first;
  if (second.kind !== "numeral") return second;
  return mkNumeral(first.value.add(second.value));
};

const extMul = (first: ExtNumeral, second: ExtNumeral) => {
  if (extIsZero(first) || extIsZero(second)) return mkNumeral(Rational.zero);
  if (first.kind !== "numeral" || second.kind !== "numeral")
    return extIsPos(first) === extIsPos(second) ? PLUS_INF : MINUS_INF;
  return mkNumeral(first.value.mul(second.value));
};

const extDiv = (first: ExtNumeral, second: ExtNumeral) => {
  if (extIsZero(first)) return mkNumeral(Rational.zero);
  if (first.kind !== "numeral") return extIsPos(first) === extIsPos(second) ? PLUS_INF : MINUS_INF;
  if (second.kind !== "numeral") return mkNumeral(Rational.zero);
  return mkNumeral(first.value.div(second.value));
};

const extPower = (numeral: ExtNumeral, exponent: number) => {
  if (numeral.kind === "numeral") return mkNumeral(numeral.value.pow(exponent));
  return numeral.kind === "minus-inf" && exponent % 2 === 0 ? PLUS_INF : numeral;
};

const extEq = (first: ExtNumeral, second: ExtNumeral) =>
  first.kind === "numeral"
    ? second.kind === "numeral" && first.value.equals(second.value)
    : first.kind === second.kind;

const extLt = (first: ExtNumeral, second: ExtNumeral) => {
  if (first.kind === "minus-inf") return second.kind !== "minus-inf";
  if (first.kind === "plus-inf") return false;
  if (second.kind === "numeral") return first.value.compare(second.value) < 0;
  return second.kind === "plus-inf";
};

// The bounds of a result go in only after every bound of the arguments is read, since the result
// may be one of the arguments.
const setBounds = (
  result: DepInterval,
  lower: ExtNumeral,
  isLowerOpen: boolean,
  upper: ExtNumeral,
  isUpperOpen: boolean,
) => {
  result.lower = lower.value;
  result.isLowerInf = lower.kind === "minus-inf";
  result.isLowerOpen = isLowerOpen;
  result.upper = upper.value;
  result.isUpperInf = upper.kind === "plus-inf";
  result.isUpperOpen = isUpperOpen;
};

const lowerIsNeg = (interval: DepInterval) => extIsNeg(getLowerExt(interval));
const lowerIsPos = (interval: DepInterval) => extIsPos(getLowerExt(interval));
const lowerIsZero = (interval: DepInterval) => extIsZero(getLowerExt(interval));
const upperIsNeg = (interval: DepInterval) => extIsNeg(getUpperExt(interval));
const upperIsPos = (interval: DepInterval) => extIsPos(getUpperExt(interval));
const upperIsZero = (interval: DepInterval) => extIsZero(getUpperExt(interval));
const isP0 = (interval: DepInterval) => lowerIsZero(interval) && !interval.isLowerOpen;
const isP1 = (interval: DepInterval) =>
  lowerIsPos(interval) || (lowerIsZero(interval) && interval.isLowerOpen);
const isN = (interval: DepInterval) => upperIsNeg(interval) || upperIsZero(interval);
const isN0 = (interval: DepInterval) => upperIsZero(interval) && !interval.isUpperOpen;
const isN1 = (interval: DepInterval) =>
  upperIsNeg(interval) || (upperIsZero(interval) && interval.isUpperOpen);
const isM = (interval: DepInterval) => lowerIsNeg(interval) && upperIsPos(interval);
// interval_manager::is_zero, which unlike dep_intervals::is_zero ignores openness.
const areBoundsZero = (interval: DepInterval) => lowerIsZero(interval) && upperIsZero(interval);

const imSet = (target: DepInterval, source: DepInterval) => {
  if (target === source) return;
  if (!source.isLowerInf) target.lower = source.lower;
  target.isLowerInf = source.isLowerInf;
  if (!source.isUpperInf) target.upper = source.upper;
  target.isUpperInf = source.isUpperInf;
  target.isLowerOpen = source.isLowerOpen;
  target.isUpperOpen = source.isUpperOpen;
};

const imAdd = (first: DepInterval, second: DepInterval, result: DepInterval) =>
  setBounds(
    result,
    extAdd(getLowerExt(first), getLowerExt(second)),
    first.isLowerOpen || second.isLowerOpen,
    extAdd(getUpperExt(first), getUpperExt(second)),
    first.isUpperOpen || second.isUpperOpen,
  );

// div_mul with inv_k false.
const imMulScalar = (scalar: Rational, interval: DepInterval, result: DepInterval) => {
  if (scalar.isZero()) return setBounds(result, MINUS_INF, true, PLUS_INF, true);
  const factor = mkNumeral(scalar);
  const lower = extMul(getLowerExt(interval), factor);
  const upper = extMul(getUpperExt(interval), factor);
  if (scalar.isPositive())
    return setBounds(result, lower, interval.isLowerOpen, upper, interval.isUpperOpen);
  setBounds(result, upper, interval.isUpperOpen, lower, interval.isLowerOpen);
};

const imMul = (first: DepInterval, second: DepInterval, result: DepInterval) => {
  if (areBoundsZero(first)) return imSet(result, first);
  if (areBoundsZero(second)) return imSet(result, second);
  const a = getLowerExt(first);
  const b = getUpperExt(first);
  const c = getLowerExt(second);
  const d = getUpperExt(second);
  const isAOpen = first.isLowerOpen;
  const isBOpen = first.isUpperOpen;
  const isCOpen = second.isLowerOpen;
  const isDOpen = second.isUpperOpen;
  if (isN(first)) {
    if (isN(second))
      return setBounds(
        result,
        extMul(b, d),
        isN0(first) || isN0(second) ? false : isBOpen || isDOpen,
        extMul(a, c),
        isAOpen || isCOpen,
      );
    if (isM(second))
      return setBounds(result, extMul(a, d), isAOpen || isDOpen, extMul(a, c), isAOpen || isCOpen);
    return setBounds(
      result,
      extMul(a, d),
      isAOpen || isDOpen,
      extMul(b, c),
      isN0(first) || isP0(second) ? false : isBOpen || isCOpen,
    );
  }
  if (isM(first)) {
    if (isN(second))
      return setBounds(result, extMul(b, c), isBOpen || isCOpen, extMul(a, c), isAOpen || isCOpen);
    if (isM(second)) {
      const ad = extMul(a, d);
      const bc = extMul(b, c);
      const ac = extMul(a, c);
      const bd = extMul(b, d);
      const isAdOpen = isAOpen || isDOpen;
      const isBcOpen = isBOpen || isCOpen;
      const isAcOpen = isAOpen || isCOpen;
      const isBdOpen = isBOpen || isDOpen;
      const isAdLower = extLt(ad, bc) || (extEq(ad, bc) && !isAdOpen && isBcOpen);
      const isAcUpper = extLt(bd, ac) || (extEq(ac, bd) && !isAcOpen && isBdOpen);
      return setBounds(
        result,
        isAdLower ? ad : bc,
        isAdLower ? isAdOpen : isBcOpen,
        isAcUpper ? ac : bd,
        isAcUpper ? isAcOpen : isBdOpen,
      );
    }
    return setBounds(result, extMul(a, d), isAOpen || isDOpen, extMul(b, d), isBOpen || isDOpen);
  }
  if (isN(second))
    return setBounds(
      result,
      extMul(b, c),
      isBOpen || isCOpen,
      extMul(a, d),
      isP0(first) || isN0(second) ? false : isAOpen || isDOpen,
    );
  if (isM(second))
    return setBounds(result, extMul(b, c), isBOpen || isCOpen, extMul(b, d), isBOpen || isDOpen);
  setBounds(
    result,
    extMul(a, c),
    isP0(first) || isP0(second) ? false : isAOpen || isCOpen,
    extMul(b, d),
    isBOpen || isDOpen,
  );
};

// The divisor must not contain zero. Like Z3, a zero test of c or d reads the stored value.
const imDiv = (first: DepInterval, second: DepInterval, result: DepInterval) => {
  if (areBoundsZero(first))
    return setBounds(result, mkNumeral(Rational.zero), false, mkNumeral(Rational.zero), false);
  const a = getLowerExt(first);
  const b = getUpperExt(first);
  const c = getLowerExt(second);
  const d = getUpperExt(second);
  const isAOpen = first.isLowerOpen;
  const isBOpen = first.isUpperOpen;
  const isCOpen = second.isLowerOpen;
  const isDOpen = second.isUpperOpen;
  const isCZero = second.lower.isZero();
  const isDZero = second.upper.isZero();
  if (isN(first)) {
    if (isN1(second))
      return setBounds(
        result,
        extDiv(b, c),
        isN0(first) ? false : isBOpen || isCOpen,
        isDZero ? PLUS_INF : extDiv(a, d),
        isAOpen || isDOpen,
      );
    return setBounds(
      result,
      isCZero ? MINUS_INF : extDiv(a, c),
      isAOpen || isCOpen,
      extDiv(b, d),
      isN0(first) ? false : isBOpen || isDOpen,
    );
  }
  if (isM(first)) {
    if (isN1(second))
      return setBounds(
        result,
        isDZero ? MINUS_INF : extDiv(b, d),
        isBOpen || isDOpen,
        isDZero ? PLUS_INF : extDiv(a, d),
        isAOpen || isDOpen,
      );
    return setBounds(
      result,
      isCZero ? MINUS_INF : extDiv(a, c),
      isAOpen || isCOpen,
      isCZero ? PLUS_INF : extDiv(b, c),
      isBOpen || isCOpen,
    );
  }
  if (isN1(second))
    return setBounds(
      result,
      isDZero ? MINUS_INF : extDiv(b, d),
      isBOpen || isDOpen,
      extDiv(a, c),
      isP0(first) ? false : isAOpen || isCOpen,
    );
  setBounds(
    result,
    extDiv(a, d),
    isP0(first) ? false : isAOpen || isDOpen,
    isCZero ? PLUS_INF : extDiv(b, c),
    isBOpen || isCOpen,
  );
};

const imPower = (interval: DepInterval, exponent: number, result: DepInterval) => {
  if (exponent === 1) return imSet(result, interval);
  const lower = getLowerExt(interval);
  const upper = getUpperExt(interval);
  if (exponent % 2 === 1)
    return setBounds(
      result,
      interval.isLowerInf ? MINUS_INF : extPower(lower, exponent),
      interval.isLowerInf || interval.isLowerOpen,
      interval.isUpperInf ? PLUS_INF : extPower(upper, exponent),
      interval.isUpperInf || interval.isUpperOpen,
    );
  if (lowerIsPos(interval))
    return setBounds(
      result,
      extPower(lower, exponent),
      interval.isLowerOpen,
      interval.isUpperInf ? PLUS_INF : extPower(upper, exponent),
      interval.isUpperInf || interval.isUpperOpen,
    );
  if (upperIsNeg(interval))
    return setBounds(
      result,
      extPower(upper, exponent),
      interval.isUpperOpen,
      interval.isLowerInf ? PLUS_INF : extPower(lower, exponent),
      interval.isLowerInf || interval.isLowerOpen,
    );
  const lowerPower = extPower(lower, exponent);
  const upperPower = extPower(upper, exponent);
  const isLowerPowerMax =
    extLt(upperPower, lowerPower) ||
    (extEq(lowerPower, upperPower) && !interval.isLowerOpen && interval.isUpperOpen);
  setBounds(
    result,
    mkNumeral(Rational.zero),
    false,
    isLowerPowerMax ? lowerPower : upperPower,
    isLowerPowerMax ? interval.isLowerOpen : interval.isUpperOpen,
  );
};

const getAddRule = (): CombineRule => ({
  lower: DEP_IN_LOWER1 | DEP_IN_LOWER2,
  upper: DEP_IN_UPPER1 | DEP_IN_UPPER2,
});

const getMulRule = (first: DepInterval, second: DepInterval): CombineRule => {
  if (areBoundsZero(first))
    return { lower: DEP_IN_LOWER1 | DEP_IN_UPPER1, upper: DEP_IN_LOWER1 | DEP_IN_UPPER1 };
  if (areBoundsZero(second))
    return { lower: DEP_IN_LOWER2 | DEP_IN_UPPER2, upper: DEP_IN_LOWER2 | DEP_IN_UPPER2 };
  if (isN(first)) {
    if (isN(second))
      return {
        lower: DEP_IN_UPPER1 | DEP_IN_UPPER2,
        upper: DEP_IN_LOWER1 | DEP_IN_LOWER2 | DEP_IN_UPPER1,
      };
    if (isM(second))
      return {
        lower: DEP_IN_LOWER1 | DEP_IN_UPPER2 | DEP_IN_UPPER1,
        upper: DEP_IN_LOWER1 | DEP_IN_LOWER2 | DEP_IN_UPPER1,
      };
    return {
      lower: DEP_IN_LOWER1 | DEP_IN_UPPER2 | DEP_IN_UPPER1,
      upper: DEP_IN_UPPER1 | DEP_IN_LOWER2,
    };
  }
  if (isM(first)) {
    if (isN(second))
      return {
        lower: DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
        upper: DEP_IN_LOWER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
      };
    if (isM(second))
      return {
        lower: DEP_IN_LOWER1 | DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
        upper: DEP_IN_LOWER1 | DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
      };
    return {
      lower: DEP_IN_LOWER1 | DEP_IN_UPPER2 | DEP_IN_LOWER2,
      upper: DEP_IN_UPPER1 | DEP_IN_UPPER2 | DEP_IN_LOWER2,
    };
  }
  if (isN(second))
    return {
      lower: DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_LOWER1,
      upper: DEP_IN_LOWER1 | DEP_IN_UPPER2,
    };
  if (isM(second))
    return {
      lower: DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_LOWER1,
      upper: DEP_IN_UPPER1 | DEP_IN_UPPER2 | DEP_IN_LOWER1,
    };
  return {
    lower: DEP_IN_LOWER1 | DEP_IN_LOWER2,
    upper: DEP_IN_UPPER1 | DEP_IN_UPPER2 | DEP_IN_LOWER1,
  };
};

const getDivRule = (first: DepInterval, second: DepInterval): CombineRule => {
  if (areBoundsZero(first))
    return isP1(second)
      ? { lower: DEP_IN_LOWER1 | DEP_IN_LOWER2, upper: DEP_IN_UPPER1 | DEP_IN_LOWER2 }
      : { lower: DEP_IN_UPPER1 | DEP_IN_UPPER2, upper: DEP_IN_LOWER1 | DEP_IN_UPPER2 };
  if (isN(first))
    return isN1(second)
      ? {
          lower: DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
          upper: DEP_IN_LOWER1 | DEP_IN_UPPER2,
        }
      : {
          lower: DEP_IN_LOWER1 | DEP_IN_LOWER2,
          upper: DEP_IN_UPPER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
        };
  if (isM(first))
    return isN1(second)
      ? { lower: DEP_IN_UPPER1 | DEP_IN_UPPER2, upper: DEP_IN_LOWER1 | DEP_IN_UPPER2 }
      : { lower: DEP_IN_LOWER1 | DEP_IN_LOWER2, upper: DEP_IN_UPPER1 | DEP_IN_LOWER2 };
  return isN1(second)
    ? {
        lower: DEP_IN_UPPER1 | DEP_IN_UPPER2,
        upper: DEP_IN_LOWER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
      }
    : {
        lower: DEP_IN_LOWER1 | DEP_IN_LOWER2 | DEP_IN_UPPER2,
        upper: DEP_IN_UPPER1 | DEP_IN_LOWER2,
      };
};

const getPowerRule = (interval: DepInterval, exponent: number): CombineRule => {
  if (exponent === 1) return { lower: DEP_IN_LOWER1, upper: DEP_IN_UPPER1 };
  if (exponent % 2 === 1)
    return {
      lower: interval.isLowerInf ? 0 : DEP_IN_LOWER1,
      upper: interval.isUpperInf ? 0 : DEP_IN_UPPER1,
    };
  if (lowerIsPos(interval))
    return {
      lower: DEP_IN_LOWER1,
      upper: interval.isUpperInf ? 0 : DEP_IN_LOWER1 | DEP_IN_UPPER1,
    };
  if (upperIsNeg(interval))
    return {
      lower: DEP_IN_UPPER1,
      upper: interval.isLowerInf ? 0 : DEP_IN_LOWER1 | DEP_IN_UPPER1,
    };
  return { lower: 0, upper: DEP_IN_LOWER1 | DEP_IN_UPPER1 };
};

// im_config::mk_dependency: the joined dependencies of the bounds in the mask.
const mkDependency = (first: DepInterval, second: DepInterval | null, mask: number) => {
  const withLower1 = mask & DEP_IN_LOWER1 ? first.lowerDep : null;
  const withLower2 =
    second !== null && mask & DEP_IN_LOWER2 ? mkJoin(withLower1, second.lowerDep) : withLower1;
  const withUpper1 = mask & DEP_IN_UPPER1 ? mkJoin(withLower2, first.upperDep) : withLower2;
  return second !== null && mask & DEP_IN_UPPER2 ? mkJoin(withUpper1, second.upperDep) : withUpper1;
};

// im_config::add_deps.
const combineDeps = (
  first: DepInterval,
  second: DepInterval | null,
  rule: CombineRule,
  result: DepInterval,
) => {
  const lowerDep = result.isLowerInf ? null : mkDependency(first, second, rule.lower);
  const upperDep = result.isUpperInf ? null : mkDependency(first, second, rule.upper);
  result.lowerDep = lowerDep;
  result.upperDep = upperDep;
};

export const set = (target: DepInterval, source: DepInterval, mode: DepsMode) => {
  imSet(target, source);
  if (mode === "without-deps") return;
  target.lowerDep = source.lowerDep;
  target.upperDep = source.upperDep;
};

export const power = (
  interval: DepInterval,
  exponent: number,
  result: DepInterval,
  mode: DepsMode,
) => {
  if (exponent === 1 && interval === result) return;
  const rule = getPowerRule(interval, exponent);
  imPower(interval, exponent, result);
  if (mode === "with-deps") combineDeps(interval, null, rule, result);
};

export const mulScalar = (
  scalar: Rational,
  interval: DepInterval,
  result: DepInterval,
  mode: DepsMode,
) => {
  const lowerDep = interval.lowerDep;
  const upperDep = interval.upperDep;
  imMulScalar(scalar, interval, result);
  if (mode === "without-deps") return;
  result.lowerDep = scalar.isPositive() ? lowerDep : upperDep;
  result.upperDep = scalar.isPositive() ? upperDep : lowerDep;
};

export const mul = (
  first: DepInterval,
  second: DepInterval,
  result: DepInterval,
  mode: DepsMode,
) => {
  const rule = getMulRule(first, second);
  imMul(first, second, result);
  if (mode === "with-deps") combineDeps(first, second, rule, result);
};

export const div = (
  first: DepInterval,
  second: DepInterval,
  result: DepInterval,
  mode: DepsMode,
) => {
  const rule = getDivRule(first, second);
  imDiv(first, second, result);
  if (mode === "with-deps") combineDeps(first, second, rule, result);
};

export const add = (
  first: DepInterval,
  second: DepInterval,
  result: DepInterval,
  mode: DepsMode,
) => {
  imAdd(first, second, result);
  if (mode === "with-deps") combineDeps(first, second, getAddRule(), result);
};

// add(rational, interval): shifts the finite bounds and keeps the dependencies.
export const addScalar = (scalar: Rational, interval: DepInterval) => {
  if (!interval.isLowerInf) interval.lower = interval.lower.add(scalar);
  if (!interval.isUpperInf) interval.upper = interval.upper.add(scalar);
};

const copyLowerBound = (source: DepInterval, target: DepInterval, mode: DepsMode) => {
  target.isLowerInf = false;
  target.lower = source.lower;
  target.isLowerOpen = source.isLowerOpen;
  if (mode === "with-deps") target.lowerDep = source.lowerDep;
};

const copyUpperBound = (source: DepInterval, target: DepInterval, mode: DepsMode) => {
  target.isUpperInf = false;
  target.upper = source.upper;
  target.isUpperOpen = source.isUpperOpen;
  if (mode === "with-deps") target.upperDep = source.upperDep;
};

// On equal bounds the bound of first wins if it is open, else the bound of second.
export const intersect = (
  first: DepInterval,
  second: DepInterval,
  result: DepInterval,
  mode: DepsMode,
) => {
  if (!first.isLowerInf || !second.isLowerInf) {
    const isFirstLower =
      second.isLowerInf ||
      (!first.isLowerInf &&
        (first.lower.compare(second.lower) > 0 ||
          (first.lower.equals(second.lower) && first.isLowerOpen)));
    copyLowerBound(isFirstLower ? first : second, result, mode);
  }
  if (!first.isUpperInf || !second.isUpperInf) {
    const isFirstUpper =
      second.isUpperInf ||
      (!first.isUpperInf &&
        (first.upper.compare(second.upper) < 0 ||
          (first.upper.equals(second.upper) && first.isUpperOpen)));
    copyUpperBound(isFirstUpper ? first : second, result, mode);
  }
};

// set_value and set_interval_for_scalar: the closed point interval, keeping the dependencies.
export const setValue = (interval: DepInterval, value: Rational) =>
  setBounds(interval, mkNumeral(value), false, mkNumeral(value), false);

// reset: both bounds infinite, keeping the values, openness, and dependencies.
export const reset = (interval: DepInterval) => {
  interval.isLowerInf = true;
  interval.isUpperInf = true;
};

export const setZeroIntervalDepsForMult = (interval: DepInterval) => {
  interval.lowerDep = mkJoin(interval.lowerDep, interval.upperDep);
  interval.upperDep = interval.lowerDep;
};

export const isZero = (interval: DepInterval) =>
  !interval.isLowerInf &&
  !interval.isUpperInf &&
  !interval.isLowerOpen &&
  !interval.isUpperOpen &&
  interval.lower.isZero() &&
  interval.upper.isZero();

export const isEmpty = (interval: DepInterval) => {
  if (interval.isLowerInf || interval.isUpperInf) return false;
  const comparison = interval.lower.compare(interval.upper);
  return comparison > 0 || (comparison === 0 && (interval.isLowerOpen || interval.isUpperOpen));
};

const separatedFromZeroOnLower = (interval: DepInterval) =>
  !interval.isLowerInf &&
  !interval.lower.isNegative() &&
  !(interval.lower.isZero() && !interval.isLowerOpen);

const separatedFromZeroOnUpper = (interval: DepInterval) =>
  !interval.isUpperInf &&
  !interval.upper.isPositive() &&
  !(interval.upper.isZero() && !interval.isUpperOpen);

export const separatedFromZero = (interval: DepInterval) =>
  separatedFromZeroOnUpper(interval) || separatedFromZeroOnLower(interval);

// When the interval excludes zero, reports the joined dependency of dep and the separating bound,
// lower first.
export const checkIntervalForConflictOnZero = (
  interval: DepInterval,
  dep: Dependency,
  report: (explanation: number[]) => void,
) => {
  if (separatedFromZeroOnLower(interval)) {
    report(linearize([mkJoin(dep, interval.lowerDep)]));
    return true;
  }
  if (!separatedFromZeroOnUpper(interval)) return false;
  report(linearize([mkJoin(dep, interval.upperDep)]));
  return true;
};

export const displayDepInterval = (interval: DepInterval) => {
  const lower = interval.isLowerInf
    ? "(-oo"
    : `${interval.isLowerOpen ? "(" : "["}${interval.lower.toString()}`;
  const upper = interval.isUpperInf
    ? "oo)"
    : `${interval.upper.toString()}${interval.isUpperOpen ? ")" : "]"}`;
  const lowerDeps =
    interval.lowerDep === null ? "" : ` ld ${linearize([interval.lowerDep]).join(" ")}`;
  const upperDeps =
    interval.upperDep === null ? "" : ` ud ${linearize([interval.upperDep]).join(" ")}`;
  return `${lower},${upper}${lowerDeps}${upperDeps}`;
};

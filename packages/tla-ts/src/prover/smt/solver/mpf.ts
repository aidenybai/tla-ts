// Ported from Z3 (src/util/mpf.h, src/util/mpf.cpp), MIT license, see z3-license.txt.
import { Rational } from "./rational";

export const MPF_ROUND_NEAREST_TEVEN = 0;
export const MPF_ROUND_NEAREST_TAWAY = 1;
export const MPF_ROUND_TOWARD_POSITIVE = 2;
export const MPF_ROUND_TOWARD_NEGATIVE = 3;
export const MPF_ROUND_TOWARD_ZERO = 4;

export const MPF_MAX_SBITS = (1 << 16) - 1;

export interface Mpf {
  ebits: number;
  sbits: number;
  sign: boolean;
  significand: bigint;
  exponent: number;
}

const getPower = (exponent: number) => 1n << BigInt(exponent);

const isOdd = (value: bigint) => (value & 1n) === 1n;

const getPrevPowerOfTwo = (value: bigint) => (value <= 0n ? 0 : value.toString(2).length - 1);

const getBitSize = (value: bigint) => getPrevPowerOfTwo(value < 0n ? -value : value) + 1;

const getPowerOfTwoMultiple = (value: bigint) => {
  if (value === 0n) return 0;
  let count = 0;
  for (let rest = value < 0n ? -value : value; (rest & 1n) === 0n; rest >>= 1n) count++;
  return count;
};

// An inexact root comes out one too large, as the callers expect.
const getRoot = (value: bigint) => {
  if (value < 2n) return { root: value, isExact: true };
  let low = 1n;
  let high = getPower(Math.ceil((getPrevPowerOfTwo(value) + 1) / 2));
  while (high - low > 1n) {
    const mid = (low + high) >> 1n;
    if (mid * mid <= value) low = mid;
    else high = mid;
  }
  return low * low === value ? { root: low, isExact: true } : { root: low + 1n, isExact: false };
};

export const mkBotExp = (ebits: number) => -(2 ** (ebits - 1) - 1);

export const mkTopExp = (ebits: number) => 2 ** (ebits - 1);

export const mkMinExp = (ebits: number) => mkBotExp(ebits) + 1;

export const mkMaxExp = (ebits: number) => 2 ** (ebits - 1) - 1;

export const biasExp = (ebits: number, exponent: number) => exponent + mkMaxExp(ebits);

export const unbiasExp = (ebits: number, exponent: number) => exponent - mkMaxExp(ebits);

export const mkMpf = (
  ebits: number,
  sbits: number,
  sign: boolean,
  exponent: number,
  significand: bigint,
): Mpf => ({ ebits, sbits, sign, significand, exponent });

export const mkZero = (ebits: number, sbits: number, sign: boolean) =>
  mkMpf(ebits, sbits, sign, mkBotExp(ebits), 0n);

export const mkNan = (ebits: number, sbits: number) =>
  mkMpf(ebits, sbits, false, mkTopExp(ebits), getPower(sbits - 1) - 1n);

export const mkInf = (ebits: number, sbits: number, sign: boolean) =>
  mkMpf(ebits, sbits, sign, mkTopExp(ebits), 0n);

const mkOne = (ebits: number, sbits: number, sign: boolean) => mkMpf(ebits, sbits, sign, 0, 0n);

export const mkMaxValue = (ebits: number, sbits: number, sign: boolean) =>
  mkMpf(ebits, sbits, sign, mkTopExp(ebits) - 1, getPower(sbits - 1) - 1n);

const copy = (value: Mpf): Mpf => ({ ...value });

const hasBotExp = (value: Mpf) => value.exponent === mkBotExp(value.ebits);

const hasTopExp = (value: Mpf) => value.exponent === mkTopExp(value.ebits);

export const isNan = (value: Mpf) => hasTopExp(value) && value.significand !== 0n;

export const isInf = (value: Mpf) => hasTopExp(value) && value.significand === 0n;

export const isZero = (value: Mpf) => hasBotExp(value) && value.significand === 0n;

export const isPinf = (value: Mpf) => !value.sign && isInf(value);

const isNinf = (value: Mpf) => value.sign && isInf(value);

export const isPzero = (value: Mpf) => !value.sign && isZero(value);

export const isNeg = (value: Mpf) => value.sign && !isNan(value);

export const isPos = (value: Mpf) => !value.sign && !isNan(value);

export const isDenormal = (value: Mpf) => !isZero(value) && hasBotExp(value);

export const isNormal = (value: Mpf) => !(hasTopExp(value) || isDenormal(value) || isZero(value));

export const mpfEq = (first: Mpf, second: Mpf) => {
  if (isNan(first) || isNan(second)) return false;
  if (isZero(first) && isZero(second)) return true;
  if (first.sign !== second.sign) return false;
  return first.exponent === second.exponent && first.significand === second.significand;
};

export const mpfLt = (first: Mpf, second: Mpf) => {
  if (isNan(first) || isNan(second)) return false;
  if (isZero(first) && isZero(second)) return false;
  if (first.sign)
    return (
      !second.sign ||
      second.exponent < first.exponent ||
      (second.exponent === first.exponent && second.significand < first.significand)
    );
  if (second.sign) return false;
  return (
    first.exponent < second.exponent ||
    (first.exponent === second.exponent && first.significand < second.significand)
  );
};

export const mpfLe = (first: Mpf, second: Mpf) => mpfLt(first, second) || mpfEq(first, second);

const mpfGt = (first: Mpf, second: Mpf) => {
  if (isNan(first) || isNan(second)) return false;
  if (isZero(first) && isZero(second)) return false;
  return !mpfLe(first, second);
};

export const mpfNeg = (value: Mpf) =>
  isNan(value) ? copy(value) : { ...value, sign: !value.sign };

const unpack = (value: Mpf, isNormalizing: boolean) => {
  if (isZero(value)) return;
  if (isNormal(value)) {
    value.significand += getPower(value.sbits - 1);
    return;
  }
  value.exponent = mkBotExp(value.ebits) + 1;
  if (!isNormalizing || value.significand === 0n) return;
  const power = getPower(value.sbits - 1);
  while (power > value.significand) {
    value.exponent--;
    value.significand <<= 1n;
  }
};

const mkRoundInf = (rm: number, value: Mpf) => {
  const isToMax = value.sign
    ? rm === MPF_ROUND_TOWARD_ZERO || rm === MPF_ROUND_TOWARD_POSITIVE
    : rm === MPF_ROUND_TOWARD_ZERO || rm === MPF_ROUND_TOWARD_NEGATIVE;
  const rounded = isToMax
    ? mkMaxValue(value.ebits, value.sbits, value.sign)
    : mkInf(value.ebits, value.sbits, value.sign);
  value.exponent = rounded.exponent;
  value.significand = rounded.significand;
};

const getRoundingIncrement = (
  rm: number,
  sign: boolean,
  last: boolean,
  round: boolean,
  sticky: boolean,
) =>
  rm === MPF_ROUND_NEAREST_TEVEN
    ? round && (last || sticky)
    : rm === MPF_ROUND_NEAREST_TAWAY
      ? round
      : rm === MPF_ROUND_TOWARD_POSITIVE
        ? !sign && (round || sticky)
        : rm === MPF_ROUND_TOWARD_NEGATIVE
          ? sign && (round || sticky)
          : false;

const round = (rm: number, value: Mpf) => {
  const maxExp = mkMaxExp(value.ebits);
  const minExp = mkMinExp(value.ebits);
  const sigWidth = getPrevPowerOfTwo(value.significand) + 1;
  const leadingZeros = value.sbits + 4 - sigWidth;
  const beta = value.exponent - leadingZeros + 1;
  const sigma = Math.max(
    beta < minExp ? value.exponent - minExp : leadingZeros - 1,
    -(value.sbits + 2),
  );
  value.exponent = beta < minExp ? minExp : beta;
  if (sigma <= -1) {
    const divisor = getPower(-sigma);
    const remainder = value.significand % divisor;
    value.significand /= divisor;
    if (remainder !== 0n && !isOdd(value.significand)) value.significand++;
  } else value.significand <<= BigInt(sigma);
  const isLowSticky = isOdd(value.significand);
  value.significand >>= 1n;
  const sticky = isLowSticky || isOdd(value.significand);
  value.significand >>= 1n;
  const roundBit = isOdd(value.significand);
  value.significand >>= 1n;
  const last = isOdd(value.significand);
  if (getRoundingIncrement(rm, value.sign, last, roundBit, sticky)) value.significand++;
  if (value.significand >= getPower(value.sbits)) {
    value.significand >>= 1n;
    value.exponent++;
  }
  if (value.exponent > maxExp) {
    mkRoundInf(rm, value);
    return;
  }
  const hidden = getPower(value.sbits - 1);
  if (value.significand >= hidden) value.significand -= hidden;
  else value.exponent = mkBotExp(value.ebits);
};

export const mpfFromRational = (
  ebits: number,
  sbits: number,
  rm: number,
  exponent: bigint,
  significand: Rational,
): Mpf => {
  const sign = significand.isNegative();
  if (significand.isZero()) return mkZero(ebits, sbits, sign);
  let sig = significand.abs();
  let exp = exponent;
  if (sig.compare(Rational.one) < 0) {
    const inverse = Rational.one.div(sig);
    const floor = inverse.floor();
    const isPowerOfTwo = inverse.isInt() && floor.num > 0n && (floor.num & (floor.num - 1n)) === 0n;
    const power = getPrevPowerOfTwo(floor.num) + (isPowerOfTwo ? 0 : 1);
    sig = sig.mul(Rational.of(getPower(power)));
    exp -= BigInt(power);
  } else if (sig.compare(Rational.of(2n)) >= 0) {
    const power = getPrevPowerOfTwo(sig.floor().num);
    sig = sig.div(Rational.of(getPower(power)));
    exp += BigInt(power);
  }
  const value = mkMpf(ebits, sbits, sign, 0, 0n);
  if (exp > BigInt(mkMaxExp(ebits))) {
    mkRoundInf(rm, value);
    return value;
  }
  const scale = Rational.of(getPower(sbits + 2));
  value.significand = scale.mul(sig).floor().num;
  const rest = sig.sub(Rational.of(value.significand).div(scale));
  if (!rest.isZero() && !isOdd(value.significand)) value.significand++;
  const minExp = mkMinExp(ebits) - sbits - 4;
  value.exponent = exp < BigInt(minExp) ? minExp : Number(exp);
  round(rm, value);
  return value;
};

export const mpfToFormat = (ebits: number, sbits: number, rm: number, value: Mpf): Mpf => {
  if (isNan(value)) return mkNan(ebits, sbits);
  if (isInf(value)) return mkInf(ebits, sbits, value.sign);
  if (isZero(value)) return mkZero(ebits, sbits, value.sign);
  if (value.ebits === ebits && value.sbits === sbits) return copy(value);
  const result = copy(value);
  unpack(result, true);
  result.ebits = ebits;
  result.sbits = sbits;
  const shift = sbits - value.sbits + 3;
  if (shift > 0) result.significand <<= BigInt(shift);
  else if (shift < 0) {
    let sticky = false;
    for (let rest = shift; rest < 0; rest++) {
      sticky ||= isOdd(result.significand);
      result.significand >>= 1n;
    }
    if (sticky && !isOdd(result.significand)) result.significand++;
  }
  round(rm, result);
  return result;
};

const mpfAddSub = (rm: number, first: Mpf, second: Mpf, isSub: boolean): Mpf => {
  const ebits = first.ebits;
  const sbits = first.sbits;
  const secondSign = second.sign !== isSub;
  if (isNan(first) || isNan(second)) return mkNan(ebits, sbits);
  if (isInf(first))
    return isInf(second) && first.sign !== secondSign ? mkNan(ebits, sbits) : copy(first);
  if (isInf(second)) return { ...second, sign: secondSign };
  if (isZero(first) && isZero(second))
    return mkZero(
      ebits,
      sbits,
      (first.sign && secondSign) || (rm === MPF_ROUND_TOWARD_NEGATIVE && first.sign !== secondSign),
    );
  if (isZero(first)) return { ...second, sign: secondSign };
  if (isZero(second)) return copy(first);
  const left = copy(first);
  const right = { ...second, sign: secondSign };
  unpack(left, false);
  unpack(right, false);
  const isSwapped = right.exponent > left.exponent;
  const a = isSwapped ? right : left;
  const b = isSwapped ? left : right;
  const delta = Math.min(a.exponent - b.exponent, sbits + 2);
  a.significand <<= 3n;
  b.significand <<= 3n;
  const divisor = getPower(delta);
  const stickyRemainder = b.significand % divisor;
  b.significand /= divisor;
  const result = mkMpf(ebits, sbits, false, 0, 0n);
  if (a.sign !== b.sign) {
    result.significand = a.significand - b.significand;
    if (stickyRemainder !== 0n && !isOdd(result.significand)) result.significand--;
  } else {
    result.significand = a.significand + b.significand;
    if (stickyRemainder !== 0n && !isOdd(result.significand)) result.significand++;
  }
  if (result.significand === 0n) return mkZero(ebits, sbits, rm === MPF_ROUND_TOWARD_NEGATIVE);
  const isNegative = result.significand < 0n;
  if (isNegative) result.significand = -result.significand;
  result.sign =
    (!a.sign && b.sign && isNegative) || (a.sign && !b.sign && !isNegative) || (a.sign && b.sign);
  result.exponent = a.exponent;
  round(rm, result);
  return result;
};

export const mpfAdd = (rm: number, first: Mpf, second: Mpf) => mpfAddSub(rm, first, second, false);

export const mpfMul = (rm: number, first: Mpf, second: Mpf): Mpf => {
  const ebits = first.ebits;
  const sbits = first.sbits;
  if (isNan(first) || isNan(second)) return mkNan(ebits, sbits);
  if (isPinf(first)) return isZero(second) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, second.sign);
  if (isPinf(second)) return isZero(first) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, first.sign);
  if (isNinf(first))
    return isZero(second) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, !second.sign);
  if (isNinf(second)) return isZero(first) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, !first.sign);
  if (isZero(first) || isZero(second)) return mkZero(ebits, sbits, first.sign !== second.sign);
  const a = copy(first);
  const b = copy(second);
  unpack(a, true);
  unpack(b, true);
  const result = mkMpf(
    ebits,
    sbits,
    first.sign !== second.sign,
    a.exponent + b.exponent,
    a.significand * b.significand,
  );
  if (sbits >= 4) {
    const divisor = getPower(sbits - 4);
    const stickyRemainder = result.significand % divisor;
    result.significand /= divisor;
    if (stickyRemainder !== 0n && !isOdd(result.significand)) result.significand++;
  } else result.significand <<= BigInt(4 - sbits);
  round(rm, result);
  return result;
};

export const mpfDiv = (rm: number, first: Mpf, second: Mpf): Mpf => {
  const ebits = first.ebits;
  const sbits = first.sbits;
  if (isNan(first) || isNan(second)) return mkNan(ebits, sbits);
  if (isPinf(first)) return isInf(second) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, second.sign);
  if (isPinf(second))
    return isInf(first) ? mkNan(ebits, sbits) : mkZero(ebits, sbits, first.sign !== second.sign);
  if (isNinf(first)) return isInf(second) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, !second.sign);
  if (isNinf(second))
    return isInf(first) ? mkNan(ebits, sbits) : mkZero(ebits, sbits, first.sign !== second.sign);
  if (isZero(second))
    return isZero(first) ? mkNan(ebits, sbits) : mkInf(ebits, sbits, first.sign !== second.sign);
  if (isZero(first)) return mkZero(ebits, sbits, first.sign !== second.sign);
  const a = copy(first);
  const b = copy(second);
  unpack(a, true);
  unpack(b, true);
  const extraBits = sbits + 2;
  const quotient = (a.significand << BigInt(sbits + extraBits)) / b.significand;
  const divisor = getPower(extraBits - 2);
  const result = mkMpf(
    ebits,
    sbits,
    first.sign !== second.sign,
    a.exponent - b.exponent,
    quotient / divisor,
  );
  if (quotient % divisor !== 0n && !isOdd(result.significand)) result.significand++;
  round(rm, result);
  return result;
};

export const mpfFma = (rm: number, first: Mpf, second: Mpf, third: Mpf): Mpf => {
  const ebits = first.ebits;
  const sbits = first.sbits;
  if (isNan(first) || isNan(second) || isNan(third)) return mkNan(ebits, sbits);
  const isInfClash = isInf(third) && (first.sign !== second.sign) !== third.sign;
  if (isPinf(first))
    return isZero(second) || isInfClash ? mkNan(ebits, sbits) : mkInf(ebits, sbits, second.sign);
  if (isPinf(second))
    return isZero(first) || isInfClash ? mkNan(ebits, sbits) : mkInf(ebits, sbits, first.sign);
  if (isNinf(first))
    return isZero(second) || isInfClash ? mkNan(ebits, sbits) : mkInf(ebits, sbits, !second.sign);
  if (isNinf(second))
    return isZero(first) || isInfClash ? mkNan(ebits, sbits) : mkInf(ebits, sbits, !first.sign);
  if (isInf(third)) return copy(third);
  if (isZero(first) || isZero(second))
    return isZero(third) && (first.sign !== second.sign) !== third.sign
      ? mkZero(ebits, sbits, rm === MPF_ROUND_TOWARD_NEGATIVE)
      : copy(third);
  const a = copy(first);
  const b = copy(second);
  const c = copy(third);
  unpack(a, true);
  unpack(b, true);
  unpack(c, true);
  const product = mkMpf(
    ebits + 2,
    2 * sbits - 1 + 3,
    a.sign !== b.sign,
    a.exponent + b.exponent,
    (a.significand * b.significand) << 3n,
  );
  const addend = mkMpf(
    ebits + 2,
    2 * sbits - 1 + 3,
    c.sign,
    c.exponent,
    c.significand << BigInt(sbits - 1 + 3),
  );
  const isSwapped = addend.exponent > product.exponent;
  const larger = isSwapped ? addend : product;
  const smaller = isSwapped ? product : addend;
  const delta = Math.min(larger.exponent - smaller.exponent, 2 * sbits + 3);
  const divisor = getPower(delta);
  const isAlignmentSticky = smaller.significand % divisor !== 0n;
  smaller.significand /= divisor;
  const sum = copy(larger);
  if (larger.sign !== smaller.sign) {
    sum.significand = larger.significand - smaller.significand;
    if (isAlignmentSticky && !isOdd(sum.significand)) sum.significand--;
    if (sum.significand < 0n) {
      sum.significand = -sum.significand;
      sum.sign = !sum.sign;
    }
  } else {
    sum.significand = larger.significand + smaller.significand;
    if (isAlignmentSticky && !isOdd(sum.significand)) sum.significand++;
  }
  let isRenormSticky = false;
  if (sum.significand >= getPower(2 * sbits + 3)) {
    sum.exponent++;
    isRenormSticky = isOdd(sum.significand);
    sum.significand >>= 1n;
  }
  const sigWidth = getPrevPowerOfTwo(sum.significand) + 1;
  const renormDelta = Math.max(
    0,
    Math.min(2 * sbits + 3 - sigWidth, sum.exponent - mkMinExp(ebits)),
  );
  sum.exponent -= renormDelta;
  sum.significand <<= BigInt(renormDelta);
  const result = mkMpf(ebits, sbits, sum.sign, sum.exponent, 0n);
  if (sbits >= 4) {
    const shift = getPower(sbits - 4 + 3);
    result.significand = sum.significand / shift;
    isRenormSticky ||= sum.significand % shift !== 0n;
  } else {
    result.significand = sum.significand << BigInt(4 - sbits + 3);
    result.exponent -= 4 - sbits + 3;
  }
  if (isRenormSticky && !isOdd(result.significand)) result.significand++;
  const maxSize = sbits + 4;
  const sigSize = getBitSize(result.significand);
  if (sigSize > maxSize) {
    result.significand >>= BigInt(sigSize - maxSize);
    result.exponent += sigSize - maxSize;
  }
  if (result.significand === 0n) return mkZero(ebits, sbits, rm === MPF_ROUND_TOWARD_NEGATIVE);
  round(rm, result);
  return result;
};

export const mpfSqrt = (rm: number, value: Mpf): Mpf => {
  if (isNan(value)) return mkNan(value.ebits, value.sbits);
  if (isPinf(value) || isZero(value)) return copy(value);
  if (value.sign) return mkNan(value.ebits, value.sbits);
  const a = copy(value);
  unpack(a, true);
  const shifted = a.significand << BigInt(value.sbits + (a.exponent % 2 !== 0 ? 6 : 7));
  const root = getRoot(shifted);
  const result = mkMpf(
    value.ebits,
    value.sbits,
    false,
    Math.floor(a.exponent / 2) - (a.exponent % 2 === 0 ? 1 : 0),
    !root.isExact && !isOdd(root.root) ? root.root - 1n : root.root,
  );
  round(rm, result);
  return result;
};

const renormalize = (sbits: number, value: { exponent: number; significand: bigint }) => {
  if (value.significand === 0n) return;
  const upper = getPower(sbits);
  while (value.significand >= upper) {
    value.significand >>= 1n;
    value.exponent++;
  }
  const lower = getPower(sbits - 1);
  while (value.significand < lower) {
    value.significand <<= 1n;
    value.exponent--;
  }
};

export const mpfRoundToIntegral = (rm: number, value: Mpf): Mpf => {
  const ebits = value.ebits;
  const sbits = value.sbits;
  if (isNan(value)) return mkNan(ebits, sbits);
  if (isInf(value)) return copy(value);
  if (isZero(value)) return mkZero(ebits, sbits, value.sign);
  if (value.exponent < 0) {
    if (rm === MPF_ROUND_TOWARD_ZERO) return mkZero(ebits, sbits, value.sign);
    if (rm === MPF_ROUND_TOWARD_NEGATIVE)
      return value.sign ? mkOne(ebits, sbits, true) : mkZero(ebits, sbits, false);
    if (rm === MPF_ROUND_TOWARD_POSITIVE)
      return value.sign ? mkZero(ebits, sbits, true) : mkOne(ebits, sbits, false);
    const effective = { exponent: value.exponent, significand: value.significand };
    if (isDenormal(value)) {
      effective.exponent = mkMinExp(ebits);
      renormalize(sbits, effective);
      if (effective.significand !== 0n) effective.significand -= getPower(sbits - 1);
    }
    const isTie = effective.significand === 0n && effective.exponent === -1;
    if (isTie)
      return rm === MPF_ROUND_NEAREST_TEVEN
        ? mkZero(ebits, sbits, value.sign)
        : mkOne(ebits, sbits, value.sign);
    return effective.exponent < -1
      ? mkZero(ebits, sbits, value.sign)
      : mkOne(ebits, sbits, value.sign);
  }
  if (value.exponent >= sbits - 1) return copy(value);
  const a = copy(value);
  unpack(a, true);
  const shift = sbits - 1 - a.exponent;
  const shiftPower = getPower(shift);
  const half = getPower(shift - 1);
  let quotient = a.significand / shiftPower;
  const remainder = a.significand % shiftPower;
  const isIncremented =
    rm === MPF_ROUND_NEAREST_TEVEN || rm === MPF_ROUND_NEAREST_TAWAY
      ? remainder === half
        ? (rm === MPF_ROUND_NEAREST_TEVEN && isOdd(quotient)) || rm === MPF_ROUND_NEAREST_TAWAY
        : remainder > half
      : rm === MPF_ROUND_TOWARD_POSITIVE
        ? remainder !== 0n && !value.sign
        : rm === MPF_ROUND_TOWARD_NEGATIVE && remainder !== 0n && value.sign;
  if (isIncremented) quotient++;
  const result = mkMpf(ebits, sbits, value.sign, a.exponent, quotient << BigInt(shift));
  while (result.significand >= getPower(sbits)) {
    result.significand >>= 1n;
    result.exponent++;
  }
  result.significand -= getPower(sbits - 1);
  return result;
};

const partialRemainder = (x: Mpf, y: Mpf, expDiff: number, isPartial: boolean) => {
  const ebits = x.ebits;
  const sbits = x.sbits;
  const bigN = sbits - 1;
  const quotientLarge = (x.significand << BigInt(2 * sbits + 2)) / y.significand;
  const quotientShift = sbits - 1 + (sbits + 3) - (isPartial ? bigN : expDiff);
  const q = { exponent: expDiff, significand: 0n };
  if (isPartial) q.significand = quotientLarge >> BigInt(quotientShift);
  else {
    const divisor = getPower(quotientShift);
    q.significand = quotientLarge / divisor;
    const remainder = quotientLarge % divisor;
    const half = getPower(quotientShift - 1);
    if ((remainder === half && isOdd(q.significand)) || remainder > half) q.significand++;
  }
  q.significand = (q.significand << BigInt(quotientShift)) >> BigInt(sbits + 3);
  renormalize(sbits, q);
  if ((expDiff === -1 || isPartial) && q.significand === 0n) return;
  const yq = { exponent: q.exponent + y.exponent, significand: y.significand * q.significand };
  renormalize(2 * sbits - 1, yq);
  const minuend = x.significand << BigInt(sbits - 1);
  let subtrahend = yq.significand;
  let expDelta = x.exponent - yq.exponent;
  if (expDelta !== 0) {
    let stickyRemainder = 0n;
    if (expDelta > sbits + 5) {
      stickyRemainder = subtrahend;
      subtrahend = 0n;
    } else if (expDelta > 0) {
      const divisor = getPower(expDelta);
      stickyRemainder = subtrahend % divisor;
      subtrahend /= divisor;
    } else {
      expDelta = -expDelta;
      subtrahend <<= BigInt(expDelta);
    }
    if (stickyRemainder !== 0n && !isOdd(subtrahend)) subtrahend++;
  }
  const difference = minuend - subtrahend;
  const isNegative = difference < 0n;
  const result = {
    exponent: x.exponent,
    significand: isNegative ? -difference : difference,
  };
  const sign = x.sign !== isNegative;
  if (result.significand === 0n) {
    Object.assign(x, mkZero(ebits, sbits, x.sign));
    return;
  }
  renormalize(2 * sbits - 1, result);
  const divisor = getPower(sbits - 1);
  const roundBits = result.significand % divisor;
  result.significand /= divisor;
  if ((roundBits === 32n && isOdd(result.significand)) || roundBits > 32n) result.significand++;
  Object.assign(x, mkMpf(ebits, sbits, sign, result.exponent, result.significand));
};

export const mpfRem = (first: Mpf, second: Mpf): Mpf => {
  const ebits = first.ebits;
  const sbits = first.sbits;
  if (isNan(first) || isNan(second) || isInf(first) || isZero(second)) return mkNan(ebits, sbits);
  if (isInf(second) || isZero(first)) return copy(first);
  const st0 = copy(first);
  const st1 = copy(second);
  unpack(st0, true);
  unpack(st1, true);
  for (;;) {
    const delta = st0.exponent < st1.exponent - 1 ? 0 : st0.exponent - st1.exponent;
    if (st0.exponent >= st1.exponent - 1) partialRemainder(st0, st1, delta, delta >= sbits);
    if (!(delta >= sbits && !isZero(st0))) break;
  }
  st0.significand <<= 3n;
  const result = mpfToFormat(ebits, sbits, MPF_ROUND_TOWARD_ZERO, st0);
  round(MPF_ROUND_NEAREST_TEVEN, result);
  return result;
};

// The callers rule out the unspecified min and max of zeros of different signs.
export const mpfMaximum = (first: Mpf, second: Mpf) =>
  isNan(first)
    ? copy(second)
    : isNan(second)
      ? copy(first)
      : isZero(first) && isZero(second)
        ? copy(second)
        : mpfGt(first, second)
          ? copy(first)
          : copy(second);

export const mpfMinimum = (first: Mpf, second: Mpf) =>
  isNan(first)
    ? copy(second)
    : isNan(second)
      ? copy(first)
      : isZero(first) && isZero(second)
        ? copy(second)
        : mpfLt(first, second)
          ? copy(first)
          : copy(second);

export const mpfToRational = (value: Mpf) => {
  const a = copy(value);
  unpack(a, true);
  const numerator = a.sign ? -a.significand : a.significand;
  const denominator = getPower(a.sbits - 1);
  return a.exponent >= 0
    ? Rational.of(numerator << BigInt(a.exponent), denominator)
    : Rational.of(numerator, denominator << BigInt(-a.exponent));
};

export const mpfToSbv = (rm: number, value: Mpf) => {
  const t = copy(value);
  unpack(t, true);
  let integer = t.significand;
  if (t.exponent < t.sbits - 1) {
    const shift = t.exponent < 0 ? -(t.exponent + 1) + t.sbits : t.sbits - 1 - t.exponent;
    const flags = { last: false, round: false, sticky: false };
    if (integer !== 0n) {
      const bits = getBitSize(integer);
      const getBit = (index: number) => ((integer >> BigInt(index)) & 1n) === 1n;
      flags.last = shift < bits && getBit(shift);
      flags.round = shift <= bits && getBit(shift - 1);
      flags.sticky = shift > 1 && getPowerOfTwoMultiple(integer) < shift - 1;
      integer = shift >= bits ? 0n : integer >> BigInt(shift);
    }
    if (getRoundingIncrement(rm, value.sign, flags.last, flags.round, flags.sticky)) integer++;
  } else integer <<= BigInt(t.exponent - t.sbits + 1);
  return value.sign ? -integer : integer;
};

export const mpfToIeeeBv = (value: Mpf) => {
  const sign = value.sign ? 1n : 0n;
  if (isInf(value))
    return ((sign << BigInt(value.ebits)) + getPower(value.ebits) - 1n) << BigInt(value.sbits - 1);
  return (
    (((sign << BigInt(value.ebits)) + BigInt(biasExp(value.ebits, value.exponent))) <<
      BigInt(value.sbits - 1)) +
    value.significand
  );
};

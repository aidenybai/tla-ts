// Ported from Z3 (src/util/mpf.h, src/util/mpf.cpp), MIT license, see z3-license.txt.

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

export const mkMaxValue = (ebits: number, sbits: number, sign: boolean) =>
  mkMpf(ebits, sbits, sign, mkTopExp(ebits) - 1, getPower(sbits - 1) - 1n);

const hasBotExp = (value: Mpf) => value.exponent === mkBotExp(value.ebits);

const hasTopExp = (value: Mpf) => value.exponent === mkTopExp(value.ebits);

export const isNan = (value: Mpf) => hasTopExp(value) && value.significand !== 0n;

export const isInf = (value: Mpf) => hasTopExp(value) && value.significand === 0n;

export const isZero = (value: Mpf) => hasBotExp(value) && value.significand === 0n;

export const isPinf = (value: Mpf) => !value.sign && isInf(value);

export const isNinf = (value: Mpf) => value.sign && isInf(value);

export const isPzero = (value: Mpf) => !value.sign && isZero(value);

export const isNzero = (value: Mpf) => value.sign && isZero(value);

export const isNeg = (value: Mpf) => value.sign && !isNan(value);

export const isPos = (value: Mpf) => !value.sign && !isNan(value);

export const isDenormal = (value: Mpf) => !isZero(value) && hasBotExp(value);

export const isNormal = (value: Mpf) => !(hasTopExp(value) || isDenormal(value) || isZero(value));

export const isRegular = (value: Mpf) => value.sbits === 0 || isNormal(value) || isDenormal(value);

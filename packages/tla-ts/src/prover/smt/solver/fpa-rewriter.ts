// Ported from Z3 (src/ast/rewriter/fpa_rewriter.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_EXTRACT,
  OP_FPA_ABS,
  OP_FPA_ADD,
  OP_FPA_BV2RM,
  OP_FPA_BVWRAP,
  OP_FPA_DIV,
  OP_FPA_EQ,
  OP_FPA_FMA,
  OP_FPA_FP,
  OP_FPA_GE,
  OP_FPA_GT,
  OP_FPA_IS_INF,
  OP_FPA_IS_NAN,
  OP_FPA_IS_NEGATIVE,
  OP_FPA_IS_NORMAL,
  OP_FPA_IS_POSITIVE,
  OP_FPA_IS_SUBNORMAL,
  OP_FPA_IS_ZERO,
  OP_FPA_LE,
  OP_FPA_LT,
  OP_FPA_MAX,
  OP_FPA_MAX_I,
  OP_FPA_MIN,
  OP_FPA_MIN_I,
  OP_FPA_MUL,
  OP_FPA_NEG,
  OP_FPA_REM,
  OP_FPA_ROUND_TO_INTEGRAL,
  OP_FPA_SQRT,
  OP_FPA_SUB,
  OP_FPA_TO_FP,
  OP_FPA_TO_FP_UNSIGNED,
  OP_FPA_TO_IEEE_BV,
  OP_FPA_TO_IEEE_BV_I,
  OP_FPA_TO_REAL,
  OP_FPA_TO_REAL_I,
  OP_FPA_TO_SBV,
  OP_FPA_TO_SBV_I,
  OP_FPA_TO_UBV,
  OP_FPA_TO_UBV_I,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_NUM,
  OP_TO_REAL,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import {
  BV_RM_TIES_TO_AWAY,
  BV_RM_TIES_TO_EVEN,
  BV_RM_TO_NEGATIVE,
  BV_RM_TO_POSITIVE,
  getFpNumeral,
  getRmNumeral,
  mkFpaApp,
  mkFpNumeral,
  mkRmNumeral,
} from "./fpa-decl-plugin";
import {
  isDenormal,
  isInf,
  isNan,
  isNeg,
  isNormal,
  isZero,
  type Mpf,
  MPF_ROUND_NEAREST_TAWAY,
  MPF_ROUND_NEAREST_TEVEN,
  MPF_ROUND_TOWARD_NEGATIVE,
  MPF_ROUND_TOWARD_POSITIVE,
  MPF_ROUND_TOWARD_ZERO,
  mkInf,
  mkMaxExp,
  mkMaxValue,
  mkMpf,
  mkNan,
  mkZero,
  mpfAdd,
  mpfDiv,
  mpfEq,
  mpfFma,
  mpfFromRational,
  mpfLe,
  mpfLt,
  mpfMaximum,
  mpfMinimum,
  mpfMul,
  mpfNeg,
  mpfRem,
  mpfRoundToIntegral,
  mpfSqrt,
  mpfToFormat,
  mpfToIeeeBv,
  mpfToRational,
  mpfToSbv,
  unbiasExp,
} from "./mpf";
import { Rational } from "./rational";
import type { Rewrite } from "./rewriter-tpl";

type Result = number | Rewrite | undefined;

const rewrite = (expr: number, depth: number): Rewrite => ({ expr, depth });

const BR_REWRITE_FULL = 4;

const getFloatSortOf = (manager: AstManager, expr: number) => {
  const sort = manager.sorts[expr];
  return { ebits: manager.getEbits(sort), sbits: manager.getSbits(sort) };
};

const getArithNumeral = (manager: AstManager, expr: number) =>
  manager.getOp(expr) === OP_NUM ? manager.getRationalValue(expr) : undefined;

const getBvNumeral = (manager: AstManager, expr: number) =>
  manager.isBvNumeral(expr) ? manager.getBvNumeralValue(expr) : undefined;

const isNanExpr = (manager: AstManager, expr: number) => {
  const value = getFpNumeral(manager, expr);
  return value !== undefined && isNan(value);
};

const isInfExpr = (manager: AstManager, expr: number, sign: boolean) => {
  const value = getFpNumeral(manager, expr);
  return value !== undefined && isInf(value) && value.sign === sign;
};

const mkBool = (manager: AstManager, value: boolean) =>
  value ? manager.trueExpr : manager.falseExpr;

const mkFromBits = (ebits: number, sbits: number, sign: boolean, biased: bigint, sig: bigint) =>
  mkMpf(ebits, sbits, sign, unbiasExp(ebits, Number(biased)), sig);

const mkToFp = (manager: AstManager, decl: number, args: number[]): Result => {
  const parameters = manager.funcDecls[decl].parameters;
  const ebits = parameters[0];
  const sbits = parameters[1];
  if (args.length === 1) {
    const bits = getBvNumeral(manager, args[0]);
    if (bits === undefined) return undefined;
    const sig = bits % (1n << BigInt(sbits - 1));
    const rest = bits / (1n << BigInt(sbits - 1));
    const exponent = rest % (1n << BigInt(ebits));
    return mkFpNumeral(
      manager,
      mkFromBits(ebits, sbits, rest / (1n << BigInt(ebits)) !== 0n, exponent, sig),
    );
  }
  if (args.length === 2) {
    const rm = getRmNumeral(manager, args[0]);
    if (rm === undefined) return undefined;
    const real = getArithNumeral(manager, args[1]);
    if (real !== undefined)
      return mkFpNumeral(manager, mpfFromRational(ebits, sbits, rm, 0n, real));
    const float = getFpNumeral(manager, args[1]);
    if (float !== undefined) return mkFpNumeral(manager, mpfToFormat(ebits, sbits, rm, float));
    const bits = getBvNumeral(manager, args[1]);
    if (bits === undefined) return undefined;
    const width = manager.getBvSize(manager.sorts[args[1]]);
    const signed = bits >= 1n << BigInt(width - 1) ? bits - (1n << BigInt(width)) : bits;
    return mkFpNumeral(manager, mpfFromRational(ebits, sbits, rm, 0n, Rational.of(signed)));
  }
  if (args.length !== 3) return undefined;
  const rm = getRmNumeral(manager, args[0]);
  const isRealInt = manager.sorts[args[1]] === SORT_REAL && manager.sorts[args[2]] === SORT_INT;
  const isIntReal = manager.sorts[args[1]] === SORT_INT && manager.sorts[args[2]] === SORT_REAL;
  if (rm !== undefined && (isRealInt || isIntReal)) {
    const first = getArithNumeral(manager, args[1]);
    const second = getArithNumeral(manager, args[2]);
    if (first === undefined || second === undefined) return undefined;
    const exponent = isRealInt ? second : first;
    const significand = isRealInt ? first : second;
    return mkFpNumeral(manager, mpfFromRational(ebits, sbits, rm, exponent.num, significand));
  }
  const sign = getBvNumeral(manager, args[0]);
  const exponent = getBvNumeral(manager, args[1]);
  const sig = getBvNumeral(manager, args[2]);
  if (sign === undefined || exponent === undefined || sig === undefined) return undefined;
  const exponentWidth = manager.getBvSize(manager.sorts[args[1]]);
  return mkFpNumeral(
    manager,
    mkFromBits(
      exponentWidth,
      manager.getBvSize(manager.sorts[args[2]]) + 1,
      sign === 1n,
      exponent,
      sig,
    ),
  );
};

const mkRmBinary = (
  manager: AstManager,
  args: number[],
  apply: (rm: number, first: Mpf, second: Mpf) => Mpf,
): Result => {
  const rm = getRmNumeral(manager, args[0]);
  const first = getFpNumeral(manager, args[1]);
  const second = getFpNumeral(manager, args[2]);
  if (rm === undefined || first === undefined || second === undefined) return undefined;
  return mkFpNumeral(manager, apply(rm, first, second));
};

const mkRmUnary = (
  manager: AstManager,
  args: number[],
  apply: (rm: number, value: Mpf) => Mpf,
): Result => {
  const rm = getRmNumeral(manager, args[0]);
  const value = getFpNumeral(manager, args[1]);
  if (rm === undefined || value === undefined) return undefined;
  return mkFpNumeral(manager, apply(rm, value));
};

const mkNeg = (manager: AstManager, arg: number): Result => {
  if (isNanExpr(manager, arg)) return arg;
  const value = getFpNumeral(manager, arg);
  if (value !== undefined && isInf(value))
    return mkFpNumeral(manager, mkInf(value.ebits, value.sbits, !value.sign));
  if (manager.getOp(arg) === OP_FPA_NEG) return manager.getArg(arg, 0);
  return value === undefined ? undefined : mkFpNumeral(manager, mpfNeg(value));
};

const mkMinMax = (manager: AstManager, args: number[], isMin: boolean): Result => {
  if (isNanExpr(manager, args[0])) return args[1];
  if (isNanExpr(manager, args[1])) return args[0];
  const first = getFpNumeral(manager, args[0]);
  const second = getFpNumeral(manager, args[1]);
  if (first === undefined || second === undefined) return undefined;
  if (isZero(first) && isZero(second) && first.sign !== second.sign) return undefined;
  return mkFpNumeral(manager, isMin ? mpfMinimum(first, second) : mpfMaximum(first, second));
};

const mkFma = (manager: AstManager, args: number[]): Result => {
  const rm = getRmNumeral(manager, args[0]);
  if (rm === undefined) return undefined;
  const values = args.slice(1).map((arg) => getFpNumeral(manager, arg));
  if (values[0] !== undefined && values[1] !== undefined && values[2] !== undefined)
    return mkFpNumeral(manager, mpfFma(rm, values[0], values[1], values[2]));
  const zero =
    values[0] !== undefined && isZero(values[0])
      ? { value: values[0], other: args[2] }
      : values[1] !== undefined && isZero(values[1])
        ? { value: values[1], other: args[1] }
        : undefined;
  if (zero === undefined) return undefined;
  const addend = args[3];
  const format = getFloatSortOf(manager, addend);
  const nan = mkFpNumeral(manager, mkNan(format.ebits, format.sbits));
  if (isNanExpr(manager, addend)) return nan;
  const other = getFpNumeral(manager, zero.other);
  if (other !== undefined && (isNan(other) || isInf(other))) return nan;
  if (other !== undefined)
    return rewrite(
      mkFpaApp(manager, OP_FPA_ADD, [
        args[0],
        mkFpNumeral(manager, mpfMul(rm, zero.value, other)),
        addend,
      ]),
      2,
    );
  const isFinite = manager.mkNot(
    manager.mkOr([
      mkFpaApp(manager, OP_FPA_IS_NAN, [zero.other]),
      mkFpaApp(manager, OP_FPA_IS_INF, [zero.other]),
    ]),
  );
  const addendValue = getFpNumeral(manager, addend);
  const sort = manager.sorts[addend];
  if (addendValue !== undefined && !isZero(addendValue) && !isNan(addendValue))
    return rewrite(manager.mkApp(OP_ITE, [isFinite, addend, nan], sort), BR_REWRITE_FULL);
  const positive = mkFpNumeral(manager, mkZero(format.ebits, format.sbits, false));
  const negative = mkFpNumeral(manager, mkZero(format.ebits, format.sbits, true));
  const isOtherNegative = mkFpaApp(manager, OP_FPA_IS_NEGATIVE, [zero.other]);
  const product = manager.mkApp(
    OP_ITE,
    isNeg(zero.value)
      ? [isOtherNegative, positive, negative]
      : [isOtherNegative, negative, positive],
    sort,
  );
  return rewrite(
    manager.mkApp(
      OP_ITE,
      [isFinite, mkFpaApp(manager, OP_FPA_ADD, [args[0], product, addend]), nan],
      sort,
    ),
    BR_REWRITE_FULL,
  );
};

const mkNeqNan = (manager: AstManager, arg: number) => {
  const format = getFloatSortOf(manager, arg);
  return manager.mkNot(manager.mkEq(arg, mkFpNumeral(manager, mkNan(format.ebits, format.sbits))));
};

const mkLt = (manager: AstManager, first: number, second: number): Result => {
  if (isNanExpr(manager, first) || isNanExpr(manager, second)) return manager.falseExpr;
  if (isInfExpr(manager, first, true))
    return rewrite(
      manager.mkAnd([manager.mkNot(manager.mkEq(second, first)), mkNeqNan(manager, second)]),
      3,
    );
  if (isInfExpr(manager, second, true) || isInfExpr(manager, first, false))
    return manager.falseExpr;
  if (isInfExpr(manager, second, false))
    return rewrite(
      manager.mkAnd([manager.mkNot(manager.mkEq(first, second)), mkNeqNan(manager, first)]),
      3,
    );
  const left = getFpNumeral(manager, first);
  const right = getFpNumeral(manager, second);
  return left === undefined || right === undefined
    ? undefined
    : mkBool(manager, mpfLt(left, right));
};

const mkLe = (manager: AstManager, first: number, second: number): Result => {
  if (isNanExpr(manager, first) || isNanExpr(manager, second)) return manager.falseExpr;
  const left = getFpNumeral(manager, first);
  const right = getFpNumeral(manager, second);
  return left === undefined || right === undefined
    ? undefined
    : mkBool(manager, mpfLe(left, right));
};

const mkPredicate = (
  manager: AstManager,
  arg: number,
  predicate: (value: Mpf) => boolean,
): Result => {
  const value = getFpNumeral(manager, arg);
  return value === undefined ? undefined : mkBool(manager, predicate(value));
};

const mkPredicateOfIte = (
  manager: AstManager,
  arg: number,
  predicate: (value: Mpf) => boolean,
): Result => {
  if (manager.getOp(arg) !== OP_ITE) return undefined;
  const thenValue = getFpNumeral(manager, manager.getArg(arg, 1));
  const elseValue = getFpNumeral(manager, manager.getArg(arg, 2));
  if (thenValue === undefined || elseValue === undefined) return undefined;
  return rewrite(
    manager.mkApp(
      OP_ITE,
      [
        manager.getArg(arg, 0),
        mkBool(manager, predicate(thenValue)),
        mkBool(manager, predicate(elseValue)),
      ],
      SORT_BOOL,
    ),
    2,
  );
};

const getToFpOfInt = (manager: AstManager, arg: number) => {
  if (manager.getOp(arg) !== OP_FPA_TO_FP || manager.getNumArgs(arg) !== 2) return undefined;
  const rm = getRmNumeral(manager, manager.getArg(arg, 0));
  if (rm === undefined) return undefined;
  const inner = manager.getArg(arg, 1);
  const integer =
    manager.getOp(inner) === OP_TO_REAL
      ? manager.sorts[manager.getArg(inner, 0)] === SORT_INT
        ? manager.getArg(inner, 0)
        : undefined
      : manager.sorts[inner] === SORT_INT
        ? inner
        : undefined;
  if (integer === undefined) return undefined;
  const parameters = manager.funcDecls[manager.decls[arg]].parameters;
  return { rm, ebits: parameters[0], sbits: parameters[1], integer };
};

const mkIsInfOfInt = (
  manager: AstManager,
  rm: number,
  ebits: number,
  sbits: number,
  integer: number,
) => {
  const maxExp = mkMaxExp(ebits);
  const mkInt = (value: bigint) => manager.mkNumeral(value);
  const mkCompare = (op: number, value: bigint) =>
    manager.mkApp(op, [integer, mkInt(value)], SORT_BOOL);
  const mkAbsGe = (threshold: bigint) =>
    manager.mkOr([mkCompare(OP_GE, threshold), mkCompare(OP_LE, -threshold)]);
  if (sbits > maxExp) {
    const threshold = 1n << BigInt(maxExp + 1);
    return rm === MPF_ROUND_NEAREST_TEVEN || rm === MPF_ROUND_NEAREST_TAWAY
      ? mkAbsGe(threshold)
      : rm === MPF_ROUND_TOWARD_POSITIVE
        ? mkCompare(OP_GE, threshold)
        : rm === MPF_ROUND_TOWARD_NEGATIVE
          ? mkCompare(OP_LE, -threshold)
          : manager.falseExpr;
  }
  const maxFinite = mpfToRational(mkMaxValue(ebits, sbits, false)).num;
  const halfUlp = 1n << BigInt(maxExp - sbits);
  return rm === MPF_ROUND_NEAREST_TEVEN || rm === MPF_ROUND_NEAREST_TAWAY
    ? mkAbsGe(maxFinite + halfUlp)
    : rm === MPF_ROUND_TOWARD_POSITIVE
      ? mkCompare(OP_GT, maxFinite)
      : rm === MPF_ROUND_TOWARD_NEGATIVE
        ? mkCompare(OP_LT, -maxFinite)
        : manager.falseExpr;
};

const mkIsNan = (manager: AstManager, arg: number): Result => {
  const folded = mkPredicate(manager, arg, isNan);
  if (folded !== undefined) return folded;
  if (
    manager.getOp(arg) === OP_FPA_TO_FP &&
    manager.getNumArgs(arg) === 2 &&
    (manager.sorts[manager.getArg(arg, 1)] === SORT_REAL ||
      manager.sorts[manager.getArg(arg, 1)] === SORT_INT)
  )
    return manager.falseExpr;
  return mkPredicateOfIte(manager, arg, isNan);
};

const mkIsInf = (manager: AstManager, arg: number): Result => {
  const folded = mkPredicate(manager, arg, isInf);
  if (folded !== undefined) return folded;
  const toFp = getToFpOfInt(manager, arg);
  if (toFp !== undefined)
    return rewrite(
      mkIsInfOfInt(manager, toFp.rm, toFp.ebits, toFp.sbits, toFp.integer),
      BR_REWRITE_FULL,
    );
  return mkPredicateOfIte(manager, arg, isInf);
};

const mkIsNormal = (manager: AstManager, arg: number): Result => {
  const folded = mkPredicate(manager, arg, isNormal);
  if (folded !== undefined) return folded;
  const toFp = getToFpOfInt(manager, arg);
  if (toFp !== undefined)
    return rewrite(
      manager.mkAnd([
        manager.mkNot(manager.mkEq(toFp.integer, manager.mkNumeral(0n))),
        manager.mkNot(mkIsInfOfInt(manager, toFp.rm, toFp.ebits, toFp.sbits, toFp.integer)),
      ]),
      BR_REWRITE_FULL,
    );
  return mkPredicateOfIte(manager, arg, isNormal);
};

const mkToBv = (manager: AstManager, decl: number, args: number[], isSigned: boolean): Result => {
  const width = manager.funcDecls[decl].parameters[0];
  const rm = getRmNumeral(manager, args[0]);
  const value = getFpNumeral(manager, args[1]);
  if (rm === undefined || value === undefined) return undefined;
  if (isNan(value) || isInf(value) || value.exponent >= width) return undefined;
  const integer = mpfToSbv(rm, value);
  const upper = isSigned ? (1n << BigInt(width - 1)) - 1n : (1n << BigInt(width)) - 1n;
  const lower = isSigned ? -(1n << BigInt(width - 1)) : 0n;
  return integer >= lower && integer <= upper ? manager.mkBvNumeral(integer, width) : undefined;
};

const mkBv2rm = (manager: AstManager, arg: number): Result => {
  const value = getBvNumeral(manager, arg);
  if (value === undefined) return undefined;
  const bits = Number(value);
  return mkRmNumeral(
    manager,
    bits === BV_RM_TIES_TO_AWAY
      ? MPF_ROUND_NEAREST_TAWAY
      : bits === BV_RM_TIES_TO_EVEN
        ? MPF_ROUND_NEAREST_TEVEN
        : bits === BV_RM_TO_NEGATIVE
          ? MPF_ROUND_TOWARD_NEGATIVE
          : bits === BV_RM_TO_POSITIVE
            ? MPF_ROUND_TOWARD_POSITIVE
            : MPF_ROUND_TOWARD_ZERO,
  );
};

const mkFp = (manager: AstManager, args: number[]): Result => {
  const sign = getBvNumeral(manager, args[0]);
  const exponent = getBvNumeral(manager, args[1]);
  const sig = getBvNumeral(manager, args[2]);
  if (sign === undefined || exponent === undefined || sig === undefined) return undefined;
  const ebits = manager.getBvSize(manager.sorts[args[1]]);
  const sbits = manager.getBvSize(manager.sorts[args[2]]) + 1;
  return mkFpNumeral(manager, mkFromBits(ebits, sbits, sign === 1n, exponent, sig));
};

const mkBvwrap = (manager: AstManager, arg: number): Result => {
  if (manager.getOp(arg) !== OP_FPA_FP) return undefined;
  const parts = [0, 1, 2].map((index) => manager.getArg(arg, index));
  if (!parts.every((part) => manager.getOp(part) === OP_EXTRACT)) return undefined;
  const width = parts.reduce((total, part) => {
    const parameters = manager.funcDecls[manager.decls[part]].parameters;
    return total + parameters[0] - parameters[1] + 1;
  }, 0);
  const format = getFloatSortOf(manager, arg);
  if (width !== format.ebits + format.sbits) return undefined;
  const source = manager.getArg(parts[0], 0);
  return parts.every((part) => manager.getArg(part, 0) === source) &&
    manager.getBvSize(manager.sorts[source]) === width
    ? source
    : undefined;
};

export const mkFpaAppCore = (manager: AstManager, decl: number, args: number[]): Result => {
  const op = manager.funcDecls[decl].op;
  switch (op) {
    case OP_FPA_ADD:
      return manager.ids[args[2]] < manager.ids[args[1]]
        ? rewrite(mkFpaApp(manager, OP_FPA_ADD, [args[0], args[2], args[1]]), 2)
        : mkRmBinary(manager, args, mpfAdd);
    case OP_FPA_SUB:
      return rewrite(
        mkFpaApp(manager, OP_FPA_ADD, [args[0], args[1], mkFpaApp(manager, OP_FPA_NEG, [args[2]])]),
        2,
      );
    case OP_FPA_NEG:
      return mkNeg(manager, args[0]);
    case OP_FPA_MUL:
      return mkRmBinary(manager, args, mpfMul);
    case OP_FPA_DIV:
      return mkRmBinary(manager, args, mpfDiv);
    case OP_FPA_REM: {
      const first = getFpNumeral(manager, args[0]);
      const second = getFpNumeral(manager, args[1]);
      return first === undefined || second === undefined
        ? undefined
        : mkFpNumeral(manager, mpfRem(first, second));
    }
    case OP_FPA_ABS: {
      if (isNanExpr(manager, args[0])) return args[0];
      const value = getFpNumeral(manager, args[0]);
      return value === undefined
        ? undefined
        : mkFpNumeral(manager, isNeg(value) ? mpfNeg(value) : value);
    }
    case OP_FPA_MIN:
    case OP_FPA_MIN_I:
      return mkMinMax(manager, args, true);
    case OP_FPA_MAX:
    case OP_FPA_MAX_I:
      return mkMinMax(manager, args, false);
    case OP_FPA_FMA:
      return mkFma(manager, args);
    case OP_FPA_SQRT:
      return mkRmUnary(manager, args, mpfSqrt);
    case OP_FPA_ROUND_TO_INTEGRAL:
      return mkRmUnary(manager, args, mpfRoundToIntegral);
    case OP_FPA_EQ: {
      const first = getFpNumeral(manager, args[0]);
      const second = getFpNumeral(manager, args[1]);
      return first === undefined || second === undefined
        ? undefined
        : mkBool(manager, mpfEq(first, second));
    }
    case OP_FPA_LT:
      return mkLt(manager, args[0], args[1]);
    case OP_FPA_GT:
      return rewrite(mkFpaApp(manager, OP_FPA_LT, [args[1], args[0]]), 1);
    case OP_FPA_LE:
      return mkLe(manager, args[0], args[1]);
    case OP_FPA_GE:
      return rewrite(mkFpaApp(manager, OP_FPA_LE, [args[1], args[0]]), 1);
    case OP_FPA_IS_ZERO:
      return mkPredicate(manager, args[0], isZero);
    case OP_FPA_IS_NAN:
      return mkIsNan(manager, args[0]);
    case OP_FPA_IS_INF:
      return mkIsInf(manager, args[0]);
    case OP_FPA_IS_NORMAL:
      return mkIsNormal(manager, args[0]);
    case OP_FPA_IS_SUBNORMAL:
      return mkPredicate(manager, args[0], isDenormal);
    case OP_FPA_IS_NEGATIVE:
      return mkPredicate(manager, args[0], isNeg);
    case OP_FPA_IS_POSITIVE:
      return mkPredicate(manager, args[0], (value) => !isNeg(value) && !isNan(value));
    case OP_FPA_FP:
      return mkFp(manager, args);
    case OP_FPA_TO_FP:
      return mkToFp(manager, decl, args);
    case OP_FPA_TO_FP_UNSIGNED: {
      const parameters = manager.funcDecls[decl].parameters;
      const rm = getRmNumeral(manager, args[0]);
      const bits = getBvNumeral(manager, args[1]);
      return rm === undefined || bits === undefined
        ? undefined
        : mkFpNumeral(
            manager,
            mpfFromRational(parameters[0], parameters[1], rm, 0n, Rational.of(bits)),
          );
    }
    case OP_FPA_TO_UBV:
    case OP_FPA_TO_UBV_I:
      return mkToBv(manager, decl, args, false);
    case OP_FPA_TO_SBV:
    case OP_FPA_TO_SBV_I:
      return mkToBv(manager, decl, args, true);
    case OP_FPA_TO_IEEE_BV:
    case OP_FPA_TO_IEEE_BV_I: {
      const value = getFpNumeral(manager, args[0]);
      return value === undefined || isNan(value)
        ? undefined
        : manager.mkBvNumeral(mpfToIeeeBv(value), value.ebits + value.sbits);
    }
    case OP_FPA_TO_REAL:
    case OP_FPA_TO_REAL_I: {
      const value = getFpNumeral(manager, args[0]);
      return value === undefined || isNan(value) || isInf(value)
        ? undefined
        : manager.mkRealNumeral(mpfToRational(value));
    }
    case OP_FPA_BVWRAP:
      return mkBvwrap(manager, args[0]);
    case OP_FPA_BV2RM:
      return mkBv2rm(manager, args[0]);
    default:
      return undefined;
  }
};

export const mkFpaEqCore = (manager: AstManager, left: number, right: number): Result => {
  const first = getFpNumeral(manager, left);
  const second = getFpNumeral(manager, right);
  if (first === undefined || second === undefined) return undefined;
  return mkBool(
    manager,
    (isNan(first) && isNan(second)) ||
      (!(isZero(first) && isZero(second) && first.sign !== second.sign) && mpfEq(first, second)),
  );
};

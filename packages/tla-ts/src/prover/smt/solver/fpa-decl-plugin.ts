// Ported from Z3 (src/ast/fpa_decl_plugin.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  FAMILY_FPA,
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
  OP_FPA_MINUS_INF,
  OP_FPA_MINUS_ZERO,
  OP_FPA_MUL,
  OP_FPA_NAN,
  OP_FPA_NEG,
  OP_FPA_NUM,
  OP_FPA_PLUS_INF,
  OP_FPA_PLUS_ZERO,
  OP_FPA_REM,
  OP_FPA_RM_NEAREST_TIES_TO_AWAY,
  OP_FPA_RM_NEAREST_TIES_TO_EVEN,
  OP_FPA_RM_TOWARD_NEGATIVE,
  OP_FPA_RM_TOWARD_POSITIVE,
  OP_FPA_RM_TOWARD_ZERO,
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
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import {
  isInf,
  isNan,
  isPinf,
  isPzero,
  isZero,
  type Mpf,
  MPF_MAX_SBITS,
  MPF_ROUND_NEAREST_TAWAY,
  MPF_ROUND_NEAREST_TEVEN,
  MPF_ROUND_TOWARD_NEGATIVE,
  MPF_ROUND_TOWARD_POSITIVE,
  MPF_ROUND_TOWARD_ZERO,
  mkInf,
  mkNan,
  mkZero,
} from "./mpf";

export const BV_RM_TIES_TO_EVEN = 0;
export const BV_RM_TIES_TO_AWAY = 1;
export const BV_RM_TO_POSITIVE = 2;
export const BV_RM_TO_NEGATIVE = 3;
export const BV_RM_TO_ZERO = 4;

export const FPA_SORT_NAMES = new Map<string, [number, number] | undefined>([
  ["FloatingPoint", undefined],
  ["RoundingMode", undefined],
  ["Float16", [5, 11]],
  ["Float32", [8, 24]],
  ["Float64", [11, 53]],
  ["Float128", [15, 113]],
]);

export const FPA_OP_NAMES = new Map<string, number>([
  ["+oo", OP_FPA_PLUS_INF],
  ["-oo", OP_FPA_MINUS_INF],
  ["+zero", OP_FPA_PLUS_ZERO],
  ["-zero", OP_FPA_MINUS_ZERO],
  ["NaN", OP_FPA_NAN],
  ["roundNearestTiesToEven", OP_FPA_RM_NEAREST_TIES_TO_EVEN],
  ["roundNearestTiesToAway", OP_FPA_RM_NEAREST_TIES_TO_AWAY],
  ["roundTowardPositive", OP_FPA_RM_TOWARD_POSITIVE],
  ["roundTowardNegative", OP_FPA_RM_TOWARD_NEGATIVE],
  ["roundTowardZero", OP_FPA_RM_TOWARD_ZERO],
  ["RNE", OP_FPA_RM_NEAREST_TIES_TO_EVEN],
  ["RNA", OP_FPA_RM_NEAREST_TIES_TO_AWAY],
  ["RTP", OP_FPA_RM_TOWARD_POSITIVE],
  ["RTN", OP_FPA_RM_TOWARD_NEGATIVE],
  ["RTZ", OP_FPA_RM_TOWARD_ZERO],
  ["fp.abs", OP_FPA_ABS],
  ["fp.neg", OP_FPA_NEG],
  ["fp.add", OP_FPA_ADD],
  ["fp.sub", OP_FPA_SUB],
  ["fp.mul", OP_FPA_MUL],
  ["fp.div", OP_FPA_DIV],
  ["fp.fma", OP_FPA_FMA],
  ["fp.sqrt", OP_FPA_SQRT],
  ["fp.rem", OP_FPA_REM],
  ["fp.roundToIntegral", OP_FPA_ROUND_TO_INTEGRAL],
  ["fp.min", OP_FPA_MIN],
  ["fp.max", OP_FPA_MAX],
  ["fp.min_i", OP_FPA_MIN_I],
  ["fp.max_i", OP_FPA_MAX_I],
  ["fp.leq", OP_FPA_LE],
  ["fp.lt", OP_FPA_LT],
  ["fp.geq", OP_FPA_GE],
  ["fp.gt", OP_FPA_GT],
  ["fp.eq", OP_FPA_EQ],
  ["fp.isNormal", OP_FPA_IS_NORMAL],
  ["fp.isSubnormal", OP_FPA_IS_SUBNORMAL],
  ["fp.isZero", OP_FPA_IS_ZERO],
  ["fp.isInfinite", OP_FPA_IS_INF],
  ["fp.isNaN", OP_FPA_IS_NAN],
  ["fp.isNegative", OP_FPA_IS_NEGATIVE],
  ["fp.isPositive", OP_FPA_IS_POSITIVE],
  ["fp", OP_FPA_FP],
  ["fp.to_ubv", OP_FPA_TO_UBV],
  ["fp.to_sbv", OP_FPA_TO_SBV],
  ["fp.to_ubv_I", OP_FPA_TO_UBV_I],
  ["fp.to_sbv_I", OP_FPA_TO_SBV_I],
  ["fp.to_real", OP_FPA_TO_REAL],
  ["fp.to_real_I", OP_FPA_TO_REAL_I],
  ["to_fp", OP_FPA_TO_FP],
  ["to_fp_unsigned", OP_FPA_TO_FP_UNSIGNED],
  ["to_ieee_bv", OP_FPA_TO_IEEE_BV],
  ["fp.to_ieee_bv", OP_FPA_TO_IEEE_BV],
  ["fp.to_ieee_bv_I", OP_FPA_TO_IEEE_BV_I],
]);

const RM_NAMES = new Map([
  [OP_FPA_RM_NEAREST_TIES_TO_EVEN, "roundNearestTiesToEven"],
  [OP_FPA_RM_NEAREST_TIES_TO_AWAY, "roundNearestTiesToAway"],
  [OP_FPA_RM_TOWARD_POSITIVE, "roundTowardPositive"],
  [OP_FPA_RM_TOWARD_NEGATIVE, "roundTowardNegative"],
  [OP_FPA_RM_TOWARD_ZERO, "roundTowardZero"],
]);

const BIN_REL_NAMES = new Map([
  [OP_FPA_EQ, "fp.eq"],
  [OP_FPA_LT, "fp.lt"],
  [OP_FPA_GT, "fp.gt"],
  [OP_FPA_LE, "fp.leq"],
  [OP_FPA_GE, "fp.geq"],
]);

const UNARY_REL_NAMES = new Map([
  [OP_FPA_IS_ZERO, "fp.isZero"],
  [OP_FPA_IS_NEGATIVE, "fp.isNegative"],
  [OP_FPA_IS_POSITIVE, "fp.isPositive"],
  [OP_FPA_IS_NAN, "fp.isNaN"],
  [OP_FPA_IS_INF, "fp.isInfinite"],
  [OP_FPA_IS_NORMAL, "fp.isNormal"],
  [OP_FPA_IS_SUBNORMAL, "fp.isSubnormal"],
]);

const BINARY_NAMES = new Map([
  [OP_FPA_REM, "fp.rem"],
  [OP_FPA_MIN, "fp.min"],
  [OP_FPA_MAX, "fp.max"],
  [OP_FPA_MIN_I, "fp.min_i"],
  [OP_FPA_MAX_I, "fp.max_i"],
]);

const RM_BINARY_NAMES = new Map([
  [OP_FPA_ADD, "fp.add"],
  [OP_FPA_SUB, "fp.sub"],
  [OP_FPA_MUL, "fp.mul"],
  [OP_FPA_DIV, "fp.div"],
]);

const PARAMETERIZED_OPS = new Set([
  OP_FPA_TO_FP_UNSIGNED,
  OP_FPA_TO_UBV,
  OP_FPA_TO_UBV_I,
  OP_FPA_TO_SBV,
  OP_FPA_TO_SBV_I,
  OP_FPA_BVWRAP,
  OP_FPA_BV2RM,
]);

const TO_FP_COMBINATIONS =
  "Unexpected argument combination for (_ to_fp eb sb). Supported argument combinations are: " +
  "((_ BitVec 1) (_ BitVec eb) (_ BitVec sb-1)), (_ BitVec (eb+sb)), (Real), " +
  "(RoundingMode (_ BitVec (eb+sb))), (RoundingMode (_ FloatingPoint eb' sb')), " +
  "(RoundingMode Int Real), (RoundingMode Real Int), (RoundingMode Int), and (RoundingMode Real).";

export interface FpaSignature {
  op: number;
  name: string;
  parameters: number[];
  domain: number[];
  range: number;
}

export const getFloatSortError = (ebits: number, sbits: number) =>
  sbits < 2
    ? "minimum number of significand bits is 1"
    : ebits < 2
      ? "minimum number of exponent bits is 2"
      : ebits > 63
        ? "maximum number of exponent bits is 63"
        : sbits > MPF_MAX_SBITS
          ? `maximum number of significand bits is ${MPF_MAX_SBITS}`
          : undefined;

const mkFloatSort = (manager: AstManager, ebits: number, sbits: number) => {
  const error = getFloatSortError(ebits, sbits);
  return error ?? manager.mkFpSort(ebits, sbits);
};

const getNumeralSignature = (manager: AstManager, value: Mpf): FpaSignature => {
  const range = manager.mkFpSort(value.ebits, value.sbits);
  const special = isNan(value)
    ? ([OP_FPA_NAN, "NaN"] as const)
    : isInf(value)
      ? isPinf(value)
        ? ([OP_FPA_PLUS_INF, "+oo"] as const)
        : ([OP_FPA_MINUS_INF, "-oo"] as const)
      : isZero(value)
        ? isPzero(value)
          ? ([OP_FPA_PLUS_ZERO, "+zero"] as const)
          : ([OP_FPA_MINUS_ZERO, "-zero"] as const)
        : undefined;
  return special === undefined
    ? {
        op: OP_FPA_NUM,
        name: "fp.numeral",
        parameters: [manager.mkFpValueId(value)],
        domain: [],
        range,
      }
    : { op: special[0], name: special[1], parameters: [], domain: [], range };
};

export const getFpaSignature = (
  manager: AstManager,
  op: number,
  parameters: number[],
  argSorts: number[],
): FpaSignature | string => {
  const isFloat = (sort: number) => manager.isFpSort(sort);
  const isRm = (sort: number) => manager.isRmSort(sort);
  const isBv = (sort: number) => manager.isBvSort(sort);
  const arity = argSorts.length;
  const mk = (name: string, range: number | string): FpaSignature | string =>
    typeof range === "string"
      ? range
      : {
          op,
          name,
          parameters: PARAMETERIZED_OPS.has(op) ? parameters : [],
          domain: argSorts,
          range,
        };
  const hasIntParameters = parameters.length === 2;
  switch (op) {
    case OP_FPA_MINUS_INF:
    case OP_FPA_PLUS_INF:
    case OP_FPA_NAN:
    case OP_FPA_MINUS_ZERO:
    case OP_FPA_PLUS_ZERO: {
      if (!hasIntParameters) return "sort of floating point constant was not specified";
      const sort = mkFloatSort(manager, parameters[0], parameters[1]);
      if (typeof sort === "string") return sort;
      const ebits = parameters[0];
      const sbits = parameters[1];
      const value =
        op === OP_FPA_NAN
          ? mkNan(ebits, sbits)
          : op === OP_FPA_MINUS_INF || op === OP_FPA_PLUS_INF
            ? mkInf(ebits, sbits, op === OP_FPA_MINUS_INF)
            : mkZero(ebits, sbits, op === OP_FPA_MINUS_ZERO);
      return getNumeralSignature(manager, value);
    }
    case OP_FPA_RM_NEAREST_TIES_TO_EVEN:
    case OP_FPA_RM_NEAREST_TIES_TO_AWAY:
    case OP_FPA_RM_TOWARD_POSITIVE:
    case OP_FPA_RM_TOWARD_NEGATIVE:
    case OP_FPA_RM_TOWARD_ZERO:
      if (parameters.length !== 0) return "rounding mode constant does not have parameters";
      if (arity !== 0) return "rounding mode is a constant";
      return mk(RM_NAMES.get(op) ?? "", manager.mkRmSort());
    case OP_FPA_EQ:
    case OP_FPA_LT:
    case OP_FPA_GT:
    case OP_FPA_LE:
    case OP_FPA_GE:
      if (arity < 2) return "invalid number of arguments to floating point relation";
      if (argSorts[0] !== argSorts[1] || !isFloat(argSorts[0]))
        return "sort mismatch, expected equal FloatingPoint sorts as arguments";
      return {
        op,
        name: BIN_REL_NAMES.get(op) ?? "",
        parameters: [],
        domain: [argSorts[0], argSorts[1]],
        range: SORT_BOOL,
      };
    case OP_FPA_IS_ZERO:
    case OP_FPA_IS_NEGATIVE:
    case OP_FPA_IS_POSITIVE:
    case OP_FPA_IS_NAN:
    case OP_FPA_IS_INF:
    case OP_FPA_IS_NORMAL:
    case OP_FPA_IS_SUBNORMAL:
      if (arity !== 1) return "invalid number of arguments to floating point relation";
      if (!isFloat(argSorts[0])) return "sort mismatch, expected argument of FloatingPoint sort";
      return mk(UNARY_REL_NAMES.get(op) ?? "", SORT_BOOL);
    case OP_FPA_ABS:
    case OP_FPA_NEG:
      if (arity !== 1) return "invalid number of arguments to floating point operator";
      if (!isFloat(argSorts[0])) return "sort mismatch, expected argument of FloatingPoint sort";
      return mk(op === OP_FPA_ABS ? "fp.abs" : "fp.neg", argSorts[0]);
    case OP_FPA_REM:
    case OP_FPA_MIN:
    case OP_FPA_MAX:
    case OP_FPA_MIN_I:
    case OP_FPA_MAX_I:
      if (arity !== 2) return "invalid number of arguments to floating point operator";
      if (argSorts[0] !== argSorts[1] || !isFloat(argSorts[0]))
        return "sort mismatch, expected arguments of equal FloatingPoint sorts";
      return mk(BINARY_NAMES.get(op) ?? "", argSorts[0]);
    case OP_FPA_SUB:
    case OP_FPA_ADD:
    case OP_FPA_MUL:
    case OP_FPA_DIV:
      if (op === OP_FPA_SUB && arity === 1)
        return getFpaSignature(manager, OP_FPA_NEG, parameters, argSorts);
      if (arity !== 3) return "invalid number of arguments to floating point operator";
      if (!isRm(argSorts[0])) return "sort mismatch, expected first argument of RoundingMode sort";
      if (argSorts[1] !== argSorts[2] || !isFloat(argSorts[1]))
        return "sort mismatch, expected arguments 1 and 2 of equal FloatingPoint sorts";
      return mk(RM_BINARY_NAMES.get(op) ?? "", argSorts[1]);
    case OP_FPA_SQRT:
    case OP_FPA_ROUND_TO_INTEGRAL:
      if (arity !== 2) return "invalid number of arguments to floating point operator";
      if (!isRm(argSorts[0])) return "sort mismatch, expected RoundingMode as first argument";
      if (!isFloat(argSorts[1])) return "sort mismatch, expected FloatingPoint as second argument";
      return mk(op === OP_FPA_SQRT ? "fp.sqrt" : "fp.roundToIntegral", argSorts[1]);
    case OP_FPA_FMA:
      if (arity !== 4) return "invalid number of arguments to fused_ma operator";
      if (!isRm(argSorts[0])) return "sort mismatch, expected RoundingMode as first argument";
      if (argSorts[1] !== argSorts[2] || argSorts[1] !== argSorts[3] || !isFloat(argSorts[1]))
        return "sort mismatch, expected arguments 1,2,3 of equal FloatingPoint sort";
      return mk("fp.fma", argSorts[1]);
    case OP_FPA_FP:
      if (arity !== 3) return "invalid number of arguments to fp";
      if (
        !isBv(argSorts[0]) ||
        manager.getBvSize(argSorts[0]) !== 1 ||
        !isBv(argSorts[1]) ||
        !isBv(argSorts[2])
      )
        return "sort mismatch, expected three bit-vectors, the first one of size 1.";
      return mk(
        "fp",
        mkFloatSort(manager, manager.getBvSize(argSorts[1]), manager.getBvSize(argSorts[2]) + 1),
      );
    case OP_FPA_TO_UBV:
    case OP_FPA_TO_UBV_I:
    case OP_FPA_TO_SBV:
    case OP_FPA_TO_SBV_I: {
      const name = op === OP_FPA_TO_UBV || op === OP_FPA_TO_UBV_I ? "fp.to_ubv" : "fp.to_sbv";
      if (arity !== 2) return `invalid number of arguments to ${name}`;
      if (parameters.length !== 1) return `invalid number of parameters to ${name}`;
      if (!isRm(argSorts[0])) return "sort mismatch, expected first argument of RoundingMode sort";
      if (!isFloat(argSorts[1]))
        return "sort mismatch, expected second argument of FloatingPoint sort";
      if (parameters[0] <= 0)
        return `invalid parameter value; ${name} expects a parameter larger than 0`;
      return mk(name, manager.mkBvSort(parameters[0]));
    }
    case OP_FPA_TO_REAL:
    case OP_FPA_TO_REAL_I:
      if (arity !== 1) return "invalid number of arguments to fp.to_real";
      if (!isFloat(argSorts[0])) return "sort mismatch, expected argument of FloatingPoint sort";
      return mk("fp.to_real", SORT_REAL);
    case OP_FPA_TO_IEEE_BV:
    case OP_FPA_TO_IEEE_BV_I:
      if (arity !== 1) return "invalid number of arguments to fp.to_ieee_bv";
      if (!isFloat(argSorts[0])) return "sort mismatch, expected argument of FloatingPoint sort";
      return mk(
        "fp.to_ieee_bv",
        manager.mkBvSort(manager.getEbits(argSorts[0]) + manager.getSbits(argSorts[0])),
      );
    case OP_FPA_TO_FP_UNSIGNED:
      if (arity !== 2) return "invalid number of arguments to to_fp_unsigned";
      if (!isRm(argSorts[0])) return "sort mismatch, expected first argument of RoundingMode sort";
      if (!isBv(argSorts[1])) return "sort mismatch, expected second argument of bit-vector sort";
      if (parameters.length !== 2) return "invalid number of parameters to to_fp_unsigned";
      return mk("to_fp_unsigned", mkFloatSort(manager, parameters[0], parameters[1]));
    case OP_FPA_TO_FP:
      return getToFpSignature(manager, parameters, argSorts);
    case OP_FPA_BVWRAP:
      if (arity !== 1) return "invalid number of arguments to bv_wrap";
      if (!isFloat(argSorts[0]) && !isRm(argSorts[0]))
        return "sort mismatch, expected argument of FloatingPoint or RoundingMode sort";
      return mk(
        "bv_wrap",
        manager.mkBvSort(
          isFloat(argSorts[0]) ? manager.getEbits(argSorts[0]) + manager.getSbits(argSorts[0]) : 3,
        ),
      );
    case OP_FPA_BV2RM:
      if (arity !== 1) return "invalid number of arguments to bv2rm";
      if (!isBv(argSorts[0]) || manager.getBvSize(argSorts[0]) !== 3)
        return "sort mismatch, expected argument of sort bitvector, size 3";
      return mk("rm", manager.mkRmSort());
    default:
      return "unsupported floating point operator";
  }
};

const getToFpSignature = (
  manager: AstManager,
  parameters: number[],
  argSorts: number[],
): FpaSignature | string => {
  const isBv = (sort: number) => manager.isBvSort(sort);
  const isRm = (sort: number) => manager.isRmSort(sort);
  const arity = argSorts.length;
  const mk = (range: number | string): FpaSignature | string =>
    typeof range === "string"
      ? range
      : { op: OP_FPA_TO_FP, name: "to_fp", parameters, domain: argSorts, range };
  if (arity === 3 && argSorts.every(isBv)) {
    const ebits = manager.getBvSize(argSorts[1]);
    const sbits = manager.getBvSize(argSorts[2]) + 1;
    const range = mkFloatSort(manager, ebits, sbits);
    return typeof range === "string"
      ? range
      : { op: OP_FPA_TO_FP, name: "to_fp", parameters: [ebits, sbits], domain: argSorts, range };
  }
  if (arity === 1 && isBv(argSorts[0])) {
    if (parameters.length !== 2) return "invalid number of parameters to to_fp";
    if (manager.getBvSize(argSorts[0]) !== parameters[0] + parameters[1])
      return "sort mismatch; invalid bit-vector size, expected bitvector of size (ebits+sbits)";
    return mk(mkFloatSort(manager, parameters[0], parameters[1]));
  }
  const isRmWith = (second: (sort: number) => boolean) =>
    arity === 2 && isRm(argSorts[0]) && second(argSorts[1]);
  if (
    isRmWith(isBv) ||
    isRmWith((sort) => manager.isFpSort(sort)) ||
    isRmWith((sort) => sort === SORT_REAL) ||
    isRmWith((sort) => sort === SORT_INT)
  ) {
    if (parameters.length !== 2)
      return manager.isFpSort(argSorts[1]) || isBv(argSorts[1])
        ? "invalid number of parameters to to_fp"
        : "expecting two integer parameters to to_fp";
    return mk(mkFloatSort(manager, parameters[0], parameters[1]));
  }
  if (
    arity === 3 &&
    isRm(argSorts[0]) &&
    ((argSorts[1] === SORT_REAL && argSorts[2] === SORT_INT) ||
      (argSorts[1] === SORT_INT && argSorts[2] === SORT_REAL))
  ) {
    if (parameters.length !== 2) return "expecting two integer parameters to to_fp";
    return mk(mkFloatSort(manager, parameters[0], parameters[1]));
  }
  if (arity === 1 && argSorts[0] === SORT_REAL) {
    if (parameters.length !== 2) return "expecting two integer parameters to to_fp";
    return "sort mismatch, expected one argument of Real sort";
  }
  return TO_FP_COMBINATIONS;
};

export const mkFpaApp = (
  manager: AstManager,
  op: number,
  args: number[],
  parameters: number[] = [],
) => {
  const signature = getFpaSignature(
    manager,
    op,
    parameters,
    args.map((arg) => manager.sorts[arg]),
  );
  if (typeof signature === "string") throw new SmtInvariantError(signature);
  return mkFpaAppOf(manager, signature, args);
};

export const mkFpaAppOf = (manager: AstManager, signature: FpaSignature, args: number[]) =>
  manager.mkApp(
    manager.mkFpaDecl(
      signature.op,
      signature.name,
      signature.parameters,
      signature.domain,
      signature.range,
    ),
    args,
    signature.range,
  );

export const mkFpNumeral = (manager: AstManager, value: Mpf) =>
  mkFpaAppOf(manager, getNumeralSignature(manager, value), []);

export const mkRmNumeral = (manager: AstManager, rm: number) => mkFpaApp(manager, RM_OPS[rm], []);

const RM_OPS = [
  OP_FPA_RM_NEAREST_TIES_TO_EVEN,
  OP_FPA_RM_NEAREST_TIES_TO_AWAY,
  OP_FPA_RM_TOWARD_POSITIVE,
  OP_FPA_RM_TOWARD_NEGATIVE,
  OP_FPA_RM_TOWARD_ZERO,
];

export const getFpNumeral = (manager: AstManager, expr: number): Mpf | undefined => {
  if (manager.getFamily(expr) !== FAMILY_FPA) return undefined;
  const decl = manager.funcDecls[manager.decls[expr]];
  const ebits = manager.getEbits(decl.range);
  const sbits = manager.getSbits(decl.range);
  switch (decl.op) {
    case OP_FPA_NUM:
      return { ...manager.getFpValue(decl.parameters[0]) };
    case OP_FPA_MINUS_INF:
      return mkInf(ebits, sbits, true);
    case OP_FPA_PLUS_INF:
      return mkInf(ebits, sbits, false);
    case OP_FPA_NAN:
      return mkNan(ebits, sbits);
    case OP_FPA_PLUS_ZERO:
      return mkZero(ebits, sbits, false);
    case OP_FPA_MINUS_ZERO:
      return mkZero(ebits, sbits, true);
    default:
      return undefined;
  }
};

export const getRmNumeral = (manager: AstManager, expr: number) => {
  const op = manager.getOp(expr);
  return op === OP_FPA_RM_NEAREST_TIES_TO_AWAY
    ? MPF_ROUND_NEAREST_TAWAY
    : op === OP_FPA_RM_NEAREST_TIES_TO_EVEN
      ? MPF_ROUND_NEAREST_TEVEN
      : op === OP_FPA_RM_TOWARD_NEGATIVE
        ? MPF_ROUND_TOWARD_NEGATIVE
        : op === OP_FPA_RM_TOWARD_POSITIVE
          ? MPF_ROUND_TOWARD_POSITIVE
          : op === OP_FPA_RM_TOWARD_ZERO
            ? MPF_ROUND_TOWARD_ZERO
            : undefined;
};

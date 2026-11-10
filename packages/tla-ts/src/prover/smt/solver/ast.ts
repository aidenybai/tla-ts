// Ported from Z3 (src/ast/ast.h, src/ast/ast.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import { FlatLiterals } from "./flat-literals";
import { astArrayHash, bytesHash, combineHash, getCompositeHash, mkMix, stringHash } from "./hash";
import { ObjMap } from "./hashtable";
import { Rational } from "./rational";
import { grow, shrink } from "./array";
import type { DatatypeDef } from "./datatype-decl-plugin";
import { AlgebraicManager, Anum } from "./nlsat/algebraic";
import type { Mpf } from "./mpf";
import type { ResourceLimit } from "./rlimit";

export const KIND_APP = 0;
export const KIND_VAR = 1;
export const KIND_QUANTIFIER = 2;

export const SORT_BOOL = 0;
export const SORT_INT = 1;
export const SORT_REAL = 2;

export const FAMILY_BASIC = 0;
export const FAMILY_ARITH = 1;
export const FAMILY_USER = 2;
export const FAMILY_MODEL_VALUE = 3;
export const FAMILY_FINITE_SET = 4;
export const FAMILY_BV = 5;
export const FAMILY_ARRAY = 6;
export const FAMILY_DATATYPE = 7;
export const FAMILY_FPA = 8;
export const FAMILY_CHAR = 9;
export const FAMILY_SEQ = 10;

export const OP_TRUE = 0;
export const OP_FALSE = 1;
export const OP_EQ = 2;
export const OP_DISTINCT = 3;
export const OP_ITE = 4;
export const OP_AND = 5;
export const OP_OR = 6;
export const OP_XOR = 7;
export const OP_NOT = 8;
export const OP_IMPLIES = 9;
export const OP_NUM = 10;
export const OP_LE = 11;
export const OP_GE = 12;
export const OP_LT = 13;
export const OP_GT = 14;
export const OP_ADD = 15;
export const OP_SUB = 16;
export const OP_UMINUS = 17;
export const OP_MUL = 18;
export const OP_IDIV = 19;
export const OP_MOD = 20;
export const OP_ABS = 21;
export const OP_PATTERN = 22;
export const OP_DIV = 23;
export const OP_TO_REAL = 24;
export const OP_TO_INT = 25;
export const OP_IS_INT = 26;
// Z3's div0, idiv0 and mod0: division by zero, which theory_lra's found_underspecified equates with
// the division it stands for.
export const OP_DIV0 = 27;
export const OP_IDIV0 = 28;
export const OP_MOD0 = 29;
export const OP_POWER = 30;
export const OP_POWER0 = 31;
export const OP_SIN = 32;
export const OP_COS = 33;
export const OP_TAN = 34;
export const OP_ASIN = 35;
export const OP_ACOS = 36;
export const OP_ATAN = 37;
export const OP_SINH = 38;
export const OP_COSH = 39;
export const OP_TANH = 40;
export const OP_ASINH = 41;
export const OP_ACOSH = 42;
export const OP_ATANH = 43;
export const OP_EXP = 44;
export const OP_ATAN2 = 45;
export const OP_LOG = 46;
export const OP_PI = 47;
export const OP_E = 48;
export const OP_ALGEBRAIC_NUM = 49;
export const OP_REM = 50;
export const OP_UNINTERPRETED = 60;
const OP_MODEL_VALUE = 61;

const BV_OP_BASE = 100;
export const OP_BV_NUM = BV_OP_BASE;
export const OP_BNEG = BV_OP_BASE + 3;
export const OP_BADD = BV_OP_BASE + 4;
export const OP_BSUB = BV_OP_BASE + 5;
export const OP_BMUL = BV_OP_BASE + 6;
export const OP_BSDIV = BV_OP_BASE + 7;
export const OP_BUDIV = BV_OP_BASE + 8;
export const OP_BSREM = BV_OP_BASE + 9;
export const OP_BUREM = BV_OP_BASE + 10;
export const OP_BSMOD = BV_OP_BASE + 11;
export const OP_BSDIV0 = BV_OP_BASE + 12;
export const OP_BUDIV0 = BV_OP_BASE + 13;
export const OP_BSREM0 = BV_OP_BASE + 14;
export const OP_BUREM0 = BV_OP_BASE + 15;
export const OP_BSMOD0 = BV_OP_BASE + 16;
export const OP_BSDIV_I = BV_OP_BASE + 17;
export const OP_BUDIV_I = BV_OP_BASE + 18;
export const OP_BSREM_I = BV_OP_BASE + 19;
export const OP_BUREM_I = BV_OP_BASE + 20;
export const OP_BSMOD_I = BV_OP_BASE + 21;
export const OP_ULEQ = BV_OP_BASE + 22;
export const OP_SLEQ = BV_OP_BASE + 23;
export const OP_UGEQ = BV_OP_BASE + 24;
export const OP_SGEQ = BV_OP_BASE + 25;
export const OP_ULT = BV_OP_BASE + 26;
export const OP_SLT = BV_OP_BASE + 27;
export const OP_UGT = BV_OP_BASE + 28;
export const OP_SGT = BV_OP_BASE + 29;
export const OP_BAND = BV_OP_BASE + 30;
export const OP_BOR = BV_OP_BASE + 31;
export const OP_BNOT = BV_OP_BASE + 32;
export const OP_BXOR = BV_OP_BASE + 33;
export const OP_BNAND = BV_OP_BASE + 34;
export const OP_BNOR = BV_OP_BASE + 35;
export const OP_BXNOR = BV_OP_BASE + 36;
export const OP_CONCAT = BV_OP_BASE + 37;
export const OP_SIGN_EXT = BV_OP_BASE + 38;
export const OP_ZERO_EXT = BV_OP_BASE + 39;
export const OP_EXTRACT = BV_OP_BASE + 40;
export const OP_REPEAT = BV_OP_BASE + 41;
export const OP_BREDOR = BV_OP_BASE + 42;
export const OP_BREDAND = BV_OP_BASE + 43;
export const OP_BCOMP = BV_OP_BASE + 44;
export const OP_BSHL = BV_OP_BASE + 45;
export const OP_BLSHR = BV_OP_BASE + 46;
export const OP_BASHR = BV_OP_BASE + 47;
export const OP_ROTATE_LEFT = BV_OP_BASE + 48;
export const OP_ROTATE_RIGHT = BV_OP_BASE + 49;
export const OP_EXT_ROTATE_LEFT = BV_OP_BASE + 50;
export const OP_EXT_ROTATE_RIGHT = BV_OP_BASE + 51;
export const OP_BUMUL_NO_OVFL = BV_OP_BASE + 52;
export const OP_BSMUL_NO_OVFL = BV_OP_BASE + 53;
export const OP_BSMUL_NO_UDFL = BV_OP_BASE + 54;
export const OP_BUMUL_OVFL = BV_OP_BASE + 55;
export const OP_BSMUL_OVFL = BV_OP_BASE + 56;
export const OP_BSDIV_OVFL = BV_OP_BASE + 57;
export const OP_BNEG_OVFL = BV_OP_BASE + 58;
export const OP_BUADD_OVFL = BV_OP_BASE + 59;
export const OP_BSADD_OVFL = BV_OP_BASE + 60;
export const OP_BUSUB_OVFL = BV_OP_BASE + 61;
export const OP_BSSUB_OVFL = BV_OP_BASE + 62;
export const OP_BIT2BOOL = BV_OP_BASE + 63;
export const OP_MKBV = BV_OP_BASE + 64;
export const OP_INT2BV = BV_OP_BASE + 65;
export const OP_UBV2INT = BV_OP_BASE + 66;
export const OP_SBV2INT = BV_OP_BASE + 67;
export const OP_CARRY = BV_OP_BASE + 68;
export const OP_XOR3 = BV_OP_BASE + 69;

const ARRAY_OP_BASE = 200;
export const OP_STORE = ARRAY_OP_BASE;
export const OP_SELECT = ARRAY_OP_BASE + 1;
export const OP_CONST_ARRAY = ARRAY_OP_BASE + 2;
export const OP_ARRAY_EXT = ARRAY_OP_BASE + 3;
export const OP_ARRAY_DEFAULT = ARRAY_OP_BASE + 4;
export const OP_ARRAY_MAP = ARRAY_OP_BASE + 5;
export const OP_AS_ARRAY = ARRAY_OP_BASE + 11;
const DATATYPE_OP_BASE = 300;
export const OP_DT_CONSTRUCTOR = DATATYPE_OP_BASE;
export const OP_DT_RECOGNISER = DATATYPE_OP_BASE + 1;
export const OP_DT_IS = DATATYPE_OP_BASE + 2;
export const OP_DT_ACCESSOR = DATATYPE_OP_BASE + 3;
export const OP_DT_UPDATE_FIELD = DATATYPE_OP_BASE + 4;
const FPA_OP_BASE = 400;
export const OP_FPA_RM_NEAREST_TIES_TO_EVEN = FPA_OP_BASE;
export const OP_FPA_RM_NEAREST_TIES_TO_AWAY = FPA_OP_BASE + 1;
export const OP_FPA_RM_TOWARD_POSITIVE = FPA_OP_BASE + 2;
export const OP_FPA_RM_TOWARD_NEGATIVE = FPA_OP_BASE + 3;
export const OP_FPA_RM_TOWARD_ZERO = FPA_OP_BASE + 4;
export const OP_FPA_NUM = FPA_OP_BASE + 5;
export const OP_FPA_PLUS_INF = FPA_OP_BASE + 6;
export const OP_FPA_MINUS_INF = FPA_OP_BASE + 7;
export const OP_FPA_NAN = FPA_OP_BASE + 8;
export const OP_FPA_PLUS_ZERO = FPA_OP_BASE + 9;
export const OP_FPA_MINUS_ZERO = FPA_OP_BASE + 10;
export const OP_FPA_ADD = FPA_OP_BASE + 11;
export const OP_FPA_SUB = FPA_OP_BASE + 12;
export const OP_FPA_NEG = FPA_OP_BASE + 13;
export const OP_FPA_MUL = FPA_OP_BASE + 14;
export const OP_FPA_DIV = FPA_OP_BASE + 15;
export const OP_FPA_REM = FPA_OP_BASE + 16;
export const OP_FPA_ABS = FPA_OP_BASE + 17;
export const OP_FPA_MIN = FPA_OP_BASE + 18;
export const OP_FPA_MAX = FPA_OP_BASE + 19;
export const OP_FPA_MIN_I = FPA_OP_BASE + 20;
export const OP_FPA_MAX_I = FPA_OP_BASE + 21;
export const OP_FPA_FMA = FPA_OP_BASE + 22;
export const OP_FPA_SQRT = FPA_OP_BASE + 23;
export const OP_FPA_ROUND_TO_INTEGRAL = FPA_OP_BASE + 24;
export const OP_FPA_EQ = FPA_OP_BASE + 25;
export const OP_FPA_LT = FPA_OP_BASE + 26;
export const OP_FPA_GT = FPA_OP_BASE + 27;
export const OP_FPA_LE = FPA_OP_BASE + 28;
export const OP_FPA_GE = FPA_OP_BASE + 29;
export const OP_FPA_IS_NAN = FPA_OP_BASE + 30;
export const OP_FPA_IS_INF = FPA_OP_BASE + 31;
export const OP_FPA_IS_ZERO = FPA_OP_BASE + 32;
export const OP_FPA_IS_NORMAL = FPA_OP_BASE + 33;
export const OP_FPA_IS_SUBNORMAL = FPA_OP_BASE + 34;
export const OP_FPA_IS_NEGATIVE = FPA_OP_BASE + 35;
export const OP_FPA_IS_POSITIVE = FPA_OP_BASE + 36;
export const OP_FPA_FP = FPA_OP_BASE + 37;
export const OP_FPA_TO_FP = FPA_OP_BASE + 38;
export const OP_FPA_TO_FP_UNSIGNED = FPA_OP_BASE + 39;
export const OP_FPA_TO_UBV = FPA_OP_BASE + 40;
export const OP_FPA_TO_SBV = FPA_OP_BASE + 41;
export const OP_FPA_TO_REAL = FPA_OP_BASE + 42;
export const OP_FPA_TO_REAL_I = FPA_OP_BASE + 43;
export const OP_FPA_TO_SBV_I = FPA_OP_BASE + 44;
export const OP_FPA_TO_UBV_I = FPA_OP_BASE + 45;
export const OP_FPA_TO_IEEE_BV = FPA_OP_BASE + 46;
export const OP_FPA_TO_IEEE_BV_I = FPA_OP_BASE + 47;
export const OP_FPA_BVWRAP = FPA_OP_BASE + 48;
export const OP_FPA_BV2RM = FPA_OP_BASE + 49;
const SEQ_OP_BASE = 500;
export const OP_SEQ_UNIT = SEQ_OP_BASE;
export const OP_SEQ_EMPTY = SEQ_OP_BASE + 1;
export const OP_SEQ_CONCAT = SEQ_OP_BASE + 2;
export const OP_SEQ_PREFIX = SEQ_OP_BASE + 3;
export const OP_SEQ_SUFFIX = SEQ_OP_BASE + 4;
export const OP_SEQ_CONTAINS = SEQ_OP_BASE + 5;
export const OP_SEQ_EXTRACT = SEQ_OP_BASE + 6;
export const OP_SEQ_REPLACE = SEQ_OP_BASE + 7;
export const OP_SEQ_AT = SEQ_OP_BASE + 8;
export const OP_SEQ_NTH = SEQ_OP_BASE + 9;
export const OP_SEQ_NTH_I = SEQ_OP_BASE + 10;
export const OP_SEQ_NTH_U = SEQ_OP_BASE + 11;
export const OP_SEQ_LENGTH = SEQ_OP_BASE + 12;
export const OP_SEQ_INDEX = SEQ_OP_BASE + 13;
export const OP_SEQ_LAST_INDEX = SEQ_OP_BASE + 14;
export const OP_SEQ_TO_RE = SEQ_OP_BASE + 15;
export const OP_SEQ_IN_RE = SEQ_OP_BASE + 16;
export const OP_SEQ_REPLACE_RE_ALL = SEQ_OP_BASE + 17;
export const OP_SEQ_REPLACE_RE = SEQ_OP_BASE + 18;
export const OP_SEQ_REPLACE_ALL = SEQ_OP_BASE + 19;
export const OP_SEQ_MAP = SEQ_OP_BASE + 20;
export const OP_SEQ_MAPI = SEQ_OP_BASE + 21;
export const OP_SEQ_FOLDL = SEQ_OP_BASE + 22;
export const OP_SEQ_FOLDLI = SEQ_OP_BASE + 23;
export const OP_SEQ_POWER = SEQ_OP_BASE + 24;
export const OP_RE_PLUS = SEQ_OP_BASE + 25;
export const OP_RE_STAR = SEQ_OP_BASE + 26;
export const OP_RE_OPTION = SEQ_OP_BASE + 27;
export const OP_RE_RANGE = SEQ_OP_BASE + 28;
export const OP_RE_CONCAT = SEQ_OP_BASE + 29;
export const OP_RE_UNION = SEQ_OP_BASE + 30;
export const OP_RE_DIFF = SEQ_OP_BASE + 31;
export const OP_RE_INTERSECT = SEQ_OP_BASE + 32;
export const OP_RE_XOR = SEQ_OP_BASE + 33;
export const OP_RE_LOOP = SEQ_OP_BASE + 34;
export const OP_RE_POWER = SEQ_OP_BASE + 35;
export const OP_RE_COMPLEMENT = SEQ_OP_BASE + 36;
export const OP_RE_EMPTY_SET = SEQ_OP_BASE + 37;
export const OP_RE_FULL_SEQ_SET = SEQ_OP_BASE + 38;
export const OP_RE_FULL_CHAR_SET = SEQ_OP_BASE + 39;
export const OP_RE_OF_PRED = SEQ_OP_BASE + 40;
export const OP_RE_REVERSE = SEQ_OP_BASE + 41;
export const OP_RE_DERIVATIVE = SEQ_OP_BASE + 42;
export const OP_STRING_CONST = SEQ_OP_BASE + 43;
export const OP_STRING_ITOS = SEQ_OP_BASE + 44;
export const OP_STRING_STOI = SEQ_OP_BASE + 45;
export const OP_STRING_UBVTOS = SEQ_OP_BASE + 46;
export const OP_STRING_SBVTOS = SEQ_OP_BASE + 47;
export const OP_STRING_LT = SEQ_OP_BASE + 48;
export const OP_STRING_LE = SEQ_OP_BASE + 49;
export const OP_STRING_IS_DIGIT = SEQ_OP_BASE + 50;
export const OP_STRING_TO_CODE = SEQ_OP_BASE + 51;
export const OP_STRING_FROM_CODE = SEQ_OP_BASE + 52;
export const OP_INTERNAL_STRING_FROM_CHAR = SEQ_OP_BASE + 53;
export const OP_INTERNAL_STRING_STRREPL = SEQ_OP_BASE + 54;
export const OP_INTERNAL_STRING_CONCAT = SEQ_OP_BASE + 55;
export const OP_INTERNAL_STRING_LENGTH = SEQ_OP_BASE + 56;
export const OP_INTERNAL_STRING_STRCTN = SEQ_OP_BASE + 57;
export const OP_INTERNAL_STRING_PREFIX = SEQ_OP_BASE + 58;
export const OP_INTERNAL_STRING_SUFFIX = SEQ_OP_BASE + 59;
export const OP_INTERNAL_STRING_IN_REGEXP = SEQ_OP_BASE + 60;
export const OP_INTERNAL_STRING_TO_REGEXP = SEQ_OP_BASE + 61;
export const OP_INTERNAL_STRING_CHARAT = SEQ_OP_BASE + 62;
export const OP_INTERNAL_STRING_SUBSTR = SEQ_OP_BASE + 63;
export const OP_INTERNAL_STRING_STRIDOF = SEQ_OP_BASE + 64;
export const OP_INTERNAL_STRING_POWER = SEQ_OP_BASE + 65;
export const OP_INTERNAL_REGEXP_EMPTY = SEQ_OP_BASE + 66;
export const OP_INTERNAL_REGEXP_FULL_CHAR = SEQ_OP_BASE + 67;
export const OP_RE_IS_NULLABLE = SEQ_OP_BASE + 68;
export const OP_SEQ_SKOLEM = SEQ_OP_BASE + 69;
const CHAR_OP_BASE = 600;
export const OP_CHAR_CONST = CHAR_OP_BASE;
export const OP_CHAR_LE = CHAR_OP_BASE + 1;
export const OP_CHAR_TO_INT = CHAR_OP_BASE + 2;
export const OP_CHAR_TO_BV = CHAR_OP_BASE + 3;
export const OP_CHAR_FROM_BV = CHAR_OP_BASE + 4;
export const OP_CHAR_IS_DIGIT = CHAR_OP_BASE + 5;

// The number of elements of a sort, with -1 for an infinite sort and -2 for a very big one.
export const SORT_SIZE_INFINITE = -1n;
export const SORT_SIZE_VERY_BIG = -2n;

const UNCACHED_BV_OPS: ReadonlySet<number> = new Set([
  OP_CONCAT,
  OP_SIGN_EXT,
  OP_ZERO_EXT,
  OP_EXTRACT,
  OP_REPEAT,
  OP_ROTATE_LEFT,
  OP_ROTATE_RIGHT,
]);

export type SmtSymbol = string | number;

export const getSymbolName = (symbol: SmtSymbol) =>
  typeof symbol === "number" ? `k!${symbol}` : symbol;

export interface FuncDecl {
  name: SmtSymbol;
  family: number;
  op: number;
  domain: number[];
  range: number;
  isSkolem: boolean;
  smallId: number;
  parameters: number[];
}

interface QuantifierData {
  isForall: boolean;
  sorts: number[];
  // The names of the variables, which tell apart quantifiers that differ only in them, as in Z3.
  names: SmtSymbol[];
  body: number;
  patterns: number[];
  noPatterns: number[];
  weight: number;
  qid: string;
  skid?: string;
}

const BUILTIN_DECLS: [string, number, number, number][] = [
  ["true", FAMILY_BASIC, OP_TRUE, SORT_BOOL],
  ["false", FAMILY_BASIC, OP_FALSE, SORT_BOOL],
  ["=", FAMILY_BASIC, OP_EQ, SORT_BOOL],
  ["distinct", FAMILY_BASIC, OP_DISTINCT, SORT_BOOL],
  ["ite", FAMILY_BASIC, OP_ITE, -1],
  ["and", FAMILY_BASIC, OP_AND, SORT_BOOL],
  ["or", FAMILY_BASIC, OP_OR, SORT_BOOL],
  ["xor", FAMILY_BASIC, OP_XOR, SORT_BOOL],
  ["not", FAMILY_BASIC, OP_NOT, SORT_BOOL],
  ["=>", FAMILY_BASIC, OP_IMPLIES, SORT_BOOL],
  ["num", FAMILY_ARITH, OP_NUM, SORT_INT],
  ["<=", FAMILY_ARITH, OP_LE, SORT_BOOL],
  [">=", FAMILY_ARITH, OP_GE, SORT_BOOL],
  ["<", FAMILY_ARITH, OP_LT, SORT_BOOL],
  [">", FAMILY_ARITH, OP_GT, SORT_BOOL],
  ["+", FAMILY_ARITH, OP_ADD, SORT_INT],
  ["-", FAMILY_ARITH, OP_SUB, SORT_INT],
  ["-", FAMILY_ARITH, OP_UMINUS, SORT_INT],
  ["*", FAMILY_ARITH, OP_MUL, SORT_INT],
  ["div", FAMILY_ARITH, OP_IDIV, SORT_INT],
  ["mod", FAMILY_ARITH, OP_MOD, SORT_INT],
  ["abs", FAMILY_ARITH, OP_ABS, SORT_INT],
  ["pattern", FAMILY_BASIC, OP_PATTERN, SORT_BOOL],
  ["/", FAMILY_ARITH, OP_DIV, SORT_REAL],
  ["to_real", FAMILY_ARITH, OP_TO_REAL, SORT_REAL],
  ["to_int", FAMILY_ARITH, OP_TO_INT, SORT_INT],
  ["is_int", FAMILY_ARITH, OP_IS_INT, SORT_BOOL],
  ["/0", FAMILY_ARITH, OP_DIV0, SORT_REAL],
  ["div0", FAMILY_ARITH, OP_IDIV0, SORT_INT],
  ["mod0", FAMILY_ARITH, OP_MOD0, SORT_INT],
  ["^", FAMILY_ARITH, OP_POWER, SORT_REAL],
  ["^0", FAMILY_ARITH, OP_POWER0, SORT_REAL],
  ["sin", FAMILY_ARITH, OP_SIN, SORT_REAL],
  ["cos", FAMILY_ARITH, OP_COS, SORT_REAL],
  ["tan", FAMILY_ARITH, OP_TAN, SORT_REAL],
  ["asin", FAMILY_ARITH, OP_ASIN, SORT_REAL],
  ["acos", FAMILY_ARITH, OP_ACOS, SORT_REAL],
  ["atan", FAMILY_ARITH, OP_ATAN, SORT_REAL],
  ["sinh", FAMILY_ARITH, OP_SINH, SORT_REAL],
  ["cosh", FAMILY_ARITH, OP_COSH, SORT_REAL],
  ["tanh", FAMILY_ARITH, OP_TANH, SORT_REAL],
  ["asinh", FAMILY_ARITH, OP_ASINH, SORT_REAL],
  ["acosh", FAMILY_ARITH, OP_ACOSH, SORT_REAL],
  ["atanh", FAMILY_ARITH, OP_ATANH, SORT_REAL],
  ["exp", FAMILY_ARITH, OP_EXP, SORT_REAL],
  ["atan2", FAMILY_ARITH, OP_ATAN2, SORT_REAL],
  ["log", FAMILY_ARITH, OP_LOG, SORT_REAL],
  ["pi", FAMILY_ARITH, OP_PI, SORT_REAL],
  ["euler", FAMILY_ARITH, OP_E, SORT_REAL],
  ["RootObject", FAMILY_ARITH, OP_ALGEBRAIC_NUM, SORT_REAL],
  ["rem", FAMILY_ARITH, OP_REM, SORT_INT],
];

// Z3's family ids and decl kinds, which its AST hashes include.
const Z3_BASIC_FAMILY = 0;
const Z3_PATTERN_FAMILY = 2;
const Z3_MODEL_VALUE_FAMILY = 3;
const Z3_USER_SORT_FAMILY = 4;
const Z3_ARITH_FAMILY = 5;
const Z3_BV_FAMILY = 8;
const Z3_ARRAY_FAMILY = 9;
const Z3_DATATYPE_FAMILY = 7;
const Z3_RECFUN_FAMILY = 10;
const Z3_CHAR_FAMILY = 12;
const Z3_SEQ_FAMILY = 13;
const Z3_FPA_FAMILY = 14;
const Z3_SEQ_SORT = 0;
const Z3_RE_SORT = 1;
const Z3_FLOATING_POINT_SORT = 0;
const Z3_ROUNDING_MODE_SORT = 1;
const Z3_NULL = 0xffffffff;
// The name, Z3 decl kind and arity of each builtin, whose Z3 declaration has this many arguments
// whatever the number of arguments of the application (-1 for the arguments' own number).
const Z3_BUILTINS = new Map<number, [string, number, number]>([
  [OP_TRUE, ["true", 0, 0]],
  [OP_FALSE, ["false", 1, 0]],
  [OP_EQ, ["=", 2, 2]],
  [OP_DISTINCT, ["distinct", 3, -1]],
  [OP_ITE, ["if", 4, 3]],
  [OP_AND, ["and", 5, 2]],
  [OP_OR, ["or", 6, 2]],
  [OP_XOR, ["xor", 7, 2]],
  [OP_NOT, ["not", 8, 1]],
  [OP_IMPLIES, ["=>", 9, 2]],
  [OP_LE, ["<=", 2, 2]],
  [OP_GE, [">=", 3, 2]],
  [OP_LT, ["<", 4, 2]],
  [OP_GT, [">", 5, 2]],
  [OP_ADD, ["+", 6, 2]],
  [OP_SUB, ["-", 7, 2]],
  [OP_UMINUS, ["-", 8, 1]],
  [OP_MUL, ["*", 9, 2]],
  [OP_IDIV, ["div", 11, 2]],
  [OP_MOD, ["mod", 16, 2]],
  [OP_REM, ["rem", 15, 2]],
  [OP_ABS, ["abs", 21, 1]],
  [OP_PATTERN, ["pattern", 0, -1]],
  [OP_DIV, ["/", 10, 2]],
  [OP_TO_REAL, ["to_real", 18, 1]],
  [OP_TO_INT, ["to_int", 19, 1]],
  [OP_IS_INT, ["is_int", 20, 1]],
  [OP_DIV0, ["/0", 12, 2]],
  [OP_IDIV0, ["div0", 13, 2]],
  [OP_MOD0, ["mod0", 17, 2]],
  [OP_POWER, ["^", 22, 2]],
  [OP_POWER0, ["^0", 23, 2]],
  [OP_SIN, ["sin", 24, 1]],
  [OP_COS, ["cos", 25, 1]],
  [OP_TAN, ["tan", 26, 1]],
  [OP_ASIN, ["asin", 27, 1]],
  [OP_ACOS, ["acos", 28, 1]],
  [OP_ATAN, ["atan", 29, 1]],
  [OP_SINH, ["sinh", 30, 1]],
  [OP_COSH, ["cosh", 31, 1]],
  [OP_TANH, ["tanh", 32, 1]],
  [OP_ASINH, ["asinh", 33, 1]],
  [OP_ACOSH, ["acosh", 34, 1]],
  [OP_ATANH, ["atanh", 35, 1]],
  [OP_EXP, ["exp", 36, 1]],
  [OP_ATAN2, ["atan2", 37, 2]],
  [OP_LOG, ["log", 38, 1]],
  [OP_PI, ["pi", 43, 0]],
  [OP_E, ["euler", 44, 0]],
]);

// The small ids of the Int declarations Z3 makes when it starts, from arith_decl_plugin::set_manager,
// which Real terms share. The declarations of Real terms only have the ids of Real's /, Int's
// to_real, Real's to_int and is_int. Z3 makes =, ite, distinct, pattern, numeral, /0, div0 and mod0
// declarations per signature on first use, so they get -1 here, and their small ids are kept by
// signature.
const Z3_SMALL_IDS = new Map([
  [OP_TRUE, 1],
  [OP_FALSE, 2],
  [OP_AND, 3],
  [OP_OR, 4],
  [OP_XOR, 5],
  [OP_NOT, 6],
  [OP_IMPLIES, 7],
  [OP_LE, 17],
  [OP_GE, 18],
  [OP_LT, 19],
  [OP_GT, 20],
  [OP_ADD, 36],
  [OP_SUB, 37],
  [OP_MUL, 38],
  [OP_IDIV, 39],
  [OP_REM, 40],
  [OP_MOD, 41],
  [OP_UMINUS, 42],
  [OP_ABS, 50],
  [OP_DIV, 24],
  [OP_TO_REAL, 43],
  [OP_TO_INT, 45],
  [OP_IS_INT, 47],
  [OP_POWER, 48],
  [OP_SIN, 52],
  [OP_COS, 53],
  [OP_TAN, 54],
  [OP_ASIN, 55],
  [OP_ACOS, 56],
  [OP_ATAN, 57],
  [OP_SINH, 58],
  [OP_COSH, 59],
  [OP_TANH, 60],
  [OP_ASINH, 61],
  [OP_ACOSH, 62],
  [OP_ATANH, 63],
  [OP_EXP, 64],
  [OP_ATAN2, 65],
  [OP_LOG, 66],
  [OP_PI, 67],
  [OP_E, 68],
]);

// The small id of the first sort or declaration a problem declares, after Z3's own.
const FIRST_DECLARED_SMALL_ID = 143;

// The ids of Z3's own expressions when it starts: the undef proof, true and false, then pi, euler, a
// bit-vector numeral, fifteen real variables and a sum of two of them, which no problem shares.
const FIRST_FREE_ID = 22;
// MAX_SMALL_NUM_TO_CACHE: arith_decl_plugin holds the numerals below it once it makes them.
const MAX_SMALL_NUM_TO_CACHE = 16;
// The sorts that finite_set_decl_plugin::init makes.
const NUM_FINITE_SET_PLUGIN_SORTS = 7;

export const getSymbolHash = (symbol: SmtSymbol) =>
  typeof symbol === "number" ? symbol : stringHash(symbol, 17);

export const isArithSort = (sort: number) => sort === SORT_INT || sort === SORT_REAL;

// mpz_manager::hash: the absolute value of an integer below 2^32, else the hash of its 32-bit digits,
// least significant first.
const getIntegerHash = (value: bigint) => {
  const magnitude = value < 0n ? -value : value;
  if (magnitude <= 0xffffffffn) return Number(magnitude);
  const digits: number[] = [];
  for (let rest = magnitude; rest > 0n; rest >>= 32n) digits.push(Number(rest & 0xffffffffn));
  return bytesHash(new Uint8Array(Uint32Array.from(digits).buffer), 17);
};

const getInfoHash = (family: number, kind: number, parameterHashes: number[]) =>
  mkMix(family, kind, parameterHashes.length === 0 ? 0 : getCompositeHash(parameterHashes));

// The kinds of an integer signature, in its low three bits.
const SIGNATURE_EQ = 0;
const SIGNATURE_ITE = 1;
const SIGNATURE_DIV0 = 2;
const SIGNATURE_MODEL_VALUE = 3;
const SIGNATURE_NUMERAL = 4;
const SIGNATURE_ALGEBRAIC = 5;

interface AlgebraicNumeral {
  value: Anum;
  id: number;
}

interface SignatureDecl {
  smallId: number;
  refCount: number;
}

const hasOwnDeclHash = (family: number) =>
  family === FAMILY_USER ||
  family === FAMILY_BV ||
  family === FAMILY_ARRAY ||
  family === FAMILY_DATATYPE ||
  family === FAMILY_FPA ||
  family === FAMILY_CHAR ||
  family === FAMILY_SEQ;

export class AstManager {
  // The tables of the expressions are typed arrays indexed by expression, which the collector does
  // not scan. They have room for more expressions than numNodes and double when full, which
  // replaces them, so a caller does not keep one across the creation of an expression.
  private numNodes = 0;
  kinds = new Uint8Array(1024);
  decls = new Int32Array(1024);
  // The arguments of every expression end to end: those of expr are argPool[argStarts[expr]] up to
  // argPool[argStarts[expr + 1]]. Variables and constants take an empty range and a quantifier
  // takes its body. Both grow by doubling, which replaces the arrays.
  private argPool = new Int32Array(1024);
  private argStarts = new Int32Array(1024);
  sorts = new Int32Array(1024);
  values = new Int32Array(1024);
  private numeralValues: Rational[] = [];
  // An irrational numeral is never shared: each takes a fresh id, which its deletion frees.
  private algebraicNumerals: AlgebraicNumeral[] = [];
  private freeAlgebraicIds: number[] = [];
  private nextAlgebraicId = 0;
  private algebraicManager: AlgebraicManager | undefined;
  private intNumerals = new Map<bigint, number>();
  // One more than the largest free de Bruijn index, so 0 means the expression is ground.
  freeVarBounds = new Int32Array(1024);
  hasQuantifierFlags = new Uint8Array(1024);
  depths = new Int32Array(1024);
  // Z3's hash of each expression, which orders Z3's hash tables.
  hashes = new Uint32Array(1024);
  quantifiers = new Map<number, QuantifierData>();
  readonly flatLiterals = new FlatLiterals(this);
  funcDecls: FuncDecl[] = [];
  sortNames: string[] = ["Bool", "Int", "Real"];
  private sortFamilies: number[] = [FAMILY_BASIC, FAMILY_ARITH, FAMILY_ARITH];
  private sortWidths: number[] = [0, 0, 0];
  private sortSbits: number[] = [0, 0, 0];
  private sortParameters: number[][] = [[], [], []];
  private sortSizes: bigint[] = [2n, SORT_SIZE_INFINITE, SORT_SIZE_INFINITE];
  private arraySorts = new Map<string, number>();
  private arrayDecls = new Map<string, number>();
  readonly datatypeDefs = new Map<string, DatatypeDef>();
  hasNestedRecDatatype = false;
  datatypeConstructors: number[][] = [];
  constructorAccessors: number[][] = [];
  constructorRecognizers: number[] = [];
  nonRecConstructors: number[] = [];
  nonRecDepths: number[] = [];
  private parametricSorts = new Map<string, number>();
  private datatypeDecls = new Map<string, number>();
  private userSortKinds = new Map<SmtSymbol, number>();
  private sortSmallIds: number[] = [];
  private typeParameters: number[] = [];
  private numUserSorts = 0;
  private bvSorts = new Map<number, number>();
  private bvDecls = new Map<string, number>();
  private fpSorts = new Map<string, number>();
  private rmSort = -1;
  private fpaDecls = new Map<string, number>();
  private fpValues: Mpf[] = [];
  private fpValueIds = new Map<string, number>();
  private charSort = -1;
  private stringSort = -1;
  private reglanSort = -1;
  private seqSorts = new Map<string, number>();
  private seqDecls = new Map<string, number>();
  private stringValues: number[][] = [];
  private stringValueIds = new Map<string, number>();
  private sortHashes = [
    combineHash(getSymbolHash("Bool"), getInfoHash(Z3_BASIC_FAMILY, 0, [])),
    combineHash(getSymbolHash("Int"), getInfoHash(Z3_ARITH_FAMILY, 1, [])),
    combineHash(getSymbolHash("Real"), getInfoHash(Z3_ARITH_FAMILY, 0, [])),
  ];
  private declHashes: number[] = [];
  // The hash of each builtin declaration other than pattern by op, argument sort, range and number
  // of arguments: open addressing with linear probing, with the four keys of slot i at 4 i in
  // builtinKeys and -1 for an empty slot.
  private builtinKeys = new Int32Array(4 * 256).fill(-1);
  private builtinHashes = new Uint32Array(256);
  private numBuiltinHashes = 0;
  private patternHashes = new Map<string, number>();
  private table = new Map<string, number>();
  // The hash-consing table of applications: open addressing with linear probing over the handles,
  // -1 for an empty slot, which takes a few bytes per application where a map of buckets takes
  // dozens. Applications stay in it when they are deleted, so a lookup can create them again.
  private appHandles = new Int32Array(1024).fill(-1);
  private appHashes = new Int32Array(1024);
  private numApps = 0;
  // id_gen for sorts and declarations: the small id of the next one, and the ids of deleted ones,
  // which Z3 reuses the last freed first. Z3 keeps the declarations of = and ite, and deletes the
  // others with their last reference.
  private nextSmallId = FIRST_DECLARED_SMALL_ID;
  private freeSmallIds: number[] = [];
  private numDecls = FIRST_DECLARED_SMALL_ID;
  private signatureDecls = new Map<number | string, SignatureDecl>();
  // A deleted declaration keeps its small id here, in case an application of it is created again.
  private declRefCounts: number[] = [];
  readonly macros = new ObjMap<number>((decl) => this.declHashes[decl]);
  // -1 until the body is parsed.
  readonly recFunBodies = new Map<number, number>();
  private deletedDecls = new Set<number>();
  private freshId = 0;
  // Z3's id of each expression, which orders Z3's sorts. Like Z3, the manager counts references and
  // gives the id of a deleted expression to the next expression it creates, so its ids follow
  // Z3's. A deleted expression stays in the tables with the id -1 until it is created again.
  ids = new Int32Array(1024);
  private refCounts = new Int32Array(1024);
  private freeIds: number[] = [];
  private nextId = 1;
  private numLive = 0;
  // The expressions that the open withTemporaries hold, like the expr_ref temporaries of Z3
  // functions on the C++ stack: the innermost holds those from temporariesMark on, and -1 marks that
  // no temporaries are held.
  private temporaries: number[] = [];
  private temporariesMark = -1;
  private argBuffer: number[] = [];
  private smallInts: number[] = [];
  private smallReals: number[] = [];
  private isFiniteSetPluginInitialized = false;
  readonly trueExpr: number;
  readonly falseExpr: number;
  readonly piExpr: number;
  readonly eulerExpr: number;
  isHiDiv0 = true;
  maxChar = 196607;
  charBits = 18;
  isSeqUsed = false;
  isReUsed = false;

  constructor(readonly limit: ResourceLimit) {
    for (const builtin of BUILTIN_DECLS)
      this.funcDecls.push({
        name: builtin[0],
        family: builtin[1],
        op: builtin[2],
        domain: [],
        range: builtin[3],
        isSkolem: false,
        smallId: Z3_SMALL_IDS.get(builtin[2]) ?? -1,
        parameters: [],
      });
    this.trueExpr = this.mkApp(OP_TRUE, [], SORT_BOOL);
    this.falseExpr = this.mkApp(OP_FALSE, [], SORT_BOOL);
    this.incRef(this.trueExpr);
    this.incRef(this.falseExpr);
    this.piExpr = this.mkApp(OP_PI, [], SORT_REAL);
    this.eulerExpr = this.mkApp(OP_E, [], SORT_REAL);
    this.incRef(this.piExpr);
    this.incRef(this.eulerExpr);
    this.nextId = FIRST_FREE_ID;
  }

  getRefCount(expr: number) {
    return this.refCounts[expr];
  }

  getNumAsts() {
    return this.numLive + FIRST_FREE_ID - 4 + this.numDecls;
  }

  private getSignatureDecl(key: number | string) {
    const signatureDecl = this.signatureDecls.get(key);
    if (signatureDecl === undefined)
      throw new SmtInvariantError(`the signature ${key} is not held`);
    return signatureDecl;
  }

  private mkSmallId() {
    this.numDecls++;
    return this.freeSmallIds.pop() ?? this.nextSmallId++;
  }

  // finite_set_decl_plugin::init, which the first final check of theory_finite_set runs when it
  // makes a set.range declaration: the plugin makes the sorts A and B, three FiniteSet sorts and two
  // Array sorts, which the manager keeps. The set.range declaration is released at once.
  initFiniteSetPlugin() {
    if (this.isFiniteSetPluginInitialized) return;
    this.isFiniteSetPluginInitialized = true;
    for (let index = 0; index < NUM_FINITE_SET_PLUGIN_SORTS; index++) this.mkSmallId();
    this.freeSmallIds.push(this.mkSmallId());
    this.numDecls--;
  }

  // insert_macro: cmd_context keeps a named expression as a recursive function with one case, whose
  // declaration and case predicate it holds. The recfun plugin maps the declaration to the
  // expression, which a model of the context takes as the declaration's interpretation.
  mkMacro(name: string, expr: number) {
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      [],
      this.sorts[expr],
      getInfoHash(Z3_RECFUN_FAMILY, 0, [0]),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_USER,
      op: OP_UNINTERPRETED,
      domain: [],
      range: this.sorts[expr],
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters: [],
    });
    this.declRefCounts[decl] = 1;
    this.mkSmallId();
    this.macros.set(decl, expr);
  }

  mkRecFuncDecl(name: string, domain: number[], range: number) {
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(Z3_RECFUN_FAMILY, 0, [0]),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_USER,
      op: OP_UNINTERPRETED,
      domain,
      range,
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters: [],
    });
    this.declRefCounts[decl] = 1;
    this.recFunBodies.set(decl, -1);
    return decl;
  }

  setRecFunBody(decl: number, body: number) {
    this.incRef(body);
    this.recFunBodies.set(decl, body);
  }

  // The signature of a builtin declaration that Z3 makes on first use, or null for a declaration
  // that is not one. The low three bits of an integer signature tell its kind: an equality or ite
  // by sort, a division by zero or model value by declaration, or a numeral by its value, which a
  // numeral expression has alone. A distinct or pattern is keyed by its domain.
  private getSignature(expr: number) {
    const decl = this.decls[expr];
    if (decl === OP_NUM || this.funcDecls[decl].op === OP_BV_NUM)
      return 8 * this.values[expr] + SIGNATURE_NUMERAL;
    if (decl === OP_EQ) return 8 * this.sorts[this.getArg(expr, 0)] + SIGNATURE_EQ;
    if (decl === OP_ITE) return 8 * this.sorts[expr] + SIGNATURE_ITE;
    if (decl === OP_DIV0 || decl === OP_IDIV0 || decl === OP_MOD0) return 8 * decl + SIGNATURE_DIV0;
    if (decl === OP_POWER0)
      return 8 * (decl + 64 * this.sorts[this.getArg(expr, 0)]) + SIGNATURE_DIV0;
    if (decl === OP_ALGEBRAIC_NUM) return 8 * this.getAlgebraicId(expr) + SIGNATURE_ALGEBRAIC;
    if (decl === OP_DISTINCT || decl === OP_PATTERN)
      return `${decl}:${this.mapArgs(expr, (arg) => this.sorts[arg]).join(",")}`;
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) return 8 * decl + SIGNATURE_MODEL_VALUE;
    if (UNCACHED_BV_OPS.has(this.funcDecls[decl].op)) return `bv${decl}`;
    return null;
  }

  getDeclId(expr: number) {
    const signature = this.getSignature(expr);
    return signature === null
      ? this.funcDecls[this.decls[expr]].smallId
      : this.getSignatureDecl(signature).smallId;
  }

  private holdDecl(expr: number) {
    const decl = this.decls[expr];
    if (this.funcDecls[decl].family === FAMILY_USER) {
      this.incDeclRef(decl);
      return;
    }
    const key = this.getSignature(expr);
    if (key === null) return;
    const signatureDecl = this.signatureDecls.get(key);
    if (signatureDecl !== undefined) {
      signatureDecl.refCount++;
      return;
    }
    const smallId = this.mkSmallId();
    // Z3 keeps the equality and ite declarations once it makes them.
    this.signatureDecls.set(key, { smallId, refCount: decl === OP_EQ || decl === OP_ITE ? 2 : 1 });
    if (decl !== OP_NUM && this.funcDecls[decl].family === FAMILY_MODEL_VALUE)
      this.funcDecls[decl].smallId = smallId;
  }

  private releaseDecl(expr: number) {
    const decl = this.decls[expr];
    if (this.funcDecls[decl].family === FAMILY_USER) {
      this.declRefCounts[decl]--;
      if (this.declRefCounts[decl] > 0) return -1;
      this.deletedDecls.add(decl);
      return this.funcDecls[decl].smallId;
    }
    const key = this.getSignature(expr);
    if (key === null) return -1;
    const signatureDecl = this.getSignatureDecl(key);
    signatureDecl.refCount--;
    if (signatureDecl.refCount > 0) return -1;
    this.signatureDecls.delete(key);
    return signatureDecl.smallId;
  }

  incRef(expr: number) {
    this.refCounts[expr]++;
  }

  // A model value's declaration is counted under its signature, like the applications that hold it.
  incDeclRef(decl: number) {
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) {
      const key = 8 * decl + SIGNATURE_MODEL_VALUE;
      const signatureDecl = this.signatureDecls.get(key);
      if (signatureDecl !== undefined) {
        signatureDecl.refCount++;
        return;
      }
      const smallId = this.mkSmallId();
      this.signatureDecls.set(key, { smallId, refCount: 1 });
      this.funcDecls[decl].smallId = smallId;
      return;
    }
    if (this.deletedDecls.delete(decl)) this.funcDecls[decl].smallId = this.mkSmallId();
    this.declRefCounts[decl]++;
  }

  decDeclRef(decl: number) {
    if (this.funcDecls[decl].family === FAMILY_MODEL_VALUE) {
      const key = 8 * decl + SIGNATURE_MODEL_VALUE;
      const signatureDecl = this.getSignatureDecl(key);
      signatureDecl.refCount--;
      if (signatureDecl.refCount > 0) return;
      this.freeSmallIds.push(signatureDecl.smallId);
      this.signatureDecls.delete(key);
      this.numDecls--;
      return;
    }
    this.declRefCounts[decl]--;
    if (this.declRefCounts[decl] > 0) return;
    this.deletedDecls.add(decl);
    this.freeSmallIds.push(this.funcDecls[decl].smallId);
    this.numDecls--;
  }

  // Runs body, holding each expression it creates until it returns, then releases them, the last
  // created first. The caller gets a reference to each expression that getKept picks from the
  // result, by default the result itself, and releases it.
  withTemporaries<T>(
    body: () => T,
    getKept: (result: T) => number[] = (result) => [result as number],
  ) {
    const outer = this.beginTemporaries();
    const result = body();
    for (const kept of getKept(result)) this.incRef(kept);
    this.endTemporaries(outer);
    return result;
  }

  // withTemporaries without closures, for the hot paths: the caller passes what beginTemporaries
  // returns to endTemporaries, and takes its references before it.
  beginTemporaries() {
    const outer = this.temporariesMark;
    this.temporariesMark = this.temporaries.length;
    return outer;
  }

  endTemporaries(outer: number) {
    const temporaries = this.temporaries;
    const mark = this.temporariesMark;
    this.temporariesMark = outer;
    for (let index = temporaries.length - 1; index >= mark; index--)
      this.decRef(temporaries[index]);
    shrink(temporaries, mark);
  }

  withoutTemporaries<T>(body: () => T) {
    const outer = this.temporariesMark;
    this.temporariesMark = -1;
    const result = body();
    this.temporariesMark = outer;
    return result;
  }

  releaseLater(expr: number) {
    if (this.temporariesMark === -1) this.decRef(expr);
    else this.temporaries.push(expr);
  }

  // dec_ref and delete_node: an expression without references is deleted, and so are its children
  // and declaration that lose their last reference, in the order of Z3's worklist. A released
  // declaration's small id goes on the worklist as -1 - id.
  decRef(expr: number) {
    if (this.ids[expr] === -1) return;
    this.refCounts[expr]--;
    if (this.refCounts[expr] > 0) return;
    const worklist = [expr];
    for (let node = worklist.pop(); node !== undefined; node = worklist.pop()) {
      if (node < 0) {
        this.freeSmallIds.push(-1 - node);
        this.numDecls--;
        continue;
      }
      this.deleteNode(node);
      if (this.kinds[node] === KIND_APP) {
        const smallId = this.releaseDecl(node);
        if (this.decls[node] === OP_ALGEBRAIC_NUM)
          this.freeAlgebraicIds.push(this.getAlgebraicId(node));
        if (smallId !== -1) worklist.push(-1 - smallId);
      }
      if (this.kinds[node] !== KIND_QUANTIFIER) {
        const end = this.argStarts[node + 1];
        for (let index = this.argStarts[node]; index < end; index++)
          this.releaseChild(this.argPool[index], worklist);
        continue;
      }
      const data = this.getQuantifier(node);
      this.releaseChild(data.body, worklist);
      for (const pattern of data.patterns) this.releaseChild(pattern, worklist);
      for (const noPattern of data.noPatterns) this.releaseChild(noPattern, worklist);
    }
  }

  private releaseChild(child: number, worklist: number[]) {
    this.refCounts[child]--;
    if (this.refCounts[child] === 0) worklist.push(child);
  }

  private deleteNode(expr: number) {
    this.numLive--;
    this.freeIds.push(this.ids[expr]);
    this.ids[expr] = -1;
  }

  // register_node_core: a new expression takes an id and a reference to each child.
  private registerNode(expr: number) {
    this.ids[expr] = this.freeIds.pop() ?? this.nextId++;
    this.numLive++;
    this.refCounts[expr] = 0;
    if (this.kinds[expr] !== KIND_QUANTIFIER) {
      const end = this.argStarts[expr + 1];
      for (let index = this.argStarts[expr]; index < end; index++)
        this.incRef(this.revive(this.argPool[index]));
    } else {
      const data = this.getQuantifier(expr);
      this.incRef(this.revive(data.body));
      for (const pattern of data.patterns) this.incRef(this.revive(pattern));
      for (const noPattern of data.noPatterns) this.incRef(this.revive(noPattern));
    }
    if (this.kinds[expr] === KIND_APP) this.holdDecl(expr);
    if (this.temporariesMark === -1) return;
    this.incRef(expr);
    this.temporaries.push(expr);
  }

  getNumArgs(expr: number) {
    return this.argStarts[expr + 1] - this.argStarts[expr];
  }

  getArg(expr: number, index: number) {
    return this.argPool[this.argStarts[expr] + index];
  }

  pushArgs(expr: number, target: number[]) {
    const end = this.argStarts[expr + 1];
    for (let index = this.argStarts[expr]; index < end; index++) target.push(this.argPool[index]);
  }

  getArgs(expr: number) {
    const args: number[] = [];
    this.pushArgs(expr, args);
    return args;
  }

  // The callbacks may create expressions, which can replace argPool, so each argument is read anew.
  mapArgs<T>(expr: number, map: (arg: number, index: number) => T) {
    const result: T[] = [];
    for (let index = 0; index < this.getNumArgs(expr); index++)
      result.push(map(this.getArg(expr, index), index));
    return result;
  }

  someArg(expr: number, predicate: (arg: number, index: number) => boolean) {
    for (let index = 0; index < this.getNumArgs(expr); index++)
      if (predicate(this.getArg(expr, index), index)) return true;
    return false;
  }

  everyArg(expr: number, predicate: (arg: number, index: number) => boolean) {
    for (let index = 0; index < this.getNumArgs(expr); index++)
      if (!predicate(this.getArg(expr, index), index)) return false;
    return true;
  }

  private revive(expr: number) {
    if (this.ids[expr] !== -1) return expr;
    if (this.decls[expr] === OP_ALGEBRAIC_NUM)
      this.algebraicNumerals[this.values[expr]].id = this.mkAlgebraicId();
    this.registerNode(expr);
    return expr;
  }

  mkSort(name: SmtSymbol) {
    this.sortHashes.push(
      combineHash(
        getSymbolHash(name),
        getInfoHash(Z3_USER_SORT_FAMILY, this.getUserSortKind(name), []),
      ),
    );
    this.sortNames.push(getSymbolName(name));
    this.sortFamilies.push(FAMILY_USER);
    this.sortWidths.push(0);
    this.sortSbits.push(0);
    this.sortParameters.push([]);
    this.sortSizes.push(SORT_SIZE_INFINITE);
    this.mkSmallId();
    return this.sortNames.length - 1;
  }

  mkBvSort(width: number) {
    const existing = this.bvSorts.get(width);
    if (existing !== undefined) return existing;
    this.sortHashes.push(combineHash(getSymbolHash("bv"), getInfoHash(Z3_BV_FAMILY, 0, [width])));
    this.sortNames.push("bv");
    this.sortFamilies.push(FAMILY_BV);
    this.sortWidths.push(width);
    this.sortSbits.push(0);
    this.sortParameters.push([]);
    this.sortSizes.push(width < 64 ? 1n << BigInt(width) : SORT_SIZE_VERY_BIG);
    // bv_decl_plugin makes the sorts up to 64 bits when Z3 starts.
    if (width > 64) this.mkSmallId();
    const sort = this.sortNames.length - 1;
    this.bvSorts.set(width, sort);
    return sort;
  }

  mkFpSort(ebits: number, sbits: number) {
    const key = `${ebits}:${sbits}`;
    const existing = this.fpSorts.get(key);
    if (existing !== undefined) return existing;
    this.sortHashes.push(
      combineHash(
        getSymbolHash("FloatingPoint"),
        getInfoHash(Z3_FPA_FAMILY, Z3_FLOATING_POINT_SORT, [ebits, sbits]),
      ),
    );
    this.sortNames.push("FloatingPoint");
    this.sortFamilies.push(FAMILY_FPA);
    this.sortWidths.push(ebits);
    this.sortSbits.push(sbits);
    this.sortParameters.push([]);
    this.sortSizes.push(SORT_SIZE_VERY_BIG);
    this.mkSmallId();
    const sort = this.sortNames.length - 1;
    this.fpSorts.set(key, sort);
    return sort;
  }

  mkRmSort() {
    if (this.rmSort !== -1) return this.rmSort;
    this.sortHashes.push(
      combineHash(
        getSymbolHash("RoundingMode"),
        getInfoHash(Z3_FPA_FAMILY, Z3_ROUNDING_MODE_SORT, []),
      ),
    );
    this.sortNames.push("RoundingMode");
    this.sortFamilies.push(FAMILY_FPA);
    this.sortWidths.push(0);
    this.sortSbits.push(0);
    this.sortParameters.push([]);
    this.sortSizes.push(SORT_SIZE_INFINITE);
    this.mkSmallId();
    this.rmSort = this.sortNames.length - 1;
    return this.rmSort;
  }

  isFpSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_FPA && sort !== this.rmSort;
  }

  isRmSort(sort: number) {
    return sort === this.rmSort;
  }

  getEbits(sort: number) {
    return this.sortWidths[sort];
  }

  getSbits(sort: number) {
    return this.sortSbits[sort];
  }

  mkFpaDecl(op: number, name: string, parameters: number[], domain: number[], range: number) {
    const key = `${op}:${name}:${parameters.join(",")}:${domain.join(",")}:${range}`;
    const existing = this.fpaDecls.get(key);
    if (existing !== undefined) return existing;
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(Z3_FPA_FAMILY, op - FPA_OP_BASE, parameters),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_FPA,
      op,
      domain,
      range,
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters,
    });
    this.fpaDecls.set(key, decl);
    return decl;
  }

  mkFpValueId(value: Mpf) {
    const key = `${value.ebits}:${value.sbits}:${value.sign}:${value.exponent}:${value.significand}`;
    const existing = this.fpValueIds.get(key);
    if (existing !== undefined) return existing;
    this.fpValues.push({ ...value });
    this.fpValueIds.set(key, this.fpValues.length - 1);
    return this.fpValues.length - 1;
  }

  getFpValue(id: number): Readonly<Mpf> {
    return this.fpValues[id];
  }

  private addSort(name: string, family: number, parameters: number[], hash: number) {
    this.sortHashes.push(hash);
    this.sortNames.push(name);
    this.sortFamilies.push(family);
    this.sortWidths.push(0);
    this.sortSbits.push(0);
    this.sortParameters.push(parameters);
    this.sortSizes.push(SORT_SIZE_INFINITE);
    return this.sortNames.length - 1;
  }

  // Z3 makes the Char, String and RegLan sorts at startup, so they take no small id.
  mkCharSort() {
    if (this.charSort === -1)
      this.charSort = this.addSort(
        "Unicode",
        FAMILY_CHAR,
        [],
        combineHash(getSymbolHash("Unicode"), getInfoHash(Z3_CHAR_FAMILY, 0, [])),
      );
    return this.charSort;
  }

  // String keeps its element out of its parameters, since it prints as a plain name.
  mkStringSort() {
    if (this.stringSort !== -1) return this.stringSort;
    const charHash = this.sortHashes[this.mkCharSort()];
    this.stringSort = this.addSort(
      "String",
      FAMILY_SEQ,
      [],
      combineHash(getSymbolHash("String"), getInfoHash(Z3_SEQ_FAMILY, Z3_SEQ_SORT, [charHash])),
    );
    return this.stringSort;
  }

  mkSeqSort(element: number) {
    if (element === this.mkCharSort()) return this.mkStringSort();
    const key = `s${element}`;
    const existing = this.seqSorts.get(key);
    if (existing !== undefined) return existing;
    const sort = this.addSort(
      "Seq",
      FAMILY_SEQ,
      [element],
      combineHash(
        getSymbolHash("Seq"),
        getInfoHash(Z3_SEQ_FAMILY, Z3_SEQ_SORT, [this.sortHashes[element]]),
      ),
    );
    this.mkSmallId();
    this.seqSorts.set(key, sort);
    return sort;
  }

  mkReSort(seq: number) {
    const isReglan = seq === this.mkStringSort();
    if (isReglan && this.reglanSort !== -1) return this.reglanSort;
    const key = `r${seq}`;
    const existing = this.seqSorts.get(key);
    if (existing !== undefined) return existing;
    const sort = this.addSort(
      "RegEx",
      FAMILY_SEQ,
      [seq],
      combineHash(
        getSymbolHash("RegEx"),
        getInfoHash(Z3_SEQ_FAMILY, Z3_RE_SORT, [this.sortHashes[seq]]),
      ),
    );
    if (isReglan) this.reglanSort = sort;
    else {
      this.mkSmallId();
      this.seqSorts.set(key, sort);
    }
    return sort;
  }

  isCharSort(sort: number) {
    return sort === this.charSort;
  }

  isStringSort(sort: number) {
    return sort === this.stringSort;
  }

  isSeqSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_SEQ && this.sortNames[sort] !== "RegEx";
  }

  isReSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_SEQ && this.sortNames[sort] === "RegEx";
  }

  getSeqElementSort(sort: number) {
    return sort === this.stringSort ? this.charSort : this.sortParameters[sort][0];
  }

  getReSeqSort(sort: number) {
    return this.sortParameters[sort][0];
  }

  mkSeqDecl(
    op: number,
    name: string,
    parameters: number[],
    parameterHashes: number[],
    domain: number[],
    range: number,
  ) {
    const key = `${op}:${name}:${parameters.join(",")}:${domain.join(",")}:${range}`;
    const existing = this.seqDecls.get(key);
    if (existing !== undefined) return existing;
    const isChar = op >= CHAR_OP_BASE;
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(
        isChar ? Z3_CHAR_FAMILY : Z3_SEQ_FAMILY,
        op - (isChar ? CHAR_OP_BASE : SEQ_OP_BASE),
        parameterHashes,
      ),
    );
    this.funcDecls.push({
      name,
      family: isChar ? FAMILY_CHAR : FAMILY_SEQ,
      op,
      domain,
      range,
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters,
    });
    this.seqDecls.set(key, decl);
    return decl;
  }

  mkStringValueId(chars: readonly number[]) {
    const key = chars.join(",");
    const existing = this.stringValueIds.get(key);
    if (existing !== undefined) return existing;
    this.stringValues.push([...chars]);
    this.stringValueIds.set(key, this.stringValues.length - 1);
    return this.stringValues.length - 1;
  }

  getStringHash(id: number) {
    return bytesHash(new Uint8Array(Uint32Array.from(this.stringValues[id]).buffer), 23);
  }

  getSortHash(sort: number) {
    return this.sortHashes[sort];
  }

  mkString(chars: readonly number[]) {
    const id = this.mkStringValueId(chars);
    const sort = this.mkStringSort();
    const decl = this.mkSeqDecl(
      OP_STRING_CONST,
      "String",
      [id],
      [this.getStringHash(id)],
      [],
      sort,
    );
    return this.mkApp(decl, [], sort);
  }

  getString(expr: number): readonly number[] | undefined {
    if (this.getOp(expr) !== OP_STRING_CONST) return undefined;
    return this.stringValues[this.funcDecls[this.decls[expr]].parameters[0]];
  }

  mkChar(code: number) {
    const sort = this.mkCharSort();
    return this.mkApp(this.mkSeqDecl(OP_CHAR_CONST, "Char", [code], [code], [], sort), [], sort);
  }

  getChar(expr: number) {
    return this.getOp(expr) === OP_CHAR_CONST ? this.funcDecls[this.decls[expr]].parameters[0] : -1;
  }

  mkArraySort(parameters: number[]) {
    const key = parameters.join(",");
    const existing = this.arraySorts.get(key);
    if (existing !== undefined) return existing;
    this.sortHashes.push(
      combineHash(
        getSymbolHash("Array"),
        getInfoHash(
          Z3_ARRAY_FAMILY,
          0,
          parameters.map((parameter) => this.sortHashes[parameter]),
        ),
      ),
    );
    this.sortNames.push("Array");
    this.sortFamilies.push(FAMILY_ARRAY);
    this.sortWidths.push(0);
    this.sortSbits.push(0);
    this.sortParameters.push(parameters);
    this.sortSizes.push(this.getArraySortSize(parameters));
    this.mkSmallId();
    const sort = this.sortNames.length - 1;
    this.arraySorts.set(key, sort);
    return sort;
  }

  private getArraySortSize(parameters: number[]) {
    const sizes = parameters.map((parameter) => this.sortSizes[parameter]);
    if (sizes[sizes.length - 1] === 1n) return 1n;
    if (sizes.includes(SORT_SIZE_INFINITE)) return SORT_SIZE_INFINITE;
    if (sizes.includes(SORT_SIZE_VERY_BIG)) return SORT_SIZE_VERY_BIG;
    const domainSize = sizes.slice(0, -1).reduce((product, size) => product * size, 1n);
    if (domainSize > 128n) return SORT_SIZE_VERY_BIG;
    const size = sizes[sizes.length - 1] ** domainSize;
    return size >= 1n << 64n ? SORT_SIZE_VERY_BIG : size;
  }

  isArraySort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_ARRAY;
  }

  getSortParameters(sort: number): readonly number[] {
    return this.sortParameters[sort];
  }

  getArrayArity(sort: number) {
    return this.sortParameters[sort].length - 1;
  }

  getArrayRange(sort: number) {
    const parameters = this.sortParameters[sort];
    return parameters[parameters.length - 1];
  }

  getSortName(sort: number): string {
    if (this.isBvSort(sort)) return `(_ BitVec ${this.getBvSize(sort)})`;
    if (this.isFpSort(sort))
      return `(_ FloatingPoint ${this.getEbits(sort)} ${this.getSbits(sort)})`;
    const parameters = this.sortParameters[sort].map((parameter) => this.getSortName(parameter));
    if (parameters.length === 0) return this.sortNames[sort];
    return `(${this.sortNames[sort]} ${parameters.join(" ")})`;
  }

  getSortSize(sort: number) {
    return this.sortSizes[sort];
  }

  mkArrayDecl(op: number, name: string, parameters: number[], domain: number[], range: number) {
    const key = `${op}:${parameters.join(",")}:${domain.join(",")}`;
    const existing = this.arrayDecls.get(key);
    if (existing !== undefined) return existing;
    const decl = this.funcDecls.length;
    const parameterHashes = parameters.map((parameter) =>
      op === OP_CONST_ARRAY
        ? this.sortHashes[parameter]
        : op === OP_ARRAY_MAP || op === OP_AS_ARRAY
          ? // A builtin declaration hashes by the signature of each application, which a map lacks.
            (this.getDeclHash(parameter) ?? 0)
          : parameter,
    );
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(Z3_ARRAY_FAMILY, op - ARRAY_OP_BASE, parameterHashes),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_ARRAY,
      op,
      domain,
      range,
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters,
    });
    this.arrayDecls.set(key, decl);
    return decl;
  }

  private mkParametricSort(
    family: number,
    name: SmtSymbol,
    parameters: number[],
    infoHash: number,
  ) {
    const key = `${family}:${typeof name}:${name}:${parameters.join(",")}`;
    const existing = this.parametricSorts.get(key);
    if (existing !== undefined) return existing;
    this.sortHashes.push(combineHash(getSymbolHash(name), infoHash));
    this.sortNames.push(getSymbolName(name));
    this.sortFamilies.push(family);
    this.sortWidths.push(0);
    this.sortSbits.push(0);
    this.sortParameters.push(parameters);
    this.sortSizes.push(SORT_SIZE_INFINITE);
    const sort = this.sortNames.length - 1;
    this.sortSmallIds[sort] = this.mkSmallId();
    this.parametricSorts.set(key, sort);
    return sort;
  }

  private getUserSortKind(name: SmtSymbol) {
    const existing = this.userSortKinds.get(name);
    if (existing !== undefined) return existing;
    this.userSortKinds.set(name, this.numUserSorts);
    return this.numUserSorts++;
  }

  mkUninterpretedSort(name: SmtSymbol, parameters: number[]) {
    return this.mkParametricSort(
      FAMILY_USER,
      name,
      parameters,
      getInfoHash(
        Z3_USER_SORT_FAMILY,
        this.getUserSortKind(name),
        parameters.map((parameter) => this.sortHashes[parameter]),
      ),
    );
  }

  mkDatatypeSort(name: string, parameters: number[]) {
    return this.mkParametricSort(
      FAMILY_DATATYPE,
      name,
      parameters,
      getInfoHash(Z3_DATATYPE_FAMILY, 0, [
        getSymbolHash(name),
        ...parameters.map((parameter) => this.sortHashes[parameter]),
      ]),
    );
  }

  setSortSize(sort: number, size: bigint) {
    this.sortSizes[sort] = size;
  }

  // The sort named by the number index, which stands for a parameter of a datatype declaration.
  mkTypeParameter(index: number) {
    const sort = this.mkUninterpretedSort(index, []);
    this.typeParameters[index] = sort;
    return sort;
  }

  getTypeParameterIndex(sort: number) {
    return this.typeParameters.indexOf(sort);
  }

  getSortSmallId(sort: number) {
    return this.sortSmallIds[sort];
  }

  isDatatypeSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_DATATYPE;
  }

  // The parameters are those of the port, and parameterHashes hash Z3's.
  mkDatatypeDecl(
    op: number,
    name: string,
    parameters: number[],
    parameterHashes: number[],
    domain: number[],
    range: number,
  ) {
    const key = `${op}:${name}:${parameters.join(",")}:${domain.join(",")}:${range}`;
    const existing = this.datatypeDecls.get(key);
    if (existing !== undefined) return existing;
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(Z3_DATATYPE_FAMILY, op - DATATYPE_OP_BASE, parameterHashes),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_DATATYPE,
      op,
      domain,
      range,
      isSkolem: false,
      smallId: this.mkSmallId(),
      parameters,
    });
    this.datatypeDecls.set(key, decl);
    return decl;
  }

  getBvSize(sort: number) {
    return this.sortWidths[sort];
  }

  isBvSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_BV;
  }

  mkBvDecl(op: number, name: string, parameters: number[], domain: number[], range: number) {
    const key = `${op}:${parameters.join(",")}:${domain.join(",")}`;
    const existing = this.bvDecls.get(key);
    if (existing !== undefined) return existing;
    const decl = this.funcDecls.length;
    this.declHashes[decl] = this.getFuncDeclHash(
      name,
      domain,
      range,
      getInfoHash(Z3_BV_FAMILY, op - BV_OP_BASE, parameters),
    );
    this.funcDecls.push({
      name,
      family: FAMILY_BV,
      op,
      domain,
      range,
      isSkolem: false,
      smallId: UNCACHED_BV_OPS.has(op) ? -1 : this.mkSmallId(),
      parameters,
    });
    this.bvDecls.set(key, decl);
    return decl;
  }

  mkBvNumeral(value: bigint, width: number) {
    const modulus = 1n << BigInt(width);
    const normalized = ((value % modulus) + modulus) % modulus;
    const sort = this.mkBvSort(width);
    const key = `b${width}:${normalized}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    let decl = this.bvDecls.get(`n${width}`);
    if (decl === undefined) {
      decl = this.funcDecls.length;
      this.funcDecls.push({
        name: "bv",
        family: FAMILY_BV,
        op: OP_BV_NUM,
        domain: [],
        range: sort,
        isSkolem: false,
        smallId: -1,
        parameters: [width],
      });
      this.bvDecls.set(`n${width}`, decl);
    }
    this.numeralValues.push(Rational.of(normalized));
    const numeralDecl = decl;
    return this.intern(key, KIND_APP, numeralDecl, [], sort, this.numeralValues.length - 1, () =>
      this.getFuncDeclHash(
        "bv",
        [],
        sort,
        getInfoHash(Z3_BV_FAMILY, 0, [(getIntegerHash(normalized) + 3) >>> 0, width]),
      ),
    );
  }

  isBvNumeral(expr: number) {
    return this.getOp(expr) === OP_BV_NUM;
  }

  getBvNumeralValue(expr: number) {
    return this.numeralValues[this.values[expr]].num;
  }

  getSortFamily(sort: number) {
    return this.sortFamilies[sort];
  }

  private getFuncDeclHash(name: SmtSymbol, domain: number[], range: number, infoHash: number) {
    return astArrayHash(
      domain,
      this.sortHashes,
      combineHash(combineHash(getSymbolHash(name), this.sortHashes[range]), infoHash),
    );
  }

  getBuiltinSignature(op: number, args: number[]) {
    const builtin = Z3_BUILTINS.get(op);
    if (builtin === undefined)
      throw new SmtInvariantError(`the operator ${op} has no Z3 declaration`);
    const argSort = op === OP_ITE ? this.sorts[args[1]] : this.sorts[args[0]];
    const arity = builtin[2] === -1 ? args.length : builtin[2];
    const domain = Array.from({ length: arity }, (_, index) =>
      op === OP_PATTERN
        ? this.sorts[args[index]]
        : op === OP_ITE && index === 0
          ? SORT_BOOL
          : argSort,
    );
    return { name: builtin[0], kind: builtin[1], domain };
  }

  private getPatternHash(args: number[], range: number) {
    const key = `${args.map((arg) => this.sorts[arg]).join(",")}:${range}`;
    const existing = this.patternHashes.get(key);
    if (existing !== undefined) return existing;
    const hash = this.mkBuiltinHash(OP_PATTERN, args, range);
    this.patternHashes.set(key, hash);
    return hash;
  }

  // It returns the slot, a small integer, because V8 boxes a hash it returns.
  private getBuiltinSlot(op: number, args: number[], range: number) {
    const argSort = args.length === 0 ? 0 : this.sorts[op === OP_ITE ? args[1] : args[0]];
    const count = args.length;
    const slot = this.findBuiltinSlot(op, argSort, range, count);
    if (this.builtinKeys[4 * slot] !== -1) return slot;
    const hash = this.mkBuiltinHash(op, args, range);
    if (2 * (this.numBuiltinHashes + 1) > this.builtinHashes.length) {
      const keys = this.builtinKeys;
      const hashes = this.builtinHashes;
      this.builtinKeys = new Int32Array(2 * keys.length).fill(-1);
      this.builtinHashes = new Uint32Array(2 * hashes.length);
      this.numBuiltinHashes = 0;
      for (let index = 0; index < 4 * hashes.length; index += 4)
        if (keys[index] !== -1)
          this.insertBuiltinHash(
            keys[index],
            keys[index + 1],
            keys[index + 2],
            keys[index + 3],
            hashes[index / 4],
          );
    }
    return this.insertBuiltinHash(op, argSort, range, count, hash);
  }

  private findBuiltinSlot(op: number, argSort: number, range: number, count: number) {
    const keys = this.builtinKeys;
    const mask = this.builtinHashes.length - 1;
    let slot =
      (Math.imul(Math.imul(Math.imul(op, 0x9e3779b1) + argSort, 0x9e3779b1) + range, 0x9e3779b1) +
        count) &
      mask;
    while (
      keys[4 * slot] !== -1 &&
      (keys[4 * slot] !== op ||
        keys[4 * slot + 1] !== argSort ||
        keys[4 * slot + 2] !== range ||
        keys[4 * slot + 3] !== count)
    )
      slot = (slot + 1) & mask;
    return slot;
  }

  private insertBuiltinHash(
    op: number,
    argSort: number,
    range: number,
    count: number,
    hash: number,
  ) {
    const slot = this.findBuiltinSlot(op, argSort, range, count);
    this.builtinKeys.set([op, argSort, range, count], 4 * slot);
    this.builtinHashes[slot] = hash;
    this.numBuiltinHashes++;
    return slot;
  }

  private mkBuiltinHash(op: number, args: number[], range: number) {
    const signature = this.getBuiltinSignature(op, args);
    const family =
      op === OP_PATTERN ? Z3_PATTERN_FAMILY : op < OP_NUM ? Z3_BASIC_FAMILY : Z3_ARITH_FAMILY;
    return this.getFuncDeclHash(
      signature.name,
      signature.domain,
      range,
      getInfoHash(family, signature.kind, []),
    );
  }

  getDeclHash(decl: number) {
    return this.declHashes[decl];
  }

  getAppDeclHash(app: number) {
    const decl = this.decls[app];
    const funcDecl = this.funcDecls[decl];
    if (hasOwnDeclHash(funcDecl.family)) return this.declHashes[decl];
    const args = this.getArgs(app);
    return funcDecl.op === OP_PATTERN
      ? this.getPatternHash(args, this.sorts[app])
      : this.builtinHashes[this.getBuiltinSlot(funcDecl.op, args, this.sorts[app])];
  }

  mkFuncDecl(name: SmtSymbol, domain: number[], range: number, isSkolem = false) {
    this.declHashes[this.funcDecls.length] = this.getFuncDeclHash(
      name,
      domain,
      range,
      isSkolem ? getInfoHash(Z3_NULL, Z3_NULL, []) : 0,
    );
    this.funcDecls.push({
      name,
      family: FAMILY_USER,
      op: OP_UNINTERPRETED,
      domain,
      range,
      isSkolem,
      smallId: this.mkSmallId(),
      parameters: [],
    });
    this.declRefCounts[this.funcDecls.length - 1] = 1;
    return this.funcDecls.length - 1;
  }

  mkFreshFuncDecl(
    prefix: SmtSymbol | null,
    domain: number[],
    range: number,
    isSkolem = true,
    suffix = "",
  ) {
    const name =
      prefix === null && suffix === ""
        ? this.freshId
        : `${prefix === null ? "sk" : getSymbolName(prefix)}!${suffix === "" ? "" : `${suffix}!`}${this.freshId}`;
    this.freshId++;
    const decl = this.mkFuncDecl(name, domain, range, isSkolem);
    this.declRefCounts[decl] = 0;
    return decl;
  }

  mkFreshVarName(prefix: string | null) {
    const name = `${prefix ?? "var"}!${this.freshId}`;
    this.freshId++;
    return name;
  }

  private intern(
    key: string,
    kind: number,
    decl: number,
    args: number[],
    sort: number,
    value: number,
    getHash: () => number,
  ) {
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    const id = this.create(kind, decl, args, sort, value, getHash());
    this.table.set(key, id);
    this.registerNode(id);
    return id;
  }

  private create(
    kind: number,
    decl: number,
    args: number[],
    sort: number,
    value: number,
    hash: number,
  ) {
    const id = this.numNodes++;
    if (id === this.kinds.length) {
      this.kinds = grow(this.kinds);
      this.decls = grow(this.decls);
      this.sorts = grow(this.sorts);
      this.values = grow(this.values);
      this.freeVarBounds = grow(this.freeVarBounds);
      this.hasQuantifierFlags = grow(this.hasQuantifierFlags);
      this.depths = grow(this.depths);
      this.hashes = grow(this.hashes);
      this.ids = grow(this.ids);
      this.refCounts = grow(this.refCounts);
    }
    this.hashes[id] = hash;
    this.kinds[id] = kind;
    this.decls[id] = decl;
    // Like Z3, a node keeps its own copy of the arguments, so callers may reuse their arrays.
    const start = this.argStarts[id];
    const end = start + args.length;
    if (end > this.argPool.length) {
      const pool = new Int32Array(Math.max(2 * this.argPool.length, end));
      pool.set(this.argPool);
      this.argPool = pool;
    }
    for (let index = 0; index < args.length; index++) this.argPool[start + index] = args[index];
    if (id + 2 > this.argStarts.length) {
      const starts = new Int32Array(2 * this.argStarts.length);
      starts.set(this.argStarts);
      this.argStarts = starts;
    }
    this.argStarts[id + 1] = end;
    this.sorts[id] = sort;
    this.values[id] = value;
    let freeVarBound = kind === KIND_VAR ? value + 1 : 0;
    let hasQuantifier = kind === KIND_QUANTIFIER;
    let depth = 1;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (this.freeVarBounds[arg] > freeVarBound) freeVarBound = this.freeVarBounds[arg];
      if (this.hasQuantifierFlags[arg]) hasQuantifier = true;
      if (this.depths[arg] + 1 > depth) depth = this.depths[arg] + 1;
    }
    this.freeVarBounds[id] = freeVarBound;
    this.hasQuantifierFlags[id] = hasQuantifier ? 1 : 0;
    this.depths[id] = depth;
    return id;
  }

  // The op of a builtin declaration doubles as its index in funcDecls. The arguments are those of
  // args from start on, so that a rewriter passes its result stack without copying it.
  mkApp(decl: number, args: number[], sort: number, start = 0) {
    const funcDecl = this.funcDecls[decl];
    // Numerals and model values carry their value, so only mkNumeral and mkModelValue create them.
    if (
      decl === OP_NUM ||
      decl === OP_ALGEBRAIC_NUM ||
      funcDecl.family === FAMILY_MODEL_VALUE ||
      funcDecl.op === OP_BV_NUM
    )
      throw new SmtInvariantError(`${funcDecl.name} needs a value`);
    let hash = decl;
    for (let index = start; index < args.length; index++)
      hash = (Math.imul(hash, 0x9e3779b1) + args[index]) | 0;
    const count = args.length - start;
    const mask = this.appHandles.length - 1;
    let slot = hash & mask;
    for (; this.appHandles[slot] !== -1; slot = (slot + 1) & mask) {
      const candidate = this.appHandles[slot];
      if (this.appHashes[slot] !== hash || this.decls[candidate] !== decl) continue;
      const poolStart = this.argStarts[candidate];
      if (this.argStarts[candidate + 1] - poolStart !== count) continue;
      let isSame = true;
      for (let index = 0; index < count && isSame; index++)
        isSame = this.argPool[poolStart + index] === args[start + index];
      if (isSame) return this.revive(candidate);
    }
    if (start > 0) {
      shrink(this.argBuffer, 0);
      for (let index = start; index < args.length; index++) this.argBuffer.push(args[index]);
    }
    const nodeArgs = start > 0 ? this.argBuffer : args;
    // The slot comes first, since finding it may replace builtinHashes with one twice the size.
    const hasOwnHash = hasOwnDeclHash(funcDecl.family);
    const builtinSlot =
      hasOwnHash || funcDecl.op === OP_PATTERN
        ? -1
        : this.getBuiltinSlot(funcDecl.op, nodeArgs, sort);
    const declHash = hasOwnHash
      ? this.declHashes[decl]
      : builtinSlot === -1
        ? this.getPatternHash(nodeArgs, sort)
        : this.builtinHashes[builtinSlot];
    const id = this.create(
      KIND_APP,
      decl,
      nodeArgs,
      sort,
      0,
      astArrayHash(nodeArgs, this.hashes, declHash),
    );
    // The lookup ended at a free slot, which the application takes unless the table doubles.
    if (2 * (this.numApps + 1) > this.appHandles.length) {
      const handles = this.appHandles;
      const hashes = this.appHashes;
      this.appHandles = new Int32Array(2 * handles.length).fill(-1);
      this.appHashes = new Int32Array(2 * handles.length);
      this.numApps = 0;
      for (let index = 0; index < handles.length; index++)
        if (handles[index] !== -1) this.insertApp(hashes[index], handles[index]);
      this.insertApp(hash, id);
    } else {
      this.appHandles[slot] = id;
      this.appHashes[slot] = hash;
      this.numApps++;
    }
    this.registerNode(id);
    return id;
  }

  private insertApp(hash: number, id: number) {
    const mask = this.appHandles.length - 1;
    let slot = hash & mask;
    while (this.appHandles[slot] !== -1) slot = (slot + 1) & mask;
    this.appHandles[slot] = id;
    this.appHashes[slot] = hash;
    this.numApps++;
  }

  // A numeral's declaration has the parameters (value, is_int), and a rational hashes as
  // hash(numerator) + 3 hash(denominator).
  private internNumeral(key: string, value: Rational, sort: number) {
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    this.numeralValues.push(value);
    const isInt = sort === SORT_INT;
    return this.intern(key, KIND_APP, OP_NUM, [], sort, this.numeralValues.length - 1, () =>
      this.getFuncDeclHash(
        isInt ? "Int" : "Real",
        [],
        sort,
        getInfoHash(Z3_ARITH_FAMILY, 0, [
          (getIntegerHash(value.num) + 3 * getIntegerHash(value.den)) >>> 0,
          isInt ? 1 : 0,
        ]),
      ),
    );
  }

  get am() {
    this.algebraicManager ??= new AlgebraicManager();
    return this.algebraicManager;
  }

  mkAlgebraicNumeral(value: Anum, sort = SORT_REAL) {
    if (this.am.isRational(value)) return this.mkNumeralOfSort(this.am.toRational(value), sort);
    if (sort === SORT_INT)
      throw new SmtInvariantError("invalid irrational value passed as an integer");
    const id = this.mkAlgebraicId();
    this.algebraicNumerals.push({ value: this.am.copy(value), id });
    const expr = this.create(
      KIND_APP,
      OP_ALGEBRAIC_NUM,
      [],
      SORT_REAL,
      this.algebraicNumerals.length - 1,
      this.getFuncDeclHash("RootObject", [], SORT_REAL, getInfoHash(Z3_ARITH_FAMILY, 1, [id])),
    );
    this.registerNode(expr);
    return expr;
  }

  private mkAlgebraicId() {
    return this.freeAlgebraicIds.pop() ?? this.nextAlgebraicId++;
  }

  isAlgebraicNumeral(expr: number) {
    return this.getOp(expr) === OP_ALGEBRAIC_NUM;
  }

  getAlgebraicValue(expr: number) {
    return this.algebraicNumerals[this.values[expr]].value;
  }

  private getAnumOrNumeral(expr: number) {
    if (this.isAlgebraicNumeral(expr)) return this.getAlgebraicValue(expr);
    return this.isNumeral(expr) ? new Anum(this.getRationalValue(expr)) : undefined;
  }

  getAlgebraicId(expr: number) {
    return this.algebraicNumerals[this.values[expr]].id;
  }

  mkRealNumeral(value: Rational) {
    const numeral = this.internNumeral(`r${value}`, value, SORT_REAL);
    return value.isInt() ? this.holdSmallNumeral(numeral, value.num, this.smallReals) : numeral;
  }

  mkNumeral(value: bigint) {
    const existing = this.intNumerals.get(value);
    if (existing !== undefined)
      return this.holdSmallNumeral(this.revive(existing), value, this.smallInts);
    const numeral = this.internNumeral(`n${value}`, Rational.of(value), SORT_INT);
    this.intNumerals.set(value, numeral);
    return this.holdSmallNumeral(numeral, value, this.smallInts);
  }

  private holdSmallNumeral(numeral: number, value: bigint, cache: number[]) {
    if (value < 0n || value >= MAX_SMALL_NUM_TO_CACHE) return numeral;
    const index = Number(value);
    if (cache[index] !== undefined) return numeral;
    this.incRef(numeral);
    cache[index] = numeral;
    return numeral;
  }

  mkNumeralOfSort(value: Rational, sort: number) {
    return sort === SORT_INT ? this.mkNumeral(value.num) : this.mkRealNumeral(value);
  }

  mkModelValue(index: number, sort: number) {
    const key = `m${sort}:${index}`;
    const existing = this.table.get(key);
    if (existing !== undefined) return this.revive(existing);
    this.funcDecls.push({
      name: `${this.sortNames[sort]}!val!${index}`,
      family: FAMILY_MODEL_VALUE,
      op: OP_MODEL_VALUE,
      domain: [],
      range: sort,
      isSkolem: false,
      smallId: -1,
      parameters: [],
    });
    const decl = this.funcDecls.length - 1;
    this.declHashes[decl] = this.getFuncDeclHash(
      this.funcDecls[decl].name,
      [],
      sort,
      getInfoHash(Z3_MODEL_VALUE_FAMILY, 0, [index, this.sortHashes[sort]]),
    );
    return this.intern(key, KIND_APP, decl, [], sort, index, () => this.declHashes[decl]);
  }

  mkFreshConst(prefix: SmtSymbol | null, sort: number) {
    return this.mkApp(this.mkFreshFuncDecl(prefix, [], sort), [], sort);
  }

  mkVar(index: number, sort: number) {
    return this.intern(`v${index}:${sort}`, KIND_VAR, -1, [], sort, index, () =>
      combineHash(index, this.sortHashes[sort]),
    );
  }

  mkQuantifier(data: QuantifierData) {
    if (data.names.length !== data.sorts.length)
      throw new SmtInvariantError("a quantifier needs a name for each variable");
    // Z3 keeps no-patterns only on a quantifier without patterns.
    const noPatterns = data.patterns.length > 0 ? [] : data.noPatterns;
    const key = `q${data.isForall ? 1 : 0}:${data.sorts.join(",")}:${JSON.stringify(data.names)}:${
      data.body
    }:${data.patterns.join(",")}:${noPatterns.join(",")}:${data.weight}`;
    const existing = this.table.get(key);
    if (existing !== undefined) {
      // A dead quantifier comes back as the new one Z3 makes, with its skolem id.
      if (this.ids[existing] === -1) {
        const old = this.getQuantifier(existing);
        this.quantifiers.set(existing, { ...old, skid: data.skid });
      }
      return this.revive(existing);
    }
    const id = this.create(
      KIND_QUANTIFIER,
      -1,
      [data.body],
      SORT_BOOL,
      0,
      mkMix(
        astArrayHash(data.sorts, this.sortHashes, data.isForall ? 31 : 19),
        data.patterns.length,
        this.hashes[data.body],
      ),
    );
    this.table.set(key, id);
    const bodyBound = this.freeVarBounds[data.body];
    this.freeVarBounds[id] = Math.max(0, bodyBound - data.sorts.length);
    this.quantifiers.set(id, {
      ...data,
      sorts: [...data.sorts],
      names: [...data.names],
      patterns: [...data.patterns],
      noPatterns: [...noPatterns],
    });
    this.registerNode(id);
    return id;
  }

  mkPattern(terms: number[]) {
    return this.mkApp(OP_PATTERN, terms, SORT_BOOL);
  }

  getQuantifier(expr: number) {
    const data = this.quantifiers.get(expr);
    if (data === undefined) throw new SmtInvariantError("the expression is not a quantifier");
    return data;
  }

  isApp(expr: number) {
    return this.kinds[expr] === KIND_APP;
  }

  isVar(expr: number) {
    return this.kinds[expr] === KIND_VAR;
  }

  isGround(expr: number) {
    return this.freeVarBounds[expr] === 0;
  }

  isGroundApp(expr: number) {
    return (
      this.kinds[expr] === KIND_APP &&
      this.freeVarBounds[expr] === 0 &&
      !this.hasQuantifierFlags[expr]
    );
  }

  getOp(expr: number) {
    return this.kinds[expr] === KIND_APP ? this.funcDecls[this.decls[expr]].op : -1;
  }

  getFamily(expr: number) {
    return this.kinds[expr] === KIND_APP ? this.funcDecls[this.decls[expr]].family : -1;
  }

  isBool(expr: number) {
    return this.sorts[expr] === SORT_BOOL;
  }

  isInt(expr: number) {
    return this.sorts[expr] === SORT_INT;
  }

  isReal(expr: number) {
    return this.sorts[expr] === SORT_REAL;
  }

  isTrue(expr: number) {
    return expr === this.trueExpr;
  }

  isFalse(expr: number) {
    return expr === this.falseExpr;
  }

  isNot(expr: number) {
    return this.getOp(expr) === OP_NOT;
  }

  isComplement(first: number, second: number) {
    return (
      (this.isNot(first) && this.getArg(first, 0) === second) ||
      (this.isNot(second) && this.getArg(second, 0) === first) ||
      (first === this.trueExpr && second === this.falseExpr) ||
      (first === this.falseExpr && second === this.trueExpr)
    );
  }

  isNumeral(expr: number) {
    return this.getOp(expr) === OP_NUM;
  }

  getNumeral(expr: number) {
    return this.isNumeral(expr) && this.sorts[expr] === SORT_INT
      ? this.getNumeralValue(expr)
      : undefined;
  }

  getNumeralValue(expr: number) {
    return this.numeralValues[this.values[expr]].num;
  }

  getRationalValue(expr: number) {
    return this.numeralValues[this.values[expr]];
  }

  isUniqueValue(expr: number): boolean {
    const op = this.getOp(expr);
    return (
      op === OP_NUM ||
      op === OP_PI ||
      op === OP_E ||
      op === OP_TRUE ||
      op === OP_FALSE ||
      op === OP_MODEL_VALUE ||
      op === OP_BV_NUM ||
      op === OP_CHAR_CONST ||
      (op >= OP_FPA_RM_NEAREST_TIES_TO_EVEN && op <= OP_FPA_RM_TOWARD_ZERO) ||
      (op === OP_CONST_ARRAY && this.isUniqueValue(this.getArg(expr, 0))) ||
      (op === OP_DT_CONSTRUCTOR &&
        this.mapArgs(expr, (arg) => this.isUniqueValue(arg)).every((isUnique) => isUnique)) ||
      (op === OP_FPA_FP && this.isUniqueFp(expr))
    );
  }

  private isUniqueFp(expr: number) {
    if (!this.mapArgs(expr, (arg) => this.isValue(arg)).every((isValue) => isValue)) return false;
    const exponent = this.getArg(expr, 1);
    const value = this.getBvNumeralValue(exponent);
    return value !== 0n && value !== (1n << BigInt(this.getBvSize(this.sorts[exponent]))) - 1n;
  }

  isValue(expr: number): boolean {
    let current = expr;
    while (this.getOp(current) === OP_STORE) {
      for (let index = 1; index < this.getNumArgs(current); index++)
        if (!this.isValue(this.getArg(current, index))) return false;
      current = this.getArg(current, 0);
    }
    if (this.getOp(current) === OP_CONST_ARRAY) return this.isValue(this.getArg(current, 0));
    if (this.getOp(current) === OP_DT_CONSTRUCTOR || this.getOp(current) === OP_FPA_FP)
      return this.mapArgs(current, (arg) => this.isValue(arg)).every((isValue) => isValue);
    if (this.getOp(current) >= OP_FPA_NUM && this.getOp(current) <= OP_FPA_MINUS_ZERO) return true;
    if (this.getOp(current) === OP_ALGEBRAIC_NUM) return true;
    if (this.getFamily(current) === FAMILY_SEQ) return this.isSeqValue(current);
    return current === expr && this.isUniqueValue(expr);
  }

  private isSeqValue(expr: number) {
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      const op = this.getOp(current);
      if (op === OP_SEQ_EMPTY || op === OP_STRING_CONST) continue;
      if (op === OP_SEQ_UNIT && this.isValue(this.getArg(current, 0))) continue;
      if (op !== OP_SEQ_CONCAT || !this.everyArg(current, (arg) => this.isApp(arg))) return false;
      this.pushArgs(current, todo);
    }
    return true;
  }

  private areSeqsDistinct(first: number, second: number): boolean {
    const firstOp = this.getOp(first);
    const secondOp = this.getOp(second);
    if (first === second) return false;
    if (firstOp === OP_STRING_CONST && secondOp === OP_STRING_CONST) return true;
    if (firstOp === OP_SEQ_UNIT && secondOp === OP_SEQ_UNIT)
      return this.areDistinct(this.getArg(first, 0), this.getArg(second, 0));
    return (
      (firstOp === OP_SEQ_EMPTY && secondOp === OP_SEQ_UNIT) ||
      (firstOp === OP_SEQ_UNIT && secondOp === OP_SEQ_EMPTY)
    );
  }

  // are_distinct: the plugin of the first term's family, or of the second's for a user term, tells
  // two terms apart. Every plugin separates distinct unique values, and arith also separates b from
  // (+ b k) and (+ k b) for a nonzero numeral k.
  areDistinct(first: number, second: number): boolean {
    if (this.kinds[first] !== KIND_APP || this.kinds[second] !== KIND_APP) return false;
    const pluginFamily =
      this.getFamily(first) === FAMILY_USER ? this.getFamily(second) : this.getFamily(first);
    if (pluginFamily === FAMILY_SEQ) return this.areSeqsDistinct(first, second);
    if (first !== second && this.isUniqueValue(first) && this.isUniqueValue(second)) return true;
    const family = this.funcDecls[this.decls[first]].family;
    if (family === FAMILY_DATATYPE) {
      if (this.getOp(first) !== OP_DT_CONSTRUCTOR || this.getOp(second) !== OP_DT_CONSTRUCTOR)
        return false;
      if (this.decls[first] !== this.decls[second]) return true;
      for (let index = this.getNumArgs(first) - 1; index >= 0; index--)
        if (this.areDistinct(this.getArg(first, index), this.getArg(second, index))) return true;
      return false;
    }
    if (
      (family === FAMILY_USER ? this.funcDecls[this.decls[second]].family : family) !== FAMILY_ARITH
    )
      return false;
    const firstValue = this.getAnumOrNumeral(first);
    const secondValue = this.getAnumOrNumeral(second);
    if (
      firstValue !== undefined &&
      secondValue !== undefined &&
      (this.isAlgebraicNumeral(first) || this.isAlgebraicNumeral(second))
    )
      return this.am.compare(firstValue, secondValue) !== 0;
    const isOffsetOf = (sum: number, term: number) => {
      if (this.getOp(sum) !== OP_ADD || this.getNumArgs(sum) !== 2) return false;
      const first = this.getArg(sum, 0);
      const second = this.getArg(sum, 1);
      const isNonZero = (expr: number) =>
        this.isNumeral(expr) && !this.getRationalValue(expr).isZero();
      return (first === term && isNonZero(second)) || (second === term && isNonZero(first));
    };
    return isOffsetOf(first, second) || isOffsetOf(second, first);
  }

  isModelValue(expr: number) {
    return this.getOp(expr) === OP_MODEL_VALUE;
  }

  isUninterpretedSort(sort: number) {
    return this.sortFamilies[sort] === FAMILY_USER;
  }

  isUninterpretedConst(expr: number) {
    return this.isUninterpreted(expr) && this.getNumArgs(expr) === 0;
  }

  isUninterpreted(expr: number) {
    return this.getFamily(expr) === FAMILY_USER;
  }

  getTimesMinusOneArg(expr: number) {
    if (this.getOp(expr) !== OP_MUL || this.getNumArgs(expr) !== 2) return undefined;
    const coefficient = this.getArg(expr, 0);
    return this.isNumeral(coefficient) &&
      this.getRationalValue(coefficient).equals(Rational.minusOne)
      ? this.getArg(expr, 1)
      : undefined;
  }

  isOccurring(decl: number, expr: number) {
    return this.someSubterm(expr, (current) => this.decls[current] === decl);
  }

  containsModelValue(expr: number) {
    return this.someSubterm(expr, (current) => this.isModelValue(current));
  }

  // Visits the subterms with a stack of its own, so deep terms do not exhaust the call stack.
  private someSubterm(expr: number, predicate: (expr: number) => boolean) {
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      const kind = this.kinds[current];
      if (kind === KIND_QUANTIFIER) todo.push(this.getQuantifier(current).body);
      else if (kind !== KIND_VAR) {
        if (predicate(current)) return true;
        this.pushArgs(current, todo);
      }
    }
    return false;
  }

  mkNot(expr: number) {
    if (expr === this.trueExpr) return this.falseExpr;
    if (expr === this.falseExpr) return this.trueExpr;
    return this.mkApp(OP_NOT, [expr], SORT_BOOL);
  }

  mkEq(left: number, right: number) {
    return this.mkApp(OP_EQ, [left, right], SORT_BOOL);
  }

  mkOr(args: number[]) {
    if (args.length === 0) return this.falseExpr;
    if (args.length === 1) return args[0];
    return this.mkApp(OP_OR, args, SORT_BOOL);
  }

  mkAnd(args: number[]) {
    if (args.length === 0) return this.trueExpr;
    if (args.length === 1) return args[0];
    return this.mkApp(OP_AND, args, SORT_BOOL);
  }

  getDeclName(expr: number) {
    return getSymbolName(this.funcDecls[this.decls[expr]].name);
  }

  toString(expr: number): string {
    const kind = this.kinds[expr];
    if (kind === KIND_VAR) return `(:var ${this.values[expr]})`;
    if (kind === KIND_QUANTIFIER) {
      const data = this.getQuantifier(expr);
      return `(${data.isForall ? "forall" : "exists"} (${data.sorts.length}) ${this.toString(data.body)})`;
    }
    if (this.getOp(expr) === OP_BV_NUM)
      return `(_ bv${this.getBvNumeralValue(expr)} ${this.getBvSize(this.sorts[expr])})`;
    if (this.getOp(expr) === OP_NUM) {
      const value = this.getRationalValue(expr);
      if (this.sorts[expr] === SORT_INT) return String(value.num);
      return value.isInt() ? `${value.num}.0` : `(/ ${value.num}.0 ${value.den}.0)`;
    }
    const name = this.getDeclName(expr);
    return this.getNumArgs(expr) === 0
      ? name
      : `(${name} ${this.mapArgs(expr, (innerArg) => this.toString(innerArg)).join(" ")})`;
  }
}

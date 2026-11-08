// Ported from Z3 (src/ast/bv_decl_plugin.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError } from "../../../errors";
import {
  type AstManager,
  OP_BADD,
  OP_BAND,
  OP_BASHR,
  OP_BCOMP,
  OP_BIT2BOOL,
  OP_BLSHR,
  OP_BMUL,
  OP_BNAND,
  OP_BNEG,
  OP_BNEG_OVFL,
  OP_BNOR,
  OP_BNOT,
  OP_BOR,
  OP_BREDAND,
  OP_BREDOR,
  OP_BSADD_OVFL,
  OP_BSDIV,
  OP_BSDIV0,
  OP_BSDIV_I,
  OP_BSDIV_OVFL,
  OP_BSHL,
  OP_BSMOD,
  OP_BSMOD0,
  OP_BSMOD_I,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSMUL_OVFL,
  OP_BSREM,
  OP_BSREM0,
  OP_BSREM_I,
  OP_BSSUB_OVFL,
  OP_BSUB,
  OP_BUADD_OVFL,
  OP_BUDIV,
  OP_BUDIV0,
  OP_BUDIV_I,
  OP_BUMUL_NO_OVFL,
  OP_BUMUL_OVFL,
  OP_BUREM,
  OP_BUREM0,
  OP_BUREM_I,
  OP_BUSUB_OVFL,
  OP_BXNOR,
  OP_BXOR,
  OP_CARRY,
  OP_CONCAT,
  OP_EXTRACT,
  OP_EXT_ROTATE_LEFT,
  OP_EXT_ROTATE_RIGHT,
  OP_INT2BV,
  OP_MKBV,
  OP_REPEAT,
  OP_ROTATE_LEFT,
  OP_ROTATE_RIGHT,
  OP_SBV2INT,
  OP_SGEQ,
  OP_SGT,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_SLT,
  OP_UBV2INT,
  OP_UGEQ,
  OP_UGT,
  OP_ULEQ,
  OP_ULT,
  OP_XOR3,
  OP_ZERO_EXT,
  SORT_BOOL,
  SORT_INT,
} from "./ast";

// The ops whose arguments and result share a sort, with their names and whether associative.
const BINARY_OPS = new Map<number, [string, boolean]>([
  [OP_BADD, ["bvadd", true]],
  [OP_BSUB, ["bvsub", false]],
  [OP_BMUL, ["bvmul", true]],
  [OP_BSDIV, ["bvsdiv", false]],
  [OP_BUDIV, ["bvudiv", false]],
  [OP_BSREM, ["bvsrem", false]],
  [OP_BUREM, ["bvurem", false]],
  [OP_BSMOD, ["bvsmod", false]],
  [OP_BSDIV_I, ["bvsdiv_i", false]],
  [OP_BUDIV_I, ["bvudiv_i", false]],
  [OP_BSREM_I, ["bvsrem_i", false]],
  [OP_BUREM_I, ["bvurem_i", false]],
  [OP_BSMOD_I, ["bvsmod_i", false]],
  [OP_BAND, ["bvand", true]],
  [OP_BOR, ["bvor", true]],
  [OP_BXOR, ["bvxor", true]],
  [OP_BNAND, ["bvnand", false]],
  [OP_BNOR, ["bvnor", false]],
  [OP_BXNOR, ["bvxnor", true]],
  [OP_BSHL, ["bvshl", false]],
  [OP_BLSHR, ["bvlshr", false]],
  [OP_BASHR, ["bvashr", false]],
  [OP_EXT_ROTATE_LEFT, ["ext_rotate_left", false]],
  [OP_EXT_ROTATE_RIGHT, ["ext_rotate_right", false]],
]);

const UNARY_OPS = new Map<number, string>([
  [OP_BNEG, "bvneg"],
  [OP_BNOT, "bvnot"],
  [OP_BSDIV0, "bvsdiv0"],
  [OP_BUDIV0, "bvudiv0"],
  [OP_BSREM0, "bvsrem0"],
  [OP_BUREM0, "bvurem0"],
  [OP_BSMOD0, "bvsmod0"],
]);

const PREDICATES = new Map<number, string>([
  [OP_ULEQ, "bvule"],
  [OP_SLEQ, "bvsle"],
  [OP_UGEQ, "bvuge"],
  [OP_SGEQ, "bvsge"],
  [OP_ULT, "bvult"],
  [OP_SLT, "bvslt"],
  [OP_UGT, "bvugt"],
  [OP_SGT, "bvsgt"],
  [OP_BUMUL_NO_OVFL, "bvumul_noovfl"],
  [OP_BSMUL_NO_OVFL, "bvsmul_noovfl"],
  [OP_BSMUL_NO_UDFL, "bvsmul_noudfl"],
  [OP_BUMUL_OVFL, "bvumulo"],
  [OP_BSMUL_OVFL, "bvsmulo"],
  [OP_BSDIV_OVFL, "bvsdivo"],
  [OP_BUADD_OVFL, "bvuaddo"],
  [OP_BSADD_OVFL, "bvsaddo"],
  [OP_BUSUB_OVFL, "bvusubo"],
  [OP_BSSUB_OVFL, "bvssubo"],
]);

export const BV_OP_NAMES = new Map<string, number>([
  ["bvneg", OP_BNEG],
  ["bvnego", OP_BNEG_OVFL],
  ["bvadd", OP_BADD],
  ["bvuaddo", OP_BUADD_OVFL],
  ["bvsaddo", OP_BSADD_OVFL],
  ["bvsub", OP_BSUB],
  ["bvusubo", OP_BUSUB_OVFL],
  ["bvssubo", OP_BSSUB_OVFL],
  ["bvmul", OP_BMUL],
  ["bvumulo", OP_BUMUL_OVFL],
  ["bvsmulo", OP_BSMUL_OVFL],
  ["bvsdiv", OP_BSDIV],
  ["bvsdivo", OP_BSDIV_OVFL],
  ["bvudiv", OP_BUDIV],
  ["bvsrem", OP_BSREM],
  ["bvurem", OP_BUREM],
  ["bvsmod", OP_BSMOD],
  ["bvsdiv_i", OP_BSDIV_I],
  ["bvudiv_i", OP_BUDIV_I],
  ["bvsrem_i", OP_BSREM_I],
  ["bvurem_i", OP_BUREM_I],
  ["bvsmod_i", OP_BSMOD_I],
  ["bvule", OP_ULEQ],
  ["bvsle", OP_SLEQ],
  ["bvuge", OP_UGEQ],
  ["bvsge", OP_SGEQ],
  ["bvult", OP_ULT],
  ["bvslt", OP_SLT],
  ["bvugt", OP_UGT],
  ["bvsgt", OP_SGT],
  ["bvand", OP_BAND],
  ["bvor", OP_BOR],
  ["bvnot", OP_BNOT],
  ["bvxor", OP_BXOR],
  ["bvnand", OP_BNAND],
  ["bvnor", OP_BNOR],
  ["bvxnor", OP_BXNOR],
  ["concat", OP_CONCAT],
  ["sign_extend", OP_SIGN_EXT],
  ["zero_extend", OP_ZERO_EXT],
  ["extract", OP_EXTRACT],
  ["repeat", OP_REPEAT],
  ["bvredor", OP_BREDOR],
  ["bvredand", OP_BREDAND],
  ["bvcomp", OP_BCOMP],
  ["bvshl", OP_BSHL],
  ["bvlshr", OP_BLSHR],
  ["bvashr", OP_BASHR],
  ["rotate_left", OP_ROTATE_LEFT],
  ["rotate_right", OP_ROTATE_RIGHT],
  ["bit2bool", OP_BIT2BOOL],
  ["ubv_to_int", OP_UBV2INT],
  ["sbv_to_int", OP_SBV2INT],
  ["int_to_bv", OP_INT2BV],
  ["bvumul_noovfl", OP_BUMUL_NO_OVFL],
  ["bvsmul_noovfl", OP_BSMUL_NO_OVFL],
  ["bvsmul_noudfl", OP_BSMUL_NO_UDFL],
  ["bvsdiv0", OP_BSDIV0],
  ["bvudiv0", OP_BUDIV0],
  ["bvsrem0", OP_BSREM0],
  ["bvurem0", OP_BUREM0],
  ["bvsmod0", OP_BSMOD0],
  ["ext_rotate_left", OP_EXT_ROTATE_LEFT],
  ["ext_rotate_right", OP_EXT_ROTATE_RIGHT],
  ["int2bv", OP_INT2BV],
  ["bv2int", OP_UBV2INT],
  ["bv2nat", OP_UBV2INT],
  ["mkbv", OP_MKBV],
]);

export const isAssociativeBvOp = (op: number) => BINARY_OPS.get(op)?.[1] === true;

interface BvSignature {
  name: string;
  domain: number[];
  range: number;
}

export const getBvSignature = (
  manager: AstManager,
  op: number,
  argSorts: number[],
  parameters: number[],
): BvSignature | string => {
  if (op === OP_CARRY || op === OP_XOR3)
    return {
      name: op === OP_CARRY ? "carry" : "xor3",
      domain: [SORT_BOOL, SORT_BOOL, SORT_BOOL],
      range: SORT_BOOL,
    };
  if (op === OP_MKBV) {
    if (argSorts.some((sort) => sort !== SORT_BOOL)) return "invalid mkbv operator";
    return { name: "mkbv", domain: argSorts, range: manager.mkBvSort(argSorts.length) };
  }
  if (op === OP_INT2BV) {
    if (parameters.length !== 1) return "int2bv expects one parameter";
    if (parameters[0] === 0) return "bit-vector size must be greater than zero";
    if (argSorts.length !== 1) return "expecting one argument to int_to_bv";
    return { name: "int_to_bv", domain: argSorts, range: manager.mkBvSort(parameters[0]) };
  }
  if (argSorts.length === 0) return "no arguments supplied to bit-vector operator";
  if (!manager.isBvSort(argSorts[0])) return "could not extract bit-vector size";
  const sort = argSorts[0];
  const size = manager.getBvSize(sort);
  const binary = BINARY_OPS.get(op);
  const fixed =
    binary !== undefined
      ? { name: binary[0], domain: [sort, sort], range: sort }
      : UNARY_OPS.has(op)
        ? { name: UNARY_OPS.get(op) ?? "", domain: [sort], range: sort }
        : PREDICATES.has(op)
          ? { name: PREDICATES.get(op) ?? "", domain: [sort, sort], range: SORT_BOOL }
          : op === OP_BNEG_OVFL
            ? { name: "bvnego", domain: [sort], range: SORT_BOOL }
            : op === OP_BREDOR || op === OP_BREDAND
              ? {
                  name: op === OP_BREDOR ? "bvredor" : "bvredand",
                  domain: [sort],
                  range: manager.mkBvSort(1),
                }
              : op === OP_BCOMP
                ? { name: "bvcomp", domain: [sort, sort], range: manager.mkBvSort(1) }
                : undefined;
  if (fixed !== undefined) {
    if (argSorts.length !== fixed.domain.length && !(binary?.[1] === true && argSorts.length > 2))
      return "declared arity mismatches supplied arity";
    if (argSorts.some((argSort) => argSort !== sort))
      return "declared sorts do not match supplied sorts";
    return fixed;
  }
  const isUnaryWithInt = argSorts.length === 1 && parameters.length === 1;
  switch (op) {
    case OP_BIT2BOOL:
      if (!isUnaryWithInt || parameters[0] >= size) return "invalid bit2bool declaration";
      return { name: "bit2bool", domain: argSorts, range: SORT_BOOL };
    case OP_UBV2INT:
    case OP_SBV2INT:
      if (argSorts.length !== 1)
        return `expecting one argument to ${op === OP_UBV2INT ? "ubv_to_int" : "sbv_to_int"}`;
      return {
        name: op === OP_UBV2INT ? "ubv_to_int" : "sbv_to_int",
        domain: argSorts,
        range: SORT_INT,
      };
    case OP_CONCAT: {
      if (!argSorts.every((argSort) => manager.isBvSort(argSort)))
        return "invalid concat application";
      const width = argSorts.reduce((sum, argSort) => sum + manager.getBvSize(argSort), 0);
      return { name: "concat", domain: argSorts, range: manager.mkBvSort(width) };
    }
    case OP_SIGN_EXT:
    case OP_ZERO_EXT:
      if (!isUnaryWithInt || parameters[0] < 0)
        return `invalid ${op === OP_SIGN_EXT ? "sign_extend" : "zero_extend"} application`;
      return {
        name: op === OP_SIGN_EXT ? "sign_extend" : "zero_extend",
        domain: argSorts,
        range: manager.mkBvSort(size + parameters[0]),
      };
    case OP_EXTRACT:
      if (
        argSorts.length !== 1 ||
        parameters.length !== 2 ||
        parameters[1] > parameters[0] ||
        parameters[0] >= size
      )
        return "invalid extract application";
      return {
        name: "extract",
        domain: argSorts,
        range: manager.mkBvSort(parameters[0] - parameters[1] + 1),
      };
    case OP_ROTATE_LEFT:
    case OP_ROTATE_RIGHT: {
      const direction = op === OP_ROTATE_LEFT ? "left" : "right";
      if (argSorts.length !== 1) return `rotate ${direction} expects one argument`;
      if (parameters.length !== 1) return `rotate ${direction} expects one integer parameter`;
      return { name: `rotate_${direction}`, domain: argSorts, range: sort };
    }
    case OP_REPEAT:
      if (argSorts.length !== 1) return "repeat expects one argument";
      if (parameters.length !== 1 || parameters[0] === 0)
        return "repeat expects one nonzero integer parameter";
      return { name: "repeat", domain: argSorts, range: manager.mkBvSort(size * parameters[0]) };
    default:
      return "invalid bit-vector operator";
  }
};

export const mkBvApp = (
  manager: AstManager,
  op: number,
  args: number[],
  parameters: number[] = [],
) => {
  const signature = getBvSignature(
    manager,
    op,
    args.map((arg) => manager.sorts[arg]),
    parameters,
  );
  if (typeof signature === "string") throw new SmtInvariantError(signature);
  const decl = manager.mkBvDecl(op, signature.name, parameters, signature.domain, signature.range);
  return manager.mkApp(decl, args, signature.range);
};

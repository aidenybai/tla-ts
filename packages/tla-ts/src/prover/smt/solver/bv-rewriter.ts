// Ported from Z3 (src/ast/rewriter/bv_rewriter.cpp, mk_extract_proc.cpp), MIT license, see
// z3-license.txt. The rewrites of bit-vector terms, with elim_sign_ext, bit2bool, bv_sort_ac and
// bv_le2extract on and blast_eq_value, bv_extract_prop, bv_not_simpl, bv_ite2id and bv_le_extra
// off, as bv_rewriter_params sets them.
import { isAstLess } from "./ast-lt";
import {
  type AstManager,
  FAMILY_BV,
  KIND_APP,
  KIND_VAR,
  OP_ADD,
  OP_AND,
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
  OP_CONCAT,
  OP_EQ,
  OP_EXT_ROTATE_LEFT,
  OP_EXT_ROTATE_RIGHT,
  OP_EXTRACT,
  OP_IMPLIES,
  OP_INT2BV,
  OP_ITE,
  OP_MKBV,
  OP_MUL,
  OP_OR,
  OP_REPEAT,
  OP_ROTATE_LEFT,
  OP_ROTATE_RIGHT,
  OP_SBV2INT,
  OP_SGEQ,
  OP_SGT,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_SLT,
  OP_SUB,
  OP_UBV2INT,
  OP_UGEQ,
  OP_UGT,
  OP_ULEQ,
  OP_ULT,
  OP_XOR,
  OP_ZERO_EXT,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import { type ArithRewriterOptions, PolyRewriter } from "./poly-rewriter";
import { Rational } from "./rational";
import type { Rewrite } from "./rewriter-tpl";

type Result = number | Rewrite | undefined;

// The bv_rewriter_params that differ between the simplifier's callers.
export interface BvRewriterOptions {
  readonly isHiDiv0: boolean;
  readonly isMul2concat: boolean;
  readonly isSplitConcatEq: boolean;
}

export const DEFAULT_BV_OPTIONS: Omit<BvRewriterOptions, "isHiDiv0"> = {
  isMul2concat: false,
  isSplitConcatEq: false,
};

// The Boolean rewrites that mk_bit2bool applies with a bool_rewriter of its own.
export interface BoolRewrites {
  mkEq: (left: number, right: number) => number;
  mkIte: (condition: number, thenExpr: number, elseExpr: number) => number;
}

const rewrite = (expr: number, depth: number): Rewrite => ({ expr, depth });

const getPowerOfTwo = (bits: number) => 1n << BigInt(bits);

// mod: the remainder that has the sign of the divisor's absolute value.
const getMod = (value: bigint, modulus: bigint) => ((value % modulus) + modulus) % modulus;

// rational::is_power_of_two: the exponent, or -1.
const getPowerOfTwoExponent = (value: bigint) => {
  if (value <= 0n || (value & (value - 1n)) !== 0n) return -1;
  return value.toString(2).length - 1;
};

// rational::mult_inverse: the inverse of an odd value modulo 2^bits.
const getMultInverse = (value: bigint, bits: number) => {
  if (value === 1n) return 1n;
  if (value % 2n === 0n) return undefined;
  const modulus = getPowerOfTwo(bits);
  let [oldRemainder, remainder] = [getMod(value, modulus), modulus];
  let [oldCoefficient, coefficient] = [1n, 0n];
  while (remainder !== 0n) {
    const quotient = oldRemainder / remainder;
    [oldRemainder, remainder] = [remainder, oldRemainder - quotient * remainder];
    [oldCoefficient, coefficient] = [coefficient, oldCoefficient - quotient * coefficient];
  }
  return getMod(oldCoefficient, modulus);
};

const getAbs = (value: bigint) => (value < 0n ? -value : value);

export class BvRewriter extends PolyRewriter {
  constructor(
    manager: AstManager,
    options: ArithRewriterOptions,
    private bvOptions: BvRewriterOptions,
    private boolRewrites: BoolRewrites,
  ) {
    super(manager, { ...options, isSortSums: true });
  }

  protected isNumeral(expr: number) {
    return this.manager.isBvNumeral(expr);
  }

  protected normalize(value: Rational) {
    return Rational.of(getMod(value.num, getPowerOfTwo(this.manager.getBvSize(this.currSort))));
  }

  protected mkNumeral(value: Rational) {
    return this.manager.mkBvNumeral(value.num, this.manager.getBvSize(this.currSort));
  }

  protected isAdd(expr: number) {
    return this.manager.getOp(expr) === OP_BADD;
  }

  protected isMul(expr: number) {
    return this.manager.getOp(expr) === OP_BMUL;
  }

  protected isArithTerm(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && this.manager.getFamily(expr) === FAMILY_BV;
  }

  protected mkAddTerm(args: number[]) {
    return mkBvApp(this.manager, OP_BADD, args);
  }

  protected mkMulTerm(args: number[]) {
    return mkBvApp(this.manager, OP_BMUL, args);
  }

  private getSize(expr: number) {
    return this.manager.getBvSize(this.manager.sorts[expr]);
  }

  private getNumeral(expr: number) {
    return this.manager.isBvNumeral(expr) ? this.manager.getBvNumeralValue(expr) : undefined;
  }

  private mkBv(value: bigint, width: number) {
    return this.manager.mkBvNumeral(value, width);
  }

  private mkZero(width: number) {
    return this.manager.mkBvNumeral(0n, width);
  }

  private mkOne(width: number) {
    return this.manager.mkBvNumeral(1n, width);
  }

  private mkAllOnes(width: number) {
    return this.manager.mkBvNumeral(getPowerOfTwo(width) - 1n, width);
  }

  private app(op: number, args: number[], parameters: number[] = []) {
    return mkBvApp(this.manager, op, args, parameters);
  }

  // bv_util::norm.
  private norm(value: bigint, width: number, isSigned = false) {
    const normalized = getMod(value, getPowerOfTwo(width));
    return isSigned && normalized >= getPowerOfTwo(width - 1)
      ? normalized - getPowerOfTwo(width)
      : normalized;
  }

  private hasSignBit(value: bigint, width: number) {
    return this.norm(value, width) >= getPowerOfTwo(width - 1);
  }

  private isAllOnes(expr: number) {
    return this.getNumeral(expr) === getPowerOfTwo(this.getSize(expr)) - 1n;
  }

  private isBinary(expr: number, op: number) {
    return this.manager.getOp(expr) === op && this.manager.getNumArgs(expr) === 2;
  }

  private isConcat(expr: number) {
    return this.manager.getOp(expr) === OP_CONCAT;
  }

  private isExtract(expr: number) {
    return this.manager.getOp(expr) === OP_EXTRACT;
  }

  private getParameter(expr: number, index: number) {
    return this.manager.funcDecls[this.manager.decls[expr]].parameters[index];
  }

  private isIte(expr: number) {
    return this.manager.getOp(expr) === OP_ITE;
  }

  private mkIteTerm(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(
      OP_ITE,
      [condition, thenExpr, elseExpr],
      this.manager.sorts[thenExpr],
    );
  }

  private mkAndTerm(args: number[]) {
    return this.manager.mkApp(OP_AND, args, SORT_BOOL);
  }

  private mkOrTerm(args: number[]) {
    return this.manager.mkApp(OP_OR, args, SORT_BOOL);
  }

  // mk_extract_proc: an extract of an extract extracts from its argument, and an extract of every
  // bit is the term itself.
  mkExtractTerm(high: number, low: number, arg: number) {
    let target = arg;
    let newHigh = high;
    let newLow = low;
    while (this.isExtract(target)) {
      newLow += this.getParameter(target, 1);
      newHigh += this.getParameter(target, 1);
      target = this.manager.getArg(target, 0);
    }
    if (
      newLow === 0 &&
      newHigh + 1 === this.getSize(target) &&
      this.manager.kinds[target] === KIND_APP
    )
      return target;
    return this.app(OP_EXTRACT, [target], [newHigh, newLow]);
  }

  private mkConcatTerm(args: number[]) {
    return this.app(OP_CONCAT, args);
  }

  private mkNotTerm(arg: number) {
    return this.app(OP_BNOT, [arg]);
  }

  mkAppCore(decl: number, args: number[]): Result {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    const parameters = funcDecl.parameters;
    const op = funcDecl.op;
    switch (op) {
      case OP_ULEQ:
        return this.mkLeqCore(false, args[0], args[1]);
      case OP_UGEQ:
        return this.mkLeqCore(false, args[1], args[0]) ?? this.app(OP_ULEQ, [args[1], args[0]]);
      case OP_ULT:
        return this.mkUlt(args[0], args[1]);
      case OP_UGT:
        return this.mkUlt(args[1], args[0]);
      case OP_SLEQ:
        return this.mkLeqCore(true, args[0], args[1]);
      case OP_SGEQ:
        return this.mkLeqCore(true, args[1], args[0]) ?? this.app(OP_SLEQ, [args[1], args[0]]);
      case OP_SLT:
        return this.mkSlt(args[0], args[1]);
      case OP_SGT:
        return this.mkSlt(args[1], args[0]);
      case OP_BADD:
        return this.mkBvAdd(args);
      case OP_BMUL:
        return this.mkBvMul(args);
      case OP_BSUB:
        return this.mkSub(args);
      case OP_BNEG:
        return this.mkUminus(args[0]);
      case OP_BNEG_OVFL:
        return rewrite(
          manager.mkEq(
            args[0],
            this.mkBv(getPowerOfTwo(this.getSize(args[0]) - 1), this.getSize(args[0])),
          ),
          3,
        );
      case OP_BSHL:
        return this.mkBvShl(args[0], args[1]);
      case OP_BLSHR:
        return this.mkBvLshr(args[0], args[1]);
      case OP_BASHR:
        return this.mkBvAshr(args[0], args[1]);
      case OP_BSDIV:
      case OP_BSDIV_I:
        return this.mkBvSdiv(args[0], args[1], op === OP_BSDIV_I || this.bvOptions.isHiDiv0);
      case OP_BUDIV:
      case OP_BUDIV_I:
        return this.mkBvUdiv(args[0], args[1], op === OP_BUDIV_I || this.bvOptions.isHiDiv0);
      case OP_BSREM:
      case OP_BSREM_I:
        return this.mkBvSrem(args[0], args[1], op === OP_BSREM_I || this.bvOptions.isHiDiv0);
      case OP_BUREM:
      case OP_BUREM_I:
        return this.mkBvUrem(args[0], args[1], op === OP_BUREM_I || this.bvOptions.isHiDiv0);
      case OP_BSMOD:
      case OP_BSMOD_I:
        return this.mkBvSmod(args[0], args[1], op === OP_BSMOD_I || this.bvOptions.isHiDiv0);
      case OP_CONCAT:
        return this.mkConcat(args);
      case OP_EXTRACT:
        return this.mkExtract(parameters[0], parameters[1], args[0]);
      case OP_REPEAT:
        return parameters[0] === 1
          ? args[0]
          : rewrite(this.mkConcatTerm(Array.from({ length: parameters[0] }, () => args[0])), 1);
      case OP_ZERO_EXT:
        return this.mkZeroExtend(parameters[0], args[0]);
      case OP_SIGN_EXT:
        return this.mkSignExtend(parameters[0], args[0]);
      case OP_BOR:
        return this.mkBvOr(args);
      case OP_BXOR:
        return this.mkBvXor(args);
      case OP_BNOT:
        return this.mkBvNot(args[0]);
      case OP_BAND:
        return this.mkBvAnd(args);
      case OP_BNAND:
        return rewrite(
          this.app(
            OP_BOR,
            args.map((arg) => this.mkNotTerm(arg)),
          ),
          2,
        );
      case OP_BNOR:
        return rewrite(this.mkNotTerm(this.app(OP_BOR, args)), 2);
      case OP_BXNOR:
        return this.mkBvXnor(args);
      case OP_ROTATE_LEFT:
        return this.mkRotateLeft(parameters[0], args[0]);
      case OP_ROTATE_RIGHT:
        return this.mkRotateRight(parameters[0], args[0]);
      case OP_EXT_ROTATE_LEFT:
        return this.mkExtRotate(true, args[0], args[1]);
      case OP_EXT_ROTATE_RIGHT:
        return this.mkExtRotate(false, args[0], args[1]);
      case OP_UBV2INT:
        return this.mkUbv2int(args[0]);
      case OP_SBV2INT:
        return rewrite(this.mkSbv2intAsUbv2int(args[0]), 2);
      case OP_INT2BV:
        return this.mkInt2bv(parameters[0], args[0]);
      case OP_BREDOR:
        return this.isNumeral(args[0])
          ? this.getNumeral(args[0]) === 0n
            ? this.mkZero(1)
            : this.mkOne(1)
          : undefined;
      case OP_BREDAND:
        return this.isNumeral(args[0])
          ? this.isAllOnes(args[0])
            ? this.mkOne(1)
            : this.mkZero(1)
          : undefined;
      case OP_BCOMP:
        if (args[0] === args[1]) return this.mkOne(1);
        if (this.isNumeral(args[0]) && this.isNumeral(args[1])) return this.mkZero(1);
        return rewrite(
          this.mkIteTerm(manager.mkEq(args[0], args[1]), this.mkOne(1), this.mkZero(1)),
          2,
        );
      case OP_MKBV:
        return undefined;
      case OP_BIT2BOOL:
        return this.mkBit2boolIndex(args[0], parameters[0]);
      case OP_BSMUL_NO_OVFL:
        return this.mkBvsmulNoOverflow(args, true);
      case OP_BSMUL_NO_UDFL:
        return this.mkBvsmulNoOverflow(args, false);
      case OP_BUMUL_NO_OVFL:
        return this.mkBvumulNoOverflow(args);
      case OP_BSMUL_OVFL: {
        const noOverflow = manager.mkNot(this.app(OP_BSMUL_NO_OVFL, [args[0], args[1]]));
        const noUnderflow = manager.mkNot(this.app(OP_BSMUL_NO_UDFL, [args[0], args[1]]));
        return rewrite(this.mkOrTerm([noOverflow, noUnderflow]), 4);
      }
      case OP_BUMUL_OVFL:
        return rewrite(manager.mkNot(this.app(OP_BUMUL_NO_OVFL, [args[0], args[1]])), 2);
      case OP_BSDIV_OVFL: {
        const size = this.getSize(args[1]);
        const minSigned = this.mkBv(getPowerOfTwo(size - 1), size);
        const minusOne = this.mkAllOnes(size);
        const first = manager.mkEq(args[0], minSigned);
        return rewrite(this.mkAndTerm([first, manager.mkEq(args[1], minusOne)]), 4);
      }
      case OP_BUADD_OVFL: {
        const size = this.getSize(args[0]);
        const first = this.getExpr(this.mkZeroExtend(1, args[0]));
        const second = this.getExpr(this.mkZeroExtend(1, args[1]));
        const sum = this.mkBvAddExpr(first, second);
        const carry = this.mkExtractTerm(size, size, sum);
        return rewrite(manager.mkEq(carry, this.mkOne(1)), 4);
      }
      case OP_BSADD_OVFL:
        return rewrite(this.mkBvsaddOverUnderflow(args[0], args[1]), 4);
      case OP_BUSUB_OVFL:
        return this.mkUlt(args[0], args[1]);
      case OP_BSSUB_OVFL: {
        const size = this.getSize(args[0]);
        const minSigned = this.mkBv(getPowerOfTwo(size - 1), size);
        const overflow = this.mkBvsaddOverUnderflow(args[0], this.app(OP_BNEG, [args[1]]));
        const isNonNegative = this.app(OP_SLEQ, [this.mkZero(size), args[0]]);
        return rewrite(
          this.mkIteTerm(manager.mkEq(args[1], minSigned), isNonNegative, overflow),
          4,
        );
      }
      default:
        return undefined;
    }
  }

  private getExpr(result: number | Rewrite) {
    return typeof result === "number" ? result : result.expr;
  }

  // The expr_ref wrapper of mk_bv_add: the result of one rewrite, or the sum itself.
  private mkBvAddExpr(first: number, second: number) {
    const result = this.mkBvAdd([first, second]);
    return result === undefined ? this.app(OP_BADD, [first, second]) : this.getExpr(result);
  }

  private mkUlt(first: number, second: number) {
    return rewrite(this.manager.mkNot(this.app(OP_ULEQ, [second, first])), 2);
  }

  private mkSlt(first: number, second: number) {
    return rewrite(this.manager.mkNot(this.app(OP_SLEQ, [second, first])), 2);
  }

  // mk_bvsadd_over_underflow: the sum of two positives is not positive, or that of two negatives is
  // negative.
  private mkBvsaddOverUnderflow(first: number, second: number) {
    const zero = this.mkZero(this.getSize(first));
    const sum = this.mkBvAddExpr(first, second);
    const isFirstPositive = this.app(OP_SLT, [zero, first]);
    const isSecondPositive = this.app(OP_SLT, [zero, second]);
    const arePositive = this.mkAndTerm([isFirstPositive, isSecondPositive]);
    const overflow = this.mkAndTerm([arePositive, this.app(OP_SLEQ, [sum, zero])]);
    const isFirstNegative = this.app(OP_SLT, [first, zero]);
    const isSecondNegative = this.app(OP_SLT, [second, zero]);
    const areNegative = this.mkAndTerm([isFirstNegative, isSecondNegative]);
    const isSumNonNegative = this.mkLeqCore(true, zero, sum);
    const underflow = this.mkAndTerm([
      areNegative,
      isSumNonNegative === undefined
        ? this.app(OP_SLEQ, [zero, sum])
        : this.getExpr(isSumNonNegative),
    ]);
    return this.mkOrTerm([overflow, underflow]);
  }

  private isZeroExtended(expr: number) {
    if (!this.isBinary(expr, OP_CONCAT)) return undefined;
    return this.getNumeral(this.manager.getArg(expr, 0)) === 0n
      ? this.manager.getArg(expr, 1)
      : undefined;
  }

  private isSignExtended(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_SIGN_EXT) return manager.getArg(expr, 0);
    if (!this.isConcat(expr) || manager.getNumArgs(expr) < 2) return undefined;
    const numArgs = manager.getNumArgs(expr);
    const last = manager.getArg(expr, numArgs - 1);
    const size = this.getSize(last);
    for (let index = 0; index + 1 < numArgs; index++) {
      const sign = manager.getArg(expr, index);
      if (
        !this.isExtract(sign) ||
        this.getParameter(sign, 0) !== size - 1 ||
        this.getParameter(sign, 1) !== size - 1 ||
        manager.getArg(sign, 0) !== last
      )
        return undefined;
    }
    return last;
  }

  // mk_leq_core: an unsigned or signed comparison.
  private mkLeqCore(isSigned: boolean, first: number, second: number): Result {
    const manager = this.manager;
    if (first === second) return manager.trueExpr;
    const firstValue = this.getNumeral(first);
    const secondValue = this.getNumeral(second);
    const size = this.getSize(first);
    if (isSigned) {
      const firstInner = this.isZeroExtended(first);
      const secondInner = this.isZeroExtended(second);
      if (
        firstInner !== undefined &&
        secondInner !== undefined &&
        this.getSize(firstInner) === this.getSize(secondInner)
      )
        return rewrite(this.app(OP_ULEQ, [firstInner, secondInner]), 2);
    }
    const first1 = firstValue === undefined ? undefined : this.norm(firstValue, size, isSigned);
    const second1 = secondValue === undefined ? undefined : this.norm(secondValue, size, isSigned);
    if (first1 !== undefined && second1 !== undefined)
      return first1 <= second1 ? manager.trueExpr : manager.falseExpr;
    const lower = isSigned ? -getPowerOfTwo(size - 1) : 0n;
    const upper = isSigned ? getPowerOfTwo(size - 1) - 1n : getPowerOfTwo(size) - 1n;
    if (second1 !== undefined) {
      if (second1 === lower) return rewrite(manager.mkEq(first, second), 1);
      if (second1 === upper) return manager.trueExpr;
    }
    if (first1 !== undefined) {
      if (first1 === lower) return manager.trueExpr;
      if (first1 === upper) return rewrite(manager.mkEq(first, second), 1);
    }
    // (bvsle (+ x (* -1 (srem_i x c1))) c2) is (bvsle x (+ c1 c2 -1)) when c2 is a positive
    // multiple of the positive c1 and the sum does not overflow.
    if (isSigned && second1 !== undefined && this.isBinary(first, OP_BADD)) {
      const summand = manager.getArg(first, 0);
      const product = manager.getArg(first, 1);
      const coefficient = this.isBinary(product, OP_BMUL)
        ? this.getNumeral(manager.getArg(product, 0))
        : undefined;
      const remainder = this.isBinary(product, OP_BMUL) ? manager.getArg(product, 1) : -1;
      const divisor =
        coefficient !== undefined && this.isBinary(remainder, OP_BSREM_I)
          ? this.getNumeral(manager.getArg(remainder, 1))
          : undefined;
      const divisorSize = divisor === undefined ? size : this.getSize(manager.getArg(remainder, 1));
      if (
        coefficient !== undefined &&
        this.norm(coefficient, this.getSize(manager.getArg(product, 0)), true) === -1n &&
        divisor !== undefined
      ) {
        const signedDivisor = this.norm(divisor, divisorSize, true);
        if (
          signedDivisor > 0n &&
          second1 > 0n &&
          summand === manager.getArg(remainder, 0) &&
          second1 % signedDivisor === 0n &&
          signedDivisor + second1 - 1n < getPowerOfTwo(divisorSize - 1)
        )
          return rewrite(
            this.app(OP_SLEQ, [summand, this.mkBv(signedDivisor + second1 - 1n, divisorSize)]),
            2,
          );
      }
    }
    // (bvule c1 (+ c2 a)).
    if (!isSigned && first1 !== undefined && this.isBinary(second, OP_BADD)) {
      const offset = this.getNumeral(manager.getArg(second, 0));
      if (offset !== undefined) {
        const term = manager.getArg(second, 1);
        const offsetSize = this.getSize(manager.getArg(second, 0));
        const bound = this.app(OP_ULEQ, [term, this.mkBv(-offset - 1n, offsetSize)]);
        if (first1 > offset)
          return rewrite(
            this.mkAndTerm([
              bound,
              this.app(OP_ULEQ, [this.mkBv(first1 - offset, offsetSize), term]),
            ]),
            2,
          );
        if (first1 < offset)
          return rewrite(
            this.mkOrTerm([
              bound,
              this.app(OP_ULEQ, [this.mkBv(first1 - offset, offsetSize), term]),
            ]),
            2,
          );
        return rewrite(bound, 2);
      }
    }
    if (!isSigned) {
      const getLastNonZero = (expr: number) => {
        for (let index = size - 1; index >= 0; index--)
          if (!this.isZeroBit(expr, index)) return index;
        return -1;
      };
      const secondLast = getLastNonZero(second);
      if (secondLast === -1) return rewrite(manager.mkEq(first, this.mkZero(size)), 1);
      if (secondLast < size - 1) {
        const high = this.mkExtractTerm(size - 1, secondLast + 1, first);
        const zero = this.mkZero(size - secondLast - 1);
        const firstLow = this.mkExtractTerm(secondLast, 0, first);
        const secondLow = this.mkExtractTerm(secondLast, 0, second);
        const comparison = this.app(OP_ULEQ, [firstLow, secondLow]);
        return rewrite(this.mkAndTerm([manager.mkEq(high, zero), comparison]), 3);
      }
      const firstLast = getLastNonZero(first);
      if (firstLast === -1) return manager.trueExpr;
      if (firstLast < size - 1) {
        const high = this.mkExtractTerm(size - 1, firstLast + 1, second);
        const zero = this.mkZero(size - firstLast - 1);
        const isHighZero = manager.mkEq(high, zero);
        const firstLow = this.mkExtractTerm(firstLast, 0, first);
        const secondLow = this.mkExtractTerm(firstLast, 0, second);
        const comparison = this.app(OP_ULEQ, [firstLow, secondLow]);
        return rewrite(manager.mkApp(OP_IMPLIES, [isHighZero, comparison], SORT_BOOL), 4);
      }
    }
    return undefined;
  }

  private mkExtract(high: number, low: number, arg: number): Result {
    const manager = this.manager;
    const size = this.getSize(arg);
    if (low === 0 && high === size - 1) return arg;
    const value = this.getNumeral(arg);
    if (value !== undefined)
      return this.mkBv((value >> BigInt(low)) % getPowerOfTwo(high - low + 1), high - low + 1);
    if (this.isExtract(arg)) {
      const innerLow = this.getParameter(arg, 1);
      return this.mkExtractTerm(high + innerLow, low + innerLow, manager.getArg(arg, 0));
    }
    if (this.isConcat(arg)) {
      const numArgs = manager.getNumArgs(arg);
      let position = size;
      for (let index = 0; index < numArgs; index++) {
        const current = manager.getArg(arg, index);
        const currentSize = this.getSize(current);
        position -= currentSize;
        if (position > high) continue;
        if (position <= low) {
          if (low === position && high - position === currentSize - 1) return current;
          return rewrite(this.mkExtractTerm(high - position, low - position, current), 1);
        }
        const newArgs: number[] = [];
        let isExtracting = false;
        if (high - position === currentSize - 1) newArgs.push(current);
        else {
          isExtracting = true;
          newArgs.push(this.mkExtractTerm(high - position, 0, current));
        }
        for (let next = index + 1; next < numArgs; next++) {
          const nextArg = manager.getArg(arg, next);
          const nextSize = this.getSize(nextArg);
          position -= nextSize;
          if (position > low) {
            newArgs.push(nextArg);
            continue;
          }
          if (position === low) {
            newArgs.push(nextArg);
            const concat = this.mkConcatTerm(newArgs);
            return isExtracting ? rewrite(concat, 2) : concat;
          }
          newArgs.push(this.mkExtractTerm(nextSize - 1, low - position, nextArg));
          return rewrite(this.mkConcatTerm(newArgs), 2);
        }
      }
    }
    const op = manager.getOp(arg);
    if (low === 0 && manager.kinds[arg] === KIND_APP && manager.getNumArgs(arg) === 2) {
      const isUnsigned = op === OP_BUDIV_I || op === OP_BUREM_I;
      const isSignedDivision = op === OP_BSDIV_I || op === OP_BSREM_I;
      if (isUnsigned || isSignedDivision) {
        const dividend = manager.getArg(arg, 0);
        const divisor = manager.getArg(arg, 1);
        const innerDividend = isUnsigned
          ? this.isZeroExtended(dividend)
          : this.isSignExtended(dividend);
        const innerDivisor =
          innerDividend === undefined
            ? undefined
            : isUnsigned
              ? this.isZeroExtended(divisor)
              : this.isSignExtended(divisor);
        if (
          innerDividend !== undefined &&
          innerDivisor !== undefined &&
          high + 1 === this.getSize(innerDividend) &&
          this.getSize(innerDividend) === this.getSize(innerDivisor)
        )
          return rewrite(this.app(op, [innerDividend, innerDivisor]), 1);
      }
    }
    if (
      op === OP_BNOT ||
      op === OP_BOR ||
      op === OP_BXOR ||
      (low === 0 && (op === OP_BADD || op === OP_BMUL))
    ) {
      const newArgs = manager.mapArgs(arg, (innerArg) => this.mkExtractTerm(high, low, innerArg));
      return rewrite(this.app(op, newArgs), 2);
    }
    if (this.isIte(arg)) {
      const thenExpr = manager.getArg(arg, 1);
      const elseExpr = manager.getArg(arg, 2);
      if (
        manager.getRefCount(thenExpr) === 1 ||
        manager.getRefCount(elseExpr) === 1 ||
        !this.isIte(thenExpr) ||
        !this.isIte(elseExpr)
      ) {
        const thenExtract = this.mkExtractTerm(high, low, thenExpr);
        const elseExtract = this.mkExtractTerm(high, low, elseExpr);
        return rewrite(this.mkIteTerm(manager.getArg(arg, 0), thenExtract, elseExtract), 2);
      }
    }
    if (low === 0 && this.isBinary(arg, OP_BASHR)) {
      const shift = this.getNumeral(manager.getArg(arg, 1));
      if (shift !== undefined && BigInt(high) < BigInt(size) - shift) {
        const amount = Number(shift);
        return rewrite(this.mkExtractTerm(high + amount, low + amount, manager.getArg(arg, 0)), 1);
      }
    }
    return undefined;
  }

  private mkBvShl(first: number, second: number): Result {
    const manager = this.manager;
    const size = this.getSize(first);
    const shift = this.getNumeral(second);
    if (shift !== undefined) {
      if (shift === 0n) return first;
      if (shift >= BigInt(size)) return this.mkZero(size);
      const value = this.getNumeral(first);
      if (value !== undefined) return this.mkBv(value << shift, size);
      const amount = Number(shift);
      const kept = this.mkExtractTerm(size - amount - 1, 0, first);
      return rewrite(this.mkConcatTerm([kept, this.mkZero(amount)]), 2);
    }
    if (this.isBinary(first, OP_BSHL)) {
      const inner = manager.getArg(first, 0);
      const innerShift = manager.getArg(first, 1);
      const sum = this.app(OP_BADD, [innerShift, second]);
      const condition = this.app(OP_ULEQ, [innerShift, sum]);
      const shifted = this.app(OP_BSHL, [inner, sum]);
      return rewrite(this.mkIteTerm(condition, shifted, this.mkZero(size)), 3);
    }
    return undefined;
  }

  private mkBvLshr(first: number, second: number): Result {
    const size = this.getSize(first);
    const shift = this.getNumeral(second);
    if (shift !== undefined) {
      if (shift === 0n) return first;
      if (shift >= BigInt(size)) return this.mkZero(size);
      const value = this.getNumeral(first);
      if (value !== undefined) return this.mkBv(value >> shift, size);
      const amount = Number(shift);
      const zero = this.mkZero(amount);
      return rewrite(this.mkConcatTerm([zero, this.mkExtractTerm(size - 1, amount, first)]), 2);
    }
    if (first === second) return this.mkZero(size);
    return undefined;
  }

  private mkBvAshr(first: number, second: number): Result {
    const manager = this.manager;
    const size = this.getSize(first);
    const shift = this.getNumeral(second);
    if (shift === 0n) return first;
    const value = this.getNumeral(first);
    if (value !== undefined && shift !== undefined) {
      const isNegative = this.hasSignBit(value, size);
      if (shift >= BigInt(size)) return isNegative ? this.mkAllOnes(size) : this.mkZero(size);
      const shifted = value >> shift;
      const fill = isNegative ? getPowerOfTwo(size) - getPowerOfTwo(size - Number(shift)) : 0n;
      return this.mkBv(shifted | fill, size);
    }
    if (shift !== undefined && this.isBinary(first, OP_BASHR)) {
      const innerShift = this.getNumeral(manager.getArg(first, 1));
      if (innerShift !== undefined) {
        const total = innerShift + shift > BigInt(size) ? BigInt(size) : innerShift + shift;
        return rewrite(this.app(OP_BASHR, [manager.getArg(first, 0), this.mkBv(total, size)]), 1);
      }
    }
    if (shift !== undefined && this.getNumLeadingZeroBits(first) > 0) {
      if (shift >= BigInt(size)) return this.mkZero(size);
      const amount = Number(shift);
      const zero = this.mkZero(amount);
      return rewrite(this.mkConcatTerm([zero, this.mkExtractTerm(size - 1, amount, first)]), 2);
    }
    return undefined;
  }

  // The division of a term by a term that may be zero: by hi_div0, the division itself, and
  // otherwise an ite with the uninterpreted division by zero.
  private mkDivisionByTerm(
    first: number,
    second: number,
    isHiDiv0: boolean,
    divisionOp: number,
    byZeroOp: number,
  ): Result {
    if (isHiDiv0) return this.app(divisionOp, [first, second]);
    const isZero = this.manager.mkEq(second, this.mkZero(this.getSize(second)));
    const byZero = this.app(byZeroOp, [first]);
    return rewrite(this.mkIteTerm(isZero, byZero, this.app(divisionOp, [first, second])), 2);
  }

  private mkBvSdiv(first: number, second: number, isHiDiv0: boolean): Result {
    const divisor = this.getNumeral(second);
    if (divisor === undefined)
      return this.mkDivisionByTerm(first, second, isHiDiv0, OP_BSDIV_I, OP_BSDIV0);
    const size = this.getSize(second);
    const signedDivisor = this.norm(divisor, size, true);
    if (signedDivisor === 0n) {
      if (!isHiDiv0) return rewrite(this.app(OP_BSDIV0, [first]), 1);
      const isNegative = this.app(OP_SLT, [first, this.mkZero(size)]);
      const one = this.mkOne(size);
      return rewrite(this.mkIteTerm(isNegative, one, this.mkAllOnes(size)), 2);
    }
    if (signedDivisor === 1n) return first;
    const dividend = this.getNumeral(first);
    if (dividend !== undefined)
      return this.mkBv(this.norm(dividend, size, true) / signedDivisor, size);
    return this.app(OP_BSDIV_I, [first, second]);
  }

  private mkBvUdiv(first: number, second: number, isHiDiv0: boolean): Result {
    const divisor = this.getNumeral(second);
    if (divisor === undefined)
      return this.mkDivisionByTerm(first, second, isHiDiv0, OP_BUDIV_I, OP_BUDIV0);
    const size = this.getSize(second);
    if (divisor === 0n)
      return isHiDiv0 ? this.mkAllOnes(size) : rewrite(this.app(OP_BUDIV0, [first]), 1);
    if (divisor === 1n) return first;
    const dividend = this.getNumeral(first);
    if (dividend !== undefined) return this.mkBv(dividend / divisor, size);
    const shift = getPowerOfTwoExponent(divisor);
    if (shift !== -1)
      return rewrite(this.app(OP_BLSHR, [first, this.mkBv(BigInt(shift), size)]), 1);
    return this.app(OP_BUDIV_I, [first, second]);
  }

  private mkBvSrem(first: number, second: number, isHiDiv0: boolean): Result {
    const manager = this.manager;
    const divisor = this.getNumeral(second);
    if (divisor === undefined)
      return this.mkDivisionByTerm(first, second, isHiDiv0, OP_BSREM_I, OP_BSREM0);
    const size = this.getSize(second);
    const signedDivisor = this.norm(divisor, size, true);
    if (signedDivisor === 0n) return isHiDiv0 ? first : rewrite(this.app(OP_BSREM0, [first]), 1);
    if (signedDivisor === 1n || signedDivisor === -1n) return this.mkZero(size);
    if (this.isBinary(first, OP_BSREM_I)) {
      const innerDivisor = this.getNumeral(manager.getArg(first, 1));
      if (innerDivisor !== undefined) {
        const signedInner = this.norm(innerDivisor, this.getSize(manager.getArg(first, 1)), true);
        if (signedInner !== 0n && signedInner % signedDivisor === 0n)
          return rewrite(this.app(OP_BSREM_I, [manager.getArg(first, 0), second]), 1);
      }
    }
    const dividend = this.getNumeral(first);
    if (dividend !== undefined)
      return this.mkBv(this.norm(dividend, size, true) % signedDivisor, size);
    return this.app(OP_BSREM_I, [first, second]);
  }

  // is_x_minus_one: a sum of two arguments, one of them all ones.
  private getXMinusOne(expr: number) {
    const manager = this.manager;
    if (!this.isAdd(expr) || manager.getNumArgs(expr) !== 2) return undefined;
    if (this.isAllOnes(manager.getArg(expr, 0))) return manager.getArg(expr, 1);
    if (this.isAllOnes(manager.getArg(expr, 1))) return manager.getArg(expr, 0);
    return undefined;
  }

  private mkBvUrem(first: number, second: number, isHiDiv0: boolean): Result {
    const manager = this.manager;
    const dividend = this.getNumeral(first);
    const divisor = this.getNumeral(second);
    if (divisor !== undefined) {
      const size = this.getSize(second);
      if (divisor === 0n) return isHiDiv0 ? first : rewrite(this.app(OP_BUREM0, [first]), 1);
      if (divisor === 1n) return this.mkZero(size);
      if (dividend !== undefined) return this.mkBv(dividend % divisor, size);
      const shift = getPowerOfTwoExponent(divisor);
      if (shift !== -1) {
        const zero = this.mkZero(size - shift);
        return rewrite(this.mkConcatTerm([zero, this.mkExtractTerm(shift - 1, 0, first)]), 2);
      }
      return this.app(OP_BUREM_I, [first, second]);
    }
    const isMinusOne = this.getXMinusOne(first) === second;
    if (isHiDiv0) {
      if (dividend === 0n || isMinusOne) return first;
      return this.app(OP_BUREM_I, [first, second]);
    }
    // urem(0, x) is ite(x = 0, urem0(0), 0), and urem(x - 1, x) is ite(x = 0, urem0(-1), x - 1).
    if (dividend === 0n) {
      const isZero = manager.mkEq(second, first);
      return rewrite(this.mkIteTerm(isZero, this.app(OP_BUREM0, [first]), first), 2);
    }
    if (isMinusOne) {
      const size = this.getSize(first);
      const minusOne = this.mkAllOnes(size);
      const isZero = manager.mkEq(second, this.mkZero(size));
      return rewrite(this.mkIteTerm(isZero, this.app(OP_BUREM0, [minusOne]), first), 2);
    }
    return this.mkDivisionByTerm(first, second, false, OP_BUREM_I, OP_BUREM0);
  }

  private mkBvSmod(first: number, second: number, isHiDiv0: boolean): Result {
    const dividend = this.getNumeral(first);
    const size = this.getSize(first);
    const signedDividend = dividend === undefined ? undefined : this.norm(dividend, size, true);
    if (signedDividend === 0n) return rewrite(this.app(OP_BUREM, [first, second]), 1);
    const divisor = this.getNumeral(second);
    if (divisor !== undefined) {
      const signedDivisor = this.norm(divisor, size, true);
      if (signedDivisor === 0n) return isHiDiv0 ? first : this.app(OP_BSMOD0, [first]);
      if (signedDividend !== undefined) {
        const remainder = this.norm(
          this.norm(getAbs(signedDividend), size) % this.norm(getAbs(signedDivisor), size),
          size,
        );
        const result =
          remainder === 0n
            ? remainder
            : signedDividend > 0n && signedDivisor > 0n
              ? remainder
              : signedDividend < 0n && signedDivisor > 0n
                ? this.norm(signedDivisor - remainder, size)
                : signedDividend > 0n && signedDivisor < 0n
                  ? this.norm(remainder + signedDivisor, size)
                  : this.norm(-remainder, size);
        return this.mkBv(result, size);
      }
      if (signedDivisor === 1n) return rewrite(this.mkZero(size), 2);
    }
    return this.mkDivisionByTerm(first, second, isHiDiv0, OP_BSMOD_I, OP_BSMOD0);
  }

  private mkInt2bv(size: number, arg: number): Result {
    const manager = this.manager;
    if (manager.isNumeral(arg) && manager.getRationalValue(arg).isInt())
      return this.mkBv(manager.getRationalValue(arg).num, size);
    if (manager.getOp(arg) !== OP_UBV2INT) return undefined;
    const inner = manager.getArg(arg, 0);
    const innerSize = this.getSize(inner);
    if (size === innerSize) return inner;
    if (size > innerSize)
      return rewrite(this.getExpr(this.mkZeroExtend(size - innerSize, inner)), 1);
    return rewrite(this.mkExtractTerm(size - 1, 0, inner), 1);
  }

  // bv_util::mk_sbv2int_as_ubv2int: if e <_s 0 then ubv2int(e) - 2^n else ubv2int(e).
  private mkSbv2intAsUbv2int(arg: number) {
    const manager = this.manager;
    const unsigned = this.app(OP_UBV2INT, [arg]);
    const size = this.getSize(arg);
    const zero = this.mkZero(size);
    const isNegative = this.app(OP_SLT, [arg, zero]);
    const difference = manager.mkApp(
      OP_SUB,
      [unsigned, manager.mkNumeral(getPowerOfTwo(size))],
      SORT_INT,
    );
    return manager.mkApp(OP_ITE, [isNegative, difference, unsigned], SORT_INT);
  }

  private mkIntApp(op: number, args: number[]) {
    return args.length === 1 ? args[0] : this.manager.mkApp(op, args, SORT_INT);
  }

  private mkUbv2int(arg: number): Result {
    const manager = this.manager;
    const value = this.getNumeral(arg);
    if (value !== undefined) return manager.mkNumeral(value);
    if (this.isConcat(arg)) {
      const numArgs = manager.getNumArgs(arg);
      const args = manager.mapArgs(arg, (innerArg) => this.app(OP_UBV2INT, [innerArg]));
      let size = this.getSize(manager.getArg(arg, numArgs - 1));
      for (let index = numArgs - 1; index > 0;) {
        index--;
        const factor = manager.mkNumeral(getPowerOfTwo(size));
        args[index] = manager.mkApp(OP_MUL, [factor, args[index]], SORT_INT);
        size += this.getSize(manager.getArg(arg, index));
      }
      return rewrite(this.mkIntApp(OP_ADD, args), 2);
    }
    if (this.isMulNoOverflow(arg))
      return rewrite(
        this.mkIntApp(
          OP_MUL,
          manager.mapArgs(arg, (innerArg) => this.app(OP_UBV2INT, [innerArg])),
        ),
        2,
      );
    if (this.isAddNoOverflow(arg))
      return rewrite(
        this.mkIntApp(
          OP_ADD,
          manager.mapArgs(arg, (innerArg) => this.app(OP_UBV2INT, [innerArg])),
        ),
        2,
      );
    return undefined;
  }

  private isMulNoOverflow(expr: number) {
    const manager = this.manager;
    if (!this.isMul(expr)) return false;
    const size = this.getSize(expr);
    let sum = 0;
    for (let index = 0; index < manager.getNumArgs(expr); index++)
      sum += size - this.getNumLeadingZeroBits(manager.getArg(expr, index));
    if (sum > size + 1) return false;
    if (sum <= size) return true;
    return manager.someArg(expr, (arg) => {
      const value = this.getNumeral(arg);
      return value !== undefined && getPowerOfTwoExponent(value) !== -1;
    });
  }

  private isAddNoOverflow(expr: number) {
    const manager = this.manager;
    if (!this.isAdd(expr)) return false;
    const numArgs = manager.getNumArgs(expr);
    if (numArgs <= 1) return true;
    return !manager.someArg(expr, (arg) => numArgs - 2 >= this.getNumLeadingZeroBits(arg));
  }

  private getNumLeadingZeroBits(expr: number): number {
    const manager = this.manager;
    const value = this.getNumeral(expr);
    const size = this.getSize(expr);
    if (value !== undefined) return value === 0n ? size : size - value.toString(2).length;
    if (this.isConcat(expr)) {
      const head = manager.getArg(expr, 0);
      const headZeros = this.getNumLeadingZeroBits(head);
      return headZeros === this.getSize(head)
        ? headZeros + this.getNumLeadingZeroBits(manager.getArg(expr, 1))
        : headZeros;
    }
    return 0;
  }

  private mkConcat(args: number[]): Result {
    const manager = this.manager;
    const newArgs: number[] = [];
    let isFusedNumeral = false;
    let isExpanded = false;
    let isFusedExtract = false;
    let areEqual = true;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      const previous = index > 0 ? newArgs[newArgs.length - 1] : -1;
      if (index > 0) areEqual &&= previous === arg;
      const value = this.getNumeral(arg);
      const previousValue = previous === -1 ? undefined : this.getNumeral(previous);
      if (value !== undefined && previousValue !== undefined) {
        const argSize = this.getSize(arg);
        newArgs.pop();
        newArgs.push(
          this.mkBv(
            previousValue * getPowerOfTwo(argSize) + value,
            argSize + this.getSize(previous),
          ),
        );
        isFusedNumeral = true;
      } else if (this.isConcat(arg)) {
        manager.pushArgs(arg, newArgs);
        isExpanded = true;
      } else if (
        this.isExtract(arg) &&
        previous !== -1 &&
        this.isExtract(previous) &&
        manager.getArg(arg, 0) === manager.getArg(previous, 0) &&
        this.getParameter(previous, 1) === this.getParameter(arg, 0) + 1
      ) {
        const fused = this.mkExtractTerm(
          this.getParameter(previous, 0),
          this.getParameter(arg, 1),
          manager.getArg(arg, 0),
        );
        newArgs.pop();
        newArgs.push(fused);
        isFusedExtract = true;
      } else newArgs.push(arg);
    }
    if (!isFusedNumeral && !isExpanded && !isFusedExtract) {
      const last = newArgs[newArgs.length - 1];
      if (areEqual && this.isIte(last)) {
        const thenArgs = newArgs.map(() => manager.getArg(last, 1));
        const elseArgs = newArgs.map(() => manager.getArg(last, 2));
        const thenConcat = this.mkConcatTerm(thenArgs);
        const elseConcat = this.mkConcatTerm(elseArgs);
        return rewrite(this.mkIteTerm(manager.getArg(last, 0), thenConcat, elseConcat), 2);
      }
      return undefined;
    }
    if (newArgs.length === 1) return isFusedExtract ? rewrite(newArgs[0], 1) : newArgs[0];
    const result = this.mkConcatTerm(newArgs);
    return isFusedExtract ? rewrite(result, 2) : isExpanded ? rewrite(result, 1) : result;
  }

  private factorZeroExtensions(op: number, args: number[]) {
    if (args.length < 2) return undefined;
    const first = this.isZeroExtended(args[0]);
    if (first === undefined) return undefined;
    const innerSize = this.getSize(first);
    const innerArgs = [first];
    for (let index = 1; index < args.length; index++) {
      const inner = this.isZeroExtended(args[index]);
      if (inner === undefined || this.getSize(inner) !== innerSize) return undefined;
      innerArgs.push(inner);
    }
    const inner = this.app(op, innerArgs);
    return this.app(OP_ZERO_EXT, [inner], [this.getSize(args[0]) - innerSize]);
  }

  private mkZeroExtend(amount: number, arg: number): number | Rewrite {
    if (amount === 0) return arg;
    return rewrite(this.mkConcatTerm([this.mkZero(amount), arg]), 1);
  }

  private mkSignExtend(amount: number, arg: number): Result {
    if (amount === 0) return arg;
    const value = this.getNumeral(arg);
    const size = this.getSize(arg);
    if (value !== undefined) return this.mkBv(this.norm(value, size, true), size + amount);
    const sign = this.mkExtractTerm(size - 1, size - 1, arg);
    const args = Array.from({ length: amount }, () => sign);
    args.push(arg);
    return rewrite(this.mkConcatTerm(args), 2);
  }

  private isSorted(args: number[]) {
    for (let index = 1; index < args.length; index++)
      if (isAstLess(this.manager, args[index], args[index - 1])) return false;
    return true;
  }

  private sortByAst(args: number[]) {
    args.sort((first, second) =>
      isAstLess(this.manager, first, second) ? -1 : isAstLess(this.manager, second, first) ? 1 : 0,
    );
  }

  private flattenAc(op: number, args: number[]) {
    if (!args.some((arg) => this.manager.getOp(arg) === op)) return args;
    const flat: number[] = [];
    for (const arg of args)
      if (this.manager.getOp(arg) === op) this.manager.pushArgs(arg, flat);
      else flat.push(arg);
    return flat;
  }

  private mkBvOr(inputArgs: number[]): Result {
    const manager = this.manager;
    if (inputArgs.length === 1) return inputArgs[0];
    const factored = this.factorZeroExtensions(OP_BOR, inputArgs);
    if (factored !== undefined) return rewrite(factored, 2);
    const size = this.getSize(inputArgs[0]);
    const args = this.flattenAc(OP_BOR, inputArgs);
    const isFlattened = args.length !== inputArgs.length;
    const newArgs: number[] = [];
    const positive = new Set<number>();
    const negative = new Set<number>();
    let isMerged = false;
    let numCoeffs = 0;
    let constant = 0n;
    const allOnes = getPowerOfTwo(size) - 1n;
    for (const arg of args) {
      const value = this.getNumeral(arg);
      if (value !== undefined) {
        numCoeffs++;
        constant |= value;
        continue;
      }
      if (manager.getOp(arg) === OP_BNOT) {
        const atom = manager.getArg(arg, 0);
        if (positive.has(atom)) return this.mkBv(allOnes, size);
        if (negative.has(atom)) {
          isMerged = true;
          continue;
        }
        negative.add(atom);
        newArgs.push(arg);
      } else {
        if (positive.has(arg)) {
          isMerged = true;
          continue;
        }
        if (negative.has(arg)) return this.mkBv(allOnes, size);
        positive.add(arg);
        newArgs.push(arg);
      }
    }
    if (constant === allOnes) return this.mkBv(constant, size);
    // (bvor (concat x #x00) (concat #x00 y)) is (concat x y).
    if (
      newArgs.length === 2 &&
      numCoeffs === 0 &&
      this.isConcat(newArgs[0]) &&
      this.isConcat(newArgs[1])
    ) {
      const [first, second] = newArgs;
      let index = 0;
      while (index < size && (this.isZeroBit(first, index) || this.isZeroBit(second, index)))
        index++;
      if (index === size) {
        const parts: number[] = [];
        let position = size - 1;
        while (position >= 0) {
          let high = position;
          while (position >= 0 && this.isZeroBit(first, position)) position--;
          if (position !== high) parts.push(this.mkExtractTerm(high, position + 1, second));
          high = position;
          while (position >= 0 && this.isZeroBit(second, position)) position--;
          if (position !== high) parts.push(this.mkExtractTerm(high, position + 1, first));
        }
        return rewrite(this.mkConcatTerm(parts), 2);
      }
    }
    if (constant !== 0n && newArgs.length === 1) {
      const term = newArgs[0];
      let mask = constant;
      const parts: number[] = [];
      let low = 0;
      let index = 0;
      while (index < size) {
        while (index < size && mask % 2n === 1n) {
          index++;
          mask /= 2n;
        }
        if (index !== low) {
          parts.push(this.mkBv(getPowerOfTwo(index - low) - 1n, index - low));
          low = index;
        }
        while (index < size && mask % 2n === 0n) {
          index++;
          mask /= 2n;
        }
        if (index !== low) {
          parts.push(this.mkExtractTerm(index - 1, low, term));
          low = index;
        }
      }
      parts.reverse();
      return rewrite(this.mkConcatTerm(parts), 2);
    }
    if (
      !isFlattened &&
      !isMerged &&
      (numCoeffs === 0 || (numCoeffs === 1 && constant !== 0n)) &&
      this.isSorted(args)
    )
      return undefined;
    if (constant !== 0n) newArgs.push(this.mkBv(constant, size));
    if (newArgs.length === 0) return this.mkZero(size);
    if (newArgs.length === 1) return newArgs[0];
    this.sortByAst(newArgs);
    const distributed = this.distributeConcat(OP_BOR, newArgs);
    if (distributed !== undefined) return rewrite(distributed, 3);
    return this.app(OP_BOR, newArgs);
  }

  private mkBvXor(inputArgs: number[]): Result {
    const manager = this.manager;
    if (inputArgs.length === 1) return inputArgs[0];
    const size = this.getSize(inputArgs[0]);
    const args = this.flattenAc(OP_BXOR, inputArgs);
    const isFlattened = args.length !== inputArgs.length;
    const positive = new Set<number>();
    const negative = new Set<number>();
    let isMerged = false;
    let numCoeffs = 0;
    let constant = 0n;
    const allOnes = getPowerOfTwo(size) - 1n;
    for (const arg of args) {
      const value = this.getNumeral(arg);
      if (value !== undefined) {
        constant ^= value;
        numCoeffs++;
        continue;
      }
      const isNot = manager.getOp(arg) === OP_BNOT;
      const atom = isNot ? manager.getArg(arg, 0) : arg;
      const same = isNot ? negative : positive;
      const other = isNot ? positive : negative;
      if (same.has(atom)) {
        same.delete(atom);
        isMerged = true;
      } else if (other.has(atom)) {
        other.delete(atom);
        isMerged = true;
        constant ^= allOnes;
      } else same.add(atom);
    }
    // (bvxor a 0011) is (concat ((_ extract 3 2) a) ((_ extract 1 0) (bvnot a))).
    if (constant !== 0n && numCoeffs === args.length - 1) {
      let term = -1;
      for (const arg of args) {
        term = arg;
        if (!this.isNumeral(arg)) break;
      }
      let mask = constant;
      const parts: number[] = [];
      const notTerm = this.mkNotTerm(term);
      let low = 0;
      let index = 0;
      while (index < size) {
        while (index < size && mask % 2n === 1n) {
          index++;
          mask /= 2n;
        }
        if (index !== low) {
          parts.push(this.mkExtractTerm(index - 1, low, notTerm));
          low = index;
        }
        while (index < size && mask % 2n === 0n) {
          index++;
          mask /= 2n;
        }
        if (index !== low) {
          parts.push(this.mkExtractTerm(index - 1, low, term));
          low = index;
        }
      }
      parts.reverse();
      return rewrite(parts.length === 1 ? parts[0] : this.mkConcatTerm(parts), 3);
    }
    if (
      !isMerged &&
      !isFlattened &&
      (numCoeffs === 0 || (numCoeffs === 1 && constant !== 0n && constant !== allOnes)) &&
      this.isSorted(args)
    ) {
      const distributed = this.distributeConcat(OP_BXOR, args);
      return distributed === undefined ? undefined : rewrite(distributed, 3);
    }
    const newArgs: number[] = constant === 0n ? [] : [this.mkBv(constant, size)];
    for (const arg of args) {
      if (this.isNumeral(arg)) continue;
      if (manager.getOp(arg) === OP_BNOT) {
        const atom = manager.getArg(arg, 0);
        if (negative.has(atom)) {
          newArgs.push(arg);
          negative.delete(atom);
        }
      } else if (positive.has(arg)) {
        newArgs.push(arg);
        positive.delete(arg);
      }
    }
    if (newArgs.length === 0) return this.mkZero(size);
    if (newArgs.length === 1) return newArgs[0];
    if (newArgs.length === 2 && this.isAllOnes(newArgs[0])) return this.mkNotTerm(newArgs[1]);
    this.sortByAst(newArgs);
    const distributed = this.distributeConcat(OP_BXOR, newArgs);
    if (distributed !== undefined) return rewrite(distributed, 3);
    return this.app(OP_BXOR, newArgs);
  }

  private distributeConcat(op: number, args: number[]) {
    const manager = this.manager;
    for (const arg of args) {
      if (!this.isConcat(arg)) continue;
      const headSize = this.getSize(manager.getArg(arg, 0));
      const size = this.getSize(arg);
      if (headSize === size) return this.app(op, args);
      const highArgs: number[] = [];
      const lowArgs: number[] = [];
      for (const innerArg of args) {
        highArgs.push(this.mkExtractTerm(size - 1, size - headSize, innerArg));
        lowArgs.push(this.mkExtractTerm(size - headSize - 1, 0, innerArg));
      }
      const high = this.app(op, highArgs);
      return this.mkConcatTerm([high, this.app(op, lowArgs)]);
    }
    return undefined;
  }

  private mkBvNot(arg: number): Result {
    const manager = this.manager;
    if (manager.getOp(arg) === OP_BNOT) return manager.getArg(arg, 0);
    const value = this.getNumeral(arg);
    const size = this.getSize(arg);
    if (value !== undefined) return this.mkBv(getPowerOfTwo(size) - 1n - value, size);
    if (this.isConcat(arg))
      return rewrite(
        this.mkConcatTerm(manager.mapArgs(arg, (innerArg) => this.mkNotTerm(innerArg))),
        2,
      );
    if (this.isIte(arg)) {
      const thenValue = this.getNumeral(manager.getArg(arg, 1));
      if (thenValue !== undefined) {
        const thenNot = this.mkBv(getPowerOfTwo(size) - 1n - thenValue, size);
        const elseNot = this.mkNotTerm(manager.getArg(arg, 2));
        return rewrite(this.mkIteTerm(manager.getArg(arg, 0), thenNot, elseNot), 2);
      }
      const elseValue = this.getNumeral(manager.getArg(arg, 2));
      if (elseValue !== undefined) {
        const thenNot = this.mkNotTerm(manager.getArg(arg, 1));
        const elseNot = this.mkBv(getPowerOfTwo(size) - 1n - elseValue, size);
        return rewrite(this.mkIteTerm(manager.getArg(arg, 0), thenNot, elseNot), 2);
      }
    }
    return undefined;
  }

  private mkBvAnd(args: number[]): Result {
    const factored = this.factorZeroExtensions(OP_BAND, args);
    if (factored !== undefined) return rewrite(factored, 2);
    const negations = args.map((arg) => this.mkNotTerm(arg));
    return rewrite(this.mkNotTerm(this.app(OP_BOR, negations)), 3);
  }

  private mkBvXnor(args: number[]): Result {
    const manager = this.manager;
    if (args.length === 0) return rewrite(manager.trueExpr, 2);
    if (args.length === 1) return rewrite(this.mkNotTerm(args[0]), 2);
    let result = this.mkNotTerm(this.app(OP_BXOR, [args[0], args[1]]));
    if (args.length === 2) return rewrite(result, 2);
    for (let index = 2; index < args.length; index++)
      result = this.mkNotTerm(this.app(OP_BXOR, [result, args[index]]));
    return rewrite(result, 4);
  }

  private mkRotateLeft(amount: number, arg: number): Result {
    const size = this.getSize(arg);
    const shift = amount % size;
    if (shift === 0 || size === 1) return arg;
    const low = this.mkExtractTerm(size - shift - 1, 0, arg);
    return rewrite(this.mkConcatTerm([low, this.mkExtractTerm(size - 1, size - shift, arg)]), 2);
  }

  private mkRotateRight(amount: number, arg: number) {
    const size = this.getSize(arg);
    return this.mkRotateLeft(size - (amount % size), arg);
  }

  private mkExtRotate(isLeft: boolean, first: number, second: number): Result {
    const manager = this.manager;
    const amount = this.getNumeral(second);
    if (amount !== undefined) {
      const size = BigInt(this.getSize(first));
      const shift = Number(amount % size);
      return isLeft ? this.mkRotateLeft(shift, first) : this.mkRotateRight(shift, first);
    }
    const op = isLeft ? OP_EXT_ROTATE_LEFT : OP_EXT_ROTATE_RIGHT;
    const opposite = isLeft ? OP_EXT_ROTATE_RIGHT : OP_EXT_ROTATE_LEFT;
    if (this.isBinary(first, opposite) && manager.getArg(first, 1) === second)
      return manager.getArg(first, 0);
    if (this.isBinary(first, op)) {
      const total = this.app(OP_BADD, [manager.getArg(first, 1), second]);
      return rewrite(this.app(op, [manager.getArg(first, 0), total]), 2);
    }
    if (this.isBinary(first, opposite)) {
      const difference = this.app(OP_BSUB, [second, manager.getArg(first, 1)]);
      return rewrite(this.app(op, [manager.getArg(first, 0), difference]), 2);
    }
    return undefined;
  }

  private mkBvAdd(args: number[]): Result {
    const result = this.mkAdd(args);
    if (result !== undefined && typeof result !== "number") return result;
    const sumArgs =
      result === undefined ? args : this.isAdd(result) ? this.manager.getArgs(result) : undefined;
    if (sumArgs === undefined || sumArgs.length < 2) return result;
    const size = this.getSize(sumArgs[0]);
    for (let index = 0; index < size; index++) {
      let isNonZero = false;
      for (const arg of sumArgs) {
        if (this.isZeroBit(arg, index)) continue;
        if (isNonZero) return result;
        isNonZero = true;
      }
    }
    return rewrite(this.app(OP_BOR, sumArgs), 1);
  }

  private isZeroBit(inputExpr: number, inputIndex: number) {
    const manager = this.manager;
    let expr = inputExpr;
    let index = inputIndex;
    for (;;) {
      const value = this.getNumeral(expr);
      if (value !== undefined) return ((value >> BigInt(index)) & 1n) === 0n;
      if (!this.isConcat(expr)) return false;
      let position = manager.getNumArgs(expr);
      for (;;) {
        position--;
        const arg = manager.getArg(expr, position);
        const size = this.getSize(arg);
        if (size <= index) index -= size;
        else {
          expr = arg;
          break;
        }
      }
    }
  }

  // mk_mul_hoist: (* (bvshl z u) x) is (bvshl (* z x) u).
  private mkMulHoist(args: number[]): Result {
    if (args.length <= 1) return undefined;
    for (let index = 0; index < args.length; index++) {
      if (!this.isBinary(args[index], OP_BSHL)) continue;
      const newArgs = [...args];
      newArgs[index] = this.manager.getArg(args[index], 0);
      const product = this.app(OP_BMUL, newArgs);
      return rewrite(this.app(OP_BSHL, [product, this.manager.getArg(args[index], 1)]), 2);
    }
    return undefined;
  }

  private mkBvMul(args: number[]): Result {
    const manager = this.manager;
    const result = this.mkMul(args);
    if (result !== undefined && typeof result !== "number") return result;
    const hoisted =
      result === undefined
        ? this.mkMulHoist(args)
        : this.isMul(result)
          ? this.mkMulHoist(manager.getArgs(result))
          : undefined;
    if (hoisted !== undefined) return hoisted;
    // mul2concat: a product with a power of two is a concatenation with zeros.
    const product =
      result === undefined
        ? args.length === 2
          ? args
          : undefined
        : this.isMul(result) && manager.getNumArgs(result) === 2
          ? manager.getArgs(result)
          : undefined;
    if (!this.bvOptions.isMul2concat || product === undefined) return result;
    const value = this.getNumeral(product[0]);
    const shift = value === undefined ? -1 : getPowerOfTwoExponent(value);
    if (shift === -1) return result;
    const size = this.getSize(product[0]);
    const kept = this.mkExtractTerm(size - shift - 1, 0, product[1]);
    return rewrite(this.mkConcatTerm([kept, this.mkZero(shift)]), 2);
  }

  private mkBit2boolIndex(arg: number, index: number): Result {
    const manager = this.manager;
    if (manager.getOp(arg) === OP_MKBV) return manager.getArg(arg, index);
    const value = this.getNumeral(arg);
    if (value === undefined || index < 0 || index >= this.getSize(arg)) return undefined;
    return ((value >> BigInt(index)) & 1n) === 1n ? manager.trueExpr : manager.falseExpr;
  }

  // mk_bit2bool of an equality of bit-vectors of one bit.
  private mkBit2boolEq(inputLeft: number, inputRight: number): Result {
    const manager = this.manager;
    if (this.getSize(inputLeft) !== 1) return undefined;
    const isSwapped = this.isNumeral(inputLeft);
    const left = isSwapped ? inputRight : inputLeft;
    const right = isSwapped ? inputLeft : inputRight;
    const value = this.getNumeral(right);
    if (value === undefined) return undefined;
    if (this.isNumeral(left)) return left === right ? manager.trueExpr : manager.falseExpr;
    if (this.isIte(left)) {
      const thenEq = this.boolRewrites.mkEq(manager.getArg(left, 1), right);
      const elseEq = this.boolRewrites.mkEq(manager.getArg(left, 2), right);
      return rewrite(this.boolRewrites.mkIte(manager.getArg(left, 0), thenEq, elseEq), 2);
    }
    if (manager.getOp(left) === OP_BNOT)
      return rewrite(manager.mkEq(manager.getArg(left, 0), this.mkBv(1n - value, 1)), 1);
    const isOne = value === 1n;
    const op = manager.getOp(left);
    if (op === OP_BOR || op === OP_BXOR) {
      const one = isOne ? right : this.mkOne(1);
      const eqs = manager.mapArgs(left, (arg) => manager.mkEq(arg, one));
      const junction = op === OP_BOR ? this.mkOrTerm(eqs) : manager.mkApp(OP_XOR, eqs, SORT_BOOL);
      return isOne ? rewrite(junction, 2) : rewrite(manager.mkNot(junction), 3);
    }
    return undefined;
  }

  // mk_eq_concat: an equality of concatenations splits into equalities of extracts.
  private mkEqConcat(left: number, right: number): Rewrite {
    const manager = this.manager;
    const leftArgs = this.isConcat(left) ? manager.getArgs(left) : [left];
    const rightArgs = this.isConcat(right) ? manager.getArgs(right) : [right];
    const eqs: number[] = [];
    let leftLow = 0;
    let rightLow = 0;
    let leftIndex = leftArgs.length;
    let rightIndex = rightArgs.length;
    while (leftIndex > 0 && rightIndex > 0) {
      const leftArg = leftArgs[leftIndex - 1];
      const rightArg = rightArgs[rightIndex - 1];
      const leftSize = this.getSize(leftArg);
      const rightSize = this.getSize(rightArg);
      const leftRest = leftSize - leftLow;
      const rightRest = rightSize - rightLow;
      if (leftRest === rightRest) {
        const leftExtract = this.mkExtractTerm(leftSize - 1, leftLow, leftArg);
        eqs.push(manager.mkEq(leftExtract, this.mkExtractTerm(rightSize - 1, rightLow, rightArg)));
        leftLow = 0;
        rightLow = 0;
        leftIndex--;
        rightIndex--;
      } else if (leftRest < rightRest) {
        const leftExtract = this.mkExtractTerm(leftSize - 1, leftLow, leftArg);
        eqs.push(
          manager.mkEq(
            leftExtract,
            this.mkExtractTerm(leftRest + rightLow - 1, rightLow, rightArg),
          ),
        );
        leftLow = 0;
        rightLow += leftRest;
        leftIndex--;
      } else {
        const leftExtract = this.mkExtractTerm(rightRest + leftLow - 1, leftLow, leftArg);
        eqs.push(manager.mkEq(leftExtract, this.mkExtractTerm(rightSize - 1, rightLow, rightArg)));
        leftLow += rightRest;
        rightLow = 0;
        rightIndex--;
      }
    }
    return rewrite(eqs.length === 1 ? eqs[0] : this.mkAndTerm(eqs), 3);
  }

  private isConcatSplitTarget(expr: number) {
    const op = this.manager.getOp(expr);
    return (
      (this.bvOptions.isSplitConcatEq && this.manager.kinds[expr] !== KIND_VAR) ||
      op === OP_CONCAT ||
      this.isNumeral(expr) ||
      op === OP_BOR
    );
  }

  private isConcatTarget(left: number, right: number) {
    return (
      (this.isConcat(left) && this.isConcatSplitTarget(right)) ||
      (this.isConcat(right) && this.isConcatSplitTarget(left))
    );
  }

  private isAddMulConst(expr: number) {
    const manager = this.manager;
    return (
      manager.getOp(expr) === OP_BADD &&
      !manager.someArg(
        expr,
        (arg) =>
          !this.isNumeral(arg) &&
          !(this.isBinary(arg, OP_BMUL) && this.isNumeral(manager.getArg(arg, 0))),
      )
    );
  }

  // mk_mul_eq: c * x = a is x = c^-1 * a for an odd c.
  private mkMulEq(left: number, right: number): Result {
    const manager = this.manager;
    if (this.isBinary(left, OP_BMUL)) {
      const coefficient = this.getNumeral(manager.getArg(left, 0));
      const size = this.getSize(left);
      const inverse = coefficient === undefined ? undefined : getMultInverse(coefficient, size);
      if (inverse !== undefined) {
        const term = manager.getArg(left, 1);
        const rightValue = this.getNumeral(right);
        if (rightValue !== undefined)
          return rewrite(manager.mkEq(term, this.mkBv(inverse * rightValue, size)), 1);
        if (this.isBinary(right, OP_BMUL)) {
          const rightCoefficient = this.getNumeral(manager.getArg(right, 0));
          if (rightCoefficient !== undefined) {
            const rightTerm = manager.getArg(right, 1);
            if (this.norm(inverse * rightCoefficient, size) === 1n)
              return rewrite(manager.mkEq(term, rightTerm), 1);
            const factor = this.mkBv(inverse * rightCoefficient, size);
            return rewrite(manager.mkEq(term, this.app(OP_BMUL, [factor, rightTerm])), 1);
          }
        }
        if (this.isAddMulConst(right)) {
          const factor = this.mkBv(inverse, size);
          return rewrite(manager.mkEq(term, this.app(OP_BMUL, [factor, right])), 2);
        }
      }
    }
    const leftValue = this.getNumeral(left);
    if (leftValue !== undefined && this.isAddMulConst(right)) {
      const size = this.getSize(left);
      for (let index = 0; index < manager.getNumArgs(right); index++) {
        const arg = manager.getArg(right, index);
        if (!this.isBinary(arg, OP_BMUL)) continue;
        const coefficient = this.getNumeral(manager.getArg(arg, 0));
        const inverse = coefficient === undefined ? undefined : getMultInverse(coefficient, size);
        if (inverse === undefined) continue;
        const value = this.mkBv(inverse * leftValue, size);
        const product = this.app(OP_BMUL, [this.mkBv(inverse, size), right]);
        return rewrite(manager.mkEq(value, product), 3);
      }
    }
    return undefined;
  }

  mkEqCore(inputLeft: number, inputRight: number): Result {
    const manager = this.manager;
    if (inputLeft === inputRight) return manager.trueExpr;
    if (this.isNumeral(inputLeft) && this.isNumeral(inputRight)) return manager.falseExpr;
    const isSwapped = this.isNumeral(inputLeft);
    let left = isSwapped ? inputRight : inputLeft;
    let right = isSwapped ? inputLeft : inputRight;
    const bit2bool = this.mkBit2boolEq(left, right);
    if (bit2bool !== undefined) return bit2bool;
    const mulEq = this.mkMulEq(left, right) ?? this.mkMulEq(right, left);
    if (mulEq !== undefined) return mulEq;
    const leftOp = manager.getOp(left);
    if ((leftOp === OP_BUREM || leftOp === OP_BUREM_I) && manager.getNumArgs(left) === 2) {
      const rightValue = this.getNumeral(right);
      const divisor = manager.getArg(left, 1);
      const divisorValue = this.getNumeral(divisor);
      if (rightValue !== undefined && divisorValue !== undefined) {
        if (divisorValue !== 0n && rightValue >= divisorValue) return manager.falseExpr;
        if (divisorValue + rightValue >= getPowerOfTwo(this.getSize(divisor)))
          return rewrite(manager.mkEq(manager.getArg(left, 0), right), 2);
      }
    }
    const isPolynomial = (expr: number) => this.isAdd(expr) || this.isMul(expr);
    if (isPolynomial(left) || isPolynomial(right)) {
      const cancelled = this.cancelMonomials(left, right, false);
      if (cancelled !== undefined) {
        if (this.isNumeral(cancelled.lhs) && this.isNumeral(cancelled.rhs))
          return cancelled.lhs === cancelled.rhs ? manager.trueExpr : manager.falseExpr;
        left = cancelled.lhs;
        right = cancelled.rhs;
      }
      const isolated = this.isolateTerm(left, right);
      if (isolated !== undefined) return rewrite(isolated, 2);
      if (this.isConcatTarget(left, right)) return this.mkEqConcat(left, right);
      if (cancelled !== undefined) return manager.mkEq(left, right);
    }
    if (this.isConcatTarget(left, right)) return this.mkEqConcat(left, right);
    if (isSwapped) return manager.mkEq(left, right);
    return undefined;
  }

  // isolate_term: t1 + t2 = c is t1 = c - t2, which is cheaper to bit-blast.
  private isolateTerm(inputLeft: number, inputRight: number) {
    const manager = this.manager;
    const isOrdered = this.isNumeral(inputLeft) && this.isAdd(inputRight);
    const left = isOrdered ? inputLeft : inputRight;
    const right = isOrdered ? inputRight : inputLeft;
    if (!this.isNumeral(left) || !this.isAdd(right)) return undefined;
    const numArgs = manager.getNumArgs(right);
    const first = manager.getArg(right, 0);
    const rest =
      numArgs > 2 ? this.app(OP_BADD, manager.getArgs(right).slice(1)) : manager.getArg(right, 1);
    const isMinusOneTimes =
      this.isBinary(first, OP_BMUL) && this.isAllOnes(manager.getArg(first, 0));
    return isMinusOneTimes
      ? manager.mkEq(rest, this.app(OP_BSUB, [left, first]))
      : manager.mkEq(first, this.app(OP_BSUB, [left, rest]));
  }

  mkEqBv2int(inputLeft: number, inputRight: number): Result {
    const manager = this.manager;
    const isSwapped = manager.isNumeral(inputLeft);
    const left = isSwapped ? inputRight : inputLeft;
    const right = isSwapped ? inputLeft : inputRight;
    if (manager.isNumeral(right) && manager.getOp(left) === OP_UBV2INT) {
      const inner = manager.getArg(left, 0);
      const size = this.getSize(inner);
      const value = manager.getRationalValue(right);
      return rewrite(
        value.isInt() && value.num >= 0n && value.num < getPowerOfTwo(size)
          ? manager.mkEq(this.mkBv(value.num, size), inner)
          : manager.falseExpr,
        1,
      );
    }
    if (manager.getOp(left) === OP_UBV2INT && manager.getOp(right) === OP_UBV2INT) {
      const leftInner = manager.getArg(left, 0);
      const rightInner = manager.getArg(right, 0);
      const leftSize = this.getSize(leftInner);
      const rightSize = this.getSize(rightInner);
      const extendedLeft =
        leftSize < rightSize
          ? this.app(OP_ZERO_EXT, [leftInner], [rightSize - leftSize])
          : leftInner;
      const extendedRight =
        leftSize > rightSize
          ? this.app(OP_ZERO_EXT, [rightInner], [leftSize - rightSize])
          : rightInner;
      return rewrite(manager.mkEq(extendedLeft, extendedRight), 2);
    }
    return undefined;
  }

  // is_eq_bit: an equality of a term and a numeral of one bit, as the term and the bit.
  getEqBit(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_EQ) return undefined;
    const left = manager.getArg(expr, 0);
    const right = manager.getArg(expr, 1);
    const getBit = (arg: number) =>
      this.manager.isBvSort(this.manager.sorts[arg]) && this.getSize(arg) === 1
        ? this.getNumeral(arg)
        : undefined;
    const leftBit = getBit(left);
    if (leftBit !== undefined) return { term: right, bit: leftBit };
    const rightBit = getBit(right);
    if (rightBit !== undefined) return { term: left, bit: rightBit };
    return undefined;
  }

  mkIteCore(condition: number, thenExpr: number, elseExpr: number): Result {
    const manager = this.manager;
    if (thenExpr === elseExpr) return rewrite(elseExpr, 1);
    if (manager.isNot(condition))
      return rewrite(this.mkIteTerm(manager.getArg(condition, 0), elseExpr, thenExpr), 1);
    const thenZero = this.isZeroExtended(thenExpr);
    const elseZero = thenZero === undefined ? undefined : this.isZeroExtended(elseExpr);
    if (
      thenZero !== undefined &&
      elseZero !== undefined &&
      this.getSize(thenZero) === this.getSize(elseZero)
    ) {
      const inner = this.mkIteTerm(condition, thenZero, elseZero);
      return rewrite(
        this.app(OP_ZERO_EXT, [inner], [this.getSize(thenExpr) - this.getSize(thenZero)]),
        2,
      );
    }
    const thenSign = this.isSignExtended(thenExpr);
    const elseSign = thenSign === undefined ? undefined : this.isSignExtended(elseExpr);
    if (
      thenSign !== undefined &&
      elseSign !== undefined &&
      this.getSize(thenSign) === this.getSize(elseSign)
    ) {
      const inner = this.mkIteTerm(condition, thenSign, elseSign);
      return rewrite(
        this.app(OP_SIGN_EXT, [inner], [this.getSize(thenExpr) - this.getSize(thenSign)]),
        2,
      );
    }
    const eqBit = this.getEqBit(condition);
    const getBit = (arg: number) => (this.getSize(arg) === 1 ? this.getNumeral(arg) : undefined);
    const thenBit = getBit(thenExpr);
    const elseBit = getBit(elseExpr);
    if (eqBit !== undefined && thenBit !== undefined && elseBit !== undefined) {
      if (eqBit.bit === thenBit && elseBit !== thenBit) return eqBit.term;
      if (eqBit.bit === elseBit && elseBit !== thenBit)
        return rewrite(this.mkNotTerm(eqBit.term), 1);
    }
    return undefined;
  }

  mkDistinct(args: number[]): Result {
    if (args.length <= 1) return this.manager.trueExpr;
    const size = this.getSize(args[0]);
    if (size >= 32 || args.length <= 2 ** size) return undefined;
    return this.manager.falseExpr;
  }

  private mkBvsmulNoOverflow(args: number[], isOverflow: boolean): Result {
    const manager = this.manager;
    const first = this.getNumeral(args[0]);
    const second = this.getNumeral(args[1]);
    const size = this.getSize(args[0]);
    if (first !== undefined && (first === 0n || (size !== 1 && first === 1n)))
      return manager.trueExpr;
    if (second !== undefined && (second === 0n || (size !== 1 && second === 1n)))
      return manager.trueExpr;
    if (first === undefined || second === undefined) return undefined;
    const isFirstNegative = this.hasSignBit(first, size);
    const isSecondNegative = this.hasSignBit(second, size);
    const firstMagnitude = isFirstNegative ? getPowerOfTwo(size) - first : first;
    const secondMagnitude = isSecondNegative ? getPowerOfTwo(size) - second : second;
    const limit = getPowerOfTwo(size - 1);
    const product = firstMagnitude * secondMagnitude;
    const isValid = isOverflow
      ? isFirstNegative !== isSecondNegative || product < limit
      : isFirstNegative === isSecondNegative || product <= limit;
    return isValid ? manager.trueExpr : manager.falseExpr;
  }

  private mkBvumulNoOverflow(args: number[]): Result {
    const manager = this.manager;
    const first = this.getNumeral(args[0]);
    const second = this.getNumeral(args[1]);
    if (first !== undefined && (first === 0n || first === 1n)) return manager.trueExpr;
    if (second !== undefined && (second === 0n || second === 1n)) return manager.trueExpr;
    if (first === undefined || second === undefined) return undefined;
    return first * second < getPowerOfTwo(this.getSize(args[0]))
      ? manager.trueExpr
      : manager.falseExpr;
  }
}

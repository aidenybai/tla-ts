// Ported from Z3 (src/ast/fpa/fpa2bv_converter.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  OP_BADD,
  OP_BAND,
  OP_BASHR,
  OP_BLSHR,
  OP_BMUL,
  OP_BNEG,
  OP_BNOT,
  OP_BOR,
  OP_BREDAND,
  OP_BREDOR,
  OP_BSHL,
  OP_BSUB,
  OP_BUDIV_I,
  OP_BUREM,
  OP_BXOR,
  OP_CONCAT,
  OP_EXTRACT,
  OP_FPA_BV2RM,
  OP_FPA_BVWRAP,
  OP_FPA_FP,
  OP_FPA_MAX,
  OP_FPA_MIN,
  OP_ITE,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_SLT,
  OP_ULEQ,
  OP_ZERO_EXT,
  OP_NUM,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import {
  BV_RM_TIES_TO_AWAY,
  BV_RM_TIES_TO_EVEN,
  BV_RM_TO_NEGATIVE,
  BV_RM_TO_POSITIVE,
  BV_RM_TO_ZERO,
  getFpNumeral,
  mkFpaApp,
  mkRmNumeral,
} from "./fpa-decl-plugin";
import { ObjMap } from "./hashtable";
import { isInf, isNan, type Mpf, mpfFromRational } from "./mpf";
import type { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import type { Rewriter } from "./rewriter";

const getLog2 = (value: number) => (value > 0 ? 31 - Math.clz32(value) : 0);

const getBigLog2 = (value: bigint) => (value > 0n ? value.toString(2).length - 1 : 0);

const getPowerOfTwoMinusOne = (exponent: number) => (1n << BigInt(exponent)) - 1n;

interface Unpacked {
  sgn: number;
  sig: number;
  exp: number;
  lz: number;
}

export class Fpa2BvConverter {
  readonly constants: ObjMap<number>;
  readonly rmConstants: ObjMap<number>;
  readonly minMaxUfs: ObjMap<[number, number]>;
  readonly uf2BvUf: ObjMap<number>;
  readonly extraAssertions: RefVector;

  constructor(
    protected manager: AstManager,
    private simp: Rewriter,
  ) {
    const getHash = (decl: number) => manager.getDeclHash(decl);
    this.constants = new ObjMap(getHash);
    this.rmConstants = new ObjMap(getHash);
    this.minMaxUfs = new ObjMap(getHash);
    this.uf2BvUf = new ObjMap(getHash);
    this.extraAssertions = new RefVector(manager);
  }

  reset() {
    const manager = this.manager;
    for (const entry of [...this.constants, ...this.rmConstants]) {
      manager.decDeclRef(entry[0]);
      manager.decRef(entry[1]);
    }
    for (const entry of this.minMaxUfs) {
      manager.decDeclRef(entry[0]);
      manager.decRef(entry[1][0]);
      manager.decRef(entry[1][1]);
    }
    for (const entry of this.uf2BvUf) {
      manager.decDeclRef(entry[0]);
      manager.decDeclRef(entry[1]);
    }
    this.constants.clear();
    this.rmConstants.clear();
    this.minMaxUfs.clear();
    this.uf2BvUf.clear();
    this.extraAssertions.reset();
  }

  protected num(value: bigint | number, width: number) {
    return this.manager.mkBvNumeral(BigInt(value), width);
  }

  protected bv(op: number, ...args: number[]) {
    return mkBvApp(this.manager, op, args);
  }

  protected extract(high: number, low: number, expr: number) {
    return mkBvApp(this.manager, OP_EXTRACT, [expr], [high, low]);
  }

  protected concat(...args: number[]) {
    return mkBvApp(this.manager, OP_CONCAT, args);
  }

  private zeroExtend(amount: number, expr: number) {
    return mkBvApp(this.manager, OP_ZERO_EXT, [expr], [amount]);
  }

  private signExtend(amount: number, expr: number) {
    return mkBvApp(this.manager, OP_SIGN_EXT, [expr], [amount]);
  }

  protected getBvSize(expr: number) {
    return this.manager.getBvSize(this.manager.sorts[expr]);
  }

  mkFp(sgn: number, exp: number, sig: number) {
    return mkFpaApp(this.manager, OP_FPA_FP, [sgn, exp, sig]);
  }

  mkBv2Rm(expr: number) {
    return mkFpaApp(this.manager, OP_FPA_BV2RM, [expr]);
  }

  private mkAnd(...args: number[]) {
    return this.manager.mkAnd(args);
  }

  private mkOr(...args: number[]) {
    return this.manager.mkOr(args);
  }

  protected mkRawIte(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(
      OP_ITE,
      [condition, thenExpr, elseExpr],
      this.manager.sorts[thenExpr],
    );
  }

  private simpEq(left: number, right: number) {
    return this.simp.mkEq(left, right);
  }

  private simpNot(expr: number) {
    return this.simp.mkNot(expr);
  }

  private simpAnd(...args: number[]) {
    return this.simp.mkAnd(args);
  }

  private simpOr(...args: number[]) {
    return this.simp.mkOr(args);
  }

  private simpXor(first: number, second: number) {
    return this.simp.mkEq(this.simp.mkNot(first), second);
  }

  private simpIte(condition: number, thenExpr: number, elseExpr: number) {
    const result = this.simp.mkIte(condition, thenExpr, elseExpr);
    return typeof result === "number" ? result : result.expr;
  }

  private bvUlt(first: number, second: number) {
    return this.simpNot(this.bv(OP_ULEQ, second, first));
  }

  isFp(expr: number) {
    return this.manager.getOp(expr) === OP_FPA_FP;
  }

  splitFp(expr: number) {
    const manager = this.manager;
    return [manager.getArg(expr, 0), manager.getArg(expr, 1), manager.getArg(expr, 2)];
  }

  mkEq(first: number, second: number) {
    const manager = this.manager;
    if (manager.isFpSort(manager.sorts[first])) {
      const eqSgn = this.simpEq(manager.getArg(first, 0), manager.getArg(second, 0));
      const eqExp = this.simpEq(manager.getArg(first, 1), manager.getArg(second, 1));
      const eqSig = this.simpEq(manager.getArg(first, 2), manager.getArg(second, 2));
      const bothTheSame = this.simpAnd(eqSgn, eqExp, eqSig);
      const firstIsNan = this.mkIsNan(first);
      const secondIsNan = this.mkIsNan(second);
      const bothAreNan = this.simpAnd(firstIsNan, secondIsNan);
      return this.simpOr(bothAreNan, bothTheSame);
    }
    return this.simpEq(manager.getArg(first, 0), manager.getArg(second, 0));
  }

  mkIte(condition: number, thenExpr: number, elseExpr: number): number {
    const manager = this.manager;
    if (manager.getOp(thenExpr) === OP_ITE) {
      const inner = this.mkIte(
        manager.getArg(thenExpr, 0),
        manager.getArg(thenExpr, 1),
        manager.getArg(thenExpr, 2),
      );
      return this.mkIte(condition, inner, elseExpr);
    }
    if (manager.getOp(elseExpr) === OP_ITE) {
      const inner = this.mkIte(
        manager.getArg(elseExpr, 0),
        manager.getArg(elseExpr, 1),
        manager.getArg(elseExpr, 2),
      );
      return this.mkIte(condition, thenExpr, inner);
    }
    if (this.isFp(thenExpr) && this.isFp(elseExpr)) {
      const sgn = this.simpIte(condition, manager.getArg(thenExpr, 0), manager.getArg(elseExpr, 0));
      const sig = this.simpIte(condition, manager.getArg(thenExpr, 2), manager.getArg(elseExpr, 2));
      const exp = this.simpIte(condition, manager.getArg(thenExpr, 1), manager.getArg(elseExpr, 1));
      return this.mkFp(sgn, exp, sig);
    }
    return this.mkBv2Rm(
      this.simpIte(condition, manager.getArg(thenExpr, 0), manager.getArg(elseExpr, 0)),
    );
  }

  mkDistinct(args: number[]) {
    let result = this.manager.trueExpr;
    for (let first = 0; first < args.length; first++)
      for (let second = first + 1; second < args.length; second++) {
        const notEq = this.manager.mkNot(this.mkEq(args[first], args[second]));
        result = this.simpAnd(result, notEq);
      }
    return result;
  }

  mkNumeral(sort: number, value: Mpf) {
    if (isNan(value)) return this.mkNan(sort);
    if (isInf(value)) return value.sign ? this.mkNinf(sort) : this.mkPinf(sort);
    const bvSgn = this.num(value.sign ? 1 : 0, 1);
    const bvSig = this.num(value.significand, value.sbits - 1);
    const exponent = this.num(value.exponent, value.ebits);
    return this.mkFp(bvSgn, this.mkBias(exponent), bvSig);
  }

  mkNumeralOf(expr: number) {
    const value = getFpNumeral(this.manager, expr);
    return value === undefined ? -1 : this.mkNumeral(this.manager.sorts[expr], value);
  }

  mkConst(decl: number) {
    const existing = this.constants.get(decl);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const sort = manager.funcDecls[decl].range;
    const sbits = manager.getSbits(sort);
    const size = manager.getEbits(sort) + sbits;
    const bv = manager.mkFreshConst(null, manager.mkBvSort(size));
    const sgn = this.extract(size - 1, size - 1, bv);
    const exp = this.extract(size - 2, sbits - 1, bv);
    const sig = this.extract(sbits - 2, 0, bv);
    return this.cacheConst(this.constants, decl, this.mkFp(sgn, exp, sig));
  }

  protected cacheConst(cache: ObjMap<number>, decl: number, result: number) {
    cache.set(decl, result);
    this.manager.incDeclRef(decl);
    this.manager.incRef(result);
    return result;
  }

  mkRmConst(decl: number) {
    const existing = this.rmConstants.get(decl);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const bv = manager.mkFreshConst(null, manager.mkBvSort(3));
    const result = this.cacheConst(this.rmConstants, decl, this.mkBv2Rm(bv));
    this.extraAssertions.push(this.bv(OP_ULEQ, bv, this.num(4, 3)));
    return result;
  }

  mkUf(decl: number, args: number[]) {
    const manager = this.manager;
    const range = manager.funcDecls[decl].range;
    const isFloat = manager.isFpSort(range);
    if (!isFloat && !manager.isRmSort(range)) return manager.mkApp(decl, args, range);
    if (args.some((arg) => !manager.isGround(arg)))
      throw new SmtUnsupportedError("floating-point functions under quantifiers");
    const domain = args.map((arg) => manager.sorts[arg]);
    const application = manager.mkApp(decl, args, range);
    const size = isFloat ? manager.getEbits(range) + manager.getSbits(range) : 3;
    const bvRange = manager.mkBvSort(size);
    const bvApplication = manager.mkApp(this.mkBvUf(decl, domain, bvRange), args, bvRange);
    const sbits = isFloat ? manager.getSbits(range) : 0;
    const result = isFloat
      ? this.mkFp(
          this.extract(size - 1, size - 1, bvApplication),
          this.extract(size - 2, sbits - 1, bvApplication),
          this.extract(sbits - 2, 0, bvApplication),
        )
      : this.mkBv2Rm(bvApplication);
    this.extraAssertions.push(manager.mkEq(application, result));
    return result;
  }

  mkRoundingMode(rm: number) {
    return this.mkBv2Rm(this.num(rm, 3));
  }

  mkPinf(sort: number) {
    const manager = this.manager;
    const topExp = this.mkTopExp(manager.getEbits(sort));
    const sgn = this.num(0, 1);
    const sig = this.num(0, manager.getSbits(sort) - 1);
    return this.mkFp(sgn, topExp, sig);
  }

  mkNinf(sort: number) {
    const manager = this.manager;
    const topExp = this.mkTopExp(manager.getEbits(sort));
    const sgn = this.num(1, 1);
    const sig = this.num(0, manager.getSbits(sort) - 1);
    return this.mkFp(sgn, topExp, sig);
  }

  mkNan(sort: number) {
    const manager = this.manager;
    const topExp = this.mkTopExp(manager.getEbits(sort));
    const sgn = this.num(0, 1);
    const sig = this.num(1, manager.getSbits(sort) - 1);
    return this.mkFp(sgn, topExp, sig);
  }

  mkNzero(sort: number) {
    const manager = this.manager;
    const botExp = this.mkBotExp(manager.getEbits(sort));
    const sgn = this.num(1, 1);
    const sig = this.num(0, manager.getSbits(sort) - 1);
    return this.mkFp(sgn, botExp, sig);
  }

  mkPzero(sort: number) {
    const manager = this.manager;
    const botExp = this.mkBotExp(manager.getEbits(sort));
    const sgn = this.num(0, 1);
    const sig = this.num(0, manager.getSbits(sort) - 1);
    return this.mkFp(sgn, botExp, sig);
  }

  private mkOne(sort: number, sign: number) {
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const exp = this.num(getPowerOfTwoMinusOne(ebits - 1), ebits);
    const sig = this.num(0, manager.getSbits(sort) - 1);
    return this.mkFp(sign, exp, sig);
  }

  private addCore(
    sbits: number,
    ebits: number,
    inputCSig: number,
    cSgn: number,
    cExp: number,
    dSgn: number,
    inputDSig: number,
    dExp: number,
  ) {
    const delta = this.bv(OP_BSUB, cExp, dExp);
    let expDelta = delta;
    if (getLog2(sbits + 2) < ebits + 2) {
      const cap = this.num(sbits + 2, ebits + 2);
      const capLeDelta = this.bv(OP_ULEQ, cap, this.zeroExtend(2, delta));
      const expDeltaExt = this.zeroExtend(2, delta);
      expDelta = this.extract(ebits - 1, 0, this.simpIte(capLeDelta, cap, expDeltaExt));
    }
    const cSig = this.concat(inputCSig, this.num(0, 3));
    const dSig = this.concat(inputDSig, this.num(0, 3));
    const bigDSig = this.concat(dSig, this.num(0, sbits + 3));
    if (ebits > sbits) throw new SmtUnsupportedError("floating-point addition with ebits > sbits");
    const shiftedBig = this.bv(
      OP_BLSHR,
      bigDSig,
      this.concat(this.num(0, 2 * (sbits + 3) - ebits), expDelta),
    );
    const shiftedDSigRaw = this.extract(2 * (sbits + 3) - 1, sbits + 3, shiftedBig);
    const stickyRaw = this.extract(sbits + 2, 0, shiftedBig);
    const nilSbit3 = this.num(0, sbits + 3);
    const oneSbit3 = this.num(1, sbits + 3);
    const stickyEq = this.simpEq(stickyRaw, nilSbit3);
    const sticky = this.simpIte(stickyEq, nilSbit3, oneSbit3);
    const shiftedDSigOr = this.bv(OP_BOR, shiftedDSigRaw, sticky);
    const eqSgn = this.simpEq(cSgn, dSgn);
    const cSigExt = this.zeroExtend(2, cSig);
    const shiftedDSig = this.zeroExtend(2, shiftedDSigOr);
    const cPlusD = this.bv(OP_BADD, cSigExt, shiftedDSig);
    const cMinusD = this.bv(OP_BSUB, cSigExt, shiftedDSig);
    const sum = this.simpIte(eqSgn, cPlusD, cMinusD);
    const signBv = this.extract(sbits + 4, sbits + 4, sum);
    const nSum = this.bv(OP_BNEG, sum);
    const notCSgn = this.bv(OP_BNOT, cSgn);
    const notDSgn = this.bv(OP_BNOT, dSgn);
    const notSignBv = this.bv(OP_BNOT, signBv);
    const resSgnC1 = this.bv(OP_BAND, notCSgn, dSgn, signBv);
    const resSgnC2 = this.bv(OP_BAND, cSgn, notDSgn, notSignBv);
    const resSgnC3 = this.bv(OP_BAND, cSgn, dSgn);
    const resSgn = this.bv(OP_BOR, resSgnC1, resSgnC2, resSgnC3);
    const oneBit = this.num(1, 1);
    const resSigEq = this.simpEq(signBv, oneBit);
    const sigAbs = this.simpIte(resSigEq, nSum, sum);
    const resSig = this.extract(sbits + 3, 0, sigAbs);
    const resExp = this.signExtend(2, cExp);
    return { sgn: resSgn, sig: resSig, exp: resExp };
  }

  mkAdd(sort: number, rm: number, x: number, y: number) {
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    const xIsNan = this.mkIsNan(x);
    const xIsZero = this.mkIsZero(x);
    this.mkIsPos(x);
    const xIsNeg = this.mkIsNeg(x);
    const xIsInf = this.mkIsInf(x);
    const yIsNan = this.mkIsNan(y);
    const yIsZero = this.mkIsZero(y);
    this.mkIsPos(y);
    const yIsNeg = this.mkIsNeg(y);
    const yIsInf = this.mkIsInf(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const c2 = this.mkIsInf(x);
    const nx = this.mkIsNeg(x);
    const ny = this.mkIsNeg(y);
    const nxXorNy = this.simpXor(nx, ny);
    const infXor = this.simpAnd(yIsInf, nxXorNy);
    const v2 = this.mkIte(infXor, nan, x);
    const c3 = this.mkIsInf(y);
    const xyIsNeg = this.simpXor(xIsNeg, yIsNeg);
    const v3And = this.simpAnd(xIsInf, xyIsNeg);
    const v3 = this.mkIte(v3And, nan, y);
    const c4 = this.simpAnd(xIsZero, yIsZero);
    const signsAnd = this.simpAnd(xIsNeg, yIsNeg);
    const signsXor = this.simpXor(xIsNeg, yIsNeg);
    const rmIsToNeg = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const rmAndXor = this.simpAnd(rmIsToNeg, signsXor);
    const negCond = this.simpOr(signsAnd, rmAndXor);
    const v4Zero = this.mkIte(negCond, nzero, pzero);
    const v4And = this.simpAnd(xIsNeg, yIsNeg);
    const v4 = this.mkIte(v4And, x, v4Zero);
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const a = this.unpack(x, false);
    const b = this.unpack(y, false);
    const swapCond = this.bv(OP_SLEQ, a.exp, b.exp);
    const cSgn = this.simpIte(swapCond, b.sgn, a.sgn);
    const cSig = this.simpIte(swapCond, b.sig, a.sig);
    const cExp = this.simpIte(swapCond, b.exp, a.exp);
    const dSgn = this.simpIte(swapCond, a.sgn, b.sgn);
    const dSig = this.simpIte(swapCond, a.sig, b.sig);
    const dExp = this.simpIte(swapCond, a.exp, b.exp);
    const res = this.addCore(sbits, ebits, cSig, cSgn, cExp, dSgn, dSig, dExp);
    const nilSbit4 = this.num(0, sbits + 4);
    const isZeroSig = this.simpEq(res.sig, nilSbit4);
    const zeroCase = this.mkIte(rmIsToNeg, nzero, pzero);
    const rounded = this.round(sort, rm, res.sgn, res.sig, res.exp);
    const v7 = this.mkIte(isZeroSig, zeroCase, rounded);
    const r6 = this.mkIte(yIsZero, x, v7);
    const r5 = this.mkIte(xIsZero, y, r6);
    const r4 = this.mkIte(c4, v4, r5);
    const r3 = this.mkIte(c3, v3, r4);
    const r2 = this.mkIte(c2, v2, r3);
    return this.mkIte(c1, nan, r2);
  }

  mkSub(sort: number, rm: number, x: number, y: number) {
    return this.mkAdd(sort, rm, x, this.mkNeg(y));
  }

  mkNeg(x: number) {
    const [sgn, exp, sig] = this.splitFp(x);
    const xIsNan = this.mkIsNan(x);
    const nsgn = this.bv(OP_BNOT, sgn);
    const nx = this.mkFp(nsgn, exp, sig);
    return this.mkIte(xIsNan, x, nx);
  }

  mkMul(sort: number, rm: number, x: number, y: number) {
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    const ninf = this.mkNinf(sort);
    const pinf = this.mkPinf(sort);
    const xIsNan = this.mkIsNan(x);
    const xIsZero = this.mkIsZero(x);
    const xIsPos = this.mkIsPos(x);
    this.mkIsInf(x);
    const yIsNan = this.mkIsNan(y);
    const yIsZero = this.mkIsZero(y);
    const yIsPos = this.mkIsPos(y);
    this.mkIsInf(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const c2 = this.mkIsPinf(x);
    const ySgnInf = this.mkIte(yIsPos, pinf, ninf);
    const v2 = this.mkIte(yIsZero, nan, ySgnInf);
    const c3 = this.mkIsPinf(y);
    const xSgnInf = this.mkIte(xIsPos, pinf, ninf);
    const v3 = this.mkIte(xIsZero, nan, xSgnInf);
    const c4 = this.mkIsNinf(x);
    const negYSgnInf = this.mkIte(yIsPos, ninf, pinf);
    const v4 = this.mkIte(yIsZero, nan, negYSgnInf);
    const c5 = this.mkIsNinf(y);
    const negXSgnInf = this.mkIte(xIsPos, ninf, pinf);
    const v5 = this.mkIte(xIsZero, nan, negXSgnInf);
    const c6 = this.simpOr(xIsZero, yIsZero);
    const signXor = this.simpXor(xIsPos, yIsPos);
    const v6 = this.mkIte(signXor, nzero, pzero);
    const sbits = this.manager.getSbits(sort);
    const a = this.unpack(x, true);
    const b = this.unpack(y, true);
    const aLzExt = this.zeroExtend(2, a.lz);
    const bLzExt = this.zeroExtend(2, b.lz);
    const aSigExt = this.zeroExtend(sbits, a.sig);
    const bSigExt = this.zeroExtend(sbits, b.sig);
    const aExpSext = this.signExtend(2, a.exp);
    const bExpSext = this.signExtend(2, b.exp);
    const resSgn = this.bv(OP_BXOR, a.sgn, b.sgn);
    const aExpExt = this.bv(OP_BSUB, aExpSext, aLzExt);
    const bExpExt = this.bv(OP_BSUB, bExpSext, bLzExt);
    const resExp = this.bv(OP_BADD, aExpExt, bExpExt);
    const product = this.bv(OP_BMUL, aSigExt, bSigExt);
    const hP = this.extract(2 * sbits - 1, sbits, product);
    const lP = this.extract(sbits - 1, 0, product);
    const rbits =
      sbits >= 4
        ? this.concat(
            this.extract(sbits - 1, sbits - 3, product),
            this.bv(OP_BREDOR, this.extract(sbits - 4, 0, product)),
          )
        : this.concat(lP, this.num(0, 4 - sbits));
    const resSig = this.concat(hP, rbits);
    const v7 = this.round(sort, rm, resSgn, resSig, resExp);
    const r6 = this.mkIte(c6, v6, v7);
    const r5 = this.mkIte(c5, v5, r6);
    const r4 = this.mkIte(c4, v4, r5);
    const r3 = this.mkIte(c3, v3, r4);
    const r2 = this.mkIte(c2, v2, r3);
    return this.mkIte(c1, nan, r2);
  }

  mkDiv(sort: number, rm: number, x: number, y: number) {
    const manager = this.manager;
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    const ninf = this.mkNinf(sort);
    const pinf = this.mkPinf(sort);
    const xIsNan = this.mkIsNan(x);
    const xIsZero = this.mkIsZero(x);
    const xIsPos = this.mkIsPos(x);
    const xIsInf = this.mkIsInf(x);
    const yIsNan = this.mkIsNan(y);
    const yIsZero = this.mkIsZero(y);
    const yIsPos = this.mkIsPos(y);
    const yIsInf = this.mkIsInf(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const c2 = this.mkIsPinf(x);
    const ySgnInf = this.mkIte(yIsPos, pinf, ninf);
    const v2 = this.mkIte(yIsInf, nan, ySgnInf);
    const c3 = this.mkIsPinf(y);
    const signsXor = this.simpXor(xIsPos, yIsPos);
    const xyZero = this.mkIte(signsXor, nzero, pzero);
    const v3 = this.mkIte(xIsInf, nan, xyZero);
    const c4 = this.mkIsNinf(x);
    const negYSgnInf = this.mkIte(yIsPos, ninf, pinf);
    const v4 = this.mkIte(yIsInf, nan, negYSgnInf);
    const c5 = this.mkIsNinf(y);
    const v5 = this.mkIte(xIsInf, nan, xyZero);
    const sgnInf = this.mkIte(signsXor, ninf, pinf);
    const v6 = this.mkIte(xIsZero, nan, sgnInf);
    const v7 = this.mkIte(signsXor, nzero, pzero);
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const lzModulus = 1n << BigInt(ebits);
    const needsWideLz = lzModulus < BigInt(sbits);
    const expBits = needsWideLz ? getBigLog2(lzModulus + BigInt(sbits) - 4n) + 2 : ebits + 2;
    const lzBits = needsWideLz ? getLog2(sbits - 1) + 1 : ebits;
    const a = this.unpack(x, !needsWideLz);
    const b = this.unpack(y, !needsWideLz);
    if (needsWideLz) {
      const zeroSig = this.num(0, sbits);
      const aSigIsZero = this.simpEq(zeroSig, a.sig);
      const bSigIsZero = this.simpEq(zeroSig, b.sig);
      const zeroLz = this.num(0, lzBits);
      const aLzRaw = this.mkLeadingZeros(a.sig, lzBits);
      const bLzRaw = this.mkLeadingZeros(b.sig, lzBits);
      a.lz = this.simpIte(aSigIsZero, zeroLz, aLzRaw);
      b.lz = this.simpIte(bSigIsZero, zeroLz, bLzRaw);
      const aShift = this.zeroExtend(sbits - lzBits, a.lz);
      const bShift = this.zeroExtend(sbits - lzBits, b.lz);
      a.sig = this.bv(OP_BSHL, a.sig, aShift);
      b.sig = this.bv(OP_BSHL, b.sig, bShift);
    }
    const extraBits = sbits + 2;
    const aSigExt = this.concat(a.sig, this.num(0, sbits + extraBits));
    const bSigExt = this.zeroExtend(sbits + extraBits, b.sig);
    const aExpSext = this.signExtend(expBits - ebits, a.exp);
    const bExpSext = this.signExtend(expBits - ebits, b.exp);
    const resSgn = this.bv(OP_BXOR, a.sgn, b.sgn);
    const aLzExt = this.zeroExtend(expBits - lzBits, a.lz);
    const bLzExt = this.zeroExtend(expBits - lzBits, b.lz);
    const aExpExt = this.bv(OP_BSUB, aExpSext, aLzExt);
    const bExpExt = this.bv(OP_BSUB, bExpSext, bLzExt);
    const quotientExp = this.bv(OP_BSUB, aExpExt, bExpExt);
    const quotient = this.bv(OP_BUDIV_I, aSigExt, bSigExt);
    const sticky = this.bv(OP_BREDOR, this.extract(extraBits - 2, 0, quotient));
    const quotientSig = this.concat(
      this.extract(extraBits + sbits + 1, extraBits - 1, quotient),
      sticky,
    );
    const tooLarge =
      sbits === 2
        ? manager.falseExpr
        : manager.mkEq(
            this.bv(
              OP_BREDOR,
              this.extract(sbits + sbits + extraBits - 1, extraBits + sbits + 2, quotient),
            ),
            this.num(1, 1),
          );
    const v8 = this.mkIte(signsXor, ninf, pinf);
    const resSigLz = this.mkLeadingZeros(quotientSig, sbits + 4);
    const resSigShiftAmount = this.bv(OP_BSUB, resSigLz, this.num(1, sbits + 4));
    const shiftCond = this.bv(OP_ULEQ, resSigLz, this.num(1, sbits + 4));
    const resSigShifted = this.bv(OP_BSHL, quotientSig, resSigShiftAmount);
    const expShiftAmount =
      expBits <= sbits + 4
        ? this.extract(expBits - 1, 0, resSigShiftAmount)
        : this.zeroExtend(expBits - (sbits + 4), resSigShiftAmount);
    const resExpShifted = this.bv(OP_BSUB, quotientExp, expShiftAmount);
    const resSig = this.simpIte(shiftCond, quotientSig, resSigShifted);
    const resExp = this.simpIte(shiftCond, quotientExp, resExpShifted);
    let v9: number;
    if (expBits > ebits + 2) {
      const roundExpBits = ebits + 2;
      const sigSize = sbits + 4;
      const roundMinExp = this.num(-(1n << BigInt(ebits + 1)), roundExpBits);
      const roundMaxExp = this.num(getPowerOfTwoMinusOne(ebits + 1), roundExpBits);
      const roundMinExpExt = this.signExtend(expBits - roundExpBits, roundMinExp);
      const roundMaxExpExt = this.signExtend(expBits - roundExpBits, roundMaxExp);
      const expBelowRoundRange = this.bv(OP_SLT, resExp, roundMinExpExt);
      const expAboveRoundRange = this.bv(OP_SLT, roundMaxExpExt, resExp);
      const narrowedExp = this.extract(roundExpBits - 1, 0, resExp);
      const cappedExp = this.simpIte(expAboveRoundRange, roundMaxExp, narrowedExp);
      const roundExp = this.simpIte(expBelowRoundRange, roundMinExp, cappedExp);
      const minExp = this.mkMinExp(ebits);
      const minExpExt = this.signExtend(expBits - ebits, minExp);
      const shift = this.bv(OP_BSUB, minExpExt, resExp);
      const underflowShift = this.bv(OP_BSUB, shift, this.num(1, expBits));
      const underflowShiftSized = this.zeroExtend(2 * sigSize - expBits, underflowShift);
      const sigExt = this.concat(resSig, this.num(0, sigSize));
      const shiftedSig = this.bv(OP_BLSHR, sigExt, underflowShiftSized);
      const sigExtractLowBit = 2 * sigSize - (sbits + 2);
      const discarded = this.bv(OP_BREDOR, this.extract(sigExtractLowBit - 1, 0, shiftedSig));
      const underflowSigRaw = this.extract(2 * sigSize - 1, sigExtractLowBit, shiftedSig);
      const stickyExt = this.zeroExtend(sbits + 1, discarded);
      const underflowSig = this.bv(OP_BOR, underflowSigRaw, stickyExt);
      const underflowSticky = this.extract(0, 0, underflowSig);
      const underflowRound = this.extract(1, 1, underflowSig);
      const underflowLast = this.extract(2, 2, underflowSig);
      const underflowRetained = this.extract(sbits + 1, 2, underflowSig);
      const underflowInc = this.mkRoundingDecision(
        rm,
        resSgn,
        underflowLast,
        underflowRound,
        underflowSticky,
      );
      const underflowRoundedSig = this.bv(
        OP_BADD,
        underflowRetained,
        this.zeroExtend(sbits - 1, underflowInc),
      );
      const underflowExp = this.num(0, ebits);
      const underflowFrac = this.extract(sbits - 2, 0, underflowRoundedSig);
      const underflowResult = this.mkFp(resSgn, underflowExp, underflowFrac);
      const rounded = this.round(sort, rm, resSgn, resSig, roundExp);
      v9 = this.mkIte(expBelowRoundRange, underflowResult, rounded);
    } else v9 = this.round(sort, rm, resSgn, resSig, resExp);
    const r8 = this.mkIte(tooLarge, v8, v9);
    const r7 = this.mkIte(xIsZero, v7, r8);
    const r6 = this.mkIte(yIsZero, v6, r7);
    const r5 = this.mkIte(c5, v5, r6);
    const r4 = this.mkIte(c4, v4, r5);
    const r3 = this.mkIte(c3, v3, r4);
    const r2 = this.mkIte(c2, v2, r3);
    return this.mkIte(c1, nan, r2);
  }

  mkRem(sort: number, x: number, y: number) {
    const manager = this.manager;
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    this.mkNinf(sort);
    this.mkPinf(sort);
    const xIsNan = this.mkIsNan(x);
    const xIsZero = this.mkIsZero(x);
    const xIsPos = this.mkIsPos(x);
    this.mkIsNeg(x);
    const xIsInf = this.mkIsInf(x);
    const yIsNan = this.mkIsNan(y);
    const yIsZero = this.mkIsZero(y);
    this.mkIsPos(y);
    this.mkIsNeg(y);
    const yIsInf = this.mkIsInf(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const [, xExp] = this.splitFp(x);
    const [, yExp] = this.splitFp(y);
    const oneEbits = this.num(1, ebits);
    const yExpM1 = this.bv(OP_BSUB, yExp, oneEbits);
    const xeLtYem1 = this.bvUlt(xExp, yExpM1);
    const yeNeqZero = manager.mkNot(manager.mkEq(yExp, this.num(0, ebits)));
    const c6 = this.mkAnd(yeNeqZero, xeLtYem1);
    const a = this.unpack(x, true);
    const b = this.unpack(y, true);
    const maxExpDiff = (1n << BigInt(ebits)) - 3n;
    const sigExtAmount = maxExpDiff + BigInt(sbits) - 1n;
    if (sigExtAmount > 2147483647n) throw new SmtUnsupportedError("huge exponents in fp.rem");
    const aExpExt = this.signExtend(2, a.exp);
    const bExpExt = this.signExtend(2, b.exp);
    const aLzExt = this.zeroExtend(2, a.lz);
    const bLzExt = this.zeroExtend(2, b.lz);
    const aExpAdj = this.bv(OP_BSUB, aExpExt, aLzExt);
    const bExpAdj = this.bv(OP_BSUB, bExpExt, bLzExt);
    const expDiff = this.bv(OP_BSUB, aExpAdj, bExpAdj);
    const negExpDiff = this.bv(OP_BNEG, expDiff);
    const expDiffIsNeg = this.bv(OP_SLEQ, expDiff, this.num(0, ebits + 2));
    manager.mkEq(expDiff, this.num(0, ebits + 2));
    this.bv(OP_SLEQ, this.num(0, this.getBvSize(expDiff)), expDiff);
    const extension = Number(sigExtAmount);
    const aSigExtL = extension === 0 ? a.sig : this.zeroExtend(extension, a.sig);
    const bSigExtL = extension === 0 ? b.sig : this.zeroExtend(extension, b.sig);
    const aSigExt = this.concat(aSigExtL, this.num(0, 3));
    const bSigExt = this.concat(bSigExtL, this.num(0, 3));
    const maxExpDiffAdj = extension + sbits - ebits + 1;
    const lshift = maxExpDiffAdj === 0 ? expDiff : this.zeroExtend(maxExpDiffAdj, expDiff);
    const rshift = maxExpDiffAdj === 0 ? negExpDiff : this.zeroExtend(maxExpDiffAdj, negExpDiff);
    const shiftedRight = this.bv(OP_BASHR, aSigExt, rshift);
    const shiftedLeft = this.bv(OP_BSHL, aSigExt, lshift);
    const shifted = this.mkRawIte(expDiffIsNeg, shiftedRight, shiftedLeft);
    const hugeRem = this.bv(OP_BUREM, shifted, bSigExt);
    const hugeDiv = this.bv(OP_BUDIV_I, shifted, bSigExt);
    const hugeDivIsEven = manager.mkEq(this.extract(0, 0, hugeDiv), this.num(0, 1));
    const rnddSgn = a.sgn;
    const rnddExp = this.bv(OP_BSUB, bExpExt, bLzExt);
    const rnddSig = this.extract(sbits + 3, 0, hugeRem);
    const rneBv = this.num(BV_RM_TIES_TO_EVEN, 3);
    const rnddSigLz = this.mkLeadingZeros(rnddSig, ebits + 2);
    const rnddExpEqYExp = manager.mkEq(rnddSigLz, this.num(1, ebits + 2));
    const rnddExpEqYExpM1 = manager.mkEq(rnddSigLz, this.num(2, ebits + 2));
    const ySigExt = this.concat(this.zeroExtend(2, b.sig), this.num(0, 2));
    const ySigLeRnddSig = this.bv(OP_SLEQ, ySigExt, rnddSig);
    const ySigEqRnddSig = manager.mkEq(ySigExt, rnddSig);
    const adjCnd1 = this.mkAnd(rnddExpEqYExp, ySigLeRnddSig);
    const adjCnd2 = this.mkAnd(rnddExpEqYExpM1, ySigLeRnddSig, manager.mkNot(ySigEqRnddSig));
    const adjCnd3 = this.mkAnd(rnddExpEqYExpM1, ySigEqRnddSig, manager.mkNot(hugeDivIsEven));
    const adjCnd = this.mkOr(adjCnd1, adjCnd2, adjCnd3);
    const rndd = this.round(sort, rneBv, rnddSgn, rnddSig, rnddExp);
    const roundedSubY = this.mkSub(sort, rneBv, rndd, y);
    const roundedAddY = this.mkAdd(sort, rneBv, rndd, y);
    const addCnd = manager.mkNot(manager.mkEq(rnddSgn, b.sgn));
    const adjusted = this.mkIte(addCnd, roundedAddY, roundedSubY);
    const v7 = this.mkIte(adjCnd, adjusted, rndd);
    const r6 = this.mkIte(c6, x, v7);
    const r5 = this.mkIte(xIsZero, pzero, r6);
    const r4 = this.mkIte(yIsZero, nan, r5);
    const r3 = this.mkIte(yIsInf, x, r4);
    const r2 = this.mkIte(xIsInf, nan, r3);
    const r1 = this.mkIte(c1, nan, r2);
    const resultIsZero = this.mkIsZero(r1);
    const zeros = this.mkIte(xIsPos, pzero, nzero);
    return this.mkIte(resultIsZero, zeros, r1);
  }

  mkAbs(x: number) {
    const [, exp, sig] = this.splitFp(x);
    return this.mkFp(this.num(0, 1), exp, sig);
  }

  mkMinMax(decl: number, args: number[], isMax: boolean) {
    const manager = this.manager;
    const x = args[0];
    const y = args[1];
    const [xSgn] = this.splitFp(x);
    const [ySgn] = this.splitFp(y);
    if (!isMax) {
      this.num(0, 1);
      this.num(1, 1);
    }
    const xIsNan = this.mkIsNan(x);
    const yIsNan = this.mkIsNan(y);
    const xIsZero = this.mkIsZero(x);
    const yIsZero = this.mkIsZero(y);
    const xyAreZero = this.mkAnd(xIsZero, yIsZero);
    this.mkIsPos(x);
    this.mkIsPos(y);
    this.mkIsNeg(x);
    this.mkIsNeg(y);
    const pnOrNpZeros = this.mkAnd(xyAreZero, manager.mkNot(manager.mkEq(xSgn, ySgn)));
    const unspecified = this.mkMinMaxUnspecified(decl, x, y);
    const compared = isMax ? this.mkFloatGt(x, y) : this.mkFloatLt(x, y);
    const ordered = this.mkIte(compared, x, y);
    const withZeros = this.mkIte(xyAreZero, y, ordered);
    const withUnspecified = this.mkIte(pnOrNpZeros, unspecified, withZeros);
    const withYNan = this.mkIte(yIsNan, x, withUnspecified);
    return this.mkIte(xIsNan, y, withYNan);
  }

  mkMinMaxI(op: number, args: number[]) {
    const manager = this.manager;
    const sort = manager.sorts[args[0]];
    const decl = manager.mkFpaDecl(
      op,
      op === OP_FPA_MIN ? "fp.min" : "fp.max",
      [],
      [sort, sort],
      sort,
    );
    return this.mkMinMax(decl, args, op === OP_FPA_MAX);
  }

  private mkMinMaxUnspecified(decl: number, x: number, y: number) {
    const manager = this.manager;
    const range = manager.funcDecls[decl].range;
    const ebits = manager.getEbits(range);
    const sbits = manager.getSbits(range);
    let decls = this.minMaxUfs.get(decl);
    if (decls === undefined) {
      const bitSort = manager.mkBvSort(1);
      decls = [manager.mkFreshConst(null, bitSort), manager.mkFreshConst(null, bitSort)];
      this.minMaxUfs.set(decl, decls);
      manager.incDeclRef(decl);
      manager.incRef(decls[0]);
      manager.incRef(decls[1]);
    }
    const pn = this.mkFp(decls[0], this.num(0, ebits), this.num(0, sbits - 1));
    const np = this.mkFp(decls[1], this.num(0, ebits), this.num(0, sbits - 1));
    const xIsPzero = this.mkIsPzero(x);
    const yIsNzero = this.mkIsNzero(y);
    const xyZero = this.simpAnd(xIsPzero, yIsNzero);
    return this.mkIte(xyZero, pn, np);
  }

  mkFma(sort: number, rm: number, x: number, y: number, z: number) {
    const manager = this.manager;
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    const ninf = this.mkNinf(sort);
    const pinf = this.mkPinf(sort);
    const xIsNan = this.mkIsNan(x);
    const xIsZero = this.mkIsZero(x);
    const xIsPos = this.mkIsPos(x);
    const xIsNeg = this.mkIsNeg(x);
    this.mkIsInf(x);
    const yIsNan = this.mkIsNan(y);
    const yIsZero = this.mkIsZero(y);
    const yIsPos = this.mkIsPos(y);
    const yIsNeg = this.mkIsNeg(y);
    this.mkIsInf(y);
    const zIsNan = this.mkIsNan(z);
    const zIsZero = this.mkIsZero(z);
    this.mkIsPos(z);
    const zIsNeg = this.mkIsNeg(z);
    const zIsInf = this.mkIsInf(z);
    const rmIsToNeg = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const infXor = this.simpXor(this.simpXor(xIsNeg, yIsNeg), zIsNeg);
    const infCond = this.simpAnd(zIsInf, infXor);
    const c1 = this.simpOr(xIsNan, yIsNan, zIsNan);
    const c2 = this.mkIsPinf(x);
    const ySgnInf = this.mkIte(yIsPos, pinf, ninf);
    const v2 = this.mkIte(this.simpOr(yIsZero, infCond), nan, ySgnInf);
    const c3 = this.mkIsPinf(y);
    const xSgnInf = this.mkIte(xIsPos, pinf, ninf);
    const v3 = this.mkIte(this.simpOr(xIsZero, infCond), nan, xSgnInf);
    const c4 = this.mkIsNinf(x);
    const negYSgnInf = this.mkIte(yIsPos, ninf, pinf);
    const v4 = this.mkIte(this.simpOr(yIsZero, infCond), nan, negYSgnInf);
    const c5 = this.mkIsNinf(y);
    const negXSgnInf = this.mkIte(xIsPos, ninf, pinf);
    const v5 = this.mkIte(this.simpOr(xIsZero, infCond), nan, negXSgnInf);
    const c6 = this.mkIsInf(z);
    const c7 = this.simpOr(xIsZero, yIsZero);
    const xySgn = this.simpXor(xIsNeg, yIsNeg);
    const xyzSgn = this.simpXor(xySgn, zIsNeg);
    const c71 = this.simpAnd(zIsZero, xyzSgn);
    manager.mkNot(rmIsToNeg);
    const zeroCond = this.simpIte(rmIsToNeg, nzero, pzero);
    const v7 = this.mkIte(c71, zeroCond, z);
    const oneBit = this.num(1, 1);
    const zeroBit = this.num(0, 1);
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const a = this.unpack(x, true);
    const b = this.unpack(y, true);
    const c = this.unpack(z, true);
    const aLzExt = this.zeroExtend(2, a.lz);
    const bLzExt = this.zeroExtend(2, b.lz);
    const cLzExt = this.zeroExtend(2, c.lz);
    const aSigExt = this.zeroExtend(sbits, a.sig);
    const bSigExt = this.zeroExtend(sbits, b.sig);
    const aExpSext = this.signExtend(2, a.exp);
    const bExpSext = this.signExtend(2, b.exp);
    const cExpSext = this.signExtend(2, c.exp);
    const mulSgn = this.bv(OP_BXOR, a.sgn, b.sgn);
    const aExpExt = this.bv(OP_BSUB, aExpSext, aLzExt);
    const bExpExt = this.bv(OP_BSUB, bExpSext, bLzExt);
    const mulExp = this.bv(OP_BADD, aExpExt, bExpExt);
    const product = this.bv(OP_BMUL, aSigExt, bSigExt);
    const cSigExt = this.zeroExtend(1, this.concat(c.sig, this.num(0, sbits + 2)));
    const cExpExt = this.bv(OP_BSUB, cExpSext, cLzExt);
    const mulSig = this.concat(product, this.num(0, 3));
    const swapCond = this.bv(OP_SLEQ, mulExp, cExpExt);
    const eSgn = this.simpIte(swapCond, c.sgn, mulSgn);
    const eSigRaw = this.simpIte(swapCond, cSigExt, mulSig);
    const eExp = this.simpIte(swapCond, cExpExt, mulExp);
    const fSgn = this.simpIte(swapCond, mulSgn, c.sgn);
    const fSig = this.simpIte(swapCond, mulSig, cSigExt);
    const fExp = this.simpIte(swapCond, mulExp, cExpExt);
    const delta = this.bv(OP_BSUB, eExp, fExp);
    const cap = this.num(2 * sbits + 3, ebits + 2);
    const capLeDelta = this.bv(OP_ULEQ, cap, delta);
    const expDelta = this.simpIte(capLeDelta, cap, delta);
    const fSigExt = this.concat(fSig, this.num(0, sbits));
    const expDeltaExt = this.zeroExtend(3 * sbits + 3 - (ebits + 2), expDelta);
    const shiftedBig = this.bv(OP_BLSHR, fSigExt, expDeltaExt);
    const shiftedFSigRaw = this.extract(3 * sbits + 2, sbits, shiftedBig);
    const alignmentStickyRaw = this.extract(sbits - 1, 0, shiftedBig);
    const alignmentSticky = this.bv(OP_BREDOR, alignmentStickyRaw);
    const eSig = this.zeroExtend(2, eSigRaw);
    const shiftedFSig = this.zeroExtend(2, shiftedFSigRaw);
    const eqSgn = this.simpEq(eSgn, fSgn);
    const stickyWide = this.zeroExtend(2 * sbits + 4, alignmentSticky);
    const ePlusFRaw = this.bv(OP_BADD, eSig, shiftedFSig);
    const plusStickyCond = manager.mkEq(this.extract(0, 0, ePlusFRaw), zeroBit);
    const plusWithSticky = this.bv(OP_BADD, ePlusFRaw, stickyWide);
    const ePlusF = this.mkRawIte(plusStickyCond, plusWithSticky, ePlusFRaw);
    const eMinusFRaw = this.bv(OP_BSUB, eSig, shiftedFSig);
    const minusStickyCond = manager.mkEq(this.extract(0, 0, eMinusFRaw), zeroBit);
    const minusWithSticky = this.bv(OP_BSUB, eMinusFRaw, stickyWide);
    const eMinusF = this.mkRawIte(minusStickyCond, minusWithSticky, eMinusFRaw);
    const sum = this.simpIte(eqSgn, ePlusF, eMinusF);
    const signBv = this.extract(2 * sbits + 4, 2 * sbits + 4, sum);
    const nSum = this.bv(OP_BNEG, sum);
    const resSigEq = this.simpEq(signBv, oneBit);
    const sigAbsRaw = this.simpIte(resSigEq, nSum, sum);
    const notESgn = this.bv(OP_BNOT, eSgn);
    const notFSgn = this.bv(OP_BNOT, fSgn);
    const notSignBv = this.bv(OP_BNOT, signBv);
    const resSgnC1 = this.bv(OP_BAND, notESgn, fSgn, signBv);
    const resSgnC2 = this.bv(OP_BAND, eSgn, notFSgn, notSignBv);
    const resSgnC3 = this.bv(OP_BAND, eSgn, fSgn);
    const resSgn = this.bv(OP_BOR, resSgnC1, resSgnC2, resSgnC3);
    const isSigNeg = manager.mkEq(oneBit, this.extract(2 * sbits + 4, 2 * sbits + 4, sigAbsRaw));
    const sigAbsSigned = this.mkRawIte(isSigNeg, this.bv(OP_BNEG, sigAbsRaw), sigAbsRaw);
    const extra = this.extract(2 * sbits + 4, 2 * sbits + 3, sigAbsSigned);
    const extraIsZero = manager.mkEq(extra, this.num(0, 2));
    const expUnnormalized = this.mkRawIte(
      extraIsZero,
      eExp,
      this.bv(OP_BADD, eExp, this.num(1, ebits + 2)),
    );
    const zeroE2 = this.num(0, ebits + 2);
    const minExp = this.signExtend(2, this.mkMinExp(ebits));
    const sigLzRaw = this.mkLeadingZeros(sigAbsSigned, ebits + 2);
    const sigLz = this.bv(OP_BSUB, sigLzRaw, this.num(2, ebits + 2));
    const maxExpDelta = this.bv(OP_BSUB, expUnnormalized, minExp);
    const sigLzCapped = this.mkRawIte(this.bv(OP_SLEQ, sigLz, maxExpDelta), sigLz, maxExpDelta);
    const renormDelta = this.mkRawIte(this.bv(OP_SLEQ, zeroE2, sigLzCapped), sigLzCapped, zeroE2);
    const resExp = this.bv(OP_BSUB, expUnnormalized, renormDelta);
    const sigAbsShifted = this.bv(
      OP_BSHL,
      sigAbsSigned,
      this.zeroExtend(2 * sbits + 3 - ebits, renormDelta),
    );
    const tooShort = sbits < 5 ? 6 - sbits + 1 : 0;
    const sigAbs = sbits < 5 ? this.concat(sigAbsShifted, this.num(0, tooShort)) : sigAbsShifted;
    const stickyH1 = this.extract(sbits + tooShort - 2, 0, sigAbs);
    const sigAbsH1 = this.extract(2 * sbits + tooShort + 4, sbits - 1 + tooShort, sigAbs);
    const stickyH1Red = this.zeroExtend(sbits + 5, this.bv(OP_BREDOR, stickyH1));
    const sigAbsH1F = this.bv(OP_BOR, sigAbsH1, stickyH1Red);
    const resSig1 = this.extract(sbits + 3, 0, sigAbsH1F);
    const stickyH2 = this.extract(sbits + tooShort - 1, 0, sigAbs);
    const sigAbsH2 = this.extract(2 * sbits + tooShort + 4, sbits + tooShort, sigAbs);
    const stickyH2Red = this.zeroExtend(sbits + 4, this.bv(OP_BREDOR, stickyH2));
    const sigAbsH2F = this.zeroExtend(1, this.bv(OP_BOR, sigAbsH2, stickyH2Red));
    const resSig2 = this.extract(sbits + 3, 0, sigAbsH2F);
    const resSig = this.mkRawIte(extraIsZero, resSig1, resSig2);
    const nilSbits4 = this.num(0, sbits + 4);
    const isZeroSig = this.simpEq(resSig, nilSbits4);
    const zeroCase = this.mkIte(rmIsToNeg, nzero, pzero);
    const rounded = this.round(sort, rm, resSgn, resSig, resExp);
    const v8 = this.mkIte(isZeroSig, zeroCase, rounded);
    const r7 = this.mkIte(c7, v7, v8);
    const r6 = this.mkIte(c6, z, r7);
    const r5 = this.mkIte(c5, v5, r6);
    const r4 = this.mkIte(c4, v4, r5);
    const r3 = this.mkIte(c3, v3, r4);
    const r2 = this.mkIte(c2, v2, r3);
    return this.mkIte(c1, nan, r2);
  }

  mkSqrt(sort: number, rm: number, x: number) {
    const manager = this.manager;
    const nan = this.mkNan(sort);
    this.mkNzero(sort);
    this.mkPzero(sort);
    this.mkNinf(sort);
    this.mkPinf(sort);
    const xIsNan = this.mkIsNan(x);
    this.mkIsZero(x);
    this.mkIsPos(x);
    this.mkIsInf(x);
    const zeroBit = this.num(0, 1);
    const oneBit = this.num(1, 1);
    const c2 = this.mkIsPinf(x);
    const c3 = this.mkIsZero(x);
    const c4 = this.mkIsNeg(x);
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const a = this.unpack(x, true);
    const aExpExt = this.signExtend(1, a.exp);
    const aLzExt = this.zeroExtend(1, a.lz);
    const realExp = this.bv(OP_BSUB, aExpExt, aLzExt);
    const resExp = this.signExtend(2, this.extract(ebits, 1, realExp));
    const eIsOdd = manager.mkEq(this.extract(0, 0, realExp), oneBit);
    const aZ = this.concat(a.sig, zeroBit);
    const zA = this.concat(zeroBit, a.sig);
    const sigPrime = this.simpIte(eIsOdd, aZ, zA);
    let q = this.num(1n << BigInt(sbits + 3), sbits + 5);
    let r = this.bv(OP_BSUB, this.concat(sigPrime, this.num(0, 4)), q);
    let s = q;
    for (let index = 0; index < sbits + 3; index++) {
      s = this.concat(zeroBit, this.extract(sbits + 4, 1, s));
      const twoQ = this.concat(q, zeroBit);
      const sExt = this.concat(zeroBit, s);
      const twoQPlusS = this.bv(OP_BADD, twoQ, sExt);
      const t = this.bv(OP_BSUB, this.concat(r, zeroBit), twoQPlusS);
      const tLsds5 = this.extract(sbits + 5, sbits + 5, t);
      const tLt0 = this.simpEq(tLsds5, oneBit);
      const qOrS = this.bv(OP_BOR, q, s);
      q = this.simpIte(tLt0, q, qOrS);
      const rShifted = this.concat(this.extract(sbits + 3, 0, r), zeroBit);
      const tLsds4 = this.extract(sbits + 4, 0, t);
      r = this.simpIte(tLt0, rShifted, tLsds4);
    }
    const zeroSbits5 = this.num(0, sbits + 5);
    const isExact = this.simpEq(r, zeroSbits5);
    const last = this.extract(0, 0, q);
    const rest = this.extract(sbits + 3, 1, q);
    const restExt = this.zeroExtend(1, rest);
    const lastExt = this.zeroExtend(sbits + 3, last);
    const oneSbits4 = this.num(1, sbits + 4);
    const sticky = this.simpIte(isExact, lastExt, oneSbits4);
    const resSig = this.bv(OP_BOR, restExt, sticky);
    const v5 = this.round(sort, rm, zeroBit, resSig, resExp);
    const r4 = this.mkIte(c4, nan, v5);
    const r3 = this.mkIte(c3, x, r4);
    const r2 = this.mkIte(c2, x, r3);
    return this.mkIte(xIsNan, x, r2);
  }

  mkRoundToIntegral(sort: number, rm: number, x: number) {
    const manager = this.manager;
    const rmIsRta = this.mkIsRm(rm, BV_RM_TIES_TO_AWAY);
    const rmIsRte = this.mkIsRm(rm, BV_RM_TIES_TO_EVEN);
    const rmIsRtp = this.mkIsRm(rm, BV_RM_TO_POSITIVE);
    const rmIsRtn = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const rmIsRtz = this.mkIsRm(rm, BV_RM_TO_ZERO);
    const nan = this.mkNan(sort);
    const nzero = this.mkNzero(sort);
    const pzero = this.mkPzero(sort);
    this.mkIsZero(x);
    this.mkIsPos(x);
    const xIsNeg = this.mkIsNeg(x);
    const c1 = this.mkIsNan(x);
    const c2 = this.mkIsInf(x);
    const c3 = this.mkIsZero(x);
    const oneBit = this.num(1, 1);
    const zeroBit = this.num(0, 1);
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const a = this.unpack(x, true);
    const sgnEq1 = manager.mkEq(a.sgn, oneBit);
    const xzero = this.mkIte(sgnEq1, nzero, pzero);
    const xIsDenormal = this.mkIsDenormal(x);
    const expH = this.extract(ebits - 1, ebits - 1, a.exp);
    const expLtZero = this.simpEq(expH, oneBit);
    const c4 = this.mkOr(expLtZero, xIsDenormal);
    const pone = this.mkOne(sort, zeroBit);
    const none = this.mkOne(sort, oneBit);
    const xone = this.mkIte(sgnEq1, none, pone);
    const realExpExt = this.signExtend(1, a.exp);
    const aLzExt = this.zeroExtend(1, a.lz);
    const realExp = this.bv(OP_BSUB, realExpExt, aLzExt);
    const pow2Sbitsm1 = this.num(1n << BigInt(sbits - 1), sbits);
    const m1Ext = this.bv(OP_BNEG, this.num(1, ebits + 1));
    const t1 = this.simpEq(a.sig, pow2Sbitsm1);
    const t2 = this.simpEq(realExp, m1Ext);
    const tie = this.simpAnd(t1, t2);
    const c421 = this.simpAnd(tie, rmIsRte);
    const c422 = this.simpAnd(tie, rmIsRta);
    const c423 = this.bv(OP_SLEQ, realExp, this.bv(OP_BNEG, this.num(2, ebits + 1)));
    const v423 = this.mkIte(c423, xzero, xone);
    const v422 = this.mkIte(c422, xone, v423);
    const v42 = this.mkIte(c421, xzero, v422);
    const v4Rtp = this.mkIte(xIsNeg, nzero, pone);
    const v4Rtn = this.mkIte(xIsNeg, none, pzero);
    const v4p = this.mkIte(rmIsRtp, v4Rtp, v42);
    const v4n = this.mkIte(rmIsRtn, v4Rtn, v4p);
    const v4 = this.mkIte(rmIsRtz, xzero, v4n);
    const c5 =
      getLog2(sbits - 1) + 1 <= ebits - 1
        ? this.bv(OP_SLEQ, this.num(sbits - 1, ebits), a.exp)
        : manager.falseExpr;
    const resSgn = a.sgn;
    const zeroS = this.num(0, sbits);
    const shiftBase = this.num(sbits - 1, sbits);
    const aExpExt = this.signExtend(sbits - ebits, a.exp);
    const shift = this.bv(OP_BSUB, shiftBase, aExpExt);
    const aSigExt = this.concat(a.sig, zeroS);
    const shiftExt = this.concat(zeroS, shift);
    const shiftedSig = this.bv(OP_BLSHR, aSigExt, shiftExt);
    const div = this.extract(2 * sbits - 1, sbits, shiftedSig);
    const rem = this.extract(sbits - 1, 0, shiftedSig);
    const divP1 = this.bv(OP_BADD, div, this.num(1, sbits));
    const tiePattern = this.concat(oneBit, this.num(0, sbits - 1));
    const tie2 = this.simpEq(rem, tiePattern);
    const divLast = this.extract(0, 0, div);
    const divLastEq1 = manager.mkEq(divLast, oneBit);
    const rteAndDlEq1 = this.mkAnd(rmIsRte, divLastEq1);
    const rteAndDlEq1OrRta = this.mkOr(rteAndDlEq1, rmIsRta);
    const tiePatternUleRem = this.bv(OP_ULEQ, tiePattern, rem);
    const tie2C = this.mkRawIte(tie2, rteAndDlEq1OrRta, tiePatternUleRem);
    const v51 = this.simpIte(tie2C, divP1, div);
    const remEq0 = manager.mkEq(rem, this.num(0, sbits));
    const sgnEqZero = manager.mkEq(resSgn, zeroBit);
    const c521 = this.simpAnd(this.simpNot(remEq0), sgnEqZero);
    const v52 = this.simpIte(c521, divP1, div);
    const sgnEqOne = manager.mkEq(resSgn, oneBit);
    const c531 = this.simpAnd(this.simpNot(remEq0), sgnEqOne);
    const v53 = this.simpIte(c531, divP1, div);
    const c51 = this.mkOr(rmIsRte, rmIsRta);
    const sig53 = this.simpIte(rmIsRtn, v53, div);
    const sig52 = this.simpIte(rmIsRtp, v52, sig53);
    const sig51 = this.simpIte(c51, v51, sig52);
    const eShift =
      ebits + 2 <= sbits
        ? this.extract(ebits + 1, 0, shift)
        : this.signExtend(ebits + 2 - sbits, shift);
    const expSum = this.bv(OP_BADD, this.zeroExtend(2, a.exp), eShift);
    const zeroE2 = this.num(0, ebits + 2);
    const minExp = this.signExtend(2, this.mkMinExp(ebits));
    const sigLz = this.mkLeadingZeros(sig51, ebits + 2);
    const maxExpDelta = this.bv(OP_BSUB, expSum, minExp);
    const sigLzCapped = this.mkRawIte(this.bv(OP_ULEQ, sigLz, maxExpDelta), sigLz, maxExpDelta);
    const renormDelta = this.mkRawIte(this.bv(OP_ULEQ, zeroE2, sigLzCapped), sigLzCapped, zeroE2);
    const resExp = this.bv(OP_BSUB, expSum, renormDelta);
    const resSig =
      sbits >= ebits + 2
        ? this.bv(OP_BSHL, sig51, this.zeroExtend(sbits - ebits - 2, renormDelta))
        : this.extract(
            sbits - 1,
            0,
            this.bv(OP_BSHL, this.zeroExtend(ebits + 2 - sbits, sig51), renormDelta),
          );
    const biasedExp = this.mkBias(this.extract(ebits - 1, 0, resExp));
    const v6 = this.mkFp(resSgn, biasedExp, this.extract(sbits - 2, 0, resSig));
    const r5 = this.mkIte(c5, x, v6);
    const r4 = this.mkIte(c4, v4, r5);
    const r3 = this.mkIte(c3, x, r4);
    const r2 = this.mkIte(c2, x, r3);
    return this.mkIte(c1, nan, r2);
  }

  mkFloatEq(x: number, y: number) {
    const manager = this.manager;
    const xIsNan = this.mkIsNan(x);
    const yIsNan = this.mkIsNan(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const xIsZero = this.mkIsZero(x);
    const yIsZero = this.mkIsZero(y);
    const c2 = this.simpAnd(xIsZero, yIsZero);
    const [xSgn, xExp, xSig] = this.splitFp(x);
    const [ySgn, yExp, ySig] = this.splitFp(y);
    const xEqYSgn = this.simpEq(xSgn, ySgn);
    const xEqYExp = this.simpEq(xExp, yExp);
    const xEqYSig = this.simpEq(xSig, ySig);
    const c3 = this.simpNot(xEqYSgn);
    const t4 = this.simpAnd(xEqYExp, xEqYSig);
    const c3t4 = this.simpIte(c3, manager.falseExpr, t4);
    const c2Else = this.simpIte(c2, manager.trueExpr, c3t4);
    return this.simpIte(c1, manager.falseExpr, c2Else);
  }

  mkFloatLt(x: number, y: number) {
    const manager = this.manager;
    const xIsNan = this.mkIsNan(x);
    const yIsNan = this.mkIsNan(y);
    const c1 = this.simpOr(xIsNan, yIsNan);
    const xIsZero = this.mkIsZero(x);
    const yIsZero = this.mkIsZero(y);
    const c2 = this.simpAnd(xIsZero, yIsZero);
    const [xSgn, xExp, xSig] = this.splitFp(x);
    const [ySgn, yExp, ySig] = this.splitFp(y);
    const oneBit = this.num(1, 1);
    const nilBit = this.num(0, 1);
    const c3 = this.simpEq(xSgn, oneBit);
    const ySgnEq0 = this.simpEq(ySgn, nilBit);
    const yLtXExp = this.bvUlt(yExp, xExp);
    const yLtXSig = this.bvUlt(ySig, xSig);
    const yEqXExp = this.simpEq(yExp, xExp);
    const yLeXSigExp = this.simpAnd(yEqXExp, yLtXSig);
    const t3Or = this.simpOr(yLtXExp, yLeXSigExp);
    const t3 = this.simpIte(ySgnEq0, manager.trueExpr, t3Or);
    const ySgnEq1 = this.simpEq(ySgn, oneBit);
    const xLtYExp = this.bvUlt(xExp, yExp);
    const xEqYExp = this.simpEq(xExp, yExp);
    const xLtYSig = this.bvUlt(xSig, ySig);
    const xLeYSigExp = this.simpAnd(xEqYExp, xLtYSig);
    const t4Or = this.simpOr(xLtYExp, xLeYSigExp);
    const t4 = this.simpIte(ySgnEq1, manager.falseExpr, t4Or);
    const c3t3t4 = this.simpIte(c3, t3, t4);
    const c2Else = this.simpIte(c2, manager.falseExpr, c3t3t4);
    return this.simpIte(c1, manager.falseExpr, c2Else);
  }

  mkFloatGt(x: number, y: number) {
    const manager = this.manager;
    const t3 = this.mkFloatLe(x, y);
    const xIsNan = this.mkIsNan(x);
    const yIsNan = this.mkIsNan(y);
    const nanOr = this.simpOr(xIsNan, yIsNan);
    const xIsZero = this.mkIsZero(x);
    const yIsZero = this.mkIsZero(y);
    const xyZero = this.simpAnd(xIsZero, yIsZero);
    const notT3 = this.simpNot(t3);
    const rElse = this.simpIte(xyZero, manager.falseExpr, notT3);
    return this.simpIte(nanOr, manager.falseExpr, rElse);
  }

  mkFloatLe(x: number, y: number) {
    const lt = this.mkFloatLt(x, y);
    const eq = this.mkFloatEq(x, y);
    return this.simpOr(lt, eq);
  }

  mkFloatGe(x: number, y: number) {
    const gt = this.mkFloatGt(x, y);
    const eq = this.mkFloatEq(x, y);
    return this.simpOr(gt, eq);
  }

  mkIsNegative(x: number) {
    const manager = this.manager;
    const isNan = this.mkIsNan(x);
    const isNeg = this.mkIsNeg(x);
    return this.mkAnd(manager.mkNot(isNan), isNeg);
  }

  mkIsPositive(x: number) {
    const manager = this.manager;
    const isNan = this.mkIsNan(x);
    const isPos = this.mkIsPos(x);
    return this.mkAnd(manager.mkNot(isNan), isPos);
  }

  mkToFp(sort: number, args: number[]) {
    const manager = this.manager;
    const argSorts = args.map((arg) => manager.sorts[arg]);
    if (args.length === 1) {
      const size = this.getBvSize(args[0]);
      const toEbits = manager.getEbits(sort);
      const sgn = this.extract(size - 1, size - 1, args[0]);
      const exp = this.extract(size - 2, size - toEbits - 1, args[0]);
      const sig = this.extract(size - toEbits - 2, 0, args[0]);
      return this.mkFp(sgn, exp, sig);
    }
    if (args.length === 2 && manager.isFpSort(argSorts[1]))
      return this.mkToFpFloat(sort, manager.getArg(args[0], 0), args[1]);
    if (args.length === 2 && (argSorts[1] === SORT_INT || argSorts[1] === SORT_REAL))
      return this.mkToFpReal(sort, manager.getArg(args[0], 0), args[1]);
    if (args.length === 2) return this.mkToFpSigned(sort, manager.getArg(args[0], 0), args[1]);
    if (manager.isBvSort(argSorts[0])) return this.mkFp(args[0], args[1], args[2]);
    if (manager.getOp(args[1]) === OP_NUM && manager.getOp(args[2]) === OP_NUM) {
      const isIntReal = argSorts[1] === SORT_INT && argSorts[2] === SORT_REAL;
      const exponent = manager.getRationalValue(isIntReal ? args[1] : args[2]).num;
      const significand = manager.getRationalValue(isIntReal ? args[2] : args[1]);
      return this.mkToFpRealInt(sort, manager.getArg(args[0], 0), exponent, significand);
    }
    throw new SmtUnsupportedError("floating-point conversion of a non-numeral real");
  }

  mkToFpFloat(sort: number, rm: number, x: number) {
    const manager = this.manager;
    const xSort = manager.sorts[x];
    const fromSbits = manager.getSbits(xSort);
    const fromEbits = manager.getEbits(xSort);
    const toSbits = manager.getSbits(sort);
    const toEbits = manager.getEbits(sort);
    if (fromSbits === toSbits && fromEbits === toEbits) return x;
    const oneBit = this.num(1, 1);
    const pinf = this.mkPinf(sort);
    const ninf = this.mkNinf(sort);
    const c1 = this.mkIsNan(x);
    const v1 = this.mkNan(sort);
    const c2 = this.mkIsPzero(x);
    const v2 = this.mkPzero(sort);
    const c3 = this.mkIsNzero(x);
    const v3 = this.mkNzero(sort);
    const c4 = this.mkIsPinf(x);
    const c5 = this.mkIsNinf(x);
    const unpacked = this.unpack(x, true);
    const sig = unpacked.sig;
    const truncatedSig =
      fromSbits < toSbits + 3
        ? this.concat(sig, this.num(0, toSbits + 3 - fromSbits))
        : fromSbits > toSbits + 3
          ? this.concat(
              this.extract(fromSbits - 1, fromSbits - toSbits - 2, sig),
              this.bv(OP_BREDOR, this.extract(fromSbits - toSbits - 3, 0, sig)),
            )
          : sig;
    const resSig = this.zeroExtend(1, truncatedSig);
    const exponentOverflow = manager.falseExpr;
    let resExp: number;
    if (fromEbits < toEbits + 2) {
      const extended = this.signExtend(toEbits - fromEbits + 2, unpacked.exp);
      const lzExt = this.zeroExtend(toEbits - fromEbits + 2, unpacked.lz);
      resExp = this.bv(OP_BSUB, extended, lzExt);
    } else {
      const ebitsDiff = fromEbits - (toEbits + 2);
      const expExt = this.signExtend(2, unpacked.exp);
      const lzExt = this.signExtend(2, unpacked.lz);
      const expSubLz = this.bv(OP_BSUB, expExt, lzExt);
      const maxExp = this.concat(
        this.num(getPowerOfTwoMinusOne(toEbits), toEbits + 1),
        this.num(0, 1),
      );
      const minExp = this.num(-(1n << BigInt(toEbits + 1)) + 2n, toEbits + 2);
      const firstOvfExp = this.num(getPowerOfTwoMinusOne(toEbits + 1), fromEbits + 2);
      const udfHigh = this.bv(OP_BNEG, this.num(1, ebitsDiff + 3));
      const udfLow = this.num(1, toEbits + 1);
      const firstUdfExp = this.concat(udfHigh, udfLow);
      const expInRange = this.extract(toEbits + 1, 0, expSubLz);
      const ovfCond = this.bv(OP_SLEQ, firstOvfExp, expSubLz);
      const udfCond = this.bv(OP_SLEQ, expSubLz, firstUdfExp);
      resExp = this.mkRawIte(udfCond, minExp, this.mkRawIte(ovfCond, maxExp, expInRange));
    }
    const rounded = this.round(sort, rm, unpacked.sgn, resSig, resExp);
    const isNeg = this.simpEq(unpacked.sgn, oneBit);
    const sigInf = this.mkIte(isNeg, ninf, pinf);
    const v6 = this.mkIte(exponentOverflow, sigInf, rounded);
    const r5 = this.mkIte(c5, ninf, v6);
    const r4 = this.mkIte(c4, pinf, r5);
    const r3 = this.mkIte(c3, v3, r4);
    const r2 = this.mkIte(c2, v2, r3);
    return this.mkIte(c1, v1, r2);
  }

  private mkFpOfMpf(value: Mpf) {
    const sgn = this.num(value.sign ? 1 : 0, 1);
    const sig = this.num(value.significand, value.sbits - 1);
    const exp = this.mkBias(this.num(value.exponent, value.ebits));
    return this.mkFp(sgn, exp, sig);
  }

  mkToFpReal(sort: number, rm: number, x: number) {
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    if (manager.getOp(x) !== OP_NUM)
      throw new SmtUnsupportedError("floating-point conversion of a non-numeral real");
    const value = manager.getRationalValue(x);
    if (value.isZero()) return this.mkPzero(sort);
    if (manager.isBvNumeral(rm))
      return this.mkFpOfMpf(
        mpfFromRational(ebits, sbits, Number(manager.getBvNumeralValue(rm)), 0n, value),
      );
    const rmNta = this.mkIsRm(rm, BV_RM_TIES_TO_AWAY);
    const rmNte = this.mkIsRm(rm, BV_RM_TIES_TO_EVEN);
    const rmTp = this.mkIsRm(rm, BV_RM_TO_POSITIVE);
    const rmTn = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    this.mkIsRm(rm, BV_RM_TO_ZERO);
    const v1 = this.mkFpOfMpf(mpfFromRational(ebits, sbits, BV_RM_TIES_TO_AWAY, 0n, value));
    const v2 = this.mkFpOfMpf(mpfFromRational(ebits, sbits, BV_RM_TIES_TO_EVEN, 0n, value));
    const v3 = this.mkFpOfMpf(mpfFromRational(ebits, sbits, BV_RM_TO_POSITIVE, 0n, value));
    const v4 = this.mkFpOfMpf(mpfFromRational(ebits, sbits, BV_RM_TO_NEGATIVE, 0n, value));
    const v5 = this.mkFpOfMpf(mpfFromRational(ebits, sbits, BV_RM_TO_ZERO, 0n, value));
    const r4 = this.mkIte(rmTn, v4, v5);
    const r3 = this.mkIte(rmTp, v3, r4);
    const r2 = this.mkIte(rmNte, v2, r3);
    return this.mkIte(rmNta, v1, r2);
  }

  private mkToFpRealInt(sort: number, rm: number, exponent: bigint, significand: Rational) {
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    if (significand.isZero()) return this.mkPzero(sort);
    const getValue = (mode: number) =>
      this.mkNumeral(sort, mpfFromRational(ebits, sbits, mode, exponent, significand));
    const nte = getValue(BV_RM_TIES_TO_EVEN);
    const nta = getValue(BV_RM_TIES_TO_AWAY);
    const tp = getValue(BV_RM_TO_POSITIVE);
    const tn = getValue(BV_RM_TO_NEGATIVE);
    const tz = getValue(BV_RM_TO_ZERO);
    const c1 = manager.mkEq(rm, this.num(BV_RM_TO_NEGATIVE, 3));
    const c2 = manager.mkEq(rm, this.num(BV_RM_TO_POSITIVE, 3));
    const c3 = manager.mkEq(rm, this.num(BV_RM_TIES_TO_AWAY, 3));
    const c4 = manager.mkEq(rm, this.num(BV_RM_TIES_TO_EVEN, 3));
    const r1 = this.mkIte(c1, tn, tz);
    const r2 = this.mkIte(c2, tp, r1);
    const r3 = this.mkIte(c3, nta, r2);
    return this.mkIte(c4, nte, r3);
  }

  mkToReal(): number {
    throw new SmtUnsupportedError("floating-point conversion to a non-numeral real");
  }

  private mkToFpBits(sort: number, rm: number, x: number, isSigned: boolean) {
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const inputSize = this.getBvSize(x);
    this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const signOrZeroBit = this.num(isSigned ? 1 : 0, 1);
    const zeroSize = this.num(0, inputSize);
    const isZero = manager.mkEq(x, zeroSize);
    const pzero = this.mkPzero(sort);
    this.mkNzero(sort);
    let sgn = signOrZeroBit;
    let abs = x;
    if (isSigned) {
      sgn = this.extract(inputSize - 1, inputSize - 1, x);
      this.extract(inputSize === 1 ? 0 : inputSize - 2, 0, x);
      const isNeg = manager.mkEq(sgn, signOrZeroBit);
      const negX = this.bv(OP_BNEG, x);
      abs = this.mkRawIte(isNeg, negX, x);
    }
    let lz = this.mkLeadingZeros(abs, inputSize);
    const shiftedSig = this.bv(OP_BSHL, abs, lz);
    const sigSize = sbits + 4;
    let size = inputSize;
    let sig4: number;
    if (sigSize <= size) {
      const sigHigh = this.extract(size - 1, size - sigSize + 1, shiftedSig);
      const sigRest = this.extract(size - sigSize, 0, shiftedSig);
      sig4 = this.concat(sigHigh, this.bv(OP_BREDOR, sigRest));
    } else {
      const extraBits = sigSize - size;
      const extraZeros = this.num(0, extraBits);
      sig4 = this.concat(shiftedSig, extraZeros);
      const lzExt = this.concat(extraZeros, lz);
      const lzOffset = this.num(extraBits, sigSize);
      lz = this.bv(OP_BADD, lzExt, lzOffset);
      size += extraBits;
    }
    const sExp = this.bv(OP_BSUB, this.num(size - 2, size), lz);
    const expSize = ebits + 2;
    let exp2 = this.extract(expSize - 1, 0, sExp);
    const expWorstCaseSize = Math.floor(Math.log(size) / Math.log(2) + 1);
    if (expSize <= expWorstCaseSize) {
      const maxExp = this.mkMaxExp(expSize);
      const maxExpBvSize = this.zeroExtend(size - expSize, maxExp);
      const expTooLarge = this.bv(OP_SLEQ, this.bv(OP_BADD, maxExpBvSize, this.num(1, size)), sExp);
      const zeroSigSize = this.num(0, sigSize);
      sig4 = this.mkRawIte(expTooLarge, zeroSigSize, sig4);
      exp2 = this.mkRawIte(expTooLarge, maxExp, exp2);
    }
    const v2 = this.round(sort, rm, sgn, sig4, exp2);
    return this.mkIte(isZero, pzero, v2);
  }

  mkToFpSigned(sort: number, rm: number, x: number) {
    return this.mkToFpBits(sort, rm, x, true);
  }

  mkToFpUnsigned(sort: number, rm: number, x: number) {
    return this.mkToFpBits(sort, rm, x, false);
  }

  protected mkBvUf(decl: number, domain: number[], range: number) {
    const existing = this.uf2BvUf.get(decl);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const result = manager.mkFreshFuncDecl(null, domain, range);
    this.uf2BvUf.set(decl, result);
    manager.incDeclRef(decl);
    manager.incDeclRef(result);
    return result;
  }

  private joinFp(expr: number) {
    const [sgn, exp, sig] = this.splitFp(expr);
    return this.concat(this.concat(sgn, exp), sig);
  }

  private nanWrap(expr: number) {
    const argIsNan = this.mkIsNan(expr);
    const nan = this.mkNan(this.manager.sorts[expr]);
    const nanBv = this.joinFp(nan);
    const exprBv = this.joinFp(expr);
    return this.mkRawIte(argIsNan, nanBv, exprBv);
  }

  mkToIeeeBv(decl: number, x: number) {
    const manager = this.manager;
    const xIsNan = this.mkIsNan(x);
    const ebits = manager.getEbits(manager.sorts[x]);
    const sbits = manager.getSbits(manager.sorts[x]);
    const wrapped = this.nanWrap(x);
    const range = manager.funcDecls[decl].range;
    const unspecified = manager.mkApp(
      this.mkBvUf(decl, [manager.sorts[wrapped]], range),
      [wrapped],
      range,
    );
    const expBv = this.extract(ebits + sbits - 2, sbits - 1, unspecified);
    this.extraAssertions.push(manager.mkEq(expBv, this.bv(OP_BNEG, this.num(1, ebits))));
    const sigBv = this.extract(sbits - 2, 0, unspecified);
    this.extraAssertions.push(manager.mkNot(manager.mkEq(sigBv, this.num(0, sbits - 1))));
    const sgnExpSig = this.joinFp(x);
    return this.simpIte(xIsNan, unspecified, sgnExpSig);
  }

  mkToBv(decl: number, rmArg: number, x: number, isSigned: boolean) {
    const manager = this.manager;
    const rm = manager.getArg(rmArg, 0);
    const xSort = manager.sorts[x];
    const range = manager.funcDecls[decl].range;
    const unpacked = this.unpack(x, true);
    const ebits = manager.getEbits(xSort);
    const sbits = manager.getSbits(xSort);
    const size = manager.funcDecls[decl].parameters[0];
    const zeroBit = this.num(0, 1);
    const oneBit = this.num(1, 1);
    const xIsNan = this.mkIsNan(x);
    const xIsInf = this.mkIsInf(x);
    const xIsZero = this.mkIsZero(x);
    const xIsNeg = this.mkIsNeg(x);
    this.mkIsNzero(x);
    const c1 = this.mkOr(xIsNan, xIsInf);
    const wrapped = this.nanWrap(x);
    const unspecified = manager.mkApp(
      this.mkBvUf(decl, [manager.sorts[rm], manager.sorts[wrapped]], range),
      [rm, wrapped],
      range,
    );
    const v2 = this.num(0, size);
    const sig =
      sbits < size + 3 ? this.concat(unpacked.sig, this.num(0, size - sbits + 3)) : unpacked.sig;
    const sigSize = this.getBvSize(sig);
    const expExt = this.signExtend(2, unpacked.exp);
    const lzExt = this.zeroExtend(2, unpacked.lz);
    const expMLz = this.bv(OP_BSUB, expExt, lzExt);
    const bigSig = this.concat(this.zeroExtend(size + 2, sig), zeroBit);
    const bigSigSize = sigSize + 1 + size + 2;
    const isNegShift = this.bv(OP_SLEQ, expMLz, this.num(0, ebits + 2));
    let shift = this.mkRawIte(isNegShift, this.bv(OP_BNEG, expMLz), expMLz);
    if (ebits + 2 < bigSigSize) shift = this.zeroExtend(bigSigSize - ebits - 2, shift);
    else if (ebits + 2 > bigSigSize) {
      const upper = this.extract(ebits + 1, bigSigSize, shift);
      const lower = this.extract(bigSigSize - 1, 0, shift);
      const upperIsZero = manager.mkEq(upper, this.num(0, this.getBvSize(upper)));
      const maxShift = this.num(bigSigSize - 1, bigSigSize);
      shift = this.mkRawIte(upperIsZero, lower, maxShift);
    }
    const shiftLimit = this.num(size + 2, this.getBvSize(shift));
    shift = this.mkRawIte(this.bv(OP_ULEQ, shift, shiftLimit), shift, shiftLimit);
    const shiftedRight = this.bv(OP_BLSHR, bigSig, shift);
    const shiftedLeft = this.bv(OP_BSHL, bigSig, shift);
    const bigSigShifted = this.mkRawIte(isNegShift, shiftedRight, shiftedLeft);
    const intPart = this.extract(bigSigSize - 1, bigSigSize - (size + 3), bigSigShifted);
    const last = this.extract(bigSigSize - (size + 3), bigSigSize - (size + 3), bigSigShifted);
    const round = this.extract(bigSigSize - (size + 4), bigSigSize - (size + 4), bigSigShifted);
    const stickies = this.extract(bigSigSize - (size + 5), 0, bigSigShifted);
    const sticky = this.bv(OP_BREDOR, stickies);
    const roundingDecision = this.mkRoundingDecision(rm, unpacked.sgn, last, round, sticky);
    const inc = this.zeroExtend(size + 2, roundingDecision);
    let preRounded = this.bv(OP_BADD, intPart, inc);
    const incd = manager.mkEq(roundingDecision, oneBit);
    const prIsZero = manager.mkEq(preRounded, this.num(0, size + 3));
    let overflow = this.mkAnd(incd, prIsZero);
    let inRange: number;
    if (!isSigned) {
      const upperLimit = this.zeroExtend(3, this.bv(OP_BNEG, this.num(1, size)));
      const signInRange = this.mkOr(
        manager.mkNot(xIsNeg),
        manager.mkEq(preRounded, this.num(0, size + 3)),
      );
      const noOverflow = manager.mkNot(overflow);
      const magnitudeInRange = this.bv(OP_ULEQ, preRounded, upperLimit);
      inRange = this.mkAnd(signInRange, noOverflow, magnitudeInRange);
    } else {
      const lowerBase = size > 1 ? this.concat(oneBit, this.num(0, size - 1)) : oneBit;
      const lowerLimit = this.signExtend(3, lowerBase);
      const upperLimit =
        size > 1 ? this.zeroExtend(4, this.bv(OP_BNEG, this.num(1, size - 1))) : this.num(0, 4);
      overflow = this.mkOr(
        overflow,
        this.bv(OP_SLEQ, preRounded, this.bv(OP_BNEG, this.num(1, size + 3))),
      );
      preRounded = this.mkRawIte(xIsNeg, this.bv(OP_BNEG, preRounded), preRounded);
      const noOverflow = manager.mkNot(overflow);
      const aboveLower = this.bv(OP_SLEQ, lowerLimit, preRounded);
      const belowUpper = this.bv(OP_SLEQ, preRounded, upperLimit);
      inRange = this.mkAnd(noOverflow, aboveLower, belowUpper);
    }
    const rounded = this.extract(size - 1, 0, preRounded);
    const result = this.mkRawIte(manager.mkNot(inRange), unspecified, rounded);
    const withZero = this.mkRawIte(xIsZero, v2, result);
    return this.mkRawIte(c1, unspecified, withZero);
  }

  mkIsNan(expr: number) {
    const [, exp, sig] = this.splitFp(expr);
    const topExp = this.mkTopExp(this.getBvSize(exp));
    const zero = this.num(0, this.getBvSize(sig));
    const sigIsZero = this.simpEq(sig, zero);
    const sigIsNotZero = this.simpNot(sigIsZero);
    const expIsTop = this.simpEq(exp, topExp);
    return this.simpAnd(expIsTop, sigIsNotZero);
  }

  mkIsInf(expr: number) {
    const [, exp, sig] = this.splitFp(expr);
    const topExp = this.mkTopExp(this.getBvSize(exp));
    const zero = this.num(0, this.getBvSize(sig));
    const eq1 = this.simpEq(sig, zero);
    const eq2 = this.simpEq(exp, topExp);
    return this.simpAnd(eq1, eq2);
  }

  private mkIsPinf(expr: number) {
    const isPos = this.mkIsPos(expr);
    const isInf = this.mkIsInf(expr);
    return this.simpAnd(isPos, isInf);
  }

  private mkIsNinf(expr: number) {
    const isNeg = this.mkIsNeg(expr);
    const isInf = this.mkIsInf(expr);
    return this.simpAnd(isNeg, isInf);
  }

  private mkIsPos(expr: number) {
    const sgn = this.manager.getArg(expr, 0);
    return this.simpEq(sgn, this.num(0, this.getBvSize(sgn)));
  }

  private mkIsNeg(expr: number) {
    const sgn = this.manager.getArg(expr, 0);
    return this.simpEq(sgn, this.num(1, this.getBvSize(sgn)));
  }

  mkIsZero(expr: number) {
    const [, exp, sig] = this.splitFp(expr);
    const botExp = this.mkBotExp(this.getBvSize(exp));
    const zero = this.num(0, this.getBvSize(sig));
    const eq1 = this.simpEq(sig, zero);
    const eq2 = this.simpEq(exp, botExp);
    return this.simpAnd(eq1, eq2);
  }

  private mkIsNzero(expr: number) {
    const [sgn] = this.splitFp(expr);
    const isZero = this.mkIsZero(expr);
    const eq = this.simpEq(sgn, this.num(1, 1));
    return this.simpAnd(eq, isZero);
  }

  private mkIsPzero(expr: number) {
    const [sgn] = this.splitFp(expr);
    const isZero = this.mkIsZero(expr);
    const eq = this.simpEq(sgn, this.num(0, 1));
    return this.simpAnd(eq, isZero);
  }

  mkIsDenormal(expr: number) {
    const [, exp] = this.splitFp(expr);
    const zero = this.num(0, this.getBvSize(exp));
    const zexp = this.simpEq(exp, zero);
    const isZero = this.mkIsZero(expr);
    const nIsZero = this.simpNot(isZero);
    return this.simpAnd(nIsZero, zexp);
  }

  mkIsNormal(expr: number) {
    const [, exp] = this.splitFp(expr);
    const isDenormal = this.mkIsDenormal(expr);
    const isZero = this.mkIsZero(expr);
    const ebits = this.getBvSize(exp);
    const isSpecial = this.simpEq(exp, this.num(getPowerOfTwoMinusOne(ebits), ebits));
    const specialOrDenormal = this.simpOr(isSpecial, isDenormal);
    return this.simpNot(this.simpOr(isZero, specialOrDenormal));
  }

  private mkIsRm(rm: number, value: number) {
    return this.simpEq(rm, this.num(value, 3));
  }

  private mkTopExp(size: number) {
    return this.num(getPowerOfTwoMinusOne(size), size);
  }

  private mkBotExp(size: number) {
    return this.num(0, size);
  }

  private mkMinExp(ebits: number) {
    return this.num(-getPowerOfTwoMinusOne(ebits - 1) + 1n, ebits);
  }

  private mkMaxExp(ebits: number) {
    return this.num(getPowerOfTwoMinusOne(ebits - 1), ebits);
  }

  private mkLeadingZeros(expr: number, maxBits: number): number {
    const size = this.getBvSize(expr);
    if (size === 0) return this.num(0, maxBits);
    if (size === 1) {
      const nilBit = this.num(0, 1);
      const oneM = this.num(1, maxBits);
      const nilM = this.num(0, maxBits);
      const eq = this.simpEq(expr, nilBit);
      return this.simpIte(eq, oneM, nilM);
    }
    const high = this.extract(size - 1, Math.floor(size / 2), expr);
    const low = this.extract(Math.floor(size / 2) - 1, 0, expr);
    const highSize = this.getBvSize(high);
    const lzHigh = this.mkLeadingZeros(high, maxBits);
    const lzLow = this.mkLeadingZeros(low, maxBits);
    const nilH = this.num(0, highSize);
    const highIsZero = this.simpEq(high, nilH);
    const hM = this.num(highSize, maxBits);
    const sum = this.bv(OP_BADD, hM, lzLow);
    return this.simpIte(highIsZero, sum, lzHigh);
  }

  private mkBias(expr: number) {
    const ebits = this.getBvSize(expr);
    const bias = this.num(getPowerOfTwoMinusOne(ebits - 1), ebits);
    return this.bv(OP_BADD, expr, bias);
  }

  private mkUnbias(expr: number) {
    const ebits = this.getBvSize(expr);
    const plusOne = this.bv(OP_BADD, expr, this.num(1, ebits));
    const leading = this.extract(ebits - 1, ebits - 1, plusOne);
    const notLeading = this.bv(OP_BNOT, leading);
    const rest = this.extract(ebits - 2, 0, plusOne);
    return this.concat(notLeading, rest);
  }

  private unpack(expr: number, isNormalizing: boolean): Unpacked {
    const manager = this.manager;
    const sort = manager.sorts[expr];
    const sbits = manager.getSbits(sort);
    const ebits = manager.getEbits(sort);
    const [sgn, exp, sig] = this.splitFp(expr);
    const isNormal = this.mkIsNormal(expr);
    const normalSig = this.concat(this.num(1, 1), sig);
    const normalExp = this.mkUnbias(exp);
    let denormalSig = this.zeroExtend(1, sig);
    const denormalExp = this.mkUnbias(this.num(1, ebits));
    const zeroE = this.num(0, ebits);
    let lz = zeroE;
    if (isNormalizing) {
      const zeroS = this.num(0, sbits);
      const isSigZero = this.simpEq(zeroS, denormalSig);
      const lzD = this.mkLeadingZeros(denormalSig, ebits);
      const normOrZero = this.mkOr(isNormal, isSigZero);
      lz = this.simpIte(normOrZero, zeroE, lzD);
      const shift = this.simpIte(isSigZero, zeroE, lz);
      if (ebits <= sbits) {
        const extended = this.zeroExtend(sbits - ebits, shift);
        denormalSig = this.bv(OP_BSHL, denormalSig, extended);
      } else {
        const zeroEms = this.num(0, ebits - sbits);
        const sbitsS = this.num(sbits, sbits);
        const high = this.extract(ebits - 1, sbits, shift);
        const isShiftZero = this.simpEq(zeroEms, high);
        const shortShift = this.extract(sbits - 1, 0, shift);
        const shiftAmount = this.simpIte(isShiftZero, shortShift, sbitsS);
        denormalSig = this.bv(OP_BSHL, denormalSig, shiftAmount);
      }
    }
    return {
      sgn,
      sig: this.simpIte(isNormal, normalSig, denormalSig),
      exp: this.simpIte(isNormal, normalExp, denormalExp),
      lz,
    };
  }

  private mkRoundingDecision(rm: number, sgn: number, last: number, round: number, sticky: number) {
    const lastOrSticky = this.bv(OP_BOR, last, sticky);
    const roundOrSticky = this.bv(OP_BOR, round, sticky);
    this.bv(OP_BNOT, last);
    const notRound = this.bv(OP_BNOT, round);
    this.bv(OP_BNOT, sticky);
    const notLors = this.bv(OP_BNOT, lastOrSticky);
    const notRors = this.bv(OP_BNOT, roundOrSticky);
    const notSgn = this.bv(OP_BNOT, sgn);
    const incTeven = this.bv(OP_BNOT, this.bv(OP_BOR, notRound, notLors));
    const incPos = this.bv(OP_BNOT, this.bv(OP_BOR, sgn, notRors));
    const incNeg = this.bv(OP_BNOT, this.bv(OP_BOR, notSgn, notRors));
    const nilBit = this.num(0, 1);
    const rmIsToNeg = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const rmIsToPos = this.mkIsRm(rm, BV_RM_TO_POSITIVE);
    const rmIsAway = this.mkIsRm(rm, BV_RM_TIES_TO_AWAY);
    const rmIsEven = this.mkIsRm(rm, BV_RM_TIES_TO_EVEN);
    const incC4 = this.simpIte(rmIsToNeg, incNeg, nilBit);
    const incC3 = this.simpIte(rmIsToPos, incPos, incC4);
    const incC2 = this.simpIte(rmIsAway, round, incC3);
    return this.simpIte(rmIsEven, incTeven, incC2);
  }

  round(sort: number, rm: number, sgn: number, inputSig: number, inputExp: number) {
    const manager = this.manager;
    const ebits = manager.getEbits(sort);
    const sbits = manager.getSbits(sort);
    const eMin = this.mkMinExp(ebits);
    const eMax = this.mkMaxExp(ebits);
    const oneBit = this.num(1, 1);
    const hExp = this.extract(ebits + 1, ebits + 1, inputExp);
    const shExp = this.extract(ebits, ebits, inputExp);
    const thExp = this.extract(ebits - 1, ebits - 1, inputExp);
    const e3 = this.simpEq(hExp, oneBit);
    const e2 = this.simpEq(shExp, oneBit);
    const e1 = this.simpEq(thExp, oneBit);
    const e21 = this.simpOr(e2, e1);
    const ne3 = this.simpNot(e3);
    const eTopThree = this.simpAnd(ne3, e21);
    const extEmax = this.zeroExtend(2, eMax);
    const topSig = this.extract(sbits + 3, sbits + 3, inputSig);
    const eEqEmax = this.simpEq(extEmax, inputExp);
    const sigm1 = this.simpEq(topSig, oneBit);
    const eEqEmaxAndSigm1 = this.simpAnd(eEqEmax, sigm1);
    const ovf1 = this.simpOr(eTopThree, eEqEmaxAndSigm1);
    const lz = this.mkLeadingZeros(inputSig, ebits + 2);
    const t1 = this.bv(OP_BADD, inputExp, this.num(1, ebits + 2));
    const t2 = this.bv(OP_BSUB, t1, lz);
    const t = this.bv(OP_BSUB, t2, this.signExtend(2, eMin));
    const tiny = this.bv(OP_SLEQ, t, this.num(-1, ebits + 2));
    const beta = this.bv(OP_BADD, this.bv(OP_BSUB, inputExp, lz), this.num(1, ebits + 2));
    const sigmaSub = this.bv(OP_BSUB, inputExp, this.signExtend(2, eMin));
    const sigmaAdd = this.bv(OP_BADD, sigmaSub, this.num(1, ebits + 2));
    const sigma = this.simpIte(tiny, sigmaAdd, lz);
    const sigSize = this.getBvSize(inputSig);
    const sigmaSize = ebits + 2;
    const sigmaNeg = this.bv(OP_BNEG, sigma);
    let sigmaNegCapped = sigmaNeg;
    if (getLog2(sbits + 2) < sigmaSize) {
      const sigmaCap = this.num(sbits + 2, sigmaSize);
      const sigmaLeCap = this.bv(OP_ULEQ, sigmaNeg, sigmaCap);
      sigmaNegCapped = this.simpIte(sigmaLeCap, sigmaNeg, sigmaCap);
    }
    const sigmaLtZero = this.bv(OP_SLEQ, sigma, this.num(-1, sigmaSize));
    const sigExt = this.concat(inputSig, this.num(0, sigSize));
    const shiftWidth = 2 * sigSize;
    const rsShift =
      sigmaSize <= shiftWidth
        ? this.zeroExtend(shiftWidth - sigmaSize, sigmaNegCapped)
        : this.extract(shiftWidth - 1, 0, sigmaNegCapped);
    const lsShift =
      sigmaSize <= shiftWidth
        ? this.zeroExtend(shiftWidth - sigmaSize, sigma)
        : this.extract(shiftWidth - 1, 0, sigma);
    const rsSig = this.bv(OP_BLSHR, sigExt, rsShift);
    const lsSig = this.bv(OP_BSHL, sigExt, lsShift);
    const bigShSig = this.simpIte(sigmaLtZero, rsSig, lsSig);
    const sigExtractLowBit = 2 * sigSize - 1 - (sbits + 2) + 1;
    const shiftedSig = this.extract(2 * sigSize - 1, sigExtractLowBit, bigShSig);
    const stickyBit = this.bv(OP_BREDOR, this.extract(sigExtractLowBit - 1, 0, bigShSig));
    const extSticky = this.zeroExtend(sbits + 1, stickyBit);
    const stickySig = this.bv(OP_BOR, shiftedSig, extSticky);
    const extEmin = this.zeroExtend(2, eMin);
    const tinyExp = this.simpIte(tiny, extEmin, beta);
    const sticky = this.extract(0, 0, stickySig);
    const round = this.extract(1, 1, stickySig);
    const last = this.extract(2, 2, stickySig);
    const retainedSig = this.extract(sbits + 1, 2, stickySig);
    const incBit = this.mkRoundingDecision(rm, sgn, last, round, sticky);
    const sigWide = this.zeroExtend(1, retainedSig);
    const inc = this.zeroExtend(sbits, incBit);
    const incrementedSig = this.bv(OP_BADD, sigWide, inc);
    const sigTop = this.extract(sbits, sbits, incrementedSig);
    const sigOvf = this.simpEq(sigTop, oneBit);
    const hallbut1Sig = this.extract(sbits, 1, incrementedSig);
    const lallbut1Sig = this.extract(sbits - 1, 0, incrementedSig);
    const normalizedSig = this.simpIte(sigOvf, hallbut1Sig, lallbut1Sig);
    const expP1 = this.bv(OP_BADD, tinyExp, this.num(1, ebits + 2));
    const normalizedExp = this.simpIte(sigOvf, expP1, tinyExp);
    const unadjustedBiasedExp = this.mkBias(this.extract(ebits - 1, 0, normalizedExp));
    const expRedand = this.bv(OP_BREDAND, unadjustedBiasedExp);
    const preOvf2 = this.simpEq(expRedand, oneBit);
    const ovf2 = this.simpAnd(sigOvf, preOvf2);
    const pem2m1 = this.num(getPowerOfTwoMinusOne(ebits - 2), ebits);
    const biasedExp = this.simpIte(ovf2, pem2m1, unadjustedBiasedExp);
    const ovf = this.simpOr(ovf1, ovf2);
    const topExp = this.mkTopExp(ebits);
    const botExp = this.mkBotExp(ebits);
    const nilBit = this.num(0, 1);
    const rmIsToZero = this.mkIsRm(rm, BV_RM_TO_ZERO);
    const rmIsToNeg = this.mkIsRm(rm, BV_RM_TO_NEGATIVE);
    const rmIsToPos = this.mkIsRm(rm, BV_RM_TO_POSITIVE);
    const rmZeroOrNeg = this.simpOr(rmIsToZero, rmIsToNeg);
    const rmZeroOrPos = this.simpOr(rmIsToZero, rmIsToPos);
    const zeroBit = this.num(0, 1);
    const sgnIsZero = this.simpEq(sgn, zeroBit);
    const maxSig = this.num(getPowerOfTwoMinusOne(sbits - 1), sbits - 1);
    const maxExp = this.concat(
      this.num(getPowerOfTwoMinusOne(ebits - 1), ebits - 1),
      this.num(0, 1),
    );
    const infSig = this.num(0, sbits - 1);
    const maxInfExpNeg = this.simpIte(rmZeroOrPos, maxExp, topExp);
    const maxInfExpPos = this.simpIte(rmZeroOrNeg, maxExp, topExp);
    const ovflExp = this.simpIte(sgnIsZero, maxInfExpPos, maxInfExpNeg);
    const denormalBit = this.extract(sbits - 1, sbits - 1, normalizedSig);
    const nDCheck = this.simpEq(denormalBit, nilBit);
    const nDExp = this.simpIte(nDCheck, botExp, biasedExp);
    const resExp = this.simpIte(ovf, ovflExp, nDExp);
    const maxInfSigNeg = this.simpIte(rmZeroOrPos, maxSig, infSig);
    const maxInfSigPos = this.simpIte(rmZeroOrNeg, maxSig, infSig);
    const ovflSig = this.simpIte(sgnIsZero, maxInfSigPos, maxInfSigNeg);
    const restSig = this.extract(sbits - 2, 0, normalizedSig);
    const resSig = this.simpIte(ovf, ovflSig, restSig);
    return this.mkFp(sgn, resExp, resSig);
  }
}

export class WrappedFpa2BvConverter extends Fpa2BvConverter {
  constructor(
    manager: AstManager,
    simp: Rewriter,
    private wrapRewriter: Rewriter,
  ) {
    super(manager, simp);
  }

  wrap(expr: number) {
    const manager = this.manager;
    if (this.isFp(expr)) {
      const concatenation = this.concat(...this.splitFp(expr));
      const rewritten = this.wrapRewriter.rewrite(concatenation);
      manager.releaseLater(rewritten);
      return rewritten;
    }
    return mkFpaApp(manager, OP_FPA_BVWRAP, [expr]);
  }

  unwrap(expr: number, sort: number) {
    const manager = this.manager;
    if (manager.isRmSort(sort)) {
      const isRna = manager.mkEq(expr, this.num(BV_RM_TIES_TO_AWAY, 3));
      const rna = mkRmNumeral(manager, BV_RM_TIES_TO_AWAY);
      const isRne = manager.mkEq(expr, this.num(BV_RM_TIES_TO_EVEN, 3));
      const rne = mkRmNumeral(manager, BV_RM_TIES_TO_EVEN);
      const isRtn = manager.mkEq(expr, this.num(BV_RM_TO_NEGATIVE, 3));
      const rtn = mkRmNumeral(manager, BV_RM_TO_NEGATIVE);
      const isRtp = manager.mkEq(expr, this.num(BV_RM_TO_POSITIVE, 3));
      const rtp = mkRmNumeral(manager, BV_RM_TO_POSITIVE);
      const rtz = mkRmNumeral(manager, BV_RM_TO_ZERO);
      const withRtp = this.mkRawIte(isRtp, rtp, rtz);
      const withRtn = this.mkRawIte(isRtn, rtn, withRtp);
      const withRne = this.mkRawIte(isRne, rne, withRtn);
      return this.mkRawIte(isRna, rna, withRne);
    }
    const size = this.getBvSize(expr);
    const sbits = manager.getSbits(sort);
    const sgn = this.extract(size - 1, size - 1, expr);
    const exp = this.extract(size - 2, sbits - 1, expr);
    const sig = this.extract(sbits - 2, 0, expr);
    return this.mkFp(sgn, exp, sig);
  }

  override mkConst(decl: number) {
    const existing = this.constants.get(decl);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const sort = manager.funcDecls[decl].range;
    const bv = this.wrap(manager.mkApp(decl, [], sort));
    const size = this.getBvSize(bv);
    const sbits = manager.getSbits(sort);
    const sgn = this.extract(size - 1, size - 1, bv);
    const exp = this.extract(size - 2, sbits - 1, bv);
    const sig = this.extract(sbits - 2, 0, bv);
    return this.cacheConst(this.constants, decl, this.mkFp(sgn, exp, sig));
  }

  override mkRmConst(decl: number) {
    const existing = this.rmConstants.get(decl);
    if (existing !== undefined) return existing;
    const manager = this.manager;
    const bv = this.wrap(manager.mkApp(decl, [], manager.funcDecls[decl].range));
    return this.cacheConst(this.rmConstants, decl, this.mkBv2Rm(bv));
  }

  override mkUf(decl: number, args: number[]) {
    const manager = this.manager;
    const range = manager.funcDecls[decl].range;
    const result = manager.mkApp(decl, args, range);
    if (manager.isFpSort(range)) return this.unwrap(this.wrap(result), range);
    if (manager.isRmSort(range)) return this.mkBv2Rm(this.wrap(result));
    return result;
  }
}

// Ported from Z3 (src/tactic/arith/bv2real_rewriter.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_ADD,
  OP_AND,
  OP_BADD,
  OP_BMUL,
  OP_BNEG,
  OP_BSMUL_NO_OVFL,
  OP_BSMUL_NO_UDFL,
  OP_BSUB,
  OP_DIV,
  OP_EQ,
  OP_EXTRACT,
  OP_GE,
  OP_GT,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_NOT,
  OP_POWER,
  OP_SIGN_EXT,
  OP_SLEQ,
  OP_SUB,
  OP_TO_REAL,
  OP_UBV2INT,
  OP_UMINUS,
  SORT_BOOL,
  SORT_REAL,
} from "./ast";
import { mkBvApp } from "./bv-decl-plugin";
import { getNumBits } from "./bv2int-rewriter";
import { getGcd, getLcm, Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

interface Bv2Real {
  s: number;
  t: number;
  divisor: bigint;
  root: bigint;
}

export class Bv2RealUtil {
  readonly decls: number[] = [];
  readonly sideConditions: RefVector;
  readonly posLt: number;
  readonly posLe: number;
  private sig2decl = new Map<string, number>();
  private decl2sig = new Map<number, { divisor: bigint; root: bigint }>();
  readonly maxDivisor: bigint;

  constructor(
    private manager: AstManager,
    readonly defaultRoot: bigint,
    readonly defaultDivisor: bigint,
    readonly maxNumBits: number,
  ) {
    this.sideConditions = new RefVector(manager);
    this.maxDivisor = 2n * defaultDivisor;
    this.posLt = manager.mkFreshFuncDecl("<", [SORT_REAL, SORT_REAL], SORT_BOOL);
    this.posLe = manager.mkFreshFuncDecl("<=", [SORT_REAL, SORT_REAL], SORT_BOOL);
    this.addAuxDecl(this.posLt);
    this.addAuxDecl(this.posLe);
  }

  addAuxDecl(decl: number) {
    this.manager.incDeclRef(decl);
    this.decls.push(decl);
  }

  getBv2Real(expr: number): Bv2Real | undefined {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP) return undefined;
    const sig = this.decl2sig.get(manager.decls[expr]);
    if (sig === undefined) return undefined;
    return {
      s: manager.getArg(expr, 0),
      t: manager.getArg(expr, 1),
      divisor: sig.divisor,
      root: sig.root,
    };
  }

  // bv2real_util::is_bv2real(expr*, expr_ref&, expr_ref&, rational&, rational&): also a rational
  // numeral that is not an integer.
  getBv2RealOrNumeral(expr: number): Bv2Real | undefined {
    const manager = this.manager;
    const found = this.getBv2Real(expr);
    if (found !== undefined) return found;
    if (!manager.isNumeral(expr) || manager.sorts[expr] !== SORT_REAL) return undefined;
    const value = manager.getRationalValue(expr);
    return {
      s: this.mkSbv(value.num),
      t: this.mkSbv(0n),
      divisor: value.den,
      root: this.defaultRoot,
    };
  }

  containsBv2Real(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [expr];
    for (let curr = todo.pop(); curr !== undefined; curr = todo.pop()) {
      if (visited.has(curr) || manager.kinds[curr] !== KIND_APP) continue;
      visited.add(curr);
      if (this.decl2sig.has(manager.decls[curr])) return true;
      manager.pushArgs(curr, todo);
    }
    return false;
  }

  mkBv2Real(s: number, t: number, divisor: bigint, root: bigint) {
    const aligned = this.alignDivisor(s, t, divisor);
    return aligned === undefined
      ? undefined
      : this.mkBv2RealC(aligned.s, aligned.t, aligned.divisor, root);
  }

  mkBv2RealC(s: number, t: number, divisor: bigint, root: bigint) {
    const manager = this.manager;
    const sSort = manager.sorts[s];
    const tSort = manager.sorts[t];
    const key = `${manager.getBvSize(sSort)}:${manager.getBvSize(tSort)}:${divisor}:${root}`;
    let decl = this.sig2decl.get(key);
    if (decl === undefined) {
      decl = manager.mkFreshFuncDecl("bv2real", [sSort, tSort], SORT_REAL);
      this.addAuxDecl(decl);
      this.sig2decl.set(key, decl);
      this.decl2sig.set(decl, { divisor, root });
    }
    return manager.mkApp(decl, [s, t], SORT_REAL);
  }

  mkBv2RealReduced(s: number, t: number, divisor: bigint, root: bigint) {
    const manager = this.manager;
    const real = (value: Rational) => manager.mkNumeralOfSort(value, SORT_REAL);
    const mkDiv = (expr: number) =>
      manager.mkApp(OP_DIV, [expr, real(Rational.of(divisor))], SORT_REAL);
    const sReal = this.mkSbv2Real(s);
    const tReal = this.mkSbv2Real(t);
    const sDiv = mkDiv(sReal);
    const tDiv = mkDiv(tReal);
    const sqrt = manager.mkApp(
      OP_POWER,
      [real(Rational.of(root)), real(Rational.of(1n, 2n))],
      SORT_REAL,
    );
    return manager.mkApp(OP_ADD, [sDiv, manager.mkApp(OP_MUL, [tDiv, sqrt], SORT_REAL)], SORT_REAL);
  }

  private mkSbv2Real(word: number) {
    const manager = this.manager;
    const size = manager.getBvSize(manager.sorts[word]);
    const value = manager.mkApp(OP_TO_REAL, [mkBvApp(manager, OP_UBV2INT, [word])], SORT_REAL);
    const condition = mkBvApp(manager, OP_SLEQ, [manager.mkBvNumeral(0n, size), word]);
    const shifted = manager.mkApp(
      OP_SUB,
      [value, manager.mkNumeralOfSort(Rational.of(2n ** BigInt(size)), SORT_REAL)],
      SORT_REAL,
    );
    return manager.mkApp(OP_ITE, [condition, value, shifted], SORT_REAL);
  }

  mkBvMulByConstant(value: bigint, word: number) {
    return value === 1n ? word : this.mkBvMul(this.mkSbv(value), word);
  }

  alignDivisors(first: Bv2Real, second: Bv2Real) {
    if (first.divisor === second.divisor) return;
    const gcd = getGcd(first.divisor, second.divisor);
    const lcm = getLcm(first.divisor, second.divisor);
    const firstFactor = second.divisor / gcd;
    const secondFactor = first.divisor / gcd;
    first.s = this.mkBvMulByConstant(firstFactor, first.s);
    first.t = this.mkBvMulByConstant(firstFactor, first.t);
    second.s = this.mkBvMulByConstant(secondFactor, second.s);
    second.t = this.mkBvMulByConstant(secondFactor, second.t);
    first.divisor = lcm;
    second.divisor = lcm;
  }

  mkBvMul(s: number, t: number) {
    const manager = this.manager;
    if (this.isZero(s)) return s;
    if (this.isZero(t)) return t;
    let [s1, t1] = this.alignSizes(s, t);
    const size = manager.getBvSize(manager.sorts[t1]);
    const maxBits = this.maxNumBits;
    if (size < maxBits) {
      const extension = 2 * size > maxBits ? maxBits - size : size;
      s1 = this.mkExtend(extension, s1);
      t1 = this.mkExtend(extension, t1);
    }
    if (2 * size > maxBits) {
      this.sideConditions.push(mkBvApp(manager, OP_BSMUL_NO_OVFL, [s1, t1]));
      this.sideConditions.push(mkBvApp(manager, OP_BSMUL_NO_UDFL, [s1, t1]));
    }
    return mkBvApp(manager, OP_BMUL, [s1, t1]);
  }

  isZero(expr: number) {
    const manager = this.manager;
    return manager.isBvNumeral(expr) && manager.getBvNumeralValue(expr) === 0n;
  }

  mkBvAdd(s: number, t: number) {
    if (this.isZero(s)) return t;
    if (this.isZero(t)) return s;
    const [s1, t1] = this.alignSizes(s, t);
    return mkBvApp(this.manager, OP_BADD, [this.mkExtend(1, s1), this.mkExtend(1, t1)]);
  }

  alignSizes(s: number, t: number): [number, number] {
    const manager = this.manager;
    const sSize = manager.getBvSize(manager.sorts[s]);
    const tSize = manager.getBvSize(manager.sorts[t]);
    if (sSize > tSize) return [s, this.mkExtend(sSize - tSize, t)];
    if (sSize < tSize) return [this.mkExtend(tSize - sSize, s), t];
    return [s, t];
  }

  mkSbv(value: bigint) {
    const manager = this.manager;
    if (value >= 0n) return manager.mkBvNumeral(value, getNumBits(value) + 1);
    return mkBvApp(manager, OP_BNEG, [manager.mkBvNumeral(-value, getNumBits(-value) + 1)]);
  }

  mkBvSub(s: number, t: number) {
    const [s1, t1] = this.alignSizes(s, t);
    return mkBvApp(this.manager, OP_BSUB, [this.mkExtend(1, s1), this.mkExtend(1, t1)]);
  }

  mkExtend(size: number, word: number) {
    const manager = this.manager;
    if (size === 0) return word;
    if (manager.isBvNumeral(word)) {
      const value = manager.getBvNumeralValue(word);
      const width = manager.getBvSize(manager.sorts[word]);
      if (2n ** BigInt(width - 1) > value) return manager.mkBvNumeral(value, width + size);
    }
    return mkBvApp(manager, OP_SIGN_EXT, [word], [size]);
  }

  private alignDivisor(inputS: number, inputT: number, inputDivisor: bigint) {
    if (inputDivisor <= this.maxDivisor) return { s: inputS, t: inputT, divisor: inputDivisor };
    if (inputDivisor % this.maxDivisor !== 0n) return undefined;
    const overflow = inputDivisor / this.maxDivisor;
    const s = this.mkIsDivisibleBy(inputS, overflow);
    if (s === undefined) return undefined;
    const t = this.mkIsDivisibleBy(inputT, overflow);
    if (t === undefined) return undefined;
    return { s, t, divisor: this.maxDivisor };
  }

  private mkIsDivisibleBy(word: number, inputOverflow: bigint) {
    const manager = this.manager;
    let overflow = inputOverflow;
    let power2 = 0;
    while (overflow % 2n === 0n) {
      power2++;
      overflow /= 2n;
    }
    let result = word;
    if (power2 > 0) {
      const size = manager.getBvSize(manager.sorts[word]);
      if (size <= power2) {
        this.sideConditions.push(manager.mkEq(word, manager.mkBvNumeral(0n, size)));
        result = manager.mkBvNumeral(0n, 1);
      } else {
        const low = mkBvApp(manager, OP_EXTRACT, [word], [power2 - 1, 0]);
        this.sideConditions.push(manager.mkEq(low, manager.mkBvNumeral(0n, power2)));
        result = mkBvApp(manager, OP_EXTRACT, [word], [size - 1, power2]);
      }
    }
    return overflow === 1n ? result : undefined;
  }

  release() {
    this.sideConditions.reset();
    for (const decl of this.decls) this.manager.decDeclRef(decl);
  }
}

export class Bv2RealRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private util: Bv2RealUtil,
  ) {
    super(manager);
  }

  isRewritingPatterns() {
    return false;
  }

  reduceApp(decl: number, args: number[], _sort: number) {
    const manager = this.manager;
    const outer = manager.beginTemporaries();
    const result = this.mkAppCore(decl, args);
    if (result !== -1) manager.incRef(typeof result === "number" ? result : result.expr);
    manager.endTemporaries(outer);
    return result;
  }

  private mkAppCore(decl: number, args: number[]) {
    const manager = this.manager;
    const funcDecl = manager.funcDecls[decl];
    const util = this.util;
    if (funcDecl.family === FAMILY_ARITH)
      switch (funcDecl.op) {
        case OP_LE:
          return this.mkLe(args[0], args[1]);
        case OP_GE:
          return this.mkLe(args[1], args[0]);
        case OP_LT:
          return { expr: manager.mkNot(this.mkArithLe(args[1], args[0])), depth: 2 };
        case OP_GT:
          return { expr: manager.mkNot(this.mkArithLe(args[0], args[1])), depth: 2 };
        case OP_ADD:
          return this.fold(args, (left, right) => this.mkAdd(left, right));
        case OP_MUL:
          return this.fold(args, (left, right) => this.mkMul(left, right));
        case OP_SUB:
          return this.fold(args, (left, right) => this.mkSub(left, right));
        case OP_UMINUS:
          return this.mkUminus(args[0]);
        default:
          return -1;
      }
    if (funcDecl.family === FAMILY_BASIC) {
      if (funcDecl.op === OP_EQ) return this.mkEq(args[0], args[1]);
      if (funcDecl.op === OP_ITE) return this.mkIte(args[0], args[1], args[2]);
      return -1;
    }
    if (decl === util.posLt) return this.mkLeWithPolarity(args[1], args[0], false, true) ?? -1;
    if (decl === util.posLe) return this.mkLeWithPolarity(args[0], args[1], true, false) ?? -1;
    return -1;
  }

  private fold(args: number[], combine: (left: number, right: number) => number) {
    let result = args[0];
    for (let index = 1; index < args.length; index++) {
      result = combine(result, args[index]);
      if (result === -1) return -1;
    }
    return result;
  }

  private mkArithLe(left: number, right: number) {
    return this.manager.mkApp(OP_LE, [left, right], SORT_BOOL);
  }

  private getPair(s: number, t: number) {
    const util = this.util;
    const first = util.getBv2RealOrNumeral(s);
    if (first === undefined) return undefined;
    const second = util.getBv2RealOrNumeral(t);
    if (second === undefined || first.root !== second.root) return undefined;
    return [first, second];
  }

  private mkLeWithPolarity(s: number, t: number, isPositive: boolean, isNegative: boolean) {
    const manager = this.manager;
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined || pair[0].root !== 2n) return undefined;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    const s1 = util.mkBvSub(first.s, second.s);
    const s2 = util.mkBvSub(first.t, second.t);
    const s2Size = manager.getBvSize(manager.sorts[s2]);
    const leProxy = manager.mkFreshConst("le_proxy", SORT_BOOL);
    util.addAuxDecl(manager.decls[leProxy]);
    const gtProxy = manager.mkNot(leProxy);
    const isS2Nonpos = mkBvApp(manager, OP_SLEQ, [s2, manager.mkBvNumeral(0n, s2Size)]);
    const under = util.mkBvAdd(util.mkBvMulByConstant(4n, s1), util.mkBvMulByConstant(5n, s2));
    const leUnder = mkBvApp(manager, OP_SLEQ, [
      under,
      manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[under])),
    ]);
    const over = util.mkBvAdd(util.mkBvMulByConstant(2n, s1), util.mkBvMulByConstant(3n, s2));
    const leOver = mkBvApp(manager, OP_SLEQ, [
      over,
      manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[over])),
    ]);
    const mkAnd = (first: number, second: number) =>
      manager.mkApp(OP_AND, [first, second], SORT_BOOL);
    const mkImplies = (first: number, second: number) =>
      manager.mkApp(OP_IMPLIES, [first, second], SORT_BOOL);
    const isS2Pos = manager.mkApp(OP_NOT, [isS2Nonpos], SORT_BOOL);
    if (isPositive) {
      util.sideConditions.push(mkImplies(mkAnd(leProxy, isS2Nonpos), leUnder));
      util.sideConditions.push(mkImplies(mkAnd(leProxy, isS2Pos), leOver));
    }
    if (isNegative) {
      util.sideConditions.push(
        mkImplies(mkAnd(gtProxy, isS2Pos), manager.mkApp(OP_NOT, [leUnder], SORT_BOOL)),
      );
      util.sideConditions.push(
        mkImplies(mkAnd(gtProxy, isS2Nonpos), manager.mkApp(OP_NOT, [leOver], SORT_BOOL)),
      );
    }
    return isPositive ? leProxy : gtProxy;
  }

  private mkLe(s: number, t: number) {
    const manager = this.manager;
    const util = this.util;
    const withPolarity = this.mkLeWithPolarity(s, t, true, true);
    if (withPolarity !== undefined) return withPolarity;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    const t1 = util.mkBvSub(second.s, first.s);
    const t2 = util.mkBvSub(second.t, first.t);
    const zero1 = manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[t1]));
    const zero2 = manager.mkBvNumeral(0n, manager.getBvSize(manager.sorts[t2]));
    const isT1Nonneg = mkBvApp(manager, OP_SLEQ, [zero1, t1]);
    const isT1Nonpos = mkBvApp(manager, OP_SLEQ, [t1, zero1]);
    const isT2Nonneg = mkBvApp(manager, OP_SLEQ, [zero2, t2]);
    const isT2Nonpos = mkBvApp(manager, OP_SLEQ, [t2, zero2]);
    const [t12, t22] = util.alignSizes(
      util.mkBvMul(t1, t1),
      util.mkBvMulByConstant(first.root, util.mkBvMul(t2, t2)),
    );
    const mkNot = (expr: number) => manager.mkApp(OP_NOT, [expr], SORT_BOOL);
    return manager.mkAnd([
      manager.mkOr([isT1Nonneg, isT2Nonneg]),
      manager.mkOr([mkNot(isT1Nonneg), mkNot(isT2Nonpos), mkBvApp(manager, OP_SLEQ, [t22, t12])]),
      manager.mkOr([mkNot(isT2Nonneg), mkNot(isT1Nonpos), mkBvApp(manager, OP_SLEQ, [t12, t22])]),
    ]);
  }

  private mkIte(condition: number, s: number, t: number) {
    const manager = this.manager;
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    const [s1, t1] = util.alignSizes(first.s, second.s);
    const [s2, t2] = util.alignSizes(first.t, second.t);
    return (
      util.mkBv2Real(
        manager.mkApp(OP_ITE, [condition, s1, t1], manager.sorts[s1]),
        manager.mkApp(OP_ITE, [condition, s2, t2], manager.sorts[s2]),
        first.divisor,
        first.root,
      ) ?? -1
    );
  }

  private mkEq(s: number, t: number) {
    const manager = this.manager;
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    const [s1, t1] = util.alignSizes(first.s, second.s);
    const [s2, t2] = util.alignSizes(first.t, second.t);
    return manager.mkApp(OP_AND, [manager.mkEq(s1, t1), manager.mkEq(s2, t2)], SORT_BOOL);
  }

  private mkUminus(s: number) {
    const manager = this.manager;
    const util = this.util;
    const value = util.getBv2RealOrNumeral(s);
    if (value === undefined) return -1;
    const s1 = util.mkExtend(1, value.s);
    const s2 = util.mkExtend(1, value.t);
    return (
      util.mkBv2Real(
        mkBvApp(manager, OP_BNEG, [s1]),
        mkBvApp(manager, OP_BNEG, [s2]),
        value.divisor,
        value.root,
      ) ?? -1
    );
  }

  private mkAdd(s: number, t: number) {
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    return (
      util.mkBv2Real(
        util.mkBvAdd(first.s, second.s),
        util.mkBvAdd(second.t, first.t),
        first.divisor,
        first.root,
      ) ?? -1
    );
  }

  private mkMul(s: number, t: number) {
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    const u1 = util.mkBvAdd(
      util.mkBvMul(first.s, second.s),
      util.mkBvMulByConstant(first.root, util.mkBvMul(second.t, first.t)),
    );
    const u2 = util.mkBvAdd(util.mkBvMul(first.s, second.t), util.mkBvMul(first.t, second.s));
    return util.mkBv2Real(u1, u2, first.divisor * second.divisor, first.root) ?? -1;
  }

  private mkSub(s: number, t: number) {
    const util = this.util;
    const pair = this.getPair(s, t);
    if (pair === undefined) return -1;
    const [first, second] = pair;
    util.alignDivisors(first, second);
    return (
      util.mkBv2Real(
        util.mkBvSub(first.s, second.s),
        util.mkBvSub(first.t, second.t),
        first.divisor,
        first.root,
      ) ?? -1
    );
  }
}

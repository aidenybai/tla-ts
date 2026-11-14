// Ported from Z3 (src/ast/rewriter/arith_rewriter.cpp), MIT license, see z3-license.txt.
import {
  FAMILY_ARITH,
  KIND_APP,
  OP_ACOS,
  OP_ACOSH,
  OP_ADD,
  OP_ASIN,
  OP_ASINH,
  OP_ATAN,
  OP_ATANH,
  OP_COS,
  OP_COSH,
  OP_DIV,
  OP_GE,
  OP_PI,
  OP_POWER,
  OP_SIN,
  OP_SINH,
  OP_TAN,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_SEQ_LENGTH,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getEuclideanDiv, getEuclideanMod, getGcd, Rational } from "./rational";
import { type ArithRewriterOptions, PolyRewriter } from "./poly-rewriter";
import type { Rewrite } from "./rewriter-tpl";
import { shrink } from "./array";
import { Anum } from "./nlsat/algebraic";

export const KERNEL_ARITH_OPTIONS: ArithRewriterOptions = {
  isSom: true,
  isSortSums: true,
  isArithIneqLhs: true,
  isGcdRounding: true,
  isAnumSimp: true,
  isExpandPower: false,
  isExpandTan: false,
  maxDegree: 64,
};

export const TACTIC_ARITH_OPTIONS: ArithRewriterOptions = {
  isSom: false,
  isSortSums: false,
  isArithIneqLhs: false,
  isGcdRounding: false,
  isAnumSimp: true,
  isExpandPower: false,
  isExpandTan: false,
  maxDegree: 64,
};

const HALF = Rational.of(1n, 2n);
const TWO = Rational.of(2n);

const getHalfTurns = (k: Rational) => {
  const floor = k.floor();
  return Rational.of(getEuclideanMod(floor.num, 2n)).add(k).sub(floor);
};

const getCeilDiv = (dividend: bigint, divisor: bigint) => -getEuclideanDiv(-dividend, divisor);

const getSymmetricMod = (value: bigint, modulus: bigint) => {
  const remainder = getEuclideanMod(value, modulus);
  return 2n * remainder > modulus ? remainder - modulus : remainder;
};

interface GcdState {
  gcd: bigint;
  isFirst: boolean;
  numConsts: number;
}

const KIND_LE = 0;
const KIND_GE = 1;
const KIND_EQ = 2;

const getInverse = (kind: number) =>
  kind === KIND_LE ? KIND_GE : kind === KIND_GE ? KIND_LE : KIND_EQ;

export class ArithRewriter extends PolyRewriter {
  private factors: number[] = [];
  isEq2Ineq = false;

  mkLe(left: number, right: number) {
    return this.mkLeGeEq(left, right, KIND_LE);
  }

  mkGe(left: number, right: number) {
    return this.mkLeGeEq(left, right, KIND_GE);
  }

  mkLt(left: number, right: number) {
    return this.reduce(this.manager.mkNot(this.mkAtom(right, left, KIND_LE)), 2);
  }

  mkGt(left: number, right: number) {
    return this.reduce(this.manager.mkNot(this.mkAtom(left, right, KIND_LE)), 2);
  }

  mkEq(left: number, right: number) {
    const manager = this.manager;
    if (this.isEq2Ineq)
      return this.reduce(
        manager.mkAnd([
          manager.mkApp(OP_LE, [left, right], SORT_BOOL),
          manager.mkApp(OP_GE, [left, right], SORT_BOOL),
        ]),
        2,
      );
    if (!this.isArithTerm(left) && !this.isArithTerm(right)) return undefined;
    return this.mkLeGeEq(left, right, KIND_EQ);
  }

  private mkIdivApp(left: number, right: number) {
    return this.manager.mkApp(OP_IDIV, [left, right], SORT_INT);
  }

  private mkModApp(left: number, right: number) {
    return this.manager.mkApp(OP_MOD, [left, right], SORT_INT);
  }

  private mkFlatMulApp(args: number[]) {
    return args.length === 1 ? args[0] : this.manager.mkApp(OP_MUL, args, SORT_INT);
  }

  private mkIntIte(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], SORT_INT);
  }

  private getFlatMul(expr: number) {
    const args = [expr];
    for (let index = 0; index < args.length; index++) {
      if (!this.isMul(args[index])) continue;
      this.manager.pushArgs(args[index], args);
      args[index] = args[args.length - 1];
      args.pop();
      index--;
    }
    return args;
  }

  private removeFactor(factor: number, args: number[]) {
    const index = args.indexOf(factor);
    args[index] = args[args.length - 1];
    args.pop();
  }

  private removeDivisor(factor: number, dividend: number, divisor: number) {
    const manager = this.manager;
    const dividendArgs = this.getFlatMul(dividend);
    const divisorArgs = this.getFlatMul(divisor);
    this.removeFactor(factor, dividendArgs);
    this.removeFactor(factor, divisorArgs);
    const zero = manager.mkNumeral(0n);
    const newDividend =
      dividendArgs.length === 0 ? manager.mkNumeral(1n) : this.mkFlatMulApp(dividendArgs);
    const newDivisor =
      divisorArgs.length === 0 ? manager.mkNumeral(1n) : this.mkFlatMulApp(divisorArgs);
    return this.mkIntIte(
      manager.mkEq(zero, factor),
      this.mkIdivApp(zero, zero),
      this.mkIntIte(
        manager.mkApp(OP_GE, [factor, zero], SORT_BOOL),
        this.mkIdivApp(newDividend, newDivisor),
        this.mkIdivApp(
          manager.mkApp(OP_UMINUS, [newDividend], SORT_INT),
          manager.mkApp(OP_UMINUS, [newDivisor], SORT_INT),
        ),
      ),
    );
  }

  private getDivides(dividend: number, divisor: number) {
    const manager = this.manager;
    const dividendArgs = this.getFlatMul(dividend);
    const divisorArgs = this.getFlatMul(divisor);
    let dividendValue = 1n;
    let divisorValue = 1n;
    let dividendNumeral: number | undefined;
    let divisorNumeral: number | undefined;
    const marked = new Set(dividendArgs);
    for (const arg of dividendArgs) {
      const value = manager.getNumeral(arg);
      if (value === undefined) continue;
      dividendValue = value;
      dividendNumeral = arg;
    }
    for (const arg of divisorArgs) {
      const value = manager.getNumeral(arg);
      // Z3 stores a common factor of -1 as the dividend's value, or (div (* -1 x) (* -1 y)) diverges.
      if (marked.has(arg) && value !== -1n) return this.removeDivisor(arg, dividend, divisor);
      if (marked.has(arg)) dividendValue = -1n;
      if (value === undefined) continue;
      divisorValue = value;
      divisorNumeral = arg;
    }
    const gcd = getGcd(dividendValue, divisorValue);
    if (gcd === 1n) return undefined;
    const reduced = (args: number[], numeral: number | undefined, value: bigint) => {
      const index = args.indexOf(numeral ?? -1);
      if (index !== -1) args[index] = manager.mkNumeral(value / gcd);
      return this.mkFlatMulApp(args);
    };
    return this.mkIdivApp(
      reduced(dividendArgs, dividendNumeral, dividendValue),
      reduced(divisorArgs, divisorNumeral, divisorValue),
    );
  }

  mkIdiv(left: number, right: number) {
    const manager = this.manager;
    this.currSort = SORT_INT;
    const dividend = manager.getNumeral(left);
    const divisor = manager.getNumeral(right);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0n)
      return manager.mkNumeral(getEuclideanDiv(dividend, divisor));
    if (divisor === 1n) return left;
    if (divisor === -1n) return this.reduce(this.mkFlatMulApp([manager.mkNumeral(-1n), left]), 1);
    if (divisor === 0n) return undefined;
    const zero = manager.mkNumeral(0n);
    if (left === right)
      return this.reduce(
        this.mkIntIte(manager.mkEq(left, zero), this.mkIdivApp(zero, zero), manager.mkNumeral(1n)),
        3,
      );
    if (divisor !== undefined && divisor > 0n && this.isAdd(left)) {
      let isChanged = false;
      let added = 0n;
      const args = manager.mapArgs(left, (arg) => {
        const value = manager.getNumeral(arg);
        if (value === undefined || value <= 0n || getEuclideanMod(value, divisor) === value)
          return arg;
        isChanged = true;
        added += getEuclideanDiv(value, divisor);
        return manager.mkNumeral(getEuclideanMod(value, divisor));
      });
      if (isChanged)
        return this.reduce(
          this.mkAddApp([
            manager.mkNumeral(added),
            this.mkIdivApp(manager.mkApp(OP_ADD, args, SORT_INT), right),
          ]),
          3,
        );
    }
    const divided = this.getDivides(left, right);
    if (divided === undefined) return undefined;
    return this.reduce(
      this.mkIntIte(manager.mkEq(zero, right), this.mkIdivApp(left, zero), divided),
      Infinity,
    );
  }

  mkRem(left: number, right: number) {
    const manager = this.manager;
    this.currSort = SORT_INT;
    const dividend = manager.getNumeral(left);
    const divisor = manager.getNumeral(right);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0n) {
      const remainder = getEuclideanMod(dividend, divisor);
      return manager.mkNumeral(divisor < 0n ? -remainder : remainder);
    }
    if (divisor === 1n) return manager.mkNumeral(0n);
    if (divisor !== undefined && divisor !== 0n) {
      if (this.isAdd(left) || this.isMul(left)) return undefined;
      return divisor < 0n
        ? this.reduce(manager.mkApp(OP_UMINUS, [this.mkModApp(left, right)], SORT_INT), 2)
        : this.reduce(this.mkModApp(left, right), 1);
    }
    if (!this.options.isElimRem) return undefined;
    const mod = this.mkModApp(left, right);
    const isNonnegative = manager.mkApp(OP_GE, [right, manager.mkNumeral(0n)], SORT_BOOL);
    return this.reduce(
      this.mkIntIte(isNonnegative, mod, manager.mkApp(OP_UMINUS, [mod], SORT_INT)),
      3,
    );
  }

  mkMod(left: number, right: number) {
    const manager = this.manager;
    this.currSort = SORT_INT;
    const dividend = manager.getNumeral(left);
    const divisor = manager.getNumeral(right);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0n)
      return manager.mkNumeral(getEuclideanMod(dividend, divisor));
    if (divisor === 1n || divisor === -1n) return manager.mkNumeral(0n);
    const zero = manager.mkNumeral(0n);
    if (left === right && divisor === undefined)
      return this.mkIntIte(manager.mkEq(right, zero), this.mkModApp(zero, zero), zero);
    if (manager.getOp(left) === OP_MOD && manager.getArg(left, 1) === right) {
      if (divisor !== undefined && divisor !== 0n) return left;
      if (divisor === undefined)
        return this.reduce(
          this.mkIntIte(
            manager.mkEq(right, zero),
            this.mkModApp(this.mkModApp(manager.getArg(left, 0), zero), zero),
            left,
          ),
          2,
        );
    }
    if (divisor !== undefined && divisor > 0n && (this.isAdd(left) || this.isMul(left))) {
      let isChanged = false;
      const args = manager.mapArgs(left, (arg) => {
        const value = manager.getNumeral(arg);
        if (value !== undefined && getEuclideanMod(value, divisor) !== value) {
          isChanged = true;
          return manager.mkNumeral(getEuclideanMod(value, divisor));
        }
        if (manager.getOp(arg) === OP_MOD && manager.getArg(arg, 1) === right) {
          isChanged = true;
          return manager.getArg(arg, 0);
        }
        const coefficient =
          this.isMul(arg) && manager.getNumArgs(arg) === 2
            ? manager.getNumeral(manager.getArg(arg, 0))
            : undefined;
        if (coefficient !== undefined && getSymmetricMod(coefficient, divisor) !== coefficient) {
          isChanged = true;
          return manager.mkApp(
            OP_MUL,
            [manager.mkNumeral(getSymmetricMod(coefficient, divisor)), manager.getArg(arg, 1)],
            SORT_INT,
          );
        }
        return arg;
      });
      if (isChanged)
        return this.reduce(
          this.mkModApp(manager.mkApp(manager.decls[left], args, SORT_INT), right),
          3,
        );
    }
    if (divisor === undefined && this.isAdd(left)) {
      const args: number[] = [];
      for (let index = 0; index < manager.getNumArgs(left); index++) {
        const arg = manager.getArg(left, index);
        if (
          arg !== right &&
          !(
            this.isMul(arg) &&
            manager.getNumArgs(arg) === 2 &&
            ((manager.isNumeral(manager.getArg(arg, 0)) && manager.getArg(arg, 1) === right) ||
              (manager.isNumeral(manager.getArg(arg, 1)) && manager.getArg(arg, 0) === right))
          )
        )
          args.push(arg);
      }
      if (args.length < manager.getNumArgs(left))
        return this.reduce(this.mkModApp(args.length === 0 ? zero : this.mkAddApp(args), right), 3);
    }
    const factor =
      this.isMul(left) && manager.getNumArgs(left) === 2
        ? manager.getNumeral(manager.getArg(left, 0))
        : undefined;
    if (
      divisor !== undefined &&
      divisor > 0n &&
      factor !== undefined &&
      factor > 0n &&
      divisor % factor === 0n
    )
      return this.reduce(
        manager.mkApp(
          OP_MUL,
          [
            manager.mkNumeral(factor),
            this.mkModApp(manager.getArg(left, 1), manager.mkNumeral(divisor / factor)),
          ],
          SORT_INT,
        ),
        1,
      );
    if (
      this.isMul(right) &&
      manager.getNumArgs(right) === 2 &&
      manager.getNumeral(manager.getArg(right, 0)) === -1n
    )
      return this.reduce(this.mkModApp(left, manager.getArg(right, 1)), 1);
    if (manager.getOp(right) === OP_ITE)
      return this.reduce(
        this.mkIntIte(
          manager.getArg(right, 0),
          this.mkModApp(left, manager.getArg(right, 1)),
          this.mkModApp(left, manager.getArg(right, 2)),
        ),
        3,
      );
    return undefined;
  }

  mkAbs(arg: number) {
    const manager = this.manager;
    const sort = manager.sorts[arg];
    return this.reduce(
      manager.mkApp(
        OP_ITE,
        [
          this.mkAtom(arg, manager.mkNumeralOfSort(Rational.zero, sort), KIND_GE),
          arg,
          manager.mkApp(OP_UMINUS, [arg], sort),
        ],
        sort,
      ),
      2,
    );
  }

  override mkAddCore(args: number[]) {
    if (!this.isAnumSimpTarget(args)) return super.mkAddCore(args);
    const folded = this.foldAnums(args, true);
    if (typeof folded === "number") return folded;
    return super.mkAddCore(folded) ?? this.manager.mkApp(OP_ADD, folded, SORT_REAL);
  }

  override mkMul(args: number[]) {
    if (!this.isAnumSimpTarget(args)) return super.mkMul(args);
    const folded = this.foldAnums(args, false);
    if (typeof folded === "number") return folded;
    return super.mkMul(folded) ?? this.manager.mkApp(OP_MUL, folded, SORT_REAL);
  }

  private isSimpAlgebraic(expr: number) {
    const manager = this.manager;
    return (
      manager.isAlgebraicNumeral(expr) &&
      manager.am.degree(manager.getAlgebraicValue(expr)) <= this.options.maxDegree
    );
  }

  private isAnumSimpTarget(args: number[]) {
    if (!this.options.isAnumSimp) return false;
    let numIrrational = 0;
    let numRational = 0;
    for (const arg of args) {
      if (this.manager.isNumeral(arg)) {
        numRational++;
        if (numIrrational > 0) return true;
      }
      if (this.isSimpAlgebraic(arg)) {
        numIrrational++;
        if (numIrrational > 1 || numRational > 0) return true;
      }
    }
    return false;
  }

  private foldAnums(args: number[], isAdd: boolean) {
    const manager = this.manager;
    const am = manager.am;
    const identity = isAdd ? Rational.zero : Rational.one;
    const combine = (first: Anum, second: Anum) =>
      isAdd ? am.add(first, second) : am.mul(first, second);
    let result = new Anum(identity);
    const newArgs: number[] = [];
    for (const arg of args) {
      const degree = am.degree(result);
      if (degree > 1 && degree > this.options.maxDegree) {
        newArgs.push(manager.mkAlgebraicNumeral(result));
        result = new Anum(identity);
      }
      if (manager.isNumeral(arg)) result = combine(result, new Anum(this.getValue(arg)));
      else if (this.isSimpAlgebraic(arg)) result = combine(result, manager.getAlgebraicValue(arg));
      else newArgs.push(arg);
    }
    if (newArgs.length === 0) return manager.mkAlgebraicNumeral(result);
    newArgs.push(manager.mkAlgebraicNumeral(result));
    return newArgs;
  }

  private getAlgebraicValue(expr: number): Anum | undefined {
    const manager = this.manager;
    const am = manager.am;
    if (manager.isNumeral(expr)) return new Anum(this.getValue(expr));
    if (manager.isAlgebraicNumeral(expr)) return am.copy(manager.getAlgebraicValue(expr));
    const op = manager.getOp(expr);
    if ((op !== OP_ADD && op !== OP_MUL) || manager.getNumArgs(expr) !== 2) return undefined;
    const first = this.getAlgebraicValue(manager.getArg(expr, 0));
    const second = first && this.getAlgebraicValue(manager.getArg(expr, 1));
    if (first === undefined || second === undefined) return undefined;
    return op === OP_ADD ? am.add(first, second) : am.mul(first, second);
  }

  private mkAnumDiv(left: number, right: number) {
    const manager = this.manager;
    const am = manager.am;
    const isLeftAlgebraic = manager.isAlgebraicNumeral(left);
    const isRightAlgebraic = manager.isAlgebraicNumeral(right);
    if (isLeftAlgebraic && manager.isNumeral(right)) {
      if (this.getValue(right).isZero()) return undefined;
      return manager.mkAlgebraicNumeral(
        am.div(manager.getAlgebraicValue(left), new Anum(this.getValue(right))),
      );
    }
    if (isLeftAlgebraic && isRightAlgebraic) {
      if (!this.isSimpAlgebraic(left) || !this.isSimpAlgebraic(right)) return undefined;
      return manager.mkAlgebraicNumeral(
        am.div(manager.getAlgebraicValue(left), manager.getAlgebraicValue(right)),
      );
    }
    return manager.mkAlgebraicNumeral(
      am.div(new Anum(this.getValue(left)), manager.getAlgebraicValue(right)),
    );
  }

  private ensureReal(expr: number) {
    const manager = this.manager;
    return manager.isInt(expr) ? manager.mkApp(OP_TO_REAL, [expr], SORT_REAL) : expr;
  }

  private mkPowerApp(base: number, exponent: number) {
    return this.manager.mkApp(OP_POWER, [base, exponent], SORT_REAL);
  }

  mkPower(base: number, exponent: number): number | Rewrite | undefined {
    const manager = this.manager;
    const maxDegree = this.options.maxDegree;
    const x = manager.isNumeral(base) ? this.getValue(base) : undefined;
    const y = manager.isNumeral(exponent) ? this.getValue(exponent) : undefined;
    const isSmall = (value: Rational) =>
      value.isInt() && value.num >= 0n && value.num <= BigInt(maxDegree);
    if (x?.equals(Rational.one)) return manager.mkRealNumeral(x);
    if (y?.equals(Rational.one)) return this.reduce(this.ensureReal(base), 1);
    if (x !== undefined && y !== undefined) {
      if (x.isZero() && y.isZero()) return undefined;
      if (y.isZero()) return manager.mkRealNumeral(Rational.one);
      if (x.isZero()) return manager.mkRealNumeral(x);
      if (isSmall(y)) return manager.mkRealNumeral(x.pow(Number(y.num)));
      if (isSmall(y.neg())) return manager.mkRealNumeral(Rational.one.div(x).pow(Number(-y.num)));
      if (y.equals(Rational.minusOne)) return manager.mkRealNumeral(Rational.one.div(x));
    }
    if (manager.getOp(base) === OP_POWER && y !== undefined && y.isInt() && !y.isZero()) {
      const innerExponent = manager.getArg(base, 1);
      const inner = manager.isNumeral(innerExponent) ? this.getValue(innerExponent) : undefined;
      if (inner !== undefined && inner.isInt() && inner.isPositive())
        return this.reduce(
          this.mkPowerApp(
            this.ensureReal(manager.getArg(base, 0)),
            manager.mkRealNumeral(y.mul(inner)),
          ),
          2,
        );
    }
    const mkZeroIte = (otherwise: number) =>
      manager.mkApp(
        OP_ITE,
        [
          manager.mkEq(base, manager.mkNumeralOfSort(Rational.zero, manager.sorts[base])),
          manager.mkRealNumeral(Rational.zero),
          otherwise,
        ],
        SORT_REAL,
      );
    if (y?.equals(Rational.minusOne)) {
      const one = manager.mkRealNumeral(Rational.one);
      const quotient = manager.mkApp(OP_DIV, [one, this.ensureReal(base)], SORT_REAL);
      return this.reduce(mkZeroIte(quotient), 2);
    }
    if (y?.isNegative()) {
      const one = manager.mkRealNumeral(Rational.one);
      const quotient = manager.mkApp(OP_DIV, [one, this.ensureReal(base)], SORT_REAL);
      return this.reduce(mkZeroIte(this.mkPowerApp(quotient, manager.mkRealNumeral(y.neg()))), 3);
    }
    if (y !== undefined && !y.isInt() && y.num !== 1n) {
      const root = this.mkPowerApp(
        this.ensureReal(base),
        manager.mkRealNumeral(Rational.of(1n, y.den)),
      );
      return this.reduce(this.mkPowerApp(root, manager.mkRealNumeral(Rational.of(y.num))), 3);
    }
    const isArithBase =
      manager.kinds[base] === KIND_APP &&
      manager.funcDecls[manager.decls[base]].family === FAMILY_ARITH;
    if (
      (this.options.isExpandPower || (this.options.isSom && isArithBase)) &&
      y !== undefined &&
      isSmall(y) &&
      y.num > 1n
    ) {
      const factors = Array.from({ length: Number(y.num) }, () => base);
      return this.reduce(this.ensureReal(manager.mkApp(OP_MUL, factors, manager.sorts[base])), 2);
    }
    if (y === undefined || y.isZero()) return undefined;
    const isIrrationalBase = manager.isAlgebraicNumeral(base);
    if (x === undefined && !isIrrationalBase) return undefined;
    const isNegativeExponent = y.isNegative();
    const numerator = isNegativeExponent ? -y.num : y.num;
    if (numerator > BigInt(maxDegree) || y.den > BigInt(maxDegree)) return undefined;
    const am = manager.am;
    const finish = (value: Anum) => {
      if (isNegativeExponent) am.inv(value);
      return manager.mkAlgebraicNumeral(value);
    };
    if (x !== undefined) {
      const power = x.pow(Number(numerator));
      if (power.isNegative() && y.den % 2n === 0n) return undefined;
      const exact = power.root(Number(y.den));
      if (exact !== undefined)
        return manager.mkRealNumeral(isNegativeExponent ? Rational.one.div(exact) : exact);
      if (!this.options.isAnumSimp) return undefined;
      return finish(am.root(new Anum(power), Number(y.den)));
    }
    const value = manager.getAlgebraicValue(base);
    if (!this.options.isAnumSimp || am.degree(value) > maxDegree) return undefined;
    return finish(am.root(am.power(value, Number(numerator)), Number(y.den)));
  }

  private isPi(expr: number) {
    return this.manager.getOp(expr) === OP_PI;
  }

  private isBinary(expr: number, op: number) {
    const manager = this.manager;
    return manager.getOp(expr) === op && manager.getNumArgs(expr) === 2;
  }

  private getPiMultiple(expr: number) {
    const manager = this.manager;
    if (this.isPi(expr)) return Rational.one;
    if (!this.isBinary(expr, OP_MUL) || !this.isPi(manager.getArg(expr, 1))) return undefined;
    const coefficient = manager.getArg(expr, 0);
    return manager.isNumeral(coefficient) ? this.getValue(coefficient) : undefined;
  }

  private getPiOffset(expr: number) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD) return undefined;
    for (let index = 0; index < manager.getNumArgs(expr); index++) {
      const term = manager.getArg(expr, index);
      const k = this.getPiMultiple(term);
      if (k !== undefined) return { k, term };
    }
    return undefined;
  }

  private isPiTimesToReal(first: number, second: number) {
    const manager = this.manager;
    return (
      (this.isPi(first) && manager.getOp(second) === OP_TO_REAL) ||
      (manager.getOp(first) === OP_TO_REAL && this.isPi(second))
    );
  }

  private isTwoPiInteger(expr: number) {
    const manager = this.manager;
    if (!this.isBinary(expr, OP_MUL)) return false;
    const coefficient = manager.getArg(expr, 0);
    const product = manager.getArg(expr, 1);
    if (!manager.isNumeral(coefficient)) return false;
    const k = this.getValue(coefficient);
    return (
      k.isInt() &&
      getEuclideanMod(k.num, 2n) === 0n &&
      this.isBinary(product, OP_MUL) &&
      this.isPiTimesToReal(manager.getArg(product, 0), manager.getArg(product, 1))
    );
  }

  private isPiInteger(expr: number) {
    const manager = this.manager;
    if (!this.isBinary(expr, OP_MUL)) return false;
    const first = manager.getArg(expr, 0);
    const second = manager.getArg(expr, 1);
    if (!manager.isNumeral(first)) return this.isPiTimesToReal(first, second);
    if (!this.getValue(first).isInt() || !this.isBinary(second, OP_MUL)) return false;
    return this.isPiTimesToReal(manager.getArg(second, 0), manager.getArg(second, 1));
  }

  private findSummand(expr: number, isMatching: (term: number) => boolean) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_ADD) return undefined;
    for (let index = 0; index < manager.getNumArgs(expr); index++)
      if (isMatching(manager.getArg(expr, index))) return manager.getArg(expr, index);
    return undefined;
  }

  private mkReal(value: Rational) {
    return this.manager.mkRealNumeral(value);
  }

  private mkRealApp(op: number, args: number[]) {
    return this.manager.mkApp(op, args, SORT_REAL);
  }

  private mkSqrt(value: Rational) {
    return this.mkPowerApp(this.mkReal(value), this.mkReal(HALF));
  }

  private mkSinValue(k: Rational) {
    const turns = getHalfTurns(k);
    const isNegative = turns.compare(Rational.one) >= 0;
    const kPrime = isNegative ? turns.sub(Rational.one) : turns;
    const mkSigned = (expr: number) => (isNegative ? this.mkRealApp(OP_UMINUS, [expr]) : expr);
    const is = (num: bigint, den: bigint) => kPrime.equals(Rational.of(num, den));
    if (kPrime.isZero() || kPrime.equals(Rational.one)) return this.mkReal(Rational.zero);
    if (is(1n, 2n)) return this.mkReal(isNegative ? Rational.minusOne : Rational.one);
    if (is(1n, 6n) || is(5n, 6n)) return this.mkReal(Rational.of(isNegative ? -1n : 1n, 2n));
    if (is(1n, 4n) || is(3n, 4n)) return mkSigned(this.mkSqrt(HALF));
    if (is(1n, 3n) || is(2n, 3n))
      return mkSigned(this.mkRealApp(OP_DIV, [this.mkSqrt(Rational.of(3n)), this.mkReal(TWO)]));
    const isLow = is(1n, 12n) || is(11n, 12n);
    if (isLow || is(5n, 12n) || is(7n, 12n)) {
      const six = this.mkSqrt(Rational.of(6n));
      const two = this.mkSqrt(TWO);
      const sum = this.mkRealApp(isLow ? OP_SUB : OP_ADD, [six, two]);
      return mkSigned(this.mkRealApp(OP_DIV, [sum, this.mkReal(Rational.of(4n))]));
    }
    return undefined;
  }

  private mkWithoutTerm(op: number, arg: number, term: number, isNegated: boolean) {
    const app = this.mkRealApp(op, [this.mkRealApp(OP_SUB, [arg, term])]);
    return isNegated ? this.reduce(this.mkRealApp(OP_UMINUS, [app]), 3) : this.reduce(app, 2);
  }

  private mkSinCos(arg: number, isSin: boolean): number | Rewrite | undefined {
    const manager = this.manager;
    const op = manager.getOp(arg);
    const inverse = manager.getNumArgs(arg) === 1 ? manager.getArg(arg, 0) : -1;
    if (op === (isSin ? OP_ASIN : OP_ACOS)) return inverse;
    if (isSin && op === OP_ACOS) {
      const square = this.mkRealApp(OP_MUL, [inverse, inverse]);
      const difference = this.mkRealApp(OP_SUB, [this.mkReal(Rational.one), square]);
      return this.reduce(this.mkPowerApp(difference, this.mkReal(HALF)), Infinity);
    }
    if (manager.isNumeral(arg) && this.getValue(arg).isZero())
      return isSin ? arg : this.mkReal(Rational.one);
    const multiple = this.getPiMultiple(arg);
    const value =
      multiple === undefined ? undefined : this.mkSinValue(isSin ? multiple : multiple.add(HALF));
    if (value !== undefined) return this.reduce(value, Infinity);
    const offset = this.getPiOffset(arg);
    if (offset !== undefined) {
      const turns = getHalfTurns(offset.k);
      const quarter = turns.isZero()
        ? 0
        : turns.equals(HALF)
          ? 1
          : turns.equals(Rational.one)
            ? 2
            : turns.equals(Rational.of(3n, 2n))
              ? 3
              : -1;
      if (quarter !== -1) {
        // sin(x + q pi/2) is sin, cos, -sin, -cos, and cos(x + q pi/2) is cos, -sin, -cos, sin.
        const shifted = isSin ? quarter : quarter + 1;
        return this.mkWithoutTerm(
          shifted % 2 === 0 ? OP_SIN : OP_COS,
          arg,
          offset.term,
          shifted % 4 >= 2,
        );
      }
    }
    const term = this.findSummand(arg, (summand) => this.isTwoPiInteger(summand));
    if (term !== undefined) return this.mkWithoutTerm(isSin ? OP_SIN : OP_COS, arg, term, false);
    return undefined;
  }

  mkSin(arg: number) {
    return this.mkSinCos(arg, true);
  }

  mkCos(arg: number) {
    return this.mkSinCos(arg, false);
  }

  mkTan(arg: number): number | Rewrite | undefined {
    const manager = this.manager;
    if (manager.getOp(arg) === OP_ATAN) return manager.getArg(arg, 0);
    if (manager.isNumeral(arg) && this.getValue(arg).isZero()) return arg;
    const expanded = this.mkTanCore(arg);
    if (expanded !== undefined || !this.options.isExpandTan) return expanded;
    return this.reduce(
      this.mkRealApp(OP_DIV, [this.mkRealApp(OP_SIN, [arg]), this.mkRealApp(OP_COS, [arg])]),
      2,
    );
  }

  private mkTanCore(arg: number) {
    const multiple = this.getPiMultiple(arg);
    if (multiple !== undefined) {
      const sine = this.mkSinValue(multiple);
      if (sine === undefined) return undefined;
      if (this.isZero(sine)) return sine;
      const cosine = this.mkSinValue(multiple.add(HALF));
      if (cosine === undefined || this.isZero(cosine)) return undefined;
      return this.reduce(this.mkRealApp(OP_DIV, [sine, cosine]), Infinity);
    }
    const offset = this.getPiOffset(arg);
    if (offset !== undefined && offset.k.isInt())
      return this.mkWithoutTerm(OP_TAN, arg, offset.term, false);
    const term = this.findSummand(arg, (summand) => this.isPiInteger(summand));
    if (term !== undefined) return this.mkWithoutTerm(OP_TAN, arg, term, false);
    return undefined;
  }

  private mkPiMultiple(num: bigint, den: bigint) {
    return this.reduce(
      this.mkRealApp(OP_MUL, [this.mkReal(Rational.of(num, den)), this.manager.piExpr]),
      2,
    );
  }

  // Like Z3, asin(-x) = -asin(x) even outside [-1, 1].
  private mkNegated(op: number, arg: number) {
    return this.reduce(this.mkRealApp(OP_UMINUS, [this.mkRealApp(op, [arg])]), 2);
  }

  mkAsin(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg)) {
      const k = this.getValue(arg);
      if (k.isZero()) return arg;
      if (k.compare(Rational.minusOne) < 0) return this.mkNegated(OP_ASIN, this.mkReal(k.neg()));
      if (k.compare(Rational.one) > 0) return undefined;
      const sign = k.isNegative() ? -1n : 1n;
      const magnitude = k.abs();
      if (magnitude.equals(Rational.one)) return this.mkPiMultiple(sign, 2n);
      if (magnitude.equals(HALF)) return this.mkPiMultiple(sign, 6n);
    }
    const negated = manager.getTimesMinusOneArg(arg);
    return negated === undefined ? undefined : this.mkNegated(OP_ASIN, negated);
  }

  mkAcos(arg: number) {
    const manager = this.manager;
    if (!manager.isNumeral(arg)) return undefined;
    const k = this.getValue(arg);
    if (k.isZero()) return this.mkPiMultiple(1n, 2n);
    if (k.equals(Rational.one)) return this.mkReal(Rational.zero);
    if (k.equals(Rational.minusOne)) return manager.piExpr;
    if (k.equals(HALF)) return this.mkPiMultiple(1n, 3n);
    if (k.equals(HALF.neg())) return this.mkPiMultiple(2n, 3n);
    return undefined;
  }

  mkAtan(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg)) {
      const k = this.getValue(arg);
      if (k.isZero()) return arg;
      if (k.equals(Rational.one)) return this.mkPiMultiple(1n, 4n);
      if (k.equals(Rational.minusOne)) return this.mkPiMultiple(-1n, 4n);
      if (k.compare(Rational.minusOne) < 0) return this.mkNegated(OP_ATAN, this.mkReal(k.neg()));
      return undefined;
    }
    const negated = manager.getTimesMinusOneArg(arg);
    return negated === undefined ? undefined : this.mkNegated(OP_ATAN, negated);
  }

  mkHyperbolic(op: number, arg: number) {
    const manager = this.manager;
    const inverse = op === OP_SINH ? OP_ASINH : op === OP_COSH ? OP_ACOSH : OP_ATANH;
    if (manager.getOp(arg) === inverse) return manager.getArg(arg, 0);
    const negated = manager.getTimesMinusOneArg(arg);
    if (negated === undefined) return undefined;
    return op === OP_COSH ? this.mkRealApp(OP_COSH, [negated]) : this.mkNegated(op, negated);
  }

  mkDiv(left: number, right: number) {
    const manager = this.manager;
    if (
      this.options.isAnumSimp &&
      ((manager.isAlgebraicNumeral(left) &&
        (manager.isNumeral(right) || manager.isAlgebraicNumeral(right))) ||
        (manager.isAlgebraicNumeral(right) && manager.isNumeral(left)))
    )
      return this.mkAnumDiv(left, right);
    this.currSort = manager.sorts[left];
    if (!manager.isNumeral(right) || this.getValue(right).isZero()) return undefined;
    const divisor = this.getValue(right);
    if (manager.isNumeral(left)) return manager.mkRealNumeral(this.getValue(left).div(divisor));
    return this.reduce(
      manager.mkApp(OP_MUL, [manager.mkRealNumeral(Rational.one.div(divisor)), left], SORT_REAL),
      1,
    );
  }

  mkToInt(arg: number) {
    const manager = this.manager;
    if (manager.isInt(arg)) return arg;
    if (manager.isNumeral(arg)) return manager.mkNumeral(this.getValue(arg).floor().num);
    const op = manager.getOp(arg);
    if (op === OP_TO_REAL && manager.isInt(manager.getArg(arg, 0))) return manager.getArg(arg, 0);
    if (op !== OP_ADD && op !== OP_MUL) return undefined;
    const intArgs: number[] = [];
    const realArgs: number[] = [];
    for (let index = 0; index < manager.getNumArgs(arg); index++) {
      const child = manager.getArg(arg, index);
      if (manager.isNumeral(child) && this.getValue(child).isInt())
        intArgs.push(manager.mkNumeral(this.getValue(child).num));
      else if (manager.getOp(child) === OP_TO_REAL) intArgs.push(manager.getArg(child, 0));
      else realArgs.push(child);
    }
    const mkSum = (args: number[], sort: number) =>
      args.length === 1 ? args[0] : manager.mkApp(op, args, sort);
    if (realArgs.length === 0) return this.reduce(mkSum(intArgs, SORT_INT), 1);
    if (intArgs.length === 0 || op !== OP_ADD) return undefined;
    const intSum = mkSum(intArgs, SORT_INT);
    const realSum = mkSum(realArgs, SORT_REAL);
    return this.reduce(
      manager.mkApp(OP_ADD, [intSum, manager.mkApp(OP_TO_INT, [realSum], SORT_INT)], SORT_INT),
      3,
    );
  }

  mkToReal(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg)) return manager.mkRealNumeral(this.getValue(arg));
    if (manager.isReal(arg)) return arg;
    const op = manager.getOp(arg);
    if (op !== OP_ADD && op !== OP_MUL) return undefined;
    return this.reduce(
      manager.mkApp(
        op,
        manager.mapArgs(arg, (child) => manager.mkApp(OP_TO_REAL, [child], SORT_REAL)),
        SORT_REAL,
      ),
      2,
    );
  }

  mkIsInt(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg))
      return this.getValue(arg).isInt() ? manager.trueExpr : manager.falseExpr;
    const todo = [arg];
    const visited = new Set<number>();
    let isIntegral = true;
    while (isIntegral) {
      const current = todo.pop();
      if (current === undefined) break;
      if (visited.has(current)) continue;
      visited.add(current);
      const op = manager.getOp(current);
      if (op === OP_TO_REAL) continue;
      if (manager.isNumeral(current)) isIntegral = this.getValue(current).isInt();
      else if (op === OP_MUL || op === OP_ADD || op === OP_SUB || op === OP_UMINUS)
        manager.pushArgs(current, todo);
      else isIntegral = false;
    }
    if (isIntegral) return manager.trueExpr;
    return this.reduce(
      manager.mkEq(
        manager.mkApp(OP_TO_REAL, [manager.mkApp(OP_TO_INT, [arg], SORT_INT)], SORT_REAL),
        arg,
      ),
      3,
    );
  }

  private mkAtom(left: number, right: number, kind: number) {
    const manager = this.manager;
    if (kind === KIND_EQ) return manager.mkEq(left, right);
    return manager.mkApp(kind === KIND_LE ? OP_LE : OP_GE, [left, right], SORT_BOOL);
  }

  private flattenMul(expr: number, result: number[]) {
    if (this.isMul(expr))
      for (let index = 0; index < this.manager.getNumArgs(expr); index++)
        this.flattenMul(this.manager.getArg(expr, index), result);
    else result.push(expr);
  }

  private isNonNegative(expr: number) {
    if (this.isNonNegativeFactor(expr)) return true;
    if (!this.isMul(expr)) return false;
    const factors = this.factors;
    shrink(factors, 0);
    this.flattenMul(expr, factors);
    let isNegative = false;
    let numFactors = 0;
    for (const arg of factors) {
      if (this.isNonNegativeFactor(arg)) continue;
      if (!this.manager.isNumeral(arg)) factors[numFactors++] = arg;
      else if (this.getValue(arg).isNegative()) isNegative = !isNegative;
    }
    if (isNegative) return false;
    let numOdd = 0;
    let firstOdd = -1;
    let secondOdd = -1;
    for (let index = 0; index < numFactors; index++) {
      const factor = factors[index];
      if (factors.indexOf(factor) < index) continue;
      let count = 0;
      for (let other = index; other < numFactors; other++) if (factors[other] === factor) count++;
      if (count % 2 === 0) continue;
      numOdd++;
      if (numOdd === 1) firstOdd = factor;
      else if (numOdd === 2) secondOdd = factor;
      else return false;
    }
    if (numOdd === 0) return true;
    if (numOdd !== 2 || !this.manager.isInt(expr)) return false;
    return this.isSuccessor(firstOdd, secondOdd) || this.isSuccessor(secondOdd, firstOdd);
  }

  private isNonNegativeFactor(expr: number) {
    const manager = this.manager;
    const op = manager.getOp(expr);
    if (op === OP_SEQ_LENGTH) return true;
    if (op !== OP_POWER) return false;
    const base = manager.getArg(expr, 0);
    const exponent = manager.getArg(expr, 1);
    if (manager.isNumeral(exponent)) {
      const value = this.getValue(exponent);
      if (value.isInt() && value.num >= 0n && value.num < 2n ** 32n && value.num % 2n === 0n)
        return true;
    }
    return manager.isNumeral(base) && this.getValue(base).isPositive();
  }

  private isSuccessor(base: number, sum: number) {
    if (!this.isAdd(sum)) return false;
    let offset = Rational.zero;
    let numBase = 0;
    for (let index = 0; index < this.manager.getNumArgs(sum); index++) {
      const arg = this.manager.getArg(sum, index);
      if (this.manager.isNumeral(arg)) offset = offset.add(this.getValue(arg));
      else if (arg === base) numBase++;
      else return false;
    }
    return numBase === 1 && (offset.equals(Rational.one) || offset.equals(Rational.minusOne));
  }

  private negateMonomial(expr: number) {
    const manager = this.manager;
    if (this.manager.isNumeral(expr)) return this.mkNumeral(this.getValue(expr).neg());
    if (this.isMul(expr)) {
      const coefficient = manager.getArg(expr, 0);
      if (!this.manager.isNumeral(coefficient))
        return this.mkMulApp([this.mkNumeral(Rational.minusOne), expr]);
      const value = this.getValue(coefficient);
      const factors = value.equals(Rational.minusOne) ? [] : [this.mkNumeral(value.neg())];
      for (let index = 1; index < manager.getNumArgs(expr); index++)
        factors.push(manager.getArg(expr, index));
      return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, this.currSort);
    }
    return manager.mkApp(OP_MUL, [this.mkNumeral(Rational.minusOne), expr], this.currSort);
  }

  private getNegatedPolynomial(expr: number) {
    const manager = this.manager;
    const isNegativeMonomial = (term: number) =>
      this.isMul(term) &&
      this.manager.isNumeral(manager.getArg(term, 0)) &&
      this.getValue(manager.getArg(term, 0)).isNegative();
    if (isNegativeMonomial(expr)) return this.negateMonomial(expr);
    if (!this.isAdd(expr) || !isNegativeMonomial(manager.getArg(expr, 0))) return undefined;
    return manager.mkApp(
      OP_ADD,
      manager.mapArgs(expr, (arg) => this.negateMonomial(arg)),
      this.currSort,
    );
  }

  private getSeparated(left: number, right: number, kind: number) {
    const manager = this.manager;
    if (kind === KIND_EQ || !this.manager.isNumeral(right)) return undefined;
    const rightValue = this.getValue(right);
    if (kind === KIND_GE && rightValue.isZero() && this.isMul(left) && this.isNonNegative(left))
      return manager.trueExpr;
    let bound = Rational.zero;
    let hasBound = true;
    let lastNegated: number | undefined;
    for (let index = 0; index < this.getNumMonomials(left); index++) {
      const arg = this.getMonomial(left, index);
      if (this.manager.isNumeral(arg)) bound = bound.add(this.getValue(arg));
      else if (kind === KIND_LE && this.isNonNegative(arg)) continue;
      else if (kind === KIND_GE) {
        const negated = manager.withTemporaries(
          () => this.getNegatedPolynomial(arg),
          (result) => (result === undefined ? [] : [result]),
        );
        if (negated !== undefined) {
          if (lastNegated !== undefined) manager.decRef(lastNegated);
          lastNegated = negated;
        }
        if (negated === undefined || !this.isNonNegative(negated)) hasBound = false;
      } else hasBound = false;
    }
    const result = hasBound ? this.mkSeparated(left, kind, bound, rightValue) : undefined;
    if (lastNegated !== undefined) manager.decRef(lastNegated);
    return result;
  }

  private mkSeparated(left: number, kind: number, bound: Rational, rightValue: Rational) {
    const manager = this.manager;
    const comparison = bound.compare(rightValue);
    if (kind === KIND_LE && comparison < 0) return undefined;
    if (kind === KIND_GE && comparison > 0) return undefined;
    if (kind === KIND_LE && comparison > 0) return manager.falseExpr;
    if (kind === KIND_GE && comparison < 0) return manager.falseExpr;
    const zero = this.mkNumeral(Rational.zero);
    if (bound.isZero() && this.isMul(left)) {
      const factors: number[] = [];
      this.flattenMul(left, factors);
      return this.reduce(
        manager.mkOr(
          factors
            .filter((arg) => !this.manager.isNumeral(arg))
            .map((arg) => manager.mkEq(arg, zero)),
        ),
        2,
      );
    }
    if (!this.isAdd(left)) return undefined;
    const atoms: number[] = [];
    for (let index = 0; index < manager.getNumArgs(left); index++) {
      const arg = manager.getArg(left, index);
      if (!manager.isNumeral(arg)) atoms.push(this.mkAtom(arg, zero, kind));
    }
    return this.reduce(manager.mkAnd(atoms), 2);
  }

  private getBound(inputLeft: number, inputRight: number, inputKind: number) {
    const manager = this.manager;
    if (
      !this.isAdd(inputLeft) &&
      manager.getOp(inputLeft) !== OP_MOD &&
      this.manager.isNumeral(inputRight)
    ) {
      const product = this.getPowerProduct(inputLeft);
      const coefficient = this.getCoefficient(inputLeft);
      const isNegative = coefficient.isNegative();
      const scale = coefficient.abs();
      const kind = isNegative ? getInverse(inputKind) : inputKind;
      if (coefficient.isZero() || (!isNegative && scale.equals(Rational.one))) return undefined;
      const value = this.getValue(inputRight);
      const bound = (isNegative ? value.neg() : value).div(scale);
      const isInt = manager.isInt(inputLeft);
      if (!isInt || bound.isInt())
        return this.mkAtom(product, manager.mkNumeralOfSort(bound, manager.sorts[inputLeft]), kind);
      if (kind === KIND_EQ) return manager.falseExpr;
      return this.mkAtom(
        product,
        manager.mkNumeral(kind === KIND_LE ? bound.floor().num : bound.ceil().num),
        kind,
      );
    }
    const isSwapped = manager.getOp(inputRight) === OP_MOD;
    const left = isSwapped ? inputRight : inputLeft;
    const right = isSwapped ? inputLeft : inputRight;
    const kind = isSwapped ? getInverse(inputKind) : inputKind;
    if (manager.getNumeral(right) === undefined || manager.getOp(left) !== OP_MOD) return undefined;
    const divisor = manager.getArg(left, 1);
    if (!this.manager.isNumeral(divisor) || this.manager.getNumeralValue(divisor) === 0n)
      return undefined;
    const value = this.manager.getNumeralValue(right);
    const divisorValue = this.manager.getNumeralValue(divisor);
    const modulus = divisorValue < 0n ? -divisorValue : divisorValue;
    if (value < 0n) return kind === KIND_GE ? manager.trueExpr : manager.falseExpr;
    if (value === 0n && kind === KIND_GE) return manager.trueExpr;
    if (value > 0n && value >= modulus)
      return kind === KIND_LE ? manager.trueExpr : manager.falseExpr;
    if (value + 1n === modulus && kind === KIND_LE) return manager.trueExpr;
    return undefined;
  }

  private dividePolynomial(expr: number, divisor: bigint, rounding: "floor" | "ceil" | "none") {
    const manager = this.manager;
    const newArgs: number[] = [];
    const pushArg = (arg: number) => {
      manager.incRef(arg);
      newArgs.push(arg);
    };
    const quotient = manager.withoutTemporaries(() => {
      for (let index = 0; index < this.getNumMonomials(expr); index++) {
        const arg = this.getMonomial(expr, index);
        if (manager.isNumeral(arg)) {
          const value = manager.getNumeralValue(arg);
          const isDivisible = value % divisor === 0n;
          if (!isDivisible && rounding === "none") return undefined;
          const rounded =
            isDivisible || rounding === "floor"
              ? getEuclideanDiv(value, divisor)
              : getCeilDiv(value, divisor);
          if (rounded !== 0n) pushArg(manager.mkNumeral(rounded));
          continue;
        }
        const coefficient = this.getCoefficient(arg).num / divisor;
        const product = this.getPowerProduct(arg);
        if (coefficient === 1n) pushArg(product);
        else if (coefficient !== 0n)
          pushArg(manager.mkApp(OP_MUL, [manager.mkNumeral(coefficient), product], SORT_INT));
      }
      return this.mkAddApp(newArgs);
    });
    if (quotient !== undefined) manager.incRef(quotient);
    for (const arg of newArgs) manager.decRef(arg);
    return quotient;
  }

  private getCoeffsGcd(expr: number, state: GcdState) {
    for (let index = 0; index < this.getNumMonomials(expr); index++) {
      const arg = this.getMonomial(expr, index);
      if (this.manager.isNumeral(arg)) {
        if (this.manager.getNumeralValue(arg) !== 0n) state.numConsts++;
        continue;
      }
      state.gcd = state.isFirst
        ? this.getCoefficient(arg).num
        : getGcd(this.getCoefficient(arg).num, state.gcd);
      state.isFirst = false;
      if (state.gcd === 1n) return;
    }
  }

  private isHolding(left: Rational, right: Rational, kind: number) {
    const comparison = left.compare(right);
    return kind === KIND_LE
      ? comparison <= 0
      : kind === KIND_GE
        ? comparison >= 0
        : comparison === 0;
  }

  private mkLeGeEq(originalLeft: number, originalRight: number, kind: number) {
    const manager = this.manager;
    const sides: number[] = [];
    const result = this.mkLeGeEqCore(originalLeft, originalRight, kind, sides);
    for (let index = sides.length - 1; index >= 0; index--) manager.decRef(sides[index]);
    return result;
  }

  private mkLeGeEqCore(
    originalLeft: number,
    originalRight: number,
    kind: number,
    sides: number[],
  ): number | Rewrite | undefined {
    const manager = this.manager;
    this.currSort = manager.sorts[originalLeft];
    if (
      (this.isZero(originalLeft) && this.isReducePowerTarget(originalRight, kind === KIND_EQ)) ||
      (this.isZero(originalRight) && this.isReducePowerTarget(originalLeft, kind === KIND_EQ))
    )
      return this.reduce(
        this.mkAtom(
          this.reducePower(originalLeft, kind === KIND_EQ),
          this.reducePower(originalRight, kind === KIND_EQ),
          kind,
        ),
        1,
      );
    const setSide = (index: number, expr: number) => {
      manager.incRef(expr);
      if (index < sides.length) manager.decRef(sides[index]);
      sides[index] = expr;
    };
    const cancelled = manager.withTemporaries(
      () => this.cancelMonomials(originalLeft, originalRight, this.options.isArithIneqLhs),
      (result) => (result === undefined ? [] : [result.lhs, result.rhs]),
    );
    if (cancelled !== undefined) sides.push(cancelled.lhs, cancelled.rhs);
    let isChanged = cancelled !== undefined;
    let left = cancelled === undefined ? originalLeft : cancelled.lhs;
    let right = cancelled === undefined ? originalRight : cancelled.rhs;
    if (this.manager.isNumeral(left) && this.manager.isNumeral(right))
      return this.isHolding(this.getValue(left), this.getValue(right), kind)
        ? manager.trueExpr
        : manager.falseExpr;
    const leftValue = this.options.isAnumSimp ? this.getAlgebraicValue(left) : undefined;
    const rightValue = leftValue && this.getAlgebraicValue(right);
    if (leftValue !== undefined && rightValue !== undefined) {
      const comparison = manager.am.compare(leftValue, rightValue);
      const isHolding =
        kind === KIND_LE ? comparison <= 0 : kind === KIND_GE ? comparison >= 0 : comparison === 0;
      return isHolding ? manager.trueExpr : manager.falseExpr;
    }
    const separated = this.getSeparated(left, right, kind);
    if (separated !== undefined) return separated;
    const bound = this.getBound(left, right, kind) ?? this.getBound(right, left, getInverse(kind));
    if (bound !== undefined) return bound;
    if (manager.isInt(left) && this.options.isGcdRounding) {
      const state = { gcd: 0n, isFirst: true, numConsts: 0 };
      this.getCoeffsGcd(left, state);
      if ((state.isFirst || state.gcd !== 1n) && state.numConsts <= 1)
        this.getCoeffsGcd(right, state);
      const divisor = state.gcd < 0n ? -state.gcd : state.gcd;
      if (!state.isFirst && divisor !== 1n && state.numConsts <= 1) {
        const newLeft = this.dividePolynomial(
          left,
          divisor,
          kind === KIND_LE ? "ceil" : kind === KIND_GE ? "floor" : "none",
        );
        if (newLeft === undefined) return manager.falseExpr;
        setSide(0, newLeft);
        manager.decRef(newLeft);
        const newRight = this.dividePolynomial(
          right,
          divisor,
          kind === KIND_LE ? "floor" : kind === KIND_GE ? "ceil" : "none",
        );
        if (newRight === undefined) return manager.falseExpr;
        setSide(1, newRight);
        manager.decRef(newRight);
        left = newLeft;
        right = newRight;
        isChanged = true;
      }
    }
    if (manager.getOp(left) === OP_ITE && this.manager.isNumeral(right)) {
      const condition = manager.getArg(left, 0);
      const rightValue = this.getValue(right);
      const holds = (value: Rational) => this.isHolding(value, rightValue, kind);
      // Z3 makes the negated condition even when unused, and only its conjunctions use arith_util::mk_eq.
      const mkConjunct = (other: number) =>
        kind === KIND_EQ ? this.mkArithEq(other, right) : this.mkAtom(other, right, kind);
      if (this.manager.isNumeral(manager.getArg(left, 1))) {
        const negated = manager.mkNot(condition);
        return this.reduce(
          holds(this.getValue(manager.getArg(left, 1)))
            ? manager.mkOr([condition, this.mkAtom(manager.getArg(left, 2), right, kind)])
            : manager.mkAnd([negated, mkConjunct(manager.getArg(left, 2))]),
          2,
        );
      }
      if (this.manager.isNumeral(manager.getArg(left, 2))) {
        const negated = manager.mkNot(condition);
        return this.reduce(
          holds(this.getValue(manager.getArg(left, 2)))
            ? manager.mkOr([negated, this.mkAtom(manager.getArg(left, 1), right, kind)])
            : manager.mkAnd([condition, mkConjunct(manager.getArg(left, 1))]),
          2,
        );
      }
    }
    if (manager.getOp(left) === OP_ITE && manager.getRefCount(left) === 1) {
      const thenAtom = this.mkAtom(manager.getArg(left, 1), right, kind);
      return this.reduce(
        manager.mkApp(
          OP_ITE,
          [manager.getArg(left, 0), thenAtom, this.mkAtom(manager.getArg(left, 2), right, kind)],
          SORT_BOOL,
        ),
        2,
      );
    }
    const isToIntRight = manager.getOp(right) === OP_TO_INT && manager.isNumeral(left);
    const toIntArg =
      manager.getOp(isToIntRight ? right : left) === OP_TO_INT
        ? manager.getArg(isToIntRight ? right : left, 0)
        : undefined;
    const toIntBound = isToIntRight ? left : right;
    if (toIntArg !== undefined && manager.isNumeral(toIntBound)) {
      const toIntKind = isToIntRight ? getInverse(kind) : kind;
      const value = this.getValue(toIntBound);
      const mkLower = () =>
        manager.mkApp(OP_GE, [toIntArg, manager.mkRealNumeral(value)], SORT_BOOL);
      const mkUpper = () =>
        manager.mkApp(OP_LT, [toIntArg, manager.mkRealNumeral(value.add(Rational.one))], SORT_BOOL);
      if (toIntKind === KIND_LE) return this.reduce(mkUpper(), 1);
      if (toIntKind === KIND_GE) return this.reduce(mkLower(), 1);
      const lower = mkLower();
      return this.reduce(manager.mkAnd([mkUpper(), lower]), 3);
    }
    const negated =
      this.options.isArithIneqLhs && this.manager.isNumeral(right)
        ? this.getNegatedPolynomial(left)
        : undefined;
    if (negated !== undefined) {
      setSide(0, negated);
      const negatedRight = this.mkNumeral(this.getValue(right).neg());
      setSide(1, negatedRight);
      return this.mkAtom(negated, negatedRight, getInverse(kind));
    }
    if (isChanged && left === originalLeft && right === originalRight) return undefined;
    if (isChanged) return this.mkAtom(left, right, kind);
    return this.factorLeGeEq(left, right, kind);
  }

  private getReducedPowerBase(expr: number, isEq: boolean) {
    const manager = this.manager;
    if (manager.getOp(expr) !== OP_POWER) return undefined;
    const exponent = manager.getArg(expr, 1);
    if (!manager.isNumeral(exponent)) return undefined;
    const k = this.getValue(exponent);
    return k.isInt() && k.compare(Rational.of(isEq ? 1n : 2n)) > 0 ? k : undefined;
  }

  private getFactors(expr: number) {
    return this.isMul(expr) ? this.manager.getArgs(expr) : [expr];
  }

  private isReducePowerTarget(expr: number, isEq: boolean) {
    return this.getFactors(expr).some(
      (factor) => this.getReducedPowerBase(factor, isEq) !== undefined,
    );
  }

  // x^k = 0 has the roots of x, and x^k <= 0 those of x or of x^2 by the parity of k.
  private reducePower(expr: number, isEq: boolean) {
    const manager = this.manager;
    if (this.isZero(expr)) return expr;
    const factors = this.getFactors(expr).map((factor) => {
      const k = this.getReducedPowerBase(factor, isEq);
      if (k === undefined) return factor;
      const base = manager.getArg(factor, 0);
      return isEq || getEuclideanMod(k.num, 2n) === 1n
        ? this.ensureReal(base)
        : this.mkPowerApp(this.ensureReal(base), manager.mkRealNumeral(TWO));
    });
    return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, SORT_REAL);
  }

  private factorLeGeEq(left: number, right: number, kind: number) {
    if (!this.isZero(right)) return undefined;
    const factor = this.findNlFactor(left);
    if (factor === undefined) return undefined;
    const manager = this.manager;
    const rest = this.removeNlFactor(factor, left);
    const zero = manager.mkNumeralOfSort(Rational.zero, manager.sorts[left]);
    const factorEq = this.mkArithEq(factor, zero);
    const restEq = this.mkArithEq(rest, zero);
    const isZeroProduct = manager.mkOr([factorEq, restEq]);
    if (kind === KIND_EQ) return this.reduce(isZeroProduct, 3);
    const factorGe = manager.mkApp(OP_GE, [factor, zero], SORT_BOOL);
    const restGe = manager.mkApp(OP_GE, [rest, zero], SORT_BOOL);
    const isSameSign = manager.mkEq(factorGe, restGe);
    return this.reduce(
      manager.mkOr([kind === KIND_GE ? isSameSign : manager.mkNot(isSameSign), isZeroProduct]),
      3,
    );
  }

  private mkArithEq(left: number, right: number) {
    const manager = this.manager;
    const isSwapped =
      manager.isNumeral(left) ||
      (!manager.isNumeral(right) && manager.ids[left] > manager.ids[right]);
    const lhs = isSwapped ? right : left;
    const rhs = isSwapped ? left : right;
    if (lhs === rhs) return manager.trueExpr;
    if (manager.isNumeral(lhs) && manager.isNumeral(rhs)) return manager.falseExpr;
    return manager.mkEq(lhs, rhs);
  }

  private findNlFactor(expr: number) {
    const sum = [expr];
    for (let index = 0; index < sum.length; index++) {
      const arg = sum[index];
      if (this.isAdd(arg)) {
        this.manager.pushArgs(arg, sum);
        continue;
      }
      if (!this.isMul(arg)) continue;
      const muls: number[] = [];
      this.getNlMuls(arg, muls);
      if (muls.length <= 1) continue;
      return muls.find((mul) => this.isAddFactor(mul, expr));
    }
    return undefined;
  }

  private getNlMuls(expr: number, muls: number[]) {
    if (this.isMul(expr))
      for (let index = 0; index < this.manager.getNumArgs(expr); index++)
        this.getNlMuls(this.manager.getArg(expr, index), muls);
    else if (!this.manager.isNumeral(expr)) muls.push(expr);
  }

  private isMulFactor(factor: number, expr: number): boolean {
    if (this.isMul(expr)) return this.manager.someArg(expr, (arg) => this.isMulFactor(factor, arg));
    return factor === expr;
  }

  private isAddFactor(factor: number, expr: number): boolean {
    if (this.isAdd(expr))
      return this.manager.everyArg(expr, (arg) => this.isAddFactor(factor, arg));
    return this.isMulFactor(factor, expr);
  }

  private removeNlFactor(factor: number, expr: number): number {
    const manager = this.manager;
    const sort = manager.sorts[expr];
    if (this.isMul(expr)) {
      const rest = [expr];
      for (let index = 0; index < rest.length; index++) {
        const arg = rest[index];
        if (this.isMul(arg)) {
          manager.pushArgs(arg, rest);
          rest[index] = rest[rest.length - 1];
          rest.pop();
          index--;
          continue;
        }
        if (arg === factor) {
          rest[index] = rest[rest.length - 1];
          rest.pop();
          break;
        }
      }
      if (rest.length === 0) return manager.mkNumeralOfSort(Rational.one, sort);
      return rest.length === 1 ? rest[0] : manager.mkApp(OP_MUL, rest, sort);
    }
    if (this.isAdd(expr)) {
      const sum = [expr];
      for (let index = 0; index < sum.length; index++) {
        const arg = sum[index];
        if (this.isAdd(arg)) {
          manager.pushArgs(arg, sum);
          sum[index] = sum[sum.length - 1];
          sum.pop();
          index--;
          continue;
        }
        sum[index] = this.removeNlFactor(factor, arg);
      }
      return sum.length === 1 ? sum[0] : manager.mkApp(OP_ADD, sum, sort);
    }
    return manager.mkNumeralOfSort(Rational.one, sort);
  }
}

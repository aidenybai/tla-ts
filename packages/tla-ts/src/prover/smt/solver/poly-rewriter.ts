// Ported from Z3 (src/ast/rewriter/poly_rewriter.h, poly_rewriter_def.h), MIT license, see
// z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  AstManager,
  KIND_APP,
  OP_ABS,
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_ITE,
  OP_IS_INT,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  OP_POWER,
  OP_POWER0,
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
  OP_PI,
  OP_E,
  OP_ALGEBRAIC_NUM,
  SORT_INT,
} from "./ast";
import { isAstLess } from "./ast-lt";
import { Rational } from "./rational";
import type { Rewrite } from "./rewriter-tpl";

export interface ArithRewriterOptions {
  readonly isSom: boolean;
  readonly isSortSums: boolean;
  readonly isArithIneqLhs: boolean;
  readonly isGcdRounding: boolean;
  readonly isAnumSimp: boolean;
  readonly isExpandPower: boolean;
  readonly isExpandTan: boolean;
  readonly maxDegree: number;
  readonly isHoistIte?: boolean;
}

const ARITH_OPS: ReadonlySet<number> = new Set([
  OP_NUM,
  OP_ADD,
  OP_SUB,
  OP_UMINUS,
  OP_MUL,
  OP_IDIV,
  OP_MOD,
  OP_ABS,
  OP_LE,
  OP_GE,
  OP_LT,
  OP_GT,
  OP_DIV,
  OP_TO_REAL,
  OP_TO_INT,
  OP_IS_INT,
  OP_POWER,
  OP_POWER0,
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
  OP_PI,
  OP_E,
  OP_ALGEBRAIC_NUM,
]);

export class PolyRewriter {
  protected currSort = SORT_INT;
  private visitedStamps = new Int32Array(0);
  private multipleStamps = new Int32Array(0);
  private stamp = 0;

  constructor(
    protected manager: AstManager,
    protected options: ArithRewriterOptions,
  ) {}

  protected reduce(expr: number, depth: number): Rewrite {
    return { expr, depth };
  }

  protected isNumeral(expr: number) {
    return this.manager.isNumeral(expr);
  }

  protected isZero(expr: number) {
    return this.isNumeral(expr) && this.getValue(expr).isZero();
  }

  protected getValue(expr: number) {
    return this.manager.getRationalValue(expr);
  }

  protected normalize(value: Rational) {
    return value;
  }

  protected mkNumeral(value: Rational) {
    return this.manager.mkNumeralOfSort(value, this.currSort);
  }

  protected isAdd(expr: number) {
    return this.manager.getOp(expr) === OP_ADD;
  }

  protected isMul(expr: number) {
    return this.manager.getOp(expr) === OP_MUL;
  }

  protected isArithTerm(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && ARITH_OPS.has(this.manager.getOp(expr));
  }

  protected mkAddTerm(args: number[]) {
    return this.manager.mkApp(OP_ADD, args, this.currSort);
  }

  protected mkMulTerm(args: number[]) {
    return this.manager.mkApp(OP_MUL, args, this.currSort);
  }

  protected getNumMonomials(expr: number) {
    return this.isAdd(expr) ? this.manager.getNumArgs(expr) : 1;
  }

  protected getMonomial(expr: number, index: number) {
    return this.isAdd(expr) ? this.manager.getArg(expr, index) : expr;
  }

  protected getPowerProduct(expr: number) {
    return this.isMul(expr) &&
      this.manager.getNumArgs(expr) === 2 &&
      this.isNumeral(this.manager.getArg(expr, 0))
      ? this.manager.getArg(expr, 1)
      : expr;
  }

  protected getCoefficient(expr: number) {
    return this.isMul(expr) &&
      this.manager.getNumArgs(expr) === 2 &&
      this.isNumeral(this.manager.getArg(expr, 0))
      ? this.getValue(this.manager.getArg(expr, 0))
      : Rational.one;
  }

  protected getOrdinal(expr: number) {
    const manager = this.manager;
    if (!this.isArithTerm(expr)) return manager.ids[expr];
    if (this.isMul(expr)) {
      return manager.ids[this.isNumeral(manager.getArg(expr, 0)) ? manager.getArg(expr, 1) : expr];
    }
    return this.isNumeral(expr) ? -1 : manager.ids[expr];
  }

  private isMonomialLess(first: number, second: number) {
    return this.options.isArithIneqLhs
      ? this.getOrdinal(first) < this.getOrdinal(second)
      : isAstLess(this.manager, first, second);
  }

  // Insertion sort is stable, as Array.prototype.sort is, and allocates nothing for the short
  // sums that are the common case.
  protected sortMonomials(monomials: number[], start: number) {
    for (let index = start + 1; index < monomials.length; index++) {
      const monomial = monomials[index];
      let position = index;
      for (; position > start && this.isMonomialLess(monomial, monomials[position - 1]); position--)
        monomials[position] = monomials[position - 1];
      monomials[position] = monomial;
    }
    return monomials;
  }

  mkAddApp(args: number[]) {
    if (args.length === 0) return this.mkNumeral(Rational.zero);
    if (args.length === 1) return args[0];
    return this.mkAddTerm(args);
  }

  mkMulApp(args: number[]): number {
    if (args.length === 0) return this.mkNumeral(Rational.one);
    if (args.length === 1) return args[0];
    if (args.length > 2 && this.isNumeral(args[0]))
      return this.mkMulAppWith(this.getValue(args[0]), this.mkMulApp(args.slice(1)));
    return this.mkMulTerm(args);
  }

  protected mkMulAppWith(coefficient: Rational, arg: number) {
    if (coefficient.equals(Rational.one) || this.isZero(arg)) return arg;
    return this.mkMulApp([this.mkNumeral(coefficient), arg]);
  }

  // The rewrites return undefined when they do not apply, like BR_FAILED.
  mkAdd(args: number[]): number | undefined {
    if (args.length < 2) return undefined;
    const manager = this.manager;
    if (
      this.options.isHoistIte === true &&
      args.some(
        (arg) =>
          manager.getOp(arg) === OP_ITE ||
          (this.isAdd(arg) &&
            manager.getArgs(arg).some((inner) => manager.getOp(inner) === OP_ITE)),
      )
    )
      throw new SmtUnsupportedError("hoisting an if-then-else out of a sum");
    this.currSort = this.manager.sorts[args[0]];
    if (!args.some((arg) => this.isAdd(arg))) return this.mkNflatAdd(args);
    const flat: number[] = [];
    for (const arg of args) {
      if (this.isAdd(arg)) this.manager.pushArgs(arg, flat);
      else flat.push(arg);
    }
    return this.mkNflatAdd(flat) ?? this.mkAddApp(flat);
  }

  private mkNflatAdd(args: number[]) {
    const isSortSums = this.options.isSortSums;
    let constant = Rational.zero;
    let numCoeffs = 0;
    let isOrdered = true;
    let previous = -1;
    let isMultiple = false;
    const stamp = ++this.stamp;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (this.isNumeral(arg)) {
        numCoeffs++;
        constant = constant.add(this.getValue(arg));
        isOrdered = !isSortSums || index === 0;
      } else if (isSortSums && isOrdered) {
        if (previous !== -1 && this.isMonomialLess(arg, previous)) isOrdered = false;
        previous = arg;
      }
      const product = this.getPowerProduct(arg);
      if (product >= this.visitedStamps.length) this.growStamps(product);
      if (this.visitedStamps[product] === stamp) {
        this.multipleStamps[product] = stamp;
        isMultiple = true;
      } else this.visitedStamps[product] = stamp;
    }
    constant = this.normalize(constant);
    if (isMultiple) {
      const coeffs = new Map<number, Rational>();
      for (const arg of args) {
        if (this.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (this.multipleStamps[product] === stamp)
          coeffs.set(product, (coeffs.get(product) ?? Rational.zero).add(this.getCoefficient(arg)));
      }
      const newArgs: number[] = constant.isZero() ? [] : [this.mkNumeral(constant)];
      const copiedStamp = ++this.stamp;
      for (const arg of args) {
        if (this.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (this.multipleStamps[product] !== stamp) newArgs.push(arg);
        else if (this.visitedStamps[product] !== copiedStamp) {
          this.visitedStamps[product] = copiedStamp;
          const coefficient = this.normalize(coeffs.get(product) ?? Rational.zero);
          if (!coefficient.isZero()) newArgs.push(this.mkMulAppWith(coefficient, product));
        }
      }
      return this.mkAddApp(
        isSortSums ? this.sortMonomials(newArgs, constant.isZero() ? 0 : 1) : newArgs,
      );
    }
    if (isOrdered) {
      if (numCoeffs === 0) return undefined;
      if (numCoeffs === 1 && this.isNumeral(args[0]) && !this.getValue(args[0]).isZero())
        return undefined;
    }
    const newArgs: number[] = constant.isZero() ? [] : [this.mkNumeral(constant)];
    for (const arg of args) if (!this.isNumeral(arg)) newArgs.push(arg);
    return this.mkAddApp(
      isOrdered ? newArgs : this.sortMonomials(newArgs, constant.isZero() ? 0 : 1),
    );
  }

  private growStamps(expr: number) {
    const size = Math.max(2 * this.visitedStamps.length, expr + 1, 1024);
    const visitedStamps = new Int32Array(size);
    visitedStamps.set(this.visitedStamps);
    this.visitedStamps = visitedStamps;
    const multipleStamps = new Int32Array(size);
    multipleStamps.set(this.multipleStamps);
    this.multipleStamps = multipleStamps;
  }

  mkMul(args: number[]): number | Rewrite | undefined {
    if (args.length < 2) return undefined;
    this.currSort = this.manager.sorts[args[0]];
    const isFlatMonomial =
      args.length === 2 &&
      this.isNumeral(args[0]) &&
      !(this.isMul(args[1]) && this.isNumeral(this.manager.getArg(args[1], 0)));
    if (isFlatMonomial || !args.some((arg) => this.isMul(arg))) return this.mkNflatMul(args);
    const flat: number[] = [];
    const collect = (arg: number) => {
      if (this.isMul(arg))
        for (let index = 0; index < this.manager.getNumArgs(arg); index++)
          collect(this.manager.getArg(arg, index));
      else flat.push(arg);
    };
    for (const arg of args) collect(arg);
    return this.mkNflatMul(flat) ?? this.mkMulApp(flat);
  }

  private mkNflatMul(args: number[]): number | Rewrite | undefined {
    const manager = this.manager;
    if (
      args.length === 2 &&
      this.isNumeral(args[0]) &&
      !this.getValue(args[0]).equals(Rational.one) &&
      !this.getValue(args[0]).isZero() &&
      !this.isArithTerm(args[1])
    )
      return undefined;
    let coefficient = Rational.one;
    let numCoeffs = 0;
    let numAdd = 0;
    let factor = -1;
    for (const arg of args) {
      if (this.isNumeral(arg)) {
        numCoeffs++;
        coefficient = coefficient.mul(this.getValue(arg));
      } else {
        factor = arg;
        if (this.isAdd(arg)) numAdd++;
      }
    }
    coefficient = this.normalize(coefficient);
    if (numCoeffs === args.length || coefficient.isZero()) return this.mkNumeral(coefficient);
    if (numCoeffs === args.length - 1) {
      if (coefficient.equals(Rational.one)) return factor;
      if (this.isMul(factor)) {
        if (manager.getNumArgs(factor) !== 2 || !this.isNumeral(manager.getArg(factor, 0)))
          return undefined;
        return this.reduce(
          this.mkMulAppWith(
            this.normalize(coefficient.mul(this.getValue(manager.getArg(factor, 0)))),
            manager.getArg(factor, 1),
          ),
          1,
        );
      }
      if (numAdd === 0) {
        if (args.length === 2 && args[1] === factor) return undefined;
        return this.mkMulAppWith(coefficient, factor);
      }
      return this.reduce(
        this.mkAddApp(
          manager.mapArgs(factor, (innerArg) => this.mkMulAppWith(coefficient, innerArg)),
        ),
        2,
      );
    }
    if (numCoeffs > 1 || (numCoeffs === 1 && !this.isNumeral(args[0])))
      return this.reduce(
        this.mkMulAppWith(coefficient, this.mkMulApp(args.filter((arg) => !this.isNumeral(arg)))),
        2,
      );
    if (!this.options.isSom || numAdd === 0) {
      const factors = args.filter((arg) => !this.isNumeral(arg));
      const isOrdered = factors.every(
        (arg, index) => index === 0 || !this.isMonomialLess(arg, factors[index - 1]),
      );
      if (isOrdered && numCoeffs === 0) return undefined;
      const ordered = isOrdered ? factors : this.sortMonomials(factors, 0);
      return this.mkMulAppWith(coefficient, this.mkMulApp(ordered));
    }
    const sums = args.map((arg) => (this.isAdd(arg) ? manager.getArgs(arg) : [arg]));
    const positions = sums.map(() => 0);
    // Like som's expr_ref_buffer, the products are released in order when it returns.
    const products: number[] = [];
    const isBlownUp = manager.withTemporaries(
      () => {
        for (;;) {
          if (products.length > 10 * sums.length) return true;
          products.push(this.mkMulApp(sums.map((sum, index) => sum[positions[index]])));
          let index = 0;
          for (; index < sums.length; index++) {
            positions[index]++;
            if (positions[index] < sums[index].length) break;
            positions[index] = 0;
          }
          if (index === sums.length) return false;
        }
      },
      () => products,
    );
    const result = isBlownUp ? undefined : this.reduce(this.mkAddApp(products), 2);
    for (const product of products) manager.decRef(product);
    return result;
  }

  mkSub(args: number[]) {
    if (args.length === 1) return args[0];
    this.currSort = this.manager.sorts[args[0]];
    const minusOne = this.mkNumeral(Rational.minusOne);
    const newArgs = [args[0]];
    for (const arg of args.slice(1))
      if (!this.isZero(arg)) newArgs.push(this.mkMulApp([minusOne, arg]));
    return this.reduce(this.mkAddApp(newArgs), 2);
  }

  mkUminus(arg: number) {
    this.currSort = this.manager.sorts[arg];
    if (this.isNumeral(arg)) return this.mkNumeral(this.getValue(arg).neg());
    return this.reduce(this.mkMulAppWith(Rational.minusOne, arg), 1);
  }

  // The stamps stand for cancel_monomials' visited, multiple and copied marks.
  protected cancelMonomials(lhs: number, rhs: number, isMoving: boolean) {
    const manager = this.manager;
    this.currSort = manager.sorts[lhs];
    const stamp = ++this.stamp;
    let constant = Rational.zero;
    let numCoeffs = 0;
    for (let index = 0; index < this.getNumMonomials(lhs); index++) {
      const arg = this.getMonomial(lhs, index);
      if (this.isNumeral(arg)) {
        constant = constant.add(this.getValue(arg));
        numCoeffs++;
        continue;
      }
      const product = this.getPowerProduct(arg);
      if (product >= this.visitedStamps.length) this.growStamps(product);
      this.visitedStamps[product] = stamp;
    }
    if (isMoving && numCoeffs === 0 && this.isNumeral(rhs)) return undefined;
    let isMultiple = false;
    for (let index = 0; index < this.getNumMonomials(rhs); index++) {
      const arg = this.getMonomial(rhs, index);
      if (this.isNumeral(arg)) {
        constant = constant.sub(this.getValue(arg));
        numCoeffs++;
        continue;
      }
      const product = this.getPowerProduct(arg);
      if (product < this.visitedStamps.length && this.visitedStamps[product] === stamp) {
        this.multipleStamps[product] = stamp;
        isMultiple = true;
      }
    }
    constant = this.normalize(constant);
    if (!isMultiple && numCoeffs <= 1) {
      if (isMoving ? this.isNumeral(rhs) : numCoeffs === 0 || this.isNumeral(rhs)) return undefined;
    }
    const isMultipleProduct = (product: number) =>
      product < this.multipleStamps.length && this.multipleStamps[product] === stamp;
    const coeffs = new Map<number, Rational>();
    if (isMultiple) {
      for (let index = 0; index < this.getNumMonomials(lhs); index++) {
        const arg = this.getMonomial(lhs, index);
        if (this.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (isMultipleProduct(product))
          coeffs.set(product, (coeffs.get(product) ?? Rational.zero).add(this.getCoefficient(arg)));
      }
      for (let index = 0; index < this.getNumMonomials(rhs); index++) {
        const arg = this.getMonomial(rhs, index);
        if (this.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (isMultipleProduct(product))
          coeffs.set(product, (coeffs.get(product) ?? Rational.zero).sub(this.getCoefficient(arg)));
      }
    }
    const newLhs: number[] = [];
    const copiedStamp = ++this.stamp;
    for (let index = 0; index < this.getNumMonomials(lhs); index++) {
      const arg = this.getMonomial(lhs, index);
      if (this.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (!isMultipleProduct(product)) newLhs.push(arg);
      else if (this.visitedStamps[product] !== copiedStamp) {
        this.visitedStamps[product] = copiedStamp;
        const coefficient = coeffs.get(product) ?? Rational.zero;
        if (!coefficient.isZero()) newLhs.push(this.mkMulAppWith(coefficient, product));
      }
    }
    const newRhs: number[] = [];
    for (let index = 0; index < this.getNumMonomials(rhs); index++) {
      const arg = this.getMonomial(rhs, index);
      if (this.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (isMultipleProduct(product)) continue;
      if (!isMoving) newRhs.push(arg);
      else {
        const coefficient = this.getCoefficient(arg);
        if (coefficient.equals(Rational.minusOne)) newLhs.push(product);
        else if (!coefficient.isZero())
          newLhs.push(this.mkMulApp([this.mkNumeral(coefficient.neg()), product]));
      }
    }
    const sortedLhs = isMoving && this.options.isSortSums ? this.sortMonomials(newLhs, 0) : newLhs;
    const isConstantAtRhs = isMoving || newRhs.length === 0 || newLhs.length > 0;
    const value = isConstantAtRhs ? this.normalize(constant.neg()) : constant;
    const isLhsConstant = !isConstantAtRhs && (sortedLhs.length === 0 || !value.isZero());
    const isRhsConstant = isConstantAtRhs && (newRhs.length === 0 || !value.isZero());
    if (isLhsConstant) sortedLhs.unshift(this.mkNumeral(value));
    if (isRhsConstant) newRhs.unshift(this.mkNumeral(value));
    const lhsResult = this.mkAddApp(sortedLhs);
    return { lhs: lhsResult, rhs: this.mkAddApp(newRhs) };
  }
}

// Ported from Z3 (src/ast/rewriter/poly_rewriter.h, poly_rewriter_def.h), MIT license, see
// z3-license.txt. The rewrites of sums and products of monomials, which arith_rewriter extends.
// Powers are not ported, as tlapm's encoding does not produce them.
import {
  AstManager,
  KIND_APP,
  OP_ABS,
  OP_ADD,
  OP_DIV,
  OP_GE,
  OP_GT,
  OP_IDIV,
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
  SORT_INT,
} from "./ast";
import { Rational } from "./rational";
import type { Rewrite } from "./rewriter-tpl";

export interface ArithRewriterOptions {
  // poly_rewriter's som: distributes products over sums.
  readonly isSom: boolean;
  // arith_rewriter's sort_sums: orders the monomials of a sum.
  readonly isSortSums: boolean;
  // arith_rewriter's arith_ineq_lhs: moves the monomials of an inequality to the left-hand side.
  readonly isArithIneqLhs: boolean;
  // arith_rewriter's gcd_rounding: divides integer atoms by the gcd of their coefficients.
  readonly isGcdRounding: boolean;
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
]);

export class PolyRewriter {
  // m_curr_sort: the sort of the numerals and terms that the current rewrite makes.
  protected currSort = SORT_INT;
  // The expr_fast_mark1 and expr_fast_mark2 of mk_nflat_add_core: Z3 marks the power products in
  // their nodes, and a stamp per expression marks them here for one call.
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

  protected isZero(expr: number) {
    return this.manager.isNumeral(expr) && this.getValue(expr).isZero();
  }

  // The value of a numeral of either sort.
  protected getValue(expr: number) {
    return this.manager.getRationalValue(expr);
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

  protected getMonomials(expr: number) {
    return this.isAdd(expr) ? this.manager.args[expr] : [expr];
  }

  // get_power_product: the monomial without its coefficient.
  protected getPowerProduct(expr: number) {
    const args = this.manager.args[expr];
    return this.isMul(expr) && args.length === 2 && this.manager.isNumeral(args[0])
      ? args[1]
      : expr;
  }

  protected getCoefficient(expr: number) {
    const args = this.manager.args[expr];
    return this.isMul(expr) && args.length === 2 && this.manager.isNumeral(args[0])
      ? this.getValue(args[0])
      : Rational.one;
  }

  // mon_lt::ordinal, without powers.
  protected getOrdinal(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || !ARITH_OPS.has(manager.getOp(expr)))
      return manager.ids[expr];
    if (this.isMul(expr)) {
      const args = manager.args[expr];
      return manager.ids[manager.isNumeral(args[0]) ? args[1] : expr];
    }
    return manager.isNumeral(expr) ? -1 : manager.ids[expr];
  }

  protected sortMonomials(monomials: number[], start: number) {
    const sorted = monomials
      .slice(start)
      .sort((left, right) => this.getOrdinal(left) - this.getOrdinal(right));
    return [...monomials.slice(0, start), ...sorted];
  }

  mkAddApp(args: number[]) {
    if (args.length === 0) return this.mkNumeral(Rational.zero);
    if (args.length === 1) return args[0];
    return this.manager.mkApp(OP_ADD, args, this.currSort);
  }

  mkMulApp(args: number[]): number {
    if (args.length === 0) return this.mkNumeral(Rational.one);
    if (args.length === 1) return args[0];
    if (args.length > 2 && this.manager.isNumeral(args[0]))
      return this.mkMulAppWith(this.getValue(args[0]), this.mkMulApp(args.slice(1)));
    return this.manager.mkApp(OP_MUL, args, this.currSort);
  }

  protected mkMulAppWith(coefficient: Rational, arg: number) {
    if (coefficient.equals(Rational.one) || this.isZero(arg)) return arg;
    return this.mkMulApp([this.mkNumeral(coefficient), arg]);
  }

  // The rewrites return undefined when they do not apply, like BR_FAILED.
  mkAdd(args: number[]): number | undefined {
    if (args.length < 2) return undefined;
    this.currSort = this.manager.sorts[args[0]];
    if (!args.some((arg) => this.isAdd(arg))) return this.mkNflatAdd(args);
    const flat: number[] = [];
    for (const arg of args) {
      if (this.isAdd(arg)) flat.push(...this.manager.args[arg]);
      else flat.push(arg);
    }
    return this.mkNflatAdd(flat) ?? this.mkAddApp(flat);
  }

  private mkNflatAdd(args: number[]) {
    const manager = this.manager;
    const isSortSums = this.options.isSortSums;
    let constant = Rational.zero;
    let numCoeffs = 0;
    let isOrdered = true;
    let previous = -1;
    let isMultiple = false;
    const stamp = ++this.stamp;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (manager.isNumeral(arg)) {
        numCoeffs++;
        constant = constant.add(this.getValue(arg));
        isOrdered = !isSortSums || index === 0;
      } else if (isSortSums && isOrdered) {
        if (previous !== -1 && this.getOrdinal(arg) < this.getOrdinal(previous)) isOrdered = false;
        previous = arg;
      }
      const product = this.getPowerProduct(arg);
      if (product >= this.visitedStamps.length) this.growStamps(product);
      if (this.visitedStamps[product] === stamp) {
        this.multipleStamps[product] = stamp;
        isMultiple = true;
      } else this.visitedStamps[product] = stamp;
    }
    if (isMultiple) {
      const coeffs = new Map<number, Rational>();
      for (const arg of args) {
        if (manager.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (this.multipleStamps[product] === stamp)
          coeffs.set(product, (coeffs.get(product) ?? Rational.zero).add(this.getCoefficient(arg)));
      }
      const newArgs: number[] = constant.isZero() ? [] : [this.mkNumeral(constant)];
      // visited.reset(): a new stamp marks the power products already copied.
      const copiedStamp = ++this.stamp;
      for (const arg of args) {
        if (manager.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (this.multipleStamps[product] !== stamp) newArgs.push(arg);
        else if (this.visitedStamps[product] !== copiedStamp) {
          this.visitedStamps[product] = copiedStamp;
          const coefficient = coeffs.get(product) ?? Rational.zero;
          if (!coefficient.isZero()) newArgs.push(this.mkMulAppWith(coefficient, product));
        }
      }
      return this.mkAddApp(
        isSortSums ? this.sortMonomials(newArgs, constant.isZero() ? 0 : 1) : newArgs,
      );
    }
    if (isOrdered) {
      if (numCoeffs === 0) return undefined;
      if (numCoeffs === 1 && manager.isNumeral(args[0]) && !this.getValue(args[0]).isZero())
        return undefined;
    }
    const newArgs: number[] = constant.isZero() ? [] : [this.mkNumeral(constant)];
    for (const arg of args) if (!manager.isNumeral(arg)) newArgs.push(arg);
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
      this.manager.isNumeral(args[0]) &&
      !(this.isMul(args[1]) && this.manager.isNumeral(this.manager.args[args[1]][0]));
    if (isFlatMonomial || !args.some((arg) => this.isMul(arg))) return this.mkNflatMul(args);
    const flat: number[] = [];
    const collect = (arg: number) => {
      if (this.isMul(arg)) for (const innerArg of this.manager.args[arg]) collect(innerArg);
      else flat.push(arg);
    };
    for (const arg of args) collect(arg);
    return this.mkNflatMul(flat) ?? this.mkMulApp(flat);
  }

  private mkNflatMul(args: number[]): number | Rewrite | undefined {
    const manager = this.manager;
    if (
      args.length === 2 &&
      this.manager.isNumeral(args[0]) &&
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
      if (this.manager.isNumeral(arg)) {
        numCoeffs++;
        coefficient = coefficient.mul(this.getValue(arg));
      } else {
        factor = arg;
        if (this.isAdd(arg)) numAdd++;
      }
    }
    if (numCoeffs === args.length || coefficient.isZero()) return this.mkNumeral(coefficient);
    if (numCoeffs === args.length - 1) {
      if (coefficient.equals(Rational.one)) return factor;
      if (this.isMul(factor)) {
        const factorArgs = manager.args[factor];
        if (factorArgs.length !== 2 || !this.manager.isNumeral(factorArgs[0])) return undefined;
        return this.reduce(
          this.mkMulAppWith(coefficient.mul(this.getValue(factorArgs[0])), factorArgs[1]),
          1,
        );
      }
      if (numAdd === 0) {
        if (args.length === 2 && args[1] === factor) return undefined;
        return this.mkMulAppWith(coefficient, factor);
      }
      return this.reduce(
        this.mkAddApp(
          manager.args[factor].map((innerArg) => this.mkMulAppWith(coefficient, innerArg)),
        ),
        2,
      );
    }
    if (numCoeffs > 1 || (numCoeffs === 1 && !this.manager.isNumeral(args[0])))
      return this.reduce(
        this.mkMulAppWith(
          coefficient,
          this.mkMulApp(args.filter((arg) => !this.manager.isNumeral(arg))),
        ),
        2,
      );
    if (!this.options.isSom || numAdd === 0) {
      const factors = args.filter((arg) => !this.manager.isNumeral(arg));
      const isOrdered = factors.every(
        (arg, index) => index === 0 || this.getOrdinal(arg) >= this.getOrdinal(factors[index - 1]),
      );
      if (isOrdered && numCoeffs === 0) return undefined;
      const ordered = isOrdered ? factors : this.sortMonomials(factors, 0);
      return this.mkMulAppWith(coefficient, this.mkMulApp(ordered));
    }
    const sums = args.map((arg) => (this.isAdd(arg) ? manager.args[arg] : [arg]));
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
    if (this.manager.isNumeral(arg)) return this.mkNumeral(this.getValue(arg).neg());
    return this.reduce(this.mkMulAppWith(Rational.minusOne, arg), 1);
  }

  // poly_rewriter::cancel_monomials.
  protected cancelMonomials(lhs: number, rhs: number, isMoving: boolean) {
    this.currSort = this.manager.sorts[lhs];
    const lhsMonomials = this.getMonomials(lhs);
    const rhsMonomials = this.getMonomials(rhs);
    const visited = new Set<number>();
    const multiple = new Set<number>();
    let constant = Rational.zero;
    let numCoeffs = 0;
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) {
        constant = constant.add(this.getValue(arg));
        numCoeffs++;
      } else visited.add(this.getPowerProduct(arg));
    }
    if (isMoving && numCoeffs === 0 && this.manager.isNumeral(rhs)) return undefined;
    for (const arg of rhsMonomials) {
      if (this.manager.isNumeral(arg)) {
        constant = constant.sub(this.getValue(arg));
        numCoeffs++;
      } else if (visited.has(this.getPowerProduct(arg))) multiple.add(this.getPowerProduct(arg));
    }
    if (multiple.size === 0 && numCoeffs <= 1) {
      if (isMoving ? this.manager.isNumeral(rhs) : numCoeffs === 0 || this.manager.isNumeral(rhs))
        return undefined;
    }
    const coeffs = new Map<number, Rational>();
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (multiple.has(product))
        coeffs.set(product, (coeffs.get(product) ?? Rational.zero).add(this.getCoefficient(arg)));
    }
    for (const arg of rhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (multiple.has(product))
        coeffs.set(product, (coeffs.get(product) ?? Rational.zero).sub(this.getCoefficient(arg)));
    }
    const newLhs: number[] = [];
    const copied = new Set<number>();
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (!multiple.has(product)) newLhs.push(arg);
      else if (!copied.has(product)) {
        copied.add(product);
        const coefficient = coeffs.get(product) ?? Rational.zero;
        if (!coefficient.isZero()) newLhs.push(this.mkMulAppWith(coefficient, product));
      }
    }
    const newRhs: number[] = [];
    for (const arg of rhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (multiple.has(product)) continue;
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
    const value = isConstantAtRhs ? constant.neg() : constant;
    const isLhsConstant = !isConstantAtRhs && (sortedLhs.length === 0 || !value.isZero());
    const isRhsConstant = isConstantAtRhs && (newRhs.length === 0 || !value.isZero());
    // The constants are created first, the right one before the left one.
    const rhsConstant = isRhsConstant ? [this.mkNumeral(value)] : [];
    const lhsConstant = isLhsConstant ? [this.mkNumeral(value)] : [];
    const lhsResult = this.mkAddApp([...lhsConstant, ...sortedLhs]);
    return { lhs: lhsResult, rhs: this.mkAddApp([...rhsConstant, ...newRhs]) };
  }
}

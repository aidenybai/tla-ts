// Ported from Z3 (src/ast/rewriter/poly_rewriter.h, poly_rewriter_def.h), MIT license, see
// z3-license.txt. The rewrites of sums and products of integer monomials, which arith_rewriter
// extends. Powers are not ported, as tlapm's encoding does not produce them.
import {
  AstManager,
  KIND_APP,
  OP_ABS,
  OP_ADD,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UMINUS,
  SORT_INT,
} from "./ast";

export interface ArithRewriterOptions {
  // poly_rewriter's som: distributes products over sums.
  isSom: boolean;
  // arith_rewriter's sort_sums: orders the monomials of a sum.
  isSortSums: boolean;
  // arith_rewriter's arith_ineq_lhs: moves the monomials of an inequality to the left-hand side.
  isArithIneqLhs: boolean;
  // arith_rewriter's gcd_rounding: divides integer atoms by the gcd of their coefficients.
  isGcdRounding: boolean;
}

// A rewrite that returns a term the caller rewrites again to this depth, like BR_REWRITE1 and
// BR_REWRITE2 in Z3.
export type Reduce = (expr: number, depth: number) => number;

const ARITH_OPS = new Set([
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
]);

export class PolyRewriter {
  constructor(
    protected manager: AstManager,
    protected options: ArithRewriterOptions,
    protected reduce: Reduce,
  ) {}

  protected isZero(expr: number) {
    return this.manager.isNumeral(expr) && this.manager.values[expr] === 0;
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
      ? this.manager.values[args[0]]
      : 1;
  }

  // mon_lt::ordinal, without powers.
  protected getOrdinal(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || !ARITH_OPS.has(manager.getOp(expr))) return expr;
    if (this.isMul(expr)) {
      const args = manager.args[expr];
      return this.manager.isNumeral(args[0]) ? args[1] : expr;
    }
    return this.manager.isNumeral(expr) ? -1 : expr;
  }

  protected sortMonomials(monomials: number[], start: number) {
    const sorted = monomials
      .slice(start)
      .sort((left, right) => this.getOrdinal(left) - this.getOrdinal(right));
    return [...monomials.slice(0, start), ...sorted];
  }

  mkAddApp(args: number[]) {
    if (args.length === 0) return this.manager.mkNumeral(0);
    if (args.length === 1) return args[0];
    return this.manager.mkApp(OP_ADD, args, SORT_INT);
  }

  mkMulApp(args: number[]): number {
    if (args.length === 0) return this.manager.mkNumeral(1);
    if (args.length === 1) return args[0];
    if (args.length > 2 && this.manager.isNumeral(args[0]))
      return this.mkMulAppWith(this.manager.values[args[0]], this.mkMulApp(args.slice(1)));
    return this.manager.mkApp(OP_MUL, args, SORT_INT);
  }

  protected mkMulAppWith(coefficient: number, arg: number) {
    if (coefficient === 1 || this.isZero(arg)) return arg;
    return this.mkMulApp([this.manager.mkNumeral(coefficient), arg]);
  }

  // The rewrites return undefined when they do not apply, like BR_FAILED.
  mkAdd(args: number[]): number | undefined {
    if (args.length < 2) return undefined;
    if (!args.some((arg) => this.isAdd(arg))) return this.mkNflatAdd(args);
    const flat: number[] = [];
    for (const arg of args) {
      if (this.isAdd(arg)) flat.push(...this.manager.args[arg]);
      else flat.push(arg);
    }
    return this.mkNflatAdd(flat) ?? this.mkAddApp(flat);
  }

  private mkNflatAdd(args: number[]) {
    const isSortSums = this.options.isSortSums;
    let constant = 0;
    let numCoeffs = 0;
    let isOrdered = true;
    let previous = -1;
    const visited = new Set<number>();
    const multiple = new Set<number>();
    args.forEach((arg, index) => {
      if (this.manager.isNumeral(arg)) {
        numCoeffs++;
        constant += this.manager.values[arg];
        isOrdered = !isSortSums || index === 0;
      } else if (isSortSums && isOrdered) {
        if (previous !== -1 && this.getOrdinal(arg) < this.getOrdinal(previous)) isOrdered = false;
        previous = arg;
      }
      const product = this.getPowerProduct(arg);
      if (visited.has(product)) multiple.add(product);
      else visited.add(product);
    });
    if (multiple.size > 0) {
      const coeffs = new Map<number, number>();
      for (const arg of args) {
        if (this.manager.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (multiple.has(product))
          coeffs.set(product, (coeffs.get(product) ?? 0) + this.getCoefficient(arg));
      }
      const newArgs: number[] = constant === 0 ? [] : [this.manager.mkNumeral(constant)];
      const copied = new Set<number>();
      for (const arg of args) {
        if (this.manager.isNumeral(arg)) continue;
        const product = this.getPowerProduct(arg);
        if (!multiple.has(product)) newArgs.push(arg);
        else if (!copied.has(product)) {
          copied.add(product);
          const coefficient = coeffs.get(product) ?? 0;
          if (coefficient !== 0) newArgs.push(this.mkMulAppWith(coefficient, product));
        }
      }
      return this.mkAddApp(
        isSortSums ? this.sortMonomials(newArgs, constant === 0 ? 0 : 1) : newArgs,
      );
    }
    if (isOrdered) {
      if (numCoeffs === 0) return undefined;
      if (numCoeffs === 1 && this.manager.isNumeral(args[0]) && this.manager.values[args[0]] !== 0)
        return undefined;
    }
    const newArgs: number[] = constant === 0 ? [] : [this.manager.mkNumeral(constant)];
    for (const arg of args) if (!this.manager.isNumeral(arg)) newArgs.push(arg);
    return this.mkAddApp(isOrdered ? newArgs : this.sortMonomials(newArgs, constant === 0 ? 0 : 1));
  }

  mkMul(args: number[]): number | undefined {
    if (args.length < 2) return undefined;
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

  private mkNflatMul(args: number[]): number | undefined {
    const manager = this.manager;
    if (
      args.length === 2 &&
      this.manager.isNumeral(args[0]) &&
      this.manager.values[args[0]] !== 1 &&
      this.manager.values[args[0]] !== 0 &&
      !this.isArithTerm(args[1])
    )
      return undefined;
    let coefficient = 1;
    let numCoeffs = 0;
    let numAdd = 0;
    let factor = -1;
    for (const arg of args) {
      if (this.manager.isNumeral(arg)) {
        numCoeffs++;
        coefficient *= this.manager.values[arg];
      } else {
        factor = arg;
        if (this.isAdd(arg)) numAdd++;
      }
    }
    if (numCoeffs === args.length || coefficient === 0) return this.manager.mkNumeral(coefficient);
    if (numCoeffs === args.length - 1) {
      if (coefficient === 1) return factor;
      if (this.isMul(factor)) {
        const factorArgs = manager.args[factor];
        if (factorArgs.length !== 2 || !this.manager.isNumeral(factorArgs[0])) return undefined;
        return this.reduce(
          this.mkMulAppWith(coefficient * this.manager.values[factorArgs[0]], factorArgs[1]),
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
    const products: number[] = [];
    for (;;) {
      if (products.length > 10 * sums.length) return undefined;
      products.push(this.mkMulApp(sums.map((sum, index) => sum[positions[index]])));
      let index = 0;
      for (; index < sums.length; index++) {
        positions[index]++;
        if (positions[index] < sums[index].length) break;
        positions[index] = 0;
      }
      if (index === sums.length) break;
    }
    return this.reduce(this.mkAddApp(products), 2);
  }

  mkSub(args: number[]) {
    if (args.length === 1) return args[0];
    const minusOne = this.manager.mkNumeral(-1);
    const newArgs = [args[0]];
    for (const arg of args.slice(1))
      if (!this.isZero(arg)) newArgs.push(this.mkMulApp([minusOne, arg]));
    return this.reduce(this.mkAddApp(newArgs), 2);
  }

  mkUminus(arg: number) {
    if (this.manager.isNumeral(arg)) return this.manager.mkNumeral(-this.manager.values[arg]);
    return this.reduce(this.mkMulAppWith(-1, arg), 1);
  }

  // poly_rewriter::cancel_monomials.
  protected cancelMonomials(lhs: number, rhs: number, isMoving: boolean) {
    const lhsMonomials = this.getMonomials(lhs);
    const rhsMonomials = this.getMonomials(rhs);
    const visited = new Set<number>();
    const multiple = new Set<number>();
    let constant = 0;
    let numCoeffs = 0;
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) {
        constant += this.manager.values[arg];
        numCoeffs++;
      } else visited.add(this.getPowerProduct(arg));
    }
    if (isMoving && numCoeffs === 0 && this.manager.isNumeral(rhs)) return undefined;
    for (const arg of rhsMonomials) {
      if (this.manager.isNumeral(arg)) {
        constant -= this.manager.values[arg];
        numCoeffs++;
      } else if (visited.has(this.getPowerProduct(arg))) multiple.add(this.getPowerProduct(arg));
    }
    if (multiple.size === 0 && numCoeffs <= 1) {
      if (isMoving ? this.manager.isNumeral(rhs) : numCoeffs === 0 || this.manager.isNumeral(rhs))
        return undefined;
    }
    const coeffs = new Map<number, number>();
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (multiple.has(product))
        coeffs.set(product, (coeffs.get(product) ?? 0) + this.getCoefficient(arg));
    }
    for (const arg of rhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (multiple.has(product))
        coeffs.set(product, (coeffs.get(product) ?? 0) - this.getCoefficient(arg));
    }
    const newLhs: number[] = [];
    const copied = new Set<number>();
    for (const arg of lhsMonomials) {
      if (this.manager.isNumeral(arg)) continue;
      const product = this.getPowerProduct(arg);
      if (!multiple.has(product)) newLhs.push(arg);
      else if (!copied.has(product)) {
        copied.add(product);
        const coefficient = coeffs.get(product) ?? 0;
        if (coefficient !== 0) newLhs.push(this.mkMulAppWith(coefficient, product));
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
        if (coefficient === -1) newLhs.push(product);
        else if (coefficient !== 0)
          newLhs.push(this.mkMulApp([this.manager.mkNumeral(-coefficient), product]));
      }
    }
    const sortedLhs = isMoving && this.options.isSortSums ? this.sortMonomials(newLhs, 0) : newLhs;
    const isConstantAtRhs = isMoving || newRhs.length === 0 || newLhs.length > 0;
    const value = isConstantAtRhs ? -constant : constant;
    const isLhsConstant = !isConstantAtRhs && (sortedLhs.length === 0 || value !== 0);
    const isRhsConstant = isConstantAtRhs && (newRhs.length === 0 || value !== 0);
    // The constants are created first, the right one before the left one.
    const rhsConstant = isRhsConstant ? [this.manager.mkNumeral(value)] : [];
    const lhsConstant = isLhsConstant ? [this.manager.mkNumeral(value)] : [];
    const lhsResult = this.mkAddApp([...lhsConstant, ...sortedLhs]);
    return { lhs: lhsResult, rhs: this.mkAddApp([...rhsConstant, ...newRhs]) };
  }
}

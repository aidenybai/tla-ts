// Ported from Z3 (src/ast/rewriter/poly_rewriter_def.h, arith_rewriter.cpp), MIT license, see
// z3-license.txt. Only integer arithmetic is ported, without powers, algebraic numbers, hoisting or
// nonlinear factoring, which tlapm's encoding does not produce.
import {
  AstManager,
  KIND_APP,
  OP_ABS,
  OP_ADD,
  OP_GE,
  OP_GT,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import { getGcd } from "./rational";

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

// The parameters that asserted_formulas gives the kernel's rewriter, which also simplifies instances.
export const KERNEL_ARITH_OPTIONS: ArithRewriterOptions = {
  isSom: true,
  isSortSums: true,
  isArithIneqLhs: true,
  isGcdRounding: true,
};

// The defaults, which the simplify tactic uses.
export const TACTIC_ARITH_OPTIONS: ArithRewriterOptions = {
  isSom: false,
  isSortSums: false,
  isArithIneqLhs: false,
  isGcdRounding: false,
};

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

// BR_REWRITE_FULL: the result is rewritten again at every depth.
const FULL_DEPTH = Number.MAX_SAFE_INTEGER;

// SMT-LIB's div and mod, whose remainder is never negative.
const getEuclideanDiv = (dividend: number, divisor: number) =>
  divisor > 0 ? Math.floor(dividend / divisor) : -Math.floor(dividend / -divisor);

const getEuclideanMod = (dividend: number, divisor: number) =>
  dividend - divisor * getEuclideanDiv(dividend, divisor);

// symmod: the remainder closest to zero, for a positive modulus.
const getSymmetricMod = (value: number, modulus: number) => {
  const remainder = getEuclideanMod(value, modulus);
  return 2 * remainder > modulus ? remainder - modulus : remainder;
};

const KIND_LE = 0;
const KIND_GE = 1;
const KIND_EQ = 2;

const getInverse = (kind: number) =>
  kind === KIND_LE ? KIND_GE : kind === KIND_GE ? KIND_LE : KIND_EQ;

export class ArithRewriter {
  constructor(
    private manager: AstManager,
    private options: ArithRewriterOptions,
    private reduce: Reduce,
  ) {}

  private isZero(expr: number) {
    return this.manager.isNumeral(expr) && this.manager.values[expr] === 0;
  }

  private isAdd(expr: number) {
    return this.manager.getOp(expr) === OP_ADD;
  }

  private isMul(expr: number) {
    return this.manager.getOp(expr) === OP_MUL;
  }

  private isArithTerm(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && ARITH_OPS.has(this.manager.getOp(expr));
  }

  private getMonomials(expr: number) {
    return this.isAdd(expr) ? this.manager.args[expr] : [expr];
  }

  // get_power_product: the monomial without its coefficient.
  private getPowerProduct(expr: number) {
    const args = this.manager.args[expr];
    return this.isMul(expr) && args.length === 2 && this.manager.isNumeral(args[0])
      ? args[1]
      : expr;
  }

  private getCoefficient(expr: number) {
    const args = this.manager.args[expr];
    return this.isMul(expr) && args.length === 2 && this.manager.isNumeral(args[0])
      ? this.manager.values[args[0]]
      : 1;
  }

  // mon_lt::ordinal, without powers.
  private getOrdinal(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || !ARITH_OPS.has(manager.getOp(expr))) return expr;
    if (this.isMul(expr)) {
      const args = manager.args[expr];
      return this.manager.isNumeral(args[0]) ? args[1] : expr;
    }
    return this.manager.isNumeral(expr) ? -1 : expr;
  }

  private sortMonomials(monomials: number[], start: number) {
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

  private mkMulAppWith(coefficient: number, arg: number) {
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
    if (!this.isArithTerm(left) && !this.isArithTerm(right)) return undefined;
    return this.mkLeGeEq(left, right, KIND_EQ);
  }

  // mk_idiv_core and mk_mod_core: SMT-LIB integer division, whose remainder is non-negative.
  private mkIdivApp(left: number, right: number) {
    return this.manager.mkApp(OP_IDIV, [left, right], SORT_INT);
  }

  private mkModApp(left: number, right: number) {
    return this.manager.mkApp(OP_MOD, [left, right], SORT_INT);
  }

  // arith_util's mk_mul, which makes no product of one factor.
  private mkFlatMulApp(args: number[]) {
    return args.length === 1 ? args[0] : this.manager.mkApp(OP_MUL, args, SORT_INT);
  }

  private mkIntIte(condition: number, thenExpr: number, elseExpr: number) {
    return this.manager.mkApp(OP_ITE, [condition, thenExpr, elseExpr], SORT_INT);
  }

  // flat_mul: the factors of nested products, in Z3's order.
  private getFlatMul(expr: number) {
    const args = [expr];
    for (let index = 0; index < args.length; index++) {
      if (!this.isMul(args[index])) continue;
      const nested = this.manager.args[args[index]];
      args.push(...nested);
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

  // remove_divisor: div ab ac is div b c when a is positive, and div -b -c when it is negative.
  private removeDivisor(factor: number, dividend: number, divisor: number) {
    const manager = this.manager;
    const dividendArgs = this.getFlatMul(dividend);
    const divisorArgs = this.getFlatMul(divisor);
    this.removeFactor(factor, dividendArgs);
    this.removeFactor(factor, divisorArgs);
    const zero = manager.mkNumeral(0);
    const newDividend =
      dividendArgs.length === 0 ? manager.mkNumeral(1) : this.mkFlatMulApp(dividendArgs);
    const newDivisor =
      divisorArgs.length === 0 ? manager.mkNumeral(1) : this.mkFlatMulApp(divisorArgs);
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

  // get_divides: div ab ac is div b c, and common numeral factors cancel.
  private getDivides(dividend: number, divisor: number) {
    const manager = this.manager;
    const dividendArgs = this.getFlatMul(dividend);
    const divisorArgs = this.getFlatMul(divisor);
    let dividendValue = 1;
    let divisorValue = 1;
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
      // A common factor of -1 stays, or the rewriting of (div (* -1 x) (* -1 y)) diverges. Z3's
      // check stores the -1 as the dividend's value.
      if (marked.has(arg) && value !== -1) return this.removeDivisor(arg, dividend, divisor);
      if (marked.has(arg)) dividendValue = -1;
      if (value === undefined) continue;
      divisorValue = value;
      divisorNumeral = arg;
    }
    const gcd = Number(getGcd(BigInt(dividendValue), BigInt(divisorValue)));
    if (gcd === 1) return undefined;
    const reduced = (args: number[], numeral: number | undefined, value: number) => {
      const index = args.indexOf(numeral ?? -1);
      if (index !== -1) args[index] = manager.mkNumeral(value / gcd);
      return this.mkFlatMulApp(args);
    };
    return this.mkIdivApp(
      reduced(dividendArgs, dividendNumeral, dividendValue),
      reduced(divisorArgs, divisorNumeral, divisorValue),
    );
  }

  // mk_idiv_core.
  mkIdiv(left: number, right: number) {
    const manager = this.manager;
    const dividend = manager.getNumeral(left);
    const divisor = manager.getNumeral(right);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0)
      return manager.mkNumeral(getEuclideanDiv(dividend, divisor));
    if (divisor === 1) return left;
    if (divisor === -1) return this.reduce(this.mkFlatMulApp([manager.mkNumeral(-1), left]), 1);
    if (divisor === 0) return undefined;
    const zero = manager.mkNumeral(0);
    if (left === right)
      return this.reduce(
        this.mkIntIte(manager.mkEq(left, zero), this.mkIdivApp(zero, zero), manager.mkNumeral(1)),
        3,
      );
    if (divisor !== undefined && divisor > 0 && this.isAdd(left)) {
      let isChanged = false;
      let added = 0;
      const args = manager.args[left].map((arg) => {
        const value = manager.getNumeral(arg);
        if (value === undefined || value <= 0 || getEuclideanMod(value, divisor) === value)
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
      FULL_DEPTH,
    );
  }

  // mk_mod_core.
  mkMod(left: number, right: number) {
    const manager = this.manager;
    const dividend = manager.getNumeral(left);
    const divisor = manager.getNumeral(right);
    if (dividend !== undefined && divisor !== undefined && divisor !== 0)
      return manager.mkNumeral(getEuclideanMod(dividend, divisor));
    if (divisor === 1 || divisor === -1) return manager.mkNumeral(0);
    const zero = manager.mkNumeral(0);
    if (left === right && divisor === undefined)
      return this.mkIntIte(manager.mkEq(right, zero), this.mkModApp(zero, zero), zero);
    // mod is idempotent on a nonzero modulus.
    if (manager.getOp(left) === OP_MOD && manager.args[left][1] === right) {
      if (divisor !== undefined && divisor !== 0) return left;
      if (divisor === undefined)
        return this.reduce(
          this.mkIntIte(
            manager.mkEq(right, zero),
            this.mkModApp(this.mkModApp(manager.args[left][0], zero), zero),
            left,
          ),
          2,
        );
    }
    // Propagates mod inside a sum or product only if there is something to reduce.
    if (divisor !== undefined && divisor > 0 && (this.isAdd(left) || this.isMul(left))) {
      let isChanged = false;
      const args = manager.args[left].map((arg) => {
        const value = manager.getNumeral(arg);
        if (value !== undefined && getEuclideanMod(value, divisor) !== value) {
          isChanged = true;
          return manager.mkNumeral(getEuclideanMod(value, divisor));
        }
        if (manager.getOp(arg) === OP_MOD && manager.args[arg][1] === right) {
          isChanged = true;
          return manager.args[arg][0];
        }
        const factors = manager.args[arg];
        const coefficient =
          this.isMul(arg) && factors.length === 2 ? manager.getNumeral(factors[0]) : undefined;
        if (coefficient !== undefined && getSymmetricMod(coefficient, divisor) !== coefficient) {
          isChanged = true;
          return manager.mkApp(
            OP_MUL,
            [manager.mkNumeral(getSymmetricMod(coefficient, divisor)), factors[1]],
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
    // For a symbolic modulus, the summands that are multiples of it go: mod (a + k*y) y = mod a y.
    if (divisor === undefined && this.isAdd(left)) {
      const args = manager.args[left].filter(
        (arg) =>
          arg !== right &&
          !(
            this.isMul(arg) &&
            manager.args[arg].length === 2 &&
            ((manager.isNumeral(manager.args[arg][0]) && manager.args[arg][1] === right) ||
              (manager.isNumeral(manager.args[arg][1]) && manager.args[arg][0] === right))
          ),
      );
      if (args.length < manager.args[left].length)
        return this.reduce(this.mkModApp(args.length === 0 ? zero : this.mkAddApp(args), right), 3);
    }
    const leftArgs = manager.args[left];
    const factor =
      this.isMul(left) && leftArgs.length === 2 ? manager.getNumeral(leftArgs[0]) : undefined;
    if (
      divisor !== undefined &&
      divisor > 0 &&
      factor !== undefined &&
      factor > 0 &&
      divisor % factor === 0
    )
      return this.reduce(
        manager.mkApp(
          OP_MUL,
          [
            manager.mkNumeral(factor),
            this.mkModApp(leftArgs[1], manager.mkNumeral(divisor / factor)),
          ],
          SORT_INT,
        ),
        1,
      );
    // mod x -y = mod x y.
    const rightArgs = manager.args[right];
    if (this.isMul(right) && rightArgs.length === 2 && manager.getNumeral(rightArgs[0]) === -1)
      return this.reduce(this.mkModApp(left, rightArgs[1]), 1);
    if (manager.getOp(right) === OP_ITE)
      return this.reduce(
        this.mkIntIte(
          rightArgs[0],
          this.mkModApp(left, rightArgs[1]),
          this.mkModApp(left, rightArgs[2]),
        ),
        3,
      );
    return undefined;
  }

  mkAbs(arg: number) {
    const manager = this.manager;
    return this.reduce(
      manager.mkApp(
        OP_ITE,
        [
          this.mkAtom(arg, this.manager.mkNumeral(0), KIND_GE),
          arg,
          manager.mkApp(OP_UMINUS, [arg], SORT_INT),
        ],
        SORT_INT,
      ),
      2,
    );
  }

  private mkAtom(left: number, right: number, kind: number) {
    const manager = this.manager;
    if (kind === KIND_EQ) return manager.mkEq(left, right);
    return manager.mkApp(kind === KIND_LE ? OP_LE : OP_GE, [left, right], SORT_BOOL);
  }

  // poly_rewriter::cancel_monomials.
  private cancelMonomials(lhs: number, rhs: number, isMoving: boolean) {
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
    return {
      lhs: this.mkAddApp(isLhsConstant ? [this.manager.mkNumeral(value), ...sortedLhs] : sortedLhs),
      rhs: this.mkAddApp(isRhsConstant ? [this.manager.mkNumeral(value), ...newRhs] : newRhs),
    };
  }

  private flattenMul(expr: number, result: number[]) {
    if (this.isMul(expr)) for (const arg of this.manager.args[expr]) this.flattenMul(arg, result);
    else result.push(expr);
  }

  // is_non_negative, without powers and sequences.
  private isNonNegative(expr: number) {
    if (!this.isMul(expr)) return false;
    const args: number[] = [];
    this.flattenMul(expr, args);
    let isNegative = false;
    const counts = new Map<number, number>();
    for (const arg of args) {
      if (this.manager.isNumeral(arg)) {
        if (this.manager.values[arg] < 0) isNegative = !isNegative;
      } else counts.set(arg, (counts.get(arg) ?? 0) + 1);
    }
    if (isNegative) return false;
    const odd = [...counts].filter((entry) => entry[1] % 2 === 1).map((entry) => entry[0]);
    if (odd.length === 0) return true;
    if (odd.length !== 2) return false;
    const isSuccessor = (base: number, sum: number) => {
      if (!this.isAdd(sum)) return false;
      let offset = 0;
      let numBase = 0;
      for (const arg of this.manager.args[sum]) {
        if (this.manager.isNumeral(arg)) offset += this.manager.values[arg];
        else if (arg === base) numBase++;
        else return false;
      }
      return numBase === 1 && (offset === 1 || offset === -1);
    };
    return isSuccessor(odd[0], odd[1]) || isSuccessor(odd[1], odd[0]);
  }

  private negateMonomial(expr: number) {
    const manager = this.manager;
    if (this.manager.isNumeral(expr)) return this.manager.mkNumeral(-this.manager.values[expr]);
    if (this.isMul(expr)) {
      const args = manager.args[expr];
      if (!this.manager.isNumeral(args[0]))
        return this.mkMulApp([this.manager.mkNumeral(-1), expr]);
      const value = this.manager.values[args[0]];
      const rest = args.slice(1);
      const factors = value === -1 ? rest : [this.manager.mkNumeral(-value), ...rest];
      return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, SORT_INT);
    }
    return manager.mkApp(OP_MUL, [this.manager.mkNumeral(-1), expr], SORT_INT);
  }

  private getNegatedPolynomial(expr: number) {
    const manager = this.manager;
    const isNegativeMonomial = (term: number) =>
      this.isMul(term) &&
      this.manager.isNumeral(manager.args[term][0]) &&
      this.manager.values[manager.args[term][0]] < 0;
    if (isNegativeMonomial(expr)) return this.negateMonomial(expr);
    if (!this.isAdd(expr) || !isNegativeMonomial(manager.args[expr][0])) return undefined;
    return manager.mkApp(
      OP_ADD,
      manager.args[expr].map((arg) => this.negateMonomial(arg)),
      SORT_INT,
    );
  }

  // is_separated.
  private getSeparated(left: number, right: number, kind: number) {
    const manager = this.manager;
    if (kind === KIND_EQ || !this.manager.isNumeral(right)) return undefined;
    const rightValue = this.manager.values[right];
    if (kind === KIND_GE && rightValue === 0 && this.isMul(left) && this.isNonNegative(left))
      return manager.trueExpr;
    let bound = 0;
    let hasBound = true;
    for (const arg of this.getMonomials(left)) {
      if (this.manager.isNumeral(arg)) bound += this.manager.values[arg];
      else if (kind === KIND_LE && this.isNonNegative(arg)) continue;
      else if (kind === KIND_GE) {
        const negated = this.getNegatedPolynomial(arg);
        if (negated === undefined || !this.isNonNegative(negated)) hasBound = false;
      } else hasBound = false;
    }
    if (!hasBound) return undefined;
    if (kind === KIND_LE && bound < rightValue) return undefined;
    if (kind === KIND_GE && bound > rightValue) return undefined;
    if (kind === KIND_LE && bound > rightValue) return manager.falseExpr;
    if (kind === KIND_GE && bound < rightValue) return manager.falseExpr;
    const zero = this.manager.mkNumeral(0);
    if (bound === 0 && this.isMul(left)) {
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
    return this.reduce(
      manager.mkAnd(
        manager.args[left]
          .filter((arg) => !this.manager.isNumeral(arg))
          .map((arg) => this.mkAtom(arg, zero, kind)),
      ),
      2,
    );
  }

  // is_bound.
  private getBound(inputLeft: number, inputRight: number, inputKind: number) {
    const manager = this.manager;
    if (
      !this.isAdd(inputLeft) &&
      manager.getOp(inputLeft) !== OP_MOD &&
      this.manager.isNumeral(inputRight)
    ) {
      const product = this.getPowerProduct(inputLeft);
      const coefficient = this.getCoefficient(inputLeft);
      const isNegative = coefficient < 0;
      const scale = isNegative ? -coefficient : coefficient;
      const kind = isNegative ? getInverse(inputKind) : inputKind;
      if (coefficient === 0 || (!isNegative && scale === 1)) return undefined;
      const quotient =
        (isNegative ? -this.manager.values[inputRight] : this.manager.values[inputRight]) / scale;
      if (Number.isInteger(quotient))
        return this.mkAtom(product, this.manager.mkNumeral(quotient), kind);
      if (kind === KIND_EQ) return manager.falseExpr;
      return this.mkAtom(
        product,
        this.manager.mkNumeral(kind === KIND_LE ? Math.floor(quotient) : Math.ceil(quotient)),
        kind,
      );
    }
    const isSwapped = manager.getOp(inputRight) === OP_MOD;
    const left = isSwapped ? inputRight : inputLeft;
    const right = isSwapped ? inputLeft : inputRight;
    const kind = isSwapped ? getInverse(inputKind) : inputKind;
    if (!this.manager.isNumeral(right) || manager.getOp(left) !== OP_MOD) return undefined;
    const divisor = manager.args[left][1];
    if (!this.manager.isNumeral(divisor) || this.manager.values[divisor] === 0) return undefined;
    const value = this.manager.values[right];
    const modulus = Math.abs(this.manager.values[divisor]);
    if (value < 0) return kind === KIND_GE ? manager.trueExpr : manager.falseExpr;
    if (value === 0 && kind === KIND_GE) return manager.trueExpr;
    if (value > 0 && value >= modulus)
      return kind === KIND_LE ? manager.trueExpr : manager.falseExpr;
    if (value + 1 === modulus && kind === KIND_LE) return manager.trueExpr;
    return undefined;
  }

  // div_polynomial: undefined when a constant is not divisible and the atom is an equality.
  private dividePolynomial(expr: number, divisor: number, rounding: "floor" | "ceil" | "none") {
    const newArgs: number[] = [];
    for (const arg of this.getMonomials(expr)) {
      if (this.manager.isNumeral(arg)) {
        const quotient = this.manager.values[arg] / divisor;
        if (!Number.isInteger(quotient) && rounding === "none") return undefined;
        const rounded = Number.isInteger(quotient)
          ? quotient
          : rounding === "floor"
            ? Math.floor(quotient)
            : Math.ceil(quotient);
        if (rounded !== 0) newArgs.push(this.manager.mkNumeral(rounded));
        continue;
      }
      const coefficient = this.getCoefficient(arg) / divisor;
      const product = this.getPowerProduct(arg);
      if (coefficient === 1) newArgs.push(product);
      else if (coefficient !== 0)
        newArgs.push(
          this.manager.mkApp(OP_MUL, [this.manager.mkNumeral(coefficient), product], SORT_INT),
        );
    }
    return this.mkAddApp(newArgs);
  }

  // get_coeffs_gcd: the gcd of the coefficients, or 0 when there is no monomial, and the number of
  // non-zero constants.
  private getCoeffsGcd(expr: number, state: { gcd: number; isFirst: boolean; numConsts: number }) {
    for (const arg of this.getMonomials(expr)) {
      if (this.manager.isNumeral(arg)) {
        if (this.manager.values[arg] !== 0) state.numConsts++;
        continue;
      }
      state.gcd = state.isFirst
        ? this.getCoefficient(arg)
        : Number(getGcd(BigInt(this.getCoefficient(arg)), BigInt(state.gcd)));
      state.isFirst = false;
      if (state.gcd === 1) return;
    }
  }

  // mk_le_ge_eq_core.
  private mkLeGeEq(originalLeft: number, originalRight: number, kind: number): number | undefined {
    const manager = this.manager;
    const cancelled = this.cancelMonomials(
      originalLeft,
      originalRight,
      this.options.isArithIneqLhs,
    );
    let isChanged = cancelled !== undefined;
    let left = cancelled === undefined ? originalLeft : cancelled.lhs;
    let right = cancelled === undefined ? originalRight : cancelled.rhs;
    if (this.manager.isNumeral(left) && this.manager.isNumeral(right)) {
      const leftValue = this.manager.values[left];
      const rightValue = this.manager.values[right];
      const holds =
        kind === KIND_LE
          ? leftValue <= rightValue
          : kind === KIND_GE
            ? leftValue >= rightValue
            : leftValue === rightValue;
      return holds ? manager.trueExpr : manager.falseExpr;
    }
    const separated = this.getSeparated(left, right, kind);
    if (separated !== undefined) return separated;
    const bound = this.getBound(left, right, kind) ?? this.getBound(right, left, getInverse(kind));
    if (bound !== undefined) return bound;
    if (this.options.isGcdRounding) {
      const state = { gcd: 0, isFirst: true, numConsts: 0 };
      this.getCoeffsGcd(left, state);
      if ((state.isFirst || state.gcd !== 1) && state.numConsts <= 1)
        this.getCoeffsGcd(right, state);
      const divisor = Math.abs(state.gcd);
      if (!state.isFirst && divisor !== 1 && state.numConsts <= 1) {
        const newLeft = this.dividePolynomial(
          left,
          divisor,
          kind === KIND_LE ? "ceil" : kind === KIND_GE ? "floor" : "none",
        );
        if (newLeft === undefined) return manager.falseExpr;
        const newRight = this.dividePolynomial(
          right,
          divisor,
          kind === KIND_LE ? "floor" : kind === KIND_GE ? "ceil" : "none",
        );
        if (newRight === undefined) return manager.falseExpr;
        left = newLeft;
        right = newRight;
        isChanged = true;
      }
    }
    if (manager.getOp(left) === OP_ITE && this.manager.isNumeral(right)) {
      const iteArgs = manager.args[left];
      const condition = iteArgs[0];
      const rightValue = this.manager.values[right];
      const holds = (value: number) =>
        kind === KIND_LE
          ? value <= rightValue
          : kind === KIND_GE
            ? value >= rightValue
            : value === rightValue;
      if (this.manager.isNumeral(iteArgs[1])) {
        const rest = this.mkAtom(iteArgs[2], right, kind);
        return this.reduce(
          holds(this.manager.values[iteArgs[1]])
            ? manager.mkOr([condition, rest])
            : manager.mkAnd([manager.mkNot(condition), rest]),
          2,
        );
      }
      if (this.manager.isNumeral(iteArgs[2])) {
        const rest = this.mkAtom(iteArgs[1], right, kind);
        return this.reduce(
          holds(this.manager.values[iteArgs[2]])
            ? manager.mkOr([manager.mkNot(condition), rest])
            : manager.mkAnd([condition, rest]),
          2,
        );
      }
    }
    const negated =
      this.options.isArithIneqLhs && this.manager.isNumeral(right)
        ? this.getNegatedPolynomial(left)
        : undefined;
    if (negated !== undefined)
      return this.mkAtom(
        negated,
        this.manager.mkNumeral(-this.manager.values[right]),
        getInverse(kind),
      );
    if (isChanged && left === originalLeft && right === originalRight) return undefined;
    if (isChanged) return this.mkAtom(left, right, kind);
    return undefined;
  }
}

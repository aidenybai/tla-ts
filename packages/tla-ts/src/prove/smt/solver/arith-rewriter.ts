// Ported from Z3 (src/ast/rewriter/arith_rewriter.cpp), MIT license, see z3-license.txt. Only
// linear arithmetic and nonlinear factoring are ported, without powers, algebraic numbers or
// hoisting, which tlapm's encoding does not produce.
import {
  OP_ADD,
  OP_GE,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getGcd, Rational } from "./rational";
import { type ArithRewriterOptions, PolyRewriter } from "./poly-rewriter";
import type { Rewrite } from "./rewriter-tpl";

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

// mpz_manager's div and mod: SMT-LIB's, whose remainder is never negative. By a positive divisor,
// div is the floor of the quotient.
const getEuclideanDiv = (dividend: bigint, divisor: bigint) => {
  const quotient = dividend / divisor;
  if (dividend >= 0n || quotient * divisor === dividend) return quotient;
  return divisor < 0n ? quotient + 1n : quotient - 1n;
};

const getEuclideanMod = (dividend: bigint, divisor: bigint) => {
  const remainder = dividend % divisor;
  if (remainder >= 0n) return remainder;
  return divisor > 0n ? remainder + divisor : remainder - divisor;
};

// The ceiling of the quotient by a positive divisor.
const getCeilDiv = (dividend: bigint, divisor: bigint) => -getEuclideanDiv(-dividend, divisor);

// symmod: the remainder closest to zero, for a positive modulus.
const getSymmetricMod = (value: bigint, modulus: bigint) => {
  const remainder = getEuclideanMod(value, modulus);
  return 2n * remainder > modulus ? remainder - modulus : remainder;
};

const KIND_LE = 0;
const KIND_GE = 1;
const KIND_EQ = 2;

const getInverse = (kind: number) =>
  kind === KIND_LE ? KIND_GE : kind === KIND_GE ? KIND_LE : KIND_EQ;

export class ArithRewriter extends PolyRewriter {
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

  // get_divides: div ab ac is div b c, and common numeral factors cancel.
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
      // A common factor of -1 stays, or the rewriting of (div (* -1 x) (* -1 y)) diverges. Z3's
      // check stores the -1 as the dividend's value.
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

  // mk_idiv_core.
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
      const args = manager.args[left].map((arg) => {
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

  // mk_mod_core.
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
    // mod is idempotent on a nonzero modulus.
    if (manager.getOp(left) === OP_MOD && manager.args[left][1] === right) {
      if (divisor !== undefined && divisor !== 0n) return left;
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
    if (divisor !== undefined && divisor > 0n && (this.isAdd(left) || this.isMul(left))) {
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
            this.mkModApp(leftArgs[1], manager.mkNumeral(divisor / factor)),
          ],
          SORT_INT,
        ),
        1,
      );
    // mod x -y = mod x y.
    const rightArgs = manager.args[right];
    if (this.isMul(right) && rightArgs.length === 2 && manager.getNumeral(rightArgs[0]) === -1n)
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

  // mk_div_core: division by a numeral other than 0 is a product.
  mkDiv(left: number, right: number) {
    const manager = this.manager;
    this.currSort = manager.sorts[left];
    if (!manager.isNumeral(right) || this.getValue(right).isZero()) return undefined;
    const divisor = this.getValue(right);
    if (manager.isNumeral(left)) return manager.mkRealNumeral(this.getValue(left).div(divisor));
    return this.reduce(
      manager.mkApp(OP_MUL, [manager.mkRealNumeral(Rational.one.div(divisor)), left], SORT_REAL),
      1,
    );
  }

  // mk_to_int_core: (to_int (+ 1.0 (to_real x) y)) is (+ 1 x (to_int y)).
  mkToInt(arg: number) {
    const manager = this.manager;
    if (manager.isInt(arg)) return arg;
    if (manager.isNumeral(arg)) return manager.mkNumeral(this.getValue(arg).floor().num);
    const op = manager.getOp(arg);
    if (op === OP_TO_REAL && manager.isInt(manager.args[arg][0])) return manager.args[arg][0];
    if (op !== OP_ADD && op !== OP_MUL) return undefined;
    const intArgs: number[] = [];
    const realArgs: number[] = [];
    for (const child of manager.args[arg]) {
      if (manager.isNumeral(child) && this.getValue(child).isInt())
        intArgs.push(manager.mkNumeral(this.getValue(child).num));
      else if (manager.getOp(child) === OP_TO_REAL) intArgs.push(manager.args[child][0]);
      else realArgs.push(child);
    }
    // Z3 makes a sum of one argument, which the manager leaves out.
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

  // mk_to_real_core, with push_to_real: to_real distributes over sums and products.
  mkToReal(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg)) return manager.mkRealNumeral(this.getValue(arg));
    if (manager.isReal(arg)) return arg;
    const op = manager.getOp(arg);
    if (op !== OP_ADD && op !== OP_MUL) return undefined;
    return this.reduce(
      manager.mkApp(
        op,
        manager.args[arg].map((child) => manager.mkApp(OP_TO_REAL, [child], SORT_REAL)),
        SORT_REAL,
      ),
      2,
    );
  }

  // mk_is_int: a numeral is decided, and a term built from integers by sums and products is an
  // integer. Any other term x is an integer when (to_real (to_int x)) is x.
  mkIsInt(arg: number) {
    const manager = this.manager;
    if (manager.isNumeral(arg))
      return this.getValue(arg).isInt() ? manager.trueExpr : manager.falseExpr;
    const todo = [arg];
    const visited = new Set<number>();
    let isIntegral = true;
    while (todo.length > 0 && isIntegral) {
      const current = todo.pop() as number;
      if (visited.has(current)) continue;
      visited.add(current);
      const op = manager.getOp(current);
      if (op === OP_TO_REAL) continue;
      if (manager.isNumeral(current)) isIntegral = this.getValue(current).isInt();
      else if (op === OP_MUL || op === OP_ADD || op === OP_SUB || op === OP_UMINUS)
        todo.push(...manager.args[current]);
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
        if (this.getValue(arg).isNegative()) isNegative = !isNegative;
      } else counts.set(arg, (counts.get(arg) ?? 0) + 1);
    }
    if (isNegative) return false;
    const odd = [...counts].filter((entry) => entry[1] % 2 === 1).map((entry) => entry[0]);
    if (odd.length === 0) return true;
    if (odd.length !== 2) return false;
    const isSuccessor = (base: number, sum: number) => {
      if (!this.isAdd(sum)) return false;
      let offset = Rational.zero;
      let numBase = 0;
      for (const arg of this.manager.args[sum]) {
        if (this.manager.isNumeral(arg)) offset = offset.add(this.getValue(arg));
        else if (arg === base) numBase++;
        else return false;
      }
      return numBase === 1 && (offset.equals(Rational.one) || offset.equals(Rational.minusOne));
    };
    return isSuccessor(odd[0], odd[1]) || isSuccessor(odd[1], odd[0]);
  }

  private negateMonomial(expr: number) {
    const manager = this.manager;
    if (this.manager.isNumeral(expr)) return this.mkNumeral(this.getValue(expr).neg());
    if (this.isMul(expr)) {
      const args = manager.args[expr];
      if (!this.manager.isNumeral(args[0]))
        return this.mkMulApp([this.mkNumeral(Rational.minusOne), expr]);
      const value = this.getValue(args[0]);
      const rest = args.slice(1);
      const factors = value.equals(Rational.minusOne)
        ? rest
        : [this.mkNumeral(value.neg()), ...rest];
      return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, this.currSort);
    }
    return manager.mkApp(OP_MUL, [this.mkNumeral(Rational.minusOne), expr], this.currSort);
  }

  private getNegatedPolynomial(expr: number) {
    const manager = this.manager;
    const isNegativeMonomial = (term: number) =>
      this.isMul(term) &&
      this.manager.isNumeral(manager.args[term][0]) &&
      this.getValue(manager.args[term][0]).isNegative();
    if (isNegativeMonomial(expr)) return this.negateMonomial(expr);
    if (!this.isAdd(expr) || !isNegativeMonomial(manager.args[expr][0])) return undefined;
    return manager.mkApp(
      OP_ADD,
      manager.args[expr].map((arg) => this.negateMonomial(arg)),
      this.currSort,
    );
  }

  // is_separated.
  private getSeparated(left: number, right: number, kind: number) {
    const manager = this.manager;
    if (kind === KIND_EQ || !this.manager.isNumeral(right)) return undefined;
    const rightValue = this.getValue(right);
    if (kind === KIND_GE && rightValue.isZero() && this.isMul(left) && this.isNonNegative(left))
      return manager.trueExpr;
    let bound = Rational.zero;
    let hasBound = true;
    for (const arg of this.getMonomials(left)) {
      if (this.manager.isNumeral(arg)) bound = bound.add(this.getValue(arg));
      else if (kind === KIND_LE && this.isNonNegative(arg)) continue;
      else if (kind === KIND_GE) {
        const negated = this.getNegatedPolynomial(arg);
        if (negated === undefined || !this.isNonNegative(negated)) hasBound = false;
      } else hasBound = false;
    }
    if (!hasBound) return undefined;
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
    const divisor = manager.args[left][1];
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

  // div_polynomial: undefined when a constant is not divisible and the atom is an equality.
  private dividePolynomial(expr: number, divisor: bigint, rounding: "floor" | "ceil" | "none") {
    const newArgs: number[] = [];
    for (const arg of this.getMonomials(expr)) {
      if (this.manager.isNumeral(arg)) {
        const value = this.manager.getNumeralValue(arg);
        const isDivisible = value % divisor === 0n;
        if (!isDivisible && rounding === "none") return undefined;
        const rounded =
          isDivisible || rounding === "floor"
            ? getEuclideanDiv(value, divisor)
            : getCeilDiv(value, divisor);
        if (rounded !== 0n) newArgs.push(this.manager.mkNumeral(rounded));
        continue;
      }
      const coefficient = this.getCoefficient(arg).num / divisor;
      const product = this.getPowerProduct(arg);
      if (coefficient === 1n) newArgs.push(product);
      else if (coefficient !== 0n)
        newArgs.push(
          this.manager.mkApp(OP_MUL, [this.manager.mkNumeral(coefficient), product], SORT_INT),
        );
    }
    return this.mkAddApp(newArgs);
  }

  // get_coeffs_gcd: the gcd of the coefficients, or 0 when there is no monomial, and the number of
  // non-zero constants.
  private getCoeffsGcd(expr: number, state: { gcd: bigint; isFirst: boolean; numConsts: number }) {
    for (const arg of this.getMonomials(expr)) {
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

  // mk_le_ge_eq_core. Z3 holds the rewritten sides, new_arg1 and new_arg2, until it returns.
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
        const newRight = this.dividePolynomial(
          right,
          divisor,
          kind === KIND_LE ? "floor" : kind === KIND_GE ? "ceil" : "none",
        );
        if (newRight === undefined) return manager.falseExpr;
        setSide(1, newRight);
        left = newLeft;
        right = newRight;
        isChanged = true;
      }
    }
    if (manager.getOp(left) === OP_ITE && this.manager.isNumeral(right)) {
      const iteArgs = manager.args[left];
      const condition = iteArgs[0];
      const rightValue = this.getValue(right);
      const holds = (value: Rational) => this.isHolding(value, rightValue, kind);
      // Z3 makes the negated condition before it knows whether the result uses it.
      if (this.manager.isNumeral(iteArgs[1])) {
        const negated = manager.mkNot(condition);
        const rest = this.mkAtom(iteArgs[2], right, kind);
        return this.reduce(
          holds(this.getValue(iteArgs[1]))
            ? manager.mkOr([condition, rest])
            : manager.mkAnd([negated, rest]),
          2,
        );
      }
      if (this.manager.isNumeral(iteArgs[2])) {
        const negated = manager.mkNot(condition);
        const rest = this.mkAtom(iteArgs[1], right, kind);
        return this.reduce(
          holds(this.getValue(iteArgs[2]))
            ? manager.mkOr([negated, rest])
            : manager.mkAnd([condition, rest]),
          2,
        );
      }
    }
    const isToIntRight = manager.getOp(right) === OP_TO_INT && manager.isNumeral(left);
    const toIntArg =
      manager.getOp(isToIntRight ? right : left) === OP_TO_INT
        ? manager.args[isToIntRight ? right : left][0]
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

  // factor_le_ge_eq: a sum with a nonlinear factor f, fg >= 0, splits on the signs of f and g.
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

  // arith_util::mk_eq: a numeral goes right, and otherwise the side with the smaller id goes left.
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

  // find_nl_factor: a factor of the first nonlinear product of a sum that divides every monomial.
  private findNlFactor(expr: number) {
    const sum = [expr];
    for (let index = 0; index < sum.length; index++) {
      const arg = sum[index];
      if (this.isAdd(arg)) {
        sum.push(...this.manager.args[arg]);
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

  // get_nl_muls: the factors of a product that are not numerals.
  private getNlMuls(expr: number, muls: number[]) {
    if (this.isMul(expr)) for (const arg of this.manager.args[expr]) this.getNlMuls(arg, muls);
    else if (!this.manager.isNumeral(expr)) muls.push(expr);
  }

  private isMulFactor(factor: number, expr: number): boolean {
    if (this.isMul(expr))
      return this.manager.args[expr].some((arg) => this.isMulFactor(factor, arg));
    return factor === expr;
  }

  private isAddFactor(factor: number, expr: number): boolean {
    if (this.isAdd(expr))
      return this.manager.args[expr].every((arg) => this.isAddFactor(factor, arg));
    return this.isMulFactor(factor, expr);
  }

  // remove_factor: the sum or product without one occurrence of the factor in each monomial.
  private removeNlFactor(factor: number, expr: number): number {
    const manager = this.manager;
    const sort = manager.sorts[expr];
    if (this.isMul(expr)) {
      const rest = [expr];
      for (let index = 0; index < rest.length; index++) {
        const arg = rest[index];
        if (this.isMul(arg)) {
          rest.push(...manager.args[arg]);
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
          sum.push(...manager.args[arg]);
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

// Ported from Z3 (src/ast/simplifiers/bound_simplifier.cpp, src/ast/simplifiers/bound_propagator.cpp),
// MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_ADD,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_IDIV,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_NOT,
  OP_SUB,
  OP_TO_REAL,
  SORT_BOOL,
  SORT_INT,
} from "./ast";
import type { Goal } from "./goal";
import {
  add,
  type DepInterval,
  div,
  intersect,
  mkDepInterval,
  mul,
  set,
  setValue,
} from "./lp/dep-intervals";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

interface Bound {
  value: Rational;
  isStrict: boolean;
}

// bound_simplifier never adds a linear equation to its bound_propagator, so the propagator only
// keeps the asserted bounds and its propagate has nothing to do.
class BoundPropagator {
  private isInts: boolean[] = [];
  readonly lowers: (Bound | undefined)[] = [];
  readonly uppers: (Bound | undefined)[] = [];

  mkVar(variable: number, isInt: boolean) {
    this.isInts[variable] = isInt;
    this.lowers[variable] = undefined;
    this.uppers[variable] = undefined;
  }

  assertLower(variable: number, value: Rational, isStrict: boolean) {
    const bound = this.isInts[variable]
      ? {
          value: value.isInt() ? (isStrict ? value.add(Rational.one) : value) : value.ceil(),
          isStrict: false,
        }
      : { value, isStrict };
    const old = this.lowers[variable];
    if (
      old !== undefined &&
      !(
        bound.value.compare(old.value) > 0 ||
        (!old.isStrict && bound.isStrict && bound.value.equals(old.value))
      )
    )
      return;
    this.lowers[variable] = bound;
  }

  assertUpper(variable: number, value: Rational, isStrict: boolean) {
    const bound = this.isInts[variable]
      ? {
          value: value.isInt() ? (isStrict ? value.sub(Rational.one) : value) : value.floor(),
          isStrict: false,
        }
      : { value, isStrict };
    const old = this.uppers[variable];
    if (
      old !== undefined &&
      !(
        bound.value.compare(old.value) < 0 ||
        (!old.isStrict && bound.isStrict && bound.value.equals(old.value))
      )
    )
      return;
    this.uppers[variable] = bound;
  }

  getBound(isLower: boolean, coeffs: Rational[], variables: number[]): Bound | undefined {
    let value = Rational.zero;
    let isStrict = false;
    for (const [index, coeff] of coeffs.entries()) {
      if (coeff.isZero()) continue;
      const bound =
        coeff.isNegative() === isLower
          ? this.uppers[variables[index]]
          : this.lowers[variables[index]];
      if (bound === undefined) return undefined;
      if (bound.isStrict) isStrict = true;
      value = value.add(coeff.mul(bound.value));
    }
    return { value, isStrict };
  }

  reset() {
    this.isInts = [];
    this.lowers.length = 0;
    this.uppers.length = 0;
  }
}

class BoundRewriter extends RewriterTpl {
  constructor(
    manager: AstManager,
    private simplifier: BoundSimplifier,
  ) {
    super(manager);
  }

  reduceApp(decl: number, args: number[], sort: number) {
    return this.simplifier.reduceApp(decl, args, sort);
  }
}

class BoundSimplifier {
  private propagator = new BoundPropagator();
  private rewriter: Rewriter;
  private var2expr: number[] = [];
  private expr2var = new Map<number, number>();
  private trail: RefVector;

  constructor(
    private manager: AstManager,
    private goal: Goal,
  ) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.trail = new RefVector(manager);
  }

  private getNumeral(expr: number) {
    return this.manager.isNumeral(expr) ? this.manager.getRationalValue(expr) : undefined;
  }

  private isVar(expr: number) {
    return this.expr2var.has(expr);
  }

  private toVar(expr: number) {
    const manager = this.manager;
    const existing = this.expr2var.get(expr);
    if (existing !== undefined) return existing;
    const variable = this.var2expr.length;
    const core = manager.getOp(expr) === OP_TO_REAL ? manager.getArg(expr, 0) : expr;
    this.propagator.mkVar(variable, manager.sorts[core] === SORT_INT);
    this.expr2var.set(expr, variable);
    if (core !== expr) this.expr2var.set(core, variable);
    this.var2expr.push(core);
    this.trail.push(expr);
    return variable;
  }

  private getBinary(expr: number, op: number) {
    const manager = this.manager;
    return manager.getOp(expr) === op && manager.getNumArgs(expr) === 2
      ? manager.getArgs(expr)
      : undefined;
  }

  private getBounds(expr: number): DepInterval {
    const manager = this.manager;
    const interval = mkDepInterval();
    const value = this.getNumeral(expr);
    if (value !== undefined) {
      setValue(interval, value);
      return interval;
    }
    if (this.isVar(expr)) {
      const variable = this.toVar(expr);
      const upper = this.propagator.uppers[variable];
      if (upper !== undefined) {
        interval.upper = upper.value;
        interval.isUpperInf = false;
        interval.isUpperOpen = upper.isStrict;
      }
      const lower = this.propagator.lowers[variable];
      if (lower !== undefined) {
        interval.lower = lower.value;
        interval.isLowerInf = false;
        interval.isLowerOpen = lower.isStrict;
      }
    }
    const op = manager.getOp(expr);
    if (op === OP_ADD) {
      const sum = mkDepInterval();
      setValue(sum, Rational.zero);
      for (const arg of manager.getArgs(expr)) {
        const result = mkDepInterval();
        add(sum, this.getBounds(arg), result, "without-deps");
        set(sum, result, "without-deps");
      }
      intersect(interval, sum, interval, "without-deps");
    }
    if (op === OP_MUL) {
      const product = mkDepInterval();
      setValue(product, Rational.one);
      for (const arg of manager.getArgs(expr)) {
        const result = mkDepInterval();
        mul(product, this.getBounds(arg), result, "without-deps");
        set(product, result, "without-deps");
      }
      intersect(interval, product, interval, "without-deps");
    }
    const modArgs = this.getBinary(expr, OP_MOD);
    const modulus = modArgs === undefined ? undefined : this.getNumeral(modArgs[1]);
    if (modulus !== undefined && modulus.isPositive()) {
      const range = mkDepInterval();
      range.isLowerInf = false;
      range.isLowerOpen = false;
      range.lower = Rational.zero;
      range.isUpperInf = false;
      range.isUpperOpen = false;
      range.upper = modulus.sub(Rational.one);
      intersect(interval, range, interval, "without-deps");
    }
    const mulArgs = this.getBinary(expr, OP_MUL);
    const mulDivArgs = mulArgs === undefined ? undefined : this.getBinary(mulArgs[1], OP_IDIV);
    if (mulArgs !== undefined && mulDivArgs !== undefined && mulDivArgs[1] === mulArgs[0]) {
      const divisor = this.getBounds(mulArgs[0]);
      const dividend = this.getBounds(mulDivArgs[0]);
      if (
        !divisor.isLowerInf &&
        divisor.lower.isPositive() &&
        !dividend.isUpperInf &&
        !dividend.upper.isNegative()
      ) {
        const range = mkDepInterval();
        range.isUpperInf = false;
        range.isUpperOpen = dividend.isUpperOpen;
        range.upper = dividend.upper;
        intersect(interval, range, interval, "without-deps");
      }
    }
    const idivArgs = this.getBinary(expr, OP_IDIV);
    if (idivArgs !== undefined) {
      const dividend = this.getBounds(idivArgs[0]);
      const divisor = this.getBounds(idivArgs[1]);
      if (
        !divisor.isLowerInf &&
        divisor.lower.isPositive() &&
        !dividend.isUpperInf &&
        !dividend.upper.isNegative()
      ) {
        const range = mkDepInterval();
        range.isUpperInf = false;
        range.isUpperOpen = dividend.isUpperOpen;
        range.upper = dividend.upper;
        range.isLowerInf = false;
        range.isLowerOpen = false;
        range.lower = Rational.zero;
        intersect(interval, range, interval, "without-deps");
      }
    }
    const divArgs = this.getBinary(expr, OP_DIV);
    if (divArgs !== undefined) {
      const quotient = mkDepInterval();
      div(this.getBounds(divArgs[0]), this.getBounds(divArgs[1]), quotient, "without-deps");
      intersect(interval, quotient, interval, "without-deps");
    }
    return interval;
  }

  private getLower(expr: number): Bound | undefined {
    const interval = this.getBounds(expr);
    return interval.isLowerInf
      ? undefined
      : { value: interval.lower, isStrict: interval.isLowerOpen };
  }

  private getUpper(expr: number): Bound | undefined {
    const interval = this.getBounds(expr);
    return interval.isUpperInf
      ? undefined
      : { value: interval.upper, isStrict: interval.isUpperOpen };
  }

  private assertLower(expr: number, value: Rational, isStrict: boolean) {
    this.propagator.assertLower(this.toVar(expr), value, isStrict);
  }

  private assertUpper(expr: number, value: Rational, isStrict: boolean) {
    this.propagator.assertUpper(this.toVar(expr), value, isStrict);
  }

  private mkInt(value: Rational) {
    return this.manager.mkNumeralOfSort(value, SORT_INT);
  }

  // The result comes with a reference, and -1 is BR_FAILED.
  reduceApp(decl: number, args: number[], sort: number): number {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    const modulus = op === OP_MOD && args.length === 2 ? this.getNumeral(args[1]) : undefined;
    if (modulus !== undefined) {
      const interval = this.getBounds(args[0]);
      if (interval.isUpperInf || interval.isLowerInf) return -1;
      if (interval.isUpperOpen || interval.isLowerOpen) return -1;
      if (interval.upper.sub(interval.lower).compare(modulus) >= 0) return -1;
      if (modulus.compare(interval.upper) > 0 && !interval.lower.isNegative()) {
        manager.incRef(args[0]);
        return args[0];
      }
      if (
        modulus.add(modulus).compare(interval.upper) > 0 &&
        interval.lower.compare(modulus) >= 0
      ) {
        const difference = manager.mkApp(OP_SUB, [args[0], this.mkInt(modulus)], SORT_INT);
        manager.incRef(difference);
        const result = this.rewriter.rewrite(difference);
        manager.decRef(difference);
        return result;
      }
    }
    let isChanged = false;
    const newArgs = args.map((arg) => {
      const reduced = this.reduceArg(arg);
      if (reduced !== arg) isChanged = true;
      return reduced;
    });
    if (!isChanged) return -1;
    const result = manager.mkApp(decl, newArgs, sort);
    manager.incRef(result);
    return result;
  }

  private reduceArg(arg: number) {
    const manager = this.manager;
    const op = manager.getOp(arg);
    if ((op !== OP_LE && op !== OP_GE) || manager.getNumArgs(arg) !== 2) return arg;
    const [first, second] = manager.getArgs(arg);
    const firstValue = this.getNumeral(first);
    const secondValue = this.getNumeral(second);
    if (op === OP_LE && secondValue !== undefined)
      return this.reduceBound(first, secondValue, true) ?? arg;
    if (op === OP_GE && firstValue !== undefined)
      return this.reduceBound(second, firstValue, true) ?? arg;
    if (op === OP_LE && firstValue !== undefined)
      return this.reduceBound(second, firstValue, false) ?? arg;
    if (op === OP_GE && secondValue !== undefined)
      return this.reduceBound(first, secondValue, false) ?? arg;
    return arg;
  }

  // x <= n when isUpper, and x >= n otherwise.
  private reduceBound(expr: number, value: Rational, isUpper: boolean) {
    const manager = this.manager;
    if (isUpper) {
      const upper = this.getUpper(expr);
      if (upper !== undefined && !upper.isStrict && value.compare(upper.value) >= 0)
        return manager.trueExpr;
      const lower = this.getLower(expr);
      if (lower !== undefined && !lower.isStrict && value.compare(lower.value) < 0)
        return manager.falseExpr;
      return undefined;
    }
    const lower = this.getLower(expr);
    if (lower !== undefined && !lower.isStrict && value.compare(lower.value) <= 0)
      return manager.trueExpr;
    const upper = this.getUpper(expr);
    if (upper !== undefined && !upper.isStrict && value.compare(upper.value) > 0)
      return manager.falseExpr;
    return undefined;
  }

  reduce() {
    const goal = this.goal;
    let isUpdated = true;
    for (let round = 0; round < 5 && isUpdated; round++) {
      isUpdated = false;
      let isBoundFound = false;
      this.reset();
      const size = goal.forms.size;
      for (let index = 0; index < size && !goal.isInconsistent; index++)
        if (this.insertBound(goal.forms.items[index])) {
          goal.update(index, this.manager.trueExpr);
          isBoundFound = true;
        }
      if (!isBoundFound) break;
      for (let index = 0; index < size && !goal.isInconsistent; index++)
        this.tightenBound(goal.forms.items[index]);
      const rewriter = new BoundRewriter(this.manager, this);
      for (let index = 0; index < size && !goal.isInconsistent; index++) {
        const form = goal.forms.items[index];
        const result = rewriter.rewrite(form);
        if (result !== form) {
          goal.update(index, result);
          isUpdated = true;
        }
        this.manager.decRef(result);
      }
      rewriter.release();
      this.restoreBounds();
    }
  }

  private insertBound(form: number) {
    const manager = this.manager;
    const op = manager.getOp(form);
    if (op === OP_EQ) {
      const [first, second] = manager.getArgs(form);
      const isSwapped = this.getNumeral(second) !== undefined;
      const value = this.getNumeral(isSwapped ? second : first);
      if (value === undefined) return false;
      const other = isSwapped ? first : second;
      this.assertLower(other, value, false);
      this.assertUpper(other, value, false);
      return true;
    }
    if (op === OP_LE || op === OP_GE) return this.insertInequality(form, op, false);
    if (op === OP_NOT) {
      const atom = manager.getArg(form, 0);
      const atomOp = manager.getOp(atom);
      if (atomOp === OP_LE || atomOp === OP_GE) return this.insertInequality(atom, atomOp, true);
    }
    return false;
  }

  private insertInequality(atom: number, op: number, isNegated: boolean) {
    const [first, second] = this.manager.getArgs(atom);
    const firstValue = this.getNumeral(first);
    const secondValue = this.getNumeral(second);
    const isLowerOfSecond = (op === OP_LE) !== isNegated;
    if (firstValue !== undefined) {
      if (isLowerOfSecond) this.assertLower(second, firstValue, isNegated);
      else this.assertUpper(second, firstValue, isNegated);
      return true;
    }
    if (secondValue !== undefined) {
      if (isLowerOfSecond) this.assertUpper(first, secondValue, isNegated);
      else this.assertLower(first, secondValue, isNegated);
      return true;
    }
    return false;
  }

  private getOffset(expr: number, variable: number) {
    const args = this.getBinary(expr, OP_ADD);
    if (args === undefined) return undefined;
    const [first, second] = args[0] === variable ? args : [args[1], args[0]];
    return first === variable ? this.getNumeral(second) : undefined;
  }

  private tightenBound(form: number) {
    const manager = this.manager;
    const le = this.getBinary(form, OP_LE);
    if (le !== undefined) {
      const [variable, modExpr] = le;
      const modArgs = this.getBinary(modExpr, OP_MOD);
      const modulus = modArgs === undefined ? undefined : this.getNumeral(modArgs[1]);
      if (modArgs !== undefined && modulus !== undefined) {
        const lower = this.getLower(variable);
        const offset = this.getOffset(modArgs[0], variable);
        if (
          lower !== undefined &&
          !lower.value.isNegative() &&
          offset !== undefined &&
          offset.isPositive() &&
          offset.compare(modulus) < 0
        )
          this.assertUpper(variable, modulus.sub(offset), true);
        if (modulus.isPositive()) {
          this.assertUpper(variable, modulus, true);
          const sum = this.getBinary(modArgs[0], OP_ADD);
          const variableLower = this.getLower(variable);
          if (
            variableLower !== undefined &&
            !variableLower.value.isNegative() &&
            sum !== undefined
          ) {
            const [first, second] = sum;
            const firstUpper = first === variable ? this.getUpper(second) : undefined;
            if (firstUpper !== undefined && firstUpper.value.compare(modulus) < 0)
              this.assertUpper(modArgs[0], modulus, true);
            const secondUpper = second === variable ? this.getUpper(first) : undefined;
            if (secondUpper !== undefined && secondUpper.value.compare(modulus) < 0)
              this.assertUpper(modArgs[0], modulus, true);
          }
        }
      }
    }
    if (!manager.isNot(form)) return;
    const eq = this.getBinary(manager.getArg(form, 0), OP_EQ);
    if (eq === undefined) return;
    const [variable, valueExpr] = this.getNumeral(eq[0]) !== undefined ? [eq[1], eq[0]] : eq;
    const value = this.getNumeral(valueExpr);
    if (value === undefined) return;
    const interval = this.getBounds(variable);
    if (!interval.isLowerInf && !interval.isLowerOpen && interval.lower.equals(value))
      this.assertLower(variable, value, true);
    else if (!interval.isUpperInf && !interval.isUpperOpen && interval.upper.equals(value))
      this.assertUpper(variable, value, true);
  }

  private getLinearPolynomial(expr: number) {
    const manager = this.manager;
    const coeffs: Rational[] = [];
    const variables: number[] = [];
    const monomials = manager.getOp(expr) === OP_ADD ? manager.getArgs(expr) : [expr];
    for (const monomial of monomials) {
      const args = this.getBinary(monomial, OP_MUL);
      const coeff = args === undefined ? undefined : this.getNumeral(args[0]);
      if (args !== undefined && coeff !== undefined) {
        coeffs.push(coeff);
        variables.push(this.toVar(args[1]));
      } else {
        coeffs.push(Rational.one);
        variables.push(this.toVar(monomial));
      }
    }
    return { coeffs, variables };
  }

  private isSubsumed(expr: number, bound: Bound, isLower: boolean) {
    if (this.manager.getOp(expr) !== OP_ADD) return false;
    const polynomial = this.getLinearPolynomial(expr);
    const implied = this.propagator.getBound(isLower, polynomial.coeffs, polynomial.variables);
    if (implied === undefined) return false;
    const order = implied.value.compare(bound.value);
    return (
      (isLower ? order > 0 : order < 0) || (order === 0 && (!bound.isStrict || implied.isStrict))
    );
  }

  private restoreBounds() {
    const manager = this.manager;
    const goal = this.goal;
    const rewriter = new BoundRewriter(manager, this);
    const addBound = (form: number) => {
      manager.incRef(form);
      const reduced = rewriter.rewrite(form);
      manager.decRef(form);
      const simplified = this.rewriter.rewrite(reduced);
      manager.decRef(reduced);
      goal.assert(simplified);
      manager.decRef(simplified);
    };
    const mkNumeral = (expr: number, value: Rational) =>
      manager.mkNumeralOfSort(value, manager.sorts[expr]);
    const size = this.var2expr.length;
    for (let variable = 0; variable < size; variable++) {
      const expr = this.var2expr[variable];
      const lower = this.propagator.lowers[variable];
      const upper = this.propagator.uppers[variable];
      if (lower === undefined && upper === undefined) continue;
      if (
        lower !== undefined &&
        upper !== undefined &&
        lower.value.equals(upper.value) &&
        !lower.isStrict &&
        !upper.isStrict
      ) {
        addBound(manager.mkEq(expr, mkNumeral(expr, lower.value)));
        continue;
      }
      if (lower !== undefined && !this.isSubsumed(expr, lower, true)) {
        const atom = (op: number) =>
          manager.mkApp(op, [expr, mkNumeral(expr, lower.value)], SORT_BOOL);
        addBound(lower.isStrict ? manager.mkApp(OP_NOT, [atom(OP_LE)], SORT_BOOL) : atom(OP_GE));
      }
      if (upper !== undefined && !this.isSubsumed(expr, upper, false)) {
        const atom = (op: number) =>
          manager.mkApp(op, [expr, mkNumeral(expr, upper.value)], SORT_BOOL);
        addBound(upper.isStrict ? manager.mkApp(OP_NOT, [atom(OP_GE)], SORT_BOOL) : atom(OP_LE));
      }
    }
    rewriter.release();
  }

  private reset() {
    this.propagator.reset();
    this.var2expr = [];
    this.expr2var.clear();
    this.trail.reset();
  }

  release() {
    this.trail.reset();
    this.rewriter.release();
  }
}

export const propagateIneqs = (manager: AstManager, goal: Goal) => {
  if (!goal.isProofsEnabled) {
    const simplifier = new BoundSimplifier(manager, goal);
    simplifier.reduce();
    simplifier.release();
  }
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
};

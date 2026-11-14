// Ported from Z3 (src/ast/simplifiers/bound_manager.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_LE,
  OP_LT,
  OP_MOD,
  OP_OR,
  OP_UMINUS,
} from "./ast";
import { Rational } from "./rational";

interface Limit {
  value: Rational;
  isStrict: boolean;
}

const SWAPPED = new Map([
  [OP_LE, OP_GE],
  [OP_LT, OP_GT],
  [OP_GE, OP_LE],
  [OP_GT, OP_LT],
]);

const NEGATED = new Map([
  [OP_LE, OP_GT],
  [OP_LT, OP_GE],
  [OP_GE, OP_LT],
  [OP_GT, OP_LE],
]);

export class BoundManager {
  readonly lowers = new Map<number, Limit>();
  readonly uppers = new Map<number, Limit>();
  readonly boundedVars: number[] = [];

  constructor(readonly manager: AstManager) {}

  private getNumeral(expr: number): { value: Rational; isInt: boolean } | undefined {
    const manager = this.manager;
    if (manager.getOp(expr) === OP_UMINUS) {
      const inner = this.getNumeral(manager.getArg(expr, 0));
      return inner === undefined ? undefined : { value: inner.value.neg(), isInt: inner.isInt };
    }
    if (!manager.isNumeral(expr)) return undefined;
    return { value: manager.getRationalValue(expr), isInt: manager.isInt(expr) };
  }

  add(form: number) {
    const manager = this.manager;
    if (this.isDisjunctiveBound(form) || this.isEqualityBound(form)) return;
    let atom = form;
    let isPositive = true;
    while (manager.isNot(atom)) {
      atom = manager.getArg(atom, 0);
      isPositive = !isPositive;
    }
    const swapped = SWAPPED.get(manager.getOp(atom));
    if (swapped === undefined || manager.getNumArgs(atom) !== 2) return;
    const lhs = manager.getArg(atom, 0);
    const rhs = manager.getArg(atom, 1);
    const rhsNumeral = this.getNumeral(rhs);
    const lhsNumeral = this.getNumeral(lhs);
    const found =
      manager.isUninterpretedConst(lhs) && rhsNumeral !== undefined
        ? { variable: lhs, numeral: rhsNumeral, op: manager.getOp(atom) }
        : manager.isUninterpretedConst(rhs) && lhsNumeral !== undefined
          ? { variable: rhs, numeral: lhsNumeral, op: swapped }
          : undefined;
    if (found === undefined) return;
    const op = isPositive ? found.op : (NEGATED.get(found.op) as number);
    const normalized =
      found.numeral.isInt && op === OP_LT
        ? { value: found.numeral.value.sub(Rational.one), op: OP_LE }
        : found.numeral.isInt && op === OP_GT
          ? { value: found.numeral.value.add(Rational.one), op: OP_GE }
          : { value: found.numeral.value, op };
    const isStrict = normalized.op === OP_LT || normalized.op === OP_GT;
    if (normalized.op === OP_GT || normalized.op === OP_GE)
      this.insertLower(found.variable, isStrict, normalized.value);
    else this.insertUpper(found.variable, isStrict, normalized.value);
  }

  private insertUpper(variable: number, isStrict: boolean, value: Rational) {
    const old = this.uppers.get(variable);
    if (old === undefined) {
      this.uppers.set(variable, { value, isStrict });
      if (!this.lowers.has(variable)) this.boundedVars.push(variable);
      return;
    }
    const order = value.compare(old.value);
    if (order < 0 || (order === 0 && isStrict && !old.isStrict))
      this.uppers.set(variable, { value, isStrict });
  }

  private insertLower(variable: number, isStrict: boolean, value: Rational) {
    const old = this.lowers.get(variable);
    if (old === undefined) {
      this.lowers.set(variable, { value, isStrict });
      if (!this.uppers.has(variable)) this.boundedVars.push(variable);
      return;
    }
    const order = value.compare(old.value);
    if (order > 0 || (order === 0 && isStrict && !old.isStrict))
      this.lowers.set(variable, { value, isStrict });
  }

  private isEqualityBound(form: number) {
    const manager = this.manager;
    if (manager.getOp(form) !== OP_EQ) return false;
    const first = manager.getArg(form, 0);
    const second = manager.getArg(form, 1);
    const isSwapped = !manager.isUninterpretedConst(first);
    const variable = isSwapped ? second : first;
    const other = isSwapped ? first : second;
    const numeral = this.getNumeral(other);
    if (manager.isUninterpretedConst(variable) && numeral !== undefined) {
      this.insertLower(variable, false, numeral.value);
      this.insertUpper(variable, false, numeral.value);
      return true;
    }
    if (manager.getOp(other) !== OP_MOD) return false;
    const modulus = this.getNumeral(manager.getArg(other, 1));
    if (modulus === undefined || !modulus.value.isPositive()) return false;
    this.insertLower(variable, false, Rational.zero);
    this.insertUpper(variable, false, modulus.value.sub(Rational.one));
    return true;
  }

  private isDisjunctiveBound(form: number) {
    const manager = this.manager;
    if (manager.getOp(form) !== OP_OR || manager.getNumArgs(form) === 0) return false;
    let variable = -1;
    let lower = Rational.zero;
    let upper = Rational.zero;
    for (const arg of manager.getArgs(form)) {
      if (manager.getOp(arg) !== OP_EQ) return false;
      const first = manager.getArg(arg, 0);
      const second = manager.getArg(arg, 1);
      const firstNumeral = this.getNumeral(first);
      const secondNumeral = this.getNumeral(second);
      const found =
        manager.isUninterpretedConst(first) &&
        secondNumeral?.isInt === true &&
        (first === variable || variable === -1)
          ? { constant: first, value: secondNumeral.value }
          : manager.isUninterpretedConst(second) &&
              firstNumeral?.isInt === true &&
              (second === variable || variable === -1)
            ? { constant: second, value: firstNumeral.value }
            : undefined;
      if (found === undefined) return false;
      if (variable === -1) {
        variable = found.constant;
        lower = found.value;
        upper = found.value;
      }
      if (found.value.compare(lower) < 0) lower = found.value;
      if (found.value.compare(upper) > 0) upper = found.value;
    }
    this.insertLower(variable, false, lower);
    this.insertUpper(variable, false, upper);
    return true;
  }

  // A non-strict lower bound at a strict upper bound counts too, as in Z3.
  isInconsistent() {
    for (const [variable, lower] of this.lowers) {
      const upper = this.uppers.get(variable);
      if (upper === undefined) continue;
      const order = lower.value.compare(upper.value);
      if (order > 0 || (order === 0 && !lower.isStrict && upper.isStrict)) return true;
    }
    return false;
  }

  isZeroOne(variable: number) {
    const lower = this.lowers.get(variable)?.value;
    const upper = this.uppers.get(variable)?.value;
    const isZeroOrOne = (value: Rational | undefined) =>
      value !== undefined && (value.isZero() || value.equals(Rational.one));
    return isZeroOrOne(lower) && isZeroOrOne(upper);
  }
}

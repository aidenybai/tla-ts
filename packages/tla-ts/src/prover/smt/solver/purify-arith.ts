// Ported from Z3 (src/tactic/arith/purify_arith_tactic.cpp), MIT license, see z3-license.txt. Only
// the incomplete purification of real division and of irrational numerals in quantifier-free goals
// is ported: it throws on the other terms it purifies. The model does not define division by zero.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ACOS,
  OP_ADD,
  OP_ASIN,
  OP_ATAN,
  OP_COS,
  OP_AND,
  OP_DIV,
  OP_EQ,
  OP_IMPLIES,
  OP_IDIV,
  OP_LT,
  OP_MOD,
  OP_MUL,
  OP_OR,
  OP_POWER,
  OP_SIN,
  OP_TO_INT,
  SORT_BOOL,
  SORT_REAL,
} from "./ast";
import { ExprSafeReplace } from "./expr-safe-replace";
import type { Goal } from "./goal";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

const PURIFIED_OPS = new Set([
  OP_DIV,
  OP_IDIV,
  OP_MOD,
  OP_TO_INT,
  OP_ASIN,
  OP_ACOS,
  OP_SIN,
  OP_COS,
  OP_ATAN,
]);

const isPurified = (manager: AstManager, expr: number) => {
  if (manager.getFamily(expr) !== FAMILY_ARITH) return false;
  const op = manager.getOp(expr);
  if (op !== OP_POWER) return PURIFIED_OPS.has(op);
  const exponent = manager.getArg(expr, 1);
  if (!manager.isNumeral(exponent)) return false;
  const value = manager.getRationalValue(exponent);
  return !value.isInt() || value.isZero();
};

interface DivDef {
  numerator: number;
  denominator: number;
  quotient: number;
}

export const purifyArith = (manager: AstManager, goal: Goal, isComplete: boolean) => {
  const order: number[] = [];
  const seen = new Set<number>();
  for (const form of goal.forms.items) {
    const todo: [number, boolean][] = [[form, false]];
    for (let entry = todo.pop(); entry !== undefined; entry = todo.pop()) {
      const expr = entry[0];
      if (entry[1]) {
        order.push(expr);
        continue;
      }
      if (seen.has(expr)) continue;
      seen.add(expr);
      if (manager.kinds[expr] === KIND_QUANTIFIER)
        throw new SmtUnsupportedError("purify-arith on quantifiers");
      if (manager.kinds[expr] !== KIND_APP) continue;
      todo.push([expr, true]);
      for (const arg of manager.getArgs(expr).toReversed()) todo.push([arg, false]);
    }
  }
  goal.depth++;
  const purified = order.filter(
    (expr) =>
      manager.isAlgebraicNumeral(expr) ||
      (manager.getFamily(expr) === FAMILY_ARITH && manager.getOp(expr) === OP_DIV),
  );
  if (order.some((expr) => !purified.includes(expr) && isPurified(manager, expr)))
    throw new SmtUnsupportedError("purify-arith on a goal it changes");
  if (purified.length === 0) return;
  if (isComplete && purified.some((expr) => !manager.isAlgebraicNumeral(expr)))
    throw new SmtUnsupportedError("purify-arith on division when it is complete");
  const replace = new ExprSafeReplace(manager);
  const pinned = new RefVector(manager);
  const pin = (expr: number) => {
    pinned.push(expr);
    return expr;
  };
  const mkReal = (value: Rational) => pin(manager.mkRealNumeral(value));
  const mkApp = (op: number, args: number[], sort: number) => pin(manager.mkApp(op, args, sort));
  const constraints: number[] = [];
  const divs: DivDef[] = [];
  const am = manager.am;
  for (const expr of purified) {
    const fresh = pin(manager.mkFreshConst(null, SORT_REAL));
    goal.addConverter(manager.decls[fresh]);
    if (!manager.isAlgebraicNumeral(expr)) {
      const args = manager.getArgs(expr).map((arg) => {
        const rewritten = pin(replace.apply(arg));
        manager.decRef(rewritten);
        return rewritten;
      });
      const isZero = mkApp(OP_EQ, [args[1], mkReal(Rational.zero)], SORT_BOOL);
      const product = mkApp(OP_MUL, [args[1], fresh], SORT_REAL);
      constraints.push(
        mkApp(OP_OR, [isZero, mkApp(OP_EQ, [product, args[0]], SORT_BOOL)], SORT_BOOL),
      );
      divs.push({ numerator: args[0], denominator: args[1], quotient: fresh });
      replace.insert(expr, fresh);
      continue;
    }
    replace.insert(expr, fresh);
    const value = manager.getAlgebraicValue(expr);
    const terms = am.getPolynomial(value).flatMap((coeff, degree) => {
      if (coeff === 0n) return [];
      const numeral = mkReal(Rational.of(coeff));
      if (degree === 0) return [numeral];
      const power =
        degree === 1
          ? fresh
          : mkApp(OP_POWER, [fresh, mkReal(Rational.of(BigInt(degree)))], SORT_REAL);
      return [mkApp(OP_MUL, [numeral, power], SORT_REAL)];
    });
    const interval = am.getIsolatingInterval(value);
    constraints.push(
      mkApp(OP_EQ, [mkApp(OP_ADD, terms, SORT_REAL), mkReal(Rational.zero)], SORT_BOOL),
      mkApp(OP_LT, [mkReal(interval[0]), fresh], SORT_BOOL),
      mkApp(OP_LT, [fresh, mkReal(interval[1])], SORT_BOOL),
    );
  }
  for (const [index, first] of divs.entries())
    for (const second of divs.slice(index + 1)) {
      const isSameNumerator = mkApp(OP_EQ, [first.numerator, second.numerator], SORT_BOOL);
      const isSameDenominator = mkApp(OP_EQ, [first.denominator, second.denominator], SORT_BOOL);
      constraints.push(
        mkApp(
          OP_IMPLIES,
          [
            mkApp(OP_AND, [isSameNumerator, isSameDenominator], SORT_BOOL),
            mkApp(OP_EQ, [first.quotient, second.quotient], SORT_BOOL),
          ],
          SORT_BOOL,
        ),
      );
    }
  for (let index = 0; index < goal.forms.size; index++) {
    const rewritten = replace.apply(goal.forms.items[index]);
    goal.update(index, rewritten);
    manager.decRef(rewritten);
  }
  for (const constraint of constraints) goal.assert(constraint);
  pinned.reset();
  replace.release();
};

// Ported from Z3 (src/qe/mbp/mbp_solve_plugin.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  OP_ADD,
  OP_EQ,
  OP_GE,
  OP_IDIV,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_NUM,
  OP_SUB,
  OP_UMINUS,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "../ast";
import { isAppOf, mkNot } from "../ast-util";
import { Rational } from "../rational";

export interface SolvePlugin {
  readonly family: number;
  // Rewrites the atom of a literal into a form that solves for a variable. The result lives as
  // long as the caller's pin does.
  solve(atom: number, isPositive: boolean): number;
}

interface SignedExpr {
  isPositive: boolean;
  expr: number;
}

const getBinaryArgs = (manager: AstManager, expr: number, op: number) =>
  isAppOf(manager, expr, op) && manager.getNumArgs(expr) === 2
    ? [manager.getArg(expr, 0), manager.getArg(expr, 1)]
    : undefined;

const getNumeral = (manager: AstManager, expr: number) =>
  isAppOf(manager, expr, OP_NUM) ? manager.getRationalValue(expr) : undefined;

const isZero = (manager: AstManager, expr: number) => getNumeral(manager, expr)?.isZero() === true;

export const mkArithSolvePlugin = (
  manager: AstManager,
  isVariable: (expr: number) => boolean,
  pin: (expr: number) => number,
): SolvePlugin => {
  const mkNumeral = (value: Rational, isInt: boolean) =>
    manager.mkNumeralOfSort(value, isInt ? SORT_INT : SORT_REAL);

  const mkAddSimplify = (args: number[], sort: number) =>
    args.length === 0
      ? manager.mkNumeral(0n)
      : args.length === 1
        ? args[0]
        : manager.mkApp(OP_ADD, args, sort);

  // r * (sum of sign * e)
  const mkTerm = (isInt: boolean, factor: Rational, isPositive: boolean, exprs: SignedExpr[]) => {
    const sort = isInt ? SORT_INT : SORT_REAL;
    const result = exprs.map((signed) => {
      const scaled = isPositive === signed.isPositive ? factor.neg() : factor;
      return scaled.equals(Rational.one)
        ? signed.expr
        : manager.mkApp(OP_MUL, [mkNumeral(scaled, isInt), signed.expr], sort);
    });
    return pin(mkAddSimplify(result, sort));
  };

  const getInvertibleConst = (isInt: boolean, expr: number): Rational | undefined => {
    if (isAppOf(manager, expr, OP_UMINUS))
      return getInvertibleConst(isInt, manager.getArg(expr, 0))?.neg();
    const value = getNumeral(manager, expr);
    if (value === undefined || value.isZero()) return undefined;
    return !isInt || value.equals(Rational.one) || value.equals(Rational.minusOne)
      ? value
      : undefined;
  };

  // Whether the term is value * v, for a value that is safe to divide by.
  const getInvertibleMul = (isInt: boolean, expr: number) => {
    if (isVariable(expr)) return { expr, value: Rational.one };
    const args = getBinaryArgs(manager, expr, OP_MUL);
    if (args === undefined) return undefined;
    if (isVariable(args[0])) {
      const value = getInvertibleConst(isInt, args[1]);
      if (value !== undefined) return { expr: args[0], value };
    }
    if (isVariable(args[1])) {
      const value = getInvertibleConst(isInt, args[0]);
      if (value !== undefined) return { expr: args[1], value };
    }
    return undefined;
  };

  // Whether lhs = rhs solves as v = t for a variable v.
  const solveEq = (lhs: number, rhs: number) => {
    if (manager.sorts[lhs] !== SORT_INT && manager.sorts[rhs] !== SORT_REAL) return undefined;
    const isInt = manager.sorts[lhs] === SORT_INT;
    const todo: SignedExpr[] = [
      { isPositive: true, expr: lhs },
      { isPositive: false, expr: rhs },
    ];
    const done: SignedExpr[] = [];
    for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
      const expr = item.expr;
      const isPositive = item.isPositive;
      const op = manager.getOp(expr);
      if (op === OP_ADD)
        for (const arg of manager.getArgs(expr)) todo.push({ isPositive, expr: arg });
      else if (op === OP_SUB) {
        const args = manager.getArgs(expr);
        todo.push({ isPositive, expr: args[0] });
        for (const arg of args.slice(1)) todo.push({ isPositive: !isPositive, expr: arg });
      } else if (op === OP_UMINUS)
        todo.push({ isPositive: !isPositive, expr: manager.getArg(expr, 0) });
      else {
        const mul = getInvertibleMul(isInt, expr);
        if (mul !== undefined) {
          done.push(...todo);
          return {
            variable: mul.expr,
            term: mkTerm(isInt, Rational.one.div(mul.value), isPositive, done),
          };
        }
        done.push(item);
      }
    }
    return undefined;
  };

  const mkEqCore = (first: number, second: number) => {
    const solved = solveEq(first, second);
    if (solved !== undefined) return manager.mkEq(solved.variable, solved.term);
    let left = first;
    let right = second;
    if (isZero(manager, left)) [left, right] = [right, left];
    // y + -1*x == 0 --> y = x
    const args = isZero(manager, right) ? getBinaryArgs(manager, left, OP_ADD) : undefined;
    if (args !== undefined) {
      const negated1 = manager.getTimesMinusOneArg(args[1]);
      const negated0 = manager.getTimesMinusOneArg(args[0]);
      if (negated1 !== undefined) {
        left = args[0];
        right = negated1;
      } else if (negated0 !== undefined) {
        left = args[1];
        right = negated0;
      }
    }
    return manager.mkEq(left, right);
  };

  const mkZero = () => manager.mkNumeral(0n);

  const mkBoundZero = (arg: number, op: number) => {
    const args = getBinaryArgs(manager, arg, OP_ADD);
    if (args !== undefined) {
      const negated1 = manager.getTimesMinusOneArg(args[1]);
      if (negated1 !== undefined) return manager.mkApp(op, [args[0], negated1], SORT_BOOL);
      const negated0 = manager.getTimesMinusOneArg(args[0]);
      if (negated0 !== undefined) return manager.mkApp(op, [args[1], negated0], SORT_BOOL);
    }
    return manager.mkApp(op, [arg, mkZero()], SORT_BOOL);
  };

  const mkLeCore = (arg1: number, arg2: number) => {
    const value = getNumeral(manager, arg2);
    const isInt = manager.sorts[arg1] === SORT_INT;
    // t <= -1 ==> ! (t >= 0)
    if (isInt && value?.equals(Rational.minusOne)) return manager.mkNot(mkBoundZero(arg1, OP_GE));
    if (value?.isZero()) return mkBoundZero(arg1, OP_LE);
    // t <= n ==> ! (t >= n + 1)
    if (isInt && value !== undefined && value.isNegative())
      return manager.mkNot(
        manager.mkApp(OP_GE, [arg1, manager.mkNumeral(value.num + 1n)], SORT_BOOL),
      );
    return undefined;
  };

  const mkGeCore = (arg1: number, arg2: number) => {
    const value = getNumeral(manager, arg2);
    const isInt = manager.sorts[arg1] === SORT_INT;
    // t >= 1 ==> ! (t <= 0)
    if (isInt && value?.equals(Rational.one)) return manager.mkNot(mkBoundZero(arg1, OP_LE));
    if (value?.isZero()) return mkBoundZero(arg1, OP_GE);
    // t >= n ==> ! (t <= n - 1)
    if (isInt && value !== undefined && value.isPositive())
      return manager.mkNot(
        manager.mkApp(OP_LE, [arg1, manager.mkNumeral(value.num - 1n)], SORT_BOOL),
      );
    return undefined;
  };

  // k*y == x -----> y = x div k && x mod k == 0
  const tryIntMulSolve = (atom: number, isPositive: boolean) => {
    if (!isPositive) return undefined;
    const eq = getBinaryArgs(manager, atom, OP_EQ);
    if (eq === undefined || manager.sorts[eq[0]] !== SORT_INT) return undefined;
    let [lhs, rhs] = eq;
    if (!isAppOf(manager, rhs, OP_MUL)) {
      if (!isAppOf(manager, lhs, OP_MUL)) return undefined;
      [lhs, rhs] = [rhs, lhs];
    }
    const factors = getBinaryArgs(manager, rhs, OP_MUL);
    if (factors === undefined) return undefined;
    let [first, second] = factors;
    if (!manager.isNumeral(first)) {
      if (!manager.isNumeral(second)) return undefined;
      [first, second] = [second, first];
    }
    if (isZero(manager, first)) return manager.mkEq(lhs, manager.mkNumeral(0n));
    const quotientEq = manager.mkEq(second, manager.mkApp(OP_IDIV, [lhs, first], SORT_INT));
    const remainderEq = manager.mkEq(
      manager.mkNumeral(0n),
      manager.mkApp(OP_MOD, [lhs, first], SORT_INT),
    );
    return manager.mkAnd([quotientEq, remainderEq]);
  };

  const arithSolve = (atom: number, isPositive: boolean) => {
    const solved = tryIntMulSolve(atom, isPositive);
    if (solved !== undefined) return pin(solved);
    let result = atom;
    const eq = getBinaryArgs(manager, atom, OP_EQ);
    if (eq !== undefined) {
      const found = solveEq(eq[0], eq[1]);
      result = found === undefined ? mkEqCore(eq[0], eq[1]) : mkEqCore(found.variable, found.term);
    } else if (isAppOf(manager, atom, OP_LE))
      result = mkLeCore(manager.getArg(atom, 0), manager.getArg(atom, 1)) ?? atom;
    else if (isAppOf(manager, atom, OP_GE))
      result = mkGeCore(manager.getArg(atom, 0), manager.getArg(atom, 1)) ?? atom;
    pin(result);
    return isPositive ? result : pin(mkNot(manager, result));
  };

  return { family: FAMILY_ARITH, solve: arithSolve };
};

export const mkBasicSolvePlugin = (
  manager: AstManager,
  isVariable: (expr: number) => boolean,
  pin: (expr: number) => number,
): SolvePlugin => {
  const basicSolve = (atom: number, isPositive: boolean): number => {
    let result = atom;
    const eq = getBinaryArgs(manager, atom, OP_EQ);
    if (eq !== undefined) {
      const [lhs, rhs] = eq;
      if (manager.isNot(lhs) && isVariable(manager.getArg(lhs, 0)))
        result = manager.mkEq(manager.getArg(lhs, 0), mkNot(manager, rhs));
      else if (manager.isNot(rhs) && isVariable(manager.getArg(rhs, 0)))
        result = manager.mkEq(manager.getArg(rhs, 0), mkNot(manager, lhs));
      else if (isVariable(rhs) && !isVariable(lhs)) result = manager.mkEq(rhs, lhs);
      pin(result);
    }
    // (ite cond (= VAR t) (= VAR t2))
    if (isAppOf(manager, atom, OP_ITE)) {
      const solved1 = basicSolve(manager.getArg(atom, 1), true);
      const solved2 = basicSolve(manager.getArg(atom, 2), true);
      const eq1 = getBinaryArgs(manager, solved1, OP_EQ);
      const eq2 = getBinaryArgs(manager, solved2, OP_EQ);
      if (eq1 !== undefined && eq2 !== undefined && eq1[0] === eq2[0])
        result = pin(
          manager.mkEq(
            eq1[0],
            manager.mkApp(OP_ITE, [manager.getArg(atom, 0), eq1[1], eq2[1]], manager.sorts[eq1[1]]),
          ),
        );
    }
    if (isVariable(atom) && manager.sorts[atom] === SORT_BOOL)
      return pin(manager.mkEq(atom, isPositive ? manager.trueExpr : manager.falseExpr));
    return isPositive ? result : pin(mkNot(manager, result));
  };

  return { family: FAMILY_BASIC, solve: basicSolve };
};

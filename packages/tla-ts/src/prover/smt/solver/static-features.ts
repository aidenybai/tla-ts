// Ported from Z3 (src/ast/static_features.cpp), MIT license, see z3-license.txt. It counts only
// what setup_unknown reads. Those counts do not depend on the order of the walk, so each
// subexpression is visited once in any order.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BASIC,
  FAMILY_BV,
  FAMILY_FPA,
  FAMILY_LABEL,
  FAMILY_MODEL_VALUE,
  FAMILY_USER,
  OP_ADD,
  OP_AND,
  OP_DIV,
  OP_EQ,
  OP_GE,
  OP_IDIV,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_MOD,
  OP_MUL,
  OP_OR,
  OP_REM,
  OP_SELECT,
  OP_STORE,
  OP_XOR,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Rational } from "./rational";

export interface StaticFeatures {
  numQuantifiers: number;
  numUninterpretedFunctions: number;
  hasInt: boolean;
  hasReal: boolean;
  hasBv: boolean;
  hasFpa: boolean;
  hasArrays: boolean;
  hasExtArrays: boolean;
  numArithTerms: number;
  numArithEqs: number;
  numArithIneqs: number;
  numDiffTerms: number;
  numDiffEqs: number;
  numDiffIneqs: number;
  numNonLinear: number;
  numTheories: number;
}

const MINUS_ONE = Rational.of(-1n);
const GATE_OPS = new Set([OP_ITE, OP_AND, OP_OR, OP_XOR, OP_IMPLIES, OP_EQ]);
const DIV_OPS = new Set([OP_DIV, OP_IDIV, OP_REM, OP_MOD]);
const BUILTIN_FAMILIES = new Set([FAMILY_BASIC, FAMILY_USER, FAMILY_MODEL_VALUE, FAMILY_LABEL]);

export const collectStaticFeatures = (
  manager: AstManager,
  formulas: readonly number[],
): StaticFeatures => {
  const features = {
    numQuantifiers: 0,
    numUninterpretedFunctions: 0,
    hasInt: false,
    hasReal: false,
    hasBv: false,
    hasFpa: false,
    hasArrays: false,
    hasExtArrays: false,
    numArithTerms: 0,
    numArithEqs: 0,
    numArithIneqs: 0,
    numDiffTerms: 0,
    numDiffEqs: 0,
    numDiffIneqs: 0,
    numNonLinear: 0,
  };
  const theories = new Set<number>();
  const markTheory = (family: number) => {
    if (!BUILTIN_FAMILIES.has(family)) theories.add(family);
  };
  const isArithExpr = (expr: number) =>
    manager.isApp(expr) && manager.getFamily(expr) === FAMILY_ARITH;
  const isIte = (expr: number) => manager.getOp(expr) === OP_ITE;
  const isBinary = (expr: number, op: number) =>
    manager.getOp(expr) === op && manager.getNumArgs(expr) === 2;
  const isDiffTerm = (expr: number) =>
    !isArithExpr(expr) ||
    manager.isNumeral(expr) ||
    (isBinary(expr, OP_ADD) &&
      manager.isNumeral(manager.getArg(expr, 0)) &&
      !isArithExpr(manager.getArg(expr, 1)) &&
      !isIte(manager.getArg(expr, 1)));
  const isMinusOneTimes = (term: number, other: number) => {
    if (isArithExpr(other) || !isBinary(term, OP_MUL)) return false;
    const coefficient = manager.getArg(term, 0);
    const factor = manager.getArg(term, 1);
    return (
      manager.isNumeral(coefficient) &&
      manager.getRationalValue(coefficient).equals(MINUS_ONE) &&
      !isArithExpr(factor) &&
      !isIte(factor)
    );
  };
  // An atom x <= k, x = k or x - y <= k, with the subtraction written as (+ x (* -1 y)).
  const isDiffAtom = (expr: number) => {
    const lhs = manager.getArg(expr, 0);
    const rhs = manager.getArg(expr, 1);
    if (!isArithExpr(lhs) && !isArithExpr(rhs) && !isIte(lhs) && !isIte(rhs)) return true;
    if (!manager.isNumeral(rhs)) return false;
    if (!isArithExpr(lhs) && !isIte(lhs)) return true;
    if (!isBinary(lhs, OP_ADD)) return false;
    const first = manager.getArg(lhs, 0);
    const second = manager.getArg(lhs, 1);
    return isMinusOneTimes(second, first) || isMinusOneTimes(first, second);
  };
  const countArithTerm = (expr: number) => {
    features.numArithTerms++;
    if (isDiffTerm(expr)) features.numDiffTerms++;
  };
  const updateSort = (sort: number) => {
    const family = manager.getSortFamily(sort);
    markTheory(family);
    features.hasInt ||= sort === SORT_INT;
    features.hasReal ||= sort === SORT_REAL;
    features.hasBv ||= family === FAMILY_BV;
    features.hasFpa ||= family === FAMILY_FPA;
    if (family !== FAMILY_ARRAY) return;
    features.hasArrays = true;
    for (const parameter of manager.getSortParameters(sort)) updateSort(parameter);
  };
  const uninterpretedDecls = new Set<number>();
  const update = (expr: number) => {
    const sort = manager.sorts[expr];
    updateSort(sort);
    const op = manager.getOp(expr);
    const family = manager.getFamily(expr);
    features.hasExtArrays ||=
      manager.getSortFamily(sort) === FAMILY_ARRAY && op !== OP_SELECT && op !== OP_STORE;
    if (!manager.isApp(expr)) {
      features.numQuantifiers++;
      return;
    }
    markTheory(family);
    const isGate = family === FAMILY_BASIC && GATE_OPS.has(op);
    if (op === OP_ITE && !manager.isBool(expr))
      for (const arg of [manager.getArg(expr, 1), manager.getArg(expr, 2)])
        if (manager.getSortFamily(manager.sorts[arg]) === FAMILY_ARITH) countArithTerm(arg);
    if (family === FAMILY_ARITH && (op === OP_LE || op === OP_GE)) {
      features.numArithIneqs++;
      if (isDiffAtom(expr)) features.numDiffIneqs++;
    }
    if (op === OP_EQ && manager.isNumeral(manager.getArg(expr, 1))) {
      features.numArithEqs++;
      if (isDiffAtom(expr)) features.numDiffEqs++;
    }
    if (
      family === FAMILY_ARITH &&
      op === OP_MUL &&
      (!manager.isNumeral(manager.getArg(expr, 0)) || manager.getNumArgs(expr) > 2)
    )
      features.numNonLinear++;
    if (family === FAMILY_ARITH && DIV_OPS.has(op)) {
      const divisor = manager.getArg(expr, 1);
      if (!manager.isNumeral(divisor) || manager.getRationalValue(divisor).isZero()) {
        features.numUninterpretedFunctions++;
        features.numNonLinear++;
      }
    }
    if (family === FAMILY_USER && manager.getNumArgs(expr) > 0) {
      const decl = manager.getDeclId(expr);
      if (!uninterpretedDecls.has(decl)) features.numUninterpretedFunctions++;
      uninterpretedDecls.add(decl);
    }
    // An argument of another theory is an alien term.
    if (isGate || family === FAMILY_ARITH) return;
    for (const arg of manager.getArgs(expr))
      if (manager.getSortFamily(manager.sorts[arg]) === FAMILY_ARITH) countArithTerm(arg);
  };
  const visited = new Set<number>();
  const todo = [...formulas];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr) || manager.isVar(expr)) continue;
    visited.add(expr);
    update(expr);
    if (manager.isApp(expr)) manager.pushArgs(expr, todo);
    else todo.push(manager.getQuantifier(expr).body);
  }
  return { ...features, numTheories: theories.size };
};

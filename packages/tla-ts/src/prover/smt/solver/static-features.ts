// Ported from Z3 (src/ast/static_features.cpp), MIT license, see z3-license.txt. It collects the
// features the setups read.
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
  OP_NOT,
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
  isCnf: boolean;
  numClauses: number;
  numBinClauses: number;
  numUnits: number;
  numQuantifiers: number;
  numQuantifiersWithPatterns: number;
  numBoolConstants: number;
  maxIteTreeDepth: number;
  numIteTerms: number;
  numUninterpretedConstants: number;
  numUninterpretedFunctions: number;
  hasRational: boolean;
  hasInt: boolean;
  hasReal: boolean;
  hasBv: boolean;
  hasFpa: boolean;
  hasArrays: boolean;
  hasExtArrays: boolean;
  arithKSum: Rational;
  numArithTerms: number;
  numArithEqs: number;
  numArithIneqs: number;
  numDiffTerms: number;
  numDiffEqs: number;
  numDiffIneqs: number;
  numNonLinear: number;
  numTheories: number;
}

interface ToProcess {
  expr: number;
  isIteContext: boolean;
}

const MINUS_ONE = Rational.of(-1n);
const GATE_OPS = new Set([OP_ITE, OP_AND, OP_OR, OP_XOR, OP_IMPLIES, OP_EQ]);
const DIV_OPS = new Set([OP_DIV, OP_IDIV, OP_REM, OP_MOD]);
const BUILTIN_FAMILIES = new Set([FAMILY_BASIC, FAMILY_USER, FAMILY_MODEL_VALUE, FAMILY_LABEL]);

export const isDense = (features: StaticFeatures) =>
  features.numUninterpretedConstants < 1000 &&
  features.numArithEqs + features.numArithIneqs > features.numUninterpretedConstants * 9;

export const isArithKSumSmall = (features: StaticFeatures) =>
  features.arithKSum.compare(Rational.of(BigInt(Math.trunc(0x7fffffff / 8)))) < 0;

export const collectStaticFeatures = (
  manager: AstManager,
  formulas: readonly number[],
): StaticFeatures => {
  const features = {
    isCnf: true,
    numClauses: 0,
    numBinClauses: 0,
    numUnits: 0,
    numQuantifiers: 0,
    numQuantifiersWithPatterns: 0,
    numBoolConstants: 0,
    maxIteTreeDepth: 0,
    numIteTerms: 0,
    numUninterpretedConstants: 0,
    numUninterpretedFunctions: 0,
    hasRational: false,
    hasInt: false,
    hasReal: false,
    hasBv: false,
    hasFpa: false,
    hasArrays: false,
    hasExtArrays: false,
    arithKSum: Rational.zero,
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
  const isGate = (expr: number) =>
    manager.isApp(expr) &&
    manager.getFamily(expr) === FAMILY_BASIC &&
    GATE_OPS.has(manager.getOp(expr));
  const accNum = (value: Rational) => {
    features.arithKSum = features.arithKSum.add(value.abs());
  };
  const accNumeral = (expr: number) => {
    if (manager.isNumeral(expr)) accNum(manager.getRationalValue(expr));
  };
  // is_diff_term: a term x or (+ k x), with the k it adds.
  const getDiffTermConstant = (expr: number) => {
    if (!isArithExpr(expr)) return Rational.zero;
    if (manager.isNumeral(expr)) return manager.getRationalValue(expr);
    if (!isBinary(expr, OP_ADD)) return undefined;
    const constant = manager.getArg(expr, 0);
    const term = manager.getArg(expr, 1);
    return manager.isNumeral(constant) && !isArithExpr(term) && !isIte(term)
      ? manager.getRationalValue(constant)
      : undefined;
  };
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
    const constant = getDiffTermConstant(expr);
    if (constant === undefined) return;
    features.numDiffTerms++;
    accNum(constant);
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
    const isBool = manager.isBool(expr);
    const isExprGate = isGate(expr);
    if (isExprGate) features.isCnf = false;
    if (op === OP_ITE && !isBool) {
      features.numIteTerms++;
      for (const arg of [manager.getArg(expr, 1), manager.getArg(expr, 2)]) {
        accNumeral(arg);
        if (manager.getSortFamily(manager.sorts[arg]) === FAMILY_ARITH) countArithTerm(arg);
      }
    }
    if (isBool && manager.isApp(expr) && manager.getNumArgs(expr) === 0)
      features.numBoolConstants++;
    features.hasExtArrays ||=
      manager.getSortFamily(sort) === FAMILY_ARRAY && op !== OP_SELECT && op !== OP_STORE;
    if (!manager.isApp(expr)) {
      features.numQuantifiers++;
      if (manager.getQuantifier(expr).patterns.length > 0) features.numQuantifiersWithPatterns++;
      return;
    }
    if (family === FAMILY_ARITH && (op === OP_LE || op === OP_GE)) {
      features.numArithIneqs++;
      if (isDiffAtom(expr)) features.numDiffIneqs++;
      accNumeral(manager.getArg(expr, 1));
    }
    if (manager.isNumeral(expr) && !manager.getRationalValue(expr).isInt())
      features.hasRational = true;
    if (op === OP_EQ && manager.isNumeral(manager.getArg(expr, 1))) {
      accNumeral(manager.getArg(expr, 1));
      features.numArithEqs++;
      if (isDiffAtom(expr)) features.numDiffEqs++;
    }
    markTheory(family);
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
    if (family === FAMILY_USER && manager.getNumArgs(expr) === 0)
      features.numUninterpretedConstants++;
    if (family === FAMILY_USER && manager.getNumArgs(expr) > 0) {
      const decl = manager.getDeclId(expr);
      if (!uninterpretedDecls.has(decl)) features.numUninterpretedFunctions++;
      uninterpretedDecls.add(decl);
    }
    // An argument of another theory is an alien term.
    if (isExprGate || family === FAMILY_ARITH) return;
    for (const arg of manager.getArgs(expr))
      if (manager.getSortFamily(manager.sorts[arg]) === FAMILY_ARITH) countArithTerm(arg);
  };
  const stripNot = (expr: number) =>
    manager.getOp(expr) === OP_NOT ? manager.getArg(expr, 0) : expr;
  const preProcessed = new Set<number>();
  const postProcessed = new Set<number>();
  const iteDepths = new Map<number, number>();
  const todo: ToProcess[] = [];
  // pre_process: whether every child is done, so that the expression can be post-processed.
  const preProcess = (expr: number) => {
    if (postProcessed.has(expr) || preProcessed.has(expr)) return true;
    preProcessed.add(expr);
    if (manager.isVar(expr)) {
      postProcessed.add(expr);
      return true;
    }
    update(expr);
    if (!manager.isApp(expr)) {
      const body = manager.getQuantifier(expr).body;
      if (postProcessed.has(body)) return true;
      todo.push({ expr: body, isIteContext: false });
      return false;
    }
    const isIteContext = isIte(expr);
    let isAllProcessed = true;
    for (const arg of manager.getArgs(expr)) {
      const child = stripNot(arg);
      if (postProcessed.has(child)) continue;
      todo.push({ expr: child, isIteContext });
      isAllProcessed = false;
    }
    return isAllProcessed;
  };
  const postProcess = (expr: number, isIteContext: boolean) => {
    if (postProcessed.has(expr)) return;
    postProcessed.add(expr);
    if (!manager.isApp(expr) || !isIte(expr)) return;
    const depth =
      Math.max(0, ...manager.getArgs(expr).map((arg) => iteDepths.get(stripNot(arg)) ?? 0)) + 1;
    if (!isIteContext) features.maxIteTreeDepth = Math.max(features.maxIteTreeDepth, depth);
    iteDepths.set(expr, depth);
  };
  const processAll = () => {
    for (let top = todo.at(-1); top !== undefined; top = todo.at(-1)) {
      if (postProcessed.has(top.expr)) {
        todo.pop();
        continue;
      }
      if (!preProcess(top.expr)) continue;
      postProcess(top.expr, top.isIteContext);
      todo.pop();
    }
  };
  for (const root of formulas) {
    if (postProcessed.has(root)) continue;
    if (manager.getOp(root) === OP_OR) {
      postProcessed.add(root);
      features.numClauses++;
      if (manager.getNumArgs(root) === 2) features.numBinClauses++;
      for (const arg of manager.getArgs(root)) {
        todo.push({ expr: stripNot(arg), isIteContext: false });
        processAll();
      }
      continue;
    }
    if (!isGate(root)) {
      features.numUnits++;
      features.numClauses++;
    }
    todo.push({ expr: root, isIteContext: false });
    processAll();
  }
  return { ...features, numTheories: theories.size };
};

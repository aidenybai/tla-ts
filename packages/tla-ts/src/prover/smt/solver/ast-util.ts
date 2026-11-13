// Ported from Z3 (src/ast/ast_util.cpp, src/ast/for_each_expr.cpp, src/ast/arith_decl_plugin.cpp),
// MIT license, see z3-license.txt.
import {
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_DIV,
  OP_DIV0,
  OP_IDIV,
  OP_IDIV0,
  OP_IMPLIES,
  OP_MOD,
  OP_MOD0,
  OP_MUL,
  OP_NOT,
  OP_OR,
  OP_POWER,
  OP_POWER0,
  OP_REM,
  OP_SEQ_CONCAT,
  OP_SUB,
  OP_TO_INT,
  OP_TO_REAL,
  OP_UMINUS,
  OP_XOR,
  type AstManager,
} from "./ast";
import { isAssociativeBvOp } from "./bv-decl-plugin";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";

export const isAppOf = (manager: AstManager, expr: number, op: number) =>
  manager.kinds[expr] === KIND_APP && manager.getOp(expr) === op;

export const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr)
    ? manager.getArg(expr, 0)
    : manager.isTrue(expr)
      ? manager.falseExpr
      : manager.isFalse(expr)
        ? manager.trueExpr
        : manager.mkNot(expr);

const flattenVector = (manager: AstManager, result: RefVector, isAnd: boolean) => {
  const pin = new RefVector(manager);
  const seen = new Set<number>();
  const junction = isAnd ? OP_AND : OP_OR;
  const dual = isAnd ? OP_OR : OP_AND;
  const unit = isAnd ? manager.trueExpr : manager.falseExpr;
  const zero = isAnd ? manager.falseExpr : manager.trueExpr;
  const replaceByLast = (index: number) => {
    result.set(index, result.items[result.size - 1]);
    result.pop();
  };
  for (let index = 0; index < result.size; index++) {
    const expr = result.items[index];
    if (seen.has(expr)) {
      replaceByLast(index--);
      continue;
    }
    seen.add(expr);
    pin.push(expr);
    const inner = manager.isNot(expr) ? manager.getArg(expr, 0) : -1;
    const innerOp = inner === -1 ? -1 : manager.getOp(inner);
    if (manager.getOp(expr) === junction) {
      for (let argIndex = 0; argIndex < manager.getNumArgs(expr); argIndex++) {
        const arg = manager.getArg(expr, argIndex);
        result.push(arg);
      }
      replaceByLast(index--);
    } else if (innerOp === OP_NOT) result.set(index--, manager.getArg(inner, 0));
    else if (innerOp === dual) {
      for (let argIndex = 0; argIndex < manager.getNumArgs(inner); argIndex++) {
        const arg = manager.getArg(inner, argIndex);
        result.push(mkNot(manager, arg));
      }
      replaceByLast(index--);
    } else if (isAnd && innerOp === OP_IMPLIES) {
      result.push(manager.getArg(inner, 0));
      result.set(index--, mkNot(manager, manager.getArg(inner, 1)));
    } else if (!isAnd && manager.getOp(expr) === OP_IMPLIES) {
      result.push(manager.getArg(expr, 1));
      result.set(index--, mkNot(manager, manager.getArg(expr, 0)));
    } else if (expr === unit || inner === zero) replaceByLast(index--);
    else if (expr === zero || inner === unit) {
      result.reset();
      result.push(zero);
      break;
    }
  }
  pin.reset();
};

export const flattenAndVector = (manager: AstManager, result: RefVector) =>
  flattenVector(manager, result, true);

export const flattenOrVector = (manager: AstManager, result: RefVector) =>
  flattenVector(manager, result, false);

export const pushNotOwned = (manager: AstManager, expr: number): number => {
  const op = manager.getOp(expr);
  if (op !== OP_AND && op !== OP_OR) {
    const result = mkNot(manager, expr);
    manager.incRef(result);
    return result;
  }
  const args = new RefVector(manager);
  for (let index = 0; index < manager.getNumArgs(expr); index++) {
    const arg = manager.getArg(expr, index);
    args.pushOwned(pushNotOwned(manager, arg));
  }
  const result = op === OP_AND ? manager.mkOr(args.items) : manager.mkAnd(args.items);
  manager.incRef(result);
  args.reset();
  return result;
};

const ASSOCIATIVE_OPS = new Set([OP_AND, OP_OR, OP_XOR, OP_ADD, OP_MUL, OP_SEQ_CONCAT]);

// Like Z3, marks only the expressions with several references, and counts an associative
// application of n arguments as n - 1 binary ones.
export const getNumExprs = (manager: AstManager, root: number) => {
  const marked = new Set<number>();
  const isUnvisited = (expr: number) => {
    if (manager.getRefCount(expr) <= 1) return true;
    if (marked.has(expr)) return false;
    marked.add(expr);
    return true;
  };
  const todo = [root];
  let count = 0;
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    const kind = manager.kinds[expr];
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      for (const child of [data.body, ...data.patterns, ...data.noPatterns])
        if (isUnvisited(child)) todo.push(child);
      count++;
      continue;
    }
    if (kind !== KIND_APP) {
      count++;
      continue;
    }
    const op = manager.getOp(expr);
    const numArgs = manager.getNumArgs(expr);
    count += ASSOCIATIVE_OPS.has(op) || isAssociativeBvOp(op) ? numArgs - 1 : 1;
    for (let index = 0; index < numArgs; index++) {
      const arg = manager.getArg(expr, index);
      if (isUnvisited(arg)) todo.push(arg);
    }
  }
  return count;
};

export const getExtendedNumeral = (manager: AstManager, expr: number) => {
  if (manager.isNumeral(expr)) return manager.getRationalValue(expr);
  const todo = [{ term: expr, isVisited: false, isNegated: false }];
  const values: Rational[] = [];
  while (todo.length > 0) {
    const frame = todo.pop()!;
    if (frame.isVisited) {
      const op = manager.getOp(frame.term);
      const numArgs = manager.getNumArgs(frame.term);
      const operands = values.splice(values.length - (op === OP_TO_INT ? 1 : numArgs));
      const value =
        op === OP_TO_INT
          ? operands[0].floor()
          : op === OP_ADD
            ? operands.reduce((sum, operand) => sum.add(operand), Rational.zero)
            : op === OP_MUL
              ? operands.reduce((product, operand) => product.mul(operand), Rational.one)
              : op === OP_DIV
                ? operands[1].isZero()
                  ? undefined
                  : operands[0].div(operands[1])
                : operands[0].sub(operands[1]);
      if (value === undefined) return undefined;
      values.push(frame.isNegated ? value.neg() : value);
      continue;
    }
    let term = frame.term;
    let isNegated = frame.isNegated;
    while (manager.getOp(term) === OP_UMINUS || manager.getOp(term) === OP_TO_REAL) {
      if (manager.getOp(term) === OP_UMINUS) isNegated = !isNegated;
      term = manager.getArg(term, 0);
    }
    if (manager.isNumeral(term)) {
      const value = manager.getRationalValue(term);
      values.push(isNegated ? value.neg() : value);
      continue;
    }
    const op = manager.getOp(term);
    if (
      manager.kinds[term] !== KIND_APP ||
      (op !== OP_TO_INT &&
        op !== OP_ADD &&
        op !== OP_MUL &&
        !(op === OP_SUB && manager.getNumArgs(term) === 2) &&
        op !== OP_DIV)
    )
      return undefined;
    todo.push({ term, isVisited: true, isNegated });
    for (let index = manager.getNumArgs(term); index-- > 0;)
      todo.push({ term: manager.getArg(term, index), isVisited: false, isNegated: false });
  }
  return values[values.length - 1];
};

const isZeroNumeral = (manager: AstManager, expr: number) =>
  manager.isNumeral(expr) && manager.getRationalValue(expr).isZero();

// m.is_considered_uninterpreted and arith_util's.
const isConsideredUninterpreted = (manager: AstManager, expr: number) => {
  const op = manager.getOp(expr);
  const args = manager.getArgs(expr);
  if (manager.isUninterpreted(expr)) return true;
  if (op === OP_DIV0 || op === OP_IDIV0 || op === OP_MOD0 || op === OP_POWER0) return true;
  if ((op === OP_DIV || op === OP_IDIV || op === OP_MOD || op === OP_REM) && args.length === 2)
    return isZeroNumeral(manager, args[1]);
  return (
    op === OP_POWER &&
    args.length === 2 &&
    isZeroNumeral(manager, args[0]) &&
    isZeroNumeral(manager, args[1])
  );
};

export const hasUninterpreted = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      todo.push(manager.getQuantifier(current).body);
      continue;
    }
    if (manager.kinds[current] !== KIND_APP || manager.getNumArgs(current) === 0) continue;
    if (isConsideredUninterpreted(manager, current)) return true;
    manager.pushArgs(current, todo);
  }
  return false;
};

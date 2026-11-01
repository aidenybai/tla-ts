// Ported from Z3 (src/ast/ast_util.cpp), MIT license, see z3-license.txt. Flattening of conjunctions
// and disjunctions in Z3's worklist order, and negation that strips a negation instead of nesting one.
import { OP_AND, OP_IMPLIES, OP_NOT, OP_OR, type AstManager } from "./ast";
import { RefVector } from "./ref-vector";

// mk_not.
export const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr)
    ? manager.getArg(expr, 0)
    : manager.isTrue(expr)
      ? manager.falseExpr
      : manager.isFalse(expr)
        ? manager.trueExpr
        : manager.mkNot(expr);

// push_not: moves the negation through conjunctions and disjunctions.
export const pushNot = (manager: AstManager, expr: number): number => {
  const op = manager.getOp(expr);
  if (op === OP_AND) return manager.mkOr(manager.mapArgs(expr, (arg) => pushNot(manager, arg)));
  if (op === OP_OR) return manager.mkAnd(manager.mapArgs(expr, (arg) => pushNot(manager, arg)));
  return mkNot(manager, expr);
};

// flatten_and and flatten_or: a flattened list replaces an element by the last one, so the order
// follows Z3's.
const flatten = (manager: AstManager, input: number[], isAnd: boolean) => {
  const result = [...input];
  const seen = new Set<number>();
  const junction = isAnd ? OP_AND : OP_OR;
  const dual = isAnd ? OP_OR : OP_AND;
  const unit = isAnd ? manager.trueExpr : manager.falseExpr;
  const zero = isAnd ? manager.falseExpr : manager.trueExpr;
  const replaceByLast = (index: number) => {
    result[index] = result[result.length - 1];
    result.pop();
  };
  for (let index = 0; index < result.length; index++) {
    const expr = result[index];
    if (seen.has(expr)) {
      replaceByLast(index--);
      continue;
    }
    seen.add(expr);
    const inner = manager.isNot(expr) ? manager.getArg(expr, 0) : -1;
    const innerOp = inner === -1 ? -1 : manager.getOp(inner);
    if (manager.getOp(expr) === junction) {
      manager.pushArgs(expr, result);
      replaceByLast(index--);
    } else if (innerOp === OP_NOT) result[index--] = manager.getArg(inner, 0);
    else if (innerOp === dual) {
      for (let argIndex = 0; argIndex < manager.getNumArgs(inner); argIndex++) {
        const arg = manager.getArg(inner, argIndex);
        result.push(mkNot(manager, arg));
      }
      replaceByLast(index--);
    } else if (isAnd && innerOp === OP_IMPLIES) {
      result.push(manager.getArg(inner, 0));
      result[index--] = mkNot(manager, manager.getArg(inner, 1));
    } else if (!isAnd && manager.getOp(expr) === OP_IMPLIES) {
      result.push(manager.getArg(expr, 1));
      result[index--] = mkNot(manager, manager.getArg(expr, 0));
    } else if (expr === unit || inner === zero) replaceByLast(index--);
    else if (expr === zero || inner === unit) return [zero];
  }
  return result;
};

export const flattenAnd = (manager: AstManager, input: number[]) => flatten(manager, input, true);

export const flattenOr = (manager: AstManager, input: number[]) => flatten(manager, input, false);

// flatten_and and flatten_or on an expr_ref_vector, with Z3's references: the vector holds its
// expressions, and pin holds each visited one until the end.
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

// push_not with Z3's references: the result comes with a reference, which the caller releases.
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

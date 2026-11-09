// Ported from Z3 (src/ast/ast_util.cpp), MIT license, see z3-license.txt.
import { KIND_APP, OP_AND, OP_IMPLIES, OP_NOT, OP_OR, type AstManager } from "./ast";
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

// The vector holds its expressions, and pin holds each visited one until the end, as in Z3.
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

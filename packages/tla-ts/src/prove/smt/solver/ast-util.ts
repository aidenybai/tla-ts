// Ported from Z3 (src/ast/ast_util.cpp), MIT license, see z3-license.txt. Flattening of conjunctions
// and disjunctions in Z3's worklist order, and negation that strips a negation instead of nesting one.
import { OP_AND, OP_IMPLIES, OP_NOT, OP_OR, type AstManager } from "./ast";

// mk_not.
export const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr)
    ? manager.args[expr][0]
    : manager.isTrue(expr)
      ? manager.falseExpr
      : manager.isFalse(expr)
        ? manager.trueExpr
        : manager.mkNot(expr);

// push_not: moves the negation through conjunctions and disjunctions.
export const pushNot = (manager: AstManager, expr: number): number => {
  const op = manager.getOp(expr);
  if (op === OP_AND) return manager.mkOr(manager.args[expr].map((arg) => pushNot(manager, arg)));
  if (op === OP_OR) return manager.mkAnd(manager.args[expr].map((arg) => pushNot(manager, arg)));
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
    const inner = manager.isNot(expr) ? manager.args[expr][0] : -1;
    const innerOp = inner === -1 ? -1 : manager.getOp(inner);
    if (manager.getOp(expr) === junction) {
      result.push(...manager.args[expr]);
      replaceByLast(index--);
    } else if (innerOp === OP_NOT) result[index--] = manager.args[inner][0];
    else if (innerOp === dual) {
      for (const arg of manager.args[inner]) result.push(mkNot(manager, arg));
      replaceByLast(index--);
    } else if (isAnd && innerOp === OP_IMPLIES) {
      result.push(manager.args[inner][0]);
      result[index--] = mkNot(manager, manager.args[inner][1]);
    } else if (!isAnd && manager.getOp(expr) === OP_IMPLIES) {
      result.push(manager.args[expr][1]);
      result[index--] = mkNot(manager, manager.args[expr][0]);
    } else if (expr === unit || inner === zero) replaceByLast(index--);
    else if (expr === zero || inner === unit) return [zero];
  }
  return result;
};

export const flattenAnd = (manager: AstManager, input: number[]) => flatten(manager, input, true);

export const flattenOr = (manager: AstManager, input: number[]) => flatten(manager, input, false);

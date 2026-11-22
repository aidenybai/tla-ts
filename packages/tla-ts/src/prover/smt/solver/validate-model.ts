import {
  FAMILY_SEQ,
  KIND_APP,
  OP_ACOS,
  OP_ACOSH,
  OP_ALGEBRAIC_NUM,
  OP_AND,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_ASIN,
  OP_ASINH,
  OP_ATAN,
  OP_ATAN2,
  OP_ATANH,
  OP_CONST_ARRAY,
  OP_COS,
  OP_COSH,
  OP_DIV0,
  OP_DT_ACCESSOR,
  OP_DT_UPDATE_FIELD,
  OP_E,
  OP_EXP,
  OP_IDIV0,
  OP_LOG,
  OP_ITE,
  OP_MOD0,
  OP_NEG_ROOT,
  OP_NOT,
  OP_OR,
  OP_PI,
  OP_POWER0,
  OP_SIN,
  OP_SINH,
  OP_STORE,
  OP_TAN,
  OP_TANH,
  OP_U_ACOS,
  OP_U_ASIN,
} from "./ast";
import type { AstManager } from "./ast";
import { forEachExpr } from "./ast-util";
import { ModelEvaluator } from "./model-evaluator";
import type { ProtoModel } from "./proto-model";
import { UINT_MAX } from "./sat/clause";

const UNDERSPECIFIED_OPS = new Set([
  OP_DT_ACCESSOR,
  OP_DT_UPDATE_FIELD,
  OP_NEG_ROOT,
  OP_U_ASIN,
  OP_U_ACOS,
  OP_DIV0,
  OP_IDIV0,
  OP_MOD0,
  OP_POWER0,
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
  OP_E,
  OP_PI,
  OP_ALGEBRAIC_NUM,
  OP_AS_ARRAY,
  OP_STORE,
  OP_ARRAY_MAP,
  OP_CONST_ARRAY,
]);

const hasUnderspecifiedOp = (manager: AstManager, root: number) =>
  forEachExpr(manager, root, (expr) =>
    manager.kinds[expr] === KIND_APP &&
    (UNDERSPECIFIED_OPS.has(manager.getOp(expr)) ||
      (manager.funcDecls[manager.decls[expr]].family === FAMILY_SEQ &&
        manager.isReSort(manager.sorts[expr])))
      ? true
      : undefined,
  ) === true;

const isEvaluatedTo = (
  manager: AstManager,
  evaluator: ModelEvaluator,
  expr: number,
  expected: number,
) => {
  const value = evaluator.rewrite(expr);
  manager.decRef(value);
  return value === expected;
};

// Z3 evaluates these subterms only to print them at a higher verbosity, but the evaluations count.
const analyzeFailure = (
  manager: AstManager,
  evaluator: ModelEvaluator,
  seen: Set<number>,
  root: number,
) => {
  const isTrue = (expr: number) => isEvaluatedTo(manager, evaluator, expr, manager.trueExpr);
  const isFalse = (expr: number) => isEvaluatedTo(manager, evaluator, expr, manager.falseExpr);
  const todo: [number, boolean][] = [[root, true]];
  for (let item = todo.pop(); item !== undefined; item = todo.pop()) {
    const expr = item[0];
    const isExpected = item[1];
    if (seen.has(expr)) continue;
    seen.add(expr);
    const op = manager.getOp(expr);
    if (op === OP_NOT) {
      todo.push([manager.getArg(expr, 0), !isExpected]);
      continue;
    }
    if (op === OP_OR && !isExpected) {
      const arg = manager.getArgs(expr).find(isTrue);
      if (arg !== undefined) {
        todo.push([arg, false]);
        continue;
      }
    }
    if (op === OP_AND && isExpected) {
      const arg = manager.getArgs(expr).find(isFalse);
      if (arg !== undefined) {
        todo.push([arg, true]);
        continue;
      }
    }
    if (op !== OP_ITE) continue;
    const condition = manager.getArg(expr, 0);
    const thenExpr = manager.getArg(expr, 1);
    const elseExpr = manager.getArg(expr, 2);
    const branch = isExpected
      ? isTrue(condition) && isFalse(thenExpr)
        ? { isCondition: true, expr: thenExpr }
        : isFalse(condition) && isFalse(elseExpr)
          ? { isCondition: false, expr: elseExpr }
          : undefined
      : isTrue(condition) && isTrue(thenExpr)
        ? { isCondition: true, expr: thenExpr }
        : isFalse(condition) && isTrue(elseExpr)
          ? { isCondition: false, expr: elseExpr }
          : undefined;
    if (branch === undefined) continue;
    const branchValue = isExpected ? manager.falseExpr : manager.trueExpr;
    if (branch.expr !== branchValue) todo.push([branch.expr, isExpected]);
    const conditionValue = branch.isCondition ? manager.trueExpr : manager.falseExpr;
    if (condition !== conditionValue) todo.push([condition, !branch.isCondition]);
  }
};

export const validateModel = (
  manager: AstManager,
  model: ProtoModel,
  assertions: readonly number[],
) => {
  // cmd_context sets sort_store with set_uint, which get_bool ignores.
  const evaluator = new ModelEvaluator(manager, model, UINT_MAX);
  evaluator.setModelCompletion(true);
  evaluator.setExpandArrayEqualities(false);
  manager.limit.push(0);
  const seen = new Set<number>();
  let isValid = true;
  try {
    for (const assertion of assertions) {
      if (!manager.isGroundApp(assertion)) continue;
      const value = evaluator.rewrite(assertion);
      const isSkipped =
        value === manager.trueExpr ||
        manager.hasQuantifierFlags[value] === 1 ||
        (value !== manager.falseExpr && hasUnderspecifiedOp(manager, assertion)) ||
        hasUnderspecifiedOp(manager, value);
      if (!isSkipped) analyzeFailure(manager, evaluator, seen, assertion);
      if (!isSkipped && value === manager.falseExpr) isValid = false;
      manager.decRef(value);
    }
  } finally {
    manager.limit.pop();
    evaluator.release();
  }
  return isValid;
};

// Ported from Z3 (src/tactic/arith/purify_arith_tactic.cpp), MIT license, see z3-license.txt. Only
// quantifier-free goals the purification leaves unchanged are ported: it throws on the others.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ACOS,
  OP_ASIN,
  OP_ATAN,
  OP_COS,
  OP_DIV,
  OP_IDIV,
  OP_MOD,
  OP_POWER,
  OP_SIN,
  OP_TO_INT,
} from "./ast";
import type { Goal } from "./goal";

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
  if (manager.isAlgebraicNumeral(expr)) return true;
  if (manager.getFamily(expr) !== FAMILY_ARITH) return false;
  const op = manager.getOp(expr);
  if (op !== OP_POWER) return PURIFIED_OPS.has(op);
  const exponent = manager.getArg(expr, 1);
  if (!manager.isNumeral(exponent)) return false;
  const value = manager.getRationalValue(exponent);
  return !value.isInt() || value.isZero();
};

export const purifyArith = (manager: AstManager, goal: Goal) => {
  const seen = new Set<number>();
  const todo = [...goal.forms.items];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr)) continue;
    seen.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER)
      throw new SmtUnsupportedError("purify-arith on quantifiers");
    if (manager.kinds[expr] !== KIND_APP) continue;
    if (isPurified(manager, expr))
      throw new SmtUnsupportedError("purify-arith on a goal it changes");
    manager.pushArgs(expr, todo);
  }
  goal.depth++;
};

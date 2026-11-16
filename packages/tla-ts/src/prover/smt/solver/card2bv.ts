// Ported from Z3 (src/ast/simplifiers/card2bv.cpp, src/ast/rewriter/pb2bv_rewriter.cpp), MIT
// license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_EQ,
  OP_GE,
  OP_GT,
  OP_ITE,
  OP_LE,
  OP_LT,
  OP_MUL,
  OP_SUB,
  OP_UMINUS,
} from "./ast";
import type { Goal } from "./goal";
import { Rational } from "./rational";
import { Rewriter, type RewriterOptions } from "./rewriter";

interface Bound {
  value: Rational;
}

const isPbSum = (manager: AstManager, expr: number, factor: Rational, bound: Bound): boolean => {
  if (manager.kinds[expr] !== KIND_APP) return false;
  const args = manager.getArgs(expr);
  switch (manager.getOp(expr)) {
    case OP_ADD:
      return args.every((arg) => isPbSum(manager, arg, factor, bound));
    case OP_SUB:
      return (
        isPbSum(manager, args[0], factor, bound) &&
        args.slice(1).every((arg) => isPbSum(manager, arg, factor.neg(), bound))
      );
    case OP_UMINUS:
      return isPbSum(manager, args[0], factor.neg(), bound);
    case OP_MUL:
      if (args.length !== 2) return false;
      if (manager.isNumeral(args[0]))
        return isPbSum(manager, args[1], manager.getRationalValue(args[0]).mul(factor), bound);
      if (manager.isNumeral(args[1]))
        return isPbSum(manager, args[0], manager.getRationalValue(args[1]).mul(factor), bound);
      return false;
    case OP_ITE: {
      if (!manager.isNumeral(args[1]) || !manager.isNumeral(args[2])) return false;
      const thenValue = manager.getRationalValue(args[1]).mul(factor);
      const elseValue = manager.getRationalValue(args[2]).mul(factor);
      const low = thenValue.compare(elseValue) < 0 ? thenValue : elseValue;
      bound.value = bound.value.sub(low);
      return bound.value.isInt() && thenValue.sub(elseValue).isInt();
    }
    default:
      if (!manager.isNumeral(expr)) return false;
      bound.value = bound.value.sub(factor.mul(manager.getRationalValue(expr)));
      return bound.value.isInt();
  }
};

const isPb = (manager: AstManager, first: number, second: number) => {
  const bound = { value: Rational.zero };
  return (
    isPbSum(manager, first, Rational.one, bound) &&
    isPbSum(manager, second, Rational.minusOne, bound)
  );
};

// The port has no pseudo-Boolean constraints, so a comparison the encoder would rewrite is unsupported.
export const checkPbFree = (manager: AstManager, form: number) => {
  const visited = new Set<number>();
  const todo = [form];
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      todo.push(manager.getQuantifier(expr).body);
      continue;
    }
    if (manager.kinds[expr] !== KIND_APP) continue;
    const op = manager.getOp(expr);
    const args = manager.getArgs(expr);
    const isEncoded =
      op === OP_LE || op === OP_LT
        ? isPb(manager, args[0], args[1])
        : op === OP_GE || op === OP_GT
          ? isPb(manager, args[1], args[0])
          : op === OP_EQ && isPb(manager, args[0], args[1]);
    if (isEncoded) throw new SmtUnsupportedError("pseudo-Boolean constraints");
    todo.push(...args);
  }
};

export const card2bv = (manager: AstManager, goal: Goal, options: RewriterOptions) => {
  if (!goal.isProofsEnabled) {
    const rewriter = new Rewriter(manager, options);
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const form = goal.forms.items[index];
      const rewritten = rewriter.rewrite(form);
      checkPbFree(manager, rewritten);
      if (rewritten !== form) goal.update(index, rewritten);
      manager.decRef(rewritten);
    }
    rewriter.release();
  }
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
};

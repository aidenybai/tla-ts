// Ported from Z3 (src/tactic/core/propagate_values_tactic.cpp, src/ast/shared_occs.cpp), MIT license,
// see z3-license.txt. The propagate-values tactic: a formula that is an atom, a negated atom or an
// equality with a value rewrites the other formulas, when its atom or term occurs more than once in
// the goal.
import { KIND_APP, KIND_QUANTIFIER, OP_EQ, type AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import type { Goal } from "./goal";
import { Rewriter } from "./rewriter";

// The max_rounds parameter's default.
const MAX_ROUNDS = 4;

// goal_shared_occs with atoms tracked: the terms that the goal's formulas reach more than once,
// quantifier bodies included and patterns excluded.
const getSharedOccs = (manager: AstManager, forms: number[]) => {
  const visited = new Set<number>();
  const shared = new Set<number>();
  const todo = [...forms];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) {
      shared.add(expr);
      continue;
    }
    visited.add(expr);
    if (manager.kinds[expr] === KIND_APP) todo.push(...manager.args[expr]);
    else if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
  }
  return shared;
};

export const propagateValues = (manager: AstManager, goal: Goal) => {
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, {
    isEliminatingAnd: false,
    arith: TACTIC_ARITH_OPTIONS,
    isRewritingPatterns: false,
  });
  const substitution = new Map<number, number>();
  rewriter.setSubstitution(substitution);
  let occs = getSharedOccs(manager, goal.forms.items);
  let isModified = false;
  // process_current and push_result.
  const process = (index: number) => {
    const current = goal.forms.items[index];
    const isRewriting = substitution.size !== 0;
    const rewritten = isRewriting ? rewriter.rewrite(current) : current;
    if (rewritten !== current) isModified = true;
    goal.update(index, rewritten);
    if (isRewriting) manager.decRef(rewritten);
    if (occs.has(rewritten)) substitution.set(rewritten, manager.trueExpr);
    if (manager.isNot(rewritten) && occs.has(manager.args[rewritten][0]))
      substitution.set(manager.args[rewritten][0], manager.falseExpr);
    if (manager.getOp(rewritten) !== OP_EQ) return;
    const sides = manager.args[rewritten];
    if (manager.isUniqueValue(sides[0]) && occs.has(sides[1])) substitution.set(sides[1], sides[0]);
    else if (manager.isUniqueValue(sides[1]) && occs.has(sides[0]))
      substitution.set(sides[0], sides[1]);
  };
  // Each pass is a round: a forward pass, which stops when it found nothing, then a backward pass,
  // which stops when it changed nothing.
  for (let round = 0; round < MAX_ROUNDS; round += 2) {
    const size = goal.forms.size;
    for (let index = 0; index < size; index++) {
      process(index);
      if (goal.isInconsistent) return;
    }
    if (substitution.size === 0 && !isModified) break;
    occs = getSharedOccs(manager, goal.forms.items);
    substitution.clear();
    rewriter.setSubstitution(substitution);
    for (let index = goal.forms.size - 1; index >= 0; index--) {
      process(index);
      if (goal.isInconsistent) return;
    }
    if (!isModified) break;
    substitution.clear();
    rewriter.setSubstitution(substitution);
    isModified = false;
    occs = getSharedOccs(manager, goal.forms.items);
  }
  goal.elimRedundancies();
};

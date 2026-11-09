// Ported from Z3 (src/tactic/dependent_expr_state_tactic.h,
// src/ast/simplifiers/dependent_expr_state.h), MIT license, see z3-license.txt.
import type { AstManager } from "./ast";
import type { Goal } from "./goal";

// indices: the formulas of the goal when the simplifier starts, until it is inconsistent or
// canceled. Each step counts a step of the resource limit.
export const forEachIndex = (manager: AstManager, goal: Goal, visit: (index: number) => void) => {
  const end = goal.forms.size;
  for (let index = 0; index !== end;) {
    visit(index);
    index =
      !manager.limit.inc() || goal.isInconsistent || index >= goal.forms.size ? end : index + 1;
  }
};

export const runSimplifier = (goal: Goal, isSupportingProofs: boolean, reduce: () => void) => {
  if (!goal.isProofsEnabled || isSupportingProofs) reduce();
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
};

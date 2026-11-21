import type { AstManager } from "./ast";
import { runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";
import { MaxBvSharing } from "./maximize-ac-sharing";

// dependent_expr_state_tactic pushes a scope of the state but not of the simplifier, so the
// rewriter never registers the kinds it shares and leaves every formula as it is.
export const runMaxBvSharing = (manager: AstManager) => (goal: Goal) => {
  runSimplifier(goal, false, (state) => {
    const rewriter = new MaxBvSharing(manager);
    return {
      reduce: () => state.rewriteEach((form) => rewriter.rewrite(form)),
      release: () => rewriter.release(),
    };
  });
  return [goal];
};

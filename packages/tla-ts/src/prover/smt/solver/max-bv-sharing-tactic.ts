// Ported from Z3 (src/tactic/bv/max_bv_sharing_tactic.h, src/ast/simplifiers/max_bv_sharing.cpp),
// MIT license, see z3-license.txt.
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
      reduce: () => {
        let rewritten = -1;
        state.forEachIndex((index) => {
          const form = state.get(index);
          const next = rewriter.rewrite(form);
          if (rewritten !== -1) manager.decRef(rewritten);
          rewritten = next;
          if (rewritten !== form) goal.update(index, rewritten);
        });
        if (rewritten !== -1) manager.decRef(rewritten);
      },
      release: () => rewriter.release(),
    };
  });
  return [goal];
};

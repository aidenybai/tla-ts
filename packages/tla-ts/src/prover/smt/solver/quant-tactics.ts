// Ported from Z3 (src/tactic/smtlogics/quant_tactics.cpp, src/tactic/core/simplify_tactic.cpp), MIT
// license, see z3-license.txt. This strategy skips elim-uncnstr's elimination and the simplifier's
// local_ctx option, as they change almost none of tlapm's obligations.
import type { AstManager } from "./ast";
import { ctxSimplify } from "./ctx-simplify";
import { collectUnconstrained, disableQuantified } from "./elim-uncnstr";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { applyQeLite } from "./qe-lite";
import { Rewriter, type RewriterOptions, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";

export const simplifyGoal = (manager: AstManager, goal: Goal, options: RewriterOptions) => {
  goal.depth++;
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, options);
  const size = goal.forms.size;
  let rewritten = -1;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const result = rewriter.rewrite(goal.forms.items[index]);
    if (rewritten !== -1) manager.decRef(rewritten);
    rewritten = result;
    goal.update(index, rewritten, goal.getDependency(index));
  }
  if (rewritten !== -1) manager.decRef(rewritten);
  goal.elimRedundancies();
  rewriter.release();
};

// elim_uncnstr_tactic::run without the elimination. Its rewriter still runs over the formulas when
// some constant is unconstrained, and counts its steps. The rewriter starts as if the formulas had
// changed, so it makes a second round.
const elimUncnstr = (manager: AstManager, goal: Goal) => {
  const isRewriting = collectUnconstrained(manager, goal).size > 0;
  disableQuantified(manager, goal, new RefVector(manager));
  if (!isRewriting) return;
  const rewriter = new RewriterTpl(manager);
  for (let round = 0; round < 2; round++) {
    for (const form of goal.forms.items) manager.decRef(rewriter.rewrite(form));
    rewriter.reset();
  }
  rewriter.release();
};

export const applyUfniaTactic = (manager: AstManager, assertions: number[]) => {
  const goal = new Goal(manager);
  for (const assertion of assertions) goal.assert(assertion);
  simplifyGoal(manager, goal, TACTIC_REWRITER_OPTIONS);
  // and_then runs the next tactic only on a goal that is not decided: one that is consistent and
  // has formulas left.
  const steps = [
    () => propagateValues(manager, goal),
    () => ctxSimplify(manager, goal, 30, 5000000),
    () => simplifyGoal(manager, goal, { ...TACTIC_REWRITER_OPTIONS, isPullingCheapIte: true }),
    () => elimUncnstr(manager, goal),
    () => simplifyGoal(manager, goal, TACTIC_REWRITER_OPTIONS),
    () => applyQeLite(manager, goal),
  ];
  for (const step of steps) {
    if (goal.isInconsistent || goal.forms.size === 0) break;
    step();
  }
  return goal;
};

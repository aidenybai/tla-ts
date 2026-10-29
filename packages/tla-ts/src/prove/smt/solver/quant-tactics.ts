// Ported from Z3 (src/tactic/smtlogics/quant_tactics.cpp, src/tactic/core/simplify_tactic.cpp), MIT
// license, see z3-license.txt. With (set-logic UFNIA), Z3's strategic solver runs the ufnia tactic:
// a preprocessor, then qe-lite, then the SMT kernel. Of the preprocessor, ctx-simplify,
// elim-uncnstr and the simplifier's pull_cheap_ite and local_ctx options are not ported, as they
// change almost none of tlapm's obligations.
import type { AstManager } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { qeLite } from "./qe-lite";
import { Rewriter } from "./rewriter";

// The simplify tactic.
const simplify = (manager: AstManager, goal: Goal) => {
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, { isEliminatingAnd: false, arith: TACTIC_ARITH_OPTIONS });
  const size = goal.forms.length;
  for (let index = 0; index < size && !goal.isInconsistent; index++)
    goal.update(index, rewriter.rewrite(goal.forms[index]));
  goal.elimRedundancies();
};

// mk_ufnia_tactic, up to the SMT kernel: mk_quant_preprocessor without solve-eqs, then qe-lite.
export const applyUfniaTactic = (manager: AstManager, assertions: number[]) => {
  const goal = new Goal(manager);
  for (const assertion of assertions) goal.assert(assertion);
  simplify(manager, goal);
  propagateValues(manager, goal);
  simplify(manager, goal);
  simplify(manager, goal);
  if (goal.isInconsistent) return goal.forms;
  const reduced = qeLite(manager, goal.forms);
  for (const [index, formula] of reduced.entries())
    if (formula !== goal.forms[index]) goal.update(index, formula);
  goal.elimTrue();
  goal.elimRedundancies();
  return goal.forms;
};

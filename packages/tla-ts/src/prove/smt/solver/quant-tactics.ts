// Ported from Z3 (src/tactic/smtlogics/quant_tactics.cpp, src/tactic/core/simplify_tactic.cpp), MIT
// license, see z3-license.txt. With (set-logic UFNIA), Z3's strategic solver runs the ufnia tactic:
// a preprocessor, then qe-lite, then the SMT kernel. Of the preprocessor, elim-uncnstr's
// elimination and the simplifier's pull_cheap_ite and local_ctx options are not ported, as they
// change almost none of tlapm's obligations.
import { type AstManager, KIND_APP, KIND_QUANTIFIER } from "./ast";
import { TACTIC_ARITH_OPTIONS } from "./arith-rewriter";
import { ctxSimplify } from "./ctx-simplify";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { applyQeLite } from "./qe-lite";
import { Rewriter } from "./rewriter";

// The simplify tactic.
const simplify = (manager: AstManager, goal: Goal) => {
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, {
    isEliminatingAnd: false,
    arith: TACTIC_ARITH_OPTIONS,
    isRewritingPatterns: false,
  });
  const size = goal.forms.size;
  let rewritten = -1;
  for (let index = 0; index < size && !goal.isInconsistent; index++) {
    const result = rewriter.rewrite(goal.forms.items[index]);
    if (rewritten !== -1) manager.decRef(rewritten);
    rewritten = result;
    goal.update(index, rewritten);
  }
  if (rewritten !== -1) manager.decRef(rewritten);
  goal.elimRedundancies();
  rewriter.release();
};

// elim_uncnstr_tactic::disable_quantified: the tactic holds the body of each quantifier until it is
// destroyed after the search.
const pinQuantifierBodies = (manager: AstManager, goal: Goal) => {
  const visited = new Set<number>();
  const disabled = new Set<number>();
  const disable = (body: number) => {
    if (disabled.has(body)) return;
    manager.incRef(body);
    const todo = [body];
    while (todo.length > 0) {
      const expr = todo.pop() as number;
      if (disabled.has(expr)) continue;
      disabled.add(expr);
      if (manager.kinds[expr] === KIND_APP) todo.push(...manager.args[expr]);
    }
  };
  const todo = [...goal.forms.items];
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const body = manager.getQuantifier(expr).body;
      disable(body);
      todo.push(body);
    } else if (manager.kinds[expr] === KIND_APP) todo.push(...manager.args[expr]);
  }
};

// mk_ufnia_tactic, up to the SMT kernel: mk_quant_preprocessor without solve-eqs, then qe-lite.
export const applyUfniaTactic = (manager: AstManager, assertions: number[]) => {
  const goal = new Goal(manager);
  for (const assertion of assertions) goal.assert(assertion);
  simplify(manager, goal);
  propagateValues(manager, goal);
  ctxSimplify(manager, goal);
  simplify(manager, goal);
  if (!goal.isInconsistent) pinQuantifierBodies(manager, goal);
  simplify(manager, goal);
  if (!goal.isInconsistent) applyQeLite(manager, goal);
  return goal.forms.items;
};

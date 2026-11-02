// Ported from Z3 (src/tactic/smtlogics/quant_tactics.cpp, src/tactic/core/simplify_tactic.cpp), MIT
// license, see z3-license.txt. With (set-logic UFNIA), Z3's strategic solver runs the ufnia tactic:
// a preprocessor, then qe-lite, then the SMT kernel. Of the preprocessor, elim-uncnstr's
// elimination and the simplifier's local_ctx option are not ported, as they change almost none of
// tlapm's obligations.
import { type AstManager, KIND_APP, KIND_QUANTIFIER } from "./ast";
import { ctxSimplify } from "./ctx-simplify";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { applyQeLite } from "./qe-lite";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

// The simplify tactic, with pull_cheap_ite where the preprocessor sets it.
const simplify = (manager: AstManager, goal: Goal, isPullingCheapIte = false) => {
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, { ...TACTIC_REWRITER_OPTIONS, isPullingCheapIte });
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

// collect_occs: whether an uninterpreted constant occurs only once, where a term is visited once and
// a quantifier's patterns are not visited.
const hasUnconstrainedConst = (manager: AstManager, goal: Goal) => {
  const visited = new Set<number>();
  const consts: number[] = [];
  const repeated = new Set<number>();
  const todo = [...goal.forms.items];
  while (todo.length > 0) {
    const expr = todo.pop() as number;
    const isConst = manager.isUninterpretedConst(expr);
    if (visited.has(expr)) {
      if (isConst) repeated.add(expr);
      continue;
    }
    visited.add(expr);
    if (isConst) consts.push(expr);
    else if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
    else if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
  }
  return consts.some((expr) => !repeated.has(expr));
};

// elim_uncnstr_tactic::run without the elimination. Its rewriter still runs over the formulas when
// some constant is unconstrained, and counts its steps. The rewriter starts as if the formulas had
// changed, so it makes a second round.
const elimUncnstr = (manager: AstManager, goal: Goal) => {
  const isRewriting = hasUnconstrainedConst(manager, goal);
  pinQuantifierBodies(manager, goal);
  if (!isRewriting) return;
  const rewriter = new RewriterTpl(manager);
  for (let round = 0; round < 2; round++) {
    for (const form of goal.forms.items) manager.decRef(rewriter.rewrite(form));
    rewriter.reset();
  }
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
      if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
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
    } else if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
  }
};

// mk_ufnia_tactic, up to the SMT kernel: mk_quant_preprocessor without solve-eqs, then qe-lite.
export const applyUfniaTactic = (manager: AstManager, assertions: number[]) => {
  const goal = new Goal(manager);
  for (const assertion of assertions) goal.assert(assertion);
  simplify(manager, goal);
  // and_then runs the next tactic only on a goal that is not decided: one that is consistent and
  // has formulas left.
  const steps = [
    () => propagateValues(manager, goal),
    () => ctxSimplify(manager, goal),
    () => simplify(manager, goal, true),
    () => elimUncnstr(manager, goal),
    () => simplify(manager, goal),
    () => applyQeLite(manager, goal),
  ];
  for (const step of steps) {
    if (goal.isInconsistent || goal.forms.size === 0) break;
    step();
  }
  return goal;
};

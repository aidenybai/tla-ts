// Ported from Z3 (src/tactic/smtlogics/quant_tactics.cpp, src/tactic/core/simplify_tactic.cpp), MIT license, see z3-license.txt.
import { type AstManager, KIND_APP, KIND_QUANTIFIER } from "./ast";
import { ctxSimplify } from "./ctx-simplify";
import { Goal } from "./goal";
import { propagateValues } from "./propagate-values";
import { applyQeLite } from "./qe-lite";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";

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

const hasUnconstrainedConst = (manager: AstManager, goal: Goal) => {
  const visited = new Set<number>();
  const consts: number[] = [];
  const repeated = new Set<number>();
  const todo = [...goal.forms.items];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
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

// Z3's elim_uncnstr rewriter runs twice over the formulas and counts its steps, though the elimination is not ported.
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

const pinQuantifierBodies = (manager: AstManager, goal: Goal) => {
  const visited = new Set<number>();
  const disabled = new Set<number>();
  const disable = (body: number) => {
    if (disabled.has(body)) return;
    manager.incRef(body);
    const todo = [body];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (disabled.has(expr)) continue;
      disabled.add(expr);
      if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
    }
  };
  const todo = [...goal.forms.items];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (visited.has(expr)) continue;
    visited.add(expr);
    if (manager.kinds[expr] === KIND_QUANTIFIER) {
      const body = manager.getQuantifier(expr).body;
      disable(body);
      todo.push(body);
    } else if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
  }
};

export const applyUfniaTactic = (manager: AstManager, assertions: number[]) => {
  const goal = new Goal(manager);
  for (const assertion of assertions) goal.assert(assertion);
  simplify(manager, goal);
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

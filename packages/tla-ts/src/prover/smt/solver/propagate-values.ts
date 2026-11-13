// Ported from Z3 (src/tactic/core/propagate_values_tactic.cpp, src/ast/shared_occs.cpp), MIT license, see z3-license.txt.
import { KIND_APP, KIND_QUANTIFIER, OP_EQ, type AstManager } from "./ast";
import { type Dependency, type Goal, joinDependencies } from "./goal";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

// Quantifier bodies are included and patterns excluded.
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
    if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
    else if (manager.kinds[expr] === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
  }
  return shared;
};

export const propagateValues = (manager: AstManager, goal: Goal, maxRounds = 4) => {
  goal.depth++;
  if (goal.isInconsistent) return;
  const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  const substitution = new Map<number, number>();
  const dependencies = new Map<number, Dependency | undefined>();
  rewriter.setSubstitution(substitution, dependencies);
  const insert = (expr: number, value: number, dependency: Dependency | undefined) => {
    substitution.set(expr, value);
    dependencies.set(expr, dependency);
  };
  const clear = () => {
    substitution.clear();
    dependencies.clear();
    rewriter.setSubstitution(substitution, dependencies);
  };
  let occs = getSharedOccs(manager, goal.forms.items);
  let isModified = false;
  const process = (index: number) => {
    const current = goal.forms.items[index];
    const isRewriting = substitution.size !== 0;
    const rewritten = isRewriting ? rewriter.rewrite(current) : current;
    if (rewritten !== current) isModified = true;
    const used = goal.isCoresEnabled ? rewriter.usedDependencies : undefined;
    const dependency = joinDependencies(goal.getDependency(index), used);
    // Forgetting the used dependencies drops the cache, whose results would hide them next time.
    if (used !== undefined) {
      rewriter.usedDependencies = undefined;
      rewriter.setSubstitution(substitution, dependencies);
    }
    goal.update(index, rewritten, dependency);
    if (isRewriting) manager.decRef(rewritten);
    if (occs.has(rewritten)) insert(rewritten, manager.trueExpr, dependency);
    if (manager.isNot(rewritten) && occs.has(manager.getArg(rewritten, 0)))
      insert(manager.getArg(rewritten, 0), manager.falseExpr, dependency);
    if (manager.getOp(rewritten) !== OP_EQ) return;
    if (manager.isValue(manager.getArg(rewritten, 0)) && occs.has(manager.getArg(rewritten, 1)))
      insert(manager.getArg(rewritten, 1), manager.getArg(rewritten, 0), dependency);
    else if (
      manager.isValue(manager.getArg(rewritten, 1)) &&
      occs.has(manager.getArg(rewritten, 0))
    )
      insert(manager.getArg(rewritten, 0), manager.getArg(rewritten, 1), dependency);
  };
  for (let round = 0; round < maxRounds; round += 2) {
    const size = goal.forms.size;
    for (let index = 0; index < size; index++) {
      process(index);
      if (goal.isInconsistent) return;
    }
    if (substitution.size === 0 && !isModified) break;
    if (round + 1 >= maxRounds) break;
    occs = getSharedOccs(manager, goal.forms.items);
    clear();
    for (let index = goal.forms.size - 1; index >= 0; index--) {
      process(index);
      if (goal.isInconsistent) return;
    }
    if (!isModified) break;
    clear();
    isModified = false;
    occs = getSharedOccs(manager, goal.forms.items);
  }
  goal.elimRedundancies();
};

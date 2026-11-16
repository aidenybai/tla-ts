// Ported from Z3 (src/tactic/arith/add_bounds_tactic.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  KIND_APP,
  KIND_VAR,
  OP_GE,
  OP_LE,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { type Goal, UNDER } from "./goal";
import type { Rational } from "./rational";

// Z3's add_bounds_tactic never adds the goal to its bound_manager, so every arithmetic constant
// counts as unbounded and gets both bounds.
export const addBounds = (manager: AstManager, goal: Goal, lower: Rational, upper: Rational) => {
  let numBounds = 0;
  const visited = new Set<number>();
  const getChildren = (expr: number) => {
    if (manager.kinds[expr] === KIND_APP) return manager.getArgs(expr);
    if (manager.kinds[expr] === KIND_VAR) return [];
    const data = manager.getQuantifier(expr);
    return [data.body, ...data.patterns, ...data.noPatterns];
  };
  const visit = (expr: number) => {
    const sort = manager.sorts[expr];
    if (!manager.isUninterpretedConst(expr) || (sort !== SORT_INT && sort !== SORT_REAL)) return;
    goal.assert(manager.mkApp(OP_LE, [expr, manager.mkNumeralOfSort(upper, sort)], SORT_BOOL));
    goal.assert(manager.mkApp(OP_GE, [expr, manager.mkNumeralOfSort(lower, sort)], SORT_BOOL));
    numBounds += 2;
  };
  const size = goal.forms.size;
  for (let index = 0; index < size; index++) {
    const form = goal.forms.items[index];
    if (visited.has(form)) continue;
    visited.add(form);
    const exprs = [form];
    const children = [getChildren(form)];
    const nextChildren = [0];
    while (exprs.length > 0) {
      const top = exprs.length - 1;
      const child = children[top][nextChildren[top]++];
      if (child === undefined) {
        const expr = exprs.pop() as number;
        if (manager.kinds[expr] === KIND_APP) visit(expr);
        children.pop();
        nextChildren.pop();
        continue;
      }
      if (visited.has(child)) continue;
      visited.add(child);
      exprs.push(child);
      children.push(getChildren(child));
      nextChildren.push(0);
    }
  }
  goal.depth++;
  if (numBounds > 0) goal.updatePrecision(UNDER);
};

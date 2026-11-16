// Ported from Z3 (src/tactic/dependent_expr_state_tactic.h,
// src/ast/simplifiers/dependent_expr_state.h, src/ast/simplifiers/dependent_expr_state.cpp), MIT
// license, see z3-license.txt.
import type { AstManager } from "./ast";
import type { Goal } from "./goal";

// The formula read last stays referenced, as m_dep, until the next read or the end of the tactic.
export class DependentExprState {
  private held = -1;

  constructor(
    readonly manager: AstManager,
    readonly goal: Goal,
  ) {}

  get(index: number) {
    const form = this.goal.forms.items[index];
    this.manager.incRef(form);
    if (this.held !== -1) this.manager.decRef(this.held);
    this.held = form;
    return form;
  }

  // Each step counts a step of the resource limit.
  forEachIndex(visit: (index: number) => void) {
    const goal = this.goal;
    const end = goal.forms.size;
    for (let index = 0; index !== end;) {
      visit(index);
      index =
        !this.manager.limit.inc() || goal.isInconsistent || index >= goal.forms.size
          ? end
          : index + 1;
    }
  }

  // A rewrite of -1 leaves the formula. The last result stays referenced until the next one.
  rewriteEach(rewrite: (form: number) => number) {
    const manager = this.manager;
    const goal = this.goal;
    let rewritten = -1;
    this.forEachIndex((index) => {
      const form = this.get(index);
      const next = rewrite(form);
      if (next === -1) return;
      if (rewritten !== -1) manager.decRef(rewritten);
      rewritten = next;
      if (rewritten !== form) goal.update(index, rewritten, goal.getDependency(index));
    });
    if (rewritten !== -1) manager.decRef(rewritten);
  }

  hasQuantifiers() {
    let isFound = false;
    for (let index = 0; index < this.goal.forms.size; index++)
      if (this.manager.hasQuantifierFlags[this.get(index)]) isFound = true;
    return isFound;
  }

  release() {
    if (this.held !== -1) this.manager.decRef(this.held);
    this.held = -1;
  }
}

interface Simplifier {
  reduce(): void;
  release(): void;
}

export const runSimplifier = (
  goal: Goal,
  isSupportingProofs: boolean,
  create: (state: DependentExprState) => Simplifier,
) => {
  const state = new DependentExprState(goal.manager, goal);
  const simplifier = create(state);
  if (!goal.isProofsEnabled || isSupportingProofs) simplifier.reduce();
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
  simplifier.release();
  state.release();
};

// Ported from Z3 (src/smt/theory_polymorphism.h), MIT license, see z3-license.txt. The port parses
// no polymorphic axioms, so the theory never has instances to assert. It still assumes a fresh
// constant whenever formulas were asserted since its last assumption, which takes a fresh name and
// a Boolean variable as Z3's does.
import { FAMILY_POLY, SORT_BOOL } from "./ast";
import type { Context } from "./context";
import { Theory } from "./theory";

export class TheoryPolymorphism extends Theory {
  readonly name = "polymorphism";
  private qhead = 0;
  private assumption = -1;
  private isPending = true;

  constructor(context: Context) {
    super(context, FAMILY_POLY);
  }

  internalizeAtom() {
    return false;
  }

  internalizeTerm() {
    return false;
  }

  newEqEh() {}

  newDiseqEh() {}

  override canPropagate() {
    return this.isPending;
  }

  override propagate() {
    this.isPending = false;
  }

  override addTheoryAssumptions(assumptions: number[]) {
    const numFormulas = this.context.getNumAssertedFormulas();
    if (this.qhead === numFormulas) return;
    const manager = this.manager;
    const assumption = manager.mkFreshConst("poly", SORT_BOOL);
    manager.incRef(assumption);
    if (this.assumption !== -1) manager.decRef(this.assumption);
    this.assumption = assumption;
    assumptions.push(assumption);
    const qhead = this.qhead;
    this.context.pushTrail(() => {
      this.qhead = qhead;
    });
    this.qhead = numFormulas;
    this.isPending = true;
  }

  override shouldResearch(unsatCore: readonly number[]) {
    return unsatCore.includes(this.assumption);
  }
}

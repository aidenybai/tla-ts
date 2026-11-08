// Ported from Z3 (src/smt/theory_finite_set.cpp), MIT license, see z3-license.txt. setup_unknown
// registers theory_finite_set, which the port has only for what it does on problems without finite
// sets: its first final check makes a set.range declaration, which initializes the plugin, and each
// one's assume_eqs draws a random value.
import { FAMILY_FINITE_SET } from "./ast";
import type { Context } from "./context";
import { FC_DONE, Theory } from "./theory";

export class TheoryFiniteSet extends Theory {
  constructor(context: Context) {
    super(context, FAMILY_FINITE_SET);
  }

  internalizeAtom() {
    return false;
  }

  internalizeTerm() {
    return false;
  }

  newEqEh() {}

  newDiseqEh() {}

  override finalCheckEh() {
    this.manager.initFiniteSetPlugin();
    this.context.getRandomValue();
    return FC_DONE;
  }
}

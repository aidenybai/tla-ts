// Ported from Z3 (src/smt/theory_finite_set.cpp), MIT license, see z3-license.txt. Only its final
// check on problems without finite sets is kept, which inits the plugin and draws a value.
import { FAMILY_FINITE_SET } from "./ast";
import type { Context } from "./context";
import { FC_DONE, Theory } from "./theory";

export class TheoryFiniteSet extends Theory {
  readonly name = "finite_set";
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

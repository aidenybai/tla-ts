// theory_dl, theory_ff and theory_special_relations, whose sorts and relations the port does not
// have. Without terms, each only takes its turn in final_check, which counts a step of the limit.
import type { Context } from "./context";
import { Theory } from "./theory";

export class TheoryWithoutTerms extends Theory {
  constructor(
    context: Context,
    id: number,
    readonly name: string,
  ) {
    super(context, id);
  }

  internalizeAtom() {
    return false;
  }

  internalizeTerm() {
    return false;
  }

  newEqEh() {}

  newDiseqEh() {}
}

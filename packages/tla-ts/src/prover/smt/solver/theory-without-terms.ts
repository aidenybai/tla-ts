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

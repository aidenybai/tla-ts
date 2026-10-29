// How each of tla-ts's backends decides the text tlapm would send its prover, by the prover of the
// method that selects it.

import { SmtParseError, TlaProverError } from "../errors";
import { decideIsabelle } from "./isabelle/decide";
import { decidePtl } from "./ptl/decide";
import { decideSmt } from "./smt/solver/solver";
import type { DecideOptions, Verdict } from "./verdict";
import { decideZenon } from "./zenon/decide";

// Z3 rejects malformed input with an error, and tlapm counts that as a failure.
const decideZ3 = (text: string, options: DecideOptions) => {
  try {
    return decideSmt(text, options);
  } catch (error) {
    if (error instanceof SmtParseError) throw new TlaProverError(error.message, error);
    throw error;
  }
};

export const DECIDERS: Record<string, (text: string, options: DecideOptions) => Verdict> = {
  smt: decideZ3,
  z3: decideZ3,
  zenon: (text, options) => decideZenon(text, options).verdict,
  isabelle: decideIsabelle,
  ls4: decidePtl,
};

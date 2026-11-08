import { SmtParseError, TlaProverError } from "../errors";
import { decideIsabelle } from "./isabelle/decide";
import { decidePtl } from "./ptl/decide";
import { decideSmt } from "./smt/solver/solver";
import type { DecideOptions, Decision } from "./verdict";
import { decideZenon } from "./zenon/decide";

// Z3 rejects malformed input with an error, and tlapm counts that as a failure.
const decideZ3 = (text: string, options: DecideOptions) => {
  try {
    const verdict = decideSmt(text, options);
    return { verdict, output: `${verdict}\n` };
  } catch (error) {
    if (error instanceof SmtParseError) throw new TlaProverError(error.message, error);
    throw error;
  }
};

export const DECIDERS: Record<
  string,
  (text: string, options: DecideOptions) => Omit<Decision, "timeUsedMs">
> = {
  smt: decideZ3,
  z3: decideZ3,
  zenon: (text, options) => {
    const decision = decideZenon(text, options);
    return {
      verdict: decision.verdict,
      ...("proof" in decision && { output: decision.proof }),
      ...("error" in decision && { errorOutput: decision.error }),
    };
  },
  isabelle: (text, options) => ({ verdict: decideIsabelle(text, options) }),
  ls4: (text, options) => ({ verdict: decidePtl(text, options) }),
};

export const decide = (prover: string, text: string, options: DecideOptions): Decision => {
  const start = performance.now();
  return { ...DECIDERS[prover](text, options), timeUsedMs: performance.now() - start };
};

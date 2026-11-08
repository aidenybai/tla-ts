// Isabelle interrupts a proof that runs out of time wherever it is, so this port checks at the
// points where Isabelle's tactics and unifier spend their time.

import { TlaIsabelleError } from "../../../errors";

export interface Limits {
  readonly deadline: number;
  readonly signal?: AbortSignal;
}

// tlapm reports no success for an interrupted proof.
export const checkInterrupt = (limits: Limits) => {
  if (Date.now() > limits.deadline || limits.signal?.aborted === true)
    throw new TlaIsabelleError("Interrupt", "Interrupt");
};

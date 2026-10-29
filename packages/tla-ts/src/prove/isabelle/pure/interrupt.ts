// Isabelle interrupts a proof that runs out of time, wherever it is; this port checks for that at
// the points where Isabelle's tactics and unifier spend their time.

import { TlaIsabelleError } from "../../../errors";

// When a proof gives up: past the deadline, a time from Date.now(), or once the signal aborts.
export interface Limits {
  readonly deadline: number;
  readonly signal?: AbortSignal;
}

// tlapm reports no success for an interrupted proof.
export const checkInterrupt = (limits: Limits) => {
  if (Date.now() > limits.deadline || limits.signal?.aborted === true)
    throw new TlaIsabelleError("Interrupt", "Interrupt");
};

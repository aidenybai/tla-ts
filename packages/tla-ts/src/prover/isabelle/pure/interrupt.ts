import { TlaIsabelleError } from "../../../errors";

export interface Limits {
  readonly deadline: number;
  readonly signal?: AbortSignal;
}

export const checkInterrupt = (limits: Limits) => {
  if (Date.now() > limits.deadline || limits.signal?.aborted === true)
    throw new TlaIsabelleError("Interrupt", "Interrupt");
};

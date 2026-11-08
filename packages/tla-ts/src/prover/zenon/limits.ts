// tlapm kills Zenon at its deadline whether Zenon is searching or printing the proof, so the
// search, the checker and the printer each check the limits at every step.
export interface Limits {
  deadline: number;
  signal: AbortSignal | undefined;
}

export const getLimitFailure = (limits: Limits) =>
  Date.now() > limits.deadline
    ? "time limit"
    : limits.signal?.aborted === true
      ? "aborted"
      : undefined;

// When Zenon gives up: past the deadline, a time from Date.now(), or once the signal aborts. tlapm
// kills Zenon at its deadline whether Zenon is searching or printing the proof, so the search, the
// checker and the printer each check the limits at every step.
export interface Limits {
  deadline: number;
  signal: AbortSignal | undefined;
}

// Why the limits stop Zenon now, if they do.
export const getLimitFailure = (limits: Limits) =>
  Date.now() > limits.deadline
    ? "time limit"
    : limits.signal?.aborted === true
      ? "aborted"
      : undefined;

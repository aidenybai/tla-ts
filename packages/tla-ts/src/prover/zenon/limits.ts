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

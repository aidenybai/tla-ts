export type Verdict = "unsat" | "sat" | "unknown";

export interface Decision {
  verdict: Verdict;
  timeUsedMs: number;
}

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

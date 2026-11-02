// A backend's answer to an obligation. tlapm frames an obligation as unsatisfiable when the backend
// proves it.
export type Verdict = "unsat" | "sat" | "unknown";

export interface Decision {
  verdict: Verdict;
  timeUsedMs: number;
}

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

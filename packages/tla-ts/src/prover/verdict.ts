// A backend's answer to an obligation. tlapm frames an obligation as unsatisfiable when the backend
// proves it.
export type Verdict = "unsat" | "sat" | "unknown";

// What tlapm reads of a backend's output beyond its verdict: Zenon's proof, or the SMT solver's
// answer.
export interface Decision {
  verdict: Verdict;
  output?: string;
  timeUsedMs: number;
}

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

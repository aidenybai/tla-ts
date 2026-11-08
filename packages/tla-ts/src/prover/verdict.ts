// A backend's answer to an obligation. tlapm frames an obligation as unsatisfiable when the backend
// proves it.
export type Verdict = "unsat" | "sat" | "unknown";

// What tlapm reads of a backend's output beyond its verdict: Zenon's proof, or the SMT solver's
// answer. The backend's error output passes through to tlapm's.
export interface Decision {
  verdict: Verdict;
  output?: string;
  errorOutput?: string;
  timeUsedMs: number;
}

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

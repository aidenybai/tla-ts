// What a backend decides about the text it receives: unsat proves the obligation.
export type Verdict = "unsat" | "sat" | "unknown";

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

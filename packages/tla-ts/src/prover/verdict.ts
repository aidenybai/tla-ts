export type Verdict = "unsat" | "sat" | "unknown";

export const BACKENDS = ["zenon", "isabelle", "smt", "z3", "ls4"] as const;

export type Backend = (typeof BACKENDS)[number];

export const isBackend = (prover: string): prover is Backend =>
  BACKENDS.some((backend) => backend === prover);

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

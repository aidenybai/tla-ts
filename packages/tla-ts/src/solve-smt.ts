export type SmtAnswer = "unsat" | "sat" | "unknown";

export interface SolveOptions {
  timeLimitMs: number;
}

// HACK: stands in for tla-ts's own SMT solver until the smt-solver branch lands, so every
// obligation that reaches it is unknown.
export const solveSmt = (_script: string, _options: SolveOptions): SmtAnswer => "unknown";

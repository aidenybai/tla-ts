// A backend's answer to an obligation. tlapm frames an obligation as unsatisfiable when the backend
// proves it.
export type Verdict = "unsat" | "sat" | "unknown";

export interface DecideOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

// V8's error when a recursion runs out of stack. The backends run as their own processes, which grow
// their stacks or fail the obligation alone, so a backend ported in process answers unknown instead.
export const isStackOverflow = (error: unknown) =>
  error instanceof RangeError && error.message === "Maximum call stack size exceeded";

// A backend's answer to an obligation. tlapm frames an obligation as unsatisfiable when the backend
// proves it.
export type Verdict = "unsat" | "sat" | "unknown";

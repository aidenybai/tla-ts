// Ported from Z3 (src/sat/smt/euf_solver.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import type { EufSolver } from "./euf-solver";
import type { ThSolver } from "./th-solver";

// euf::solver::get_solver: the theory solver of a family, or of quantifiers for family -1. The port
// has none of them yet, so a goal that needs one goes back to the smt kernel.
export const mkThSolver = (_ctx: EufSolver, family: number): ThSolver => {
  throw new SmtUnsupportedError(
    family === -1 ? "sat.euf quantifiers" : `sat.euf theory of family ${family}`,
  );
};

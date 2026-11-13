// Ported from Z3 (src/sat/smt/euf_solver.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { FAMILY_MODEL_VALUE } from "../ast";
import type { EufSolver } from "./euf-solver";
import { QSolver } from "./q-solver";
import type { ThSolver } from "./th-solver";

// euf::solver::get_solver: the theory solver of a family, or of quantifiers for family -1. Model
// values have none. A goal that needs a theory the port lacks goes back to the smt kernel.
export const mkThSolver = (ctx: EufSolver, family: number): ThSolver | null => {
  if (family === -1) return new QSolver(ctx);
  if (family === FAMILY_MODEL_VALUE) return null;
  throw new SmtUnsupportedError(`sat.euf theory of family ${family}`);
};

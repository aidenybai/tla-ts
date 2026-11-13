// Ported from Z3 (src/sat/smt/euf_solver.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import { FAMILY_ARITH, FAMILY_BV, FAMILY_FPA } from "../ast";
import { ArithSolver } from "./arith-solver";
import { BvSolver } from "./bv-solver";
import { FpaSolver } from "./fpa-solver";
import type { EufSolver } from "./euf-solver";
import type { ThSolver } from "./th-solver";

// euf::solver::get_solver: the theory solver of a family, or of quantifiers for family -1. A goal
// that needs a solver the port lacks goes back to the smt kernel.
export const mkThSolver = (ctx: EufSolver, family: number): ThSolver => {
  if (family === FAMILY_ARITH) return new ArithSolver(ctx, family);
  if (family === FAMILY_BV) return new BvSolver(ctx, family);
  if (family === FAMILY_FPA) return new FpaSolver(ctx, family);
  throw new SmtUnsupportedError(
    family === -1 ? "sat.euf quantifiers" : `sat.euf theory of family ${family}`,
  );
};

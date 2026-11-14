// Ported from Z3 (src/sat/smt/euf_solver.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import {
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_DATATYPE,
  FAMILY_FPA,
  FAMILY_MODEL_VALUE,
} from "../ast";
import { ArithSolver } from "./arith-solver";
import { ArraySolver } from "./array-solver";
import { BvSolver } from "./bv-solver";
import { DtSolver } from "./dt-solver";
import { FpaSolver } from "./fpa-solver";
import type { EufSolver } from "./euf-solver";
import { QSolver } from "./q-solver";
import type { ThSolver } from "./th-solver";

// euf::solver::get_solver: the theory solver of a family, or of quantifiers for family -1. Model
// values have none. A goal that needs a theory the port lacks goes back to the smt kernel.
export const mkThSolver = (ctx: EufSolver, family: number): ThSolver | null => {
  if (family === -1) return new QSolver(ctx);
  if (family === FAMILY_MODEL_VALUE) return null;
  if (family === FAMILY_ARITH) return new ArithSolver(ctx, family);
  if (family === FAMILY_ARRAY) return new ArraySolver(ctx, family);
  if (family === FAMILY_BV) return new BvSolver(ctx, family);
  if (family === FAMILY_DATATYPE) return new DtSolver(ctx, family);
  if (family === FAMILY_FPA) return new FpaSolver(ctx, family);
  throw new SmtUnsupportedError(`sat.euf theory of family ${family}`);
};

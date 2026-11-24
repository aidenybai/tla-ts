import { SmtUnsupportedError } from "../../../../errors";
import {
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_DATATYPE,
  FAMILY_FF,
  FAMILY_FPA,
  FAMILY_PB,
  FAMILY_RECFUN,
  FAMILY_SPECIAL_RELATIONS,
} from "../ast";
import { getHammerPeriod } from "../lp/lp-settings";
import { getGlobalSmtParams } from "../smt-kernel";
import { checkSmtNumerals } from "../smt-setup";
import { ArithSolver } from "./arith-solver";
import { ArraySolver } from "./array-solver";
import { BvSolver } from "./bv-solver";
import { DtSolver } from "./dt-solver";
import { FpaSolver } from "./fpa-solver";
import type { EufSolver } from "./euf-solver";
import { QSolver } from "./q-solver";
import { RecfunSolver } from "./recfun-solver";
import type { ThSolver } from "./th-solver";

// euf::solver::get_solver: the theory solver of a family, or of quantifiers for family -1. A goal
// that needs a theory the port lacks goes back to the smt kernel.
export const mkThSolver = (parameters: ReadonlyMap<string, string>) => {
  checkSmtNumerals(parameters);
  if (Number(parameters.get("smt.relevancy") ?? "2") > 2)
    throw new SmtUnsupportedError("an smt.relevancy above 2 under sat.euf");
  const config = getGlobalSmtParams(parameters);
  return (ctx: EufSolver, family: number): ThSolver | null => {
    if (family === -1) return new QSolver(ctx, parameters);
    if (family === FAMILY_ARITH)
      return new ArithSolver(
        ctx,
        family,
        getHammerPeriod(parameters),
        config.isArithPropagatingEqs,
        config.randomSeed,
      );
    if (family === FAMILY_ARRAY) return new ArraySolver(ctx, family);
    if (family === FAMILY_BV) return new BvSolver(ctx, family);
    if (family === FAMILY_DATATYPE) return new DtSolver(ctx, family);
    if (family === FAMILY_FPA) return new FpaSolver(ctx, family);
    if (family === FAMILY_RECFUN) return new RecfunSolver(ctx);
    if (family === FAMILY_PB || family === FAMILY_FF || family === FAMILY_SPECIAL_RELATIONS)
      throw new SmtUnsupportedError(`sat.euf theory of family ${family}`);
    return null;
  };
};

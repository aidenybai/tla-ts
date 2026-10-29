// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT
// license, see z3-license.txt. Decides an SMT-LIB problem the way `z3 -smt2 AUTO_CONFIG=false
// smt.MBQI=true` does for tlapm's UFNIA obligations.
import { SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import type { Verdict } from "../../verdict";
import { AssertedFormulas } from "./asserted-formulas";
import { Context } from "./context";
import { L_FALSE, L_TRUE } from "./lbool";
import { applyUfniaTactic } from "./quant-tactics";
import { ResourceLimit } from "./rlimit";
import { parseSmtlib } from "./smtlib-parser";

export interface DecideSmtOptions {
  timeLimitMs: number;
  signal?: AbortSignal;
}

interface SmtCheck {
  verdict: Verdict;
  numInstances: number;
}

// The verdict, and the number of quantifier instances the search made.
export const checkSmt = (text: string, options: DecideSmtOptions): SmtCheck => {
  const problem = parseSmtlib(
    text,
    new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
  );
  if (!problem.hasCheckSat) return { verdict: "unknown", numInstances: 0 };
  const asserted = new AssertedFormulas(problem.manager);
  for (const assertion of applyUfniaTactic(problem.manager, problem.assertions))
    asserted.assertExpr(assertion);
  const formulas = asserted.reduce();
  const context = new Context(problem.manager, { isMbqi: true, relevancyLevel: 2 });
  for (const formula of formulas) {
    if (context.isInconsistent()) break;
    context.internalizeAssertion(formula, 0);
  }
  const result = context.search();
  return {
    verdict: result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown",
    numInstances: context.qmanager.getNumInstances(),
  };
};

// Throws SmtParseError on malformed input. Input outside the subset the solver supports is unknown,
// and so is a search that runs past the time limit or that the signal aborts.
export const decideSmt = (text: string, options: DecideSmtOptions): Verdict => {
  try {
    return checkSmt(text, options).verdict;
  } catch (error) {
    if (error instanceof SmtUnsupportedError || error instanceof SmtCanceledError) return "unknown";
    throw error;
  }
};

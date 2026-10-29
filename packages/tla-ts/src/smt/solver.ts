// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT
// license, see z3-license.txt. Checks an SMT-LIB problem the way `z3 -smt2 AUTO_CONFIG=false`
// does for tlapm's UFNIA obligations, without model-based quantifier instantiation.
import { SmtParseError, SmtUnsupportedError } from "../errors";
import { preprocess } from "./asserted-formulas";
import { Context, L_FALSE, L_TRUE } from "./context";
import { DefaultQuantifierManager } from "./quantifier-manager";
import { parseSmtlib } from "./smtlib-parser";
import { TheoryLra } from "./theory-lra";

export type SmtVerdict = "unsat" | "sat" | "unknown";

export interface SolveSmtOptions {
  timeLimitMs: number;
}

const check = (text: string, deadline: number): SmtVerdict => {
  const problem = parseSmtlib(text);
  if (!problem.hasCheckSat) return "unknown";
  const formulas = preprocess(problem.manager, problem.assertions);
  const context = new Context(problem.manager, deadline);
  context.theory = new TheoryLra(context);
  context.qmanager = new DefaultQuantifierManager(context);
  for (const formula of formulas) {
    if (context.isInconsistent()) break;
    context.internalizeAssertion(formula, 0);
  }
  const result = context.search();
  return result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown";
};

// "sat" is only reported for problems without quantifiers whose model the theories fully decide.
export const solveSmt = (text: string, options: SolveSmtOptions): SmtVerdict => {
  try {
    return check(text, Date.now() + options.timeLimitMs);
  } catch (error) {
    if (error instanceof SmtUnsupportedError || error instanceof SmtParseError) return "unknown";
    throw error;
  }
};

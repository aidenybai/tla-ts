// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT
// license, see z3-license.txt. Decides an SMT-LIB problem the way `z3 -smt2 AUTO_CONFIG=false
// smt.MBQI=true` does for tlapm's UFNIA obligations.
import { SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import { isStackOverflow, type DecideOptions, type Verdict } from "../../verdict";
import { AssertedFormulas } from "./asserted-formulas";
import { AstManager } from "./ast";
import { Context } from "./context";
import { L_FALSE, L_TRUE } from "./lbool";
import { applyUfniaTactic } from "./quant-tactics";
import { ResourceLimit } from "./rlimit";
import { parseSmtlib } from "./smtlib-parser";

interface SmtCheck {
  verdict: Verdict;
  numInstances: number;
}

// The verdict, and the number of quantifier instances the search made.
export const checkSmt = (text: string, options: DecideOptions): SmtCheck => {
  const manager = new AstManager(
    new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
  );
  // combined_solver gives each assertion to the incremental smt kernel as well, which rewrites it
  // when it is asserted and keeps it, though check-sat then runs the tactic on the assertions.
  const incremental = new AssertedFormulas(manager);
  const problem = parseSmtlib(text, manager, (assertion) => incremental.assertExpr(assertion));
  if (!problem.hasCheckSat) return { verdict: "unknown", numInstances: 0 };
  const goal = applyUfniaTactic(manager, problem.assertions);
  // smt_tactic makes the context, which makes its asserted formulas first, and asserts the goal.
  // setup_context then makes the theories, before the formulas are reduced.
  const asserted = new AssertedFormulas(manager);
  const context = new Context(manager, { isMbqi: true, relevancyLevel: 2 });
  for (const assertion of goal) asserted.assertExpr(assertion);
  context.setupContext();
  const formulas = asserted.reduce();
  for (const formula of formulas) {
    if (context.isInconsistent()) break;
    context.internalizeAssertion(formula, 0);
  }
  const result = context.search();
  manager.limit.release();
  return {
    verdict: result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown",
    numInstances: context.qmanager.getNumInstances(),
  };
};

// Throws SmtParseError on malformed input. Input outside the subset the solver supports is unknown,
// and so is a search that runs past the time limit, that the signal aborts, or that exhausts the
// heap or the stack.
export const decideSmt = (text: string, options: DecideOptions): Verdict => {
  try {
    return checkSmt(text, options).verdict;
  } catch (error) {
    if (
      error instanceof SmtUnsupportedError ||
      error instanceof SmtCanceledError ||
      isStackOverflow(error)
    )
      return "unknown";
    throw error;
  }
};

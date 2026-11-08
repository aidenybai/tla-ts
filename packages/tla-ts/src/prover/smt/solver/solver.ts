// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT
// license, see z3-license.txt. It decides like `z3 -smt2 AUTO_CONFIG=false smt.MBQI=true`.
import { isStackOverflow, SmtCanceledError, SmtUnsupportedError } from "../../../errors";
import type { DecideOptions, Verdict } from "../../verdict";
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

export const solveAssertions = (manager: AstManager, assertions: number[], isMbqi = true) => {
  const goal = applyUfniaTactic(manager, assertions);
  if (goal.isInconsistent || goal.forms.size === 0) {
    manager.limit.release();
    return { result: goal.isInconsistent ? L_FALSE : L_TRUE, context: undefined };
  }
  // smt_tactic makes the context, which makes its asserted formulas first, and asserts the goal.
  // setup_context then makes the theories, before the formulas are reduced.
  const asserted = new AssertedFormulas(manager);
  const context = new Context(manager, { isMbqi, relevancyLevel: 2 });
  for (const assertion of goal.forms.items) asserted.assertExpr(assertion);
  context.setupContext();
  context.internalizeAssertions(asserted);
  const result = context.search();
  manager.limit.release();
  return { result, context };
};

export const getVerdict = (result: number): Verdict =>
  result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown";

export const checkSmt = (text: string, options: DecideOptions): SmtCheck => {
  const manager = new AstManager(
    new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
  );
  // combined_solver gives each assertion to the incremental smt kernel as well, which rewrites it
  // when it is asserted and keeps it, though check-sat then runs the tactic on the assertions. The
  // kernel's model finder counts a step of the resource limit when it is made, and
  // solver::assert_expr counts one for each assertion.
  const incremental = new AssertedFormulas(manager);
  manager.limit.inc();
  const problem = parseSmtlib(text, manager, (assertion) => {
    manager.limit.inc();
    incremental.assertExpr(assertion);
  });
  if (!problem.hasCheckSat) return { verdict: "unknown", numInstances: 0 };
  // cmd_context::check_sat bounds the steps of the search by the rlimit from the count so far.
  manager.limit.push(problem.rlimit);
  const solved = solveAssertions(manager, problem.assertions);
  return {
    verdict: getVerdict(solved.result),
    numInstances: solved.context?.qmanager.getNumInstances() ?? 0,
  };
};

// Throws SmtParseError on malformed input. Anything else it cannot decide is unknown.
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

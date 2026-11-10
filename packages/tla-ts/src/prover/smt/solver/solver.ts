// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT license, see z3-license.txt.
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

export const checkSmt = (text: string, options: DecideOptions): SmtCheck => {
  const manager = new AstManager(
    new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
  );
  try {
    const incremental = new AssertedFormulas(manager);
    manager.limit.inc();
    const problem = parseSmtlib(text, manager, (assertion) => {
      manager.limit.inc();
      incremental.assertExpr(assertion);
    });
    if (!problem.hasCheckSat) return { verdict: "unknown", numInstances: 0 };
    const goal = applyUfniaTactic(manager, problem.assertions);
    if (goal.isInconsistent || goal.forms.size === 0) {
      return { verdict: goal.isInconsistent ? "unsat" : "sat", numInstances: 0 };
    }
    const asserted = new AssertedFormulas(manager);
    const context = new Context(manager, { isMbqi: true, relevancyLevel: 2 });
    for (const assertion of goal.forms.items) asserted.assertExpr(assertion);
    context.setupContext();
    context.internalizeAssertions(asserted);
    const result = context.search();
    return {
      verdict: result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown",
      numInstances: context.qmanager.getNumInstances(),
    };
  } finally {
    manager.limit.release();
  }
};

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

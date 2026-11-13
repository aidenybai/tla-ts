// Ported from Z3 (src/smt/smt_solver.cpp, src/smt/smt_kernel.cpp, src/smt/smt_setup.cpp), MIT
// license, see z3-license.txt. It decides like `z3 -smt2 AUTO_CONFIG=false smt.MBQI=true`.
import {
  isStackOverflow,
  SmtCanceledError,
  type SmtParseError,
  SmtUnsupportedError,
} from "../../../errors";
import type { DecideOptions, Verdict } from "../../verdict";
import { AssertedFormulas } from "./asserted-formulas";
import { AstManager } from "./ast";
import { Context, MBQI_MAX_ITERATIONS } from "./context";
import { L_FALSE, L_TRUE } from "./lbool";
import { applyUfniaTactic } from "./quant-tactics";
import { ResourceLimit } from "./rlimit";
import { parseSmtlib } from "./smtlib-parser";
import { isSetupUnknown, type SmtSetup } from "./smt-setup";

export interface KernelParams {
  isMbqi: boolean;
  mbqiMaxIterations: number;
  isFindingMacros: boolean;
  relevancyLevel?: 0 | 2;
  // A kernel without a setup runs as with auto_config false.
  setup?: SmtSetup;
}

const DEFAULT_KERNEL_PARAMS: KernelParams = {
  isMbqi: true,
  mbqiMaxIterations: MBQI_MAX_ITERATIONS,
  isFindingMacros: false,
};

interface SmtCheck {
  verdict: Verdict;
  numInstances: number;
}

// The context makes its asserted formulas first, and asserts the formulas. It makes the theories
// next, before the formulas are reduced.
export const solveGoal = (manager: AstManager, forms: number[], params: KernelParams) => {
  const asserted = new AssertedFormulas(manager, params.isFindingMacros);
  const context = new Context(manager, {
    isMbqi: params.isMbqi,
    mbqiMaxIterations: params.mbqiMaxIterations,
    relevancyLevel: 2,
  });
  for (const form of forms) asserted.assertExpr(form);
  context.setupContext(isSetupUnknown(manager, params.setup, true, asserted.getFormulas()));
  context.internalizeAssertions(asserted);
  const theoryAssumptions: number[] = [];
  context.addTheoryAssumptions(theoryAssumptions);
  const result =
    theoryAssumptions.length === 0 ? context.search() : context.checkResearching(asserted, []);
  manager.limit.release();
  return { result, context };
};

export const solveAssertions = (
  manager: AstManager,
  assertions: number[],
  params = DEFAULT_KERNEL_PARAMS,
) => {
  const goal = applyUfniaTactic(manager, assertions);
  if (goal.isInconsistent || goal.forms.size === 0) {
    manager.limit.release();
    return { result: goal.isInconsistent ? L_FALSE : L_TRUE, context: undefined };
  }
  return solveGoal(manager, goal.forms.items, params);
};

// combined_solver searches with its incremental smt kernel, without the tactic, once the check has
// assumptions.
export const solveAssuming = (
  manager: AstManager,
  assertions: number[],
  assumptions: number[],
  params = DEFAULT_KERNEL_PARAMS,
) => {
  const asserted = new AssertedFormulas(manager, params.isFindingMacros);
  const context = new Context(manager, {
    isMbqi: params.isMbqi,
    mbqiMaxIterations: params.mbqiMaxIterations,
    relevancyLevel: 2,
  });
  for (const assertion of assertions) asserted.assertExpr(assertion);
  context.setupContext(isSetupUnknown(manager, params.setup, false, asserted.getFormulas()));
  context.internalizeAssertions(asserted);
  const result = context.checkResearching(asserted, assumptions);
  manager.limit.release();
  return { result, context };
};

export const getVerdict = (result: number): Verdict =>
  result === L_FALSE ? "unsat" : result === L_TRUE ? "sat" : "unknown";

const rethrow = (error: SmtParseError) => {
  throw error;
};

export const checkSmt = (
  text: string,
  options: DecideOptions,
  report: (error: SmtParseError) => void = rethrow,
): SmtCheck => {
  const manager = new AstManager(
    new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
  );
  // The limit stops watching the collector however the check ends, as an unsupported input or a
  // problem without check-sat ends it early.
  try {
    // combined_solver gives each assertion to the incremental smt kernel as well, which rewrites it
    // when it is asserted and keeps it, though check-sat then runs the tactic on the assertions. The
    // kernel's model finder counts a step of the resource limit when it is made, and
    // solver::assert_expr counts one for each assertion.
    const incremental = new AssertedFormulas(manager);
    manager.limit.inc();
    const problem = parseSmtlib(
      text,
      manager,
      (assertion) => {
        manager.limit.inc();
        incremental.assertExpr(assertion);
      },
      report,
    );
    if (!problem.hasCheckSat) return { verdict: "unknown", numInstances: 0 };
    // cmd_context::check_sat bounds the steps of the search by the rlimit from the count so far.
    manager.limit.push(problem.rlimit);
    const solved = solveAssertions(manager, problem.assertions);
    return {
      verdict: getVerdict(solved.result),
      numInstances: solved.context?.qmanager.getNumInstances() ?? 0,
    };
  } finally {
    manager.limit.release();
  }
};

// report gets each SmtParseError, and Z3 goes on past one only when report returns. Anything else
// it cannot decide is unknown.
export const decideSmt = (
  text: string,
  options: DecideOptions,
  report: (error: SmtParseError) => void = rethrow,
): Verdict => {
  try {
    return checkSmt(text, options, report).verdict;
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

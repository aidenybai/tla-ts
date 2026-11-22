// The solver decides like `z3 -smt2 AUTO_CONFIG=false smt.MBQI=true`.
import {
  isStackOverflow,
  SmtCanceledError,
  SmtDefaultError,
  SmtMemoryOutError,
  type SmtParseError,
  SmtUnsupportedError,
} from "../../../errors";
import type { DecideOptions, Verdict } from "../../verdict";
import { AssertedFormulas } from "./asserted-formulas";
import { AstManager } from "./ast";
import { Context, MBQI_MAX_ITERATIONS } from "./context";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { applyUfniaTactic } from "./quant-tactics";
import { ResourceLimit } from "./rlimit";
import { parseSmtlib } from "./smtlib-parser";
import type { SmtSetup } from "./smt-setup";

export interface KernelParams {
  isMbqi: boolean;
  mbqiMaxIterations: number;
  isFindingMacros: boolean;
  isEmatching?: boolean;
  relevancyLevel?: number;
  caseSplitStrategy?: number;
  isCoreMinimizing?: boolean;
  randomSeed?: number;
  intHammerPeriod?: number;
  isArithPropagatingEqs?: boolean;
  qiCost?: string;
  qiEagerThreshold?: number;
  qiLazyThreshold?: number;
  isProofsEnabled?: boolean;
  // A kernel without a setup runs as with auto_config false.
  setup?: SmtSetup;
}

const DEFAULT_KERNEL_PARAMS: KernelParams = {
  isMbqi: true,
  mbqiMaxIterations: MBQI_MAX_ITERATIONS,
  isFindingMacros: false,
};

const assertForms = (context: Context, asserted: AssertedFormulas, forms: number[]) => {
  for (const form of forms) if (!context.checkCanceled()) asserted.assertExpr(form);
  return !context.checkCanceled();
};

interface SmtCheck {
  verdict: Verdict;
  numInstances: number;
}

// The context makes its asserted formulas first, and asserts the formulas. It makes the theories
// next, before the formulas are reduced.
export const solveGoal = (manager: AstManager, forms: number[], params: KernelParams) => {
  const asserted = new AssertedFormulas(
    manager,
    params.isFindingMacros,
    params.isEmatching,
    params.isProofsEnabled,
  );
  const context = new Context(manager, {
    isMbqi: params.isMbqi,
    mbqiMaxIterations: params.mbqiMaxIterations,
    isEmatching: params.isEmatching,
    relevancyLevel: params.relevancyLevel ?? 2,
    caseSplitStrategy: params.caseSplitStrategy,
    randomSeed: params.randomSeed,
    intHammerPeriod: params.intHammerPeriod,
    isArithPropagatingEqs: params.isArithPropagatingEqs,
    qiCost: params.qiCost,
    qiEagerThreshold: params.qiEagerThreshold,
    qiLazyThreshold: params.qiLazyThreshold,
    isProofsEnabled: params.isProofsEnabled,
  });
  try {
    if (!assertForms(context, asserted, forms)) {
      manager.limit.release();
      return { result: L_UNDEF, context, asserted, reasonUnknown: "canceled" };
    }
    context.setupContext(params.setup, true, asserted);
    context.internalizeAssertions(asserted);
    const theoryAssumptions: number[] = [];
    context.addTheoryAssumptions(theoryAssumptions);
    const result =
      theoryAssumptions.length === 0 ? context.check() : context.checkResearching(asserted, []);
    manager.limit.release();
    return { result, context, asserted };
  } catch (error) {
    context.release(asserted);
    throw error;
  }
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
  const asserted = new AssertedFormulas(
    manager,
    params.isFindingMacros,
    params.isEmatching,
    params.isProofsEnabled,
  );
  const context = new Context(manager, {
    isMbqi: params.isMbqi,
    mbqiMaxIterations: params.mbqiMaxIterations,
    isEmatching: params.isEmatching,
    relevancyLevel: params.relevancyLevel ?? 2,
    caseSplitStrategy: params.caseSplitStrategy,
    randomSeed: params.randomSeed,
    intHammerPeriod: params.intHammerPeriod,
    isArithPropagatingEqs: params.isArithPropagatingEqs,
    qiCost: params.qiCost,
    qiEagerThreshold: params.qiEagerThreshold,
    qiLazyThreshold: params.qiLazyThreshold,
    isProofsEnabled: params.isProofsEnabled,
  });
  try {
    if (!assertForms(context, asserted, assertions)) {
      manager.limit.release();
      return { result: L_UNDEF, context, asserted, reasonUnknown: "canceled" };
    }
    context.setupContext(params.setup, false, asserted);
    const result = context.checkResearching(asserted, assumptions);
    manager.limit.release();
    return { result, context, asserted };
  } catch (error) {
    context.release(asserted);
    throw error;
  }
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
  try {
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
      error instanceof SmtMemoryOutError ||
      error instanceof SmtDefaultError ||
      isStackOverflow(error)
    )
      return "unknown";
    throw error;
  }
};

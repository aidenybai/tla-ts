import {
  SmtCanceledError,
  SmtParseError,
  SmtDefaultError,
  SmtTacticError,
  SmtUnsupportedError,
} from "../../../errors";
import { type AstManager, OP_DIV0, OP_IDIV0, OP_MOD0, OP_OR, OP_POWER0, SORT_BOOL } from "./ast";
import { createQfufbvAckrTactic, runAckermannizeBv } from "./ackermannize-bv-tactic";
import { createAigTactic } from "./aig-tactic";
import { blastTermIte } from "./blast-term-ite";
import { card2bv } from "./card2bv";
import { type Context, MBQI_MAX_ITERATIONS } from "./context";
import { ctxSimplify } from "./ctx-simplify";
import { createCtxSolverSimplify } from "./ctx-solver-simplify";
import {
  type Definition,
  type Dependency,
  decConverterRefs,
  Goal,
  getDependencyValues,
  joinDependencies,
  mkDependencyLeaf,
} from "./goal";
import type { AckrSolver } from "./lackr";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { DerRewriter } from "./der";
import { finishSimplifier, runSimplifier } from "./dependent-expr-state";
import { fixDlVar } from "./fix-dl-var";
import { runFpa2Bv } from "./fpa2bv-tactic";
import { type BitBlasterRewriter, runBitBlast } from "./bit-blast-tactic";
import { runMaxBvSharing } from "./max-bv-sharing-tactic";
import { runBvBoundChk } from "./bv-bound-chk";
import { runBvDivremBounds } from "./bv-divrem-bounds";
import { runBv1Blast } from "./bv1-blast";
import { runReduceBvSize } from "./reduce-bv-size";
import { createSatTactic } from "./sat/sat-tactic";
import { mkThSolver } from "./euf/th-solvers";
import { getHammerPeriod } from "./lp/lp-settings";
import { createFdTactic } from "./fd-solver";
import { elimUncnstr } from "./elim-uncnstr";
import { runElimTermIte } from "./elim-term-ite-tactic";
import { rewriteUfbv } from "./demodulator";
import { distributeForall } from "./distribute-forall";
import { createDt2BvTactic } from "./dt2bv-tactic";
import { createEq2BvTactic } from "./eq2bv-tactic";
import { runElimSmallBv } from "./elim-small-bv-tactic";
import { domSimplify } from "./dom-simplify";
import { factor } from "./factor";
import { findGoalMacros } from "./macro-finder";
import { findQuasiMacros } from "./quasi-macros";
import { reduceArgs } from "./reduce-args";
import { DefinedNames, NNF_FULL, NNF_QUANT, NNF_SKOLEM, Nnf } from "./nnf";
import { normalizeBounds } from "./normalize-bounds";
import { propagateIneqs } from "./bound-simplifier";
import { diffNeq } from "./diff-neq";
import { lia2pb } from "./lia2pb";
import { runPb2Bv } from "./pb2bv-tactic";
import { fm } from "./fm-tactic";
import { addBounds } from "./add-bounds-tactic";
import { cofactorTermIte } from "./cofactor-elim-term-ite";
import { nla2bv } from "./nla2bv-tactic";
import { Rational } from "./rational";
import { runNlsat } from "./nlsat-tactic";
import { runNlqsat } from "./nlqsat";
import { occf } from "./occf";
import { propagateValues } from "./propagate-values";
import { purifyArith } from "./purify-arith";
import { ModelEvaluator } from "./model-evaluator";
import { FuncInterp, ProtoModel } from "./proto-model";
import { SmtKernel } from "./smt-kernel";
import { isMbqiByFeatures, type SmtSetup } from "./smt-setup";
import { compileProbe, formatProbeValue, isQfufbv, type Probe } from "./probes";
import { runHorn } from "./muz/horn-tactic";
import { runQe } from "./qe";
import { applyQeLite } from "./qe-lite";
import { QSAT_QE, QSAT_QE_REC, QSAT_SAT, runQsat } from "./qsat";
import { simplifyGoal } from "./quant-tactics";
import { SolveEqs } from "./solve-eqs";
import { RefVector } from "./ref-vector";
import { type RewriterOptions, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { createLia2Card } from "./lia2card";
import { LOGIC_TACTICS, QFAUFBV, QFUFBV_ACKR_PREAMBLE } from "./logic-tactics";
import {
  createCommandReader,
  isSymbol,
  isUnsigned,
  type SExpr,
  type SmtList,
  type SmtToken,
} from "./smtlib-parser";
import { solveParallel } from "./parallel-tactic";
import { solveAssuming, solveGoal } from "./solver";
import { tseitinCnf } from "./tseitin-cnf";

const PARAM_BOOL = 0;
const PARAM_UINT = 1;
const PARAM_SYMBOL = 2;
const PARAM_NUMERAL = 3;

export type TacticParam = boolean | number | string;
export type TacticParams = ReadonlyMap<string, TacticParam>;

interface ParamDescr {
  kind: number;
  module: string;
  defaultValue: TacticParam;
  isPorted: boolean;
}

interface ParamDescrs {
  get(name: string): ParamDescr | undefined;
}

export interface Tactic {
  (goal: Goal): Goal[];
}

export interface TacticEnvironment {
  manager: AstManager;
  isMbqi: boolean;
  mbqiMaxIterations: number;
  isFindingMacros: boolean;
  setup: SmtSetup;
  write: (text: string, isDiagnostic: boolean) => void;
  parameters: ReadonlyMap<string, string>;
  hasDefinitions: () => boolean;
  destructors: (() => void)[];
  cleanups: (() => void)[];
}

// Z3's and-then frees its last tactic first.
export const destroyTactics = (destructors: (() => void)[]) => {
  for (let index = destructors.length - 1; index >= 0; index--) destructors[index]();
  destructors.length = 0;
};

// A tactic that tracks dependencies keeps the dependency of every formula it changes, so the goal
// gets the assertion names only for those.
interface TacticBuilder {
  descrs: ParamDescrs;
  isRejectingUnknown: boolean;
  isTrackingDependencies: boolean;
  build: (params: TacticParams) => Tactic;
}

interface NamedTactic {
  descrs: ParamDescrs;
  isRejectingUnknown?: boolean;
  isTrackingDependencies?: boolean;
  build: (environment: TacticEnvironment, params: TacticParams) => Tactic;
}

const getDescrs = (module: string, entries: [string, number, TacticParam, boolean?][]) =>
  new Map(
    entries.map((entry) => [
      entry[0],
      { kind: entry[1], module, defaultValue: entry[2], isPorted: entry[3] ?? false },
    ]),
  );

const UINT_MAX = 4294967295;

const REWRITER_DESCRS = getDescrs("rewriter", [
  ["ite_extra_rules", PARAM_BOOL, true],
  ["flat", PARAM_BOOL, true, true],
  ["flat_and_or", PARAM_BOOL, true, true],
  ["sort_disjunctions", PARAM_BOOL, true],
  ["elim_and", PARAM_BOOL, false, true],
  ["elim_ite", PARAM_BOOL, true],
  ["local_ctx", PARAM_BOOL, false, true],
  ["local_ctx_limit", PARAM_UINT, UINT_MAX, true],
  ["blast_distinct", PARAM_BOOL, false, true],
  ["blast_distinct_threshold", PARAM_UINT, UINT_MAX, true],
  ["som", PARAM_BOOL, false, true],
  ["som_blowup", PARAM_UINT, 10],
  ["hoist_mul", PARAM_BOOL, false, true],
  ["hoist_ite", PARAM_BOOL, false, true],
  ["algebraic_number_evaluator", PARAM_BOOL, true, true],
  ["mul_to_power", PARAM_BOOL, false],
  ["expand_power", PARAM_BOOL, false, true],
  ["expand_tan", PARAM_BOOL, false, true],
  ["max_degree", PARAM_UINT, 64, true],
  ["sort_sums", PARAM_BOOL, false, true],
  ["gcd_rounding", PARAM_BOOL, false, true],
  ["arith_lhs", PARAM_BOOL, false, true],
  ["arith_ineq_lhs", PARAM_BOOL, false, true],
  ["elim_to_real", PARAM_BOOL, false],
  ["push_to_real", PARAM_BOOL, true],
  ["eq2ineq", PARAM_BOOL, false],
  ["elim_rem", PARAM_BOOL, false],
  ["split_concat_eq", PARAM_BOOL, false, true],
  ["bit2bool", PARAM_BOOL, true],
  ["blast_eq_value", PARAM_BOOL, false],
  ["elim_sign_ext", PARAM_BOOL, true],
  ["hi_div0", PARAM_BOOL, true, true],
  ["mul2concat", PARAM_BOOL, false, true],
  ["bv_sort_ac", PARAM_BOOL, true],
  ["bv_extract_prop", PARAM_BOOL, false],
  ["bv_not_simpl", PARAM_BOOL, false],
  ["bv_ite2id", PARAM_BOOL, false],
  ["bv_le_extra", PARAM_BOOL, false],
  ["bv_le2extract", PARAM_BOOL, true],
  ["expand_select_store", PARAM_BOOL, false],
  ["blast_select_store", PARAM_BOOL, false],
  ["expand_nested_stores", PARAM_BOOL, false],
  ["expand_select_ite", PARAM_BOOL, false],
  ["expand_store_eq", PARAM_BOOL, false],
  ["sort_store", PARAM_BOOL, false, true],
  ["max_memory", PARAM_UINT, UINT_MAX, true],
  ["max_steps", PARAM_UINT, UINT_MAX],
  ["push_ite_arith", PARAM_BOOL, false],
  ["push_ite_bv", PARAM_BOOL, false, true],
  ["pull_cheap_ite", PARAM_BOOL, false, true],
  ["bv_ineq_consistency_test_max", PARAM_UINT, 0, true],
  ["unfold_recursive_functions", PARAM_BOOL, false],
  ["cache_all", PARAM_BOOL, false],
  ["enable_der", PARAM_BOOL, true],
  ["rewrite_patterns", PARAM_BOOL, false],
  ["ignore_patterns_on_ground_qbody", PARAM_BOOL, true],
]);

const BOOL_REWRITER_PARAMS = [
  "ite_extra_rules",
  "flat_and_or",
  "sort_disjunctions",
  "elim_ite",
  "local_ctx",
  "local_ctx_limit",
  "blast_distinct",
  "blast_distinct_threshold",
];

const getBool = (params: TacticParams, name: string, defaultValue: boolean) => {
  const value = params.get(name);
  return typeof value === "boolean" ? value : defaultValue;
};

const getUint = (params: TacticParams, name: string, defaultValue: number) => {
  const value = params.get(name);
  return typeof value === "number" ? value : defaultValue;
};

const getNumeral = (params: TacticParams, name: string, defaultValue: string) => {
  const value = params.get(name);
  return Rational.fromDecimal(typeof value === "string" ? value : defaultValue);
};

export const getRewriterOptions = (manager: AstManager, params: TacticParams): RewriterOptions => ({
  ...TACTIC_REWRITER_OPTIONS,
  isEliminatingAnd: getBool(params, "elim_and", false),
  isFlatAndOr: getBool(params, "flat_and_or", true),
  isSortingStore: getBool(params, "sort_store", false),
  isPullingCheapIte: getBool(params, "pull_cheap_ite", false),
  isPushingIteBv: getBool(params, "push_ite_bv", false),
  isBlastingDistinct: getBool(params, "blast_distinct", false),
  blastDistinctThreshold: getUint(params, "blast_distinct_threshold", UINT_MAX),
  localCtxLimit: getBool(params, "local_ctx", false)
    ? getUint(params, "local_ctx_limit", UINT_MAX)
    : undefined,
  arith: {
    isSom: getBool(params, "flat", true) && getBool(params, "som", false),
    isSortSums: getBool(params, "sort_sums", false),
    isArithLhs: getBool(params, "arith_lhs", false),
    isArithIneqLhs: getBool(params, "arith_ineq_lhs", false),
    isGcdRounding: getBool(params, "gcd_rounding", false),
    isAnumSimp: getBool(params, "algebraic_number_evaluator", true),
    isExpandPower: getBool(params, "expand_power", false),
    isExpandTan: getBool(params, "expand_tan", false),
    isHoistIte: getBool(params, "hoist_ite", false),
    isHoistMul:
      !(getBool(params, "flat", true) && getBool(params, "som", false)) &&
      getBool(params, "hoist_mul", false),
    isFlat: getBool(params, "flat", true),
    isElimRem: getBool(params, "elim_rem", false),
    maxDegree: getUint(params, "max_degree", 64),
  },
  bv: {
    isHiDiv0: getBool(params, "hi_div0", manager.isHiDiv0),
    isMul2concat: getBool(params, "mul2concat", false),
    isSplitConcatEq: getBool(params, "split_concat_eq", false),
  },
});

// arith.nl.rounds only bounds arith.solver 2, which the port does not use.
const SMT_DESCRS = getDescrs("smt", [
  ["mbqi", PARAM_BOOL, true, true],
  ["mbqi.max_iterations", PARAM_UINT, MBQI_MAX_ITERATIONS, true],
  ["arith.nl.rounds", PARAM_UINT, 1024, true],
  ["arith.branch_cut_ratio", PARAM_UINT, 2, true],
  ["random_seed", PARAM_UINT, 0, true],
  ["auto_config", PARAM_BOOL, true, true],
]);

// The dependencies are assertion names, which are Boolean constants, so each one is its own
// assumption.
const getKernelParams = (environment: TacticEnvironment, params: TacticParams, goal: Goal) => {
  const manager = environment.manager;
  const hasQuantifiers = goal.forms.items.some((form) => manager.hasQuantifierFlags[form]);
  // smt_params ands the auto_config of the tactic with the global one, which smt does not scope.
  const setup = {
    ...environment.setup,
    isAutoConfig:
      getBool(
        params,
        "auto_config",
        getParameter(environment, "smt.auto_config", "true") !== "false",
      ) && getParameter(environment, "auto_config", "true") !== "false",
  };
  return {
    isMbqi: getBool(params, "mbqi", environment.isMbqi) || isMbqiByFeatures(setup, hasQuantifiers),
    mbqiMaxIterations: getUint(params, "mbqi.max_iterations", environment.mbqiMaxIterations),
    isFindingMacros: environment.isFindingMacros,
    setup,
    randomSeed: getUint(
      params,
      "random_seed",
      Number(getParameter(environment, "smt.random_seed", "0")),
    ),
    intHammerPeriod: getHammerPeriod(environment.parameters),
  };
};

// extract_clauses_and_dependencies: each form's clause gets the negations of its dependencies.
const extractClauses = (manager: AstManager, goal: Goal) => {
  const assumptions: number[] = [];
  const clauses = new RefVector(manager);
  for (const [index, form] of goal.forms.items.entries()) {
    const values = getDependencyValues(goal.getDependency(index));
    for (const value of values) if (!assumptions.includes(value)) assumptions.push(value);
    clauses.pushOwned(
      manager.withTemporaries(() =>
        manager.mkOr([form, ...values.map((value) => manager.mkNot(value))]),
      ),
    );
  }
  return { clauses, assumptions };
};

const mkCoreDependency = (core: number[]) =>
  core.reduce<Dependency | undefined>(
    (dependency, value) => joinDependencies(dependency, mkDependencyLeaf(value)),
    undefined,
  );

export const getSatParams = (parameters: ReadonlyMap<string, string>) =>
  new Map(
    [...parameters]
      .filter((entry) => entry[0].startsWith("sat."))
      .map((entry) => {
        const value = entry[1];
        const number = Number(value);
        return [
          entry[0].slice(4),
          value === "true"
            ? true
            : value === "false"
              ? false
              : Number.isNaN(number)
                ? value
                : number,
        ];
      }),
  );

export const getSmtTacticFailure = (context: Context) =>
  context.checkCanceled()
    ? "canceled"
    : `smt tactic failed to show goal to be sat/unsat ${context.getLastFailureMessage()}`;

// sat_params reads what using-params leaves unset from the sat module's global parameters.
const getSatTacticParams = (environment: TacticEnvironment, params: TacticParams) =>
  new Map([...getSatParams(environment.parameters), ...params]);

const runSmt = (environment: TacticEnvironment, params: TacticParams) => (goal: Goal) => {
  const manager = environment.manager;
  // mk_smt_tactic: with sat.euf, the smt tactic is the sat tactic.
  if (environment.parameters.get("sat.euf") === "true")
    return createSatTactic(
      manager,
      getSatParams(environment.parameters),
      mkThSolver(environment.parameters),
    )(goal);
  const kernelParams = getKernelParams(environment, params, goal);
  const extracted = extractClauses(manager, goal);
  const solved =
    extracted.assumptions.length === 0
      ? solveGoal(manager, goal.forms.items, kernelParams)
      : solveAssuming(manager, extracted.clauses.items, extracted.assumptions, kernelParams);
  const context = solved.context;
  const release = () => {
    extracted.clauses.reset();
    context.release(solved.asserted);
  };
  if (solved.result === L_UNDEF) {
    const reasonUnknown = solved.reasonUnknown ?? getSmtTacticFailure(context);
    release();
    throw new SmtTacticError(reasonUnknown);
  }
  goal.reset();
  if (solved.result === L_FALSE) {
    goal.assert(environment.manager.falseExpr, mkCoreDependency(context.unsatCore));
    release();
    return [goal];
  }
  const model = goal.isModelsEnabled ? context.getModel() : undefined;
  if (model !== undefined) {
    model.incRef();
    goal.addModelConversion(
      () => model.copy(),
      () => model.decRef(),
    );
  }
  const isCanceled = context.checkCanceled();
  release();
  if (isCanceled) throw new SmtTacticError("canceled");
  return [goal];
};

const getParameter = (environment: TacticEnvironment, name: string, defaultValue: string) =>
  environment.parameters.get(name) ?? defaultValue;

const runParallelSmt = (environment: TacticEnvironment) => (goal: Goal) => {
  if (goal.isProofsEnabled)
    throw new SmtTacticError("parallel_tactic does not support proof production");
  const manager = environment.manager;
  const extracted = extractClauses(manager, goal);
  const solved = solveParallel(
    manager,
    getKernelParams(environment, new Map(), goal),
    {
      threadsMax: Number(getParameter(environment, "parallel.threads.max", "10000")),
      numBbThreads: Number(getParameter(environment, "parallel.num_bb_threads", "2")),
      isAblatingBacktracking:
        getParameter(environment, "parallel.ablate_backtracking", "false") === "true",
    },
    extracted.clauses.items,
    extracted.assumptions,
  );
  extracted.clauses.reset();
  if (solved.status === L_TRUE) {
    goal.reset();
    goal.model = solved.model;
  }
  if (solved.status === L_FALSE)
    goal.assert(
      manager.falseExpr,
      mkCoreDependency(solved.core.filter((literal) => extracted.assumptions.includes(literal))),
    );
  if (solved.status === L_UNDEF && !manager.limit.inc()) throw new SmtCanceledError();
  return [goal];
};

const createTacticSolver = (environment: TacticEnvironment, strategy: string): AckrSolver => {
  const manager = environment.manager;
  const destructors: (() => void)[] = [];
  const cleanups: (() => void)[] = [];
  const tactic = compileInternalTactic({ ...environment, destructors, cleanups }, strategy);
  const assertions = new RefVector(manager);
  let model: ProtoModel | undefined;
  let converters: Goal["converters"] = [];
  return {
    assert: (expr) => assertions.push(expr),
    check: () => {
      for (const cleanup of cleanups) cleanup();
      model?.decRef();
      model = undefined;
      const goal = new Goal(manager);
      for (const assertion of assertions.items) goal.assert(assertion);
      const checked = checkSatUsing(tactic, goal);
      // tactic2solver keeps the goal's model converter until its next check.
      decConverterRefs(manager, converters);
      converters = goal.converters;
      goal.converters = [];
      goal.reset();
      model = checked.model;
      model?.incRef();
      return checked.status;
    },
    getModel: () => model as ProtoModel,
    release: () => {
      decConverterRefs(manager, converters);
      destroyTactics(destructors);
      model?.decRef();
      assertions.reset();
    },
  };
};

// Each clause gets a fresh context, where Z3 pushes a scope on one context.
const runUnitSubsume = (environment: TacticEnvironment) => (goal: Goal) => {
  const manager = environment.manager;
  const kernel = new SmtKernel(manager, {
    isMbqi: environment.isMbqi,
    mbqiMaxIterations: environment.mbqiMaxIterations,
    isFindingMacros: false,
  });
  const trail = new RefVector(manager);
  const clauses = goal.forms.items.map(() => manager.mkFreshConst("#clause", SORT_BOOL));
  for (const clause of clauses) trail.push(clause);
  kernel.push();
  for (const [index, form] of goal.forms.items.entries()) {
    const definition = manager.mkEq(clauses[index], form);
    trail.push(definition);
    kernel.assertExpr(definition);
  }
  kernel.push();
  const isDeleted = clauses.map(() => false);
  const deleted: number[] = [];
  for (const [index, clause] of clauses.entries()) {
    kernel.push();
    for (const [other, otherClause] of clauses.entries())
      if (other === index) {
        const negated = manager.mkNot(clause);
        trail.push(negated);
        kernel.assertExpr(negated);
      } else if (!isDeleted[other]) kernel.assertExpr(otherClause);
    kernel.push();
    const isUnsat = kernel.context.isInconsistent();
    kernel.pop(2);
    if (!isUnsat) continue;
    isDeleted[index] = true;
    deleted.push(index);
  }
  for (const index of deleted) goal.update(index, manager.trueExpr);
  goal.elimTrue();
  kernel.pop(2);
  trail.reset();
  return [goal];
};

const inPlace = (run: (goal: Goal) => void) => (goal: Goal) => {
  run(goal);
  return [goal];
};

const selectClause = (goal: Goal, isLargest: boolean) => {
  const manager = goal.manager;
  let position = -1;
  let length = 0;
  for (let index = 0; index < goal.forms.size; index++) {
    const form = goal.forms.items[index];
    if (manager.getOp(form) !== OP_OR) continue;
    const currentLength = manager.getNumArgs(form);
    if (currentLength < 2) continue;
    if (!isLargest) return index;
    if (currentLength > length) {
      position = index;
      length = currentLength;
    }
  }
  return position;
};

const runSplitClause = (isLargest: boolean) => (goal: Goal) => {
  const manager = goal.manager;
  const position = selectClause(goal, isLargest);
  if (position === -1)
    throw new SmtTacticError("split-clause tactic failed, goal does not contain any clause");
  if (goal.isProofsEnabled) throw new SmtUnsupportedError("the proofs of split-clause");
  const dependency = goal.dependencies[position];
  return manager.getArgs(goal.forms.items[position]).map((literal) => {
    const subgoal = goal.copy();
    subgoal.update(position, literal, dependency);
    subgoal.depth++;
    return subgoal;
  });
};

const runDer = (manager: AstManager) => (goal: Goal) => {
  runSimplifier(goal, true, (state) => {
    const rewriter = new DerRewriter(manager);
    return {
      reduce: () => state.rewriteEach((form) => rewriter.rewrite(form)),
      release: () => {
        rewriter.der.release();
        rewriter.release();
      },
    };
  });
  return [goal];
};

const NNF_MODES = new Map([
  ["skolem", NNF_SKOLEM],
  ["quantifiers", NNF_QUANT],
  ["full", NNF_FULL],
]);

const NNF_DESCRS = getDescrs("nnf", [
  ["mode", PARAM_SYMBOL, "skolem", true],
  ["max_memory", PARAM_UINT, UINT_MAX, true],
  ["sk_hack", PARAM_BOOL, false],
  ["ignore_labels", PARAM_BOOL, false, true],
]);

const NLSAT_DESCRS = getDescrs("nlsat", [
  ["seed", PARAM_UINT, 0, true],
  ["factor", PARAM_BOOL, true, true],
  ["shuffle_vars", PARAM_BOOL, false, true],
  ["variable_ordering_strategy", PARAM_UINT, 0, true],
]);

const TSEITIN_DESCRS = getDescrs("", [
  ["max_memory", PARAM_UINT, UINT_MAX, true],
  ["common_patterns", PARAM_BOOL, true],
  ["distributivity", PARAM_BOOL, true],
  ["distributivity_blowup", PARAM_UINT, 32],
  ["ite_chaing", PARAM_BOOL, true],
  ["ite_extra", PARAM_BOOL, true],
]);

const runNnf = (manager: AstManager, params: TacticParams) => (goal: Goal) => {
  const mode = NNF_MODES.get(String(params.get("mode") ?? "skolem"));
  if (mode === undefined) throw new SmtUnsupportedError("an invalid NNF mode");
  const names = new DefinedNames(manager);
  const nnf = new Nnf(manager, names, mode, getBool(params, "ignore_labels", false));
  const definitions = new RefVector(manager);
  const size = goal.forms.size;
  try {
    for (let index = 0; !goal.isInconsistent && index < size; index++) {
      const result = nnf.apply(goal.forms.items[index], definitions);
      goal.update(index, result, goal.getDependency(index));
      manager.decRef(result);
    }
  } catch (error) {
    // Z3's nnf stops at the limit with a default_exception, which or-else lets pass.
    if (!(error instanceof SmtCanceledError)) throw error;
    throw new SmtDefaultError(manager.limit.getCancelMessage());
  }
  for (const definition of definitions.items) {
    if (goal.isInconsistent) break;
    goal.assert(definition);
  }
  goal.depth++;
  if (!goal.isInconsistent)
    for (let index = 0; index < names.numNames; index++)
      goal.addConverter(names.getNameDecl(index));
  definitions.reset();
  nnf.release();
  names.release();
  return [goal];
};

const SAT_DESCRS = getDescrs("sat", [
  ["max_memory", PARAM_UINT, UINT_MAX, true],
  ["ite_extra", PARAM_BOOL, true, true],
  ["learned", PARAM_BOOL, false],
  ["restart", PARAM_SYMBOL, "ema", true],
  ["restart.fast", PARAM_BOOL, true, true],
  ["phase", PARAM_SYMBOL, "caching", true],
  ["rephase.base", PARAM_UINT, 1000, true],
  ["search.sat.conflicts", PARAM_UINT, 400, true],
  ["search.unsat.conflicts", PARAM_UINT, 400, true],
  ["restart.initial", PARAM_UINT, 2, true],
  ["restart.max", PARAM_UINT, UINT_MAX, true],
  ["inprocess.max", PARAM_UINT, UINT_MAX, true],
  ["random_seed", PARAM_UINT, 0, true],
  ["burst_search", PARAM_UINT, 100, true],
  ["enable_pre_simplify", PARAM_BOOL, false, true],
  ["max_conflicts", PARAM_UINT, UINT_MAX, true],
  ["simplify.delay", PARAM_UINT, 0, true],
  ["gc", PARAM_SYMBOL, "glue_psm", true],
  ["gc.initial", PARAM_UINT, 20000, true],
  ["gc.increment", PARAM_UINT, 500, true],
  ["gc.small_lbd", PARAM_UINT, 3, true],
  ["gc.k", PARAM_UINT, 7, true],
  ["gc.burst", PARAM_BOOL, false, true],
  ["gc.defrag", PARAM_BOOL, true, true],
  ["force_cleanup", PARAM_BOOL, false, true],
  ["backtrack.scopes", PARAM_UINT, 100, true],
  ["backtrack.conflicts", PARAM_UINT, 4000, true],
  ["minimize_lemmas", PARAM_BOOL, true, true],
  ["dyn_sub_res", PARAM_BOOL, true, true],
  ["variable_decay", PARAM_UINT, 110, true],
  ["scc", PARAM_BOOL, true, true],
  ["scc.tr", PARAM_BOOL, true, true],
  ["abce", PARAM_BOOL, false, true],
  ["acce", PARAM_BOOL, false, true],
  ["ate", PARAM_BOOL, true, true],
  ["bce", PARAM_BOOL, false, true],
  ["cce", PARAM_BOOL, false, true],
  ["bce_at", PARAM_UINT, 2, true],
  ["bce_delay", PARAM_UINT, 2, true],
  ["blocked_clause_limit", PARAM_UINT, 100000000, true],
  ["elim_vars", PARAM_BOOL, true, true],
  ["subsumption", PARAM_BOOL, true, true],
  ["subsumption.limit", PARAM_UINT, 100000000, true],
  ["override_incremental", PARAM_BOOL, false, true],
  ["resolution.limit", PARAM_UINT, 500000000, true],
  ["resolution.occ_cutoff", PARAM_UINT, 10, true],
  ["resolution.occ_cutoff_range1", PARAM_UINT, 8, true],
  ["resolution.occ_cutoff_range2", PARAM_UINT, 5, true],
  ["resolution.occ_cutoff_range3", PARAM_UINT, 3, true],
  ["resolution.lit_cutoff_range1", PARAM_UINT, 700, true],
  ["resolution.lit_cutoff_range2", PARAM_UINT, 400, true],
  ["resolution.lit_cutoff_range3", PARAM_UINT, 300, true],
  ["resolution.cls_cutoff1", PARAM_UINT, 100000000, true],
  ["resolution.cls_cutoff2", PARAM_UINT, 700000000, true],
  ["asymm_branch", PARAM_BOOL, true, true],
  ["asymm_branch.rounds", PARAM_UINT, 2, true],
  ["asymm_branch.delay", PARAM_UINT, 1, true],
  ["asymm_branch.sampled", PARAM_BOOL, true, true],
  ["asymm_branch.limit", PARAM_UINT, 100000000, true],
  ["asymm_branch.all", PARAM_BOOL, false, true],
  ["probing", PARAM_BOOL, true, true],
  ["probing_limit", PARAM_UINT, 5000000, true],
  ["probing_cache", PARAM_BOOL, true, true],
  ["probing_cache_limit", PARAM_UINT, 1024, true],
  ["probing_binary", PARAM_BOOL, true, true],
  ["local_search", PARAM_BOOL, false],
  ["threads", PARAM_UINT, 1],
  ["euf", PARAM_BOOL, false],
  ["cardinality.solver", PARAM_BOOL, true],
]);

const NAMED_TACTICS = new Map<string, NamedTactic>([
  [
    "simplify",
    {
      descrs: REWRITER_DESCRS,
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          simplifyGoal(environment.manager, goal, getRewriterOptions(environment.manager, params)),
        ),
    },
  ],
  [
    "elim-and",
    {
      descrs: REWRITER_DESCRS,
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          simplifyGoal(environment.manager, goal, {
            ...getRewriterOptions(environment.manager, params),
            isEliminatingAnd: true,
          }),
        ),
    },
  ],
  [
    "propagate-values",
    {
      descrs: new Map([
        ...REWRITER_DESCRS,
        ...getDescrs("", [["max_rounds", PARAM_UINT, 4, true]]),
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          propagateValues(
            environment.manager,
            goal,
            getUint(params, "max_rounds", 4),
            getRewriterOptions(environment.manager, params),
          ),
        ),
    },
  ],
  [
    "ctx-simplify",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX, true],
        ["max_depth", PARAM_UINT, 1024, true],
        ["propagate_eq", PARAM_BOOL, false],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          ctxSimplify(
            environment.manager,
            goal,
            getUint(params, "max_depth", 1024),
            getUint(params, "max_steps", UINT_MAX),
          ),
        ),
    },
  ],
  [
    "ctx-solver-simplify",
    {
      descrs: SMT_DESCRS,
      isRejectingUnknown: false,
      build: (environment, params) =>
        inPlace(
          createCtxSolverSimplify(environment.manager, () => ({
            isMbqi: getBool(params, "mbqi", environment.isMbqi),
            mbqiMaxIterations: getUint(
              params,
              "mbqi.max_iterations",
              environment.mbqiMaxIterations,
            ),
            isFindingMacros: environment.isFindingMacros,
          })),
        ),
    },
  ],
  [
    "unit-subsume-simplify",
    { isTrackingDependencies: true, descrs: new Map(), build: runUnitSubsume },
  ],
  [
    "purify-arith",
    {
      descrs: new Map([
        ...REWRITER_DESCRS,
        ...getDescrs("", [
          ["complete", PARAM_BOOL, true, true],
          ["elim_root_objects", PARAM_BOOL, true, true],
          ["elim_inverses", PARAM_BOOL, true, true],
        ]),
      ]),
      isTrackingDependencies: true,
      build: (environment, params) => {
        const manager = environment.manager;
        const elimRemParams = new Map([...params, ["elim_rem", true]]);
        return [
          runNnf(manager, new Map()),
          inPlace((goal) =>
            simplifyGoal(manager, goal, getRewriterOptions(manager, elimRemParams)),
          ),
          inPlace((goal) =>
            purifyArith(manager, goal, {
              isComplete: getBool(params, "complete", true),
              isElimRootObjects: getBool(params, "elim_root_objects", true),
              isElimInverses: getBool(params, "elim_inverses", true),
            }),
          ),
          inPlace((goal) => simplifyGoal(manager, goal, getRewriterOptions(manager, params))),
        ].reduceRight((second, first) => runAndThen(first, second));
      },
    },
  ],
  [
    "elim-term-ite",
    {
      isTrackingDependencies: true,
      descrs: getDescrs("", [["max_memory", PARAM_UINT, UINT_MAX, true]]),
      build: (environment) => runElimTermIte(environment.manager),
    },
  ],
  [
    "tseitin-cnf-core",
    {
      descrs: TSEITIN_DESCRS,
      isTrackingDependencies: true,
      build: (environment) => inPlace((goal) => tseitinCnf(environment.manager, goal)),
    },
  ],
  [
    "tseitin-cnf",
    {
      descrs: TSEITIN_DESCRS,
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) => {
          const manager = environment.manager;
          const original = new RefVector(manager);
          for (const form of goal.forms.items) original.push(form);
          try {
            tseitinCnf(manager, goal);
          } catch (error) {
            if (!(error instanceof SmtTacticError)) throw error;
            simplifyGoal(manager, goal, {
              ...getRewriterOptions(manager, params),
              isEliminatingAnd: true,
              isBlastingDistinct: true,
            });
            if (!goal.isDecided()) tseitinCnf(manager, goal);
          } finally {
            original.reset();
          }
        }),
    },
  ],
  [
    "qe-light",
    {
      descrs: new Map(),
      build: (environment) =>
        inPlace((goal) =>
          goal.isProofsEnabled ? finishSimplifier(goal) : applyQeLite(environment.manager, goal),
        ),
    },
  ],
  [
    "solve-eqs",
    {
      isTrackingDependencies: true,
      // Z3 never counts the occurrences that solve_eqs_max_occs bounds, so the bound has no effect.
      descrs: getDescrs("", [
        ["solve_eqs_max_occs", PARAM_UINT, UINT_MAX, true],
        ["theory_solver", PARAM_BOOL, true, true],
        ["ite_solver", PARAM_BOOL, true, true],
        ["context_solve", PARAM_BOOL, false, true],
        ["eliminate_mod", PARAM_BOOL, true, true],
      ]),
      build: (environment, params) =>
        inPlace((goal) => {
          checkParams(REWRITER_DESCRS, params);
          const solver = new SolveEqs(environment.manager, goal, {
            isTheorySolver: getBool(params, "theory_solver", true),
            isIteSolver: getBool(params, "ite_solver", true),
            isContextSolve: getBool(params, "context_solve", true),
            isEliminatingMod: getBool(params, "eliminate_mod", true),
            rewriter: getRewriterOptions(environment.manager, params),
          });
          solver.reduce();
          solver.release();
        }),
    },
  ],
  [
    "elim-uncnstr",
    {
      isTrackingDependencies: true,
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX],
      ]),
      build: (environment) => {
        const bodies = new RefVector(environment.manager);
        environment.destructors.push(() => bodies.reset());
        return inPlace((goal) => elimUncnstr(environment.manager, goal, bodies));
      },
    },
  ],
  [
    "lia2card",
    {
      isTrackingDependencies: true,
      descrs: getDescrs("", [["compile_equality", PARAM_BOOL, true, true]]),
      build: (environment, params) => {
        const tactic = createLia2Card(
          environment.manager,
          getUint(params, "lia2card.max_range", 100),
          getUint(params, "lia2card.max_ite_nesting", 4),
          getBool(params, "compile_equality", true),
        );
        environment.destructors.push(tactic.release);
        return inPlace(tactic.run);
      },
    },
  ],
  [
    "card2bv",
    {
      descrs: getDescrs("", [
        ["keep_cardinality_constraints", PARAM_BOOL, false, true],
        ["pb.solver", PARAM_SYMBOL, "solver", true],
        ["cardinality.encoding", PARAM_SYMBOL, "none", true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) => {
          checkParams(REWRITER_DESCRS, params);
          card2bv(environment.manager, goal, getRewriterOptions(environment.manager, params));
        }),
    },
  ],
  [
    "normalize-bounds",
    {
      descrs: getDescrs("", [
        ["produce_models", PARAM_BOOL, false, true],
        ["norm_int_only", PARAM_BOOL, true, true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) => {
          checkParams(REWRITER_DESCRS, params);
          normalizeBounds(
            environment.manager,
            goal,
            getRewriterOptions(environment.manager, params),
            getBool(params, "norm_int_only", true),
          );
        }),
    },
  ],
  [
    "propagate-ineqs",
    {
      isTrackingDependencies: true,
      descrs: getDescrs("", [["bound_max_refinements", PARAM_UINT, 16, true]]),
      build: (environment) => inPlace((goal) => propagateIneqs(environment.manager, goal)),
    },
  ],
  [
    "lia2pb",
    {
      descrs: new Map([
        ...REWRITER_DESCRS,
        ...getDescrs("", [
          ["lia2pb_partial", PARAM_BOOL, false, true],
          ["lia2pb_max_bits", PARAM_UINT, 32, true],
          ["lia2pb_total_bits", PARAM_UINT, 2048, true],
        ]),
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          lia2pb(environment.manager, goal, {
            isPartial: getBool(params, "lia2pb_partial", false),
            maxBits: getUint(params, "lia2pb_max_bits", 32),
            totalBits: getUint(params, "lia2pb_total_bits", 2048),
            rewriter: getRewriterOptions(environment.manager, params),
          }),
        ),
    },
  ],
  [
    "pb2bv",
    {
      descrs: new Map([
        ...[...REWRITER_DESCRS].filter((entry) => BOOL_REWRITER_PARAMS.includes(entry[0])),
        ...getDescrs("", [
          ["max_memory", PARAM_UINT, UINT_MAX, true],
          ["pb2bv_all_clauses_limit", PARAM_UINT, 8, true],
          ["pb2bv_cardinality_limit", PARAM_UINT, UINT_MAX, true],
          ["keep_cardinality_constraints", PARAM_BOOL, false, true],
          ["pb.solver", PARAM_SYMBOL, "solver", true],
          ["cardinality.encoding", PARAM_SYMBOL, "none", true],
        ]),
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        runPb2Bv(environment.manager, params, getRewriterOptions(environment.manager, params)),
    },
  ],
  [
    "diff-neq",
    {
      descrs: getDescrs("", [["diff_neq_max_k", PARAM_UINT, 1024, true]]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          diffNeq(environment.manager, goal, getUint(params, "diff_neq_max_k", 1024)),
        ),
    },
  ],
  [
    "fm",
    {
      isTrackingDependencies: true,
      descrs: new Map([
        ...REWRITER_DESCRS,
        ...getDescrs("", [
          ["produce_models", PARAM_BOOL, false, true],
          ["fm_real_only", PARAM_BOOL, true, true],
          ["fm_occ", PARAM_BOOL, false, true],
          ["fm_limit", PARAM_UINT, 5000000, true],
          ["fm_cutoff1", PARAM_UINT, 8, true],
          ["fm_cutoff2", PARAM_UINT, 256, true],
          ["fm_extra", PARAM_UINT, 0, true],
        ]),
      ]),
      build: (environment, params) =>
        inPlace((goal) => {
          const manager = environment.manager;
          simplifyGoal(
            manager,
            goal,
            getRewriterOptions(
              manager,
              new Map([...params, ["arith_lhs", true], ["elim_and", true], ["som", true]]),
            ),
          );
          // and_then stops at a decided goal.
          if (goal.isDecided()) return;
          fm(manager, goal, {
            isRealOnly: getBool(params, "fm_real_only", true),
            limit: getUint(params, "fm_limit", 5000000),
            cutoff1: getUint(params, "fm_cutoff1", 8),
            cutoff2: getUint(params, "fm_cutoff2", 256),
            extra: getUint(params, "fm_extra", 0),
            isOcc: getBool(params, "fm_occ", false),
          });
        }),
    },
  ],
  [
    "add-bounds",
    {
      descrs: getDescrs("", [
        ["add_bound_lower", PARAM_NUMERAL, "-2", true],
        ["add_bound_upper", PARAM_NUMERAL, "2", true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          addBounds(
            environment.manager,
            goal,
            getNumeral(params, "add_bound_lower", "-2"),
            getNumeral(params, "add_bound_upper", "2"),
          ),
        ),
    },
  ],
  [
    "cofactor-term-ite",
    {
      descrs: getDescrs("", [["cofactor_equalities", PARAM_BOOL, true, true]]),
      build: (environment, params) =>
        inPlace((goal) =>
          cofactorTermIte(
            environment.manager,
            goal,
            getRewriterOptions(environment.manager, params),
            getBool(params, "cofactor_equalities", true),
          ),
        ),
    },
  ],
  [
    "nla2bv",
    {
      descrs: getDescrs("", [
        ["nla2bv_max_bv_size", PARAM_UINT, UINT_MAX, true],
        ["nla2bv_bv_size", PARAM_UINT, 4, true],
        ["nla2bv_root", PARAM_UINT, 2, true],
        ["nla2bv_divisor", PARAM_UINT, 2, true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        inPlace((goal) =>
          nla2bv(environment.manager, goal, {
            maxBvSize: getUint(params, "nla2bv_max_bv_size", UINT_MAX),
            bvSize: getUint(params, "nla2bv_bv_size", 4),
            root: getUint(params, "nla2bv_root", 2),
            divisor: getUint(params, "nla2bv_divisor", 2),
          }),
        ),
    },
  ],
  [
    "fix-dl-var",
    {
      isTrackingDependencies: true,
      descrs: REWRITER_DESCRS,
      build: (environment, params) =>
        inPlace((goal) =>
          fixDlVar(environment.manager, goal, getRewriterOptions(environment.manager, params)),
        ),
    },
  ],
  [
    "factor",
    {
      isTrackingDependencies: true,
      descrs: getDescrs("", [
        ["split_factors", PARAM_BOOL, true, true],
        ["max_search_size", PARAM_UINT, UINT_MAX],
        ["max_prime", PARAM_UINT, UINT_MAX],
        ["num_primes", PARAM_UINT, 4],
      ]),
      build: (environment, params) =>
        inPlace((goal) =>
          factor(environment.manager, goal, getBool(params, "split_factors", true)),
        ),
    },
  ],
  [
    "der",
    {
      isTrackingDependencies: true,
      descrs: new Map(),
      build: (environment) => runDer(environment.manager),
    },
  ],
  [
    "blast-term-ite",
    {
      isTrackingDependencies: true,
      descrs: new Map(),
      build: (environment) => inPlace((goal) => blastTermIte(environment.manager, goal)),
    },
  ],
  [
    "distribute-forall",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => inPlace((goal) => distributeForall(environment.manager, goal)),
    },
  ],
  [
    "quasi-macros",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["produce_models", PARAM_BOOL, false, true],
        ["produce_proofs", PARAM_BOOL, false, true],
      ]),
      build: (environment) =>
        inPlace((goal) => {
          if (!environment.hasDefinitions()) findQuasiMacros(environment.manager, goal);
        }),
    },
  ],
  [
    "ufbv-rewriter",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["produce_models", PARAM_BOOL, false, true],
      ]),
      isTrackingDependencies: true,
      build: (environment) => inPlace((goal) => rewriteUfbv(environment.manager, goal)),
    },
  ],
  [
    "reduce-args",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => inPlace((goal) => reduceArgs(environment.manager, goal)),
    },
  ],
  [
    "macro-finder",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["produce_models", PARAM_BOOL, false, true],
        ["produce_proofs", PARAM_BOOL, false, true],
        ["elim_and", PARAM_BOOL, false, true],
      ]),
      isTrackingDependencies: true,
      build: (environment) =>
        inPlace((goal) => {
          if (!environment.hasDefinitions()) findGoalMacros(environment.manager, goal);
        }),
    },
  ],
  [
    "dom-simplify",
    {
      isTrackingDependencies: true,
      descrs: new Map(),
      build: (environment) => inPlace((goal) => domSimplify(environment.manager, goal)),
    },
  ],
  [
    "split-clause",
    {
      descrs: getDescrs("", [["split_largest_clause", PARAM_BOOL, false, true]]),
      isTrackingDependencies: true,
      build: (_environment, params) =>
        runSplitClause(getBool(params, "split_largest_clause", false)),
    },
  ],
  [
    "occf",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => inPlace((goal) => occf(environment.manager, goal)),
    },
  ],
  [
    "fpa2bv",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => runFpa2Bv(environment.manager),
    },
  ],
  [
    "elim-small-bv",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX, true],
        ["max_bits", PARAM_UINT, 4, true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        runElimSmallBv(
          environment.manager,
          getUint(params, "max_bits", 4),
          getUint(params, "max_steps", UINT_MAX),
        ),
    },
  ],
  [
    "dt2bv",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => {
        const tactic = createDt2BvTactic(environment.manager);
        environment.cleanups.push(tactic.cleanup);
        return tactic.run;
      },
    },
  ],
  [
    "eq2bv",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => createEq2BvTactic(environment.manager),
    },
  ],
  [
    "bit-blast",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX],
        ["blast_mul", PARAM_BOOL, true, true],
        ["blast_add", PARAM_BOOL, true, true],
        ["blast_quant", PARAM_BOOL, false, true],
        ["blast_full", PARAM_BOOL, false, true],
      ]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        runBitBlast(environment.manager, {
          isBlastingMul: getBool(params, "blast_mul", true),
          isBlastingAdd: getBool(params, "blast_add", true),
          isBlastingQuant: getBool(params, "blast_quant", false),
          isBlastingFull: getBool(params, "blast_full", false),
        }),
    },
  ],
  [
    "max-bv-sharing",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => runMaxBvSharing(environment.manager),
    },
  ],
  [
    "bv_bound_chk",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment, params) =>
        runBvBoundChk(environment.manager, getUint(params, "bv_ineq_consistency_test_max", 0)),
    },
  ],
  [
    "bv-divrem-bounds",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => runBvDivremBounds(environment.manager),
    },
  ],
  [
    "reduce-bv-size",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: (environment) => runReduceBvSize(environment.manager),
    },
  ],
  [
    "bv1-blast",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX],
      ]),
      isTrackingDependencies: true,
      build: (environment) => runBv1Blast(environment.manager),
    },
  ],
  [
    "ackermannize_bv",
    {
      descrs: getDescrs("rewriter", [["div0_ackermann_limit", PARAM_UINT, 1000, true]]),
      isTrackingDependencies: true,
      build: (environment, params) =>
        runAckermannizeBv(
          environment.manager,
          getRewriterOptions(environment.manager, new Map()),
          getUint(params, "div0_ackermann_limit", 1000),
        ),
    },
  ],
  [
    "qfufbv_ackr",
    {
      descrs: new Map([...REWRITER_DESCRS, ...SMT_DESCRS]),
      isRejectingUnknown: false,
      build: (environment, params) => {
        const manager = environment.manager;
        const preamble = createCommandReader(QFUFBV_ACKR_PREAMBLE).read() as SmtList;
        return runAndThen(
          compile(environment, preamble, true).build(params),
          runCond(
            isQfufbv,
            createQfufbvAckrTactic(manager, getRewriterOptions(manager, new Map()), true, () =>
              createTacticSolver(environment, QFAUFBV),
            ),
            runSmt(environment, params),
          ),
        );
      },
    },
  ],
  [
    "smt",
    {
      descrs: SMT_DESCRS,
      isRejectingUnknown: false,
      isTrackingDependencies: true,
      build: runSmt,
    },
  ],
  [
    "psmt",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: runParallelSmt,
    },
  ],
  [
    "nlsat",
    {
      descrs: NLSAT_DESCRS,
      isRejectingUnknown: false,
      build: (environment, params) =>
        runNlsat(environment.manager, {
          seed: getUint(params, "seed", 0),
          isFactoring: getBool(params, "factor", true),
          isShufflingVars: getBool(params, "shuffle_vars", false),
          variableOrderingStrategy: getUint(params, "variable_ordering_strategy", 0),
        }),
    },
  ],
  [
    "nlqsat",
    {
      descrs: new Map(),
      build: (environment, params) =>
        runNlqsat(
          environment.manager,
          getUint(params, "seed", 0),
          compileInternalTactic(environment, "tseitin-cnf"),
        ),
    },
  ],
  [
    "horn",
    {
      descrs: new Map(),
      isRejectingUnknown: false,
      build: (environment) =>
        runHorn(
          environment.manager,
          environment.parameters,
          getRewriterOptions(environment.manager, new Map()),
        ),
    },
  ],
  [
    "qe",
    {
      descrs: new Map(),
      isRejectingUnknown: false,
      build: (environment) => runQe(environment.manager),
    },
  ],
  [
    "qsat",
    {
      descrs: new Map(),
      isRejectingUnknown: false,
      build: (environment) => runQsat(environment, QSAT_SAT),
    },
  ],
  [
    "qe2",
    {
      descrs: new Map(),
      isRejectingUnknown: false,
      build: (environment) => runQsat(environment, QSAT_QE),
    },
  ],
  [
    "qe_rec",
    {
      descrs: new Map(),
      isRejectingUnknown: false,
      build: (environment) => runQsat(environment, QSAT_QE_REC),
    },
  ],
  [
    "sat",
    {
      descrs: SAT_DESCRS,
      isRejectingUnknown: false,
      isTrackingDependencies: true,
      build: (environment, params) => (goal) =>
        createSatTactic(environment.manager, getSatTacticParams(environment, params))(goal),
    },
  ],
  [
    "qffd",
    {
      descrs: SAT_DESCRS,
      isRejectingUnknown: false,
      build: (environment, params) => (goal) =>
        createFdTactic(environment.manager, getSatTacticParams(environment, params))(goal),
    },
  ],
  [
    "psat",
    {
      descrs: SAT_DESCRS,
      isRejectingUnknown: false,
      isTrackingDependencies: true,
      build: (environment, params) => (goal) =>
        createSatTactic(environment.manager, getSatTacticParams(environment, params))(goal),
    },
  ],
  [
    "snf",
    {
      descrs: NNF_DESCRS,
      isTrackingDependencies: true,
      build: (environment, params) => runNnf(environment.manager, params),
    },
  ],
  [
    "nnf",
    {
      descrs: NNF_DESCRS,
      isTrackingDependencies: true,
      build: (environment, params) =>
        runNnf(environment.manager, new Map([...params, ["mode", "full"]])),
    },
  ],
  [
    "aig",
    {
      descrs: getDescrs("", [["max_memory", PARAM_UINT, UINT_MAX, true]]),
      isTrackingDependencies: true,
      build: (environment) => createAigTactic(environment.manager),
    },
  ],
  ["skip", { descrs: new Map(), isTrackingDependencies: true, build: () => (goal) => [goal] }],
  [
    "fail",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: () => () => {
        throw new SmtTacticError("fail tactic");
      },
    },
  ],
  [
    "fail-if-undecided",
    {
      descrs: new Map(),
      isTrackingDependencies: true,
      build: () => (goal) => {
        if (!goal.isDecided()) throw new SmtTacticError("undecided");
        return [goal];
      },
    },
  ],
]);

const UNPORTED_TACTICS = new Set(
  (
    "bv-slice bvarray2uf collect-statistics " +
    "degree-shift demodulator " +
    "elim-predicates elim-uncnstr2 " +
    "euf-completion ff-sat ff-simplify ff-solve ff-unique ff2bv fold-unfold fpa2bv " +
    "horn-simplify injectivity pb-preprocess pqffd propagate-bv-bounds " +
    "propagate-bv-bounds2 propagate-values2 qfbv-sls recover-01 reduce-args2 " +
    "sat-preprocess sls-smt smtfd solver-subsumption special-relations " +
    "subpaving symmetry-reduce"
  ).split(" "),
);

const isUnsignedNumeral = (sexpr: SExpr | undefined): sexpr is SmtToken =>
  sexpr?.kind === "numeral" && isUnsigned(sexpr.text);

const getParamName = (keyword: string) =>
  keyword.replace(/^:/, "").toLowerCase().replaceAll("-", "_");

const findParam = (descrs: ParamDescrs, name: string) => {
  const descr = descrs.get(name);
  if (descr !== undefined) return { name, descr };
  const period = name.indexOf(".");
  if (period === -1) return undefined;
  const suffix = name.slice(period + 1);
  const suffixDescr = descrs.get(suffix);
  return suffixDescr?.module === name.slice(0, period)
    ? { name: suffix, descr: suffixDescr }
    : undefined;
};

const parseParamValue = (kind: number, value: SExpr) =>
  kind === PARAM_BOOL
    ? isSymbol(value, "true") || (isSymbol(value, "false") ? false : undefined)
    : kind === PARAM_UINT
      ? isUnsignedNumeral(value)
        ? Number(value.text)
        : undefined
      : kind === PARAM_NUMERAL
        ? value.kind === "numeral" || value.kind === "decimal"
          ? value.text
          : undefined
        : isSymbol(value)
          ? value.text
          : undefined;

const getUntypedParamValue = (value: SExpr) =>
  value.kind === "list"
    ? undefined
    : value.kind === "numeral"
      ? Number(value.text)
      : value.text === "true" || (value.text === "false" ? false : value.text);

const isUnportedParam = (descr: ParamDescr, value: TacticParam) =>
  !descr.isPorted && value !== descr.defaultValue;

const checkParams = (descrs: ParamDescrs, params: TacticParams) => {
  for (const [name, value] of params) {
    const descr = descrs.get(name);
    if (descr !== undefined && isUnportedParam(descr, value))
      throw new SmtUnsupportedError(`the parameter ${name} of the tactic`);
  }
};

// sexpr2tactic reports an error at the s-expression: a list at its closing parenthesis.
const getSexprPosition = (sexpr: SExpr) => (sexpr.kind === "list" ? sexpr.end : sexpr);

const getParams = (
  builder: TacticBuilder,
  items: SExpr[],
  isInternal: boolean,
): Map<string, TacticParam> => {
  const params = new Map<string, TacticParam>();
  for (let index = 2; index < items.length; index += 2) {
    const keyword = items[index];
    if (keyword.kind !== "keyword")
      throw new SmtParseError(
        "invalid using-params combinator, keyword expected",
        getSexprPosition(keyword),
      );
    const value = items[index + 1];
    if (value === undefined)
      throw new SmtParseError("invalid using-params combinator, parameter value expected", keyword);
    const found = findParam(builder.descrs, getParamName(keyword.text));
    if (isInternal) {
      const parsed =
        found === undefined
          ? getUntypedParamValue(value)
          : parseParamValue(found.descr.kind, value);
      if (parsed === undefined)
        throw new SmtParseError("invalid parameter value", getSexprPosition(value));
      params.set(found?.name ?? getParamName(keyword.text), parsed);
      continue;
    }
    if (found === undefined) {
      if (!builder.isRejectingUnknown)
        throw new SmtUnsupportedError(`the parameter ${keyword.text} of the tactic`);
      throw new SmtParseError(
        `invalid using-params combinator, unknown parameter ${getParamName(keyword.text)}`,
        getSexprPosition(value),
      );
    }
    const parsed = parseParamValue(found.descr.kind, value);
    if (parsed === undefined)
      throw new SmtParseError(
        found.descr.kind === PARAM_BOOL
          ? "invalid parameter value, true or false expected"
          : found.descr.kind === PARAM_UINT
            ? "invalid parameter value, unsigned integer expected"
            : found.descr.kind === PARAM_NUMERAL
              ? "invalid parameter value, numeral expected"
              : "invalid parameter value, symbol expected",
        getSexprPosition(value),
      );
    if (isUnportedParam(found.descr, parsed))
      throw new SmtUnsupportedError(`the parameter ${found.name} of the tactic`);
    params.set(found.name, parsed);
  }
  return params;
};

const mergeDescrs = (builders: TacticBuilder[]) => ({
  descrs: {
    get: (name: string) => {
      for (let index = 0; index < builders.length; index++) {
        const descr = builders[index].descrs.get(name);
        if (descr !== undefined) return descr;
      }
      return undefined;
    },
  },
  isRejectingUnknown: builders.every((builder) => builder.isRejectingUnknown),
  isTrackingDependencies: builders.every((builder) => builder.isTrackingDependencies),
});

const isDecidedSat = (goals: Goal[]) => goals.length === 1 && goals[0].isDecidedSat();

const isDecidedUnsat = (goals: Goal[]) => goals.length === 1 && goals[0].isDecidedUnsat();

// Deviation from Z3: and_then and repeat join the subgoals' cores, where Z3 answers an empty core.
const assertUnsat = (goal: Goal, unsatGoals: Goal[]) => {
  goal.resetAll();
  goal.assert(
    goal.manager.falseExpr,
    unsatGoals.reduce<Dependency | undefined>(
      (core, unsatGoal) => joinDependencies(unsatGoal.getDependency(0), core),
      undefined,
    ),
  );
  return [goal];
};

const runAndThen = (first: Tactic, second: Tactic) => (goal: Goal) => {
  const goals = first(goal);
  if (goals.length === 1) return goals[0].isDecided() ? goals : second(goals[0]);
  const results: Goal[] = [];
  const unsatGoals: Goal[] = [];
  try {
    for (const subgoal of goals) {
      const subresults = second(subgoal);
      if (isDecidedSat(subresults)) return subresults;
      (isDecidedUnsat(subresults) ? unsatGoals : results).push(...subresults);
    }
  } catch (error) {
    // and_then's buffer frees the subgoals no result keeps, first to last, and then its caller's
    // buffer frees the results.
    for (const subgoal of goals) if (!results.includes(subgoal)) subgoal.release();
    for (const result of results) result.release();
    throw error;
  }
  return results.length > 0 ? results : assertUnsat(goal, unsatGoals);
};

const runOrElse = (tactics: Tactic[]) => (goal: Goal) => {
  const original = goal.copy();
  try {
    for (const tactic of tactics.slice(0, -1)) {
      try {
        return tactic(goal);
      } catch (error) {
        if (!(error instanceof SmtTacticError || error instanceof SmtCanceledError)) throw error;
      }
      goal.resetAll();
      goal.copyFrom(original);
    }
    return tactics[tactics.length - 1](goal);
  } finally {
    original.release();
  }
};

const isEqualGoal = (first: Goal, second: Goal) => {
  if (first.forms.size !== second.forms.size) return false;
  const firstForms = new Set(first.forms.items);
  const secondForms = new Set(second.forms.items);
  return (
    firstForms.size === secondForms.size && [...secondForms].every((form) => firstForms.has(form))
  );
};

const runRepeat = (tactic: Tactic, maxDepth: number) => {
  const run = (depth: number, goal: Goal): Goal[] => {
    if (depth > maxDepth) return [goal];
    const original = goal.copy();
    const step = (() => {
      try {
        const results = tactic(goal);
        return { results, isEqual: results.length === 1 && isEqualGoal(original, results[0]) };
      } finally {
        original.release();
      }
    })();
    const goals = step.results;
    if (step.isEqual) return goals;
    if (goals.length === 1) return goals[0].isDecided() ? goals : run(depth + 1, goals[0]);
    const results: Goal[] = [];
    const unsatGoals: Goal[] = [];
    for (const subgoal of goals) {
      const subresults = run(depth + 1, subgoal);
      if (isDecidedSat(subresults)) return subresults;
      (isDecidedUnsat(subresults) ? unsatGoals : results).push(...subresults);
    }
    return results.length > 0 ? results : assertUnsat(goal, unsatGoals);
  };
  return (goal: Goal) => run(0, goal);
};

const runCond = (probe: Probe, onTrue: Tactic, onFalse: Tactic) => (goal: Goal) =>
  probe(goal) === 0 ? onFalse(goal) : onTrue(goal);

const checkHasArgument = (list: SmtList, combinator: string) => {
  if (list.items.length < 2)
    throw new SmtParseError(
      `invalid ${combinator} combinator, at least one argument expected`,
      list.end,
    );
};

const compile = (
  environment: TacticEnvironment,
  sexpr: SExpr,
  isInternal: boolean,
): TacticBuilder => {
  if (sexpr.kind !== "list") {
    if (!isSymbol(sexpr)) throw new SmtParseError("invalid tactic, unexpected input", sexpr);
    const named = NAMED_TACTICS.get(sexpr.text);
    if (named !== undefined)
      return {
        descrs: named.descrs,
        isRejectingUnknown: named.isRejectingUnknown ?? true,
        isTrackingDependencies: named.isTrackingDependencies ?? false,
        build: (params) => {
          const tactic = named.build(environment, params);
          if (!isInternal) return tactic;
          return (goal) => {
            checkParams(named.descrs, params);
            return tactic(goal);
          };
        },
      };
    const strategy = LOGIC_TACTICS.get(sexpr.text);
    if (strategy !== undefined)
      return compile(environment, createCommandReader(strategy).read() as SmtList, true);
    if (UNPORTED_TACTICS.has(sexpr.text)) {
      const error = new SmtUnsupportedError(`the tactic ${sexpr.text}`);
      if (!isInternal) throw error;
      return {
        descrs: new Map(),
        isRejectingUnknown: false,
        isTrackingDependencies: false,
        build: () => () => {
          throw error;
        },
      };
    }
    throw new SmtParseError(`invalid tactic, unknown tactic ${sexpr.text}`, sexpr);
  }
  const head = sexpr.items[0];
  if (head === undefined) throw new SmtParseError("invalid tactic, arguments expected", sexpr.end);
  if (!isSymbol(head)) throw new SmtParseError("invalid tactic, symbol expected", sexpr.end);
  const compileChildren = (combinator: string) => {
    checkHasArgument(sexpr, combinator);
    return sexpr.items.slice(1).map((child) => compile(environment, child, isInternal));
  };
  switch (head.text) {
    case "then":
    case "and-then": {
      const children = compileChildren("and-then");
      return {
        ...mergeDescrs(children),
        build: (params) =>
          children
            .map((child) => child.build(params))
            .reduceRight((second, first) => runAndThen(first, second)),
      };
    }
    case "or-else": {
      const children = compileChildren("or-else");
      if (children.length === 1) return children[0];
      return {
        ...mergeDescrs(children),
        build: (params) => runOrElse(children.map((child) => child.build(params))),
      };
    }
    // Z3 runs these children in threads, and running them in order is one schedule it may pick.
    case "par":
    case "par-or": {
      const children = compileChildren("par-or");
      if (children.length === 1) return children[0];
      return {
        ...mergeDescrs(children),
        build: (params) => runOrElse(children.map((child) => child.build(params))),
      };
    }
    case "par-then": {
      const children = compileChildren("par-then");
      if (children.length === 1) return children[0];
      return {
        ...mergeDescrs(children),
        build: (params) =>
          children
            .map((child) => child.build(params))
            .reduceRight((second, first) => (goal) => {
              if (goal.isProofsEnabled)
                throw new SmtTacticError("par_and_then does not support proof production");
              return runAndThen(first, second)(goal);
            }),
      };
    }
    // The timeout is not ported, so the child runs to the end.
    case "try-for": {
      if (sexpr.items.length !== 3)
        throw new SmtParseError("invalid try-for combinator, two arguments expected", sexpr.end);
      if (!isUnsignedNumeral(sexpr.items[2]))
        throw new SmtParseError(
          "invalid try-for combinator, second argument must be an unsigned integer",
          sexpr.end,
        );
      const child = compile(environment, sexpr.items[1], isInternal);
      return {
        ...child,
        build: (params) => {
          const tactic = child.build(params);
          return (goal) => {
            try {
              return tactic(goal);
            } catch (error) {
              if (error instanceof SmtDefaultError) throw new SmtTacticError(error.message);
              if (error instanceof SmtCanceledError)
                throw new SmtTacticError(goal.manager.limit.getCancelMessage());
              throw error;
            }
          };
        },
      };
    }
    case "fail-if-branching": {
      if (sexpr.items.length !== 3 && sexpr.items.length !== 2)
        throw new SmtParseError(
          "invalid fail-if-branching combinator, one or two arguments expected",
          sexpr.end,
        );
      const bound = sexpr.items[2];
      if (bound !== undefined && !isUnsignedNumeral(bound))
        throw new SmtParseError(
          "invalid fail-if-branching combinator, second argument must be an unsigned integer",
          sexpr.end,
        );
      const child = compile(environment, sexpr.items[1], isInternal);
      const threshold = bound === undefined ? 1 : Number(bound.text);
      return {
        ...mergeDescrs([child]),
        build: (params) => {
          const tactic = child.build(params);
          return (goal) => {
            const goals = tactic(goal);
            if (goals.length > threshold) throw new SmtTacticError("failed-if-branching tactical");
            return goals;
          };
        },
      };
    }
    case "if-no-proofs":
    case "if-no-unsat-cores":
    case "if-no-models": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError(
          `invalid ${head.text} combinator, one argument expected`,
          sexpr.end,
        );
      const child = compile(environment, sexpr.items[1], isInternal);
      const isSkipping = (goal: Goal) =>
        head.text === "if-no-models"
          ? goal.isModelsEnabled
          : head.text === "if-no-proofs"
            ? goal.isProofsEnabled
            : goal.isCoresEnabled;
      return {
        ...mergeDescrs([child]),
        build: (params) => {
          const tactic = child.build(params);
          return (goal) => (isSkipping(goal) ? [goal] : tactic(goal));
        },
      };
    }
    case "repeat": {
      if (sexpr.items.length !== 3 && sexpr.items.length !== 2)
        throw new SmtParseError(
          "invalid repeat combinator, one or two arguments expected",
          sexpr.end,
        );
      const bound = sexpr.items[2];
      if (bound !== undefined && !isUnsignedNumeral(bound))
        throw new SmtParseError(
          "invalid repeat combinator, second argument must be an unsigned integer",
          sexpr.end,
        );
      const child = compile(environment, sexpr.items[1], isInternal);
      const maxDepth = bound === undefined ? UINT_MAX : Number(bound.text);
      return {
        ...mergeDescrs([child]),
        build: (params) => runRepeat(child.build(params), maxDepth),
      };
    }
    case "!":
    case "using-params":
    case "with": {
      checkHasArgument(sexpr, "using-params");
      const child = compile(environment, sexpr.items[1], isInternal);
      if (sexpr.items.length === 2) return child;
      const own = getParams(child, sexpr.items, isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => child.build(new Map([...params, ...own])),
      };
    }
    case "skip-if-failed": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError(
          "invalid skip-if-failed combinator, one argument expected",
          sexpr.end,
        );
      const child = compile(environment, sexpr.items[1], isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => runOrElse([child.build(params), (goal) => [goal]]),
      };
    }
    case "if":
    case "ite":
    case "cond": {
      if (sexpr.items.length !== 4)
        throw new SmtParseError(
          "invalid if/conditional combinator, three arguments expected",
          sexpr.end,
        );
      const probe = compileProbe(sexpr.items[1], isInternal);
      const children = sexpr.items.slice(2).map((child) => compile(environment, child, isInternal));
      return {
        ...mergeDescrs(children),
        build: (params) => runCond(probe, children[0].build(params), children[1].build(params)),
      };
    }
    case "when": {
      if (sexpr.items.length !== 3)
        throw new SmtParseError("invalid when combinator, two arguments expected", sexpr.end);
      const probe = compileProbe(sexpr.items[1], isInternal);
      const child = compile(environment, sexpr.items[2], isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => runCond(probe, child.build(params), (goal) => [goal]),
      };
    }
    case "fail-if": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError("invalid fail-if tactic, one argument expected", sexpr.end);
      const probe = compileProbe(sexpr.items[1], isInternal);
      return {
        descrs: new Map(),
        isRejectingUnknown: true,
        isTrackingDependencies: true,
        build: () => (goal) => {
          if (probe(goal) !== 0) throw new SmtTacticError("fail-if tactic");
          return [goal];
        },
      };
    }
    case "echo": {
      if (sexpr.items.length < 2)
        throw new SmtParseError("invalid echo tactic, must have at least one argument", sexpr.end);
      const pieces = sexpr.items.slice(1).map((piece, index, all): Tactic => {
        const newline = index === all.length - 1 ? "\n" : "";
        if (piece.kind === "string")
          return (goal) => {
            environment.write(piece.text + newline, false);
            return [goal];
          };
        const probe = compileProbe(piece, isInternal);
        return (goal) => {
          environment.write(formatProbeValue(probe(goal)) + newline, true);
          return [goal];
        };
      });
      return {
        descrs: new Map(),
        isRejectingUnknown: true,
        isTrackingDependencies: true,
        build: () => pieces.reduceRight((second, first) => runAndThen(first, second)),
      };
    }
    default:
      throw new SmtParseError(`invalid tactic, unknown tactic combinator ${head.text}`, sexpr.end);
  }
};

// inc_sat_solver's init_preprocess, with sat.euf.
export const mkIncSatEufPreprocess = (manager: AstManager) =>
  runAndThen(
    inPlace((goal) => simplifyGoal(manager, goal, getRewriterOptions(manager, new Map()))),
    inPlace((goal) => propagateValues(manager, goal)),
  );

// inc_sat_solver's init_preprocess, without sat.euf.
export const mkIncSatPreprocess = (manager: AstManager, bitBlaster: BitBlasterRewriter) =>
  [
    inPlace((goal) => simplifyGoal(manager, goal, getRewriterOptions(manager, new Map()))),
    inPlace((goal) => propagateValues(manager, goal)),
    inPlace((goal) => card2bv(manager, goal, getRewriterOptions(manager, new Map()))),
    inPlace((goal) =>
      simplifyGoal(
        manager,
        goal,
        getRewriterOptions(
          manager,
          new Map<string, TacticParam>([
            ["som", true],
            ["pull_cheap_ite", true],
            ["push_ite_bv", false],
            ["local_ctx", true],
            ["local_ctx_limit", 10000000],
            ["flat", true],
            ["hoist_mul", false],
            ["elim_and", true],
            ["blast_distinct", true],
          ]),
        ),
      ),
    ),
    runMaxBvSharing(manager),
    runBitBlast(
      manager,
      { isBlastingMul: true, isBlastingAdd: true, isBlastingQuant: false, isBlastingFull: false },
      bitBlaster,
    ),
    inPlace((goal) =>
      simplifyGoal(manager, goal, getRewriterOptions(manager, new Map([["flat", false]]))),
    ),
  ].reduceRight((second, first) => runAndThen(first, second));

export const compileTactic = (environment: TacticEnvironment, sexpr: SExpr) =>
  compile(environment, sexpr, false);

export const buildInternalTactic = (environment: TacticEnvironment, sexpr: SExpr) =>
  compile(environment, sexpr, true).build(new Map());

export const compileInternalTactic = (environment: TacticEnvironment, text: string) =>
  buildInternalTactic(environment, createCommandReader(text).readSExpr());

interface TacticCheck {
  status: number;
  model: ProtoModel | undefined;
  core: Dependency | undefined;
  reasonUnknown: string | undefined;
  isConversionCanceled: boolean;
}

// The port's declarations of division by zero leave out their domain; Z3's have two arguments.
const DIVISION_BY_ZERO_DECLS = new Set([OP_DIV0, OP_IDIV0, OP_MOD0, OP_POWER0]);

// A constant of an uninterpreted sort the model lacks puts its value in that sort's universe.
export const applyDefinitions = (definitions: readonly Definition[], model: ProtoModel) => {
  const manager = model.manager;
  const universe: number[] = [];
  let evaluator = new ModelEvaluator(manager, model);
  evaluator.setModelCompletion(true);
  for (let index = definitions.length - 1; index >= 0; index--) {
    const definition = definitions[index];
    if (definition.def === -1) {
      model.unregisterDecl(definition.decl);
      continue;
    }
    const value = evaluator.rewrite(definition.def);
    const arity = DIVISION_BY_ZERO_DECLS.has(definition.decl)
      ? 2
      : manager.funcDecls[definition.decl].domain.length;
    if (arity > 0) {
      const oldInterp = model.funcInterps.get(definition.decl);
      const isChanged = oldInterp?.elseExpr !== value;
      if (isChanged) {
        const interp = new FuncInterp(manager, arity);
        interp.setElse(value);
        model.registerFunc(definition.decl, interp);
      }
      manager.decRef(value);
      if (oldInterp !== undefined && isChanged) {
        evaluator.release();
        evaluator = new ModelEvaluator(manager, model);
        evaluator.setModelCompletion(true);
      }
      continue;
    }
    const old = model.constInterps.get(definition.decl);
    if (old !== value) model.registerConst(definition.decl, value);
    const sort = manager.sorts[value];
    if (
      manager.isUninterpretedSort(sort) &&
      !model.getUninterpretedSorts().includes(sort) &&
      !universe.includes(value)
    )
      universe.push(value);
    manager.decRef(value);
    if (old !== undefined && old !== value) {
      evaluator.release();
      evaluator = new ModelEvaluator(manager, model);
      evaluator.setModelCompletion(true);
    }
  }
  evaluator.release();
  for (const value of universe) model.registerValue(value);
  return model;
};

const applyConverter = (entry: Goal["converters"][number], model: ProtoModel) => {
  if ("convert" in entry) {
    const converted = entry.convert(model);
    // The model_ref that the converter assigns frees the model it replaced.
    if (converted !== model) {
      model.incRef();
      model.decRef();
    }
    return converted;
  }
  if ("definitions" in entry) return applyDefinitions(entry.definitions, model);
  model.unregisterDecl(entry.decl);
  return model;
};

export const convertModel = (goal: Goal, model: ProtoModel) =>
  goal.converters.reduceRight((converted, entry) => applyConverter(entry, converted), model);

const getConvertedModel = (goal: Goal) => {
  let model = goal.model?.copy() ?? new ProtoModel(goal.manager).mkModel();
  for (let index = goal.converters.length - 1; index >= 0; index--) {
    try {
      model = applyConverter(goal.converters[index], model);
    } catch (error) {
      if (!(error instanceof SmtCanceledError)) throw error;
      return { model, isCanceled: true };
    }
  }
  return { model, isCanceled: false };
};

const getTacticCheck = (goal: Goal, goals: Goal[] | string | undefined): TacticCheck => {
  const undecided = {
    status: L_UNDEF,
    model: undefined,
    core: undefined,
    isConversionCanceled: false,
  };
  if (goals === undefined) return { ...undecided, reasonUnknown: undefined };
  if (typeof goals === "string") return { ...undecided, reasonUnknown: goals };
  if (isDecidedUnsat(goals))
    return { ...undecided, status: L_FALSE, core: goals[0].getDependency(0), reasonUnknown: "" };
  const isSat = isDecidedSat(goals);
  const converted =
    isSat ||
    (goal.isModelsEnabled &&
      goals.length > 0 &&
      (goals[0].model !== undefined || goals[0].converters.length > 0))
      ? getConvertedModel(goals[0])
      : undefined;
  const model = converted?.model;
  if (converted?.isCanceled === true)
    return { ...undecided, model, reasonUnknown: undefined, isConversionCanceled: true };
  if (isSat)
    return goal.manager.limit.inc()
      ? { ...undecided, status: L_TRUE, model, reasonUnknown: "" }
      : { ...undecided, model, reasonUnknown: "canceled" };
  return {
    ...undecided,
    model,
    reasonUnknown:
      goals.length === 1 && goals[0].reasonUnknown !== "" ? goals[0].reasonUnknown : "unknown",
  };
};

export const checkSatUsing = (tactic: Tactic, goal: Goal) => {
  const goals = (() => {
    try {
      return tactic(goal);
    } catch (error) {
      if (error instanceof SmtTacticError || error instanceof SmtDefaultError) return error.message;
      if (error instanceof SmtCanceledError) return undefined;
      throw error;
    }
  })();
  try {
    return getTacticCheck(goal, goals);
  } finally {
    if (Array.isArray(goals))
      for (const result of goals)
        if (result !== goal) {
          result.release();
        }
  }
};

export const applyTactic = (tactic: Tactic, goal: Goal) => {
  try {
    return tactic(goal);
  } catch (error) {
    if (error instanceof SmtCanceledError)
      throw new SmtTacticError(goal.manager.limit.getCancelMessage());
    throw error;
  }
};

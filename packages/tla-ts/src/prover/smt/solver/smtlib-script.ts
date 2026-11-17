import { ENCODINGS, UNICODE_ENCODING } from "./seq-decl-plugin";
import {
  isStackOverflow,
  SmtCanceledError,
  SmtParseError,
  SmtDefaultError,
  SmtTacticError,
  SmtUnsupportedError,
} from "../../../errors";
import type { DecideOptions } from "../../verdict";
import {
  AstManager,
  FAMILY_BASIC,
  FAMILY_MODEL_VALUE,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_IMPLIES,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Goal, getDependencyValues, mkDependencyLeaf, PRECISION_NAMES } from "./goal";
import { Rational } from "./rational";
import { Rewriter } from "./rewriter";
import { ResourceLimit } from "./rlimit";
import {
  DEFAULT_PRINT_OPTIONS,
  formatSort,
  getQuotedName,
  mkSeq1,
  mkSeq5,
  mkText,
  type PrintOptions,
  printExpr,
  renderFormat,
} from "./smt2-printer";
import {
  createCommandReader,
  createSmtlibReader,
  DECLARATIONS,
  expectClosed,
  isSymbol,
  isUnsigned,
  type SExpr,
  type SmtList,
  type SmtlibReader,
  type SmtToken,
} from "./smtlib-parser";
import { O_MAXIMIZE, O_MAXSMT, O_MINIMIZE, OptContext, type OptObjective } from "./opt-context";
import { getLogicStrategy } from "./logic-tactics";
import { isMbqiByFeatures, isMbqiByLogic } from "./smt-setup";
import { isSupportedLogic, logicHasSeq } from "./smt-logics";
import { getVerdict, solveAssertions, solveAssuming } from "./solver";
import { getConsequences } from "./smt-consequences";
import { getFdConsequences } from "./fd-solver";
import { SmtKernel } from "./smt-kernel";
import { Mus } from "./mus";
import { RefVector } from "./ref-vector";
import { IncSatSolver } from "./sat/inc-sat-solver";
import { mkThSolver } from "./euf/th-solvers";
import { isAstLess } from "./ast-lt";
import { InvVarShifter } from "./rewriter-tpl";
import { elimUnusedVars, getFreeVarSorts, VarSubst } from "./var-subst";
import { type Context, MBQI_MAX_ITERATIONS } from "./context";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { DatalogContext } from "./muz/dl-context";
import { createDatalogContext } from "./muz/horn-tactic";
import { printModel } from "./model-printer";
import { FuncInterp, getManagerSomeValue, ProtoModel } from "./proto-model";
import {
  applyTactic,
  checkSatUsing,
  compileInternalTactic,
  compileTactic,
  getRewriterOptions,
  getSatParams,
  getSmtTacticFailure,
  type TacticParam,
} from "./tactic";

const UNPORTED_COMMANDS = new Set([
  "assert-not",
  "assume",
  "dbg-bool-rewriter",
  "dbg-elim-and",
  "dbg-get-qbody",
  "dbg-params",
  "dbg-pp-var",
  "dbg-set",
  "dbg-set-next-id",
  "dbg-sexpr",
  "dbg-shift-vars",
  "dbg-size",
  "dbg-subst",
  "dbg-th-rewriter",
  "dbg-translator",
  "declare-map",
  "declare-tactic",
  "declare-type-var",
  "del",
  "display-dimacs",
  "euf-project",
  "eufi",
  "ff-boolean-certify",
  "ff-certify",
  "ff-check-native-proof",
  "ff-integrated-certify",
  "get-assignment",
  "get-interpolant",
  "get-proof",
  "get-proof-graph",
  "get-unsat-assumptions",
  "get-user-tactics",
  "help",
  "help-simplifier",
  "help-tactic",
  "include",
  "infer",
  "labels",
  "mbi",
  "mbp",
  "mbp-qel",
  "model-add",
  "model-del",
  "prefer",
  "qe-lite",
  "qel",
  "reset-preferences",
  "set-initial-value",
  "set-simplifier",
]);

const SILENT_COMMANDS = new Set([
  ...DECLARATIONS,
  "assert",
  "push",
  "pop",
  "reset",
  "reset-assertions",
  "set-option",
  "set-info",
  "assert-soft",
  "declare-rel",
  "declare-var",
  "rule",
]);

type PrintOptionOf<Value> = {
  [Key in keyof PrintOptions]: PrintOptions[Key] extends Value ? Key : never;
}[keyof PrintOptions];

const NUMERIC_PRINT_OPTIONS = new Map<string, PrintOptionOf<number>>([
  [":pp.max_indent", "maxIndent"],
  [":pp.max_num_lines", "maxNumLines"],
  [":pp.max_width", "maxWidth"],
  [":pp.max_ribbon", "maxRibbon"],
  [":pp.max_depth", "maxDepth"],
  [":pp.min_alias_size", "minAliasSize"],
  [":pp.decimal_precision", "decimalPrecision"],
]);

const BOOLEAN_PRINT_OPTIONS = new Map<string, PrintOptionOf<boolean>>([
  [":pp.flat_assoc", "isFlatAssoc"],
  [":pp.single_line", "isSingleLine"],
  [":pp.bounded", "isBounded"],
  [":pp.decimal", "isDecimal"],
  [":pp.bv_literals", "isBvLiterals"],
  [":pp.bv_neg", "isBvNeg"],
  [":pp.fp_real_literals", "isFpRealLiterals"],
]);

const SIMPLIFY_PARAMETERS = new Set([
  "elim_and",
  "local_ctx",
  "pull_cheap_ite",
  "blast_distinct",
  "som",
  "sort_sums",
  "arith_lhs",
  "gcd_rounding",
  "hi_div0",
  "mul2concat",
  "split_concat_eq",
  "algebraic_number_evaluator",
  "expand_power",
  "expand_tan",
  "sort_store",
  "elim_rem",
]);

const SIMPLIFY_UINT_PARAMETERS = new Set([
  "max_degree",
  "local_ctx_limit",
  "blast_distinct_threshold",
]);

const PARAMETER_DEFAULTS = new Map([
  ["auto_config", "true"],
  ["smt.relevancy", "2"],
  ["smt.mbqi", "true"],
  ["rlimit", "0"],
  ["rewriter.hi_div0", "true"],
]);

const BUILTIN_OPTIONS = new Set([
  ":print-success",
  ":print-warning",
  ":expand-definitions",
  ":interactive-mode",
  ":produce-proofs",
  ":produce-unsat-cores",
  ":produce-unsat-assumptions",
  ":produce-models",
  ":produce-assignments",
  ":produce-assertions",
  ":regular-output-channel",
  ":diagnostic-output-channel",
  ":random-seed",
  ":verbosity",
  ":global-decls",
  ":global-declarations",
  ":numeral-as-real",
  ":error-behavior",
  ":int-real-coercions",
  ":reproducible-resource-limit",
]);

const getParameterName = (keyword: string) => keyword.slice(1).toLowerCase().replaceAll("-", "_");

const getSoftParameters = (items: SExpr[]) => {
  const parameters = { weight: Rational.one, id: null as string | null };
  for (let index = 0; index < items.length; index += 2) {
    const keyword = items[index];
    if (keyword.kind !== "keyword")
      throw new SmtParseError("invalid command argument, keyword expected", keyword);
    const name = getParameterName(keyword.text);
    const value = items[index + 1];
    if (name === "weight" && (value?.kind === "numeral" || value?.kind === "decimal")) {
      const [whole, fraction = ""] = value.text.split(".");
      parameters.weight = Rational.of(BigInt(whole + fraction), 10n ** BigInt(fraction.length));
      continue;
    }
    if (name !== "id" || !isSymbol(value))
      throw new SmtUnsupportedError(`the parameter :${name} of assert-soft`);
    parameters.id = value.text;
  }
  return parameters;
};

const getSimplifyParams = (items: SExpr[]) => {
  const params = new Map<string, TacticParam>();
  for (let index = 0; index < items.length; index += 2) {
    const keyword = items[index];
    if (keyword.kind !== "keyword")
      throw new SmtParseError("invalid command argument, keyword expected", keyword);
    const name = getParameterName(keyword.text);
    const value = items[index + 1];
    if (SIMPLIFY_UINT_PARAMETERS.has(name) && value?.kind === "numeral") {
      params.set(name, Number(value.text));
      continue;
    }
    if (!SIMPLIFY_PARAMETERS.has(name) || !isSymbol(value))
      throw new SmtUnsupportedError(`the parameter :${name} of the simplifier`);
    params.set(name, isSymbol(value, "true"));
  }
  return params;
};

const APPLY_PARAMETERS = new Map([
  ["print", true],
  ["print_model_converter", true],
  ["print_benchmark", true],
  ["print_dependencies", true],
  ["timeout", false],
  ["max_memory", false],
  ["print_statistics", true],
]);

const CHECK_SAT_USING_PARAMETERS = new Map([
  ["timeout", false],
  ["max_memory", false],
  ["print_statistics", true],
  ["print_unsat_core", true],
  ["print_proof", true],
  ["print_model", true],
]);

const getCommandParams = (items: SExpr[], isBooleans: ReadonlyMap<string, boolean>) => {
  const params = new Map<string, TacticParam>();
  for (let index = 2; index < items.length; index += 2) {
    const keyword = items[index];
    if (keyword.kind !== "keyword")
      throw new SmtParseError("invalid command argument, keyword expected", keyword);
    const name = getParameterName(keyword.text);
    const isBoolean = isBooleans.get(name);
    if (isBoolean === undefined) throw new SmtParseError("invalid keyword argument", keyword);
    const value = items[index + 1];
    if (isBoolean) {
      if (!isSymbol(value, "true") && !isSymbol(value, "false"))
        throw new SmtParseError("invalid command argument, true/false expected", value ?? keyword);
      params.set(name, isSymbol(value, "true"));
    } else {
      if (value?.kind !== "numeral")
        throw new SmtParseError(
          "invalid command argument, unsigned integer expected",
          value ?? keyword,
        );
      if (!isUnsigned(value.text))
        throw new SmtParseError(
          "invalid indexed identifier, index is too big to fit in an unsigned machine integer",
          value,
        );
      params.set(name, Number(value.text));
    }
  }
  return params;
};

const getFirstArgument = (list: SmtList) => {
  const argument = list.items[1];
  if (argument === undefined)
    throw new SmtParseError("invalid command, argument(s) missing", list.end);
  return argument;
};

const checkArgumentCount = (list: SmtList, count: number) => {
  const extra = list.items[count + 1];
  if (extra !== undefined) throw new SmtParseError("invalid command, too many arguments", extra);
};

// Z3's parse_opt_unsigned names the push command for pop as well.
const getScopeCount = (list: SmtList) => {
  const argument = list.items[1];
  if (argument === undefined) return 1;
  if (argument.kind !== "numeral")
    throw new SmtParseError("invalid push command, integer expected", argument);
  if (argument.text.startsWith("-"))
    throw new SmtParseError("invalid push command, value is negative.", argument);
  return Number(argument.text);
};

interface Scope {
  assertions: number;
  objectives: number;
  softTrail: number;
}

interface CheckResult {
  status: number;
  context: Context | undefined;
  isOptimizing: boolean;
  // A tactic answered, so a missing model is one its model converter did not make.
  isFromTactic: boolean;
  model: ProtoModel | undefined;
  core: number[] | undefined;
  // check_sat_result::reason_unknown, where the port tracks it.
  reasonUnknown?: string;
}

interface SolverAnswer {
  result: number;
  context: Context | undefined;
  reasonUnknown: string | undefined;
}

interface ScriptState {
  manager: AstManager;
  logic: string | undefined;
  reader: SmtlibReader;
  assertions: number[];
  names: number[];
  assertionTexts: string[];
  objectives: OptObjective[];
  // The objective of each soft constraint, in the order they were asserted.
  softTrail: number[];
  optimizer: OptContext | undefined;
  scopes: Scope[];
  check: CheckResult | undefined;
  isProofsEnabled: boolean | undefined;
  isIncremental: boolean;
  hasChecked: boolean;
  // The datalog context of the declare-rel, declare-var, rule and query commands.
  datalog: DatalogContext | undefined;
  // combined_solver's incremental smt kernel, which keeps one context across the checks, or
  // undefined while Z3 has made no such kernel.
  kernel: SmtKernel | undefined;
  // The incremental solver of sat.euf, inc_sat_solver in euf mode, or undefined once it reached
  // an unported theory and the smt kernel answers in its place.
  eufSolver: IncSatSolver | undefined;
}

// Z3 fixes the proof mode at the first command that needs terms.
const MANAGERLESS_COMMANDS = new Set([
  "set-option",
  "set-info",
  "set-logic",
  "get-option",
  "get-info",
  "get-assertions",
  "echo",
]);

export const runSmtlibScript = (
  text: string,
  options: DecideOptions,
  printLine: (line: string, isDiagnostic?: boolean) => void,
) => {
  const commands = createCommandReader(text);
  // Z3 writes to a stream: text left without a newline starts the next line.
  let pendingText = "";
  const print = (line: string, isDiagnostic?: boolean) => {
    printLine(pendingText + line, isDiagnostic);
    pendingText = "";
  };
  const settings = {
    isPrintingSuccess: false,
    isProducingModels: true,
    isProducingUnsatCores: false,
    isProducingProofs: false,
    isExitingOnError: false,
    isInteractive: false,
    isDiagnosticOnStdout: false,
    parameters: new Map<string, string>(),
    isMbqi: true,
    mbqiMaxIterations: MBQI_MAX_ITERATIONS,
    isFindingMacros: false,
    isHiDiv0: true,
    encoding: UNICODE_ENCODING,
    rlimit: 0,
    printOptions: { ...DEFAULT_PRINT_OPTIONS },
    parserOptions: { isIgnoringBadPatterns: true },
    // Z3 keeps set-info's :status across reset.
    status: L_UNDEF,
  };
  const createState = (): ScriptState => {
    const manager = new AstManager(new ResourceLimit(Infinity, options.signal));
    manager.isHiDiv0 = settings.isHiDiv0;
    manager.maxChar = settings.encoding.maxChar;
    manager.charBits = settings.encoding.charBits;
    return {
      manager,
      logic: undefined,
      reader: createSmtlibReader(manager, undefined, settings.parserOptions),
      assertions: [],
      names: [],
      assertionTexts: [],
      objectives: [],
      softTrail: [],
      optimizer: undefined,
      scopes: [],
      check: undefined,
      isProofsEnabled: undefined,
      isIncremental: false,
      hasChecked: false,
      datalog: undefined,
      kernel: undefined,
      eufSolver: undefined,
    };
  };
  let state = createState();
  const getPrintEnvironment = () => ({
    options: settings.printOptions,
    isUsed: state.reader.isUsed,
    isClashing: state.reader.isClashing,
  });
  const format = (expr: number) => printExpr(state.manager, getPrintEnvironment(), expr);
  const display = (expr: number) => print(format(expr));
  const report = (error: SmtParseError) =>
    print(`(error "line ${error.line} column ${error.column}: ${error.message}")`);
  const getNamedAssertions = () => {
    const manager = state.manager;
    const isNamed = hasNames();
    return state.assertions.map((assertion, index) =>
      isNamed && state.names[index] !== -1
        ? manager.mkApp(OP_IMPLIES, [state.names[index], assertion], SORT_BOOL)
        : assertion,
    );
  };
  const getOptOptions = () => {
    const parameters = settings.parameters;
    // symba and farkas run on the infinitesimal arithmetic solver, which is not ported.
    if ((parameters.get("opt.optsmt_engine") ?? "basic") !== "basic")
      throw new SmtUnsupportedError("the option :opt.optsmt_engine");
    return {
      priority: parameters.get("opt.priority") ?? "lex",
      optsmt: {
        bisectRounds: Number(parameters.get("opt.optsmt_bisect_rounds") ?? 64),
        isNlsat: parameters.get("opt.optsmt_nlsat") !== "false",
        isDualBounds: parameters.get("opt.optsmt_dual_bounds") !== "false",
        supremumRlimit: Number(parameters.get("opt.optsmt_nlsat_supremum_rlimit") ?? 100000),
        isLexAfterUnbounded: parameters.get("opt.optsmt_lex_after_unbounded") !== "false",
      },
      isParetoNlsat: parameters.get("opt.pareto_nlsat") !== "false",
      isParetoNlsatReused: parameters.get("opt.pareto_nlsat_reuse") !== "false",
      paretoMaxLemmas: Number(parameters.get("opt.pareto_nlsat_max_lemmas") ?? 128),
    };
  };
  const optimize = (extra: number[], end: SmtToken) => {
    const manager = state.manager;
    const objectives = state.objectives;
    const hard = [...getNamedAssertions(), ...state.names.filter((name) => name !== -1), ...extra];
    const pinned = hard.map((form) => {
      manager.incRef(form);
      return form;
    });
    state.optimizer ??= new OptContext(
      manager,
      {
        manager,
        isMbqi: settings.isMbqi,
        mbqiMaxIterations: settings.mbqiMaxIterations,
        isFindingMacros: settings.isFindingMacros,
        setup: getSetup(),
        write: () => {},
        parameters: settings.parameters,
        hasDefinitions: () => state.reader.hasDefinitions(),
      },
      objectives,
    );
    const optimizer = state.optimizer;
    clearCheck();
    state.manager.limit.push(settings.rlimit);
    try {
      const hasAssumptions = extra.length > 0 || hasNames();
      const status = optimizer.optimize(hard, {
        ...getOptOptions(),
        hasAssumptions,
        isSatEnabled: settings.parameters.get("opt.enable_sat") !== "false",
        maxsat: {
          maxsatEngine: settings.parameters.get("opt.maxsat_engine") ?? "maxres",
          isMaxlexEnabled: settings.parameters.get("opt.maxlex.enable") !== "false",
          isHillClimbing: settings.parameters.get("opt.maxres.hill_climb") !== "false",
          maxCoreSize: Number(settings.parameters.get("opt.maxres.max_core_size") ?? 3),
        },
        isEliminatingZeroOne:
          settings.parameters.get("opt.elim_01") !== "false" &&
          state.logic === undefined &&
          !hasAssumptions &&
          settings.parameters.get("opt.incremental") !== "true",
      });
      setCheck(status, {
        isOptimizing: true,
        model: optimizer.model ?? undefined,
        reasonUnknown: optimizer.getReasonUnknown(),
      });
      print(getVerdict(status));
      return true;
    } catch (error) {
      // The unported parts of optimization keep the answer of the hard constraints.
      if (error instanceof SmtUnsupportedError) {
        resetOptimizer();
        return false;
      }
      if (error instanceof SmtDefaultError) {
        optimizer.release();
        setCheck(L_UNDEF, { isOptimizing: true, reasonUnknown: "unknown" });
        throw new SmtParseError(error.message, end);
      }
      if (!(error instanceof SmtCanceledError || isStackOverflow(error))) throw error;
      const reasonUnknown = optimizer.getReasonUnknown();
      optimizer.release();
      setCheck(L_UNDEF, { isOptimizing: true, reasonUnknown });
      print("unknown");
      return true;
    } finally {
      state.manager.limit.pop();
      for (const form of pinned) manager.decRef(form);
    }
  };
  const resetOptimizer = () => {
    state.optimizer?.release();
    state.optimizer = undefined;
  };
  // The port keeps answering with the smt kernel where it lacks a piece of the logic's strategy.
  const solveWithStrategy = () => {
    const goal = getGoal();
    const strategy =
      settings.parameters.get("tactic.default_tactic") ??
      getLogicStrategy(state.logic, goal.isProofsEnabled);
    try {
      const checked = checkSatUsing(compileInternalTactic(getTacticEnvironment(), strategy), goal);
      return {
        result: checked.status,
        context: undefined,
        model: checked.model,
        // The finite-domain solver is an inc_sat_solver, whose reason stays "no reason given" after an answer.
        reasonUnknown:
          isUsingFdSolver() && checked.status !== L_UNDEF
            ? "no reason given"
            : checked.reasonUnknown,
      };
    } catch (error) {
      if (!(error instanceof SmtUnsupportedError)) throw error;
      const hasQuantifiers = state.assertions.some(
        (assertion) => state.manager.hasQuantifierFlags[assertion],
      );
      const solved = solveAssertions(state.manager, state.assertions, {
        isMbqi: settings.isMbqi || isMbqiByFeatures(getSetup(), hasQuantifiers),
        mbqiMaxIterations: settings.mbqiMaxIterations,
        isFindingMacros: settings.isFindingMacros,
        setup: getSetup(),
      });
      return {
        ...solved,
        model: undefined,
        reasonUnknown:
          solved.result === L_UNDEF && solved.context !== undefined
            ? getSmtTacticFailure(solved.context)
            : "",
      };
    }
  };
  // Deviation from Z3: the heap guard and a stack overflow, which Z3 lacks, read as an exhausted rlimit.
  const getCancelMessage = (deadline: number) =>
    Date.now() > deadline || options.signal?.aborted === true
      ? "canceled"
      : "max. resource limit exceeded";
  // As in Z3, a timeout leaves "timeout" in the kernel, which reports it while its last search hasn't failed.
  const getReasonUnknown = (solved: SolverAnswer, deadline: number) => {
    const isTimedOut = solved.result === L_UNDEF && Date.now() > deadline;
    const context = state.kernel?.context;
    if (isTimedOut && context !== undefined) context.reasonUnknown = "timeout";
    if (context !== undefined && solved.context === context) return context.getLastFailureMessage();
    return isTimedOut ? "timeout" : (solved.reasonUnknown ?? getCancelMessage(deadline));
  };
  // As in Z3, a kernel loses the mbqi its logic turned on once it reads the parameters again.
  const getKernelParams = (isSetUp = false) => ({
    isMbqi: settings.isMbqi || (!isSetUp && isMbqiByLogic(getSetup())),
    mbqiMaxIterations: settings.mbqiMaxIterations,
    isFindingMacros: settings.isFindingMacros,
    setup: getSetup(),
  });
  // mk_special_solver_for_logic gives these logics the finite-domain solver, incremental or not.
  const isUsingFdSolver = () =>
    (state.logic === "QF_FD" || state.logic === "SAT") &&
    !settings.isProducingProofs &&
    !settings.parameters.has("tactic.default_tactic");
  const checkSat = (extra: number[], end: SmtToken) => {
    const deadline = Date.now() + options.timeLimitMs;
    state.manager.limit.restart(deadline);
    // opt::context::optimize answers as the search of the hard constraints does: once they are
    // satisfiable, optsmt and maxsmt only improve the model. The unported parts of optimization
    // only get that answer.
    if (state.objectives.length > 0 && optimize(extra, end)) return;
    state.manager.limit.push(settings.rlimit);
    const isOptimizing = state.objectives.length > 0;
    const manager = state.manager;
    const names = state.names.filter((name) => name !== -1);
    const isNamed = names.length > 0;
    const isAssuming = isNamed || extra.length > 0;
    if (isAssuming) state.isIncremental = true;
    if (!isOptimizing) state.hasChecked = true;
    const isKernelChecking =
      isAssuming || (state.isIncremental && !isOptimizing && !isUsingFdSolver());
    try {
      const assumptions = isNamed ? [...names, ...extra] : extra;
      const kernel = isKernelChecking ? checkKernel(assumptions) : undefined;
      // Z3 retries a quantifier-free problem with its tactic when the incremental kernel gives up.
      const isFromTactic =
        kernel === undefined ||
        (!isAssuming &&
          kernel.result === L_UNDEF &&
          !state.assertions.some((assertion) => manager.hasQuantifierFlags[assertion]) &&
          manager.limit.inc());
      const solved = isFromTactic ? { ...solveWithStrategy(), core: undefined } : kernel;
      setCheck(solved.result, {
        context: solved.context,
        isOptimizing,
        isFromTactic: isFromTactic && !isUsingFdSolver(),
        model: solved.model,
        core: solved.core ?? solved.context?.unsatCore ?? [],
        reasonUnknown: getReasonUnknown(solved, deadline),
      });
      print(getVerdict(solved.result));
    } catch (error) {
      if (
        !(
          error instanceof SmtCanceledError ||
          error instanceof SmtDefaultError ||
          isStackOverflow(error)
        )
      )
        throw error;
      const context = isKernelChecking ? state.kernel?.context : undefined;
      setCheck(L_UNDEF, {
        isOptimizing,
        isFromTactic: !isKernelChecking && !isUsingFdSolver(),
        reasonUnknown:
          error instanceof SmtDefaultError
            ? error.message
            : getReasonUnknown({ result: L_UNDEF, context, reasonUnknown: undefined }, deadline),
      });
      print("unknown");
    } finally {
      state.manager.limit.release();
      state.manager.limit.pop();
    }
  };
  const getModel = (list: SmtList) => {
    const check = state.check;
    if (!settings.isProducingModels || check === undefined || check.status === L_FALSE)
      throw new SmtParseError("model is not available", list.end);
    if (check.model !== undefined) return check.model;
    if (check.isOptimizing) throw new SmtUnsupportedError("the models of optimization");
    if (check.context === undefined && check.status !== L_TRUE)
      throw check.isFromTactic
        ? new SmtParseError("model is not available", list.end)
        : new SmtUnsupportedError("the model of a canceled search");
    const model = check.context?.getModel() ?? new ProtoModel(state.manager);
    model.incRef();
    check.model = model;
    return model;
  };
  const clearCheck = () => {
    state.check?.model?.decRef();
    state.check = undefined;
  };
  // cmd_context::validate_check_sat_result runs after the answer is printed.
  const validateCheck = (end: SmtToken) => {
    const status = state.check?.status ?? L_UNDEF;
    if (status !== L_UNDEF && settings.status !== L_UNDEF && status !== settings.status)
      throw new SmtParseError(`check annotation that says ${getVerdict(settings.status)}`, end);
  };
  // The check holds a reference to its model until clearCheck.
  const setCheck = (status: number, result: Partial<Omit<CheckResult, "status">> = {}) => {
    result.model?.incRef();
    state.check = {
      status,
      context: undefined,
      isOptimizing: false,
      isFromTactic: false,
      model: undefined,
      core: undefined,
      ...result,
    };
  };
  // cmd_context::mk_solver: mk_solver_for_logic makes the incremental solver the smt kernel unless
  // the logic, the default tactic or the sat parameters pick a sat solver. Under sat.euf that
  // solver is inc_sat_solver in euf mode; the other sat solvers only store their assertions.
  const resetKernel = () => {
    const logic = state.logic;
    const parameters = settings.parameters;
    const isProofsEnabled = settings.isProducingProofs || state.isProofsEnabled === true;
    const isFdSolver =
      ((logic === "QF_FD" || logic === "SAT") && !isProofsEnabled) || logic === "SMTFD";
    const isEuf = parameters.get("sat.euf") === "true";
    const isSatSolver =
      isFdSolver ||
      (logic === "QF_BV" && settings.isHiDiv0) ||
      parameters.get("tactic.default_tactic") === "sat" ||
      parameters.get("sat.smt") === "true" ||
      isEuf;
    state.eufSolver?.release();
    state.kernel = isSatSolver ? undefined : new SmtKernel(state.manager, getKernelParams());
    state.eufSolver =
      isEuf && !isFdSolver && parameters.get("sat.smt") !== "true"
        ? new IncSatSolver(state.manager, getSatParams(parameters), true, mkThSolver)
        : undefined;
    for (let index = 0; index < state.scopes.length; index++) {
      state.kernel?.push();
      useEufSolver((solver) => solver.push());
    }
  };
  // The parts of sat.euf that are not ported leave its answers to the smt kernel.
  const useEufSolver = <Result>(action: (solver: IncSatSolver) => Result) => {
    const solver = state.eufSolver;
    if (solver === undefined) return undefined;
    try {
      return action(solver);
    } catch (error) {
      if (!(error instanceof SmtUnsupportedError)) throw error;
      solver.release();
      state.eufSolver = undefined;
      return undefined;
    }
  };
  // solver_na2as asserts a named assertion as an implication from its name.
  const assertInKernel = (formula: number, name: number) => {
    const manager = state.manager;
    const asserted = name === -1 ? formula : manager.mkApp(OP_IMPLIES, [name, formula], SORT_BOOL);
    manager.incRef(asserted);
    state.kernel?.assertExpr(asserted);
    useEufSolver((solver) => solver.assertExpr(asserted));
    manager.decRef(asserted);
  };
  const checkKernel = (assumptions: number[]) => {
    const kernel = state.kernel;
    const found = useEufSolver((solver) => {
      const result = solver.check(assumptions);
      return {
        result,
        context: undefined,
        model: result === L_TRUE ? (solver.getModel() ?? undefined) : undefined,
        core: result === L_FALSE ? [...solver.getUnsatCore()] : undefined,
        reasonUnknown: solver.reasonUnknown,
      };
    });
    if (found !== undefined) return found;
    if (kernel !== undefined)
      return {
        result: kernel.check(assumptions),
        context: kernel.context,
        model: undefined,
        core: undefined,
        reasonUnknown: undefined,
      };
    const solved = solveAssuming(
      state.manager,
      getNamedAssertions(),
      assumptions,
      getKernelParams(),
    );
    return {
      ...solved,
      model: undefined,
      core: undefined,
      // inc_sat_solver, which these logics use, keeps "no reason given" after an answer.
      reasonUnknown:
        solved.result === L_UNDEF ? solved.context.getLastFailureMessage() : "no reason given",
    };
  };
  const printDiagnostic = (line: string) => print(line, !settings.isDiagnosticOnStdout);
  const write = (text: string, isDiagnostic: boolean) => {
    const lines = text.split("\n");
    const rest = lines.pop() ?? "";
    for (const line of lines) (isDiagnostic ? printDiagnostic : print)(line);
    pendingText += rest;
  };
  const getSetup = () => ({
    logic: state.logic,
    isAutoConfig:
      settings.parameters.get("auto_config") !== "false" &&
      settings.parameters.get("smt.auto_config") !== "false",
  });
  const getTacticEnvironment = () => ({
    manager: state.manager,
    isMbqi: settings.isMbqi,
    mbqiMaxIterations: settings.mbqiMaxIterations,
    isFindingMacros: settings.isFindingMacros,
    setup: getSetup(),
    write,
    parameters: settings.parameters,
    hasDefinitions: () => state.reader.hasDefinitions(),
  });
  const getDatalog = () => {
    state.datalog ??= createDatalogContext(
      state.manager,
      settings.parameters,
      getRewriterOptions(state.manager, new Map()),
    );
    return state.datalog;
  };
  const getGoal = (isTrackingDependencies = false) => {
    const goal = new Goal(state.manager);
    goal.isProofsEnabled = settings.isProducingProofs || state.isProofsEnabled === true;
    goal.isModelsEnabled = settings.isProducingModels;
    goal.isCoresEnabled = settings.isProducingUnsatCores;
    for (const [index, assertion] of state.assertions.entries())
      goal.assert(
        assertion,
        isTrackingDependencies && state.names[index] !== -1
          ? mkDependencyLeaf(state.names[index])
          : undefined,
      );
    return goal;
  };
  const getCommandGoal = (isTrackingDependencies: boolean, end: SmtToken) => {
    if (
      settings.isProducingUnsatCores &&
      (settings.isProducingProofs || state.isProofsEnabled === true)
    )
      throw new SmtParseError(
        "Frontend does not support simultaneous generation of proofs and unsat cores",
        end,
      );
    return getGoal(isTrackingDependencies);
  };
  const hasNames = () => state.names.some((name) => name !== -1);
  // parse_check_sat shrinks the expression stack once the check has run.
  const checkSatAssuming = (items: SmtList["items"], itemsEnd: SmtToken, end: SmtToken) => {
    const literals: number[] = [];
    try {
      for (const [index, item] of items.entries())
        literals.push(
          state.reader.parseFormula(
            item,
            items[index + 1] ?? itemsEnd,
            "invalid check-sat command, argument must be a Boolean literal",
          ),
        );
      checkSat(literals, end);
    } finally {
      for (const literal of literals) state.manager.decRef(literal);
    }
  };
  const addObjective = (list: SmtList, isMax: boolean) => {
    const term = state.reader.parseTerm(getFirstArgument(list));
    const sort = state.manager.sorts[term];
    if (sort !== SORT_INT && sort !== SORT_REAL && !state.manager.isBvSort(sort))
      throw new SmtParseError(
        "Objective must be bit-vector, integer or real",
        list.items[2] ?? list.end,
      );
    resetOptimizer();
    state.manager.incRef(term);
    state.objectives.push({
      type: isMax ? O_MAXIMIZE : O_MINIMIZE,
      term,
      terms: [],
      weights: [],
      id: null,
    });
    if (settings.isPrintingSuccess) print("success");
    checkArgumentCount(list, 1);
  };
  const releaseObjectives = (size: number, softSize: number) => {
    for (const index of state.softTrail.splice(softSize).reverse()) {
      const objective = state.objectives[index];
      state.manager.decRef(objective.terms.pop() as number);
      objective.weights.pop();
    }
    for (const objective of state.objectives.splice(size))
      if (objective.type !== O_MAXSMT) state.manager.decRef(objective.term);
  };
  const restoreAssertions = (size: number) => {
    for (const assertion of state.assertions.splice(size)) state.manager.decRef(assertion);
    for (const name of state.names.splice(size)) if (name !== -1) state.manager.decRef(name);
    state.assertionTexts.length = size;
  };
  const instantiate = (list: SmtList, isNested: boolean) => {
    const manager = state.manager;
    const outer = state.reader.parseTerm(list.items[1] ?? list.end);
    if (manager.kinds[outer] !== KIND_QUANTIFIER)
      throw new SmtParseError("invalid command, quantifier expected.", list.end);
    const quantifier = isNested ? manager.getQuantifier(outer).body : outer;
    if (manager.kinds[quantifier] !== KIND_QUANTIFIER)
      throw new SmtParseError("invalid command, nested quantifier expected", list.end);
    const terms = list.items[2];
    if (terms?.kind !== "list")
      throw new SmtParseError("invalid command, '(' expected", terms ?? list.end);
    const args = terms.items.map((item) => state.reader.parseTerm(item));
    const sorts = manager.getQuantifier(quantifier).sorts;
    if (args.length !== sorts.length)
      throw new SmtParseError(
        "invalid command, mismatch between the number of quantified variables and the number of arguments.",
        list.end,
      );
    for (let index = args.length - 1; index >= 0; index--)
      if (manager.sorts[args[index]] !== sorts[index])
        throw new SmtParseError(`invalid command, sort mismatch at position ${index}`, list.end);
    const subst = new VarSubst(manager, true);
    const substituted = subst.apply(manager.getQuantifier(quantifier).body, args);
    subst.release();
    const shifter = new InvVarShifter(manager);
    const result = shifter.shift(substituted, args.length);
    shifter.release();
    display(result);
    manager.decRef(result);
    manager.decRef(substituted);
  };
  // parser::parse_func_decl_ref: a name, or a name with its signature. Z3 ends the message of an
  // unexpected token with the last identifier it read.
  const getFuncDeclRef = (reference: SExpr) => {
    if (isSymbol(reference)) {
      const decls = state.reader.getFuncs(reference.text);
      if (decls.length > 1)
        throw new SmtParseError(
          `ambiguous function declaration reference, provide full signature to disambiguate (<symbol> (<sort>*) <sort>) ${reference.text}`,
          reference,
        );
      if (decls.length === 0)
        throw new SmtParseError(
          `invalid function declaration reference, unknown function ${reference.text}`,
          reference,
        );
      return decls[0];
    }
    const name = reference.kind === "list" ? (reference.items[0] ?? reference.end) : reference;
    if (reference.kind !== "list" || name.kind !== "symbol") {
      if (name.kind === "list")
        throw new SmtUnsupportedError("an indexed function declaration reference");
      throw new SmtParseError(
        `invalid function declaration reference, symbol or '(' expected got ${name.lastId}`,
        name,
      );
    }
    const domain = reference.items[1] ?? reference.end;
    if (domain.kind !== "list")
      throw new SmtParseError(
        `Invalid function name. Expecting sort list starting with '(' to disambiguate function name got ${domain.lastId}`,
        domain,
      );
    const sorts = domain.items.map((sort) => state.reader.parseSort(sort));
    if (reference.items[2] === undefined)
      throw new SmtParseError("Invalid function name invalid sort, unexpected ')'", reference.end);
    const range = state.reader.parseSort(reference.items[2]);
    const follower = reference.items[3] ?? reference.end;
    const found = state.reader.getFuncs(name.text).find((decl) => {
      const funcDecl = state.manager.funcDecls[decl];
      return (
        funcDecl.range === range &&
        funcDecl.domain.length === sorts.length &&
        funcDecl.domain.every((sort, index) => sort === sorts[index])
      );
    });
    if (found === undefined)
      throw new SmtParseError(
        `invalid function declaration reference, unknown indexed function ${name.text}`,
        follower,
      );
    if (follower !== reference.end)
      throw new SmtUnsupportedError("a function declaration reference with trailing terms");
    return found;
  };
  const runCommand = new Map<string, (list: SmtList) => void>([
    [
      "assert",
      (list) => {
        const term = list.items[1] ?? list.end;
        const follower = list.items[2] ?? list.end;
        const assertion = state.reader.parseAssertion(term, follower);
        const logicError = state.reader.getLogicError(assertion.formula);
        if (logicError !== undefined) {
          state.manager.decRef(assertion.formula);
          throw new SmtParseError(logicError, follower);
        }
        state.assertions.push(assertion.formula);
        state.assertionTexts.push(
          text.slice(term.offset, (term.kind === "list" ? term.end : term).endOffset).trim(),
        );
        if (state.hasChecked) state.isIncremental = true;
        resetOptimizer();
        if (!settings.isProducingUnsatCores || assertion.name === undefined) state.names.push(-1);
        else {
          const manager = state.manager;
          const answer = manager.mkApp(
            manager.mkFuncDecl(assertion.name, [], SORT_BOOL, true),
            [],
            SORT_BOOL,
          );
          manager.incRef(answer);
          state.names.push(answer);
        }
        assertInKernel(assertion.formula, state.names[state.names.length - 1]);
        clearCheck();
        if (follower !== list.end)
          throw new SmtParseError("invalid assert command, ')' expected", follower);
      },
    ],
    [
      "check-sat",
      (list) => {
        checkSatAssuming(list.items.slice(1), list.end, list.end);
        validateCheck(list.end);
      },
    ],
    [
      "declare-rel",
      (list) => {
        const name = list.items[1];
        const domain = list.items[2];
        if (!isSymbol(name) || domain?.kind !== "list")
          throw new SmtParseError("at least 2 arguments expected", list.end);
        const decl = state.manager.mkFuncDecl(
          name.text,
          domain.items.map((sort) => state.reader.parseSort(sort)),
          SORT_BOOL,
        );
        state.reader.insertFunc(decl, list.end);
        getDatalog().registerPredicate(decl);
      },
    ],
    [
      "declare-var",
      (list) => {
        const name = list.items[1];
        const sort = list.items[2];
        if (!isSymbol(name) || sort === undefined)
          throw new SmtParseError(
            "invalid declare-var command, symbol and sort expected",
            list.end,
          );
        const manager = state.manager;
        const range = state.reader.parseSort(sort);
        const decl = manager.mkFuncDecl(name.text, [], range);
        state.reader.insertFunc(decl, list.end);
        getDatalog().registerVariable(manager.mkApp(decl, [], range));
      },
    ],
    [
      "rule",
      (list) => {
        const rule = list.items[1];
        if (rule === undefined) throw new SmtParseError("invalid rule, expected formula", list.end);
        const name = list.items[2];
        getDatalog().addRule(
          state.reader.parseFormula(rule, rule),
          isSymbol(name) ? name.text : "",
        );
      },
    ],
    [
      "query",
      (list) => {
        if (list.items[1] === undefined)
          throw new SmtParseError("invalid query command, argument expected", list.end);
        const relation = getFuncDeclRef(list.items[1]);
        const datalog = getDatalog();
        // dl_query_cmd::set_next_arg runs once the parser is past the reference.
        const follower = list.items[2] ?? list.end;
        if (!datalog.isPredicateDecl(relation))
          throw new SmtParseError(
            "Invalid query argument, expected a predicate registered as a relation",
            follower,
          );
        if (follower.kind !== "keyword" && follower !== list.end)
          throw new SmtParseError("invalid command argument, keyword expected", follower);
        for (const assertion of state.assertions) datalog.assertExpr(assertion);
        state.manager.limit.restart(Date.now() + options.timeLimitMs);
        state.manager.limit.push(settings.rlimit);
        let status = L_UNDEF;
        try {
          status = datalog.relQuery(relation);
        } catch (error) {
          if (!(error instanceof SmtTacticError)) throw error;
          print(`(error "query failed: ${error.message}")`);
        } finally {
          state.manager.limit.pop();
        }
        print(status === L_UNDEF && datalog.isBounded ? "bounded" : getVerdict(status));
        datalog.isBounded = false;
      },
    ],
    [
      "check-sat-using",
      (list) => {
        const params = getCommandParams(list.items, CHECK_SAT_USING_PARAMETERS);
        if (list.items[1] === undefined)
          throw new SmtParseError("check-sat-using needs a tactic argument", list.end);
        expectClosed(list.items[1]);
        const builder = compileTactic(getTacticEnvironment(), list.items[1]);
        const tactic = builder.build(params);
        const goal = getCommandGoal(builder.isTrackingDependencies, list.end);
        clearCheck();
        const deadline = Date.now() + options.timeLimitMs;
        state.manager.limit.restart(deadline);
        state.manager.limit.push(settings.rlimit);
        try {
          const checked = checkSatUsing(tactic, goal);
          setCheck(checked.status, {
            isFromTactic: true,
            model: checked.model,
            core:
              builder.isTrackingDependencies || !hasNames()
                ? getDependencyValues(checked.core)
                : undefined,
            reasonUnknown: checked.reasonUnknown ?? getCancelMessage(deadline),
          });
          print(getVerdict(checked.status));
        } finally {
          state.manager.limit.pop();
        }
        validateCheck(list.end);
      },
    ],
    [
      "check-sat-assuming",
      (list) => {
        const literals = list.items[1] ?? list.end;
        if (literals.kind !== "list")
          throw new SmtParseError(
            `invalid check-sat-assuming command, '(', expected got ${literals.lastId}`,
            literals,
          );
        checkSatAssuming(literals.items, literals.end, list.end);
        validateCheck(list.end);
      },
    ],
    [
      "get-consequences",
      (list) => {
        const manager = state.manager;
        const [assumptions, vars] = [list.items[1], list.items[2]].map((terms) => {
          if (terms === undefined)
            throw new SmtParseError("invalid command, argument(s) missing", list.end);
          if (terms.kind !== "list")
            throw new SmtParseError(
              `invalid list of terms, '(' expected got ${terms.lastId}`,
              terms,
            );
          return terms.items.map((item) => state.reader.parseTerm(item));
        });
        if (list.items.length > 3)
          throw new SmtParseError("invalid command, too many arguments", list.items[3]);
        clearCheck();
        const deadline = Date.now() + options.timeLimitMs;
        manager.limit.restart(deadline);
        manager.limit.push(settings.rlimit);
        const names = state.names.filter((name) => name !== -1);
        try {
          if (isUsingFdSolver()) {
            if (names.length > 0)
              throw new SmtUnsupportedError("the named assertions of the finite-domain solver");
            const found = getFdConsequences(
              manager,
              new Map(),
              state.assertions,
              assumptions,
              vars,
            );
            setCheck(found.result, {
              model: found.model,
              core: found.core,
              reasonUnknown: found.reasonUnknown,
            });
            print(getVerdict(found.result));
            print("");
            for (const consequence of found.consequences.items) display(consequence);
            found.consequences.reset();
            return;
          }
          const kernel = state.kernel ?? new SmtKernel(manager, getKernelParams());
          if (state.kernel === undefined)
            for (const assertion of getNamedAssertions()) kernel.assertExpr(assertion);
          const found = getConsequences(kernel, [...names, ...assumptions], vars);
          setCheck(found.result, {
            context: kernel.context,
            core: kernel.context.unsatCore,
            reasonUnknown: kernel.context.getLastFailureMessage(),
          });
          print(getVerdict(found.result));
          print("");
          for (const consequence of found.consequences.items) display(consequence);
          found.consequences.reset();
        } catch (error) {
          if (!(error instanceof SmtCanceledError || isStackOverflow(error))) throw error;
          const reasonUnknown = getCancelMessage(deadline);
          if (state.kernel !== undefined) state.kernel.context.reasonUnknown = reasonUnknown;
          setCheck(L_UNDEF, { reasonUnknown });
          print("unknown");
          print("");
        } finally {
          manager.limit.pop();
        }
      },
    ],
    ["minimize", (list) => addObjective(list, false)],
    ["maximize", (list) => addObjective(list, true)],
    [
      "assert-soft",
      (list) => {
        const formula = state.reader.parseTerm(list.items[1] ?? list.end);
        if (state.manager.sorts[formula] !== SORT_BOOL)
          throw new SmtParseError("Invalid type for expression. Expected Boolean type.", list.end);
        const parameters = getSoftParameters(list.items.slice(2));
        resetOptimizer();
        const existing = state.objectives.findIndex(
          (objective) => objective.type === O_MAXSMT && objective.id === parameters.id,
        );
        const index = existing === -1 ? state.objectives.length : existing;
        if (existing === -1)
          state.objectives.push({
            type: O_MAXSMT,
            term: -1,
            terms: [],
            weights: [],
            id: parameters.id,
          });
        if (parameters.weight.isZero()) return;
        state.manager.incRef(formula);
        state.objectives[index].terms.push(formula);
        state.objectives[index].weights.push(parameters.weight);
        state.softTrail.push(index);
      },
    ],
    [
      "push",
      (list) => {
        clearCheck();
        for (let index = getScopeCount(list); index > 0; index--) {
          state.scopes.push({
            assertions: state.assertions.length,
            objectives: state.objectives.length,
            softTrail: state.softTrail.length,
          });
          state.reader.push();
          state.isIncremental = true;
          state.kernel?.push();
          useEufSolver((solver) => solver.push());
        }
        if (list.items[2] !== undefined)
          throw new SmtParseError("invalid push command, ')' expected", list.items[2]);
      },
    ],
    [
      "pop",
      (list) => {
        const count = getScopeCount(list);
        const follower = list.items[2] ?? list.end;
        clearCheck();
        if (count > state.scopes.length)
          throw new SmtParseError(
            "invalid pop command, argument is greater than the current stack depth",
            follower,
          );
        if (count > 0) {
          state.isIncremental = true;
          const scope = state.scopes[state.scopes.length - count];
          state.kernel?.pop(count);
          useEufSolver((solver) => solver.pop(count));
          state.reader.pop(count);
          restoreAssertions(scope.assertions);
          resetOptimizer();
          releaseObjectives(scope.objectives, scope.softTrail);
          state.scopes.length -= count;
        }
        if (follower !== list.end)
          throw new SmtParseError("invalid pop command, ')' expected", follower);
      },
    ],
    [
      "reset",
      (list) => {
        if (list.items[1] !== undefined)
          throw new SmtParseError("invalid reset command, ')' expected", list.items[1]);
        clearCheck();
        resetOptimizer();
        state = createState();
      },
    ],
    [
      "reset-assertions",
      (list) => {
        checkArgumentCount(list, 0);
        restoreAssertions(0);
        resetOptimizer();
        releaseObjectives(0, 0);
        state.scopes = state.scopes.map(() => ({ assertions: 0, objectives: 0, softTrail: 0 }));
        if (state.isProofsEnabled !== undefined) resetKernel();
        state.isIncremental = state.scopes.length > 0;
        state.hasChecked = false;
      },
    ],
    [
      "simplify",
      (list) => {
        const manager = state.manager;
        if (list.items.length < 2)
          throw new SmtParseError("invalid simplify command, argument expected", list.end);
        const term = state.reader.parseTerm(list.items[1]);
        manager.incRef(term);
        const rewriter = new Rewriter(
          manager,
          getRewriterOptions(manager, getSimplifyParams(list.items.slice(2))),
        );
        const simplified = rewriter.rewrite(term);
        rewriter.cleanup();
        display(simplified);
        rewriter.release();
        manager.decRef(simplified);
        manager.decRef(term);
      },
    ],
    // The Boolean rewriter alone matches the simplifier only on Boolean structure over constants.
    [
      "dbg-bool-flat-rewriter",
      (list) => {
        const manager = state.manager;
        if (list.items.length !== 2)
          throw new SmtParseError("invalid command, one argument expected", list.end);
        const term = state.reader.parseTerm(list.items[1]);
        manager.incRef(term);
        const visited = new Set<number>();
        const todo = [term];
        for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
          if (visited.has(expr)) continue;
          visited.add(expr);
          const family = manager.kinds[expr] === KIND_APP ? manager.getFamily(expr) : -1;
          if (family !== FAMILY_BASIC && family !== FAMILY_USER && !manager.isNumeral(expr))
            throw new SmtUnsupportedError(
              "the command dbg-bool-flat-rewriter beyond Boolean terms",
            );
          manager.pushArgs(expr, todo);
        }
        const rewriter = new Rewriter(manager, getRewriterOptions(manager, new Map()));
        const rewritten = rewriter.rewrite(term);
        display(rewritten);
        rewriter.release();
        manager.decRef(rewritten);
        manager.decRef(term);
      },
    ],
    [
      "apply",
      (list) => {
        const params = getCommandParams(list.items, APPLY_PARAMETERS);
        if (list.items[1] === undefined)
          throw new SmtParseError("apply needs a tactic argument", list.end);
        expectClosed(list.items[1]);
        // apply_tactic_cmd, unlike check-sat-using, gives the tactic no logic.
        const builder = compileTactic(
          { ...getTacticEnvironment(), setup: { ...getSetup(), logic: undefined } },
          list.items[1],
        );
        const tactic = builder.build(params);
        const input = getCommandGoal(builder.isTrackingDependencies, list.end);
        const isPrintingDependencies = params.get("print_dependencies") === true;
        if (isPrintingDependencies && !builder.isTrackingDependencies && hasNames())
          throw new SmtUnsupportedError("the dependencies of a tactic that drops dependencies");
        state.manager.limit.restart(Date.now() + options.timeLimitMs);
        const goals = (() => {
          try {
            return applyTactic(tactic, input);
          } catch (error) {
            if (!(error instanceof SmtTacticError)) throw error;
            print(`(error "tactic failed: ${error.message}")`);
            return undefined;
          }
        })();
        // apply_tactic_cmd releases the result goals and then the input goal.
        if (goals === undefined) {
          input.reset();
          return;
        }
        try {
          const manager = state.manager;
          const environment = getPrintEnvironment();
          if (params.get("print") !== false)
            print(
              [
                "(goals",
                ...goals.map((goal) =>
                  [
                    "(goal",
                    ...goal.forms.items.flatMap((form, index) => [
                      ...(isPrintingDependencies
                        ? [
                            [
                              "  |-",
                              ...getDependencyValues(goal.getDependency(index)).map(format),
                            ].join(" "),
                          ]
                        : []),
                      `  ${printExpr(state.manager, environment, form, 2)}`,
                    ]),
                    `  :precision ${PRECISION_NAMES[goal.precision]} :depth ${goal.depth})`,
                  ].join("\n"),
                ),
                ")",
              ].join("\n"),
            );
          if (
            params.get("print_model_converter") === true &&
            input.converters.some(
              (entry) => !("definitions" in entry) || entry.definitions.length > 0,
            )
          )
            throw new SmtUnsupportedError("printing a model converter");
          if (params.get("print_benchmark") !== true) return;
          const assertions =
            goals.length === 1
              ? goals[0].forms.items
              : [
                  manager.mkOr(
                    goals.map((goal) =>
                      goal.forms.size === 1 ? goal.forms.items[0] : manager.mkAnd(goal.forms.items),
                    ),
                  ),
                ];
          for (const assertion of assertions) manager.incRef(assertion);
          const visited = new Set<number>();
          const decls = new Set<number>();
          for (const assertion of assertions) {
            const todo = [assertion];
            for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
              if (visited.has(expr)) continue;
              visited.add(expr);
              if (manager.kinds[expr] === KIND_QUANTIFIER) {
                const data = manager.getQuantifier(expr);
                todo.push(data.body, ...data.patterns, ...data.noPatterns);
              } else if (manager.kinds[expr] === KIND_APP) {
                manager.pushArgs(expr, todo);
                const decl = manager.decls[expr];
                const family = manager.funcDecls[decl].family;
                if (family === FAMILY_USER || family === FAMILY_MODEL_VALUE) decls.add(decl);
              }
            }
          }
          const lines = [...decls].map((decl) => {
            const funcDecl = manager.funcDecls[decl];
            return renderFormat(
              mkSeq1(
                [
                  mkText(getQuotedName(funcDecl.name)),
                  mkSeq5(funcDecl.domain.map((sort) => formatSort(manager, sort))),
                  formatSort(manager, funcDecl.range),
                ],
                "declare-fun",
              ),
              environment.options,
            );
          });
          for (const assertion of assertions)
            lines.push(`(assert ${printExpr(manager, environment, assertion, 8)})`);
          print([...lines, "(check-sat)"].join("\n"));
          for (const assertion of assertions) manager.decRef(assertion);
        } finally {
          for (const goal of goals) if (goal !== input) goal.reset();
          input.reset();
        }
      },
    ],
    [
      "get-assertions",
      (list) => {
        checkArgumentCount(list, 0);
        if (!settings.isInteractive)
          throw new SmtParseError(
            "command is only available in interactive mode, use command (set-option :interactive-mode true)",
            list.end,
          );
        print(`(${state.assertionTexts.join("\n ")})`);
      },
    ],
    [
      "get-unsat-core",
      (list) => {
        checkArgumentCount(list, 0);
        if (!settings.isProducingUnsatCores)
          throw new SmtParseError(
            "unsat core construction is not enabled, use command (set-option :produce-unsat-cores true)",
            list.end,
          );
        const check = state.check;
        if (check === undefined || check.status !== L_FALSE)
          throw new SmtParseError("unsat core is not available", list.end);
        if (check.core === undefined)
          throw new SmtUnsupportedError("the unsat core of a tactic that drops dependencies");
        const kernel = state.kernel;
        if (
          kernel === undefined ||
          check.context !== kernel.context ||
          settings.parameters.get("smt.core.minimize") !== "true"
        ) {
          print(`(${check.core.map(format).join(" ")})`);
          return;
        }
        // smt_solver::get_unsat_core minimizes the core that the last check of its context left,
        // with checks of that context.
        const mus = new Mus(state.manager, {
          checkSat: (assumptions) => kernel.check(assumptions),
          getUnsatCore: () => kernel.context.unsatCore,
        });
        const core = [...kernel.context.unsatCore];
        for (const literal of core) mus.addSoft(literal);
        const minimized = new RefVector(state.manager);
        state.manager.limit.restart(Date.now() + options.timeLimitMs);
        const status = mus.getMus(minimized);
        print(`(${(status === L_TRUE ? minimized.items : core).map(format).join(" ")})`);
        minimized.reset();
        mus.reset();
      },
    ],
    [
      "eval",
      (list) => {
        const target = list.items[1];
        const term = target === undefined ? -1 : state.reader.parseTerm(target);
        const parameter = list.items[2];
        if (parameter !== undefined && parameter.kind !== "keyword")
          throw new SmtParseError("invalid command argument, keyword expected", parameter);
        if (parameter !== undefined) throw new SmtUnsupportedError("the parameters of eval");
        const model = getModel(list);
        if (term === -1) throw new SmtParseError("no arguments passed to eval", list.end);
        const manager = state.manager;
        manager.incRef(term);
        const value = model.eval(term, false);
        display(value);
        manager.decRef(value);
        manager.decRef(term);
      },
    ],
    [
      "get-value",
      (list) => {
        const terms = list.items[1] ?? list.end;
        if (terms.kind !== "list")
          throw new SmtParseError(
            `invalid get-value command, '(' expected got ${terms.lastId}`,
            terms,
          );
        const manager = state.manager;
        const exprs = terms.items.map((item) => state.reader.parseTerm(item));
        if (exprs.length === 0)
          throw new SmtParseError("invalid get-value command, empty list of terms", terms.end);
        const extra = list.items[2];
        if (
          extra?.kind === "keyword" &&
          (extra.text === ":model-index" || extra.text === ":model_index")
        )
          throw new SmtUnsupportedError("the model index of get-value");
        if (extra !== undefined)
          throw new SmtParseError("invalid get-value command, ')' expected", extra);
        const model = getModel(list);
        pendingText += "(";
        model.compact();
        // Z3 prints each term as the script spells it, from the end of the term before.
        const offsets = [
          terms.offset + 1,
          ...terms.items.map((item) => (item.kind === "list" ? item.end : item).endOffset),
        ];
        exprs.forEach((expr, index) => {
          manager.incRef(expr);
          const value = model.eval(expr, true);
          pendingText += `${index > 0 ? "\n " : ""}(${text.slice(offsets[index], offsets[index + 1]).trim()} ${format(value)})`;
          manager.decRef(value);
          manager.decRef(expr);
        });
        print(")");
      },
    ],
    [
      "get-objectives",
      () => {
        const optimizer = state.optimizer;
        if (optimizer === undefined || state.check === undefined)
          throw new SmtUnsupportedError("the command get-objectives");
        print(optimizer.getObjectives(format));
      },
    ],
    [
      "get-model",
      (list) => {
        for (const index of list.items.slice(1)) {
          if (index.kind !== "numeral")
            throw new SmtParseError("invalid command argument, unsigned integer expected", index);
          if (!isUnsigned(index.text))
            throw new SmtParseError(
              "invalid indexed identifier, index is too big to fit in an unsigned machine integer",
              index,
            );
        }
        const manager = state.manager;
        const model = getModel(list);
        const last = list.items[list.items.length - 1];
        // get_model_cmd takes any number of indices and keeps the last.
        if (last.kind === "numeral" && BigInt(last.text) > 0n)
          throw new SmtUnsupportedError("the index of get-model");
        model.compact();
        for (const decl of state.reader.getDeclaredFuncs()) {
          const funcDecl = manager.funcDecls[decl];
          if (
            funcDecl.family !== FAMILY_USER ||
            manager.macros.has(decl) ||
            model.constInterps.has(decl) ||
            model.funcInterps.has(decl)
          )
            continue;
          const value = model.getSomeValue(funcDecl.range);
          if (funcDecl.domain.length === 0) {
            model.registerConst(decl, value);
            continue;
          }
          const interp = new FuncInterp(manager, funcDecl.domain.length);
          interp.setElse(value);
          model.registerFunc(decl, interp);
        }
        model.addRecFuns();
        print(`(\n${printModel(manager, getPrintEnvironment(), model, 2)})`);
      },
    ],
    [
      "display",
      (list) => {
        display(state.reader.parseTerm(getFirstArgument(list)));
        checkArgumentCount(list, 1);
      },
    ],
    [
      "dbg-lt",
      (list) => {
        const first = state.reader.parseTerm(list.items[1] ?? list.end);
        const second = state.reader.parseTerm(list.items[2] ?? list.end);
        print(String(isAstLess(state.manager, first, second)));
      },
    ],
    [
      "dbg-some-value",
      (list) => {
        display(
          getManagerSomeValue(state.manager, state.reader.parseSort(list.items[1] ?? list.end)),
        );
      },
    ],
    [
      "dbg-used-vars",
      (list) => {
        const manager = state.manager;
        const term = state.reader.parseTerm(list.items[1] ?? list.end);
        const body =
          manager.kinds[term] === KIND_QUANTIFIER ? manager.getQuantifier(term).body : term;
        const sorts = getFreeVarSorts(manager, body, manager.freeVarBounds[body]);
        const lines = sorts.map(
          (sort, index) =>
            `\n  (${String(index).padEnd(6)} ${sort === undefined ? "<not-used>" : renderFormat(formatSort(manager, sort), settings.printOptions)})`,
        );
        print(`(vars${lines.join("")})`);
      },
    ],
    [
      "dbg-elim-unused-vars",
      (list) => {
        const manager = state.manager;
        const term = state.reader.parseTerm(list.items[1] ?? list.end);
        if (manager.kinds[term] !== KIND_QUANTIFIER) {
          write(format(term), false);
          return;
        }
        display(elimUnusedVars(manager, term));
      },
    ],
    ["dbg-instantiate", (list) => instantiate(list, false)],
    ["dbg-instantiate-nested", (list) => instantiate(list, true)],
    [
      "echo",
      (list) => {
        const message = getFirstArgument(list);
        if (message.kind !== "string")
          throw new SmtParseError("invalid command argument, string expected", message);
        print(message.text);
        checkArgumentCount(list, 1);
      },
    ],
    [
      "set-option",
      (list) => {
        const option = list.items[1];
        const keyword = option?.kind === "keyword" ? option.text : "";
        const optionName = `:${getParameterName(keyword)}`;
        const value = list.items[2];
        const isTrue = isSymbol(value, "true");
        if (keyword === ":produce-models") settings.isProducingModels = isTrue;
        if (keyword === ":produce-unsat-cores") settings.isProducingUnsatCores = isTrue;
        if (keyword === ":produce-proofs") settings.isProducingProofs = isTrue;
        if (keyword === ":interactive-mode" || keyword === ":produce-assertions") {
          if (state.isProofsEnabled !== undefined)
            throw new SmtParseError(
              "error setting ':produce-assertions', option value cannot be modified after initialization",
              value ?? list.end,
            );
          settings.isInteractive = isTrue;
        }
        if (keyword === ":diagnostic-output-channel")
          settings.isDiagnosticOnStdout = value?.kind === "string" && value.text === "stdout";
        if (keyword === ":int-real-coercions" && !isTrue)
          throw new SmtUnsupportedError("the option :int-real-coercions false");
        if (keyword === ":error-behavior") {
          if (!isSymbol(value, "immediate-exit") && !isSymbol(value, "continued-execution"))
            throw new SmtParseError(
              "error setting :error-behavior, 'immediate-execution' or 'continued-execution' expected",
              list.end,
            );
          settings.isExitingOnError = isSymbol(value, "immediate-exit");
        }
        const isParameter =
          keyword !== "" &&
          !BUILTIN_OPTIONS.has(keyword) &&
          value !== undefined &&
          value.kind !== "list";
        if (isParameter) settings.parameters.set(getParameterName(keyword), value.text);
        if (optionName === ":print_success") settings.isPrintingSuccess = isTrue;
        if (
          !BUILTIN_OPTIONS.has(keyword) &&
          settings.parameters.get("smtlib2_compliant") === "true"
        )
          settings.isPrintingSuccess = true;
        if (optionName === ":smt.mbqi") settings.isMbqi = isTrue;
        if (optionName === ":smt.macro_finder") settings.isFindingMacros = isTrue;
        if (optionName === ":smt.mbqi.max_iterations" && value?.kind === "numeral")
          settings.mbqiMaxIterations = Number(value.text);
        if (optionName === ":rlimit" && value?.kind === "numeral")
          settings.rlimit = Number(value.text);
        const kernel = state.kernel;
        if (isParameter && kernel !== undefined)
          kernel.updateParams(getKernelParams(kernel.isSetUp));
        if (optionName === ":rewriter.hi_div0") {
          settings.isHiDiv0 = isTrue;
          state.manager.isHiDiv0 = isTrue;
        }
        if (optionName === ":encoding" && value !== undefined && value.kind !== "list") {
          settings.encoding = ENCODINGS.get(value.text) ?? UNICODE_ENCODING;
          state.manager.maxChar = settings.encoding.maxChar;
          state.manager.charBits = settings.encoding.charBits;
        }
        if (optionName === ":parser.ignore_bad_patterns")
          settings.parserOptions.isIgnoringBadPatterns = isTrue;
        const numericOption = NUMERIC_PRINT_OPTIONS.get(optionName);
        if (numericOption !== undefined && value?.kind === "numeral")
          settings.printOptions[numericOption] = Number(value.text);
        const booleanOption = BOOLEAN_PRINT_OPTIONS.get(optionName);
        if (booleanOption !== undefined) settings.printOptions[booleanOption] = isTrue;
        if (
          optionName.startsWith(":pp.") &&
          numericOption === undefined &&
          booleanOption === undefined
        )
          throw new SmtUnsupportedError(`the option ${optionName}`);
      },
    ],
    [
      "get-option",
      (list) => {
        const option = list.items[1];
        if (option?.kind !== "keyword")
          throw new SmtParseError("invalid command argument, keyword expected", option ?? list.end);
        const builtinValues = new Map<string, boolean | string>([
          [":print-success", settings.isPrintingSuccess],
          [":produce-models", settings.isProducingModels],
          [":produce-unsat-cores", settings.isProducingUnsatCores],
          [":interactive-mode", settings.isInteractive],
          [":produce-assertions", settings.isInteractive],
          [":int-real-coercions", true],
          [":error-behavior", settings.isExitingOnError ? "immediate-exit" : "continued-execution"],
        ]);
        const name = getParameterName(option.text);
        const value =
          builtinValues.get(option.text) ??
          (BUILTIN_OPTIONS.has(option.text)
            ? undefined
            : (settings.parameters.get(name) ?? PARAMETER_DEFAULTS.get(name)));
        if (value === undefined) throw new SmtUnsupportedError(`the option ${option.text}`);
        print(String(value));
      },
    ],
    [
      "get-info",
      (list) => {
        const info = list.items[1];
        if (info?.kind !== "keyword")
          throw new SmtParseError("invalid command argument, keyword expected", info ?? list.end);
        const check = state.check;
        const reasonUnknown =
          check === undefined
            ? "state of the most recent check-sat command is not known"
            : check.reasonUnknown;
        if (info.text === ":reason-unknown" && reasonUnknown !== undefined) {
          print(`(:reason-unknown "${reasonUnknown.replaceAll('"', '\\"')}")`);
          return;
        }
        if (info.text === ":rlimit") {
          print(`(:rlimit ${state.manager.limit.count})`);
          return;
        }
        if (info.text !== ":error-behavior")
          throw new SmtUnsupportedError(`the information ${info.text}`);
        print(
          `(:error-behavior ${settings.isExitingOnError ? "immediate-exit" : "continued-execution"})`,
        );
      },
    ],
    [
      "set-logic",
      (list) => {
        const logic = getFirstArgument(list);
        if (!isSymbol(logic))
          throw new SmtParseError("invalid command argument, symbol expected", logic);
        if (state.logic !== undefined)
          throw new SmtParseError("the logic has already been set", logic);
        if (state.assertions.length > 0)
          throw new SmtParseError("logic must be set before initialization", logic);
        if (!isSupportedLogic(logic.text)) {
          print("unsupported");
          printDiagnostic(
            `; ignoring unsupported logic ${logic.text} line: ${list.line} position: ${list.column}`,
          );
          checkArgumentCount(list, 1);
          return;
        }
        state.logic = logic.text;
        if (state.isProofsEnabled === undefined)
          state.reader = createSmtlibReader(state.manager, logic.text, settings.parserOptions);
        else {
          state.reader.restrictSorts(logic.text);
          // Deviation from Z3: its new solver starts without the open scopes, so it ignores their pop and keeps what they asserted.
          resetKernel();
        }
        if (settings.isPrintingSuccess) print("success");
        checkArgumentCount(list, 1);
      },
    ],
    [
      "set-info",
      (list) => {
        const info = list.items[1];
        if (info === undefined)
          throw new SmtParseError("invalid command, argument(s) missing", list.end);
        if (info.kind !== "keyword")
          throw new SmtParseError("invalid command argument, keyword expected", info);
        const value = list.items[2];
        if (value === undefined)
          throw new SmtParseError("invalid command, argument(s) missing", list.end);
        if (value.kind === "list" || value.kind === "keyword" || value.kind === "eof")
          throw new SmtParseError("invalid option value", value);
        if (info.text === ":status" && value.kind === "symbol") {
          const status = [L_TRUE, L_FALSE, L_UNDEF].find(
            (innerStatus) => getVerdict(innerStatus) === value.text,
          );
          if (status === undefined) throw new SmtParseError("invalid ':status' attribute", value);
          settings.status = status;
        }
        if (list.items[3] !== undefined)
          throw new SmtParseError("invalid command, too many arguments", list.items[3]);
      },
    ],
  ]);
  const run = (list: SmtList) => {
    const head = list.items[0];
    if (!isSymbol(head))
      throw new SmtParseError("invalid command, symbol expected", head ?? list.end);
    const command = DECLARATIONS.has(head.text)
      ? (declaration: SmtList) => state.reader.declareCommand(declaration)
      : runCommand.get(head.text);
    if (command === undefined && UNPORTED_COMMANDS.has(head.text))
      throw new SmtUnsupportedError(`the command ${head.text}`);
    if (command === undefined) {
      expectClosed(list);
      print("unsupported");
      printDiagnostic(`; ${head.text} line: ${list.end.line} position: ${list.end.column}`);
      return;
    }
    // Z3's scoped_timer ends with the command that set it, so a command starts without one.
    state.manager.limit.restart(Infinity);
    if (!MANAGERLESS_COMMANDS.has(head.text) && state.isProofsEnabled === undefined) {
      state.isProofsEnabled = settings.parameters.get("proof") === "true";
      // cmd_context::init_manager_core installs the names of the sequence plugin, which makes its sorts, and
      // declares List without a logic.
      if (state.logic === undefined || logicHasSeq(state.logic)) state.manager.initSeqPlugin();
      if (state.logic === undefined) state.reader.registerList();
      resetKernel();
    }
    try {
      command(list);
    } catch (error) {
      if (!(error instanceof SmtDefaultError)) throw error;
      throw new SmtParseError(error.message, list.end);
    }
    if (settings.isPrintingSuccess && SILENT_COMMANDS.has(head.text)) print("success");
  };
  for (;;) {
    try {
      const list = commands.readCommand();
      if (list === undefined) break;
      if (isSymbol(list.items[0], "exit")) {
        checkArgumentCount(list, 0);
        if (settings.isPrintingSuccess) print("success");
        break;
      }
      run(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      if (settings.isExitingOnError) break;
      state.reader.reset();
      commands.skip(report);
    }
  }
  if (pendingText !== "") printLine(pendingText);
};

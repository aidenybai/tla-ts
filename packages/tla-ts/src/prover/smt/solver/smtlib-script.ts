// Ported from Z3 (src/cmd_context/cmd_context.cpp, src/cmd_context/basic_cmds.cpp), MIT license,
// see z3-license.txt.
import { ENCODINGS, UNICODE_ENCODING } from "./seq-decl-plugin";
import {
  isStackOverflow,
  SmtCanceledError,
  SmtParseError,
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
import { Goal, PRECISION_NAMES } from "./goal";
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
  isSymbol,
  type SExpr,
  type SmtList,
  type SmtlibReader,
} from "./smtlib-parser";
import { O_MAXIMIZE, O_MAXSMT, O_MINIMIZE, OptContext, type OptObjective } from "./opt-context";
import { getLogicStrategy } from "./logic-tactics";
import { isMbqiByFeatures, isMbqiByLogic } from "./smt-setup";
import { isSupportedLogic } from "./smt-logics";
import { getVerdict, solveAssertions, solveAssuming } from "./solver";
import { getConsequences } from "./smt-consequences";
import { getFdConsequences } from "./fd-solver";
import { SmtKernel } from "./smt-kernel";
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
  type TacticParam,
} from "./tactic";

const SILENT_COMMANDS = new Set([
  ...DECLARATIONS,
  "assert",
  "push",
  "pop",
  "reset",
  "reset-assertions",
  "set-option",
  "set-info",
  "minimize",
  "maximize",
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
    const name = keyword.kind === "keyword" ? getParameterName(keyword.text) : "";
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
    const name = keyword.kind === "keyword" ? getParameterName(keyword.text) : "";
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
      params.set(name, Number(value.text));
    }
  }
  return params;
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
  model: ProtoModel | undefined;
  core: number[] | undefined;
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
}

// Z3 fixes the proof mode at the first command that needs terms.
const MANAGERLESS_COMMANDS = new Set([
  "set-option",
  "set-info",
  "set-logic",
  "get-option",
  "get-info",
  "echo",
]);

export const runSmtlibScript = (
  text: string,
  options: DecideOptions,
  print: (line: string, isDiagnostic?: boolean) => void,
) => {
  const commands = createCommandReader(text);
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
  };
  const createState = (): ScriptState => {
    const manager = new AstManager(
      new ResourceLimit(Date.now() + options.timeLimitMs, options.signal),
    );
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
    };
  };
  const script = { state: createState() };
  const getPrintEnvironment = () => ({
    options: settings.printOptions,
    isUsed: script.state.reader.isUsed,
    isClashing: script.state.reader.isClashing,
  });
  const format = (expr: number) => printExpr(script.state.manager, getPrintEnvironment(), expr);
  const display = (expr: number) => print(format(expr));
  const report = (error: SmtParseError) =>
    print(`(error "line ${error.line} column ${error.column}: ${error.message}")`);
  const getNamedAssertions = () => {
    const state = script.state;
    const manager = state.manager;
    const isNamed = state.names.some((name) => name !== -1);
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
  const optimize = (extra: number[]) => {
    const state = script.state;
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
      },
      objectives,
    );
    const optimizer = state.optimizer;
    clearCheck();
    state.manager.limit.push(settings.rlimit);
    try {
      const hasAssumptions = extra.length > 0 || state.names.some((name) => name !== -1);
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
      optimizer.model?.incRef();
      state.check = {
        status,
        context: undefined,
        isOptimizing: true,
        model: optimizer.model ?? undefined,
        core: undefined,
      };
      print(getVerdict(status));
      return true;
    } catch (error) {
      // The unported parts of optimization keep the answer of the hard constraints.
      if (error instanceof SmtUnsupportedError) {
        resetOptimizer();
        return false;
      }
      if (!(error instanceof SmtCanceledError || isStackOverflow(error))) throw error;
      optimizer.release();
      state.check = {
        status: L_UNDEF,
        context: undefined,
        isOptimizing: true,
        model: undefined,
        core: undefined,
      };
      print("unknown");
      return true;
    } finally {
      state.manager.limit.pop();
      for (const form of pinned) manager.decRef(form);
    }
  };
  const resetOptimizer = () => {
    script.state.optimizer?.release();
    script.state.optimizer = undefined;
  };
  // The port keeps answering with the smt kernel where it lacks a piece of the logic's strategy.
  const solveWithStrategy = () => {
    const state = script.state;
    const goal = getGoal();
    const strategy =
      settings.parameters.get("tactic.default_tactic") ??
      getLogicStrategy(state.logic, goal.isProofsEnabled);
    try {
      const checked = checkSatUsing(compileInternalTactic(getTacticEnvironment(), strategy), goal);
      return { result: checked.status, context: undefined, model: checked.model };
    } catch (error) {
      if (!(error instanceof SmtUnsupportedError)) throw error;
      const hasQuantifiers = state.assertions.some(
        (assertion) => state.manager.hasQuantifierFlags[assertion],
      );
      return {
        ...solveAssertions(state.manager, state.assertions, {
          isMbqi: settings.isMbqi || isMbqiByFeatures(getSetup(), hasQuantifiers),
          mbqiMaxIterations: settings.mbqiMaxIterations,
          isFindingMacros: settings.isFindingMacros,
        }),
        model: undefined,
      };
    }
  };
  const checkSat = (extra: number[]) => {
    const state = script.state;
    state.manager.limit.restart(Date.now() + options.timeLimitMs);
    // opt::context::optimize answers as the search of the hard constraints does: once they are
    // satisfiable, optsmt and maxsmt only improve the model. The unported parts of optimization
    // only get that answer.
    if (state.objectives.length > 0 && optimize(extra)) return;
    state.manager.limit.push(settings.rlimit);
    const isOptimizing = state.objectives.length > 0;
    try {
      const manager = state.manager;
      const names = state.names.filter((name) => name !== -1);
      const isNamed = names.length > 0;
      const isAssuming = isNamed || extra.length > 0;
      if (isAssuming) state.isIncremental = true;
      if (!isOptimizing) state.hasChecked = true;
      // mk_special_solver_for_logic gives these logics the finite-domain solver, incremental or not.
      const isFd =
        (state.logic === "QF_FD" || state.logic === "SAT") &&
        !settings.isProducingProofs &&
        !settings.parameters.has("tactic.default_tactic");
      const kernel =
        isAssuming || (state.isIncremental && !isOptimizing && !isFd)
          ? solveAssuming(manager, getNamedAssertions(), isNamed ? [...names, ...extra] : extra, {
              isMbqi: settings.isMbqi || isMbqiByLogic(getSetup()),
              mbqiMaxIterations: settings.mbqiMaxIterations,
              isFindingMacros: settings.isFindingMacros,
            })
          : undefined;
      // Z3 retries a quantifier-free problem with its tactic when the incremental kernel gives up.
      const solved =
        kernel === undefined ||
        (!isAssuming &&
          kernel.result === L_UNDEF &&
          !state.assertions.some((assertion) => manager.hasQuantifierFlags[assertion]) &&
          manager.limit.inc())
          ? solveWithStrategy()
          : { ...kernel, model: undefined };
      solved.model?.incRef();
      state.check = {
        status: solved.result,
        context: solved.context,
        isOptimizing,
        model: solved.model,
        core: solved.context?.unsatCore ?? [],
      };
      print(getVerdict(solved.result));
    } catch (error) {
      if (!(error instanceof SmtCanceledError || isStackOverflow(error))) throw error;
      state.check = {
        status: L_UNDEF,
        context: undefined,
        isOptimizing,
        model: undefined,
        core: undefined,
      };
      print("unknown");
    } finally {
      state.manager.limit.pop();
    }
  };
  const getModel = (list: SmtList) => {
    const check = script.state.check;
    if (!settings.isProducingModels || check === undefined || check.status === L_FALSE)
      throw new SmtParseError("model is not available", list.end);
    if (check.model !== undefined) return check.model;
    if (check.isOptimizing) throw new SmtUnsupportedError("the models of optimization");
    if (check.context === undefined && check.status !== L_TRUE)
      throw new SmtUnsupportedError("the model of a canceled search");
    const model = check.context?.getModel() ?? new ProtoModel(script.state.manager);
    model.incRef();
    check.model = model;
    return model;
  };
  const clearCheck = () => {
    script.state.check?.model?.decRef();
    script.state.check = undefined;
  };
  let pendingText = "";
  const printDiagnostic = (line: string) => print(line, !settings.isDiagnosticOnStdout);
  const write = (text: string, isDiagnostic: boolean) => {
    const lines = (pendingText + text).split("\n");
    pendingText = lines.pop() ?? "";
    for (const line of lines) (isDiagnostic ? printDiagnostic : print)(line);
  };
  const getSetup = () => ({
    logic: script.state.logic,
    isAutoConfig:
      settings.parameters.get("auto_config") !== "false" &&
      settings.parameters.get("smt.auto_config") !== "false",
  });
  const getTacticEnvironment = () => ({
    manager: script.state.manager,
    isMbqi: settings.isMbqi,
    mbqiMaxIterations: settings.mbqiMaxIterations,
    isFindingMacros: settings.isFindingMacros,
    setup: getSetup(),
    write,
    parameters: settings.parameters,
  });
  const getDatalog = () => {
    const state = script.state;
    state.datalog ??= createDatalogContext(
      state.manager,
      settings.parameters,
      getRewriterOptions(state.manager, new Map()),
    );
    return state.datalog;
  };
  const getTactic = (sexpr: SExpr, end: SmtList["end"]) =>
    compileTactic(getTacticEnvironment(), sexpr, end);
  const getGoal = () => {
    const goal = new Goal(script.state.manager);
    goal.isProofsEnabled = settings.isProducingProofs || script.state.isProofsEnabled === true;
    goal.isCoresEnabled = settings.isProducingUnsatCores;
    for (const assertion of script.state.assertions) goal.assert(assertion);
    return goal;
  };
  const parseFormulas = (items: SmtList["items"]) =>
    items.map((literal) => script.state.reader.parseFormula(literal));
  const addObjective = (list: SmtList, isMax: boolean) => {
    const state = script.state;
    const term = state.reader.parseTerm(list.items[1] ?? list.end);
    const sort = state.manager.sorts[term];
    if (sort !== SORT_INT && sort !== SORT_REAL && !state.manager.isBvSort(sort))
      throw new SmtParseError("Objective must be bit-vector, integer or real", list.end);
    resetOptimizer();
    state.manager.incRef(term);
    state.objectives.push({
      type: isMax ? O_MAXIMIZE : O_MINIMIZE,
      term,
      terms: [],
      weights: [],
      id: null,
    });
  };
  const releaseObjectives = (size: number, softSize: number) => {
    const state = script.state;
    for (const index of state.softTrail.splice(softSize).reverse()) {
      const objective = state.objectives[index];
      state.manager.decRef(objective.terms.pop() as number);
      objective.weights.pop();
    }
    for (const objective of state.objectives.splice(size))
      if (objective.type !== O_MAXSMT) state.manager.decRef(objective.term);
  };
  const restoreAssertions = (size: number) => {
    const state = script.state;
    for (const assertion of state.assertions.splice(size)) state.manager.decRef(assertion);
    for (const name of state.names.splice(size)) if (name !== -1) state.manager.decRef(name);
    state.assertionTexts.length = size;
  };
  const instantiate = (list: SmtList, isNested: boolean) => {
    const state = script.state;
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
  const runCommand: Record<string, (list: SmtList) => void> = {
    assert: (list) => {
      const state = script.state;
      const term = list.items[1] ?? list.end;
      const assertion = state.reader.parseAssertion(term);
      const logicError = state.reader.getLogicError(assertion.formula);
      if (logicError !== undefined) {
        state.manager.decRef(assertion.formula);
        throw new SmtParseError(logicError, list.end);
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
      clearCheck();
    },
    "check-sat": (list) => checkSat(parseFormulas(list.items.slice(1))),
    "declare-rel": (list) => {
      const state = script.state;
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
    "declare-var": (list) => {
      const state = script.state;
      const name = list.items[1];
      const sort = list.items[2];
      if (!isSymbol(name) || sort === undefined)
        throw new SmtParseError("invalid declare-var command, symbol and sort expected", list.end);
      const manager = state.manager;
      const range = state.reader.parseSort(sort);
      const decl = manager.mkFuncDecl(name.text, [], range);
      state.reader.insertFunc(decl, list.end);
      getDatalog().registerVariable(manager.mkApp(decl, [], range));
    },
    rule: (list) => {
      const rule = list.items[1];
      if (rule === undefined) throw new SmtParseError("invalid rule, expected formula", list.end);
      const name = list.items[2];
      getDatalog().addRule(script.state.reader.parseFormula(rule), isSymbol(name) ? name.text : "");
    },
    query: (list) => {
      const state = script.state;
      const target = list.items[1];
      if (!isSymbol(target))
        throw new SmtParseError("invalid query command, argument expected", list.end);
      const decls = state.reader.getFuncs(target.text);
      if (decls.length !== 1)
        throw new SmtParseError(
          `invalid function declaration reference, unknown function ${target.text}`,
          target,
        );
      const datalog = getDatalog();
      const relation = decls[0];
      if (!datalog.isPredicateDecl(relation))
        throw new SmtParseError(
          "Invalid query argument, expected a predicate registered as a relation",
          target,
        );
      for (const assertion of state.assertions) datalog.assertExpr(assertion);
      state.manager.limit.restart(Date.now() + options.timeLimitMs);
      state.manager.limit.push(settings.rlimit);
      try {
        print(getVerdict(datalog.relQuery(relation)));
      } finally {
        state.manager.limit.pop();
      }
    },
    "check-sat-using": (list) => {
      const state = script.state;
      const params = getCommandParams(list.items, CHECK_SAT_USING_PARAMETERS);
      if (list.items[1] === undefined)
        throw new SmtParseError("check-sat-using needs a tactic argument", list.end);
      const tactic = getTactic(list.items[1], list.end).build(params);
      clearCheck();
      state.manager.limit.restart(Date.now() + options.timeLimitMs);
      state.manager.limit.push(settings.rlimit);
      try {
        const checked = checkSatUsing(tactic, getGoal());
        checked.model?.incRef();
        state.check = {
          status: checked.status,
          context: undefined,
          isOptimizing: false,
          model: checked.model,
          core: state.names.some((name) => name !== -1) ? undefined : [],
        };
        print(getVerdict(checked.status));
      } finally {
        state.manager.limit.pop();
      }
    },
    "check-sat-assuming": (list) => {
      const literals = list.items[1];
      if (literals?.kind !== "list")
        throw new SmtParseError(
          "invalid check-sat-assuming command, '(' expected",
          literals ?? list.end,
        );
      checkSat(parseFormulas(literals.items));
    },
    "get-consequences": (list) => {
      const state = script.state;
      const manager = state.manager;
      const [assumptions, vars] = [list.items[1], list.items[2]].map((terms) => {
        if (terms === undefined)
          throw new SmtParseError("invalid command, argument(s) missing", list.end);
        if (terms.kind !== "list")
          throw new SmtParseError("invalid list of terms, '(' expected", terms);
        return terms.items.map((item) => state.reader.parseTerm(item));
      });
      if (list.items.length > 3)
        throw new SmtParseError("invalid command, too many arguments", list.items[3]);
      clearCheck();
      manager.limit.restart(Date.now() + options.timeLimitMs);
      manager.limit.push(settings.rlimit);
      const names = state.names.filter((name) => name !== -1);
      const isFd =
        (state.logic === "QF_FD" || state.logic === "SAT") &&
        !settings.isProducingProofs &&
        !settings.parameters.has("tactic.default_tactic");
      try {
        if (isFd) {
          if (names.length > 0)
            throw new SmtUnsupportedError("the named assertions of the finite-domain solver");
          const found = getFdConsequences(manager, new Map(), state.assertions, assumptions, vars);
          found.model?.incRef();
          state.check = {
            status: found.result,
            context: undefined,
            isOptimizing: false,
            model: found.model,
            core: undefined,
          };
          print(getVerdict(found.result));
          print("");
          for (const consequence of found.consequences.items) display(consequence);
          found.consequences.reset();
          return;
        }
        const kernel = new SmtKernel(manager, {
          isMbqi: settings.isMbqi || isMbqiByLogic(getSetup()),
          mbqiMaxIterations: settings.mbqiMaxIterations,
          isFindingMacros: settings.isFindingMacros,
        });
        for (const assertion of getNamedAssertions()) kernel.assertExpr(assertion);
        const found = getConsequences(kernel, [...names, ...assumptions], vars);
        state.check = {
          status: found.result,
          context: kernel.context,
          isOptimizing: false,
          model: undefined,
          core: kernel.context.unsatCore,
        };
        print(getVerdict(found.result));
        print("");
        for (const consequence of found.consequences.items) display(consequence);
        found.consequences.reset();
      } finally {
        manager.limit.pop();
      }
    },
    minimize: (list) => addObjective(list, false),
    maximize: (list) => addObjective(list, true),
    "assert-soft": (list) => {
      const state = script.state;
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
    push: (list) => {
      const state = script.state;
      clearCheck();
      for (let index = getScopeCount(list); index > 0; index--) {
        state.scopes.push({
          assertions: state.assertions.length,
          objectives: state.objectives.length,
          softTrail: state.softTrail.length,
        });
        state.reader.push();
        state.isIncremental = true;
      }
    },
    pop: (list) => {
      const state = script.state;
      const count = getScopeCount(list);
      if (count > state.scopes.length)
        throw new SmtParseError(
          "invalid pop command, argument is greater than the current stack depth",
          list.end,
        );
      clearCheck();
      if (count === 0) return;
      state.isIncremental = true;
      const scope = state.scopes[state.scopes.length - count];
      for (let index = 0; index < count; index++) state.reader.pop();
      restoreAssertions(scope.assertions);
      resetOptimizer();
      releaseObjectives(scope.objectives, scope.softTrail);
      state.scopes.length -= count;
    },
    reset: () => {
      clearCheck();
      resetOptimizer();
      script.state = createState();
    },
    "reset-assertions": () => {
      const state = script.state;
      clearCheck();
      restoreAssertions(0);
      resetOptimizer();
      releaseObjectives(0, 0);
      state.scopes = state.scopes.map(() => ({ assertions: 0, objectives: 0, softTrail: 0 }));
      state.isIncremental = state.scopes.length > 0;
      state.hasChecked = false;
    },
    simplify: (list) => {
      const manager = script.state.manager;
      if (list.items.length < 2)
        throw new SmtParseError("invalid simplify command, argument expected", list.end);
      const term = script.state.reader.parseTerm(list.items[1]);
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
    // The Boolean rewriter alone matches the simplifier only on Boolean structure over constants.
    "dbg-bool-flat-rewriter": (list) => {
      const manager = script.state.manager;
      if (list.items.length !== 2)
        throw new SmtParseError("invalid command, one argument expected", list.end);
      const term = script.state.reader.parseTerm(list.items[1]);
      manager.incRef(term);
      const visited = new Set<number>();
      const todo = [term];
      while (todo.length > 0) {
        const expr = todo.pop() as number;
        if (visited.has(expr)) continue;
        visited.add(expr);
        const family = manager.kinds[expr] === KIND_APP ? manager.getFamily(expr) : -1;
        if (family !== FAMILY_BASIC && family !== FAMILY_USER && !manager.isNumeral(expr))
          throw new SmtUnsupportedError("the command dbg-bool-flat-rewriter beyond Boolean terms");
        manager.pushArgs(expr, todo);
      }
      const rewriter = new Rewriter(manager, getRewriterOptions(manager, new Map()));
      const rewritten = rewriter.rewrite(term);
      display(rewritten);
      rewriter.release();
      manager.decRef(rewritten);
      manager.decRef(term);
    },
    apply: (list) => {
      const state = script.state;
      const params = getCommandParams(list.items, APPLY_PARAMETERS);
      if (list.items[1] === undefined)
        throw new SmtParseError("apply needs a tactic argument", list.end);
      const tactic = getTactic(list.items[1], list.end).build(params);
      if (params.get("print_dependencies") === true)
        throw new SmtUnsupportedError("the parameter :print_dependencies");
      state.manager.limit.restart(Date.now() + options.timeLimitMs);
      const input = getGoal();
      const goals = (() => {
        try {
          return applyTactic(tactic, input);
        } catch (error) {
          if (!(error instanceof SmtTacticError)) throw error;
          print(`(error "tactic failed: ${error.message}")`);
          return undefined;
        }
      })();
      if (goals === undefined) return;
      const manager = state.manager;
      const environment = getPrintEnvironment();
      if (params.get("print") !== false)
        print(
          [
            "(goals",
            ...goals.map((goal) =>
              [
                "(goal",
                ...goal.forms.items.map(
                  (form) => `  ${printExpr(state.manager, environment, form, 2)}`,
                ),
                `  :precision ${PRECISION_NAMES[goal.precision]} :depth ${goal.depth})`,
              ].join("\n"),
            ),
            ")",
          ].join("\n"),
        );
      if (
        params.get("print_model_converter") === true &&
        input.converters.some((entry) => !("definitions" in entry) || entry.definitions.length > 0)
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
        while (todo.length > 0) {
          const expr = todo.pop() as number;
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
    },
    "get-assertions": (list) => {
      if (!settings.isInteractive)
        throw new SmtParseError(
          "command is only available in interactive mode, use command (set-option :interactive-mode true)",
          list.end,
        );
      print(`(${script.state.assertionTexts.join("\n ")})`);
    },
    "get-unsat-core": (list) => {
      if (!settings.isProducingUnsatCores)
        throw new SmtParseError(
          "unsat core construction is not enabled, use command (set-option :produce-unsat-cores true)",
          list.end,
        );
      const check = script.state.check;
      if (check === undefined || check.status !== L_FALSE)
        throw new SmtParseError("unsat core is not available", list.end);
      if (check.core === undefined) throw new SmtUnsupportedError("the unsat cores of tactics");
      print(`(${check.core.map(format).join(" ")})`);
    },
    eval: (list) => {
      const target = list.items[1];
      const term = target === undefined ? -1 : script.state.reader.parseTerm(target);
      if (list.items.length > 2) throw new SmtUnsupportedError("the parameters of eval");
      const model = getModel(list);
      if (term === -1) throw new SmtParseError("no arguments passed to eval", list.end);
      const manager = script.state.manager;
      manager.incRef(term);
      const value = model.eval(term, false);
      display(value);
      manager.decRef(value);
      manager.decRef(term);
    },
    "get-value": (list) => {
      const terms = list.items[1];
      if (terms?.kind !== "list")
        throw new SmtParseError("invalid get-value command, '(' expected", terms ?? list.end);
      const manager = script.state.manager;
      const exprs = terms.items.map((item) => script.state.reader.parseTerm(item));
      if (exprs.length === 0)
        throw new SmtParseError("invalid get-value command, empty list of terms", terms.end);
      if (list.items.length > 2) throw new SmtUnsupportedError("the parameters of get-value");
      const model = getModel(list);
      model.compress();
      // Z3 prints each term as the script spells it, from the end of the term before.
      const offsets = [
        terms.offset + 1,
        ...terms.items.map((item) => (item.kind === "list" ? item.end : item).endOffset),
      ];
      const lines = exprs.map((expr, index) => {
        manager.incRef(expr);
        const value = model.eval(expr, true);
        const line = `(${text.slice(offsets[index], offsets[index + 1]).trim()} ${format(value)})`;
        manager.decRef(value);
        manager.decRef(expr);
        return line;
      });
      print(`(${lines.join("\n ")})`);
    },
    "get-objectives": () => {
      const optimizer = script.state.optimizer;
      if (optimizer === undefined || script.state.check === undefined)
        throw new SmtUnsupportedError("the command get-objectives");
      print(optimizer.getObjectives(format));
    },
    "get-model": (list) => {
      if (list.items.length > 1) throw new SmtUnsupportedError("the index of get-model");
      const manager = script.state.manager;
      const model = getModel(list);
      model.compress();
      for (const decl of script.state.reader.getDeclaredFuncs()) {
        const funcDecl = manager.funcDecls[decl];
        if (
          funcDecl.family !== FAMILY_USER ||
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
      print(`(\n${printModel(manager, getPrintEnvironment(), model, 2)})`);
    },
    display: (list) => display(script.state.reader.parseTerm(list.items[1] ?? list.end)),
    "dbg-lt": (list) => {
      const state = script.state;
      const first = state.reader.parseTerm(list.items[1] ?? list.end);
      const second = state.reader.parseTerm(list.items[2] ?? list.end);
      print(String(isAstLess(state.manager, first, second)));
    },
    "dbg-some-value": (list) => {
      const state = script.state;
      display(
        getManagerSomeValue(state.manager, state.reader.parseSort(list.items[1] ?? list.end)),
      );
    },
    "dbg-used-vars": (list) => {
      const manager = script.state.manager;
      const term = script.state.reader.parseTerm(list.items[1] ?? list.end);
      const body =
        manager.kinds[term] === KIND_QUANTIFIER ? manager.getQuantifier(term).body : term;
      const sorts = getFreeVarSorts(manager, body, manager.freeVarBounds[body]);
      const lines = sorts.map(
        (sort, index) =>
          `\n  (${String(index).padEnd(6)} ${sort === undefined ? "<not-used>" : renderFormat(formatSort(manager, sort), settings.printOptions)})`,
      );
      print(`(vars${lines.join("")})`);
    },
    "dbg-elim-unused-vars": (list) => {
      const manager = script.state.manager;
      const term = script.state.reader.parseTerm(list.items[1] ?? list.end);
      if (manager.kinds[term] !== KIND_QUANTIFIER) {
        write(format(term), false);
        return;
      }
      display(elimUnusedVars(manager, term));
    },
    "dbg-instantiate": (list) => instantiate(list, false),
    "dbg-instantiate-nested": (list) => instantiate(list, true),
    echo: (list) => {
      const message = list.items[1];
      if (message?.kind !== "string")
        throw new SmtParseError("invalid echo command, string expected", message ?? list.end);
      print(message.text);
    },
    "set-option": (list) => {
      const option = list.items[1];
      const keyword = option?.kind === "keyword" ? option.text : "";
      const optionName = `:${getParameterName(keyword)}`;
      const value = list.items[2];
      const isTrue = isSymbol(value, "true");
      if (keyword === ":produce-models") settings.isProducingModels = isTrue;
      if (keyword === ":produce-unsat-cores") settings.isProducingUnsatCores = isTrue;
      if (keyword === ":produce-proofs") settings.isProducingProofs = isTrue;
      if (keyword === ":interactive-mode") settings.isInteractive = isTrue;
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
      if (
        keyword !== "" &&
        !BUILTIN_OPTIONS.has(keyword) &&
        value !== undefined &&
        value.kind !== "list"
      )
        settings.parameters.set(getParameterName(keyword), value.text);
      if (optionName === ":print_success") settings.isPrintingSuccess = isTrue;
      if (!BUILTIN_OPTIONS.has(keyword) && settings.parameters.get("smtlib2_compliant") === "true")
        settings.isPrintingSuccess = true;
      if (optionName === ":smt.mbqi") settings.isMbqi = isTrue;
      if (optionName === ":smt.macro_finder") settings.isFindingMacros = isTrue;
      if (optionName === ":smt.mbqi.max_iterations" && value?.kind === "numeral")
        settings.mbqiMaxIterations = Number(value.text);
      if (optionName === ":rlimit" && value?.kind === "numeral")
        settings.rlimit = Number(value.text);
      if (optionName === ":rewriter.hi_div0") {
        settings.isHiDiv0 = isTrue;
        script.state.manager.isHiDiv0 = isTrue;
      }
      if (optionName === ":encoding" && value !== undefined && value.kind !== "list") {
        settings.encoding = ENCODINGS.get(value.text) ?? UNICODE_ENCODING;
        script.state.manager.maxChar = settings.encoding.maxChar;
        script.state.manager.charBits = settings.encoding.charBits;
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
    "get-option": (list) => {
      const option = list.items[1];
      if (option?.kind !== "keyword")
        throw new SmtParseError("invalid command argument, keyword expected", option ?? list.end);
      const builtinValues = new Map<string, boolean | string>([
        [":print-success", settings.isPrintingSuccess],
        [":produce-models", settings.isProducingModels],
        [":produce-unsat-cores", settings.isProducingUnsatCores],
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
    "get-info": (list) => {
      const info = list.items[1];
      if (info?.kind !== "keyword")
        throw new SmtParseError("invalid command argument, keyword expected", info ?? list.end);
      const optimizer = script.state.optimizer;
      if (
        info.text === ":reason-unknown" &&
        script.state.check?.status === L_UNDEF &&
        optimizer !== undefined &&
        optimizer.reasonUnknown !== ""
      ) {
        print(`(:reason-unknown "${optimizer.reasonUnknown}")`);
        return;
      }
      if (info.text !== ":error-behavior")
        throw new SmtUnsupportedError(`the information ${info.text}`);
      print(
        `(:error-behavior ${settings.isExitingOnError ? "immediate-exit" : "continued-execution"})`,
      );
    },
    "set-logic": (list) => {
      const state = script.state;
      const logic = list.items[1];
      if (!isSymbol(logic))
        throw new SmtParseError("invalid logic name, symbol expected", logic ?? list.end);
      if (state.logic !== undefined)
        throw new SmtParseError("the logic has already been set", list.end);
      if (state.assertions.length > 0)
        throw new SmtParseError("logic must be set before initialization", list.end);
      if (!isSupportedLogic(logic.text)) {
        print("unsupported");
        printDiagnostic(
          `; ignoring unsupported logic ${logic.text} line: ${list.line} position: ${list.column}`,
        );
        return;
      }
      state.logic = logic.text;
      state.reader = createSmtlibReader(state.manager, logic.text, settings.parserOptions);
      if (settings.isPrintingSuccess) print("success");
    },
    "set-info": () => {},
  };
  const run = (list: SmtList) => {
    const head = list.items[0];
    if (!isSymbol(head))
      throw new SmtParseError("invalid command, symbol expected", head ?? list.end);
    const command = DECLARATIONS.has(head.text)
      ? (declaration: SmtList) => script.state.reader.declareCommand(declaration)
      : runCommand[head.text];
    if (command === undefined) throw new SmtUnsupportedError(`the command ${head.text}`);
    if (!MANAGERLESS_COMMANDS.has(head.text))
      script.state.isProofsEnabled ??= settings.parameters.get("proof") === "true";
    command(list);
    if (settings.isPrintingSuccess && SILENT_COMMANDS.has(head.text)) print("success");
  };
  for (;;) {
    try {
      const list = commands.read();
      if (list === undefined || isSymbol(list.items[0], "exit")) return;
      run(list);
    } catch (error) {
      if (!(error instanceof SmtParseError)) throw error;
      report(error);
      if (settings.isExitingOnError) return;
      commands.skip(report);
    }
  }
};

// Ported from Z3 (src/cmd_context/tactic_cmds.cpp, src/tactic/tactical.cpp, src/tactic/tactic.cpp),
// MIT license, see z3-license.txt.
import {
  SmtCanceledError,
  SmtParseError,
  SmtTacticError,
  SmtUnsupportedError,
} from "../../../errors";
import type { AstManager } from "./ast";
import { ctxSimplify } from "./ctx-simplify";
import type { Goal } from "./goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { propagateValues } from "./propagate-values";
import { ProtoModel } from "./proto-model";
import { simplifyGoal } from "./quant-tactics";
import { type RewriterOptions, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { isSymbol, type SExpr, type SmtList, type SmtToken } from "./smtlib-parser";
import { solveGoal } from "./solver";

const PARAM_BOOL = 0;
const PARAM_UINT = 1;

export type TacticParam = boolean | number | string;
export type TacticParams = ReadonlyMap<string, TacticParam>;

interface ParamDescr {
  kind: number;
  module: string;
  defaultValue: TacticParam;
  isPorted: boolean;
}

type ParamDescrs = ReadonlyMap<string, ParamDescr>;

export interface Tactic {
  (goal: Goal): Goal[];
}

export interface TacticEnvironment {
  manager: AstManager;
  isMbqi: boolean;
}

interface TacticBuilder {
  descrs: ParamDescrs;
  isRejectingUnknown: boolean;
  build: (params: TacticParams) => Tactic;
}

interface NamedTactic {
  descrs: ParamDescrs;
  isRejectingUnknown?: boolean;
  build: (environment: TacticEnvironment, params: TacticParams) => Tactic;
}

const getDescrs = (module: string, entries: [string, number, TacticParam, boolean?][]) =>
  new Map(
    entries.map(([name, kind, defaultValue, isPorted]) => [
      name,
      { kind, module, defaultValue, isPorted: isPorted ?? false },
    ]),
  );

const UINT_MAX = 4294967295;

const REWRITER_DESCRS = getDescrs("rewriter", [
  ["ite_extra_rules", PARAM_BOOL, true],
  ["flat", PARAM_BOOL, true],
  ["flat_and_or", PARAM_BOOL, true],
  ["sort_disjunctions", PARAM_BOOL, true],
  ["elim_and", PARAM_BOOL, false, true],
  ["elim_ite", PARAM_BOOL, true],
  ["local_ctx", PARAM_BOOL, false],
  ["local_ctx_limit", PARAM_UINT, UINT_MAX],
  ["blast_distinct", PARAM_BOOL, false, true],
  ["blast_distinct_threshold", PARAM_UINT, UINT_MAX],
  ["som", PARAM_BOOL, false, true],
  ["som_blowup", PARAM_UINT, 10],
  ["hoist_mul", PARAM_BOOL, false],
  ["hoist_ite", PARAM_BOOL, false],
  ["algebraic_number_evaluator", PARAM_BOOL, true],
  ["mul_to_power", PARAM_BOOL, false],
  ["expand_power", PARAM_BOOL, false],
  ["expand_tan", PARAM_BOOL, false],
  ["max_degree", PARAM_UINT, 64],
  ["sort_sums", PARAM_BOOL, false, true],
  ["gcd_rounding", PARAM_BOOL, false, true],
  ["arith_lhs", PARAM_BOOL, false, true],
  ["arith_ineq_lhs", PARAM_BOOL, false],
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
  ["sort_store", PARAM_BOOL, false],
  ["max_memory", PARAM_UINT, UINT_MAX, true],
  ["max_steps", PARAM_UINT, UINT_MAX],
  ["push_ite_arith", PARAM_BOOL, false],
  ["push_ite_bv", PARAM_BOOL, false],
  ["pull_cheap_ite", PARAM_BOOL, false, true],
  ["bv_ineq_consistency_test_max", PARAM_UINT, 0],
  ["unfold_recursive_functions", PARAM_BOOL, false],
  ["cache_all", PARAM_BOOL, false],
  ["enable_der", PARAM_BOOL, true],
  ["rewrite_patterns", PARAM_BOOL, false],
  ["ignore_patterns_on_ground_qbody", PARAM_BOOL, true],
]);

const getBool = (params: TacticParams, name: string, defaultValue: boolean) => {
  const value = params.get(name);
  return typeof value === "boolean" ? value : defaultValue;
};

const getUint = (params: TacticParams, name: string, defaultValue: number) => {
  const value = params.get(name);
  return typeof value === "number" ? value : defaultValue;
};

export const getRewriterOptions = (manager: AstManager, params: TacticParams): RewriterOptions => ({
  ...TACTIC_REWRITER_OPTIONS,
  isEliminatingAnd: getBool(params, "elim_and", false),
  isPullingCheapIte: getBool(params, "pull_cheap_ite", false),
  isKeepingDistinct: !getBool(params, "blast_distinct", false),
  arith: {
    isSom: getBool(params, "som", false),
    isSortSums: getBool(params, "sort_sums", false),
    isArithIneqLhs: getBool(params, "arith_lhs", false),
    isGcdRounding: getBool(params, "gcd_rounding", false),
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
  ["arith.nl.rounds", PARAM_UINT, 1024, true],
]);

const runSmt = (environment: TacticEnvironment, params: TacticParams) => (goal: Goal) => {
  const solved = solveGoal(
    environment.manager,
    goal.forms.items,
    getBool(params, "mbqi", environment.isMbqi),
  );
  if (solved.result === L_UNDEF) throw new SmtTacticError(solved.context.getLastFailureMessage());
  goal.reset();
  if (solved.result === L_FALSE) goal.assert(environment.manager.falseExpr);
  else goal.model = solved.context.getModel();
  return [goal];
};

const inPlace = (run: (goal: Goal) => void) => (goal: Goal) => {
  run(goal);
  return [goal];
};

const NAMED_TACTICS = new Map<string, NamedTactic>([
  [
    "simplify",
    {
      descrs: REWRITER_DESCRS,
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
      build: (environment, params) =>
        inPlace((goal) =>
          propagateValues(environment.manager, goal, getUint(params, "max_rounds", 4)),
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
  ["smt", { descrs: SMT_DESCRS, isRejectingUnknown: false, build: runSmt }],
  ["skip", { descrs: new Map(), build: () => (goal) => [goal] }],
  [
    "fail",
    {
      descrs: new Map(),
      build: () => () => {
        throw new SmtTacticError("fail tactic");
      },
    },
  ],
  [
    "fail-if-undecided",
    {
      descrs: new Map(),
      build: () => (goal) => {
        if (!goal.isDecided()) throw new SmtTacticError("undecided");
        return [goal];
      },
    },
  ],
]);

const UNPORTED_TACTICS = new Set(
  (
    "ackermannize_bv add-bounds aig auflia auflira aufnira bit-blast blast-term-ite bv " +
    "bv_bound_chk bv-divrem-bounds bv-slice bv1-blast bvarray2uf card2bv cofactor-term-ite " +
    "collect-statistics ctx-solver-simplify default degree-shift demodulator der diff-neq " +
    "distribute-forall dom-simplify dt2bv elim-predicates elim-small-bv elim-term-ite " +
    "elim-uncnstr elim-uncnstr2 eq2bv euf-completion factor ff-sat ff-simplify ff-solve " +
    "ff-unique ff2bv fix-dl-var fm fold-unfold fpa2bv horn horn-simplify injectivity lia " +
    "lia2card lia2pb lira lra macro-finder max-bv-sharing nla2bv nlqsat nlsat nnf " +
    "normalize-bounds nra occf pb-preprocess pb2bv pqffd propagate-bv-bounds " +
    "propagate-bv-bounds2 propagate-ineqs propagate-values2 psat psmt purify-arith qe qe_rec " +
    "qe-light qe2 qfaufbv qfauflia qfbv qfbv-sls qffd qffp qffpbv qffplra qfidl qflia qflra " +
    "qfnia qfnra qfnra-nlsat qfuf qfufbv qfufbv_ackr qsat quasi-macros recover-01 reduce-args " +
    "reduce-args2 reduce-bv-size sat sat-preprocess sls-smt smtfd snf solve-eqs " +
    "solver-subsumption special-relations split-clause subpaving symmetry-reduce tseitin-cnf " +
    "tseitin-cnf-core ufbv ufbv-rewriter uflra ufnia unit-subsume-simplify"
  ).split(" "),
);

const isUnsigned = (sexpr: SExpr | undefined): sexpr is SmtToken =>
  sexpr?.kind === "numeral" && BigInt(sexpr.text) <= BigInt(UINT_MAX);

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

const getParams = (
  builder: TacticBuilder,
  items: SExpr[],
  end: SmtToken,
): Map<string, TacticParam> => {
  const params = new Map<string, TacticParam>();
  for (let index = 2; index < items.length; index += 2) {
    const keyword = items[index];
    if (keyword.kind !== "keyword")
      throw new SmtParseError("invalid using-params combinator, keyword expected", end);
    const value = items[index + 1];
    if (value === undefined)
      throw new SmtParseError("invalid using-params combinator, parameter value expected", end);
    const found = findParam(builder.descrs, getParamName(keyword.text));
    if (found === undefined) {
      if (!builder.isRejectingUnknown)
        throw new SmtUnsupportedError(`the parameter ${keyword.text} of the tactic`);
      throw new SmtParseError(
        `invalid using-params combinator, unknown parameter ${getParamName(keyword.text)}`,
        end,
      );
    }
    const parsed =
      found.descr.kind === PARAM_BOOL
        ? isSymbol(value, "true") || (isSymbol(value, "false") ? false : undefined)
        : found.descr.kind === PARAM_UINT
          ? isUnsigned(value)
            ? Number(value.text)
            : undefined
          : isSymbol(value)
            ? value.text
            : undefined;
    if (parsed === undefined)
      throw new SmtParseError(
        found.descr.kind === PARAM_BOOL
          ? "invalid parameter value, true or false expected"
          : found.descr.kind === PARAM_UINT
            ? "invalid parameter value, unsigned integer expected"
            : "invalid parameter value, symbol expected",
        end,
      );
    if (!found.descr.isPorted && parsed !== found.descr.defaultValue)
      throw new SmtUnsupportedError(`the parameter ${found.name} of the tactic`);
    params.set(found.name, parsed);
  }
  return params;
};

const mergeDescrs = (builders: TacticBuilder[]) => ({
  descrs: new Map(builders.flatMap((builder) => [...builder.descrs])),
  isRejectingUnknown: builders.every((builder) => builder.isRejectingUnknown),
});

const isDecidedSat = (goals: Goal[]) => goals.length === 1 && goals[0].isDecidedSat();

const isDecidedUnsat = (goals: Goal[]) => goals.length === 1 && goals[0].isDecidedUnsat();

const runAndThen = (first: Tactic, second: Tactic) => (goal: Goal) => {
  const goals = first(goal);
  if (goals.length === 1) return goals[0].isDecided() ? goals : second(goals[0]);
  const results: Goal[] = [];
  for (const subgoal of goals) {
    const subresults = second(subgoal);
    if (isDecidedSat(subresults)) return subresults;
    if (!isDecidedUnsat(subresults)) results.push(...subresults);
  }
  if (results.length > 0) return results;
  goal.resetAll();
  goal.assert(goal.manager.falseExpr);
  return [goal];
};

const runOrElse = (tactics: Tactic[]) => (goal: Goal) => {
  const original = goal.copy();
  for (const tactic of tactics.slice(0, -1)) {
    try {
      return tactic(goal);
    } catch (error) {
      if (!(error instanceof SmtTacticError)) throw error;
    }
    goal.resetAll();
    goal.copyFrom(original);
  }
  return (tactics.at(-1) as Tactic)(goal);
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
    const goals = tactic(goal);
    if (goals.length === 1 && isEqualGoal(original, goals[0])) return goals;
    if (goals.length === 1) return goals[0].isDecided() ? goals : run(depth + 1, goals[0]);
    const results: Goal[] = [];
    for (const subgoal of goals) {
      const subresults = run(depth + 1, subgoal);
      if (isDecidedSat(subresults)) return subresults;
      if (!isDecidedUnsat(subresults)) results.push(...subresults);
    }
    if (results.length > 0) return results;
    goal.resetAll();
    goal.assert(goal.manager.falseExpr);
    return [goal];
  };
  return (goal: Goal) => run(0, goal);
};

const checkHasArgument = (list: SmtList, combinator: string, end: SmtToken) => {
  if (list.items.length < 2)
    throw new SmtParseError(
      `invalid ${combinator} combinator, at least one argument expected`,
      end,
    );
};

export const compileTactic = (
  environment: TacticEnvironment,
  sexpr: SExpr,
  end: SmtToken,
): TacticBuilder => {
  if (sexpr.kind !== "list") {
    if (!isSymbol(sexpr)) throw new SmtParseError("invalid tactic, unexpected input", end);
    const named = NAMED_TACTICS.get(sexpr.text);
    if (named !== undefined)
      return {
        descrs: named.descrs,
        isRejectingUnknown: named.isRejectingUnknown ?? true,
        build: (params) => named.build(environment, params),
      };
    if (UNPORTED_TACTICS.has(sexpr.text)) throw new SmtUnsupportedError(`the tactic ${sexpr.text}`);
    throw new SmtParseError(`invalid tactic, unknown tactic ${sexpr.text}`, end);
  }
  const head = sexpr.items[0];
  if (head === undefined) throw new SmtParseError("invalid tactic, arguments expected", end);
  if (!isSymbol(head)) throw new SmtParseError("invalid tactic, symbol expected", end);
  const compileChildren = (combinator: string) => {
    checkHasArgument(sexpr, combinator, end);
    return sexpr.items.slice(1).map((child) => compileTactic(environment, child, end));
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
    case "par":
    case "par-or":
    case "par-then": {
      const children = compileChildren(head.text === "par-then" ? "par-then" : "par-or");
      if (children.length === 1) return children[0];
      throw new SmtUnsupportedError(`the combinator ${head.text}`);
    }
    case "repeat": {
      if (sexpr.items.length !== 3 && sexpr.items.length !== 2)
        throw new SmtParseError("invalid repeat combinator, one or two arguments expected", end);
      const bound = sexpr.items[2];
      if (bound !== undefined && !isUnsigned(bound))
        throw new SmtParseError(
          "invalid repeat combinator, second argument must be an unsigned integer",
          end,
        );
      const child = compileTactic(environment, sexpr.items[1], end);
      const maxDepth = bound === undefined ? UINT_MAX : Number(bound.text);
      return {
        ...mergeDescrs([child]),
        build: (params) => runRepeat(child.build(params), maxDepth),
      };
    }
    case "!":
    case "using-params":
    case "with": {
      checkHasArgument(sexpr, "using-params", end);
      const child = compileTactic(environment, sexpr.items[1], end);
      if (sexpr.items.length === 2) return child;
      const own = getParams(child, sexpr.items, end);
      return {
        ...mergeDescrs([child]),
        build: (params) => child.build(new Map([...params, ...own])),
      };
    }
    case "skip-if-failed": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError("invalid skip-if-failed combinator, one argument expected", end);
      const child = compileTactic(environment, sexpr.items[1], end);
      return {
        ...mergeDescrs([child]),
        build: (params) => runOrElse([child.build(params), (goal) => [goal]]),
      };
    }
    case "try-for":
    case "if":
    case "ite":
    case "cond":
    case "fail-if":
    case "fail-if-branching":
    case "when":
    case "echo":
    case "if-no-proofs":
    case "if-no-models":
    case "if-no-unsat-cores":
      throw new SmtUnsupportedError(`the combinator ${head.text}`);
    default:
      throw new SmtParseError(`invalid tactic, unknown tactic combinator ${head.text}`, end);
  }
};

interface TacticCheck {
  status: number;
  model: ProtoModel | undefined;
}

const convertModel = (goal: Goal, model: ProtoModel) => {
  for (let index = goal.converters.length - 1; index >= 0; index--) {
    const entry = goal.converters[index];
    if (entry.def === -1) model.unregisterDecl(entry.decl);
    else throw new SmtUnsupportedError("the definitions of model converters");
  }
  return model;
};

export const checkSatUsing = (tactic: Tactic, goal: Goal): TacticCheck => {
  const goals = (() => {
    try {
      return tactic(goal);
    } catch (error) {
      if (error instanceof SmtTacticError || error instanceof SmtCanceledError) return undefined;
      throw error;
    }
  })();
  if (goals !== undefined && isDecidedSat(goals))
    return {
      status: L_TRUE,
      model: convertModel(goals[0], goals[0].model ?? new ProtoModel(goal.manager)),
    };
  if (goals !== undefined && isDecidedUnsat(goals)) return { status: L_FALSE, model: undefined };
  return { status: L_UNDEF, model: undefined };
};

export const applyTactic = (tactic: Tactic, goal: Goal) => {
  try {
    return tactic(goal);
  } catch (error) {
    if (error instanceof SmtCanceledError) throw new SmtTacticError("canceled");
    throw error;
  }
};

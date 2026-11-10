// Ported from Z3 (src/cmd_context/tactic_cmds.cpp, src/tactic/tactical.cpp, src/tactic/tactic.cpp),
// MIT license, see z3-license.txt.
import {
  SmtCanceledError,
  SmtParseError,
  SmtTacticError,
  SmtUnsupportedError,
} from "../../../errors";
import { type AstManager, KIND_APP, OP_ITE, SORT_BOOL } from "./ast";
import { AssertedFormulas } from "./asserted-formulas";
import { card2bv } from "./card2bv";
import { Context } from "./context";
import { ctxSimplify } from "./ctx-simplify";
import { createCtxSolverSimplify } from "./ctx-solver-simplify";
import type { Definition, Goal } from "./goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { Der } from "./der";
import { fixDlVar } from "./fix-dl-var";
import { runFpa2Bv } from "./fpa2bv-tactic";
import { runBitBlast } from "./bit-blast-tactic";
import { runMaxBvSharing } from "./max-bv-sharing-tactic";
import { elimUncnstr } from "./elim-uncnstr";
import { rewriteUfbv } from "./demodulator";
import { distributeForall } from "./distribute-forall";
import { domSimplify } from "./dom-simplify";
import { factor } from "./factor";
import { findGoalMacros } from "./macro-finder";
import { findQuasiMacros } from "./quasi-macros";
import { reduceArgs } from "./reduce-args";
import { DefinedNames, NNF_FULL, NNF_QUANT, NNF_SKOLEM, Nnf } from "./nnf";
import { normalizeBounds } from "./normalize-bounds";
import { occf } from "./occf";
import { propagateValues } from "./propagate-values";
import { purifyArith } from "./purify-arith";
import { ModelEvaluator } from "./model-evaluator";
import { FuncInterp, ProtoModel } from "./proto-model";
import { compileProbe, formatProbeValue, type Probe } from "./probes";
import { applyQeLite } from "./qe-lite";
import { simplifyGoal } from "./quant-tactics";
import { SolveEqs } from "./solve-eqs";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";
import { type RewriterOptions, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { lia2card } from "./lia2card";
import { LOGIC_TACTICS } from "./logic-tactics";
import {
  createCommandReader,
  isSymbol,
  type SExpr,
  type SmtList,
  type SmtToken,
} from "./smtlib-parser";
import { solveGoal } from "./solver";
import { tseitinCnf } from "./tseitin-cnf";

const PARAM_BOOL = 0;
const PARAM_UINT = 1;
const PARAM_SYMBOL = 2;

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
  isFindingMacros: boolean;
  write: (text: string, isDiagnostic: boolean) => void;
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
  ["hoist_mul", PARAM_BOOL, false],
  ["hoist_ite", PARAM_BOOL, false, true],
  ["algebraic_number_evaluator", PARAM_BOOL, true, true],
  ["mul_to_power", PARAM_BOOL, false],
  ["expand_power", PARAM_BOOL, false, true],
  ["expand_tan", PARAM_BOOL, false, true],
  ["max_degree", PARAM_UINT, 64, true],
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
  isFlatAndOr: getBool(params, "flat_and_or", true),
  isSortingStore: getBool(params, "sort_store", false),
  isPullingCheapIte: getBool(params, "pull_cheap_ite", false),
  isKeepingDistinct: !getBool(params, "blast_distinct", false),
  blastDistinctThreshold: getUint(params, "blast_distinct_threshold", UINT_MAX),
  localCtxLimit: getBool(params, "local_ctx", false)
    ? getUint(params, "local_ctx_limit", UINT_MAX)
    : undefined,
  arith: {
    isSom: getBool(params, "som", false),
    isSortSums: getBool(params, "sort_sums", false),
    isArithIneqLhs: getBool(params, "arith_lhs", false),
    isGcdRounding: getBool(params, "gcd_rounding", false),
    isAnumSimp: getBool(params, "algebraic_number_evaluator", true),
    isExpandPower: getBool(params, "expand_power", false),
    isExpandTan: getBool(params, "expand_tan", false),
    isHoistIte: getBool(params, "hoist_ite", false),
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
  ["arith.nl.rounds", PARAM_UINT, 1024, true],
]);

const runSmt = (environment: TacticEnvironment, params: TacticParams) => (goal: Goal) => {
  const solved = solveGoal(environment.manager, goal.forms.items, {
    isMbqi: getBool(params, "mbqi", environment.isMbqi),
    isFindingMacros: environment.isFindingMacros,
  });
  if (solved.result === L_UNDEF) throw new SmtTacticError(solved.context.getLastFailureMessage());
  goal.reset();
  if (solved.result === L_FALSE) goal.assert(environment.manager.falseExpr);
  else goal.model = solved.context.getModel();
  return [goal];
};

// Each clause gets a fresh context, where Z3 pushes a scope on one context.
const runUnitSubsume = (environment: TacticEnvironment) => (goal: Goal) => {
  const manager = environment.manager;
  const clauses = goal.forms.items.map(() => manager.mkFreshConst("#clause", SORT_BOOL));
  const definitions = goal.forms.items.map((form, index) => manager.mkEq(clauses[index], form));
  for (const expr of [...clauses, ...definitions]) manager.incRef(expr);
  const deleted: number[] = [];
  for (const [index, clause] of clauses.entries()) {
    const asserted = new AssertedFormulas(manager);
    const context = new Context(manager, { isMbqi: environment.isMbqi, relevancyLevel: 2 });
    for (const definition of definitions) asserted.assertExpr(definition);
    for (const [other, otherClause] of clauses.entries())
      if (other === index) asserted.assertExpr(manager.mkNot(clause));
      else if (!deleted.includes(other)) asserted.assertExpr(otherClause);
    context.setupContext();
    context.internalizeAssertions(asserted);
    if (!context.isInconsistent()) context.propagate();
    if (context.isInconsistent()) deleted.push(index);
  }
  for (const index of deleted) goal.update(index, manager.trueExpr);
  goal.elimTrue();
  for (const expr of [...clauses, ...definitions]) manager.decRef(expr);
  return [goal];
};

const inPlace = (run: (goal: Goal) => void) => (goal: Goal) => {
  run(goal);
  return [goal];
};

class DerRewriter extends RewriterTpl {
  readonly der: Der;

  constructor(manager: AstManager) {
    super(manager);
    this.der = new Der(manager);
  }

  reduceQuantifier(expr: number, body: number, patterns: number[]) {
    const manager = this.manager;
    return manager.withTemporaries(() =>
      this.der.apply(manager.mkQuantifier({ ...manager.getQuantifier(expr), body, patterns })),
    );
  }
}

const runDer = (manager: AstManager) => (goal: Goal) => {
  const rewriter = new DerRewriter(manager);
  const size = goal.forms.size;
  for (let index = 0; !goal.isInconsistent && index < size; index++) {
    const result = rewriter.rewrite(goal.forms.items[index]);
    goal.update(index, result);
    manager.decRef(result);
  }
  goal.elimTrue();
  goal.elimRedundancies();
  goal.depth++;
  rewriter.der.release();
  rewriter.release();
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
  ["ignore_labels", PARAM_BOOL, false],
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
  const nnf = new Nnf(manager, names, mode);
  const definitions = new RefVector(manager);
  const size = goal.forms.size;
  for (let index = 0; !goal.isInconsistent && index < size; index++) {
    const result = nnf.apply(goal.forms.items[index], definitions);
    goal.update(index, result);
    manager.decRef(result);
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
  [
    "ctx-solver-simplify",
    {
      descrs: SMT_DESCRS,
      isRejectingUnknown: false,
      build: (environment, params) =>
        inPlace(
          createCtxSolverSimplify(environment.manager, {
            isMbqi: getBool(params, "mbqi", environment.isMbqi),
            isFindingMacros: environment.isFindingMacros,
          }),
        ),
    },
  ],
  ["unit-subsume-simplify", { descrs: new Map(), build: runUnitSubsume }],
  [
    "purify-arith",
    {
      descrs: new Map([
        ...REWRITER_DESCRS,
        ...getDescrs("", [
          ["complete", PARAM_BOOL, true, true],
          ["elim_root_objects", PARAM_BOOL, true],
          ["elim_inverses", PARAM_BOOL, true],
        ]),
      ]),
      build: (environment, params) => {
        const manager = environment.manager;
        const snf = runNnf(manager, new Map());
        return (goal) => {
          snf(goal);
          simplifyGoal(manager, goal, getRewriterOptions(manager, params));
          purifyArith(manager, goal, getBool(params, "complete", true));
          simplifyGoal(manager, goal, getRewriterOptions(manager, params));
          return [goal];
        };
      },
    },
  ],
  [
    "elim-term-ite",
    {
      descrs: getDescrs("", [["max_memory", PARAM_UINT, UINT_MAX, true]]),
      build: (environment) =>
        inPlace((goal) => {
          const manager = environment.manager;
          const seen = new Set<number>();
          const todo = [...goal.forms.items];
          for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
            if (seen.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
            seen.add(expr);
            if (manager.getOp(expr) === OP_ITE && manager.sorts[expr] !== SORT_BOOL)
              throw new SmtUnsupportedError("elim-term-ite on a goal it changes");
            manager.pushArgs(expr, todo);
          }
          goal.depth++;
        }),
    },
  ],
  [
    "tseitin-cnf-core",
    {
      descrs: TSEITIN_DESCRS,
      build: (environment) => inPlace((goal) => tseitinCnf(environment.manager, goal)),
    },
  ],
  [
    "tseitin-cnf",
    {
      descrs: TSEITIN_DESCRS,
      build: (environment, params) =>
        inPlace((goal) => {
          const manager = environment.manager;
          try {
            tseitinCnf(manager, goal);
          } catch (error) {
            if (!(error instanceof SmtTacticError)) throw error;
            simplifyGoal(manager, goal, {
              ...getRewriterOptions(manager, params),
              isEliminatingAnd: true,
              isKeepingDistinct: false,
            });
            tseitinCnf(manager, goal);
          }
        }),
    },
  ],
  [
    "qe-light",
    {
      descrs: new Map(),
      build: (environment) =>
        inPlace((goal) => {
          if (!goal.isProofsEnabled) applyQeLite(environment.manager, goal);
          else {
            goal.elimTrue();
            goal.elimRedundancies();
          }
          goal.depth++;
        }),
    },
  ],
  [
    "solve-eqs",
    {
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
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["max_steps", PARAM_UINT, UINT_MAX],
      ]),
      build: (environment) => {
        const bodies = new RefVector(environment.manager);
        return inPlace((goal) => elimUncnstr(environment.manager, goal, bodies));
      },
    },
  ],
  [
    "lia2card",
    {
      descrs: getDescrs("", [["compile_equality", PARAM_BOOL, true]]),
      build: (environment, params) =>
        inPlace((goal) =>
          lia2card(
            environment.manager,
            goal,
            getUint(params, "lia2card.max_range", 100),
            getUint(params, "lia2card.max_ite_nesting", 4),
          ),
        ),
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
    "fix-dl-var",
    {
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
  ["der", { descrs: new Map(), build: (environment) => runDer(environment.manager) }],
  [
    "distribute-forall",
    {
      descrs: new Map(),
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
      build: (environment) => inPlace((goal) => findQuasiMacros(environment.manager, goal)),
    },
  ],
  [
    "ufbv-rewriter",
    {
      descrs: getDescrs("", [
        ["max_memory", PARAM_UINT, UINT_MAX, true],
        ["produce_models", PARAM_BOOL, false, true],
      ]),
      build: (environment) => inPlace((goal) => rewriteUfbv(environment.manager, goal)),
    },
  ],
  [
    "reduce-args",
    {
      descrs: new Map(),
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
      build: (environment) => inPlace((goal) => findGoalMacros(environment.manager, goal)),
    },
  ],
  [
    "dom-simplify",
    {
      descrs: new Map(),
      build: (environment) => inPlace((goal) => domSimplify(environment.manager, goal)),
    },
  ],
  [
    "occf",
    {
      descrs: new Map(),
      build: (environment) => inPlace((goal) => occf(environment.manager, goal)),
    },
  ],
  ["fpa2bv", { descrs: new Map(), build: (environment) => runFpa2Bv(environment.manager) }],
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
    { descrs: new Map(), build: (environment) => runMaxBvSharing(environment.manager) },
  ],
  ["smt", { descrs: SMT_DESCRS, isRejectingUnknown: false, build: runSmt }],
  [
    "snf",
    { descrs: NNF_DESCRS, build: (environment, params) => runNnf(environment.manager, params) },
  ],
  [
    "nnf",
    {
      descrs: NNF_DESCRS,
      build: (environment, params) =>
        runNnf(environment.manager, new Map([...params, ["mode", "full"]])),
    },
  ],
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
    "ackermannize_bv add-bounds aig blast-term-ite bv_bound_chk bv-divrem-bounds " +
    "bv-slice bv1-blast bvarray2uf cofactor-term-ite collect-statistics " +
    "degree-shift demodulator diff-neq " +
    "dt2bv elim-predicates elim-small-bv elim-uncnstr2 eq2bv " +
    "euf-completion ff-sat ff-simplify ff-solve ff-unique ff2bv fm " +
    "fold-unfold fpa2bv horn horn-simplify injectivity lia2pb " +
    "nla2bv nlqsat nlsat nra pb-preprocess pb2bv pqffd " +
    "propagate-bv-bounds propagate-bv-bounds2 propagate-ineqs propagate-values2 psat psmt " +
    "qe qe_rec qe2 qfaufbv qfbv-sls qffd qffp qffpbv qffplra qfnra " +
    "qfufbv qfufbv_ackr qsat recover-01 reduce-args2 reduce-bv-size " +
    "sat sat-preprocess sls-smt smtfd solver-subsumption special-relations " +
    "split-clause subpaving symmetry-reduce"
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

const parseParamValue = (kind: number, value: SExpr) =>
  kind === PARAM_BOOL
    ? isSymbol(value, "true") || (isSymbol(value, "false") ? false : undefined)
    : kind === PARAM_UINT
      ? isUnsigned(value)
        ? Number(value.text)
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

const getParams = (
  builder: TacticBuilder,
  items: SExpr[],
  end: SmtToken,
  isInternal: boolean,
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
    if (isInternal) {
      const parsed =
        found === undefined
          ? getUntypedParamValue(value)
          : parseParamValue(found.descr.kind, value);
      if (parsed === undefined) throw new SmtParseError("invalid parameter value", end);
      params.set(found?.name ?? getParamName(keyword.text), parsed);
      continue;
    }
    if (found === undefined) {
      if (!builder.isRejectingUnknown)
        throw new SmtUnsupportedError(`the parameter ${keyword.text} of the tactic`);
      throw new SmtParseError(
        `invalid using-params combinator, unknown parameter ${getParamName(keyword.text)}`,
        end,
      );
    }
    const parsed = parseParamValue(found.descr.kind, value);
    if (parsed === undefined)
      throw new SmtParseError(
        found.descr.kind === PARAM_BOOL
          ? "invalid parameter value, true or false expected"
          : found.descr.kind === PARAM_UINT
            ? "invalid parameter value, unsigned integer expected"
            : "invalid parameter value, symbol expected",
        end,
      );
    if (isUnportedParam(found.descr, parsed))
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

const runCond = (probe: Probe, onTrue: Tactic, onFalse: Tactic) => (goal: Goal) =>
  probe(goal) === 0 ? onFalse(goal) : onTrue(goal);

const checkHasArgument = (list: SmtList, combinator: string, end: SmtToken) => {
  if (list.items.length < 2)
    throw new SmtParseError(
      `invalid ${combinator} combinator, at least one argument expected`,
      end,
    );
};

const compile = (
  environment: TacticEnvironment,
  sexpr: SExpr,
  end: SmtToken,
  isInternal: boolean,
): TacticBuilder => {
  if (sexpr.kind !== "list") {
    if (!isSymbol(sexpr)) throw new SmtParseError("invalid tactic, unexpected input", end);
    const named = NAMED_TACTICS.get(sexpr.text);
    if (named !== undefined)
      return {
        descrs: named.descrs,
        isRejectingUnknown: named.isRejectingUnknown ?? true,
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
      return compile(environment, createCommandReader(strategy).read() as SmtList, end, true);
    if (UNPORTED_TACTICS.has(sexpr.text)) {
      const error = new SmtUnsupportedError(`the tactic ${sexpr.text}`);
      if (!isInternal) throw error;
      return {
        descrs: new Map(),
        isRejectingUnknown: false,
        build: () => () => {
          throw error;
        },
      };
    }
    throw new SmtParseError(`invalid tactic, unknown tactic ${sexpr.text}`, end);
  }
  const head = sexpr.items[0];
  if (head === undefined) throw new SmtParseError("invalid tactic, arguments expected", end);
  if (!isSymbol(head)) throw new SmtParseError("invalid tactic, symbol expected", end);
  const compileChildren = (combinator: string) => {
    checkHasArgument(sexpr, combinator, end);
    return sexpr.items.slice(1).map((child) => compile(environment, child, end, isInternal));
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
        throw new SmtParseError("invalid try-for combinator, two arguments expected", end);
      if (!isUnsigned(sexpr.items[2]))
        throw new SmtParseError(
          "invalid try-for combinator, second argument must be an unsigned integer",
          end,
        );
      return compile(environment, sexpr.items[1], end, isInternal);
    }
    case "fail-if-branching": {
      if (sexpr.items.length !== 3 && sexpr.items.length !== 2)
        throw new SmtParseError(
          "invalid fail-if-branching combinator, one or two arguments expected",
          end,
        );
      const bound = sexpr.items[2];
      if (bound !== undefined && !isUnsigned(bound))
        throw new SmtParseError(
          "invalid fail-if-branching combinator, second argument must be an unsigned integer",
          end,
        );
      const child = compile(environment, sexpr.items[1], end, isInternal);
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
        throw new SmtParseError(`invalid ${head.text} combinator, one argument expected`, end);
      const child = compile(environment, sexpr.items[1], end, isInternal);
      const isSkipping = (goal: Goal) =>
        head.text === "if-no-models" ||
        (head.text === "if-no-proofs" ? goal.isProofsEnabled : goal.isCoresEnabled);
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
        throw new SmtParseError("invalid repeat combinator, one or two arguments expected", end);
      const bound = sexpr.items[2];
      if (bound !== undefined && !isUnsigned(bound))
        throw new SmtParseError(
          "invalid repeat combinator, second argument must be an unsigned integer",
          end,
        );
      const child = compile(environment, sexpr.items[1], end, isInternal);
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
      const child = compile(environment, sexpr.items[1], end, isInternal);
      if (sexpr.items.length === 2) return child;
      const own = getParams(child, sexpr.items, end, isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => child.build(new Map([...params, ...own])),
      };
    }
    case "skip-if-failed": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError("invalid skip-if-failed combinator, one argument expected", end);
      const child = compile(environment, sexpr.items[1], end, isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => runOrElse([child.build(params), (goal) => [goal]]),
      };
    }
    case "if":
    case "ite":
    case "cond": {
      if (sexpr.items.length !== 4)
        throw new SmtParseError("invalid if/conditional combinator, three arguments expected", end);
      const probe = compileProbe(sexpr.items[1], end);
      const children = sexpr.items
        .slice(2)
        .map((child) => compile(environment, child, end, isInternal));
      return {
        ...mergeDescrs(children),
        build: (params) => runCond(probe, children[0].build(params), children[1].build(params)),
      };
    }
    case "when": {
      if (sexpr.items.length !== 3)
        throw new SmtParseError("invalid when combinator, two arguments expected", end);
      const probe = compileProbe(sexpr.items[1], end);
      const child = compile(environment, sexpr.items[2], end, isInternal);
      return {
        ...mergeDescrs([child]),
        build: (params) => runCond(probe, child.build(params), (goal) => [goal]),
      };
    }
    case "fail-if": {
      if (sexpr.items.length !== 2)
        throw new SmtParseError("invalid fail-if tactic, one argument expected", end);
      const probe = compileProbe(sexpr.items[1], end);
      return {
        descrs: new Map(),
        isRejectingUnknown: true,
        build: () => (goal) => {
          if (probe(goal) !== 0) throw new SmtTacticError("fail-if tactic");
          return [goal];
        },
      };
    }
    case "echo": {
      if (sexpr.items.length < 2)
        throw new SmtParseError("invalid echo tactic, must have at least one argument", end);
      const pieces = sexpr.items.slice(1).map((piece, index, all): Tactic => {
        const newline = index === all.length - 1 ? "\n" : "";
        if (piece.kind === "string")
          return (goal) => {
            environment.write(piece.text + newline, false);
            return [goal];
          };
        const probe = compileProbe(piece, end);
        return (goal) => {
          environment.write(formatProbeValue(probe(goal)) + newline, true);
          return [goal];
        };
      });
      return {
        descrs: new Map(),
        isRejectingUnknown: true,
        build: () => pieces.reduceRight((second, first) => runAndThen(first, second)),
      };
    }
    default:
      throw new SmtParseError(`invalid tactic, unknown tactic combinator ${head.text}`, end);
  }
};

export const compileTactic = (environment: TacticEnvironment, sexpr: SExpr, end: SmtToken) =>
  compile(environment, sexpr, end, false);

export const compileInternalTactic = (environment: TacticEnvironment, text: string) => {
  const list = createCommandReader(text).read() as SmtList;
  return compile(environment, list, list.end, true).build(new Map());
};

interface TacticCheck {
  status: number;
  model: ProtoModel | undefined;
}

// A constant of an uninterpreted sort the model lacks puts its value in that sort's universe.
const applyDefinitions = (definitions: Definition[], model: ProtoModel) => {
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
    const arity = manager.funcDecls[definition.decl].domain.length;
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

export const convertModel = (goal: Goal, model: ProtoModel) =>
  goal.converters.reduceRight((converted, entry) => {
    if ("convert" in entry) return entry.convert(converted);
    if ("definitions" in entry) return applyDefinitions(entry.definitions, converted);
    converted.unregisterDecl(entry.decl);
    return converted;
  }, model);

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

// Ported from Z3 (src/sat/sat_config.h, src/sat/sat_config.cpp, src/params/sat_params.pyg,
// src/sat/sat_simplifier_params.pyg, src/sat/sat_asymm_branch_params.pyg,
// src/sat/sat_scc_params.pyg), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../../errors";

export const PS_ALWAYS_TRUE = 0;
export const PS_ALWAYS_FALSE = 1;
export const PS_BASIC_CACHING = 2;
export const PS_SAT_CACHING = 3;
export const PS_FROZEN = 5;
export const PS_RANDOM = 6;

export const RS_GEOMETRIC = 0;
export const RS_LUBY = 1;
export const RS_EMA = 2;
export const RS_STATIC = 3;

export const GC_DYN_PSM = 0;
export const GC_PSM = 1;
export const GC_GLUE = 2;
export const GC_GLUE_PSM = 3;
export const GC_PSM_GLUE = 4;

const UINT_MAX = 4294967295;

export type SatParams = ReadonlyMap<string, boolean | number | string>;

const PHASES = new Map([
  ["always_false", PS_ALWAYS_FALSE],
  ["always_true", PS_ALWAYS_TRUE],
  ["basic_caching", PS_BASIC_CACHING],
  ["caching", PS_SAT_CACHING],
  ["random", PS_RANDOM],
  ["frozen", PS_FROZEN],
]);

const RESTARTS = new Map([
  ["luby", RS_LUBY],
  ["geometric", RS_GEOMETRIC],
  ["ema", RS_EMA],
  ["static", RS_STATIC],
]);

const GCS = new Map([
  ["dyn_psm", GC_DYN_PSM],
  ["glue_psm", GC_GLUE_PSM],
  ["glue", GC_GLUE],
  ["psm", GC_PSM],
  ["psm_glue", GC_PSM_GLUE],
]);

export const getNumber = (params: SatParams, name: string, defaultValue: number) => {
  const value = params.get(name);
  return typeof value === "number" ? value : defaultValue;
};

export const getBool = (params: SatParams, name: string, defaultValue: boolean) => {
  const value = params.get(name);
  return typeof value === "boolean" ? value : defaultValue;
};

const getSymbol = <T>(
  params: SatParams,
  name: string,
  defaultValue: string,
  values: Map<string, T>,
  message: string,
) => {
  const value = values.get(String(params.get(name) ?? defaultValue));
  if (value === undefined) throw new SmtTacticError(message);
  return value;
};

export const getSatConfig = (params: SatParams) => ({
  restart: getSymbol(
    params,
    "restart",
    "ema",
    RESTARTS,
    "invalid restart strategy. Use ema (default), luby, geometric, static",
  ),
  fastGlueAvg: getNumber(params, "restart.emafastglue", 0.03),
  slowGlueAvg: getNumber(params, "restart.emaslowglue", 1e-5),
  restartMargin: getNumber(params, "restart.margin", 1.1),
  isRestartFast: getBool(params, "restart.fast", true),
  phase: getSymbol(
    params,
    "phase",
    "caching",
    PHASES,
    "invalid phase selection strategy: always_false, always_true, basic_caching, caching, random",
  ),
  rephaseBase: getNumber(params, "rephase.base", 1000),
  activityScale: getNumber(params, "reorder.activity_scale", 100),
  searchSatConflicts: getNumber(params, "search.sat.conflicts", 400),
  searchUnsatConflicts: getNumber(params, "search.unsat.conflicts", 400),
  restartInitial: getNumber(params, "restart.initial", 2),
  restartFactor: getNumber(params, "restart.factor", 1.5),
  randomFreq: getNumber(params, "random_freq", 0.01),
  randomSeed: getNumber(params, "random_seed", 0),
  burstSearch: getNumber(params, "burst_search", 100),
  isEnablingPreSimplify: getBool(params, "enable_pre_simplify", false),
  maxConflicts: getNumber(params, "max_conflicts", UINT_MAX),
  nextSimplify1: getNumber(params, "next_simplify", 90000),
  simplifyMult2: getNumber(params, "simplify_mult2", 1.5),
  simplifyMax: getNumber(params, "simplify_max", 1000000),
  simplifyDelay: getNumber(params, "simplify.delay", 0),
  gcStrategy: getSymbol(params, "gc", "glue_psm", GCS, "invalid gc strategy"),
  gcInitial: getNumber(params, "gc.initial", 20000),
  gcIncrement: getNumber(params, "gc.increment", 500),
  gcSmallLbd: getNumber(params, "gc.small_lbd", 3),
  gcK: Math.min(255, getNumber(params, "gc.k", 7)),
  isGcBurst: getBool(params, "gc.burst", false),
  isGcDefrag: getBool(params, "gc.defrag", true),
  isForcingCleanup: getBool(params, "force_cleanup", false),
  backtrackScopes: getNumber(params, "backtrack.scopes", 100),
  backtrackInitConflicts: getNumber(params, "backtrack.conflicts", 4000),
  isMinimizingLemmas: getBool(params, "minimize_lemmas", true),
  isDynSubRes: getBool(params, "dyn_sub_res", true),
  variableDecay: getNumber(params, "variable_decay", 110),
  isScc: getBool(params, "scc", true),
  isSccTr: getBool(params, "scc.tr", true),
});

export type SatConfig = ReturnType<typeof getSatConfig>;

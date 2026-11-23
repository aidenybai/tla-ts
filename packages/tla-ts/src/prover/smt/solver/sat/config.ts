import { SmtDefaultError } from "../../../../errors";
import { UINT_MAX } from "./clause";

export const PS_ALWAYS_TRUE = 0;
export const PS_ALWAYS_FALSE = 1;
export const PS_BASIC_CACHING = 2;
export const PS_SAT_CACHING = 3;
export const PS_LOCAL_SEARCH = 4;
export const PS_FROZEN = 5;
export const PS_RANDOM = 6;

export const RS_GEOMETRIC = 0;
export const RS_LUBY = 1;
export const RS_EMA = 2;
const RS_STATIC = 3;

export const GC_DYN_PSM = 0;
export const GC_PSM = 1;
export const GC_GLUE = 2;
export const GC_GLUE_PSM = 3;
export const GC_PSM_GLUE = 4;

export type SatParams = ReadonlyMap<string, boolean | number | string>;

const PHASES = new Map([
  ["always_false", PS_ALWAYS_FALSE],
  ["always_true", PS_ALWAYS_TRUE],
  ["basic_caching", PS_BASIC_CACHING],
  ["caching", PS_SAT_CACHING],
  ["random", PS_RANDOM],
  ["frozen", PS_FROZEN],
  ["local_search", PS_LOCAL_SEARCH],
]);

const RESTARTS = new Map([
  ["luby", RS_LUBY],
  ["geometric", RS_GEOMETRIC],
  ["ema", RS_EMA],
  ["static", RS_STATIC],
]);

const LOOKAHEAD_REWARDS = new Set(["heule_schur", "heuleu", "ternary", "unit", "march_cu"]);

const CUBE_CUTOFFS = new Set(["depth", "freevars", "psat", "adaptive_freevars", "adaptive_psat"]);

const GCS = new Map([
  ["dyn_psm", GC_DYN_PSM],
  ["glue_psm", GC_GLUE_PSM],
  ["glue", GC_GLUE],
  ["psm", GC_PSM],
  ["psm_glue", GC_PSM_GLUE],
]);

const BRANCHING_HEURISTICS = new Set(["vsids", "chb"]);

const PB_SOLVERS = new Set([
  "circuit",
  "sorting",
  "totalizer",
  "solver",
  "segmented",
  "binary_merge",
]);

const PB_RESOLVES = new Set(["cardinality", "rounding"]);

const PB_LEMMA_FORMATS = new Set(["cardinality", "pb"]);

export const getNumber = (params: SatParams, name: string, defaultValue: number) => {
  const value = params.get(name);
  return typeof value === "number" ? value : defaultValue;
};

export const getBool = (params: SatParams, name: string, defaultValue: boolean) => {
  const value = params.get(name);
  return typeof value === "boolean" ? value : defaultValue;
};

const getSymbol = (params: SatParams, name: string, defaultValue: string) =>
  String(params.get(name) ?? defaultValue);

const getEnum = (
  params: SatParams,
  name: string,
  defaultValue: string,
  values: Map<string, number>,
  message: string,
) => {
  const value = values.get(getSymbol(params, name, defaultValue));
  if (value === undefined) throw new SmtDefaultError(message);
  return value;
};

const checkSymbol = (
  params: SatParams,
  name: string,
  defaultValue: string,
  values: Set<string>,
  message: string,
) => {
  if (!values.has(getSymbol(params, name, defaultValue))) throw new SmtDefaultError(message);
};

export class SatConfig {
  restart = 0;
  fastGlueAvg = 0;
  slowGlueAvg = 0;
  restartMargin = 0;
  isRestartFast = false;
  phase = 0;
  rephaseBase = 0;
  searchSatConflicts = 0;
  searchUnsatConflicts = 0;
  restartInitial = 0;
  restartFactor = 0;
  restartMax = 0;
  inprocessMax = 0;
  randomFreq = 0;
  randomSeed = 0;
  burstSearch = 0;
  isEnablingPreSimplify = false;
  maxConflicts = 0;
  nextSimplify1 = 0;
  simplifyMult2 = 0;
  simplifyMax = 0;
  simplifyDelay = 0;
  gcStrategy = 0;
  gcInitial = 0;
  gcIncrement = 0;
  gcSmallLbd = 0;
  gcK = 0;
  isGcBurst = false;
  isGcDefrag = false;
  isForcingCleanup = false;
  backtrackScopes = 0;
  backtrackInitConflicts = 0;
  isMinimizingLemmas = false;
  isDynSubRes = false;
  variableDecay = 0;
  isScc = false;
  isSccTr = false;

  constructor(params: SatParams) {
    this.updateParams(params);
  }

  updateParams(params: SatParams) {
    this.restart = getEnum(
      params,
      "restart",
      "ema",
      RESTARTS,
      "invalid restart strategy. Use ema (default), luby, geometric, static",
    );
    this.fastGlueAvg = getNumber(params, "restart.emafastglue", 0.03);
    this.slowGlueAvg = getNumber(params, "restart.emaslowglue", 1e-5);
    this.restartMargin = getNumber(params, "restart.margin", 1.1);
    this.isRestartFast = getBool(params, "restart.fast", true);
    this.phase = getEnum(
      params,
      "phase",
      "caching",
      PHASES,
      "invalid phase selection strategy: always_false, always_true, basic_caching, caching, random",
    );
    this.rephaseBase = getNumber(params, "rephase.base", 1000);
    this.searchSatConflicts = getNumber(params, "search.sat.conflicts", 400);
    this.searchUnsatConflicts = getNumber(params, "search.unsat.conflicts", 400);
    this.restartInitial = getNumber(params, "restart.initial", 2);
    this.restartFactor = getNumber(params, "restart.factor", 1.5);
    this.restartMax = getNumber(params, "restart.max", UINT_MAX);
    this.inprocessMax = getNumber(params, "inprocess.max", UINT_MAX);
    this.randomFreq = getNumber(params, "random_freq", 0.01);
    this.randomSeed = getNumber(params, "random_seed", 0);
    this.burstSearch = getNumber(params, "burst_search", 100);
    this.isEnablingPreSimplify = getBool(params, "enable_pre_simplify", false);
    this.maxConflicts = getNumber(params, "max_conflicts", UINT_MAX);
    checkSymbol(
      params,
      "lookahead.reward",
      "march_cu",
      LOOKAHEAD_REWARDS,
      "invalid reward type supplied: accepted heuristics are 'ternary', 'heuleu', 'unit' or 'heule_schur'",
    );
    checkSymbol(
      params,
      "lookahead.cube.cutoff",
      "depth",
      CUBE_CUTOFFS,
      "invalid cutoff type supplied: accepted cutoffs are 'depth', 'freevars', 'psat', 'adaptive_freevars' and 'adaptive_psat'",
    );
    const deltaFraction = getNumber(params, "lookahead.delta_fraction", 1);
    if (deltaFraction < 0 || deltaFraction > 1)
      throw new SmtDefaultError(
        "invalid value for delta fraction. It should be a number in the interval 0 to 1",
      );
    this.nextSimplify1 = getNumber(params, "next_simplify", 90000);
    this.simplifyMult2 = getNumber(params, "simplify_mult2", 1.5);
    this.simplifyMax = getNumber(params, "simplify_max", 1000000);
    this.simplifyDelay = getNumber(params, "simplify.delay", 0);
    this.gcStrategy = getEnum(params, "gc", "glue_psm", GCS, "invalid gc strategy");
    this.gcInitial = getNumber(params, "gc.initial", 20000);
    this.gcIncrement = getNumber(params, "gc.increment", 500);
    this.gcSmallLbd = getNumber(params, "gc.small_lbd", 3);
    this.gcK = Math.min(255, getNumber(params, "gc.k", 7));
    this.isGcBurst = getBool(params, "gc.burst", false);
    this.isGcDefrag = getBool(params, "gc.defrag", true);
    this.isForcingCleanup = getBool(params, "force_cleanup", false);
    this.backtrackScopes = getNumber(params, "backtrack.scopes", 100);
    this.backtrackInitConflicts = getNumber(params, "backtrack.conflicts", 4000);
    this.isMinimizingLemmas = getBool(params, "minimize_lemmas", true);
    if (
      getSymbol(params, "drat.file", "") !== "" &&
      (getBool(params, "drat.disable", false) ||
        getNumber(params, "threads", 1) !== 1 ||
        getNumber(params, "local_search_threads", 0) > 0 ||
        getNumber(params, "ddfw.threads", 0) > 0)
    )
      throw new SmtDefaultError(
        "external DRAT output requires threads=1, local_search_threads=0, ddfw.threads=0, and drat.disable=false",
      );
    this.isDynSubRes = getBool(params, "dyn_sub_res", true);
    checkSymbol(
      params,
      "branching.heuristic",
      "vsids",
      BRANCHING_HEURISTICS,
      "invalid branching heuristic: accepted heuristics are 'vsids' or 'chb'",
    );
    this.variableDecay = getNumber(params, "variable_decay", 110);
    checkSymbol(
      params,
      "pb.solver",
      "solver",
      PB_SOLVERS,
      "invalid PB solver: solver, totalizer, circuit, sorting, segmented, binary_merge",
    );
    checkSymbol(
      params,
      "pb.resolve",
      "cardinality",
      PB_RESOLVES,
      "invalid PB resolve: 'cardinality' or 'rounding' expected",
    );
    checkSymbol(
      params,
      "pb.lemma_format",
      "cardinality",
      PB_LEMMA_FORMATS,
      "invalid PB lemma format: 'cardinality' or 'pb' expected",
    );
    this.isScc = getBool(params, "scc", true);
    this.isSccTr = getBool(params, "scc.tr", true);
  }
}

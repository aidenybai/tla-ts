// Ported from Z3 (src/smt/smt_setup.cpp, src/params/smt_params.cpp), MIT license, see
// z3-license.txt. Of the parameters a setup picks, the port takes those in SmtConfig and the MBQI
// that setup_AUFLIA and setup_AUFLIRA turn on. The port has one arithmetic solver, so it stands in
// for the legacy ones the setups for difference logic pick, and one array solver, which is
// theory_array_full.
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_CHAR,
  FAMILY_DATATYPE,
  FAMILY_FINITE_SET,
  FAMILY_FPA,
  FAMILY_POLY,
  FAMILY_RECFUN,
  FAMILY_SEQ,
} from "./ast";
import { collectStaticFeatures, isDense, type StaticFeatures } from "./static-features";

const AUFLIA_LOGICS = new Set([
  "AUFLIA",
  "AUFLIA+",
  "AUFLIA-",
  "AUFLIRA",
  "AUFLIRA+",
  "AUFLIRA-",
  "AUFNIRA",
  "AUFNIRA+",
  "AUFNIRA-",
  "UFNIA",
]);

const STATIC_FEATURE_LOGICS = new Set([
  "QF_BV",
  "QF_AUFBV",
  "QF_ABV",
  "QF_UFBV",
  "QF_UF",
  "QF_RDL",
  "QF_IDL",
  "QF_UFIDL",
  "QF_LRA",
  "QF_LIA",
  "QF_UFLIA",
  "QF_UFLRA",
  "QF_AX",
  "QF_BVRE",
  "QF_AUFLIA",
  "QF_S",
  "QF_SLIA",
  "QF_DT",
  "LRA",
  "QF_FF",
  "QF_FFA",
  ...AUFLIA_LOGICS,
]);

export interface SmtSetup {
  logic: string | undefined;
  isAutoConfig: boolean;
  // opt_solver sets arith.auto_config_simplex, which keeps setup_QF_IDL off the dense solver.
  isArithAutoConfigSimplex?: boolean;
}

// setup_default, which an incremental check takes.
export const isMbqiByLogic = (setup: SmtSetup) =>
  setup.isAutoConfig && (AUFLIA_LOGICS.has(setup.logic ?? "") || setup.logic === "UFLRA");

// setup_auto_config, which the smt tactic takes. Without a logic it names, setup_unknown picks
// setup_AUFLIA or setup_AUFLIRA once the formulas have a quantifier.
export const isMbqiByFeatures = (setup: SmtSetup, hasQuantifiers: boolean) =>
  setup.isAutoConfig &&
  (AUFLIA_LOGICS.has(setup.logic ?? "") ||
    (!STATIC_FEATURE_LOGICS.has(setup.logic ?? "") && hasQuantifiers));

export const PS_ALWAYS_FALSE = 0;
const PS_CACHING = 2;
export const PS_CACHING_CONSERVATIVE = 3;
export const PS_CACHING_CONSERVATIVE2 = 4;
export const PS_THEORY = 7;

export const RS_GEOMETRIC = 0;
const RS_IN_OUT_GEOMETRIC = 1;
export const RS_LUBY = 2;

const IA_ZERO = 0;
export const IA_RANDOM_WHEN_SEARCHING = 1;
export const IA_RANDOM = 2;

export interface SmtConfig {
  // The families of the theories in the order the setup makes them. FAMILY_POLY makes
  // theory_polymorphism only once there are type variables, and setup_card's pseudo-Boolean theory
  // comes after them all.
  theories: number[];
  // A setup that leaves it keeps the relevancy the context was made with.
  relevancyLevel: 0 | 2 | undefined;
  phaseSelection: number;
  restartStrategy: number;
  restartFactor: number;
  isRestartAdaptive: boolean;
  randomInitialActivity: number;
  isNnfCnf: boolean;
  isEq2Ineq: boolean;
  isFindingMacros: boolean;
}

const UNKNOWN_THEORIES = [
  FAMILY_ARITH,
  FAMILY_ARRAY,
  FAMILY_BV,
  FAMILY_DATATYPE,
  FAMILY_RECFUN,
  FAMILY_SEQ,
  FAMILY_CHAR,
  FAMILY_FPA,
  FAMILY_FINITE_SET,
  FAMILY_POLY,
];

// The smt_params defaults. A setup changes the parameters the context already has.
export const DEFAULT_CONFIG: SmtConfig = {
  theories: [],
  relevancyLevel: undefined,
  phaseSelection: PS_CACHING_CONSERVATIVE,
  restartStrategy: RS_IN_OUT_GEOMETRIC,
  restartFactor: 1.1,
  isRestartAdaptive: true,
  randomInitialActivity: IA_RANDOM_WHEN_SEARCHING,
  isNnfCnf: true,
  isEq2Ineq: false,
  isFindingMacros: false,
};

const setupUnknown = (config: SmtConfig) => {
  config.theories.push(...UNKNOWN_THEORIES);
};

const setupQfUf = (config: SmtConfig) => {
  config.relevancyLevel = 0;
  config.isNnfCnf = false;
  config.restartStrategy = RS_LUBY;
  config.phaseSelection = PS_CACHING_CONSERVATIVE2;
  config.randomInitialActivity = IA_RANDOM;
};

const setupQfDt = (config: SmtConfig) => {
  setupQfUf(config);
  config.theories.push(FAMILY_DATATYPE, FAMILY_RECFUN);
};

// The parameters smt_params::setup_QF_IDL, setup_QF_RDL and setup_QF_LIA share.
const setupDiffLogicParams = (config: SmtConfig) => {
  config.relevancyLevel = 0;
  config.isEq2Ineq = true;
  config.isNnfCnf = false;
};

const setupQfLia = (config: SmtConfig) => {
  setupDiffLogicParams(config);
  config.theories.push(FAMILY_ARITH);
};

const setupQfLiaByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  setupDiffLogicParams(config);
  if (features.maxIteTreeDepth > 50) {
    config.isEq2Ineq = false;
    config.relevancyLevel = 2;
  } else if (features.numClauses === features.numUnits) config.relevancyLevel = 2;
  else {
    config.isRestartAdaptive = false;
    config.restartStrategy = RS_GEOMETRIC;
    config.restartFactor = 1.5;
  }
  config.theories.push(FAMILY_ARITH);
};

const setupQfLra = (config: SmtConfig) => {
  setupDiffLogicParams(config);
  config.phaseSelection = PS_THEORY;
  config.theories.push(FAMILY_ARITH);
};

const setupQfLraByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  setupQfLra(config);
  if (features.arithKSum.num > 2000000n && features.arithKSum.den > 500n) config.relevancyLevel = 2;
  if (features.isCnf) return;
  config.restartStrategy = RS_GEOMETRIC;
  config.isRestartAdaptive = false;
};

const setupQfRdlByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  setupDiffLogicParams(config);
  if (isDense(features)) {
    config.restartStrategy = RS_GEOMETRIC;
    config.isRestartAdaptive = false;
    config.phaseSelection = PS_CACHING;
  }
  config.theories.push(FAMILY_ARITH);
};

const setupQfIdlByFeatures = (config: SmtConfig, features: StaticFeatures, setup: SmtSetup) => {
  setupDiffLogicParams(config);
  if (features.numUninterpretedConstants > 5000) config.relevancyLevel = 2;
  else if (features.isCnf && !isDense(features)) config.phaseSelection = PS_CACHING_CONSERVATIVE2;
  else config.phaseSelection = PS_CACHING;
  if (isDense(features) && features.numBinClauses + features.numUnits === features.numClauses) {
    config.isRestartAdaptive = false;
    config.restartStrategy = RS_GEOMETRIC;
  }
  if (features.isCnf && features.numUnits === features.numClauses)
    config.randomInitialActivity = IA_RANDOM;
  if (setup.isArithAutoConfigSimplex !== true && isDense(features))
    config.phaseSelection = PS_CACHING_CONSERVATIVE;
  config.theories.push(FAMILY_ARITH);
};

const setupQfUfIdl = (config: SmtConfig) => {
  setupDiffLogicParams(config);
  config.restartStrategy = RS_GEOMETRIC;
  config.restartFactor = 1.5;
  config.isRestartAdaptive = false;
  config.theories.push(FAMILY_ARITH);
};

const setupQfUfIdlByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  config.relevancyLevel = 0;
  config.isNnfCnf = false;
  if (features.numUninterpretedFunctions === 0) {
    config.isEq2Ineq = true;
    if (isDense(features)) {
      config.restartStrategy = RS_GEOMETRIC;
      config.theories.push(FAMILY_ARITH);
      return;
    }
  }
  config.restartStrategy = RS_GEOMETRIC;
  config.restartFactor = 1.5;
  config.isRestartAdaptive = false;
  config.theories.push(FAMILY_ARITH);
};

const setupQfUfLia = (config: SmtConfig) => {
  config.theories.push(FAMILY_ARITH);
  config.relevancyLevel = 0;
  config.isNnfCnf = false;
};

const setupQfBv = (config: SmtConfig) => {
  config.relevancyLevel = 0;
  config.isNnfCnf = false;
  config.theories.push(FAMILY_BV);
};

const setupQfUfLiaByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  setupQfUfLia(config);
  if (features.hasBv) setupQfBv(config);
};

const setupQfAufBv = (config: SmtConfig) => {
  config.relevancyLevel = 0;
  config.isNnfCnf = false;
  config.theories.push(FAMILY_BV, FAMILY_ARRAY);
};

const setupQfFp = (config: SmtConfig) => {
  setupQfBv(config);
  config.theories.push(FAMILY_FPA);
};

const setupQfAx = (config: SmtConfig) => {
  config.isNnfCnf = false;
  config.theories.push(FAMILY_ARRAY);
};

const setupQfAxByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  config.isNnfCnf = false;
  if (features.numClauses === features.numUnits) {
    config.relevancyLevel = 0;
    config.phaseSelection = PS_ALWAYS_FALSE;
  } else config.relevancyLevel = 2;
  config.theories.push(FAMILY_ARRAY);
};

const setupQfAufLia = (config: SmtConfig) => {
  config.isNnfCnf = false;
  config.relevancyLevel = 2;
  config.restartStrategy = RS_GEOMETRIC;
  config.restartFactor = 1.5;
  config.phaseSelection = PS_CACHING_CONSERVATIVE2;
  config.theories.push(FAMILY_ARITH, FAMILY_ARRAY);
};

const setupQfAufLiaByFeatures = (config: SmtConfig, features: StaticFeatures) => {
  config.isNnfCnf = false;
  config.relevancyLevel = 0;
  if (features.numClauses === features.numUnits) config.phaseSelection = PS_ALWAYS_FALSE;
  else {
    config.restartStrategy = RS_GEOMETRIC;
    config.restartFactor = 1.5;
    config.phaseSelection = PS_CACHING_CONSERVATIVE2;
    config.randomInitialActivity = IA_ZERO;
  }
  config.theories.push(FAMILY_ARITH, FAMILY_ARRAY);
};

const setupAufLia = (config: SmtConfig) => {
  config.phaseSelection = PS_ALWAYS_FALSE;
  config.restartStrategy = RS_GEOMETRIC;
  config.restartFactor = 1.5;
  config.theories.push(FAMILY_ARITH, FAMILY_ARRAY);
};

const setupAufLira = (config: SmtConfig) => {
  config.phaseSelection = PS_ALWAYS_FALSE;
  config.isFindingMacros = true;
  config.theories.push(FAMILY_ARITH, FAMILY_ARRAY);
};

const setupLra = (config: SmtConfig) => {
  config.relevancyLevel = 0;
  config.theories.push(FAMILY_ARITH);
};

// setup_ff, without the finite field theory the port does not have.
const setupFf = (config: SmtConfig) => {
  config.theories.push(FAMILY_BV);
};

const setupQfBvre = (config: SmtConfig) => {
  setupQfBv(config);
  setupQfLia(config);
  config.theories.push(FAMILY_SEQ, FAMILY_CHAR);
};

const DEFAULT_SETUPS = new Map<string, (config: SmtConfig) => void>([
  ["QF_UF", setupQfUf],
  ["QF_RDL", setupQfLia],
  ["QF_IDL", setupQfLia],
  ["QF_UFIDL", setupQfUfIdl],
  ["QF_LRA", setupQfLra],
  ["QF_LIA", setupQfLia],
  ["QF_UFLIA", setupQfUfLia],
  ["QF_UFLRA", setupQfUfLia],
  ["QF_AX", setupQfAx],
  ["QF_AUFLIA", setupQfAufLia],
  ["QF_BV", setupQfBv],
  ["QF_AUFBV", setupQfAufBv],
  ["QF_ABV", setupQfAufBv],
  ["QF_UFBV", setupQfAufBv],
  ["QF_BVRE", setupQfBvre],
  ["AUFLIA", setupAufLia],
  ["AUFLIRA", setupAufLira],
  ["AUFNIRA", setupAufLira],
  ["AUFLIA+", setupAufLia],
  ["AUFLIA-", setupAufLia],
  ["AUFLIRA+", setupAufLira],
  ["AUFLIRA-", setupAufLira],
  ["AUFNIRA+", setupAufLira],
  ["AUFNIRA-", setupAufLira],
  ["UFNIA", setupAufLia],
  ["UFLRA", setupAufLira],
  ["LRA", setupLra],
  ["QF_FP", setupQfFp],
  ["QF_FPBV", setupQfFp],
  ["QF_BVFP", setupQfFp],
  ["QF_S", setupUnknown],
  ["QF_SLIA", setupUnknown],
  ["QF_DT", setupQfDt],
  ["QF_FF", setupFf],
  ["QF_FFA", setupFf],
]);

const isInDiffLogic = (features: StaticFeatures) =>
  features.numArithEqs === features.numDiffEqs &&
  features.numArithTerms === features.numDiffTerms &&
  features.numArithIneqs === features.numDiffIneqs;

const isDiffLogic = (features: StaticFeatures) =>
  isInDiffLogic(features) &&
  (features.numDiffIneqs > 0 || features.numDiffEqs > 0 || features.numDiffTerms > 0);

const isArith = (features: StaticFeatures) =>
  features.numArithIneqs > 0 || features.numArithTerms > 0 || features.numArithEqs > 0;

const setupQuantified = (config: SmtConfig, features: StaticFeatures) => {
  if (features.hasReal) setupAufLira(config);
  else setupAufLia(config);
  config.theories.push(
    FAMILY_DATATYPE,
    FAMILY_BV,
    FAMILY_SEQ,
    FAMILY_CHAR,
    FAMILY_FINITE_SET,
    FAMILY_FPA,
    FAMILY_RECFUN,
    FAMILY_POLY,
  );
};

// setup_unknown(static_features&), without the finite fields the port does not have.
const setupUnknownByFeatures = (config: SmtConfig, features: StaticFeatures, setup: SmtSetup) => {
  const hasUf = features.numUninterpretedFunctions > 0;
  const numTheories = features.numTheories + (hasUf ? 1 : 0);
  const isTwoWithUf = numTheories === 2 && hasUf;
  const isLinear = features.numNonLinear === 0;
  if (features.numQuantifiers > 0) setupQuantified(config, features);
  else if (features.numTheories === 0) setupQfUf(config);
  else if (numTheories === 1 && isDiffLogic(features)) {
    if (features.hasReal && !features.hasInt) setupQfRdlByFeatures(config, features);
    else if (!features.hasReal && features.hasInt) setupQfIdlByFeatures(config, features, setup);
    else setupUnknown(config);
  } else if (isTwoWithUf && isDiffLogic(features)) {
    if (!features.hasReal && features.hasInt) setupQfUfIdlByFeatures(config, features);
    else setupUnknown(config);
  } else if (numTheories === 1 && isArith(features)) {
    if ((features.hasInt && features.hasReal) || !isLinear) config.theories.push(FAMILY_ARITH);
    else if (features.hasReal) setupQfLraByFeatures(config, features);
    else setupQfLiaByFeatures(config, features);
  } else if (isTwoWithUf && isArith(features)) {
    if (!features.hasReal && isLinear) setupQfUfLiaByFeatures(config, features);
    else if (!features.hasInt && isLinear) setupQfUfLia(config);
    else setupUnknown(config);
  } else if (numTheories === 1 && features.hasBv) setupQfBv(config);
  else if (numTheories === 1 && features.hasFpa) setupQfFp(config);
  else if (numTheories === 2 && features.hasFpa && features.hasBv) setupQfFp(config);
  else if (numTheories === 1 && features.hasArrays) setupQfAxByFeatures(config, features);
  else if (isTwoWithUf && features.hasArrays && !features.hasExtArrays && features.hasBv)
    setupQfAufBv(config);
  else if (isTwoWithUf && features.hasArrays && features.hasInt)
    setupQfAufLiaByFeatures(config, features);
  else setupUnknown(config);
};

const AUTO_SETUPS = new Map<
  string,
  (config: SmtConfig, features: StaticFeatures, setup: SmtSetup) => void
>([
  ["QF_UF", setupQfUf],
  ["QF_RDL", setupQfRdlByFeatures],
  ["QF_IDL", setupQfIdlByFeatures],
  ["QF_UFIDL", setupQfUfIdlByFeatures],
  ["QF_LRA", setupQfLraByFeatures],
  ["QF_LIA", setupQfLiaByFeatures],
  ["QF_UFLIA", setupQfUfLiaByFeatures],
  ["QF_UFLRA", setupQfUfLia],
  ["QF_AX", setupQfAxByFeatures],
  ["QF_BVRE", setupQfBvre],
  ["QF_AUFLIA", setupQfAufLiaByFeatures],
  ["QF_S", setupUnknown],
  ["QF_SLIA", setupUnknown],
  ["AUFLIA", setupAufLia],
  ["AUFLIRA", setupAufLira],
  ["AUFNIRA", setupAufLira],
  ["AUFLIA+", setupAufLia],
  ["AUFLIA-", setupAufLia],
  ["AUFLIRA+", setupAufLira],
  ["AUFLIRA-", setupAufLira],
  ["AUFNIRA+", setupAufLira],
  ["AUFNIRA-", setupAufLira],
  ["UFNIA", setupAufLia],
  ["QF_DT", setupQfDt],
  ["LRA", setupLra],
  ["QF_FF", setupFf],
  ["QF_FFA", setupFf],
]);

// setup::operator(), which changes the parameters of base. A context without a setup runs as with
// auto_config false. setup_and_check configures by the static features of the asserted formulas,
// and any other check by the logic alone.
export const getSmtConfig = (
  manager: AstManager,
  setup: SmtSetup | undefined,
  isUsingStaticFeatures: boolean,
  formulas: readonly number[],
  base: SmtConfig,
) => {
  const config: SmtConfig = { ...base, theories: [] };
  const logic = setup?.logic ?? "";
  if (setup === undefined || !setup.isAutoConfig) setupUnknown(config);
  else if (!isUsingStaticFeatures) (DEFAULT_SETUPS.get(logic) ?? setupUnknown)(config);
  // setup_auto_config skips the static features of the logics whose setups ignore them.
  else if (logic === "QF_BV") setupQfBv(config);
  else if (logic === "QF_AUFBV" || logic === "QF_ABV" || logic === "QF_UFBV") setupQfAufBv(config);
  else
    (AUTO_SETUPS.get(logic) ?? setupUnknownByFeatures)(
      config,
      collectStaticFeatures(manager, formulas),
      setup,
    );
  return config;
};

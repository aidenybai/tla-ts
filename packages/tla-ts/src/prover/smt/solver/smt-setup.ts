// Ported from Z3 (src/smt/smt_setup.cpp), MIT license, see z3-license.txt. Of the parameters each
// setup picks, the port only takes the MBQI that setup_AUFLIA and setup_AUFLIRA turn on.
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

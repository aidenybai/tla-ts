// Ported from Z3 (src/smt/smt_setup.cpp), MIT license, see z3-license.txt. Of the parameters each
// setup picks, the port only takes the MBQI that setup_AUFLIA and setup_AUFLIRA turn on, and of the
// theories, only whether setup_unknown makes them.
import type { AstManager } from "./ast";
import { collectStaticFeatures, type StaticFeatures } from "./static-features";

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

// The logics setup_default sets up other than with setup_unknown. QF_S and QF_SLIA reach it through
// setup_QF_S.
const DEFAULT_SETUP_LOGICS = new Set([
  "QF_UF",
  "QF_RDL",
  "QF_IDL",
  "QF_UFIDL",
  "QF_LRA",
  "QF_LIA",
  "QF_UFLIA",
  "QF_UFLRA",
  "QF_AX",
  "QF_AUFLIA",
  "QF_BV",
  "QF_AUFBV",
  "QF_ABV",
  "QF_UFBV",
  "QF_BVRE",
  "UFLRA",
  "LRA",
  "QF_FP",
  "QF_FPBV",
  "QF_BVFP",
  "QF_DT",
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

// setup_unknown(static_features&). The port has no finite fields, so it skips their case.
const isSetupUnknownByFeatures = (features: StaticFeatures) => {
  if (features.numQuantifiers > 0) return true;
  const hasUf = features.numUninterpretedFunctions > 0;
  const numTheories = features.numTheories + (hasUf ? 1 : 0);
  if (features.numTheories === 0) return false;
  const isInDiffLogic =
    features.numArithEqs === features.numDiffEqs &&
    features.numArithTerms === features.numDiffTerms &&
    features.numArithIneqs === features.numDiffIneqs;
  const isDiffLogic =
    isInDiffLogic &&
    (features.numDiffIneqs > 0 || features.numDiffEqs > 0 || features.numDiffTerms > 0);
  const isArith =
    features.numArithIneqs > 0 || features.numArithTerms > 0 || features.numArithEqs > 0;
  if (numTheories === 1 && isDiffLogic) return features.hasReal === features.hasInt;
  if (numTheories === 2 && hasUf && isDiffLogic) return features.hasReal || !features.hasInt;
  if (numTheories === 1 && isArith) return false;
  if (numTheories === 2 && hasUf && isArith)
    return features.numNonLinear > 0 || (features.hasInt && features.hasReal);
  if (numTheories === 1 && (features.hasBv || features.hasFpa || features.hasArrays)) return false;
  if (numTheories === 2 && features.hasFpa && features.hasBv) return false;
  return !(
    numTheories === 2 &&
    hasUf &&
    features.hasArrays &&
    ((!features.hasExtArrays && features.hasBv) || features.hasInt)
  );
};

// setup::operator(). setup_and_check configures by the static features of the asserted formulas,
// and any other check by the logic alone.
export const isSetupUnknown = (
  manager: AstManager,
  setup: SmtSetup | undefined,
  isUsingStaticFeatures: boolean,
  formulas: readonly number[],
) => {
  if (setup === undefined || !setup.isAutoConfig) return true;
  const logic = setup.logic ?? "";
  if (!isUsingStaticFeatures) return !DEFAULT_SETUP_LOGICS.has(logic);
  if (logic === "QF_S" || logic === "QF_SLIA") return true;
  return (
    !STATIC_FEATURE_LOGICS.has(logic) &&
    isSetupUnknownByFeatures(collectStaticFeatures(manager, formulas))
  );
};

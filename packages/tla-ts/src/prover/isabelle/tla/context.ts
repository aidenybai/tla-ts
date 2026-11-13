import { TlaIsabelleError } from "../../../errors";
import type { ProofContext } from "../isar/method";
import type { Limits } from "../pure/interrupt";
import { blastDepthTac, blastTac } from "../provers/blast/blast";
import type { BlastContext } from "../provers/blast/state";
import type { ClassicalContext } from "../provers/classical";
import { blastHypSubstTac } from "../provers/hypsubst";
import {
  getClaset,
  getClassicalData,
  getFact,
  getHypsubstData,
  toNetPair,
} from "./classical-setup";
import type { TlaLogic } from "./logic";
import { getSimpset } from "./simpdata";

const ATOMIZE_RULES = [
  "Zenon.atomize_object_bAll",
  "Zenon.atomize_meta_bAll",
  "PredicateLogic.atomize_conj",
  "PredicateLogic.atomize_eq",
  "PredicateLogic.atomize_not",
  "PredicateLogic.atomize_imp",
  "PredicateLogic.atomize_all",
];

export const getProofContext = (logic: TlaLogic, limits: Limits): ProofContext => {
  const atomizeRules = ATOMIZE_RULES.map((name) => getFact(logic, name));
  const hypsubst = getHypsubstData(logic);
  const classical = {
    limits,
    claset: getClaset(logic, limits),
    data: getClassicalData(logic, hypsubst),
  };
  const toBlastContext = (context: ClassicalContext): BlastContext => ({
    limits: context.limits,
    claset: context.claset,
    consts: logic.consts,
    elimTemplates: new WeakMap(),
    introTemplates: new WeakMap(),
    data: {
      trueprop: "PredicateLogic.Trueprop",
      equalityName: "PredicateLogic.eq",
      notName: "PredicateLogic.not",
      notE: getFact(logic, "PredicateLogic.notE"),
      ccontr: getFact(logic, "PredicateLogic.contradiction"),
      hypSubstTac: (blastLimits) => blastHypSubstTac({ limits: blastLimits, data: hypsubst }),
      classical: getFact(logic, "PredicateLogic.classical"),
      atomize: atomizeRules,
    },
  });
  return {
    limits,
    simpset: getSimpset(logic),
    classical,
    intuitionistic: {
      limits,
      safeRules: toNetPair(logic.contextRules.bang),
      rules: toNetPair(logic.contextRules.plain),
    },
    atomizeRules,
    blastDepthTac: (context, limit) => blastDepthTac(toBlastContext(context), limit),
    blastTac: (context) => blastTac(toBlastContext(context)),
    getFact: (name) => {
      const facts = logic.facts.get(logic.factNames.get(name) ?? name);
      if (facts === undefined) throw new TlaIsabelleError("ERROR", `Undefined fact: ${name}`);
      return facts;
    },
  };
};

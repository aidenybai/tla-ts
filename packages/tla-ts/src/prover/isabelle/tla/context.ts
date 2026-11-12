import { TlaIsabelleError } from "../../../errors";
import type { ProofContext } from "../isar/method";
import { normHhfEq } from "../pure/drule";
import type { Limits } from "../pure/interrupt";
import { symmetric } from "../pure/thm";
import { blastDepthTac, blastTac, type BlastContext } from "../provers/blast/blast";
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

// The atomize rules, newest first as Object_Logic keeps them.
const ATOMIZE_RULES = [
  "Zenon.atomize_object_bAll",
  "Zenon.atomize_meta_bAll",
  "PredicateLogic.atomize_conj",
  "PredicateLogic.atomize_eq",
  "PredicateLogic.atomize_not",
  "PredicateLogic.atomize_imp",
  "PredicateLogic.atomize_all",
];

// PredicateLogic.thy declares these [symmetric, rulify], newest first, after Pure's norm_hhf_eq.
const RULIFY_RULES = ["PredicateLogic.atomize_imp", "PredicateLogic.atomize_all"];

// PredicateLogic.thy declares these [symmetric, defn].
const DEFN_RULES = [
  "PredicateLogic.atomize_all",
  "PredicateLogic.atomize_imp",
  "PredicateLogic.atomize_eq",
];

// PredicateLogic.thy's instantiation of Induct takes case_split as the default cases rule.
const CASES_DEFAULT = "PredicateLogic.case_split";

export const getProofContext = (logic: TlaLogic, limits: Limits): ProofContext => {
  const atomizeRules = ATOMIZE_RULES.map((name) => getFact(logic, name));
  const classical = { limits, claset: getClaset(logic, limits), data: getClassicalData(logic) };
  const hypsubst = getHypsubstData(logic);
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
  const contextRules = [
    toNetPair(logic.contextRules.bang),
    toNetPair(logic.contextRules.plain),
    toNetPair(logic.contextRules.query),
  ];
  const getTaggedFact = (name: string) => {
    const fullName = logic.factNames.get(name) ?? name;
    return logic.facts
      .get(fullName)
      ?.map((rule, index) => ({ rule, tags: logic.factTags.get(fullName)?.get(index) ?? [] }));
  };
  const taggedThms = new Set(
    [...logic.factTags].flatMap((entry) =>
      [...entry[1].keys()].map((index) => logic.facts.get(entry[0])?.[index]),
    ),
  );
  return {
    limits,
    simpset: getSimpset(logic),
    classical,
    intuitionistic: { limits, safeRules: contextRules[0], rules: contextRules[1] },
    atomizeRules,
    defnRules: DEFN_RULES.map((name) => symmetric(getFact(logic, name))),
    rulifyRules: [...RULIFY_RULES.map((name) => symmetric(getFact(logic, name))), normHhfEq],
    blastDepthTac: (context, limit) => blastDepthTac(toBlastContext(context), limit),
    blastTac: (context) => blastTac(toBlastContext(context)),
    contextRules,
    induct: {
      casesType: logic.casesRules.type,
      casesPred: logic.casesRules.pred,
      casesDefault: {
        rule: getFact(logic, CASES_DEFAULT),
        tags: getTaggedFact(CASES_DEFAULT)?.[0].tags ?? [],
      },
      trivialRule: getFact(logic, "PredicateLogic.cases_trueI"),
      getTaggedFact,
      isTagged: (thm) => taggedThms.has(thm),
    },
  };
};

export const getLogicFact = (logic: TlaLogic, name: string) => {
  const facts = logic.facts.get(logic.factNames.get(name) ?? name);
  if (facts === undefined) throw new TlaIsabelleError("ERROR", `Undefined fact: ${name}`);
  return facts;
};

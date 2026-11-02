// The proof context of a theory tlapm writes, as the Isabelle/TLA+ heap sets it up: its simpset,
// claset, context rules and atomize rules, and Blast instantiated as PredicateLogic.thy does.

import { TlaIsabelleError } from "../../../errors";
import type { ProofContext } from "../isar/method";
import { emptyNet } from "../pure/net";
import type { Limits } from "../pure/interrupt";
import { insertTaggedBrl, type NetPair } from "../pure/tactic";
import { blastDepthTac, blastTac, type BlastContext } from "../provers/blast/blast";
import type { ClassicalContext } from "../provers/classical";
import { blastHypSubstTac } from "../provers/hypsubst";
import type { ContextRule } from "../tools/intuitionistic";
import { getClaset, getClassicalData, getFact, getHypsubstData } from "./classical-setup";
import type { LogicExtraNetItem, LogicNetPair, TlaLogic } from "./logic";
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

// Net.content lists a leaf's items newest first, so inserting them in reverse rebuilds the leaf.
const toNetPair = (pair: LogicNetPair<LogicExtraNetItem>): NetPair<ContextRule> => {
  const insertAll = (items: readonly LogicExtraNetItem[], netpair: NetPair<ContextRule>) =>
    items.reduceRight((result, item) => insertTaggedBrl(item, result), netpair);
  return insertAll(pair.elim, insertAll(pair.intro, { intro: emptyNet, elim: emptyNet }));
};

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

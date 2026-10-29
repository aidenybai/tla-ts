// The classical reasoner and hypsubst as PredicateLogic.thy and SetTheory.thy of Isabelle/TLA+
// instantiate them (BSD licensed, see LICENSE): the Hypsubst and Classical functor arguments, the
// claset with its nets as the reference heap orders them, and SetTheory's bspec wrapper.

import { TlaIsabelleError } from "../../../errors";
import { emptyNet } from "../pure/net";
import { thenGoal, type GoalTactic } from "../pure/tactical";
import type { Limits } from "../pure/interrupt";
import {
  assumeTac,
  dresolveTac,
  insertTaggedBrl,
  type NetPair,
  type TaggedRule,
} from "../pure/tactic";
import type { Term } from "../pure/term";
import type { Thm } from "../pure/thm";
import { addbefore, type Claset, type ClassicalData } from "../provers/classical";
import { hypSubstTac, type HypsubstData } from "../provers/hypsubst";
import type { LogicNetItem, LogicNetPair, TlaLogic } from "./logic";

export const getFact = (logic: TlaLogic, name: string): Thm => {
  const thms = logic.facts.get(name);
  if (thms === undefined || thms.length !== 1)
    throw new TlaIsabelleError("ERROR", `Undefined fact: ${name}`);
  return thms[0];
};

const destBinary = (name: string, term: Term): [Term, Term] => {
  if (
    term.kind === "App" &&
    term.fun.kind === "App" &&
    term.fun.fun.kind === "Const" &&
    term.fun.fun.name === name
  )
    return [term.fun.arg, term.arg];
  throw new TlaIsabelleError("TERM", `dest ${name}`);
};

export const destTrueprop = (term: Term): Term => {
  if (
    term.kind === "App" &&
    term.fun.kind === "Const" &&
    term.fun.name === "PredicateLogic.Trueprop"
  )
    return term.arg;
  throw new TlaIsabelleError("TERM", "dest_Trueprop");
};

export const getHypsubstData = (logic: TlaLogic): HypsubstData => ({
  destTrueprop,
  destEq: (term) => destBinary("PredicateLogic.eq", term),
  destImp: (term) => destBinary("PredicateLogic.imp", term),
  eqReflection: getFact(logic, "PredicateLogic.eq_reflection"),
  revEqReflection: getFact(logic, "PredicateLogic.meta_to_obj_eq"),
  impIntr: getFact(logic, "PredicateLogic.impI"),
  revMp: getFact(logic, "PredicateLogic.rev_mp"),
  subst: getFact(logic, "PredicateLogic.subst"),
  sym: getFact(logic, "PredicateLogic.sym"),
  thinRefl: getFact(logic, "PredicateLogic.thin_refl"),
});

export const getClassicalData = (logic: TlaLogic): ClassicalData => {
  const hypsubst = getHypsubstData(logic);
  return {
    impElim: getFact(logic, "PredicateLogic.impCE'"),
    notElim: getFact(logic, "PredicateLogic.notE"),
    swap: getFact(logic, "PredicateLogic.swap"),
    classical: getFact(logic, "PredicateLogic.classical"),
    judgment: "PredicateLogic.Trueprop",
    hypSubstTacs: [(limits: Limits) => hypSubstTac({ limits, data: hypsubst })],
  };
};

// Net.content lists a leaf's items newest first, so inserting them in reverse rebuilds the leaf.
const toNetPair = (pair: LogicNetPair<LogicNetItem>): NetPair<TaggedRule> => {
  const insertAll = (items: readonly LogicNetItem[], netpair: NetPair<TaggedRule>) =>
    items.reduceRight((result, item) => insertTaggedBrl(item, result), netpair);
  return insertAll(pair.elim, insertAll(pair.intro, { intro: emptyNet, elim: emptyNet }));
};

export const getClaset = (logic: TlaLogic, limits: Limits): Claset => {
  const claset: Claset = {
    safeIs: logic.claset.safeIs,
    safeEs: logic.claset.safeEs,
    unsafeIs: logic.claset.unsafeIs,
    unsafeEs: logic.claset.unsafeEs,
    swrappers: [],
    uwrappers: [],
    safe0: toNetPair(logic.claset.safe0),
    safep: toNetPair(logic.claset.safep),
    unsafe: toNetPair(logic.claset.unsafe),
    dup: toNetPair(logic.claset.dup),
  };
  // SetTheory.thy: ctxt addbefore ("bspec", fn ctxt' => dresolve_tac ctxt' @{thms bspec} THEN' assume_tac ctxt')
  const bspec: GoalTactic = thenGoal(
    dresolveTac(limits, [getFact(logic, "SetTheory.bspec")]),
    assumeTac(limits),
  );
  return addbefore(claset, "bspec", bspec);
};

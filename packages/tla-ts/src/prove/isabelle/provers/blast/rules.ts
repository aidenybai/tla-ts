// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Conversion of the classical rules to tableau operations, each with the Isabelle tactic that
// replays it during proof reconstruction.

import { TlaIsabelleError } from "../../../../errors";
import { revcutRl, zeroVarIndexes } from "../../pure/drule";
import { unifyTermNet } from "../../pure/net";
import { seqHead, singleSeq } from "../../pure/seq";
import { thenGoal, thenTac, type GoalTactic, type Tactic } from "../../pure/tactical";
import {
  ematchTac,
  eresolveTac,
  matchTac,
  orderList,
  resolveTac,
  rotateTac,
  type NetPair,
  type TaggedRule,
} from "../../pure/tactic";
import { dummyT, mkApp, mkConst } from "../../pure/term";
import { assumption, rotateRule, rs, rsn, type Thm } from "../../pure/thm";
import { gensym, type BlastState } from "./state";
import {
  FALSE_NAME,
  GOAL_NAME,
  blastSubstBound,
  destConstApp,
  fromRuleTemplate,
  makeRuleTemplate,
  mkBlastConst,
  mkGoal,
  stripBlastImpConcl,
  stripBlastImpPrems,
  toTerm,
  type BlastTerm,
  type VarRef,
} from "./term";

// A tableau rule: the formula it applies to, the formulae of each new branch, and the tactic
// for the flags upd (the inference updated the branch), dup (duplicate the formula) and rot
// (rotate the new hypotheses).
export interface TableauRule {
  readonly major: BlastTerm;
  readonly prems: readonly (readonly BlastTerm[])[];
  readonly tactic: (isUpdated: boolean, isDup: boolean, isRotated: boolean) => GoalTactic;
}

// The conclusion becomes the goal or the negated assumption *False*: delete it. A premise without
// it is ill-formed and could make reconstruction fail.
const deleteConcl = (state: BlastState, prems: readonly BlastTerm[]): BlastTerm[] | undefined => {
  const position = prems.findIndex((prem) => {
    if (prem.kind !== "App" || prem.fun.kind !== "Const") return false;
    const arg = prem.arg;
    return (
      arg.kind === "Var" &&
      arg.ref.value?.kind === "Const" &&
      arg.ref.value.name === FALSE_NAME &&
      (prem.fun.name === GOAL_NAME || prem.fun.name === state.context.data.notName)
    );
  });
  return position === -1 ? undefined : [...prems.slice(0, position), ...prems.slice(position + 1)];
};

const skoPrem = (state: BlastState, vars: readonly VarRef[], prem: BlastTerm): BlastTerm => {
  const body = destConstApp(prem, "Pure.all");
  return body?.kind === "Abs"
    ? skoPrem(
        state,
        vars,
        blastSubstBound({ kind: "Skolem", name: gensym(state, "S"), args: vars }, body.body),
      )
    : prem;
};

// Expects an elimination rule to have a formula variable as its conclusion.
const convertRule = (state: BlastState, vars: readonly VarRef[], term: BlastTerm) => {
  const trueprop = state.context.data.trueprop;
  const prems = stripBlastImpPrems(trueprop, term);
  const concl = stripBlastImpConcl(trueprop, term);
  if (prems.length === 0 || concl.kind !== "Var") return undefined;
  concl.ref.value = mkBlastConst(FALSE_NAME);
  const converted: BlastTerm[][] = [];
  for (const prem of prems.slice(1)) {
    const skolemized = skoPrem(state, vars, prem);
    const deleted = deleteConcl(state, [
      mkGoal(stripBlastImpConcl(trueprop, skolemized)),
      ...stripBlastImpPrems(trueprop, skolemized),
    ]);
    if (deleted === undefined) return undefined;
    converted.push(deleted);
  }
  return { major: prems[0], prems: converted };
};

// Like dup_elim, but puts the duplicated major premise first.
const revDupElim = (rule: Thm) => {
  const result = seqHead(assumption(undefined, 2, rsn(rule, 2, revcutRl)));
  if (result === undefined) throw new TlaIsabelleError("ERROR", "rev_dup_elim: Seq.hd");
  return result;
};

const countNewHyps = (prem: readonly BlastTerm[]) =>
  prem.filter((term) => destConstApp(term, GOAL_NAME) === undefined).length;

// Rotates the assumptions in all new subgoals for the LIFO discipline.
const rotSubgoalsTac =
  (isRotated: boolean, prems: readonly (readonly BlastTerm[])[]): GoalTactic =>
  (index) =>
  (state) =>
    singleSeq(
      (isRotated ? prems.map(countNewHyps) : []).reduce(
        (current, count, offset) =>
          count === 0 ? current : rotateRule(-count, index + offset, current),
        state,
      ),
    );

// Resolution or matching: if the inference updated the branch, the proof state may be updated.
// Matching keeps the tactics more deterministic in the presence of variables.
const emtac = (state: BlastState, isUpdated: boolean, rule: Thm): GoalTactic =>
  isUpdated ? eresolveTac(state.context.limits, [rule]) : ematchTac(state.context.limits, [rule]);

const rmtac = (state: BlastState, isUpdated: boolean, rule: Thm): GoalTactic =>
  isUpdated ? resolveTac(state.context.limits, [rule]) : matchTac(state.context.limits, [rule]);

// fromTerm of the rule's proposition.
const ruleTerm = (state: BlastState, rule: Thm) => {
  const known = state.context.templates.get(rule);
  if (known !== undefined) return fromRuleTemplate(known);
  const made = makeRuleTemplate(state.context.consts, rule.prop);
  state.context.templates.set(rule, made);
  return fromRuleTemplate(made);
};

// A tableau rule from an elimination rule, or undefined for an ill-formed one.
const fromRule = (
  state: BlastState,
  vars: readonly VarRef[],
  rule: Thm,
): TableauRule | undefined => {
  const converted = convertRule(state, vars, ruleTerm(state, rule));
  if (converted === undefined) return undefined;
  return {
    ...converted,
    tactic:
      (isUpdated, isDup, isRotated) =>
      (index): Tactic =>
        thenTac(
          emtac(state, isUpdated, isDup ? revDupElim(rule) : rule)(index),
          rotSubgoalsTac(isRotated, converted.prems)(index),
        ),
  };
};

// A tableau rule from an introduction rule. Since unsafe rules are delayed, dup is always false
// for introduction rules.
const fromIntrRule = (state: BlastState, vars: readonly VarRef[], rule: Thm): TableauRule => {
  const trueprop = state.context.data.trueprop;
  const term = ruleTerm(state, rule);
  const prems = stripBlastImpPrems(trueprop, term);
  const concl = stripBlastImpConcl(trueprop, term);
  const converted = prems.map((prem) => {
    const skolemized = skoPrem(state, vars, prem);
    return [
      mkGoal(stripBlastImpConcl(trueprop, skolemized)),
      ...stripBlastImpPrems(trueprop, skolemized),
    ];
  });
  return {
    major: mkGoal(concl),
    prems: converted,
    tactic:
      (isUpdated, isDup, isRotated) =>
      (index): Tactic =>
        thenTac(
          rmtac(
            state,
            isUpdated,
            isDup ? zeroVarIndexes(rs(rule, state.context.data.classical)) : rule,
          )(index),
          rotSubgoalsTac(isRotated, converted)(index),
        ),
  };
};

// Too flexible assertions or goals, such as those of (!!P. ~P) ==> 0 == 1.
const isVarForm = (state: BlastState, term: BlastTerm) =>
  term.kind === "Var" || destConstApp(term, state.context.data.notName)?.kind === "Var";

const orderRules = (rules: readonly TaggedRule[]) =>
  orderList(rules.map((rule) => ({ tag: rule.tag, item: rule.rule })));

export const netMkRules = (
  state: BlastState,
  formula: BlastTerm,
  vars: readonly VarRef[],
  netpairs: readonly NetPair<TaggedRule>[],
): TableauRule[] => {
  const trueprop = mkConst(state.context.data.trueprop, dummyT);
  const goal = destConstApp(formula, GOAL_NAME);
  if (goal !== undefined) {
    const pattern = mkApp(trueprop, toTerm(2, goal));
    return orderRules(netpairs.flatMap((netpair) => unifyTermNet(netpair.intro, pattern))).map(
      (rule) => fromIntrRule(state, vars, rule),
    );
  }
  if (isVarForm(state, formula)) return [];
  const pattern = mkApp(trueprop, toTerm(3, formula));
  return orderRules(netpairs.flatMap((netpair) => unifyTermNet(netpair.elim, pattern))).flatMap(
    (rule) => fromRule(state, vars, rule) ?? [],
  );
};

// Converts *Goal* to a negated assumption in first position.
export const negOfGoalTac = (state: BlastState): GoalTactic =>
  thenGoal(resolveTac(state.context.limits, [state.context.data.ccontr]), rotateTac(-1));

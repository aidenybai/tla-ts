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
  fromTerm,
  instantiateTemplate,
  mkBlastConst,
  mkBlastSkolem,
  mkBlastVar,
  mkGoal,
  stripBlastImpConcl,
  stripBlastImpPrems,
  toTemplate,
  toTerm,
  type BlastTerm,
  type Template,
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

// Blast converts each rule it looks up afresh, with fresh variables and Skolem terms. This
// converts each rule once, numbering them: concl is the conclusion's variable, which conversion
// sets to *False*, and skolems counts the Skolem terms, which take fresh names in this order. An
// ill-formed rule has no major premise, but still takes the names its conversion took.
export interface RuleTemplate {
  readonly count: number;
  readonly concl: number | undefined;
  readonly skolems: number;
  readonly major: Template | undefined;
  readonly prems: readonly (readonly Template[])[];
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

// Skolemizes a premise with placeholder Skolem terms, adding them to skolems in the order that
// blast names them.
const skoPrem = (skolems: BlastTerm[], prem: BlastTerm): BlastTerm => {
  const body = destConstApp(prem, "Pure.all");
  if (body?.kind !== "Abs") return prem;
  const skolem = mkBlastSkolem("", []);
  skolems.push(skolem);
  return skoPrem(skolems, blastSubstBound(skolem, body.body));
};

const illFormed = (skolems: number): RuleTemplate => ({
  count: 0,
  concl: undefined,
  skolems,
  major: undefined,
  prems: [],
});

// fromRule's convertRule, which expects an elimination rule to have a formula variable as its
// conclusion.
const makeElimTemplate = (state: BlastState, rule: Thm): RuleTemplate => {
  const trueprop = state.context.data.trueprop;
  const term = fromTerm(state.context.consts, rule.prop);
  const refs: VarRef[] = [];
  toTemplate(refs, [], term);
  const prems = stripBlastImpPrems(trueprop, term);
  const concl = stripBlastImpConcl(trueprop, term);
  if (prems.length === 0 || concl.kind !== "Var") return illFormed(0);
  concl.ref.value = mkBlastConst(FALSE_NAME);
  const skolems: BlastTerm[] = [];
  const converted: BlastTerm[][] = [];
  for (const prem of prems.slice(1)) {
    const skolemized = skoPrem(skolems, prem);
    const deleted = deleteConcl(state, [
      mkGoal(stripBlastImpConcl(trueprop, skolemized)),
      ...stripBlastImpPrems(trueprop, skolemized),
    ]);
    if (deleted === undefined) return illFormed(skolems.length);
    converted.push(deleted);
  }
  return {
    count: refs.length,
    concl: refs.indexOf(concl.ref),
    skolems: skolems.length,
    major: toTemplate(refs, skolems, prems[0]),
    prems: converted.map((prem) => prem.map((item) => toTemplate(refs, skolems, item))),
  };
};

// fromIntrRule's conversion.
const makeIntroTemplate = (state: BlastState, rule: Thm): RuleTemplate => {
  const trueprop = state.context.data.trueprop;
  const term = fromTerm(state.context.consts, rule.prop);
  const refs: VarRef[] = [];
  toTemplate(refs, [], term);
  const skolems: BlastTerm[] = [];
  const converted = stripBlastImpPrems(trueprop, term).map((prem) => {
    const skolemized = skoPrem(skolems, prem);
    return [
      mkGoal(stripBlastImpConcl(trueprop, skolemized)),
      ...stripBlastImpPrems(trueprop, skolemized),
    ];
  });
  return {
    count: refs.length,
    concl: undefined,
    skolems: skolems.length,
    major: toTemplate(refs, skolems, mkGoal(stripBlastImpConcl(trueprop, term))),
    prems: converted.map((prem) => prem.map((item) => toTemplate(refs, skolems, item))),
  };
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

const elimRuleTactic =
  (state: BlastState, rule: Thm, prems: readonly (readonly BlastTerm[])[]) =>
  (isUpdated: boolean, isDup: boolean, isRotated: boolean) =>
  (index: number): Tactic =>
    thenTac(
      emtac(state, isUpdated, isDup ? revDupElim(rule) : rule)(index),
      rotSubgoalsTac(isRotated, prems)(index),
    );

const intrRuleTactic =
  (state: BlastState, rule: Thm, prems: readonly (readonly BlastTerm[])[]) =>
  (isUpdated: boolean, isDup: boolean, isRotated: boolean) =>
  (index: number): Tactic =>
    thenTac(
      rmtac(
        state,
        isUpdated,
        isDup ? zeroVarIndexes(rs(rule, state.context.data.classical)) : rule,
      )(index),
      rotSubgoalsTac(isRotated, prems)(index),
    );

// A tableau rule from a rule's template. Blast tries the rules in order until one's major premise
// unifies, and often only checks that a rule exists, so this instantiates the template with fresh
// variables only when the major premise is used, and the premises only when they are.
class InstantiatedRule implements TableauRule {
  private readonly state: BlastState;
  private readonly rule: Thm;
  private readonly isIntro: boolean;
  private readonly template: RuleTemplate;
  private readonly majorTemplate: Template;
  private readonly skolems: readonly BlastTerm[];
  private vars: readonly BlastTerm[] | undefined;
  private instantiatedMajor: BlastTerm | undefined;
  private instantiatedPrems: readonly (readonly BlastTerm[])[] | undefined;

  constructor(
    state: BlastState,
    rule: Thm,
    isIntro: boolean,
    template: RuleTemplate,
    majorTemplate: Template,
    skolems: readonly BlastTerm[],
  ) {
    this.state = state;
    this.rule = rule;
    this.isIntro = isIntro;
    this.template = template;
    this.majorTemplate = majorTemplate;
    this.skolems = skolems;
  }

  // Fresh variables for the template's, with the conclusion's set to *False*.
  private getVars() {
    if (this.vars !== undefined) return this.vars;
    const vars: BlastTerm[] = [];
    for (let index = 0; index < this.template.count; index += 1)
      vars.push(
        mkBlastVar({
          value: index === this.template.concl ? mkBlastConst(FALSE_NAME) : undefined,
        }),
      );
    this.vars = vars;
    return vars;
  }

  get major() {
    this.instantiatedMajor ??= instantiateTemplate(
      this.getVars(),
      this.skolems,
      this.majorTemplate,
    );
    return this.instantiatedMajor;
  }

  get prems() {
    this.instantiatedPrems ??= this.template.prems.map((prem) =>
      prem.map((template) => instantiateTemplate(this.getVars(), this.skolems, template)),
    );
    return this.instantiatedPrems;
  }

  // Since unsafe rules are delayed, dup is always false for introduction rules.
  tactic(isUpdated: boolean, isDup: boolean, isRotated: boolean) {
    return (this.isIntro ? intrRuleTactic : elimRuleTactic)(this.state, this.rule, this.prems)(
      isUpdated,
      isDup,
      isRotated,
    );
  }
}

// fromRule or fromIntrRule: undefined for an ill-formed rule. Its Skolem terms take their names
// now, as blast converts all the rules it looks up at once.
const instantiateRule = (
  state: BlastState,
  vars: readonly VarRef[],
  rule: Thm,
  isIntro: boolean,
): TableauRule | undefined => {
  const templates = isIntro ? state.context.introTemplates : state.context.elimTemplates;
  const known = templates.get(rule);
  const template =
    known ?? (isIntro ? makeIntroTemplate(state, rule) : makeElimTemplate(state, rule));
  if (known === undefined) templates.set(rule, template);
  const skolems: BlastTerm[] = [];
  for (let slot = 0; slot < template.skolems; slot += 1)
    skolems.push(mkBlastSkolem(gensym(state, "S"), vars));
  return template.major === undefined
    ? undefined
    : new InstantiatedRule(state, rule, isIntro, template, template.major, skolems);
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
  const goal = destConstApp(formula, GOAL_NAME);
  if (goal === undefined && isVarForm(state, formula)) return [];
  const trueprop = mkConst(state.context.data.trueprop, dummyT);
  const pattern =
    goal === undefined ? mkApp(trueprop, toTerm(3, formula)) : mkApp(trueprop, toTerm(2, goal));
  const matched: TaggedRule[] = [];
  for (const netpair of netpairs)
    for (const rule of unifyTermNet(goal === undefined ? netpair.elim : netpair.intro, pattern))
      matched.push(rule);
  const rules: TableauRule[] = [];
  for (const rule of orderRules(matched)) {
    const instantiated = instantiateRule(state, vars, rule, goal !== undefined);
    if (instantiated !== undefined) rules.push(instantiated);
  }
  return rules;
};

// Converts *Goal* to a negated assumption in first position.
export const negOfGoalTac = (state: BlastState): GoalTactic =>
  thenGoal(resolveTac(state.context.limits, [state.context.data.ccontr]), rotateTac(-1));

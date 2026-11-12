// Ported from Isabelle2025's Provers/classical.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { revcutRl, thinRl, zeroVarIndexes, makeElim } from "../pure/drule";
import { selectGoal } from "../pure/goal";
import { aconv, sizeOfTerm } from "../pure/term";
import { stripAssumsConcl, stripAssumsHyp } from "../pure/logic";
import { listOfSeq, seqHead } from "../pure/seq";
import { trade } from "../pure/variable";
import { atomizePremsTac, flatRule } from "../pure/object-logic";
import { bestFirst } from "../pure/search";
import {
  allGoals,
  allTac,
  appendGoal,
  condTac,
  depthSolve,
  firstGoal,
  firstGoalTac,
  hasFewerPrems,
  noTac,
  orElse,
  orElseGoal,
  repeatDeterm,
  repeatDeterm1,
  subgoal,
  thenGoal,
  thenTac,
  type GoalTactic,
  type Tactic,
} from "../pure/tactical";
import type { Limits } from "../pure/interrupt";
import {
  assumeTac,
  biresolutionFromNetsTac,
  biresolveFromNetsTac,
  bimatchFromNetsTac,
  eqAssumeTac,
  ematchTac,
  eresolveTac,
  insertTaggedBrl,
  orderTagged,
  subgoalsOfBrl,
  type NetPair,
  type TaggedRule,
} from "../pure/tactic";
import { assumption, biresolution, nprems, premsOf, rs, rsn, type Thm } from "../pure/thm";
import type { ContextRule } from "../tools/intuitionistic";

export interface ClassicalRule {
  readonly rule: Thm;
  readonly internal: Thm;
  readonly swapped: readonly Thm[];
  readonly dup: Thm;
  readonly dupSwapped: readonly Thm[];
}

export interface Wrapper {
  readonly name: string;
  readonly wrap: (tactic: GoalTactic) => GoalTactic;
}

export interface Claset {
  // Newest first, as Item_Net.content lists them.
  readonly safeIs: readonly ClassicalRule[];
  readonly safeEs: readonly ClassicalRule[];
  readonly unsafeIs: readonly ClassicalRule[];
  readonly unsafeEs: readonly ClassicalRule[];
  readonly swrappers: readonly Wrapper[];
  readonly uwrappers: readonly Wrapper[];
  readonly safe0: NetPair<TaggedRule>;
  readonly safep: NetPair<TaggedRule>;
  readonly unsafe: NetPair<TaggedRule>;
  readonly dup: NetPair<TaggedRule>;
  readonly extra: NetPair<ContextRule>;
}

export interface ClassicalData {
  // P --> Q ==> (~ R ==> P) ==> (Q ==> R) ==> R
  readonly impElim: Thm;
  // ~P ==> P ==> R
  readonly notElim: Thm;
  // ~ P ==> (~ R ==> P) ==> R
  readonly swap: Thm;
  // (~ P ==> P) ==> P
  readonly classical: Thm;
  readonly judgment: string;
  readonly hypSubstTacs: readonly ((limits: Limits) => GoalTactic)[];
}

export interface ClassicalContext {
  readonly limits: Limits;
  readonly claset: Claset;
  readonly data: ClassicalData;
}

export const withClaset = (context: ClassicalContext, claset: Claset): ClassicalContext => ({
  ...context,
  claset,
});

const classicalRule = (data: ClassicalData, rule: Thm, limits: Limits): Thm => {
  const concl = premsOf(rule).length === 0 ? rule.prop : stripAssumsConcl(rule.prop);
  const body =
    concl.kind === "App" && concl.fun.kind === "Const" && concl.fun.name === data.judgment
      ? concl.arg
      : concl;
  const isElim =
    body.kind === "Var" && premsOf(rule).some((premise) => aconv(concl, stripAssumsConcl(premise)));
  if (!isElim) return rule;
  const strengthened = rs(rule, data.classical);
  const strengthenedConcl = stripAssumsConcl(strengthened.prop);
  const isRedundant = (goal: ReturnType<typeof premsOf>[number]) => {
    if (aconv(strengthenedConcl, stripAssumsConcl(goal))) return true;
    const hyps = stripAssumsHyp(goal);
    return hyps.length > 0 && hyps.slice(1).some((hyp) => aconv(hyp, hyps[0]));
  };
  const thinned = seqHead(
    allGoals(
      subgoal((goal, index) =>
        index === 1 || isRedundant(goal) ? eresolveTac(limits, [thinRl])(index) : allTac,
      ),
    )(strengthened),
  );
  if (thinned === undefined) throw new TlaIsabelleError("THM", "classical_rule");
  const result = zeroVarIndexes(thinned);
  return aconv(result.prop, rule.prop) ? rule : result;
};

const swapify = (data: ClassicalData, rules: readonly Thm[]) =>
  rules.flatMap((rule) =>
    listOfSeq(biresolution(undefined, false, [{ isElim: false, rule }], 2, data.swap)),
  );

const dupIntr = (data: ClassicalData, rule: Thm) => zeroVarIndexes(rs(rule, data.classical));

const ruleByTactic = (tactic: Tactic, rule: Thm): Thm =>
  zeroVarIndexes(
    trade((fixed) => {
      const result = seqHead(tactic(fixed));
      if (result === undefined) throw new TlaIsabelleError("THM", "rule_by_tactic");
      return [result];
    }, rule)[0],
  );

const dupElim = (limits: Limits, rule: Thm) => {
  const duplicated = seqHead(assumption(undefined, 2, rsn(rule, 2, revcutRl)));
  if (duplicated === undefined) throw new TlaIsabelleError("THM", "dup_elim");
  return ruleByTactic(
    allGoals((index) => orElse(eresolveTac(limits, [revcutRl])(index), allTac)),
    duplicated,
  );
};

// tag_brls: rules with fewer subgoals first, then the rules added last.
const tagRules = (start: number, rules: readonly { isElim: boolean; rule: Thm }[]): TaggedRule[] =>
  rules.map((brule, index) => ({ tag: 1000000 * subgoalsOfBrl(brule) + start + index, ...brule }));

const insertRules = (
  counts: readonly [number, number],
  intros: readonly Thm[],
  elims: readonly Thm[],
  netpair: NetPair<TaggedRule>,
) =>
  tagRules(-(2 * counts[0] + counts[1]), [
    ...elims.map((rule) => ({ isElim: true, rule })),
    ...intros.map((rule) => ({ isElim: false, rule })),
  ]).reduceRight((result, tagged) => insertTaggedBrl(tagged, result), netpair);

// insert' with the default weight of an unsafe rule.
const insertExtra = (
  counts: readonly [number, number],
  isElim: boolean,
  rule: Thm,
  netpair: NetPair<ContextRule>,
) => insertTaggedBrl({ weight: 1, tag: -(counts[0] + counts[1]), isElim, rule }, netpair);

const isMember = (rules: readonly ClassicalRule[], rule: ClassicalRule) =>
  rules.some((other) => aconv(other.rule.prop, rule.rule.prop));

export const addUnsafeIntro = (
  context: ClassicalContext,
  rule: Thm,
  atomizeRules: readonly Thm[],
): Claset => {
  const claset = context.claset;
  const flat = flatRule(context.limits, atomizeRules, rule);
  const dup = dupIntr(context.data, flat);
  const entry: ClassicalRule = {
    rule,
    internal: flat,
    swapped: swapify(context.data, [flat]),
    dup,
    dupSwapped: swapify(context.data, [dup]),
  };
  if (isMember(claset.unsafeIs, entry)) return claset;
  const counts = [claset.unsafeIs.length + 1, claset.unsafeEs.length] as const;
  return {
    ...claset,
    unsafeIs: [entry, ...claset.unsafeIs],
    unsafe: insertRules(counts, [entry.internal], entry.swapped, claset.unsafe),
    dup: insertRules(counts, [entry.dup], entry.dupSwapped, claset.dup),
    extra: insertExtra(counts, false, rule, claset.extra),
  };
};

const addUnsafeElim = (
  context: ClassicalContext,
  rule: Thm,
  atomizeRules: readonly Thm[],
): Claset => {
  const claset = context.claset;
  if (nprems(rule) < 1) throw new TlaIsabelleError("ERROR", "Ill-formed elimination rule");
  const internal = classicalRule(
    context.data,
    flatRule(context.limits, atomizeRules, rule),
    context.limits,
  );
  const entry: ClassicalRule = {
    rule,
    internal,
    swapped: [],
    dup: dupElim(context.limits, internal),
    dupSwapped: [],
  };
  if (isMember(claset.unsafeEs, entry)) return claset;
  const counts = [claset.unsafeIs.length, claset.unsafeEs.length + 1] as const;
  return {
    ...claset,
    unsafeEs: [entry, ...claset.unsafeEs],
    unsafe: insertRules(counts, [], [entry.internal], claset.unsafe),
    dup: insertRules(counts, [], [entry.dup], claset.dup),
    extra: insertExtra(counts, true, rule, claset.extra),
  };
};

export const addUnsafeDest = (
  context: ClassicalContext,
  rule: Thm,
  atomizeRules: readonly Thm[],
): Claset => {
  if (nprems(rule) < 1) throw new TlaIsabelleError("ERROR", "Ill-formed destruction rule");
  return addUnsafeElim(context, makeElim(rule), atomizeRules);
};

// AList.update: replaces a wrapper of the same name in place, or adds it in front.
const updateWrappers = (wrappers: readonly Wrapper[], wrapper: Wrapper) =>
  wrappers.some((other) => other.name === wrapper.name)
    ? wrappers.map((other) => (other.name === wrapper.name ? wrapper : other))
    : [wrapper, ...wrappers];

export const addSafter = (claset: Claset, name: string, tactic: GoalTactic): Claset => ({
  ...claset,
  swrappers: updateWrappers(claset.swrappers, { name, wrap: (inner) => orElseGoal(inner, tactic) }),
});

export const addbefore = (claset: Claset, name: string, tactic: GoalTactic): Claset => ({
  ...claset,
  uwrappers: updateWrappers(claset.uwrappers, { name, wrap: (inner) => appendGoal(tactic, inner) }),
});

const appSWrappers = (context: ClassicalContext, tactic: GoalTactic) =>
  context.claset.swrappers.reduce((result, wrapper) => wrapper.wrap(result), tactic);

export const appWrappers = (context: ClassicalContext, tactic: GoalTactic) =>
  context.claset.uwrappers.reduce((result, wrapper) => wrapper.wrap(result), tactic);

const contrTac = (context: ClassicalContext): GoalTactic =>
  thenGoal(
    eresolveTac(context.limits, [context.data.notElim]),
    orElseGoal(eqAssumeTac, assumeTac(context.limits)),
  );

const eqMpTac =
  (context: ClassicalContext): GoalTactic =>
  (index) =>
    thenTac(
      ematchTac(context.limits, [context.data.notElim, context.data.impElim])(index),
      eqAssumeTac(index),
    );

const safeStepTac = (context: ClassicalContext): GoalTactic =>
  appSWrappers(
    context,
    firstGoal([
      eqAssumeTac,
      eqMpTac(context),
      bimatchFromNetsTac(context.limits, context.claset.safe0),
      firstGoal(context.data.hypSubstTacs.map((tactic) => tactic(context.limits))),
      bimatchFromNetsTac(context.limits, context.claset.safep),
    ]),
  );

export const safeStepsTac =
  (context: ClassicalContext): GoalTactic =>
  (index) =>
    repeatDeterm1(
      condTac(hasFewerPrems(index), noTac, (state) => safeStepTac(context)(index)(state)),
    );

export const safeTac = (context: ClassicalContext): Tactic =>
  repeatDeterm1(firstGoalTac(safeStepsTac(context)));

const nBimatchFromNetsTac = (
  context: ClassicalContext,
  count: number,
  netpair: NetPair<TaggedRule>,
) =>
  biresolutionFromNetsTac(
    context.limits,
    (rules: TaggedRule[]) => orderTagged(rules.filter((rule) => subgoalsOfBrl(rule) === count)),
    true,
    netpair,
  );

const eqContrTac =
  (context: ClassicalContext): GoalTactic =>
  (index) =>
    thenTac(ematchTac(context.limits, [context.data.notElim])(index), eqAssumeTac(index));

const eqAssumeContrTac = (context: ClassicalContext) =>
  orElseGoal(eqAssumeTac, eqContrTac(context));

const bimatch2Tac =
  (context: ClassicalContext, netpair: NetPair<TaggedRule>): GoalTactic =>
  (index) =>
    thenTac(
      nBimatchFromNetsTac(context, 2, netpair)(index),
      orElse(eqAssumeContrTac(context)(index), eqAssumeContrTac(context)(index + 1)),
    );

const clarifyStepTac = (context: ClassicalContext): GoalTactic =>
  appSWrappers(
    context,
    firstGoal([
      eqAssumeContrTac(context),
      bimatchFromNetsTac(context.limits, context.claset.safe0),
      firstGoal(context.data.hypSubstTacs.map((tactic) => tactic(context.limits))),
      nBimatchFromNetsTac(context, 1, context.claset.safep),
      bimatch2Tac(context, context.claset.safep),
    ]),
  );

export const clarifyTac = (context: ClassicalContext): GoalTactic =>
  selectGoal(repeatDeterm(clarifyStepTac(context)(1)));

export const inst0StepTac = (context: ClassicalContext): GoalTactic =>
  appendGoal(
    assumeTac(context.limits),
    appendGoal(contrTac(context), biresolveFromNetsTac(context.limits, context.claset.safe0)),
  );

export const instpStepTac = (context: ClassicalContext): GoalTactic =>
  biresolveFromNetsTac(context.limits, context.claset.safep);

const instStepTac = (context: ClassicalContext): GoalTactic =>
  appendGoal(inst0StepTac(context), instpStepTac(context));

export const unsafeStepTac = (context: ClassicalContext): GoalTactic =>
  biresolveFromNetsTac(context.limits, context.claset.unsafe);

const stepTac =
  (context: ClassicalContext): GoalTactic =>
  (index) =>
    orElse(
      safeTac(context),
      appWrappers(context, orElseGoal(instStepTac(context), unsafeStepTac(context)))(index),
    );

export const fastTac = (context: ClassicalContext, atomizeRules: readonly Thm[]): GoalTactic =>
  thenGoal(
    atomizePremsTac(context.limits, atomizeRules),
    selectGoal(depthSolve(stepTac(context)(1))),
  );

const sizeOfThm = (thm: Thm) =>
  thm.tpairs.reduce(
    (size, pair) => size + 2 + sizeOfTerm(pair[0]) + sizeOfTerm(pair[1]),
    sizeOfTerm(thm.prop),
  );

export const firstBestTac = (context: ClassicalContext, atomizeRules: readonly Thm[]): GoalTactic =>
  thenGoal(
    atomizePremsTac(context.limits, atomizeRules),
    selectGoal(bestFirst(hasFewerPrems(1), sizeOfThm, firstGoalTac(stepTac(context)))),
  );

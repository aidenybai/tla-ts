// Ported from Isabelle2025's Tools/intuitionistic.ML and the rule order of
// Pure/Isar/context_rules.ML. Copyright (c) 1986-2025 University of Cambridge, Technische
// Universitaet Muenchen, and contributors, see LICENSE.
//
// iprover: intuitionistic proof search with the context rules, the rules declared intro, elim and
// dest. Isabelle/TLA+ declares no context rule wrappers, so Swrap and wrap leave tactics as they
// are.

import { remdupsRl } from "../pure/drule";
import { selectGoal } from "../pure/goal";
import { deepen } from "../pure/search";
import { stripAssumsConcl, stripAssumsHyp } from "../pure/logic";
import {
  assumeTac,
  biresolutionFromNetsTac,
  eqAssumeTac,
  ematchTac,
  type Limits,
  type NetPair,
} from "../pure/tactic";
import {
  appendGoal,
  noTac,
  orElse,
  orElseGoal,
  repeatDeterm1,
  repeatDetermN,
  subgoal,
  thenAllNew,
  thenTac,
  type GoalTactic,
} from "../pure/tactical";
import { aconv, type Term } from "../pure/term";
import type { BiresRule, Thm } from "../pure/thm";

export interface ContextRule {
  readonly weight: number;
  readonly tag: number;
  readonly isElim: boolean;
  readonly rule: Thm;
}

export interface IntuitionisticContext {
  readonly limits: Limits;
  // Context_Rules.netpair_bang and Context_Rules.netpair.
  readonly safeRules: NetPair<ContextRule>;
  readonly rules: NetPair<ContextRule>;
}

interface Visited {
  readonly hyps: readonly Term[];
  readonly concl: Term;
}

// Context_Rules.orderlist: by weight, then by tag, dropping all but the last of equal keys.
const orderRules = (rules: ContextRule[]): BiresRule[] => {
  const sorted = [...rules].sort(
    (left, right) => left.weight - right.weight || left.tag - right.tag,
  );
  return sorted
    .filter(
      (rule, index) =>
        index + 1 >= sorted.length ||
        sorted[index + 1].weight !== rule.weight ||
        sorted[index + 1].tag !== rule.tag,
    )
    .map((rule) => ({ isElim: rule.isElim, rule: rule.rule }));
};

const countDistinct = (terms: readonly Term[]) =>
  terms.reduce<Term[]>(
    (result, term) => (result.some((other) => aconv(other, term)) ? result : [...result, term]),
    [],
  ).length;

const isSubset = (left: readonly Term[], right: readonly Term[]) =>
  left.every((term) => right.some((other) => aconv(term, other)));

const remdupsTac = (limits: Limits): GoalTactic =>
  subgoal((goal, index) => {
    const prems = stripAssumsHyp(goal);
    return repeatDetermN(
      prems.length - countDistinct(prems),
      thenTac(ematchTac(limits, [remdupsRl])(index), eqAssumeTac(index)),
    );
  });

const stepTac = (context: IntuitionisticContext): GoalTactic => {
  const limits = context.limits;
  const biresTac = (match: boolean, netpair: NetPair<ContextRule>) =>
    biresolutionFromNetsTac(limits, orderRules, match, netpair);
  const safeStepTac = thenAllNew(
    orElseGoal(eqAssumeTac, biresTac(true, context.safeRules)),
    remdupsTac(limits),
  );
  const unsafeStepTac = thenAllNew(
    appendGoal(
      assumeTac(limits),
      appendGoal(biresTac(false, context.safeRules), biresTac(false, context.rules)),
    ),
    remdupsTac(limits),
  );
  return (index) => orElse(repeatDeterm1(safeStepTac(index)), unsafeStepTac(index));
};

const intproverTac = (
  context: IntuitionisticContext,
  visited: readonly Visited[],
  depth: number,
  limit: number,
): GoalTactic =>
  subgoal((goal, index) => {
    if (depth > limit) return noTac;
    const hyps = stripAssumsHyp(goal);
    const concl = stripAssumsConcl(goal);
    const isVisited = visited.some(
      (other) =>
        aconv(other.concl, concl) &&
        other.hyps.length === hyps.length &&
        isSubset(other.hyps, hyps) &&
        isSubset(hyps, other.hyps),
    );
    if (isVisited) return noTac;
    return thenAllNew(
      stepTac(context),
      intproverTac(context, [{ hyps, concl }, ...visited], depth + 1, limit),
    )(index);
  });

// Intuitionistic.prover_tac with the default depth limit.
export const proverTac = (context: IntuitionisticContext): GoalTactic =>
  selectGoal(deepen(2, 20, (limit) => intproverTac(context, [], 0, limit), 4)(1));

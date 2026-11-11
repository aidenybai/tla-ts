// Ported from Isabelle2025's Pure/tactic.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { makeElim } from "./drule";
import { checkInterrupt, type Limits } from "./interrupt";
import { stripAssumsConcl, stripAssumsHyp } from "./logic";
import { insertTermNet, unifyTermNet, type Net } from "./net";
import {
  assumption,
  bicompose,
  biresolution,
  conclOf,
  eqAssumption,
  flexflexRule,
  majorPremOf,
  nprems,
  rotateRule,
  type BiresRule,
  type Thm,
} from "./thm";
import { allTac, primitive, primSeq, subgoal, type GoalTactic, type Tactic } from "./tactical";

export const assumeTac =
  (limits: Limits): GoalTactic =>
  (index) =>
    primSeq((state) => {
      checkInterrupt(limits);
      return assumption(limits, index, state);
    });

export const eqAssumeTac: GoalTactic = (index) => primitive((state) => eqAssumption(index, state));

export const composeTac =
  (limits: Limits, isElim: boolean, rule: Thm, subgoals: number): GoalTactic =>
  (index) =>
    primSeq((state) =>
      bicompose(
        limits,
        { flatten: true, match: false, incremented: false },
        { isElim, rule, subgoals },
        index,
        state,
      ),
    );

const biresolveTac =
  (limits: Limits, match: boolean, rules: readonly BiresRule[]): GoalTactic =>
  (index) =>
    primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(limits, match, rules, index, state);
    });

export const resolveTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    false,
    rules.map((rule) => ({ isElim: false, rule })),
  );

export const eresolveTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    false,
    rules.map((rule) => ({ isElim: true, rule })),
  );

export const dresolveTac = (limits: Limits, rules: readonly Thm[]) =>
  eresolveTac(limits, rules.map(makeElim));

export const matchTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    true,
    rules.map((rule) => ({ isElim: false, rule })),
  );

export const ematchTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    true,
    rules.map((rule) => ({ isElim: true, rule })),
  );

export const flexflexTac = (limits: Limits): Tactic =>
  primSeq((state) => flexflexRule(limits, state));

export interface TaggedRule {
  readonly tag: number;
  readonly isElim: boolean;
  readonly rule: Thm;
}

export interface NetPair<Tagged> {
  readonly intro: Net<Tagged>;
  readonly elim: Net<Tagged>;
}

export const insertTaggedBrl = <Tagged extends BiresRule>(
  tagged: Tagged,
  netpair: NetPair<Tagged>,
): NetPair<Tagged> =>
  tagged.isElim
    ? { intro: netpair.intro, elim: insertTermNet(majorPremOf(tagged.rule), tagged, netpair.elim) }
    : { intro: insertTermNet(conclOf(tagged.rule), tagged, netpair.intro), elim: netpair.elim };

export const orderList = <Item>(items: readonly { tag: number; item: Item }[]): Item[] => {
  const sorted = [...items];
  for (let index = 1; index < sorted.length; index += 1) {
    const entry = sorted[index];
    let position = index;
    for (; position > 0 && sorted[position - 1].tag > entry.tag; position -= 1)
      sorted[position] = sorted[position - 1];
    sorted[position] = entry;
  }
  const result: Item[] = [];
  for (let index = 0; index < sorted.length; index += 1)
    if (index + 1 === sorted.length || sorted[index + 1].tag !== sorted[index].tag)
      result.push(sorted[index].item);
  return result;
};

export const biresolutionFromNetsTac = <Tagged extends BiresRule>(
  limits: Limits,
  order: (rules: Tagged[]) => BiresRule[],
  match: boolean,
  netpair: NetPair<Tagged>,
): GoalTactic =>
  subgoal((goal, index) => {
    const hyps = stripAssumsHyp(goal);
    const concl = stripAssumsConcl(goal);
    const rules = [
      ...unifyTermNet(netpair.intro, concl),
      ...hyps.flatMap((hyp) => unifyTermNet(netpair.elim, hyp)),
    ];
    return primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(limits, match, order(rules), index, state);
    });
  });

export const orderTagged = (rules: readonly TaggedRule[]): BiresRule[] =>
  orderList(
    rules.map((rule) => ({ tag: rule.tag, item: { isElim: rule.isElim, rule: rule.rule } })),
  );

export const biresolveFromNetsTac = (limits: Limits, netpair: NetPair<TaggedRule>) =>
  biresolutionFromNetsTac(limits, orderTagged, false, netpair);

export const bimatchFromNetsTac = (limits: Limits, netpair: NetPair<TaggedRule>) =>
  biresolutionFromNetsTac(limits, orderTagged, true, netpair);

export const subgoalsOfBrl = (brule: BiresRule) =>
  brule.isElim ? nprems(brule.rule) - 1 : nprems(brule.rule);

export const rotateTac =
  (count: number): GoalTactic =>
  (index) =>
    count === 0 ? allTac : primitive((state) => rotateRule(count, index, state));

// Ported from Isabelle2025's Pure/tactic.ML, the basic resolution tactics. Copyright (c) 1986-2025
// University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { cutRl, makeElim, thinRl } from "./drule";
import { stripAssumsConcl, stripAssumsHyp } from "./logic";
import { insertTermNet, unifyTermNet, deleteTermSafe, emptyNet, type Net } from "./net";
import {
  assumption,
  bicompose,
  biresolution,
  conclOf,
  eqAssumption,
  flexflexRule,
  majorPremOf,
  nprems,
  permutePrems,
  rotateRule,
  type BiresRule,
  type Thm,
} from "./thm";
import {
  allTac,
  every,
  noTac,
  orElseGoal,
  primitive,
  primSeq,
  subgoal,
  thenGoal,
  thenTac,
  type GoalTactic,
  type Tactic,
} from "./tactical";
import { eqThmProp } from "./tactical";

// When a proof gives up: past the deadline, a time from Date.now(), or once the signal aborts.
export interface Limits {
  readonly deadline: number;
  readonly signal?: AbortSignal;
}

// Isabelle interrupts a proof that runs out of time; tlapm reports no success.
export const checkInterrupt = (limits: Limits) => {
  if (Date.now() > limits.deadline || limits.signal?.aborted === true)
    throw new TlaIsabelleError("Interrupt", "Interrupt");
};

export const assumeTac =
  (limits: Limits): GoalTactic =>
  (index) =>
    primSeq((state) => {
      checkInterrupt(limits);
      return assumption(index, state);
    });

export const eqAssumeTac: GoalTactic = (index) => primitive((state) => eqAssumption(index, state));

export const composeTac = (isElim: boolean, rule: Thm, subgoals: number): GoalTactic => (index) =>
  primSeq((state) => bicompose({ flatten: true, match: false, incremented: false }, { isElim, rule, subgoals }, index, state));

export const biresolveTac =
  (limits: Limits, rules: readonly BiresRule[]): GoalTactic =>
  (index) =>
    primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(false, rules, index, state);
    });

export const resolveTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    rules.map((rule) => ({ isElim: false, rule })),
  );

export const eresolveTac = (limits: Limits, rules: readonly Thm[]) =>
  biresolveTac(
    limits,
    rules.map((rule) => ({ isElim: true, rule })),
  );

export const dresolveTac = (limits: Limits, rules: readonly Thm[]) => eresolveTac(limits, rules.map(makeElim));

export const forwardTac = (limits: Limits, rules: readonly Thm[]) =>
  thenGoal(resolveTac(limits, rules.map(makeElim)), assumeTac(limits));

export const aresTac = (limits: Limits, rules: readonly Thm[]) => orElseGoal(assumeTac(limits), resolveTac(limits, rules));

export const bimatchTac =
  (limits: Limits, rules: readonly BiresRule[]): GoalTactic =>
  (index) =>
    primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(true, rules, index, state);
    });

export const matchTac = (limits: Limits, rules: readonly Thm[]) =>
  bimatchTac(
    limits,
    rules.map((rule) => ({ isElim: false, rule })),
  );

export const ematchTac = (limits: Limits, rules: readonly Thm[]) =>
  bimatchTac(
    limits,
    rules.map((rule) => ({ isElim: true, rule })),
  );

export const flexflexTac: Tactic = primSeq(flexflexRule);

export const cutTac = (rule: Thm, index: number) =>
  thenTac(
    primSeq((state) => biresolution(false, [{ isElim: false, rule: cutRl }], index, state)),
    primSeq((state) => biresolution(false, [{ isElim: false, rule }], index + 1, state)),
  );

export const cutRulesTac = (rules: readonly Thm[], index: number) => every(rules.map((rule) => cutTac(rule, index)));

export const cutFactsTac = (rules: readonly Thm[], index: number) =>
  cutRulesTac(
    rules.filter((rule) => nprems(rule) === 0),
    index,
  );

export interface TaggedRule {
  readonly tag: number;
  readonly isElim: boolean;
  readonly rule: Thm;
}

export interface NetPair<Tagged> {
  readonly intro: Net<Tagged>;
  readonly elim: Net<Tagged>;
}

export const emptyNetPair: NetPair<never> = { intro: emptyNet, elim: emptyNet };

// Tactic.insert_tagged_brl
export const insertTaggedBrl = <Tagged extends { isElim: boolean; rule: Thm }>(
  tagged: Tagged,
  netpair: NetPair<Tagged>,
): NetPair<Tagged> =>
  tagged.isElim
    ? { intro: netpair.intro, elim: insertTermNet(majorPremOf(tagged.rule), tagged, netpair.elim) }
    : { intro: insertTermNet(conclOf(tagged.rule), tagged, netpair.intro), elim: netpair.elim };

const eqKbrl = (left: { rule: Thm }, right: { rule: Thm }) => eqThmProp(left.rule, right.rule);

// Tactic.delete_tagged_brl
export const deleteTaggedBrl = <Tagged extends { isElim: boolean; rule: Thm }>(
  brule: { isElim: boolean; rule: Thm },
  netpair: NetPair<Tagged>,
): NetPair<Tagged> => {
  if (brule.isElim) {
    if (nprems(brule.rule) === 0) return netpair;
    return {
      intro: netpair.intro,
      elim: deleteTermSafe(eqKbrl, majorPremOf(brule.rule), brule as Tagged, netpair.elim),
    };
  }
  return { intro: deleteTermSafe(eqKbrl, conclOf(brule.rule), brule as Tagged, netpair.intro), elim: netpair.elim };
};

// Library.order_list: by tag, dropping all but the last item with each tag.
export const orderList = <Item>(items: readonly { tag: number; item: Item }[]): Item[] => {
  const sorted = [...items].sort((left, right) => left.tag - right.tag);
  return sorted.filter((entry, index) => index + 1 >= sorted.length || sorted[index + 1].tag !== entry.tag).map((entry) => entry.item);
};

// Tactic.biresolution_from_nets_tac
export const biresolutionFromNetsTac = <Tagged extends { isElim: boolean; rule: Thm }>(
  limits: Limits,
  order: (rules: Tagged[]) => BiresRule[],
  match: boolean,
  netpair: NetPair<Tagged>,
): GoalTactic =>
  subgoal((goal, index) => {
    const hyps = stripAssumsHyp(goal);
    const concl = stripAssumsConcl(goal);
    const rules = [...unifyTermNet(netpair.intro, concl), ...hyps.flatMap((hyp) => unifyTermNet(netpair.elim, hyp))];
    return primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(match, order(rules), index, state);
    });
  });

export const orderTagged = (rules: readonly TaggedRule[]): BiresRule[] =>
  orderList(rules.map((rule) => ({ tag: rule.tag, item: { isElim: rule.isElim, rule: rule.rule } })));

export const biresolveFromNetsTac = (limits: Limits, netpair: NetPair<TaggedRule>) =>
  biresolutionFromNetsTac(limits, orderTagged, false, netpair);

export const bimatchFromNetsTac = (limits: Limits, netpair: NetPair<TaggedRule>) =>
  biresolutionFromNetsTac(limits, orderTagged, true, netpair);

// Tactic.build_net
export const buildNet = (rules: readonly Thm[]): Net<{ tag: number; rule: Thm }> =>
  rules.reduceRight<Net<{ tag: number; rule: Thm }>>(
    (net, rule, index) => insertTermNet(conclOf(rule), { tag: index + 1, rule }, net),
    emptyNet,
  );

export const resolveFromNetTac = (limits: Limits, net: Net<{ tag: number; rule: Thm }>): GoalTactic =>
  subgoal((goal, index) => {
    const rules = unifyTermNet(net, stripAssumsConcl(goal));
    return primSeq((state) => {
      checkInterrupt(limits);
      return biresolution(
        false,
        orderList(rules.map((rule) => ({ tag: rule.tag, item: { isElim: false, rule: rule.rule } }))),
        index,
        state,
      );
    });
  });

// The number of new subgoals of a rule.
export const subgoalsOfBrl = (brule: { isElim: boolean; rule: Thm }) =>
  brule.isElim ? nprems(brule.rule) - 1 : nprems(brule.rule);

export const rotateTac =
  (count: number): GoalTactic =>
  (index) =>
    count === 0 ? allTac : primitive((state) => rotateRule(count, index, state));

export const deferTac: GoalTactic = (index) => primitive((state) => permutePrems(index - 1, 1, state));

// Tactic.filter_prems_tac: removes the premises that fail the predicate.
export const filterPremsTac = (limits: Limits, predicate: (hyp: ReturnType<typeof stripAssumsConcl>) => boolean): GoalTactic =>
  subgoal((goal, index) => {
    let tactic: GoalTactic | undefined;
    let count = 0;
    for (const hyp of stripAssumsHyp(goal)) {
      if (predicate(hyp)) count += 1;
      else {
        const step = thenGoal(rotateTac(count), eresolveTac(limits, [thinRl]));
        tactic = tactic === undefined ? step : thenGoal(tactic, step);
        count = 0;
      }
    }
    return tactic === undefined ? noTac : tactic(index);
  });

// Ported from Isabelle2025's Pure/tactical.ML and Pure/search.ML. Copyright (c) 1986-2025
// University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { aeconv } from "./envir";
import {
  appendSeq,
  emptySeq,
  filterSeq,
  makeSeq,
  mapsSeq,
  ofCell,
  singleSeq,
  type Cell,
  type Seq,
} from "./seq";
import { aconv } from "./term";
import { nprems, premOf, type Thm } from "./thm";

export type Tactic = (state: Thm) => Seq<Thm>;
export type GoalTactic = (index: number) => Tactic;

export const allTac: Tactic = (state) => singleSeq(state);
export const noTac: Tactic = () => emptySeq;

export const thenTac =
  (first: Tactic, second: Tactic): Tactic =>
  (state) =>
    mapsSeq(second, first(state));

export const orElse =
  (first: Tactic, second: Tactic): Tactic =>
  (state) => {
    const cell = first(state).pull();
    return cell === undefined ? second(state) : ofCell(cell);
  };

export const appendTac =
  (first: Tactic, second: Tactic): Tactic =>
  (state) =>
    appendSeq(
      first(state),
      makeSeq(() => second(state).pull()),
    );

export const thenElse =
  (test: Tactic, onSuccess: Tactic, onFailure: Tactic): Tactic =>
  (state) => {
    const cell = test(state).pull();
    return cell === undefined ? onFailure(state) : mapsSeq(onSuccess, ofCell(cell));
  };

export const thenGoal =
  (first: GoalTactic, second: GoalTactic): GoalTactic =>
  (index) =>
    thenTac(first(index), second(index));

export const orElseGoal =
  (first: GoalTactic, second: GoalTactic): GoalTactic =>
  (index) =>
    orElse(first(index), second(index));

export const appendGoal =
  (first: GoalTactic, second: GoalTactic): GoalTactic =>
  (index) =>
    appendTac(first(index), second(index));

export const determ =
  (tactic: Tactic): Tactic =>
  (state) =>
    makeSeq(() => {
      const cell = tactic(state).pull();
      return cell === undefined ? undefined : [cell[0], emptySeq];
    });

export const tryTac = (tactic: Tactic) => orElse(tactic, allTac);

// Thm.eq_thm: equal hypotheses, flex-flex pairs and propositions.
export const eqThm = (left: Thm, right: Thm) =>
  left === right ||
  (aconv(left.prop, right.prop) &&
    left.hyps.length === right.hyps.length &&
    left.hyps.every((hyp) => right.hyps.some((other) => aconv(hyp, other))) &&
    left.tpairs.length === right.tpairs.length &&
    left.tpairs.every(
      (pair, index) =>
        aconv(pair[0], right.tpairs[index][0]) && aconv(pair[1], right.tpairs[index][1]),
    ));

export const eqThmProp = (left: Thm, right: Thm) => aconv(left.prop, right.prop);

interface Trail {
  readonly state: Thm;
  readonly rest: Seq<Thm>;
  readonly tactics: readonly Tactic[];
}

// EVERY: tac1 THEN ... THEN tacn, without backtracking over repeated states.
export const every = (tactics: readonly Tactic[]): Tactic => {
  const evy = (trail: readonly Trail[], remaining: readonly Tactic[], state: Thm): Seq<Thm> => {
    if (remaining.length === 0) return makeSeq(() => [state, makeSeq(() => evyBack(trail).pull())]);
    const cell = remaining[0](state).pull();
    if (cell === undefined) return evyBack(trail);
    return evy(
      [{ state: cell[0], rest: cell[1], tactics: remaining.slice(1) }, ...trail],
      remaining.slice(1),
      cell[0],
    );
  };
  const evyBack = (trail: readonly Trail[]): Seq<Thm> => {
    let current = trail;
    while (current.length > 0) {
      const top = current[0];
      const cell = top.rest.pull();
      if (cell === undefined) current = current.slice(1);
      else if (eqThm(top.state, cell[0]))
        current = [{ ...top, rest: cell[1] }, ...current.slice(1)];
      else
        return evy(
          [{ state: cell[0], rest: cell[1], tactics: top.tactics }, ...current.slice(1)],
          top.tactics,
          cell[0],
        );
    }
    return emptySeq;
  };
  return (state) => evy([], tactics, state);
};

export const everyGoal =
  (tactics: readonly GoalTactic[]): GoalTactic =>
  (index) =>
    every(tactics.map((tactic) => tactic(index)));

export const first = (tactics: readonly Tactic[]): Tactic =>
  tactics.reduceRight((rest, tactic) => orElse(tactic, rest), noTac);

export const firstGoal =
  (tactics: readonly GoalTactic[]): GoalTactic =>
  (index) =>
    first(tactics.map((tactic) => tactic(index)));

export const repeatDetermN =
  (count: number, tactic: Tactic): Tactic =>
  (state) =>
    makeSeq(() => {
      let current = state;
      let remaining = count;
      while (remaining !== 0) {
        const cell = tactic(current).pull();
        if (cell === undefined) break;
        current = cell[0];
        remaining -= 1;
      }
      return [current, emptySeq];
    });

export const repeatDeterm = (tactic: Tactic) => repeatDetermN(-1, tactic);

export const repeat =
  (tactic: Tactic): Tactic =>
  (start) => {
    const rep = (stack: readonly Seq<Thm>[], state: Thm): Cell<Thm> => {
      let current = state;
      let queue = stack;
      for (;;) {
        const cell = tactic(current).pull();
        if (cell === undefined) {
          const saved = queue;
          return [current, makeSeq(() => repq(saved))];
        }
        queue = [cell[1], ...queue];
        current = cell[0];
      }
    };
    const repq = (stack: readonly Seq<Thm>[]): Cell<Thm> => {
      let queue = stack;
      while (queue.length > 0) {
        const cell = queue[0].pull();
        if (cell !== undefined) return rep([cell[1], ...queue.slice(1)], cell[0]);
        queue = queue.slice(1);
      }
      return undefined;
    };
    return makeSeq(() => rep([], start));
  };

export const repeatDeterm1 = (tactic: Tactic) => thenTac(determ(tactic), repeatDeterm(tactic));
export const repeat1 = (tactic: Tactic) => thenTac(tactic, repeat(tactic));

export const filterTac =
  (predicate: (state: Thm) => boolean, tactic: Tactic): Tactic =>
  (state) =>
    filterSeq(predicate, tactic(state));

export const changed =
  (tactic: Tactic): Tactic =>
  (state) =>
    filterSeq((result) => !eqThm(state, result), tactic(state));

export const changedProp =
  (tactic: Tactic): Tactic =>
  (state) =>
    filterSeq((result) => !eqThmProp(state, result), tactic(state));

export const allGoals =
  (tactic: GoalTactic): Tactic =>
  (state) => {
    const doall = (index: number): Tactic =>
      index === 0 ? allTac : thenTac(tactic(index), doall(index - 1));
    return doall(nprems(state))(state);
  };

export const someGoal =
  (tactic: GoalTactic): Tactic =>
  (state) => {
    const find = (index: number): Tactic =>
      index === 0 ? noTac : orElse(tactic(index), find(index - 1));
    return find(nprems(state))(state);
  };

export const firstGoalTac =
  (tactic: GoalTactic): Tactic =>
  (state) => {
    const count = nprems(state);
    const find = (index: number): Tactic =>
      index > count ? noTac : orElse(tactic(index), find(index + 1));
    return find(1)(state);
  };

export const repeatSome = (tactic: GoalTactic) =>
  repeat1(someGoal((index) => repeat1(tactic(index))));
export const repeatFirst = (tactic: GoalTactic) =>
  repeat1(firstGoalTac((index) => repeat1(tactic(index))));
export const repeatDetermFirst = (tactic: GoalTactic) =>
  repeatDeterm1(firstGoalTac((index) => repeatDeterm1(tactic(index))));
export const tryAll = (tactic: GoalTactic) => allGoals((index) => tryTac(tactic(index)));

const isThmError = (error: unknown) =>
  error instanceof TlaIsabelleError && error.exception === "THM";

// SUBGOAL: a tactic built from goal index of the state, failing if there is no such goal.
export const subgoal =
  (build: (goal: ReturnType<typeof premOf>, index: number) => Tactic): GoalTactic =>
  (index) =>
  (state) => {
    if (index < 1 || index > nprems(state)) return emptySeq;
    return build(premOf(state, index), index)(state);
  };

export const changedGoal =
  (tactic: GoalTactic): GoalTactic =>
  (index) =>
  (state) => {
    if (index < 1 || index > nprems(state)) return emptySeq;
    const goal = premOf(state, index);
    const distance = nprems(state) - index;
    return filterSeq((result) => {
      const count = nprems(result);
      return count - distance <= 0 || !aeconv(goal, premOf(result, count - distance));
    }, tactic(index)(state));
  };

export const solvedGoal =
  (tactic: GoalTactic): GoalTactic =>
  (index) =>
  (state) =>
    filterSeq((result) => nprems(result) < nprems(state), tactic(index)(state));

// Seq.INTERVAL: applies tactic to goals last down to first.
const interval = (tactic: GoalTactic, firstIndex: number, lastIndex: number): Tactic =>
  lastIndex < firstIndex
    ? allTac
    : thenTac(tactic(lastIndex), interval(tactic, firstIndex, lastIndex - 1));

export const thenAllNew =
  (first: GoalTactic, second: GoalTactic): GoalTactic =>
  (index) =>
  (state) =>
    thenTac(first(index), (result) =>
      interval(second, index, index + nprems(result) - nprems(state))(result),
    )(state);

export const repeatAllNew = (tactic: GoalTactic): GoalTactic =>
  thenAllNew(tactic, (index) => tryTac(repeatAllNew(tactic)(index)));

export const primSeq =
  (apply: (state: Thm) => Seq<Thm>): Tactic =>
  (state) => {
    try {
      return apply(state);
    } catch (error) {
      if (isThmError(error)) return emptySeq;
      throw error;
    }
  };

export const primitive = (apply: (state: Thm) => Thm): Tactic =>
  primSeq((state) => singleSeq(apply(state)));

export const condTac =
  (test: (state: Thm) => boolean, onTrue: Tactic, onFalse: Tactic): Tactic =>
  (state) =>
    test(state) ? onTrue(state) : onFalse(state);

// Search.DEPTH_FIRST: depth-first search for a state satisfying the test.
export const depthFirst = (test: (state: Thm) => boolean, tactic: Tactic): Tactic => {
  const depth = (used: readonly Thm[], stack: readonly Seq<Thm>[]): Cell<Thm> => {
    let current = stack;
    while (current.length > 0) {
      const cell = current[0].pull();
      if (cell === undefined) {
        current = current.slice(1);
        continue;
      }
      const state = cell[0];
      const rest = [cell[1], ...current.slice(1)];
      if (test(state) && !used.some((other) => eqThm(other, state)))
        return [state, makeSeq(() => depth([state, ...used], rest))];
      current = [tactic(state), ...rest];
    }
    return undefined;
  };
  return (state) => makeSeq(() => depth([], [singleSeq(state)]));
};

export const hasFewerPrems = (count: number) => (state: Thm) => nprems(state) < count;

// Search.DEPTH_SOLVE_1: depth-first search until one goal fewer remains.
export const depthSolve1 =
  (tactic: Tactic): Tactic =>
  (state) => {
    const count = nprems(state);
    return count === 0 ? emptySeq : depthFirst(hasFewerPrems(count), tactic)(state);
  };

// Search.DEPTH_SOLVE: depth-first search until no goals remain.
export const depthSolve = (tactic: Tactic) => depthFirst(hasFewerPrems(1), tactic);

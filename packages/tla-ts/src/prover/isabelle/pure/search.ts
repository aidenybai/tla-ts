// Ported from Isabelle2025's Pure/search.ML, iterative deepening and best-first search.
// Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and
// contributors, see LICENSE.

import { listOfSeq, makeSeq, seqOfList } from "./seq";
import { eqThm, hasFewerPrems, noTac, orElse, type GoalTactic, type Tactic } from "./tactical";
import { termOrd } from "./term-ord";
import type { Thm } from "./thm";

// DEEPEN: tries the tactic with limits from start up to limit in steps of increment.
export const deepen =
  (
    increment: number,
    limit: number,
    tactic: (depth: number) => GoalTactic,
    start: number,
  ): GoalTactic =>
  (index) =>
  (state) =>
    hasFewerPrems(index)(state) || start > limit
      ? noTac(state)
      : orElse(
          tactic(start)(index),
          deepen(increment, limit, tactic, start + increment)(index),
        )(state);

interface Sized {
  readonly size: number;
  readonly thm: Thm;
}

// Thm_Heap's order: by size, then by proposition.
const compareSized = (left: Sized, right: Sized) =>
  left.size - right.size || termOrd(left.thm.prop, right.thm.prop);

// BEST_FIRST: searches the states the tactic produces, smallest first, for one that satisfies
// the predicate. A sorted list stands in for Thm_Heap: both yield the least state under the same
// total order.
export const bestFirst =
  (isSatisfied: (state: Thm) => boolean, size: (state: Thm) => number, tactic: Tactic): Tactic =>
  (state) => {
    const insert = (heap: readonly Sized[], thm: Thm): Sized[] => {
      const entry = { size: size(thm), thm };
      const position = heap.findIndex((other) => compareSized(entry, other) < 0);
      return position === -1
        ? [...heap, entry]
        : [...heap.slice(0, position), entry, ...heap.slice(position)];
    };
    const search = (): Thm[] | undefined => {
      let news: readonly Thm[] = [state];
      let heap: readonly Sized[] = [];
      for (;;) {
        const satisfied = news.filter(isSatisfied);
        if (satisfied.length > 0) return satisfied;
        const next = [...news].reverse().reduce(insert, heap);
        if (next.length === 0) return undefined;
        const best = next[0].thm;
        const rest = next.slice(1);
        const firstOther = rest.findIndex((entry) => !eqThm(best, entry.thm));
        news = listOfSeq(tactic(best));
        heap = firstOther === -1 ? [] : rest.slice(firstOther);
      }
    };
    return makeSeq(() => {
      const results = search();
      return results === undefined ? undefined : seqOfList(results).pull();
    });
  };

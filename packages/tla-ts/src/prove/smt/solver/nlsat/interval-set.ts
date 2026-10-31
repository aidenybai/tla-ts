// Ported from Z3 (src/nlsat/nlsat_interval_set.cpp), MIT license, see z3-license.txt. Sets of
// disjoint infeasible intervals of the values of one variable, each justified by the literal that
// excludes it. A null set is empty. The bounds are copies of the numbers they were built from, so
// refining a bound while comparing it narrows only that copy, as in Z3.
//
// A union drops the clauses of the intervals it copies, as Z3's push_back does, and this is
// sound. An interval's clause is read only by get_justifications, for R_propagate's lazy
// justification (nlsat_solver.cpp). Its literals come from the justifications alone, and the lazy
// clause they give is valid in the reals by itself. The clauses are used only for three things:
// - resolve_lazy_justification joins their assumptions into the lemma's. Resolution already
//   collects these: each core literal's own justification is resolved, or the literal stays in
//   the lemma.
// - update_var2eq skips a lazy justification with clauses. It also skips one with literals, and
//   every interval brings a literal.
// - Display.
// So a dropped clause can only shrink an over-approximated assumption set, and never removes a
// literal from an explanation.
import { RandomGen } from "../random-gen";
import { Rational } from "../rational";
import { Anum, type AlgebraicManager } from "./algebraic";
import type { Clause } from "./types";

// A null bound is infinite, and an infinite end is always open.
export interface Interval {
  isLowerOpen: boolean;
  lower: Anum | null;
  isUpperOpen: boolean;
  upper: Anum | null;
  justification: number;
  clause: Clause | null;
}

export interface IntervalSet {
  intervals: Interval[];
  isFull: boolean;
}

export interface ComplementMax {
  sup: Anum;
  isAttained: boolean;
}

export class IntervalSetManager {
  private rand = new RandomGen(0);

  constructor(private am: AlgebraicManager) {}

  setSeed(seed: number) {
    this.rand = new RandomGen(seed);
  }

  mk(
    isLowerOpen: boolean,
    lower: Anum | null,
    isUpperOpen: boolean,
    upper: Anum | null,
    justification: number,
    clause: Clause | null,
  ): IntervalSet {
    return {
      intervals: [
        {
          isLowerOpen,
          lower: lower === null ? null : this.am.copy(lower),
          isUpperOpen,
          upper: upper === null ? null : this.am.copy(upper),
          justification,
          clause,
        },
      ],
      isFull: lower === null && upper === null,
    };
  }

  private compareLowerLower(first: Interval, second: Interval) {
    if (first.lower === null) return second.lower === null ? 0 : -1;
    if (second.lower === null) return 1;
    const sign = this.am.compare(first.lower, second.lower);
    if (sign !== 0) return sign;
    if (first.isLowerOpen === second.isLowerOpen) return 0;
    return first.isLowerOpen ? 1 : -1;
  }

  private compareUpperUpper(first: Interval, second: Interval) {
    if (first.upper === null) return second.upper === null ? 0 : 1;
    if (second.upper === null) return -1;
    const sign = this.am.compare(first.upper, second.upper);
    if (sign !== 0) return sign;
    if (first.isUpperOpen === second.isUpperOpen) return 0;
    return first.isUpperOpen ? -1 : 1;
  }

  private compareUpperLower(first: Interval, second: Interval) {
    if (first.upper === null || second.lower === null) return 1;
    const sign = this.am.compare(first.upper, second.lower);
    if (sign !== 0) return sign;
    return !first.isUpperOpen && !second.isLowerOpen ? 0 : -1;
  }

  // adjacent: curr ends where next starts and one of them holds the shared point. Both bounds are
  // finite.
  private isAdjacent(current: Interval, next: Interval) {
    return (
      this.am.compare(current.upper!, next.lower!) === 0 &&
      (!current.isUpperOpen || !next.isLowerOpen)
    );
  }

  // push_back drops the clause, so a union only keeps the clauses of a set it returns unchanged.
  private copyInterval(
    interval: Interval,
    upper = { isOpen: interval.isUpperOpen, value: interval.upper },
  ): Interval {
    return {
      isLowerOpen: interval.isLowerOpen,
      lower: interval.lower === null ? null : this.am.copy(interval.lower),
      isUpperOpen: upper.isOpen,
      upper: upper.value === null ? null : this.am.copy(upper.value),
      justification: interval.justification,
      clause: null,
    };
  }

  mkUnion(first: IntervalSet | null, second: IntervalSet | null) {
    if (first === null || first === second) return second;
    if (second === null) return first;
    if (first.isFull) return first;
    if (second.isFull) return second;
    const result: Interval[] = [];
    let firstIndex = 0;
    let secondIndex = 0;
    while (firstIndex < first.intervals.length && secondIndex < second.intervals.length) {
      const firstInterval = first.intervals[firstIndex];
      const secondInterval = second.intervals[secondIndex];
      const lowerSign = this.compareLowerLower(firstInterval, secondInterval);
      const upperSign = this.compareUpperUpper(firstInterval, secondInterval);
      if (lowerSign <= 0) {
        if (upperSign === 0) {
          result.push(this.copyInterval(firstInterval));
          firstIndex++;
          secondIndex++;
        } else if (upperSign > 0) secondIndex++;
        else {
          const touchSign = this.compareUpperLower(firstInterval, secondInterval);
          if (touchSign < 0) result.push(this.copyInterval(firstInterval));
          else if (touchSign === 0) {
            if (lowerSign !== 0)
              result.push(
                this.copyInterval(firstInterval, { isOpen: true, value: firstInterval.upper }),
              );
          } else if (lowerSign !== 0)
            result.push(
              this.copyInterval(firstInterval, {
                isOpen: !secondInterval.isLowerOpen,
                value: secondInterval.lower,
              }),
            );
          firstIndex++;
        }
      } else if (upperSign === 0) {
        result.push(this.copyInterval(secondInterval));
        firstIndex++;
        secondIndex++;
      } else if (upperSign < 0) firstIndex++;
      else {
        const touchSign = this.compareUpperLower(secondInterval, firstInterval);
        if (touchSign < 0) result.push(this.copyInterval(secondInterval));
        else if (touchSign === 0)
          result.push(
            this.copyInterval(secondInterval, { isOpen: true, value: secondInterval.upper }),
          );
        else
          result.push(
            this.copyInterval(secondInterval, {
              isOpen: !firstInterval.isLowerOpen,
              value: firstInterval.lower,
            }),
          );
        secondIndex++;
      }
    }
    for (; firstIndex < first.intervals.length; firstIndex++)
      result.push(this.copyInterval(first.intervals[firstIndex]));
    for (; secondIndex < second.intervals.length; secondIndex++)
      result.push(this.copyInterval(second.intervals[secondIndex]));
    // Merge adjacent intervals with the same justification.
    const merged = [result[0]];
    for (const next of result.slice(1)) {
      const current = merged[merged.length - 1];
      if (current.justification === next.justification && this.isAdjacent(current, next)) {
        current.isUpperOpen = next.isUpperOpen;
        current.upper = next.upper;
      } else merged.push(next);
    }
    let isSlack = merged[0].lower !== null || merged[merged.length - 1].upper !== null;
    for (let index = 0; index < merged.length - 1 && !isSlack; index++)
      if (!this.isAdjacent(merged[index], merged[index + 1])) isSlack = true;
    return { intervals: merged, isFull: !isSlack };
  }

  isFull(set: IntervalSet | null) {
    return set !== null && set.isFull;
  }

  // subset: every interval of first lies in a run of adjacent intervals of second.
  subset(first: IntervalSet | null, second: IntervalSet | null) {
    if (first === second || first === null) return true;
    if (second === null) return false;
    if (second.isFull) return true;
    if (first.isFull) return false;
    let firstIndex = 0;
    let secondIndex = 0;
    while (firstIndex < first.intervals.length && secondIndex < second.intervals.length) {
      const firstInterval = first.intervals[firstIndex];
      if (this.compareLowerLower(firstInterval, second.intervals[secondIndex]) < 0) return false;
      while (secondIndex < second.intervals.length) {
        const secondInterval = second.intervals[secondIndex];
        const upperSign = this.compareUpperUpper(firstInterval, secondInterval);
        if (upperSign === 0) {
          firstIndex++;
          secondIndex++;
          break;
        }
        if (upperSign < 0) {
          firstIndex++;
          break;
        }
        if (this.compareUpperLower(secondInterval, firstInterval) < 0) {
          secondIndex++;
          break;
        }
        if (secondIndex === second.intervals.length - 1) return false;
        if (!this.isAdjacent(secondInterval, second.intervals[secondIndex + 1])) return false;
        secondIndex++;
      }
    }
    return firstIndex === first.intervals.length;
  }

  // get_justifications: the distinct justifications in order, and the clauses of the intervals
  // that first bring each.
  getJustifications(set: IntervalSet | null) {
    const literals: number[] = [];
    const clauses: Clause[] = [];
    for (const interval of set?.intervals ?? []) {
      if (literals.includes(interval.justification)) continue;
      literals.push(interval.justification);
      if (interval.clause !== null) clauses.push(interval.clause);
    }
    return { literals, clauses };
  }

  // pick_in_complement: zero when it is outside the set. Otherwise an integer above the last
  // interval, an integer below the first, or a number in a gap, picked uniformly at random among
  // them when randomizing, else the first found. With no gap, the shared open end of two
  // intervals, preferring a rational one. Z3 also takes is_int, and ignores it.
  pickInComplement(set: IntervalSet | null, isRandomized: boolean) {
    if (set === null) return new Anum(Rational.zero);
    const zero = new Anum(Rational.zero);
    let isZeroAvailable = true;
    for (const interval of set.intervals) {
      const sign = this.compareIntervalWithZero(interval, zero);
      if (sign === 0) {
        isZeroAvailable = false;
        break;
      }
      if (sign > 0) break;
    }
    if (isZeroAvailable) return zero;
    const intervals = set.intervals;
    const last = intervals[intervals.length - 1];
    let count = 0;
    let picked: Anum | null = null;
    if (last.upper !== null) {
      count++;
      picked = this.am.intGt(last.upper);
      if (!isRandomized) return picked;
    }
    if (intervals[0].lower !== null) {
      count++;
      picked = this.am.intLt(intervals[0].lower);
      if (!isRandomized) return picked;
    }
    for (let index = 1; index < intervals.length; index++) {
      if (this.am.compare(intervals[index - 1].upper!, intervals[index].lower!) < 0) {
        count++;
        if (count === 1 || this.rand.next() % count === 0)
          picked = this.am.select(intervals[index - 1].upper!, intervals[index].lower!);
        if (!isRandomized) return picked!;
      }
    }
    if (picked !== null) return picked;
    let irrational: Anum | null = null;
    for (let index = 1; index < intervals.length; index++) {
      const upper = intervals[index - 1].upper!;
      if (intervals[index - 1].isUpperOpen && intervals[index].isLowerOpen) {
        if (this.am.isRational(upper)) return this.am.copy(upper);
        irrational ??= upper;
      }
    }
    return this.am.copy(irrational!);
  }

  // compare_interval_with_zero: -1 when the interval lies below zero, 1 above, 0 when it holds it.
  private compareIntervalWithZero(interval: Interval, zero: Anum) {
    if (interval.upper !== null) {
      const sign = this.am.compare(interval.upper, zero);
      if (sign < 0 || (sign === 0 && interval.isUpperOpen)) return -1;
    }
    if (interval.lower !== null) {
      const sign = this.am.compare(interval.lower, zero);
      if (sign > 0 || (sign === 0 && interval.isLowerOpen)) return 1;
    }
    return 0;
  }

  // find_complement_sup: the interval whose lower bound is the supremum of the complement, when
  // the set reaches +oo and the complement is not empty.
  private findComplementSup(set: IntervalSet | null) {
    if (set === null || set.intervals[set.intervals.length - 1].upper !== null) return null;
    for (let index = set.intervals.length - 1; ; index--) {
      const current = set.intervals[index];
      if (current.lower === null) return null;
      const previous = index > 0 ? set.intervals[index - 1] : null;
      if (
        previous === null ||
        this.am.compare(previous.upper!, current.lower) < 0 ||
        (current.isLowerOpen && previous.isUpperOpen)
      )
        return index;
    }
  }

  // pick_max_in_complement: the largest number of the complement, or a number just below it.
  pickMaxInComplement(set: IntervalSet | null) {
    const index = this.findComplementSup(set);
    if (index === null) return null;
    const current = set!.intervals[index];
    if (current.isLowerOpen) return this.am.copy(current.lower!);
    if (index === 0) return this.am.intLt(current.lower!);
    return this.am.select(set!.intervals[index - 1].upper!, current.lower!);
  }

  // query_max_in_complement: the supremum of the complement, and whether it belongs to it.
  queryMaxInComplement(set: IntervalSet | null): ComplementMax | null {
    const index = this.findComplementSup(set);
    if (index === null) return null;
    const current = set!.intervals[index];
    return { sup: this.am.copy(current.lower!), isAttained: current.isLowerOpen };
  }
}

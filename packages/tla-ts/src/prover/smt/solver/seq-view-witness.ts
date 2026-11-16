// Ported from Z3 (src/ast/seq/seq_view_witness.cpp, src/ast/seq/seq_view_witness.h,
// src/ast/seq/seq_view.h), MIT license, see z3-license.txt.
import { type AstManager, OP_SEQ_UNIT } from "./ast";
import { GuardSet, GuardSetCache } from "./guard-set";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { RefVector } from "./ref-vector";
import { mkConcatOf, mkEmptySeq, mkSeqApp } from "./seq-decl-plugin";
import { guardToRangePredicate } from "./seq-range-predicate";
import type { ReRewriter } from "./seq-re-rewriter";
import { isReEmpty } from "./seq-re-util";

export const VIEW_FAILURE_NONE = 0;
export const VIEW_FAILURE_UNSUPPORTED = 1;
export const VIEW_FAILURE_BUDGET = 2;
export const VIEW_FAILURE_RESOURCE = 3;
export const VIEW_FAILURE_STATE_EXPANSION = 4;
export const VIEW_FAILURE_NULLABILITY = 5;
export const VIEW_FAILURE_GUARD = 6;

const INNER_LIMIT = 1 << 16;
const RANGE_CACHE_CAP = 1 << 16;

interface IntervalList {
  ranges: number[];
  targets: number[];
  isOk: boolean;
}

export interface ProductResult {
  status: number;
  word: number;
}

interface Parent {
  key: string;
  element: number;
}

export const dedupViews = (views: readonly number[]) => {
  const result: number[] = [];
  for (let index = 0; index < views.length; index += 2) {
    let isSeen = false;
    for (let other = 0; other < result.length && !isSeen; other += 2)
      isSeen = result[other] === views[index] && result[other + 1] === views[index + 1];
    if (!isSeen) result.push(views[index], views[index + 1]);
  }
  return result;
};

export const getViewsKey = (manager: AstManager, views: readonly number[]) => {
  const keys: number[][] = [];
  for (let index = 0; index < views.length; index += 2)
    keys.push([
      manager.ids[views[index]],
      views[index + 1] === -1 ? 0xffffffff : manager.ids[views[index + 1]],
    ]);
  keys.sort((first, second) => first[0] - second[0] || first[1] - second[1]);
  return keys
    .filter(
      (key, index) => index === 0 || key[0] !== keys[index - 1][0] || key[1] !== keys[index - 1][1],
    )
    .join(";");
};

export class ViewWitness {
  private pins: RefVector;
  private rangeCache: GuardSetCache;
  private intervalCache = new Map<number, IntervalList>();
  private intervalPins: RefVector;
  private nullableCache = new Map<number, number>();
  failure = VIEW_FAILURE_NONE;

  constructor(
    private manager: AstManager,
    private re: ReRewriter,
    private mode: number,
    private checkpoint: () => number,
  ) {
    this.pins = new RefVector(manager);
    this.rangeCache = new GuardSetCache(manager);
    this.intervalPins = new RefVector(manager);
  }

  nullable(regex: number) {
    const manager = this.manager;
    const info = this.re.info.getInfo(regex).nullable;
    if (info !== L_UNDEF) return info;
    const cached = this.nullableCache.get(regex);
    if (cached !== undefined) return cached;
    const formula = this.re.isNullable(regex);
    const result = manager.isTrue(formula) ? L_TRUE : manager.isFalse(formula) ? L_FALSE : L_UNDEF;
    this.pins.push(regex);
    this.nullableCache.set(regex, result);
    return result;
  }

  private getCofactors(regex: number) {
    return this.re.getDerive().getCachedCofactors(this.mode, regex);
  }

  private getIntervalCofactors(regex: number, variable: number) {
    const manager = this.manager;
    const cached = this.intervalCache.get(regex);
    if (cached !== undefined) return cached.isOk ? cached : undefined;
    const maxChar = manager.maxChar;
    const result: IntervalList = { ranges: [], targets: [], isOk: true };
    this.intervalCache.set(regex, result);
    this.intervalPins.push(regex);
    const transitions: number[] = [];
    const bounds = [0];
    const cofactors = this.getCofactors(regex);
    for (let index = 0; index < cofactors.size; index += 2) {
      const guard = cofactors.items[index];
      const target = cofactors.items[index + 1];
      if (isReEmpty(manager, target)) continue;
      if (!this.rangeCache.has(guard))
        this.rangeCache.insert(guard, guardToRangePredicate(manager, variable, guard));
      const predicate = this.rangeCache.get(guard);
      if (predicate === undefined) {
        result.isOk = false;
        return undefined;
      }
      this.intervalPins.push(target);
      for (let range = 0; range < predicate.length; range += 2) {
        transitions.push(predicate[range], predicate[range + 1], target);
        bounds.push(predicate[range]);
        if (predicate[range + 1] < maxChar) bounds.push(predicate[range + 1] + 1);
      }
    }
    if (transitions.length === 0) return result;
    const sorted = [...new Set(bounds)].sort((first, second) => first - second);
    const hits: number[] = [];
    for (let index = 0; index < sorted.length; index++) {
      const lo = sorted[index];
      const hi = index + 1 < sorted.length ? sorted[index + 1] - 1 : maxChar;
      hits.length = 0;
      for (let transition = 0; transition < transitions.length; transition += 3)
        if (transitions[transition] <= lo && lo <= transitions[transition + 1])
          hits.push(transitions[transition + 2]);
      if (hits.length === 0) continue;
      const ranges = result.ranges;
      const last = ranges.length - 4;
      if (last >= 0 && ranges[last + 1] + 1 === lo && ranges[last + 3] === hits.length) {
        const first = ranges[last + 2];
        if (hits.every((hit, position) => result.targets[first + position] === hit)) {
          ranges[last + 1] = hi;
          continue;
        }
      }
      ranges.push(lo, hi, result.targets.length, hits.length);
      result.targets.push(...hits);
    }
    return result;
  }

  productNonempty(variable: number, input: readonly number[], isWitnessWanted: boolean) {
    const manager = this.manager;
    this.failure = VIEW_FAILURE_NONE;
    const seqSort = manager.sorts[variable];
    const undecided: ProductResult = { status: L_UNDEF, word: -1 };
    if (!manager.isSeqSort(seqSort)) {
      this.failure = VIEW_FAILURE_UNSUPPORTED;
      return undecided;
    }
    const elementSort = manager.getSeqElementSort(seqSort);
    const views = dedupViews(input);
    const size = views.length / 2;
    if (size === 0)
      return { status: L_TRUE, word: isWitnessWanted ? mkEmptySeq(manager, seqSort) : -1 };
    const variable0 = manager.mkVar(0, elementSort);
    const work: number[] = [];
    const visited = new Set<string>();
    const state: number[] = Array.from({ length: size }, () => -1);
    const current: number[] = Array.from({ length: size }, () => -1);
    const parents = new Map<string, Parent>();
    let isUndecided = false;
    const isAccept = () => {
      for (let index = 0; index < size; index++) {
        const target = views[2 * index + 1];
        if (target !== -1) {
          if (state[index] !== target) return false;
          continue;
        }
        const nullable = this.nullable(state[index]);
        if (nullable === L_TRUE) continue;
        if (nullable === L_UNDEF) isUndecided = true;
        return false;
      }
      return true;
    };
    for (let index = 0; index < size; index++) work.push(views[2 * index]);
    const startKey = work.join(",");
    visited.add(startKey);
    const reconstruct = (endKey: string) => {
      const elements: number[] = [];
      for (let key = endKey; key !== startKey;) {
        const parent = parents.get(key);
        if (parent === undefined) break;
        elements.push(parent.element);
        key = parent.key;
      }
      const units: number[] = [];
      for (let index = elements.length; index-- > 0;)
        units.push(mkSeqApp(manager, OP_SEQ_UNIT, [elements[index]]));
      return mkConcatOf(manager, units, seqSort);
    };
    let stateKey = "";
    let isBailing = false;
    let innerSteps = 0;
    const isInnerStepExceeded = () => {
      innerSteps++;
      if (innerSteps <= INNER_LIMIT) return false;
      this.failure = VIEW_FAILURE_STATE_EXPANSION;
      return true;
    };
    const addChild = (element: number) => {
      const childKey = current.join(",");
      if (visited.has(childKey)) return;
      visited.add(childKey);
      if (isWitnessWanted && element !== -1) {
        this.pins.push(element);
        parents.set(childKey, { key: stateKey, element });
      }
      work.push(...current);
    };
    const isSweepOk = manager.isCharSort(elementSort);
    const maxChar = manager.maxChar;
    const lists: IntervalList[] = [];
    const cursors: number[] = Array.from({ length: size }, () => 0);
    const odometer: number[] = Array.from({ length: size }, () => 0);
    const sweep = () => {
      for (let index = 0; index < size; index++) {
        const list = this.getIntervalCofactors(state[index], variable0);
        if (list === undefined) return false;
        lists[index] = list;
        if (list.ranges.length === 0) return true;
        cursors[index] = 0;
      }
      let begin = 0;
      while (begin <= maxChar) {
        if (isInnerStepExceeded()) {
          isBailing = true;
          return true;
        }
        let next = maxChar + 1;
        let isCovered = true;
        let isDone = false;
        for (let index = 0; index < size; index++) {
          const ranges = lists[index].ranges;
          while (cursors[index] < ranges.length && ranges[cursors[index] + 1] < begin)
            cursors[index] += 4;
          if (cursors[index] === ranges.length) {
            isDone = true;
            break;
          }
          const lo = ranges[cursors[index]];
          if (lo > begin) {
            isCovered = false;
            next = Math.min(next, lo);
          } else next = Math.min(next, ranges[cursors[index] + 1] + 1);
        }
        if (isDone) break;
        if (isCovered) {
          odometer.fill(0);
          for (;;) {
            if (isInnerStepExceeded()) {
              isBailing = true;
              return true;
            }
            for (let index = 0; index < size; index++) {
              const ranges = lists[index].ranges;
              current[index] = lists[index].targets[ranges[cursors[index] + 2] + odometer[index]];
            }
            addChild(isWitnessWanted ? manager.mkChar(begin) : -1);
            let index = size;
            while (index-- > 0) {
              if (++odometer[index] < lists[index].ranges[cursors[index] + 3]) break;
              odometer[index] = 0;
            }
            if (index === -1) break;
          }
        }
        begin = next;
      }
      return true;
    };
    const branches: RefVector[] = [];
    const enumerate = (index: number, accumulated: GuardSet) => {
      if (isBailing) return;
      if (isInnerStepExceeded()) {
        isBailing = true;
        return;
      }
      if (index === size) {
        const evaluated = isWitnessWanted ? accumulated.eval(true) : undefined;
        addChild(evaluated?.status === L_TRUE ? evaluated.witness : -1);
        return;
      }
      const cofactors = branches[index];
      for (let pair = 0; pair < cofactors.size; pair += 2) {
        const target = cofactors.items[pair + 1];
        if (isReEmpty(manager, target)) continue;
        const next = accumulated.clone();
        next.conjoin(cofactors.items[pair]);
        const status = next.eval(false).status;
        if (status === L_UNDEF) {
          next.release();
          this.failure = VIEW_FAILURE_GUARD;
          isBailing = true;
          return;
        }
        if (status === L_FALSE) {
          next.release();
          continue;
        }
        current[index] = target;
        enumerate(index + 1, next);
        next.release();
        if (isBailing) return;
      }
    };
    while (work.length > 0) {
      this.failure = this.checkpoint();
      if (this.failure !== VIEW_FAILURE_NONE) return undecided;
      innerSteps = 0;
      for (let index = size; index-- > 0;) state[index] = work.pop()!;
      if (isAccept())
        return { status: L_TRUE, word: isWitnessWanted ? reconstruct(state.join(",")) : -1 };
      if (isUndecided) {
        this.failure = VIEW_FAILURE_NULLABILITY;
        return undecided;
      }
      stateKey = state.join(",");
      if (isSweepOk) {
        const isSwept = sweep();
        if (isBailing) return undecided;
        if (isSwept) continue;
      }
      for (let index = 0; index < size; index++) branches[index] = this.getCofactors(state[index]);
      const top = new GuardSet(manager, elementSort, variable0, this.rangeCache);
      enumerate(0, top);
      top.release();
      if (isBailing) return undecided;
    }
    return { status: L_FALSE, word: -1 };
  }

  resetCache() {
    this.intervalCache.clear();
    this.intervalPins.reset();
    this.nullableCache.clear();
    this.pins.reset();
    this.rangeCache.maybeReset(RANGE_CACHE_CAP);
  }
}

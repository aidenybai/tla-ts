// Ported from Z3 (src/smt/smt_case_split_queue.cpp, src/util/heap.h), MIT license, see
// z3-license.txt. Z3's default CS_ACTIVITY_DELAY_NEW queue: Boolean variables ordered by activity,
// where variables created during the search wait in a delayed queue until the main one runs dry.
// Without the delay, it is the CS_ACTIVITY queue of the model checker's auxiliary context.

import { BoolVar, toBoolVar } from "./literal";

// heap<bool_var_act_lt>: a binary min-heap over activities negated, so the most active is first.
class ActivityHeap {
  // The heap is 1-based, so the first slot is unused.
  private values: BoolVar[] = [toBoolVar(-1)];
  private indices: number[] = [];

  constructor(private activity: number[]) {}

  private isLess(first: BoolVar, second: BoolVar) {
    return this.activity[first] > this.activity[second];
  }

  contains(value: BoolVar) {
    return (this.indices[value] ?? 0) !== 0;
  }

  isEmpty() {
    return this.values.length === 1;
  }

  insert(value: BoolVar) {
    this.values.push(value);
    this.indices[value] = this.values.length - 1;
    this.moveUp(this.values.length - 1);
  }

  eraseMin() {
    const result = this.values[1];
    const last = this.values[this.values.length - 1];
    this.values.length--;
    this.indices[result] = 0;
    if (this.values.length > 1) {
      this.values[1] = last;
      this.indices[last] = 1;
      this.moveDown(1);
    }
    return result;
  }

  erase(value: BoolVar) {
    const index = this.indices[value];
    if (index === this.values.length - 1) {
      this.indices[value] = 0;
      this.values.pop();
      return;
    }
    const last = this.values[this.values.length - 1];
    this.values.length--;
    this.values[index] = last;
    this.indices[last] = index;
    this.indices[value] = 0;
    const parentIndex = index >> 1;
    if (parentIndex !== 0 && this.isLess(last, this.values[parentIndex])) this.moveUp(index);
    else this.moveDown(index);
  }

  decreased(value: BoolVar) {
    this.moveUp(this.indices[value]);
  }

  swap(other: ActivityHeap) {
    const values = this.values;
    const indices = this.indices;
    this.values = other.values;
    this.indices = other.indices;
    other.values = values;
    other.indices = indices;
  }

  private moveUp(start: number) {
    let index = start;
    const value = this.values[index];
    for (;;) {
      const parentIndex = index >> 1;
      if (parentIndex === 0 || !this.isLess(value, this.values[parentIndex])) break;
      this.values[index] = this.values[parentIndex];
      this.indices[this.values[index]] = index;
      index = parentIndex;
    }
    this.values[index] = value;
    this.indices[value] = index;
  }

  private moveDown(start: number) {
    let index = start;
    const value = this.values[index];
    const size = this.values.length;
    for (;;) {
      const left = index * 2;
      if (left >= size) break;
      const right = left + 1;
      const minIndex =
        right < size && this.isLess(this.values[right], this.values[left]) ? right : left;
      if (!this.isLess(this.values[minIndex], value)) break;
      this.values[index] = this.values[minIndex];
      this.indices[this.values[index]] = index;
      index = minIndex;
    }
    this.values[index] = value;
    this.indices[value] = index;
  }
}

export interface CaseSplitContext {
  activity: number[];
  getIsSearching(): boolean;
  getRandomValue(): number;
  getNumBoolVars(): number;
  isUnassigned(boolVar: BoolVar): boolean;
}

const RANDOM_VAR_FREQ = 0.01;
const RANDOM_MAX_VALUE = 0x7fff;

export class CaseSplitQueue {
  private queue: ActivityHeap;
  private delayedQueue: ActivityHeap;

  constructor(
    private context: CaseSplitContext,
    private isDelayingNew: boolean,
  ) {
    this.queue = new ActivityHeap(context.activity);
    this.delayedQueue = new ActivityHeap(context.activity);
  }

  activityIncreased(boolVar: BoolVar) {
    if (this.queue.contains(boolVar)) this.queue.decreased(boolVar);
    if (this.delayedQueue.contains(boolVar)) this.delayedQueue.decreased(boolVar);
  }

  mkVar(boolVar: BoolVar) {
    if (this.isDelayingNew && this.context.getIsSearching()) this.delayedQueue.insert(boolVar);
    else this.queue.insert(boolVar);
  }

  delVar(boolVar: BoolVar) {
    if (this.queue.contains(boolVar)) this.queue.erase(boolVar);
    if (this.delayedQueue.contains(boolVar)) this.delayedQueue.erase(boolVar);
  }

  unassignVar(boolVar: BoolVar) {
    if (!this.queue.contains(boolVar)) this.queue.insert(boolVar);
  }

  // Returns the next variable to split on, or undefined when every variable is assigned.
  nextCaseSplit() {
    const context = this.context;
    if (context.getRandomValue() < Math.trunc(RANDOM_VAR_FREQ * RANDOM_MAX_VALUE)) {
      const next = toBoolVar(context.getRandomValue() % context.getNumBoolVars());
      if (context.isUnassigned(next)) return next;
    }
    while (!this.queue.isEmpty()) {
      const next = this.queue.eraseMin();
      if (context.isUnassigned(next)) return next;
    }
    this.queue.swap(this.delayedQueue);
    while (!this.queue.isEmpty()) {
      const next = this.queue.eraseMin();
      if (context.isUnassigned(next)) return next;
    }
    return undefined;
  }
}

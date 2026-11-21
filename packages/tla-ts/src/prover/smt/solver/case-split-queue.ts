import type { AstManager } from "./ast";
import type { Enode } from "./enode";
import { L_UNDEF } from "./lbool";
import { BoolVar, type Literal, toBoolVar } from "./literal";

export const CS_ACTIVITY = 0;
export const CS_ACTIVITY_DELAY_NEW = 1;
export const CS_RELEVANCY = 3;
export const CS_RELEVANCY_ACTIVITY = 4;
export const CS_RELEVANCY_GOAL = 5;

// mk_case_split_queue: Z3's cached queue splits as its activity queue does, since undo_mk_bool_var
// clears the variable's term before del_var_eh caches it, and so does its theory-aware queue, since
// no theory gives it a priority. The relevancy queues need full relevancy and auto_config off.
export const getCaseSplitStrategy = (
  caseSplit: number,
  relevancyLevel: number,
  isAutoConfig: boolean,
) =>
  caseSplit >= CS_RELEVANCY &&
  caseSplit <= CS_RELEVANCY_GOAL &&
  (relevancyLevel < 2 || isAutoConfig)
    ? CS_ACTIVITY
    : caseSplit;

export abstract class Heap {
  private values = [-1];
  private indices = new Int32Array(1024);

  protected abstract isLess(first: number, second: number): boolean;

  contains(value: number) {
    return value < this.indices.length && this.indices[value] !== 0;
  }

  isEmpty() {
    return this.values.length === 1;
  }

  insert(value: number) {
    if (value >= this.indices.length) {
      const indices = new Int32Array(Math.max(2 * this.indices.length, value + 1));
      indices.set(this.indices);
      this.indices = indices;
    }
    this.values.push(value);
    this.indices[value] = this.values.length - 1;
    this.moveUp(this.values.length - 1);
  }

  eraseMin() {
    const result = this.values[1];
    const last = this.values[this.values.length - 1];
    this.values.pop();
    this.indices[result] = 0;
    if (this.values.length > 1) {
      this.values[1] = last;
      this.indices[last] = 1;
      this.moveDown(1);
    }
    return result;
  }

  erase(value: number) {
    const index = this.indices[value];
    if (index === this.values.length - 1) {
      this.indices[value] = 0;
      this.values.pop();
      return;
    }
    const last = this.values[this.values.length - 1];
    this.values.pop();
    this.values[index] = last;
    this.indices[last] = index;
    this.indices[value] = 0;
    const parentIndex = index >> 1;
    if (parentIndex !== 0 && this.isLess(last, this.values[parentIndex])) this.moveUp(index);
    else this.moveDown(index);
  }

  decreased(value: number) {
    this.moveUp(this.indices[value]);
  }

  swap(other: Heap) {
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

export class ActivityHeap extends Heap {
  constructor(private activity: number[]) {
    super();
  }

  protected isLess(first: number, second: number) {
    return this.activity[first] > this.activity[second];
  }
}

export interface CaseSplitContext {
  readonly manager: AstManager;
  readonly activity: number[];
  readonly isSearching: boolean;
  readonly numBoolVars: number;
  getRandomValue(): number;
  getBoolVarAssignment(boolVar: BoolVar): number;
  findBoolVar(expr: number): BoolVar | undefined;
  getExprAssignment(expr: number): number;
  getLiteral(expr: number): Literal;
  getEnode(expr: number): Enode | undefined;
  getGeneration(node: Enode): number;
}

export interface CaseSplitQueue {
  readonly phase: number;
  activityIncreased(boolVar: BoolVar): void;
  mkVar(boolVar: BoolVar): void;
  delVar(boolVar: BoolVar): void;
  unassignVar(boolVar: BoolVar): void;
  relevantEh(expr: number): void;
  initSearchEh(): void;
  endSearchEh(): void;
  pushScope(): void;
  popScope(numScopes: number): void;
  nextCaseSplit(): BoolVar | undefined;
}

const RANDOM_VAR_FREQ = 0.01;
export const RANDOM_MAX_VALUE = 0x7fff;

export class ActCaseSplitQueue implements CaseSplitQueue {
  readonly phase = L_UNDEF;
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
    if (this.isDelayingNew && this.context.isSearching) this.delayedQueue.insert(boolVar);
    else this.queue.insert(boolVar);
  }

  delVar(boolVar: BoolVar) {
    if (this.queue.contains(boolVar)) this.queue.erase(boolVar);
    if (this.delayedQueue.contains(boolVar)) this.delayedQueue.erase(boolVar);
  }

  unassignVar(boolVar: BoolVar) {
    if (!this.queue.contains(boolVar)) this.queue.insert(boolVar);
  }

  relevantEh() {}

  initSearchEh() {}

  endSearchEh() {}

  pushScope() {}

  popScope() {}

  nextCaseSplit() {
    const context = this.context;
    if (context.getRandomValue() < Math.trunc(RANDOM_VAR_FREQ * RANDOM_MAX_VALUE)) {
      const next = toBoolVar(context.getRandomValue() % context.numBoolVars);
      if (context.getBoolVarAssignment(next) === L_UNDEF) return next;
    }
    while (!this.queue.isEmpty()) {
      const next = toBoolVar(this.queue.eraseMin());
      if (context.getBoolVarAssignment(next) === L_UNDEF) return next;
    }
    this.queue.swap(this.delayedQueue);
    while (!this.queue.isEmpty()) {
      const next = toBoolVar(this.queue.eraseMin());
      if (context.getBoolVarAssignment(next) === L_UNDEF) return next;
    }
    return undefined;
  }
}

import { SmtInvariantError } from "../../../errors";
import { shrink } from "./array";
import { KIND_APP, OP_AND, OP_OR } from "./ast";
import {
  ActivityHeap,
  type CaseSplitContext,
  type CaseSplitQueue,
  Heap,
  RANDOM_MAX_VALUE,
} from "./case-split-queue";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { type BoolVar, getVar, isNegated, toBoolVar } from "./literal";
import { UINT_MAX } from "./sat/clause";

const NULL_BOOL_VAR = UINT_MAX >>> 1;
const RANDOM_SPLIT_FREQ = 0.02;

class ExprQueue {
  items: number[] = [];
  head = 0;
}

interface QueueEntry {
  expr: number;
  generation: number;
  lastDecided: number;
}

// relevant_eh: the variable of a term that a relevancy queue takes, null_bool_var for a clause
// without one, or undefined for a term it leaves out.
const getRelevantVar = (context: CaseSplitContext, expr: number) => {
  const manager = context.manager;
  if (!manager.isBool(expr)) return undefined;
  const isOr = manager.getOp(expr) === OP_OR;
  const boolVar = context.findBoolVar(expr);
  if (boolVar === undefined) return isOr ? NULL_BOOL_VAR : undefined;
  const value = context.getBoolVarAssignment(boolVar);
  return value === L_UNDEF ||
    (isOr && value === L_TRUE) ||
    (manager.getOp(expr) === OP_AND && value === L_FALSE)
    ? boolVar
    : undefined;
};

// has_child_assigned_to with m_rel_case_split_order 0, which smt_params never changes.
const findUndefChild = (context: CaseSplitContext, parent: number, value: number) => {
  const manager = context.manager;
  let undefChild: number | undefined;
  for (let index = 0; index < manager.getNumArgs(parent); index++) {
    const arg = manager.getArg(parent, index);
    const argValue = context.getExprAssignment(arg);
    if (argValue === value) return undefined;
    if (undefChild === undefined && argValue === L_UNDEF) undefChild = arg;
  }
  if (undefChild === undefined)
    throw new SmtInvariantError("the case split has no unassigned child");
  return undefChild;
};

abstract class RelevancyCaseSplitQueue implements CaseSplitQueue {
  phase = L_UNDEF;
  protected bsNumBoolVars = UINT_MAX;

  constructor(protected readonly context: CaseSplitContext) {}

  abstract relevantEh(expr: number): void;

  abstract pushScope(): void;

  abstract popScope(numScopes: number): void;

  abstract nextCaseSplit(): BoolVar | undefined;

  activityIncreased() {}

  mkVar(_boolVar: BoolVar) {}

  delVar(_boolVar: BoolVar) {}

  unassignVar(_boolVar: BoolVar) {}

  initSearchEh() {
    this.bsNumBoolVars = this.context.numBoolVars;
  }

  endSearchEh() {
    this.bsNumBoolVars = UINT_MAX;
  }

  protected nextCaseSplitCore(expr: number) {
    const context = this.context;
    const boolVar = context.findBoolVar(expr);
    const value = boolVar === undefined ? L_TRUE : context.getBoolVarAssignment(boolVar);
    const op = context.manager.getOp(expr);
    if ((op === OP_OR && value === L_TRUE) || (op === OP_AND && value === L_FALSE)) {
      const undefChild = findUndefChild(context, expr, value);
      if (undefChild === undefined) return undefined;
      const literal = context.getLiteral(undefChild);
      this.phase = isNegated(literal) ? L_FALSE : L_TRUE;
      return getVar(literal);
    }
    return value === L_UNDEF ? boolVar : undefined;
  }

  protected nextCaseSplitOf(queue: ExprQueue) {
    for (; queue.head < queue.items.length; queue.head++) {
      const next = this.nextCaseSplitCore(queue.items[queue.head]);
      if (next !== undefined) return next;
    }
    return undefined;
  }
}

export class RelCaseSplitQueue extends RelevancyCaseSplitQueue {
  private queue = new ExprQueue();
  private queue2 = new ExprQueue();
  private scopes: number[] = [];

  relevantEh(expr: number) {
    const boolVar = getRelevantVar(this.context, expr);
    if (boolVar === undefined) return;
    if (boolVar === NULL_BOOL_VAR && this.context.isSearching) this.queue2.items.push(expr);
    else if (boolVar < this.bsNumBoolVars) this.queue.items.push(expr);
    else this.queue2.items.push(expr);
  }

  pushScope() {
    this.scopes.push(
      this.queue.items.length,
      this.queue.head,
      this.queue2.items.length,
      this.queue2.head,
    );
  }

  popScope(numScopes: number) {
    const offset = this.scopes.length - 4 * numScopes;
    shrink(this.queue.items, this.scopes[offset]);
    this.queue.head = this.scopes[offset + 1];
    shrink(this.queue2.items, this.scopes[offset + 2]);
    this.queue2.head = this.scopes[offset + 3];
    shrink(this.scopes, offset);
  }

  nextCaseSplit() {
    this.phase = L_UNDEF;
    return this.nextCaseSplitOf(this.queue) ?? this.nextCaseSplitOf(this.queue2);
  }
}

export class RelActCaseSplitQueue extends RelevancyCaseSplitQueue {
  private queue = new ExprQueue();
  private delayedQueue = new ActivityHeap(this.context.activity);
  private scopes: number[] = [];

  mkVar(boolVar: BoolVar) {
    if (this.context.isSearching) this.delayedQueue.insert(boolVar);
  }

  delVar(boolVar: BoolVar) {
    if (boolVar >= this.bsNumBoolVars && this.delayedQueue.contains(boolVar))
      this.delayedQueue.erase(boolVar);
  }

  unassignVar(boolVar: BoolVar) {
    if (boolVar >= this.bsNumBoolVars && !this.delayedQueue.contains(boolVar))
      this.delayedQueue.insert(boolVar);
  }

  relevantEh(expr: number) {
    const boolVar = getRelevantVar(this.context, expr);
    if (boolVar === undefined) return;
    if (boolVar === NULL_BOOL_VAR) {
      if (!this.context.isSearching) this.queue.items.push(expr);
      return;
    }
    if (boolVar < this.bsNumBoolVars) this.queue.items.push(expr);
  }

  pushScope() {
    this.scopes.push(this.queue.items.length, this.queue.head);
  }

  popScope(numScopes: number) {
    const offset = this.scopes.length - 2 * numScopes;
    shrink(this.queue.items, this.scopes[offset]);
    this.queue.head = this.scopes[offset + 1];
    shrink(this.scopes, offset);
  }

  nextCaseSplit() {
    const context = this.context;
    this.phase = L_UNDEF;
    if (context.getRandomValue() < Math.trunc(RANDOM_SPLIT_FREQ * RANDOM_MAX_VALUE)) {
      const next = toBoolVar(context.getRandomValue() % context.numBoolVars);
      if (context.getBoolVarAssignment(next) === L_UNDEF) return next;
    }
    const next = this.nextCaseSplitOf(this.queue);
    if (next !== undefined) return next;
    while (!this.delayedQueue.isEmpty()) {
      const delayed = toBoolVar(this.delayedQueue.eraseMin());
      if (context.getBoolVarAssignment(delayed) === L_UNDEF) return delayed;
    }
    return undefined;
  }
}

class GenerationHeap extends Heap {
  constructor(private entries: QueueEntry[]) {
    super();
  }

  protected isLess(first: number, second: number) {
    const firstGeneration = this.entries[first].generation;
    const secondGeneration = this.entries[second].generation;
    return firstGeneration === secondGeneration
      ? first < second
      : firstGeneration < secondGeneration;
  }
}

// rel_goal_case_split_queue's goals never change a generation, since m_current_generation stays at
// start_gen, so this leaves out assign_lit_eh, set_goal and the generation updates.
export class RelGoalCaseSplitQueue extends RelevancyCaseSplitQueue {
  private queue = new ExprQueue();
  private queue2: QueueEntry[] = [];
  private priorityQueue2 = new GenerationHeap(this.queue2);
  private scopes: number[] = [];

  relevantEh(expr: number) {
    const boolVar = getRelevantVar(this.context, expr);
    if (boolVar === undefined) return;
    if (boolVar === NULL_BOOL_VAR && this.context.isSearching) this.addToQueue2(expr);
    else if (boolVar < this.bsNumBoolVars) this.queue.items.push(expr);
    else this.addToQueue2(expr);
  }

  private getGeneration(expr: number) {
    const context = this.context;
    const manager = context.manager;
    const todo = [expr];
    let maxGeneration = 0;
    while (todo.length > 0) {
      const current = todo.pop() ?? -1;
      const node = context.getEnode(current);
      if (node !== undefined) maxGeneration = Math.max(maxGeneration, context.getGeneration(node));
      else if (manager.kinds[current] === KIND_APP)
        for (let index = 0; index < manager.getNumArgs(current); index++)
          todo.push(manager.getArg(current, index));
    }
    return maxGeneration;
  }

  private addToQueue2(expr: number) {
    this.queue2.push({ expr, generation: this.getGeneration(expr), lastDecided: -1 });
    this.priorityQueue2.insert(this.queue2.length - 1);
  }

  pushScope() {
    this.scopes.push(this.queue.items.length, this.queue.head, this.queue2.length);
  }

  popScope(numScopes: number) {
    const newLevel = this.scopes.length / 3 - numScopes;
    const offset = 3 * newLevel;
    shrink(this.queue.items, this.scopes[offset]);
    this.queue.head = this.scopes[offset + 1];
    const queue2Trail = this.scopes[offset + 2];
    for (let index = queue2Trail; index < this.queue2.length; index++)
      if (this.priorityQueue2.contains(index)) this.priorityQueue2.erase(index);
    for (let index = 0; index < queue2Trail; index++) {
      const entry = this.queue2[index];
      if (entry.lastDecided <= newLevel) continue;
      this.priorityQueue2.insert(index);
      entry.lastDecided = -1;
    }
    shrink(this.queue2, queue2Trail);
    shrink(this.scopes, offset);
  }

  nextCaseSplit() {
    this.phase = L_UNDEF;
    const next = this.nextCaseSplitOf(this.queue);
    if (next !== undefined) return next;
    while (!this.priorityQueue2.isEmpty()) {
      const index = this.priorityQueue2.eraseMin();
      const entry = this.queue2[index];
      entry.lastDecided = this.scopes.length / 3;
      const queued = this.nextCaseSplitCore(entry.expr);
      if (queued !== undefined) {
        this.priorityQueue2.insert(index);
        entry.lastDecided = -1;
        return queued;
      }
    }
    return undefined;
  }
}

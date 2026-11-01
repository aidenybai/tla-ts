// Ported from Z3 (src/smt/smt_relevancy.h, src/smt/smt_relevancy.cpp), MIT license, see
// z3-license.txt. Relevancy level 2: only subterms that the current assignment needs are relevant,
// and E-matching and the theories only look at relevant terms.
import { AstManager, KIND_APP, OP_AND, OP_IMPLIES, OP_ITE, OP_OR } from "./ast";
import type { Enode } from "./enode";
import { shrink } from "./array";

export type RelevancyHandler = () => void;

export interface RelevancyContext {
  manager: AstManager;
  // lbool as 1, -1 or 0.
  findAssignment(expr: number): number;
  findEnode(expr: number): Enode | undefined;
  relevantEh(expr: number): void;
}

const TRAIL_POS_WATCH = 0;
const TRAIL_NEG_WATCH = 1;
const TRAIL_HANDLER = 2;

export class RelevancyPropagator {
  private qhead = 0;
  // m_relevant_exprs: the relevant expressions in the order they were marked, which it holds.
  private relevantExprs: number[] = [];
  // A flag per expression, which grows with the expressions marked.
  private isRelevantFlags = new Uint8Array(1024);
  // The watches and handlers of each expression, by trail kind, are lists of cons cells like Z3's
  // relevancy_ehs. A trail entry is the cell it pushed: its handler and the list it extends. heads
  // holds, at 3 * expr + kind, one past the trail index of the list's first cell, or 0.
  private heads = new Int32Array(3072);
  private trailKinds: number[] = [];
  private trailExprs: number[] = [];
  private trailHandlers: RelevancyHandler[] = [];
  private trailNext: number[] = [];
  private scopes: number[] = [];
  private isPropagating = false;

  // At relevancy level 0 every expression is relevant and nothing propagates.
  constructor(
    private context: RelevancyContext,
    readonly isEnabled: boolean,
  ) {}

  isRelevant(expr: number) {
    return !this.isEnabled || this.isRelevantFlags[expr] === 1;
  }

  addHandler(source: number, handler: RelevancyHandler) {
    if (!this.isEnabled) return;
    if (this.isRelevant(source)) {
      handler();
      return;
    }
    this.pushTrail(TRAIL_HANDLER, source, handler);
  }

  addDependency(source: number, target: number) {
    if (this.isRelevant(source)) this.markAsRelevant(target);
    else this.addHandler(source, () => this.markAsRelevant(target));
  }

  addWatch(expr: number, value: boolean, handler: RelevancyHandler) {
    if (!this.isEnabled) return;
    const assignment = this.context.findAssignment(expr) * (value ? 1 : -1);
    if (assignment < 0) return;
    if (assignment > 0) {
      handler();
      return;
    }
    this.pushTrail(value ? TRAIL_POS_WATCH : TRAIL_NEG_WATCH, expr, handler);
  }

  // push_trail: the trail holds its expressions. The cell goes in front of the expression's list.
  private pushTrail(kind: number, expr: number, handler: RelevancyHandler) {
    this.context.manager.incRef(expr);
    const head = 3 * expr + kind;
    if (head >= this.heads.length) {
      const grown = new Int32Array(Math.max(2 * this.heads.length, 3 * expr + 3));
      grown.set(this.heads);
      this.heads = grown;
    }
    this.trailNext.push(this.heads[head]);
    this.trailHandlers.push(handler);
    this.trailKinds.push(kind);
    this.trailExprs.push(expr);
    this.heads[head] = this.trailKinds.length;
  }

  // Runs the list of a kind and expression from its first cell, so the latest handler runs first.
  // Handlers that a run adds go in front of the cell it started from, so the run skips them.
  private runList(kind: number, expr: number) {
    const head = 3 * expr + kind;
    if (head >= this.heads.length) return;
    for (let cell = this.heads[head]; cell !== 0; cell = this.trailNext[cell - 1])
      this.trailHandlers[cell - 1]();
  }

  push() {
    this.scopes.push(this.relevantExprs.length, this.trailKinds.length);
  }

  pop(numScopes: number) {
    const offset = this.scopes.length - numScopes * 2;
    const relevantLimit = this.scopes[offset];
    const trailLimit = this.scopes[offset + 1];
    const manager = this.context.manager;
    for (let index = this.relevantExprs.length - 1; index >= relevantLimit; index--)
      this.isRelevantFlags[this.relevantExprs[index]] = 0;
    for (let index = relevantLimit; index < this.relevantExprs.length; index++)
      manager.decRef(this.relevantExprs[index]);
    shrink(this.relevantExprs, relevantLimit);
    this.qhead = relevantLimit;
    for (let index = this.trailKinds.length - 1; index >= trailLimit; index--) {
      const expr = this.trailExprs[index];
      this.heads[3 * expr + this.trailKinds[index]] = this.trailNext[index];
      manager.decRef(expr);
    }
    shrink(this.trailKinds, trailLimit);
    shrink(this.trailExprs, trailLimit);
    shrink(this.trailHandlers, trailLimit);
    shrink(this.trailNext, trailLimit);
    shrink(this.scopes, offset);
  }

  private setRelevant(expr: number) {
    if (expr >= this.isRelevantFlags.length) {
      const flags = new Uint8Array(Math.max(2 * this.isRelevantFlags.length, expr + 1));
      flags.set(this.isRelevantFlags);
      this.isRelevantFlags = flags;
    }
    this.isRelevantFlags[expr] = 1;
    this.context.manager.incRef(expr);
    this.relevantExprs.push(expr);
    this.context.relevantEh(expr);
  }

  // Marks expr and every member of its equivalence class as relevant.
  markAsRelevant(expr: number) {
    if (this.isRelevant(expr)) return;
    const node = this.context.findEnode(expr);
    if (node === undefined) {
      this.setRelevant(expr);
      return;
    }
    let current = node;
    do {
      if (!this.isRelevant(current.owner)) this.setRelevant(current.owner);
      current = current.next;
    } while (current !== node);
  }

  private propagateApp(expr: number) {
    for (let index = this.context.manager.getNumArgs(expr) - 1; index >= 0; index--)
      this.markAsRelevant(this.context.manager.getArg(expr, index));
  }

  propagateImplies(expr: number) {
    const context = this.context;
    const value = context.findAssignment(expr);
    if (value < 0) {
      this.propagateApp(expr);
      return;
    }
    if (context.findAssignment(context.manager.getArg(expr, 0)) < 0) {
      this.markAsRelevant(context.manager.getArg(expr, 0));
      return;
    }
    if (context.findAssignment(context.manager.getArg(expr, 1)) > 0)
      this.markAsRelevant(context.manager.getArg(expr, 1));
  }

  propagateOr(expr: number) {
    const context = this.context;
    if (context.findAssignment(expr) < 0) {
      this.propagateApp(expr);
      return;
    }
    let trueArg = -1;
    for (let index = 0; index < context.manager.getNumArgs(expr); index++) {
      const arg = context.manager.getArg(expr, index);
      if (context.findAssignment(arg) <= 0) continue;
      if (this.isRelevant(arg)) return;
      if (trueArg === -1) trueArg = arg;
    }
    if (trueArg !== -1) this.markAsRelevant(trueArg);
  }

  propagateAnd(expr: number) {
    const context = this.context;
    const value = context.findAssignment(expr);
    if (value > 0) {
      this.propagateApp(expr);
      return;
    }
    if (value === 0) return;
    let falseArg = -1;
    for (let index = 0; index < context.manager.getNumArgs(expr); index++) {
      const arg = context.manager.getArg(expr, index);
      if (context.findAssignment(arg) >= 0) continue;
      if (this.isRelevant(arg)) return;
      if (falseArg === -1) falseArg = arg;
    }
    if (falseArg !== -1) this.markAsRelevant(falseArg);
  }

  propagateIte(expr: number) {
    this.markAsRelevant(this.context.manager.getArg(expr, 0));
    const value = this.context.findAssignment(this.context.manager.getArg(expr, 0));
    if (value < 0) this.markAsRelevant(this.context.manager.getArg(expr, 2));
    else if (value > 0) this.markAsRelevant(this.context.manager.getArg(expr, 1));
  }

  canPropagate() {
    return this.qhead < this.relevantExprs.length;
  }

  propagate() {
    if (this.isPropagating) return;
    this.isPropagating = true;
    const manager = this.context.manager;
    while (this.qhead < this.relevantExprs.length) {
      const expr = this.relevantExprs[this.qhead];
      this.qhead++;
      if (manager.kinds[expr] === KIND_APP) {
        const op = manager.getOp(expr);
        if (op === OP_OR) this.propagateOr(expr);
        else if (op === OP_AND) this.propagateAnd(expr);
        else if (op === OP_IMPLIES) this.propagateImplies(expr);
        else if (op === OP_ITE) this.propagateIte(expr);
        else this.propagateApp(expr);
      }
      this.runList(TRAIL_HANDLER, expr);
    }
    this.isPropagating = false;
  }

  assignEh(expr: number, value: boolean) {
    if (this.isRelevant(expr)) {
      const op = this.context.manager.getOp(expr);
      if (op === OP_OR) this.propagateOr(expr);
      else if (op === OP_AND) this.propagateAnd(expr);
      else if (op === OP_IMPLIES) this.propagateImplies(expr);
    }
    this.runList(value ? TRAIL_POS_WATCH : TRAIL_NEG_WATCH, expr);
  }
}

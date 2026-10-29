// Ported from Z3 (src/smt/smt_relevancy.h, src/smt/smt_relevancy.cpp), MIT license, see
// z3-license.txt. Relevancy level 2: only subterms that the current assignment needs are relevant,
// and E-matching and the theories only look at relevant terms.
import { AstManager, KIND_APP, OP_AND, OP_IMPLIES, OP_ITE, OP_OR } from "./ast";
import type { Enode } from "./enode";

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
  private relevantExprs: number[] = [];
  private isRelevantSet = new Set<number>();
  private handlers = new Map<number, RelevancyHandler[]>();
  private watches = [new Map<number, RelevancyHandler[]>(), new Map<number, RelevancyHandler[]>()];
  private trailKinds: number[] = [];
  private trailExprs: number[] = [];
  private scopes: number[] = [];
  private isPropagating = false;

  constructor(private context: RelevancyContext) {}

  isRelevant(expr: number) {
    return this.isRelevantSet.has(expr);
  }

  addHandler(source: number, handler: RelevancyHandler) {
    if (this.isRelevant(source)) {
      handler();
      return;
    }
    this.trailKinds.push(TRAIL_HANDLER);
    this.trailExprs.push(source);
    const list = this.handlers.get(source);
    if (list === undefined) this.handlers.set(source, [handler]);
    else list.push(handler);
  }

  addDependency(source: number, target: number) {
    if (this.isRelevant(source)) this.markAsRelevant(target);
    else this.addHandler(source, () => this.markAsRelevant(target));
  }

  addWatch(expr: number, value: boolean, handler: RelevancyHandler) {
    const assignment = this.context.findAssignment(expr) * (value ? 1 : -1);
    if (assignment < 0) return;
    if (assignment > 0) {
      handler();
      return;
    }
    const index = value ? 1 : 0;
    const list = this.watches[index].get(expr);
    if (list === undefined) this.watches[index].set(expr, [handler]);
    else list.push(handler);
    this.trailKinds.push(value ? TRAIL_POS_WATCH : TRAIL_NEG_WATCH);
    this.trailExprs.push(expr);
  }

  push() {
    this.scopes.push(this.relevantExprs.length, this.trailKinds.length);
  }

  pop(numScopes: number) {
    const offset = this.scopes.length - numScopes * 2;
    const relevantLimit = this.scopes[offset];
    const trailLimit = this.scopes[offset + 1];
    for (let index = this.relevantExprs.length - 1; index >= relevantLimit; index--)
      this.isRelevantSet.delete(this.relevantExprs[index]);
    this.relevantExprs.length = relevantLimit;
    this.qhead = relevantLimit;
    for (let index = this.trailKinds.length - 1; index >= trailLimit; index--) {
      const kind = this.trailKinds[index];
      const map =
        kind === TRAIL_HANDLER
          ? this.handlers
          : this.watches[kind === TRAIL_POS_WATCH ? 1 : 0];
      const list = map.get(this.trailExprs[index]);
      if (list === undefined) continue;
      list.pop();
      if (list.length === 0) map.delete(this.trailExprs[index]);
    }
    this.trailKinds.length = trailLimit;
    this.trailExprs.length = trailLimit;
    this.scopes.length = offset;
  }

  private setRelevant(expr: number) {
    this.isRelevantSet.add(expr);
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
    const args = this.context.manager.args[expr];
    for (let index = args.length - 1; index >= 0; index--) this.markAsRelevant(args[index]);
  }

  propagateImplies(expr: number) {
    const context = this.context;
    const value = context.findAssignment(expr);
    if (value < 0) {
      this.propagateApp(expr);
      return;
    }
    const args = context.manager.args[expr];
    if (context.findAssignment(args[0]) < 0) {
      this.markAsRelevant(args[0]);
      return;
    }
    if (context.findAssignment(args[1]) > 0) this.markAsRelevant(args[1]);
  }

  propagateOr(expr: number) {
    const context = this.context;
    if (context.findAssignment(expr) < 0) {
      this.propagateApp(expr);
      return;
    }
    let trueArg = -1;
    for (const arg of context.manager.args[expr]) {
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
    for (const arg of context.manager.args[expr]) {
      if (context.findAssignment(arg) >= 0) continue;
      if (this.isRelevant(arg)) return;
      if (falseArg === -1) falseArg = arg;
    }
    if (falseArg !== -1) this.markAsRelevant(falseArg);
  }

  propagateIte(expr: number) {
    const args = this.context.manager.args[expr];
    this.markAsRelevant(args[0]);
    const value = this.context.findAssignment(args[0]);
    if (value < 0) this.markAsRelevant(args[2]);
    else if (value > 0) this.markAsRelevant(args[1]);
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
      const list = this.handlers.get(expr);
      if (list !== undefined) for (let index = list.length - 1; index >= 0; index--) list[index]();
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
    const list = this.watches[value ? 1 : 0].get(expr);
    if (list !== undefined) for (let index = list.length - 1; index >= 0; index--) list[index]();
  }
}

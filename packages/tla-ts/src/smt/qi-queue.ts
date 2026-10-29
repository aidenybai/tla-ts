// Ported from Z3 (src/smt/qi_queue.cpp, src/smt/smt_quick_checker.cpp), MIT license, see
// z3-license.txt. Instances found by E-matching wait here. Z3's default cost is
// (+ weight generation): cheap instances are created at once, expensive ones only in the final
// check, and the quick checker skips instances that the current assignment already satisfies.
import { KIND_APP, KIND_VAR, OP_AND, OP_EQ, OP_FALSE, OP_ITE, OP_NOT, OP_OR, OP_TRUE } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { substitute } from "./rewriter";

const EAGER_COST_THRESHOLD = 10;
const LAZY_COST_THRESHOLD = 20;

interface Entry {
  quantifier: number;
  bindings: Enode[];
  cost: number;
  generation: number;
  isInstantiated: boolean;
}

// quick_checker: evaluates a quantifier body under bindings with the E-graph and the assignment.
class QuickChecker {
  private bindings: Enode[] = [];
  private checkCache = new Map<number, boolean>();
  private canonizeCache = new Map<number, number>();

  constructor(private context: Context) {}

  isSat(body: number, bindings: Enode[]) {
    return this.run(body, bindings, true);
  }

  isUnsat(body: number, bindings: Enode[]) {
    return this.run(body, bindings, false);
  }

  private run(body: number, bindings: Enode[], isTrue: boolean) {
    this.bindings = bindings;
    this.checkCache.clear();
    this.canonizeCache.clear();
    return this.check(body, isTrue);
  }

  private check(expr: number, isTrue: boolean): boolean {
    const key = expr * 2 + (isTrue ? 1 : 0);
    const cached = this.checkCache.get(key);
    if (cached !== undefined) return cached;
    const result = this.checkCore(expr, isTrue);
    this.checkCache.set(key, result);
    return result;
  }

  private isAssigned(expr: number, isTrue: boolean) {
    const context = this.context;
    if (!context.isBInternalized(expr) || !context.isRelevant(expr)) return undefined;
    const value = context.getBoolVarAssignment(context.getBoolVar(expr));
    return value !== 0 && isTrue === (value > 0);
  }

  private checkCore(expr: number, isTrue: boolean): boolean {
    const context = this.context;
    const manager = context.manager;
    const assigned = this.isAssigned(expr, isTrue);
    if (assigned !== undefined) return assigned;
    if (manager.kinds[expr] !== KIND_APP) return false;
    const args = manager.args[expr];
    switch (manager.getOp(expr)) {
      case OP_TRUE:
        return isTrue;
      case OP_FALSE:
        return !isTrue;
      case OP_NOT:
        return this.check(args[0], !isTrue);
      case OP_OR:
        return isTrue
          ? args.some((innerArg) => this.check(innerArg, true))
          : args.every((innerArg) => this.check(innerArg, false));
      case OP_AND:
        return isTrue
          ? args.every((innerArg) => this.check(innerArg, true))
          : args.some((innerArg) => this.check(innerArg, false));
      case OP_ITE:
        if (this.check(args[0], true)) return this.check(args[1], isTrue);
        if (this.check(args[0], false)) return this.check(args[2], isTrue);
        return this.check(args[1], isTrue) && this.check(args[2], isTrue);
      case OP_EQ: {
        if (manager.isBool(args[0])) {
          const isLeftTrue = this.check(args[0], true);
          const isLeftFalse = this.check(args[0], false);
          const isRightTrue = this.check(args[1], true);
          const isRightFalse = this.check(args[1], false);
          return isTrue
            ? (isLeftTrue && isRightTrue) || (isLeftFalse && isRightFalse)
            : (isLeftTrue && isRightFalse) || (isLeftFalse && isRightTrue);
        }
        const lhs = this.canonize(args[0]);
        const rhs = this.canonize(args[1]);
        if (isTrue) return lhs === rhs;
        const lhsNode = context.getEnode(lhs);
        const rhsNode = context.getEnode(rhs);
        if (
          lhsNode !== undefined &&
          rhsNode !== undefined &&
          context.isRelevant(lhs) &&
          context.isRelevant(rhs) &&
          lhsNode.root !== rhsNode.root
        )
          return true;
        return lhs !== rhs && manager.isUniqueValue(lhs) && manager.isUniqueValue(rhs);
      }
      default:
        break;
    }
    const canonized = this.canonize(expr);
    if (context.isBInternalized(canonized) && context.isRelevant(canonized)) {
      const value = context.getBoolVarAssignment(context.getBoolVar(canonized));
      if (value !== 0) return isTrue === value > 0;
    }
    if (isTrue && canonized === manager.trueExpr) return true;
    return !isTrue && canonized === manager.falseExpr;
  }

  private canonize(expr: number): number {
    const context = this.context;
    const manager = context.manager;
    if (manager.kinds[expr] === KIND_VAR) {
      const index = manager.values[expr];
      if (index >= this.bindings.length) return expr;
      return this.bindings[this.bindings.length - index - 1].root.owner;
    }
    const existing = context.getEnode(expr);
    if (existing !== undefined) return existing.root.owner;
    if (manager.kinds[expr] !== KIND_APP || manager.args[expr].length === 0) return expr;
    const cached = this.canonizeCache.get(expr);
    if (cached !== undefined) return cached;
    const newArgs = manager.args[expr].map((innerArg) => this.canonize(innerArg));
    const argNodes = newArgs.map((innerArg) => context.getEnode(innerArg));
    if (argNodes.every((node) => node !== undefined)) {
      const found = context.findCongruent(manager.decls[expr], argNodes);
      if (found !== undefined) {
        this.canonizeCache.set(expr, found.root.owner);
        return found.root.owner;
      }
    }
    const result = context.rewriter.mkAppCore(manager.decls[expr], newArgs, manager.sorts[expr]);
    this.canonizeCache.set(expr, result);
    return result;
  }
}

export class QiQueue {
  private newEntries: Entry[] = [];
  private delayedEntries: Entry[] = [];
  private instantiatedTrail: number[] = [];
  private scopes: number[] = [];
  private checker: QuickChecker;
  numInstances = 0;

  constructor(private context: Context) {
    this.checker = new QuickChecker(context);
  }

  hasWork() {
    return this.newEntries.length > 0;
  }

  insert(quantifier: number, bindings: Enode[], generation: number) {
    const weight = this.context.manager.getQuantifier(quantifier).weight;
    this.newEntries.push({
      quantifier,
      bindings,
      cost: weight + generation,
      generation,
      isInstantiated: false,
    });
  }

  instantiate() {
    const entries = this.newEntries;
    this.newEntries = [];
    let sinceLastCheck = 0;
    for (const entry of entries) {
      if (entry.cost <= EAGER_COST_THRESHOLD) this.instantiateEntry(entry);
      else if (this.checker.isUnsat(this.context.manager.getQuantifier(entry.quantifier).body, entry.bindings))
        this.instantiateEntry(entry);
      else this.delayedEntries.push(entry);
      if (sinceLastCheck++ > 100) {
        if (this.context.checkCanceled()) break;
        sinceLastCheck = 0;
      }
    }
  }

  private instantiateEntry(entry: Entry) {
    const context = this.context;
    if (context.isInconsistent()) return;
    entry.isInstantiated = true;
    const manager = context.manager;
    const data = manager.getQuantifier(entry.quantifier);
    if (this.checker.isSat(data.body, entry.bindings)) return;
    const instance = context.rewriter.rewrite(
      substitute(
        manager,
        data.body,
        entry.bindings.map((binding) => binding.owner),
      ),
    );
    if (instance === manager.trueExpr) return;
    const negated = manager.mkNot(entry.quantifier);
    const lemma =
      manager.getOp(instance) === OP_OR
        ? manager.mkOr([negated, ...manager.args[instance]])
        : instance === manager.falseExpr
          ? negated
          : manager.mkOr([negated, instance]);
    this.numInstances++;
    const newGeneration =
      data.weight > 0 || entry.cost > 0
        ? Math.trunc(entry.cost)
        : Math.max(entry.generation + 1, Math.trunc(entry.cost));
    context.internalizeAssertion(lemma, newGeneration);
  }

  finalCheckEh() {
    let result = true;
    for (let index = 0; index < this.delayedEntries.length; index++) {
      const entry = this.delayedEntries[index];
      if (entry.isInstantiated || entry.cost > LAZY_COST_THRESHOLD) continue;
      result = false;
      this.instantiatedTrail.push(index);
      this.instantiateEntry(entry);
    }
    return result;
  }

  push() {
    this.scopes.push(this.delayedEntries.length, this.instantiatedTrail.length);
  }

  pop(numScopes: number) {
    const offset = this.scopes.length - numScopes * 2;
    const delayedLimit = this.scopes[offset];
    const trailLimit = this.scopes[offset + 1];
    for (let index = trailLimit; index < this.instantiatedTrail.length; index++)
      this.delayedEntries[this.instantiatedTrail[index]].isInstantiated = false;
    this.instantiatedTrail.length = trailLimit;
    this.delayedEntries.length = delayedLimit;
    this.newEntries = [];
    this.scopes.length = offset;
  }

  initSearchEh() {
    this.newEntries = [];
  }
}

// Ported from Z3 (src/smt/qi_queue.cpp, src/smt/smt_checker.cpp), MIT license, see
// z3-license.txt. Instances found by E-matching wait here. Z3's default cost is
// (+ weight generation): cheap instances are created at once, expensive ones only in the final
// check, and the checker skips instances that the current assignment already satisfies.
import { KIND_APP, KIND_VAR, OP_AND, OP_EQ, OP_FALSE, OP_ITE, OP_NOT, OP_OR, OP_TRUE } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { RefVector } from "./ref-vector";
import { VarSubst } from "./var-subst";
import { setAt, shrink } from "./array";

const EAGER_COST_THRESHOLD = 10;
const LAZY_COST_THRESHOLD = 20;

interface Entry {
  quantifier: number;
  bindings: Enode[];
  cost: number;
  generation: number;
  isInstantiated: boolean;
}

// A copy of the array with room for the index, at least twice as long.
const grow = (array: Int32Array, index: number) => {
  const grown = new Int32Array(Math.max(2 * array.length, index + 1));
  grown.set(array);
  return grown;
};

// smt::checker: evaluates a quantifier body under bindings with the E-graph and the assignment.
class Checker {
  private bindings: Enode[] = [];
  // The caches of a run, by expression, which hold an entry for the run whose stamp it has. So a run
  // starts with them empty without clearing them.
  private stamp = 0;
  private checkStamps = new Int32Array(1024);
  private checkResults = new Int32Array(1024);
  private enodeStamps = new Int32Array(1024);
  private enodeResults: (Enode | null | undefined)[] = [];
  // The ptr_buffer of each level of get_enode_eq_to_core, which Z3 keeps on the stack.
  private argBuffers: Enode[][] = [];
  private argDepth = 0;

  constructor(private context: Context) {}

  isSat(body: number, bindings: Enode[]) {
    return this.run(body, bindings, true);
  }

  isUnsat(body: number, bindings: Enode[]) {
    return this.run(body, bindings, false);
  }

  private run(body: number, bindings: Enode[], isTrue: boolean) {
    this.bindings = bindings;
    this.stamp++;
    return this.check(body, 0, isTrue);
  }

  private check(expr: number, depth: number, isTrue: boolean): boolean {
    const key = expr * 2 + (isTrue ? 1 : 0);
    if (key >= this.checkStamps.length) {
      this.checkStamps = grow(this.checkStamps, key);
      this.checkResults = grow(this.checkResults, key);
    }
    if (this.checkStamps[key] === this.stamp) return this.checkResults[key] === 1;
    const result = this.checkCore(expr, depth, isTrue);
    this.checkStamps[key] = this.stamp;
    this.checkResults[key] = result ? 1 : 0;
    return result;
  }

  private isAssigned(expr: number, isTrue: boolean) {
    const context = this.context;
    const value = context.isBInternalized(expr)
      ? context.getBoolVarAssignment(context.getBoolVar(expr))
      : 0;
    return value !== 0 && isTrue === value > 0;
  }

  private checkAny(expr: number, depth: number, isTrue: boolean) {
    const manager = this.context.manager;
    const numArgs = manager.getNumArgs(expr);
    for (let index = 0; index < numArgs; index++)
      if (this.check(manager.getArg(expr, index), depth, isTrue)) return true;
    return false;
  }

  private checkAll(expr: number, depth: number, isTrue: boolean) {
    const manager = this.context.manager;
    const numArgs = manager.getNumArgs(expr);
    for (let index = 0; index < numArgs; index++)
      if (!this.check(manager.getArg(expr, index), depth, isTrue)) return false;
    return true;
  }

  private checkCore(expr: number, depth: number, isTrue: boolean): boolean {
    if (depth > 600) return false;
    const context = this.context;
    const manager = context.manager;
    if (context.isBInternalized(expr) && context.isRelevant(expr))
      return this.isAssigned(expr, isTrue);
    if (manager.kinds[expr] !== KIND_APP) return false;
    const next = depth + 1;
    switch (manager.getOp(expr)) {
      case OP_TRUE:
        return isTrue;
      case OP_FALSE:
        return !isTrue;
      case OP_NOT:
        return this.check(manager.getArg(expr, 0), next, !isTrue);
      case OP_OR:
        return isTrue ? this.checkAny(expr, next, true) : this.checkAll(expr, next, false);
      case OP_AND:
        return isTrue ? this.checkAll(expr, next, true) : this.checkAny(expr, next, false);
      case OP_EQ: {
        if (!manager.isBool(manager.getArg(expr, 0))) {
          const lhs = this.getEnodeEqTo(manager.getArg(expr, 0));
          const rhs = this.getEnodeEqTo(manager.getArg(expr, 1));
          if (
            lhs === null ||
            rhs === null ||
            !context.isRelevant(lhs.owner) ||
            !context.isRelevant(rhs.owner)
          )
            return false;
          return isTrue ? lhs.root === rhs.root : context.isDiseq(lhs, rhs);
        }
        return (
          (this.check(manager.getArg(expr, 0), next, true) &&
            this.check(manager.getArg(expr, 1), next, isTrue)) ||
          (this.check(manager.getArg(expr, 0), next, false) &&
            this.check(manager.getArg(expr, 1), next, !isTrue))
        );
      }
      case OP_ITE: {
        const condition = manager.getArg(expr, 0);
        const atom = manager.isNot(condition) ? manager.getArg(condition, 0) : condition;
        if (
          condition !== manager.falseExpr &&
          (!context.isBInternalized(atom) || !context.isRelevant(condition))
        )
          return (
            this.check(manager.getArg(expr, 1), next, isTrue) &&
            this.check(manager.getArg(expr, 2), next, isTrue)
          );
        const value = context.getAssignment(context.getLiteral(condition));
        if (value === 0) return false;
        return this.check(
          value > 0 ? manager.getArg(expr, 1) : manager.getArg(expr, 2),
          next,
          isTrue,
        );
      }
      default:
        break;
    }
    const node = this.getEnodeEqTo(expr);
    if (node === null || !manager.isBool(node.owner) || !context.isRelevant(node.owner))
      return false;
    return this.isAssigned(node.owner, isTrue);
  }

  // get_enode_eq_to: the relevant term of the E-graph that the expression equals by congruence.
  private getEnodeEqTo(expr: number): Enode | null {
    const context = this.context;
    const manager = context.manager;
    if (manager.kinds[expr] === KIND_VAR) {
      const index = manager.values[expr];
      return index < this.bindings.length ? this.bindings[this.bindings.length - index - 1] : null;
    }
    const existing = context.getEnode(expr);
    if (existing !== undefined && context.isRelevant(expr)) return existing;
    if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return null;
    if (expr >= this.enodeStamps.length) this.enodeStamps = grow(this.enodeStamps, expr);
    if (this.enodeStamps[expr] === this.stamp) return this.enodeResults[expr] ?? null;
    const depth = this.argDepth;
    if (depth === this.argBuffers.length) this.argBuffers.push([]);
    const argNodes = this.argBuffers[depth];
    shrink(argNodes, 0);
    this.argDepth = depth + 1;
    for (let index = 0; index < manager.getNumArgs(expr); index++) {
      const arg = manager.getArg(expr, index);
      const node = this.getEnodeEqTo(arg);
      if (node === null) {
        this.argDepth = depth;
        this.enodeStamps[expr] = this.stamp;
        setAt(this.enodeResults, expr, null);
        return null;
      }
      argNodes.push(node);
    }
    this.argDepth = depth;
    const found = context.findCongruent(manager.decls[expr], argNodes);
    const result = found !== undefined && context.isRelevant(found.owner) ? found : null;
    this.enodeStamps[expr] = this.stamp;
    setAt(this.enodeResults, expr, result);
    return result;
  }
}

export class QiQueue {
  private newEntries: Entry[] = [];
  private delayedEntries: Entry[] = [];
  private instantiatedTrail: number[] = [];
  private scopes: number[] = [];
  private checker: Checker;
  // cached_var_subst: each instance by its quantifier and bindings, which the queue holds with them
  // until the next search. instanceRefs lists the quantifier, the bindings and the instance of each,
  // and instances maps a hash of the key to where its entries start there.
  private subst: VarSubst;
  private instances = new Map<number, number[]>();
  private instanceRefs: number[] = [];
  private bindingOwners: number[] = [];
  // m_instances: the lemmas, which the queue holds until their scope is popped.
  private lemmas: RefVector;
  numInstances = 0;

  constructor(private context: Context) {
    this.checker = new Checker(context);
    this.subst = new VarSubst(context.manager, true);
    this.lemmas = new RefVector(context.manager);
  }

  private getInstance(quantifier: number, bindings: number[]) {
    const manager = this.context.manager;
    const refs = this.instanceRefs;
    let hash = quantifier;
    for (const binding of bindings) hash = (Math.imul(hash, 0x9e3779b1) + binding) | 0;
    const bucket = this.instances.get(hash);
    for (const start of bucket ?? []) {
      let isSame = refs[start] === quantifier;
      for (let index = 0; index < bindings.length && isSame; index++)
        isSame = refs[start + 1 + index] === bindings[index];
      if (isSame) return refs[start + 1 + bindings.length];
    }
    const instance = this.subst.apply(manager.getQuantifier(quantifier).body, bindings);
    if (bucket === undefined) this.instances.set(hash, [refs.length]);
    else bucket.push(refs.length);
    manager.incRef(quantifier);
    for (const binding of bindings) manager.incRef(binding);
    refs.push(quantifier, ...bindings, instance);
    return instance;
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
      else if (
        this.checker.isUnsat(
          this.context.manager.getQuantifier(entry.quantifier).body,
          entry.bindings,
        )
      )
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
    // The bindings' expressions, which Z3 writes into the buffer that m_subst returns.
    const owners = this.bindingOwners;
    shrink(owners, 0);
    for (const binding of entry.bindings) owners.push(binding.owner);
    const substituted = this.getInstance(entry.quantifier, owners);
    manager.incRef(substituted);
    const instance = context.rewriter.rewrite(substituted);
    if (instance !== manager.trueExpr) {
      const negated = manager.mkNot(entry.quantifier);
      const disjuncts = [negated];
      if (manager.getOp(instance) === OP_OR) manager.pushArgs(instance, disjuncts);
      else if (instance !== manager.falseExpr) disjuncts.push(instance);
      const lemma = manager.mkOr(disjuncts);
      this.lemmas.push(lemma);
      this.numInstances++;
      const newGeneration =
        data.weight > 0 || entry.cost > 0
          ? Math.trunc(entry.cost)
          : Math.max(entry.generation + 1, Math.trunc(entry.cost));
      context.internalizeAssertion(lemma, newGeneration);
    }
    manager.decRef(instance);
    manager.decRef(substituted);
  }

  finalCheckEh() {
    let result = true;
    for (let index = 0; index < this.delayedEntries.length; index++) {
      const entry = this.delayedEntries[index];
      if (entry.isInstantiated || entry.cost > LAZY_COST_THRESHOLD) continue;
      result = false;
      this.instantiatedTrail.push(index);
      this.instantiateEntry(entry);
      if (this.context.checkCanceled()) break;
    }
    return result;
  }

  push() {
    this.scopes.push(this.delayedEntries.length, this.instantiatedTrail.length, this.lemmas.size);
  }

  pop(numScopes: number) {
    const offset = this.scopes.length - numScopes * 3;
    const delayedLimit = this.scopes[offset];
    const trailLimit = this.scopes[offset + 1];
    for (let index = trailLimit; index < this.instantiatedTrail.length; index++)
      this.delayedEntries[this.instantiatedTrail[index]].isInstantiated = false;
    shrink(this.instantiatedTrail, trailLimit);
    shrink(this.delayedEntries, delayedLimit);
    this.lemmas.shrink(this.scopes[offset + 2]);
    this.newEntries = [];
    shrink(this.scopes, offset);
  }

  initSearchEh() {
    const manager = this.context.manager;
    for (const expr of this.instanceRefs) manager.decRef(expr);
    this.instanceRefs = [];
    this.instances.clear();
    this.newEntries = [];
  }
}

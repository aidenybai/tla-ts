// Ported from Z3 (src/smt/qi_queue.cpp, src/smt/smt_checker.cpp), MIT license, see
// z3-license.txt. Instances found by E-matching wait here. Z3's default cost is
// (+ weight generation): cheap instances are created at once, expensive ones only in the final
// check, and the checker skips instances that the current assignment already satisfies.
import { KIND_APP, KIND_VAR, OP_AND, OP_EQ, OP_FALSE, OP_ITE, OP_NOT, OP_OR, OP_TRUE } from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import type { FingerprintSet } from "./fingerprints";
import { RefVector } from "./ref-vector";
import { VarSubst } from "./var-subst";
import { shrink } from "./array";

const EAGER_COST_THRESHOLD = 10;
const LAZY_COST_THRESHOLD = 20;

// The entries of a queue by field, so that an entry takes no object: the quantifier, the
// fingerprint whose roots are the bindings, the cost, the generation and whether it was instantiated.
class Entries {
  quantifiers: number[] = [];
  fingerprints: number[] = [];
  costs: number[] = [];
  generations: number[] = [];
  isInstantiated: boolean[] = [];

  get size() {
    return this.quantifiers.length;
  }

  push(quantifier: number, fingerprint: number, cost: number, generation: number) {
    this.quantifiers.push(quantifier);
    this.fingerprints.push(fingerprint);
    this.costs.push(cost);
    this.generations.push(generation);
    this.isInstantiated.push(false);
  }

  shrink(size: number) {
    shrink(this.quantifiers, size);
    shrink(this.fingerprints, size);
    shrink(this.costs, size);
    shrink(this.generations, size);
    shrink(this.isInstantiated, size);
  }
}

// A copy of the array with room for the index, at least twice as long.
const grow = (array: Int32Array, index: number) => {
  const grown = new Int32Array(Math.max(2 * array.length, index + 1));
  grown.set(array);
  return grown;
};

// smt::checker: evaluates a quantifier body under bindings with the E-graph and the assignment.
class Checker {
  // The bindings are numBindings nodes of roots from bindingStart.
  private roots: Enode[] = [];
  private bindingStart = 0;
  private numBindings = 0;
  // The caches of a run, by expression, which hold an entry for the run whose stamp it has. So a run
  // starts with them empty without clearing them.
  private stamp = 0;
  private checkStamps = new Int32Array(1024);
  private checkResults = new Int32Array(1024);
  private enodeStamps = new Int32Array(1024);
  // The owner of the node found, or -1 for none, so that the cache holds no objects.
  private enodeResults = new Int32Array(1024);
  // The ptr_buffer of each level of get_enode_eq_to_core, which Z3 keeps on the stack.
  private argBuffers: Enode[][] = [];
  private argDepth = 0;

  constructor(private context: Context) {}

  isSat(body: number, roots: Enode[], bindingStart: number, numBindings: number) {
    return this.run(body, roots, bindingStart, numBindings, true);
  }

  isUnsat(body: number, roots: Enode[], bindingStart: number, numBindings: number) {
    return this.run(body, roots, bindingStart, numBindings, false);
  }

  private run(
    body: number,
    roots: Enode[],
    bindingStart: number,
    numBindings: number,
    isTrue: boolean,
  ) {
    this.roots = roots;
    this.bindingStart = bindingStart;
    this.numBindings = numBindings;
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
      return index < this.numBindings
        ? this.roots[this.bindingStart + this.numBindings - index - 1]
        : null;
    }
    const existing = context.getEnode(expr);
    if (existing !== undefined && context.isRelevant(expr)) return existing;
    if (manager.kinds[expr] !== KIND_APP || manager.getNumArgs(expr) === 0) return null;
    if (expr >= this.enodeStamps.length) {
      this.enodeStamps = grow(this.enodeStamps, expr);
      this.enodeResults = grow(this.enodeResults, expr);
    }
    if (this.enodeStamps[expr] === this.stamp) {
      const owner = this.enodeResults[expr];
      return owner === -1 ? null : (context.getEnode(owner) ?? null);
    }
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
        this.enodeResults[expr] = -1;
        return null;
      }
      argNodes.push(node);
    }
    this.argDepth = depth;
    const found = context.findCongruent(manager.decls[expr], argNodes);
    const result = found !== undefined && context.isRelevant(found.owner) ? found : null;
    this.enodeStamps[expr] = this.stamp;
    this.enodeResults[expr] = result === null ? -1 : result.owner;
    return result;
  }
}

export class QiQueue {
  private newEntries = new Entries();
  private spareEntries = new Entries();
  private delayedEntries = new Entries();
  private instantiatedTrail: number[] = [];
  private scopes: number[] = [];
  private checker: Checker;
  // cached_var_subst: each instance by its quantifier and bindings, which the queue holds with them
  // until the next search. instanceRefs lists the quantifier, the bindings and the instance of each.
  // instanceStarts holds where each instance starts there, and instanceNext the earlier instance in
  // the same bucket, or -1. instanceBuckets holds the last instance of each bucket of hashes, which
  // instanceHashes tells apart.
  private subst: VarSubst;
  private instanceBuckets = new Int32Array(1024).fill(-1);
  private instanceHashes: number[] = [];
  private instanceRefs: number[] = [];
  private instanceStarts: number[] = [];
  private instanceNext: number[] = [];
  private bindingOwners: number[] = [];
  // m_instances: the lemmas, which the queue holds until their scope is popped.
  private lemmas: RefVector;
  numInstances = 0;

  constructor(
    private context: Context,
    private fingerprints: FingerprintSet,
  ) {
    this.checker = new Checker(context);
    this.subst = new VarSubst(context.manager, true);
    this.lemmas = new RefVector(context.manager);
  }

  private getInstance(quantifier: number, bindings: number[]) {
    const manager = this.context.manager;
    const refs = this.instanceRefs;
    let hash = quantifier;
    for (const binding of bindings) hash = (Math.imul(hash, 0x9e3779b1) + binding) | 0;
    const bucket = hash & (this.instanceBuckets.length - 1);
    const last = this.instanceBuckets[bucket];
    for (let entry = last; entry !== -1; entry = this.instanceNext[entry]) {
      if (this.instanceHashes[entry] !== hash) continue;
      const start = this.instanceStarts[entry];
      let isSame = refs[start] === quantifier;
      for (let index = 0; index < bindings.length && isSame; index++)
        isSame = refs[start + 1 + index] === bindings[index];
      if (isSame) return refs[start + 1 + bindings.length];
    }
    const instance = this.subst.apply(manager.getQuantifier(quantifier).body, bindings);
    this.instanceBuckets[bucket] = this.instanceStarts.length;
    this.instanceStarts.push(refs.length);
    this.instanceNext.push(last);
    this.instanceHashes.push(hash);
    if (this.instanceHashes.length > this.instanceBuckets.length) this.growInstanceBuckets();
    manager.incRef(quantifier);
    refs.push(quantifier);
    for (const binding of bindings) {
      manager.incRef(binding);
      refs.push(binding);
    }
    refs.push(instance);
    return instance;
  }

  private growInstanceBuckets() {
    const buckets = new Int32Array(2 * this.instanceBuckets.length).fill(-1);
    const mask = buckets.length - 1;
    for (let entry = 0; entry < this.instanceHashes.length; entry++) {
      const bucket = this.instanceHashes[entry] & mask;
      this.instanceNext[entry] = buckets[bucket];
      buckets[bucket] = entry;
    }
    this.instanceBuckets = buckets;
  }

  hasWork() {
    return this.newEntries.size > 0;
  }

  insert(quantifier: number, fingerprint: number, generation: number) {
    const weight = this.context.manager.getQuantifier(quantifier).weight;
    this.newEntries.push(quantifier, fingerprint, weight + generation, generation);
  }

  // The entries trade places with the spare list, which the next inserts fill, so that the lists are
  // reused.
  instantiate() {
    const entries = this.newEntries;
    this.newEntries = this.spareEntries;
    this.spareEntries = entries;
    const manager = this.context.manager;
    const fingerprints = this.fingerprints;
    let sinceLastCheck = 0;
    for (let index = 0; index < entries.size; index++) {
      const quantifier = entries.quantifiers[index];
      const fingerprint = entries.fingerprints[index];
      if (entries.costs[index] <= EAGER_COST_THRESHOLD) this.instantiateEntry(entries, index);
      else {
        const data = manager.getQuantifier(quantifier);
        if (
          this.checker.isUnsat(
            data.body,
            fingerprints.roots,
            fingerprints.getRootStart(fingerprint),
            data.sorts.length,
          )
        )
          this.instantiateEntry(entries, index);
        else
          this.delayedEntries.push(
            quantifier,
            fingerprint,
            entries.costs[index],
            entries.generations[index],
          );
      }
      if (sinceLastCheck++ > 100) {
        if (this.context.checkCanceled()) break;
        sinceLastCheck = 0;
      }
    }
    entries.shrink(0);
  }

  private instantiateEntry(entries: Entries, index: number) {
    const context = this.context;
    if (context.isInconsistent()) return;
    entries.isInstantiated[index] = true;
    const manager = context.manager;
    const quantifier = entries.quantifiers[index];
    const cost = entries.costs[index];
    const data = manager.getQuantifier(quantifier);
    const fingerprints = this.fingerprints;
    const roots = fingerprints.roots;
    const bindingStart = fingerprints.getRootStart(entries.fingerprints[index]);
    const numBindings = data.sorts.length;
    if (this.checker.isSat(data.body, roots, bindingStart, numBindings)) return;
    // The bindings' expressions, which Z3 writes into the buffer that m_subst returns.
    const owners = this.bindingOwners;
    shrink(owners, 0);
    for (let offset = 0; offset < numBindings; offset++)
      owners.push(roots[bindingStart + offset].owner);
    const substituted = this.getInstance(quantifier, owners);
    manager.incRef(substituted);
    const instance = context.rewriter.rewrite(substituted);
    if (instance !== manager.trueExpr) {
      const negated = manager.mkNot(quantifier);
      const disjuncts = [negated];
      if (manager.getOp(instance) === OP_OR) manager.pushArgs(instance, disjuncts);
      else if (instance !== manager.falseExpr) disjuncts.push(instance);
      const lemma = manager.mkOr(disjuncts);
      this.lemmas.push(lemma);
      this.numInstances++;
      const newGeneration =
        data.weight > 0 || cost > 0
          ? Math.trunc(cost)
          : Math.max(entries.generations[index] + 1, Math.trunc(cost));
      context.internalizeAssertion(lemma, newGeneration);
    }
    manager.decRef(instance);
    manager.decRef(substituted);
  }

  finalCheckEh() {
    let result = true;
    const entries = this.delayedEntries;
    for (let index = 0; index < entries.size; index++) {
      if (entries.isInstantiated[index] || entries.costs[index] > LAZY_COST_THRESHOLD) continue;
      result = false;
      this.instantiatedTrail.push(index);
      this.instantiateEntry(entries, index);
      if (this.context.checkCanceled()) break;
    }
    return result;
  }

  push() {
    this.scopes.push(this.delayedEntries.size, this.instantiatedTrail.length, this.lemmas.size);
  }

  pop(numScopes: number) {
    const offset = this.scopes.length - numScopes * 3;
    const delayedLimit = this.scopes[offset];
    const trailLimit = this.scopes[offset + 1];
    for (let index = trailLimit; index < this.instantiatedTrail.length; index++)
      this.delayedEntries.isInstantiated[this.instantiatedTrail[index]] = false;
    shrink(this.instantiatedTrail, trailLimit);
    this.delayedEntries.shrink(delayedLimit);
    this.lemmas.shrink(this.scopes[offset + 2]);
    this.newEntries.shrink(0);
    shrink(this.scopes, offset);
  }

  initSearchEh() {
    const manager = this.context.manager;
    for (const expr of this.instanceRefs) manager.decRef(expr);
    this.instanceRefs = [];
    this.instanceStarts = [];
    this.instanceNext = [];
    this.instanceHashes = [];
    this.instanceBuckets.fill(-1);
    this.newEntries.shrink(0);
  }
}

// Ported from Z3 (src/smt/dyn_ack.cpp), MIT license, see z3-license.txt. Dynamic Ackermann
// reduction with Z3's default DACK_ROOT strategy: a pair of applications whose congruence is the
// root of conflicts often enough gets the clause f(a) = f(b) or some a_i != b_i, so the search can
// learn from it without the E-graph. dack.eq is off by default, so equalities are not tracked.
import { OP_EQ } from "./ast";
import { CLS_TH_LEMMA } from "./clause";
import type { Context } from "./context";
import { Literal, negate } from "./literal";

// dyn_ack_params defaults: dack.threshold, dack.factor, dack.gc and dack.gc_inv_decay.
const DACK_THRESHOLD = 10;
const DACK_FACTOR = 0.1;
const DACK_GC = 2000;
const DACK_GC_INV_DECAY = 0.8;

interface AppPair {
  first: number;
  second: number;
  key: string;
}

export class DynAckManager {
  private appPair2NumOccs = new Map<string, number>();
  // The pairs that hold references to their applications. A pair can appear more than once.
  private appPairs: AppPair[] = [];
  private toInstantiate: AppPair[] = [];
  private qhead = 0;
  private numInstances = 0;
  private numPropagationsSinceLastGc = 0;
  private instantiated = new Set<string>();

  constructor(private readonly context: Context) {}

  private resetAppPairs() {
    const manager = this.context.manager;
    for (const pair of this.appPairs) {
      manager.decRef(pair.first);
      manager.decRef(pair.second);
    }
    this.appPairs = [];
  }

  initSearchEh() {
    this.appPair2NumOccs.clear();
    this.resetAppPairs();
    this.toInstantiate = [];
    this.qhead = 0;
    this.numInstances = 0;
    this.numPropagationsSinceLastGc = 0;
  }

  // cg_conflict_eh, which DACK_ROOT turns into cg_eh: the congruence of the two applications is the
  // root of a conflict.
  cgConflictEh(inputFirst: number, inputSecond: number) {
    const manager = this.context.manager;
    if (manager.decls[inputFirst] === OP_EQ) return;
    const isSwapped = manager.ids[inputFirst] > manager.ids[inputSecond];
    const first = isSwapped ? inputSecond : inputFirst;
    const second = isSwapped ? inputFirst : inputSecond;
    const key = `${first},${second}`;
    if (this.instantiated.has(key)) return;
    const previous = this.appPair2NumOccs.get(key);
    const pair = { first, second, key };
    if (previous === undefined) {
      manager.incRef(first);
      manager.incRef(second);
      this.appPairs.push(pair);
    }
    const numOccs = (previous ?? 0) + 1;
    this.appPair2NumOccs.set(key, numOccs);
    if (numOccs === DACK_THRESHOLD) this.toInstantiate.push(pair);
  }

  // gc: decays every count, drops the pairs that fall to 1 or below, and queues the frequent ones,
  // most frequent first.
  private gc() {
    const manager = this.context.manager;
    this.toInstantiate = [];
    this.qhead = 0;
    let kept = 0;
    for (const pair of this.appPairs) {
      if (this.instantiated.has(pair.key)) {
        manager.decRef(pair.first);
        manager.decRef(pair.second);
        continue;
      }
      const numOccs = Math.trunc((this.appPair2NumOccs.get(pair.key) ?? 0) * DACK_GC_INV_DECAY);
      if (numOccs <= 1) {
        this.appPair2NumOccs.delete(pair.key);
        manager.decRef(pair.first);
        manager.decRef(pair.second);
        continue;
      }
      this.appPairs[kept++] = pair;
      this.appPair2NumOccs.set(pair.key, numOccs);
      if (numOccs >= DACK_THRESHOLD) this.toInstantiate.push(pair);
    }
    this.appPairs.length = kept;
    const getNumOccs = (pair: AppPair) => this.appPair2NumOccs.get(pair.key) ?? 0;
    this.toInstantiate.sort((left, right) => getNumOccs(right) - getNumOccs(left));
  }

  propagateEh() {
    this.numPropagationsSinceLastGc++;
    if (this.numPropagationsSinceLastGc > DACK_GC) {
      this.gc();
      this.numPropagationsSinceLastGc = 0;
    }
    const maxInstances = Math.trunc(this.context.getNumConflicts() * DACK_FACTOR);
    while (this.numInstances < maxInstances && this.qhead < this.toInstantiate.length) {
      const pair = this.toInstantiate[this.qhead];
      this.qhead++;
      this.numInstances++;
      this.instantiate(pair);
    }
  }

  private mkEq(first: number, second: number) {
    const context = this.context;
    const eq = context.manager.mkEq(first, second);
    context.internalize(eq, true);
    return context.getLiteral(eq);
  }

  private instantiate(pair: AppPair) {
    const context = this.context;
    const manager = context.manager;
    const firstArgs = manager.args[pair.first];
    const secondArgs = manager.args[pair.second];
    const literals: Literal[] = [];
    for (let index = 0; index < firstArgs.length; index++)
      if (firstArgs[index] !== secondArgs[index])
        literals.push(negate(this.mkEq(firstArgs[index], secondArgs[index])));
    this.appPair2NumOccs.delete(pair.key);
    // The pair stays in appPairs, which still holds its references.
    this.instantiated.add(pair.key);
    literals.push(this.mkEq(pair.first, pair.second));
    for (const literal of literals) context.markLiteralAsRelevant(literal);
    context.mkClause(literals, null, CLS_TH_LEMMA, () => this.instantiated.delete(pair.key));
  }
}

// Ported from Z3 (src/smt/smt_quantifier.cpp, src/smt/fingerprints.cpp), MIT license, see
// z3-license.txt. Z3's default quantifier plugin without model-based instantiation: patterns go to
// an eager matcher, except that a quantifier with only multi-patterns keeps one of them eager and
// sends the rest to a lazy matcher that runs in the final check.
import { FC_CONTINUE, FC_DONE, type Context, type QuantifierManager } from "./context";
import { Mam } from "./e-matching";
import type { Enode } from "./enode";
import { QiQueue } from "./qi-queue";

const QI_MAX_EAGER_MULTIPATTERNS = 0;
const QI_MAX_LAZY_MULTIPATTERN_MATCHING = 2;

export class DefaultQuantifierManager implements QuantifierManager {
  private quantifiers: number[] = [];
  private generations = new Map<number, number>();
  private qiQueue: QiQueue;
  private mam: Mam;
  private lazyMam: Mam;
  private fingerprints = new Set<string>();
  private fingerprintTrail: string[] = [];
  private fingerprintScopes: number[] = [];
  private isActive = false;
  private lazyMatchingIndex = 0;

  constructor(private context: Context) {
    this.qiQueue = new QiQueue(context);
    const onMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) =>
      this.addInstance(quantifier, bindings, maxGeneration);
    this.mam = new Mam(context, onMatch);
    this.lazyMam = new Mam(context, onMatch);
  }

  getNumInstances() {
    return this.qiQueue.numInstances;
  }

  add(quantifier: number, generation: number) {
    this.quantifiers.push(quantifier);
    this.generations.set(quantifier, generation);
  }

  del(quantifier: number) {
    this.quantifiers.pop();
    this.generations.delete(quantifier);
  }

  hasQuantifiers() {
    return this.quantifiers.length > 0;
  }

  getGeneration(quantifier: number) {
    return this.generations.get(quantifier) ?? 0;
  }

  assignEh(quantifier: number) {
    this.isActive = true;
    const patterns = this.context.manager.getQuantifier(quantifier).patterns;
    const hasUnaryPattern = patterns.some((pattern) => pattern.length === 1);
    const numEagerMultiPatterns = QI_MAX_EAGER_MULTIPATTERNS + (hasUnaryPattern ? 0 : 1);
    let multiPatternIndex = 0;
    for (const pattern of patterns) {
      const isUnary = pattern.length === 1;
      if (!isUnary && multiPatternIndex >= numEagerMultiPatterns) this.lazyMam.addPattern(quantifier, pattern);
      else this.mam.addPattern(quantifier, pattern);
      if (!isUnary) multiPatternIndex++;
    }
  }

  addEqEh(first: Enode, second: Enode) {
    if (this.quantifiers.length > 0) this.mam.addEqEh(first, second);
  }

  relevantEh(node: Enode) {
    if (this.quantifiers.length === 0) return;
    this.mam.relevantEh(node, false);
    this.lazyMam.relevantEh(node, true);
  }

  push() {
    this.qiQueue.push();
    this.fingerprintScopes.push(this.fingerprintTrail.length);
  }

  pop(numScopes: number) {
    this.mam.popScope();
    this.lazyMam.popScope();
    this.qiQueue.pop(numScopes);
    const limit = this.fingerprintScopes[this.fingerprintScopes.length - numScopes];
    for (let index = this.fingerprintTrail.length - 1; index >= limit; index--)
      this.fingerprints.delete(this.fingerprintTrail[index]);
    this.fingerprintTrail.length = limit;
    this.fingerprintScopes.length -= numScopes;
  }

  canPropagate() {
    return this.qiQueue.hasWork() || (this.isActive && this.mam.hasWork());
  }

  propagate() {
    if (this.isActive) this.mam.match();
    this.qiQueue.instantiate();
  }

  private addInstance(quantifier: number, bindings: Enode[], maxGeneration: number) {
    const generation = Math.max(maxGeneration, this.getGeneration(quantifier));
    const roots = bindings.map((binding) => binding.root);
    let key = `${quantifier}`;
    for (const root of roots) key += `:${root.owner}`;
    if (this.fingerprints.has(key)) return;
    this.fingerprints.add(key);
    this.fingerprintTrail.push(key);
    this.qiQueue.insert(quantifier, roots, generation);
  }

  finalCheckEh(isFull: boolean) {
    if (!isFull) return FC_DONE;
    let result = this.qiQueue.finalCheckEh() ? FC_DONE : FC_CONTINUE;
    if (this.quantifiers.length > 0 && this.lazyMatchingIndex < QI_MAX_LAZY_MULTIPATTERN_MATCHING) {
      this.lazyMam.rematch();
      const saved = this.lazyMatchingIndex;
      this.context.pushTrail(() => {
        this.lazyMatchingIndex = saved;
      });
      this.lazyMatchingIndex++;
    }
    if (this.context.canPropagate()) result = FC_CONTINUE;
    return result;
  }

  initSearchEh() {
    this.lazyMatchingIndex = 0;
    this.qiQueue.initSearchEh();
  }

  restartEh() {}
}

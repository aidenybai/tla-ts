// Ported from Z3 (src/smt/smt_quantifier.cpp), MIT license, see
// z3-license.txt. Z3's default quantifier plugin: patterns go to an eager matcher, except that a
// quantifier with only multi-patterns keeps one of them eager and sends the rest to a lazy matcher
// that runs in the final check. With MBQI, the model finder and the model checker turn candidate
// models into instances.
import {
  CHECK_MODEL_RESTART,
  CHECK_MODEL_SAT,
  CHECK_MODEL_UNKNOWN,
  FC_CONTINUE,
  FC_DONE,
  type Context,
  type QuantifierManager,
} from "./context";
import { Mam } from "./e-matching";
import type { Enode } from "./enode";
import { FingerprintSet } from "./fingerprints";
import { ModelChecker } from "./model-checker";
import { ModelFinder } from "./model-finder";
import type { ProtoModel } from "./proto-model";
import { QiQueue } from "./qi-queue";

const QI_MAX_EAGER_MULTIPATTERNS = 0;
const QI_MAX_LAZY_MULTIPATTERN_MATCHING = 2;

export class DefaultQuantifierManager implements QuantifierManager {
  readonly quantifiers: number[] = [];
  private generations = new Map<number, number>();
  private qiQueue: QiQueue;
  private mam: Mam;
  private lazyMam: Mam;
  private fingerprints = new FingerprintSet();
  private isActive = false;
  private lazyMatchingIndex = 0;
  private modelFinder: ModelFinder | null = null;
  private modelChecker: ModelChecker | null = null;

  constructor(
    private context: Context,
    isMbqi: boolean,
  ) {
    this.qiQueue = new QiQueue(context);
    const onMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) =>
      this.addInstance(quantifier, bindings, maxGeneration);
    this.mam = new Mam(context, onMatch);
    this.lazyMam = new Mam(context, onMatch);
    if (!isMbqi) return;
    this.modelFinder = new ModelFinder(context.manager, context);
    this.modelChecker = new ModelChecker(context, this.modelFinder, this, context.deadline);
  }

  getNumInstances() {
    return this.qiQueue.numInstances;
  }

  add(quantifier: number, generation: number) {
    this.quantifiers.push(quantifier);
    this.generations.set(quantifier, generation);
    this.modelFinder?.registerQuantifier(quantifier);
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
      if (!isUnary && multiPatternIndex >= numEagerMultiPatterns)
        this.lazyMam.addPattern(quantifier, pattern);
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
    this.modelFinder?.pushScope();
    this.qiQueue.push();
    this.fingerprints.push();
  }

  pop(numScopes: number) {
    this.mam.popScope();
    this.lazyMam.popScope();
    this.modelFinder?.popScope(numScopes);
    this.qiQueue.pop(numScopes);
    this.fingerprints.pop(numScopes);
  }

  canPropagate() {
    return this.qiQueue.hasWork() || (this.isActive && this.mam.hasWork());
  }

  propagate() {
    if (this.isActive) this.mam.match();
    this.qiQueue.instantiate();
  }

  addInstance(quantifier: number, bindings: Enode[], maxGeneration: number) {
    const generation = Math.max(maxGeneration, this.getGeneration(quantifier));
    const roots = bindings.map((binding) => binding.root);
    if (!this.fingerprints.insert(quantifier, roots)) return;
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
    this.modelChecker?.initSearchEh();
    this.qiQueue.initSearchEh();
  }

  restartEh() {
    this.modelFinder?.restartEh();
    this.modelChecker?.restartEh();
  }

  isModelBased() {
    return this.modelChecker !== null;
  }

  adjustModel(model: ProtoModel) {
    this.modelFinder?.fixModel(model);
  }

  checkModel(model: ProtoModel, root2value: Map<Enode, number>) {
    const checker = this.modelChecker;
    if (this.quantifiers.length === 0) return CHECK_MODEL_SAT;
    if (checker === null) return CHECK_MODEL_UNKNOWN;
    if (checker.check(model, root2value)) return CHECK_MODEL_SAT;
    return checker.hasNewInstances() ? CHECK_MODEL_RESTART : CHECK_MODEL_UNKNOWN;
  }
}

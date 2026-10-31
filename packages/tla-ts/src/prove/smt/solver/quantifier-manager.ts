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

// Model-based quantifier instantiation: the finder completes candidate models, the checker refutes
// them with instances.
interface Mbqi {
  finder: ModelFinder;
  checker: ModelChecker;
}

export class DefaultQuantifierManager {
  readonly quantifiers: number[] = [];
  private generations = new Map<number, number>();
  private qiQueue: QiQueue;
  private mam: Mam;
  private lazyMam: Mam;
  private fingerprints: FingerprintSet;
  private isActive = false;
  private lazyMatchingIndex = 0;
  private mbqi: Mbqi | null = null;

  constructor(
    private context: Context,
    isMbqi: boolean,
  ) {
    this.qiQueue = new QiQueue(context);
    this.fingerprints = new FingerprintSet(context.manager);
    const onMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) =>
      this.addInstance(quantifier, bindings, maxGeneration);
    this.mam = new Mam(context, onMatch);
    this.lazyMam = new Mam(context, onMatch);
    if (!isMbqi) return;
    const finder = new ModelFinder(context.manager, context);
    this.mbqi = { finder, checker: new ModelChecker(context, finder, this) };
  }

  getNumInstances() {
    return this.qiQueue.numInstances;
  }

  add(quantifier: number, generation: number) {
    this.quantifiers.push(quantifier);
    this.generations.set(quantifier, generation);
    this.mbqi?.finder.registerQuantifier(quantifier);
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
    const manager = this.context.manager;
    const patterns = manager
      .getQuantifier(quantifier)
      .patterns.map((pattern) => manager.args[pattern]);
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
    this.mam.pushScope();
    this.lazyMam.pushScope();
    this.mbqi?.finder.pushScope();
    this.qiQueue.push();
    this.fingerprints.push();
  }

  pop(numScopes: number) {
    this.mam.popScope(numScopes);
    this.lazyMam.popScope(numScopes);
    this.mbqi?.finder.popScope(numScopes);
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
    if (!this.fingerprints.insert(quantifier, bindings)) return;
    this.qiQueue.insert(
      quantifier,
      bindings.map((binding) => binding.root),
      generation,
    );
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
    this.mbqi?.checker.initSearchEh();
    this.qiQueue.initSearchEh();
  }

  restartEh() {
    this.mbqi?.finder.restartEh();
    this.mbqi?.checker.restartEh();
  }

  isModelBased() {
    return this.mbqi !== null;
  }

  adjustModel(model: ProtoModel) {
    this.mbqi?.finder.fixModel(model);
  }

  checkModel(model: ProtoModel, root2value: Map<Enode, number>) {
    const checker = this.mbqi?.checker;
    if (this.quantifiers.length === 0) return CHECK_MODEL_SAT;
    if (checker === undefined) return CHECK_MODEL_UNKNOWN;
    if (checker.check(model, root2value)) return CHECK_MODEL_SAT;
    return checker.hasNewInstances() ? CHECK_MODEL_RESTART : CHECK_MODEL_UNKNOWN;
  }
}

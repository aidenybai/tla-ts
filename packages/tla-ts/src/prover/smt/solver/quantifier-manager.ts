import { CHECK_MODEL_RESTART, CHECK_MODEL_SAT, CHECK_MODEL_UNKNOWN, type Context } from "./context";
import { FC_CONTINUE, FC_DONE } from "./theory";
import { Mam } from "./e-matching";
import type { Enode } from "./enode";
import { ModelChecker } from "./model-checker";
import { ModelFinder } from "./model-finder";
import type { ProtoModel } from "./proto-model";
import { QiQueue } from "./qi-queue";

const QI_MAX_EAGER_MULTIPATTERNS = 0;
const QI_MAX_LAZY_MULTIPATTERN_MATCHING = 2;

export class DefaultQuantifierManager {
  readonly quantifiers: number[] = [];
  private generations = new Map<number, number>();
  private qiQueue: QiQueue;
  private mam: Mam;
  private lazyMam: Mam;
  private isActive = false;
  private lazyMatchingIndex = 0;
  private newEnodeQhead = 0;
  private finder: ModelFinder;
  private checker: ModelChecker;

  constructor(private context: Context) {
    this.qiQueue = new QiQueue(context);
    const onMatch = (quantifier: number, bindings: Enode[], maxGeneration: number) =>
      this.addInstance(quantifier, bindings, maxGeneration);
    this.mam = new Mam(context, onMatch);
    this.lazyMam = new Mam(context, onMatch);
    this.finder = new ModelFinder(context);
    this.checker = new ModelChecker(context, this.finder, this);
  }

  release() {
    this.checker.release();
    this.finder.release();
    this.qiQueue.release();
  }

  getNumInstances() {
    return this.qiQueue.numInstances;
  }

  add(quantifier: number, generation: number) {
    this.quantifiers.push(quantifier);
    this.generations.set(quantifier, generation);
    if (this.context.params.isMbqi) this.finder.registerQuantifier(quantifier);
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
      .patterns.map((pattern) => manager.getArgs(pattern));
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

  isShared(node: Enode) {
    return this.isActive && (this.mam.isShared(node) || this.lazyMam.isShared(node));
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
    this.finder.pushScope();
    this.qiQueue.push();
  }

  pop(numScopes: number) {
    this.mam.popScope(numScopes);
    this.lazyMam.popScope(numScopes);
    this.finder.popScope(numScopes);
    this.qiQueue.pop(numScopes);
  }

  canPropagate() {
    return this.qiQueue.hasWork() || (this.isActive && this.mam.hasWork());
  }

  // default_qm_plugin::propagate: without relevancy, e-matching reads each new enode here.
  propagate() {
    if (this.isActive) {
      this.mam.match();
      const enodes = this.context.enodes;
      if (
        !this.context.relevancy.isEnabled &&
        this.quantifiers.length > 0 &&
        enodes.length > this.newEnodeQhead
      ) {
        const saved = this.newEnodeQhead;
        this.context.pushTrail(() => {
          this.newEnodeQhead = saved;
        });
        for (; this.newEnodeQhead < enodes.length; this.newEnodeQhead++) {
          this.mam.relevantEh(enodes[this.newEnodeQhead], false);
          this.lazyMam.relevantEh(enodes[this.newEnodeQhead], true);
        }
      }
    }
    this.qiQueue.instantiate();
  }

  addInstance(quantifier: number, bindings: Enode[], maxGeneration: number) {
    const generation = Math.max(maxGeneration, this.getGeneration(quantifier));
    const roots = this.context.fingerprints.insert(
      quantifier,
      this.context.manager.ids[quantifier],
      bindings,
    );
    if (roots !== null) this.qiQueue.insert(quantifier, roots, generation);
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
    this.checker.initSearchEh();
    this.qiQueue.initSearchEh();
  }

  restartEh() {
    if (!this.context.params.isMbqi) return;
    this.finder.restartEh();
    this.checker.restartEh();
  }

  isModelBased() {
    return this.context.params.isMbqi;
  }

  adjustModel(model: ProtoModel) {
    if (this.context.params.isMbqi) this.finder.fixModel(model);
  }

  checkModel(model: ProtoModel, root2value: Map<Enode, number>) {
    if (this.quantifiers.length === 0) return CHECK_MODEL_SAT;
    if (!this.context.params.isMbqi) return CHECK_MODEL_UNKNOWN;
    const checker = this.checker;
    if (checker.check(model, root2value)) return CHECK_MODEL_SAT;
    return checker.hasNewInstances() ? CHECK_MODEL_RESTART : CHECK_MODEL_UNKNOWN;
  }
}

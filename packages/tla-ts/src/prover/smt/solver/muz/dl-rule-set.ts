// Ported from Z3 (src/muz/base/dl_rule_set.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../../errors";
import { type AstManager, KIND_APP, KIND_QUANTIFIER } from "../ast";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";

// For each predicate, the predicates its rules depend on. Every predicate in a set is a key.
class RuleDependencies {
  readonly data = new Map<number, Set<number>>();

  constructor(private context: DatalogContext) {}

  private ensureKey(predicate: number) {
    const existing = this.data.get(predicate);
    if (existing !== undefined) return existing;
    const created = new Set<number>();
    this.data.set(predicate, created);
    return created;
  }

  populate(rules: readonly Rule[]) {
    for (const rule of rules) this.populateRule(rule);
  }

  private populateRule(rule: Rule) {
    const manager = this.context.manager;
    const dependencies = this.ensureKey(rule.getDecl(manager));
    const visited = new Set<number>();
    const todo = [...rule.tail];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      const kind = manager.kinds[expr];
      if (kind === KIND_APP) {
        const decl = manager.decls[expr];
        if (this.context.isPredicateDecl(decl)) {
          dependencies.add(decl);
          this.ensureKey(decl);
        }
        manager.pushArgs(expr, todo);
      } else if (kind === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
    }
  }

  getDeps(predicate: number) {
    return this.data.get(predicate) ?? EMPTY_SET;
  }

  reset() {
    this.data.clear();
  }
}

const EMPTY_SET: ReadonlySet<number> = new Set();

// Strongly connected components of the dependencies, topologically sorted so that later strata
// depend only on earlier ones.
class RuleStratifier {
  readonly strats: Set<number>[] = [];
  private predStrats = new Map<number, number>();
  private preorder = new Map<number, number>();
  private componentNums = new Map<number, number>();
  private components: (Set<number> | undefined)[] = [];
  private stackS: number[] = [];
  private stackP: number[] = [];
  private nextPreorder = 0;
  private firstPreorder = 0;

  constructor(private deps: RuleDependencies) {
    this.process();
  }

  getPredicateStrat(predicate: number) {
    return this.predStrats.get(predicate) ?? 0;
  }

  private traverse(element: number) {
    const number = this.preorder.get(element);
    if (number !== undefined) {
      if (number < this.firstPreorder || this.componentNums.has(element)) return;
      while (this.stackP.length > 0) {
        if ((this.preorder.get(this.stackP[this.stackP.length - 1]) ?? 0) <= number) break;
        this.stackP.pop();
      }
      return;
    }
    this.preorder.set(element, this.nextPreorder++);
    this.stackS.push(element);
    this.stackP.push(element);
    for (const child of this.deps.getDeps(element)) this.traverse(child);
    if (element !== this.stackP[this.stackP.length - 1]) return;
    const componentNum = this.components.length;
    const component = new Set<number>();
    this.components.push(component);
    for (;;) {
      const popped = this.stackS.pop() as number;
      component.add(popped);
      this.componentNums.set(popped, componentNum);
      if (popped === element) break;
    }
    this.stackP.pop();
  }

  private process() {
    const deps = this.deps.data;
    if (deps.size === 0) return;
    for (const element of deps.keys()) {
      this.firstPreorder = this.nextPreorder;
      this.traverse(element);
    }
    const inDegrees = this.components.map(() => 0);
    for (const [element, outEdges] of deps) {
      const elementComponent = this.componentNums.get(element) as number;
      for (const target of outEdges) {
        const targetComponent = this.componentNums.get(target) as number;
        if (elementComponent !== targetComponent) inDegrees[targetComponent]++;
      }
    }
    this.components.forEach((component, index) => {
      if (inDegrees[index] !== 0 || component === undefined) return;
      this.strats.push(component);
      this.components[index] = undefined;
    });
    for (let index = 0; index < this.strats.length; index++)
      for (const element of this.strats[index])
        for (const target of this.deps.getDeps(element)) {
          const targetComponent = this.componentNums.get(target) as number;
          const component = this.components[targetComponent];
          if (component === undefined) continue;
          inDegrees[targetComponent]--;
          if (inDegrees[targetComponent] !== 0) continue;
          this.strats.push(component);
          this.components[targetComponent] = undefined;
        }
    this.strats.reverse();
    this.strats.forEach((component, index) => {
      for (const element of component) this.predStrats.set(element, index);
    });
  }
}

export class RuleSet {
  rules: Rule[] = [];
  private head2rules = new Map<number, Rule[]>();
  readonly deps: RuleDependencies;
  private stratifier: RuleStratifier | undefined;
  outputPredicates = new Set<number>();
  private orig2pred = new Map<number, number>();
  private pred2orig = new Map<number, number>();

  constructor(readonly context: DatalogContext) {
    this.deps = new RuleDependencies(context);
  }

  static copy(other: RuleSet) {
    const copied = new RuleSet(other.context);
    copied.addRules(other);
    if (other.stratifier !== undefined && !copied.close())
      throw new SmtTacticError("the copy of a stratified rule set is not stratified");
    return copied;
  }

  get manager(): AstManager {
    return this.context.manager;
  }

  reset() {
    this.rules = [];
    this.head2rules.clear();
    this.deps.reset();
    this.stratifier = undefined;
    this.outputPredicates = new Set();
    this.orig2pred.clear();
    this.pred2orig.clear();
  }

  getOrig(predicate: number) {
    return this.pred2orig.get(predicate) ?? predicate;
  }

  inheritPredicates(other: RuleSet) {
    for (const predicate of other.outputPredicates) this.outputPredicates.add(predicate);
    for (const [orig, predicate] of other.orig2pred) this.orig2pred.set(orig, predicate);
    for (const [predicate, orig] of other.pred2orig) this.pred2orig.set(predicate, orig);
  }

  inheritPredicate(other: RuleSet, orig: number, predicate: number) {
    if (other.isOutputPredicate(orig)) this.setOutputPredicate(predicate);
    const original = other.getOrig(orig);
    this.orig2pred.set(original, predicate);
    this.pred2orig.set(predicate, original);
  }

  addRule(rule: Rule) {
    this.rules.push(rule);
    const decl = rule.getDecl(this.manager);
    const existing = this.head2rules.get(decl);
    if (existing === undefined) this.head2rules.set(decl, [rule]);
    else existing.push(rule);
  }

  isClosed() {
    return this.stratifier !== undefined;
  }

  ensureClosed() {
    if (!this.isClosed() && !this.close())
      throw new SmtTacticError("the rule set is not stratified");
  }

  close() {
    this.deps.populate(this.rules);
    this.stratifier = new RuleStratifier(this.deps);
    if (this.isStratifiedNegation()) return true;
    this.stratifier = undefined;
    this.deps.reset();
    return false;
  }

  reopen() {
    if (!this.isClosed()) return;
    this.stratifier = undefined;
    this.deps.reset();
  }

  private isStratifiedNegation() {
    const manager = this.manager;
    for (const rule of this.rules) {
      const headStrat = this.getPredicateStrat(rule.getDecl(manager));
      for (let index = rule.positiveSize; index < rule.uninterpretedSize; index++)
        if (this.getPredicateStrat(rule.getTailDecl(manager, index)) === headStrat) return false;
    }
    return true;
  }

  replaceRules(source: RuleSet) {
    if (source === this) return;
    this.reset();
    this.addRules(source);
  }

  addRules(source: RuleSet) {
    for (const rule of source.rules) this.addRule(rule);
    this.inheritPredicates(source);
  }

  getPredicateRules(predicate: number): readonly Rule[] {
    return this.head2rules.get(predicate) ?? [];
  }

  getHeadPredicates() {
    return this.head2rules.keys();
  }

  getStrats() {
    return this.stratifier?.strats ?? [];
  }

  getPredicateStrat(predicate: number) {
    return this.stratifier?.getPredicateStrat(predicate) ?? 0;
  }

  isOutputPredicate(predicate: number) {
    return this.outputPredicates.has(predicate);
  }

  setOutputPredicate(predicate: number) {
    this.outputPredicates.add(predicate);
  }

  getOutputPredicate() {
    return this.outputPredicates.values().next().value as number;
  }
}

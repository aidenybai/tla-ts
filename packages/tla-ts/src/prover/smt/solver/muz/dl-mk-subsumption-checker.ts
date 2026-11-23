import { KIND_VAR } from "../ast";
import { ObjHashtable } from "../hashtable";
import type { DatalogContext } from "./dl-context";
import type { Rule, RuleManager } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

const getRuleKey = (rule: Rule) =>
  `${rule.head}|${rule.tail.join(",")}|${rule.isNegated.map(Number).join("")}`;

class RuleSubsumptionIndex {
  private refHolder: Rule[] = [];
  private unconditionedHeads = new Set<number>();
  private ruleKeys = new Set<string>();

  constructor(private ruleManager: RuleManager) {}

  add(rule: Rule) {
    this.refHolder.push(this.ruleManager.assignRule(undefined, rule));
    if (rule.tail.length === 0) this.unconditionedHeads.add(rule.head);
    this.ruleKeys.add(getRuleKey(rule));
  }

  release() {
    for (const rule of this.refHolder) this.ruleManager.decRef(rule);
  }

  isSubsumedAtom(query: number) {
    return this.unconditionedHeads.has(query);
  }

  isSubsumed(rule: Rule) {
    return this.isSubsumedAtom(rule.head) || this.ruleKeys.has(getRuleKey(rule));
  }
}

export class MkSubsumptionChecker implements RuleTransformerPlugin {
  private refHolder: Rule[] = [];
  private totalRelations: ObjHashtable;
  private definingRules = new Map<number, Rule>();
  private hasNewTotalRule = false;

  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {
    this.totalRelations = new ObjHashtable((decl) => context.manager.getDeclHash(decl));
  }

  release() {
    for (const rule of this.refHolder) this.context.ruleManager.decRef(rule);
    this.refHolder = [];
  }

  private isTotalRule(rule: Rule) {
    const manager = this.context.manager;
    if (rule.tail.length !== 0) return false;
    const headVars = new Set<number>();
    for (const arg of manager.getArgs(rule.head)) {
      if (manager.kinds[arg] !== KIND_VAR) return false;
      if (headVars.has(manager.values[arg])) return false;
      headVars.add(manager.values[arg]);
    }
    return true;
  }

  private onDiscoveredTotalRelation(predicate: number, rule: Rule) {
    this.totalRelations.add(predicate);
    this.definingRules.set(predicate, rule);
    this.hasNewTotalRule = true;
    this.refHolder.push(this.context.ruleManager.assignRule(undefined, rule));
  }

  private scanForTotalRules(rules: RuleSet) {
    const manager = this.context.manager;
    let isDiscovered = true;
    while (isDiscovered) {
      isDiscovered = false;
      for (const rule of rules.rules) {
        const head = rule.getDecl(manager);
        if (!this.isTotalRule(rule) || this.totalRelations.has(head)) continue;
        this.onDiscoveredTotalRelation(head, rule);
        isDiscovered = true;
      }
    }
  }

  // Undefined drops the rule, and a rule comes with a reference.
  private transformRule(rule: Rule, index: RuleSubsumptionIndex): Rule | undefined {
    const manager = this.context.manager;
    const ruleManager = this.context.ruleManager;
    if (rule.uninterpretedSize === 0) return ruleManager.assignRule(undefined, rule);
    const tail: number[] = [];
    const isNegated: boolean[] = [];
    for (let position = 0; position < rule.uninterpretedSize; position++) {
      const atom = rule.tail[position];
      const isNeg = rule.isNegated[position];
      if (this.totalRelations.has(manager.decls[atom]) || index.isSubsumedAtom(atom)) {
        if (isNeg) return undefined;
        continue;
      }
      if (!isNeg && rule.head === atom) return undefined;
      tail.push(atom);
      isNegated.push(isNeg);
    }
    if (tail.length === rule.uninterpretedSize) return ruleManager.assignRule(undefined, rule);
    for (let position = rule.uninterpretedSize; position < rule.tail.length; position++) {
      tail.push(rule.tail[position]);
      isNegated.push(rule.isNegated[position]);
    }
    const result = ruleManager.assignRule(
      undefined,
      ruleManager.mk(rule.head, tail, isNegated, rule.name),
    );
    ruleManager.setAccountingParent(result, rule);
    return ruleManager.fixUnboundVars(result, true);
  }

  private transformRules(source: RuleSet, target: RuleSet) {
    const manager = this.context.manager;
    const ruleManager = this.context.ruleManager;
    let isModified = false;
    const includedTotalRelations = new Set<number>();
    const index = new RuleSubsumptionIndex(ruleManager);
    const rules = source.rules
      .map((rule, position) => ({ rule: ruleManager.assignRule(undefined, rule), position }))
      .sort(
        (first, second) =>
          first.rule.tail.length - second.rule.tail.length || first.position - second.position,
      )
      .map((entry) => entry.rule);
    for (const rule of rules) {
      const head = rule.getDecl(manager);
      if (this.totalRelations.has(head)) {
        if (!source.isOutputPredicate(head) || includedTotalRelations.has(head)) {
          isModified = true;
          continue;
        }
        const definingRule = this.definingRules.get(head) as Rule;
        const totalityRule = this.transformRule(definingRule, index) as Rule;
        if (totalityRule !== definingRule) isModified = true;
        target.addRule(totalityRule);
        ruleManager.decRef(totalityRule);
        includedTotalRelations.add(head);
        continue;
      }
      const transformed = this.transformRule(rule, index);
      if (transformed === undefined) {
        isModified = true;
        continue;
      }
      if (this.isTotalRule(transformed)) this.onDiscoveredTotalRelation(head, transformed);
      if (index.isSubsumed(transformed)) {
        isModified = true;
        ruleManager.decRef(transformed);
        continue;
      }
      if (transformed !== rule) isModified = true;
      target.addRule(transformed);
      index.add(transformed);
      ruleManager.decRef(transformed);
    }
    target.inheritPredicates(source);
    if (this.totalRelations.size > 0)
      this.context.addGenericModelConverter(
        [...this.totalRelations].map((decl) => ({ decl, def: manager.trueExpr })),
      );
    for (const rule of rules) ruleManager.decRef(rule);
    index.release();
    return isModified;
  }

  apply(source: RuleSet) {
    if (!this.context.params.getBool("xform.subsumption_checker", true)) return undefined;
    this.hasNewTotalRule = false;
    this.scanForTotalRules(source);
    this.hasNewTotalRule = false;
    let result = new RuleSet(this.context);
    const isModified = this.transformRules(source, result);
    if (!this.hasNewTotalRule && !isModified) {
      result.reset();
      return undefined;
    }
    while (this.hasNewTotalRule) {
      this.hasNewTotalRule = false;
      const previous = result;
      result = new RuleSet(this.context);
      this.transformRules(previous, result);
      previous.reset();
    }
    return result;
  }
}

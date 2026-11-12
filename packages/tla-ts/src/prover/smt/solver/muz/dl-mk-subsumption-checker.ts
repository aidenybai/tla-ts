// Ported from Z3 (src/muz/transforms/dl_mk_subsumption_checker.cpp,
// src/muz/base/dl_rule_subsumption_index.cpp), MIT license, see z3-license.txt.
import { KIND_VAR } from "../ast";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

const getRuleKey = (rule: Rule) =>
  `${rule.head}|${rule.tail.join(",")}|${rule.isNegated.map(Number).join("")}`;

class RuleSubsumptionIndex {
  private unconditionedHeads = new Set<number>();
  private ruleKeys = new Set<string>();

  add(rule: Rule) {
    if (rule.tail.length === 0) this.unconditionedHeads.add(rule.head);
    this.ruleKeys.add(getRuleKey(rule));
  }

  isSubsumedAtom(query: number) {
    return this.unconditionedHeads.has(query);
  }

  isSubsumed(rule: Rule) {
    return this.isSubsumedAtom(rule.head) || this.ruleKeys.has(getRuleKey(rule));
  }
}

export class MkSubsumptionChecker implements RuleTransformerPlugin {
  private totalRelations = new Set<number>();
  private definingRules = new Map<number, Rule>();
  private hasNewTotalRule = false;

  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {}

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

  // Undefined drops the rule.
  private transformRule(rule: Rule, index: RuleSubsumptionIndex): Rule | undefined {
    const manager = this.context.manager;
    if (rule.uninterpretedSize === 0) return rule;
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
    if (tail.length === rule.uninterpretedSize) return rule;
    for (let position = rule.uninterpretedSize; position < rule.tail.length; position++) {
      tail.push(rule.tail[position]);
      isNegated.push(rule.isNegated[position]);
    }
    const ruleManager = this.context.ruleManager;
    return ruleManager.fixUnboundVars(ruleManager.mk(rule.head, tail, isNegated, rule.name), true);
  }

  private transformRules(source: RuleSet, target: RuleSet) {
    const manager = this.context.manager;
    let isModified = false;
    const includedTotalRelations = new Set<number>();
    const index = new RuleSubsumptionIndex();
    const rules = source.rules
      .map((rule, position) => ({ rule, position }))
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
        continue;
      }
      if (transformed !== rule) isModified = true;
      target.addRule(transformed);
      index.add(transformed);
    }
    target.inheritPredicates(source);
    return isModified;
  }

  apply(source: RuleSet) {
    if (!this.context.params.getBool("xform.subsumption_checker", true)) return undefined;
    this.hasNewTotalRule = false;
    this.scanForTotalRules(source);
    this.hasNewTotalRule = false;
    let result = new RuleSet(this.context);
    const isModified = this.transformRules(source, result);
    if (!this.hasNewTotalRule && !isModified) return undefined;
    while (this.hasNewTotalRule) {
      this.hasNewTotalRule = false;
      const previous = result;
      result = new RuleSet(this.context);
      this.transformRules(previous, result);
    }
    return result;
  }
}

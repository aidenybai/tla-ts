// Ported from Z3 (src/muz/transforms/dl_mk_coi_filter.cpp, src/muz/dataflow/dataflow.h,
// src/muz/dataflow/reachability.h), MIT license, see z3-license.txt.
import type { DatalogContext } from "./dl-context";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

export class MkCoiFilter implements RuleTransformerPlugin {
  constructor(
    private context: DatalogContext,
    readonly priority = 45000,
  ) {}

  apply(source: RuleSet) {
    const topDown = this.topDown(source);
    return this.bottomUp(topDown ?? source) ?? topDown;
  }

  // The predicates whose rules can derive a fact: a rule fires once its positive predicates can.
  private getBottomUpReachable(source: RuleSet) {
    const manager = this.context.manager;
    const reachable = new Set<number>();
    let isChanged = true;
    while (isChanged) {
      isChanged = false;
      for (const rule of source.rules) {
        const head = rule.getDecl(manager);
        if (reachable.has(head)) continue;
        let isFiring = true;
        for (let index = 0; isFiring && index < rule.positiveSize; index++)
          isFiring = reachable.has(rule.getTailDecl(manager, index));
        if (!isFiring) continue;
        reachable.add(head);
        isChanged = true;
      }
    }
    return reachable;
  }

  private bottomUp(source: RuleSet) {
    const manager = this.context.manager;
    const reachable = this.getBottomUpReachable(source);
    const result = new RuleSet(this.context);
    result.inheritPredicates(source);
    for (const rule of source.rules) {
      let isContained = true;
      let newTail: number[] | undefined;
      let newNegated: boolean[] = [];
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const isReachable = reachable.has(rule.getTailDecl(manager, index));
        if (rule.isNegated[index]) {
          if (!isReachable && newTail === undefined) {
            newTail = rule.tail.slice(0, index);
            newNegated = rule.isNegated.slice(0, index);
          } else if (isReachable && newTail !== undefined) {
            newTail.push(rule.tail[index]);
            newNegated.push(true);
          }
        } else if (!isReachable) {
          isContained = false;
          break;
        }
      }
      if (!isContained) continue;
      if (newTail === undefined) {
        result.addRule(rule);
        continue;
      }
      for (let index = rule.uninterpretedSize; index < rule.tail.length; index++) {
        newTail.push(rule.tail[index]);
        newNegated.push(false);
      }
      result.addRule(this.context.ruleManager.mk(rule.head, newTail, newNegated, "", false));
    }
    if (result.rules.length === source.rules.length) return undefined;
    result.close();
    return result;
  }

  // The predicates that the output predicates depend on.
  private getTopDownReachable(source: RuleSet) {
    const manager = this.context.manager;
    const reachable = new Set<number>();
    const todo: number[] = [];
    for (const predicate of source.outputPredicates)
      if (source.getPredicateRules(predicate).length > 0 && !reachable.has(predicate)) {
        reachable.add(predicate);
        todo.push(predicate);
      }
    for (let predicate = todo.pop(); predicate !== undefined; predicate = todo.pop())
      for (const rule of source.getPredicateRules(predicate))
        for (let index = 0; index < rule.uninterpretedSize; index++) {
          const tail = rule.getTailDecl(manager, index);
          if (reachable.has(tail)) continue;
          reachable.add(tail);
          todo.push(tail);
        }
    return reachable;
  }

  private topDown(source: RuleSet) {
    const manager = this.context.manager;
    const reachable = this.getTopDownReachable(source);
    const result = new RuleSet(this.context);
    result.inheritPredicates(source);
    const seen = new Set<number>();
    for (const rule of source.rules) {
      const predicate = rule.getDecl(manager);
      if (seen.has(predicate)) continue;
      seen.add(predicate);
      if (reachable.has(predicate)) {
        for (const kept of source.getPredicateRules(predicate)) result.addRule(kept);
        continue;
      }
      if (!this.context.hasModelConverter) continue;
      for (const pruned of source.getPredicateRules(predicate))
        for (let index = 0; index < pruned.uninterpretedSize; index++)
          if (pruned.getTailDecl(manager, index) !== predicate) return undefined;
    }
    return result.rules.length === source.rules.length ? undefined : result;
  }
}

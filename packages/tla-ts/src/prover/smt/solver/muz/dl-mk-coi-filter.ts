import { ObjHashtable, ObjMap } from "../hashtable";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { HornSubsumeModelConverter } from "./horn-subsume-model-converter";
import { RuleSet } from "./dl-rule-set";
import type { RuleTransformerPlugin } from "./dl-rule-transformer";

export class MkCoiFilter implements RuleTransformerPlugin {
  constructor(
    private context: DatalogContext,
    readonly priority = 45000,
  ) {}

  apply(source: RuleSet) {
    const topDown = this.topDown(source);
    const bottomUp = this.bottomUp(topDown ?? source);
    if (bottomUp === undefined) return topDown;
    topDown?.reset();
    return bottomUp;
  }

  // dataflow_engine<reachability_info>::run_bottom_up: whether the rules of a predicate can
  // derive a fact, for the predicates the engine reached.
  private runBottomUp(source: RuleSet) {
    const manager = this.context.manager;
    const getHash = (decl: number) => manager.getDeclHash(decl);
    const facts = new ObjMap<boolean>(getHash);
    const body2rules = new Map<number, Rule[]>();
    const todos = [new ObjHashtable(getHash), new ObjHashtable(getHash)];
    let todoIndex = 0;
    for (const rule of source.rules) {
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const decl = rule.getTailDecl(manager, index);
        const users = body2rules.get(decl);
        if (users === undefined) body2rules.set(decl, [rule]);
        else users.push(rule);
      }
      const head = rule.getDecl(manager);
      if (rule.positiveSize !== 0 || facts.get(head) === true) continue;
      facts.set(head, true);
      todos[todoIndex].add(head);
    }
    while (todos[todoIndex].size > 0) {
      for (const decl of todos[todoIndex])
        for (const rule of body2rules.get(decl) ?? []) {
          const head = rule.getDecl(manager);
          if (!facts.has(head)) facts.set(head, false);
          if (facts.get(head) === true) continue;
          let isFiring = true;
          for (let index = 0; isFiring && index < rule.positiveSize; index++)
            isFiring = facts.get(rule.getTailDecl(manager, index)) === true;
          if (!isFiring) continue;
          facts.set(head, true);
          todos[1 - todoIndex].add(head);
        }
      todos[todoIndex] = new ObjHashtable(getHash);
      todoIndex = 1 - todoIndex;
    }
    return facts;
  }

  private bottomUp(source: RuleSet) {
    const manager = this.context.manager;
    const facts = this.runBottomUp(source);
    const unreachable = new ObjHashtable((decl) => manager.getDeclHash(decl));
    const result = new RuleSet(this.context);
    result.inheritPredicates(source);
    for (const rule of source.rules) {
      let isContained = true;
      let newTail: number[] | undefined;
      let newNegated: boolean[] = [];
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const isReachable = facts.get(rule.getTailDecl(manager, index)) === true;
        if (!isReachable) unreachable.add(rule.getTailDecl(manager, index));
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
      result.addRule(this.context.ruleManager.mk(rule.head, newTail, newNegated, undefined, false));
    }
    if (result.rules.length === source.rules.length) {
      result.reset();
      return undefined;
    }
    result.close();
    if (this.context.modelConverters !== undefined) {
      for (const [decl, isReachable] of facts) if (!isReachable) unreachable.add(decl);
      this.context.addGenericModelConverter(
        [...unreachable].map((decl) => ({ decl, def: manager.falseExpr })),
      );
    }
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
    const prunedPreds = new ObjHashtable((decl) => manager.getDeclHash(decl));
    for (const rule of source.rules) {
      const predicate = rule.getDecl(manager);
      if (seen.has(predicate)) continue;
      seen.add(predicate);
      if (reachable.has(predicate)) {
        for (const kept of source.getPredicateRules(predicate)) result.addRule(kept);
        continue;
      }
      if (this.context.modelConverters === undefined) continue;
      for (const pruned of source.getPredicateRules(predicate))
        for (let index = 0; index < pruned.uninterpretedSize; index++)
          if (pruned.getTailDecl(manager, index) !== predicate) {
            result.reset();
            return undefined;
          }
      prunedPreds.add(predicate);
    }
    if (result.rules.length === source.rules.length) {
      result.reset();
      return undefined;
    }
    if (this.context.modelConverters !== undefined && prunedPreds.size > 0) {
      const horn = new HornSubsumeModelConverter(this.context);
      this.context.addGenericModelConverter(
        [...prunedPreds].map((decl) => ({
          decl,
          def: manager.mkOr(
            source
              .getPredicateRules(decl)
              .map((rule) =>
                horn.mkHorn(rule.head, manager.mkAnd(rule.tail.slice(rule.uninterpretedSize))),
              ),
          ),
        })),
      );
    }
    return result;
  }
}

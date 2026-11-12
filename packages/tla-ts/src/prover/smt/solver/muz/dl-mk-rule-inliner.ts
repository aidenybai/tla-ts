// Ported from Z3 (src/muz/transforms/dl_mk_rule_inliner.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../../errors";
import type { DatalogContext } from "./dl-context";
import { MkInterpTailSimplifier } from "./dl-mk-interp-tail-simplifier";
import { getRuleVars, type Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { removeDuplicateTails, type RuleTransformerPlugin } from "./dl-rule-transformer";
import { Substitution } from "./substitution";

class RuleUnifier {
  private subst: Substitution;
  private deltas = [0, 0];
  private simplifier: MkInterpTailSimplifier;

  constructor(private context: DatalogContext) {
    this.subst = new Substitution(context.manager);
    this.simplifier = new MkInterpTailSimplifier(context);
  }

  unifyRules(target: Rule, tailIndex: number, source: Rule) {
    const manager = this.context.manager;
    const varCount = Math.max(
      getRuleVars(manager, target).length,
      getRuleVars(manager, source).length,
      1,
    );
    this.subst.reset();
    const isReady = this.subst.unify(target.tail[tailIndex], 0, source.head, 1);
    if (isReady) this.deltas = [0, varCount];
    return isReady;
  }

  // Undefined when the interpreted tail of the resolvent simplifies to false.
  apply(target: Rule, tailIndex: number, source: Rule): Rule | undefined {
    const tail: number[] = [];
    const isNegated: boolean[] = [];
    target.tail.forEach((literal, index) => {
      if (index === tailIndex) return;
      tail.push(this.subst.apply(literal, 0, this.deltas));
      isNegated.push(target.isNegated[index]);
    });
    source.tail.forEach((literal, index) => {
      tail.push(this.subst.apply(literal, 1, this.deltas));
      isNegated.push(source.isNegated[index]);
    });
    removeDuplicateTails(tail, isNegated);
    const ruleManager = this.context.ruleManager;
    const resolvent = ruleManager.fixUnboundVars(
      ruleManager.mk(
        this.subst.apply(target.head, 0, this.deltas),
        tail,
        isNegated,
        `${target.name};${source.name}`,
      ),
      true,
    );
    return this.simplifier.transformRule(resolvent);
  }
}

const hasQuantifier = (context: DatalogContext, rule: Rule) =>
  context.ruleManager.hasQuantifiers(rule);

// The rules at a position of a head or tail, and which of them can still be expanded or removed.
class Visitor {
  readonly positions = new Map<number, number[]>();
  canRemove: boolean[] = [];
  canExpand: boolean[] = [];

  reset(size: number) {
    this.canRemove = Array.from({ length: size }, () => true);
    this.canExpand = Array.from({ length: size }, () => true);
    this.positions.clear();
  }

  addPosition(expr: number, position: number) {
    const positions = this.positions.get(expr) ?? [];
    positions.push(position);
    this.positions.set(expr, positions);
  }

  delPosition(expr: number, position: number) {
    const positions = this.positions.get(expr) as number[];
    const index = positions.indexOf(position);
    if (index !== -1) positions.splice(index, 1);
  }
}

export class MkRuleInliner implements RuleTransformerPlugin {
  private unifier: RuleUnifier;
  private headPredCounts = new Map<number, number>();
  private headPredNonEmptyTailCounts = new Map<number, number>();
  private tailPredCounts = new Map<number, number>();
  private predsWithNegOccurrence = new Set<number>();
  private forbiddenPreds = new Set<number>();
  private inlinedRules: RuleSet;
  private headVisitor = new Visitor();
  private tailVisitor = new Visitor();
  // Z3 throws has_new_quantifier when it would inline a rule that has a quantifier.
  private hasNewQuantifier = false;

  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {
    this.unifier = new RuleUnifier(context);
    this.inlinedRules = new RuleSet(context);
  }

  private tryToInlineRule(target: Rule, source: Rule, tailIndex: number): Rule | undefined {
    this.context.ruleManager.normVars(target);
    if (hasQuantifier(this.context, source)) {
      this.hasNewQuantifier = true;
      return undefined;
    }
    if (!this.unifier.unifyRules(target, tailIndex, source)) return undefined;
    return this.unifier.apply(target, tailIndex, source);
  }

  private countPredOccurrences(source: RuleSet) {
    const manager = this.context.manager;
    const increment = (counts: Map<number, number>, predicate: number) =>
      counts.set(predicate, (counts.get(predicate) ?? 0) + 1);
    for (const rule of source.rules) {
      const head = rule.getDecl(manager);
      increment(this.headPredCounts, head);
      if (rule.tail.length > 0) increment(this.headPredNonEmptyTailCounts, head);
      for (let index = 0; index < rule.uninterpretedSize; index++) {
        const predicate = rule.getTailDecl(manager, index);
        increment(this.tailPredCounts, predicate);
        if (rule.isNegated[index]) this.predsWithNegOccurrence.add(predicate);
      }
    }
  }

  private isInliningAllowed(source: RuleSet, predicate: number) {
    if (
      source.isOutputPredicate(predicate) ||
      this.predsWithNegOccurrence.has(predicate) ||
      this.forbiddenPreds.has(predicate)
    )
      return false;
    const headCount = this.headPredCounts.get(predicate) ?? 0;
    return headCount <= 1 || ((this.tailPredCounts.get(predicate) ?? 0) <= 1 && headCount <= 4);
  }

  private createAllowedRuleSet(source: RuleSet) {
    const manager = this.context.manager;
    const result = new RuleSet(this.context);
    for (const rule of source.rules)
      if (this.isInliningAllowed(source, rule.getDecl(manager))) result.addRule(rule);
    result.close();
    return result;
  }

  private forbidPredsFromCycles(rules: RuleSet) {
    let isForbidden = false;
    for (const stratum of rules.getStrats()) {
      if (stratum.size === 1) continue;
      this.forbiddenPreds.add(stratum.values().next().value as number);
      isForbidden = true;
    }
    return isForbidden;
  }

  private forbidMultipleMultipliers(source: RuleSet, proposed: RuleSet) {
    const manager = this.context.manager;
    let isForbidden = false;
    for (const stratum of proposed.getStrats()) {
      const head = stratum.values().next().value as number;
      let isMultiHead = (this.headPredCounts.get(head) ?? 0) > 1;
      const isMultiOccurrence = (this.tailPredCounts.get(head) ?? 0) > 1;
      nextPredicate: for (const rule of proposed.getPredicateRules(head))
        for (let index = 0; index < rule.positiveSize; index++) {
          const tailPredicate = rule.getTailDecl(manager, index);
          if (!this.isInliningAllowed(source, tailPredicate)) continue;
          const tailHeadCount = this.headPredCounts.get(tailPredicate) ?? 0;
          if (tailHeadCount <= 1) continue;
          if (isMultiHead) {
            this.forbiddenPreds.add(head);
            isForbidden = true;
            break nextPredicate;
          }
          if (isMultiOccurrence) {
            this.forbiddenPreds.add(tailPredicate);
            isForbidden = true;
          } else {
            isMultiHead = true;
            this.headPredCounts.set(head, (this.headPredCounts.get(head) ?? 0) * tailHeadCount);
          }
        }
    }
    for (const rule of source.rules) {
      if (this.isInliningAllowed(source, rule.getDecl(manager))) continue;
      let hasMultiHead = false;
      for (let index = 0; index < rule.positiveSize; index++) {
        const predicate = rule.getTailDecl(manager, index);
        if (!this.isInliningAllowed(source, predicate)) continue;
        if ((this.headPredCounts.get(predicate) ?? 0) <= 1) continue;
        if (hasMultiHead) {
          this.forbiddenPreds.add(predicate);
          isForbidden = true;
        } else hasMultiHead = true;
      }
    }
    return isForbidden;
  }

  private planInlining(source: RuleSet) {
    this.countPredOccurrences(source);
    let candidates = this.createAllowedRuleSet(source);
    while (this.forbidPredsFromCycles(candidates)) candidates = this.createAllowedRuleSet(source);
    if (this.forbidMultipleMultipliers(source, candidates))
      candidates = this.createAllowedRuleSet(source);
    for (const stratum of candidates.getStrats())
      for (const rule of candidates.getPredicateRules(stratum.values().next().value as number))
        this.transformRule(source, rule, this.inlinedRules);
  }

  private transformRule(source: RuleSet, original: Rule, target: RuleSet) {
    const manager = this.context.manager;
    let isModified = false;
    const todo = [original];
    for (let rule = todo.pop(); rule !== undefined; rule = todo.pop()) {
      let index = 0;
      while (
        index < rule.positiveSize &&
        !this.isInliningAllowed(source, rule.getTailDecl(manager, index))
      )
        index++;
      if (index === rule.positiveSize) {
        target.addRule(rule);
        continue;
      }
      isModified = true;
      for (const inlined of this.inlinedRules.getPredicateRules(rule.getTailDecl(manager, index))) {
        const result = this.tryToInlineRule(rule, inlined, index);
        if (this.hasNewQuantifier) return isModified;
        if (result !== undefined) todo.push(result);
      }
    }
    return isModified;
  }

  private transformRules(source: RuleSet, target: RuleSet) {
    const manager = this.context.manager;
    let isDone = false;
    for (const rule of source.rules) {
      if (
        !this.isInliningAllowed(source, rule.getDecl(manager)) &&
        this.transformRule(source, rule, target)
      )
        isDone = true;
      if (this.hasNewQuantifier) break;
    }
    return isDone;
  }

  private isOrientedRewriter(rule: Rule, rules: RuleSet) {
    const manager = this.context.manager;
    const head = rule.getDecl(manager);
    const headStrat = rules.getPredicateStrat(head);
    const headArity = manager.funcDecls[head].domain.length;
    for (let index = 0; index < rule.positiveSize; index++) {
      const predicate = rule.getTailDecl(manager, index);
      if (rules.getPredicateStrat(predicate) !== headStrat) continue;
      const arity = manager.funcDecls[predicate].domain.length;
      if (
        arity > headArity ||
        (arity === headArity &&
          manager.funcDecls[predicate].smallId >= manager.funcDecls[head].smallId)
      )
        return false;
    }
    return true;
  }

  // Returns undefined when nothing applies, or the replacement, where null deletes the rule.
  private doEagerInliningRule(rule: Rule, rules: RuleSet): Rule | null | undefined {
    const manager = this.context.manager;
    if (rule.hasNegation()) return undefined;
    const head = rule.getDecl(manager);
    for (let index = 0; index < rule.positiveSize; index++) {
      const predicate = rule.getTailDecl(manager, index);
      if (predicate === head) continue;
      const predicateRules = rules.getPredicateRules(predicate);
      let candidate: Rule | undefined;
      let isAmbiguous = false;
      if (predicateRules.length === 1) candidate = predicateRules[0];
      else if (predicateRules.length > 1)
        for (const predicateRule of predicateRules) {
          if (!this.unifier.unifyRules(rule, index, predicateRule)) continue;
          if (candidate !== undefined) {
            isAmbiguous = true;
            break;
          }
          candidate = predicateRule;
        }
      if (isAmbiguous) continue;
      if (candidate === undefined) return null;
      if (!this.isOrientedRewriter(candidate, rules)) continue;
      return this.tryToInlineRule(rule, candidate, index) ?? null;
    }
    return undefined;
  }

  private doEagerInlining(rules: RuleSet) {
    const result = new RuleSet(this.context);
    let isDone = false;
    for (const original of rules.rules) {
      let rule: Rule | null = original;
      for (;;) {
        const replacement: Rule | null | undefined = this.doEagerInliningRule(rule, rules);
        if (replacement === undefined) break;
        isDone = true;
        rule = replacement;
        if (rule === null) break;
      }
      if (rule !== null) result.addRule(rule);
    }
    return isDone ? result : undefined;
  }

  private addRule(source: RuleSet, rule: Rule, position: number) {
    const manager = this.context.manager;
    this.headVisitor.addPosition(rule.head, position);
    if (source.isOutputPredicate(rule.getDecl(manager)))
      this.headVisitor.canRemove[position] = false;
    for (let index = 0; index < rule.uninterpretedSize; index++)
      this.tailVisitor.addPosition(rule.tail[index], position);
    this.headVisitor.canExpand[position] =
      rule.uninterpretedSize === 1 &&
      rule.positiveSize === 1 &&
      !source.isOutputPredicate(rule.getTailDecl(manager, 0));
  }

  private delRule(rule: Rule, position: number) {
    this.headVisitor.delPosition(rule.head, position);
    for (let index = 0; index < rule.uninterpretedSize; index++)
      this.tailVisitor.delPosition(rule.tail[index], position);
  }

  // substitution_tree::unify with a visitor that stops after the second unifier.
  private getUnifiers(visitor: Visitor, expr: number) {
    const unifiers: number[] = [];
    const subst = new Substitution(this.context.manager);
    for (const [indexed, positions] of visitor.positions) {
      subst.reset();
      if (!subst.unify(expr, 0, indexed, 1)) continue;
      unifiers.push(...positions);
      if (unifiers.length > 1) break;
    }
    return unifiers;
  }

  private inlineLinear(rules: RuleSet) {
    let isDone = false;
    const size = rules.rules.length;
    this.headVisitor.reset(size);
    this.tailVisitor.reset(size);
    const accumulated = [...rules.rules];
    for (let index = 0; index < size; index++) this.addRule(rules, accumulated[index], index);
    const isValid = Array.from({ length: size }, () => true);
    const isBranching = this.context.params.getBool("xform.inline_linear_branch", false);
    const canRemove = this.headVisitor.canRemove;
    const canExpand = this.headVisitor.canExpand;
    for (let index = 0; index < size; index++)
      for (;;) {
        const rule = accumulated[index];
        if (!isValid[index] || !canExpand[index]) break;
        const headUnifiers = this.getUnifiers(this.headVisitor, rule.tail[0]);
        if (headUnifiers.length !== 1) break;
        const other = headUnifiers[0];
        if (!canRemove[other] || !isValid[other] || index === other) break;
        const otherRule = accumulated[other];
        const tailUnifiers = this.getUnifiers(this.tailVisitor, otherRule.head);
        if (!isBranching && tailUnifiers.length !== 1) break;
        const result = this.tryToInlineRule(rule, otherRule, 0);
        if (result === undefined) break;
        isDone = true;
        this.delRule(rule, index);
        this.addRule(rules, result, index);
        accumulated[index] = result;
        canExpand[index] = canExpand[other];
        if (tailUnifiers.length === 1) {
          isValid[other] = false;
          this.delRule(otherRule, other);
        }
      }
    if (!isDone) return undefined;
    const result = new RuleSet(this.context);
    for (let index = 0; index < size; index++)
      if (isValid[index]) result.addRule(accumulated[index]);
    result.inheritPredicates(rules);
    return result;
  }

  apply(source: RuleSet) {
    if (source.rules.length === 0) return undefined;
    if (source.rules.some((rule) => hasQuantifier(this.context, rule))) return undefined;
    this.hasNewQuantifier = false;
    let isDone = false;
    let result = new RuleSet(this.context);
    if (this.context.params.getBool("xform.inline_eager", true)) {
      this.planInlining(source);
      isDone = this.transformRules(source, result);
      if (this.hasNewQuantifier) return undefined;
      result.close();
      const eager = this.doEagerInlining(result);
      if (eager !== undefined) {
        result = eager;
        isDone = true;
      }
    }
    if (isDone) result.inheritPredicates(source);
    else result = RuleSet.copy(source);
    if (this.context.params.getBool("xform.inline_linear", true)) {
      const linear = this.inlineLinear(result);
      if (linear !== undefined) {
        result = linear;
        isDone = true;
      }
    }
    if (this.hasNewQuantifier) throw new SmtUnsupportedError("inlining a rule with a quantifier");
    return isDone ? result : undefined;
  }
}

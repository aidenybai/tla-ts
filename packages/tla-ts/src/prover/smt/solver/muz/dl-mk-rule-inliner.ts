import { SmtUnsupportedError } from "../../../../errors";
import { assign, release } from "../expr-ref";
import { L_FALSE, L_UNDEF } from "../lbool";
import { RefVector } from "../ref-vector";
import type { DatalogContext } from "./dl-context";
import { MkInterpTailSimplifier } from "./dl-mk-interp-tail-simplifier";
import { getRuleVars, type Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { removeDuplicateTails, type RuleTransformerPlugin } from "./dl-rule-transformer";
import { HornSubsumeModelConverter } from "./horn-subsume-model-converter";
import { Substitution } from "./substitution";
import { type StVisitor, SubstitutionTree } from "./substitution-tree";

interface Resolvent {
  rule: Rule;
  isSatisfiable: boolean;
}

export class RuleUnifier {
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

  // The resolvent comes with a reference.
  apply(target: Rule, tailIndex: number, source: Rule): Resolvent {
    const manager = this.context.manager;
    const head = assign(manager, -1, this.subst.apply(target.head, 0, this.deltas));
    const tail = new RefVector(manager);
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
    const combined = ruleManager.assignRule(
      undefined,
      ruleManager.mk(
        head,
        tail.items,
        isNegated,
        `${target.getNameText()};${source.getNameText()}`,
      ),
    );
    ruleManager.setAccountingParent(combined, target);
    let resolvent = ruleManager.fixUnboundVars(combined, true);
    const simplified = this.simplifier.transformRule(resolvent);
    if (simplified.isKept) resolvent = ruleManager.assignRule(resolvent, simplified.rule);
    if (simplified.rule !== undefined) ruleManager.decRef(simplified.rule);
    tail.reset();
    release(manager, head);
    return { rule: resolvent, isSatisfiable: simplified.isKept };
  }

  // The substitution comes with a reference to each term.
  getRuleSubst(rule: Rule, isTarget: boolean) {
    const manager = this.context.manager;
    const result = new RefVector(manager);
    let variable = -1;
    let applied = -1;
    for (const [index, sort] of rule.getVars(manager).entries()) {
      variable = assign(manager, variable, manager.mkVar(index, sort));
      applied = assign(manager, applied, this.subst.apply(variable, isTarget ? 0 : 1, this.deltas));
      result.push(applied);
    }
    release(manager, applied);
    release(manager, variable);
    return result;
  }

  release() {
    this.subst.reset();
    this.simplifier.release();
  }
}

// The rules at a position of a head or tail, and which of them can still be expanded or removed.
class Visitor implements StVisitor {
  unifiers: number[] = [];
  readonly positions = new Map<number, number[]>();
  canRemove: boolean[] = [];
  canExpand: boolean[] = [];

  constructor(readonly subst: Substitution) {}

  visit(expr: number) {
    this.unifiers.push(...(this.positions.get(expr) as number[]));
    return true;
  }

  reset(size: number) {
    this.unifiers = [];
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
  private pinned: Rule[] = [];
  private unifier: RuleUnifier;
  private headPredCounts = new Map<number, number>();
  private headPredNonEmptyTailCounts = new Map<number, number>();
  private tailPredCounts = new Map<number, number>();
  private predsWithNegOccurrence = new Set<number>();
  private forbiddenPreds = new Set<number>();
  private inlinedRules: RuleSet;
  private headIndex: SubstitutionTree;
  private tailIndex: SubstitutionTree;
  private subst: Substitution;
  private headVisitor: Visitor;
  private tailVisitor: Visitor;
  // Z3 throws has_new_quantifier when it would inline a rule that has a quantifier.
  private hasNewQuantifier = false;
  private modelConverter: HornSubsumeModelConverter | undefined;

  constructor(
    private context: DatalogContext,
    readonly priority: number,
  ) {
    this.unifier = new RuleUnifier(context);
    this.inlinedRules = new RuleSet(context);
    this.headIndex = new SubstitutionTree(context.manager);
    this.tailIndex = new SubstitutionTree(context.manager);
    this.subst = new Substitution(context.manager);
    this.headVisitor = new Visitor(this.subst);
    this.tailVisitor = new Visitor(this.subst);
  }

  release() {
    this.subst.reset();
    this.tailIndex.reset();
    this.headIndex.reset();
    this.unifier.release();
    this.inlinedRules.reset();
    const ruleManager = this.context.ruleManager;
    for (const rule of this.pinned) ruleManager.decRef(rule);
    this.pinned = [];
  }

  // The resolvent comes with a reference.
  private tryToInlineRule(target: Rule, source: Rule, tailIndex: number) {
    this.context.ruleManager.normVars(target);
    if (this.context.ruleManager.hasQuantifiers(source)) {
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
    while (this.forbidPredsFromCycles(candidates)) {
      const allowed = this.createAllowedRuleSet(source);
      candidates.reset();
      candidates = allowed;
    }
    if (this.forbidMultipleMultipliers(source, candidates)) {
      const allowed = this.createAllowedRuleSet(source);
      candidates.reset();
      candidates = allowed;
    }
    for (const stratum of candidates.getStrats())
      for (const rule of candidates.getPredicateRules(stratum.values().next().value as number)) {
        this.transformRule(source, rule, this.inlinedRules);
        // Z3 does not catch the has_new_quantifier that plan_inlining throws, and aborts.
        if (this.hasNewQuantifier)
          throw new SmtUnsupportedError("inlining a rule with a quantifier");
      }
    for (const rule of this.inlinedRules.rules) this.modelConverter?.delRule(rule, L_UNDEF);
    candidates.reset();
  }

  // Deviation from Z3: transform_rule keeps a rule that has a quantifier without inlining the rest
  // of its tail, although the rules of those predicates are dropped, so Z3 answers unreachable for
  // a reachable query (dl_mk_rule_inliner.cpp). The rest of the tail is inlined here.
  private transformRule(source: RuleSet, original: Rule, target: RuleSet) {
    const manager = this.context.manager;
    const ruleManager = this.context.ruleManager;
    let isModified = false;
    const todo = [ruleManager.assignRule(undefined, original)];
    for (let rule = todo.pop(); rule !== undefined; rule = todo.pop()) {
      let index = 0;
      while (
        index < rule.positiveSize &&
        !this.isInliningAllowed(source, rule.getTailDecl(manager, index))
      )
        index++;
      if (index === rule.positiveSize) {
        target.addRule(rule);
        ruleManager.decRef(rule);
        continue;
      }
      isModified = true;
      for (const inlined of this.inlinedRules.getPredicateRules(rule.getTailDecl(manager, index))) {
        const result = this.tryToInlineRule(rule, inlined, index);
        if (this.hasNewQuantifier) {
          ruleManager.decRef(rule);
          for (const pending of todo) ruleManager.decRef(pending);
          return isModified;
        }
        if (result === undefined) continue;
        if (result.isSatisfiable) todo.push(ruleManager.assignRule(undefined, result.rule));
        ruleManager.decRef(result.rule);
      }
      ruleManager.decRef(rule);
    }
    if (isModified) this.modelConverter?.delRule(original, L_UNDEF);
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
    if (isDone)
      for (const rule of source.rules)
        if (this.isInliningAllowed(source, rule.getDecl(manager)))
          this.modelConverter?.delRule(rule, L_UNDEF);
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

  // Returns undefined when nothing applies, or the replacement with a reference, where null
  // deletes the rule.
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
      if (candidate === undefined) {
        this.modelConverter?.delRule(rule, L_FALSE);
        return null;
      }
      if (!this.isOrientedRewriter(candidate, rules)) continue;
      const inlined = this.tryToInlineRule(rule, candidate, index);
      if (inlined?.isSatisfiable) return inlined.rule;
      this.modelConverter?.delRule(rule, L_FALSE);
      if (inlined !== undefined) this.context.ruleManager.decRef(inlined.rule);
      return null;
    }
    return undefined;
  }

  // On success the rules are released, as Z3 replaces the scoped set.
  private doEagerInlining(rules: RuleSet) {
    const ruleManager = this.context.ruleManager;
    const result = new RuleSet(this.context);
    let isDone = false;
    for (const original of rules.rules) {
      let rule: Rule | null = ruleManager.assignRule(undefined, original);
      let replacement: Rule | null = null;
      for (;;) {
        const next: Rule | null | undefined = this.doEagerInliningRule(rule, rules);
        if (next === undefined) break;
        isDone = true;
        if (replacement !== null) ruleManager.decRef(replacement);
        replacement = next;
        if (replacement === null) {
          ruleManager.decRef(rule);
          rule = null;
          break;
        }
        rule = ruleManager.assignRule(rule, replacement);
      }
      if (rule !== null) result.addRule(rule);
      if (replacement !== null) ruleManager.decRef(replacement);
      if (rule !== null) ruleManager.decRef(rule);
    }
    if (!isDone) {
      result.reset();
      return undefined;
    }
    rules.reset();
    return result;
  }

  private addRule(source: RuleSet, rule: Rule, position: number) {
    const manager = this.context.manager;
    this.headVisitor.addPosition(rule.head, position);
    this.headIndex.insert(rule.head);
    this.pinned.push(this.context.ruleManager.assignRule(undefined, rule));
    if (source.isOutputPredicate(rule.getDecl(manager)))
      this.headVisitor.canRemove[position] = false;
    for (let index = 0; index < rule.uninterpretedSize; index++) {
      this.tailVisitor.addPosition(rule.tail[index], position);
      this.tailIndex.insert(rule.tail[index]);
    }
    this.headVisitor.canExpand[position] =
      rule.uninterpretedSize === 1 &&
      rule.positiveSize === 1 &&
      !source.isOutputPredicate(rule.getTailDecl(manager, 0));
  }

  private delRule(rule: Rule, position: number) {
    this.headVisitor.delPosition(rule.head, position);
    this.headIndex.erase(rule.head);
    for (let index = 0; index < rule.uninterpretedSize; index++) {
      this.tailVisitor.delPosition(rule.tail[index], position);
      this.tailIndex.erase(rule.tail[index]);
    }
  }

  private getUnifiers(index: SubstitutionTree, visitor: Visitor, expr: number) {
    visitor.unifiers = [];
    index.unify(expr, visitor);
    return visitor.unifiers;
  }

  // On success the rules are released, as Z3 replaces the scoped set.
  private inlineLinear(rules: RuleSet) {
    const ruleManager = this.context.ruleManager;
    let isDone = false;
    const size = rules.rules.length;
    this.headVisitor.reset(size);
    this.tailVisitor.reset(size);
    this.headIndex.reset();
    this.tailIndex.reset();
    const accumulated = rules.rules.map((rule) => ruleManager.assignRule(undefined, rule));
    for (let index = 0; index < size; index++) this.addRule(rules, accumulated[index], index);
    this.subst.reset();
    const isValid = Array.from({ length: size }, () => true);
    const isBranching = this.context.params.getBool("xform.inline_linear_branch", false);
    const canRemove = this.headVisitor.canRemove;
    const canExpand = this.headVisitor.canExpand;
    for (let index = 0; index < size; index++)
      for (;;) {
        const rule = accumulated[index];
        if (!isValid[index] || !canExpand[index]) break;
        const headUnifiers = this.getUnifiers(this.headIndex, this.headVisitor, rule.tail[0]);
        if (headUnifiers.length !== 1) break;
        const other = headUnifiers[0];
        if (!canRemove[other] || !isValid[other] || index === other) break;
        const otherRule = accumulated[other];
        const tailUnifiers = this.getUnifiers(this.tailIndex, this.tailVisitor, otherRule.head);
        if (!isBranching && tailUnifiers.length !== 1) break;
        const result = this.tryToInlineRule(rule, otherRule, 0);
        if (result === undefined) break;
        if (!result.isSatisfiable) {
          ruleManager.decRef(result.rule);
          break;
        }
        isDone = true;
        this.delRule(rule, index);
        this.addRule(rules, result.rule, index);
        accumulated[index] = ruleManager.assignRule(accumulated[index], result.rule);
        canExpand[index] = canExpand[other];
        if (tailUnifiers.length === 1) {
          isValid[other] = false;
          this.modelConverter?.delRule(otherRule, L_UNDEF);
          this.delRule(otherRule, other);
        }
        ruleManager.decRef(result.rule);
      }
    const result = isDone ? new RuleSet(this.context) : undefined;
    if (result !== undefined) {
      for (let index = 0; index < size; index++)
        if (isValid[index]) result.addRule(accumulated[index]);
      result.inheritPredicates(rules);
      rules.reset();
    }
    for (const rule of accumulated) ruleManager.decRef(rule);
    return result;
  }

  apply(source: RuleSet) {
    if (source.rules.length === 0) return undefined;
    if (source.rules.some((rule) => this.context.ruleManager.hasQuantifiers(rule)))
      return undefined;
    this.hasNewQuantifier = false;
    this.modelConverter =
      this.context.modelConverters === undefined
        ? undefined
        : new HornSubsumeModelConverter(this.context);
    const converter = this.modelConverter;
    let isDone = false;
    let result = new RuleSet(this.context);
    if (this.context.params.getBool("xform.inline_eager", true)) {
      this.planInlining(source);
      isDone = this.transformRules(source, result);
      if (this.hasNewQuantifier) {
        result.reset();
        return undefined;
      }
      result.close();
      const eager = this.doEagerInlining(result);
      if (eager !== undefined) {
        result = eager;
        isDone = true;
      }
    }
    if (isDone) result.inheritPredicates(source);
    else {
      const copied = RuleSet.copy(source);
      result.reset();
      result = copied;
    }
    if (this.context.params.getBool("xform.inline_linear", true)) {
      const linear = this.inlineLinear(result);
      if (linear !== undefined) {
        result = linear;
        isDone = true;
      }
    }
    if (this.hasNewQuantifier) throw new SmtUnsupportedError("inlining a rule with a quantifier");
    if (!isDone) {
      result.reset();
      return undefined;
    }
    if (converter !== undefined)
      this.context.modelConverters?.push((model) => converter.apply(model));
    return result;
  }
}

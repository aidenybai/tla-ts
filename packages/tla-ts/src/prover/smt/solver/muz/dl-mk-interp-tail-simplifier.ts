import {
  type AstManager,
  KIND_APP,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_GE,
  OP_LE,
  OP_NOT,
  OP_OR,
  OP_SUB,
  SORT_BOOL,
} from "../ast";
import { flattenAndVector } from "../ast-util";
import { assign, assignOwned, release } from "../expr-ref";
import { RefVector } from "../ref-vector";
import { type Rewrite, RewriterTpl } from "../rewriter-tpl";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { removeDuplicateTails, type RuleTransformerPlugin } from "./dl-rule-transformer";
import { Substitution } from "./substitution";

const compare = (first: number, second: number) => (first > second ? 1 : first === second ? 0 : -1);

class Normalizer extends RewriterTpl {
  readonly appArgs: RefVector;

  constructor(
    manager: AstManager,
    private context: DatalogContext,
  ) {
    super(manager);
    this.appArgs = new RefVector(manager);
  }

  private stripNot(expr: number) {
    const manager = this.manager;
    return manager.isNot(expr)
      ? { expr: manager.getArg(expr, 0), isNeg: true }
      : { expr, isNeg: false };
  }

  private compareExprs(firstExpr: number, secondExpr: number, depth: number): number {
    const manager = this.manager;
    if (firstExpr === secondExpr) return 0;
    const first = this.stripNot(firstExpr);
    const second = this.stripNot(secondExpr);
    if (first.expr === second.expr) return compare(Number(first.isNeg), Number(second.isNeg));
    const isFirstApp = manager.kinds[first.expr] === KIND_APP;
    const isSecondApp = manager.kinds[second.expr] === KIND_APP;
    if (!isFirstApp && !isSecondApp)
      return compare(manager.ids[first.expr], manager.ids[second.expr]);
    if (!isFirstApp) return -1;
    if (!isSecondApp) return 1;
    const firstDecl = manager.getDeclId(first.expr);
    const secondDecl = manager.getDeclId(second.expr);
    if (manager.decls[first.expr] !== manager.decls[second.expr] || firstDecl !== secondDecl)
      return compare(firstDecl, secondDecl);
    const numArgs = manager.getNumArgs(first.expr);
    if (numArgs !== manager.getNumArgs(second.expr))
      return compare(numArgs, manager.getNumArgs(second.expr));
    if (depth === 0) return compare(manager.ids[first.expr], manager.ids[second.expr]);
    let negComparison = 0;
    for (let index = 0; index < numArgs; index++) {
      const firstArg = this.stripNot(manager.getArg(first.expr, index));
      const secondArg = this.stripNot(manager.getArg(second.expr, index));
      if (negComparison === 0 && firstArg.isNeg !== secondArg.isNeg)
        negComparison = firstArg.isNeg ? -1 : 1;
      const result = this.compareExprs(firstArg.expr, secondArg.expr, depth - 1);
      if (result !== 0) return result;
    }
    if (negComparison !== 0) return negComparison;
    return compare(manager.ids[first.expr], manager.ids[second.expr]);
  }

  private getPair(expr: number, isConjunction: boolean) {
    const manager = this.manager;
    return manager.getOp(expr) === (isConjunction ? OP_AND : OP_OR) &&
      manager.getNumArgs(expr) === 2
      ? manager.getArgs(expr)
      : undefined;
  }

  private detectEquivalence(first: number[], second: number[], isInsideDisjunction: boolean) {
    const manager = this.manager;
    if (manager.isNot(first[0]) === manager.isNot(second[0])) return -1;
    if (manager.isNot(first[1]) === manager.isNot(second[1])) return -1;
    let firstBare = -1;
    for (const [one, other] of [
      [first[0], second[0]],
      [second[0], first[0]],
    ])
      if (manager.isNot(one)) {
        firstBare = manager.getArg(one, 0);
        if (other !== firstBare) return -1;
      }
    let secondBare = -1;
    for (const [one, other] of [
      [first[1], second[1]],
      [second[1], first[1]],
    ])
      if (manager.isNot(one)) {
        secondBare = manager.getArg(one, 0);
        if (other !== secondBare) return -1;
      }
    if (manager.sorts[firstBare] !== SORT_BOOL || manager.sorts[secondBare] !== SORT_BOOL)
      return -1;
    const isNegsTogether = manager.isNot(first[0]) === manager.isNot(first[1]);
    return isNegsTogether === isInsideDisjunction
      ? manager.mkEq(firstBare, secondBare)
      : manager.mkEq(firstBare, manager.mkNot(secondBare));
  }

  private detectEquivalences(args: number[], isInsideDisjunction: boolean) {
    let previous: number[] | undefined;
    let previousIndex = 0;
    let writeIndex = 0;
    let readIndex = 0;
    while (readIndex < args.length) {
      const expr = args[readIndex];
      const pair = this.getPair(expr, isInsideDisjunction);
      if (pair !== undefined) {
        const equivalence =
          previous === undefined ? -1 : this.detectEquivalence(previous, pair, isInsideDisjunction);
        if (equivalence !== -1) {
          previous = undefined;
          args[previousIndex] = equivalence;
          readIndex++;
          continue;
        }
        previous = pair;
        previousIndex = writeIndex;
      } else previous = undefined;
      args[writeIndex++] = expr;
      readIndex++;
    }
    args.length = writeIndex;
    return readIndex !== writeIndex;
  }

  reduceApp(decl: number, args: number[], _sort: number): number | Rewrite {
    const manager = this.manager;
    const op = manager.funcDecls[decl].op;
    const appArgs = this.appArgs;
    if (op === OP_NOT) {
      const argOp = manager.getOp(args[0]);
      if (argOp !== OP_AND && argOp !== OP_OR) return -1;
      appArgs.reset();
      let negated = -1;
      for (let index = 0; index < manager.getNumArgs(args[0]); index++) {
        negated = assign(
          manager,
          negated,
          this.context.rewriter.mkNot(manager.getArg(args[0], index)),
        );
        appArgs.push(negated);
      }
      const result = argOp === OP_AND ? manager.mkOr(appArgs.items) : manager.mkAnd(appArgs.items);
      manager.incRef(result);
      release(manager, negated);
      return { expr: result, depth: 2 };
    }
    if (op !== OP_AND && op !== OP_OR) return -1;
    const result = (() => {
      if (args.length === 0)
        return { expr: op === OP_AND ? manager.trueExpr : manager.falseExpr, isRewritten: false };
      if (args.length === 1) return { expr: args[0], isRewritten: false };
      const sorted = [...args].sort((first, second) =>
        this.compareExprs(first, second, 4) === -1
          ? -1
          : this.compareExprs(second, first, 4) === -1
            ? 1
            : 0,
      );
      const unique = sorted.filter((arg, index) => index === 0 || arg !== sorted[index - 1]);
      const isRewritten = this.detectEquivalences(unique, op === OP_OR);
      appArgs.reset();
      for (const arg of unique) appArgs.push(arg);
      return {
        expr:
          unique.length === 1
            ? unique[0]
            : op === OP_AND
              ? manager.mkAnd(unique)
              : manager.mkOr(unique),
        isRewritten,
      };
    })();
    manager.incRef(result.expr);
    return result.isRewritten ? { expr: result.expr, depth: 1 } : result.expr;
  }
}

class RuleSubstitution {
  private subst: Substitution;
  private head = -1;
  private tail: RefVector;

  constructor(private context: DatalogContext) {
    this.subst = new Substitution(context.manager);
    this.tail = new RefVector(context.manager);
  }

  reset() {
    this.subst.reset();
  }

  unify(first: number, second: number) {
    const manager = this.context.manager;
    const subst = this.subst;
    const firstApplied = assign(manager, -1, subst.apply(first, 0));
    const secondApplied = assign(manager, -1, subst.apply(second, 0));
    subst.resetCache();
    const isUnified = subst.unify(firstApplied, 0, secondApplied, 0);
    release(manager, secondApplied);
    release(manager, firstApplied);
    return isUnified;
  }

  getResult(rule: Rule) {
    const context = this.context;
    const manager = context.manager;
    const subst = this.subst;
    this.head = assign(manager, this.head, subst.apply(rule.head, 0));
    const tail = this.tail;
    tail.reset();
    const isNegated: boolean[] = [];
    for (let index = 0; index < rule.tail.length; index++) {
      tail.push(subst.apply(rule.tail[index], 0));
      isNegated.push(rule.isNegated[index]);
    }
    removeDuplicateTails(tail, isNegated);
    const result = context.ruleManager.mk(this.head, tail.items, isNegated, rule.name);
    context.ruleManager.setAccountingParent(result, rule);
    context.ruleManager.normVars(result);
    return result;
  }

  release() {
    this.tail.reset();
    release(this.context.manager, this.head);
    this.head = -1;
    this.subst.reset();
  }
}

interface KeptRule {
  kind: "kept";
  rule: Rule;
}

interface DroppedRule {
  kind: "dropped";
  rule: Rule | undefined;
}

export class MkInterpTailSimplifier implements RuleTransformerPlugin {
  private ruleSubst: RuleSubstitution;
  private tail: RefVector;
  private interpretedMembers: RefVector;
  private conjuncts: RefVector;
  private normalizer: Normalizer;

  constructor(
    private context: DatalogContext,
    readonly priority = 40000,
  ) {
    const manager = context.manager;
    this.ruleSubst = new RuleSubstitution(context);
    this.tail = new RefVector(manager);
    this.interpretedMembers = new RefVector(manager);
    this.conjuncts = new RefVector(manager);
    this.normalizer = new Normalizer(manager, context);
  }

  release() {
    this.normalizer.release();
    this.normalizer.appArgs.reset();
    this.conjuncts.reset();
    this.interpretedMembers.reset();
    this.tail.reset();
    this.ruleSubst.release();
  }

  private simplifyExpr(expr: number) {
    const context = this.context;
    const manager = context.manager;
    const first = context.simplify(expr);
    const normalized = this.normalizer.rewrite(first);
    const result = assignOwned(manager, normalized, context.simplify(normalized));
    release(manager, first);
    return result;
  }

  // The rule comes with a reference.
  private propagateVariableEquivalences(rule: Rule) {
    const context = this.context;
    const manager = context.manager;
    if (!context.params.getBool("xform.tail_simplifier_pve", true)) return undefined;
    if (rule.uninterpretedSize === rule.tail.length) return undefined;
    const todo = rule.tail.slice(rule.uninterpretedSize);
    const ruleSubst = this.ruleSubst;
    ruleSubst.reset();
    const trail = new RefVector(manager);
    let difference = -1;
    let reversed = -1;
    let isFound = false;
    const isFlex = (expr: number) => manager.kinds[expr] === KIND_VAR || manager.isValue(expr);
    const tryUnify = (first: number, second: number) => {
      if (ruleSubst.unify(first, second)) isFound = true;
    };
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      let isNeg = manager.isNot(current);
      const term = isNeg ? manager.getArg(current, 0) : current;
      const op = manager.getOp(term);
      if (manager.kinds[term] === KIND_VAR)
        tryUnify(term, isNeg ? manager.falseExpr : manager.trueExpr);
      else if (!isNeg && op === OP_AND) manager.pushArgs(term, todo);
      else if (
        !isNeg &&
        op === OP_EQ &&
        isFlex(manager.getArg(term, 0)) &&
        isFlex(manager.getArg(term, 1))
      )
        tryUnify(manager.getArg(term, 0), manager.getArg(term, 1));
      else if (op === OP_EQ && manager.sorts[manager.getArg(term, 0)] === SORT_BOOL) {
        let first = manager.getArg(term, 0);
        let second = manager.getArg(term, 1);
        while (manager.isNot(first)) {
          first = manager.getArg(first, 0);
          isNeg = !isNeg;
        }
        while (manager.isNot(second)) {
          second = manager.getArg(second, 0);
          isNeg = !isNeg;
        }
        if (manager.kinds[first] !== KIND_VAR) [first, second] = [second, first];
        if (!isFlex(first) || !isFlex(second)) continue;
        if (manager.kinds[first] === KIND_VAR && !isNeg) tryUnify(first, second);
        else if (manager.kinds[first] === KIND_VAR && isNeg && manager.isTrue(second))
          tryUnify(first, manager.falseExpr);
        else if (manager.kinds[first] === KIND_VAR && isNeg && manager.isFalse(second))
          tryUnify(first, manager.trueExpr);
      } else if (!isNeg && (op === OP_LE || op === OP_GE)) {
        const lower = manager.getArg(term, op === OP_LE ? 0 : 1);
        const upper = manager.getArg(term, op === OP_LE ? 1 : 0);
        const sort = manager.sorts[lower];
        difference = assign(manager, difference, manager.mkApp(OP_SUB, [lower, upper], sort));
        reversed = assign(manager, reversed, manager.mkApp(OP_SUB, [upper, lower], sort));
        trail.push(difference);
      }
    }
    const result = isFound
      ? context.ruleManager.assignRule(undefined, ruleSubst.getResult(rule))
      : undefined;
    release(manager, reversed);
    release(manager, difference);
    trail.reset();
    return result;
  }

  // The rule comes with a reference.
  transformRule(original: Rule): KeptRule | DroppedRule {
    const context = this.context;
    const manager = context.manager;
    const ruleManager = context.ruleManager;
    let rule = ruleManager.assignRule(undefined, original);
    if (ruleManager.hasQuantifiers(rule)) return { kind: "kept", rule };
    let result: Rule | undefined;
    for (;;) {
      const uninterpretedSize = rule.uninterpretedSize;
      const size = rule.tail.length;
      if (uninterpretedSize === size) {
        result = ruleManager.assignRule(result, rule);
        ruleManager.decRef(rule);
        return { kind: "kept", rule: result };
      }
      const head = assign(manager, -1, rule.head);
      const tail = this.tail;
      tail.reset();
      const isNegated: boolean[] = [];
      for (let index = 0; index < uninterpretedSize; index++) {
        tail.push(rule.tail[index]);
        isNegated.push(rule.isNegated[index]);
      }
      let isModified = false;
      let interpreted = -1;
      if (uninterpretedSize + 1 === size)
        interpreted = assign(manager, -1, rule.tail[uninterpretedSize]);
      else {
        const members = this.interpretedMembers;
        members.reset();
        for (let index = uninterpretedSize; index < size; index++) members.push(rule.tail[index]);
        interpreted = assign(manager, -1, manager.mkApp(OP_AND, members.items, SORT_BOOL));
        isModified = true;
      }
      const simplified = this.simplifyExpr(interpreted);
      isModified ||= interpreted !== simplified;
      if (manager.isFalse(simplified)) {
        release(manager, simplified);
        release(manager, interpreted);
        release(manager, head);
        ruleManager.decRef(rule);
        return { kind: "dropped", rule: result };
      }
      if (isModified) {
        const conjuncts = this.conjuncts;
        conjuncts.reset();
        conjuncts.push(simplified);
        flattenAndVector(manager, conjuncts);
        for (const conjunct of conjuncts.items) {
          tail.push(ruleManager.ensureApp(conjunct));
          isNegated.push(false);
        }
        result = ruleManager.assignRule(
          result,
          ruleManager.mk(head, tail.items, isNegated, rule.name),
        );
        ruleManager.setAccountingParent(result, rule);
      } else result = ruleManager.assignRule(result, rule);
      const propagated = this.propagateVariableEquivalences(result);
      if (propagated !== undefined) {
        rule = ruleManager.assignRule(rule, propagated);
        ruleManager.decRef(propagated);
      }
      release(manager, simplified);
      release(manager, interpreted);
      release(manager, head);
      if (propagated === undefined) {
        ruleManager.decRef(rule);
        return { kind: "kept", rule: result };
      }
    }
  }

  private transformRules(source: RuleSet, target: RuleSet) {
    const ruleManager = this.context.ruleManager;
    let isModified = false;
    for (const rule of source.rules) {
      const transformed = this.transformRule(rule);
      if (transformed.kind === "kept") {
        if (transformed.rule !== rule) isModified = true;
        target.addRule(transformed.rule);
      } else isModified = true;
      if (transformed.rule !== undefined) ruleManager.decRef(transformed.rule);
    }
    return isModified;
  }

  apply(source: RuleSet) {
    if (source.rules.length === 0) return undefined;
    const result = new RuleSet(this.context);
    if (this.transformRules(source, result)) {
      result.inheritPredicates(source);
      return result;
    }
    result.reset();
    return undefined;
  }
}

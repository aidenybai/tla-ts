// Ported from Z3 (src/muz/transforms/dl_mk_interp_tail_simplifier.cpp), MIT license, see
// z3-license.txt.
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
  SORT_BOOL,
} from "../ast";
import { flattenAndVector } from "../ast-util";
import { RefVector } from "../ref-vector";
import { type Rewrite, RewriterTpl } from "../rewriter-tpl";
import type { DatalogContext } from "./dl-context";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { removeDuplicateTails, type RuleTransformerPlugin } from "./dl-rule-transformer";
import { Substitution } from "./substitution";

const compare = (first: number, second: number) => (first > second ? 1 : first === second ? 0 : -1);

class Normalizer extends RewriterTpl {
  constructor(
    manager: AstManager,
    private context: DatalogContext,
  ) {
    super(manager);
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
    if (op === OP_NOT) {
      const argOp = manager.getOp(args[0]);
      if (argOp !== OP_AND && argOp !== OP_OR) return -1;
      const negated = manager.getArgs(args[0]).map((arg) => this.context.rewriter.mkNot(arg));
      const result = argOp === OP_AND ? manager.mkOr(negated) : manager.mkAnd(negated);
      manager.incRef(result);
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

export class MkInterpTailSimplifier implements RuleTransformerPlugin {
  private normalizer: Normalizer;

  constructor(
    private context: DatalogContext,
    readonly priority = 40000,
  ) {
    this.normalizer = new Normalizer(context.manager, context);
  }

  private simplifyExpr(expr: number) {
    const first = this.context.simplify(expr);
    const normalized = this.normalizer.rewrite(first);
    return this.context.simplify(normalized);
  }

  private propagateVariableEquivalences(rule: Rule): Rule | undefined {
    const context = this.context;
    const manager = context.manager;
    if (!context.params.getBool("xform.tail_simplifier_pve", true)) return undefined;
    if (rule.uninterpretedSize === rule.tail.length) return undefined;
    const todo = rule.tail.slice(rule.uninterpretedSize);
    const subst = new Substitution(manager);
    let isFound = false;
    const isFlex = (expr: number) => manager.kinds[expr] === KIND_VAR || manager.isValue(expr);
    const tryUnify = (first: number, second: number) => {
      if (subst.unify(subst.apply(first, 0), 0, subst.apply(second, 0), 0)) isFound = true;
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
        // Z3 collects the differences of the inequalities but never unifies them.
      }
    }
    if (!isFound) return undefined;
    const tail = rule.tail.map((literal) => subst.apply(literal, 0));
    const isNegated = [...rule.isNegated];
    removeDuplicateTails(tail, isNegated);
    const result = context.ruleManager.mk(subst.apply(rule.head, 0), tail, isNegated, rule.name);
    context.ruleManager.normVars(result);
    return result;
  }

  // Undefined drops the rule, whose interpreted tail simplified to false.
  transformRule(original: Rule): Rule | undefined {
    const context = this.context;
    const manager = context.manager;
    if (context.ruleManager.hasQuantifiers(original)) return original;
    let rule = original;
    for (;;) {
      const uninterpretedSize = rule.uninterpretedSize;
      if (uninterpretedSize === rule.tail.length) return rule;
      const tail = rule.tail.slice(0, uninterpretedSize);
      const isNegated = rule.isNegated.slice(0, uninterpretedSize);
      const isSingle = uninterpretedSize + 1 === rule.tail.length;
      const interpretedTail = isSingle
        ? rule.tail[uninterpretedSize]
        : manager.mkAnd(rule.tail.slice(uninterpretedSize));
      const simplified = this.simplifyExpr(interpretedTail);
      const isModified = !isSingle || interpretedTail !== simplified;
      if (manager.isFalse(simplified)) return undefined;
      let result = rule;
      if (isModified) {
        const conjs = new RefVector(manager);
        conjs.push(simplified);
        flattenAndVector(manager, conjs);
        for (const conj of conjs.items) {
          tail.push(context.ruleManager.ensureApp(conj));
          isNegated.push(false);
        }
        conjs.reset();
        result = context.ruleManager.mk(rule.head, tail, isNegated, rule.name);
      }
      const propagated = this.propagateVariableEquivalences(result);
      if (propagated === undefined) return result;
      rule = propagated;
    }
  }

  apply(source: RuleSet) {
    if (source.rules.length === 0) return undefined;
    const result = new RuleSet(this.context);
    let isModified = false;
    for (const rule of source.rules) {
      const transformed = this.transformRule(rule);
      if (transformed === undefined) {
        isModified = true;
        continue;
      }
      if (transformed !== rule) isModified = true;
      result.addRule(transformed);
    }
    if (!isModified) return undefined;
    result.inheritPredicates(source);
    return result;
  }
}

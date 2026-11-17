import { SmtTacticError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_USER,
  getSymbolName,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_DIV,
  OP_DIV0,
  OP_DT_ACCESSOR,
  OP_DT_IS,
  OP_DT_RECOGNISER,
  OP_FUN_DEFINED,
  OP_EQ,
  OP_IDIV,
  OP_IDIV0,
  OP_IMPLIES,
  OP_ITE,
  OP_MOD,
  OP_MOD0,
  OP_OR,
  OP_POWER0,
  OP_REM,
  SORT_SIZE_INFINITE,
  QUANTIFIER_EXISTS,
} from "../ast";
import {
  getAccessorConstructor,
  getDatatypeConstructors,
  getRecognizerConstructor,
} from "../datatype-decl-plugin";
import { ObjMap } from "../hashtable";
import { Rewriter } from "../rewriter";
import type { DatalogContext } from "./dl-context";
import { mkPp, type Rule } from "./dl-rule";
import type { RuleSet } from "./dl-rule-set";

// quantifier::get_child: the body, then the patterns, then the no-patterns.
const getQuantifierChildren = (manager: AstManager, expr: number) => {
  const quantifier = manager.getQuantifier(expr);
  return [quantifier.body, ...quantifier.patterns, ...quantifier.noPatterns];
};

const DIVISION_OPS = new Set([OP_DIV, OP_IDIV, OP_MOD, OP_REM]);
const DIVISION_BY_ZERO_OPS = new Set([OP_DIV0, OP_IDIV0, OP_MOD0, OP_POWER0]);

export class RuleProperties {
  private quantifiers: ObjMap<Rule>;
  private uninterpretedFuncs: ObjMap<Rule>;
  private interpretedPredicateRules: Rule[] = [];
  private negativeRules: Rule[] = [];
  private infiniteSortRules: Rule[] = [];
  isMonotone = true;

  constructor(private context: DatalogContext) {
    const manager = context.manager;
    this.quantifiers = new ObjMap((expr) => manager.hashes[expr]);
    this.uninterpretedFuncs = new ObjMap((decl) => manager.getDeclHash(decl));
  }

  private get manager(): AstManager {
    return this.context.manager;
  }

  collect(rules: RuleSet) {
    this.quantifiers.clear();
    this.uninterpretedFuncs.clear();
    this.interpretedPredicateRules = [];
    this.negativeRules = [];
    this.infiniteSortRules = [];
    const manager = this.manager;
    const visited = new Set<number>();
    for (const rule of rules.rules) {
      if (rule.hasNegation()) {
        this.isMonotone = false;
        this.negativeRules.push(rule);
      }
      for (let index = rule.uninterpretedSize; index < rule.tail.length; index++)
        this.visit(rule, rule.tail[index], visited);
      const domain = manager.funcDecls[rule.getDecl(manager)].domain;
      for (let index = 0; this.infiniteSortRules.length === 0 && index < domain.length; index++)
        this.checkSort(rule, domain[index]);
    }
  }

  // for_each_expr_core, which marks every expression and visits the patterns of a quantifier.
  private visit(rule: Rule, root: number, visited: Set<number>) {
    const manager = this.manager;
    if (visited.has(root)) return;
    visited.add(root);
    const stack = [root];
    const positions = [0];
    while (stack.length > 0) {
      const top = stack.length - 1;
      const current = stack[top];
      const kind = manager.kinds[current];
      const children =
        kind === KIND_VAR
          ? []
          : kind === KIND_QUANTIFIER
            ? getQuantifierChildren(manager, current)
            : manager.getArgs(current);
      while (positions[top] < children.length && visited.has(children[positions[top]]))
        positions[top]++;
      if (positions[top] < children.length) {
        const child = children[positions[top]++];
        visited.add(child);
        stack.push(child);
        positions.push(0);
        continue;
      }
      stack.pop();
      positions.pop();
      if (kind === KIND_VAR) this.checkSort(rule, manager.sorts[current]);
      else if (kind === KIND_QUANTIFIER) this.quantifiers.set(current, rule);
      else this.visitApp(rule, current);
    }
  }

  private visitApp(rule: Rule, expr: number) {
    const manager = this.manager;
    const decl = manager.decls[expr];
    const op = manager.getOp(expr);
    if (this.context.isPredicate(expr)) {
      const rules = this.interpretedPredicateRules;
      if (rules[rules.length - 1] !== rule) rules.push(rule);
    } else if (manager.getFamily(expr) === FAMILY_USER) this.uninterpretedFuncs.set(decl, rule);
    else if (op === OP_DT_ACCESSOR) {
      if (!this.checkAccessor(rule, expr)) this.uninterpretedFuncs.set(decl, rule);
    } else if (
      DIVISION_BY_ZERO_OPS.has(op) ||
      op === OP_FUN_DEFINED ||
      (DIVISION_OPS.has(op) && !this.evaluatesToNonZeroNumeral(manager.getArg(expr, 1)))
    )
      this.uninterpretedFuncs.set(decl, rule);
    this.checkSort(rule, manager.sorts[expr]);
  }

  // Whether a recognizer of the accessor's constructor guards each use of it in the tail.
  private checkAccessor(rule: Rule, accessor: number) {
    const manager = this.manager;
    const subject = manager.getArg(accessor, 0);
    const constructors = getDatatypeConstructors(manager, manager.sorts[subject]);
    if (constructors.length <= 1) return true;
    const constructor = getAccessorConstructor(manager, manager.decls[accessor]);
    const ctors: number[] = [];
    const isSubjectRecognizer = (term: number) =>
      (manager.getOp(term) === OP_DT_RECOGNISER || manager.getOp(term) === OP_DT_IS) &&
      manager.getArg(term, 0) === subject;
    const addRecognizer = (term: number) => {
      if (!isSubjectRecognizer(term)) return;
      const other = getRecognizerConstructor(manager, manager.decls[term]);
      if (other !== constructor) ctors.push(other);
    };
    const addNotRecognizer = (term: number) => {
      if (manager.isNot(term)) addRecognizer(manager.getArg(term, 0));
    };
    const isRecognizerBase = (term: number) =>
      isSubjectRecognizer(term) &&
      getRecognizerConstructor(manager, manager.decls[term]) === constructor;
    const isRecognizer = (term: number) =>
      (manager.getOp(term) === OP_AND && manager.getArgs(term).some(isRecognizerBase)) ||
      isRecognizerBase(term);
    for (let index = rule.uninterpretedSize; index < rule.tail.length; index++) {
      if (isRecognizer(rule.tail[index])) return true;
      addNotRecognizer(rule.tail[index]);
    }
    // The parents of every subterm of the tail, where -1 marks a tail formula itself.
    const useList = new Map<number, number[]>();
    const addUse = (term: number, parent: number) => {
      const parents = useList.get(term);
      if (parents === undefined) useList.set(term, [parent]);
      else parents.push(parent);
    };
    for (let index = rule.uninterpretedSize; index < rule.tail.length; index++) {
      addUse(rule.tail[index], -1);
      const marked = new Set<number>();
      const stack = [rule.tail[index]];
      while (stack.length > 0) {
        const sub = stack[stack.length - 1];
        marked.add(sub);
        if (manager.kinds[sub] === KIND_APP)
          for (const arg of manager.getArgs(sub)) {
            addUse(arg, sub);
            stack.push(arg);
          }
        else if (manager.kinds[sub] === KIND_QUANTIFIER)
          stack.push(manager.getQuantifier(sub).body);
        while (stack.length > 0 && marked.has(stack[stack.length - 1])) stack.pop();
      }
    }
    const exprs = [accessor];
    const ctorSizes = [0];
    const isVisited = [false];
    while (exprs.length > 0) {
      const top = exprs.length - 1;
      const current = exprs[top];
      if (isVisited[top]) {
        ctors.length = Math.min(ctors.length, ctorSizes[top]);
        exprs.pop();
        ctorSizes.pop();
        isVisited.pop();
        continue;
      }
      isVisited[top] = true;
      const parents = useList.get(current);
      if (parents === undefined) return false;
      for (const parent of parents) {
        if (parent === -1) {
          const unguarded = constructors.filter((other) => !ctors.includes(other));
          if (unguarded.length === 1 && unguarded[0] === constructor) continue;
          return false;
        }
        if (isRecognizer(parent)) continue;
        const op = manager.getOp(parent);
        if (op === OP_ITE) {
          const condition = manager.getArg(parent, 0);
          if (
            manager.getArg(parent, 1) === current &&
            isRecognizer(condition) &&
            manager.getArg(parent, 2) !== current
          )
            continue;
          addRecognizer(condition);
        }
        if (op === OP_AND) for (const arg of manager.getArgs(parent)) addNotRecognizer(arg);
        let isGuarded = false;
        if (op === OP_OR)
          for (const arg of manager.getArgs(parent)) {
            addRecognizer(arg);
            if (manager.isNot(arg) && isRecognizer(manager.getArg(arg, 0))) {
              isGuarded = true;
              break;
            }
          }
        if (isGuarded) continue;
        exprs.push(parent);
        ctorSizes.push(ctors.length);
        isVisited.push(false);
      }
    }
    return true;
  }

  // evaluates_to_numeral, with the zero test of its caller.
  private evaluatesToNonZeroNumeral(expr: number) {
    const manager = this.manager;
    if (manager.isNumeral(expr)) return !manager.getRationalValue(expr).isZero();
    const rewriter = new Rewriter(manager, this.context.rewriterOptions);
    const value = rewriter.rewrite(expr);
    const isNonZeroNumeral = manager.isNumeral(value) && !manager.getRationalValue(value).isZero();
    manager.decRef(value);
    rewriter.release();
    return isNonZeroNumeral;
  }

  private checkSort(rule: Rule, sort: number) {
    const manager = this.manager;
    if (manager.isArraySort(sort) || manager.getSortSize(sort) === SORT_SIZE_INFINITE)
      this.infiniteSortRules.push(rule);
  }

  checkForNegatedPredicates() {
    if (this.negativeRules.length > 0)
      throw new SmtTacticError(
        `Rule contains negative predicate ${this.negativeRules[0].display(this.context)}`,
      );
  }

  checkUninterpretedFree() {
    const first = this.uninterpretedFuncs.entries().next();
    if (first.done !== true)
      throw new SmtTacticError(
        `Uninterpreted '${getSymbolName(this.manager.funcDecls[first.value[0]].name)}' in ${first.value[1].display(this.context)}`,
      );
  }

  checkExistsFree() {
    for (const entry of this.quantifiers)
      if (this.manager.getQuantifier(entry[0]).kind === QUANTIFIER_EXISTS)
        throw new SmtTacticError(
          `cannot process EXISTS quantifier in rule ${entry[1].display(this.context)}`,
        );
  }

  checkBackgroundFree() {
    if (this.context.background.length > 0)
      throw new SmtTacticError("engine does not support background assertions");
  }

  checkExistentialTail() {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo: number[] = [];
    const toCheck: number[] = [];
    for (const rule of this.interpretedPredicateRules)
      todo.push(...rule.tail.slice(rule.uninterpretedSize));
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      const op = manager.getOp(expr);
      if (this.context.isPredicate(expr)) continue;
      if (op === OP_AND || op === OP_OR) manager.pushArgs(expr, todo);
      else if (op === OP_IMPLIES) {
        toCheck.push(manager.getArg(expr, 0));
        todo.push(manager.getArg(expr, 1));
      } else if (manager.kinds[expr] === KIND_QUANTIFIER)
        toCheck.push(manager.getQuantifier(expr).body);
      else if (op === OP_EQ && manager.isTrue(manager.getArg(expr, 0)))
        todo.push(manager.getArg(expr, 1));
      else if (op === OP_EQ && manager.isTrue(manager.getArg(expr, 1)))
        todo.push(manager.getArg(expr, 0));
      else toCheck.push(expr);
    }
    for (const expr of toCheck)
      if (this.containsPredicate(expr))
        throw new SmtTacticError(
          `recursive predicate ${mkPp(manager, expr)} occurs nested in the body of a rule`,
        );
  }

  private containsPredicate(root: number) {
    const manager = this.manager;
    const todo = [root];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      const kind = manager.kinds[expr];
      if (kind === KIND_QUANTIFIER) todo.push(manager.getQuantifier(expr).body);
      else if (kind === KIND_APP) {
        if (this.context.isPredicate(expr)) return true;
        manager.pushArgs(expr, todo);
      }
    }
    return false;
  }
}

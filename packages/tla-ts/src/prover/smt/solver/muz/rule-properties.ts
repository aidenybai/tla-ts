// Ported from Z3 (src/muz/base/rule_properties.cpp), MIT license, see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
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
  OP_FUN_DEFINED,
  OP_EQ,
  OP_IDIV,
  OP_IDIV0,
  OP_IMPLIES,
  OP_MOD,
  OP_MOD0,
  OP_OR,
  OP_POWER0,
  OP_REM,
  SORT_SIZE_INFINITE,
  QUANTIFIER_EXISTS,
} from "../ast";
import { ObjMap } from "../hashtable";
import type { DatalogContext } from "./dl-context";
import { mkPp, type Rule } from "./dl-rule";
import type { RuleSet } from "./dl-rule-set";

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

  private visit(rule: Rule, root: number, visited: Set<number>) {
    const manager = this.manager;
    const todo = [root];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (visited.has(expr)) continue;
      visited.add(expr);
      const kind = manager.kinds[expr];
      if (kind === KIND_VAR) this.checkSort(rule, manager.sorts[expr]);
      else if (kind === KIND_QUANTIFIER) {
        this.quantifiers.set(expr, rule);
        todo.push(manager.getQuantifier(expr).body);
      } else {
        this.visitApp(rule, expr);
        manager.pushArgs(expr, todo);
      }
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
    else if (op === OP_DT_ACCESSOR)
      throw new SmtUnsupportedError("datatype accessors in Horn rules");
    else if (DIVISION_BY_ZERO_OPS.has(op) || op === OP_FUN_DEFINED)
      this.uninterpretedFuncs.set(decl, rule);
    else if (DIVISION_OPS.has(op)) {
      const divisor = this.context.simplify(manager.getArg(expr, 1));
      if (!manager.isNumeral(divisor) || manager.getRationalValue(divisor).isZero())
        this.uninterpretedFuncs.set(decl, rule);
    }
    this.checkSort(rule, manager.sorts[expr]);
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

// Ported from Z3 (src/muz/base/dl_rule.cpp, src/muz/base/bind_variables.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_IMPLIES,
  SORT_BOOL,
} from "../ast";
import { flattenAndVector } from "../ast-util";
import { RefVector } from "../ref-vector";
import { getFreeVarSorts, VarSubst } from "../var-subst";
import { simplifyQuantifiers } from "../qe";
import { QuantifierHoister } from "../quant-hoist";
import type { DatalogContext } from "./dl-context";
import { Hnf } from "./hnf";
import type { RuleSet } from "./dl-rule-set";

// The tail lists the positive predicates, then the negated ones, then the interpreted formulas.
export class Rule {
  constructor(
    public head: number,
    readonly tail: number[],
    readonly isNegated: boolean[],
    readonly uninterpretedSize: number,
    readonly positiveSize: number,
    readonly name: string,
  ) {}

  getDecl(manager: AstManager) {
    return manager.decls[this.head];
  }

  getTailDecl(manager: AstManager, index: number) {
    return manager.decls[this.tail[index]];
  }

  hasNegation() {
    for (let index = 0; index < this.uninterpretedSize; index++)
      if (this.isNegated[index]) return true;
    return false;
  }

  isInTail(manager: AstManager, decl: number, isOnlyPositive = false) {
    const size = isOnlyPositive ? this.positiveSize : this.uninterpretedSize;
    for (let index = 0; index < size; index++)
      if (manager.decls[this.tail[index]] === decl) return true;
    return false;
  }
}

// The sorts of the free variables of the expressions, by index, as Z3's used_vars collects them.
export const getUsedVars = (manager: AstManager, exprs: readonly number[]) => {
  const used: (number | undefined)[] = [];
  for (const expr of exprs)
    getFreeVarSorts(manager, expr, manager.freeVarBounds[expr]).forEach((sort, index) => {
      if (sort !== undefined && used[index] === undefined) used[index] = sort;
    });
  return Array.from(used);
};

export const getRuleVars = (manager: AstManager, rule: Rule) =>
  getUsedVars(manager, [rule.head, ...rule.tail]);

export const mkForall = (manager: AstManager, sorts: number[], names: string[], body: number) =>
  manager.mkQuantifier({
    isForall: true,
    sorts,
    names,
    body,
    patterns: [],
    noPatterns: [],
    weight: 0,
    qid: "",
  });

export const mkExists = (manager: AstManager, sorts: number[], names: string[], body: number) =>
  manager.mkQuantifier({
    isForall: false,
    sorts,
    names,
    body,
    patterns: [],
    noPatterns: [],
    weight: 0,
    qid: "",
  });

export class BindVariables {
  private vars: number[] = [];

  constructor(private manager: AstManager) {}

  addVar(variable: number) {
    this.manager.incRef(variable);
    this.vars.push(variable);
  }

  apply(fml: number, isForall: boolean) {
    const manager = this.manager;
    if (this.vars.length === 0) return fml;
    const bound = new Map<number, number>();
    const names: string[] = [];
    const sorts: number[] = [];
    const abstract = (term: number, scope: number, cache: Map<number, number>): number => {
      const cached = cache.get(term);
      if (cached !== undefined) return cached;
      const kind = manager.kinds[term];
      const result = (() => {
        if (kind === KIND_VAR) return term;
        if (kind === KIND_QUANTIFIER) {
          const data = manager.getQuantifier(term);
          const innerScope = scope + data.sorts.length;
          const innerCache = new Map<number, number>();
          const patterns = data.patterns.map((pattern) =>
            abstract(pattern, innerScope, innerCache),
          );
          return manager.mkQuantifier({
            ...data,
            patterns,
            body: abstract(data.body, innerScope, innerCache),
          });
        }
        if (this.vars.includes(term)) {
          const existing =
            bound.get(term) ??
            (() => {
              const variable = manager.mkVar(names.length, manager.sorts[term]);
              names.push(manager.getDeclName(term));
              sorts.push(manager.sorts[term]);
              bound.set(term, variable);
              return variable;
            })();
          return scope === 0
            ? existing
            : manager.mkVar(scope + manager.values[existing], manager.sorts[existing]);
        }
        const args = manager.getArgs(term).map((arg) => abstract(arg, scope, cache));
        return args.every((arg, index) => arg === manager.getArg(term, index))
          ? term
          : manager.mkApp(manager.decls[term], args, manager.sorts[term]);
      })();
      cache.set(term, result);
      return result;
    };
    const body = abstract(fml, 0, new Map());
    if (names.length === 0) return body;
    sorts.reverse();
    names.reverse();
    return isForall ? mkForall(manager, sorts, names, body) : mkExists(manager, sorts, names, body);
  }
}

export class RuleManager {
  private hnf: Hnf;

  constructor(
    readonly manager: AstManager,
    private context: DatalogContext,
  ) {
    this.hnf = new Hnf(manager);
  }

  private pin(expr: number) {
    this.manager.incRef(expr);
    return expr;
  }

  mkRule(fml: number, rules: RuleSet, name = "") {
    const bound = this.context.bindVars(fml, true);
    if (this.manager.hasLabelFlags[bound]) throw new SmtUnsupportedError("labels in Horn rules");
    this.mkRuleCore(bound, rules, name);
  }

  private mkRuleCore(fml: number, rules: RuleSet, name: string) {
    this.hnf.setName(name);
    const fmls = this.hnf.apply(fml);
    for (const predicate of this.hnf.freshPredicates) this.context.registerPredicate(predicate);
    for (const horn of fmls) this.mkHornRule(horn, rules, name);
  }

  private mkHornRule(fml: number, rules: RuleSet, name: string) {
    const manager = this.manager;
    const body: number[] = [];
    const extracted = this.extractHorn(fml, body);
    const index = { value: extracted.index };
    const head = this.hoistCompound(index, extracted.head, body);
    const size = body.length;
    for (let position = 0; position < size; position++)
      body[position] = this.hoistCompound(index, body[position], body);
    const isNegated = body.map((literal, position) => {
      if (!manager.isNot(literal) || !this.context.isPredicate(manager.getArg(literal, 0)))
        return false;
      body[position] = manager.getArg(literal, 0);
      return true;
    });
    this.checkValidHead(head);
    const rule = this.mk(head, body, isNegated, name);
    rules.addRule(this.context.isFixingUnboundVars() ? this.fixUnboundVars(rule, true) : rule);
  }

  private extractHorn(fml: number, body: number[]) {
    const manager = this.manager;
    const matrix =
      manager.kinds[fml] === KIND_QUANTIFIER && manager.getQuantifier(fml).isForall
        ? manager.getQuantifier(fml).body
        : fml;
    const index = manager.freeVarBounds[matrix];
    if (manager.getOp(matrix) !== OP_IMPLIES) return { index, head: this.ensureApp(matrix) };
    const args = new RefVector(manager);
    args.push(manager.getArg(matrix, 0));
    flattenAndVector(manager, args);
    for (const arg of args.items) body.push(this.pin(this.ensureApp(arg)));
    args.reset();
    return { index, head: this.ensureApp(manager.getArg(matrix, 1)) };
  }

  private hoistCompound(index: { value: number }, fml: number, body: number[]): number {
    const manager = this.manager;
    if (manager.isNot(fml))
      return manager.mkNot(this.hoistCompound(index, this.ensureApp(manager.getArg(fml, 0)), body));
    if (!this.context.isPredicate(fml)) return fml;
    const args = manager.getArgs(fml).map((arg) => {
      if (manager.kinds[arg] !== KIND_APP || manager.isValue(arg)) return arg;
      const variable = manager.mkVar(index.value++, manager.sorts[arg]);
      body.push(this.pin(manager.mkEq(variable, arg)));
      return variable;
    });
    return manager.mkApp(manager.decls[fml], args, SORT_BOOL);
  }

  ensureApp(expr: number) {
    const manager = this.manager;
    return manager.kinds[expr] === KIND_APP ? expr : manager.mkEq(expr, manager.trueExpr);
  }

  private checkValidHead(head: number) {
    const manager = this.manager;
    if (!this.context.isPredicate(head))
      throw new SmtTacticError(`Illegal head. The head predicate needs to be uninterpreted`);
    for (const arg of manager.getArgs(head))
      if (manager.kinds[arg] !== KIND_VAR && !manager.isValue(arg))
        throw new SmtTacticError("Illegal argument to predicate in head");
  }

  mk(
    head: number,
    tail: readonly number[],
    isNegated: readonly boolean[],
    name = "",
    isNormalizing = true,
  ) {
    const manager = this.manager;
    const size = tail.length;
    const entries: number[] = Array.from({ length: size }, () => -1);
    const negated: boolean[] = Array.from({ length: size }, () => false);
    let uninterpreted = 0;
    let interpreted = size;
    for (let index = 0; index < size; index++) {
      let current = tail[index];
      let isNeg = isNegated[index] ?? false;
      if (isNeg && !this.context.isPredicate(current)) {
        current = manager.mkNot(current);
        isNeg = false;
      }
      this.pin(current);
      if (this.context.isPredicate(current)) {
        entries[uninterpreted] = current;
        negated[uninterpreted++] = isNeg;
      } else {
        entries[--interpreted] = current;
        negated[interpreted] = false;
      }
    }
    let positive = 0;
    let end = uninterpreted;
    while (positive !== end) {
      if (!negated[positive]) {
        positive++;
        continue;
      }
      end--;
      [entries[positive], entries[end]] = [entries[end], entries[positive]];
      [negated[positive], negated[end]] = [negated[end], negated[positive]];
    }
    const rule = new Rule(this.pin(head), entries, negated, uninterpreted, positive, name);
    if (isNormalizing) this.normVars(rule);
    return rule;
  }

  mkFrom(source: Rule, head = source.head, name = source.name) {
    return new Rule(
      this.pin(head),
      [...source.tail],
      [...source.isNegated],
      source.uninterpretedSize,
      source.positiveSize,
      name,
    );
  }

  normVars(rule: Rule) {
    const manager = this.manager;
    const used = getRuleVars(manager, rule);
    if (used.every((sort) => sort !== undefined)) return;
    let next = 0;
    const substitution = used.map((sort) =>
      sort === undefined ? -1 : manager.mkVar(next++, sort),
    );
    const subst = new VarSubst(manager, false);
    rule.head = this.pin(this.ensureApp(subst.apply(rule.head, substitution)));
    for (let index = 0; index < rule.tail.length; index++)
      rule.tail[index] = this.pin(this.ensureApp(subst.apply(rule.tail[index], substitution)));
    subst.release();
  }

  substitute(rule: Rule, values: number[]) {
    const subst = new VarSubst(this.manager, false);
    const head = subst.apply(rule.head, values);
    const tail = rule.tail.map((literal) => subst.apply(literal, values));
    subst.release();
    return this.mk(head, tail, rule.isNegated, rule.name, false);
  }

  toFormula(rule: Rule) {
    const manager = this.manager;
    const body = rule.tail.map((literal, index) =>
      rule.isNegated[index] ? manager.mkNot(literal) : literal,
    );
    const matrix =
      body.length === 0
        ? rule.head
        : manager.mkApp(
            OP_IMPLIES,
            [body.length === 1 ? body[0] : manager.mkApp(OP_AND, body, SORT_BOOL), rule.head],
            SORT_BOOL,
          );
    const used = getUsedVars(manager, [matrix]);
    if (used.length === 0) return matrix;
    const sorts = used.map((sort) => sort ?? SORT_BOOL).reverse();
    return mkForall(
      manager,
      sorts,
      sorts.map((_, index) => getVarName(index)),
      matrix,
    );
  }

  hasQuantifiers(rule: Rule) {
    const manager = this.manager;
    for (let index = rule.uninterpretedSize; index < rule.tail.length; index++)
      if (manager.hasQuantifierFlags[rule.tail[index]]) return true;
    return false;
  }

  mkQuery(query: number, rules: RuleSet) {
    const manager = this.manager;
    const names: string[] = [];
    const sorts: number[] = [];
    const hoister = new QuantifierHoister(manager);
    let body = this.pin(
      hoister.pullQuantifierBound(false, this.context.bindVars(query, false), sorts, names),
    );
    hoister.release();
    let vars = getUsedVars(manager, [body]);
    while (vars.includes(undefined)) {
      let next = 0;
      const args = vars.map((sort) =>
        sort === undefined ? manager.mkVar(0, SORT_BOOL) : manager.mkVar(next++, sort),
      );
      const subst = new VarSubst(manager, false);
      body = this.pin(subst.apply(body, args));
      subst.release();
      vars = getUsedVars(manager, [body]);
    }
    if (manager.kinds[body] !== KIND_APP) throw new SmtTacticError("Query body is not well-formed");
    while (vars.length > names.length) names.push(String(names.length));
    const domain = (vars as number[]).slice().reverse();
    names.reverse();
    const queryPredicate = this.context.mkFreshHeadPredicate("query", "", domain);
    rules.setOutputPredicate(queryPredicate);
    const head = manager.mkApp(
      queryPredicate,
      domain.map((sort, index) => manager.mkVar(domain.length - index - 1, sort)),
      SORT_BOOL,
    );
    const implication = manager.mkApp(OP_IMPLIES, [body, head], SORT_BOOL);
    this.mkRule(
      domain.length === 0 ? implication : mkForall(manager, domain, names, implication),
      rules,
    );
    return queryPredicate;
  }

  fixUnboundVars(rule: Rule, isTryingQe: boolean) {
    const reduced = this.context.reduceUnboundVars(rule);
    const manager = this.manager;
    if (!this.context.isFixingUnboundVars()) return reduced;
    if (reduced.uninterpretedSize === reduced.tail.length) return reduced;
    const counted = getUsedVars(manager, [
      reduced.head,
      ...reduced.tail.slice(0, reduced.uninterpretedSize),
    ]);
    const tail = reduced.tail.slice(0, reduced.uninterpretedSize);
    const isNegated = reduced.isNegated.slice(0, reduced.uninterpretedSize);
    const unbound = new Set<number>();
    const withUnbound: number[] = [];
    for (let index = reduced.uninterpretedSize; index < reduced.tail.length; index++) {
      const literal = reduced.tail[index];
      let hasUnbound = false;
      getUsedVars(manager, [literal]).forEach((sort, varIndex) => {
        if (sort !== undefined && counted[varIndex] === undefined) {
          hasUnbound = true;
          unbound.add(varIndex);
        }
      });
      if (hasUnbound) withUnbound.push(literal);
      else {
        tail.push(literal);
        isNegated.push(false);
      }
    }
    if (withUnbound.length === 0) return reduced;
    const unboundTail = this.pin(manager.mkAnd(withUnbound));
    // Z3 numbers the substitution by the used variables only, so a gap in the indexes shifts it.
    const subst: number[] = [];
    const sorts: number[] = [];
    let quantifiedIndex = 0;
    getRuleVars(manager, reduced).forEach((sort, index) => {
      if (sort === undefined) return;
      if (unbound.has(index)) sorts.push(sort);
      subst.push(
        manager.mkVar(unbound.has(index) ? quantifiedIndex++ : index + unbound.size, sort),
      );
    });
    const varSubst = new VarSubst(manager, false);
    const preQuant = this.pin(varSubst.apply(unboundTail, subst));
    varSubst.release();
    sorts.reverse();
    const names = sorts.map((_, index) => String(sorts.length - 1 - index));
    const quantified = this.pin(mkExists(manager, sorts, names, preQuant));
    let fixed = isTryingQe ? this.pin(simplifyQuantifiers(manager, quantified)) : quantified;
    if (manager.kinds[fixed] !== KIND_APP) fixed = this.pin(manager.mkEq(fixed, manager.trueExpr));
    if (!manager.isTrue(fixed)) {
      tail.push(fixed);
      isNegated.push(false);
    }
    return this.mk(reduced.head, tail, isNegated, reduced.name);
  }
}

// rule_manager::to_formula names the variables A, B, ..., Z, A1, ...
const getVarName = (index: number) =>
  `${String.fromCharCode(65 + (index % 26))}${index < 26 ? "" : Math.floor(index / 26)}`;

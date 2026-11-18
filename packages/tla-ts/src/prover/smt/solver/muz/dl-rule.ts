import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  getSymbolName,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_IMPLIES,
  SORT_BOOL,
  QUANTIFIER_EXISTS,
  QUANTIFIER_FORALL,
} from "../ast";
import { flattenAndVector } from "../ast-util";
import { RefVector } from "../ref-vector";
import { DEFAULT_PRINT_OPTIONS, printExpr } from "../smt2-printer";
import { getFreeVarSorts, VarSubst } from "../var-subst";
import { simplifyQuantifiers } from "../qe";
import { QuantifierHoister } from "../quant-hoist";
import type { DatalogContext } from "./dl-context";
import { Hnf } from "./hnf";
import type { RuleSet } from "./dl-rule-set";

const PRINT_ENVIRONMENT = {
  options: DEFAULT_PRINT_OPTIONS,
  isUsed: () => false,
  isClashing: () => false,
};

export const mkPp = (manager: AstManager, expr: number) =>
  printExpr(manager, PRINT_ENVIRONMENT, expr);

// output_predicate of src/muz/base/dl_util.cpp.
const outputPredicate = (manager: AstManager, predicate: number) =>
  `${getSymbolName(manager.funcDecls[manager.decls[predicate]].name)}(${manager
    .getArgs(predicate)
    .map((arg) =>
      manager.kinds[arg] === KIND_VAR ? `#${manager.values[arg]}` : mkPp(manager, arg),
    )
    .join(",")})`;

// The tail lists the positive predicates, then the negated ones, then the interpreted formulas.
export class Rule {
  constructor(
    public head: number,
    readonly tail: number[],
    readonly isNegated: boolean[],
    readonly uninterpretedSize: number,
    readonly positiveSize: number,
    readonly name: string | undefined,
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

  // symbol::str of the name, where undefined is the null symbol.
  getNameText() {
    return this.name ?? "<null>";
  }

  display(context: DatalogContext) {
    const manager = context.manager;
    const head = `${this.getNameText()}:\n${outputPredicate(manager, this.head)}`;
    if (this.tail.length === 0) return `${head}.\n`;
    const tail = this.tail.map(
      (literal, index) =>
        `\n ${this.isNegated[index] ? "not " : ""}${
          context.isPredicate(literal) ? outputPredicate(manager, literal) : mkPp(manager, literal)
        }`,
    );
    return `${head} :- ${tail.join(",")}.\n`;
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
    kind: QUANTIFIER_FORALL,
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
    kind: QUANTIFIER_EXISTS,
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
    const todo: number[] = [];
    // The arguments of an application are abstracted last to first, as Z3's stack pops them.
    const abstract = (term: number, scope: number, cache: Map<number, number>): number => {
      const size = todo.length;
      todo.push(term);
      while (todo.length > size) {
        const current = todo[todo.length - 1];
        if (cache.has(current)) {
          todo.pop();
          continue;
        }
        const kind = manager.kinds[current];
        if (kind === KIND_VAR) cache.set(current, current);
        else if (kind === KIND_QUANTIFIER) {
          const data = manager.getQuantifier(current);
          const innerScope = scope + data.sorts.length;
          const innerCache = new Map<number, number>();
          const patterns = data.patterns.map((pattern) =>
            abstract(pattern, innerScope, innerCache),
          );
          cache.set(
            current,
            manager.mkQuantifier({
              ...data,
              patterns,
              body: abstract(data.body, innerScope, innerCache),
            }),
          );
        } else if (this.vars.includes(current)) {
          const existing =
            bound.get(current) ??
            (() => {
              const variable = manager.mkVar(names.length, manager.sorts[current]);
              names.push(manager.getDeclName(current));
              sorts.push(manager.sorts[current]);
              bound.set(current, variable);
              return variable;
            })();
          cache.set(
            current,
            scope === 0
              ? existing
              : manager.mkVar(scope + manager.values[existing], manager.sorts[existing]),
          );
        } else {
          const args: number[] = [];
          let isAllVisited = true;
          for (const arg of manager.getArgs(current)) {
            const abstracted = cache.get(arg);
            if (abstracted === undefined) {
              todo.push(arg);
              isAllVisited = false;
            } else if (isAllVisited) args.push(abstracted);
          }
          if (!isAllVisited) continue;
          cache.set(
            current,
            args.every((arg, index) => arg === manager.getArg(current, index))
              ? current
              : manager.mkApp(manager.decls[current], args, manager.sorts[current]),
          );
        }
        todo.pop();
      }
      return cache.get(term) ?? term;
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

  mkRule(fml: number, rules: RuleSet, name?: string) {
    const bound = this.context.bindVars(fml, true);
    if (this.manager.hasLabelFlags[bound]) throw new SmtUnsupportedError("labels in Horn rules");
    this.mkRuleCore(bound, rules, name);
  }

  private mkRuleCore(fml: number, rules: RuleSet, name: string | undefined) {
    this.hnf.setName(name);
    const fmls = this.hnf.apply(fml);
    for (const predicate of this.hnf.freshPredicates) this.context.registerPredicate(predicate);
    for (const horn of fmls) this.mkHornRule(horn, rules, name);
  }

  private mkHornRule(fml: number, rules: RuleSet, name: string | undefined) {
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
      manager.kinds[fml] === KIND_QUANTIFIER &&
      manager.getQuantifier(fml).kind === QUANTIFIER_FORALL
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
    name?: string,
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
      sorts.map((_value, index) => getVarName(index)),
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
    this.context.addGenericModelConverter([{ decl: queryPredicate, def: -1 }]);
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
    const names = sorts.map((_value, index) => String(sorts.length - 1 - index));
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

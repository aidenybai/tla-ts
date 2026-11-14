// Ported from Z3 (src/muz/base/dl_context.cpp, src/muz/base/dl_engine_base.h), MIT license, see
// z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_DATATYPE,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  SORT_BOOL,
  SORT_SIZE_INFINITE,
} from "../ast";
import { type RewriterOptions, Rewriter } from "../rewriter";
import { RefVector } from "../ref-vector";
import { applyQeLiteToConjuncts } from "../qe-lite";
import { BindVariables, mkExists, type Rule, RuleManager, getUsedVars } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { RuleProperties } from "./rule-properties";

const ENGINE_DATALOG = 0;
export const ENGINE_SPACER = 1;
const ENGINE_BMC = 2;
const ENGINE_QBMC = 3;
const ENGINE_TAB = 4;
const ENGINE_CLP = 5;
const ENGINE_DDNF = 6;
const ENGINE_LAST = 7;

const ENGINE_NAMES = new Map([
  ["datalog", ENGINE_DATALOG],
  ["spacer", ENGINE_SPACER],
  ["bmc", ENGINE_BMC],
  ["qbmc", ENGINE_QBMC],
  ["tab", ENGINE_TAB],
  ["clp", ENGINE_CLP],
  ["ddnf", ENGINE_DDNF],
]);

// The fp module's parameters, which Z3 keeps as global parameters across resets.
export class FpParams {
  constructor(private parameters: ReadonlyMap<string, string>) {}

  getBool(name: string, defaultValue: boolean) {
    const value = this.parameters.get(`fp.${name}`);
    return value === undefined ? defaultValue : value === "true";
  }

  getUint(name: string, defaultValue: number) {
    const value = this.parameters.get(`fp.${name}`);
    return value === undefined ? defaultValue : Number(value);
  }

  getSymbol(name: string, defaultValue: string) {
    return this.parameters.get(`fp.${name}`) ?? defaultValue;
  }
}

export interface Engine {
  query(query: number): number;
}

type EngineFactory = (context: DatalogContext, engine: number) => Engine;

export class DatalogContext {
  readonly ruleManager: RuleManager;
  private ruleProperties: RuleProperties;
  private preds = new Set<number>();
  private bindVariables: BindVariables;
  private isBindingVariables = true;
  ruleSet: RuleSet;
  private ruleFmls: number[] = [];
  private ruleNames: string[] = [];
  private ruleFmlsHead = 0;
  readonly background: number[] = [];
  private isClosed = false;
  private engineType = ENGINE_LAST;
  private engine: Engine | undefined;
  readonly rewriter: Rewriter;
  hasModelConverter = false;

  constructor(
    readonly manager: AstManager,
    readonly params: FpParams,
    rewriterOptions: RewriterOptions,
    private engineFactory: EngineFactory,
  ) {
    this.ruleManager = new RuleManager(manager, this);
    this.ruleProperties = new RuleProperties(this);
    this.bindVariables = new BindVariables(manager);
    this.ruleSet = new RuleSet(this);
    this.rewriter = new Rewriter(manager, rewriterOptions);
  }

  // th_rewriter: the result comes with a reference.
  simplify(expr: number) {
    return this.rewriter.rewrite(expr);
  }

  isFixingUnboundVars() {
    return this.params.getBool("xform.fix_unbound_vars", false);
  }

  registerPredicate(decl: number) {
    if (this.preds.has(decl)) return;
    this.manager.incDeclRef(decl);
    this.preds.add(decl);
  }

  isPredicateDecl(decl: number) {
    return this.preds.has(decl);
  }

  isPredicate(expr: number) {
    return this.manager.kinds[expr] === KIND_APP && this.preds.has(this.manager.decls[expr]);
  }

  mkFreshHeadPredicate(prefix: string, suffix: string, domain: number[]) {
    const decl = this.manager.mkFreshFuncDecl(prefix, domain, SORT_BOOL, true, suffix);
    this.registerPredicate(decl);
    return decl;
  }

  registerVariable(variable: number) {
    this.bindVariables.addVar(variable);
  }

  bindVars(fml: number, isForall: boolean) {
    return this.isBindingVariables ? this.bindVariables.apply(fml, isForall) : fml;
  }

  withoutBindingVariables<T>(body: () => T) {
    const saved = this.isBindingVariables;
    this.isBindingVariables = false;
    const result = body();
    this.isBindingVariables = saved;
    return result;
  }

  addRule(fml: number, name = "") {
    this.manager.incRef(fml);
    this.ruleFmls.push(fml);
    this.ruleNames.push(name);
  }

  assertExpr(expr: number) {
    this.manager.incRef(expr);
    this.background.push(expr);
  }

  flushAddRules() {
    while (this.ruleFmlsHead < this.ruleFmls.length) {
      this.ruleManager.mkRule(
        this.ruleFmls[this.ruleFmlsHead],
        this.ruleSet,
        this.ruleNames[this.ruleFmlsHead],
      );
      this.ruleFmlsHead++;
    }
    this.checkRules(this.ruleSet);
  }

  getRules() {
    this.flushAddRules();
    return this.ruleSet;
  }

  isMonotone() {
    return this.ruleProperties.isMonotone;
  }

  private checkRules(rules: RuleSet) {
    const properties = this.ruleProperties;
    switch (this.getEngine()) {
      case ENGINE_DATALOG:
        throw new SmtUnsupportedError("the datalog engine");
      case ENGINE_SPACER:
        properties.collect(rules);
        properties.checkExistentialTail();
        properties.checkForNegatedPredicates();
        properties.checkUninterpretedFree();
        properties.checkExistsFree();
        properties.checkBackgroundFree();
        break;
      case ENGINE_BMC:
        properties.collect(rules);
        properties.checkForNegatedPredicates();
        break;
      default:
        throw new SmtUnsupportedError("the qbmc, tab, clp and ddnf engines");
    }
  }

  ensureClosed() {
    if (this.isClosed) return;
    if (!this.ruleSet.close()) throw new SmtTacticError("Negation is not stratified!");
    this.isClosed = true;
  }

  ensureOpened() {
    if (!this.isClosed) return;
    this.reopen();
  }

  reopen() {
    this.ruleSet.reopen();
    this.isClosed = false;
  }

  replaceRules(rules: RuleSet) {
    this.ruleSet.replaceRules(rules);
  }

  getEngine(query = -1) {
    this.configureEngine(query);
    return this.engineType;
  }

  private configureEngine(query: number) {
    if (this.engineType !== ENGINE_LAST) return;
    const name = this.params.getSymbol("engine", "auto-config");
    const named = ENGINE_NAMES.get(name);
    if (named === undefined && name !== "auto-config")
      throw new SmtTacticError("unsupported datalog engine type");
    if (named !== undefined) {
      this.engineType = named;
      return;
    }
    const visited = new Set<number>();
    let engine = ENGINE_DATALOG;
    const visit = (root: number) => {
      const manager = this.manager;
      const todo = [root];
      for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
        if (visited.has(expr)) continue;
        visited.add(expr);
        if (this.isSpacerTerm(expr)) engine = ENGINE_SPACER;
        if (manager.kinds[expr] === KIND_APP) manager.pushArgs(expr, todo);
        else if (manager.kinds[expr] === KIND_QUANTIFIER)
          todo.push(manager.getQuantifier(expr).body);
      }
    };
    if (query !== -1) visit(query);
    for (const rule of this.ruleSet.rules) {
      if (engine !== ENGINE_DATALOG) break;
      visit(rule.head);
      for (const literal of rule.tail) visit(literal);
    }
    for (
      let index = this.ruleFmlsHead;
      engine === ENGINE_DATALOG && index < this.ruleFmls.length;
      index++
    ) {
      let fml = this.ruleFmls[index];
      while (this.manager.kinds[fml] === KIND_QUANTIFIER)
        fml = this.manager.getQuantifier(fml).body;
      visit(fml);
    }
    this.engineType = engine;
  }

  // engine_type_proc
  private isSpacerTerm(expr: number) {
    const manager = this.manager;
    const sort = manager.sorts[expr];
    if (manager.getSortFamily(sort) === FAMILY_ARITH) return true;
    if (manager.kinds[expr] === KIND_VAR && sort === SORT_BOOL) return true;
    if (manager.getSortFamily(sort) === FAMILY_DATATYPE) return true;
    const isLargeBv =
      (manager.isBvSort(sort) && manager.getBvSize(sort) > 24) ||
      (manager.kinds[expr] === KIND_APP &&
        manager
          .getArgs(expr)
          .reduce(
            (size, arg) =>
              manager.isBvSort(manager.sorts[arg])
                ? size + manager.getBvSize(manager.sorts[arg])
                : size,
            0,
          ) > 24);
    if (isLargeBv) return true;
    return manager.getSortSize(sort) === SORT_SIZE_INFINITE || manager.isArraySort(sort);
  }

  private ensureEngine(query = -1) {
    this.engine ??= this.engineFactory(this, this.getEngine(query));
    return this.engine;
  }

  query(query: number) {
    this.hasModelConverter = true;
    this.getEngine(query);
    this.flushAddRules();
    return this.ensureEngine(query).query(query);
  }

  // engine_base::query over one relation.
  relQuery(relation: number) {
    const manager = this.manager;
    const engine = this.ensureEngine();
    const domain = manager.funcDecls[relation].domain;
    const atom = manager.mkApp(
      relation,
      domain.map((sort, index) => manager.mkVar(index, sort)),
      SORT_BOOL,
    );
    const query =
      domain.length === 0
        ? atom
        : mkExists(
            manager,
            [...domain].reverse(),
            domain.map((_, index) => String(index)).reverse(),
            atom,
          );
    manager.incRef(query);
    return engine.query(query);
  }

  // rule_manager::reduce_unbound_vars: qe_lite eliminates the variables of the interpreted tail
  // that the head and the predicates leave unbound.
  reduceUnboundVars(rule: Rule) {
    const manager = this.manager;
    if (rule.uninterpretedSize === rule.tail.length) return rule;
    const bound = getUsedVars(manager, [rule.head, ...rule.tail.slice(0, rule.uninterpretedSize)]);
    const indexSet = new Set<number>();
    bound.forEach((sort, index) => {
      if (sort !== undefined) indexSet.add(index);
    });
    const conjs = new RefVector(manager);
    for (const literal of rule.tail.slice(rule.uninterpretedSize)) conjs.push(literal);
    applyQeLiteToConjuncts(manager, (index) => !indexSet.has(index), conjs);
    const interpreted = rule.tail.slice(rule.uninterpretedSize);
    const isChanged =
      conjs.size !== interpreted.length ||
      conjs.items.some((conj, index) => conj !== interpreted[index]);
    if (!isChanged) {
      conjs.reset();
      return rule;
    }
    const tail = [
      ...rule.tail.slice(0, rule.uninterpretedSize),
      ...conjs.items.map((conj) => this.ruleManager.ensureApp(conj)),
    ];
    const isNegated = tail.map(
      (_, index) => index < rule.uninterpretedSize && rule.isNegated[index],
    );
    const reduced = this.ruleManager.mk(rule.head, tail, isNegated, rule.name);
    conjs.reset();
    return reduced;
  }
}

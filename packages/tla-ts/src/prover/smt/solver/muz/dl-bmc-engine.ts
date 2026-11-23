import { SmtInvariantError, SmtUnsupportedError } from "../../../../errors";
import { type AstManager, getSymbolName, OP_IMPLIES, SORT_BOOL } from "../ast";
import { MBQI_MAX_ITERATIONS } from "../context";
import { assign, assignOwned, release } from "../expr-ref";
import { FdSolver } from "../fd-solver";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import { RefVector } from "../ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../rewriter";
import { UINT_MAX } from "../sat/clause";
import { getGlobalSmtParams, SmtKernel } from "../smt-kernel";
import type { KernelParams } from "../solver";
import { getSatParams } from "../tactic";
import { VarSubst } from "../var-subst";
import type { DatalogContext, Engine } from "./dl-context";
import { RuleUnifier } from "./dl-mk-rule-inliner";
import { MkSlice } from "./dl-mk-slice";
import type { Rule } from "./dl-rule";
import { RuleSet } from "./dl-rule-set";
import { applyDefaultTransformation, transformRules } from "./dl-rule-transformer";
import { NamedDecls } from "./spacer-util";

type BmcSolver =
  | { kind: "smt"; kernel: SmtKernel; params: KernelParams }
  | { kind: "fd"; solver: FdSolver };

const applySubst = (manager: AstManager, target: RefVector, sub: RefVector) => {
  const subst = new VarSubst(manager, false);
  for (let index = 0; index < target.size; index++) {
    const expr = target.items[index];
    if (expr !== -1) target.setOwned(index, subst.apply(expr, sub.items));
    else target.set(index, sub.items[index]);
  }
  for (let index = target.size; index < sub.size; index++) target.push(sub.items[index]);
  subst.release();
};

const releaseBmcSolver = (solver: BmcSolver) => {
  if (solver.kind === "fd") solver.solver.release();
  else solver.kernel.release();
};

export class Bmc implements Engine {
  private solver: BmcSolver | undefined;
  readonly rules: RuleSet;
  readonly decls: NamedDecls;
  queryPred = -1;

  constructor(readonly context: DatalogContext) {
    this.rules = new RuleSet(context);
    this.decls = new NamedDecls(context.manager);
  }

  release() {
    this.rules.reset();
    if (this.solver !== undefined) releaseBmcSolver(this.solver);
  }

  query(query: number) {
    const context = this.context;
    if (this.solver !== undefined) releaseBmcSolver(this.solver);
    this.solver = undefined;
    context.ensureOpened();
    this.rules.reset();
    const oldRules = RuleSet.copy(context.getRules());
    try {
      context.ruleManager.mkQuery(query, context.getRules());
      applyDefaultTransformation(context);
      if (context.params.getBool("xform.slice", true))
        transformRules(context, [new MkSlice(context)]);
      const rules = context.getRules();
      if (rules.outputPredicates.size === 0) return L_FALSE;
      this.queryPred = rules.getOutputPredicate();
      this.rules.replaceRules(rules);
      this.rules.close();
      context.reopen();
      context.replaceRules(oldRules);
      this.checkpoint();
      if (this.rules.rules.length === 0) return L_FALSE;
      if (this.rules.getPredicateRules(this.queryPred).length === 0) return L_FALSE;
      if (!this.isLinear()) throw new SmtUnsupportedError("the nonlinear bmc engine");
      const solver = this.mkSolver();
      this.solver = solver;
      return new Linear(this, solver).check();
    } finally {
      oldRules.reset();
    }
  }

  private mkSolver(): BmcSolver {
    const manager = this.context.manager;
    const parameters = this.context.parameters;
    if (this.rules.isFiniteDomain())
      return { kind: "fd", solver: new FdSolver(manager, getSatParams(parameters), parameters) };
    const params = {
      isMbqi: true,
      mbqiMaxIterations: MBQI_MAX_ITERATIONS,
      isFindingMacros: false,
      ...getGlobalSmtParams(parameters),
    };
    return { kind: "smt", kernel: new SmtKernel(manager, params), params };
  }

  getModel() {
    return undefined;
  }

  private isLinear() {
    for (const rule of this.rules.rules) {
      if (rule.uninterpretedSize > 1) return false;
      if (this.context.ruleManager.hasQuantifiers(rule)) return false;
    }
    return true;
  }

  checkpoint() {
    this.context.manager.limit.checkpoint();
  }
}

class Linear {
  constructor(
    private bmc: Bmc,
    private solver: BmcSolver,
  ) {}

  check() {
    this.setup();
    const maxDepth = this.bmc.context.params.getUint("bmc.linear_unrolling_depth", UINT_MAX);
    for (let level = 0; level < maxDepth; level++) {
      this.bmc.checkpoint();
      this.compile(level);
      const result = this.checkLevel(level);
      if (result === L_UNDEF) return result;
      if (result === L_TRUE) {
        this.getModel(level);
        return result;
      }
    }
    return L_UNDEF;
  }

  private getModel(level: number) {
    const bmc = this.bmc;
    const context = bmc.context;
    const manager = context.manager;
    if (!manager.limit.inc()) return;
    const ruleManager = context.ruleManager;
    const unifier = new RuleUnifier(context);
    const solver = this.solver;
    const model =
      solver.kind === "fd" ? solver.solver.getModel() : solver.kernel.context.getSatModel();
    if (model === undefined) throw new SmtInvariantError("a sat answer without a model");
    let pred = bmc.queryPred;
    let resolved: Rule | undefined;
    let resolvent: Rule | undefined;
    let substituted: Rule | undefined;
    for (let current = level; ; current--) {
      const sub = new RefVector(manager);
      const rules = bmc.rules.getPredicateRules(pred);
      let index = 0;
      for (; index < rules.length; index++) {
        const ruleConst = assign(manager, -1, this.mkLevelRule(pred, index, current));
        const value = model.constInterps.get(manager.decls[ruleConst]);
        release(manager, ruleConst);
        if (value !== undefined && manager.isTrue(value)) break;
      }
      const rule = rules[index];
      this.mkRuleVars(rule, current, index, sub);
      for (let position = 0; position < sub.size; position++) {
        const variable = sub.items[position];
        sub.set(
          position,
          model.constInterps.get(manager.decls[variable]) ??
            manager.mkVar(position, manager.sorts[variable]),
        );
      }
      substituted = ruleManager.assignRule(substituted, rule);
      substituted = ruleManager.assignRule(
        substituted,
        ruleManager.substitute(substituted, sub.items),
      );
      if (resolved === undefined) resolved = ruleManager.assignRule(resolved, substituted);
      else {
        unifier.unifyRules(resolved, 0, substituted);
        // Z3 builds these substitutions only for its proof, but they create terms and cost rlimit.
        const targetSubst = unifier.getRuleSubst(resolved, true);
        const sourceSubst = unifier.getRuleSubst(substituted, false);
        applySubst(manager, sub, sourceSubst);
        const applied = unifier.apply(resolved, 0, substituted).rule;
        resolvent = ruleManager.assignRule(resolvent, applied);
        ruleManager.decRef(applied);
        resolved = ruleManager.assignRule(resolved, resolvent);
        sourceSubst.reset();
        targetSubst.reset();
      }
      sub.reset();
      if (current === 0) break;
      pred = rule.getTailDecl(manager, 0);
    }
    if (substituted !== undefined) ruleManager.decRef(substituted);
    if (resolvent !== undefined) ruleManager.decRef(resolvent);
    if (resolved !== undefined) ruleManager.decRef(resolved);
    unifier.release();
  }

  // Z3 quirk: setup names smt.relevancy and smt.mbqi with their module, so the solver keeps both.
  private setup() {
    const solver = this.solver;
    if (solver.kind === "smt") solver.kernel.updateParams(solver.params);
  }

  private checkLevel(level: number) {
    const manager = this.bmc.context.manager;
    const assumption = assign(manager, -1, this.mkLevelPredicate(this.bmc.queryPred, level));
    const solver = this.solver;
    const result =
      solver.kind === "fd" ? solver.solver.check([assumption]) : solver.kernel.check([assumption]);
    // solver::check_sat counts a step to see whether the limit stopped a search that gave up.
    if (solver.kind === "smt" && result === L_UNDEF) manager.limit.inc();
    release(manager, assumption);
    return result;
  }

  private assertExpr(expr: number) {
    const solver = this.solver;
    if (solver.kind === "fd") solver.solver.assertExpr(expr);
    else solver.kernel.assertExpr(expr);
  }

  private getName(decl: number) {
    return getSymbolName(this.bmc.context.manager.funcDecls[decl].name);
  }

  private mkConst(name: string, sort: number) {
    return this.bmc.context.manager.mkApp(this.bmc.decls.mkFuncDecl(name, [], sort), [], sort);
  }

  private mkLevelPredicate(pred: number, level: number) {
    return this.mkConst(`${this.getName(pred)}#${level}`, SORT_BOOL);
  }

  private mkLevelArg(pred: number, index: number, level: number) {
    const domain = this.bmc.context.manager.funcDecls[pred].domain;
    return this.mkConst(`${this.getName(pred)}#${level}_${index}`, domain[index]);
  }

  private mkLevelVar(pred: number, sort: number, ruleId: number, index: number, level: number) {
    return this.mkConst(`${this.getName(pred)}#${level}_${ruleId}_${index}`, sort);
  }

  private mkLevelRule(pred: number, ruleIndex: number, level: number) {
    return this.mkConst(`rule:${this.getName(pred)}#${level}_${ruleIndex}`, SORT_BOOL);
  }

  private mkRuleVars(rule: Rule, level: number, ruleId: number, sub: RefVector) {
    const manager = this.bmc.context.manager;
    const sorts = rule.getVars(manager);
    sub.reset();
    sub.resize(sorts.length);
    const decl = rule.getDecl(manager);
    manager.getArgs(rule.head).forEach((arg, index) => {
      if (manager.isVar(arg) && sub.items[manager.values[arg]] === -1)
        sub.set(manager.values[arg], this.mkLevelArg(decl, index, level));
    });
    for (let tailIndex = 0; tailIndex < rule.uninterpretedSize; tailIndex++) {
      const pred = rule.getTailDecl(manager, tailIndex);
      manager.getArgs(rule.tail[tailIndex]).forEach((arg, index) => {
        if (manager.isVar(arg) && sub.items[manager.values[arg]] === -1)
          sub.set(manager.values[arg], this.mkLevelArg(pred, index, level - 1));
      });
    }
    let next = 0;
    sorts.forEach((sort, index) => {
      if (sub.items[index] === -1)
        sub.set(index, this.mkLevelVar(decl, sort, ruleId, next++, level));
    });
  }

  private compile(level: number) {
    const bmc = this.bmc;
    const manager = bmc.context.manager;
    const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    for (const pred of bmc.rules.getGroupedPredicates()) {
      const levelPred = assign(manager, -1, this.mkLevelPredicate(pred, level));
      const ruleConsts = new RefVector(manager);
      const sub = new RefVector(manager);
      const conjs = new RefVector(manager);
      let ruleBody = -1;
      let tmp = -1;
      const predicateRules = bmc.rules.getPredicateRules(pred);
      for (let index = 0; index < predicateRules.length; index++) {
        const rule = predicateRules[index];
        sub.reset();
        conjs.reset();
        const ruleConst = assign(manager, -1, this.mkLevelRule(pred, index, level));
        ruleConsts.push(ruleConst);
        if (level === 0 && rule.uninterpretedSize > 0) {
          tmp = assign(manager, tmp, manager.mkNot(ruleConst));
          this.assertExpr(tmp);
          release(manager, ruleConst);
          continue;
        }
        this.mkRuleVars(rule, level, index, sub);
        const subst = new VarSubst(manager, false);
        const headArgs = manager.getArgs(rule.head);
        for (let argIndex = 0; argIndex < headArgs.length; argIndex++) {
          tmp = assignOwned(manager, tmp, subst.apply(headArgs[argIndex], sub.items));
          conjs.push(manager.mkEq(tmp, this.mkLevelArg(pred, argIndex, level)));
        }
        for (let tailIndex = 0; tailIndex < rule.uninterpretedSize; tailIndex++) {
          const tailPred = rule.getTailDecl(manager, tailIndex);
          const tailArgs = manager.getArgs(rule.tail[tailIndex]);
          for (let argIndex = 0; argIndex < tailArgs.length; argIndex++) {
            tmp = assignOwned(manager, tmp, subst.apply(tailArgs[argIndex], sub.items));
            conjs.push(manager.mkEq(tmp, this.mkLevelArg(tailPred, argIndex, level - 1)));
          }
          conjs.push(this.mkLevelPredicate(tailPred, level - 1));
        }
        for (let tailIndex = rule.uninterpretedSize; tailIndex < rule.tail.length; tailIndex++) {
          tmp = assignOwned(manager, tmp, subst.apply(rule.tail[tailIndex], sub.items));
          conjs.push(tmp);
        }
        ruleBody = assign(manager, ruleBody, rewriter.mkAnd(conjs.items));
        ruleBody = assign(
          manager,
          ruleBody,
          manager.mkApp(OP_IMPLIES, [ruleConst, ruleBody], SORT_BOOL),
        );
        this.assertExpr(ruleBody);
        subst.release();
        release(manager, ruleConst);
      }
      tmp = assign(manager, tmp, rewriter.mkOr(ruleConsts.items));
      tmp = assign(manager, tmp, manager.mkApp(OP_IMPLIES, [levelPred, tmp], SORT_BOOL));
      this.assertExpr(tmp);
      release(manager, tmp);
      release(manager, ruleBody);
      conjs.reset();
      sub.reset();
      ruleConsts.reset();
      release(manager, levelPred);
    }
    rewriter.release();
  }
}

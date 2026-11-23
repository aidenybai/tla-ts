import { SmtInvariantError, SmtUnsupportedError } from "../../../../errors";
import { type AstManager, getSymbolName, OP_IMPLIES, SORT_BOOL } from "../ast";
import { MBQI_MAX_ITERATIONS } from "../context";
import { FdSolver } from "../fd-solver";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
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
import { NamedDecls, pin } from "./spacer-util";

type BmcSolver =
  | { kind: "smt"; kernel: SmtKernel; params: KernelParams }
  | { kind: "fd"; solver: FdSolver };

const applySubst = (manager: AstManager, target: number[], sub: number[]) => {
  const subst = new VarSubst(manager, false);
  for (let index = 0; index < target.length; index++)
    target[index] = subst.apply(target[index], sub);
  subst.release();
};

export class Bmc implements Engine {
  readonly rules: RuleSet;
  readonly decls: NamedDecls;
  queryPred = -1;

  constructor(readonly context: DatalogContext) {
    this.rules = new RuleSet(context);
    this.decls = new NamedDecls(context.manager);
  }

  query(query: number) {
    const context = this.context;
    context.ensureOpened();
    this.rules.reset();
    const oldRules = RuleSet.copy(context.getRules());
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
    const manager = context.manager;
    const parameters = context.parameters;
    if (this.rules.isFiniteDomain())
      return new Linear(this, {
        kind: "fd",
        solver: new FdSolver(manager, getSatParams(parameters), parameters),
      }).check();
    const params = {
      isMbqi: true,
      mbqiMaxIterations: MBQI_MAX_ITERATIONS,
      isFindingMacros: false,
      ...getGlobalSmtParams(parameters),
    };
    return new Linear(this, {
      kind: "smt",
      kernel: new SmtKernel(manager, params),
      params,
    }).check();
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
    const unifier = new RuleUnifier(context);
    const solver = this.solver;
    const model =
      solver.kind === "fd" ? solver.solver.getModel() : solver.kernel.context.getSatModel();
    if (model === undefined) throw new SmtInvariantError("a sat answer without a model");
    let pred = bmc.queryPred;
    let previous: Rule | undefined;
    for (let current = level; ; current--) {
      const rules = bmc.rules.getPredicateRules(pred);
      let index = 0;
      for (; index < rules.length; index++) {
        const value = model.constInterps.get(manager.decls[this.mkLevelRule(pred, index, current)]);
        if (value !== undefined && manager.isTrue(value)) break;
      }
      const rule = rules[index];
      const sub = this.mkRuleVars(rule, current, index);
      for (let position = 0; position < sub.length; position++)
        sub[position] =
          model.constInterps.get(manager.decls[sub[position]]) ??
          pin(manager, manager.mkVar(position, manager.sorts[sub[position]]));
      const substituted = context.ruleManager.substitute(rule, sub);
      if (previous === undefined) previous = substituted;
      else {
        unifier.unifyRules(previous, 0, substituted);
        // Z3 builds these substitutions only for its proof, but they create terms and cost rlimit.
        unifier.getRuleSubst(previous, true);
        applySubst(manager, sub, unifier.getRuleSubst(substituted, false));
        previous = unifier.apply(previous, 0, substituted).rule;
      }
      if (current === 0) break;
      pred = rule.getTailDecl(manager, 0);
    }
  }

  private setup() {
    const solver = this.solver;
    if (solver.kind === "smt")
      solver.kernel.updateParams({
        ...solver.params,
        ...getGlobalSmtParams(this.bmc.context.parameters, 0),
        isMbqi: false,
      });
  }

  private checkLevel(level: number) {
    const assumption = this.mkLevelPredicate(this.bmc.queryPred, level);
    const solver = this.solver;
    if (solver.kind === "fd") return solver.solver.check([assumption]);
    const result = solver.kernel.check([assumption]);
    // solver::check_sat counts a step to see whether the limit stopped a search that gave up.
    if (result === L_UNDEF) this.bmc.context.manager.limit.inc();
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

  private mkLevelPredicate(pred: number, level: number) {
    return this.bmc.decls.mkConst(`${this.getName(pred)}#${level}`, SORT_BOOL);
  }

  private mkLevelArg(pred: number, index: number, level: number) {
    const domain = this.bmc.context.manager.funcDecls[pred].domain;
    return this.bmc.decls.mkConst(`${this.getName(pred)}#${level}_${index}`, domain[index]);
  }

  private mkLevelVar(pred: number, sort: number, ruleId: number, index: number, level: number) {
    return this.bmc.decls.mkConst(`${this.getName(pred)}#${level}_${ruleId}_${index}`, sort);
  }

  private mkLevelRule(pred: number, ruleIndex: number, level: number) {
    return this.bmc.decls.mkConst(`rule:${this.getName(pred)}#${level}_${ruleIndex}`, SORT_BOOL);
  }

  private mkRuleVars(rule: Rule, level: number, ruleId: number) {
    const manager = this.bmc.context.manager;
    const sorts = rule.getVars(manager);
    const sub = sorts.map(() => -1);
    const decl = rule.getDecl(manager);
    manager.getArgs(rule.head).forEach((arg, index) => {
      if (manager.isVar(arg) && sub[manager.values[arg]] === -1)
        sub[manager.values[arg]] = this.mkLevelArg(decl, index, level);
    });
    for (let tailIndex = 0; tailIndex < rule.uninterpretedSize; tailIndex++) {
      const pred = rule.getTailDecl(manager, tailIndex);
      manager.getArgs(rule.tail[tailIndex]).forEach((arg, index) => {
        if (manager.isVar(arg) && sub[manager.values[arg]] === -1)
          sub[manager.values[arg]] = this.mkLevelArg(pred, index, level - 1);
      });
    }
    let next = 0;
    sorts.forEach((sort, index) => {
      if (sub[index] === -1) sub[index] = this.mkLevelVar(decl, sort, ruleId, next++, level);
    });
    return sub;
  }

  private compile(level: number) {
    const bmc = this.bmc;
    const manager = bmc.context.manager;
    const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    for (const pred of bmc.rules.getGroupedPredicates()) {
      const levelPred = this.mkLevelPredicate(pred, level);
      const ruleConsts: number[] = [];
      bmc.rules.getPredicateRules(pred).forEach((rule, index) => {
        const ruleConst = this.mkLevelRule(pred, index, level);
        ruleConsts.push(ruleConst);
        if (level === 0 && rule.uninterpretedSize > 0) {
          this.assertExpr(pin(manager, manager.mkNot(ruleConst)));
          return;
        }
        const sub = this.mkRuleVars(rule, level, index);
        const subst = new VarSubst(manager, false);
        const conjs: number[] = [];
        manager.getArgs(rule.head).forEach((arg, argIndex) => {
          const substituted = subst.apply(arg, sub);
          conjs.push(
            pin(manager, manager.mkEq(substituted, this.mkLevelArg(pred, argIndex, level))),
          );
        });
        for (let tailIndex = 0; tailIndex < rule.uninterpretedSize; tailIndex++) {
          const tailPred = rule.getTailDecl(manager, tailIndex);
          manager.getArgs(rule.tail[tailIndex]).forEach((arg, argIndex) => {
            const substituted = subst.apply(arg, sub);
            conjs.push(
              pin(
                manager,
                manager.mkEq(substituted, this.mkLevelArg(tailPred, argIndex, level - 1)),
              ),
            );
          });
          conjs.push(this.mkLevelPredicate(tailPred, level - 1));
        }
        for (let tailIndex = rule.uninterpretedSize; tailIndex < rule.tail.length; tailIndex++)
          conjs.push(subst.apply(rule.tail[tailIndex], sub));
        subst.release();
        const body = pin(manager, rewriter.mkAnd(conjs));
        this.assertExpr(pin(manager, manager.mkApp(OP_IMPLIES, [ruleConst, body], SORT_BOOL)));
      });
      const disjunction = pin(manager, rewriter.mkOr(ruleConsts));
      this.assertExpr(pin(manager, manager.mkApp(OP_IMPLIES, [levelPred, disjunction], SORT_BOOL)));
    }
    rewriter.release();
  }
}

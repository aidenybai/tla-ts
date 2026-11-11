// Ported from Z3 (src/qe/qsat.cpp), MIT license, see z3-license.txt.
import { SmtInvariantError, SmtTacticError, SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_DISTINCT,
  OP_EQ,
  SORT_BOOL,
} from "./ast";
import { hasUninterpreted, isAppOf, pushNotOwned } from "./ast-util";
import { extractVars } from "./qe";
import type { Goal } from "./goal";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { ProtoModel } from "./proto-model";
import { Mbproj } from "./qe-mbp";
import { QuantifierHoister } from "./quant-hoist";
import { RefVector } from "./ref-vector";
import { SmtKernel } from "./smt-kernel";

const NO_LEVEL = -1;

interface MaxLevel {
  ex: number;
  fa: number;
}

const getMax = (first: number, second: number) =>
  first === NO_LEVEL ? second : second === NO_LEVEL ? first : Math.max(first, second);

const getMaxLevel = (level: MaxLevel) => getMax(level.ex, level.fa);

const mkLevel = (): MaxLevel => ({ ex: NO_LEVEL, fa: NO_LEVEL });

const mergeLevel = (level: MaxLevel, other: MaxLevel) => {
  level.ex = getMax(level.ex, other.ex);
  level.fa = getMax(level.fa, other.fa);
};

export const QSAT_QE = 0;
export const QSAT_QE_REC = 1;
export const QSAT_SAT = 2;

const hasQuantifiedUninterpreted = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current) || !manager.hasQuantifierFlags[current]) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      const body = manager.getQuantifier(current).body;
      if (hasUninterpreted(manager, body)) return true;
      todo.push(body);
    } else if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
  }
  return false;
};

const isGround = (manager: AstManager, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] !== KIND_APP) return false;
    manager.pushArgs(current, todo);
  }
  return true;
};

// The propositional abstraction: atoms become fresh predicates, each with a level.
class PredAbs {
  private preds: number[][] = [];
  readonly asms: RefVector;
  private asmsLim: number[] = [];
  readonly pred2Lit = new Map<number, number>();
  private lit2Pred = new Map<number, number>();
  readonly elevel = new Map<number, MaxLevel>();
  private trail: RefVector;
  // The declarations that the model converter hides.
  readonly hidden: number[] = [];

  constructor(private manager: AstManager) {
    this.asms = new RefVector(manager);
    this.trail = new RefVector(manager);
  }

  reset() {
    this.trail.reset();
    this.pred2Lit.clear();
    this.lit2Pred.clear();
    this.elevel.clear();
    this.asms.reset();
    this.asmsLim = [];
    this.preds = [];
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  computeLevel(expr: number) {
    const manager = this.manager;
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (this.elevel.has(current)) {
        todo.pop();
        continue;
      }
      const level = mkLevel();
      let hasNew = false;
      for (const arg of manager.getArgs(current)) {
        if (manager.kinds[arg] !== KIND_APP) throw new SmtTacticError("atom is non-ground");
        const argLevel = this.elevel.get(arg);
        if (argLevel !== undefined) mergeLevel(level, argLevel);
        else {
          todo.push(arg);
          hasNew = true;
        }
      }
      if (!hasNew) {
        this.pin(current);
        this.elevel.set(current, level);
        todo.pop();
      }
    }
    return this.elevel.get(expr) as MaxLevel;
  }

  addPred(pred: number, lit: number) {
    this.pin(pred);
    this.pin(lit);
    this.pred2Lit.set(pred, lit);
    if (!this.lit2Pred.has(lit)) this.lit2Pred.set(lit, pred);
  }

  push() {
    this.asmsLim.push(this.asms.size);
  }

  pop(numScopes: number) {
    const level = this.asmsLim.length - numScopes;
    this.asms.shrink(this.asmsLim[level]);
    this.asmsLim.length = level;
  }

  private insert(pred: number, level: MaxLevel) {
    const max = getMaxLevel(level);
    const index = max === NO_LEVEL ? 0 : max;
    while (this.preds.length <= index) this.preds.push([]);
    this.preds[index].push(pred);
  }

  getAssumptions(model: ProtoModel | undefined, asms: RefVector) {
    const manager = this.manager;
    const level = Math.min(this.asmsLim.length, this.preds.length);
    if (model === undefined) {
      for (const asm of this.asms.items) asms.push(asm);
      return;
    }
    if (level === 0) return;
    const evaluate = (pred: number) => {
      const value = model.eval(pred, true);
      const isFalse = manager.isFalse(value);
      manager.decRef(value);
      return isFalse ? this.pin(manager.mkNot(pred)) : pred;
    };
    for (let index = 0; index <= level - 1; index++)
      for (const pred of this.preds[index]) this.asms.push(evaluate(pred));
    for (const asm of this.asms.items) asms.push(asm);
    for (let index = level + 1; index < this.preds.length; index += 2)
      for (const pred of this.preds[index]) {
        const predLevel = this.elevel.get(pred) as MaxLevel;
        const isUsed =
          (predLevel.fa === index && (predLevel.ex === NO_LEVEL || predLevel.ex < level)) ||
          (predLevel.ex === index && (predLevel.fa === NO_LEVEL || predLevel.fa < level));
        if (isUsed) asms.push(evaluate(pred));
      }
  }

  ensureExprLevel(variable: number, level: number) {
    if (this.elevel.has(variable)) return;
    this.pin(variable);
    this.elevel.set(
      variable,
      level % 2 === 0 ? { ex: level, fa: NO_LEVEL } : { ex: NO_LEVEL, fa: level },
    );
  }

  setExprLevel(expr: number, level: MaxLevel) {
    this.pin(expr);
    this.elevel.set(expr, level);
  }

  // Replaces the atoms of a quantifier-free formula by fresh predicates, with their definitions
  // in defs.
  abstractAtoms(formula: number, level: MaxLevel, defs: RefVector) {
    const manager = this.manager;
    const marked = new Set<number>();
    const todo = [formula];
    this.pin(formula);
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (marked.has(current)) continue;
      marked.add(current);
      const pred = this.lit2Pred.get(current);
      if (pred !== undefined) {
        mergeLevel(level, this.elevel.get(pred) as MaxLevel);
        continue;
      }
      if (manager.isUninterpretedConst(current) && manager.sorts[current] === SORT_BOOL) {
        const constLevel = this.elevel.get(current) as MaxLevel;
        mergeLevel(level, constLevel);
        if (!this.pred2Lit.has(current)) {
          this.addPred(current, current);
          this.insert(current, constLevel);
        }
        continue;
      }
      for (const arg of manager.getArgs(current)) if (!marked.has(arg)) todo.push(arg);
      const isBoolOp =
        manager.getFamily(current) === FAMILY_BASIC &&
        (!isAppOf(manager, current, OP_EQ) ||
          manager.sorts[manager.getArg(current, 0)] === SORT_BOOL) &&
        (!isAppOf(manager, current, OP_DISTINCT) ||
          manager.getNumArgs(current) === 0 ||
          manager.sorts[manager.getArg(current, 0)] === SORT_BOOL);
      if (!isBoolOp && manager.sorts[current] === SORT_BOOL) {
        const fresh = this.freshBool("p");
        const atomLevel = this.computeLevel(current);
        this.addPred(fresh, current);
        this.elevel.set(fresh, atomLevel);
        defs.push(this.pin(manager.mkEq(fresh, current)));
        this.insert(fresh, atomLevel);
        mergeLevel(level, atomLevel);
      }
    }
  }

  freshBool(name: string) {
    const manager = this.manager;
    const result = this.pin(manager.mkFreshConst(name, SORT_BOOL));
    this.hidden.push(manager.decls[result]);
    return result;
  }

  // Replaces the atoms by their predicates, so that the SMT core works on the abstraction only.
  mkAbstract(formula: number) {
    return this.mkConcrete([formula], this.lit2Pred)[0];
  }

  private mkConcrete(fmls: readonly number[], map: Map<number, number>) {
    const manager = this.manager;
    const cache = new Map<number, number>();
    const todo = [...fmls];
    while (todo.length > 0) {
      const current = todo[todo.length - 1];
      if (cache.has(current)) {
        todo.pop();
        continue;
      }
      const mapped = map.get(current);
      if (mapped !== undefined) {
        cache.set(current, mapped);
        todo.pop();
        continue;
      }
      const args: number[] = [];
      let isDifferent = false;
      const size = manager.getNumArgs(current);
      for (const arg of manager.getArgs(current)) {
        const cached = cache.get(arg);
        if (cached === undefined) todo.push(arg);
        else {
          args.push(cached);
          isDifferent ||= cached !== arg;
        }
      }
      if (args.length !== size) continue;
      cache.set(
        current,
        isDifferent
          ? this.pin(manager.mkApp(manager.decls[current], args, manager.sorts[current]))
          : current,
      );
      todo.pop();
    }
    return fmls.map((formula) => cache.get(formula) as number);
  }

  pred2LitVector(fmls: RefVector) {
    const concrete = this.mkConcrete(fmls.items, this.pred2Lit);
    concrete.forEach((formula, index) => fmls.set(index, formula));
  }

  // The uninterpreted constants of a formula.
  getFreeVars(formula: number, vars: RefVector) {
    const manager = this.manager;
    const marked = new Set<number>();
    const todo = [formula];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (marked.has(current) || manager.kinds[current] === KIND_VAR) continue;
      marked.add(current);
      if (manager.kinds[current] === KIND_QUANTIFIER) {
        todo.push(manager.getQuantifier(current).body);
        continue;
      }
      if (manager.isUninterpretedConst(current)) vars.push(current);
      manager.pushArgs(current, todo);
    }
  }

  release() {
    this.reset();
  }
}

class Kernel {
  private kernel: SmtKernel | undefined;
  private lastAssert = -1;
  private trail: RefVector;

  constructor(private manager: AstManager) {
    this.trail = new RefVector(manager);
  }

  init() {
    this.kernel = new SmtKernel(this.manager, {
      isMbqi: true,
      isFindingMacros: false,
      relevancyLevel: 0,
    });
    this.lastAssert = -1;
    this.trail.reset();
  }

  get solver() {
    return this.kernel as SmtKernel;
  }

  assertExpr(expr: number) {
    if (this.manager.isTrue(expr)) return;
    this.trail.push(expr);
    this.solver.assertExpr(expr);
  }

  assertBlockingFml(expr: number) {
    const manager = this.manager;
    if (manager.isTrue(expr)) return;
    if (this.lastAssert !== -1 && expr === this.lastAssert && !manager.isFalse(expr))
      throw new SmtInvariantError("qsat asserted the same blocking formula twice in a row");
    this.lastAssert = expr;
    this.trail.push(expr);
    this.solver.assertExpr(expr);
  }

  getCore(core: RefVector) {
    core.reset();
    for (const expr of this.solver.context.unsatCore) core.push(expr);
  }

  reasonUnknown() {
    return this.solver.context.getLastFailureMessage();
  }

  release() {
    this.trail.reset();
    this.kernel = undefined;
  }
}

export class Qsat {
  private mbp: Mbproj;
  private fa: Kernel;
  private ex: Kernel;
  private predAbs: PredAbs;
  private answer: RefVector;
  private asms: RefVector;
  // The variables of the alternating prefixes, existential at even levels.
  private vars: RefVector[] = [];
  private level = 0;
  private model: ProtoModel | undefined;
  private modelSave: ProtoModel | undefined;
  private avars: RefVector;
  private freeVars: RefVector;
  private trail: RefVector;

  constructor(
    private manager: AstManager,
    private mode: number,
  ) {
    this.mbp = new Mbproj(manager);
    this.fa = new Kernel(manager);
    this.ex = new Kernel(manager);
    this.predAbs = new PredAbs(manager);
    this.answer = new RefVector(manager);
    this.asms = new RefVector(manager);
    this.avars = new RefVector(manager);
    this.freeVars = new RefVector(manager);
    this.trail = new RefVector(manager);
  }

  private pin(expr: number) {
    this.trail.push(expr);
    return expr;
  }

  private pinOwned(expr: number) {
    this.trail.pushOwned(expr);
    return expr;
  }

  private setModel(model: ProtoModel | undefined) {
    model?.incRef();
    this.model?.decRef();
    this.model = model;
  }

  private setModelSave(model: ProtoModel | undefined) {
    model?.incRef();
    this.modelSave?.decRef();
    this.modelSave = model;
  }

  // Checks alternating satisfiability, with existential even levels and universal odd ones.
  private checkSat() {
    const manager = this.manager;
    for (;;) {
      manager.limit.checkpoint();
      const asms = new RefVector(manager);
      for (const asm of this.asms.items) asms.push(asm);
      this.predAbs.getAssumptions(this.model, asms);
      const kernel = this.getKernel(this.level).solver;
      const result = kernel.check(asms.items);
      if (result === L_TRUE) {
        this.setModel(kernel.context.getModel());
        if (this.level === 0) this.setModelSave(this.model);
        this.push();
      } else if (result === L_FALSE) {
        if (this.level === 0) return L_FALSE;
        if (this.level === 1 && this.mode === QSAT_SAT) return L_TRUE;
        if (this.model === undefined) this.pop(1);
        else if (this.level === 1) this.projectQe(asms);
        else if (!this.project(asms)) return L_UNDEF;
      } else return result;
      asms.reset();
    }
  }

  private getKernel(level: number) {
    return level % 2 === 0 ? this.ex : this.fa;
  }

  private push() {
    this.level++;
    this.predAbs.push();
  }

  private pop(numScopes: number) {
    this.setModel(undefined);
    this.predAbs.pop(numScopes);
    this.level -= numScopes;
  }

  private clear() {
    this.level = 0;
    this.answer.reset();
    this.asms.reset();
    this.predAbs.reset();
    for (const vars of this.vars) vars.reset();
    this.vars = [];
    this.setModel(undefined);
    this.freeVars.reset();
    this.fa.release();
    this.ex.release();
  }

  private reset() {
    this.clear();
    this.fa.init();
    this.ex.init();
  }

  release() {
    this.clear();
    this.setModelSave(undefined);
    this.avars.reset();
    this.trail.reset();
    this.predAbs.release();
    this.mbp.release();
  }

  // Brings the formula into a quantifier prefix form.
  private hoist(formula: number) {
    const manager = this.manager;
    if (hasQuantifiedUninterpreted(manager, formula))
      throw new SmtTacticError("formula contains uninterpreted functions");
    if (manager.hasLabelFlags[formula]) throw new SmtUnsupportedError("labels under qsat");
    const hoister = new QuantifierHoister(manager);
    const freeVars = new RefVector(manager);
    this.predAbs.getFreeVars(formula, freeVars);
    this.vars.push(freeVars);
    let result = formula;
    let isForall = false;
    const pullInto = (target: RefVector) => {
      result = this.pinOwned(hoister.pullQuantifier(isForall, result, target));
    };
    if (this.mode !== QSAT_SAT) {
      isForall = true;
      const vars = new RefVector(manager);
      pullInto(vars);
      this.vars.push(vars);
      this.filterVars(vars);
    } else {
      const vars = new RefVector(manager);
      pullInto(vars);
      for (const innerVar of vars.items) freeVars.push(innerVar);
      this.filterVars(vars);
      vars.reset();
    }
    for (;;) {
      isForall = !isForall;
      const vars = new RefVector(manager);
      pullInto(vars);
      this.vars.push(vars);
      this.filterVars(vars);
      if (vars.size === 0) break;
    }
    hoister.release();
    this.initializeLevels();
    return result;
  }

  private filterVars(vars: RefVector) {
    const manager = this.manager;
    for (const innerVar of vars.items) this.predAbs.hidden.push(manager.decls[innerVar]);
    for (const innerVar of vars.items)
      if (manager.isUninterpretedSort(manager.sorts[innerVar]))
        throw new SmtTacticError("qsat does not apply to uninterpreted sorts");
  }

  private initializeLevels() {
    for (const [index, vars] of this.vars.entries()) {
      const level = index % 2 === 0 ? { ex: index, fa: NO_LEVEL } : { ex: NO_LEVEL, fa: index };
      for (const innerVar of vars.items) this.predAbs.setExprLevel(innerVar, { ...level });
    }
  }

  private getCore(core: RefVector, level: number) {
    this.getKernel(level).getCore(core);
    this.predAbs.pred2LitVector(core);
  }

  private addAssumption(formula: number) {
    const manager = this.manager;
    const fresh = this.predAbs.freshBool("b");
    this.asms.push(fresh);
    const eq = this.pin(manager.mkEq(fresh, formula));
    this.ex.assertExpr(eq);
    this.fa.assertExpr(eq);
    this.predAbs.addPred(fresh, formula);
    this.predAbs.setExprLevel(fresh, mkLevel());
  }

  private negateCore(core: RefVector) {
    const manager = this.manager;
    return this.pinOwned(pushNotOwned(manager, this.pin(manager.mkAnd(core.items))));
  }

  private projectQe(core: RefVector) {
    const model = this.model as ProtoModel;
    this.getCore(core, this.level);
    this.getVars(this.level);
    this.mbp.apply(this.mode !== QSAT_QE_REC, this.avars, model, core);
    const formula = this.negateCore(core);
    this.addAssumption(formula);
    this.answer.push(formula);
    for (const innerVar of this.avars.items) this.freeVars.push(innerVar);
    this.pop(1);
  }

  private project(core: RefVector) {
    const manager = this.manager;
    const model = this.model as ProtoModel;
    this.getCore(core, this.level);
    this.getVars(this.level - 1);
    this.mbp.apply(this.mode !== QSAT_QE_REC, this.avars, model, core);
    for (const innerVar of this.avars.items) this.predAbs.ensureExprLevel(innerVar, this.level - 1);
    for (const innerVar of this.avars.items) this.freeVars.push(innerVar);
    let formula = this.negateCore(core);
    const level = mkLevel();
    const defs = new RefVector(manager);
    this.predAbs.abstractAtoms(formula, level, defs);
    const conjunction = this.pin(manager.mkAnd(defs.items));
    this.ex.assertExpr(conjunction);
    this.fa.assertExpr(conjunction);
    defs.reset();
    const max = getMaxLevel(level);
    let numScopes = 0;
    if (max === NO_LEVEL) numScopes = 2 * Math.floor(this.level / 2);
    // This can happen.
    else if (max + 2 > this.level) return false;
    else {
      numScopes = this.level - max;
      if (numScopes % 2 !== 0) numScopes--;
    }
    this.pop(numScopes);
    if (this.level === 0 && this.mode !== QSAT_SAT) this.addAssumption(formula);
    else {
      formula = this.predAbs.mkAbstract(formula);
      this.getKernel(this.level).assertBlockingFml(formula);
    }
    return true;
  }

  private getVars(level: number) {
    this.avars.reset();
    for (const vars of this.vars.slice(level))
      for (const innerVar of vars.items) this.avars.push(innerVar);
  }

  private elimRec(formula: number): number {
    const manager = this.manager;
    const visited = new Map<number, number>();
    const todo = [formula];
    while (todo.length > 0) {
      manager.limit.checkpoint();
      const expr = todo[todo.length - 1];
      if (visited.has(expr)) {
        todo.pop();
        continue;
      }
      const kind = manager.kinds[expr];
      if (kind === KIND_APP) {
        const args: number[] = [];
        let isAllVisited = true;
        for (const arg of manager.getArgs(expr)) {
          const result = visited.get(arg);
          if (result !== undefined) args.push(result);
          else {
            todo.push(arg);
            isAllVisited = false;
          }
        }
        if (isAllVisited) {
          todo.pop();
          const isChanged = args.some((arg, index) => arg !== manager.getArg(expr, index));
          visited.set(
            expr,
            isChanged
              ? this.pin(manager.mkApp(manager.decls[expr], args, manager.sorts[expr]))
              : expr,
          );
        }
        continue;
      }
      if (kind !== KIND_QUANTIFIER) throw new SmtInvariantError("qsat met a free variable");
      const data = manager.getQuantifier(expr);
      const vars = new RefVector(manager);
      let body = this.elimRec(this.pinOwned(extractVars(manager, expr, vars)));
      if (data.isForall) body = this.pinOwned(pushNotOwned(manager, body));
      const eliminated = this.elim(vars, body);
      vars.reset();
      todo.pop();
      if (eliminated === -1) {
        visited.set(expr, expr);
        continue;
      }
      visited.set(
        expr,
        data.isForall ? this.pinOwned(pushNotOwned(manager, eliminated)) : eliminated,
      );
    }
    return visited.get(formula) as number;
  }

  // Solves exists vars . formula.
  private elim(vars: RefVector, formula: number) {
    const manager = this.manager;
    if (manager.hasQuantifierFlags[formula]) return -1;
    this.reset();
    const exists = this.pin(
      manager.mkQuantifier({
        isForall: false,
        sorts: vars.items.map((innerVar) => manager.sorts[innerVar]),
        names: vars.items.map((innerVar) => manager.getDeclName(innerVar)),
        body: this.abstractVars(vars, formula),
        patterns: [],
        noPatterns: [],
        weight: 0,
        qid: "",
      }),
    );
    const hoisted = this.hoist(this.pinOwned(pushNotOwned(manager, exists)));
    this.assertFormula(hoisted);
    if (this.checkSat() !== L_FALSE) return -1;
    let result = this.pin(manager.mkAnd(this.answer.items));
    const freeVars = this.freeVars.items.filter((innerVar) =>
      isOccurringIn(manager, innerVar, result),
    );
    if (freeVars.length > 0) {
      const subVars = new RefVector(manager);
      for (const innerVar of freeVars) subVars.push(innerVar);
      result = this.pin(
        manager.mkQuantifier({
          isForall: false,
          sorts: freeVars.map((innerVar) => manager.sorts[innerVar]),
          names: freeVars.map((innerVar) => manager.getDeclName(innerVar)),
          body: this.abstractVars(subVars, result),
          patterns: [],
          noPatterns: [],
          weight: 0,
          qid: "",
        }),
      );
      subVars.reset();
    }
    return result;
  }

  // expr_abstract: (:var i) for the i-th constant from the end.
  private abstractVars(vars: RefVector, formula: number) {
    const manager = this.manager;
    const subst = new Map<number, number>();
    vars.items.forEach((innerVar, index) =>
      subst.set(innerVar, this.pin(manager.mkVar(vars.size - 1 - index, manager.sorts[innerVar]))),
    );
    const cache = new Map<number, number>();
    const visit = (expr: number): number => {
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const replaced = subst.get(expr);
      const result =
        replaced !== undefined
          ? replaced
          : manager.kinds[expr] === KIND_APP && manager.getNumArgs(expr) > 0
            ? this.pin(
                manager.mkApp(
                  manager.decls[expr],
                  manager.getArgs(expr).map(visit),
                  manager.sorts[expr],
                ),
              )
            : expr;
      cache.set(expr, result);
      return result;
    };
    return visit(formula);
  }

  private assertFormula(formula: number) {
    const manager = this.manager;
    if (!isGround(manager, formula)) throw new SmtTacticError("formula is not hoistable");
    const defs = new RefVector(manager);
    this.predAbs.abstractAtoms(formula, mkLevel(), defs);
    const abstracted = this.predAbs.mkAbstract(formula);
    const conjunction = this.pin(manager.mkAnd(defs.items));
    defs.reset();
    this.ex.assertExpr(conjunction);
    this.fa.assertExpr(conjunction);
    this.ex.assertExpr(abstracted);
    this.fa.assertExpr(this.pin(manager.mkNot(abstracted)));
  }

  apply(goal: Goal) {
    const manager = this.manager;
    let formula = this.pin(manager.mkAnd(goal.forms.items));
    const mode = this.mode;
    // qe and qe2 over a quantifier-free formula decide its satisfiability.
    if ((mode === QSAT_QE || mode === QSAT_QE_REC) && !manager.hasQuantifierFlags[formula])
      this.mode = QSAT_SAT;
    try {
      if (this.mode === QSAT_QE_REC) {
        formula = this.elimRec(formula);
        goal.reset();
        goal.depth++;
        goal.assert(formula);
        return [goal];
      }
      this.reset();
      if (this.mode !== QSAT_SAT) formula = this.pinOwned(pushNotOwned(manager, formula));
      formula = this.hoist(formula);
      this.assertFormula(formula);
      const result = this.checkSat();
      if (result === L_FALSE) {
        goal.reset();
        goal.depth++;
        goal.assert(
          this.mode === QSAT_QE ? this.pin(manager.mkAnd(this.answer.items)) : manager.falseExpr,
        );
        return [goal];
      }
      if (result === L_TRUE) {
        goal.reset();
        goal.depth++;
        const model = this.modelSave as ProtoModel;
        model.incRef();
        goal.model = model;
        for (const decl of this.predAbs.hidden) goal.addConverter(decl);
        return [goal];
      }
      let reason = this.ex.reasonUnknown();
      if (reason === "ok" || reason === "unknown") reason = this.fa.reasonUnknown();
      throw new SmtTacticError(reason);
    } finally {
      this.mode = mode;
    }
  }
}

const isOccurringIn = (manager: AstManager, variable: number, expr: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (current === variable) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    else if (manager.kinds[current] === KIND_QUANTIFIER)
      todo.push(manager.getQuantifier(current).body);
  }
  return false;
};

export const runQsat = (manager: AstManager, mode: number) => (goal: Goal) => {
  const qsat = new Qsat(manager, mode);
  try {
    return qsat.apply(goal);
  } finally {
    qsat.release();
  }
};

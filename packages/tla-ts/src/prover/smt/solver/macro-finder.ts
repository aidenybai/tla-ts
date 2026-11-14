// Ported from Z3 (src/ast/macros/macro_finder.cpp, src/ast/macros/macro_manager.cpp,
// src/ast/macros/macro_util.cpp, src/ast/func_decl_dependencies.cpp,
// src/tactic/ufbv/macro_finder_tactic.cpp), MIT license, see z3-license.txt.
import {
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_ARRAY_MAP,
  OP_AS_ARRAY,
  OP_EQ,
  OP_GE,
  OP_ITE,
  OP_LE,
  OP_NOT,
  SORT_BOOL,
  type AstManager,
  QUANTIFIER_FORALL,
} from "./ast";
import { isAppOf } from "./ast-util";
import { getSubterms } from "./recfun-decl-plugin";
import { type Dependency, type Goal, joinDependencies } from "./goal";
import { isMacroHead, normalizeMacroDef, setElseInterp } from "./model-macro-solver";
import type { ProtoModel } from "./proto-model";
import { Rational } from "./rational";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import { VarSubst } from "./var-subst";

interface MacroScope {
  numDecls: number;
  numForbidden: number;
}

interface HeadDef {
  head: number;
  def: number;
}

interface JustifiedForms {
  forms: RefVector;
  dependencies: (Dependency | undefined)[];
}

interface PseudoHead {
  head: number;
  value: number;
}

const isForall = (manager: AstManager, expr: number) =>
  manager.kinds[expr] === KIND_QUANTIFIER && manager.getQuantifier(expr).kind === QUANTIFIER_FORALL;

const collectUserDecls = (manager: AstManager, expr: number, decls: Set<number>) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    visited.add(current);
    if (manager.kinds[current] === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(current);
      todo.push(data.body, ...data.patterns, ...data.noPatterns);
      continue;
    }
    if (manager.kinds[current] !== KIND_APP || manager.getNumArgs(current) === 0) continue;
    const decl = manager.decls[current];
    if (manager.funcDecls[decl].family === FAMILY_USER) decls.add(decl);
    todo.push(...manager.getArgs(current));
  }
};

// The definition comes with a reference, which the caller releases.
const getHeadDef = (manager: AstManager, quantifier: number, decl: number): HeadDef => {
  const body = manager.getQuantifier(quantifier).body;
  const isNegated = isAppOf(manager, body, OP_NOT);
  const eq = isNegated ? manager.getArg(body, 0) : body;
  const lhs = manager.getArg(eq, 0);
  const rhs = manager.getArg(eq, 1);
  const isLeft = manager.kinds[lhs] === KIND_APP && manager.decls[lhs] === decl;
  const side = isLeft ? rhs : lhs;
  const def = isNegated ? manager.mkApp(OP_NOT, [side], SORT_BOOL) : side;
  manager.incRef(def);
  return { head: isLeft ? lhs : rhs, def };
};

class MacroExpander extends RewriterTpl {
  readonly trail: RefVector;
  private subst: VarSubst;
  usedDependencies: Dependency | undefined;

  constructor(
    manager: AstManager,
    private macros: MacroManager,
  ) {
    super(manager);
    this.trail = new RefVector(manager);
    this.subst = new VarSubst(manager, true);
  }

  isRewritingPatterns() {
    return false;
  }

  getSubst(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP) return undefined;
    const decl = manager.decls[expr];
    const quantifier = this.macros.getMacro(decl);
    if (quantifier === undefined) {
      const op = manager.getOp(expr);
      if (op !== OP_AS_ARRAY && op !== OP_ARRAY_MAP) return undefined;
      const target = manager.funcDecls[decl].parameters[0];
      if (this.macros.getMacro(target) !== undefined) this.macros.unsafe.add(target);
      return undefined;
    }
    const headDef = getHeadDef(manager, quantifier, decl);
    const numArgs = manager.getNumArgs(expr);
    const args = Array.from({ length: numArgs }, () => -1);
    for (let index = 0; index < numArgs; index++)
      args[numArgs - manager.values[manager.getArg(headDef.head, index)] - 1] = manager.getArg(
        expr,
        index,
      );
    const result = this.subst.apply(headDef.def, args);
    this.trail.pushOwned(result);
    manager.decRef(headDef.def);
    this.usedDependencies = joinDependencies(
      this.usedDependencies,
      this.macros.getMacroDependency(decl),
    );
    return result;
  }

  release() {
    super.release();
    this.subst.release();
    this.trail.reset();
  }
}

export class MacroManager {
  private decls: number[] = [];
  private macros: number[] = [];
  private decl2macro = new Map<number, number>();
  private decl2dependency = new Map<number, Dependency | undefined>();
  private deps = new Map<number, Set<number>>();
  private forbidden = new Set<number>();
  private forbiddenTrail: number[] = [];
  private scopes: MacroScope[] = [];
  readonly unsafe = new Set<number>();

  constructor(private manager: AstManager) {}

  hasMacros() {
    return this.decls.length > 0;
  }

  getMacro(decl: number) {
    return this.decl2macro.get(decl);
  }

  getMacroDependency(decl: number) {
    return this.decl2dependency.get(decl);
  }

  pushScope() {
    this.scopes.push({ numDecls: this.decls.length, numForbidden: this.forbiddenTrail.length });
  }

  popScope() {
    const scope = this.scopes.pop();
    if (scope === undefined) return;
    for (const decl of this.decls.splice(scope.numDecls)) {
      this.deps.delete(decl);
      this.decl2macro.delete(decl);
      this.decl2dependency.delete(decl);
    }
    for (const quantifier of this.macros.splice(scope.numDecls)) this.manager.decRef(quantifier);
    for (const decl of this.forbiddenTrail.splice(scope.numForbidden)) this.forbidden.delete(decl);
  }

  markForbidden(formulas: number[]) {
    const decls = new Set<number>();
    for (const formula of formulas) collectUserDecls(this.manager, formula, decls);
    for (const decl of decls) {
      if (this.forbidden.has(decl)) continue;
      this.forbidden.add(decl);
      this.forbiddenTrail.push(decl);
    }
  }

  release() {
    for (const quantifier of this.macros) this.manager.decRef(quantifier);
  }

  registerInterpretations(model: ProtoModel) {
    for (const [index, decl] of this.decls.entries()) {
      const def = this.getInterpretation(index);
      setElseInterp(this.manager, model, decl, def);
      this.manager.decRef(def);
    }
  }

  find(formulas: number[]) {
    this.unsafe.clear();
    const current = this.expandRounds(formulas, [], Infinity).forms;
    for (const [index, decl] of this.decls.entries())
      if (this.unsafe.has(decl)) current.push(this.macros[index]);
    this.unsafe.clear();
    return current;
  }

  // The tactic stops after one round per formula, and keeps unsafe macros out of the result.
  findInGoal(formulas: number[], dependencies: (Dependency | undefined)[]) {
    return this.expandRounds(formulas, dependencies, formulas.length);
  }

  // The definitions come with a reference, which the caller releases.
  getInterpretations() {
    return this.decls.map((decl, index) => ({ decl, def: this.getInterpretation(index) }));
  }

  private getInterpretation(index: number) {
    const manager = this.manager;
    return manager.withTemporaries(
      () => {
        const headDef = getHeadDef(manager, this.macros[index], this.decls[index]);
        const def = normalizeMacroDef(manager, headDef.head, headDef.def);
        manager.incRef(def);
        manager.decRef(headDef.def);
        return def;
      },
      () => [],
    );
  }

  private expandRounds(
    formulas: number[],
    dependencies: (Dependency | undefined)[],
    maxRounds: number,
  ) {
    let current: JustifiedForms = { forms: new RefVector(this.manager), dependencies: [] };
    let isFound = this.expandFormulas(formulas, dependencies, current);
    for (let round = 0; isFound && round < maxRounds; round++) {
      const next = { forms: new RefVector(this.manager), dependencies: [] };
      isFound = this.expandFormulas(current.forms.items, current.dependencies, next);
      current.forms.reset();
      current = next;
    }
    return current;
  }

  private expandFormulas(
    formulas: number[],
    dependencies: (Dependency | undefined)[],
    result: JustifiedForms,
  ) {
    const manager = this.manager;
    let isFound = false;
    for (const [index, formula] of formulas.entries()) {
      const expanded = this.expandJustified(formula, dependencies[index]);
      if (
        this.insertSimpleMacro(expanded.expr, expanded.dependency) ||
        this.findArithMacro(expanded.expr, expanded.dependency, result) ||
        this.findPseudoPredicateMacro(expanded.expr, expanded.dependency, result)
      )
        isFound = true;
      else {
        result.forms.push(expanded.expr);
        result.dependencies.push(expanded.dependency);
      }
      manager.decRef(expanded.expr);
    }
    return isFound;
  }

  // The result comes with a reference, which the caller releases.
  expand(expr: number) {
    return this.expandJustified(expr, undefined).expr;
  }

  private expandJustified(expr: number, dependency: Dependency | undefined) {
    const manager = this.manager;
    manager.incRef(expr);
    if (!this.hasMacros()) return { expr, dependency };
    let current = expr;
    let currentDependency = dependency;
    for (;;) {
      const expander = new MacroExpander(manager, this);
      const result = expander.rewrite(current);
      currentDependency = joinDependencies(currentDependency, expander.usedDependencies);
      const isChanged = result !== current;
      manager.decRef(current);
      current = result;
      expander.release();
      if (!isChanged)
        return {
          expr: current === expr ? current : this.simplify(current),
          dependency: currentDependency,
        };
    }
  }

  private simplify(expr: number) {
    const rewriter = new Rewriter(this.manager, TACTIC_REWRITER_OPTIONS);
    const result = rewriter.rewrite(expr);
    this.manager.decRef(expr);
    rewriter.release();
    return result;
  }

  insert(decl: number, quantifier: number, dependency?: Dependency) {
    const manager = this.manager;
    if (this.decl2macro.has(decl)) return false;
    // The recfun theory unfolds a recursive definition, which the expansion of the macro does not
    // reach.
    for (const def of manager.recFunDefs.values())
      if (
        !def.isMacro &&
        def.rhs !== -1 &&
        getSubterms(manager, def.rhs).some(
          (term) => manager.kinds[term] === KIND_APP && manager.decls[term] === decl,
        )
      )
        return false;
    const headDef = getHeadDef(manager, quantifier, decl);
    const deps = new Set<number>();
    collectUserDecls(manager, headDef.def, deps);
    manager.decRef(headDef.def);
    if (this.isReaching(deps, decl)) return false;
    this.deps.set(decl, deps);
    manager.incRef(quantifier);
    this.decl2macro.set(decl, quantifier);
    this.decl2dependency.set(decl, dependency);
    this.decls.push(decl);
    this.macros.push(quantifier);
    return true;
  }

  private isReaching(deps: Set<number>, target: number) {
    const visited = new Set<number>();
    const todo = [...deps];
    for (let decl = todo.pop(); decl !== undefined; decl = todo.pop()) {
      if (decl === target) return true;
      if (visited.has(decl)) continue;
      visited.add(decl);
      todo.push(...(this.deps.get(decl) ?? []));
    }
    return false;
  }

  private isHead(expr: number, numDecls: number, other: number) {
    const manager = this.manager;
    return (
      isMacroHead(manager, expr, numDecls) &&
      !this.forbidden.has(manager.decls[expr]) &&
      !manager.isOccurring(manager.decls[expr], other)
    );
  }

  private insertSimpleMacro(expr: number, dependency: Dependency | undefined) {
    const manager = this.manager;
    if (!isForall(manager, expr)) return false;
    const data = manager.getQuantifier(expr);
    const numDecls = data.sorts.length;
    const isNegatedBoolEq =
      isAppOf(manager, data.body, OP_NOT) &&
      isAppOf(manager, manager.getArg(data.body, 0), OP_EQ) &&
      manager.isBool(manager.getArg(manager.getArg(data.body, 0), 0));
    const eq = isNegatedBoolEq ? manager.getArg(data.body, 0) : data.body;
    if (!isAppOf(manager, eq, OP_EQ)) return false;
    const lhs = manager.getArg(eq, 0);
    const rhs = manager.getArg(eq, 1);
    const head = this.isHead(lhs, numDecls, rhs)
      ? lhs
      : this.isHead(rhs, numDecls, lhs)
        ? rhs
        : undefined;
    return head !== undefined && this.insert(manager.decls[head], expr, dependency);
  }

  private isArithHead(expr: number, numDecls: number, poly: number, exception: number) {
    const manager = this.manager;
    if (!isMacroHead(manager, expr, numDecls) || this.forbidden.has(manager.decls[expr]))
      return false;
    const decl = manager.decls[expr];
    return manager
      .getArgs(poly)
      .every((arg) => arg === exception || !manager.isOccurring(decl, arg));
  }

  private findArithMacro(expr: number, dependency: Dependency | undefined, result: JustifiedForms) {
    const manager = this.manager;
    if (!isForall(manager, expr)) return false;
    const data = manager.getQuantifier(expr);
    const body = data.body;
    const op = manager.kinds[body] === KIND_APP ? manager.getOp(body) : -1;
    if (op !== OP_LE && op !== OP_GE && op !== OP_EQ) return false;
    const lhs = manager.getArg(body, 0);
    const rhs = manager.getArg(body, 1);
    if (!isAppOf(manager, lhs, OP_ADD) || !manager.isNumeral(rhs)) return false;
    const numDecls = data.sorts.length;
    let head: number | undefined;
    let isInverted = false;
    const rest: number[] = [];
    for (const arg of manager.getArgs(lhs)) {
      const negated = manager.getTimesMinusOneArg(arg);
      if (head === undefined && this.isArithHead(arg, numDecls, lhs, arg)) head = arg;
      else if (
        head === undefined &&
        negated !== undefined &&
        this.isArithHead(negated, numDecls, lhs, arg)
      ) {
        head = negated;
        isInverted = true;
      } else rest.push(arg);
    }
    if (head === undefined) return false;
    const macroHead = head;
    return manager.withTemporaries(
      () => {
        const sort = manager.sorts[lhs];
        const sum = rest.length === 1 ? rest[0] : manager.mkApp(OP_ADD, rest, sort);
        const rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
        const def = isInverted ? rewriter.mkSub(sum, rhs) : rewriter.mkSub(rhs, sum);
        rewriter.release();
        const decl = manager.decls[macroHead];
        const funcDecl = manager.funcDecls[decl];
        if (this.decl2macro.has(decl) || funcDecl.isSkolem) return false;
        const newOp = !isInverted || op === OP_EQ ? op : op === OP_LE ? OP_GE : OP_LE;
        const macro = manager.mkQuantifier({
          ...data,
          body: manager.mkApp(newOp, [macroHead, def], SORT_BOOL),
        });
        if (op === OP_EQ) return this.insert(decl, macro, dependency);
        const fresh = manager.mkFreshFuncDecl(funcDecl.name, funcDecl.domain, funcDecl.range);
        const freshApp = manager.mkApp(fresh, manager.getArgs(macroHead), funcDecl.range);
        const macroData = manager.getQuantifier(macro);
        result.forms.push(
          manager.mkQuantifier({
            ...macroData,
            body: manager.mkEq(macroHead, manager.mkApp(OP_ADD, [def, freshApp], sort)),
          }),
        );
        result.forms.push(
          manager.mkQuantifier({
            ...macroData,
            body: manager.mkApp(
              newOp,
              [freshApp, manager.mkNumeralOfSort(Rational.zero, funcDecl.range)],
              SORT_BOOL,
            ),
            patterns: [manager.mkPattern([freshApp])],
          }),
        );
        result.dependencies.push(dependency, dependency);
        return true;
      },
      () => [],
    );
  }

  private getPseudoHead(expr: number, numDecls: number): PseudoHead | undefined {
    const manager = this.manager;
    if (!isAppOf(manager, expr, OP_EQ)) return undefined;
    const lhs = manager.getArg(expr, 0);
    const rhs = manager.getArg(expr, 1);
    if (!manager.isGround(lhs) && !manager.isGround(rhs)) return undefined;
    const sort = manager.sorts[lhs];
    if (manager.isUninterpretedSort(sort) || manager.getSortSize(sort) === 1n) return undefined;
    if (isMacroHead(manager, lhs, numDecls)) return { head: lhs, value: rhs };
    if (isMacroHead(manager, rhs, numDecls)) return { head: rhs, value: lhs };
    return undefined;
  }

  private findPseudoPredicateMacro(
    expr: number,
    dependency: Dependency | undefined,
    result: JustifiedForms,
  ) {
    const manager = this.manager;
    if (!isForall(manager, expr)) return false;
    const data = manager.getQuantifier(expr);
    const body = data.body;
    if (!isAppOf(manager, body, OP_EQ) || !manager.isBool(manager.getArg(body, 0))) return false;
    const numDecls = data.sorts.length;
    const getMacro = (side: number, other: number) => {
      const pseudo = this.getPseudoHead(side, numDecls);
      if (pseudo === undefined) return undefined;
      const decl = manager.decls[pseudo.head];
      return this.forbidden.has(decl) || manager.isOccurring(decl, other) ? undefined : pseudo;
    };
    const lhs = manager.getArg(body, 0);
    const rhs = manager.getArg(body, 1);
    const fromLhs = getMacro(lhs, rhs);
    const pseudo = fromLhs ?? getMacro(rhs, lhs);
    if (pseudo === undefined) return false;
    const def = fromLhs === undefined ? lhs : rhs;
    manager.withTemporaries(
      () => {
        const funcDecl = manager.funcDecls[manager.decls[pseudo.head]];
        const fresh = manager.mkFreshFuncDecl(funcDecl.name, funcDecl.domain, funcDecl.range);
        const freshApp = manager.mkApp(fresh, manager.getArgs(pseudo.head), funcDecl.range);
        const ite = manager.mkApp(OP_ITE, [def, pseudo.value, freshApp], funcDecl.range);
        result.forms.push(manager.mkQuantifier({ ...data, body: manager.mkEq(pseudo.head, ite) }));
        result.forms.push(
          manager.mkQuantifier({
            ...data,
            body: manager.mkApp(OP_NOT, [manager.mkEq(freshApp, pseudo.value)], SORT_BOOL),
            patterns: [manager.mkPattern([freshApp])],
          }),
        );
        result.dependencies.push(dependency, dependency);
      },
      () => [],
    );
    return true;
  }
}

export const findGoalMacros = (manager: AstManager, goal: Goal) => {
  const macros = new MacroManager(manager);
  const found = macros.findInGoal([...goal.forms.items], goal.dependencies);
  goal.reset();
  for (const [index, form] of found.forms.items.entries())
    goal.assert(form, found.dependencies[index]);
  found.forms.reset();
  const definitions = macros.getInterpretations();
  goal.addDefinitions(definitions);
  for (const definition of definitions) manager.decRef(definition.def);
  macros.release();
  goal.depth++;
};

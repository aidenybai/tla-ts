// Ported from Z3 (src/ast/macros/quasi_macros.cpp, src/tactic/ufbv/quasi_macros_tactic.cpp), MIT
// license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_USER,
  KIND_APP,
  KIND_QUANTIFIER,
  KIND_VAR,
  OP_AND,
  OP_EQ,
  OP_ITE,
  SORT_BOOL,
  type SmtSymbol,
} from "./ast";
import type { Goal } from "./goal";
import { MacroManager } from "./macro-finder";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";

interface QuasiMacro {
  head: number;
  def: number;
}

const isNonGroundUninterp = (manager: AstManager, expr: number) =>
  !manager.isGround(expr) &&
  manager.kinds[expr] === KIND_APP &&
  manager.funcDecls[manager.decls[expr]].family === FAMILY_USER;

const isDependingOn = (manager: AstManager, expr: number, decl: number) => {
  const visited = new Set<number>();
  const todo = [expr];
  for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
    if (visited.has(current)) continue;
    if (manager.kinds[current] === KIND_APP) {
      if (manager.decls[current] === decl) return true;
      for (let index = manager.getNumArgs(current); index > 0; index--)
        todo.push(manager.getArg(current, index - 1));
    }
    visited.add(current);
  }
  return false;
};

const isFullyDependingOn = (manager: AstManager, app: number, numDecls: number) => {
  const isUsed = Array.from({ length: numDecls }, () => false);
  for (const arg of manager.getArgs(app))
    if (manager.kinds[arg] === KIND_VAR) isUsed[manager.values[arg]] = true;
  return isUsed.every(Boolean);
};

class QuasiMacros {
  private occurrences = new Map<number, number>();
  private rewriter: Rewriter;
  private newVars: RefVector;
  private newEqs: RefVector;

  constructor(
    private manager: AstManager,
    private macros: MacroManager,
  ) {
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
    this.newVars = new RefVector(manager);
    this.newEqs = new RefVector(manager);
  }

  // A term reached a second time counts again, and a third time not.
  private findOccurrences(expr: number) {
    const manager = this.manager;
    const visitedOnce = new Set<number>();
    const visitedMore = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visitedMore.has(current)) continue;
      if (visitedOnce.has(current)) visitedMore.add(current);
      visitedOnce.add(current);
      if (manager.kinds[current] === KIND_QUANTIFIER)
        todo.push(manager.getQuantifier(current).body);
      if (manager.kinds[current] !== KIND_APP) continue;
      if (isNonGroundUninterp(manager, current)) {
        const decl = manager.decls[current];
        this.occurrences.set(decl, (this.occurrences.get(decl) ?? 0) + 1);
      }
      for (let index = manager.getNumArgs(current); index > 0; index--)
        todo.push(manager.getArg(current, index - 1));
    }
  }

  private isUnique(decl: number) {
    return this.occurrences.get(decl) === 1;
  }

  private isQuasiDef(numDecls: number, lhs: number, rhs: number) {
    const manager = this.manager;
    return (
      isNonGroundUninterp(manager, lhs) &&
      this.isUnique(manager.decls[lhs]) &&
      !isDependingOn(manager, rhs, manager.decls[lhs]) &&
      isFullyDependingOn(manager, lhs, numDecls)
    );
  }

  private getQuasiMacro(expr: number): QuasiMacro | undefined {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_QUANTIFIER || !manager.getQuantifier(expr).isForall)
      return undefined;
    const numDecls = manager.getQuantifier(expr).sorts.length;
    const body = manager.getQuantifier(expr).body;
    const isUniqueUninterp = (term: number) =>
      isNonGroundUninterp(manager, term) && this.isUnique(manager.decls[term]);
    if (manager.getOp(body) === OP_EQ) {
      const lhs = manager.getArg(body, 0);
      const rhs = manager.getArg(body, 1);
      if (this.isQuasiDef(numDecls, lhs, rhs)) return { head: lhs, def: rhs };
      if (this.isQuasiDef(numDecls, rhs, lhs)) return { head: rhs, def: lhs };
      return undefined;
    }
    if (manager.isNot(body) && isUniqueUninterp(manager.getArg(body, 0)))
      return { head: manager.getArg(body, 0), def: manager.falseExpr };
    if (isUniqueUninterp(body)) return { head: body, def: manager.trueExpr };
    if (!manager.isNot(body)) return undefined;
    const eq = manager.getArg(body, 0);
    if (manager.getOp(eq) !== OP_EQ || !manager.isBool(manager.getArg(eq, 0))) return undefined;
    const lhs = manager.getArg(eq, 0);
    const rhs = manager.getArg(eq, 1);
    if (this.isQuasiDef(numDecls, lhs, rhs)) return { head: lhs, def: manager.mkNot(rhs) };
    if (this.isQuasiDef(numDecls, rhs, lhs)) return { head: rhs, def: manager.mkNot(lhs) };
    return undefined;
  }

  // The macro comes with a reference, which the caller releases, and -1 is no macro.
  private toMacro(quantifier: number, macro: QuasiMacro) {
    const manager = this.manager;
    const data = manager.getQuantifier(quantifier);
    const funcDecl = manager.funcDecls[manager.decls[macro.head]];
    const newNames: SmtSymbol[] = [];
    const newSorts: number[] = [];
    this.newVars.reset();
    this.newEqs.reset();
    const isSeen = Array.from({ length: data.sorts.length }, () => false);
    let numSeen = 0;
    for (const [index, arg] of manager.getArgs(macro.head).entries()) {
      const isVar = manager.kinds[arg] === KIND_VAR;
      if (!isVar && !manager.isGround(arg)) return -1;
      if (isVar && !isSeen[manager.values[arg]]) {
        this.newVars.push(arg);
        isSeen[manager.values[arg]] = true;
        numSeen++;
        continue;
      }
      const sort = funcDecl.domain[index];
      newNames.push(`X${newNames.length}`);
      newSorts.push(sort);
      this.newVars.push(manager.mkVar(newNames.length - 1 + data.sorts.length, sort));
      this.newEqs.push(manager.mkEq(this.newVars.items[this.newVars.size - 1], arg));
    }
    if (numSeen < data.sorts.length) return -1;
    const app = manager.mkApp(manager.decls[macro.head], this.newVars.items, funcDecl.range);
    manager.incRef(app);
    const elseDecl = manager.mkFreshFuncDecl(
      funcDecl.name,
      funcDecl.domain,
      funcDecl.range,
      true,
      "else",
    );
    const elseApp = manager.mkApp(elseDecl, this.newVars.items, funcDecl.range);
    manager.incRef(elseApp);
    const ite = manager.mkApp(
      OP_ITE,
      [manager.mkApp(OP_AND, this.newEqs.items, SORT_BOOL), macro.def, elseApp],
      funcDecl.range,
    );
    manager.incRef(ite);
    const eq = manager.mkEq(app, ite);
    manager.incRef(eq);
    const result = manager.mkQuantifier({
      isForall: true,
      sorts: [...newSorts.toReversed(), ...data.sorts],
      names: [...newNames.toReversed(), ...data.names],
      body: eq,
      patterns: [],
      noPatterns: [],
      weight: 0,
      qid: "",
    });
    manager.incRef(result);
    manager.decRef(eq);
    manager.decRef(ite);
    manager.decRef(elseApp);
    manager.decRef(app);
    return result;
  }

  private findMacros(forms: number[]) {
    const manager = this.manager;
    let isFound = false;
    this.occurrences.clear();
    for (const form of forms) this.findOccurrences(form);
    for (const form of forms) {
      const quasiMacro = this.getQuasiMacro(form);
      if (quasiMacro === undefined) continue;
      manager.incRef(quasiMacro.head);
      manager.incRef(quasiMacro.def);
      const macro = this.toMacro(form, quasiMacro);
      if (macro !== -1 && this.macros.insert(manager.decls[quasiMacro.head], macro)) isFound = true;
      if (macro !== -1) manager.decRef(macro);
      manager.decRef(quasiMacro.def);
      manager.decRef(quasiMacro.head);
    }
    return isFound;
  }

  apply(forms: RefVector) {
    const manager = this.manager;
    if (!this.findMacros(forms.items)) return false;
    for (let index = 0; index < forms.size; index++) {
      const expanded = this.macros.expand(forms.items[index]);
      const rewritten = this.rewriter.rewrite(expanded);
      forms.set(index, rewritten);
      manager.decRef(rewritten);
      manager.decRef(expanded);
    }
    return true;
  }

  release() {
    this.newEqs.reset();
    this.newVars.reset();
    this.rewriter.release();
  }
}

export const findQuasiMacros = (manager: AstManager, goal: Goal) => {
  if (manager.recFunBodies.size > 0) return;
  const macros = new MacroManager(manager);
  const quasiMacros = new QuasiMacros(manager, macros);
  const forms = new RefVector(manager);
  for (const form of goal.forms.items) forms.push(form);
  do manager.limit.checkpoint();
  while (quasiMacros.apply(forms));
  goal.reset();
  for (const form of forms.items) goal.assert(form);
  const definitions = macros.getInterpretations();
  goal.addDefinitions(definitions);
  for (const definition of definitions) manager.decRef(definition.def);
  goal.depth++;
  forms.reset();
  quasiMacros.release();
  macros.release();
};

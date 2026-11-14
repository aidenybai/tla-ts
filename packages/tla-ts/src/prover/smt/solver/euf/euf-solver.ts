// Ported from Z3 (src/sat/smt/euf_solver.h, src/sat/smt/euf_solver.cpp,
// src/sat/smt/euf_internalize.cpp, src/sat/smt/euf_model.cpp, src/util/top_sort.h), MIT license,
// see z3-license.txt.
import { SmtInvariantError, SmtUnsupportedError } from "../../../../errors";
import {
  type AstManager,
  FAMILY_BASIC,
  FAMILY_MODEL_VALUE,
  FAMILY_USER,
  KIND_QUANTIFIER,
  OP_DISTINCT,
  OP_EQ,
  OP_ITE,
  SORT_SIZE_INFINITE,
  SORT_SIZE_VERY_BIG,
  QUANTIFIER_LAMBDA,
} from "../ast";
import { ObjHashtable } from "../hashtable";
import { L_FALSE, L_TRUE, L_UNDEF } from "../lbool";
import type { ProtoModel } from "../proto-model";
import { FuncInterp } from "../proto-model";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "../rewriter";
import { NULL_LITERAL } from "../sat/clause";
import {
  CR_CONTINUE,
  CR_DONE,
  CR_GIVEUP,
  JUSTIFICATION_EXT,
  type SatExtension,
  type Solver,
} from "../sat/solver";
import { Egraph, type Enode, getClass, mkExternal, NULL_BOOL_VAR } from "./egraph";
import {
  addDependency,
  type Dependencies,
  type ThExplain,
  type ThSolver,
  TrailStack,
} from "./th-solver";

// The sat_internalizer that goal2sat gives the euf solver.
export interface EufInternalizer {
  internalize(expr: number): number;
  isBoolOp(expr: number): boolean;
  addBoolVar(expr: number): number;
  toBoolVar(expr: number): number;
  push(): void;
  pop(numScopes: number): void;
  uncache(lit: number): void;
  cache(expr: number, lit: number): void;
  isCached(expr: number, lit: number): boolean;
  setExpr2VarReplay(replay: Map<number, number> | null): void;
}

// A theory solver for the family of a declaration, created on first use like euf::solver::get_solver.
export type ThSolverFactory = (ctx: EufSolver, family: number) => ThSolver | null;

const K_CONFLICT = 0;
const K_EQ = 1;
const K_LIT = 2;

interface Constraint {
  readonly owner: ThSolver | null;
  readonly kind: number;
  readonly node: Enode | null;
  readonly data: unknown;
}

// The external justification of an egraph merge: a literal, or the index of a theory constraint.
const literalPayload = (lit: number) => lit * 2;
const constraintPayload = (index: number) => index * 2 + 1;
const isLiteralPayload = (payload: number) => (payload & 1) === 0;

interface Reinit {
  readonly expr: number;
  readonly generation: number;
  readonly boolVar: number;
}

export class EufSolver implements SatExtension {
  readonly egraph: Egraph;
  readonly solvers: ThSolver[] = [];
  private id2solver = new Map<number, ThSolver>();
  qsolver: ThSolver | null = null;
  private boolVar2exprs: (number | undefined)[] = [];
  private varTrail: number[] = [];
  private scopes: number[] = [];
  readonly trail = new TrailStack();
  readonly unhandledFunctions: number[] = [];
  generation = 0;
  private constraints: Constraint[] = [
    { owner: null, kind: K_CONFLICT, node: null, data: null },
    { owner: null, kind: K_EQ, node: null, data: null },
  ];
  private explanation: number[] = [];
  private assertedVars: boolean[] = [];
  private reinits: Reinit[] = [];
  private stack: { expr: number; index: number }[] = [];
  private rewriter: Rewriter;
  reasonUnknown = "";
  private values: (number | undefined)[] = [];
  private values2rootMap: Map<number, Enode> | null = null;
  qmodel: ProtoModel | null = null;

  constructor(
    readonly manager: AstManager,
    readonly si: EufInternalizer,
    readonly s: Solver,
    private mkThSolver: ThSolverFactory,
  ) {
    this.egraph = new Egraph(manager);
    this.egraph.onPropagateLiteral = (node, ante) => this.propagateLiteral(node, ante);
    this.rewriter = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  getEnode(expr: number) {
    return this.egraph.find(expr);
  }

  boolVar2expr(boolVar: number) {
    return this.boolVar2exprs[boolVar];
  }

  private setBoolVar2expr(boolVar: number, expr: number) {
    this.varTrail.push(boolVar);
    while (this.boolVar2exprs.length <= boolVar) this.boolVar2exprs.push(undefined);
    this.boolVar2exprs[boolVar] = expr;
  }

  expr2literal(expr: number) {
    return 2 * (this.egraph.find(expr) as Enode).boolVar;
  }

  rewrite(expr: number) {
    return this.rewriter.rewrite(expr);
  }

  private boolVar2solver(boolVar: number) {
    const expr = this.boolVar2exprs[boolVar];
    return expr === undefined ? null : this.expr2solver(expr);
  }

  expr2solver(expr: number) {
    const manager = this.manager;
    if (manager.isApp(expr)) return this.decl2solver(manager.decls[expr]);
    return manager.kinds[expr] === KIND_QUANTIFIER &&
      manager.getQuantifier(expr).kind !== QUANTIFIER_LAMBDA
      ? this.quantifier2solver()
      : null;
  }

  private quantifier2solver() {
    if (this.qsolver !== null) return this.qsolver;
    const solver = this.mkThSolver(this, -1);
    if (solver === null) return null;
    this.qsolver = solver;
    this.addSolver(solver);
    return solver;
  }

  decl2solver(decl: number) {
    return this.getSolver(this.manager.funcDecls[decl].family, decl);
  }

  sort2solver(sort: number) {
    return this.getSolver(this.manager.getSortFamily(sort), -1);
  }

  fid2solver(family: number) {
    return this.id2solver.get(family);
  }

  private getSolver(family: number, decl: number) {
    if (family < 0) return null;
    const existing = this.id2solver.get(family);
    if (existing !== undefined) return existing;
    if (family === FAMILY_BASIC || family === FAMILY_USER) return null;
    const solver = this.mkThSolver(this, family);
    if (solver !== null) this.addSolver(solver);
    else if (decl !== -1) this.unhandledFunction(decl);
    return solver;
  }

  private addSolver(solver: ThSolver) {
    for (let index = 0; index < this.s.scopeLvl; index++) solver.push();
    this.solvers.push(solver);
    this.id2solver.set(solver.id, solver);
    if (solver.useDiseqs()) this.egraph.setThPropagatesDiseqs(solver.id);
  }

  private unhandledFunction(decl: number) {
    if (
      this.unhandledFunctions.includes(decl) ||
      this.manager.funcDecls[decl].family === FAMILY_MODEL_VALUE
    )
      return;
    this.unhandledFunctions.push(decl);
    this.trail.push(() => this.unhandledFunctions.pop());
  }

  hasUnhandled() {
    return this.unhandledFunctions.length > 0;
  }

  // euf_internalize.cpp

  internalizeTerm(expr: number) {
    if (this.getEnode(expr) !== undefined) return;
    if (this.si.isBoolOp(expr)) this.attachLit(this.si.internalize(expr), expr);
    else {
      const solver = this.expr2solver(expr);
      if (solver !== null) solver.internalizeTerm(expr);
      else this.visitRec(expr, false, false);
    }
  }

  mkLiteral(expr: number) {
    const manager = this.manager;
    const isNot = manager.isNot(expr);
    const lit = this.internalize(isNot ? manager.getArg(expr, 0) : expr, false, false);
    return isNot ? lit ^ 1 : lit;
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean): number {
    const manager = this.manager;
    const node = this.getEnode(expr);
    if (node !== undefined)
      return manager.isBool(expr) ? 2 * node.boolVar + (isSign ? 1 : 0) : NULL_LITERAL;
    if (this.si.isBoolOp(expr)) {
      const lit = this.attachLit(this.si.internalize(expr), expr);
      return isSign ? lit ^ 1 : lit;
    }
    const solver = this.expr2solver(expr);
    if (solver !== null) return solver.internalize(expr, isSign, isRoot);
    if (!this.visitRec(expr, isSign, isRoot)) return NULL_LITERAL;
    return manager.isBool(expr) ? 2 * this.si.toBoolVar(expr) + (isSign ? 1 : 0) : NULL_LITERAL;
  }

  // sat::th_internalizer::visit_rec
  private visitRec(expr: number, isSign: boolean, isRoot: boolean) {
    const stack = this.stack;
    const manager = this.manager;
    const base = stack.length;
    this.visit(expr);
    loop: while (stack.length > base) {
      const frame = stack[stack.length - 1];
      const current = frame.expr;
      if (this.egraph.find(current) !== undefined) {
        stack.pop();
        continue;
      }
      const numArgs = manager.getNumArgs(current);
      while (frame.index < numArgs)
        if (!this.visit(manager.getArg(current, frame.index++))) continue loop;
      if (
        this.egraph.find(current) === undefined &&
        !this.postVisit(current, isSign, isRoot && current === expr)
      ) {
        stack.length = base;
        return false;
      }
      stack.pop();
    }
    return true;
  }

  private visit(expr: number) {
    const manager = this.manager;
    const node = this.egraph.find(expr);
    if (node !== undefined) {
      if (!this.si.isBoolOp(expr)) {
        const solver = this.expr2solver(expr);
        if (solver !== null && node.getThVar(solver.id) === -1) solver.internalizeTerm(expr);
      }
      return true;
    }
    if (this.si.isBoolOp(expr)) {
      this.attachLit(this.si.internalize(expr), expr);
      return true;
    }
    if (manager.isApp(expr) && manager.getNumArgs(expr) > 0) {
      this.stack.push({ expr, index: 0 });
      return false;
    }
    const solver = this.expr2solver(expr);
    if (solver !== null) solver.internalizeTerm(expr);
    else this.attachNode(this.mkEnode(expr, []));
    return true;
  }

  private postVisit(expr: number, isSign: boolean, isRoot: boolean) {
    const manager = this.manager;
    const args = manager.isApp(expr)
      ? manager.getArgs(expr).map((arg) => this.egraph.find(arg) as Enode)
      : [];
    if (isRoot && this.internalizeRoot(expr, isSign, args)) return false;
    const solver = this.expr2solver(expr);
    if (solver !== null) solver.internalizeTerm(expr);
    else this.attachNode(this.mkEnode(expr, args));
    return true;
  }

  attachNode(node: Enode) {
    const manager = this.manager;
    const expr = node.owner;
    const sort = manager.sorts[expr];
    if (manager.isBool(expr)) this.attachLit(2 * this.si.addBoolVar(expr), expr);
    if (!manager.isBool(expr) && !manager.isUninterpretedSort(sort)) {
      const exprSolver = this.expr2solver(expr);
      const sortSolver = this.sort2solver(sort);
      if (sortSolver !== null && sortSolver !== exprSolver) sortSolver.applySortCnstr(node, sort);
      else if (sortSolver === null && exprSolver === null && manager.isApp(expr))
        this.unhandledFunction(manager.decls[expr]);
    }
    if (manager.getFamily(expr) === FAMILY_BASIC && manager.getOp(expr) === OP_EQ)
      this.sort2solver(manager.sorts[manager.getArg(expr, 0)])?.eqInternalized(node);
    this.axiomatizeBasic(node);
  }

  attachLit(lit: number, expr: number) {
    const s = this.s;
    let boolVar = lit >> 1;
    s.setExternal(boolVar);
    s.setEliminated(boolVar, false);
    let result = lit;
    if ((lit & 1) === 1) {
      boolVar = this.si.addBoolVar(expr);
      s.setExternal(boolVar);
      s.setEliminated(boolVar, false);
      this.setBoolVar2expr(boolVar, expr);
      this.varTrail.push(boolVar);
      const lit2 = 2 * boolVar;
      s.mkClause([lit ^ 1, lit2]);
      s.mkClause([lit, lit2 ^ 1]);
      result = lit2;
    }
    if (this.boolVar2exprs[boolVar] !== undefined && this.egraph.find(expr) !== undefined)
      return result;
    this.setBoolVar2expr(boolVar, expr);
    const node = this.egraph.find(expr) ?? this.mkEnode(expr, []);
    node.boolVar = boolVar;
    if (this.si.isBoolOp(expr)) this.egraph.setCgcEnabled(node, false);
    const value = s.value(result);
    if (value !== L_UNDEF)
      this.egraph.setValue(
        node,
        value,
        mkExternal(literalPayload(value === L_TRUE ? result : result ^ 1)),
      );
    return result;
  }

  private internalizeRoot(expr: number, isSign: boolean, args: readonly Enode[]) {
    const manager = this.manager;
    if (manager.getFamily(expr) !== FAMILY_BASIC || manager.getOp(expr) !== OP_DISTINCT)
      return false;
    if (isSign) this.addNotDistinctAxiom(expr, args);
    else this.addDistinctAxiom(expr, args);
    return true;
  }

  private addNotDistinctAxiom(expr: number, args: readonly Enode[]) {
    const manager = this.manager;
    const size = args.length;
    if (size <= 1) {
      this.s.mkClause([]);
      return;
    }
    if (new Set(manager.getArgs(expr)).size < size) return;
    if (size > 32) throw new SmtUnsupportedError("distinct over more than 32 arguments");
    const lits: number[] = [];
    for (let first = 0; first < size; first++)
      for (let second = first + 1; second < size; second++)
        lits.push(this.mkLiteral(this.mkEq(args[first].owner, args[second].owner)));
    this.s.mkClause(lits);
  }

  private addDistinctAxiom(expr: number, args: readonly Enode[]) {
    const manager = this.manager;
    const size = args.length;
    if (size <= 1) return;
    const sortSize = manager.getSortSize(manager.sorts[manager.getArg(expr, 0)]);
    if (sortSize !== SORT_SIZE_INFINITE && sortSize !== SORT_SIZE_VERY_BIG && sortSize < size) {
      this.s.mkClause([]);
      return;
    }
    if (size > 32) throw new SmtUnsupportedError("distinct over more than 32 arguments");
    for (let first = 0; first < size; first++)
      for (let second = first + 1; second < size; second++)
        this.s.mkClause([this.mkLiteral(this.mkEq(args[first].owner, args[second].owner)) ^ 1]);
  }

  private axiomatizeBasic(node: Enode) {
    const manager = this.manager;
    const expr = node.owner;
    if (manager.getFamily(expr) !== FAMILY_BASIC) return;
    const op = manager.getOp(expr);
    if (op === OP_ITE && !manager.isBool(expr)) {
      const condition = manager.getArg(expr, 0);
      const thenExpr = manager.getArg(expr, 1);
      const elseExpr = manager.getArg(expr, 2);
      const thenLit = this.mkLiteral(this.mkEq(expr, thenExpr));
      if (thenExpr === elseExpr) {
        this.s.mkClause([thenLit]);
        return;
      }
      const conditionLit = this.mkLiteral(condition);
      const elseLit = this.mkLiteral(this.mkEq(expr, elseExpr));
      this.s.mkClause([conditionLit ^ 1, thenLit]);
      this.s.mkClause([conditionLit, elseLit]);
    } else if (op === OP_DISTINCT) {
      const eqs: number[] = [];
      for (let first = 0; first < node.numArgs; first++)
        for (let second = first + 1; second < node.numArgs; second++)
          eqs.push(this.mkEq(node.getArg(first).owner, node.getArg(second).owner));
      const disjunction =
        eqs.length === 0 ? manager.falseExpr : eqs.length === 1 ? eqs[0] : manager.mkOr(eqs);
      manager.incRef(disjunction);
      const distinctLit = 2 * this.si.toBoolVar(expr);
      const someEq = this.si.internalize(disjunction);
      this.s.mkClause([distinctLit ^ 1, someEq ^ 1]);
      this.s.mkClause([distinctLit, someEq]);
    } else if (op === OP_EQ && !manager.isBool(manager.getArg(expr, 0)))
      this.s.setPhaseLiteral(this.expr2literal(expr));
  }

  isShared(node: Enode) {
    const manager = this.manager;
    const root = node.root;
    if (root.isShared !== L_UNDEF) return root.isShared === L_TRUE;
    const setShared = (isShared: boolean) => {
      root.isShared = isShared ? L_TRUE : L_FALSE;
      return isShared;
    };
    if (manager.getFamily(root.owner) === FAMILY_BASIC && manager.getOp(root.owner) === OP_ITE)
      return setShared(true);
    let thId = FAMILY_BASIC;
    for (const thVar of root.thVars) {
      if (thVar.id === FAMILY_BASIC) continue;
      if (thId !== FAMILY_BASIC) return setShared(true);
      thId = thVar.id;
    }
    if (manager.isBool(root.owner) && thId !== FAMILY_BASIC) return setShared(true);
    for (const parent of root.parents) {
      const family = manager.getFamily(parent.owner);
      if (this.isBetaRedex(parent, root)) continue;
      if (family !== thId && family !== FAMILY_BASIC) return setShared(true);
    }
    for (const thVar of root.thVars)
      if (this.id2solver.get(thVar.id)?.isShared(thVar.thVar) === true) return setShared(true);
    return setShared(false);
  }

  isBetaRedex(parent: Enode, node: Enode) {
    for (const thVar of parent.thVars)
      if (this.id2solver.get(thVar.id)?.isBetaRedex(parent, node) === true) return true;
    return false;
  }

  mkEq(first: number, second: number) {
    const manager = this.manager;
    if (first === second) return manager.trueExpr;
    if (manager.areDistinct(first, second)) return manager.falseExpr;
    const swapped = manager.mkEq(second, first);
    return this.egraph.find(swapped) !== undefined ? swapped : manager.mkEq(first, second);
  }

  getMaxGeneration(expr: number) {
    const manager = this.manager;
    let generation = 0;
    const visited = new Set<number>();
    const todo = [expr];
    while (todo.length > 0) {
      const current = todo.pop() as number;
      if (visited.has(current)) continue;
      visited.add(current);
      const node = this.egraph.find(current);
      if (node !== undefined) generation = Math.max(generation, node.generation);
      else if (manager.isApp(current)) todo.push(...manager.getArgs(current));
    }
    return generation;
  }

  eInternalize(expr: number) {
    const existing = this.egraph.find(expr);
    if (existing !== undefined) return existing;
    this.internalizeTerm(expr);
    return this.egraph.find(expr) as Enode;
  }

  mkEnode(expr: number, args: readonly Enode[]) {
    const manager = this.manager;
    const isBoolOp = this.si.isBoolOp(expr);
    const isIte = manager.getFamily(expr) === FAMILY_BASIC && manager.getOp(expr) === OP_ITE;
    const nodeArgs = isBoolOp || isIte ? [] : args;
    const node = this.egraph.mk(expr, this.generation, nodeArgs);
    if (isBoolOp) this.egraph.setCgcEnabled(node, false);
    for (const arg of nodeArgs)
      if (manager.isBool(arg.owner)) this.egraph.setMergeTfEnabled(arg, true);
    return node;
  }

  addClause(lits: number[], isRedundant: boolean) {
    this.s.mkClause(lits, isRedundant, true);
  }

  // euf_solver.cpp

  mkConstraint(owner: ThSolver, data: unknown) {
    return this.pushConstraint({ owner, kind: K_LIT, node: null, data });
  }

  private pushConstraint(constraint: Constraint) {
    const index = this.constraints.length;
    this.constraints.push(constraint);
    this.trail.push(() => this.constraints.pop());
    return index;
  }

  private litConstraint(node: Enode) {
    return this.pushConstraint({ owner: null, kind: K_LIT, node, data: null });
  }

  propagated() {
    return false;
  }

  setConflict(index: number) {
    this.s.setConflict(this.s.scopeLvl, JUSTIFICATION_EXT, index);
  }

  propagate(lit: number, index: number) {
    this.s.assign(lit, this.s.scopeLvl, JUSTIFICATION_EXT, index);
  }

  propagateEq(first: Enode, second: Enode, index: number) {
    if (first.root === second.root) return false;
    this.egraph.merge(first, second, constraintPayload(index));
    return true;
  }

  resolveConflict() {
    return L_UNDEF;
  }

  getAntecedents(lit: number, index: number, antecedents: number[]) {
    const constraint = this.constraints[index];
    const egraph = this.egraph;
    egraph.beginExplain();
    this.explanation = [];
    if (constraint.owner === null) this.getEufAntecedents(lit, constraint);
    else constraint.owner.getAntecedents(lit, constraint.data, antecedents);
    this.explainQueue(antecedents);
    egraph.endExplain();
    let kept = 0;
    for (const antecedent of antecedents)
      if (this.s.lvl(antecedent) > 0) antecedents[kept++] = antecedent;
    antecedents.length = kept;
  }

  private explainQueue(antecedents: number[]) {
    const explanation = this.explanation;
    for (let head = 0; head < explanation.length; head++) {
      const payload = explanation[head];
      if (isLiteralPayload(payload)) antecedents.push(payload >> 1);
      else {
        const constraint = this.constraints[payload >> 1];
        (constraint.owner as ThSolver).getAntecedents(NULL_LITERAL, constraint.data, antecedents);
      }
    }
  }

  getEqAntecedents(first: Enode, second: Enode, antecedents: number[]) {
    this.egraph.beginExplain();
    this.explanation = [];
    this.egraph.explainEq(this.explanation, first, second);
    this.explainQueue(antecedents);
    this.egraph.endExplain();
  }

  addEqAntecedent(first: Enode, second: Enode) {
    this.egraph.explainEq(this.explanation, first, second);
  }

  getThAntecedents(explain: ThExplain, antecedents: number[]) {
    for (const lit of explain.lits) antecedents.push(lit);
    for (const eq of explain.eqs) this.egraph.explainEq(this.explanation, eq[0], eq[1]);
  }

  explainDiseq(justifications: number[], first: Enode, second: Enode) {
    const boolVar = this.egraph.explainDiseq(justifications, first, second);
    if (boolVar !== NULL_BOOL_VAR) justifications.push(literalPayload(2 * boolVar + 1));
  }

  private getEufAntecedents(lit: number, constraint: Constraint) {
    const egraph = this.egraph;
    if (constraint.kind === K_CONFLICT) {
      egraph.explain(this.explanation);
      return;
    }
    const node = egraph.find(this.boolVar2exprs[lit >> 1] as number) as Enode;
    if (constraint.kind === K_EQ) {
      egraph.explainEq(this.explanation, node.getArg(0), node.getArg(1));
      return;
    }
    const ante = constraint.node as Enode;
    egraph.explainEq(this.explanation, node, ante);
    const manager = this.manager;
    if (!manager.isTrue(ante.owner) && !manager.isFalse(ante.owner))
      this.explanation.push(literalPayload(2 * ante.boolVar + (ante.value === L_FALSE ? 1 : 0)));
  }

  setEliminated(boolVar: number) {
    this.si.uncache(2 * boolVar);
    this.si.uncache(2 * boolVar + 1);
  }

  asserted(lit: number) {
    const expr = this.boolVar2exprs[lit >> 1];
    if (expr === undefined) return;
    const egraph = this.egraph;
    const node = egraph.find(expr);
    if (node === undefined) return;
    const boolVar = lit >> 1;
    if (this.assertedVars[boolVar] === true) return;
    while (this.assertedVars.length <= boolVar) this.assertedVars.push(false);
    this.assertedVars[boolVar] = true;
    this.trail.push(() => {
      this.assertedVars[boolVar] = false;
    });
    const isSign = (lit & 1) === 1;
    const oldValue = node.value;
    const newValue = isSign ? L_FALSE : L_TRUE;
    egraph.setValue(node, newValue, mkExternal(literalPayload(lit)));
    if (oldValue === L_UNDEF && node.isCgcEnabled)
      for (const other of getClass(node)) {
        if (other.boolVar === NULL_BOOL_VAR || other.value === newValue) continue;
        const otherLit = 2 * other.boolVar + (isSign ? 1 : 0);
        if (this.s.value(otherLit) === L_TRUE) continue;
        this.propagate(otherLit, this.litConstraint(node));
        if (this.s.value(otherLit) === L_FALSE) return;
      }
    for (const thVar of node.thVars) (this.id2solver.get(thVar.id) as ThSolver).asserted(lit);
    if (node.mergeTf)
      egraph.merge(node, isSign ? this.mkFalse() : this.mkTrue(), literalPayload(lit));
    if (node.isEquality) {
      if (isSign) egraph.newDiseq(node);
      else egraph.merge(node.getArg(0), node.getArg(1), literalPayload(lit));
    }
  }

  canPropagate() {
    return this.egraph.canPropagate();
  }

  unitPropagate() {
    let isPropagated = false;
    const egraph = this.egraph;
    while (!this.s.isInconsistent) {
      if (egraph.isInconsistent) {
        this.setConflict(K_CONFLICT);
        return true;
      }
      let isPropagatedOnce = false;
      if (egraph.propagate()) {
        this.propagateThEqs();
        isPropagatedOnce = true;
      }
      for (let index = 0; index < this.solvers.length; index++)
        if (this.solvers[index].unitPropagate()) isPropagatedOnce = true;
      if (!isPropagatedOnce) break;
      isPropagated = true;
    }
    return isPropagated;
  }

  private propagateLiteral(node: Enode, ante: Enode | null) {
    const manager = this.manager;
    const boolVar = node.boolVar;
    if (boolVar === NULL_BOOL_VAR) return;
    const constraint = ante === null ? K_EQ : this.litConstraint(ante);
    const lit =
      ante === null
        ? 2 * boolVar
        : 2 * boolVar +
          ((ante.value === L_UNDEF
            ? manager.isTrue(ante.owner)
              ? L_TRUE
              : L_FALSE
            : ante.value) === L_FALSE
            ? 1
            : 0);
    if (this.s.value(lit) !== L_TRUE) {
      this.s.assign(lit, this.s.scopeLvl, JUSTIFICATION_EXT, constraint);
      return;
    }
    if (!node.mergeTf || manager.isValue(node.root.owner)) return;
    this.egraph.merge(node, ante ?? this.mkTrue(), literalPayload(lit));
  }

  private isSelfPropagated(eq: {
    readonly id: number;
    readonly child: Enode;
    readonly root: Enode | null;
  }) {
    if (eq.root === null) return false;
    const egraph = this.egraph;
    egraph.beginExplain();
    const explanation: number[] = [];
    egraph.explainEq(explanation, eq.child, eq.root);
    egraph.endExplain();
    if (egraph.usesCongruence) return false;
    for (const payload of explanation) {
      if (isLiteralPayload(payload)) return false;
      const owner = this.constraints[payload >> 1].owner;
      if (owner === null || owner.id !== eq.id || owner.isSelfPropagating()) return false;
    }
    return true;
  }

  private propagateThEqs() {
    const egraph = this.egraph;
    for (
      ;
      egraph.hasThEq() && !this.s.isInconsistent && !egraph.isInconsistent;
      egraph.nextThEq()
    ) {
      const eq = egraph.getThEq();
      const solver = this.id2solver.get(eq.id) as ThSolver;
      if (eq.root === null) solver.newDiseqEh(eq);
      else if (!this.isSelfPropagated(eq)) solver.newEqEh(eq);
    }
  }

  mkTrue() {
    this.visit(this.manager.trueExpr);
    return this.egraph.find(this.manager.trueExpr) as Enode;
  }

  mkFalse() {
    this.visit(this.manager.falseExpr);
    return this.egraph.find(this.manager.falseExpr) as Enode;
  }

  check() {
    if (this.unitPropagate()) return CR_CONTINUE;
    const numNodes = this.egraph.numNodes;
    let isGivenUp = false;
    let isContinued = false;
    const applySolver = (solver: ThSolver) => {
      const result = solver.check();
      if (result === CR_CONTINUE) isContinued = true;
      else if (result === CR_GIVEUP) {
        this.reasonUnknown = `incomplete theory ${solver.name}`;
        isGivenUp = true;
      }
    };
    if (this.mergeSharedBools()) isContinued = true;
    for (let index = 0; index < this.solvers.length; index++) {
      const solver = this.solvers[index];
      if (!this.manager.limit.inc()) {
        this.reasonUnknown = "canceled";
        return CR_GIVEUP;
      }
      if (solver === this.qsolver) continue;
      applySolver(solver);
      if (this.s.isInconsistent) return CR_CONTINUE;
    }
    if (this.s.isInconsistent || isContinued) return CR_CONTINUE;
    if (this.qsolver !== null) applySolver(this.qsolver);
    if (numNodes < this.egraph.numNodes || isContinued) return CR_CONTINUE;
    if (isGivenUp) return CR_GIVEUP;
    for (const solver of this.solvers) solver.finalize();
    return CR_DONE;
  }

  getReasonUnknown() {
    return this.reasonUnknown;
  }

  private mergeSharedBools() {
    const manager = this.manager;
    let isMerged = false;
    const nodes = this.egraph.nodes;
    for (let index = nodes.length; index-- > 0;) {
      const node = nodes[index];
      if (!manager.isBool(node.owner) || !this.isShared(node)) continue;
      if (node.value === L_TRUE && node.isCgcEnabled && !manager.isTrue(node.root.owner)) {
        this.egraph.merge(node, this.mkTrue(), literalPayload(2 * node.boolVar));
        isMerged = true;
      }
      if (node.value === L_FALSE && node.isCgcEnabled && !manager.isFalse(node.root.owner)) {
        this.egraph.merge(node, this.mkFalse(), literalPayload(2 * node.boolVar + 1));
        isMerged = true;
      }
    }
    return isMerged;
  }

  push() {
    this.si.push();
    this.scopes.push(this.varTrail.length);
    this.trail.pushScope();
    for (const solver of this.solvers) solver.push();
    this.egraph.pushScope();
  }

  pop(numScopes: number) {
    this.startReinit();
    this.trail.popScope(numScopes);
    for (const solver of this.solvers) solver.pop(numScopes);
    this.si.pop(numScopes);
    this.egraph.popScopes(numScopes);
    const varLim = this.scopes[this.scopes.length - numScopes];
    for (let index = this.varTrail.length; index-- > varLim;) {
      const boolVar = this.varTrail[index];
      this.boolVar2exprs[boolVar] = undefined;
      this.s.setNonExternal(boolVar);
    }
    this.varTrail.length = varLim;
    this.scopes.length -= numScopes;
  }

  private startReinit() {
    this.reinits = [];
    for (const boolVar of this.s.varsToReinit) {
      const expr = this.boolVar2exprs[boolVar];
      if (expr === undefined) continue;
      this.manager.incRef(expr);
      this.reinits.push({
        expr,
        generation: this.getEnode(expr)?.generation ?? 0,
        boolVar,
      });
    }
  }

  popReinit() {
    this.finishReinit();
    for (const solver of this.solvers) solver.popReinit();
  }

  private finishReinit() {
    if (this.reinits.length === 0) return;
    const manager = this.manager;
    const si = this.si;
    const replay = new Map<number, number>();
    for (const reinit of this.reinits) replay.set(reinit.expr, reinit.boolVar);
    si.setExpr2VarReplay(replay);
    for (const reinit of this.reinits) {
      const expr = reinit.expr;
      const oldGeneration = this.generation;
      this.generation = reinit.generation;
      const lit = si.isBoolOp(expr) ? 2 * (replay.get(expr) as number) : si.internalize(expr);
      const isConnective =
        manager.getFamily(expr) === FAMILY_BASIC &&
        (si.isBoolOp(expr) ||
          (manager.getOp(expr) === OP_EQ && manager.isBool(manager.getArg(expr, 0))));
      if (this.egraph.find(expr) === undefined && !isConnective) {
        const args = manager.isApp(expr)
          ? manager.getArgs(expr).map((arg) => this.eInternalize(arg))
          : [];
        this.internalizeTerm(expr);
        if (this.egraph.find(expr) === undefined) this.mkEnode(expr, args);
      } else this.attachLit(lit, expr);
      this.generation = oldGeneration;
    }
    for (const entry of replay)
      if (si.isBoolOp(entry[0]) && !si.isCached(entry[0], 2 * entry[1]))
        si.cache(entry[0], 2 * entry[1]);
    si.setExpr2VarReplay(null);
    for (const reinit of this.reinits) manager.decRef(reinit.expr);
    this.reinits = [];
  }

  isRelevant() {
    return true;
  }

  getPhase(boolVar: number) {
    return this.boolVar2solver(boolVar)?.getPhase(boolVar) ?? L_UNDEF;
  }

  isExternal(boolVar: number) {
    if (this.s.isExternal(boolVar) || this.boolVar2exprs[boolVar] !== undefined) return true;
    return this.solvers.some((solver) => solver.isExternal(boolVar));
  }

  initSearch() {
    this.reasonUnknown = "";
    for (const solver of this.solvers) solver.initSearch();
  }

  preSimplify() {
    for (const solver of this.solvers) solver.preSimplify();
  }

  simplify() {
    for (const solver of this.solvers) solver.simplify();
  }

  gc() {}

  setRoot() {
    return false;
  }

  flushRoots() {
    for (const solver of this.solvers) solver.flushRoots();
  }

  initUseList() {}

  findMutexes() {}

  // euf_model.cpp

  saveModel(model: ProtoModel) {
    this.qmodel = model;
  }

  updateModel(model: ProtoModel) {
    if (this.qmodel !== null) return this.qmodel;
    for (const solver of this.solvers) solver.initModel();
    this.values = [];
    this.values2rootMap = null;
    const userSorts = new UserSortValues(this.manager);
    const deps = new EnodeTopSort();
    this.collectDependencies(userSorts, deps);
    deps.sort();
    this.dependencies2values(userSorts, deps, model);
    userSorts.registerWith(model);
    this.values2model(deps, model);
    for (const solver of this.solvers) solver.finalizeModel(model);
    return model;
  }

  // validate_model, for its side effect: evaluating an application of a partial theory function,
  // such as a division by zero, completes its interpretation with some value.
  validateModel(model: ProtoModel) {
    if (this.hasUnhandled() || this.solvers.some((solver) => solver.hasUnhandled())) return;
    const manager = this.manager;
    for (const node of this.egraph.nodes) {
      const expr = node.owner;
      if (!manager.isBool(expr) || manager.hasQuantifierFlags[expr] === 1) continue;
      if (node.boolVar === NULL_BOOL_VAR) continue;
      const value = model.eval(expr, false);
      if (
        this.s.value(2 * node.boolVar) === L_TRUE ? manager.isFalse(value) : manager.isTrue(value)
      )
        throw new SmtInvariantError("the euf model falsifies an assignment");
    }
  }

  private includeFuncInterp(decl: number) {
    const info = this.manager.funcDecls[decl];
    if (info.family === FAMILY_USER) return true;
    if (info.family === FAMILY_BASIC || info.isSkolem) return false;
    return this.decl2solver(decl)?.includeFuncInterp(decl) === true;
  }

  private collectDependencies(userSorts: UserSortValues, deps: EnodeTopSort) {
    const manager = this.manager;
    const freshValues: Enode[] = [];
    const nodes = this.egraph.nodes;
    for (const node of nodes) {
      const expr = node.owner;
      const sort = manager.sorts[expr];
      const solver = this.sort2solver(sort);
      if (solver === null) deps.insert(node, null);
      else if (!solver.addDep(node, deps.deps)) freshValues.push(node);
      if (node.isRoot && manager.isUninterpretedSort(sort) && manager.isValue(expr))
        userSorts.registerValue(expr);
    }
    for (const node of freshValues) deps.insert(node, null);
    const freshSet = new Set(freshValues);
    for (const node of freshValues)
      for (const root of nodes)
        if (
          root.isRoot &&
          manager.sorts[root.owner] === manager.sorts[node.owner] &&
          !freshSet.has(root)
        )
          addDependency(deps.deps, node, root);
  }

  private dependencies2values(userSorts: UserSortValues, deps: EnodeTopSort, model: ProtoModel) {
    const manager = this.manager;
    const values = this.values;
    for (const node of deps.sorted) {
      const id = node.root.owner;
      if (values[id] !== undefined) continue;
      const expr = node.owner;
      if (manager.isBool(expr)) {
        if (manager.isUninterpretedConst(expr)) {
          const interp = model.constInterps.get(manager.decls[expr]);
          if (interp !== undefined) {
            values[id] = interp;
            continue;
          }
        }
        if (manager.isTrue(expr) || manager.isFalse(expr)) {
          values[id] = expr;
          continue;
        }
        const value =
          node.value !== L_UNDEF
            ? node.value
            : node.boolVar === NULL_BOOL_VAR
              ? L_UNDEF
              : this.s.value(2 * node.boolVar);
        if (value !== L_UNDEF) values[id] = value === L_TRUE ? manager.trueExpr : manager.falseExpr;
        continue;
      }
      const sort = manager.sorts[expr];
      if (manager.isUninterpretedSort(sort)) {
        userSorts.add(node.root, sort, values);
        continue;
      }
      const solver = this.sort2solver(sort) ?? this.expr2solver(expr);
      if (solver !== null) solver.addValue(node, model, values);
      else if (manager.isApp(expr) && manager.getFamily(expr) !== FAMILY_BASIC) values[id] = expr;
    }
  }

  private values2model(deps: EnodeTopSort, model: ProtoModel) {
    const manager = this.manager;
    const values = this.values;
    for (const node of deps.sorted) {
      const expr = node.owner;
      if (!manager.isApp(expr)) continue;
      const decl = manager.decls[expr];
      if (!this.includeFuncInterp(decl)) continue;
      if (
        manager.isBool(expr) &&
        manager.isUninterpretedConst(expr) &&
        model.constInterps.has(decl)
      )
        continue;
      const value = values[node.root.owner];
      if (value === undefined) continue;
      const arity = node.numArgs;
      if (arity === 0) {
        model.registerConst(decl, value);
        continue;
      }
      let interp = model.funcInterps.get(decl);
      if (interp === undefined) {
        interp = new FuncInterp(manager, arity);
        model.registerFunc(decl, interp);
      }
      const args = manager
        .getArgs(expr)
        .map((arg) => values[(this.getEnode(arg) as Enode).root.owner] as number);
      if (interp.getEntry(args) === undefined) interp.insertNewEntry(args, value);
    }
  }

  modelUpdated(model: ProtoModel) {
    this.values2rootMap = null;
    for (const node of this.egraph.nodes)
      if (node.isRoot && this.values[node.owner] !== undefined)
        this.values[node.owner] = model.eval(node.owner, false);
  }

  values2root() {
    if (this.values2rootMap !== null) return this.values2rootMap;
    const map = new Map<number, Enode>();
    for (const node of this.egraph.nodes) {
      const value = this.values[node.owner];
      if (node.isRoot && value !== undefined && !map.has(value)) map.set(value, node);
    }
    this.values2rootMap = map;
    return map;
  }

  node2value(node: Enode) {
    return this.values[node.root.owner];
  }
}

// euf::solver::user_sort: the universe of each uninterpreted sort, with fresh values from a
// user_sort_factory.
class UserSortValues {
  private sort2values = new Map<number, number[]>();
  private registered = new Map<number, Set<number>>();
  private next = new Map<number, number>();

  constructor(private manager: AstManager) {}

  registerValue(value: number) {
    const sort = this.manager.sorts[value];
    const set = this.registered.get(sort) ?? new Set<number>();
    this.registered.set(sort, set);
    set.add(value);
  }

  private getFreshValue(sort: number) {
    const set = this.registered.get(sort) ?? new Set<number>();
    this.registered.set(sort, set);
    for (let index = this.next.get(sort) ?? 0; ; index++) {
      const value = this.manager.mkModelValue(index, sort);
      if (set.has(value)) continue;
      set.add(value);
      this.next.set(sort, index + 1);
      return value;
    }
  }

  add(root: Enode, sort: number, values: (number | undefined)[]) {
    const value = this.manager.isValue(root.owner) ? root.owner : this.getFreshValue(sort);
    values[root.owner] = value;
    const sortValues = this.sort2values.get(sort) ?? [];
    this.sort2values.set(sort, sortValues);
    sortValues.push(value);
  }

  registerWith(model: ProtoModel) {
    for (const entry of this.sort2values) model.registerUsort(entry[0], entry[1]);
  }
}

// top_sort<enode>: the nodes ordered so that each comes after the nodes it depends on.
class EnodeTopSort {
  readonly deps: Dependencies = new Map();
  readonly sorted: Enode[] = [];
  private partitions = new Map<Enode, number>();
  private dfsNums = new Map<Enode, number>();
  private stackS: Enode[] = [];
  private stackP: Enode[] = [];

  insert(node: Enode, deps: Enode[] | null) {
    this.deps.set(node, deps);
  }

  sort() {
    for (const node of this.deps.keys()) this.traverse(node);
  }

  private traverse(node: Enode) {
    const dfsNum = this.dfsNums.get(node);
    if (dfsNum !== undefined) {
      if (this.partitions.has(node)) return;
      for (
        let top = this.stackP.at(-1);
        top !== undefined && (this.partitions.get(top) ?? -1) > dfsNum;
        top = this.stackP.at(-1)
      )
        this.stackP.pop();
      return;
    }
    if (!this.deps.has(node)) return;
    this.dfsNums.set(node, this.dfsNums.size);
    this.stackS.push(node);
    this.stackP.push(node);
    const deps = this.deps.get(node);
    if (deps !== null && deps !== undefined)
      for (const dep of sortByExprId(deps)) this.traverse(dep);
    if (node !== this.stackP.at(-1)) return;
    const partition = this.sorted.length;
    for (let top = this.stackS.pop(); top !== undefined; top = this.stackS.pop()) {
      this.sorted.push(top);
      this.partitions.set(top, partition);
      if (top === node) break;
    }
    this.stackP.pop();
  }
}

// An obj_hashtable<enode> iterates its nodes by hash, which is the id of their expression.
const sortByExprId = (nodes: readonly Enode[]) => {
  const table = new ObjHashtable((id) => id);
  const byId = new Map<number, Enode>();
  for (const node of nodes) {
    table.add(node.owner);
    byId.set(node.owner, node);
  }
  return [...table].map((id) => byId.get(id) as Enode);
};

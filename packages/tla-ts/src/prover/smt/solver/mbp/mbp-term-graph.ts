// Ported from Z3 (src/qe/mbp/mbp_term_graph.cpp), MIT license, see z3-license.txt.
import { type AstManager, KIND_APP, OP_AND, OP_DISTINCT, OP_EQ, SORT_BOOL } from "../ast";
import { getNumExprs, isAppOf } from "../ast-util";
import { RefVector } from "../ref-vector";
import { mkArithSolvePlugin, mkBasicSolvePlugin, type SolvePlugin } from "./mbp-solve-plugin";

class Term {
  root: Term = this;
  repr: Term | undefined;
  next: Term = this;
  isMarked = false;
  isInterpreted = false;
  readonly isEq: boolean;
  readonly isNeq: boolean;
  readonly isDistinct: boolean;
  isNeqChild = false;
  isCgr = false;
  isGr = false;
  // Maintained for roots only.
  readonly parents: Term[] = [];
  readonly children: Term[] = [];
  // Class properties, meaningful at the root.
  isGrClass = false;
  classSize = 1;

  constructor(
    readonly expr: number,
    manager: AstManager,
    app2Term: Map<number, Term>,
  ) {
    this.isEq = isAppOf(manager, expr, OP_EQ);
    this.isNeq = manager.isNot(expr) && isAppOf(manager, manager.getArg(expr, 0), OP_EQ);
    this.isDistinct = isAppOf(manager, expr, OP_DISTINCT);
    if (manager.kinds[expr] !== KIND_APP) return;
    for (const arg of manager.getArgs(expr)) {
      const child = app2Term.get(arg) as Term;
      child.root.parents.push(this);
      this.children.push(child);
    }
  }

  get isEqOrNeq() {
    return this.isEq || this.isNeq || this.isDistinct;
  }

  get isClassGr() {
    return this.root.isGrClass;
  }

  set isClassGr(value: boolean) {
    this.root.isGrClass = value;
  }

  get isRoot() {
    return this.root === this;
  }

  get isRepr() {
    return this.repr === this;
  }

  areAllChildrenGround() {
    return this.children.every((child) => child.isClassGr);
  }

  areAllChildrenPicked() {
    return this.children.every((child) => child.repr !== undefined);
  }

  mergeEqClass(other: Term) {
    [this.next, other.next] = [other.next, this.next];
    this.classSize += other.classSize;
    this.isGrClass ||= other.isGrClass;
    other.classSize = 0;
    other.isGrClass = false;
  }

  // Makes this term the representative of its class.
  mkRepr() {
    this.repr = this;
    for (let current = this.next; current !== this; current = current.next) current.repr = this;
  }

  *getClass() {
    yield this;
    for (let current = this.next; current !== this; current = current.next) yield current;
  }
}

// is_variable_proc: with isExclude, the declarations are those of the variables.
class IsVariableProc {
  private isExclude = true;
  private readonly decls = new Set<number>();
  private readonly solved = new Set<number>();

  constructor(private manager: AstManager) {}

  isVariable(expr: number) {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP || !manager.isUninterpreted(expr)) return false;
    const decl = manager.decls[expr];
    return !this.solved.has(decl) && this.isExclude === this.decls.has(decl);
  }

  setDecls(vars: readonly number[], isExclude: boolean) {
    this.decls.clear();
    this.solved.clear();
    this.isExclude = isExclude;
    for (const innerVar of vars) this.decls.add(this.manager.decls[innerVar]);
  }

  addDecl(innerVar: number) {
    this.decls.add(this.manager.decls[innerVar]);
  }

  markSolved(expr: number) {
    if (this.isVariable(expr)) this.solved.add(this.manager.decls[expr]);
  }

  contains(decl: number) {
    return this.decls.has(decl) === this.isExclude;
  }
}

export class TermGraph {
  private readonly isVar: IsVariableProc;
  private terms: Term[] = [];
  private app2Term = new Map<number, Term>();
  private cgTable = new Map<string, Term>();
  readonly lits: RefVector;
  private readonly pinned: RefVector;
  private term2App = new Map<Term, number>();
  private merges: [Term, Term][] = [];
  private deqPairs: [Term, Term][] = [];
  private deqDistinct: Term[][] = [];
  private isExplicitEq = false;
  private plugins: SolvePlugin[];

  constructor(private manager: AstManager) {
    this.isVar = new IsVariableProc(manager);
    this.lits = new RefVector(manager);
    this.pinned = new RefVector(manager);
    const isVariable = (expr: number) => this.isVar.isVariable(expr);
    const pin = (expr: number) => {
      this.pinned.push(expr);
      return expr;
    };
    this.plugins = [
      mkBasicSolvePlugin(manager, isVariable, pin),
      mkArithSolvePlugin(manager, isVariable, pin),
    ];
  }

  release() {
    this.lits.reset();
    this.pinned.reset();
  }

  setVars(vars: readonly number[]) {
    this.isVar.setDecls(vars, true);
  }

  addVars(vars: readonly number[]) {
    for (const innerVar of vars) this.isVar.addDecl(innerVar);
  }

  setExplicitEq() {
    this.isExplicitEq = true;
  }

  private pin(expr: number) {
    this.pinned.push(expr);
    return expr;
  }

  private isGround(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      if (manager.kinds[current] !== KIND_APP) continue;
      if (this.isVar.contains(manager.decls[current])) return false;
      manager.pushArgs(current, todo);
    }
    return true;
  }

  private isPure(expr: number) {
    const manager = this.manager;
    const visited = new Set<number>();
    const todo = [expr];
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (visited.has(current)) continue;
      visited.add(current);
      if (this.isVar.isVariable(current)) return false;
      if (manager.kinds[current] === KIND_APP) manager.pushArgs(current, todo);
    }
    return true;
  }

  private getLitFamily(lit: number): number {
    const manager = this.manager;
    if (manager.isNot(lit)) return this.getLitFamily(manager.getArg(lit, 0));
    if (isAppOf(manager, lit, OP_EQ))
      return manager.getSortFamily(manager.sorts[manager.getArg(lit, 0)]);
    return manager.kinds[lit] === KIND_APP ? manager.getFamily(lit) : -1;
  }

  addLit(lit: number) {
    const manager = this.manager;
    const lits = new RefVector(manager);
    lits.push(lit);
    for (let index = 0; index < lits.size; index++) {
      const current = lits.items[index];
      const family = this.getLitFamily(current);
      const plugin = this.plugins.find((candidate) => candidate.family === family);
      const solved = plugin === undefined ? current : this.solveLit(plugin, current);
      if (manager.getOp(solved) === OP_AND)
        for (const arg of manager.getArgs(solved)) lits.push(arg);
      else {
        this.lits.push(solved);
        this.internalizeLit(solved);
      }
    }
    lits.reset();
  }

  private solveLit(plugin: SolvePlugin, lit: number) {
    const manager = this.manager;
    return manager.isNot(lit)
      ? plugin.solve(manager.getArg(lit, 0), false)
      : plugin.solve(lit, true);
  }

  addLits(lits: readonly number[]) {
    for (const lit of lits) this.addLit(lit);
  }

  addEq(first: number, second: number) {
    this.internalizeEq(first, second);
  }

  addDeq(first: number, second: number) {
    this.internalizeDeq(first, second);
  }

  // Terms other than those under a disequality.
  getTerms() {
    return this.terms.filter((term) => !term.isNeqChild).map((term) => term.expr);
  }

  isCgr(expr: number) {
    const term = this.app2Term.get(expr);
    return term !== undefined && !term.isEq && term.isCgr;
  }

  isInternalized(expr: number) {
    return this.app2Term.has(expr);
  }

  private getCgKey(term: Term) {
    const manager = this.manager;
    const expr = term.expr;
    if (term.children.length === 0) return `e${expr}`;
    return `${manager.decls[expr]}:${manager.sorts[expr]}:${term.children.map((child) => manager.ids[child.root.expr]).join(",")}`;
  }

  private mkTerm(expr: number) {
    const manager = this.manager;
    this.pin(expr);
    const term = new Term(expr, manager, this.app2Term);
    if (this.isGround(expr)) {
      term.isGr = true;
      term.isCgr = true;
      term.isClassGr = true;
    } else if (term.children.length > 0 && term.areAllChildrenGround()) {
      term.isCgr = true;
      term.isClassGr = true;
    }
    if (term.children.length === 0 && manager.isUniqueValue(expr)) term.isInterpreted = true;
    this.terms.push(term);
    this.app2Term.set(expr, term);
    return term;
  }

  private insertCg(term: Term) {
    const key = this.getCgKey(term);
    const existing = this.cgTable.get(key);
    if (existing !== undefined) return existing;
    this.cgTable.set(key, term);
    return term;
  }

  private internalizeTerm(root: number) {
    const manager = this.manager;
    const existing = this.app2Term.get(root);
    if (existing !== undefined) return existing;
    const todo = [root];
    let result: Term | undefined;
    while (todo.length > 0) {
      const expr = todo[todo.length - 1];
      result = this.app2Term.get(expr);
      if (result !== undefined) {
        todo.pop();
        continue;
      }
      const size = todo.length;
      if (manager.kinds[expr] === KIND_APP)
        for (const arg of manager.getArgs(expr)) if (!this.app2Term.has(arg)) todo.push(arg);
      if (size < todo.length) continue;
      todo.pop();
      result = this.mkTerm(expr);
      // The term may be congruent to a term internalized in another syntactic form.
      const old = this.insertCg(result);
      if (result.isCgr) old.isCgr = true;
      if (old.root !== result.root) this.merges.push([result, old]);
    }
    this.mergeFlush();
    return result as Term;
  }

  private internalizeEq(first: number, second: number) {
    this.merge(this.internalizeTerm(first), this.internalizeTerm(second));
    this.mergeFlush();
    if (!this.isExplicitEq) return;
    const eq = this.pin(this.manager.mkEq(first, second));
    if (!this.app2Term.has(eq)) this.mkTerm(eq);
  }

  private internalizeDistinct(expr: number) {
    const terms = this.manager.getArgs(expr).map((arg) => this.internalizeTerm(arg));
    this.deqDistinct.push(terms);
    if (this.isExplicitEq && !this.app2Term.has(expr)) this.mkTerm(expr);
  }

  private internalizeDeq(first: number, second: number) {
    const manager = this.manager;
    const term1 = this.internalizeTerm(first);
    const term2 = this.internalizeTerm(second);
    this.deqPairs.push([term1, term2]);
    if (!this.isExplicitEq) return;
    const eq = this.pin(manager.mkEq(first, second));
    const eqTerm = this.mkTerm(eq);
    eqTerm.isNeqChild = true;
    const deq = this.pin(manager.mkNot(eq));
    if (!this.app2Term.has(deq)) this.mkTerm(deq);
  }

  private internalizeLit(lit: number) {
    const manager = this.manager;
    if (isAppOf(manager, lit, OP_EQ))
      this.internalizeEq(manager.getArg(lit, 0), manager.getArg(lit, 1));
    else if (isAppOf(manager, lit, OP_DISTINCT)) this.internalizeDistinct(lit);
    else if (manager.isNot(lit) && isAppOf(manager, manager.getArg(lit, 0), OP_EQ)) {
      const eq = manager.getArg(lit, 0);
      this.internalizeDeq(manager.getArg(eq, 0), manager.getArg(eq, 1));
    } else this.internalizeTerm(lit);
    // A pure definition solves its variable.
    if (isAppOf(manager, lit, OP_EQ)) {
      const variable = manager.getArg(lit, 0);
      if (this.isVar.isVariable(variable) && this.isPure(manager.getArg(lit, 1)))
        this.isVar.markSolved(variable);
    }
  }

  private mergeFlush() {
    for (let pair = this.merges.pop(); pair !== undefined; pair = this.merges.pop())
      this.merge(pair[0], pair[1]);
  }

  private merge(term1: Term, term2: Term) {
    let first = term1.root;
    let second = term2.root;
    if (first === second) return;
    this.term2App.clear();
    if (first.classSize > second.classSize) [first, second] = [second, first];
    for (const parent of second.parents) {
      if (parent.isMarked) continue;
      parent.isMarked = true;
      this.cgTable.delete(this.getCgKey(parent));
    }
    const isPropagatingGround = second.isClassGr !== first.isClassGr;
    second.root = first;
    for (let current = second.next; current !== second; current = current.next)
      current.root = first;
    first.mergeEqClass(second);
    for (const parent of second.parents) {
      if (!parent.isMarked) continue;
      const old = this.insertCg(parent);
      parent.isMarked = false;
      first.parents.push(parent);
      if (parent.root !== old.root) this.merges.push([parent, old]);
    }
    if (isPropagatingGround) this.percolateGroundUpFrom(first);
  }

  private mkAppCore(expr: number): number {
    const manager = this.manager;
    if (manager.kinds[expr] !== KIND_APP) return expr;
    // A value stays as it is, so a coefficient never becomes a variable that equals it.
    const kids = manager
      .getArgs(expr)
      .map((arg) => (manager.isValue(arg) ? arg : this.mkAppOfExpr(arg)));
    return this.pin(manager.mkApp(manager.decls[expr], kids, manager.sorts[expr]));
  }

  private mkAppOfTerm(term: Term): number {
    if (term.children.length === 0) return term.expr;
    const cached = this.term2App.get(term);
    if (cached !== undefined) return cached;
    const result = this.mkAppCore(term.expr);
    this.term2App.set(term, result);
    return result;
  }

  private mkAppOfExpr(expr: number): number {
    const term = this.app2Term.get(expr);
    return term === undefined ? expr : this.mkAppOfTerm(term.repr as Term);
  }

  private mkQeLiteEqualities(term: Term, out: number[], containsNc: (expr: number) => boolean) {
    const manager = this.manager;
    if (term.classSize === 1) return;
    const repr = this.mkAppOfTerm(term);
    if (containsNc(repr)) return;
    for (let current = term.next; current !== term; current = current.next) {
      // No equalities for the variables to eliminate.
      if (this.isVar.contains(manager.decls[current.expr])) continue;
      const member = this.mkAppCore(current.expr);
      if (repr !== member && !containsNc(member)) out.push(this.pin(manager.mkEq(repr, member)));
    }
  }

  // Prefers constants over applications, uninterpreted constants over values, and smaller
  // expressions over larger ones.
  private isTermLess(term1: Term, term2: Term) {
    const manager = this.manager;
    const numArgs1 = term1.children.length;
    const numArgs2 = term2.children.length;
    if (numArgs1 === 0 || numArgs2 === 0) {
      if (numArgs1 === numArgs2) {
        if (manager.isValue(term1.expr) === manager.isValue(term2.expr))
          return manager.ids[term1.expr] < manager.ids[term2.expr];
        return manager.isValue(term2.expr);
      }
      return numArgs1 < numArgs2;
    }
    return getNumExprs(manager, term1.expr) < getNumExprs(manager, term2.expr);
  }

  private pickReprPercolateUp(todo: Term[]) {
    for (let term = todo.pop(); term !== undefined; term = todo.pop()) {
      if (term.repr !== undefined) continue;
      this.pickReprClass(term);
      for (const parent of term.root.parents) if (parent.areAllChildrenPicked()) todo.push(parent);
    }
  }

  // The class representative is c-ground when possible and least by isTermLess.
  private pickReprClass(term: Term) {
    let repr = term;
    for (let current = term.next; current !== term; current = current.next) {
      if (!current.areAllChildrenPicked()) continue;
      if (
        (current.isCgr && !repr.isCgr) ||
        (current.isCgr === repr.isCgr && this.isTermLess(current, repr))
      )
        repr = current;
    }
    repr.mkRepr();
  }

  private pickRepr() {
    this.term2App.clear();
    for (const term of this.terms) term.repr = undefined;
    const todo: Term[] = [];
    for (const term of this.terms) if (term.children.length === 0 && term.isCgr) todo.push(term);
    this.pickReprPercolateUp(todo);
    for (const term of this.terms)
      if (term.repr === undefined && term.children.length === 0) todo.push(term);
    this.pickReprPercolateUp(todo);
  }

  // A variable representative gives way to a non-variable that makes no cycle.
  private refineReprClass(term: Term) {
    const manager = this.manager;
    const isVariable = (candidate: Term) => this.isVar.contains(manager.decls[candidate.expr]);
    if (!isVariable(term)) return;
    let repr = term;
    for (let current = term.next; current !== term; current = current.next)
      if (!this.makesCycle(current) && isVariable(repr) && !isVariable(current)) repr = current;
    repr.mkRepr();
  }

  private makesCycle(term: Term) {
    const root = term.root;
    const todo = term.children.map((child) => child.repr as Term);
    for (let current = todo.pop(); current !== undefined; current = todo.pop()) {
      if (current.root === root) return true;
      for (const child of current.children) todo.push(child.repr as Term);
    }
    return false;
  }

  private refineRepr() {
    this.term2App.clear();
    for (const term of this.terms) {
      const repr = term.repr as Term;
      if (!repr.isCgr) this.refineReprClass(repr);
    }
  }

  // Whether the graph implies that the expression equals a value.
  hasValInClass(expr: number) {
    const term = this.app2Term.get(expr);
    if (term === undefined) return false;
    for (const member of term.getClass()) if (this.manager.isValue(member.expr)) return true;
    return false;
  }

  private mkNeq(first: number, second: number) {
    const manager = this.manager;
    if (
      (manager.isNot(first) && manager.getArg(first, 0) === second) ||
      (manager.isNot(second) && manager.getArg(second, 0) === first) ||
      manager.areDistinct(first, second)
    )
      return manager.trueExpr;
    return this.pin(manager.mkNot(manager.mkEq(first, second)));
  }

  private toLitsQeLite(nonCore: ((expr: number) => boolean) | undefined) {
    const manager = this.manager;
    const cache = new Map<number, boolean>();
    const containsNc = (expr: number): boolean => {
      if (nonCore === undefined) return false;
      const cached = cache.get(expr);
      if (cached !== undefined) return cached;
      const result =
        nonCore(expr) ||
        (manager.kinds[expr] === KIND_APP && manager.someArg(expr, (arg) => containsNc(arg)));
      cache.set(expr, result);
      return result;
    };
    const lits: number[] = [];
    for (const lit of this.lits.items) {
      const term = this.app2Term.get(lit);
      if (term === undefined) continue;
      if (this.isExplicitEq && term.isEqOrNeq) continue;
      const result = this.mkAppOfExpr(lit);
      if (nonCore === undefined || !containsNc(result)) lits.push(result);
    }
    for (const term of this.terms)
      if (!term.isEqOrNeq && term.isRepr) this.mkQeLiteEqualities(term, lits, containsNc);
    for (const [first, second] of this.deqPairs) {
      const expr1 = this.mkAppOfTerm(first.repr as Term);
      const expr2 = this.mkAppOfTerm(second.repr as Term);
      if (nonCore === undefined || (!containsNc(expr1) && !containsNc(expr2)))
        lits.push(this.mkNeq(expr1, expr2));
    }
    for (const terms of this.deqDistinct) {
      const args: number[] = [];
      for (const term of terms) {
        const arg = this.mkAppOfTerm(term.repr as Term);
        if (nonCore === undefined || !containsNc(arg)) args.push(arg);
      }
      if (args.length < 2) continue;
      lits.push(
        args.length === 2
          ? this.mkNeq(args[0], args[1])
          : this.pin(manager.mkApp(OP_DISTINCT, args, SORT_BOOL)),
      );
    }
    return lits;
  }

  // A quantifier reduction of the graph's formula: keeps in vars only the variables that have no
  // ground representative and still occur in the result.
  qel(vars: RefVector, nonCore?: (expr: number) => boolean) {
    const manager = this.manager;
    filterRefVector(vars, (innerVar) => this.isInternalized(innerVar));
    this.pickRepr();
    this.refineRepr();
    const lits = this.toLitsQeLite(nonCore);
    const formula = this.pin(manager.mkAnd(lits));
    const occurring = new Set<number>();
    const todo = [formula];
    for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
      if (occurring.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
      occurring.add(expr);
      manager.pushArgs(expr, todo);
    }
    filterRefVector(vars, (innerVar) => occurring.has(innerVar));
    return formula;
  }

  private percolateGroundUpFrom(term: Term) {
    let current = term;
    // Every ground class has a c-ground term.
    while (!current.isCgr) current = current.next;
    this.percolateGroundUp([current]);
  }

  private percolateGroundUp(todo: Term[]) {
    for (let term = todo.pop(); term !== undefined; term = todo.pop()) {
      term.isCgr = true;
      term.isClassGr = true;
      for (const parent of term.root.parents)
        if (!parent.isCgr && parent.areAllChildrenGround()) todo.push(parent);
    }
  }
}

export const filterRefVector = (vector: RefVector, keep: (expr: number) => boolean) => {
  let kept = 0;
  for (const expr of vector.items) {
    if (!keep(expr)) continue;
    vector.set(kept++, expr);
  }
  vector.shrink(kept);
};

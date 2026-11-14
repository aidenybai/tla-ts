// Ported from Z3 (src/sat/smt/sat_th.h, src/sat/smt/sat_th.cpp, src/util/trail.h), MIT license,
// see z3-license.txt.
import { SmtCanceledError } from "../../../../errors";
import { mkNot } from "../ast-util";
import type { ProtoModel } from "../proto-model";
import { L_TRUE, L_UNDEF } from "../lbool";
import { NULL_LITERAL } from "../sat/clause";
import { CR_DONE } from "../sat/solver";
import { type Enode, NULL_THEORY_VAR, type ThEq } from "./egraph";
import type { EufSolver } from "./euf-solver";

export class TrailStack {
  private undos: (() => void)[] = [];
  private scopes: number[] = [];

  push(undo: () => void) {
    this.undos.push(undo);
  }

  pushScope() {
    this.scopes.push(this.undos.length);
  }

  popScope(numScopes: number) {
    if (numScopes === 0) return;
    const lim = this.scopes[this.scopes.length - numScopes];
    this.scopes.length -= numScopes;
    while (this.undos.length > lim) (this.undos.pop() as () => void)();
  }

  get numScopes() {
    return this.scopes.length;
  }
}

// A th_explain: the literals and equalities that explain a propagation or a conflict.
export interface ThExplain {
  readonly lits: readonly number[];
  readonly eqs: readonly (readonly [Enode, Enode])[];
  readonly consequent: number;
  readonly eq: readonly [Enode, Enode] | null;
}

export type Dependencies = Map<Enode, Enode[] | null>;

export const addDependency = (deps: Dependencies, node: Enode, dep: Enode) => {
  const existing = deps.get(node);
  if (existing === undefined || existing === null) deps.set(node, [dep]);
  else if (!existing.includes(dep)) existing.push(dep);
};

export abstract class ThSolver {
  protected var2enode: Enode[] = [];
  protected stack: { expr: number; index: number }[] = [];
  private var2enodeLim: number[] = [];
  protected numScopes = 0;

  constructor(
    readonly ctx: EufSolver,
    readonly name: string,
    readonly id: number,
  ) {}

  get manager() {
    return this.ctx.manager;
  }

  get s() {
    return this.ctx.s;
  }

  abstract internalize(expr: number, isSign: boolean, isRoot: boolean): number;
  abstract internalizeTerm(expr: number): void;

  applySortCnstr(_node: Enode, _sort: number) {}
  eqInternalized(_node: Enode) {}
  newEqEh(_eq: ThEq) {}
  useDiseqs() {
    return false;
  }
  newDiseqEh(_eq: ThEq) {}
  unitPropagate() {
    return false;
  }
  check() {
    return CR_DONE;
  }
  asserted(_lit: number) {}
  getAntecedents(_lit: number, data: unknown, antecedents: number[]) {
    this.ctx.getThAntecedents(data as ThExplain, antecedents);
  }
  getPhase(_boolVar: number) {
    return L_UNDEF;
  }
  isExternal(_boolVar: number) {
    return false;
  }
  initSearch() {}
  popReinit() {}
  isSelfPropagating() {
    return false;
  }
  preSimplify() {}
  simplify() {}
  flushRoots() {}
  finalize() {}
  relevantEh(_node: Enode) {}
  isShared(_thVar: number) {
    return false;
  }
  isBetaRedex(_parent: Enode, _node: Enode) {
    return false;
  }
  isFixed(_thVar: number, _lits: number[]): number {
    return -1;
  }
  addValue(_node: Enode, _model: ProtoModel, _values: (number | undefined)[]) {}
  addDep(node: Enode, deps: Dependencies) {
    deps.set(node, deps.get(node) ?? null);
    return true;
  }
  includeFuncInterp(_decl: number) {
    return false;
  }
  initModel() {}
  finalizeModel(_model: ProtoModel) {}
  hasUnhandled() {
    return false;
  }
  collectStatistics(_stats: Map<string, number>) {}

  protected visit(_expr: number) {
    return false;
  }

  protected visited(_expr: number) {
    return false;
  }

  protected postVisit(_expr: number, _isSign: boolean, _isRoot: boolean) {
    return false;
  }

  protected visitRec(expr: number, isSign: boolean, isRoot: boolean) {
    const manager = this.manager;
    const stack = this.stack;
    const base = stack.length;
    this.visit(expr);
    loop: while (stack.length > base) {
      if (!manager.limit.inc()) throw new SmtCanceledError();
      const frame = stack[stack.length - 1];
      const current = frame.expr;
      if (this.visited(current)) {
        stack.pop();
        continue;
      }
      const numArgs = manager.isApp(current) ? manager.getNumArgs(current) : 0;
      while (frame.index < numArgs)
        if (!this.visit(manager.getArg(current, frame.index++))) continue loop;
      if (!this.visited(current) && !this.postVisit(current, isSign, isRoot && current === expr)) {
        stack.length = base;
        return false;
      }
      stack.pop();
    }
    return true;
  }

  mkVar(node: Enode) {
    this.forcePush();
    const thVar = this.var2enode.length;
    this.var2enode.push(node);
    return thVar;
  }

  get numVars() {
    return this.var2enode.length;
  }

  var2enodeOf(thVar: number) {
    return this.var2enode[thVar];
  }

  var2expr(thVar: number) {
    return this.var2enode[thVar].owner;
  }

  getThVar(node: Enode) {
    return node.getThVar(this.id);
  }

  getThVarOf(expr: number) {
    const node = this.ctx.getEnode(expr);
    return node === undefined ? NULL_THEORY_VAR : node.getThVar(this.id);
  }

  getRepresentative(thVar: number) {
    return this.getThVar(this.var2enode[thVar].root);
  }

  isAttachedToVar(node: Enode) {
    const thVar = node.getThVar(this.id);
    return thVar !== NULL_THEORY_VAR && this.var2enode[thVar] === node;
  }

  push() {
    this.numScopes++;
  }

  pop(numScopes: number) {
    const fromLazy = Math.min(this.numScopes, numScopes);
    this.numScopes -= fromLazy;
    if (numScopes > fromLazy) this.popCore(numScopes - fromLazy);
  }

  protected forcePush() {
    for (; this.numScopes > 0; this.numScopes--) this.pushCore();
  }

  protected pushCore() {
    this.var2enodeLim.push(this.var2enode.length);
  }

  protected popCore(numScopes: number) {
    const newLvl = this.var2enodeLim.length - numScopes;
    this.var2enode.length = this.var2enodeLim[newLvl];
    this.var2enodeLim.length = newLvl;
  }

  expr2enode(expr: number) {
    return this.ctx.getEnode(expr);
  }

  eInternalize(expr: number) {
    return this.ctx.eInternalize(expr);
  }

  mkEnode(expr: number, isSuppressingArgs = false) {
    const manager = this.manager;
    const args = isSuppressingArgs
      ? []
      : manager.getArgs(expr).map((arg) => this.expr2enode(arg) as Enode);
    const node = this.ctx.mkEnode(expr, args);
    this.ctx.attachNode(node);
    return node;
  }

  mkLiteral(expr: number) {
    return this.ctx.mkLiteral(expr);
  }

  mkEq(first: number, second: number) {
    return this.ctx.mkEq(first, second);
  }

  eqInternalize(first: number, second: number) {
    return this.mkLiteral(this.ctx.mkEq(first, second));
  }

  expr2literal(expr: number) {
    return this.ctx.expr2literal(expr);
  }

  literal2expr(lit: number) {
    const expr = this.ctx.boolVar2expr(lit >> 1) as number;
    return (lit & 1) === 1 ? mkNot(this.manager, expr) : expr;
  }

  boolVar2enode(boolVar: number) {
    const expr = this.ctx.boolVar2expr(boolVar);
    return expr === undefined ? undefined : this.expr2enode(expr);
  }

  boolVar2expr(boolVar: number) {
    return this.ctx.boolVar2expr(boolVar);
  }

  isTrue(lit: number) {
    return this.s.value(lit) === L_TRUE;
  }

  addUnit(lit: number) {
    const wasTrue = this.isTrue(lit);
    this.ctx.addClause([lit], false);
    return !wasTrue;
  }

  addClause(lits: number[], isRedundant = false) {
    let wasTrue = false;
    for (const lit of lits) wasTrue ||= this.isTrue(lit);
    this.ctx.addClause(lits, isRedundant);
    return !wasTrue;
  }

  addEquiv(first: number, second: number) {
    this.addClause([first ^ 1, second]);
    this.addClause([first, second ^ 1]);
  }

  addEquivAnd(lit: number, lits: readonly number[]) {
    for (const other of lits) this.addClause([lit ^ 1, other]);
    this.addClause([...lits.map((other) => other ^ 1), lit]);
  }

  rewrite(expr: number) {
    return this.ctx.rewrite(expr);
  }

  random() {
    return this.s.rand.next();
  }

  mkPropagation(
    lits: readonly number[],
    eqs: readonly (readonly [Enode, Enode])[],
    consequent: number,
    eq: readonly [Enode, Enode] | null = null,
  ) {
    const explain: ThExplain = { lits, eqs, consequent, eq };
    return this.ctx.mkConstraint(this, explain);
  }

  propagateLit(lits: readonly number[], eqs: readonly (readonly [Enode, Enode])[], lit: number) {
    this.ctx.propagate(lit, this.mkPropagation(lits, eqs, lit));
  }

  propagateEq(
    lits: readonly number[],
    eqs: readonly (readonly [Enode, Enode])[],
    first: Enode,
    second: Enode,
  ) {
    return this.ctx.propagateEq(
      first,
      second,
      this.mkPropagation(lits, eqs, NULL_LITERAL, [first, second]),
    );
  }

  setConflict(lits: readonly number[], eqs: readonly (readonly [Enode, Enode])[]) {
    this.ctx.setConflict(this.mkPropagation(lits, eqs, NULL_LITERAL));
  }
}

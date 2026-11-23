import {
  FAMILY_RECFUN,
  OP_FUN_CASE_PRED,
  OP_FUN_DEFINED,
  OP_NUM_ROUNDS,
  type RecFunCase,
  type RecFunDef,
  SORT_BOOL,
} from "../ast";
import type { ProtoModel } from "../proto-model";
import {
  ITEM_BODY,
  ITEM_CASE,
  ITEM_CORE,
  ITEM_GUARD,
  type PropagationItem,
} from "../recfun-decl-plugin";
import { VarSubst } from "../var-subst";
import { type Enode, NULL_THEORY_VAR } from "./egraph";
import type { EufSolver } from "./euf-solver";
import { ThSolver } from "./th-solver";

export class RecfunSolver extends ThSolver {
  private disabledGuards: number[] = [];
  private enabledGuards: number[] = [];
  private guard2pending = new Map<number, number[]>();
  private numRounds = 0;
  private propagationQueue: PropagationItem[] = [];
  private qhead = 0;

  constructor(ctx: EufSolver) {
    super(ctx, "recfun", FAMILY_RECFUN);
  }

  private keep(expr: number) {
    this.manager.incRef(expr);
    return expr;
  }

  private hasDefs() {
    return this.manager.recFunCases.size > 0;
  }

  private isDefined(expr: number) {
    return this.manager.getOp(expr) === OP_FUN_DEFINED;
  }

  private isCasePred(expr: number) {
    return this.manager.getOp(expr) === OP_FUN_CASE_PRED;
  }

  private applyArgs(args: number[], expr: number) {
    const manager = this.manager;
    const subst = new VarSubst(manager, true);
    const substituted = subst.apply(expr, args);
    const result = this.rewrite(substituted);
    manager.decRef(substituted);
    subst.release();
    manager.releaseLater(result);
    return result;
  }

  private assertMacroAxiom(lhs: number) {
    const manager = this.manager;
    const def = manager.recFunDefs.get(manager.decls[lhs]) as RecFunDef;
    const rhs = this.applyArgs(manager.getArgs(lhs), def.rhs);
    const ctx = this.ctx;
    const oldGeneration = ctx.generation;
    ctx.generation = Math.max(ctx.getMaxGeneration(lhs), ctx.getMaxGeneration(rhs)) + 1;
    this.addUnit(this.eqInternalize(lhs, rhs));
    ctx.generation = oldGeneration;
  }

  private assertCaseAxioms(lhs: number) {
    const manager = this.manager;
    const def = manager.recFunDefs.get(manager.decls[lhs]) as RecFunDef;
    if (def.cases.length === 1) {
      this.assertMacroAxiom(lhs);
      return;
    }
    const args = manager.getArgs(lhs);
    const preds: number[] = [];
    for (const recFunCase of def.cases) {
      const predApplied = manager.mkApp(recFunCase.pred, args, SORT_BOOL);
      preds.push(this.mkLiteral(predApplied));
      const guards = recFunCase.guards.map((guard) => this.applyArgs(args, guard));
      if (recFunCase.isImmediate) this.assertBodyAxiom(predApplied);
      else if (!this.enabledGuards.includes(predApplied)) {
        this.disableGuard(predApplied, guards);
        continue;
      }
      this.assertGuard(predApplied, guards);
    }
    this.addClause(preds);
  }

  private assertGuard(predApplied: number, guards: readonly number[]) {
    const guardLiterals = guards.map((guard) => this.mkLiteral(guard));
    this.addEquivAnd(this.mkLiteral(predApplied), guardLiterals);
  }

  private blockCore(core: readonly number[]) {
    this.addClause(core.map((expr) => this.mkLiteral(expr) ^ 1));
  }

  private disableGuard(guard: number, guards: number[]) {
    const core = [this.manager.mkNumRoundsPred(this.numRounds), guard];
    if (!this.guard2pending.has(guard)) {
      this.disabledGuards.push(this.keep(guard));
      this.guard2pending.set(
        guard,
        guards.map((innerGuard) => this.keep(innerGuard)),
      );
    }
    this.pushProp(ITEM_CORE, core);
  }

  private assertBodyAxiom(pred: number) {
    const manager = this.manager;
    const recFunCase = manager.recFunCases.get(manager.decls[pred]) as RecFunCase;
    const args = manager.getArgs(pred);
    const clause: number[] = [];
    for (const guard of recFunCase.guards) {
      const applied = this.applyArgs(args, guard);
      if (manager.isFalse(applied)) return;
      if (manager.isTrue(applied)) continue;
      clause.push(this.mkLiteral(applied) ^ 1);
    }
    const decl = recFunCase.def.decl;
    const lhs = manager.mkApp(decl, args, manager.funcDecls[decl].range);
    const rhs = this.applyArgs(args, recFunCase.rhs);
    clause.push(this.eqInternalize(lhs, rhs));
    this.addClause(clause);
  }

  override asserted(lit: number) {
    const expr = this.boolVar2expr(lit >> 1) as number;
    if ((lit & 1) === 0 && this.isCasePred(expr)) this.pushProp(ITEM_BODY, [expr]);
  }

  override unitPropagate() {
    this.forcePush();
    if (this.qhead === this.propagationQueue.length) return false;
    const qhead = this.qhead;
    this.ctx.trail.push(() => {
      this.qhead = qhead;
    });
    this.manager.withTemporaries(
      () => {
        const end = this.propagationQueue.length;
        for (; this.qhead < end && !this.s.isInconsistent; this.qhead++) {
          const item = this.propagationQueue[this.qhead];
          const expr = item.exprs[0];
          if (item.kind === ITEM_GUARD)
            this.assertGuard(expr, this.guard2pending.get(expr) as number[]);
          else if (item.kind === ITEM_CORE) this.blockCore(item.exprs);
          else if (item.kind === ITEM_CASE) this.assertCaseAxioms(expr);
          else this.assertBodyAxiom(expr);
        }
      },
      () => [],
    );
    return true;
  }

  // Z3's propagation_item holds no reference to a guard, and an expansion holds its arguments too.
  private pushProp(kind: number, exprs: number[]) {
    const manager = this.manager;
    const held = kind === ITEM_GUARD ? [] : kind === ITEM_CORE ? exprs : manager.getArgs(exprs[0]);
    if (kind === ITEM_CASE || kind === ITEM_BODY) held.push(exprs[0]);
    for (const expr of held) manager.incRef(expr);
    this.propagationQueue.push({ kind, exprs });
    this.ctx.trail.push(() => {
      this.propagationQueue.pop();
      for (const expr of held) manager.decRef(expr);
    });
  }

  internalize(expr: number, isSign: boolean, isRoot: boolean) {
    this.forcePush();
    this.visitRec(expr, isSign, isRoot);
    const lit = this.expr2literal(expr);
    return isSign ? lit ^ 1 : lit;
  }

  internalizeTerm(expr: number) {
    this.forcePush();
    this.visitRec(expr, false, false);
  }

  protected override visited(expr: number) {
    const node = this.expr2enode(expr);
    return node !== undefined && node.getThVar(this.id) !== NULL_THEORY_VAR;
  }

  protected override visit(expr: number) {
    if (this.visited(expr)) return true;
    const manager = this.manager;
    if (!manager.isApp(expr) || manager.getFamily(expr) !== this.id) {
      this.ctx.internalizeTerm(expr);
      return true;
    }
    this.stack.push({ expr, index: 0 });
    return false;
  }

  protected override postVisit(expr: number) {
    const node = this.expr2enode(expr) ?? this.mkEnode(expr);
    if (node.getThVar(this.id) !== NULL_THEORY_VAR) return true;
    this.ctx.egraph.addThVar(node, this.mkVar(node), this.id);
    if (this.isDefined(expr) && this.hasDefs()) this.pushProp(ITEM_CASE, [expr]);
    return true;
  }

  // Z3 tests m_disabled_guards.empty() here, where theory_recfun tests that it is not empty.
  override addAssumptions(assumptions: Set<number>) {
    const manager = this.manager;
    if (this.hasDefs() || this.disabledGuards.length === 0) {
      const limit = this.mkLiteral(manager.mkNumRoundsPred(this.numRounds));
      assumptions.add(limit);
      this.s.assignScoped(limit);
      for (const guard of this.disabledGuards) {
        const assumption = this.mkLiteral(guard) ^ 1;
        assumptions.add(assumption);
        this.s.assignScoped(assumption);
      }
    }
    for (const guard of this.enabledGuards) this.pushProp(ITEM_GUARD, [guard]);
  }

  override shouldResearch(core: readonly number[]) {
    let isFound = false;
    let minGeneration = Infinity;
    let toDelete = -1;
    let count = 0;
    for (const lit of core) {
      const expr = this.boolVar2expr(lit >> 1) as number;
      if ((lit & 1) === 1 && this.disabledGuards.includes(expr)) {
        isFound = true;
        const generation = this.ctx.getMaxGeneration(expr);
        if (generation < minGeneration) count = 0;
        if (generation <= minGeneration && this.random() % ++count === 0) {
          toDelete = expr;
          minGeneration = generation;
        }
      } else if (this.manager.getOp(expr) === OP_NUM_ROUNDS) isFound = true;
    }
    if (!isFound) return false;
    this.numRounds++;
    if (toDelete === -1 && this.disabledGuards.length > 0)
      toDelete = this.disabledGuards[this.disabledGuards.length - 1];
    if (toDelete !== -1) {
      this.disabledGuards.splice(this.disabledGuards.indexOf(toDelete), 1);
      this.enabledGuards.push(toDelete);
    }
    return true;
  }

  override isBetaRedex(parent: Enode) {
    return this.isDefined(parent.owner) || this.isCasePred(parent.owner);
  }

  override addValue(node: Enode, _model: ProtoModel, values: (number | undefined)[]) {
    values[node.root.owner] = node.root.owner;
  }

  override isShared() {
    return true;
  }

  override trackingAssumptions() {
    return true;
  }
}

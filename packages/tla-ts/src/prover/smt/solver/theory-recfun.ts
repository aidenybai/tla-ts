// Ported from Z3 (src/smt/theory_recfun.cpp), MIT license, see z3-license.txt.
import { SmtUnsupportedError } from "../../../errors";
import {
  FAMILY_RECFUN,
  KIND_QUANTIFIER,
  OP_FUN_CASE_PRED,
  OP_FUN_DEFINED,
  OP_NUM_ROUNDS,
  SORT_BOOL,
} from "./ast";
import type { Context } from "./context";
import type { Enode } from "./enode";
import { type BoolVar, FALSE_LITERAL, type Literal, negate, TRUE_LITERAL } from "./literal";
import { getSubterms } from "./recfun-decl-plugin";
import { FC_CONTINUE, FC_DONE, Theory } from "./theory";
import { VarSubst } from "./var-subst";

const ITEM_GUARD = 0;
const ITEM_CORE = 1;
const ITEM_CASE = 2;
const ITEM_BODY = 3;

// A guard and a body expansion hold their case predicate, a case expansion its application of the
// defined function, and a core its expressions.
interface PropagationItem {
  kind: number;
  exprs: number[];
}

export class TheoryRecfun extends Theory {
  readonly name = "recfun";
  private disabledGuards: number[] = [];
  private enabledGuards: number[] = [];
  private guard2pending = new Map<number, number[]>();
  private predDepths = new Map<number, number>();
  private numRounds = 0;
  private propagationQueue: PropagationItem[] = [];
  private qhead = 0;

  constructor(context: Context) {
    super(context, FAMILY_RECFUN);
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

  internalizeAtom(atom: number) {
    const context = this.context;
    if (!this.hasDefs()) return false;
    for (const arg of this.manager.getArgs(atom)) context.internalize(arg, false);
    if (!context.isEInternalized(atom)) context.mkEnode(atom, false, true, true);
    if (!context.isBInternalized(atom)) context.setVarTheory(context.mkBoolVar(atom), this.id);
    if (!context.relevancy.isEnabled && this.isDefined(atom)) this.push(ITEM_CASE, [atom]);
    return true;
  }

  internalizeTerm(term: number) {
    const context = this.context;
    if (!this.hasDefs()) return false;
    for (const arg of this.manager.getArgs(term)) context.internalize(arg, false);
    if (!context.isEInternalized(term)) context.mkEnode(term, false, false, true);
    if (!context.relevancy.isEnabled && this.isDefined(term)) this.push(ITEM_CASE, [term]);
    return true;
  }

  relevantEh(expr: number) {
    if (this.isDefined(expr) && this.hasDefs()) this.push(ITEM_CASE, [expr]);
  }

  canPropagate() {
    return this.qhead < this.propagationQueue.length;
  }

  propagate() {
    if (this.qhead === this.propagationQueue.length) return;
    const qhead = this.qhead;
    this.context.pushTrail(() => {
      this.qhead = qhead;
    });
    this.manager.withTemporaries(
      () => {
        const end = this.propagationQueue.length;
        for (; this.qhead < end && !this.context.isInconsistent(); this.qhead++) {
          const item = this.propagationQueue[this.qhead];
          const expr = item.exprs[0];
          if (item.kind === ITEM_GUARD)
            this.activateGuard(expr, this.guard2pending.get(expr) as number[]);
          else if (item.kind === ITEM_CORE) this.blockCore(item.exprs);
          else if (item.kind === ITEM_CASE) this.assertCaseAxioms(expr);
          else this.assertBodyAxiom(expr);
        }
      },
      () => [],
    );
  }

  private push(kind: number, exprs: number[]) {
    for (const expr of exprs) this.keep(expr);
    this.propagationQueue.push({ kind, exprs });
    this.context.pushTrail(() => {
      for (const expr of (this.propagationQueue.pop() as PropagationItem).exprs)
        this.manager.decRef(expr);
    });
  }

  // The clause depth_limit => ~guard: the guard is below the current cutoff.
  private disableGuard(guard: number, guards: number[]) {
    if (!this.guard2pending.has(guard)) {
      this.disabledGuards.push(this.keep(guard));
      this.guard2pending.set(
        guard,
        guards.map((innerGuard) => this.keep(innerGuard)),
      );
    }
    this.push(ITEM_CORE, [this.manager.mkNumRoundsPred(this.numRounds), guard]);
  }

  private getDepth(expr: number) {
    return this.predDepths.get(expr) ?? 0;
  }

  private setDepth(depth: number, expr: number) {
    if ((this.isDefined(expr) || this.isCasePred(expr)) && !this.predDepths.has(expr))
      this.predDepths.set(this.keep(expr), depth);
  }

  assignEh(boolVar: BoolVar, isTrue: boolean) {
    const expr = this.context.boolVar2Expr[boolVar];
    if (isTrue && this.isCasePred(expr)) this.push(ITEM_BODY, [expr]);
  }

  // Substitutes args for the variables of expr and simplifies.
  private applyArgs(depth: number, args: number[], expr: number) {
    const manager = this.manager;
    const subst = new VarSubst(manager, true);
    const substituted = subst.apply(expr, args);
    subst.release();
    const result = this.context.rewriter.rewrite(substituted);
    manager.decRef(substituted);
    manager.releaseLater(result);
    for (const term of getSubterms(manager, result)) this.setDepth(depth + 1, term);
    return result;
  }

  // Lambdas are quantifiers, but first-class array terms for the solver.
  private hasRealQuantifiers(expr: number) {
    const manager = this.manager;
    return (
      manager.hasQuantifierFlags[expr] === 1 &&
      getSubterms(manager, expr).some(
        (term) => manager.kinds[term] === KIND_QUANTIFIER && !manager.isLambda(term),
      )
    );
  }

  private mkEqLit(left: number, right: number) {
    const manager = this.manager;
    if (this.hasRealQuantifiers(left) || this.hasRealQuantifiers(right))
      throw new SmtUnsupportedError("recursive function bodies with quantifiers");
    const [first, second] =
      manager.isTrue(right) || manager.isFalse(right) ? [right, left] : [left, right];
    const literal = manager.isTrue(first)
      ? this.mkLiteralOf(second)
      : manager.isFalse(first)
        ? negate(this.mkLiteralOf(second))
        : this.mkEqLiteral(first, second, false);
    this.context.markLiteralAsRelevant(literal);
    return literal;
  }

  private blockCore(core: number[]) {
    this.context.mkThAxiom(core.map((expr) => negate(this.mkLiteralOf(expr))));
  }

  // A function with one case gets the unit clause f(args) = rhs[args].
  private assertMacroAxiom(lhs: number) {
    const manager = this.manager;
    const def = manager.recFunDefs.get(manager.decls[lhs])!;
    const rhs = this.applyArgs(this.getDepth(lhs), manager.getArgs(lhs), def.rhs);
    this.context.mkThAxiom([this.mkEqLit(lhs, rhs)]);
  }

  // The clauses pred(args) <=> and(guards) for each case, and the clause that one case holds. A case
  // without defined functions in its body gets its body axiom at once.
  private assertCaseAxioms(lhs: number) {
    const manager = this.manager;
    const def = manager.recFunDefs.get(manager.decls[lhs])!;
    if (def.cases.length === 1) {
      this.assertMacroAxiom(lhs);
      return;
    }
    const args = manager.getArgs(lhs);
    const preds: Literal[] = [];
    for (const recFunCase of def.cases) {
      const predApplied = manager.mkApp(recFunCase.pred, args, SORT_BOOL);
      preds.push(this.mkLiteralOf(predApplied));
      const depth = this.getDepth(lhs);
      this.setDepth(depth, predApplied);
      const guards = recFunCase.guards.map((guard) => this.applyArgs(depth, args, guard));
      if (recFunCase.isImmediate) this.assertBodyAxiom(predApplied);
      else if (!this.enabledGuards.includes(predApplied)) {
        this.disableGuard(predApplied, guards);
        continue;
      }
      this.activateGuard(predApplied, guards);
    }
    this.context.mkThAxiom(preds);
  }

  private activateGuard(predApplied: number, guards: number[]) {
    const conclusion = this.mkLiteralOf(predApplied);
    const literals = [conclusion];
    for (const guard of guards) {
      const literal = this.mkLiteralOf(guard);
      literals.push(negate(literal));
      this.context.mkThAxiom([negate(conclusion), literal]);
    }
    this.context.mkThAxiom(literals);
  }

  // The axiom guards[args] => f(args) = rhs[args] of the case of pred.
  private assertBodyAxiom(pred: number) {
    const manager = this.manager;
    const recFunCase = manager.recFunCases.get(manager.decls[pred])!;
    const args = manager.getArgs(pred);
    const depth = this.getDepth(pred);
    const lhs = manager.mkApp(recFunCase.def.decl, args, manager.sorts[recFunCase.rhs]);
    const rhs = this.applyArgs(depth, args, recFunCase.rhs);
    if (this.hasRealQuantifiers(rhs))
      throw new SmtUnsupportedError("recursive function bodies with quantifiers");
    const clause: Literal[] = [];
    for (const guard of recFunCase.guards) {
      const literal = negate(this.mkLiteralOf(this.applyArgs(depth, args, guard)));
      if (literal === TRUE_LITERAL) return;
      if (literal !== FALSE_LITERAL) clause.push(literal);
    }
    clause.push(this.mkEqLit(lhs, rhs));
    this.context.mkThAxiom(clause);
  }

  finalCheckEh() {
    if (!this.canPropagate()) return FC_DONE;
    this.propagate();
    return FC_CONTINUE;
  }

  addTheoryAssumptions(assumptions: number[]) {
    const manager = this.manager;
    if (!manager.hasRecDefs && this.disabledGuards.length === 0) return;
    assumptions.push(this.keep(manager.mkNumRoundsPred(this.numRounds)));
    for (const guard of this.disabledGuards) assumptions.push(this.keep(manager.mkNot(guard)));
  }

  // Whether the core has the depth limit or a disabled guard, which the next round enables: the
  // one of least depth, picked at random among those of equal depth.
  shouldResearch(unsatCore: readonly number[]) {
    const manager = this.manager;
    let isFound = false;
    let toDelete = -1;
    let count = 0;
    let currentDepth = Infinity;
    for (const expr of unsatCore) {
      if (manager.isNot(expr) && this.disabledGuards.includes(manager.getArg(expr, 0))) {
        const guard = manager.getArg(expr, 0);
        isFound = true;
        const depth = this.getDepth(guard);
        if (depth < currentDepth) count = 0;
        if (depth <= currentDepth && this.context.getRandomValue() % ++count === 0) {
          toDelete = guard;
          currentDepth = depth;
        }
      } else if (manager.getOp(expr) === OP_NUM_ROUNDS) isFound = true;
    }
    if (!isFound) return false;
    this.numRounds++;
    if (toDelete === -1 && this.disabledGuards.length > 0)
      toDelete = this.disabledGuards[this.disabledGuards.length - 1];
    if (toDelete !== -1) {
      this.disabledGuards.splice(this.disabledGuards.indexOf(toDelete), 1);
      this.enabledGuards.push(toDelete);
    }
    for (const guard of this.enabledGuards) this.push(ITEM_GUARD, [guard]);
    return true;
  }

  // An argument of a defined function or case predicate is a beta redex of its expansion.
  isBetaRedex(parent: Enode) {
    return this.isDefined(parent.owner) || this.isCasePred(parent.owner);
  }

  newEqEh() {}

  newDiseqEh() {}
}

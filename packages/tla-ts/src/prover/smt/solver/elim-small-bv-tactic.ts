// Ported from Z3 (src/tactic/bv/elim_small_bv_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import { type AstManager, OP_AND, OP_OR, SORT_BOOL } from "./ast";
import { release } from "./expr-ref";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import { Rewriter, TACTIC_REWRITER_OPTIONS } from "./rewriter";
import { RewriterTpl } from "./rewriter-tpl";
import { UnusedVarsEliminator, VarSubst } from "./var-subst";

class ElimSmallBvRewriter extends RewriterTpl {
  readonly simp: Rewriter;
  private numSteps = 0;

  constructor(
    manager: AstManager,
    private maxBits: number,
    private maxSteps: number,
  ) {
    super(manager);
    this.simp = new Rewriter(manager, TACTIC_REWRITER_OPTIONS);
  }

  rewrite(expr: number) {
    this.numSteps = 0;
    return super.rewrite(expr);
  }

  checkMaxSteps() {
    this.numSteps++;
    if (this.numSteps > this.maxSteps) throw new SmtTacticError("max. steps exceeded");
  }

  private replaceVar(
    numDecls: number,
    maxVarIdxP1: number,
    index: number,
    body: number,
    replacement: number,
  ) {
    const manager = this.manager;
    const substitution = Array.from({ length: numDecls + maxVarIdxP1 }, () => -1);
    substitution[maxVarIdxP1 + index] = replacement;
    const subst = new VarSubst(manager, true);
    const substituted = subst.apply(body, substitution);
    const result = this.simp.rewrite(substituted);
    manager.decRef(substituted);
    subst.release();
    return result;
  }

  reduceQuantifier(expr: number, oldBody: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    const numDecls = data.sorts.length;
    const maxVarIdxP1 = manager.freeVarBounds[expr];
    let numReplaced = 0;
    let body = oldBody;
    manager.incRef(body);
    const newBodies = new RefVector(manager);
    for (let index = numDecls - 1; index >= 0; index--) {
      const sort = data.sorts[index];
      const size = manager.isBvSort(sort) ? manager.getBvSize(sort) : Infinity;
      if (size <= this.maxBits) {
        if (size >= 31 || 2 ** size + numReplaced > this.maxSteps) {
          manager.decRef(body);
          return -1;
        }
        numReplaced += 2 ** size;
        for (let value = 0; value < 2 ** size; value++) {
          const numeral = manager.mkBvNumeral(BigInt(value), size);
          manager.incRef(numeral);
          newBodies.pushOwned(this.replaceVar(numDecls, maxVarIdxP1, index, body, numeral));
          manager.decRef(numeral);
        }
      } else if (sort === SORT_BOOL) {
        newBodies.pushOwned(this.replaceVar(numDecls, maxVarIdxP1, index, body, manager.trueExpr));
        newBodies.pushOwned(this.replaceVar(numDecls, maxVarIdxP1, index, body, manager.falseExpr));
      } else continue;
      const junction = manager.mkApp(data.isForall ? OP_AND : OP_OR, newBodies.items, SORT_BOOL);
      manager.incRef(junction);
      manager.decRef(body);
      body = this.simp.rewrite(junction);
      manager.decRef(junction);
      newBodies.reset();
    }
    const newQuantifier = data.body === body ? expr : manager.mkQuantifier({ ...data, body });
    manager.incRef(newQuantifier);
    const eliminator = new UnusedVarsEliminator(manager);
    const result = eliminator.apply(newQuantifier);
    eliminator.release();
    manager.decRef(newQuantifier);
    manager.decRef(body);
    return result;
  }
}

export const runElimSmallBv =
  (manager: AstManager, maxBits: number, maxSteps: number) => (goal: Goal) => {
    if (goal.isProofsEnabled)
      throw new SmtTacticError("elim-small-bv does not support proof production");
    if (goal.isCoresEnabled)
      throw new SmtTacticError("elim-small-bv does not support unsat core production");
    const rewriter = new ElimSmallBvRewriter(manager, maxBits, maxSteps);
    let rewritten = -1;
    const size = goal.forms.size;
    for (let index = 0; index < size && !goal.isInconsistent; index++) {
      const next = rewriter.rewrite(goal.forms.items[index]);
      release(manager, rewritten);
      rewritten = next;
      goal.update(index, rewritten);
    }
    goal.depth++;
    release(manager, rewritten);
    rewriter.simp.release();
    rewriter.release();
    return [goal];
  };

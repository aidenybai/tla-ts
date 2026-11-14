// Ported from Z3 (src/ast/simplifiers/distribute_forall.cpp), MIT license, see z3-license.txt.
import { type AstManager, OP_AND, OP_IMPLIES, OP_OR, QUANTIFIER_FORALL } from "./ast";
import { flattenAndVector, flattenOrVector } from "./ast-util";
import { runSimplifier } from "./dependent-expr-state";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import { RewriterTpl } from "./rewriter-tpl";
import { UnusedVarsEliminator } from "./var-subst";

class DistributeForallRewriter extends RewriterTpl {
  reduceQuantifier(expr: number, body: number) {
    const manager = this.manager;
    const data = manager.getQuantifier(expr);
    if (data.patterns.length > 0 || data.noPatterns.length > 0) return -1;
    const op = manager.getOp(body);
    const negatedOp = manager.isNot(body) ? manager.getOp(manager.getArg(body, 0)) : -1;
    const isSplitting =
      data.kind === QUANTIFIER_FORALL
        ? op === OP_AND || negatedOp === OP_IMPLIES || negatedOp === OP_OR
        : op === OP_OR || op === OP_IMPLIES || negatedOp === OP_AND;
    if (!isSplitting) return -1;
    const conjuncts = new RefVector(manager);
    conjuncts.push(body);
    if (data.kind === QUANTIFIER_FORALL) flattenAndVector(manager, conjuncts);
    else flattenOrVector(manager, conjuncts);
    let quantifier = -1;
    for (let index = 0; index < conjuncts.size; index++) {
      const updated = manager.mkQuantifier({ ...data, body: conjuncts.items[index] });
      manager.incRef(updated);
      if (quantifier !== -1) manager.decRef(quantifier);
      quantifier = updated;
      const eliminator = new UnusedVarsEliminator(manager);
      const eliminated = eliminator.apply(quantifier);
      eliminator.release();
      conjuncts.set(index, eliminated);
      manager.decRef(eliminated);
    }
    const result =
      data.kind === QUANTIFIER_FORALL
        ? manager.mkAnd(conjuncts.items)
        : manager.mkOr(conjuncts.items);
    manager.incRef(result);
    conjuncts.reset();
    if (quantifier !== -1) manager.decRef(quantifier);
    return result;
  }
}

export const distributeForall = (manager: AstManager, goal: Goal) =>
  runSimplifier(goal, true, (state) => ({
    reduce: () => {
      if (!state.hasQuantifiers()) return;
      const rewriter = new DistributeForallRewriter(manager);
      let rewritten = -1;
      state.forEachIndex((index) => {
        const form = state.get(index);
        if (!manager.hasQuantifierFlags[form]) return;
        const next = rewriter.rewrite(form);
        if (rewritten !== -1) manager.decRef(rewritten);
        rewritten = next;
        if (rewritten !== form) goal.update(index, rewritten);
      });
      if (rewritten !== -1) manager.decRef(rewritten);
      rewriter.release();
    },
    release: () => {},
  }));

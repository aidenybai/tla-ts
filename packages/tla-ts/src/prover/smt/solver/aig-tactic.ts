// Ported from Z3 (src/tactic/aig/aig_tactic.cpp, src/ast/for_each_expr.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  KIND_APP,
  KIND_QUANTIFIER,
  OP_ADD,
  OP_AND,
  OP_MUL,
  OP_OR,
  OP_SEQ_CONCAT,
  OP_XOR,
} from "./ast";
import { AigManager } from "./aig";
import { isAssociativeBvOp } from "./bv-decl-plugin";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import type { Tactic } from "./tactic";

const ASSOCIATIVE_OPS = new Set([OP_AND, OP_OR, OP_XOR, OP_ADD, OP_MUL, OP_SEQ_CONCAT]);

// Like Z3, marks only the expressions with several references, and counts an associative
// application of n arguments as n - 1 binary ones.
const getNumExprs = (manager: AstManager, root: number) => {
  const marked = new Set<number>();
  const isUnvisited = (expr: number) => {
    if (manager.getRefCount(expr) <= 1) return true;
    if (marked.has(expr)) return false;
    marked.add(expr);
    return true;
  };
  const todo = [root];
  let count = 0;
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    const kind = manager.kinds[expr];
    if (kind === KIND_QUANTIFIER) {
      const data = manager.getQuantifier(expr);
      for (const child of [data.body, ...data.patterns, ...data.noPatterns])
        if (isUnvisited(child)) todo.push(child);
      count++;
      continue;
    }
    if (kind !== KIND_APP) {
      count++;
      continue;
    }
    const op = manager.getOp(expr);
    const numArgs = manager.getNumArgs(expr);
    count += ASSOCIATIVE_OPS.has(op) || isAssociativeBvOp(op) ? numArgs - 1 : 1;
    for (let index = 0; index < numArgs; index++) {
      const arg = manager.getArg(expr, index);
      if (isUnvisited(arg)) todo.push(arg);
    }
  }
  return count;
};

// Z3 rewrites each formula with a dependency on its own, but the goal does not track dependencies,
// which only named assertions under unsat cores have.
export const createAigTactic =
  (manager: AstManager): Tactic =>
  (goal: Goal) => {
    if (goal.isProofsEnabled) throw new SmtTacticError("aig does not support proof production");
    if (goal.isCoresEnabled) throw new SmtUnsupportedError("aig with unsat cores");
    const aigs = new AigManager(manager);
    const forms = new RefVector(manager);
    for (let index = 0; index < goal.forms.size; index++) {
      forms.push(goal.forms.items[index]);
      goal.update(index, manager.trueExpr);
    }
    if (forms.size > 0) {
      const conjunction = manager.mkAnd(forms.items);
      manager.incRef(conjunction);
      const root = aigs.mkAig(conjunction);
      aigs.incRef(root);
      const shared = aigs.maxSharing(root);
      aigs.incRef(shared);
      aigs.decRef(root);
      const formula = aigs.toFormula(shared);
      const isSmall = getNumExprs(manager, formula) <= 1.2 * getNumExprs(manager, conjunction);
      goal.assert(isSmall ? formula : conjunction);
      manager.decRef(formula);
      aigs.decRef(shared);
      manager.decRef(conjunction);
    }
    goal.elimTrue();
    forms.reset();
    aigs.release();
    goal.depth++;
    return [goal];
  };

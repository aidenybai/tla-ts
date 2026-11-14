// Ported from Z3 (src/tactic/aig/aig_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../errors";
import type { AstManager } from "./ast";
import { AigManager } from "./aig";
import { getNumExprs } from "./ast-util";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import type { Tactic } from "./tactic";

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

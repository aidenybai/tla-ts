import { SmtTacticError } from "../../../errors";
import type { AstManager } from "./ast";
import { AigManager } from "./aig";
import { getNumExprs } from "./ast-util";
import type { Goal } from "./goal";
import { RefVector } from "./ref-vector";
import type { Tactic } from "./tactic";

export const createAigTactic =
  (manager: AstManager): Tactic =>
  (goal: Goal) => {
    if (goal.isProofsEnabled) throw new SmtTacticError("aig does not support proof production");
    const aigs = new AigManager(manager);
    const useSharedFormula = (expr: number, use: (formula: number) => void) => {
      const root = aigs.mkAig(expr);
      aigs.incRef(root);
      const shared = aigs.maxSharing(root);
      aigs.incRef(shared);
      aigs.decRef(root);
      const formula = aigs.toFormula(shared);
      use(formula);
      manager.decRef(formula);
      aigs.decRef(shared);
    };
    const forms = new RefVector(manager);
    for (let index = 0; index < goal.forms.size; index++) {
      const form = goal.forms.items[index];
      const dependency = goal.getDependency(index);
      if (dependency === undefined) {
        forms.push(form);
        goal.update(index, manager.trueExpr);
      } else
        useSharedFormula(form, (formula) => {
          if (getNumExprs(manager, formula) <= 1.2 * getNumExprs(manager, form))
            goal.update(index, formula, dependency);
        });
    }
    if (forms.size > 0) {
      const conjunction = manager.mkAnd(forms.items);
      manager.incRef(conjunction);
      useSharedFormula(conjunction, (formula) => {
        const isSmall = getNumExprs(manager, formula) <= 1.2 * getNumExprs(manager, conjunction);
        goal.assert(isSmall ? formula : conjunction);
      });
      manager.decRef(conjunction);
    }
    goal.elimTrue();
    forms.reset();
    aigs.release();
    goal.depth++;
    return [goal];
  };

// Ported from Z3 (src/ackermannization/ackermannize_bv_tactic.cpp,
// src/tactic/smtlogics/qfufbv_tactic.cpp), MIT license, see z3-license.txt.
import { SmtTacticError } from "../../../errors";
import type { AstManager } from "./ast";
import { convertAckrModel } from "./ackr-model-converter";
import type { Goal } from "./goal";
import { type AckrSolver, Lackr } from "./lackr";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import type { RewriterOptions } from "./rewriter";

const checkGoal = (goal: Goal, name: string) => {
  if (goal.isCoresEnabled)
    throw new SmtTacticError(`${name} does not support unsat core production`);
  if (goal.isProofsEnabled) throw new SmtTacticError(`${name} does not support proof production`);
};

const getEmptyCopy = (goal: Goal) => {
  const copied = goal.copy();
  copied.reset();
  return copied;
};

export const runAckermannizeBv =
  (manager: AstManager, rewriterOptions: RewriterOptions, lemmaLimit: number) => (goal: Goal) => {
    checkGoal(goal, "ackermannize");
    const lackr = new Lackr(manager, [...goal.forms.items], rewriterOptions, true);
    const result = getEmptyCopy(goal);
    if (!lackr.mkAckermann(result, lemmaLimit)) {
      lackr.release(false);
      return [goal];
    }
    const info = lackr.info;
    result.addModelConversion((model) => convertAckrModel(info, undefined, model));
    result.depth++;
    lackr.release(true);
    return [result];
  };

export const createQfufbvAckrTactic =
  (
    manager: AstManager,
    rewriterOptions: RewriterOptions,
    isEager: boolean,
    createSolver: () => AckrSolver,
  ) =>
  (goal: Goal) => {
    checkGoal(goal, "qfufbv_ackr");
    const solver = createSolver();
    const lackr = new Lackr(manager, [...goal.forms.items], rewriterOptions, isEager, solver);
    const status = lackr.solve();
    const result = getEmptyCopy(goal);
    if (status === L_FALSE) result.assert(manager.falseExpr);
    if (status === L_UNDEF) goal.depth++;
    const model = lackr.model;
    if (status === L_TRUE && model !== undefined) {
      model.incRef();
      const info = lackr.info;
      result.addModelConversion((converted) => convertAckrModel(info, model, converted));
    }
    lackr.release(status === L_TRUE);
    solver.release();
    return [status === L_UNDEF ? goal : result];
  };
